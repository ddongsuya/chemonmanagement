'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Receipt, AlertCircle, AlertTriangle } from 'lucide-react';
import { InvoiceSchedule, TestReception } from '@/types/customer';
import { invoiceScheduleApi, testReceptionApi } from '@/lib/customer-data-api';
import InvoiceScheduleForm from '../InvoiceScheduleForm';
import InvoiceScheduleTable from '../InvoiceScheduleTable';

interface InvoiceScheduleTabProps {
  customerId: string;
}

// 7일 이내 발행 예정인지 확인
function isScheduledWithinDays(scheduledDate: string, days: number): boolean {
  const now = new Date();
  const scheduled = new Date(scheduledDate);
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return scheduled >= now && scheduled <= futureDate;
}

export default function InvoiceScheduleTab({ customerId }: InvoiceScheduleTabProps) {
  const [invoiceSchedules, setInvoiceSchedules] = useState<InvoiceSchedule[]>([]);
  const [testReceptions, setTestReceptions] = useState<TestReception[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceSchedule['status']>('all');
  const [testReceptionFilter, setTestReceptionFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InvoiceSchedule | undefined>();
  const [selectedTestReception, setSelectedTestReception] = useState<TestReception | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedules, receptions] = await Promise.all([
        invoiceScheduleApi.getByCustomerId(customerId),
        testReceptionApi.getByCustomerId(customerId),
      ]);
      setInvoiceSchedules(schedules);
      setTestReceptions(receptions);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  // 필터링된 세금계산서 일정 목록 - Requirements 3.3
  const filteredSchedules = useMemo(() => {
    return invoiceSchedules.filter((schedule) => {
      // 상태 필터
      const matchesStatus =
        statusFilter === 'all' || schedule.status === statusFilter;

      // 시험 접수 필터
      const matchesTestReception =
        testReceptionFilter === 'all' ||
        schedule.test_reception_id === testReceptionFilter;

      return matchesStatus && matchesTestReception;
    });
  }, [invoiceSchedules, statusFilter, testReceptionFilter]);

  // 임박 발행 일정 수 - Requirements 3.4
  const upcomingCount = useMemo(() => {
    return invoiceSchedules.filter(
      (s) => s.status === 'pending' && isScheduledWithinDays(s.scheduled_date, 7)
    ).length;
  }, [invoiceSchedules]);

  // 연체 일정 수
  const overdueCount = useMemo(() => {
    return invoiceSchedules.filter(
      (s) => s.status === 'pending' && new Date(s.scheduled_date) < new Date()
    ).length;
  }, [invoiceSchedules]);

  const handleEdit = (schedule: InvoiceSchedule) => {
    setEditingSchedule(schedule);
    // 해당 시험 접수 찾기
    const reception = testReceptions.find(
      (r) => r.id === schedule.test_reception_id
    );
    setSelectedTestReception(reception);
    setIsFormOpen(true);
  };

  const handleAddNew = (testReception?: TestReception) => {
    setEditingSchedule(undefined);
    setSelectedTestReception(testReception);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSchedule(undefined);
    setSelectedTestReception(undefined);
    loadData();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSchedule(undefined);
    setSelectedTestReception(undefined);
  };

  // 총 금액 계산
  const totalAmount = filteredSchedules.reduce((sum, s) => sum + s.amount, 0);
  const pendingAmount = filteredSchedules
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.amount, 0);
  const issuedAmount = filteredSchedules
    .filter((s) => s.status === 'issued' || s.status === 'paid')
    .reduce((sum, s) => sum + s.amount, 0);

  // 시험 접수가 없으면 등록 불가
  const canAddSchedule = testReceptions.length > 0;


  return (
    <div className="space-y-4">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">세금계산서 발행 일정</h2>
          <span className="text-sm text-gray-500">
            ({filteredSchedules.length}건)
          </span>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleAddNew()}
              disabled={!canAddSchedule}
            >
              <Plus className="w-4 h-4 mr-2" />
              일정 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            {/* 시험 접수 선택 (신규 등록 시) */}
            {!editingSchedule && !selectedTestReception && (
              <div className="space-y-4 py-4">
                <h3 className="font-medium">시험 접수 선택</h3>
                <p className="text-sm text-gray-500">
                  세금계산서 일정을 등록할 시험을 선택하세요.
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {testReceptions.map((reception) => (
                    <button
                      key={reception.id}
                      onClick={() => handleAddNew(reception)}
                      className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="font-medium">{reception.test_number}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {reception.test_title}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        총 금액:{' '}
                        {new Intl.NumberFormat('ko-KR').format(reception.total_amount)}원
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* 폼 표시 (시험 접수 선택 후 또는 수정 시) */}
            {(selectedTestReception || editingSchedule) && (
              <InvoiceScheduleForm
                customerId={customerId}
                testReception={selectedTestReception}
                invoiceSchedule={editingSchedule}
                onSuccess={handleFormSuccess}
                onCancel={handleFormClose}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* 시험 접수 없음 경고 */}
      {!canAddSchedule && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            세금계산서 일정을 등록하려면 먼저 시험 접수를 등록해야 합니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 임박/연체 알림 - Requirements 3.4 */}
      {(upcomingCount > 0 || overdueCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {overdueCount > 0 && (
            <Alert variant="destructive" className="flex-1 min-w-[200px]">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                연체된 발행 일정이 {overdueCount}건 있습니다.
              </AlertDescription>
            </Alert>
          )}
          {upcomingCount > 0 && (
            <Alert className="flex-1 min-w-[200px] border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                7일 이내 발행 예정 일정이 {upcomingCount}건 있습니다.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | InvoiceSchedule['status']) =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="issued">발행완료</SelectItem>
            <SelectItem value="paid">입금완료</SelectItem>
            <SelectItem value="overdue">연체</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={testReceptionFilter}
          onValueChange={setTestReceptionFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="시험 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 시험</SelectItem>
            {testReceptions.map((reception) => (
              <SelectItem key={reception.id} value={reception.id}>
                {reception.test_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 요약 정보 */}
      {filteredSchedules.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 justify-end">
          <div>
            총 금액:{' '}
            <span className="font-semibold">
              {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
            </span>
          </div>
          <div>
            대기:{' '}
            <span className="font-semibold text-yellow-600">
              {new Intl.NumberFormat('ko-KR').format(pendingAmount)}원
            </span>
          </div>
          <div>
            발행완료:{' '}
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('ko-KR').format(issuedAmount)}원
            </span>
          </div>
        </div>
      )}

      {/* 세금계산서 일정 테이블 - Requirements 3.3, 3.4, 3.5 */}
      <InvoiceScheduleTable
        invoiceSchedules={filteredSchedules}
        onEdit={handleEdit}
        onStatusChange={loadData}
      />
    </div>
  );
}
