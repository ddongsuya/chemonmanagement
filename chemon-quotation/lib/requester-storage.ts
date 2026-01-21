/**
 * 의뢰자 관리
 * - 백엔드 API 연동 완료
 * - Requirements: 1.2, 1.4, 1.5, 8.1
 */

import { Requester } from '@/types/customer';
import { requesterApi } from './customer-data-api';

// ============================================
// API 기반 함수들
// ============================================

/**
 * 고객사별 의뢰자 목록 조회 (API)
 */
export async function getRequestersByCustomerIdAsync(customerId: string, activeOnly = false): Promise<Requester[]> {
  try {
    return await requesterApi.getByCustomerId(customerId, activeOnly);
  } catch {
    return [];
  }
}

/**
 * 의뢰자 상세 조회 (API)
 */
export async function getRequesterByIdAsync(id: string): Promise<Requester | null> {
  try {
    return await requesterApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 의뢰자 저장 (API)
 */
export async function saveRequesterAsync(
  customerId: string,
  requester: Omit<Requester, 'id' | 'customer_id' | 'created_at' | 'updated_at'>
): Promise<Requester> {
  return await requesterApi.create(customerId, requester);
}

/**
 * 의뢰자 수정 (API)
 */
export async function updateRequesterAsync(id: string, data: Partial<Requester>): Promise<Requester> {
  return await requesterApi.update(id, data);
}

/**
 * 의뢰자 삭제 (API)
 */
export async function deleteRequesterAsync(id: string): Promise<{ success: boolean; deactivated: boolean }> {
  const result = await requesterApi.delete(id);
  return { success: result.deleted || result.deactivated, deactivated: result.deactivated };
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getRequesters(): Requester[] {
  console.warn('getRequesters is deprecated. Use getRequestersByCustomerIdAsync instead.');
  return [];
}

export function getRequesterById(id: string): Requester | null {
  console.warn('getRequesterById is deprecated. Use getRequesterByIdAsync instead.');
  return null;
}

export function getRequestersByCustomerId(customerId: string): Requester[] {
  console.warn('getRequestersByCustomerId is deprecated. Use getRequestersByCustomerIdAsync instead.');
  return [];
}

export function getActiveRequestersByCustomerId(customerId: string): Requester[] {
  console.warn('getActiveRequestersByCustomerId is deprecated. Use getRequestersByCustomerIdAsync with activeOnly=true instead.');
  return [];
}

export function saveRequester(requester: Requester): Requester {
  console.warn('saveRequester is deprecated. Use saveRequesterAsync instead.');
  return requester;
}

export function updateRequester(id: string, data: Partial<Requester>): Requester | null {
  console.warn('updateRequester is deprecated. Use updateRequesterAsync instead.');
  return null;
}

export function deleteRequester(id: string, hasRelatedData = false): { success: boolean; deactivated: boolean } {
  console.warn('deleteRequester is deprecated. Use deleteRequesterAsync instead.');
  return { success: false, deactivated: false };
}
