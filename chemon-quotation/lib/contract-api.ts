// lib/contract-api.ts
// 계약 관리 API

import { getAccessToken } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'API Error');
  return data;
}

// 계약 타입
export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  contractType: 'TOXICITY' | 'EFFICACY';
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  terms?: string;
  notes?: string;
  createdAt: string;
  customer?: any;
  quotations?: any[];
  amendments?: ContractAmendment[];
  studies?: Study[];
  _count?: { studies: number; amendments: number };
}

export interface ContractAmendment {
  id: string;
  amendmentNumber: string;
  contractId: string;
  version: number;
  reason: string;
  changes: any;
  amountChange?: number;
  newTotalAmount: number;
  newEndDate?: string;
  signedDate?: string;
  createdAt: string;
}

export interface Study {
  id: string;
  studyNumber: string;
  contractId: string;
  studyType: string;
  testName: string;
  testItemId?: string;
  receivedDate?: string;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status: string;
  reportDraftDate?: string;
  reportFinalDate?: string;
  notes?: string;
  createdAt: string;
  contract?: Contract;
}

export interface ConsultationRecord {
  id: string;
  recordNumber: string;
  contractId?: string;
  customerId: string;
  customerInfo: any;
  testInfo?: any;
  substanceInfo?: any;
  substanceName?: string;
  storageStatus?: string;
  storageLocation?: string;
  clientRequests?: string;
  internalNotes?: string;
  consultDate: string;
  createdAt: string;
  customer?: any;
  contract?: Contract;
}

// 계약 목록 조회
export async function getContracts(params?: {
  status?: string;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.customerId) query.set('customerId', params.customerId);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  return authFetch<{ success: boolean; data: { contracts: Contract[]; pagination: any } }>(
    `/api/contracts?${query.toString()}`
  );
}

// 계약 상세 조회
export async function getContract(id: string) {
  return authFetch<{ success: boolean; data: { contract: Contract } }>(`/api/contracts/${id}`);
}

// 계약 생성
export async function createContract(data: Partial<Contract> & { quotationIds?: string[] }) {
  return authFetch<{ success: boolean; data: { contract: Contract } }>('/api/contracts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 계약 수정
export async function updateContract(id: string, data: Partial<Contract>) {
  return authFetch<{ success: boolean; data: { contract: Contract } }>(`/api/contracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 계약 상태 변경
export async function updateContractStatus(id: string, status: string) {
  return authFetch<{ success: boolean; data: { contract: Contract } }>(`/api/contracts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// 계약 삭제
export async function deleteContract(id: string) {
  return authFetch<{ success: boolean }>(`/api/contracts/${id}`, { method: 'DELETE' });
}

// 변경계약서 생성
export async function createAmendment(contractId: string, data: Partial<ContractAmendment>) {
  return authFetch<{ success: boolean; data: { amendment: ContractAmendment } }>(
    `/api/contracts/${contractId}/amendments`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

// 변경계약서 목록
export async function getAmendments(contractId: string) {
  return authFetch<{ success: boolean; data: { amendments: ContractAmendment[] } }>(
    `/api/contracts/${contractId}/amendments`
  );
}

// 시험 목록 조회
export async function getStudies(params?: {
  status?: string;
  contractId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.contractId) query.set('contractId', params.contractId);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  return authFetch<{ success: boolean; data: { studies: Study[]; pagination: any } }>(
    `/api/studies?${query.toString()}`
  );
}

// 시험 상세 조회
export async function getStudy(id: string) {
  return authFetch<{ success: boolean; data: { study: Study } }>(`/api/studies/${id}`);
}

// 시험 생성
export async function createStudy(data: Partial<Study>) {
  return authFetch<{ success: boolean; data: { study: Study } }>('/api/studies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 시험 수정
export async function updateStudy(id: string, data: Partial<Study>) {
  return authFetch<{ success: boolean; data: { study: Study } }>(`/api/studies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 시험 상태 변경
export async function updateStudyStatus(id: string, status: string) {
  return authFetch<{ success: boolean; data: { study: Study } }>(`/api/studies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// 시험 삭제
export async function deleteStudy(id: string) {
  return authFetch<{ success: boolean }>(`/api/studies/${id}`, { method: 'DELETE' });
}

// 상담기록 목록 조회
export async function getConsultations(params?: {
  customerId?: string;
  contractId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.customerId) query.set('customerId', params.customerId);
  if (params?.contractId) query.set('contractId', params.contractId);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  return authFetch<{ success: boolean; data: { records: ConsultationRecord[]; pagination: any } }>(
    `/api/consultations?${query.toString()}`
  );
}

// 상담기록 상세 조회
export async function getConsultation(id: string) {
  return authFetch<{ success: boolean; data: { record: ConsultationRecord } }>(`/api/consultations/${id}`);
}

// 상담기록 생성
export async function createConsultation(data: Partial<ConsultationRecord>) {
  return authFetch<{ success: boolean; data: { record: ConsultationRecord } }>('/api/consultations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 상담기록 수정
export async function updateConsultation(id: string, data: Partial<ConsultationRecord>) {
  return authFetch<{ success: boolean; data: { record: ConsultationRecord } }>(`/api/consultations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 상담기록 삭제
export async function deleteConsultation(id: string) {
  return authFetch<{ success: boolean }>(`/api/consultations/${id}`, { method: 'DELETE' });
}
