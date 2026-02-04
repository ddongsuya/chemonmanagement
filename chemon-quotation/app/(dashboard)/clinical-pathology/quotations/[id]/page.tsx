'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
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
        <p className="text-muted-foreground">견적서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quotation.quotationNumber}</h1>
              <Badge className={statusColors[quotation.status]}>
                {QUOTATION_STATUS_LABELS[quotation.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{quotation.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                고객 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">의뢰기관</span>
                <span className="font-medium">{quotation.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">담당자</span>
                <span>{quotation.contactName}</span>
              </div>
              {quotation.contactPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">연락처</span>
                  <span>{quotation.contactPhone}</span>
                </div>
              )}
              {quotation.contactEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이메일</span>
                  <span>{quotation.contactEmail}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 검체 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                검체 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">시험기준</span>
                <Badge variant="outline">{quotation.testStandard}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">동물 종</span>
                <span>{getAnimalSpeciesLabel(quotation.animalSpecies)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">검체 종류</span>
                <span>{quotation.sampleTypes.map(t => SAMPLE_TYPE_LABELS[t]).join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">검체 수</span>
                <span>
                  총 {quotation.totalSamples}개
                  {(quotation.maleSamples > 0 || quotation.femaleSamples > 0) && (
                    <span className="text-muted-foreground ml-2">
                      (수컷 {quotation.maleSamples}, 암컷 {quotation.femaleSamples})
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 검사항목 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                검사항목
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                      </h4>
                      <div className="space-y-1">
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                            <span>{item.code} - {item.nameKr}</span>
                            <span className="text-muted-foreground">{formatCurrency(item.amount)}원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">검사항목이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 금액 정보 */}
        <div className="space-y-6">
          {/* 금액 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>금액 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">소계</span>
                <span>{formatCurrency(quotation.subtotal)}원</span>
              </div>
              {quotation.totalQcFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">QC 비용</span>
                  <span>{formatCurrency(quotation.totalQcFee)}원</span>
                </div>
              )}
              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>할인</span>
                  <span>-{formatCurrency(quotation.discountAmount)}원</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">공급가액</span>
                <span>{formatCurrency(quotation.totalBeforeVat)}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">부가세 ({quotation.vatRate}%)</span>
                <span>{formatCurrency(quotation.vatAmount)}원</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>총액</span>
                <span className="text-purple-600">{formatCurrency(quotation.totalAmount)}원</span>
              </div>
            </CardContent>
          </Card>

          {/* 견적 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                견적 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">작성일</span>
                <span>{formatDate(quotation.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">유효기간</span>
                <span>{quotation.validDays}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">유효기한</span>
                <span>{formatDate(quotation.validUntil)}</span>
              </div>
              {quotation.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">발송일</span>
                  <span>{formatDate(quotation.sentAt)}</span>
                </div>
              )}
              {quotation.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">승인일</span>
                  <span>{formatDate(quotation.acceptedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">작성자</span>
                <span>{quotation.createdBy?.name || '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* 비고 */}
          {quotation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>비고</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* 연결된 시험의뢰서 */}
          {quotation.testRequest && (
            <Card>
              <CardHeader>
                <CardTitle>연결된 시험의뢰서</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/clinical-pathology/test-requests/${quotation.testRequest?.id}`)}
                >
                  <FlaskConical className="w-4 h-4 mr-2" />
                  {quotation.testRequest.testNumber || '시험의뢰서 보기'}
                </Button>
              </CardContent>
            </Card>
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
