'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, FileText, Receipt, FlaskConical, AlertCircle, Loader2, Inbox
} from 'lucide-react';
import Link from 'next/link';
import { getWorkItems, WorkItemsResponse } from '@/lib/dashboard-api';
import { cn } from '@/lib/utils';

function formatAmount(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}천만`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
  if (diff === 0) return `오늘 (${dateLabel})`;
  if (diff === 1) return `내일 (${dateLabel})`;
  if (diff < 0) return `${Math.abs(diff)}일 전 (${dateLabel})`;
  return `${diff}일 후 (${dateLabel})`;
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  meeting: '미팅', call: '전화', email: '이메일', visit: '방문'
};

export default function WorkDashboard() {
  const [data, setData] = useState<WorkItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkItems().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">처리할 업무 항목이 없습니다</p>
        <p className="text-xs mt-1">모든 업무가 정리되어 있어요</p>
      </div>
    );
  }

  const sections = [
    {
      id: 'meetings',
      title: '다가오는 미팅',
      icon: Calendar,
      count: data.summary.meetings,
      items: data.upcomingMeetings,
      render: (item: typeof data.upcomingMeetings[0]) => (
        <Link key={item.id} href={`/customers/${item.customer.id}`}>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.customer.companyName} · {MEETING_TYPE_LABELS[item.type] || item.type}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-xs font-medium">{formatDate(item.date)}</p>
              {item.time && <p className="text-[11px] text-muted-foreground">{item.time}</p>}
            </div>
          </div>
        </Link>
      )
    },
    {
      id: 'quotations',
      title: '견적서 후속 조치',
      icon: FileText,
      count: data.summary.quotations,
      items: data.pendingQuotations,
      render: (item: typeof data.pendingQuotations[0]) => (
        <Link key={item.id} href={item.quotationType === 'EFFICACY' ? `/efficacy-quotations/${item.id}` : `/quotations/${item.id}`}>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.quotationNumber}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.customerName} · {formatAmount(Number(item.totalAmount))}
              </p>
            </div>
            <Badge variant="outline" className="flex-shrink-0 ml-3 text-amber-600 border-amber-300">
              {daysAgo(item.createdAt)}일 경과
            </Badge>
          </div>
        </Link>
      )
    },
    {
      id: 'invoices',
      title: '세금계산서 임박',
      icon: Receipt,
      count: data.summary.invoices,
      items: data.upcomingInvoices,
      render: (item: typeof data.upcomingInvoices[0]) => (
        <Link key={item.id} href={`/customers/${item.customer.id}`}>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.customer.companyName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.testReception?.testNumber || '미지정'} · {formatAmount(Number(item.amount))}
              </p>
            </div>
            <p className="text-xs font-medium flex-shrink-0 ml-3">{formatDate(item.scheduledDate)}</p>
          </div>
        </Link>
      )
    },
    {
      id: 'tests',
      title: '시험 완료 예정',
      icon: FlaskConical,
      count: data.summary.tests,
      items: data.upcomingTests,
      render: (item: typeof data.upcomingTests[0]) => (
        <Link key={item.id} href={`/customers/${item.customer.id}`}>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.testNumber || item.testTitle || '미지정'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.customer.companyName}</p>
            </div>
            <p className="text-xs font-medium flex-shrink-0 ml-3">{formatDate(item.expectedCompletionDate)}</p>
          </div>
        </Link>
      )
    },
    {
      id: 'followUps',
      title: '후속 조치 필요',
      icon: AlertCircle,
      count: data.summary.followUps,
      items: data.pendingFollowUps,
      render: (item: typeof data.pendingFollowUps[0]) => (
        <Link key={item.id} href={`/customers/${item.customer.id}`}>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {item.customer.companyName}
                {item.followUpActions && ` · ${item.followUpActions.slice(0, 30)}`}
              </p>
            </div>
            <Badge variant="outline" className={cn(
              'flex-shrink-0 ml-3',
              item.requestStatus === 'pending' ? 'text-red-500 border-red-300' : 'text-amber-600 border-amber-300'
            )}>
              {item.requestStatus === 'pending' ? '대기' : '진행중'}
            </Badge>
          </div>
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* 요약 배지 */}
      <div className="flex flex-wrap gap-2">
        {sections.filter(s => s.count > 0).map(s => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs">
              <Icon className="w-3 h-3 text-muted-foreground" />
              <span>{s.title}</span>
              <span className="font-semibold">{s.count}</span>
            </div>
          );
        })}
      </div>

      {/* 섹션별 카드 */}
      {sections.filter(s => s.count > 0).map(section => {
        const Icon = section.icon;
        return (
          <Card key={section.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">{section.title}</h3>
                <span className="text-xs text-muted-foreground">({section.count})</span>
              </div>
              <div className="divide-y divide-border/50">
                {section.items.map((item: any) => section.render(item))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
