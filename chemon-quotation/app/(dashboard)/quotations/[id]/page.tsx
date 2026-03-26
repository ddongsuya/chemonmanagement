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
  StitchTableBody,
  StitchTableCell,
  StitchTableHead,
  StitchTableHeader,
  StitchTableRow,
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
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
} from '@/lib/utils';
import { QUOTATION_STATUSES } from '@/lib/constants';
import { getQuotationById, updateQuotation, Quotation, QuotationStatus } from '@/lib/data-api';
import { useToast } from '@/hooks/use-toast';

// SavedQuotation 타입 정의 (기존 호환성 유지)
interface SavedQuotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  project_name: string;
  modality: string;
  status: string;
  valid_days: number;
  valid_until: string;
  items: any[];
  subtotal_test: number;
  subtotal_analysis: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

function mapQuotationToSaved(q: Quotation): SavedQuotation {
  return {
    id: q.id,
    quotation_number: q.quotationNumber,
    customer_id: q.customerId || '',
    customer_name: q.customerName,
    project_name: q.projectName,
    modality: q.modality || '',
    status: q.status.toLowerCase(),
    valid_days: q.validDays,
    valid_until: q.validUntil || '',
    items: q.items as any[],
    subtotal_test: Number(q.subtotalTest) || 0,
    subtotal_analysis: Number(q.subtotalAnalysis) || 0,
    discount_rate: Number(q.discountRate) || 0,
    discount_amount: Number(q.discountAmount) || 0,
    total_amount: Number(q.totalAmount),
    notes: q.notes || '',
    created_at: q.createdAt,
    updated_at: q.updatedAt,
    created_by: q.userId,
  };
}

