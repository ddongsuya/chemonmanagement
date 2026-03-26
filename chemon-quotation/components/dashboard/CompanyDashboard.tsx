'use client';

import { StitchCard } from '@/components/ui/StitchCard';
import {
  DashboardStatsResponse,
} from '@/lib/dashboard-api';
import { Building2, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyDashboardProps {
  stats: DashboardStatsResponse;
}

function formatAmount(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}천만`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
}

const companyStatItems = [
  { key: 'quotation', label: '전사 견적 금액' },
  { key: 'contract', label: '전사 계약 금액' },
  { key: 'kpi', label: '전사 수주율' },
  { key: 'lead', label: '전사 리드' },
] as const;

export default function CompanyDashboard({ stats }: CompanyDashboardProps) {
  const { company, byDepartment, userRanking } = stats;

  if (!company) return null;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-baseline gap-2">
        <Building2 className="w-4 h-4 text-slate-500" />
        <h2 className="text-base font-semibold text-foreground">전사 현황</h2>
        <span className="text-xs text-slate-500">{stats.period.year}년 {stats.period.month}월</span>
      </div>

      {/* 전사 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {companyStatItems.map(({ key, label }) => {
          let value = '';
          let sub = '';
          switch (key) {
            case 'quotation':
              value = formatAmount(company.quotation.amount);
              sub = `${company.quotation.count}건`;
              break;
            case 'contract':
              value = formatAmount(company.contract.amount);
              sub = `${company.contract.count}건`;
              break;
            case 'kpi':
              value = `${company.kpi.conversionRate}%`;
              sub = `수주 ${company.kpi.won} / 실주 ${company.kpi.lost}`;
              break;
            case 'lead':
              value = `${company.lead.count}건`;
              sub = '신규 문의';
              break;
          }
          return (
            <StitchCard key={key} variant="elevated" padding="sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
              <p className="text-xl font-black tracking-tighter text-foreground">{value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
            </StitchCard>
          );
        })}
      </div>

      {/* 센터별 현황 */}
      {byDepartment && byDepartment.length > 0 && (
        <StitchCard variant="elevated" padding="md">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            센터별 현황
          </h3>
          {/* 모바일: 카드 레이아웃 */}
          <div className="sm:hidden space-y-3">
            {byDepartment.map((dept) => (
              <div key={dept.department} className="p-3 rounded-lg bg-[#FAF2E9] space-y-2">
                <div className="font-medium text-sm">{dept.departmentName}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">견적</span>
                    <span>{formatAmount(dept.quotation.amount)} · {dept.quotation.count}건</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">계약</span>
                    <span>{formatAmount(dept.contract.amount)} · {dept.contract.count}건</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-500">수주율</span>
                    <span className={cn(
                      'font-medium',
                      dept.conversionRate >= 30 ? 'text-emerald-600' : 'text-slate-500'
                    )}>{dept.conversionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* 데스크톱: 테이블 레이아웃 */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EFE7DD]">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">센터</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">견적금액</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">견적수</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">계약금액</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">계약수</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">수주율</th>
                </tr>
              </thead>
              <tbody>
                {byDepartment.map((dept) => (
                  <tr key={dept.department} className="border-b border-[#EFE7DD]/60 last:border-0 hover:bg-[#FFF8F1] transition-all duration-150">
                    <td className="py-2.5 px-3 font-medium text-sm">{dept.departmentName}</td>
                    <td className="py-2.5 px-3 text-right text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAmount(dept.quotation.amount)}</td>
                    <td className="py-2.5 px-3 text-right text-sm text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>{dept.quotation.count}건</td>
                    <td className="py-2.5 px-3 text-right text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAmount(dept.contract.amount)}</td>
                    <td className="py-2.5 px-3 text-right text-sm text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>{dept.contract.count}건</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn(
                        'text-sm font-medium',
                        dept.conversionRate >= 30 ? 'text-emerald-600' : 'text-slate-500'
                      )}>
                        {dept.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StitchCard>
      )}

      {/* 담당자별 순위 */}
      {userRanking && userRanking.length > 0 && (
        <StitchCard variant="elevated" padding="md">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            담당자별 순위
            <span className="text-[11px] text-slate-500 font-normal">견적 금액 기준</span>
          </h3>
          {/* 모바일: 카드 레이아웃 */}
          <div className="sm:hidden space-y-2">
            {userRanking.map((user) => (
              <div key={user.userId} className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF2E9]">
                <div className="flex-shrink-0">
                  {user.rank <= 3 ? (
                    <span className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold',
                      user.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      user.rank === 2 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    )}>{user.rank}</span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-7 h-7 text-slate-500 text-sm">{user.rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user.userName}</div>
                  <div className="text-xs text-slate-500">{user.departmentName || '-'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-medium text-sm">{formatAmount(user.quotationAmount)}</div>
                  <div className="text-xs text-slate-500">{user.quotationCount}건</div>
                </div>
              </div>
            ))}
          </div>
          {/* 데스크톱: 테이블 레이아웃 */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EFE7DD]">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">순위</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">담당자</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">소속</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">견적금액</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">견적수</th>
                </tr>
              </thead>
              <tbody>
                {userRanking.map((user) => (
                  <tr key={user.userId} className="border-b border-[#EFE7DD]/60 last:border-0 hover:bg-[#FFF8F1] transition-all duration-150">
                    <td className="py-2.5 px-3">
                      {user.rank <= 3 ? (
                        <span className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                          user.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          user.rank === 2 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        )}>
                          {user.rank}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm pl-1.5">{user.rank}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-sm">{user.userName}</td>
                    <td className="py-2.5 px-3 text-sm text-slate-500">{user.departmentName || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAmount(user.quotationAmount)}</td>
                    <td className="py-2.5 px-3 text-right text-sm text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>{user.quotationCount}건</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StitchCard>
      )}
    </div>
  );
}
