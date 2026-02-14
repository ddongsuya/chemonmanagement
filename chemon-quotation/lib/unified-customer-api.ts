/**
 * Unified Customer API Client
 * 
 * 리드(Lead)와 고객(Customer)을 통합하여 조회하는 API 클라이언트
 * 
 * @module lib/unified-customer-api
 * @requirements 6.1
 */

import { apiFetch, buildQueryString, ApiResponse } from './api-utils';
import type {
  UnifiedEntity,
  UnifiedCustomerFilters,
  UnifiedCustomerResponse,
  PipelineStageInfo,
} from '@/types/unified-customer';

// Re-export types for convenience
export type {
  UnifiedEntity,
  UnifiedCustomerFilters,
  UnifiedCustomerResponse,
  PipelineStageInfo,
} from '@/types/unified-customer';

/**
 * 통합 고객 목록 조회
 * 
 * 리드와 고객 데이터를 통합하여 조회합니다.
 * 필터링, 검색, 페이지네이션을 지원합니다.
 * 
 * @param filters - 필터 옵션 (type, stageId, search, page, limit, sortBy, sortOrder)
 * @returns 통합 고객 목록, 페이지네이션 정보, 통계 정보
 * 
 * @example
 * // 전체 목록 조회
 * const response = await getUnifiedCustomers();
 * 
 * @example
 * // 리드만 필터링
 * const response = await getUnifiedCustomers({ type: 'lead' });
 * 
 * @example
 * // 특정 단계 필터링 + 검색
 * const response = await getUnifiedCustomers({ 
 *   stageId: 'stage-id', 
 *   search: '회사명' 
 * });
 * 
 * @requirements 6.1
 */
export async function getUnifiedCustomers(
  filters?: UnifiedCustomerFilters
): Promise<ApiResponse<UnifiedCustomerResponse>> {
  const queryString = filters ? buildQueryString(filters) : '';
  const endpoint = queryString 
    ? `/api/unified-customers?${queryString}` 
    : '/api/unified-customers';
  
  return apiFetch<UnifiedCustomerResponse>(endpoint);
}

/**
 * 파이프라인 단계 목록 조회 (필터용)
 * 
 * 통합 고객 목록의 단계 필터에 사용할 파이프라인 단계 목록을 조회합니다.
 * 
 * @returns 파이프라인 단계 목록
 * 
 * @example
 * const response = await getPipelineStagesForFilter();
 * if (response.success) {
 *   const stages = response.data.stages;
 * }
 */
export async function getPipelineStagesForFilter(): Promise<
  ApiResponse<{ stages: PipelineStageInfo[] }>
> {
  return apiFetch<{ stages: PipelineStageInfo[] }>('/api/pipeline/stages');
}