export default function QuotationDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<SavedQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API에서 견적 데이터 로드
  useEffect(() => {
    const loadQuotation = async () => {
      try {
        const id = params.id as string;
        const response = await getQuotationById(id);
        if (response.success && response.data) {
          setQuotation(mapQuotationToSaved(response.data));
        }
      } catch (error) {
        console.error('Failed to load quotation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuotation();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!quotation) return;
    
    try {
      const response = await updateQuotation(quotation.id, { 
        status: newStatus.toUpperCase() as QuotationStatus 
      });
      if (response.success && response.data) {
        setQuotation(mapQuotationToSaved(response.data));
        toast({
          title: '상태 변경',
          description: `견적서 상태가 '${getStatusLabel(newStatus)}'로 변경되었습니다.`,
        });
      }
    } catch (error) {
      toast({
        title: '상태 변경 실패',
        description: '상태 변경 중 오류가 발생했습니다.',
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
        <p className="text-muted-foreground mb-4">요청한 견적서가 존재하지 않습니다.</p>
        <Button asChild>
          <Link href="/quotations">견적 목록으로</Link>
        </Button>
      </div>
    );
  }

  // 시험 항목 변환 — v2 구조와 레거시 구조 모두 지원
  const items = (quotation.items || []).map((item: any, idx: number) => {
    // v2 구조: { itemId, name, category, price, isOption, parentId, sortOrder, tkConfig }
    // 레거시 구조: { id, test: { test_name, glp_status }, amount, is_option }
    const isV2 = item.itemId !== undefined;

    return {
      id: item.id || item.itemId || `item-${idx}`,
      name: isV2
        ? (item.name || '시험항목')
        : (item.test?.test_name?.split('\n')[0] || item.testName || item.test_name || '시험항목'),
      category: isV2 ? (item.category || '-') : (item.test?.glp_status || item.glpStatus || 'N/A'),
      amount: isV2 ? (item.price || 0) : (item.amount || item.totalPrice || item.total_price || 0),
      is_option: item.is_option || item.isOption || false,
    };
  });

  return (
    <div>
      <StitchPageHeader
        label="QUOTATION DETAIL"
        title={quotation.quotation_number}
        description={`${quotation.customer_name} | ${quotation.project_name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href="/quotations">
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">목록</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/quotations/${params.id}/edit`}>
                <Edit className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">수정</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Copy className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">복사</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              <FileText className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/contract/new?quotationId=${params.id}`}>
                <FileSignature className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">계약서 생성</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/consultation/new?quotationId=${params.id}`}>
                <ClipboardList className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">상담기록지</span>
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
            <h2 className="text-lg font-bold mb-4">기본 정보</h2>
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
                <div className="flex items-center gap-2">
                  <StitchBadge variant="neutral">{quotation.modality}</StitchBadge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">작성자:</span>
                  <span>{quotation.created_by || '사용자'}</span>
                </div>
              </div>
              {quotation.notes && (
                <div className="mt-4 pt-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">특이사항:</span>
                  <p className="mt-1">{quotation.notes}</p>
                </div>
              )}
          </StitchCard>

          {/* 시험 항목 */}
          <StitchCard variant="surface-low">
            <h2 className="text-lg font-bold mb-4">시험 항목</h2>
              <div className="overflow-x-auto">
                <StitchTable>
                  <StitchTableHeader>
                    <StitchTableRow>
                      <StitchTableHead>시험항목</StitchTableHead>
                      <StitchTableHead className="w-20 sm:w-auto">카테고리</StitchTableHead>
                      <StitchTableHead className="text-right whitespace-nowrap">금액</StitchTableHead>
                    </StitchTableRow>
                  </StitchTableHeader>
                  <StitchTableBody>
                    {items.map((item) => (
                      <StitchTableRow key={item.id}>
                        <StitchTableCell
                          className={
                            item.is_option ? 'pl-8 text-slate-500' : 'font-bold'
                          }
                        >
                          {item.is_option ? '└ ' : ''}{item.name}
                        </StitchTableCell>
                        <StitchTableCell>{item.category}</StitchTableCell>
                        <StitchTableCell className="text-right whitespace-nowrap">
                          {item.amount > 0 ? formatCurrency(item.amount) : '별도 협의'}
                        </StitchTableCell>
                      </StitchTableRow>
                    ))}
                    {/* 조제물분석 */}
                    {quotation.subtotal_analysis > 0 && (
                      <StitchTableRow>
                        <StitchTableCell className="font-bold">조제물분석</StitchTableCell>
                        <StitchTableCell>-</StitchTableCell>
                        <StitchTableCell className="text-right">
                          {formatCurrency(quotation.subtotal_analysis)}
                        </StitchTableCell>
                      </StitchTableRow>
                    )}
                  </StitchTableBody>
                </StitchTable>
              </div>
          </StitchCard>
        </div>

        {/* 우측: 상태 및 금액 */}
        <div className="space-y-6">
          {/* 상태 */}
          <StitchCard variant="surface-low">
            <h2 className="text-lg font-bold mb-4">상태</h2>
              <div className="space-y-3">
                <StitchBadge status={quotation.status.toUpperCase()} className="text-sm">
                  {getStatusLabel(quotation.status)}
                </StitchBadge>
                <Select
                  value={quotation.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="bg-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTATION_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </StitchCard>

          {/* 금액 요약 */}
          <StitchCard variant="surface-low">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <WonSign className="w-5 h-5 text-primary" />
                금액 요약
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시험비용</span>
                <span className="font-bold">{formatCurrency(quotation.subtotal_test)}</span>
              </div>
              {quotation.subtotal_analysis > 0 && (
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">조제물분석</span>
                  <span className="font-bold">{formatCurrency(quotation.subtotal_analysis)}</span>
                </div>
              )}
              <div className="pt-3 flex justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">소계</span>
                <span className="font-bold">
                  {formatCurrency(
                    quotation.subtotal_test + quotation.subtotal_analysis
                  )}
                </span>
              </div>
              {quotation.discount_rate > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>할인 ({quotation.discount_rate}%)</span>
                  <span>-{formatCurrency(quotation.discount_amount)}</span>
                </div>
              )}
              <div className="pt-3 flex justify-between text-lg font-bold">
                <span>합계</span>
                <span className="text-primary">
                  {formatCurrency(quotation.total_amount)}
                </span>
              </div>
              <p className="text-xs text-slate-500">* 부가가치세 별도</p>
            </div>
          </StitchCard>

          {/* 이력 */}
          <StitchCard variant="surface-low">
            <h2 className="text-lg font-bold mb-4">이력</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">작성일</span>
                  <span>{formatDate(quotation.created_at.split('T')[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">최종수정</span>
                  <span>{formatDate(quotation.updated_at.split('T')[0])}</span>
                </div>
              </div>
          </StitchCard>
        </div>
      </div>
    </div>
  );
}
