'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  FileText,
  Building2,
  User,
  Calendar,
  FlaskConical,
  FileSignature,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getQuotationById,
  deleteQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  copyQuotation,
  convertToTestRequest,
} from '@/lib/clinical-pathology-api';
import type { ClinicalQuotation } from '@/types/clinical-pathology';
import {
  QUOTATION_STATUS_LABELS,
  SAMPLE_TYPE_LABELS,
  CATEGORY_LABELS,
  ANIMAL_SPECIES,
} from '@/types/clinical-pathology';

const statusVariantMap: Record<string, 'neutral' | 'info' | 'success' | 'error' | 'warning' | 'primary'> = {
  DRAFT: 'neutral',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning',
  CONVERTED: 'primary',
};

export default function ClinicalQuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<ClinicalQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadQuotation();
    }
  }, [params.id]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const data = await getQuotationById(params.id as string);
      setQuotation(data);
    } catch (error) {
      toast({ title: '오류', description: '견적서를 불러오는데 실패했습니다.', variant: 'destructive' });
      router.push('/clinical-pathology/quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      await sendQuotation(quotation.id);
      toast({ title: '성공', description: '견적서가 발송되었습니다.' });
      loadQuotation();
    } catch (error) {
      toast({ title: '오류', description: '발송에 실패했습니다.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      await acceptQuotation(quotation.id);
      toast({ title: '성공', description: '견적서가 승인되었습니다.' });
      loadQuotation();
    } catch (error) {
      toast({ title: '오류', description: '승인에 실패했습니다.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      await rejectQuotation(quotation.id);
      toast({ title: '성공', description: '견적서가 거절되었습니다.' });
      loadQuotation();
    } catch (error) {
      toast({ title: '오류', description: '거절에 실패했습니다.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      const newQuotation = await copyQuotation(quotation.id);
      toast({ title: '성공', description: '견적서가 복사되었습니다.' });
      router.push(`/clinical-pathology/quotations/${newQuotation.id}`);
    } catch (error) {
      toast({ title: '오류', description: '복사에 실패했습니다.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      await deleteQuotation(quotation.id);
      toast({ title: '성공', description: '견적서가 삭제되었습니다.' });
      router.push('/clinical-pathology/quotations');
    } catch (error) {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleConvertToTestRequest = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      const testRequest = await convertToTestRequest(quotation.id);
      toast({ title: '성공', description: '시험의뢰서로 전환되었습니다.' });
      router.push(`/clinical-pathology/test-requests/${testRequest.id}`);
    } catch (error) {
      toast({ title: '오류', description: '전환에 실패했습니다.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateContract = () => {
    if (!quotation) return;
    router.push(`/contract/new?clinicalQuotationId=${quotation.id}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAnimalSpeciesLabel = (value: string) => {
    return ANIMAL_SPECIES.find(s => s.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">견적서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{quotation.quotationNumber}</h1>
              <StitchBadge variant={statusVariantMap[quotation.status] || 'neutral'}>
                {QUOTATION_STATUS_LABELS[quotation.status]}
              </StitchBadge>
            </div>
            <p className="text-slate-500">{quotation.customerName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quotation.status === 'DRAFT' && (
            <Button onClick={handleSend} disabled={actionLoading}>
              <Send className="w-4 h-4 mr-2" />
              발송
            </Button>
          )}
          {quotation.status === 'SENT' && (
            <>
              <Button variant="outline" onClick={handleReject} disabled={actionLoading}>
                <XCircle className="w-4 h-4 mr-2" />
                거절
              </Button>
              <Button onClick={handleAccept} disabled={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                승인
              </Button>
            </>
          )}
          {quotation.status === 'ACCEPTED' && !quotation.testRequest && (
            <>
              <Button variant="outline" onClick={handleCreateContract} disabled={actionLoading}>
                <FileSignature className="w-4 h-4 mr-2" />
                계약서 작성
              </Button>
              <Button onClick={handleConvertToTestRequest} disabled={actionLoading}>
                <FlaskConical className="w-4 h-4 mr-2" />
                시험의뢰서 전환
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                복사
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 기본 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 고객 정보 */}
          <StitchCard variant="surface-low" padding="lg">
            <div className="mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                고객 정보
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">의뢰기관</span>
                <span className="font-bold text-slate-900">{quotation.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">담당자</span>
                <span className="text-slate-700">{quotation.contactName}</span>
              </div>
              {quotation.contactPhone && (
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">연락처</span>
                  <span className="text-slate-700">{quotation.contactPhone}</span>
                </div>
              )}
              {quotation.contactEmail && (
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이메일</span>
                  <span className="text-slate-700">{quotation.contactEmail}</span>
                </div>
              )}
            </div>
          </StitchCard>

          {/* 검체 정보 */}
          <StitchCard variant="surface-low" padding="lg">
            <div className="mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                검체 정보
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시험기준</span>
                <StitchBadge variant="neutral">{quotation.testStandard}</StitchBadge>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">동물 종</span>
                <span className="text-slate-700">{getAnimalSpeciesLabel(quotation.animalSpecies)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">검체 종류</span>
                <span className="text-slate-700">{quotation.sampleTypes.map(t => SAMPLE_TYPE_LABELS[t]).join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">검체 수</span>
                <span className="text-slate-700">
                  총 {quotation.totalSamples}개
                  {(quotation.maleSamples > 0 || quotation.femaleSamples > 0) && (
                    <span className="text-slate-500 ml-2">
                      (수컷 {quotation.maleSamples}, 암컷 {quotation.femaleSamples})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </StitchCard>

          {/* 검사항목 */}
          <StitchCard variant="surface-low" padding="lg">
            <div className="mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                검사항목
              </h3>
            </div>
            <div>
              {quotation.items && quotation.items.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(
                    quotation.items.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, typeof quotation.items>)
                  ).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                      </h4>
                      <div className="space-y-1">
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm py-2">
                            <span className="text-slate-700">{item.code} - {item.nameKr}</span>
                            <span className="text-slate-500">{formatCurrency(item.amount)}원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">검사항목이 없습니다.</p>
              )}
            </div>
          </StitchCard>
        </div>

        {/* 오른쪽: 금액 정보 */}
        <div className="space-y-6">
          {/* 금액 요약 */}
          <StitchCard variant="surface-low" padding="lg">
            <div className="mb-4">
              <h3 className="text-lg font-bold">금액 정보</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">소계</span>
                <span className="text-slate-700">{formatCurrency(quotation.subtotal)}원</span>
              </div>
              {quotation.totalQcFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">QC 비용</span>
                  <span className="text-slate-700">{formatCurrency(quotation.totalQcFee)}원</span>
                </div>
              )}
              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-[11px] font-bold uppercase tracking-widest">할인</span>
                  <span>-{formatCurrency(quotation.discountAmount)}원</span>
                </div>
              )}
              <div className="h-px bg-slate-200/60" />
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">공급가액</span>
                <span className="text-slate-700">{formatCurrency(quotation.totalBeforeVat)}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">부가세 ({quotation.vatRate}%)</span>
                <span className="text-slate-700">{formatCurrency(quotation.vatAmount)}원</span>
              </div>
              <div className="h-px bg-slate-200/60" />
              <div className="flex justify-between text-lg font-black">
                <span>총액</span>
                <span className="text-primary">{formatCurrency(quotation.totalAmount)}원</span>
              </div>
            </div>
          </StitchCard>

          {/* 견적 정보 */}
          <StitchCard variant="surface-low" padding="lg">
            <div className="mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                견적 정보
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">작성일</span>
                <span className="text-slate-700">{formatDate(quotation.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">유효기간</span>
                <span className="text-slate-700">{quotation.validDays}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">유효기한</span>
                <span className="text-slate-700">{formatDate(quotation.validUntil)}</span>
              </div>
              {quotation.sentAt && (
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">발송일</span>
                  <span className="text-slate-700">{formatDate(quotation.sentAt)}</span>
                </div>
              )}
              {quotation.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">승인일</span>
                  <span className="text-slate-700">{formatDate(quotation.acceptedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">작성자</span>
                <span className="text-slate-700">{quotation.createdBy?.name || '-'}</span>
              </div>
            </div>
          </StitchCard>

          {/* 비고 */}
          {quotation.notes && (
            <StitchCard variant="surface-low" padding="lg">
              <div className="mb-4">
                <h3 className="text-lg font-bold">비고</h3>
              </div>
              <p className="text-sm whitespace-pre-wrap text-slate-700">{quotation.notes}</p>
            </StitchCard>
          )}

          {/* 연결된 시험의뢰서 */}
          {quotation.testRequest && (
            <StitchCard variant="surface-low" padding="lg">
              <div className="mb-4">
                <h3 className="text-lg font-bold">연결된 시험의뢰서</h3>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => router.push(`/clinical-pathology/test-requests/${quotation.testRequest?.id}`)}
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                {quotation.testRequest.testNumber || '시험의뢰서 보기'}
              </Button>
            </StitchCard>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>견적서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 견적서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
