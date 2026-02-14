/**
 * Unified Customer Management Types
 * 
 * 리드(Lead)와 고객(Customer)을 통합하여 표시하기 위한 타입 정의
 * 
 * @module types/unifiedCustomer
 */

import { LeadStatus, LeadSource, CustomerGrade } from '@prisma/client';

/**
 * 통합 엔티티 유형
 * - LEAD: 잠재 고객 (문의 단계의 고객)
 * - CUSTOMER: 계약이 체결된 실제 고객
 */
export type EntityType = 'LEAD' | 'CUSTOMER';

/**
 * 통합 엔티티 인터페이스
 * 
 * 리드와 고객을 통합된 형태로 표현하는 데이터 구조
 * Requirements: 1.1, 1.2, 6.2, 6.6
 */
export interface UnifiedEntity {
  /** 고유 식별자 (리드 ID 또는 고객 ID) */
  id: string;
  
  /** 엔티티 유형 (LEAD 또는 CUSTOMER) */
  entityType: EntityType;
  
  // ========== 공통 필드 ==========
  /** 회사명 */
  companyName: string;
  
  /** 담당자명 */
  contactName: string;
  
  /** 담당자 이메일 */
  contactEmail: string | null;
  
  /** 담당자 전화번호 */
  contactPhone: string | null;
  
  // ========== 단계 정보 ==========
  /** 표시용 단계명 (예: "문의접수", "계약완료", "VIP") */
  displayStage: string;
  
  /** 단계 색상 (HEX 코드) */
  stageColor: string;
  
  /** 정렬용 순서 */
  stageOrder: number;
  
  // ========== 리드 전용 필드 (entityType === 'LEAD'인 경우) ==========
  /** 리드 번호 */
  leadNumber?: string;
  
  /** 리드 상태 */
  leadStatus?: LeadStatus;
  
  /** 파이프라인 단계 ID */
  stageId?: string;
  
  /** 예상 금액 */
  expectedAmount?: number;
  
  /** 유입 경로 */
  source?: LeadSource;
  
  // ========== 고객 전용 필드 (entityType === 'CUSTOMER'인 경우) ==========
  /** 고객 등급 */
  grade?: CustomerGrade;
  
  /** 견적 수 */
  quotationCount?: number;
  
  /** 총 금액 */
  totalAmount?: number;
  
  // ========== 메타데이터 ==========
  /** 생성일시 (ISO 8601 형식) */
  createdAt: string;
  
  /** 수정일시 (ISO 8601 형식) */
  updatedAt: string;
}

/**
 * 통합 고객 목록 필터 옵션
 * 
 * Requirements: 3.1, 4.1, 5.1, 6.3, 6.4, 6.5
 */
export interface UnifiedCustomerFilters {
  /** 유형 필터 (전체/리드/고객) */
  type?: 'all' | 'lead' | 'customer';
  
  /** 파이프라인 단계 ID 필터 */
  stageId?: string;
  
  /** 검색어 (회사명, 담당자명, 이메일, 전화번호) */
  search?: string;
  
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  
  /** 페이지당 항목 수 */
  limit?: number;
  
  /** 정렬 기준 */
  sortBy?: 'updatedAt' | 'createdAt' | 'companyName';
  
  /** 정렬 순서 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  /** 전체 항목 수 */
  total: number;
  
  /** 현재 페이지 번호 */
  page: number;
  
  /** 페이지당 항목 수 */
  limit: number;
  
  /** 전체 페이지 수 */
  totalPages: number;
}

/**
 * 통합 고객 통계 정보
 * 
 * Requirements: 7.1, 7.2, 7.3
 */
export interface UnifiedCustomerStats {
  /** 전체 항목 수 (리드 + 고객) */
  totalCount: number;
  
  /** 리드 수 */
  leadCount: number;
  
  /** 고객 수 */
  customerCount: number;
  
  /** 파이프라인 단계별 항목 수 */
  stageDistribution: Record<string, number>;
}

/**
 * 통합 고객 API 응답
 * 
 * Requirements: 6.2, 6.6
 */
export interface UnifiedCustomerResponse {
  /** 통합 엔티티 목록 */
  data: UnifiedEntity[];
  
  /** 페이지네이션 정보 */
  pagination: PaginationInfo;
  
  /** 통계 정보 */
  stats: UnifiedCustomerStats;
}

/**
 * 고객 등급별 단계 정보 매핑
 * 
 * 고객의 grade를 displayStage, stageColor, stageOrder로 변환하기 위한 매핑
 * Requirements: 2.2
 */
export const CUSTOMER_GRADE_STAGE_MAP: Record<CustomerGrade, { name: string; color: string; order: number }> = {
  LEAD: { name: '리드', color: '#6B7280', order: 0 },
  PROSPECT: { name: '잠재고객', color: '#3B82F6', order: 1 },
  CUSTOMER: { name: '계약완료', color: '#10B981', order: 100 },
  VIP: { name: 'VIP', color: '#8B5CF6', order: 101 },
  INACTIVE: { name: '비활성', color: '#EF4444', order: 102 },
};

/**
 * 기본 필터 값
 */
export const DEFAULT_UNIFIED_CUSTOMER_FILTERS: Required<Pick<UnifiedCustomerFilters, 'type' | 'page' | 'limit' | 'sortBy' | 'sortOrder'>> = {
  type: 'all',
  page: 1,
  limit: 20,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};
