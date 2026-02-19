// backend/src/services/unifiedCustomerService.ts
// 통합 고객 관리 서비스
// Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3

import { PrismaClient, Lead, Customer, PipelineStage, LeadStatus, CustomerGrade } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  UnifiedEntity,
  UnifiedCustomerFilters,
  UnifiedCustomerResponse,
  UnifiedCustomerStats,
  PaginationInfo,
  CUSTOMER_GRADE_STAGE_MAP,
  DEFAULT_UNIFIED_CUSTOMER_FILTERS,
} from '../types/unifiedCustomer';

/**
 * 리드와 파이프라인 단계를 포함한 타입
 */
type LeadWithStage = Lead & { stage: PipelineStage };

/**
 * 리드를 UnifiedEntity로 변환
 * 
 * Requirements:
 * - 1.3: 리드의 companyName, contactName, contactEmail, contactPhone, stage 정보 표시
 * - 2.1: 리드의 PipelineStage 이름과 색상을 배지로 표시
 * - 2.3: 리드가 CONVERTED 상태이면 "계약전환" 단계 표시
 * - 2.4: PipelineStage 테이블에 정의된 color 값 사용
 * 
 * @param lead - 파이프라인 단계를 포함한 리드 데이터
 * @returns UnifiedEntity - 통합 엔티티 형식으로 변환된 데이터
 */
