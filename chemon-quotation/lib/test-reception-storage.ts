/**
 * 시험 접수 관리
 * - 백엔드 API 연동 완료
 * - Requirements: 2.3, 2.5, 8.2
 */

import { TestReception } from '@/types/customer';
import { testReceptionApi } from './customer-data-api';

// ============================================
// API 기반 함수들
// ============================================

/**
 * 고객사별 시험 접수 조회 (API)
 */
export async function getTestReceptionsByCustomerIdAsync(customerId: string): Promise<TestReception[]> {
  try {
    return await testReceptionApi.getByCustomerId(customerId);
  } catch {
    return [];
  }
}

/**
 * 상태별 시험 접수 조회 (API)
 */
export async function getTestReceptionsByStatusAsync(status?: string): Promise<TestReception[]> {
  try {
    return await testReceptionApi.getByStatus(status);
  } catch {
    return [];
  }
}

/**
 * 시험 접수 상세 조회 (API)
 */
export async function getTestReceptionByIdAsync(id: string): Promise<TestReception | null> {
  try {
    return await testReceptionApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 시험번호로 조회 (API)
 */
export async function getTestReceptionByTestNumberAsync(testNumber: string): Promise<TestReception | null> {
  try {
    return await testReceptionApi.getByTestNumber(testNumber);
  } catch {
    return null;
  }
}

/**
 * 시험 접수 저장 (API)
 */
export async function saveTestReceptionAsync(
  customerId: string,
  reception: Omit<TestReception, 'id' | 'customer_id' | 'created_at' | 'updated_at'>
): Promise<TestReception> {
  return await testReceptionApi.create(customerId, reception);
}

/**
 * 시험 접수 수정 (API)
 */
export async function updateTestReceptionAsync(id: string, data: Partial<TestReception>): Promise<TestReception> {
  return await testReceptionApi.update(id, data);
}

/**
 * 시험 접수 상태 업데이트 (API)
 */
export async function updateTestReceptionStatusAsync(id: string, status: string): Promise<TestReception> {
  return await testReceptionApi.updateStatus(id, status);
}

/**
 * 시험 접수 삭제 (API)
 */
export async function deleteTestReceptionAsync(id: string): Promise<boolean> {
  try {
    await testReceptionApi.delete(id);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getTestReceptions(): TestReception[] {
  console.warn('getTestReceptions is deprecated. Use getTestReceptionsByCustomerIdAsync instead.');
  return [];
}

export function getTestReceptionById(id: string): TestReception | null {
  console.warn('getTestReceptionById is deprecated. Use getTestReceptionByIdAsync instead.');
  return null;
}

export function getTestReceptionsByCustomerId(customerId: string): TestReception[] {
  console.warn('getTestReceptionsByCustomerId is deprecated. Use getTestReceptionsByCustomerIdAsync instead.');
  return [];
}

export function saveTestReception(reception: TestReception): TestReception {
  console.warn('saveTestReception is deprecated. Use saveTestReceptionAsync instead.');
  return reception;
}

export function updateTestReception(id: string, data: Partial<TestReception>): TestReception | null {
  console.warn('updateTestReception is deprecated. Use updateTestReceptionAsync instead.');
  return null;
}

export function deleteTestReception(id: string): boolean {
  console.warn('deleteTestReception is deprecated. Use deleteTestReceptionAsync instead.');
  return false;
}
