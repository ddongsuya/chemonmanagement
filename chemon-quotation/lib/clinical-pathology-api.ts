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
  const response = await api.get(`${BASE_URL}/master/test-items${query ? `?${query}` : ''}`);
  return response.data;
}

export async function getTestItemById(id: string): Promise<ClinicalTestItem> {
  const response = await api.get(`${BASE_URL}/master/test-items/${id}`);
  return response.data;
}

export async function createTestItem(data: Partial<ClinicalTestItem>): Promise<ClinicalTestItem> {
  const response = await api.post(`${BASE_URL}/master/test-items`, data);
  return response.data;
}

export async function updateTestItem(id: string, data: Partial<ClinicalTestItem>): Promise<ClinicalTestItem> {
  const response = await api.put(`${BASE_URL}/master/test-items/${id}`, data);
  return response.data;
}

export async function toggleTestItemActive(id: string): Promise<ClinicalTestItem> {
  const response = await api.patch(`${BASE_URL}/master/test-items/${id}/toggle`);
  return response.data;
}

// ==================== 마스터데이터 - QC 설정 ====================

export async function getQcSettings(): Promise<ClinicalQcSetting[]> {
  const response = await api.get(`${BASE_URL}/master/qc-settings`);
  return response.data;
}

export async function updateQcSettings(settings: Array<{
  category: ClinicalTestCategory;
  thresholdCount: number;
  qcFee: number;
}>): Promise<ClinicalQcSetting[]> {
  const response = await api.put(`${BASE_URL}/master/qc-settings`, { settings });
  return response.data;
}

// ==================== 금액 계산 ====================

export async function calculateQuotation(data: CalculateRequest): Promise<CalculateResponse> {
  const response = await api.post(`${BASE_URL}/calculate`, data);
  return response.data;
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
  const response = await api.get(`${BASE_URL}/quotations${query ? `?${query}` : ''}`);
  return response.data;
}

export async function getQuotationById(id: string): Promise<ClinicalQuotation> {
  const response = await api.get(`${BASE_URL}/quotations/${id}`);
  return response.data;
}

export async function createQuotation(data: CreateQuotationRequest): Promise<{
  quotation: ClinicalQuotation;
  quotationNumber: string;
}> {
  const response = await api.post(`${BASE_URL}/quotations`, data);
  return response.data;
}

export async function updateQuotation(id: string, data: UpdateQuotationRequest): Promise<ClinicalQuotation> {
  const response = await api.put(`${BASE_URL}/quotations/${id}`, data);
  return response.data;
}

export async function deleteQuotation(id: string): Promise<{ success: boolean }> {
  const response = await api.delete(`${BASE_URL}/quotations/${id}`);
  return response.data;
}

export async function sendQuotation(id: string): Promise<ClinicalQuotation> {
  const response = await api.post(`${BASE_URL}/quotations/${id}/send`);
  return response.data;
}

export async function acceptQuotation(id: string): Promise<ClinicalQuotation> {
  const response = await api.post(`${BASE_URL}/quotations/${id}/accept`);
  return response.data;
}

export async function rejectQuotation(id: string): Promise<ClinicalQuotation> {
  const response = await api.post(`${BASE_URL}/quotations/${id}/reject`);
  return response.data;
}

export async function copyQuotation(id: string): Promise<ClinicalQuotation> {
  const response = await api.post(`${BASE_URL}/quotations/${id}/copy`);
  return response.data;
}

export async function convertToTestRequest(quotationId: string): Promise<ClinicalTestRequest> {
  const response = await api.post(`${BASE_URL}/quotations/${quotationId}/convert-to-request`);
  return response.data;
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
  const response = await api.get(`${BASE_URL}/test-requests${query ? `?${query}` : ''}`);
  return response.data;
}

export async function getTestRequestById(id: string): Promise<ClinicalTestRequest> {
  const response = await api.get(`${BASE_URL}/test-requests/${id}`);
  return response.data;
}

export async function updateTestRequest(id: string, data: Partial<ClinicalTestRequest>): Promise<ClinicalTestRequest> {
  const response = await api.put(`${BASE_URL}/test-requests/${id}`, data);
  return response.data;
}

export async function deleteTestRequest(id: string): Promise<{ success: boolean }> {
  const response = await api.delete(`${BASE_URL}/test-requests/${id}`);
  return response.data;
}

export async function submitTestRequest(id: string): Promise<ClinicalTestRequest> {
  const response = await api.post(`${BASE_URL}/test-requests/${id}/submit`);
  return response.data;
}

export async function receiveTestRequest(id: string, data: ReceiveRequestData): Promise<ClinicalTestRequest> {
  const response = await api.post(`${BASE_URL}/test-requests/${id}/receive`, data);
  return response.data;
}

export async function startTestRequest(id: string): Promise<ClinicalTestRequest> {
  const response = await api.post(`${BASE_URL}/test-requests/${id}/start`);
  return response.data;
}

export async function completeTestRequest(id: string): Promise<ClinicalTestRequest> {
  const response = await api.post(`${BASE_URL}/test-requests/${id}/complete`);
  return response.data;
}

export async function cancelTestRequest(id: string): Promise<ClinicalTestRequest> {
  const response = await api.post(`${BASE_URL}/test-requests/${id}/cancel`);
  return response.data;
}

// ==================== 통계 ====================

export async function getStatistics(): Promise<ClinicalStatistics> {
  const response = await api.get(`${BASE_URL}/statistics`);
  return response.data;
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
