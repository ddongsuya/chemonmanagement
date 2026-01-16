/**
 * 시험 접수 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 시험 접수 데이터 관리
 * - Requirements: 2.3, 2.5, 8.2
 */

import { TestReception } from '@/types/customer';

const TEST_RECEPTIONS_STORAGE_KEY = 'chemon_test_receptions';

// 모든 시험 접수 조회
export function getAllTestReceptions(): TestReception[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(TEST_RECEPTIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 시험 접수 조회
export function getTestReceptionById(id: string): TestReception | null {
  const receptions = getAllTestReceptions();
  return receptions.find(r => r.id === id) || null;
}

// 고객사별 시험 접수 조회
export function getTestReceptionsByCustomerId(customerId: string): TestReception[] {
  const receptions = getAllTestReceptions();
  return receptions.filter(r => r.customer_id === customerId);
}

// 의뢰자별 시험 접수 조회
export function getTestReceptionsByRequesterId(requesterId: string): TestReception[] {
  const receptions = getAllTestReceptions();
  return receptions.filter(r => r.requester_id === requesterId);
}

// 계약별 시험 접수 조회
export function getTestReceptionsByContractId(contractId: string): TestReception[] {
  const receptions = getAllTestReceptions();
  return receptions.filter(r => r.contract_id === contractId);
}

// 시험 접수 저장
export function saveTestReception(reception: TestReception): TestReception {
  const receptions = getAllTestReceptions();
  const existingIndex = receptions.findIndex(r => r.id === reception.id);
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    receptions[existingIndex] = { ...reception, updated_at: now };
  } else {
    const newReception = {
      ...reception,
      created_at: reception.created_at || now,
      updated_at: now,
    };
    receptions.unshift(newReception);
  }
  
  localStorage.setItem(TEST_RECEPTIONS_STORAGE_KEY, JSON.stringify(receptions));
  return existingIndex >= 0 ? receptions[existingIndex] : receptions[0];
}

// 시험 접수 정보 수정
export function updateTestReception(id: string, updates: Partial<TestReception>): TestReception | null {
  const receptions = getAllTestReceptions();
  const index = receptions.findIndex(r => r.id === id);
  
  if (index < 0) return null;
  
  receptions[index] = {
    ...receptions[index],
    ...updates,
    id, // ID는 변경 불가
    updated_at: new Date().toISOString(),
  };
  
  localStorage.setItem(TEST_RECEPTIONS_STORAGE_KEY, JSON.stringify(receptions));
  return receptions[index];
}

// 시험 접수 상태 업데이트
export function updateTestReceptionStatus(
  id: string, 
  status: TestReception['status']
): TestReception | null {
  return updateTestReception(id, { status });
}

// 시험 접수 삭제
export function deleteTestReception(id: string): boolean {
  const receptions = getAllTestReceptions();
  const filtered = receptions.filter(r => r.id !== id);
  
  if (filtered.length === receptions.length) return false;
  
  localStorage.setItem(TEST_RECEPTIONS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 상태별 시험 접수 조회
export function getTestReceptionsByStatus(status: TestReception['status']): TestReception[] {
  const receptions = getAllTestReceptions();
  return receptions.filter(r => r.status === status);
}

// 시험번호로 조회
export function getTestReceptionByTestNumber(testNumber: string): TestReception | null {
  const receptions = getAllTestReceptions();
  return receptions.find(r => r.test_number === testNumber) || null;
}
