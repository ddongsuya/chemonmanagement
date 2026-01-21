/**
 * 긴급 항목 필터링 유틸리티
 * Requirements: 7.2 - 긴급 처리가 필요한 항목 필터링
 */

import { InvoiceSchedule, MeetingRecord } from '@/types/customer';
import { formatDate, formatCurrency } from '@/lib/utils';

/**
 * 주어진 날짜가 지정된 일수 이내인지 확인
 */
export function isScheduledWithinDays(scheduledDate: string, days: number): boolean {
  const now = new Date();
  const scheduled = new Date(scheduledDate);
  const diffTime = scheduled.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

export interface AlertItem {
  id: string;
  type: 'invoice_upcoming' | 'invoice_overdue' | 'request_pending';
  title: string;
  description: string;
  date?: string;
  amount?: number;
  severity: 'warning' | 'error';
  targetTab: string;
}

/**
 * 긴급 항목 필터링 함수 - Property 20 테스트 대상
 * 발행 예정일 임박, 미처리 요청사항 등 긴급 처리가 필요한 항목을 필터링
 * 
 * @param invoiceSchedules - 세금계산서 발행 일정 목록
 * @param pendingRequests - 미처리 요청사항 목록
 * @param daysThreshold - 임박 기준 일수 (기본 7일)
 * @returns 긴급 항목 목록 (긴급도 순 정렬)
 */
export function getUrgentItems(
  invoiceSchedules: InvoiceSchedule[],
  pendingRequests: MeetingRecord[],
  daysThreshold: number = 7
): AlertItem[] {
  const items: AlertItem[] = [];
  const now = new Date();

  // 연체된 세금계산서 (가장 긴급)
  invoiceSchedules
    .filter((s) => s.status === 'pending' && new Date(s.scheduled_date) < now)
    .forEach((schedule) => {
      items.push({
        id: `invoice-overdue-${schedule.id}`,
        type: 'invoice_overdue',
        title: '세금계산서 발행 연체',
        description: `발행 예정일: ${formatDate(schedule.scheduled_date)}`,
        date: schedule.scheduled_date,
        amount: schedule.amount,
        severity: 'error',
        targetTab: 'invoices',
      });
    });

  // 임박한 세금계산서 발행 일정 (threshold 일 이내)
  invoiceSchedules
    .filter(
      (s) =>
        s.status === 'pending' &&
        new Date(s.scheduled_date) >= now &&
        isScheduledWithinDays(s.scheduled_date, daysThreshold)
    )
    .forEach((schedule) => {
      items.push({
        id: `invoice-upcoming-${schedule.id}`,
        type: 'invoice_upcoming',
        title: '세금계산서 발행 예정',
        description: `발행 예정일: ${formatDate(schedule.scheduled_date)}`,
        date: schedule.scheduled_date,
        amount: schedule.amount,
        severity: 'warning',
        targetTab: 'invoices',
      });
    });

  // 미처리 요청사항
  pendingRequests.forEach((request) => {
    items.push({
      id: `request-pending-${request.id}`,
      type: 'request_pending',
      title: '미처리 요청사항',
      description: request.title,
      date: request.date,
      severity: 'warning',
      targetTab: 'meetings',
    });
  });

  // 긴급도 순으로 정렬 (error > warning, 날짜 오름차순)
  return items.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'error' ? -1 : 1;
    }
    if (a.date && b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return 0;
  });
}
