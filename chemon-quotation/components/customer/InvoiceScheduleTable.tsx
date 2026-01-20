'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoreHorizontal,
  Edit,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Loader2,
} from 'lucide-react';
import { InvoiceSchedule } from '@/types/customer';
import { invoiceScheduleApi } from '@/lib/customer-data-api';

interface InvoiceScheduleTableProps {
  invoiceSchedules: InvoiceSchedule[];
  onEdit?: (schedule: InvoiceSchedule) => void;
  onStatusChange?: () => void;
}

// 7일 이내 발행 예정인지 확인
function isScheduledWithinDays(scheduledDate: string, days: number): boolean {
  const now = new Date();
  const scheduled = new Date(scheduledDate);
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return scheduled >= now && scheduled <= futureDate;
}

// 상태별 배지 스타일 - Requirements 3.3, 3.5
const statusConfig: Record<
  InvoiceSchedule['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: '대기', variant: 'secondary' },
  issued: { label: '발행완료', variant: 'default' },
  paid: { label: '입금완료', variant: 'outline' },
  overdue: { label: '연체', variant: 'destructive' },
};

// 금액 포맷팅
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

// 날짜 포맷팅
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function InvoiceScheduleTable({
  invoiceSchedules,
  onEdit,
  onStatusChange,
}: InvoiceScheduleTableProps) {
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<InvoiceSchedule | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuing, setIssuing] = useState(false);

  // 발행 완료 처리 다이얼로그 열기 - Requirements 3.5
  const handleIssueClick = (schedule: InvoiceSchedule) => {
    setSelectedSchedule(schedule);
    setInvoiceNumber('');
    setIssueDialogOpen(true);
  };

  // 발행 완료 처리 - Requirements 3.5
  const handleIssueConfirm = async () => {
    if (!selectedSchedule || !invoiceNumber.trim()) return;

    setIssuing(true);
    try {
      await invoiceScheduleApi.markAsIssued(selectedSchedule.id, invoiceNumber.trim());
      setIssueDialogOpen(false);
      setSelectedSchedule(null);
      setInvoiceNumber('');
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to mark invoice as issued:', error);
    } finally {
      setIssuing(false);
    }
  };

  if (invoiceSchedules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>등록된 세금계산서 일정이 없습니다.</p>
      </div>
    );
  }


  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">회차</TableHead>
              <TableHead className="w-[120px] text-right">금액</TableHead>
              <TableHead className="w-[120px]">발행예정일</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead className="w-[120px]">발행일</TableHead>
              <TableHead className="w-[150px]">세금계산서번호</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoiceSchedules.map((schedule) => {
              const status = statusConfig[schedule.status];
              // 임박 항목 강조 - Requirements 3.4
              const isUpcoming =
                schedule.status === 'pending' &&
                isScheduledWithinDays(schedule.scheduled_date, 7);
              const isOverdue =
                schedule.status === 'pending' &&
                new Date(schedule.scheduled_date) < new Date();

              return (
                <TableRow
                  key={schedule.id}
                  className={
                    isOverdue
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : isUpcoming
                      ? 'bg-yellow-50 dark:bg-yellow-950/20'
                      : ''
                  }
                >
                  <TableCell className="font-medium">
                    {schedule.payment_type === 'partial' ? (
                      <span>
                        {schedule.installment_number}/{schedule.total_installments}회
                      </span>
                    ) : (
                      <span>전액</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(schedule.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {formatDate(schedule.scheduled_date)}
                      {/* 임박 경고 아이콘 - Requirements 3.4 */}
                      {isUpcoming && !isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      {isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isOverdue ? 'destructive' : status.variant}>
                      {isOverdue ? '연체' : status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {schedule.issued_date ? formatDate(schedule.issued_date) : '-'}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {schedule.invoice_number || '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">메뉴 열기</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && schedule.status === 'pending' && (
                          <DropdownMenuItem onClick={() => onEdit(schedule)}>
                            <Edit className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                        )}
                        {schedule.status === 'pending' && (
                          <>
                            {onEdit && <DropdownMenuSeparator />}
                            <DropdownMenuItem onClick={() => handleIssueClick(schedule)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              발행 완료 처리
                            </DropdownMenuItem>
                          </>
                        )}
                        {schedule.status !== 'pending' && (
                          <DropdownMenuItem disabled>
                            <span className="text-gray-400">처리 완료됨</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 발행 완료 처리 다이얼로그 - Requirements 3.5 */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>세금계산서 발행 완료 처리</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSchedule && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">금액</span>
                  <span className="font-medium">
                    {formatCurrency(selectedSchedule.amount)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">발행예정일</span>
                  <span>{formatDate(selectedSchedule.scheduled_date)}</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">
                세금계산서 번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="예: 20241222-12345678"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIssueDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleIssueConfirm}
              disabled={!invoiceNumber.trim() || issuing}
            >
              {issuing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              발행 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
