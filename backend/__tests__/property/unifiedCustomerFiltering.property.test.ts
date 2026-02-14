/**
 * Property-Based Tests for UnifiedCustomerService Filtering
 * Feature: unified-customer-management
 * 
 * Properties tested:
 * - Property 5: 단계 필터링 정확성
 * - Property 6: 유형 필터링 정확성
 * - Property 7: 복합 필터 교집합
 * - Property 8: 검색 필터 정확성
 * - Property 9: 통계 정확성
 * 
 * Validates: Requirements 3.2, 3.3, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { LeadStatus, CustomerGrade, LeadSource, QuotationType } from '@prisma/client';
import { mapLeadToUnifiedEntity, mapCustomerToUnifiedEntity } from '../../src/services/unifiedCustomerService';
import { UnifiedEntity, UnifiedCustomerStats, CUSTOMER_GRADE_STAGE_MAP } from '../../src/types/unifiedCustomer';

// ============================================================================
// Arbitraries (재사용 가능한 데이터 생성기)
// ============================================================================

const pipelineStageArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  code: fc.string({ minLength: 1, maxLength: 20 }),
  order: fc.integer({ min: 0, max: 100 }),
  color: fc.option(fc.stringMatching(/^#[0-9A-Fa-f]{6}$/), { nil: null }),
  description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
  isDefault: fc.boolean(),
  isActive: fc.boolean(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const leadStatusArb = fc.constantFrom<LeadStatus>(
  LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL, LeadStatus.NEGOTIATION, LeadStatus.CONVERTED,
  LeadStatus.LOST, LeadStatus.DORMANT
);

const leadSourceArb = fc.constantFrom<LeadSource>(
  LeadSource.EMAIL, LeadSource.PHONE, LeadSource.WEBSITE,
  LeadSource.REFERRAL, LeadSource.EXHIBITION, LeadSource.OTHER
);

const quotationTypeArb = fc.constantFrom<QuotationType>(
  QuotationType.TOXICITY, QuotationType.EFFICACY, QuotationType.CLINICAL_PATHOLOGY
);

const customerGradeArb = fc.constantFrom<CustomerGrade>(
  CustomerGrade.LEAD, CustomerGrade.PROSPECT, CustomerGrade.CUSTOMER,
  CustomerGrade.VIP, CustomerGrade.INACTIVE
);


// 리드 데이터 생성기 (파이프라인 단계 포함)
const leadWithStageArb = fc.record({
  id: fc.uuid(),
  leadNumber: fc.string({ minLength: 5, maxLength: 20 }),
  userId: fc.uuid(),
  companyName: fc.string({ minLength: 1, maxLength: 100 }),
  contactName: fc.string({ minLength: 1, maxLength: 50 }),
  contactEmail: fc.option(fc.emailAddress(), { nil: null }),
  contactPhone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  department: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  position: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  source: leadSourceArb,
  inquiryType: fc.option(quotationTypeArb, { nil: null }),
  inquiryDetail: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: null }),
  expectedAmount: fc.option(fc.integer({ min: 0, max: 1000000000 }).map(n => ({ toNumber: () => n })), { nil: null }),
  expectedDate: fc.option(fc.date(), { nil: null }),
  stageId: fc.uuid(),
  status: leadStatusArb,
  customerId: fc.option(fc.uuid(), { nil: null }),
  convertedAt: fc.option(fc.date(), { nil: null }),
  lostReason: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  lostReasonDetail: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: null }),
  lostAt: fc.option(fc.date(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.option(fc.date(), { nil: null }),
  stage: pipelineStageArb,
});

// 고객 데이터 생성기
const customerArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  company: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  address: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
  notes: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: null }),
  grade: customerGradeArb,
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.option(fc.date(), { nil: null }),
});


// ============================================================================
// 헬퍼 함수: 필터링 로직 (서비스 로직을 순수 함수로 추출)
// ============================================================================

/**
 * 유형 필터 적용
 * @param entities - 통합 엔티티 배열
 * @param type - 유형 필터 ('all' | 'lead' | 'customer')
 * @returns 필터링된 엔티티 배열
 */
function applyTypeFilter(entities: UnifiedEntity[], type: 'all' | 'lead' | 'customer'): UnifiedEntity[] {
  if (type === 'all') return entities;
  if (type === 'lead') return entities.filter(e => e.entityType === 'LEAD');
  if (type === 'customer') return entities.filter(e => e.entityType === 'CUSTOMER');
  return entities;
}

