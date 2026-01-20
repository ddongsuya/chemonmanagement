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
  DollarSign,
  FileText,
  Users,
  Target,
  Calendar,
  Building2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

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
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '이번 분기' },
  { value: 'year', label: '올해' },
  { value: 'custom', label: '기간 선택' },
];

// 더미 매출 데이터 (실제로는 API에서 가져옴)
const generateSalesData = (department: Department) => {
  const baseData = {
    BD1: {
      totalSales: 1250000000,
      contractCount: 45,
      avgContractValue: 27777778,
      conversionRate: 32,
      monthlyTarget: 1500000000,
      monthlyGrowth: 12.5,
      topCustomers: [
        { name: '삼성바이오로직스', amount: 350000000 },
        { name: 'SK바이오팜', amount: 280000000 },
        { name: '셀트리온', amount: 220000000 },
      ],
      monthlyTrend: [
        { month: '1월', amount: 95000000 },
        { month: '2월', amount: 110000000 },
        { month: '3월', amount: 125000000 },
        { month: '4월', amount: 98000000 },
        { month: '5월', amount: 142000000 },
        { month: '6월', amount: 135000000 },
      ],
    },
    BD2: {
      totalSales: 980000000,
      contractCount: 38,
      avgContractValue: 25789474,
      conversionRate: 28,
      monthlyTarget: 1200000000,
      monthlyGrowth: 8.3,
      topCustomers: [
        { name: '한미약품', amount: 280000000 },
        { name: '유한양행', amount: 195000000 },
        { name: '녹십자', amount: 175000000 },
      ],
      monthlyTrend: [
        { month: '1월', amount: 78000000 },
        { month: '2월', amount: 92000000 },
        { month: '3월', amount: 105000000 },
        { month: '4월', amount: 88000000 },
        { month: '5월', amount: 118000000 },
        { month: '6월', amount: 112000000 },
      ],
    },
    SUPPORT: {
      totalSales: 0,
      contractCount: 0,
      avgContractValue: 0,
      conversionRate: 0,
      monthlyTarget: 0,
      monthlyGrowth: 0,
      topCustomers: [],
      monthlyTrend: [],
    },
  };

  if (department === 'ALL') {
    return {
      totalSales: baseData.BD1.totalSales + baseData.BD2.totalSales,
      contractCount: baseData.BD1.contractCount + baseData.BD2.contractCount,
      avgContractValue: Math.round(
        (baseData.BD1.totalSales + baseData.BD2.totalSales) /
          (baseData.BD1.contractCount + baseData.BD2.contractCount)
      ),
      conversionRate: Math.round(
        (baseData.BD1.conversionRate + baseData.BD2.conversionRate) / 2
      ),
      monthlyTarget: baseData.BD1.monthlyTarget + baseData.BD2.monthlyTarget,
      monthlyGrowth: (baseData.BD1.monthlyGrowth + baseData.BD2.monthlyGrowth) / 2,
      topCustomers: [...baseData.BD1.topCustomers, ...baseData.BD2.topCustomers]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
      monthlyTrend: baseData.BD1.monthlyTrend.map((item, idx) => ({
        month: item.month,
        amount: item.amount + baseData.BD2.monthlyTrend[idx].amount,
      })),
      departmentBreakdown: [
        { name: '사업개발 1센터', amount: baseData.BD1.totalSales, color: '#3B82F6' },
        { name: '사업개발 2센터', amount: baseData.BD2.totalSales, color: '#10B981' },
      ],
    };
  }

  return baseData[department] || baseData.BD1;
};

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
    // 자기 부서만 볼 수 있음
    if (user?.department && user.department !== 'SUPPORT') {
      return [{ value: user.department, label: DEPARTMENT_LABELS[user.department as Department] }];
    }
    return [];
  }, [canViewAllSales, user]);

  // 매출 데이터
  const salesData = useMemo(() => {
    return generateSalesData(selectedDepartment);
  }, [selectedDepartment]);

  // 목표 달성률
  const achievementRate = salesData.monthlyTarget > 0
    ? Math.round((salesData.totalSales / salesData.monthlyTarget) * 100)
    : 0;

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
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesData.totalSales)}원
            </div>
            <div className="flex items-center mt-1">
              {salesData.monthlyGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">
                    +{salesData.monthlyGrowth}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">
                    {salesData.monthlyGrowth}%
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">전월 대비</span>
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
            <div className="text-2xl font-bold">{salesData.contractCount}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              평균 계약금액: {formatCurrency(salesData.avgContractValue)}원
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
            <div className="text-2xl font-bold">{salesData.conversionRate}%</div>
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
              목표: {formatCurrency(salesData.monthlyTarget)}원
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
            <div className="space-y-4">
              {salesData.monthlyTrend?.map((item: any, idx: number) => {
                const maxAmount = Math.max(
                  ...salesData.monthlyTrend.map((t: any) => t.amount)
                );
                const percentage = (item.amount / maxAmount) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-10 text-sm text-muted-foreground">
                      {item.month}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                      <div
                        className="bg-blue-500 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
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
          </CardContent>
        </Card>

        {/* 부서별 매출 비중 (전체 선택 시) 또는 Top 고객사 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              {selectedDepartment === 'ALL' ? '부서별 매출 비중' : 'Top 고객사'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDepartment === 'ALL' && (salesData as any).departmentBreakdown ? (
              <div className="space-y-4">
                {(salesData as any).departmentBreakdown.map((dept: any, idx: number) => {
                  const percentage = Math.round(
                    (dept.amount / salesData.totalSales) * 100
                  );
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{dept.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(dept.amount)}원 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: dept.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {salesData.topCustomers?.map((customer: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {idx + 1}
                        </span>
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {formatCurrency(customer.amount)}원
                    </Badge>
                  </div>
                ))}
                {(!salesData.topCustomers || salesData.topCustomers.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    데이터가 없습니다
                  </p>
                )}
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
