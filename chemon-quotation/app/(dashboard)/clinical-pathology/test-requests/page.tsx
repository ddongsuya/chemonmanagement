'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StitchBadge } from '@/components/ui/StitchBadge';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import { StitchCard } from '@/components/ui/StitchCard';
import {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
} from '@/components/ui/StitchTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ClipboardList, MoreHorizontal, Play, CheckCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getTestRequests, submitTestRequest, startTestRequest, completeTestRequest, cancelTestRequest } from '@/lib/clinical-pathology-api';
import type { ClinicalTestRequest, ClinicalTestRequestStatus } from '@/types/clinical-pathology';
import { REQUEST_STATUS_LABELS } from '@/types/clinical-pathology';
import { useToast } from '@/hooks/use-toast';

export default function ClinicalTestRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ClinicalTestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadRequests();
  }, [statusFilter, pagination.page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const result = await getTestRequests({
        status: statusFilter !== 'all' ? statusFilter as ClinicalTestRequestStatus : undefined,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setRequests(result.requests);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load test requests:', error);
      toast({ title: '오류', description: '시험의뢰서 목록을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadRequests();
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitTestRequest(id);
      toast({ title: '성공', description: '시험의뢰서가 제출되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '제출에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startTestRequest(id);
      toast({ title: '성공', description: '시험이 시작되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '시작에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTestRequest(id);
      toast({ title: '성공', description: '시험이 완료되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '완료 처리에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('정말 취소하시겠습니까?')) return;
    try {
      await cancelTestRequest(id);
      toast({ title: '성공', description: '시험의뢰서가 취소되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '취소에 실패했습니다.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: ClinicalTestRequestStatus) => {
    const variantMap: Record<string, 'neutral' | 'info' | 'success' | 'error' | 'warning' | 'primary'> = {
      DRAFT: 'neutral',
      SUBMITTED: 'info',
      RECEIVED: 'info',
      IN_PROGRESS: 'primary',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return (
      <StitchBadge variant={variantMap[status] || 'neutral'}>
        {REQUEST_STATUS_LABELS[status]}
      </StitchBadge>
    );
  };

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="시험의뢰서"
        label="TEST REQUESTS"
        description="임상병리검사 시험의뢰서 목록 및 관리"
      />

      <StitchCard variant="surface-low" padding="lg">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <input
                placeholder="시험번호, 고객명 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm bg-white border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button variant="outline" className="rounded-xl" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white border-none rounded-xl">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="DRAFT">작성중</SelectItem>
                <SelectItem value="SUBMITTED">제출됨</SelectItem>
                <SelectItem value="RECEIVED">접수완료</SelectItem>
                <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">시험의뢰서가 없습니다.</p>
              <p className="text-sm text-slate-500 mt-2">
                승인된 견적서에서 시험의뢰서를 생성할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              {/* 모바일: 카드 리스트 */}
              {/* TODO: /clinical-pathology/test-requests/[id] 상세 페이지 미구현. 클릭 시 404 가능성 있음. 별도 이슈로 처리 예정. */}
              <div className="md:hidden space-y-3">
                {requests.map((request) => (
                  <StitchCard
                    key={request.id}
                    variant="elevated"
                    hover
                    padding="sm"
                    className="touch-manipulation cursor-pointer"
                    onClick={() => router.push(`/clinical-pathology/test-requests/${request.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500">{request.testNumber || '-'}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="font-medium text-sm mb-1 truncate">{request.customerName}</div>
                    <div className="text-xs text-slate-500 mb-2">
                      {[request.contactName, `${request.totalSamples}검체`, request.quotation?.quotationNumber].filter(Boolean).join(' · ')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(request.requestDate).toLocaleDateString('ko-KR')}
                    </div>
                  </StitchCard>
                ))}
              </div>

              {/* 데스크톱: 테이블 */}
              <div className="hidden md:block">
              <StitchTable>
                <StitchTableHeader>
                  <StitchTableRow>
                    <StitchTableHead>시험번호</StitchTableHead>
                    <StitchTableHead>견적번호</StitchTableHead>
                    <StitchTableHead>고객사</StitchTableHead>
                    <StitchTableHead>담당자</StitchTableHead>
                    <StitchTableHead>검체수</StitchTableHead>
                    <StitchTableHead>상태</StitchTableHead>
                    <StitchTableHead>의뢰일</StitchTableHead>
                    <StitchTableHead className="w-[50px]"></StitchTableHead>
                  </StitchTableRow>
                </StitchTableHeader>
                <StitchTableBody>
                  {requests.map((request) => (
                    <StitchTableRow
                      key={request.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/clinical-pathology/test-requests/${request.id}`)}
                    >
                      <StitchTableCell className="font-bold text-primary">
                        {request.testNumber || '-'}
                      </StitchTableCell>
                      <StitchTableCell>{request.quotation?.quotationNumber || '-'}</StitchTableCell>
                      <StitchTableCell className="font-bold text-slate-900">{request.customerName}</StitchTableCell>
                      <StitchTableCell className="text-slate-700">{request.contactName}</StitchTableCell>
                      <StitchTableCell className="text-slate-700">{request.totalSamples}개</StitchTableCell>
                      <StitchTableCell>{getStatusBadge(request.status)}</StitchTableCell>
                      <StitchTableCell className="text-slate-500">{new Date(request.requestDate).toLocaleDateString('ko-KR')}</StitchTableCell>
                      <StitchTableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {request.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleSubmit(request.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                제출
                              </DropdownMenuItem>
                            )}
                            {request.status === 'RECEIVED' && (
                              <DropdownMenuItem onClick={() => handleStart(request.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                시험 시작
                              </DropdownMenuItem>
                            )}
                            {request.status === 'IN_PROGRESS' && (
                              <DropdownMenuItem onClick={() => handleComplete(request.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                완료
                              </DropdownMenuItem>
                            )}
                            {!['COMPLETED', 'CANCELLED'].includes(request.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleCancel(request.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  취소
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </StitchTableCell>
                    </StitchTableRow>
                  ))}
                </StitchTableBody>
              </StitchTable>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-slate-500">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </StitchCard>
    </div>
  );
}
