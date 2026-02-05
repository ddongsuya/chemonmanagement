'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// 미진행 사유 타입 정의
// Requirements 2.2: 미진행 사유 선택 옵션
export type LostReason = 
  | 'BUDGET_PLANNING'
  | 'COMPETITOR_SELECTED'
  | 'PRICE_ISSUE'
  | 'SCHEDULE_ISSUE'
  | 'ON_HOLD'
  | 'OTHER';

// 미진행 사유 라벨
export const LOST_REASON_LABELS: Record<LostReason, string> = {
  BUDGET_PLANNING: '예산 미확보',
  COMPETITOR_SELECTED: '경쟁사 선정',
  PRICE_ISSUE: '가격 문제',
  SCHEDULE_ISSUE: '일정 문제',
  ON_HOLD: '보류',
  OTHER: '기타',
};

interface LostReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadNumber?: string;
  onSubmit: (data: { lostReason: LostReason; lostReasonDetail?: string }) => Promise<void>;
}

/**
 * LostReasonDialog 컴포넌트
 * 
 * 리드 미진행 사유를 입력받는 다이얼로그입니다.
 * 
 * Requirements 2.3: lostReason 필수 입력
 * Requirements 2.4: OTHER 선택 시 lostReasonDetail 필수 입력
 * Requirements 2.5: 견적서 REJECTED 상태 변경 시 표시
 */
export default function LostReasonDialog({
  open,
  onOpenChange,
  leadId,
  leadNumber,
  onSubmit,
}: LostReasonDialogProps) {
  const { toast } = useToast();
  const [lostReason, setLostReason] = useState<LostReason | ''>('');
  const [lostReasonDetail, setLostReasonDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; detail?: string }>({});

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: { reason?: string; detail?: string } = {};

    // Requirements 2.3: lostReason 필수
    if (!lostReason) {
      newErrors.reason = '미진행 사유를 선택해주세요.';
    }

    // Requirements 2.4: OTHER 선택 시 lostReasonDetail 필수
    if (lostReason === 'OTHER' && !lostReasonDetail.trim()) {
      newErrors.detail = '기타 사유를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 처리
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        lostReason: lostReason as LostReason,
        lostReasonDetail: lostReason === 'OTHER' ? lostReasonDetail.trim() : undefined,
      });

      toast({
        title: '미진행 처리 완료',
        description: '리드가 미진행 상태로 변경되었습니다.',
      });

      // 상태 초기화
      setLostReason('');
      setLostReasonDetail('');
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '미진행 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 다이얼로그 닫기 시 상태 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLostReason('');
      setLostReasonDetail('');
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>미진행 사유 입력</DialogTitle>
          </div>
          <DialogDescription>
            {leadNumber ? (
              <>리드 <span className="font-medium">{leadNumber}</span>의 미진행 사유를 선택해주세요.</>
            ) : (
              '미진행 사유를 선택해주세요.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 미진행 사유 선택 */}
          <div className="space-y-2">
            <Label htmlFor="lostReason">
              미진행 사유 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={lostReason}
              onValueChange={(value) => {
                setLostReason(value as LostReason);
                if (errors.reason) {
                  setErrors((prev) => ({ ...prev, reason: undefined }));
                }
              }}
            >
              <SelectTrigger id="lostReason" className={errors.reason ? 'border-red-500' : ''}>
                <SelectValue placeholder="사유를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(LOST_REASON_LABELS) as [LostReason, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          {/* 기타 사유 상세 입력 (OTHER 선택 시) */}
          {lostReason === 'OTHER' && (
            <div className="space-y-2">
              <Label htmlFor="lostReasonDetail">
                상세 사유 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="lostReasonDetail"
                placeholder="미진행 사유를 상세히 입력해주세요."
                value={lostReasonDetail}
                onChange={(e) => {
                  setLostReasonDetail(e.target.value);
                  if (errors.detail) {
                    setErrors((prev) => ({ ...prev, detail: undefined }));
                  }
                }}
                className={errors.detail ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.detail && (
                <p className="text-sm text-red-500">{errors.detail}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? '처리 중...' : '미진행 처리'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
