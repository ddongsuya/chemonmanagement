// API 기본 설정 - 공통 유틸리티 사용
import { apiFetch, ApiResponse } from './api-utils';

// API 요청 헬퍼 (기존 호환성 유지)
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch<T>(endpoint, options);
  
  if (!response.success) {
    throw new Error(response.error?.message || 'API Error');
  }

  // 기존 API는 data를 직접 반환하는 형태였으므로 호환성 유지
  // 응답이 { success: true, data: ... } 형태인 경우 data 반환
  // 응답이 직접 데이터인 경우 그대로 반환
  return (response.data !== undefined ? response.data : response) as T;
}

// GET 요청
export function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

// POST 요청
export function post<T>(endpoint: string, data: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT 요청
export function put<T>(endpoint: string, data: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE 요청
export function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

// API 객체 (편의를 위한 래퍼)
export const api = {
  get,
  post,
  put,
  delete: del
};

// Re-export types
export type { ApiResponse } from './api-utils';
