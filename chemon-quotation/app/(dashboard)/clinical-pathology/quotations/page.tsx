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
import { Plus, Search, FileText, MoreHorizontal, Copy, Trash2, Send, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getQuotations, deleteQuotation, sendQuotation, acceptQuotation, rejectQuotation, copyQuotation } from '@/lib/clinical-pathology-api';
import type { ClinicalQuotation, ClinicalQuotationStatus } from '@/types/clinical-pathology';
import { QUOTATION_STATUS_LABELS } from '@/types/clinical-pathology';
import { useToast } from '@/hooks/use-toast';

export default function ClinicalQuotationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<ClinicalQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadQuotations();
  }, [statusFilter, pagination.page]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const result = await getQuotations({
        status: statusFilter !== 'all' ? statusFilter as ClinicalQuotationStatus : undefined,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setQuotations(result.quotations);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load quotations:', error);
      toast({ title: '오류', description: '견적서 목록을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadQuotations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteQuotation(id);
      toast({ title: '성공', description: '견적서가 삭제되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleSend = async (id: string) => {
    try {
      await sendQuotation(id);
      toast({ title: '성공', description: '견적서가 발송되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '발송에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptQuotation(id);
      toast({ title: '성공', description: '견적서가 승인되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '승인에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectQuotation(id);
      toast({ title: '성공', description: '견적서가 거절되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '거절에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCopy = async (id: string) => {
    try {
      const newQuotation = await copyQuotation(id);
      toast({ title: '성공', description: '견적서가 복사되었습니다.' });
      router.push(`/clinical-pathology/quotations/${newQuotation.id}`);
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '복사에 실패했습니다.', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getStatusBadge = (status: ClinicalQuotationStatus) => {
    const variantMap: Record<string, 'neutral' | 'info' | 'success' | 'error' | 'warning' | 'primary'> = {
      DRAFT: 'neutral',
      SENT: 'info',
      ACCEPTED: 'success',
      REJECTED: 'error',
      EXPIRED: 'warning',
      CONVERTED: 'primary',
    };
    return (
      <StitchBadge variant={variantMap[status] || 'neutral'}>
        {QUOTATION_STATUS_LABELS[status]}
      </StitchBadge>
    );
  };

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="임상병리검사 견적서"
        label="QUOTATIONS"
        description="견적서 목록 및 관리"
        actions={
          <Button className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold" onClick={() => router.push('/clinical-pathology/quotations/new')}>
            <Plus className="h-4 w-4 mr-2" />
            새 견적서
          </Button>
        }
      />

      <StitchCard variant="surface-low" padding="lg">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <input
                placeholder="견적번호, 고객명 검색..."
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
                <SelectItem value="SENT">발송완료</SelectItem>
                <SelectItem value="ACCEPTED">승인됨</SelectItem>
                <SelectItem value="REJECTED">거절됨</SelectItem>
                <SelectItem value="CONVERTED">의뢰서 전환됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">견적서가 없습니다.</p>
              <Button className="mt-4 bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold" onClick={() => router.push('/clinical-pathology/quotations/new')}>
                새 견적서 작성
              </Button>
            </div>
          ) : (
            <>
              <StitchTable>
                <StitchTableHeader>
                  <StitchTableRow>
                    <StitchTableHead>견적번호</StitchTableHead>
                    <StitchTableHead>고객사</StitchTableHead>
                    <StitchTableHead>담당자</StitchTableHead>
                    <StitchTableHead>검체수</StitchTableHead>
                    <StitchTableHead className="text-right">금액</StitchTableHead>
                    <StitchTableHead>상태</StitchTableHead>
                    <StitchTableHead>작성일</StitchTableHead>
                    <StitchTableHead className="w-[50px]"></StitchTableHead>
                  </StitchTableRow>
                </StitchTableHeader>
                <StitchTableBody>
                  {quotations.map((quotation) => (
                    <StitchTableRow
                      key={quotation.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/clinical-pathology/quotations/${quotation.id}`)}
                    >
                      <StitchTableCell className="font-bold text-primary">{quotation.quotationNumber}</StitchTableCell>
                      <StitchTableCell className="font-bold text-slate-900">{quotation.customerName}</StitchTableCell>
                      <StitchTableCell className="text-slate-700">{quotation.contactName}</StitchTableCell>
                      <StitchTableCell className="text-slate-700">{quotation.totalSamples}개</StitchTableCell>
                      <StitchTableCell className="text-right font-bold text-slate-900">{formatCurrency(quotation.totalAmount)}</StitchTableCell>
                      <StitchTableCell>{getStatusBadge(quotation.status)}</StitchTableCell>
                      <StitchTableCell className="text-slate-500">{new Date(quotation.createdAt).toLocaleDateString('ko-KR')}</StitchTableCell>
                      <StitchTableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {quotation.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleSend(quotation.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                발송
                              </DropdownMenuItem>
                            )}
                            {quotation.status === 'SENT' && (
                              <>
                                <DropdownMenuItem onClick={() => handleAccept(quotation.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  승인
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(quotation.id)}>
                                  <X className="h-4 w-4 mr-2" />
                                  거절
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleCopy(quotation.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              복사
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {quotation.status === 'DRAFT' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(quotation.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </StitchTableCell>
                    </StitchTableRow>
                  ))}
                </StitchTableBody>
              </StitchTable>

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
