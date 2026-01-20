'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  FileCheck,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { getSalesStats, SalesStats, SalesUserStats, SalesMonthStats } from '@/lib/admin-api';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type PeriodType = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'lastYear';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getPeriodDates(period: PeriodType): { startDate: Date; endDate: Date } {
  const now = new Date();
  switch (period) {
    case 'thisMonth':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
    case 'last3Months':
      return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
    case 'last6Months':
      return { startDate: startOfMonth(subMonths(now, 5)), endDate: endOfMonth(now) };
    case 'thisYear':
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
    case 'lastYear':
      const lastYear = subMonths(now, 12);
      return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) };
    default:
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }
}

const periodLabels: Record<PeriodType, string> = {
  thisMonth: '이번 달',
  lastMonth: '지난 달',
  last3Months: '최근 3개월',
  last6Months: '최근 6개월',
  thisYear: '올해',
  lastYear: '작년',
};

export default function SalesStatsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('thisMonth');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(period);
      const response = await getSalesStats({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '매출 통계를 불러오는데 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '매출 통계를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">매출 통계</h1>
            <p className="text-muted-foreground">전체 매출 현황을 확인합니다</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">매출 통계</h1>
          <p className="text-muted-foreground">전체 매출 현황을 확인합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchStats} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 견적</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.totalQuotations || 0}건</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.summary.totalQuotationAmount || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 계약</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.totalContracts || 0}건</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.summary.totalContractAmount || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">수금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.summary.totalPaidAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              미수금: {formatCurrency((stats?.summary.totalContractAmount || 0) - (stats?.summary.totalPaidAmount || 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전환율</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {formatPercent(stats?.summary.conversionRate || 0)}
              {(stats?.summary.conversionRate || 0) >= 50 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">견적 → 계약</p>
          </CardContent>
        </Card>
      </div>

      {/* 상태별 현황 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">견적 상태별 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.quotationsByStatus && Object.entries(stats.quotationsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant="outline">{status}</Badge>
                  <span className="font-medium">{count}건</span>
                </div>
              ))}
              {(!stats?.quotationsByStatus || Object.keys(stats.quotationsByStatus).length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">계약 상태별 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.contractsByStatus && Object.entries(stats.contractsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant="outline">{status}</Badge>
                  <span className="font-medium">{count}건</span>
                </div>
              ))}
              {(!stats?.contractsByStatus || Object.keys(stats.contractsByStatus).length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 담당자별 실적 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            담당자별 실적
          </CardTitle>
          <CardDescription>담당자별 견적 및 계약 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>담당자</TableHead>
                <TableHead>부서</TableHead>
                <TableHead className="text-right">견적 수</TableHead>
                <TableHead className="text-right">견적 금액</TableHead>
                <TableHead className="text-right">계약 수</TableHead>
                <TableHead className="text-right">계약 금액</TableHead>
                <TableHead className="text-right">전환율</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.byUser && stats.byUser.length > 0 ? (
                stats.byUser.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell className="text-right">{user.quotationCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.quotationAmount)}</TableCell>
                    <TableCell className="text-right">{user.contractCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.contractAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.conversionRate >= 50 ? 'default' : 'secondary'}>
                        {formatPercent(user.conversionRate)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    데이터가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 월별 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            월별 추이
          </CardTitle>
          <CardDescription>월별 견적 및 계약 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>월</TableHead>
                <TableHead className="text-right">견적 수</TableHead>
                <TableHead className="text-right">견적 금액</TableHead>
                <TableHead className="text-right">계약 수</TableHead>
                <TableHead className="text-right">계약 금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.byMonth && stats.byMonth.length > 0 ? (
                stats.byMonth.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right">{month.quotationCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.quotationAmount)}</TableCell>
                    <TableCell className="text-right">{month.contractCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.contractAmount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    데이터가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
