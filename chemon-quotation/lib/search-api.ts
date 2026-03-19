// 통합 검색 API — 웹앱 전체 데이터 검색
import { apiFetch } from './api-utils';

export type SearchCategory = 'customer' | 'quotation' | 'contract' | 'study' | 'test_reception' | 'consultation' | 'lead';

export interface GlobalSearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  status?: string;
  date: string;
  href: string;
  meta?: Record<string, any>;
}

export interface SearchResponse {
  results: GlobalSearchResult[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: Record<SearchCategory, number>;
}

export interface SearchParams {
  query: string;
  categories?: SearchCategory[];
  page?: number;
  limit?: number;
}

export async function globalSearch(params: SearchParams): Promise<SearchResponse> {
  const sp = new URLSearchParams();
  sp.set('q', params.query);
  if (params.categories?.length) sp.set('categories', params.categories.join(','));
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));

  const response = await apiFetch<SearchResponse>(`/api/search?${sp.toString()}`);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || '검색에 실패했습니다.');
  }
  return response.data;
}

export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  customer: '고객사',
  quotation: '견적서',
  contract: '계약',
  study: '시험',
  test_reception: '시험접수',
  consultation: '상담',
  lead: '리드',
};

// 하위 호환
export const TYPE_LABELS: Record<string, string> = {
  TOXICITY: '독성시험',
  EFFICACY: '효력시험',
  CLINICAL_PATHOLOGY: '임상병리',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중', SENT: '발송완료', ACCEPTED: '승인됨', REJECTED: '거절됨',
  EXPIRED: '만료됨', CONVERTED: '전환됨',
  REGISTERED: '등록', IN_PROGRESS: '진행중', COMPLETED: '완료', SUSPENDED: '중단',
  received: '접수', in_progress: '진행중', completed: '완료', cancelled: '취소',
  LEAD: '리드', PROSPECT: '잠재고객', CUSTOMER: '고객', VIP: 'VIP', INACTIVE: '비활성',
  NEW: '신규', CONTACTED: '접촉', QUALIFIED: '검증', PROPOSAL: '제안', NEGOTIATION: '협상',
  WON: '수주', LOST: '실주',
  SIGNED: '체결', TEST_RECEIVED: '시험접수', INVOICED: '청구',
};

export { globalSearch as unifiedSearch };
export type { GlobalSearchResult as UnifiedSearchResult };
