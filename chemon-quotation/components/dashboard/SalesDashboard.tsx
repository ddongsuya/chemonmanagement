'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  FileText, TrendingUp, Trophy, Users, Loader2, Building2
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import {
  getSalesStats, SalesStatsResponse, SalesScopeData
} from '@/lib/dashboard-api';
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

// ─── KPI 카드 4개 ───
function KPICards({ data, compact }: { data: SalesScopeData; compact?: boolean }) {
  const { totals } = data;
  const cardPad = compact ? 'p-4' : 'p-6';
  const numSize = compact ? 'text-xl' : 'text-2xl';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white rounded-xl">
        <CardContent className={cardPad}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-primary/5"><FileText className="w-4 h-4 text-primary" /></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">견적금액</p>
          <p className={cn(numSize, 'font-black tracking-tighter')}>{formatAmount(totals.quotationAmount)}</p>
          <p className="text-xs text-slate-500 mt-1">{totals.quotationCount}건</p>
        </CardContent>
      </Card>
      <Card className="bg-white rounded-xl">
        <CardContent className={cardPad}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-primary/5"><WonSign className="w-4 h-4 text-primary" /></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">계약금액</p>
          <p className={cn(numSize, 'font-black tracking-tighter')}>{formatAmount(totals.contractAmount)}</p>
          <p className="text-xs text-slate-500 mt-1">{totals.contractCount}건</p>
        </CardContent>
      </Card>
      <Card className="bg-white rounded-xl">
        <CardContent className={cardPad}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-primary/5"><TrendingUp className="w-4 h-4 text-primary" /></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">수주율</p>
          <p className={cn(numSize, 'font-black tracking-tighter')}>{totals.conversionRate}%</p>
          <p className="text-xs text-slate-500 mt-1">수주 {totals.won} / 실주 {totals.lost}</p>
        </CardContent>
      </Card>
      <Card className="bg-white rounded-xl">
        <CardContent className={cardPad}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-primary/5"><Users className="w-4 h-4 text-primary" /></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">총 건수</p>
          <p className={cn(numSize, 'font-black tracking-tighter')}>{totals.quotationCount + totals.contractCount}건</p>
          <p className="text-xs text-slate-500 mt-1">견적 + 계약</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 월별 바 차트 ───
function MonthlyChart({ data }: { data: SalesScopeData }) {
  const { monthly } = data;
  const maxAmount = Math.max(...monthly.map(m => Math.max(m.quotationAmount, m.contractAmount)), 1);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-medium">월별 추이</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="flex items-end gap-1 h-40">
          {monthly.map(m => {
            const qH = (m.quotationAmount / maxAmount) * 100;
            const cH = (m.contractAmount / maxAmount) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div className="w-full flex gap-px justify-center" style={{ height: '128px', alignItems: 'flex-end' }}>
                  <div className="w-[45%] bg-blue-400/70 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(qH, 1)}%` }}
                    title={`견적: ${formatAmount(m.quotationAmount)}`} />
                  <div className="w-[45%] bg-emerald-400/70 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(cH, 1)}%` }}
                    title={`계약: ${formatAmount(m.contractAmount)}`} />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.month}월</span>
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
  );
}

// ─── 분기별 + 모달리티 ───
function QuarterlyAndModality({ data }: { data: SalesScopeData }) {
  const { quarterly, modality } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
  );
}

// ─── 센터별 비교 테이블 ───
function DepartmentComparisonTable({ stats }: { stats: NonNullable<SalesStatsResponse['departmentStats']> }) {
  return (
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
              {stats.map(dept => (
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
  );
}

// ─── 담당자별 순위 ───
function UserRankingTable({ ranking }: { ranking: NonNullable<SalesStatsResponse['userRanking']> }) {
  return (
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
              {ranking.map(u => (
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
  );
}

// ─── 섹션 헤더 ───
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground px-2">{title}</span>
      {subtitle && <span className="text-[11px] text-muted-foreground">({subtitle})</span>}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── 메인 컴포넌트 ───
export default function SalesDashboard() {
  const { user } = useAuthStore();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<SalesStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  useEffect(() => {
    setLoading(true);
    getSalesStats({ year })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (!data) return null;

  const { accessLevel, personal, department, company, departmentStats, userRanking } = data;
  const deptLabel = user?.department ? (DEPT_LABELS[user.department] || user.department) : '';

  return (
    <div className="space-y-5">
      {/* 연도 선택 */}
      <div className="flex items-center gap-3">
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
        <span className="text-xs text-muted-foreground">
          {accessLevel === 'FULL' ? '전사 데이터 열람 가능' :
           accessLevel === 'TEAM' ? `${deptLabel} 데이터 열람 가능` :
           '개인 데이터'}
        </span>
      </div>

      {/* ─── PERSONAL: 개인만 ─── */}
      {accessLevel === 'PERSONAL' && (
        <>
          <KPICards data={personal} />
          <MonthlyChart data={personal} />
          <QuarterlyAndModality data={personal} />
        </>
      )}

      {/* ─── TEAM: 개인 + 소속 센터 (탭) ─── */}
      {accessLevel === 'TEAM' && (
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="personal">내 매출</TabsTrigger>
            <TabsTrigger value="department">{deptLabel} 종합</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="space-y-4 mt-4">
            <KPICards data={personal} />
            <MonthlyChart data={personal} />
            <QuarterlyAndModality data={personal} />
          </TabsContent>
          <TabsContent value="department" className="space-y-4 mt-4">
            {department ? (
              <>
                <KPICards data={department} />
                <MonthlyChart data={department} />
                <QuarterlyAndModality data={department} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">소속 센터 데이터 없음</p>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ─── FULL: 개인 + 전사 (탭) ─── */}
      {accessLevel === 'FULL' && (
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="personal">내 매출</TabsTrigger>
            <TabsTrigger value="company">전사 현황</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="space-y-4 mt-4">
            <KPICards data={personal} />
            <MonthlyChart data={personal} />
            <QuarterlyAndModality data={personal} />
          </TabsContent>
          <TabsContent value="company" className="space-y-4 mt-4">
            {company && (
              <>
                <KPICards data={company} />
                <MonthlyChart data={company} />
                <QuarterlyAndModality data={company} />
              </>
            )}

            {departmentStats && departmentStats.length > 0 && (
              <DepartmentComparisonTable stats={departmentStats} />
            )}

            {userRanking && userRanking.length > 0 && (
              <UserRankingTable ranking={userRanking} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}