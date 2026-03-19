// 시험 관리 CRUD API
import { api } from './api';
import { StudyStatus } from './study-dashboard-api';

export interface Study {
  id: string;
  studyNumber: string;
  contractId: string;
  testReceptionId?: string | null;
  studyType: string;
  testName: string;
  testItemId?: string | null;
  status: StudyStatus;
  receivedDate?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  reportDraftDate?: string | null;
  reportFinalDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // 미연결 TestReception 통합 표시용 플래그
  _isTestReception?: boolean;
  _testReceptionId?: string;
  contract?: {
    id: string;
    contractNumber: string;
    title: string;
    status: string;
    customer?: {
      id: string;
      name: string;
      company: string;
    };
  } | null;
  testReception?: {
    id: string;
    testNumber?: string;
    testTitle?: string;
    testDirector?: string;
    substanceCode?: string;
    projectCode?: string;
    substanceName?: string;
    institutionName?: string;
    totalAmount?: number;
    receptionNumber?: string;
    status: string;
    customer?: { id: string; name: string; company: string };
    requester?: { id: string; name: string };
  } | null;
}

export interface StudyListResponse {
  studies: Study[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StudyListParams {
  status?: string;
  contractId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getStudies(params?: StudyListParams): Promise<StudyListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.contractId) query.set('contractId', params.contractId);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<StudyListResponse>(`/studies${qs ? `?${qs}` : ''}`);
}

export async function getStudy(id: string): Promise<{ study: Study }> {
  return api.get<{ study: Study }>(`/studies/${id}`);
}

export async function createStudy(data: {
  contractId: string;
  testReceptionId?: string;
  studyType: string;
  testName: string;
  testItemId?: string;
  receivedDate?: string;
  startDate?: string;
  expectedEndDate?: string;
  notes?: string;
}): Promise<{ study: Study }> {
  return api.post<{ study: Study }>('/studies', data);
}

export async function updateStudy(id: string, data: Partial<Study>): Promise<{ study: Study }> {
  return api.put<{ study: Study }>(`/studies/${id}`, data);
}

export async function updateStudyStatus(id: string, status: StudyStatus): Promise<{ study: Study }> {
  // Backend uses PATCH for status changes
  const { apiFetch } = await import('./api-utils');
  const response = await apiFetch<{ study: Study }>(`/studies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!response.success) throw new Error(response.error?.message || 'Status update failed');
  return response.data as { study: Study };
}

export async function deleteStudy(id: string): Promise<void> {
  return api.delete<void>(`/studies/${id}`);
}

export async function linkTestReception(studyId: string, testReceptionId: string): Promise<{ study: Study }> {
  return api.post<{ study: Study }>(`/studies/${studyId}/link-reception`, { testReceptionId });
}

export async function unlinkTestReception(studyId: string): Promise<{ study: Study }> {
  return api.post<{ study: Study }>(`/studies/${studyId}/unlink-reception`, {});
}
