'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertTriangle, Plus, Trash2 } from 'lucide-react';
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
import { StitchBadge } from '@/components/ui/StitchBadge';
import {
  StitchTable,
  StitchTableBody,
  StitchTableCell,
  StitchTableHead,
  StitchTableHeader,
  StitchTableRow,
} from '@/components/ui/StitchTable';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// 지급 상태 타입
export type PaymentStatus = 'PENDING' | 'SCHEDULED' | 'PAID' | 'OVERDUE';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: '대기',
  SCHEDULED: '예정',
  PAID: '완료',
  OVERDUE: '연체',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'secondary',
  SCHEDULED: 'default',
  PAID: 'success',
  OVERDUE: 'destructive',
};

// 지급 일정 인터페이스
export interface PaymentSchedule {
  id: string;
  testNumber?: string;
  amount: number;
  scheduledDate: string;
  paidDate?: string;
  status: PaymentStatus;
  notes?: string;
}

// 지급 현황 요약 인터페이스
export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  completionRate: number;
}

interface PaymentScheduleTableProps {
  contractId: string;
  schedules: PaymentSchedule[];
  summary: PaymentSummary;
  onStatusChange: (scheduleId: string, status: PaymentStatus) => Promise<void>;
  onAddSchedule?: (schedule: Omit<PaymentSchedule, 'id' | 'status'>) => Promise<void>;
  onDeleteSchedule?: (scheduleId: string) => Promise<void>;
  editable?: boolean;
}

/**
 * PaymentScheduleTable 컴포넌트
 * 
 * 시험번호별 지급 일정을 관리하는 테이블입니다.
 * 
 * Requirements 4.6: 지급 상태 변경
 * Requirements 4.7: 지급 현황 요약 표시
 */
