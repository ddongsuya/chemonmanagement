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
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils';
import { QUOTATION_STATUSES } from '@/lib/constants';
import { getQuotationById, updateQuotationStatus, SavedQuotation } from '@/lib/quotation-storage';
import { useToast } from '@/hooks/use-toast';

export default function QuotationDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<SavedQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage에서 견적 데이터 로드
  useEffect(() => {
    const loadQuotation = () => {
      const id = params.id as string;
      const data = getQuotationById(id);
      setQuotation(data);
      setIsLoading(false);
    };
    loadQuotation();
  }, [params.id]);

  const handleStatusChange = (newStatus: string) => {
    if (!quotation) return;
    
    const updated = updateQuotationStatus(quotation.id, newStatus as SavedQuotation['status']);
    if (updated) {
      setQuotation(updated);
      toast({
        title: '상태 변경',
        description: `견적서 상태가 '${getStatusLabel(newStatus)}'로 변경되었습니다.`,
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

  // 시험 항목 변환
  const items = quotation.items.map(item => ({
    id: item.id,
    name: item.test.test_name.split('\n')[0],
    glp: item.test.glp_status || 'N/A',
    amount: item.amount,
    is_option: item.is_option,
  }));

  return (
    <div>
      <PageHeader
        title={quotation.quotation_number}
        description={`${quotation.customer_name} | ${quotation.project_name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/quotations">
                <ArrowLeft className="w-4 h-4 mr-2" /> 목록
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/quotations/${params.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" /> 수정
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" /> 복사
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/contract/new?quotationId=${params.id}`}>
                <FileSignature className="w-4 h-4 mr-2" /> 계약서 생성
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/consultation/new?quotationId=${params.id}`}>
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{quotation.modality}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">작성자:</span>
                  <span>{quotation.created_by || '사용자'}</span>
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

          {/* 시험 항목 */}
          <Card>
            <CardHeader>
              <CardTitle>시험 항목</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시험항목</TableHead>
                    <TableHead>규격</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell
                        className={
                          item.is_option ? 'pl-8 text-gray-600' : 'font-medium'
                        }
                      >
                        {item.is_option ? '└ ' : ''}{item.name}
                      </TableCell>
                      <TableCell>{item.glp}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* 조제물분석 */}
                  {quotation.subtotal_analysis > 0 && (
                    <TableRow>
                      <TableCell className="font-medium">조제물분석</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(quotation.subtotal_analysis)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                  {getStatusLabel(quotation.status)}
                </Badge>
                <Select
                  value={quotation.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
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
              <div className="flex justify-between">
                <span className="text-gray-600">시험비용</span>
                <span>{formatCurrency(quotation.subtotal_test)}</span>
              </div>
              {quotation.subtotal_analysis > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">조제물분석</span>
                  <span>{formatCurrency(quotation.subtotal_analysis)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-600">소계</span>
                <span>
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
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>합계</span>
                <span className="text-primary">
                  {formatCurrency(quotation.total_amount)}
                </span>
              </div>
              <p className="text-xs text-gray-500">* 부가가치세 별도</p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
