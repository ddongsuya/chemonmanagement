'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Edit,
  Copy,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  ArrowLeft,
  FileSignature,
  Loader2,
  ClipboardList,
  Beaker,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
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
      <PageHeader
        title={quotation.quotation_number}
        description={`${quotation.customer_name} | ${quotation.project_name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/efficacy-quotations">
                <ArrowLeft className="w-4 h-4 mr-2" /> 목록
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/efficacy-quotations/${params.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" /> 수정
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" /> 복사
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/contract/new?efficacyQuotationId=${params.id}`}>
                <FileSignature className="w-4 h-4 mr-2" /> 계약서 생성
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
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
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">고객사:</span>
                  <span className="font-medium">{quotation.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">유효기간:</span>
                  <span>{formatDate(quotation.valid_until)}까지</span>
                </div>
              </div>
              {quotation.notes && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-gray-600">특이사항:</span>
                  <p className="mt-1">{quotation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 모델 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="w-5 h-5" />
                효력시험 모델
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">모델명:</span>
                  <span className="font-medium">{quotation.model_name}</span>
                  <Badge variant="outline">{quotation.model_category}</Badge>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">적응증:</span>
                  <span>{quotation.indication}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 시험 항목 */}
          <Card>
            <CardHeader>
              <CardTitle>시험 항목</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center justify-between">
                    <span>{category}</span>
                    <span className="text-sm text-gray-500">
                      소계: {formatCurrency(quotation.subtotal_by_category[category] || 0)}
                    </span>
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>항목명</TableHead>
                        <TableHead className="text-center">단가</TableHead>
                        <TableHead className="text-center">수량</TableHead>
                        <TableHead className="text-center">횟수</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow
                          key={item.id}
                          className={item.is_default ? 'bg-green-50' : ''}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={item.is_default ? 'font-medium' : ''}>
                                {item.item_name}
                              </span>
                              {item.usage_note && (
                                <span className="text-xs text-gray-500">
                                  {item.usage_note}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {formatCurrency(item.unit_price)}
                            <span className="text-xs text-gray-500 ml-1">
                              {item.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.multiplier}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 우측: 상태 및 금액 */}
        <div className="space-y-6">
          {/* 상태 */}
          <Card>
            <CardHeader>
              <CardTitle>상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge className={`${getStatusColor(quotation.status)} text-sm`}>
                  {getEfficacyStatusLabel(quotation.status)}
                </Badge>
                <Select
                  value={quotation.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* 금액 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                금액 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 카테고리별 소계 */}
              {Object.entries(quotation.subtotal_by_category).map(
                ([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-600">{category}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                )
              )}

              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-600">소계</span>
                <span>{formatCurrency(quotation.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">VAT (10%)</span>
                <span>{formatCurrency(quotation.vat)}</span>
              </div>

              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>합계</span>
                <span className="text-primary">
                  {formatCurrency(quotation.grand_total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 이력 */}
          <Card>
            <CardHeader>
              <CardTitle>이력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">작성일</span>
                  <span>{formatDate(quotation.created_at.split('T')[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">최종수정</span>
                  <span>{formatDate(quotation.updated_at.split('T')[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">유효기간</span>
                  <span>{quotation.valid_days}일</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 연결된 문서 */}
          <Card>
            <CardHeader>
              <CardTitle>문서 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/contract/new?efficacyQuotationId=${params.id}`}>
                  <FileSignature className="w-4 h-4 mr-2" />
                  계약서 생성
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/consultation/new?efficacyQuotationId=${params.id}`}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  상담기록지 생성
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
