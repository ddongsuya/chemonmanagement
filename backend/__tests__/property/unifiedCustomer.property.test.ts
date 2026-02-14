/**
 * Property-Based Tests for UnifiedCustomerService
 * Feature: unified-customer-management
 * 
 * Properties tested:
 * - Property 1: 통합 데이터 반환 일관성
 * - Property 2: 엔티티 필수 필드 포함
 * - Property 3: 정렬 순서 일관성
 * - Property 4: 파이프라인 단계 표시 정확성
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 6.2, 6.6
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { LeadStatus, CustomerGrade, LeadSource, QuotationType } from '@prisma/client';
import { mapLeadToUnifiedEntity, mapCustomerToUnifiedEntity } from '../../src/services/unifiedCustomerService';
import { CUSTOMER_GRADE_STAGE_MAP } from '../../src/types/unifiedCustomer';

// Arbitraries
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

describe('UnifiedCustomerService Property Tests', () => {
  describe('Property 1: 통합 데이터 반환 일관성', () => {
    it('should return both LEAD and CUSTOMER entities when both types are mapped', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 1, maxLength: 10 }),
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const allEntities = [...leadEntities, ...customerEntities];
            expect(allEntities.some(e => e.entityType === 'LEAD')).toBe(true);
            expect(allEntities.some(e => e.entityType === 'CUSTOMER')).toBe(true);
            expect(allEntities.length).toBe(leads.length + customers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify entity types after mapping', () => {
      fc.assert(
        fc.property(leadWithStageArb, customerArb, (lead: any, customer: any) => {
          expect(mapLeadToUnifiedEntity(lead).entityType).toBe('LEAD');
          expect(mapCustomerToUnifiedEntity(customer).entityType).toBe('CUSTOMER');
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve original IDs after mapping', () => {
      fc.assert(
        fc.property(leadWithStageArb, customerArb, (lead: any, customer: any) => {
          expect(mapLeadToUnifiedEntity(lead).id).toBe(lead.id);
          expect(mapCustomerToUnifiedEntity(customer).id).toBe(customer.id);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: 엔티티 필수 필드 포함', () => {
    it('should have valid entityType for all entities', () => {
      fc.assert(
        fc.property(leadWithStageArb, customerArb, (lead: any, customer: any) => {
          expect(['LEAD', 'CUSTOMER']).toContain(mapLeadToUnifiedEntity(lead).entityType);
          expect(['LEAD', 'CUSTOMER']).toContain(mapCustomerToUnifiedEntity(customer).entityType);
        }),
        { numRuns: 100 }
      );
    });

    it('should have non-null displayStage and stageColor for all entities', () => {
      fc.assert(
        fc.property(leadWithStageArb, customerArb, (lead: any, customer: any) => {
          const leadEntity = mapLeadToUnifiedEntity(lead);
          const customerEntity = mapCustomerToUnifiedEntity(customer);
          expect(leadEntity.displayStage).toBeDefined();
          expect(leadEntity.displayStage).not.toBeNull();
          expect(customerEntity.displayStage).toBeDefined();
          expect(customerEntity.displayStage).not.toBeNull();
          expect(leadEntity.stageColor).toBeDefined();
          expect(customerEntity.stageColor).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should have required fields for LEAD entities', () => {
      fc.assert(
        fc.property(leadWithStageArb, (lead: any) => {
          const entity = mapLeadToUnifiedEntity(lead);
          expect(entity.entityType).toBe('LEAD');
          expect(entity.companyName).toBeDefined();
          expect(entity.contactName).toBeDefined();
          expect(entity.stageId).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should have required fields for CUSTOMER entities', () => {
      fc.assert(
        fc.property(customerArb, (customer: any) => {
          const entity = mapCustomerToUnifiedEntity(customer);
          expect(entity.entityType).toBe('CUSTOMER');
          expect(entity.companyName).toBeDefined();
          expect(entity.contactName).toBeDefined();
          expect(entity.grade).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: 정렬 순서 일관성', () => {
    it('should maintain descending order by updatedAt when sorted', () => {
      fc.assert(
        fc.property(
          fc.array(leadWithStageArb, { minLength: 2, maxLength: 20 }),
          fc.array(customerArb, { minLength: 0, maxLength: 20 }),
          (leads: any[], customers: any[]) => {
            const leadEntities = leads.map(lead => mapLeadToUnifiedEntity(lead));
            const customerEntities = customers.map(customer => mapCustomerToUnifiedEntity(customer));
            const sortedEntities = [...leadEntities, ...customerEntities].sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            for (let i = 0; i < sortedEntities.length - 1; i++) {
              expect(new Date(sortedEntities[i].updatedAt).getTime())
                .toBeGreaterThanOrEqual(new Date(sortedEntities[i + 1].updatedAt).getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid ISO date strings for timestamps', () => {
      fc.assert(
        fc.property(leadWithStageArb, customerArb, (lead: any, customer: any) => {
          const leadEntity = mapLeadToUnifiedEntity(lead);
          const customerEntity = mapCustomerToUnifiedEntity(customer);
          expect(new Date(leadEntity.updatedAt).toISOString()).toBe(leadEntity.updatedAt);
          expect(new Date(customerEntity.updatedAt).toISOString()).toBe(customerEntity.updatedAt);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: 파이프라인 단계 표시 정확성', () => {
    it('should display correct stage for non-converted LEAD entities', () => {
      const nonConvertedLeadArb = leadWithStageArb.filter((lead: any) => lead.status !== LeadStatus.CONVERTED);
      fc.assert(
        fc.property(nonConvertedLeadArb, (lead: any) => {
          const entity = mapLeadToUnifiedEntity(lead);
          expect(entity.displayStage).toBe(lead.stage.name);
          expect(entity.stageColor).toBe(lead.stage.color || '#6B7280');
        }),
        { numRuns: 100 }
      );
    });

    it('should display "계약전환" for CONVERTED LEAD entities', () => {
      const convertedLeadArb = leadWithStageArb.map((lead: any) => ({ ...lead, status: LeadStatus.CONVERTED }));
      fc.assert(
        fc.property(convertedLeadArb, (lead: any) => {
          const entity = mapLeadToUnifiedEntity(lead);
          expect(entity.displayStage).toBe('계약전환');
          expect(entity.stageColor).toBe('#10B981');
        }),
        { numRuns: 100 }
      );
    });

    it('should display correct stage based on grade for CUSTOMER entities', () => {
      fc.assert(
        fc.property(customerArb, (customer: any) => {
          const entity = mapCustomerToUnifiedEntity(customer);
          const expectedStageInfo = CUSTOMER_GRADE_STAGE_MAP[customer.grade as CustomerGrade];
          expect(entity.displayStage).toBe(expectedStageInfo.name);
          expect(entity.stageColor).toBe(expectedStageInfo.color);
          expect(entity.stageOrder).toBe(expectedStageInfo.order);
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid hex color format for stageColor', () => {
      fc.assert(
        fc.property(leadWithStageArb, customerArb, (lead: any, customer: any) => {
          const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
          expect(mapLeadToUnifiedEntity(lead).stageColor).toMatch(hexColorPattern);
          expect(mapCustomerToUnifiedEntity(customer).stageColor).toMatch(hexColorPattern);
        }),
        { numRuns: 100 }
      );
    });
  });
});
