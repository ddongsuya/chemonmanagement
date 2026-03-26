'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import { Button } from '@/components/ui/button';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
} from '@/components/ui/StitchTable';
import {
  Edit,
  Copy,
  FileText,
  Building2,
  Calendar,
  ArrowLeft,
  FileSignature,
  Loader2,
  ClipboardList,
  Beaker,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import {
  formatCurrency,
  formatDate,
} from '@/lib/utils';
import { efficacyQuotationApi } from '@/lib/efficacy-api';
import { SavedEfficacyQuotation, EfficacyQuotationStatus } from '@/types/efficacy';
import { useToast } from '@/hooks/use-toast';

// 효력시험 견적 상태 옵션
const EFFICACY_STATUSES = [
  { value: 'draft', label: '작성중' },
  { value: 'sent', label: '발송완료' },
  { value: 'accepted', label: '수주' },
  { value: 'rejected', label: '실주' },
];

// 상태 라벨 가져오기
const getEfficacyStatusLabel = (status: string): string => {
  const found = EFFICACY_STATUSES.find((s) => s.value === status);
  return found ? found.label : status;
};

export default function EfficacyQuotationDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<SavedEfficacyQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API에서 견적 데이터 로드
  useEffect(() => {
    const loadQuotation = async () => {
      try {
        const id = params.id as string;
        const data = await efficacyQuotationApi.getById(id);
        setQuotation(data);
      } catch (error) {
        console.error('Failed to load efficacy quotation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuotation();
  }, [params.id]);

  // 상태 변경 핸들러
  const handleStatusChange = async (newStatus: string) => {
    if (!quotation) return;

    try {
      const updated = await efficacyQuotationApi.updateStatus(
        quotation.id,
        newStatus as EfficacyQuotationStatus
      );
      setQuotation(updated);
      toast({
        title: '상태 변경',
        description: `견적서 상태가 '${getEfficacyStatusLabel(newStatus)}'로 변경되었습니다.`,
      });
    } catch (error) {
      toast({
        title: '상태 변경 실패',
        description: '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 복사 핸들러
  const handleCopy = async () => {
    if (!quotation) return;

    try {
      const copied = await efficacyQuotationApi.copy(quotation.id);
      if (copied) {
        toast({
          title: '복사 완료',
          description: `견적서가 ${copied.quotation_number}로 복사되었습니다.`,
        });
      } else {
        toast({
          title: '복사 실패',
          description: '견적서 복사 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '견적서 복사 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-medium mb-2">견적서를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-4">
          요청한 효력시험 견적서가 존재하지 않습니다.
        </p>
        <Button asChild>
          <Link href="/efficacy-quotations">견적 목록으로</Link>
        </Button>
      </div>
    );
  }

  // 카테고리별 항목 그룹화
  const itemsByCategory = quotation.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof quotation.items>);

  return (
    <div>
      <StitchPageHeader
        label="EFFICACY QUOTATION DETAIL"
        title={quotation.quotation_number}
        description={`${quotation.customer_name} | ${quotation.project_name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="bg-white border-none rounded-xl">
              <Link href="/efficacy-quotations">
                <ArrowLeft className="w-4 h-4 mr-2" /> 목록
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="bg-white border-none rounded-xl">
              <Link href={`/efficacy-quotations/${params.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" /> 수정
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="bg-white border-none rounded-xl">
              <Copy className="w-4 h-4 mr-2" /> 복사
            </Button>
            <Button variant="outline" size="sm" className="bg-white border-none rounded-xl">
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" asChild className="bg-white border-none rounded-xl">
              <Link href={`/contract/new?efficacyQuotationId=${params.id}`}>
                <FileSignature className="w-4 h-4 mr-2" /> 계약서 생성
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="bg-white border-none rounded-xl">
              <Link href={`/consultation/new?efficacyQuotationId=${params.id}`}>
                <ClipboardList className="w-4 h-4 mr-2" /> 상담기록지
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 상세 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold mb-4">기본 정보</h3>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">고객사:</span>
                  <span className="font-bold">{quotation.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">유효기간:</span>
                  <span>{formatDate(quotation.valid_until)}까지</span>
                </div>
              </div>
              {quotation.notes && (
                <div className="mt-4 pt-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">특이사항:</span>
                  <p className="mt-1">{quotation.notes}</p>
                </div>
              )}
            </div>
          </StitchCard>

          {/* 모델 정보 */}
          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Beaker className="w-5 h-5 text-primary" />
              효력시험 모델
            </h3>
            <div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">모델명:</span>
                  <span className="font-bold">{quotation.model_name}</span>
                  <StitchBadge variant="neutral">{quotation.model_category}</StitchBadge>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">적응증:</span>
                  <span>{quotation.indication}</span>
                </div>
              </div>
            </div>
          </StitchCard>

          {/* 시험 항목 */}
          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold mb-4">시험 항목</h3>
            <div>
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span>{category}</span>
                    <span className="text-sm text-slate-500">
                      소계: {formatCurrency(quotation.subtotal_by_category[category] || 0)}
                    </span>
                  </h4>
                  <StitchTable>
                    <StitchTableHeader>
                      <StitchTableRow>
                        <StitchTableHead>항목명</StitchTableHead>
                        <StitchTableHead className="text-center">단가</StitchTableHead>
                        <StitchTableHead className="text-center">수량</StitchTableHead>
                        <StitchTableHead className="text-center">횟수</StitchTableHead>
                        <StitchTableHead className="text-right">금액</StitchTableHead>
                      </StitchTableRow>
                    </StitchTableHeader>
                    <StitchTableBody>
                      {items.map((item) => (
                        <StitchTableRow
                          key={item.id}
                          className={item.is_default ? 'bg-emerald-50/50' : ''}
                        >
                          <StitchTableCell>
                            <div className="flex flex-col">
                              <span className={item.is_default ? 'font-bold' : ''}>
                                {item.item_name}
                              </span>
                              {item.usage_note && (
                                <span className="text-xs text-slate-500">
                                  {item.usage_note}
                                </span>
                              )}
                            </div>
                          </StitchTableCell>
                          <StitchTableCell className="text-center">
                            {formatCurrency(item.unit_price)}
                            <span className="text-xs text-slate-500 ml-1">
                              {item.unit}
                            </span>
                          </StitchTableCell>
                          <StitchTableCell className="text-center">
                            {item.quantity}
                          </StitchTableCell>
                          <StitchTableCell className="text-center">
                            {item.multiplier}
                          </StitchTableCell>
                          <StitchTableCell className="text-right font-bold">
                            {formatCurrency(item.amount)}
                          </StitchTableCell>
                        </StitchTableRow>
                      ))}
                    </StitchTableBody>
                  </StitchTable>
                </div>
              ))}
            </div>
          </StitchCard>
        </div>

        {/* 우측: 상태 및 금액 */}
        <div className="space-y-6">
          {/* 상태 */}
          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold mb-4">상태</h3>
            <div>
              <div className="space-y-3">
                <StitchBadge status={quotation.status.toUpperCase()} className="text-sm">
                  {getEfficacyStatusLabel(quotation.status)}
                </StitchBadge>
                <Select
                  value={quotation.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="bg-white border-none rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFICACY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </StitchCard>

          {/* 금액 요약 */}
          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <WonSign className="w-5 h-5 text-primary" />
              금액 요약
            </h3>
            <div className="space-y-3">
              {/* 카테고리별 소계 */}
              {Object.entries(quotation.subtotal_by_category).map(
                ([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-slate-600">{category}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                )
              )}

              <div className="pt-3 flex justify-between">
                <span className="text-slate-600">소계</span>
                <span>{formatCurrency(quotation.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">VAT (10%)</span>
                <span>{formatCurrency(quotation.vat)}</span>
              </div>

              <div className="pt-3 flex justify-between text-lg font-bold">
                <span>합계</span>
                <span className="text-primary">
                  {formatCurrency(quotation.grand_total)}
                </span>
              </div>
            </div>
          </StitchCard>

          {/* 이력 */}
          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold mb-4">이력</h3>
            <div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">작성일</span>
                  <span>{formatDate(quotation.created_at.split('T')[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">최종수정</span>
                  <span>{formatDate(quotation.updated_at.split('T')[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">유효기간</span>
                  <span>{quotation.valid_days}일</span>
                </div>
              </div>
            </div>
          </StitchCard>

          {/* 연결된 문서 */}
          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold mb-4">문서 생성</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-white border-none rounded-xl" asChild>
                <Link href={`/contract/new?efficacyQuotationId=${params.id}`}>
                  <FileSignature className="w-4 h-4 mr-2" />
                  계약서 생성
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-white border-none rounded-xl" asChild>
                <Link href={`/consultation/new?efficacyQuotationId=${params.id}`}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  상담기록지 생성
                </Link>
              </Button>
            </div>
          </StitchCard>
        </div>
      </div>
    </div>
  );
}
