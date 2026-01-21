// Clinical Pathology API Client
// 임상병리검사 견적서 및 시험의뢰서 API

import { api } from './api';
import type {
  ClinicalTestItem,
  ClinicalQcSetting,
  ClinicalQuotation,
  ClinicalTestRequest,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationsListResponse,
  TestRequestsListResponse,
  CalculateRequest,
  CalculateResponse,
  TestItemsListResponse,
  ReceiveRequestData,
  ClinicalStatistics,
  ClinicalQuotationStatus,
  ClinicalTestRequestStatus,
  ClinicalTestCategory,
} from '@/types/clinical-pathology';

const BASE_URL = '/clinical-pathology';

// ==================== 마스터데이터 - 검사항목 ====================

export async function getTestItems(params?: {
  category?: ClinicalTestCategory;
  isActive?: boolean;
  search?: string;
}): Promise<TestItemsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append('category', params.category);
  if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
  if (params?.search) searchParams.append('search', params.search);
  
  const query = searchParams.toString();
  return api.get<TestItemsListResponse>(`${BASE_URL}/master/test-items${query ? `?${query}` : ''}`);
}

export async function getTestItemById(id: string): Promise<ClinicalTestItem> {
  return api.get<ClinicalTestItem>(`${BASE_URL}/master/test-items/${id}`);
}

export async function createTestItem(data: Partial<ClinicalTestItem>): Promise<ClinicalTestItem> {
  return api.post<ClinicalTestItem>(`${BASE_URL}/master/test-items`, data);
}

export async function updateTestItem(id: string, data: Partial<ClinicalTestItem>): Promise<ClinicalTestItem> {
  return api.put<ClinicalTestItem>(`${BASE_URL}/master/test-items/${id}`, data);
}

export async function toggleTestItemActive(id: string): Promise<ClinicalTestItem> {
  return api.post<ClinicalTestItem>(`${BASE_URL}/master/test-items/${id}/toggle`, {});
}

// ==================== 마스터데이터 - QC 설정 ====================

export async function getQcSettings(): Promise<ClinicalQcSetting[]> {
  return api.get<ClinicalQcSetting[]>(`${BASE_URL}/master/qc-settings`);
}

export async function updateQcSettings(settings: Array<{
  category: ClinicalTestCategory;
  thresholdCount: number;
  qcFee: number;
}>): Promise<ClinicalQcSetting[]> {
  return api.put<ClinicalQcSetting[]>(`${BASE_URL}/master/qc-settings`, { settings });
}

// ==================== 금액 계산 ====================

export async function calculateQuotation(data: CalculateRequest): Promise<CalculateResponse> {
  return api.post<CalculateResponse>(`${BASE_URL}/calculate`, data);
}

// ==================== 견적서 ====================

export async function getQuotations(params?: {
  status?: ClinicalQuotationStatus;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<QuotationsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.customerId) searchParams.append('customerId', params.customerId);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  
  const query = searchParams.toString();
  return api.get<QuotationsListResponse>(`${BASE_URL}/quotations${query ? `?${query}` : ''}`);
}

export async function getQuotationById(id: string): Promise<ClinicalQuotation> {
  return api.get<ClinicalQuotation>(`${BASE_URL}/quotations/${id}`);
}

export async function createQuotation(data: CreateQuotationRequest): Promise<{
  quotation: ClinicalQuotation;
  quotationNumber: string;
}> {
  return api.post<{ quotation: ClinicalQuotation; quotationNumber: string }>(`${BASE_URL}/quotations`, data);
}

export async function updateQuotation(id: string, data: UpdateQuotationRequest): Promise<ClinicalQuotation> {
  return api.put<ClinicalQuotation>(`${BASE_URL}/quotations/${id}`, data);
}

export async function deleteQuotation(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE_URL}/quotations/${id}`);
}

export async function sendQuotation(id: string): Promise<ClinicalQuotation> {
  return api.post<ClinicalQuotation>(`${BASE_URL}/quotations/${id}/send`, {});
}

export async function acceptQuotation(id: string): Promise<ClinicalQuotation> {
  return api.post<ClinicalQuotation>(`${BASE_URL}/quotations/${id}/accept`, {});
}

export async function rejectQuotation(id: string): Promise<ClinicalQuotation> {
  return api.post<ClinicalQuotation>(`${BASE_URL}/quotations/${id}/reject`, {});
}

export async function copyQuotation(id: string): Promise<ClinicalQuotation> {
  return api.post<ClinicalQuotation>(`${BASE_URL}/quotations/${id}/copy`, {});
}

export async function convertToTestRequest(quotationId: string): Promise<ClinicalTestRequest> {
  return api.post<ClinicalTestRequest>(`${BASE_URL}/quotations/${quotationId}/convert-to-request`, {});
}

// ==================== 시험의뢰서 ====================

export async function getTestRequests(params?: {
  status?: ClinicalTestRequestStatus;
  quotationId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<TestRequestsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.quotationId) searchParams.append('quotationId', params.quotationId);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  
  const query = searchParams.toString();
  return api.get<TestRequestsListResponse>(`${BASE_URL}/test-requests${query ? `?${query}` : ''}`);
}

export async function getTestRequestById(id: string): Promise<ClinicalTestRequest> {
  return api.get<ClinicalTestRequest>(`${BASE_URL}/test-requests/${id}`);
}

export async function updateTestRequest(id: string, data: Partial<ClinicalTestRequest>): Promise<ClinicalTestRequest> {
  return api.put<ClinicalTestRequest>(`${BASE_URL}/test-requests/${id}`, data);
}

export async function deleteTestRequest(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${BASE_URL}/test-requests/${id}`);
}

export async function submitTestRequest(id: string): Promise<ClinicalTestRequest> {
  return api.post<ClinicalTestRequest>(`${BASE_URL}/test-requests/${id}/submit`, {});
}

export async function receiveTestRequest(id: string, data: ReceiveRequestData): Promise<ClinicalTestRequest> {
  return api.post<ClinicalTestRequest>(`${BASE_URL}/test-requests/${id}/receive`, data);
}

export async function startTestRequest(id: string): Promise<ClinicalTestRequest> {
  return api.post<ClinicalTestRequest>(`${BASE_URL}/test-requests/${id}/start`, {});
}

export async function completeTestRequest(id: string): Promise<ClinicalTestRequest> {
  return api.post<ClinicalTestRequest>(`${BASE_URL}/test-requests/${id}/complete`, {});
}

export async function cancelTestRequest(id: string): Promise<ClinicalTestRequest> {
  return api.post<ClinicalTestRequest>(`${BASE_URL}/test-requests/${id}/cancel`, {});
}

// ==================== 통계 ====================

export async function getStatistics(): Promise<ClinicalStatistics> {
  return api.get<ClinicalStatistics>(`${BASE_URL}/statistics`);
}

// ==================== API 객체 Export ====================

export const clinicalPathologyApi = {
  // 마스터데이터 - 검사항목
  getTestItems,
  getTestItemById,
  createTestItem,
  updateTestItem,
  toggleTestItemActive,
  
  // 마스터데이터 - QC 설정
  getQcSettings,
  updateQcSettings,
  
  // 금액 계산
  calculate: calculateQuotation,
  
  // 견적서
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  copyQuotation,
  convertToTestRequest,
  
  // 시험의뢰서
  getTestRequests,
  getTestRequestById,
  updateTestRequest,
  deleteTestRequest,
  submitTestRequest,
  receiveTestRequest,
  startTestRequest,
  completeTestRequest,
  cancelTestRequest,
  
  // 통계
  getStatistics,
};
