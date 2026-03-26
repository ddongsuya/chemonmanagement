'use client';

import { StitchCard } from '@/components/ui/StitchCard';
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
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}천만`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
}

const statCards = [
  { key: 'quotation', label: '내 견적 금액', icon: FileText, href: '/quotations' },
  { key: 'contract', label: '내 계약 금액', icon: WonSign, href: '/contracts' },
  { key: 'kpi', label: '내 수주율', icon: TrendingUp, href: '/reports' },
  { key: 'lead', label: '내 리드', icon: Users, href: '/leads' },
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
        <span className="text-xs text-slate-500">{period.year}년 {period.month}월</span>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ key, label, icon: Icon, href }) => (
          <Link key={key} href={href}>
            <StitchCard variant="elevated" hover padding="sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-xl bg-[#FAF2E9]">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
              <div className="text-xl font-black tracking-tighter text-foreground">
                {getValue(key)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {getSub(key)}
              </div>
            </StitchCard>
          </Link>
        ))}
      </div>

      {/* 견적서 상태별 현황 */}
      {quotation.byStatus && Object.keys(quotation.byStatus).length > 0 && (
        <StitchCard variant="elevated" padding="md">
          <h3 className="text-sm font-medium mb-3">견적서 상태별 현황</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'DRAFT', label: '작성중', color: '' },
              { key: 'SENT', label: '발송완료', color: 'text-blue-600' },
              { key: 'ACCEPTED', label: '수주', color: 'text-emerald-600' },
              { key: 'REJECTED', label: '실주', color: 'text-red-500' },
            ].map(({ key, label, color: textColor }) => (
              <div key={key} className="p-3 bg-[#FAF2E9] rounded-lg">
                <div className="text-[11px] text-slate-500">{label}</div>
                <div className={cn('text-lg font-black tracking-tighter mt-0.5', textColor)}>
                  {quotation.byStatus?.[key]?.count || 0}건
                </div>
              </div>
            ))}
          </div>
        </StitchCard>
      )}
    </div>
  );
}
