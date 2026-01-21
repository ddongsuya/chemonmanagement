// Excel Import/Export API Client
import { api } from './api';

export type ExportType = 'leads' | 'quotations' | 'contracts' | 'studies' | 'customers';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  quotationType?: 'TOXICITY' | 'EFFICACY';
}

export interface ExportResponse {
  filename: string;
  downloadUrl: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 데이터 내보내기
export async function exportData(type: ExportType, filters?: ExportFilters): Promise<ExportResponse> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.quotationType) params.append('quotationType', filters.quotationType);
  
  const queryString = params.toString();
  const url = `/excel/export/${type}${queryString ? `?${queryString}` : ''}`;
  return api.get(url);
}

// 데이터 가져오기
export async function importData(type: ExportType, file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const response = await fetch(`${API_BASE_URL}/api/excel/import/${type}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || '가져오기 실패');
  }
  return data.data;
}

// 템플릿 다운로드
export async function getTemplate(type: ExportType): Promise<ExportResponse> {
  return api.get(`/excel/template/${type}`);
}

// 파일 다운로드 헬퍼
export function downloadFile(downloadUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = `${API_BASE_URL}${downloadUrl}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