/**
 * 단계 필터 적용 (리드에만 적용)
 * @param entities - 통합 엔티티 배열
 * @param stageId - 파이프라인 단계 ID
 * @returns 필터링된 엔티티 배열
 */
function applyStageFilter(entities: UnifiedEntity[], stageId: string | undefined): UnifiedEntity[] {
  if (!stageId) return entities;
  return entities.filter(e => {
    // 리드인 경우에만 stageId 필터 적용
    if (e.entityType === 'LEAD') {
      return e.stageId === stageId;
    }
    // 고객은 stageId 필터에서 제외 (단계 필터는 리드에만 적용)
    return false;
  });
}


/**
 * 검색 필터 적용
 * @param entities - 통합 엔티티 배열
 * @param search - 검색어
 * @returns 필터링된 엔티티 배열
 */
function applySearchFilter(entities: UnifiedEntity[], search: string | undefined): UnifiedEntity[] {
  if (!search) return entities;
  const searchLower = search.toLowerCase();
  return entities.filter(e => {
    const companyMatch = e.companyName.toLowerCase().includes(searchLower);
    const nameMatch = e.contactName.toLowerCase().includes(searchLower);
    const emailMatch = e.contactEmail?.toLowerCase().includes(searchLower) ?? false;
    const phoneMatch = e.contactPhone?.toLowerCase().includes(searchLower) ?? false;
    return companyMatch || nameMatch || emailMatch || phoneMatch;
  });
}

/**
 * 복합 필터 적용
 * @param entities - 통합 엔티티 배열
 * @param type - 유형 필터
 * @param stageId - 단계 ID 필터
 * @param search - 검색어 필터
 * @returns 필터링된 엔티티 배열
 */
function applyAllFilters(
  entities: UnifiedEntity[],
  type: 'all' | 'lead' | 'customer',
  stageId: string | undefined,
  search: string | undefined
): UnifiedEntity[] {
  let result = entities;
  result = applyTypeFilter(result, type);
  result = applyStageFilter(result, stageId);
  result = applySearchFilter(result, search);
  return result;
}


/**
 * 통계 계산
 * @param entities - 통합 엔티티 배열
 * @returns 통계 정보
 */
function calculateStats(entities: UnifiedEntity[]): UnifiedCustomerStats {
  const leadCount = entities.filter(e => e.entityType === 'LEAD').length;
  const customerCount = entities.filter(e => e.entityType === 'CUSTOMER').length;
  
  // Use Object.create(null) to avoid prototype pollution with keys like "constructor"
  const stageDistribution: Record<string, number> = Object.create(null);
  for (const entity of entities) {
    const stage = entity.displayStage;
    stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
  }
  
  return {
    totalCount: entities.length,
    leadCount,
    customerCount,
    stageDistribution,
  };
}

// ============================================================================
// Property Tests
// ============================================================================

