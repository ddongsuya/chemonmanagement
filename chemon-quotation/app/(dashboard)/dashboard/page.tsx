'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DashboardCarousel from '@/components/dashboard/DashboardCarousel';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import CompanyDashboard from '@/components/dashboard/CompanyDashboard';
import {
  FileText,
  Plus,
  FlaskConical,
  ArrowRight,
  Users,
  TrendingUp,
  Loader2,
  ChevronDown,
  Beaker,
  Microscope,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { getDashboardStats, DashboardStatsResponse } from '@/lib/dashboard-api';
import { getDashboardAccessLevel, ACCESS_LEVEL_LABELS } from '@/lib/dashboard-permissions';
import { clinicalPathologyApi } from '@/lib/clinical-pathology-api';
import type { ClinicalStatistics } from '@/types/clinical-pathology';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [clinicalStats, setClinicalStats] = useState<ClinicalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const accessLevel = getDashboardAccessLevel(user);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboardData, clinicalData] = await Promise.all([
          getDashboardStats({ year, month }),
          clinicalPathologyApi.getStatistics().catch(() => null),
        ]);

        if (dashboardData && dashboardData.accessLevel) {
          setStats(dashboardData);
        } else {
          console.error('Invalid dashboard stats response:', dashboardData);
          setError('통계 데이터 형식이 올바르지 않습니다.');
        }

        if (clinicalData) {
          setClinicalStats(clinicalData);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        const errorMessage = err?.message || '알 수 없는 오류';
        setError(`통계 데이터를 불러오는데 실패했습니다. (${errorMessage})`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadStats();
    }
  }, [year, month, user]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const formatClinicalAmount = (amount: number): string => {
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
  };

  return (
    <div className="space-y-6">
      {/* 상단: 환영 메시지 + 기간 필터 + 빠른 작성 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              안녕하세요, {user?.name || '사용자'}님
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ACCESS_LEVEL_LABELS[accessLevel]}을 확인하세요
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[90px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[72px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m.toString()}>{m}월</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 빠른 작성 버튼 */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />
                새 견적서
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem
                onClick={() => router.push('/quotations/new')}
                className="cursor-pointer"
              >
                <Beaker className="w-4 h-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">독성시험 견적</p>
                  <p className="text-[11px] text-muted-foreground">일반 독성시험 견적서</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/efficacy-quotations/new')}
                className="cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">효력시험 견적</p>
                  <p className="text-[11px] text-muted-foreground">효력시험 견적서</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/clinical-pathology/quotations/new')}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">임상병리 견적</p>
                  <p className="text-[11px] text-muted-foreground">임상병리 견적서</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">로딩 중...</span>
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className="text-center py-16">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      )}

      {/* 통계 데이터 */}
      {stats && !loading && (
        <>
          {accessLevel === 'FULL' && stats.company && (
            <CompanyDashboard stats={stats} />
          )}

          {accessLevel === 'FULL' && (
            <div className="border-t border-border my-2" />
          )}

          <PersonalDashboard
            stats={stats.personal}
            userName={stats.user.name}
            period={stats.period}
          />

          {/* 임상병리 통계 */}
          {clinicalStats && (
            <>
              <div className="border-t border-border my-2" />
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-semibold">임상병리 현황</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Link href="/clinical-pathology/quotations">
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2">견적서</p>
                        <p className="text-xl font-semibold text-foreground">
                          {clinicalStats.quotations.total}건
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          승인 {clinicalStats.quotations.accepted}건
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/clinical-pathology/test-requests">
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2">시험의뢰</p>
                        <p className="text-xl font-semibold text-foreground">
                          {clinicalStats.testRequests.total}건
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          진행중 {clinicalStats.testRequests.inProgress}건
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">이번달 건수</p>
                      <p className="text-xl font-semibold text-foreground">
                        {clinicalStats.monthly.count}건
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        월간 견적
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">이번달 금액</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatClinicalAmount(clinicalStats.monthly.amount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        월간 견적 금액
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 견적서 상태별 현황 */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3">임상병리 견적서 상태</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-[11px] text-muted-foreground">작성중</p>
                        <p className="text-lg font-semibold mt-0.5">
                          {clinicalStats.quotations.draft}건
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-[11px] text-muted-foreground">발송완료</p>
                        <p className="text-lg font-semibold mt-0.5">
                          {clinicalStats.quotations.sent}건
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-[11px] text-muted-foreground">승인됨</p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {clinicalStats.quotations.accepted}건
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-[11px] text-muted-foreground">완료</p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {clinicalStats.testRequests.completed}건
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* 캐러셀 */}
      <DashboardCarousel />

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { href: '/quotations', icon: FileText, label: '독성시험 견적', sub: '견적 관리' },
          { href: '/efficacy-quotations', icon: FlaskConical, label: '효력시험 견적', sub: '견적 관리' },
          { href: '/clinical-pathology/quotations', icon: Microscope, label: '임상병리 견적', sub: '견적 관리' },
          { href: '/customers', icon: Users, label: '고객사 관리', sub: '고객 정보' },
          { href: '/reports', icon: TrendingUp, label: '리포트', sub: '통계 분석' },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link key={href} href={href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-foreground truncate">{label}</h3>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate hidden sm:block">{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 hidden sm:block" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
