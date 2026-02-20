'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              지급 일정 관리
            </CardTitle>
            <CardDescription>
              시험번호별 지급 일정을 관리합니다.
            </CardDescription>
          </div>
          {editable && onAddSchedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
            >
              <Plus className="h-4 w-4 mr-1" />
              일정 추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 지급 현황 요약 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <div className="flex justify-between text-sm">
            <span>지급 진행률</span>
            <span className="font-medium">{summary.completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={summary.completionRate} className="h-2" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">총액</p>
              <p className="font-semibold">{formatCurrency(summary.totalAmount)}원</p>
            </div>
            <div>
              <p className="text-gray-500">지급완료</p>
              <p className="font-semibold text-green-600">{formatCurrency(summary.paidAmount)}원</p>
            </div>
            <div>
              <p className="text-gray-500">잔액</p>
              <p className="font-semibold text-orange-600">{formatCurrency(summary.remainingAmount)}원</p>
            </div>
          </div>
        </div>

        {/* 새 일정 추가 폼 */}
        {isAdding && (
          <div className="p-4 border rounded-lg space-y-4">
            <h4 className="font-medium">새 지급 일정</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">시험번호</label>
                <Input
                  placeholder="예: ST-2025-0001"
                  value={newSchedule.testNumber}
                  onChange={(e) => setNewSchedule({ ...newSchedule, testNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">금액 *</label>
                <Input
                  type="number"
                  placeholder="금액"
                  value={newSchedule.amount}
                  onChange={(e) => setNewSchedule({ ...newSchedule, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">예정일 *</label>
                <Input
                  type="date"
                  value={newSchedule.scheduledDate}
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">메모</label>
                <Input
                  placeholder="메모"
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                취소
              </Button>
              <Button size="sm" onClick={handleAddSchedule}>
                추가
              </Button>
            </div>
          </div>
        )}

        {/* 지급 일정 테이블 */}
        {schedules.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="min-w-[580px]">
              <TableHeader>
                <TableRow>
                  <TableHead>시험번호</TableHead>
                  <TableHead className="text-right whitespace-nowrap">금액</TableHead>
                  <TableHead className="whitespace-nowrap">예정일</TableHead>
                  <TableHead className="whitespace-nowrap">지급일</TableHead>
                  <TableHead>상태</TableHead>
                  {editable && <TableHead className="text-right">작업</TableHead>}
                </TableRow>
              </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    {schedule.testNumber || '-'}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(schedule.amount)}원
                  </TableCell>
                  <TableCell>{formatDate(schedule.scheduledDate)}</TableCell>
                  <TableCell>
                    {schedule.paidDate ? formatDate(schedule.paidDate) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(schedule.status)}
                      {editable && schedule.status !== 'PAID' ? (
                        <Select
                          value={schedule.status}
                          onValueChange={(value) => handleStatusChange(schedule.id, value as PaymentStatus)}
                          disabled={processingId === schedule.id}
                        >
                          <SelectTrigger className="w-24 h-8">
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
                        <Badge
                          variant={
                            schedule.status === 'PAID'
                              ? 'default'
                              : schedule.status === 'OVERDUE'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {PAYMENT_STATUS_LABELS[schedule.status]}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {editable && (
                    <TableCell className="text-right">
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
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            등록된 지급 일정이 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