export default function PaymentScheduleTable({
  contractId,
  schedules,
  summary,
  onStatusChange,
  onAddSchedule,
  onDeleteSchedule,
  editable = true,
}: PaymentScheduleTableProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    testNumber: '',
    amount: '',
    scheduledDate: '',
    notes: '',
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 금액 포맷팅
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 상태 변경 처리
  const handleStatusChange = async (scheduleId: string, newStatus: PaymentStatus) => {
    setProcessingId(scheduleId);
    try {
      await onStatusChange(scheduleId, newStatus);
      toast({
        title: '상태 변경 완료',
        description: `지급 상태가 ${PAYMENT_STATUS_LABELS[newStatus]}(으)로 변경되었습니다.`,
      });
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // 새 일정 추가
  const handleAddSchedule = async () => {
    if (!onAddSchedule) return;

    if (!newSchedule.amount || !newSchedule.scheduledDate) {
      toast({
        title: '입력 오류',
        description: '금액과 예정일을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onAddSchedule({
        testNumber: newSchedule.testNumber || undefined,
        amount: parseFloat(newSchedule.amount),
        scheduledDate: newSchedule.scheduledDate,
        notes: newSchedule.notes || undefined,
      });

      setNewSchedule({ testNumber: '', amount: '', scheduledDate: '', notes: '' });
      setIsAdding(false);

      toast({
        title: '일정 추가 완료',
        description: '새 지급 일정이 추가되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '일정 추가 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 일정 삭제
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!onDeleteSchedule) return;

    try {
      await onDeleteSchedule(scheduleId);
      toast({
        title: '일정 삭제 완료',
        description: '지급 일정이 삭제되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '일정 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 상태 아이콘
  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'SCHEDULED':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <StitchCard variant="surface-low">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">지급 일정 관리</h3>
          </div>
          <p className="text-sm text-slate-500">
            시험번호별 지급 일정을 관리합니다.
          </p>
        </div>
        {editable && onAddSchedule && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-1" />
            일정 추가
          </Button>
        )}
      </div>
      <div className="space-y-6 mt-6">
        {/* 지급 현황 요약 */}
        <div className="p-4 bg-[#F5EDE3] rounded-xl space-y-3">
          <div className="flex justify-between text-sm">
            <span>지급 진행률</span>
            <span className="font-medium">{summary.completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={summary.completionRate} className="h-2" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">총액</p>
              <p className="font-semibold">{formatCurrency(summary.totalAmount)}원</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">지급완료</p>
              <p className="font-semibold text-emerald-600">{formatCurrency(summary.paidAmount)}원</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">잔액</p>
              <p className="font-semibold text-orange-600">{formatCurrency(summary.remainingAmount)}원</p>
            </div>
          </div>
        </div>

        {/* 새 일정 추가 폼 */}
        {isAdding && (
          <div className="p-4 bg-[#F5EDE3] rounded-xl space-y-4">
            <h4 className="font-bold">새 지급 일정</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시험번호</label>
                <Input
                  placeholder="예: ST-2025-0001"
                  value={newSchedule.testNumber}
                  onChange={(e) => setNewSchedule({ ...newSchedule, testNumber: e.target.value })}
                  className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">금액 *</label>
                <Input
                  type="number"
                  placeholder="금액"
                  value={newSchedule.amount}
                  onChange={(e) => setNewSchedule({ ...newSchedule, amount: e.target.value })}
                  className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">예정일 *</label>
                <Input
                  type="date"
                  value={newSchedule.scheduledDate}
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })}
                  className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">메모</label>
                <Input
                  placeholder="메모"
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsAdding(false)}>
                취소
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold" onClick={handleAddSchedule}>
                추가
              </Button>
            </div>
          </div>
        )}

        {/* 지급 일정 테이블 */}
        {schedules.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <StitchTable className="min-w-[580px]">
              <StitchTableHeader>
                <StitchTableRow>
                  <StitchTableHead>시험번호</StitchTableHead>
                  <StitchTableHead className="text-right whitespace-nowrap">금액</StitchTableHead>
                  <StitchTableHead className="whitespace-nowrap">예정일</StitchTableHead>
                  <StitchTableHead className="whitespace-nowrap">지급일</StitchTableHead>
                  <StitchTableHead>상태</StitchTableHead>
                  {editable && <StitchTableHead className="text-right">작업</StitchTableHead>}
                </StitchTableRow>
              </StitchTableHeader>
            <StitchTableBody>
              {schedules.map((schedule) => (
                <StitchTableRow key={schedule.id}>
                  <StitchTableCell className="font-bold">
                    {schedule.testNumber || '-'}
                  </StitchTableCell>
                  <StitchTableCell className="text-right whitespace-nowrap">
                    {formatCurrency(schedule.amount)}원
                  </StitchTableCell>
                  <StitchTableCell>{formatDate(schedule.scheduledDate)}</StitchTableCell>
                  <StitchTableCell>
                    {schedule.paidDate ? formatDate(schedule.paidDate) : '-'}
                  </StitchTableCell>
                  <StitchTableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(schedule.status)}
                      {editable && schedule.status !== 'PAID' ? (
                        <Select
                          value={schedule.status}
                          onValueChange={(value) => handleStatusChange(schedule.id, value as PaymentStatus)}
                          disabled={processingId === schedule.id}
                        >
                          <SelectTrigger className="w-24 h-8 bg-white border-none rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <StitchBadge
                          variant={
                            schedule.status === 'PAID'
                              ? 'success'
                              : schedule.status === 'OVERDUE'
                              ? 'error'
                              : 'neutral'
                          }
                        >
                          {PAYMENT_STATUS_LABELS[schedule.status]}
                        </StitchBadge>
                      )}
                    </div>
                  </StitchTableCell>
                  {editable && (
                    <StitchTableCell className="text-right">
                      {schedule.status !== 'PAID' && onDeleteSchedule && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </StitchTableCell>
                  )}
                </StitchTableRow>
              ))}
            </StitchTableBody>
          </StitchTable>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            등록된 지급 일정이 없습니다.
          </div>
        )}
      </div>
    </StitchCard>
  );
}
