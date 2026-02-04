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
import StatsCard from '@/components/dashboard/StatsCard';
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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { getDashboardStats, DashboardStatsResponse } from '@/lib/dashboard-api';
import { getDashboardAccessLevel, ACCESS_LEVEL_LABELS } from '@/lib/dashboard-permissions';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
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
        const response = await getDashboardStats({ year, month });
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError('통계 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('통계 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [year, month]);

  // 연도 옵션 (현재 연도 기준 ±2년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

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
        
        {/* 빠른 작성 버튼 */}
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/efficacy-quotations/new">
              <FlaskConical className="w-4 h-4 mr-2" />
              효력시험 견적
            </Link>
          </Button>
          <Button asChild>
            <Link href="/quotations/new">
              <Plus className="w-4 h-4 mr-2" />
              새 견적서 작성
            </Link>
          </Button>
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
        </>
      )}

      {/* 메인 캐러셀 영역 */}
      <DashboardCarousel />

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Link href="/customers">
          <Card className="group hover:scale-[1.02] transition-all duration-300 border-emerald-200/50 dark:border-emerald-800/30 shadow-soft overflow-hidden h-[100px] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  고객사 관리
                </h3>
                <p className="text-sm text-muted-foreground truncate">고객 정보</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
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
