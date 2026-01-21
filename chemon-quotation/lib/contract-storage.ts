/**
 * 계약서 관리
 * - 백엔드 API 연동 완료
 */

import { ContractData } from './contract/types';
import { contractApi, SavedContract, createSavedContractFromData as createFromData } from './contract-api';

// Re-export types
export type { SavedContract } from './contract-api';

// ============================================
// API 기반 함수들
// ============================================

/**
 * 모든 계약서 조회 (API)
 */
export async function getAllContractsAsync(): Promise<SavedContract[]> {
  try {
    return await contractApi.getAll();
  } catch {
    return [];
  }
}

/**
 * 계약서 상세 조회 (API)
 */
export async function getContractByIdAsync(id: string): Promise<SavedContract | null> {
  try {
    return await contractApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 계약서 저장 (API)
 */
export async function saveContractAsync(contract: SavedContract): Promise<SavedContract | null> {
  try {
    if (contract.id) {
      return await contractApi.update(contract.id, contract);
    } else {
      const { id, contract_number, created_at, updated_at, ...createData } = contract;
      return await contractApi.create(createData);
    }
  } catch {
    return null;
  }
}

/**
 * 계약서 삭제 (API)
 */
export async function deleteContractAsync(id: string): Promise<boolean> {
  try {
    return await contractApi.delete(id);
  } catch {
    return false;
  }
}

/**
 * 견적서 ID로 계약서 조회 (API)
 */
export async function getContractByQuotationIdAsync(quotationId: string): Promise<SavedContract | null> {
  try {
    return await contractApi.getByQuotationId(quotationId);
  } catch {
    return null;
  }
}

/**
 * 계약서 통계 (API)
 */
export async function getContractStatsAsync() {
  try {
    return await contractApi.getStats();
  } catch {
    return {
      total: 0,
      draft: 0,
      signed: 0,
      inProgress: 0,
      completed: 0,
      totalAmount: 0,
      paidAmount: 0,
    };
  }
}

/**
 * ContractData에서 SavedContract 생성
 */
export function createSavedContractFromData(
  data: ContractData,
  quotationId?: string
): Omit<SavedContract, 'id' | 'contract_number' | 'created_at' | 'updated_at'> {
  return createFromData(data, quotationId);
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getAllContracts(): SavedContract[] {
  console.warn('getAllContracts is deprecated. Use getAllContractsAsync instead.');
  return [];
}

export function getContractById(id: string): SavedContract | null {
  console.warn('getContractById is deprecated. Use getContractByIdAsync instead.');
  return null;
}

export function saveContract(contract: SavedContract): SavedContract {
  console.warn('saveContract is deprecated. Use saveContractAsync instead.');
  return contract;
}

export function deleteContract(id: string): boolean {
  console.warn('deleteContract is deprecated. Use deleteContractAsync instead.');
  return false;
}

export function getContractByQuotationId(quotationId: string): SavedContract | null {
  console.warn('getContractByQuotationId is deprecated. Use getContractByQuotationIdAsync instead.');
  return null;
}

export function getContractStats() {
  console.warn('getContractStats is deprecated. Use getContractStatsAsync instead.');
  return { total: 0, draft: 0, final: 0, totalAmount: 0 };
}
