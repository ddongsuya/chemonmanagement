'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, TrendingUp, Trophy, Users, Loader2, Building2
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import {
  getSalesStats, SalesStatsResponse, SalesMonthlyData
} from '@/lib/dashboard-api';
import { getDashboardAccessLevel } from '@/lib/dashboard-permissions';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

function formatAmount(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}천만`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
}

const DEPT_LABELS: Record<string, string> = {
  BD1: '1센터', BD2: '2센터', SUPPORT: '사업지원팀'
};

export default function SalesDashboard() {
  const { user } = useAuthStore();
  const accessLevel = getDashboardAccessLevel(user);
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [scope, setScope] = useState('personal');
  const [data, setData] = useState<SalesStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  // 스코프 탭 결정
  const scopeTabs = [
    { value: 'personal', label: '개인' },
    ...(user?.department ? [{ value: 'department', label: DEPT_LABELS[user.department] || '소속센터' }] : []),
    ...(accessLevel === 'FULL' ? [{ value: 'company', label: '전사' }] : [])
  ];

  useEffect(() => {
    setLoading(true);
    getSalesStats({ year, scope, department: user?.department || undefined })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, scope, user?.department]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (!data) return null;

  const { totals, monthly, quarterly, modality } = data;

  // 월별 차트 데이터 (간단한 바 차트)
  const maxMonthlyAmount = Math.max(...monthly.map(m => Math.max(m.quotationAmount, m.contractAmount)), 1);

  return (
    <div className="space-y-5">
      {/* 필터 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select value={year.toString()} onValueChange={v => setYear(parseInt(v))}>
          <SelectTrigger className="w-[90px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {scopeTabs.length > 1 && (
          <Tabs value={scope} onValueChange={setScope}>
            <TabsList className="h-8">
              {scopeTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 h-7">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-muted"><FileText className="w-3.5 h-3.5 text-muted-foreground" /></div>
              <span className="text-xs text-muted-foreground">견적금액</span>
            </div>
            <p className="text-xl font-semibold">{formatAmount(totals.quotationAmount)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totals.quotationCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-muted"><WonSign className="w-3.5 h-3.5 text-muted-foreground" /></div>
              <span className="text-xs text-muted-foreground">계약금액</span>
            </div>
            <p className="text-xl font-semibold">{formatAmount(totals.contractAmount)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totals.contractCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-muted"><TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /></div>
              <span className="text-xs text-muted-foreground">수주율</span>
            </div>
            <p className="text-xl font-semibold">{totals.conversionRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">수주 {totals.won} / 실주 {totals.lost}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-muted"><Users className="w-3.5 h-3.5 text-muted-foreground" /></div>
              <span className="text-xs text-muted-foreground">총 건수</span>
            </div>
            <p className="text-xl font-semibold">{totals.quotationCount + totals.contractCount}건</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">견적 + 계약</p>
          </CardContent>
        </Card>
      </div>

      {/* 월별 추이 (CSS 바 차트) */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-medium">월별 추이</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="flex items-end gap-1 h-40">
            {monthly.map(m => {
              const qH = (m.quotationAmount / maxMonthlyAmount) * 100;
              const cH = (m.contractAmount / maxMonthlyAmount) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="w-full flex gap-px justify-center" style={{ height: '128px', alignItems: 'flex-end' }}>
                    <div
                      className="w-[45%] bg-blue-400/70 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(qH, 1)}%` }}
                      title={`견적: ${formatAmount(m.quotationAmount)}`}
                    />
                    <div
                      className="w-[45%] bg-emerald-400/70 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(cH, 1)}%` }}
                      title={`계약: ${formatAmount(m.contractAmount)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.month}월</span>
                  {/* 호버 툴팁 */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded-md p-2 text-xs shadow-sm z-10 whitespace-nowrap">
                    <p>견적: {formatAmount(m.quotationAmount)} ({m.quotationCount}건)</p>
                    <p>계약: {formatAmount(m.contractAmount)} ({m.contractCount}건)</p>
                    {(m.won > 0 || m.lost > 0) && <p>수주 {m.won} / 실주 {m.lost}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-2 bg-blue-400/70 rounded-sm" /> 견적
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-2 bg-emerald-400/70 rounded-sm" /> 계약
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 분기별 현황 */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium">분기별 현황</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">분기</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">견적</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">계약</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">수주율</th>
                </tr>
              </thead>
              <tbody>
                {quarterly.map(q => (
                  <tr key={q.quarter} className="border-b border-border/40 last:border-0">
                    <td className="py-2 font-medium">Q{q.quarter}</td>
                    <td className="py-2 text-right">{formatAmount(q.quotationAmount)}</td>
                    <td className="py-2 text-right">{formatAmount(q.contractAmount)}</td>
                    <td className="py-2 text-right">
                      <span className={cn('font-medium', q.conversionRate >= 30 ? 'text-emerald-600' : '')}>
                        {q.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 모달리티별 분포 */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium">모달리티별 분포</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {modality.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {modality.slice(0, 8).map(m => {
                  const maxAmt = modality[0]?.amount || 1;
                  const pct = (m.amount / maxAmt) * 100;
                  return (
                    <div key={m.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{m.name}</span>
                        <span className="font-medium">{formatAmount(m.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400/70 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 부서별 현황 (전사 스코프) */}
      {data.departmentStats && data.departmentStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              센터별 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">센터</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">견적금액</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">계약금액</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">수주율</th>
                  </tr>
                </thead>
                <tbody>
                  {data.departmentStats.map(dept => (
                    <tr key={dept.department} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2 font-medium">{dept.departmentName}</td>
                      <td className="py-2 px-2 text-right">{formatAmount(dept.quotation.amount)}</td>
                      <td className="py-2 px-2 text-right">{formatAmount(dept.contract.amount)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={cn('font-medium', dept.conversionRate >= 30 ? 'text-emerald-600' : '')}>
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

      {/* 담당자별 순위 (전사 스코프) */}
      {data.userRanking && data.userRanking.length > 0 && (
        <Card>
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
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">순위</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">담당자</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">소속</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">견적금액</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">건수</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userRanking.map(u => (
                    <tr key={u.userId} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2">
                        {u.rank <= 3 ? (
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                            u.rank === 1 ? 'bg-amber-100 text-amber-700' :
                            u.rank === 2 ? 'bg-slate-100 text-slate-600' :
                            'bg-orange-100 text-orange-700'
                          )}>{u.rank}</span>
                        ) : (
                          <span className="text-muted-foreground pl-1.5">{u.rank}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 font-medium">{u.userName}</td>
                      <td className="py-2 px-2 text-muted-foreground">{u.departmentName || '-'}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatAmount(u.quotationAmount)}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{u.quotationCount}건</td>
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
