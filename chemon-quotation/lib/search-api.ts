// 통합 검색 API
import { apiFetch } from './api-utils';

export interface UnifiedSearchResult {
  id: string;
  type: 'TOXICITY' | 'EFFICACY' | 'CLINICAL_PATHOLOGY';
  quotationNumber: string;
  customerName: string;
  projectName?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface SearchResponse {
  results: UnifiedSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    toxicity: number;
    efficacy: number;
    clinicalPathology: number;
    total: number;
  };
}

export interface SearchParams {
  query: string;
  types?: ('TOXICITY' | 'EFFICACY' | 'CLINICAL_PATHOLOGY')[];
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function unifiedSearch(params: SearchParams): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.query);
  
  if (params.types && params.types.length > 0) {
    searchParams.append('types', params.types.join(','));
  }
  if (params.status) {
    searchParams.append('status', params.status);
  }
  if (params.dateFrom) {
    searchParams.append('dateFrom', params.dateFrom);
  }
  if (params.dateTo) {
    searchParams.append('dateTo', params.dateTo);
  }
  if (params.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const response = await apiFetch<{ success: boolean; data: SearchResponse }>(
    `/api/search?${searchParams.toString()}`
  );
  
  if (!response || !response.data) {
    throw new Error('검색 결과를 가져오는데 실패했습니다.');
  }
  
  return response.data;
}

export const TYPE_LABELS: Record<string, string> = {
  TOXICITY: '독성시험',
  EFFICACY: '효력시험',
  CLINICAL_PATHOLOGY: '임상병리',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '발송완료',
  ACCEPTED: '승인됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
  CONVERTED: '전환됨',
};
