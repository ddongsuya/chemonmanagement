'use client';

import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Receipt,
  MessageSquare,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import { InvoiceSchedule, MeetingRecord } from '@/types/customer';
import { invoiceScheduleApi, meetingRecordApi } from '@/lib/customer-data-api';
import { formatCurrency } from '@/lib/utils';
import { getUrgentItems, AlertItem } from '@/lib/urgent-items';

/**
 * CustomerAlerts - 긴급 처리 필요 항목 알림 표시
 * Requirements: 7.2 - 긴급 처리가 필요한 항목이 존재하면 해당 항목을 상단 알림 영역에 강조 표시
 */

interface CustomerAlertsProps {
  customerId: string;
  onNavigate?: (tab: string, itemId?: string) => void;
}

export default function CustomerAlerts({
  customerId,
  onNavigate,
}: CustomerAlertsProps) {
  const [invoiceSchedules, setInvoiceSchedules] = useState<InvoiceSchedule[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MeetingRecord[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoices, meetings] = await Promise.all([
          invoiceScheduleApi.getByCustomerId(customerId),
          meetingRecordApi.getByCustomerId(customerId, { pendingOnly: true }),
        ]);
        setInvoiceSchedules(invoices);
        setPendingRequests(meetings);
      } catch (error) {
        console.error('Failed to load alert data:', error);
      }
    };

    loadData();
  }, [customerId]);

  // 긴급 항목 필터링
  const urgentItems = useMemo(() => {
    return getUrgentItems(invoiceSchedules, pendingRequests);
  }, [invoiceSchedules, pendingRequests]);

  // 표시할 알림 (해제된 항목 제외)
  const visibleAlerts = urgentItems.filter(
    (item) => !dismissedAlerts.has(item.id)
  );

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      return newSet;
    });
  };

  const handleNavigate = (item: AlertItem) => {
    onNavigate?.(item.targetTab, item.id);
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  // 요약 통계
  const overdueCount = visibleAlerts.filter(
    (a) => a.type === 'invoice_overdue'
  ).length;
  const upcomingCount = visibleAlerts.filter(
    (a) => a.type === 'invoice_upcoming'
  ).length;
  const requestCount = visibleAlerts.filter(
    (a) => a.type === 'request_pending'
  ).length;

  return (
    <div className="space-y-3 mb-6">
      {/* 요약 알림 */}
      <Alert
        variant={overdueCount > 0 ? 'destructive' : 'default'}
        className={
          overdueCount > 0
            ? ''
            : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
        }
      >
        <AlertTriangle
          className={`h-4 w-4 ${
            overdueCount > 0 ? '' : 'text-yellow-500'
          }`}
        />
        <AlertTitle
          className={overdueCount > 0 ? '' : 'text-yellow-700 dark:text-yellow-400'}
        >
          긴급 처리 필요 항목
        </AlertTitle>
        <AlertDescription
          className={overdueCount > 0 ? '' : 'text-yellow-600 dark:text-yellow-300'}
        >
          <div className="flex flex-wrap gap-2 mt-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Receipt className="w-3 h-3" />
                연체 {overdueCount}건
              </Badge>
            )}
            {upcomingCount > 0 && (
              <Badge
                variant="outline"
                className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400"
              >
                <Clock className="w-3 h-3" />
                발행 임박 {upcomingCount}건
              </Badge>
            )}
            {requestCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="w-3 h-3" />
                미처리 요청 {requestCount}건
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* 개별 알림 목록 (최대 5개) */}
      <div className="space-y-2">
        {visibleAlerts.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              item.severity === 'error'
                ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.severity === 'error'
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'
                }`}
              >
                {item.type === 'request_pending' ? (
                  <MessageSquare className="w-4 h-4" />
                ) : (
                  <Receipt className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      item.severity === 'error'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.amount && (
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate(item)}
                className="h-8 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(item.id)}
                className="h-8 px-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 더 많은 알림이 있는 경우 */}
      {visibleAlerts.length > 5 && (
        <p className="text-sm text-gray-500 text-center">
          외 {visibleAlerts.length - 5}건의 알림이 있습니다.
        </p>
      )}
    </div>
  );
}
