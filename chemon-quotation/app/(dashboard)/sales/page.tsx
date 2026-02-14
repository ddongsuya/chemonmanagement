'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Target,
  Calendar,
  Building2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import { useAuthStore } from '@/stores/authStore';
import {
  getRevenueAnalytics,
  getConversionAnalytics,
  getPerformanceAnalytics,
  type RevenueAnalyticsResponse,
  type ConversionAnalyticsResponse,
  type PerformanceAnalyticsResponse,
} from '@/lib/analytics-api';

// 부서 타입
type Department = 'BD1' | 'BD2' | 'SUPPORT' | 'ALL';

// 부서 라벨
const DEPARTMENT_LABELS: Record<Department, string> = {
  BD1: '사업개발 1센터',
  BD2: '사업개발 2센터',
  SUPPORT: '사업지원팀',
  ALL: '전체',
};

// 기간 옵션
const PERIOD_OPTIONS = [
  { value: 'month', label: '이번 달', days: 30 },
  { value: 'quarter', label: '이번 분기', days: 90 },
  { value: 'year', label: '올해', days: 365 },
];

// 금액 포맷
const formatCurrency = (amount: number) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }
  return amount.toLocaleString();
};

export default function SalesDashboardPage() {
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('ALL');
  const [loading, setLoading] = useState(true);
  
  // API 데이터 상태
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsResponse | null>(null);
  const [conversionData, setConversionData] = useState<ConversionAnalyticsResponse | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceAnalyticsResponse | null>(null);

  // 사용자 권한에 따른 부서 필터링
  const canViewAllSales = user?.role === 'ADMIN' || 
                          user?.department === 'SUPPORT' || 
                          (user as any)?.canViewAllSales;

  // 초기 부서 설정
  useEffect(() => {
    if (!canViewAllSales && user?.department) {
      setSelectedDepartment(user.department as Department);
    }
  }, [user, canViewAllSales]);

  // 선택 가능한 부서 옵션
  const departmentOptions = useMemo(() => {
    if (canViewAllSales) {
      return [
        { value: 'ALL', label: '전체' },
        { value: 'BD1', label: '사업개발 1센터' },
        { value: 'BD2', label: '사업개발 2센터' },
      ];
    }
    if (user?.department && user.department !== 'SUPPORT') {
      return [{ value: user.department, label: DEPARTMENT_LABELS[user.department as Department] }];
    }
    return [];
  }, [canViewAllSales, user]);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const periodDays = PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.days || 30;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [revenue, conversion, performance] = await Promise.all([
        getRevenueAnalytics({ startDate, endDate, period: 'monthly' }).catch(() => null),
        getConversionAnalytics({ startDate, endDate }).catch(() => null),
        getPerformanceAnalytics({ startDate, endDate }).catch(() => null),
      ]);

      setRevenueData(revenue);
      setConversionData(conversion);
      setPerformanceData(performance);
    } catch (error) {
      console.error('Failed to load sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedDepartment]);

  // 계산된 값들
  const totalSales = revenueData?.summary.totalRevenue || 0;
  const contractCount = revenueData?.summary.totalCount || 0;
  const avgContractValue = revenueData?.summary.avgDealSize || 0;
  const monthlyGrowth = revenueData?.summary.growth || 0;
  const conversionRate = conversionData?.overallConversionRate || 0;
  
  // 목표 달성률 (임시로 목표를 현재 매출의 120%로 설정)
  const monthlyTarget = totalSales * 1.2;
  const achievementRate = monthlyTarget > 0 ? Math.round((totalSales / monthlyTarget) * 100) : 0;

  // 월별 추이 데이터
  const monthlyTrend = revenueData?.data.map(d => ({
    month: d.period.slice(5) + '월',
    amount: d.revenue,
  })) || [];

  // Top 영업사원
  const topPerformers = performanceData?.leaderboard.slice(0, 5) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">매출 대시보드</h1>
          <p className="text-muted-foreground">
            {canViewAllSales ? '전체 부서' : DEPARTMENT_LABELS[selectedDepartment]} 매출 현황
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 부서 선택 */}
          {departmentOptions.length > 1 && (
            <Select
              value={selectedDepartment}
              onValueChange={(value) => setSelectedDepartment(value as Department)}
            >
              <SelectTrigger className="w-[180px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* 기간 선택 */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* 새로고침 */}
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 매출 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 매출
            </CardTitle>
            <WonSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSales)}원
            </div>
            <div className="flex items-center mt-1">
              {monthlyGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">
                    +{monthlyGrowth.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">
                    {monthlyGrowth.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">전기간 대비</span>
            </div>
          </CardContent>
        </Card>

        {/* 계약 건수 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              계약 건수
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractCount}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              평균 계약금액: {formatCurrency(avgContractValue)}원
            </p>
          </CardContent>
        </Card>

        {/* 전환율 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              리드 전환율
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              리드 → 계약 전환
            </p>
          </CardContent>
        </Card>

        {/* 목표 달성률 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              목표 달성률
            </CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              목표: {formatCurrency(monthlyTarget)}원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 매출 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              월별 매출 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <div className="space-y-4">
                {monthlyTrend.map((item, idx) => {
                  const maxAmount = Math.max(...monthlyTrend.map((t) => t.amount));
                  const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-10 text-sm text-muted-foreground">
                        {item.month}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                        <div
                          className="bg-blue-500 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(percentage, 10)}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* 파이프라인 전환율 또는 Top 영업사원 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              {conversionData?.funnel ? '파이프라인 전환율' : 'Top 영업사원'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversionData?.funnel && conversionData.funnel.length > 0 ? (
              <div className="space-y-4">
                {conversionData.funnel.map((stage, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{stage.stage}</span>
                      <span className="text-sm text-muted-foreground">
                        {stage.count}건 ({stage.conversionRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all bg-blue-500"
                        style={{ width: `${stage.conversionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((performer, idx) => (
                  <div
                    key={performer.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {idx + 1}
                        </span>
                      </div>
                      <span className="font-medium">{performer.userName}</span>
                    </div>
                    <Badge variant="secondary">
                      {formatCurrency(performer.revenue)}원
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 권한 안내 (일반 사용자) */}
      {!canViewAllSales && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-700">
              💡 현재 {DEPARTMENT_LABELS[selectedDepartment]} 매출만 조회 가능합니다.
              전체 매출 조회가 필요하시면 관리자에게 문의하세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
