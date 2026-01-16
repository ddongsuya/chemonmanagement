// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 페이지네이션
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 필터 옵션
export interface QuotationFilters {
  status?: string;
  modality?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}
