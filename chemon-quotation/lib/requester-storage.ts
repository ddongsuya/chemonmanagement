/**
 * 의뢰자 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 의뢰자 데이터 관리
 * - Requirements: 1.2, 1.4, 1.5, 8.1
 */

import { Requester } from '@/types/customer';

const REQUESTERS_STORAGE_KEY = 'chemon_requesters';

// 모든 의뢰자 조회
export function getAllRequesters(): Requester[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(REQUESTERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 의뢰자 조회
export function getRequesterById(id: string): Requester | null {
  const requesters = getAllRequesters();
  return requesters.find(r => r.id === id) || null;
}

// 고객사별 의뢰자 조회
export function getRequestersByCustomerId(customerId: string): Requester[] {
  const requesters = getAllRequesters();
  return requesters.filter(r => r.customer_id === customerId);
}

// 의뢰자 저장
export function saveRequester(requester: Requester): Requester {
  const requesters = getAllRequesters();
  const existingIndex = requesters.findIndex(r => r.id === requester.id);
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    requesters[existingIndex] = { ...requester, updated_at: now };
  } else {
    const newRequester = {
      ...requester,
      created_at: requester.created_at || now,
      updated_at: now,
    };
    requesters.unshift(newRequester);
  }
  
  localStorage.setItem(REQUESTERS_STORAGE_KEY, JSON.stringify(requesters));
  return existingIndex >= 0 ? requesters[existingIndex] : requesters[0];
}

// 의뢰자 정보 수정
export function updateRequester(id: string, updates: Partial<Requester>): Requester | null {
  const requesters = getAllRequesters();
  const index = requesters.findIndex(r => r.id === id);
  
  if (index < 0) return null;
  
  requesters[index] = {
    ...requesters[index],
    ...updates,
    id, // ID는 변경 불가
    updated_at: new Date().toISOString(),
  };
  
  localStorage.setItem(REQUESTERS_STORAGE_KEY, JSON.stringify(requesters));
  return requesters[index];
}

// 의뢰자 삭제 (연관 데이터 확인 후 삭제 또는 비활성화)
// hasRelatedData: 연관된 견적/계약이 있는지 여부를 외부에서 전달
export function deleteRequester(id: string, hasRelatedData: boolean = false): { success: boolean; deactivated: boolean } {
  const requesters = getAllRequesters();
  const index = requesters.findIndex(r => r.id === id);
  
  if (index < 0) return { success: false, deactivated: false };
  
  if (hasRelatedData) {
    // 연관 데이터가 있으면 비활성화 처리
    requesters[index] = {
      ...requesters[index],
      is_active: false,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(REQUESTERS_STORAGE_KEY, JSON.stringify(requesters));
    return { success: true, deactivated: true };
  } else {
    // 연관 데이터가 없으면 완전 삭제
    const filtered = requesters.filter(r => r.id !== id);
    localStorage.setItem(REQUESTERS_STORAGE_KEY, JSON.stringify(filtered));
    return { success: true, deactivated: false };
  }
}

// 활성 의뢰자만 조회
export function getActiveRequestersByCustomerId(customerId: string): Requester[] {
  const requesters = getRequestersByCustomerId(customerId);
  return requesters.filter(r => r.is_active);
}

// 주 담당자 조회
export function getPrimaryRequester(customerId: string): Requester | null {
  const requesters = getRequestersByCustomerId(customerId);
  return requesters.find(r => r.is_primary && r.is_active) || null;
}
