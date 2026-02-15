'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DashboardStatsResponse,
} from '@/lib/dashboard-api';
import { Building2, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyDashboardProps {
  stats: DashboardStatsResponse;
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

const companyStatItems = [
  { key: 'quotation', label: '전사 견적 금액', color: 'text-orange-600 dark:text-orange-400' },
  { key: 'contract', label: '전사 계약 금액', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'kpi', label: '전사 수주율', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'lead', label: '전사 리드', color: 'text-violet-600 dark:text-violet-400' },
] as const;

export default function CompanyDashboard({ stats }: CompanyDashboardProps) {
  const { company, byDepartment, userRanking } = stats;

  if (!company) return null;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-baseline gap-2">
        <Building2 className="w-4 h-4 text-orange-500" />
        <h2 className="text-base font-semibold text-foreground">전사 현황</h2>
        <span className="text-xs text-muted-foreground">{stats.period.year}년 {stats.period.month}월</span>
      </div>

      {/* 전사 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {companyStatItems.map(({ key, label, color }) => {
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
            <Card key={key} className="shadow-soft">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-2">{label}</div>
                <div className={cn('text-xl font-semibold', color)}>{value}</div>
                <div className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 센터별 현황 */}
      {byDepartment && byDepartment.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              센터별 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">센터</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">견적금액</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">견적수</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">계약금액</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">계약수</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">수주율</th>
                  </tr>
                </thead>
                <tbody>
                  {byDepartment.map((dept) => (
                    <tr key={dept.department} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-sm">{dept.departmentName}</td>
                      <td className="py-2.5 px-3 text-right text-sm">{formatAmount(dept.quotation.amount)}</td>
                      <td className="py-2.5 px-3 text-right text-sm text-muted-foreground">{dept.quotation.count}건</td>
                      <td className="py-2.5 px-3 text-right text-sm">{formatAmount(dept.contract.amount)}</td>
                      <td className="py-2.5 px-3 text-right text-sm text-muted-foreground">{dept.contract.count}건</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={cn(
                          'text-sm font-medium',
                          dept.conversionRate >= 30 ? 'text-emerald-600' : 'text-muted-foreground'
                        )}>
                          {dept.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 담당자별 순위 */}
      {userRanking && userRanking.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              담당자별 순위
              <span className="text-[11px] text-muted-foreground font-normal">견적 금액 기준</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">순위</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">담당자</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">소속</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">견적금액</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">견적수</th>
                  </tr>
                </thead>
                <tbody>
                  {userRanking.map((user) => (
                    <tr key={user.userId} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
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
                          <span className="text-muted-foreground text-sm pl-1.5">{user.rank}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-sm">{user.userName}</td>
                      <td className="py-2.5 px-3 text-sm text-muted-foreground">{user.departmentName || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-sm">{formatAmount(user.quotationAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-sm text-muted-foreground">{user.quotationCount}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
