'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DashboardPersonalStats } from '@/lib/dashboard-api';
import { FileText, TrendingUp, Users } from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PersonalDashboardProps {
  stats: DashboardPersonalStats;
  userName: string;
  period: { year: number; month: number };
}

function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}천만`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }
  return amount.toLocaleString();
}

const statCards = [
  { key: 'quotation', label: '내 견적 금액', icon: FileText, color: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/30', href: '/quotations' },
  { key: 'contract', label: '내 계약 금액', icon: WonSign, color: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', href: '/contracts' },
  { key: 'kpi', label: '내 수주율', icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/30', href: '/reports' },
  { key: 'lead', label: '내 리드', icon: Users, color: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-100 dark:bg-violet-900/30', href: '/leads' },
] as const;

export default function PersonalDashboard({ stats, userName, period }: PersonalDashboardProps) {
  const { quotation, contract, lead, kpi } = stats;

  const getValue = (key: string) => {
    switch (key) {
      case 'quotation': return formatAmount(quotation.amount);
      case 'contract': return formatAmount(contract.amount);
      case 'kpi': return `${kpi.conversionRate}%`;
      case 'lead': return `${lead.count}건`;
      default: return '-';
    }
  };

  const getSub = (key: string) => {
    switch (key) {
      case 'quotation': return `${quotation.count}건`;
      case 'contract': return `${contract.count}건`;
      case 'kpi': return `수주 ${kpi.won} / 실주 ${kpi.lost}`;
      case 'lead': return '신규 문의';
      default: return '';
    }
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-foreground">{userName}님의 현황</h2>
        <span className="text-xs text-muted-foreground">{period.year}년 {period.month}월</span>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ key, label, icon: Icon, color, iconBg, href }) => (
          <Link key={key} href={href}>
            <Card className="shadow-soft hover:shadow-soft-lg transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('p-1.5 rounded-md', iconBg)}>
                    <Icon className={cn('w-3.5 h-3.5', color)} />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className={cn('text-xl font-semibold', color)}>
                  {getValue(key)}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {getSub(key)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 견적서 상태별 현황 */}
      {quotation.byStatus && Object.keys(quotation.byStatus).length > 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">견적서 상태별 현황</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'DRAFT', label: '작성중', color: '' },
                { key: 'SENT', label: '발송완료', color: 'text-blue-600' },
                { key: 'ACCEPTED', label: '수주', color: 'text-emerald-600' },
                { key: 'REJECTED', label: '실주', color: 'text-red-500' },
              ].map(({ key, label, color: textColor }) => (
                <div key={key} className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                  <div className={cn('text-lg font-semibold mt-0.5', textColor)}>
                    {quotation.byStatus?.[key]?.count || 0}건
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
