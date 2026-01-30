// lib/lead-api.ts
// 리드 관리 API

import { apiFetch, ApiResponse } from './api-utils';

// Re-export types
export type { ApiResponse } from './api-utils';

// 리드 유입경로 타입
export type LeadSource = 
  | 'WEBSITE'
  | 'REFERRAL'
  | 'COLD_CALL'
  | 'EXHIBITION'
  | 'ADVERTISEMENT'
  | 'PARTNER'
  | 'OTHER';

// 리드 상태 타입
export type LeadStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'LOST';

// 리드 타입
export interface Lead {
  id: string;
  leadNumber: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  department?: string;
  position?: string;
  source: LeadSource;
  inquiryType?: string;
  inquiryDetail?: string;
  expectedAmount?: number;
  expectedDate?: string;
  stageId: string;
  status: LeadStatus;
  customerId?: string;
  convertedAt?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
  stage?: PipelineStage;
  customer?: any;
  _count?: { activities: number; quotations: number };
}

export interface PipelineStage {
  id: string;
  name: string;
  code: string;
  order: number;
  color?: string;
  description?: string;
  isDefault: boolean;
  tasks?: StageTask[];
  leads?: Lead[];
  _count?: { leads: number };
}

export interface StageTask {
  id: string;
  stageId: string;
  name: string;
  order: number;
  isRequired: boolean;
  description?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  userId: string;
  type: string;
  subject: string;
  content: string;
  contactedAt: string;
  nextAction?: string;
  nextDate?: string;
}

// 리드 목록 조회
export async function getLeads(params?: {
  status?: string;
  stageId?: string;
  search?: string;
  excludeConverted?: boolean;  // 신규: 전환된 리드 제외 (Requirements 1.3)
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ leads: Lead[]; pagination: unknown }>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.stageId) query.set('stageId', params.stageId);
  if (params?.search) query.set('search', params.search);
  if (params?.excludeConverted) query.set('excludeConverted', 'true');
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  return apiFetch<{ leads: Lead[]; pagination: unknown }>(
    `/api/leads?${query.toString()}`
  );
}

// 리드 상세 조회
export async function getLead(id: string): Promise<ApiResponse<{ lead: Lead }>> {
  return apiFetch<{ lead: Lead }>(`/api/leads/${id}`);
}

// 리드 생성
export async function createLead(data: Partial<Lead>): Promise<ApiResponse<{ lead: Lead }>> {
  return apiFetch<{ lead: Lead }>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 리드 수정
export async function updateLead(id: string, data: Partial<Lead>): Promise<ApiResponse<{ lead: Lead }>> {
  return apiFetch<{ lead: Lead }>(`/api/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 리드 단계 변경
export async function updateLeadStage(id: string, stageId: string): Promise<ApiResponse<{ lead: Lead }>> {
  return apiFetch<{ lead: Lead }>(`/api/leads/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stageId }),
  });
}

// 리드 상태 변경
export async function updateLeadStatus(id: string, status: string, lostReason?: string): Promise<ApiResponse<{ lead: Lead }>> {
  return apiFetch<{ lead: Lead }>(`/api/leads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, lostReason }),
  });
}

// 리드 → 고객 전환
export async function convertLead(id: string): Promise<ApiResponse<{ lead: Lead; customer: unknown }>> {
  return apiFetch<{ lead: Lead; customer: unknown }>(
    `/api/leads/${id}/convert`,
    { method: 'POST' }
  );
}

// 리드 삭제
export async function deleteLead(id: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/api/leads/${id}`, { method: 'DELETE' });
}

// 리드 활동 추가
export async function addLeadActivity(leadId: string, data: Partial<LeadActivity>): Promise<ApiResponse<{ activity: LeadActivity }>> {
  return apiFetch<{ activity: LeadActivity }>(
    `/api/leads/${leadId}/activities`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

// 리드 태스크 완료
export async function completeLeadTask(leadId: string, taskId: string, notes?: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/api/leads/${leadId}/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

// 파이프라인 단계 목록
export async function getPipelineStages(): Promise<ApiResponse<{ stages: PipelineStage[] }>> {
  return apiFetch<{ stages: PipelineStage[] }>('/api/pipeline/stages');
}

// 파이프라인 보드 데이터
export async function getPipelineBoard(): Promise<ApiResponse<{ stages: PipelineStage[] }>> {
  return apiFetch<{ stages: PipelineStage[] }>('/api/pipeline/board');
}
