// Data API functions for quotations and customers
import { getAccessToken, getRefreshToken, clearTokens } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Token storage key
const ACCESS_TOKEN_KEY = 'access_token';

// ============ Types ============

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type QuotationType = 'TOXICITY' | 'EFFICACY' | 'CLINICAL_PATHOLOGY';

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationType: QuotationType;
  userId: string;
  customerId: string | null;
  customerName: string;
  projectName: string;
  modality: string | null;
  modelId: string | null;
  modelCategory: string | null;
  indication: string | null;
  items: unknown[];
  subtotalTest: number | null;
  subtotalAnalysis: number | null;
  subtotal: number | null;
  discountRate: number | null;
  discountAmount: number | null;
  vat: number | null;
  totalAmount: number;
  validDays: number;
  validUntil: string | null;
  notes: string | null;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customer?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

export interface CreateQuotationDTO {
  quotationType: QuotationType;
  customerId?: string | null;
  customerName: string;
  projectName: string;
  modality?: string | null;
  modelId?: string | null;
  modelCategory?: string | null;
  indication?: string | null;
  items: unknown[];
  subtotalTest?: number | null;
  subtotalAnalysis?: number | null;
  subtotal?: number | null;
  discountRate?: number | null;
  discountAmount?: number | null;
  vat?: number | null;
  totalAmount: number;
  validDays?: number;
  validUntil?: string | null;
  notes?: string | null;
  status?: QuotationStatus;
}

export interface UpdateQuotationDTO {
  customerId?: string | null;
  customerName?: string;
  projectName?: string;
  modality?: string | null;
  modelId?: string | null;
  modelCategory?: string | null;
  indication?: string | null;
  items?: unknown[];
  subtotalTest?: number | null;
  subtotalAnalysis?: number | null;
  subtotal?: number | null;
  discountRate?: number | null;
  discountAmount?: number | null;
  vat?: number | null;
  totalAmount?: number;
  validDays?: number;
  validUntil?: string | null;
  notes?: string | null;
  status?: QuotationStatus;
}

export interface QuotationFilters {
  type?: QuotationType;
  status?: QuotationStatus;
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCustomerDTO {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerDTO {
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ API Helper ============

// Try to refresh the access token
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

    const data: ApiResponse<{ accessToken: string }> = await response.json();
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

async function dataFetch<T>(
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
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle token expiration - try to refresh
    if (response.status === 401 && accessToken) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request with new token
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
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.',
      },
    };
  }
}

function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

// ============ Quotation APIs ============

/**
 * Get quotations list with pagination and filters
 */
export async function getQuotations(
  filters: QuotationFilters = {}
): Promise<ApiResponse<PaginatedResult<Quotation>>> {
  const query = buildQueryString(filters);
  return dataFetch<PaginatedResult<Quotation>>(`/api/quotations?${query}`);
}

/**
 * Get quotation by ID
 */
export async function getQuotationById(id: string): Promise<ApiResponse<Quotation>> {
  return dataFetch<Quotation>(`/api/quotations/${id}`);
}

/**
 * Create a new quotation
 */
export async function createQuotation(
  data: CreateQuotationDTO
): Promise<ApiResponse<Quotation>> {
  return dataFetch<Quotation>('/api/quotations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update quotation
 */
export async function updateQuotation(
  id: string,
  data: UpdateQuotationDTO
): Promise<ApiResponse<Quotation>> {
  return dataFetch<Quotation>(`/api/quotations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete quotation (soft delete)
 */
export async function deleteQuotationApi(id: string): Promise<ApiResponse<void>> {
  return dataFetch<void>(`/api/quotations/${id}`, {
    method: 'DELETE',
  });
}

// ============ Customer APIs ============

/**
 * Get customers list with pagination and filters
 */
export async function getCustomers(
  filters: CustomerFilters = {}
): Promise<ApiResponse<PaginatedResult<Customer>>> {
  const query = buildQueryString(filters);
  return dataFetch<PaginatedResult<Customer>>(`/api/customers?${query}`);
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<ApiResponse<Customer>> {
  return dataFetch<Customer>(`/api/customers/${id}`);
}

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CreateCustomerDTO
): Promise<ApiResponse<Customer>> {
  return dataFetch<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update customer
 */
export async function updateCustomer(
  id: string,
  data: UpdateCustomerDTO
): Promise<ApiResponse<Customer>> {
  return dataFetch<Customer>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete customer (soft delete)
 */
export async function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  return dataFetch<void>(`/api/customers/${id}`, {
    method: 'DELETE',
  });
}
