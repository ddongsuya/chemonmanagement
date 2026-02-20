'use client';

import { useState } from 'react';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import { useQuotationStore } from '@/stores/quotationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatKRW } from '@/lib/toxicity-v2/priceEngine';
import { calcFormulationCost, calcContentCount } from '@/lib/toxicity-v2/priceEngine';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { IM_MAPPING } from '@/lib/toxicity-v2/data/metadata';
import {
  Calculator,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
} from 'lucide-react';


/**
 * StepCalculationV2
 *
 * 독성시험 v2 견적서 위자드 Step 3 — 검토/계산
 * toxicityV2Store에서 데이터를 읽어 조제물분석/함량분석 상세 내역을 표시한다.
 */
export default function StepCalculationV2() {
  const { prevStep, nextStep } = useQuotationStore();
  const {
    selectedTests,
    mode,
    subtotalTest,
    formulationCost,
    discountRate,
    discountReason,
    discountAmount,
    totalAmount,
    setDiscountRate,
    setDiscountReason,
    updateTestName,
    updateTestPrice,
  } = useToxicityV2Store();

  // 인라인 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<'name' | 'price' | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (testId: string, field: 'name' | 'price', currentValue: string) => {
    setEditingId(testId);
    setEditField(field);
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (!editingId || !editField) return;
    if (editField === 'name') {
      updateTestName(editingId, editValue.trim());
    } else {
      const num = parseInt(editValue.replace(/[^0-9-]/g, ''), 10);
      if (!isNaN(num)) updateTestPrice(editingId, num);
    }
    setEditingId(null);
    setEditField(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditField(null);
  };

  // 조제물분석 상세 계산
  const formCost = calcFormulationCost(
    selectedTests,
    mode ?? 'drug_single',
    TOXICITY_DATA,
    IM_MAPPING,
  );

  // 함량분석 대상 항목 상세 목록 (drug_single 모드만)
  const contentItems = mode === 'drug_single'
    ? selectedTests
        .filter((t) => {
          const im = IM_MAPPING[t.itemId];
          return im && im[1] === 1; // assay === 1
        })
        .map((t) => {
          const item = TOXICITY_DATA.find((d) => d.id === t.itemId);
          const count = item ? calcContentCount(item.duration) : 1;
          return {
            id: t.id,
            name: t.name,
            duration: item?.duration ?? '-',
            count,
            cost: count * 1_000_000,
          };
        })
    : [];

  // 항목 순서 이동
  const handleMove = (testId: string, direction: 'up' | 'down') => {
    const store = useToxicityV2Store.getState();
    const tests = [...store.selectedTests];
    const idx = tests.findIndex((t) => t.id === testId);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tests.length) return;

    [tests[idx], tests[swapIdx]] = [tests[swapIdx], tests[idx]];
    useToxicityV2Store.setState({ selectedTests: tests });
    store.recalculate();
  };

  return (
    <div className="space-y-6">
      {/* 견적 상세 */}
      <Card>
        <CardHeader>
          <CardTitle>견적 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 sm:w-16">순서</TableHead>
                  <TableHead className="w-10 sm:w-12">No</TableHead>
                  <TableHead>시험항목</TableHead>
                  <TableHead className="w-20 sm:w-24 text-center">카테고리</TableHead>
                  <TableHead className="w-24 sm:w-32 text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTests.map((test, idx) => (
                  <TableRow key={test.id}>
                    <TableCell className="p-1">
                      {!test.isOption && (
                        <div className="flex items-center gap-0.5">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              disabled={idx === 0}
                              onClick={() => handleMove(test.id, 'up')}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              disabled={idx === selectedTests.length - 1}
                              onClick={() => handleMove(test.id, 'down')}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{test.isOption ? '' : idx + 1}</TableCell>
                    <TableCell className={test.isOption ? 'pl-8 text-gray-600' : ''}>
                      {editingId === test.id && editField === 'name' ? (
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <span
                          className="group cursor-pointer inline-flex items-center gap-1"
                          onClick={() =>
                            startEdit(test.id, 'name', test.customName || test.name)
                          }
                        >
                          {test.isOption && <span className="text-gray-400 mr-1">└</span>}
                          <span className={test.customName ? 'text-blue-600' : ''}>
                            {test.customName || test.name}
                          </span>
                          <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {test.category}
                    </TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap">
                      {editingId === test.id && editField === 'price' ? (
                        <Input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="h-7 text-sm text-right w-32 ml-auto"
                        />
                      ) : (
                        <span
                          className={`group cursor-pointer inline-flex items-center gap-1 justify-end ${test.customPrice !== undefined ? 'text-blue-600' : ''}`}
                          onClick={() => {
                            const effectivePrice = test.customPrice ?? test.price;
                            startEdit(test.id, 'price', String(effectivePrice));
                          }}
                        >
                          <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {(test.customPrice ?? test.price) > 0
                            ? formatKRW(test.customPrice ?? test.price)
                            : '별도 협의'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    시험비용 소계
                  </TableCell>
                  <TableCell className="text-right">
                    {formatKRW(subtotalTest)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
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
          {mode === 'drug_single' && (
            <>
              {/* Validation (in vivo / in vitro) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {formCost.assayBase >= 10_000_000 ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                    <span>Validation (in vivo)</span>
                  </div>
                  <span className={formCost.assayBase >= 10_000_000 ? 'font-medium' : 'text-gray-400'}>
                    {formatKRW(selectedTests.some((t) => IM_MAPPING[t.itemId]?.[0] === 1) ? 10_000_000 : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {selectedTests.some((t) => IM_MAPPING[t.itemId]?.[0] === 2) ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                    <span>Validation (in vitro)</span>
                  </div>
                  <span className={selectedTests.some((t) => IM_MAPPING[t.itemId]?.[0] === 2) ? 'font-medium' : 'text-gray-400'}>
                    {formatKRW(selectedTests.some((t) => IM_MAPPING[t.itemId]?.[0] === 2) ? 10_000_000 : 0)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* 함량분석 내역 */}
              <div>
                <h4 className="font-medium mb-2">
                  함량분석 내역 ({contentItems.reduce((s, c) => s + c.count, 0)}회)
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {contentItems.length > 0 ? (
                    contentItems.map((ci) => (
                      <div key={ci.id} className="flex justify-between">
                        <span>
                          - {ci.name.slice(0, 30)} ({ci.duration}, {ci.count}회)
                        </span>
                        <span>{formatKRW(ci.cost)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">함량분석 대상 시험이 없습니다.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 건기식 모드 */}
          {(mode === 'hf_indv' || mode === 'hf_prob' || mode === 'hf_temp') && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                {formCost.hfFormulation > 0 ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span>건기식 조제물분석비</span>
              </div>
              <span className={formCost.hfFormulation > 0 ? 'font-medium' : 'text-gray-400'}>
                {formatKRW(formCost.hfFormulation)}
              </span>
            </div>
          )}

          {/* 복합제/백신/스크리닝/의료기기: 조제물분석 없음 */}
          {mode && !['drug_single', 'hf_indv', 'hf_prob', 'hf_temp'].includes(mode) && (
            <p className="text-gray-400 text-sm">해당 모드에서는 조제물분석이 적용되지 않습니다.</p>
          )}

          <Separator />

          {/* 조제물분석 소계 */}
          <div className="flex justify-between font-semibold text-lg">
            <span>조제물분석 소계</span>
            <span className="text-primary">{formatKRW(formulationCost)}</span>
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
              <span>{formatKRW(subtotalTest)}</span>
            </div>
            {formulationCost > 0 && (
              <div className="flex justify-between">
                <span>조제물분석</span>
                <span>{formatKRW(formulationCost)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>합계</span>
              <span>{formatKRW(subtotalTest + formulationCost)}</span>
            </div>
            {discountRate > 0 && (
              <div className="flex justify-between text-red-600">
                <span>할인 ({discountRate}%)</span>
                <span>-{formatKRW(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>최종 견적금액</span>
              <span className="text-primary">{formatKRW(totalAmount)}</span>
            </div>
            <p className="text-sm text-gray-500 text-right">* 부가가치세 별도</p>
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
