/**
 * 계약서 API 함수
 * - localStorage에서 백엔드 API로 전환
 */

import { getAccessToken, getRefreshToken, clearTokens } from './auth-api';
import { ContractData } from './contract/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ACCESS_TOKEN_KEY = 'access_token';

// ============ Types ============

export type ContractStatus = 'NEGOTIATING' | 'SIGNED' | 'TEST_RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED';

export interface SavedContract {
  id: string;
  contract_number: string;
  quotation_id?: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  customer_address: string;
  customer_ceo: string;
  project_name: string;
  contract_type: 'TOXICITY' | 'EFFICACY';
  start_date: string;
  end_date: string;
  total_weeks: number;
  total_amount: number;
  paid_amount: number;
  advance_rate: number;
  advance_amount: number;
  remaining_amount: number;
  signed_date?: string;
  status: ContractStatus;
  terms?: string;
  notes?: string;
  is_draft: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
}

// ============ API Helper ============

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

async function contractFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (response.status === 401 && accessToken) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newAccessToken = getAccessToken();
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return retryResponse.json();
      }
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
    };
  }
}

// ============ Mapping Functions ============

function mapContractFromApi(data: any): SavedContract {
  return {
    id: data.id,
    contract_number: data.contractNumber,
    quotation_id: data.quotations?.[0]?.id,
    quotation_number: data.quotations?.[0]?.quotationNumber || '',
    customer_id: data.customerId,
    customer_name: data.customer?.name || '',
    customer_address: data.customer?.address || '',
    customer_ceo: '',
    project_name: data.title,
    contract_type: data.contractType,
    start_date: data.startDate || '',
    end_date: data.endDate || '',
    total_weeks: 0,
    total_amount: Number(data.totalAmount) || 0,
    paid_amount: Number(data.paidAmount) || 0,
    advance_rate: 0,
    advance_amount: 0,
    remaining_amount: Number(data.totalAmount) - Number(data.paidAmount) || 0,
    signed_date: data.signedDate,
    status: data.status,
    terms: data.terms,
    notes: data.notes,
    is_draft: data.status === 'NEGOTIATING',
    items_count: 0,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapContractToApi(data: Partial<SavedContract>): any {
  const result: any = {};
  
  if (data.customer_id !== undefined) result.customerId = data.customer_id;
  if (data.project_name !== undefined) result.title = data.project_name;
  if (data.contract_type !== undefined) result.contractType = data.contract_type;
  if (data.total_amount !== undefined) result.totalAmount = data.total_amount;
  if (data.paid_amount !== undefined) result.paidAmount = data.paid_amount;
  if (data.start_date !== undefined) result.startDate = data.start_date;
  if (data.end_date !== undefined) result.endDate = data.end_date;
  if (data.signed_date !== undefined) result.signedDate = data.signed_date;
  if (data.status !== undefined) result.status = data.status;
  if (data.terms !== undefined) result.terms = data.terms;
  if (data.notes !== undefined) result.notes = data.notes;
  
  return result;
}

// ============ Contract API ============

export const contractApi = {
  // 모든 계약서 조회
  async getAll(filters?: {
    status?: ContractStatus;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SavedContract[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await contractFetch<{ data: any[]; pagination: any }>(`/api/contracts?${params.toString()}`);
    return (response.data?.data || []).map(mapContractFromApi);
  },

  // 단일 계약서 조회
  async getById(id: string): Promise<SavedContract | null> {
    try {
      const response = await contractFetch<any>(`/api/contracts/${id}`);
      return response.data ? mapContractFromApi(response.data) : null;
    } catch {
      return null;
    }
  },

  // 계약서 생성
  async create(data: Omit<SavedContract, 'id' | 'contract_number' | 'created_at' | 'updated_at'>): Promise<SavedContract> {
    const response = await contractFetch<any>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(mapContractToApi(data)),
    });
    return mapContractFromApi(response.data);
  },

  // 계약서 수정
  async update(id: string, data: Partial<SavedContract>): Promise<SavedContract> {
    const response = await contractFetch<any>(`/api/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapContractToApi(data)),
    });
    return mapContractFromApi(response.data);
  },

  // 계약서 삭제
  async delete(id: string): Promise<boolean> {
    const response = await contractFetch<void>(`/api/contracts/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  },

  // 견적서 ID로 계약서 조회
  async getByQuotationId(quotationId: string): Promise<SavedContract | null> {
    const contracts = await this.getAll();
    return contracts.find(c => c.quotation_id === quotationId) || null;
  },

  // 통계
  async getStats(): Promise<{
    total: number;
    draft: number;
    signed: number;
    inProgress: number;
    completed: number;
    totalAmount: number;
    paidAmount: number;
  }> {
    const contracts = await this.getAll({ limit: 1000 });
    
    return {
      total: contracts.length,
      draft: contracts.filter(c => c.status === 'NEGOTIATING').length,
      signed: contracts.filter(c => c.status === 'SIGNED').length,
      inProgress: contracts.filter(c => c.status === 'IN_PROGRESS').length,
      completed: contracts.filter(c => c.status === 'COMPLETED').length,
      totalAmount: contracts.reduce((sum, c) => sum + c.total_amount, 0),
      paidAmount: contracts.reduce((sum, c) => sum + c.paid_amount, 0),
    };
  },
};

// ContractData에서 SavedContract 생성 (기존 호환성 유지)
export function createSavedContractFromData(
  data: ContractData,
  quotationId?: string
): Omit<SavedContract, 'id' | 'contract_number' | 'created_at' | 'updated_at'> {
  return {
    quotation_id: quotationId,
    quotation_number: data.quotation.quotationNo,
    customer_id: '',
    customer_name: data.customer.companyName,
    customer_address: data.customer.address,
    customer_ceo: data.customer.ceoName,
    project_name: data.project.name,
    contract_type: 'TOXICITY',
    start_date: data.period.startDate,
    end_date: data.period.endDate,
    total_weeks: data.period.totalWeeks,
    total_amount: data.payment.subtotal,
    paid_amount: 0,
    advance_rate: data.payment.advancePayment.rate,
    advance_amount: data.payment.advancePayment.amount,
    remaining_amount: data.payment.remainingPayment.amount,
    status: data.contract.isDraft ? 'NEGOTIATING' : 'SIGNED',
    is_draft: data.contract.isDraft,
    items_count: data.quotation.items.length,
  };
}


// ============ Additional Types ============

export interface Contract extends SavedContract {
  // Extended fields from API with relations
  title?: string;
  contractNumber?: string;
  contractType?: 'TOXICITY' | 'EFFICACY';
  totalAmount?: number;
  paidAmount?: number;
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  terms?: string;
  customer?: {
    id?: string;
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
  };
  studies?: Array<{
    id: string;
    studyNumber: string;
    testName: string;
    studyType: 'TOXICITY' | 'EFFICACY';
    status: string;
    startDate?: string;
    expectedEndDate?: string;
  }>;
  amendments?: Array<{
    id: string;
    amendmentNumber: string;
    reason: string;
    amountChange?: number;
    newTotalAmount: number;
    createdAt: string;
  }>;
  quotations?: Array<{
    id: string;
    quotationNumber: string;
    projectName: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

export interface Study {
  id: string;
  study_number: string;
  contract_id: string;
  study_type: 'TOXICITY' | 'EFFICACY';
  test_name: string;
  received_date?: string;
  start_date?: string;
  expected_end_date?: string;
  actual_end_date?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractAmendment {
  id: string;
  amendment_number: string;
  contract_id: string;
  version: number;
  reason: string;
  changes: any;
  amount_change?: number;
  new_total_amount: number;
  new_end_date?: string;
  signed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultationRecord {
  id: string;
  record_number: string;
  contract_id?: string;
  customer_id: string;
  customer_info: any;
  test_info?: any;
  substance_info?: any;
  substance_name?: string;
  storage_status?: string;
  storage_location?: string;
  client_requests?: string;
  internal_notes?: string;
  consult_date: string;
  created_at: string;
  updated_at: string;
}

// ============ Additional API Functions ============

// 계약서 목록 조회 (alias)
export async function getContracts(filters?: {
  status?: ContractStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Contract[]> {
  return contractApi.getAll(filters);
}

// 단일 계약서 조회 (alias)
export async function getContract(id: string): Promise<Contract | null> {
  return contractApi.getById(id);
}

// 계약서 수정 (alias)
export async function updateContract(id: string, data: Partial<SavedContract>): Promise<Contract> {
  return contractApi.update(id, data);
}

// 계약서 삭제 (alias)
export async function deleteContract(id: string): Promise<boolean> {
  return contractApi.delete(id);
}

// 계약서 상태 업데이트
export async function updateContractStatus(id: string, status: ContractStatus): Promise<Contract> {
  return contractApi.update(id, { status });
}

// 시험 목록 조회
export async function getStudies(filters?: {
  contractId?: string;
  status?: string;
}): Promise<Study[]> {
  const params = new URLSearchParams();
  if (filters?.contractId) params.append('contractId', filters.contractId);
  if (filters?.status) params.append('status', filters.status);
  
  const response = await contractFetch<{ data: any[] }>(`/api/studies?${params.toString()}`);
  return (response.data?.data || []).map(mapStudyFromApi);
}

// 시험 생성
export async function createStudy(data: Omit<Study, 'id' | 'study_number' | 'created_at' | 'updated_at'>): Promise<Study> {
  const response = await contractFetch<any>('/api/studies', {
    method: 'POST',
    body: JSON.stringify(mapStudyToApi(data)),
  });
  return mapStudyFromApi(response.data);
}

// 변경계약서 생성
export async function createAmendment(data: Omit<ContractAmendment, 'id' | 'amendment_number' | 'created_at' | 'updated_at'>): Promise<ContractAmendment> {
  const response = await contractFetch<any>(`/api/contracts/${data.contract_id}/amendments`, {
    method: 'POST',
    body: JSON.stringify({
      version: data.version,
      reason: data.reason,
      changes: data.changes,
      amountChange: data.amount_change,
      newTotalAmount: data.new_total_amount,
      newEndDate: data.new_end_date,
      signedDate: data.signed_date,
    }),
  });
  return mapAmendmentFromApi(response.data);
}

// 상담기록 목록 조회
export async function getConsultations(filters?: {
  customerId?: string;
  contractId?: string;
}): Promise<ConsultationRecord[]> {
  const params = new URLSearchParams();
  if (filters?.customerId) params.append('customerId', filters.customerId);
  if (filters?.contractId) params.append('contractId', filters.contractId);
  
  const response = await contractFetch<{ data: any[] }>(`/api/consultations?${params.toString()}`);
  return (response.data?.data || []).map(mapConsultationFromApi);
}

// ============ Mapping Functions ============

function mapStudyFromApi(data: any): Study {
  return {
    id: data.id,
    study_number: data.studyNumber,
    contract_id: data.contractId,
    study_type: data.studyType,
    test_name: data.testName,
    received_date: data.receivedDate,
    start_date: data.startDate,
    expected_end_date: data.expectedEndDate,
    actual_end_date: data.actualEndDate,
    status: data.status,
    notes: data.notes,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapStudyToApi(data: Partial<Study>): any {
  const result: any = {};
  if (data.contract_id !== undefined) result.contractId = data.contract_id;
  if (data.study_type !== undefined) result.studyType = data.study_type;
  if (data.test_name !== undefined) result.testName = data.test_name;
  if (data.received_date !== undefined) result.receivedDate = data.received_date;
  if (data.start_date !== undefined) result.startDate = data.start_date;
  if (data.expected_end_date !== undefined) result.expectedEndDate = data.expected_end_date;
  if (data.status !== undefined) result.status = data.status;
  if (data.notes !== undefined) result.notes = data.notes;
  return result;
}

function mapAmendmentFromApi(data: any): ContractAmendment {
  return {
    id: data.id,
    amendment_number: data.amendmentNumber,
    contract_id: data.contractId,
    version: data.version,
    reason: data.reason,
    changes: data.changes,
    amount_change: data.amountChange ? Number(data.amountChange) : undefined,
    new_total_amount: Number(data.newTotalAmount),
    new_end_date: data.newEndDate,
    signed_date: data.signedDate,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapConsultationFromApi(data: any): ConsultationRecord {
  return {
    id: data.id,
    record_number: data.recordNumber,
    contract_id: data.contractId,
    customer_id: data.customerId,
    customer_info: data.customerInfo,
    test_info: data.testInfo,
    substance_info: data.substanceInfo,
    substance_name: data.substanceName,
    storage_status: data.storageStatus,
    storage_location: data.storageLocation,
    client_requests: data.clientRequests,
    internal_notes: data.internalNotes,
    consult_date: data.consultDate,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}