export function mapLeadToUnifiedEntity(lead: LeadWithStage): UnifiedEntity {
  // Requirements 2.3: CONVERTED 상태인 경우 "계약전환" 단계 표시
  const isConverted = lead.status === LeadStatus.CONVERTED;
  
  return {
    id: lead.id,
    entityType: 'LEAD',
    companyName: lead.companyName,
    contactName: lead.contactName,
    contactEmail: lead.contactEmail,
    contactPhone: lead.contactPhone,
    // Requirements 2.3: CONVERTED 상태면 "계약전환" 표시, 아니면 stage.name 사용
    displayStage: isConverted ? '계약전환' : lead.stage.name,
    // Requirements 2.4: PipelineStage 테이블의 color 값 사용 (CONVERTED는 녹색)
    stageColor: isConverted ? '#10B981' : (lead.stage.color || '#6B7280'),
    stageOrder: isConverted ? 999 : lead.stage.order,
    leadNumber: lead.leadNumber,
    leadStatus: lead.status,
    stageId: lead.stageId,
    expectedAmount: lead.expectedAmount ? Number(lead.expectedAmount) : undefined,
    source: lead.source,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

/**
 * 고객을 UnifiedEntity로 변환
 * 
 * Requirements:
 * - 1.4: 고객의 company, name, email, phone, grade 정보 표시
 * - 2.2: 고객의 grade에 따른 단계(계약완료, VIP 등)를 배지로 표시
 * 
 * @param customer - 고객 데이터
 * @returns UnifiedEntity - 통합 엔티티 형식으로 변환된 데이터
 */
export function mapCustomerToUnifiedEntity(customer: Customer): UnifiedEntity {
  // Requirements 2.2: grade에 따른 단계 정보 매핑
  const stageInfo = CUSTOMER_GRADE_STAGE_MAP[customer.grade];
  
  return {
    id: customer.id,
    entityType: 'CUSTOMER',
    // Requirements 1.4: company가 없으면 name 사용
    companyName: customer.company || customer.name,
    contactName: customer.name,
    contactEmail: customer.email,
    contactPhone: customer.phone,
    displayStage: stageInfo.name,
    stageColor: stageInfo.color,
    stageOrder: stageInfo.order,
    grade: customer.grade,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

/**
 * UnifiedCustomerService
 * 
 * 리드와 고객 데이터를 통합하여 조회하는 서비스입니다.
 * 
 * 주요 기능:
 * - 리드와 고객 데이터 통합 조회
 * - 유형별, 단계별, 검색어 필터링
 * - 통계 계산 (totalCount, leadCount, customerCount, stageDistribution)
 * 
 * Requirements:
 * - 1.1: Lead 테이블과 Customer 테이블의 데이터를 통합하여 표시
 * - 1.5: 최신 업데이트 순으로 정렬
 * - 7.1, 7.2, 7.3: 통계 정보 제공
 */
export class UnifiedCustomerService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * 통합 고객 목록 조회
   * 
   * Requirements:
   * - 1.1: Lead와 Customer 데이터 통합
   * - 1.5: 최신 업데이트 순으로 정렬
   * - 6.2: 통합된 형식(Unified_Entity)으로 반환
   * - 6.3: stageId 파라미터로 필터링
   * - 6.4: type 파라미터로 필터링
   * - 6.5: search 파라미터로 필터링
   * 
   * @param filters - 필터 옵션
   * @param userId - 사용자 ID (권한 체크용)
   * @returns UnifiedCustomerResponse - 통합 고객 목록, 페이지네이션, 통계
   */
  async getUnifiedCustomers(
    filters: UnifiedCustomerFilters,
    userId: string
  ): Promise<UnifiedCustomerResponse> {
    // 기본값 적용
    const {
      type = DEFAULT_UNIFIED_CUSTOMER_FILTERS.type,
      stageId,
      search,
      page = DEFAULT_UNIFIED_CUSTOMER_FILTERS.page,
      limit = DEFAULT_UNIFIED_CUSTOMER_FILTERS.limit,
      sortBy = DEFAULT_UNIFIED_CUSTOMER_FILTERS.sortBy,
      sortOrder = DEFAULT_UNIFIED_CUSTOMER_FILTERS.sortOrder,
    } = filters;

    // 병렬로 리드와 고객 데이터 조회
    const [leads, customers] = await Promise.all([
      this.fetchLeads(type, stageId, search, userId),
      this.fetchCustomers(type, search, userId),
    ]);

    // 통합 엔티티로 변환
    const leadEntities = leads.map(mapLeadToUnifiedEntity);
    const customerEntities = customers.map(mapCustomerToUnifiedEntity);

    // 통합 및 정렬
    let allEntities: UnifiedEntity[] = [...leadEntities, ...customerEntities];

    // Requirements 1.5: 최신 업데이트 순으로 정렬 (기본값)
    allEntities = this.sortEntities(allEntities, sortBy, sortOrder);

    // 통계 계산 (페이지네이션 적용 전)
    const stats = this.calculateStats(allEntities);

    // 페이지네이션 적용
    const totalCount = allEntities.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedEntities = allEntities.slice(startIndex, startIndex + limit);

    const pagination: PaginationInfo = {
      total: totalCount,
      page,
      limit,
      totalPages,
    };

    return {
      data: paginatedEntities,
      pagination,
      stats,
    };
  }

  /**
   * 리드 데이터 조회
   * 
   * @param type - 유형 필터
   * @param stageId - 단계 ID 필터
   * @param search - 검색어
   * @param userId - 사용자 ID
   * @returns 리드 목록 (파이프라인 단계 포함)
   */
  private async fetchLeads(
    type: 'all' | 'lead' | 'customer',
    stageId: string | undefined,
    search: string | undefined,
    userId: string
  ): Promise<LeadWithStage[]> {
    // type이 'customer'인 경우 리드 조회 스킵
    if (type === 'customer') {
      return [];
    }

    // 검색 조건 구성
    const searchConditions = search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { contactName: { contains: search, mode: 'insensitive' as const } },
            { contactEmail: { contains: search, mode: 'insensitive' as const } },
            { contactPhone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // 단계 필터 조건
    const stageCondition = stageId ? { stageId } : {};

    const leads = await this.prisma.lead.findMany({
      where: {
        deletedAt: null,
        userId,
        ...stageCondition,
        ...searchConditions,
      },
      include: {
        stage: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return leads;
  }

  /**
   * 고객 데이터 조회
   * 
   * @param type - 유형 필터
   * @param search - 검색어
   * @param userId - 사용자 ID
   * @returns 고객 목록
   */
  private async fetchCustomers(
    type: 'all' | 'lead' | 'customer',
    search: string | undefined,
    userId: string
  ): Promise<Customer[]> {
    // type이 'lead'인 경우 고객 조회 스킵
    if (type === 'lead') {
      return [];
    }

    // 검색 조건 구성
    const searchConditions = search
      ? {
          OR: [
            { company: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const customers = await this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        userId,
        ...searchConditions,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return customers;
  }

  /**
   * 엔티티 정렬
   * 
   * Requirements 1.5: 최신 업데이트 순으로 정렬
   * 
   * @param entities - 정렬할 엔티티 배열
   * @param sortBy - 정렬 기준
   * @param sortOrder - 정렬 순서
   * @returns 정렬된 엔티티 배열
   */
  private sortEntities(
    entities: UnifiedEntity[],
    sortBy: 'updatedAt' | 'createdAt' | 'companyName',
    sortOrder: 'asc' | 'desc'
  ): UnifiedEntity[] {
    return [...entities].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'companyName':
          comparison = a.companyName.localeCompare(b.companyName, 'ko');
          break;
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * 통계 계산
   * 
   * Requirements:
   * - 7.1: 총 항목 수 (리드 + 고객)
   * - 7.2: 리드 수와 고객 수 각각 표시
   * - 7.3: 파이프라인 단계별 항목 수
   * 
   * @param entities - 통계를 계산할 엔티티 배열
   * @returns UnifiedCustomerStats - 통계 정보
   */
  private calculateStats(entities: UnifiedEntity[]): UnifiedCustomerStats {
    const leadCount = entities.filter((e) => e.entityType === 'LEAD').length;
    const customerCount = entities.filter((e) => e.entityType === 'CUSTOMER').length;

    // 단계별 분포 계산 - Object.create(null)을 사용하여 prototype pollution 방지
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

  /**
   * 파이프라인 단계 목록 조회
   * 
   * @returns PipelineStage[] - 파이프라인 단계 목록
   */
  async getPipelineStages(): Promise<PipelineStage[]> {
    return this.prisma.pipelineStage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  /**
   * 단계별 분포 조회 (전체 데이터 기준)
   * 
   * @param userId - 사용자 ID
   * @returns Record<string, number> - 단계별 항목 수
   */
  async getStageDistribution(userId: string): Promise<Record<string, number>> {
    const response = await this.getUnifiedCustomers({ type: 'all' }, userId);
    return response.stats.stageDistribution;
  }
}

// 싱글톤 인스턴스 export
export const unifiedCustomerService = new UnifiedCustomerService();

export default UnifiedCustomerService;
