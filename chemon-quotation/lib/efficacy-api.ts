/**
 * 효력시험 견적서 API 함수
 * - localStorage에서 백엔드 API로 전환
 */

import { getAccessToken, getRefreshToken, clearTokens } from './auth-api';
import { SavedEfficacyQuotation, EfficacyQuotationStatus } from '@/types/efficacy';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ACCESS_TOKEN_KEY = 'access_token';

// ============ API Helper ============

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

async function efficacyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (response.status === 401 && accessToken) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newAccessToken = getAccessToken();
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return retryResponse.json();
      }
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
    };
  }
}

// ============ Mapping Functions ============

function mapEfficacyQuotationFromApi(data: any): SavedEfficacyQuotation {
  return {
    id: data.id,
    quotation_number: data.quotationNumber,
    quotation_type: 'efficacy',
    customer_id: data.customerId || '',
    customer_name: data.customerName,
    project_name: data.projectName,
    model_id: data.modelId || '',
    model_name: data.modelCategory || '',
    model_category: data.modelCategory || '',
    indication: data.indication || '',
    items: data.items || [],
    subtotal_by_category: {},
    subtotal: Number(data.subtotal) || 0,
    vat: Number(data.vat) || 0,
    grand_total: Number(data.totalAmount) || 0,
    valid_days: data.validDays || 30,
    valid_until: data.validUntil || '',
    notes: data.notes || '',
    status: (data.status?.toLowerCase() || 'draft') as EfficacyQuotationStatus,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapEfficacyQuotationToApi(data: Partial<SavedEfficacyQuotation>): any {
  const result: any = {
    quotationType: 'EFFICACY',
  };
  
  if (data.customer_id !== undefined) result.customerId = data.customer_id || null;
  if (data.customer_name !== undefined) result.customerName = data.customer_name;
  if (data.project_name !== undefined) result.projectName = data.project_name;
  if (data.model_id !== undefined) result.modelId = data.model_id;
  if (data.model_category !== undefined) result.modelCategory = data.model_category;
  if (data.indication !== undefined) result.indication = data.indication;
  if (data.items !== undefined) result.items = data.items;
  if (data.subtotal !== undefined) result.subtotal = data.subtotal;
  if (data.vat !== undefined) result.vat = data.vat;
  if (data.grand_total !== undefined) result.totalAmount = data.grand_total;
  if (data.valid_days !== undefined) result.validDays = data.valid_days;
  if (data.valid_until !== undefined) result.validUntil = data.valid_until;
  if (data.notes !== undefined) result.notes = data.notes;
  if (data.status !== undefined) result.status = data.status.toUpperCase();
  
  return result;
}

// ============ Efficacy Quotation API ============

export const efficacyQuotationApi = {
  // 모든 효력시험 견적서 조회
  async getAll(filters?: {
    status?: EfficacyQuotationStatus;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SavedEfficacyQuotation[]> {
    const params = new URLSearchParams();
    params.append('type', 'EFFICACY');
    if (filters?.status) params.append('status', filters.status.toUpperCase());
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await efficacyFetch<{ data: any[]; pagination: any }>(`/api/quotations?${params.toString()}`);
    return (response.data?.data || []).map(mapEfficacyQuotationFromApi);
  },

  // 단일 효력시험 견적서 조회
  async getById(id: string): Promise<SavedEfficacyQuotation | null> {
    try {
      const response = await efficacyFetch<any>(`/api/quotations/${id}`);
      return response.data ? mapEfficacyQuotationFromApi(response.data) : null;
    } catch {
      return null;
    }
  },

  // 견적번호로 조회
  async getByNumber(quotationNumber: string): Promise<SavedEfficacyQuotation | null> {
    const response = await efficacyFetch<{ data: any[] }>(`/api/quotations?search=${quotationNumber}&type=EFFICACY`);
    const found = response.data?.data?.find((q: any) => q.quotationNumber === quotationNumber);
    return found ? mapEfficacyQuotationFromApi(found) : null;
  },

  // 효력시험 견적서 생성
  async create(data: Omit<SavedEfficacyQuotation, 'id' | 'quotation_number' | 'created_at' | 'updated_at'>): Promise<SavedEfficacyQuotation> {
    const response = await efficacyFetch<any>('/api/quotations', {
      method: 'POST',
      body: JSON.stringify(mapEfficacyQuotationToApi(data)),
    });
    return mapEfficacyQuotationFromApi(response.data);
  },

  // 효력시험 견적서 수정
  async update(id: string, data: Partial<SavedEfficacyQuotation>): Promise<SavedEfficacyQuotation> {
    const response = await efficacyFetch<any>(`/api/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapEfficacyQuotationToApi(data)),
    });
    return mapEfficacyQuotationFromApi(response.data);
  },

  // 상태 업데이트
  async updateStatus(id: string, status: EfficacyQuotationStatus): Promise<SavedEfficacyQuotation> {
    return this.update(id, { status });
  },

  // 효력시험 견적서 삭제
  async delete(id: string): Promise<boolean> {
    const response = await efficacyFetch<void>(`/api/quotations/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  },

  // 효력시험 견적서 복사
  async copy(sourceId: string): Promise<SavedEfficacyQuotation | null> {
    const source = await this.getById(sourceId);
    if (!source) return null;

    const { id, quotation_number, created_at, updated_at, ...copyData } = source;
    return this.create({
      ...copyData,
      status: 'draft',
    });
  },

  // 고객별 효력시험 견적서 조회
  async getByCustomerId(customerId: string): Promise<SavedEfficacyQuotation[]> {
    return this.getAll({ customerId });
  },

  // 상태별 효력시험 견적서 조회
  async getByStatus(status: EfficacyQuotationStatus): Promise<SavedEfficacyQuotation[]> {
    return this.getAll({ status });
  },

  // 통계
  async getStats(): Promise<{
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    totalAmount: number;
    acceptedAmount: number;
  }> {
    const quotations = await this.getAll({ limit: 1000 });
    
    return {
      total: quotations.length,
      draft: quotations.filter(q => q.status === 'draft').length,
      sent: quotations.filter(q => q.status === 'sent').length,
      accepted: quotations.filter(q => q.status === 'accepted').length,
      rejected: quotations.filter(q => q.status === 'rejected').length,
      totalAmount: quotations.reduce((sum, q) => sum + q.grand_total, 0),
      acceptedAmount: quotations
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + q.grand_total, 0),
    };
  },
};

// ============ Validation Functions (기존 유지) ============

export type ValidationErrorCode = 'E001' | 'E002' | 'E003' | 'E004' | 'E005' | 'E006';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateEfficacyQuotation(data: {
  customer_id: string;
  project_name: string;
  model_id: string | null;
  items: Array<{ quantity: number; multiplier: number }>;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.customer_id || data.customer_id.trim() === '') {
    errors.push({
      code: 'E001',
      message: '고객사를 선택해주세요',
      field: 'customer_id',
    });
  }

  if (!data.project_name || data.project_name.trim() === '') {
    errors.push({
      code: 'E002',
      message: '프로젝트명을 입력해주세요',
      field: 'project_name',
    });
  }

  if (!data.model_id || data.model_id.trim() === '') {
    errors.push({
      code: 'E003',
      message: '효력시험 모델을 선택해주세요',
      field: 'model_id',
    });
  }

  if (!data.items || data.items.length === 0) {
    errors.push({
      code: 'E004',
      message: '최소 1개 이상의 항목을 선택해주세요',
      field: 'items',
    });
  }

  if (data.items && data.items.length > 0) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      
      if (item.quantity < 1) {
        errors.push({
          code: 'E005',
          message: `수량은 1 이상이어야 합니다 (항목 ${i + 1})`,
          field: `items[${i}].quantity`,
        });
      }
      
      if (item.multiplier < 1) {
        errors.push({
          code: 'E006',
          message: `횟수는 1 이상이어야 합니다 (항목 ${i + 1})`,
          field: `items[${i}].multiplier`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
