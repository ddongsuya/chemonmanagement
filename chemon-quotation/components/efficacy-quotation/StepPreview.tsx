'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { createQuotation } from '@/lib/data-api';
import { getCompanyInfo } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Printer,
  Building2,
  User,
  Calendar,
  FlaskConical,
} from 'lucide-react';
import type { SavedEfficacyQuotation } from '@/types/efficacy';

/**
 * StepPreview Component
 * Step 5 of efficacy quotation wizard - Preview and save
 * Print-ready format with company header, model info, itemized list
 * Save quotation functionality
 * Requirements: 5.1, 5.2, 6.1, 6.3, 6.4
 */

// Format number with Korean won
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// Format date
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// Category display order
const CATEGORY_ORDER = [
  '동물비',
  '사육비',
  '측정',
  '조직병리',
  '분석',
  '기타',
];

export default function StepPreview() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savedQuotationNumber, setSavedQuotationNumber] = useState<string | null>(null);

  const {
    customerId,
    customerName,
    projectName,
    validDays,
    notes,
    selectedModelId,
    selectedModel,
    selectedItems,
    subtotalByCategory,
    subtotal,
    vat,
    grandTotal,
    prevStep,
    reset,
  } = useEfficacyQuotationStore();

  const companyInfo = getCompanyInfo();
  const tempQuotationNumber = 'EQ-' + new Date().getFullYear() + '-XXXX';
  const displayQuotationNumber = savedQuotationNumber || tempQuotationNumber;
  const quotationDate = new Date();
  const validUntil = new Date(quotationDate);
  validUntil.setDate(validUntil.getDate() + validDays);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof selectedItems> = {};
    
    selectedItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return { grouped, sortedCategories };
  }, [selectedItems]);

  // Handle save
  const handleSave = async () => {
    if (!selectedModelId || !selectedModel) {
      toast({
        title: '저장 실패',
        description: '모델이 선택되지 않았습니다.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // 백엔드 API로 저장
      const response = await createQuotation({
        quotationType: 'EFFICACY',
        customerId: customerId || null,
        customerName: customerName,
        projectName: projectName,
        modality: selectedModel.model_name,
        modelId: selectedModelId,
        modelCategory: selectedModel.category,
        indication: selectedModel.indication,
        items: selectedItems,
        subtotal: subtotal,
        vat: vat,
        totalAmount: grandTotal,
        validDays: validDays,
        validUntil: validUntil.toISOString(),
        notes: notes,
        status: 'DRAFT',
      });

      if (response.success && response.data) {
        setSavedQuotationNumber(response.data.quotationNumber);
        
        toast({
          title: '저장 완료',
          description: `견적서 ${response.data.quotationNumber}가 저장되었습니다.`,
        });

        reset();
        router.push('/quotations');
      } else {
        toast({
          title: '저장 실패',
          description: response.error?.message || '견적서 저장 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '견적서 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (!selectedModel) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">먼저 효력시험 모델을 선택해주세요.</p>
          <Button variant="outline" onClick={prevStep} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 단계로 돌아가기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="print:hidden">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                견적번호: {displayQuotationNumber}
              </h2>
              <p className="text-sm text-gray-500">
                {customerName} | {projectName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                인쇄
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Print-ready Preview */}
      <div
        id="efficacy-quotation-preview"
        className="bg-white dark:bg-gray-900 p-8 shadow-lg max-w-4xl mx-auto print:shadow-none print:p-0"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">CHEMON</h1>
          <h2 className="text-2xl font-semibold">효력시험 견적서</h2>
        </div>

        {/* Quotation Info */}
        <div className="flex justify-between mb-6 text-sm">
          <div className="space-y-1">
            <p>
              <span className="text-gray-500">견적번호:</span>{' '}
              <strong>{displayQuotationNumber}</strong>
            </p>
            <p>
              <span className="text-gray-500">견적일자:</span>{' '}
              {formatDate(quotationDate)}
            </p>
            <p>
              <span className="text-gray-500">유효기간:</span>{' '}
              {formatDate(validUntil)}까지
            </p>
          </div>
        </div>

        {/* Recipient / Sender */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Recipient */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                수신
              </h3>
            </div>
            <p className="font-medium text-lg">{customerName || '-'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              프로젝트: {projectName || '-'}
            </p>
          </div>

          {/* Sender */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                발신
              </h3>
            </div>
            <p className="font-medium">{companyInfo.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {companyInfo.address}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tel: {companyInfo.tel}
            </p>
          </div>
        </div>

        {/* Model Info */}
        <div className="border rounded-lg p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
              효력시험 모델
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">모델명</p>
              <p className="font-medium">{selectedModel.model_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">카테고리</p>
              <p className="font-medium">{selectedModel.category}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">적응증</p>
              <p className="font-medium">{selectedModel.indication}</p>
            </div>
          </div>
        </div>

        {/* Items by Category */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            견적 항목
          </h3>

          <ScrollArea className="max-h-[500px] print:max-h-none">
            {itemsByCategory.sortedCategories.map((category) => (
              <div key={category} className="mb-4 last:mb-0">
                {/* Category Header */}
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-t-lg">
                  <span className="font-medium text-sm">{category}</span>
                  <span className="font-semibold text-sm">
                    {formatKRW(subtotalByCategory[category] || 0)}
                  </span>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="text-left py-2 px-3 w-[40%]">항목명</th>
                      <th className="text-right py-2 px-3 w-[15%]">단가</th>
                      <th className="text-center py-2 px-3 w-[10%]">수량</th>
                      <th className="text-center py-2 px-3 w-[10%]">횟수</th>
                      <th className="text-right py-2 px-3 w-[25%]">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsByCategory.grouped[category].map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-2 px-3">
                          <span className="text-sm">{item.item_name}</span>
                          {item.is_default && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs bg-green-50 text-green-700 border-green-200 print:bg-transparent"
                            >
                              기본
                            </Badge>
                          )}
                        </td>
                        <td className="text-right py-2 px-3 text-sm">
                          {formatKRW(item.unit_price).replace('원', '')}
                        </td>
                        <td className="text-center py-2 px-3 text-sm">
                          {item.quantity}
                        </td>
                        <td className="text-center py-2 px-3 text-sm">
                          {item.multiplier}
                        </td>
                        <td className="text-right py-2 px-3 text-sm font-medium">
                          {formatKRW(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </ScrollArea>
        </div>

        <Separator className="my-6" />

        {/* Totals */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>소계 (VAT 별도)</span>
            <span className="font-medium">{formatKRW(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>부가가치세 (10%)</span>
            <span>{formatKRW(vat)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-xl font-bold">
            <span>총 견적금액</span>
            <span className="text-primary">{formatKRW(grandTotal)}</span>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">비고</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* Footer Notes */}
        <div className="mt-6 text-sm text-gray-500 space-y-1">
          <p>※ 상기 금액은 견적 유효기간 내 계약 체결 시 적용됩니다.</p>
          <p>※ 시험 일정은 계약 체결 후 협의하여 확정합니다.</p>
        </div>

        {/* Company Footer */}
        <div className="mt-8 pt-4 border-t text-sm text-gray-500">
          <p>
            {companyInfo.name} | {companyInfo.tel} | {companyInfo.email}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <Card className="print:hidden">
        <CardContent className="py-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전: 금액 계산
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              견적서 저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