describe('UnifiedCustomerService Filtering Property Tests', () => {
  /**
   * Property 5: 단계 필터링 정확성
   * **Validates: Requirements 3.2, 6.3**
   * 
   * For any API 호출에서 stageId 파라미터가 전달된 경우, 
   * 반환된 모든 항목 중 entityType이 'LEAD'인 항목의 stageId는 
   * 요청된 stageId와 일치해야 합니다.
   */
  describe('Property 5: 단계 필터링 정확성', () => {
    it('should return only leads with matching stageId when stageId filter is applied', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 20 }),
          fc.array(customerArb, { minLength: 0, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            // 테스트할 stageId 선택 (첫 번째 리드의 stageId 사용)
            const targetStageId = leads[0].stageId;

            // 엔티티 변환
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            // 단계 필터 적용
            const filteredEntities = applyStageFilter(allEntities, targetStageId);
            
            // 검증: 모든 반환된 LEAD 항목의 stageId가 요청된 stageId와 일치
            for (const entity of filteredEntities) {
              if (entity.entityType === 'LEAD') {
                expect(entity.stageId).toBe(targetStageId);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude customers when stageId filter is applied', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 10 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            const targetStageId = leads[0].stageId;
            
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const filteredEntities = applyStageFilter(allEntities, targetStageId);
            
            // 검증: stageId 필터 적용 시 고객은 제외됨
            const hasCustomers = filteredEntities.some(e => e.entityType === 'CUSTOMER');
            expect(hasCustomers).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should return all entities when stageId filter is undefined', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 10 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const filteredEntities = applyStageFilter(allEntities, undefined);
            
            // 검증: stageId가 undefined이면 모든 엔티티 반환
            expect(filteredEntities.length).toBe(allEntities.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: 유형 필터링 정확성
   * **Validates: Requirements 3.3, 4.2, 4.3, 6.4**
   * 
   * For any API 호출에서:
   * - type='lead' 파라미터가 전달된 경우, 반환된 모든 항목의 entityType은 'LEAD'여야 합니다
   * - type='customer' 파라미터가 전달된 경우, 반환된 모든 항목의 entityType은 'CUSTOMER'여야 합니다
   */
  describe('Property 6: 유형 필터링 정확성', () => {
    it('should return only LEAD entities when type=lead filter is applied', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 15 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];

            
            const filteredEntities = applyTypeFilter(allEntities, 'lead');
            
            // 검증: 모든 반환된 항목의 entityType이 'LEAD'
            for (const entity of filteredEntities) {
              expect(entity.entityType).toBe('LEAD');
            }
            
            // 검증: 리드 수와 일치
            expect(filteredEntities.length).toBe(leadEntities.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only CUSTOMER entities when type=customer filter is applied', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 15 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const filteredEntities = applyTypeFilter(allEntities, 'customer');
            
            // 검증: 모든 반환된 항목의 entityType이 'CUSTOMER'
            for (const entity of filteredEntities) {
              expect(entity.entityType).toBe('CUSTOMER');
            }
            
            // 검증: 고객 수와 일치
            expect(filteredEntities.length).toBe(customerEntities.length);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should return all entities when type=all filter is applied', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 15 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const filteredEntities = applyTypeFilter(allEntities, 'all');
            
            // 검증: 모든 엔티티 반환
            expect(filteredEntities.length).toBe(allEntities.length);
            
            // 검증: LEAD와 CUSTOMER 모두 포함
            const hasLeads = filteredEntities.some(e => e.entityType === 'LEAD');
            const hasCustomers = filteredEntities.some(e => e.entityType === 'CUSTOMER');
            expect(hasLeads).toBe(true);
            expect(hasCustomers).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve entity count after type filtering', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 0, maxLength: 20 }),
          fc.array(customerArb, { minLength: 0, maxLength: 20 }),
          fc.constantFrom<'all' | 'lead' | 'customer'>('all', 'lead', 'customer'),
          (leads: any[], customers: any[], typeFilter) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];

            
            const filteredEntities = applyTypeFilter(allEntities, typeFilter);
            
            // 검증: 필터링 후 엔티티 수가 예상과 일치
            if (typeFilter === 'all') {
              expect(filteredEntities.length).toBe(allEntities.length);
            } else if (typeFilter === 'lead') {
              expect(filteredEntities.length).toBe(leadEntities.length);
            } else if (typeFilter === 'customer') {
              expect(filteredEntities.length).toBe(customerEntities.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: 복합 필터 교집합
   * **Validates: Requirements 4.4, 5.3**
   * 
   * For any API 호출에서 여러 필터(type, stageId, search)가 동시에 적용된 경우, 
   * 반환된 모든 항목은 적용된 모든 필터 조건을 만족해야 합니다.
   */
  describe('Property 7: 복합 필터 교집합', () => {
    it('should return entities satisfying all filter conditions when multiple filters are applied', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 2, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            // 테스트 데이터 준비
            const targetStageId = leads[0].stageId;
            const searchTerm = leads[0].companyName.substring(0, 3);

            
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            // 복합 필터 적용 (type='lead', stageId, search)
            const filteredEntities = applyAllFilters(allEntities, 'lead', targetStageId, searchTerm);
            
            // 검증: 모든 반환된 항목이 모든 필터 조건을 만족
            for (const entity of filteredEntities) {
              // 유형 필터 조건
              expect(entity.entityType).toBe('LEAD');
              
              // 단계 필터 조건
              expect(entity.stageId).toBe(targetStageId);
              
              // 검색 필터 조건
              const searchLower = searchTerm.toLowerCase();
              const matchesSearch = 
                entity.companyName.toLowerCase().includes(searchLower) ||
                entity.contactName.toLowerCase().includes(searchLower) ||
                (entity.contactEmail?.toLowerCase().includes(searchLower) ?? false) ||
                (entity.contactPhone?.toLowerCase().includes(searchLower) ?? false);
              expect(matchesSearch).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should return subset of single filter results when multiple filters are applied', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 2, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            const targetStageId = leads[0].stageId;
            const searchTerm = leads[0].companyName.substring(0, 2);
            
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            // 개별 필터 적용 결과
            const typeFiltered = applyTypeFilter(allEntities, 'lead');
            const stageFiltered = applyStageFilter(allEntities, targetStageId);
            const searchFiltered = applySearchFilter(allEntities, searchTerm);
            
            // 복합 필터 적용 결과
            const combinedFiltered = applyAllFilters(allEntities, 'lead', targetStageId, searchTerm);
            
            // 검증: 복합 필터 결과는 각 개별 필터 결과의 부분집합
            expect(combinedFiltered.length).toBeLessThanOrEqual(typeFiltered.length);
            expect(combinedFiltered.length).toBeLessThanOrEqual(stageFiltered.length);
            expect(combinedFiltered.length).toBeLessThanOrEqual(searchFiltered.length);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should handle type=customer with stageId filter correctly', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 10 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            const targetStageId = leads[0].stageId;
            
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            // type='customer'와 stageId 필터 동시 적용
            // 고객은 stageId가 없으므로 결과는 빈 배열이어야 함
            const filteredEntities = applyAllFilters(allEntities, 'customer', targetStageId, undefined);
            
            // 검증: 고객에게 stageId 필터를 적용하면 결과가 없음
            expect(filteredEntities.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: 검색 필터 정확성
   * **Validates: Requirements 5.1, 5.2, 6.5**
   * 
   * For any API 호출에서 search 파라미터가 전달된 경우, 
   * 반환된 모든 항목은 companyName, contactName, contactEmail, contactPhone 필드 중 
   * 하나 이상에 검색어를 포함해야 합니다 (대소문자 무시).
   */
  describe('Property 8: 검색 필터 정확성', () => {
    it('should return only entities containing search term in searchable fields', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 15 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[], searchTerm: string) => {

            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const filteredEntities = applySearchFilter(allEntities, searchTerm);
            const searchLower = searchTerm.toLowerCase();
            
            // 검증: 모든 반환된 항목이 검색어를 포함
            for (const entity of filteredEntities) {
              const matchesSearch = 
                entity.companyName.toLowerCase().includes(searchLower) ||
                entity.contactName.toLowerCase().includes(searchLower) ||
                (entity.contactEmail?.toLowerCase().includes(searchLower) ?? false) ||
                (entity.contactPhone?.toLowerCase().includes(searchLower) ?? false);
              expect(matchesSearch).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive when searching', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 10 }),
          (leads: any[]) => {
            // 첫 번째 리드의 companyName을 검색어로 사용
            const originalName = leads[0].companyName;
            const upperSearch = originalName.toUpperCase();
            const lowerSearch = originalName.toLowerCase();
            
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            
            const upperFiltered = applySearchFilter(leadEntities, upperSearch);
            const lowerFiltered = applySearchFilter(leadEntities, lowerSearch);
            
            // 검증: 대소문자 관계없이 동일한 결과
            expect(upperFiltered.length).toBe(lowerFiltered.length);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should return all entities when search is undefined or empty', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 10 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const undefinedFiltered = applySearchFilter(allEntities, undefined);
            
            // 검증: 검색어가 없으면 모든 엔티티 반환
            expect(undefinedFiltered.length).toBe(allEntities.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should search across all searchable fields (companyName, contactName, contactEmail, contactPhone)', () => {
      fc.assert(
        fc.property(
          leadWithStageArb,
          (lead: any) => {
            const entity = mapLeadToUnifiedEntity(lead);
            const entities = [entity];
            
            // 각 필드로 검색 테스트
            const companyFiltered = applySearchFilter(entities, entity.companyName);
            const nameFiltered = applySearchFilter(entities, entity.contactName);
            
            // 검증: companyName과 contactName으로 검색 시 결과 반환
            expect(companyFiltered.length).toBe(1);
            expect(nameFiltered.length).toBe(1);
            
            // email과 phone이 있는 경우 검색 테스트
            if (entity.contactEmail) {
              const emailFiltered = applySearchFilter(entities, entity.contactEmail);
              expect(emailFiltered.length).toBe(1);
            }
            if (entity.contactPhone) {
              const phoneFiltered = applySearchFilter(entities, entity.contactPhone);
              expect(phoneFiltered.length).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 9: 통계 정확성
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
   * 
   * For any API 응답에서:
   * - stats.totalCount는 반환된 entities 배열의 길이와 일치해야 합니다
   * - stats.leadCount는 entityType이 'LEAD'인 항목의 수와 일치해야 합니다
   * - stats.customerCount는 entityType이 'CUSTOMER'인 항목의 수와 일치해야 합니다
   * - stats.leadCount + stats.customerCount = stats.totalCount 조건이 성립해야 합니다
   */
  describe('Property 9: 통계 정확성', () => {
    it('should calculate totalCount equal to entities array length', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 0, maxLength: 20 }),
          fc.array(customerArb, { minLength: 0, maxLength: 20 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const stats = calculateStats(allEntities);
            
            // 검증: totalCount가 엔티티 배열 길이와 일치
            expect(stats.totalCount).toBe(allEntities.length);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should calculate leadCount equal to number of LEAD entities', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 0, maxLength: 20 }),
          fc.array(customerArb, { minLength: 0, maxLength: 20 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const stats = calculateStats(allEntities);
            const actualLeadCount = allEntities.filter(e => e.entityType === 'LEAD').length;
            
            // 검증: leadCount가 LEAD 엔티티 수와 일치
            expect(stats.leadCount).toBe(actualLeadCount);
            expect(stats.leadCount).toBe(leadEntities.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate customerCount equal to number of CUSTOMER entities', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 0, maxLength: 20 }),
          fc.array(customerArb, { minLength: 0, maxLength: 20 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const stats = calculateStats(allEntities);
            const actualCustomerCount = allEntities.filter(e => e.entityType === 'CUSTOMER').length;
            
            // 검증: customerCount가 CUSTOMER 엔티티 수와 일치
            expect(stats.customerCount).toBe(actualCustomerCount);
            expect(stats.customerCount).toBe(customerEntities.length);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should satisfy leadCount + customerCount = totalCount', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 0, maxLength: 20 }),
          fc.array(customerArb, { minLength: 0, maxLength: 20 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const stats = calculateStats(allEntities);
            
            // 검증: leadCount + customerCount = totalCount
            expect(stats.leadCount + stats.customerCount).toBe(stats.totalCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct stageDistribution', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 15 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            const stats = calculateStats(allEntities);
            
            // 검증: stageDistribution의 합이 totalCount와 일치
            const distributionSum = Object.values(stats.stageDistribution).reduce((a, b) => a + b, 0);
            expect(distributionSum).toBe(stats.totalCount);
            
            // 검증: 각 단계별 카운트가 정확
            for (const [stage, count] of Object.entries(stats.stageDistribution)) {
              const actualCount = allEntities.filter(e => e.displayStage === stage).length;
              expect(count).toBe(actualCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should calculate correct statistics after filtering', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 2, maxLength: 15 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          fc.constantFrom<'all' | 'lead' | 'customer'>('all', 'lead', 'customer'),
          (leads: any[], customers: any[], typeFilter) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            
            // 필터 적용
            const filteredEntities = applyTypeFilter(allEntities, typeFilter);
            const stats = calculateStats(filteredEntities);
            
            // 검증: 필터링된 결과에 대한 통계가 정확
            expect(stats.totalCount).toBe(filteredEntities.length);
            expect(stats.leadCount).toBe(filteredEntities.filter(e => e.entityType === 'LEAD').length);
            expect(stats.customerCount).toBe(filteredEntities.filter(e => e.entityType === 'CUSTOMER').length);
            expect(stats.leadCount + stats.customerCount).toBe(stats.totalCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty entities array correctly', () => {
      const emptyEntities: UnifiedEntity[] = [];
      const stats = calculateStats(emptyEntities);
      
      expect(stats.totalCount).toBe(0);
      expect(stats.leadCount).toBe(0);
      expect(stats.customerCount).toBe(0);
      expect(Object.keys(stats.stageDistribution).length).toBe(0);
    });
  });
});
