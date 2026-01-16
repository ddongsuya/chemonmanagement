'use client';

import { useQuotationStore } from '@/stores/quotationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import {
  Calculator,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react';

export default function StepCalculation() {
  const {
    selectedItems,
    analysisCost,
    subtotalTest,
    subtotalAnalysis,
    discountRate,
    discountReason,
    discountAmount,
    totalAmount,
    setDiscountRate,
    setDiscountReason,
    moveItem,
    prevStep,
    nextStep,
  } = useQuotationStore();

  // 본시험만 필터링 (인덱스용)
  const mainItems = selectedItems.filter((item) => !item.is_option);

  // 시험명에서 첫 줄(제목)과 상세 설명 분리
  const parseTestName = (testName: string) => {
    const lines = testName.split('\n');
    const title = lines[0];
    const details = lines.slice(1).join(' ').trim();
    return { title, details };
  };

  return (
    <div className="space-y-6">
      {/* 견적 상세 */}
      <Card>
        <CardHeader>
          <CardTitle>견적 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">순서</TableHead>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>시험항목</TableHead>
                  <TableHead className="w-20 text-center">수량</TableHead>
                  <TableHead className="w-32 text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedItems.map((item) => {
                  const mainIndex = mainItems.findIndex((m) => m.id === item.id);
                  const isFirst = mainIndex === 0;
                  const isLast = mainIndex === mainItems.length - 1;
                  const { title, details } = parseTestName(item.test.test_name);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="p-1">
                        {!item.is_option && (
                          <div className="flex items-center gap-0.5">
                            <GripVertical className="w-4 h-4 text-gray-300" />
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={isFirst}
                                onClick={() => moveItem(item.id, 'up')}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={isLast}
                                onClick={() => moveItem(item.id, 'down')}
                              >
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.is_option ? '' : mainIndex + 1}
                      </TableCell>
                      <TableCell
                        className={item.is_option ? 'pl-8 text-gray-600' : ''}
                      >
                        {item.is_option ? (
                          <>└ {item.test.option_type || title}</>
                        ) : details ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dotted border-gray-400">
                                {title}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-sm">
                              <p className="text-xs whitespace-pre-wrap">{details}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          title
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    시험비용 소계
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(subtotalTest)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* 조제물분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            조제물분석 (자동계산)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                {analysisCost.validation_invivo ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span>Validation (in vivo)</span>
              </div>
              <span
                className={
                  analysisCost.validation_invivo
                    ? 'font-medium'
                    : 'text-gray-400'
                }
              >
                {formatCurrency(analysisCost.validation_invivo ? 10000000 : 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                {analysisCost.validation_invitro ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span>Validation (in vitro)</span>
              </div>
              <span
                className={
                  analysisCost.validation_invitro
                    ? 'font-medium'
                    : 'text-gray-400'
                }
              >
                {formatCurrency(analysisCost.validation_invitro ? 10000000 : 0)}
              </span>
            </div>
          </div>

          <Separator />

          {/* 함량분석 내역 */}
          <div>
            <h4 className="font-medium mb-2">
              함량분석 내역 ({analysisCost.analysis_count}회)
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              {selectedItems
                .filter(
                  (item) =>
                    !item.test.analysis_excluded && 
                    (item.test.test_type === 'in vivo' || item.test.test_type === 'in vitro')
                )
                .map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      - {item.test.test_name.split('\n')[0].slice(0, 30)} ({item.test.analysis_count || 1}회)
                    </span>
                    <span>
                      {formatCurrency((item.test.analysis_count || 1) * 1000000)}
                    </span>
                  </div>
                ))}
              {selectedItems.filter(
                (item) =>
                  !item.test.analysis_excluded && 
                  (item.test.test_type === 'in vivo' || item.test.test_type === 'in vitro')
              ).length === 0 && (
                <p className="text-gray-400">함량분석 대상 시험이 없습니다.</p>
              )}
            </div>
          </div>

          <Separator />

          {/* 조제물분석 소계 */}
          <div className="flex justify-between font-semibold text-lg">
            <span>조제물분석 소계</span>
            <span className="text-primary">
              {formatCurrency(subtotalAnalysis)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 할인 적용 */}
      <Card>
        <CardHeader>
          <CardTitle>할인 적용</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>할인율 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>할인 사유 (선택)</Label>
              <Input
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="예: 장기 거래 고객"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최종 금액 */}
      <Card className="border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle>최종 견적 금액</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>시험비용</span>
              <span>{formatCurrency(subtotalTest)}</span>
            </div>
            <div className="flex justify-between">
              <span>조제물분석</span>
              <span>{formatCurrency(subtotalAnalysis)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>합계</span>
              <span>{formatCurrency(subtotalTest + subtotalAnalysis)}</span>
            </div>
            {discountRate > 0 && (
              <div className="flex justify-between text-red-600">
                <span>할인 ({discountRate}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>최종 견적금액</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
            <p className="text-sm text-gray-500 text-right">
              * 부가가치세 별도
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 이전
        </Button>
        <Button onClick={nextStep}>
          미리보기/출력 <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
