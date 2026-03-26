'use client';

import { useState, useEffect } from 'react';
import { StitchCard } from '@/components/ui/StitchCard';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, FileText, Receipt, FlaskConical, AlertCircle, Loader2,
  CheckCircle2
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

  const summary = data?.summary || { meetings: 0, quotations: 0, invoices: 0, tests: 0, followUps: 0, total: 0 };

  // 섹션 정의 (항상 모두 표시)
  const sections = [
    {
      id: 'meetings',
      title: '다가오는 미팅',
      description: '향후 7일 내 미팅 일정',
      icon: Calendar,
      count: summary.meetings,
      emptyText: '예정된 미팅이 없습니다',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      id: 'quotations',
      title: '견적서 후속 조치',
      description: '발송 후 7일 이상 미응답',
      icon: FileText,
      count: summary.quotations,
      emptyText: '미응답 견적서가 없습니다',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      id: 'invoices',
      title: '세금계산서 임박',
      description: '7일 이내 발행 예정',
      icon: Receipt,
      count: summary.invoices,
      emptyText: '임박한 세금계산서가 없습니다',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      id: 'tests',
      title: '시험 완료 예정',
      description: '7일 이내 완료 예정 시험',
      icon: FlaskConical,
      count: summary.tests,
      emptyText: '완료 예정 시험이 없습니다',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      id: 'followUps',
      title: '후속 조치 필요',
      description: '미완료 요청사항',
      icon: AlertCircle,
      count: summary.followUps,
      emptyText: '미완료 후속 조치가 없습니다',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 요약 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sections.map(s => {
          const Icon = s.icon;
          const hasItems = s.count > 0;
          return (
            <StitchCard key={s.id} variant="elevated" padding="sm" className={cn(hasItems && 'ring-1 ring-[#EFE7DD]')}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('p-1.5 rounded-xl', s.bgColor)}>
                    <Icon className={cn('w-3.5 h-3.5', s.color)} />
                  </div>
                </div>
                <p className="text-xl font-black tracking-tighter">{s.count}건</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5 truncate">{s.title}</p>
            </StitchCard>
          );
        })}
      </div>

      {/* 섹션별 상세 카드 (항상 모두 표시) */}
      {sections.map(section => {
        const Icon = section.icon;
        const hasItems = section.count > 0;

        return (
          <StitchCard key={section.id} variant="elevated" padding="sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1 rounded-xl', section.bgColor)}>
                    <Icon className={cn('w-3.5 h-3.5', section.color)} />
                  </div>
                  <h3 className="text-sm font-bold">{section.title}</h3>
                  {hasItems && (
                    <span className="text-xs text-slate-500">({section.count})</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">{section.description}</span>
              </div>

              {!hasItems ? (
                <div className="flex items-center gap-2 py-3 px-2 text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs">{section.emptyText}</span>
                </div>
              ) : (
                <div className="divide-y divide-[#EFE7DD]/50">
                  {section.id === 'meetings' && data?.upcomingMeetings.map(item => (
                    <Link key={item.id} href={`/customers/${item.customer.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF8F1] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.customer.companyName} · {MEETING_TYPE_LABELS[item.type] || item.type}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-xs font-medium">{formatDate(item.date)}</p>
                          {item.time && <p className="text-[11px] text-muted-foreground">{item.time}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {section.id === 'quotations' && data?.pendingQuotations.map(item => (
                    <Link key={item.id} href={item.quotationType === 'EFFICACY' ? `/efficacy-quotations/${item.id}` : `/quotations/${item.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF8F1] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.quotationNumber}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.customerName} · {formatAmount(Number(item.totalAmount))}
                          </p>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 ml-3 text-amber-600 border-amber-300">
                          {daysAgo(item.createdAt)}일 경과
                        </Badge>
                      </div>
                    </Link>
                  ))}

                  {section.id === 'invoices' && data?.upcomingInvoices.map(item => (
                    <Link key={item.id} href={`/customers/${item.customer.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF8F1] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.customer.companyName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.testReception?.testNumber || '미지정'} · {formatAmount(Number(item.amount))}
                          </p>
                        </div>
                        <p className="text-xs font-medium flex-shrink-0 ml-3">{formatDate(item.scheduledDate)}</p>
                      </div>
                    </Link>
                  ))}

                  {section.id === 'tests' && data?.upcomingTests.map(item => (
                    <Link key={item.id} href={`/customers/${item.customer.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF8F1] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.testNumber || item.testTitle || '미지정'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.customer.companyName}</p>
                        </div>
                        <p className="text-xs font-medium flex-shrink-0 ml-3">{formatDate(item.expectedCompletionDate)}</p>
                      </div>
                    </Link>
                  ))}

                  {section.id === 'followUps' && data?.pendingFollowUps.map(item => (
                    <Link key={item.id} href={`/customers/${item.customer.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF8F1] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
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
                  ))}
                </div>
              )}
            </div>
          </StitchCard>
        );
      })}
    </div>
  );
}
