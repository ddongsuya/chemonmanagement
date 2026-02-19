/**
 * 견적서 관리
 * - 백엔드 API 연동 완료
 */

import { Quotation, QuotationItem } from '@/types';
import {
  getQuotations,
  getQuotationById as getQuotationByIdApi,
  createQuotation,
  updateQuotation,
  deleteQuotationApi,
  CreateQuotationDTO,
  UpdateQuotationDTO,
  QuotationFilters,
} from './data-api';

export interface SavedQuotation {
  id: string;
  quotation_number: string;
  quotation_type: 'toxicity' | 'efficacy';
  customer_id: string;
  customer_name: string;
  project_name: string;
  modality?: string;
  items: QuotationItem[];
  subtotal: number;
  discount_rate: number;
  discount_amount: number;
  vat: number;
  total_amount: number;
  valid_days: number;
  valid_until: string;
  notes: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
}

// ============================================
// API 기반 함수들
// ============================================

/**
 * 모든 견적서 조회 (API)
 */
export async function getAllQuotationsAsync(filters?: QuotationFilters): Promise<SavedQuotation[]> {
  try {
    const response = await getQuotations(filters);
    if (response.success && response.data) {
      return response.data.data.map(mapApiToSavedQuotation);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * 견적서 상세 조회 (API)
 */
export async function getQuotationByIdAsync(id: string): Promise<SavedQuotation | null> {
  try {
    const response = await getQuotationByIdApi(id);
    if (response.success && response.data) {
      return mapApiToSavedQuotation(response.data);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 견적서 저장 (API)
 */
export async function saveQuotationAsync(quotation: SavedQuotation): Promise<SavedQuotation | null> {
  try {
    if (quotation.id) {
      // 기존 견적서 업데이트
      const updateData = mapSavedToUpdateDTO(quotation);
      const response = await updateQuotation(quotation.id, updateData);
      if (response.success && response.data) {
        return mapApiToSavedQuotation(response.data);
      }
    } else {
      // 새 견적서 생성
      const createData = mapSavedToCreateDTO(quotation);
      const response = await createQuotation(createData);
      if (response.success && response.data) {
        return mapApiToSavedQuotation(response.data);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 견적서 삭제 (API)
 */
export async function deleteQuotationAsync(id: string): Promise<boolean> {
  try {
    const response = await deleteQuotationApi(id);
    return response.success;
  } catch {
    return false;
  }
}

/**
 * 견적서 통계 (API)
 */
export async function getQuotationStatsAsync(): Promise<{
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
}> {
  try {
    const response = await getQuotations({ limit: 1000 });
    if (response.success && response.data) {
      const quotations = response.data.data;
      return {
        total: response.data.pagination.total,
        draft: quotations.filter(q => q.status === 'DRAFT').length,
        sent: quotations.filter(q => q.status === 'SENT').length,
        accepted: quotations.filter(q => q.status === 'ACCEPTED').length,
        rejected: quotations.filter(q => q.status === 'REJECTED').length,
      };
    }
    return { total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0 };
  } catch {
    return { total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0 };
  }
}

// ============================================
// Mapping Functions
// ============================================

function mapApiToSavedQuotation(api: any): SavedQuotation {
  return {
    id: api.id,
    quotation_number: api.quotationNumber,
    quotation_type: api.quotationType?.toLowerCase() || 'toxicity',
    customer_id: api.customerId || '',
    customer_name: api.customerName || api.customer?.name || '',
    project_name: api.projectName,
    modality: api.modality,
    items: api.items || [],
    subtotal: Number(api.subtotal) || 0,
    discount_rate: Number(api.discountRate) || 0,
    discount_amount: Number(api.discountAmount) || 0,
    vat: Number(api.vat) || 0,
    total_amount: Number(api.totalAmount) || 0,
    valid_days: api.validDays || 30,
    valid_until: api.validUntil || '',
    notes: api.notes || '',
    status: api.status?.toLowerCase() || 'draft',
    created_at: api.createdAt,
    updated_at: api.updatedAt,
  };
}

function mapSavedToCreateDTO(saved: SavedQuotation): CreateQuotationDTO {
  return {
    quotationType: saved.quotation_type === 'efficacy' ? 'EFFICACY' : 'TOXICITY',
    customerId: saved.customer_id || null,
    customerName: saved.customer_name,
    projectName: saved.project_name,
    modality: saved.modality || null,
    items: saved.items,
    subtotal: saved.subtotal,
    discountRate: saved.discount_rate,
    discountAmount: saved.discount_amount,
    vat: saved.vat,
    totalAmount: saved.total_amount,
    validDays: saved.valid_days,
    notes: saved.notes || null,
    status: saved.status?.toUpperCase() as any || 'DRAFT',
  };
}

function mapSavedToUpdateDTO(saved: SavedQuotation): UpdateQuotationDTO {
  return {
    customerId: saved.customer_id || null,
    customerName: saved.customer_name,
    projectName: saved.project_name,
    modality: saved.modality || null,
    items: saved.items,
    subtotal: saved.subtotal,
    discountRate: saved.discount_rate,
    discountAmount: saved.discount_amount,
    vat: saved.vat,
    totalAmount: saved.total_amount,
    validDays: saved.valid_days,
    notes: saved.notes || null,
    status: saved.status?.toUpperCase() as any,
  };
}

/**
 * 고객사별 견적서 조회 (API)
 */
export async function getQuotationsByCustomerAsync(customerId: string): Promise<SavedQuotation[]> {
  try {
    const response = await getQuotations({ customerId });
    if (response.success && response.data) {
      return response.data.data.map(mapApiToSavedQuotation);
    }
    return [];
  } catch {
    return [];
  }
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getAllQuotations(): SavedQuotation[] {
  console.warn('getAllQuotations is deprecated. Use getAllQuotationsAsync instead.');
  return [];
}

export function getQuotationById(id: string): SavedQuotation | null {
  console.warn('getQuotationById is deprecated. Use getQuotationByIdAsync instead.');
  return null;
}

export function saveQuotation(quotation: SavedQuotation): SavedQuotation {
  console.warn('saveQuotation is deprecated. Use saveQuotationAsync instead.');
  return quotation;
}

export function deleteQuotation(id: string): boolean {
  console.warn('deleteQuotation is deprecated. Use deleteQuotationAsync instead.');
  return false;
}

export function updateQuotationStatus(id: string, status: string): SavedQuotation | null {
  console.warn('updateQuotationStatus is deprecated. Use saveQuotationAsync instead.');
  return null;
}

export function getQuotationStats() {
  console.warn('getQuotationStats is deprecated. Use getQuotationStatsAsync instead.');
  return { total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0 };
}
