'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { InvoiceSchedule, TestReception } from '@/types/customer';
import { invoiceScheduleApi } from '@/lib/customer-data-api';

interface InvoiceScheduleFormProps {
  customerId: string;
  testReception?: TestReception;
  invoiceSchedule?: InvoiceSchedule;
  onSuccess: () => void;
  onCancel?: () => void;
}

// 기본 발행 예정일 계산 (접수일로부터 30일 후)
function calculateDefaultScheduledDate(receptionDate: string): string {
  const date = new Date(receptionDate);
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

export default function InvoiceScheduleForm({
  customerId,
  testReception,
  invoiceSchedule,
  onSuccess,
  onCancel,
}: InvoiceScheduleFormProps) {
  const [saving, setSaving] = useState(false);
  const [isInstallment, setIsInstallment] = useState(
    invoiceSchedule?.payment_type === 'partial' || false
  );

  const [formData, setFormData] = useState({
    amount: invoiceSchedule?.amount || testReception?.total_amount || 0,
    scheduled_date: invoiceSchedule?.scheduled_date?.split('T')[0] || 
      (testReception ? calculateDefaultScheduledDate(testReception.reception_date).split('T')[0] : ''),
    notes: invoiceSchedule?.notes || '',
    // 분할 지급 설정 - Requirements 3.6
    installments: invoiceSchedule?.total_installments || 2,
    intervalDays: 30,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!invoiceSchedule;

  // 분할 지급 시 회차별 금액 미리보기
  const installmentPreview = isInstallment
    ? Array.from({ length: formData.installments }, (_, i) => {
        const baseAmount = Math.floor(formData.amount / formData.installments);
        const remainder = formData.amount - baseAmount * formData.installments;
        const amount = i === formData.installments - 1 ? baseAmount + remainder : baseAmount;
        const date = new Date(formData.scheduled_date);
        date.setDate(date.getDate() + i * formData.intervalDays);
        return {
          number: i + 1,
          amount,
          date: date.toISOString().split('T')[0],
        };
      })
    : [];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = '금액은 0보다 커야 합니다';
    }
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = '발행 예정일을 입력해주세요';
    }
    if (isInstallment && formData.installments < 2) {
      newErrors.installments = '분할 횟수는 2회 이상이어야 합니다';
    }
    if (isInstallment && formData.intervalDays < 1) {
      newErrors.intervalDays = '간격은 1일 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEditMode && invoiceSchedule) {
        // 수정 모드
        await invoiceScheduleApi.update(invoiceSchedule.id, {
          amount: formData.amount,
          scheduled_date: new Date(formData.scheduled_date).toISOString(),
          notes: formData.notes,
        });
      } else if (testReception) {
        if (isInstallment) {
          // 분할 지급 생성 - Requirements 3.6
          await invoiceScheduleApi.createInstallments(
            customerId,
            testReception.id,
            formData.amount,
            formData.installments,
            new Date(formData.scheduled_date).toISOString(),
            formData.intervalDays
          );
        } else {
          // 전액 지급 생성 - Requirements 3.2
          await invoiceScheduleApi.create(customerId, {
            test_reception_id: testReception.id,
            amount: formData.amount,
            scheduled_date: new Date(formData.scheduled_date).toISOString(),
            payment_type: 'full',
            status: 'pending',
            notes: formData.notes,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save invoice schedule:', error);
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? '세금계산서 일정 수정' : '세금계산서 일정 등록'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
        {/* 시험 정보 표시 */}
        {testReception && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <div className="font-medium">{testReception.test_number}</div>
            <div className="text-gray-500">{testReception.test_title}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 금액 */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              금액 (원) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
              min="0"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* 발행 예정일 - Requirements 3.2 */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_date">
              발행 예정일 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="scheduled_date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_date: e.target.value })
              }
              className={errors.scheduled_date ? 'border-red-500' : ''}
            />
            {errors.scheduled_date && (
              <p className="text-sm text-red-500">{errors.scheduled_date}</p>
            )}
          </div>

          {/* 분할 지급 설정 - Requirements 3.6 */}
          {!isEditMode && (
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="installment">분할 지급</Label>
                <Switch
                  id="installment"
                  checked={isInstallment}
                  onCheckedChange={setIsInstallment}
                />
              </div>
            </div>
          )}

          {/* 분할 지급 옵션 */}
          {isInstallment && !isEditMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="installments">분할 횟수</Label>
                <Select
                  value={formData.installments.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, installments: parseInt(value) })
                  }
                >
                  <SelectTrigger className={errors.installments ? 'border-red-500' : ''}>
                    <SelectValue placeholder="분할 횟수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}회
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.installments && (
                  <p className="text-sm text-red-500">{errors.installments}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalDays">발행 간격 (일)</Label>
                <Input
                  id="intervalDays"
                  type="number"
                  value={formData.intervalDays}
                  onChange={(e) =>
                    setFormData({ ...formData, intervalDays: parseInt(e.target.value) || 30 })
                  }
                  min="1"
                  className={errors.intervalDays ? 'border-red-500' : ''}
                />
                {errors.intervalDays && (
                  <p className="text-sm text-red-500">{errors.intervalDays}</p>
                )}
              </div>

              {/* 분할 지급 미리보기 */}
              {installmentPreview.length > 0 && (
                <div className="sm:col-span-2 space-y-2">
                  <Label>분할 지급 미리보기</Label>
                  <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                    {installmentPreview.map((item) => (
                      <div
                        key={item.number}
                        className="flex justify-between items-center p-2 text-sm"
                      >
                        <span className="text-gray-500">{item.number}회차</span>
                        <span>
                          {new Intl.NumberFormat('ko-KR', {
                            style: 'currency',
                            currency: 'KRW',
                            maximumFractionDigits: 0,
                          }).format(item.amount)}
                        </span>
                        <span className="text-gray-500">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 메모 */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="추가 메모를 입력하세요"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          ) : (
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
          )}
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? '수정' : isInstallment ? `${formData.installments}회 분할 등록` : '등록'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
