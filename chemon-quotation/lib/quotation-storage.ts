/**
 * 견적서 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 견적 데이터 관리
 */

import { Quotation, QuotationItem } from '@/types';

const QUOTATIONS_STORAGE_KEY = 'chemon_quotations';

export interface SavedQuotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  project_name: string;
  modality: string;
  status: 'draft' | 'submitted' | 'won' | 'lost' | 'expired';
  valid_days: number;
  valid_until: string;
  items: QuotationItem[];
  subtotal_test: number;
  subtotal_analysis: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// 모든 견적서 조회
export function getAllQuotations(): SavedQuotation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 견적서 조회
export function getQuotationById(id: string): SavedQuotation | null {
  const quotations = getAllQuotations();
  return quotations.find(q => q.id === id) || null;
}

// 견적번호로 조회
export function getQuotationByNumber(quotationNumber: string): SavedQuotation | null {
  const quotations = getAllQuotations();
  return quotations.find(q => q.quotation_number === quotationNumber) || null;
}

// 견적서 저장
export function saveQuotation(quotation: SavedQuotation): SavedQuotation {
  const quotations = getAllQuotations();
  const existingIndex = quotations.findIndex(q => q.id === quotation.id);
  
  if (existingIndex >= 0) {
    quotations[existingIndex] = { ...quotation, updated_at: new Date().toISOString() };
  } else {
    quotations.unshift(quotation); // 최신 항목을 앞에 추가
  }
  
  localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations));
  return quotation;
}

// 견적서 삭제
export function deleteQuotation(id: string): boolean {
  const quotations = getAllQuotations();
  const filtered = quotations.filter(q => q.id !== id);
  
  if (filtered.length === quotations.length) return false;
  
  localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 견적서 상태 업데이트
export function updateQuotationStatus(id: string, status: SavedQuotation['status']): SavedQuotation | null {
  const quotations = getAllQuotations();
  const index = quotations.findIndex(q => q.id === id);
  
  if (index < 0) return null;
  
  quotations[index] = {
    ...quotations[index],
    status,
    updated_at: new Date().toISOString(),
  };
  
  localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations));
  return quotations[index];
}

// 고객별 견적서 조회
export function getQuotationsByCustomer(customerId: string): SavedQuotation[] {
  const quotations = getAllQuotations();
  return quotations.filter(q => q.customer_id === customerId);
}

// 상태별 견적서 조회
export function getQuotationsByStatus(status: SavedQuotation['status']): SavedQuotation[] {
  const quotations = getAllQuotations();
  return quotations.filter(q => q.status === status);
}

// 통계 계산
export function getQuotationStats() {
  const quotations = getAllQuotations();
  
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthQuotations = quotations.filter(q => q.created_at.startsWith(thisMonth));
  
  return {
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    submitted: quotations.filter(q => q.status === 'submitted').length,
    won: quotations.filter(q => q.status === 'won').length,
    lost: quotations.filter(q => q.status === 'lost').length,
    expired: quotations.filter(q => q.status === 'expired').length,
    monthlyCount: thisMonthQuotations.length,
    monthlyTotal: thisMonthQuotations.reduce((sum, q) => sum + q.total_amount, 0),
    totalAmount: quotations.reduce((sum, q) => sum + q.total_amount, 0),
    wonAmount: quotations.filter(q => q.status === 'won').reduce((sum, q) => sum + q.total_amount, 0),
  };
}
