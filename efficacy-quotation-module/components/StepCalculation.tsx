'use client';

import { useMemo } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Package,
} from 'lucide-react';

/**
 * StepCalculation Component
 * Step 4 of efficacy quotation wizard - Calculation review
 * Display items grouped by category with subtotals
 * Show subtotal, VAT, grand total
 * Requirements: 4.1, 4.2, 4.3
 */

// Format number with Korean won
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
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

export default function StepCalculation() {
  const {
    selectedModel,
    selectedItems,
    subtotalByCategory,
    subtotal,
    vat,
    grandTotal,
    nextStep,
    prevStep,
  } = useEfficacyQuotationStore();

  // Group items by category with sorted order
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof selectedItems> = {};
    
    selectedItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    // Sort categories by predefined order
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
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>금액 계산</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedModel.model_name} 모델의 견적 금액을 확인합니다.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {selectedItems.length}개 항목
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Items by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            카테고리별 항목 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {itemsByCategory.sortedCategories.map((category) => (
              <div key={category} className="mb-6 last:mb-0">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{category}</Badge>
                    <span className="text-xs text-gray-500">
                      ({itemsByCategory.grouped[category].length}개)
                    </span>
                  </div>
                  <span className="font-semibold text-sm">
                    {formatKRW(subtotalByCategory[category] || 0)}
                  </span>
                </div>

                {/* Items Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">항목명</TableHead>
                      <TableHead className="text-right w-[15%]">단가</TableHead>
                      <TableHead className="text-center w-[10%]">수량</TableHead>
                      <TableHead className="text-center w-[10%]">횟수</TableHead>
                      <TableHead className="text-right w-[25%]">금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsByCategory.grouped[category].map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.item_name}</span>
                            {item.is_default && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 border-green-200"
                              >
                                기본
                              </Badge>
                            )}
                          </div>
                          {item.usage_note && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.usage_note}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatKRW(item.unit_price).replace('원', '')}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {item.multiplier}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatKRW(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>


      {/* Summary Card */}
      <Card className="border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            견적 금액 요약
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Category Subtotals */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                카테고리별 소계
              </h4>
              {itemsByCategory.sortedCategories.map((category) => (
                <div
                  key={category}
                  className="flex justify-between text-sm py-1"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {category}
                  </span>
                  <span>{formatKRW(subtotalByCategory[category] || 0)}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Subtotal */}
            <div className="flex justify-between font-medium">
              <span>소계 (VAT 별도)</span>
              <span>{formatKRW(subtotal)}</span>
            </div>

            {/* VAT */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                부가가치세 (10%)
              </span>
              <span>{formatKRW(vat)}</span>
            </div>

            <Separator />

            {/* Grand Total */}
            <div className="flex justify-between text-xl font-bold">
              <span>총 견적금액</span>
              <span className="text-primary">{formatKRW(grandTotal)}</span>
            </div>

            <p className="text-xs text-gray-500 text-right">
              * VAT 포함 금액입니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전: 시험 디자인
            </Button>
            <Button onClick={nextStep} disabled={selectedItems.length === 0}>
              다음: 미리보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
