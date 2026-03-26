'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calculator, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StitchCard } from '@/components/ui/StitchCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// 지급 유형 정의
// Requirements 4.1: 계약서에 지급조건 유형 선택
export type PaymentType = 'FULL' | 'INSTALLMENT' | 'PER_TEST';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  FULL: '일시불',
  INSTALLMENT: '분할지급 (선금/잔금)',
  PER_TEST: '시험별 지급',
};

interface ContractPaymentFormProps {
  contractId: string;
  totalAmount: number;
  currentPaymentType?: PaymentType;
  currentAdvanceRate?: number;
  currentAdvanceAmount?: number;
  currentBalanceAmount?: number;
  onSubmit: (data: {
    paymentType: PaymentType;
    advancePaymentRate?: number;
    advancePaymentAmount?: number;
    balancePaymentAmount?: number;
  }) => Promise<void>;
  disabled?: boolean;
}

/**
 * ContractPaymentForm 컴포넌트
 * 
 * 계약서 지급조건을 설정하는 폼입니다.
 * 
 * Requirements 4.1: 지급조건 유형 선택 (FULL, INSTALLMENT, PER_TEST)
 * Requirements 4.2: INSTALLMENT 타입 시 선금/잔금 입력
 */
export default function ContractPaymentForm({
  contractId,
  totalAmount,
  currentPaymentType = 'FULL',
  currentAdvanceRate,
  currentAdvanceAmount,
  currentBalanceAmount,
  onSubmit,
  disabled = false,
}: ContractPaymentFormProps) {
  const { toast } = useToast();
  const [paymentType, setPaymentType] = useState<PaymentType>(currentPaymentType);
  const [advanceRate, setAdvanceRate] = useState<string>(
    currentAdvanceRate?.toString() || '30'
  );
  const [advanceAmount, setAdvanceAmount] = useState<string>(
    currentAdvanceAmount?.toString() || ''
  );
  const [balanceAmount, setBalanceAmount] = useState<string>(
    currentBalanceAmount?.toString() || ''
  );
  const [useRate, setUseRate] = useState(true); // 비율 입력 vs 금액 직접 입력
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 비율 변경 시 금액 자동 계산
  useEffect(() => {
    if (paymentType === 'INSTALLMENT' && useRate) {
      const rate = parseFloat(advanceRate) || 0;
      const calculatedAdvance = Math.round(totalAmount * rate / 100);
      const calculatedBalance = totalAmount - calculatedAdvance;
      setAdvanceAmount(calculatedAdvance.toString());
      setBalanceAmount(calculatedBalance.toString());
    }
  }, [advanceRate, totalAmount, paymentType, useRate]);

  // 금액 직접 입력 시 잔금 자동 계산
  useEffect(() => {
    if (paymentType === 'INSTALLMENT' && !useRate) {
      const advance = parseFloat(advanceAmount) || 0;
      const calculatedBalance = totalAmount - advance;
      setBalanceAmount(calculatedBalance.toString());
    }
  }, [advanceAmount, totalAmount, paymentType, useRate]);

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (paymentType === 'INSTALLMENT') {
      const advance = parseFloat(advanceAmount) || 0;
      const balance = parseFloat(balanceAmount) || 0;

      if (advance <= 0) {
        newErrors.advanceAmount = '선금 금액을 입력해주세요.';
      }

      if (advance > totalAmount) {
        newErrors.advanceAmount = '선금이 총액을 초과할 수 없습니다.';
      }

      if (Math.abs(advance + balance - totalAmount) > 1) {
        newErrors.total = '선금과 잔금의 합계가 총액과 일치하지 않습니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 처리
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data: {
        paymentType: PaymentType;
        advancePaymentRate?: number;
        advancePaymentAmount?: number;
        balancePaymentAmount?: number;
      } = { paymentType };

      if (paymentType === 'INSTALLMENT') {
        data.advancePaymentRate = parseFloat(advanceRate) || undefined;
        data.advancePaymentAmount = parseFloat(advanceAmount) || undefined;
        data.balancePaymentAmount = parseFloat(balanceAmount) || undefined;
      }

      await onSubmit(data);

      toast({
        title: '지급조건 저장 완료',
        description: '계약서 지급조건이 저장되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '지급조건 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 금액 포맷팅
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  return (
    <StitchCard variant="surface-low">
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">지급조건 설정</h3>
        </div>
        <p className="text-sm text-slate-500">
          계약 총액: <span className="font-semibold">{formatCurrency(totalAmount)}원</span>
        </p>
      </div>
      <div className="space-y-6 mt-6">
        {/* 지급 유형 선택 */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">지급 유형</label>
          <Select
            value={paymentType}
            onValueChange={(value) => setPaymentType(value as PaymentType)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-white border-none rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PAYMENT_TYPE_LABELS) as [PaymentType, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* INSTALLMENT 타입: 선금/잔금 입력 */}
        {paymentType === 'INSTALLMENT' && (
          <div className="space-y-4 p-4 bg-[#F5EDE3] rounded-xl">
            {/* 입력 방식 선택 */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={useRate ? 'default' : 'outline'}
                size="sm"
                className="rounded-xl"
                onClick={() => setUseRate(true)}
                disabled={disabled}
              >
                <Calculator className="h-4 w-4 mr-1" />
                비율로 입력
              </Button>
              <Button
                type="button"
                variant={!useRate ? 'default' : 'outline'}
                size="sm"
                className="rounded-xl"
                onClick={() => setUseRate(false)}
                disabled={disabled}
              >
                금액 직접 입력
              </Button>
            </div>

            {/* 비율 입력 */}
            {useRate && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500" htmlFor="advanceRate">선금 비율 (%)</label>
                <Input
                  id="advanceRate"
                  type="number"
                  min="0"
                  max="100"
                  value={advanceRate}
                  onChange={(e) => setAdvanceRate(e.target.value)}
                  disabled={disabled}
                  className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            {/* 금액 표시/입력 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500" htmlFor="advanceAmount">선금</label>
                <Input
                  id="advanceAmount"
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  disabled={disabled || useRate}
                  className={`bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40 ${errors.advanceAmount ? 'ring-2 ring-red-500' : ''}`}
                />
                {errors.advanceAmount && (
                  <p className="text-sm text-red-500">{errors.advanceAmount}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500" htmlFor="balanceAmount">잔금</label>
                <Input
                  id="balanceAmount"
                  type="number"
                  value={balanceAmount}
                  disabled
                  className="bg-[#EFE7DD] border-none rounded-xl"
                />
              </div>
            </div>

            {/* 합계 검증 오류 */}
            {errors.total && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.total}</AlertDescription>
              </Alert>
            )}

            {/* 금액 요약 */}
            <div className="text-sm text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>선금:</span>
                <span className="font-medium">{formatCurrency(parseFloat(advanceAmount) || 0)}원</span>
              </div>
              <div className="flex justify-between">
                <span>잔금:</span>
                <span className="font-medium">{formatCurrency(parseFloat(balanceAmount) || 0)}원</span>
              </div>
              <div className="flex justify-between pt-1 mt-1">
                <span>합계:</span>
                <span className="font-semibold">
                  {formatCurrency((parseFloat(advanceAmount) || 0) + (parseFloat(balanceAmount) || 0))}원
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PER_TEST 타입 안내 */}
        {paymentType === 'PER_TEST' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              시험별 지급 유형을 선택하셨습니다. 지급 일정은 아래 &quot;지급 일정 관리&quot; 섹션에서 설정해주세요.
            </AlertDescription>
          </Alert>
        )}

        {/* 저장 버튼 */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting}
          className="w-full bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold"
        >
          {isSubmitting ? '저장 중...' : '지급조건 저장'}
        </Button>
      </div>
    </StitchCard>
  );
}
