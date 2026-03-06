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
  SegmentType,
} from '@/types/unified-customer';

// Re-export types for convenience
export type {
  UnifiedEntity,
  UnifiedCustomerFilters,
  UnifiedCustomerResponse,
  PipelineStageInfo,
  SegmentType,
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


// ==================== 건강도/이탈 위험 API ====================

export async function getHealthScore(customerId: string) {
  return apiFetch<{ score: number; activityScore: number; dealScore: number; meetingScore: number; paymentScore: number; contractScore: number; churnRiskScore: number }>(`/api/customer-health/${customerId}`);
}

export async function getHealthScoreHistory(customerId: string, days = 90) {
  return apiFetch<{ score: number; churnRiskScore: number; calculatedAt: string }[]>(`/api/customer-health/${customerId}/history?days=${days}`);
}

export async function batchRecalculateHealthScores(customerIds?: string[]) {
  return apiFetch<{ recalculatedCount: number }>('/api/customer-health/batch', {
    method: 'POST',
    body: JSON.stringify({ customerIds }),
  });
}

// ==================== 태그/세그먼트 API ====================

export async function getAllTags() {
  return apiFetch<{ name: string; color: string | null }[]>('/api/customer-tags');
}

export async function addTag(customerId: string, name: string, color?: string) {
  return apiFetch(`/api/customer-tags/${customerId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

export async function removeTag(customerId: string, tagId: string) {
  return apiFetch(`/api/customer-tags/${customerId}/tags/${tagId}`, { method: 'DELETE' });
}

export async function bulkTags(customerIds: string[], tagName: string, action: 'add' | 'remove', color?: string) {
  return apiFetch('/api/customer-tags/bulk', {
    method: 'POST',
    body: JSON.stringify({ customerIds, tagName, color, action }),
  });
}

export async function updateSegment(customerId: string, segment: SegmentType | null) {
  return apiFetch(`/api/customer-tags/${customerId}/segment`, {
    method: 'PATCH',
    body: JSON.stringify({ segment }),
  });
}

export async function getSegmentStats() {
  return apiFetch('/api/customer-tags/segments/stats');
}

// ==================== 메모 API ====================

export async function getNotes(customerId: string, page = 1, limit = 20) {
  return apiFetch(`/api/customer-notes/${customerId}?page=${page}&limit=${limit}`);
}

export async function createNote(customerId: string, content: string, mentions?: string[]) {
  return apiFetch(`/api/customer-notes/${customerId}`, {
    method: 'POST',
    body: JSON.stringify({ content, mentions }),
  });
}

export async function updateNote(customerId: string, noteId: string, data: { content?: string; isPinned?: boolean }) {
  return apiFetch(`/api/customer-notes/${customerId}/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(customerId: string, noteId: string) {
  return apiFetch(`/api/customer-notes/${customerId}/${noteId}`, { method: 'DELETE' });
}

export async function toggleNotePin(customerId: string, noteId: string) {
  return apiFetch(`/api/customer-notes/${customerId}/${noteId}/pin`, { method: 'PATCH' });
}

// ==================== 문서 API ====================

export async function getDocuments(customerId: string) {
  return apiFetch(`/api/customer-documents/${customerId}`);
}

export async function deleteDocument(customerId: string, docId: string) {
  return apiFetch(`/api/customer-documents/${customerId}/${docId}`, { method: 'DELETE' });
}

// ==================== 감사 로그/라이프사이클 API ====================

export async function getAuditLog(customerId: string, filters?: { fieldName?: string; changedBy?: string; fromDate?: string; toDate?: string; page?: number; limit?: number }) {
  const qs = filters ? buildQueryString(filters) : '';
  return apiFetch(`/api/customer-audit/${customerId}/audit-log${qs ? `?${qs}` : ''}`);
}

export async function getLifecycleHistory(customerId: string) {
  return apiFetch(`/api/customer-audit/${customerId}/lifecycle`);
}

export async function transitionLifecycle(customerId: string, toStage: string, reason?: string) {
  return apiFetch(`/api/customer-audit/${customerId}/lifecycle/transition`, {
    method: 'POST',
    body: JSON.stringify({ toStage, reason }),
  });
}

export async function getLifecycleStats() {
  return apiFetch('/api/customer-audit/lifecycle/stats');
}

// ==================== 데이터 품질/중복 API ====================

export async function getDataQuality(customerId: string) {
  return apiFetch(`/api/data-quality/${customerId}`);
}

export async function checkDuplicates(companyName: string, phone?: string, email?: string, excludeId?: string) {
  return apiFetch('/api/data-quality/duplicate-check', {
    method: 'POST',
    body: JSON.stringify({ companyName, phone, email, excludeId }),
  });
}

export async function mergeCustomers(primaryId: string, secondaryId: string, fieldSelections?: Record<string, 'primary' | 'secondary'>) {
  return apiFetch('/api/data-quality/merge', {
    method: 'POST',
    body: JSON.stringify({ primaryId, secondaryId, fieldSelections }),
  });
}

// ==================== 필터 프리셋 API ====================

export async function getFilterPresets() {
  return apiFetch('/api/filter-presets');
}

export async function createFilterPreset(name: string, filters: Record<string, unknown>, sortBy?: string, sortOrder?: string) {
  return apiFetch('/api/filter-presets', {
    method: 'POST',
    body: JSON.stringify({ name, filters, sortBy, sortOrder }),
  });
}

export async function updateFilterPreset(presetId: string, data: Record<string, unknown>) {
  return apiFetch(`/api/filter-presets/${presetId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteFilterPreset(presetId: string) {
  return apiFetch(`/api/filter-presets/${presetId}`, { method: 'DELETE' });
}

// ==================== 커스텀 필드 API ====================

export async function getCustomFields() {
  return apiFetch('/api/custom-fields');
}

export async function createCustomField(data: { name: string; fieldType: string; options?: unknown; isRequired?: boolean; displayOrder?: number }) {
  return apiFetch('/api/custom-fields', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCustomFieldValues(customerId: string) {
  return apiFetch(`/api/custom-fields/values/${customerId}`);
}

export async function updateCustomFieldValues(customerId: string, values: { fieldId: string; value: string }[]) {
  return apiFetch(`/api/custom-fields/values/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify({ values }),
  });
}

// ==================== 분석 API ====================

export async function getKPIData() {
  return apiFetch('/api/customer-analytics/kpi');
}

export async function getFunnelData() {
  return apiFetch('/api/customer-analytics/funnel');
}

export async function getChurnRateTrend() {
  return apiFetch('/api/customer-analytics/churn-rate');
}

export async function getSegmentCLV() {
  return apiFetch('/api/customer-analytics/segment-clv');
}

// ==================== 칸반 뷰 API ====================

export async function updateCustomerStage(customerId: string, stageId: string) {
  return apiFetch(`/api/unified-customers/${customerId}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stageId }),
  });
}


// ==================== 자동 전환 & 주간 요약 API ====================

export async function getAutoTransitionSuggestions() {
  return apiFetch('/api/customer-audit/lifecycle/auto-transition-suggestions');
}

export async function executeAutoTransition(customerId: string, toStage: string, reason?: string) {
  return apiFetch(`/api/customer-audit/${customerId}/lifecycle/auto-transition`, {
    method: 'POST',
    body: JSON.stringify({ toStage, reason }),
  });
}

export async function getStagnantCustomers() {
  return apiFetch('/api/customer-audit/lifecycle/stagnant');
}

export async function getWeeklySummary() {
  return apiFetch('/api/customer-audit/weekly-summary');
}


// ==================== 가져오기/내보내기 API ====================

export async function uploadImportFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/api/customer-import-export/upload', {
    method: 'POST',
    body: formData,
    // Don't set Content-Type - browser will set it with boundary
  });
}

export async function validateImport(filePath: string, mapping: unknown[]) {
  return apiFetch('/api/customer-import-export/validate', {
    method: 'POST',
    body: JSON.stringify({ filePath, mapping }),
  });
}

export async function executeImport(filePath: string, mapping: unknown[], skipDuplicates = true) {
  return apiFetch('/api/customer-import-export/execute', {
    method: 'POST',
    body: JSON.stringify({ filePath, mapping, skipDuplicates }),
  });
}

export async function downloadImportTemplate() {
  // Direct download via window.open
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  window.open(`${baseUrl}/api/customer-import-export/template`, '_blank');
}
