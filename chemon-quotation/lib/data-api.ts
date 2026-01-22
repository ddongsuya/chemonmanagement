// Data API functions for quotations and customers
import { apiFetch, buildQueryString, ApiResponse, PaginatedResult } from './api-utils';

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

// Re-export types from api-utils
export type { ApiResponse, PaginatedResult } from './api-utils';

// ============ Quotation APIs ============

/**
 * Get quotations list with pagination and filters
 */
export async function getQuotations(
  filters: QuotationFilters = {}
): Promise<ApiResponse<PaginatedResult<Quotation>>> {
  const query = buildQueryString(filters);
  return apiFetch<PaginatedResult<Quotation>>(`/api/quotations?${query}`);
}

/**
 * Get quotation by ID
 */
export async function getQuotationById(id: string): Promise<ApiResponse<Quotation>> {
  return apiFetch<Quotation>(`/api/quotations/${id}`);
}

/**
 * Create a new quotation
 */
export async function createQuotation(
  data: CreateQuotationDTO
): Promise<ApiResponse<Quotation>> {
  return apiFetch<Quotation>('/api/quotations', {
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
  return apiFetch<Quotation>(`/api/quotations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete quotation (soft delete)
 */
export async function deleteQuotationApi(id: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/api/quotations/${id}`, {
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
  return apiFetch<PaginatedResult<Customer>>(`/api/customers?${query}`);
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<ApiResponse<Customer>> {
  return apiFetch<Customer>(`/api/customers/${id}`);
}

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CreateCustomerDTO
): Promise<ApiResponse<Customer>> {
  return apiFetch<Customer>('/api/customers', {
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
  return apiFetch<Customer>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete customer (soft delete)
 */
export async function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/api/customers/${id}`, {
    method: 'DELETE',
  });
}
