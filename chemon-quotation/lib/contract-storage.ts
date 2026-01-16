/**
 * 계약서 로컬 스토리지 관리
 */

import { ContractData } from './contract/types';

const CONTRACTS_STORAGE_KEY = 'chemon_contracts';

export interface SavedContract {
  id: string;
  quotation_id?: string;
  quotation_number: string;
  customer_name: string;
  customer_address: string;
  customer_ceo: string;
  project_name: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
  subtotal: number;
  advance_rate: number;
  advance_amount: number;
  remaining_amount: number;
  contract_date: string;
  is_draft: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
}

// 모든 계약서 조회
export function getAllContracts(): SavedContract[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 계약서 조회
export function getContractById(id: string): SavedContract | null {
  const contracts = getAllContracts();
  return contracts.find(c => c.id === id) || null;
}

// 계약서 저장
export function saveContract(contract: SavedContract): SavedContract {
  const contracts = getAllContracts();
  const existingIndex = contracts.findIndex(c => c.id === contract.id);
  
  if (existingIndex >= 0) {
    contracts[existingIndex] = { ...contract, updated_at: new Date().toISOString() };
  } else {
    contracts.unshift(contract);
  }
  
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  return contract;
}

// ContractData에서 SavedContract 생성
export function createSavedContractFromData(
  data: ContractData,
  quotationId?: string
): SavedContract {
  return {
    id: `contract-${Date.now()}`,
    quotation_id: quotationId,
    quotation_number: data.quotation.quotationNo,
    customer_name: data.customer.companyName,
    customer_address: data.customer.address,
    customer_ceo: data.customer.ceoName,
    project_name: data.project.name,
    start_date: data.period.startDate,
    end_date: data.period.endDate,
    total_weeks: data.period.totalWeeks,
    subtotal: data.payment.subtotal,
    advance_rate: data.payment.advancePayment.rate,
    advance_amount: data.payment.advancePayment.amount,
    remaining_amount: data.payment.remainingPayment.amount,
    contract_date: data.contract.date,
    is_draft: data.contract.isDraft,
    items_count: data.quotation.items.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// 계약서 삭제
export function deleteContract(id: string): boolean {
  const contracts = getAllContracts();
  const filtered = contracts.filter(c => c.id !== id);
  
  if (filtered.length === contracts.length) return false;
  
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 견적서 ID로 계약서 조회
export function getContractByQuotationId(quotationId: string): SavedContract | null {
  const contracts = getAllContracts();
  return contracts.find(c => c.quotation_id === quotationId) || null;
}

// 통계
export function getContractStats() {
  const contracts = getAllContracts();
  return {
    total: contracts.length,
    draft: contracts.filter(c => c.is_draft).length,
    final: contracts.filter(c => !c.is_draft).length,
    totalAmount: contracts.reduce((sum, c) => sum + c.subtotal, 0),
  };
}
