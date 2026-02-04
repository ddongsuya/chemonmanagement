'use client';

import { useState, useEffect } from 'react';
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
  Building2,
  User,
  Loader2,
  Calendar,
  ChevronDown,
  Beaker,
  Microscope,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  // 기간 필터
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // 권한 레벨
  const accessLevel = getDashboardAccessLevel(user);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // 일반 대시보드 통계와 임상병리 통계를 병렬로 로드
        const [dashboardData, clinicalData] = await Promise.all([
          getDashboardStats({ year, month }),
          clinicalPathologyApi.getStatistics().catch(() => null), // 임상병리 통계 실패해도 계속 진행
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

  // 연도 옵션 (현재 연도 기준 ±2년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 임상병리 금액 포맷
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
    <div className="space-y-8 animate-fade-in">
      {/* 상단: 환영 메시지 + 기간 필터 + 빠른 작성 버튼 */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              안녕하세요, {user?.name || '사용자'}님! 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">
                {ACCESS_LEVEL_LABELS[accessLevel]}을 확인하세요
              </p>
              <Badge variant="outline" className="text-xs">
                {accessLevel === 'FULL' ? (
                  <><Building2 className="w-3 h-3 mr-1" />전사</>
                ) : (
                  <><User className="w-3 h-3 mr-1" />개인</>
                )}
              </Badge>
            </div>
          </div>
          
          {/* 기간 필터 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[80px]">
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
        
        {/* 빠른 작성 버튼 - 드롭다운 메뉴 */}
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 견적서 작성
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem 
                onClick={() => router.push('/quotations/new')}
                className="cursor-pointer"
              >
                <Beaker className="w-4 h-4 mr-2 text-orange-500" />
                <div>
                  <p className="font-medium">독성시험 견적</p>
                  <p className="text-xs text-muted-foreground">일반 독성시험 견적서</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/efficacy-quotations/new')}
                className="cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 mr-2 text-amber-500" />
                <div>
                  <p className="font-medium">효력시험 견적</p>
                  <p className="text-xs text-muted-foreground">효력시험 견적서</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/clinical-pathology/quotations/new')}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                <div>
                  <p className="font-medium">임상병리 견적</p>
                  <p className="text-xs text-muted-foreground">임상병리 견적서</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-2 text-muted-foreground">통계 데이터 로딩 중...</span>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      )}

      {/* 통계 데이터 */}
      {stats && !loading && (
        <>
          {/* 전사 대시보드 (FULL 권한만) */}
          {accessLevel === 'FULL' && stats.company && (
            <CompanyDashboard stats={stats} />
          )}

          {/* 구분선 */}
          {accessLevel === 'FULL' && (
            <div className="border-t border-dashed my-6" />
          )}

          {/* 개인 대시보드 */}
          <PersonalDashboard 
            stats={stats.personal} 
            userName={stats.user.name}
            period={stats.period}
          />
          
          {/* 임상병리 통계 위젯 */}
          {clinicalStats && (
            <>
              <div className="border-t border-dashed my-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold">임상병리 현황</h2>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/clinical-pathology/quotations">
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 hover:scale-[1.02] transition-transform cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          견적서
                        </div>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">
                          {clinicalStats.quotations.total}건
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          승인 {clinicalStats.quotations.accepted}건
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/clinical-pathology/test-requests">
                    <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 border-cyan-200/50 hover:scale-[1.02] transition-transform cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Microscope className="w-4 h-4" />
                          시험의뢰
                        </div>
                        <div className="text-2xl font-bold text-cyan-600 mt-1">
                          {clinicalStats.testRequests.total}건
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          진행중 {clinicalStats.testRequests.inProgress}건
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        이번달 건수
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {clinicalStats.monthly.count}건
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        월간 견적
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        이번달 금액
                      </div>
                      <div className="text-2xl font-bold text-violet-600 mt-1">
                        {formatClinicalAmount(clinicalStats.monthly.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        월간 견적 금액
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* 견적서 상태별 현황 */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3">임상병리 견적서 상태</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="text-xs text-muted-foreground">작성중</div>
                        <div className="text-lg font-semibold">
                          {clinicalStats.quotations.draft}건
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">발송완료</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {clinicalStats.quotations.sent}건
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">승인됨</div>
                        <div className="text-lg font-semibold text-green-600">
                          {clinicalStats.quotations.accepted}건
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">완료</div>
                        <div className="text-lg font-semibold text-emerald-600">
                          {clinicalStats.testRequests.completed}건
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* 메인 캐러셀 영역 */}
      <DashboardCarousel />

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/quotations">
          <Card className="group hover:scale-[1.02] transition-all duration-300 border-orange-200/50 dark:border-orange-800/30 shadow-soft overflow-hidden h-[100px] bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  독성시험 견적
                </h3>
                <p className="text-sm text-muted-foreground truncate">견적 관리</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/efficacy-quotations">
          <Card className="group hover:scale-[1.02] transition-all duration-300 border-amber-200/50 dark:border-amber-800/30 shadow-soft overflow-hidden h-[100px] bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  효력시험 견적
                </h3>
                <p className="text-sm text-muted-foreground truncate">견적 관리</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/clinical-pathology/quotations">
          <Card className="group hover:scale-[1.02] transition-all duration-300 border-emerald-200/50 dark:border-emerald-800/30 shadow-soft overflow-hidden h-[100px] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Microscope className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  임상병리 견적
                </h3>
                <p className="text-sm text-muted-foreground truncate">견적 관리</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/customers">
          <Card className="group hover:scale-[1.02] transition-all duration-300 border-cyan-200/50 dark:border-cyan-800/30 shadow-soft overflow-hidden h-[100px] bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  고객사 관리
                </h3>
                <p className="text-sm text-muted-foreground truncate">고객 정보</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="group hover:scale-[1.02] transition-all duration-300 border-violet-200/50 dark:border-violet-800/30 shadow-soft overflow-hidden h-[100px] bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  리포트
                </h3>
                <p className="text-sm text-muted-foreground truncate">통계 분석</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
