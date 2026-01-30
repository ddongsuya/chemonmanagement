'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/StatsCard';
import DashboardCarousel from '@/components/dashboard/DashboardCarousel';
import {
  FileText,
  Send,
  Trophy,
  DollarSign,
  Plus,
  TrendingUp,
  Clock,
  FlaskConical,
  ArrowRight,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getQuotations, getCustomers } from '@/lib/data-api';
import { getRevenueAnalytics } from '@/lib/analytics-api';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    draft: 0,
    submitted: 0,
    won: 0,
    lost: 0,
    monthlyTotal: 0,
    monthlyCount: 0,
    winRate: 0,
    customerCount: 0,
    totalQuotations: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // 이번 달 시작일과 종료일 계산
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // 견적서 통계 가져오기
        const [allResponse, draftResponse, sentResponse, acceptedResponse, rejectedResponse, customersResponse] = await Promise.all([
          getQuotations({ limit: 1 }),
          getQuotations({ status: 'DRAFT', limit: 1 }),
          getQuotations({ status: 'SENT', limit: 1 }),
          getQuotations({ status: 'ACCEPTED', limit: 1 }),
          getQuotations({ status: 'REJECTED', limit: 1 }),
          getCustomers({ limit: 1 }),
        ]);

        const total = allResponse.success ? allResponse.data?.pagination?.total || 0 : 0;
        const draft = draftResponse.success ? draftResponse.data?.pagination?.total || 0 : 0;
        const sent = sentResponse.success ? sentResponse.data?.pagination?.total || 0 : 0;
        const won = acceptedResponse.success ? acceptedResponse.data?.pagination?.total || 0 : 0;
        const lost = rejectedResponse.success ? rejectedResponse.data?.pagination?.total || 0 : 0;
        const customerCount = customersResponse.success ? customersResponse.data?.pagination?.total || 0 : 0;

        const totalDecided = won + lost;
        const winRate = totalDecided > 0 ? (won / totalDecided) * 100 : 0;

        // 월별 매출 통계 가져오기
        let monthlyTotal = 0;
        let monthlyCount = 0;
        try {
          const revenueData = await getRevenueAnalytics({
            startDate: monthStart.toISOString().slice(0, 10),
            endDate: monthEnd.toISOString().slice(0, 10),
            period: 'monthly',
          });
          if (revenueData?.summary) {
            monthlyTotal = revenueData.summary.totalRevenue || 0;
            monthlyCount = revenueData.summary.totalCount || 0;
          }
        } catch (e) {
          console.warn('Failed to load revenue analytics:', e);
        }

        setStats({
          draft,
          submitted: sent,
          won,
          lost,
          monthlyTotal,
          monthlyCount,
          winRate: Math.round(winRate * 10) / 10,
          customerCount,
          totalQuotations: total,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 상단: 환영 메시지 + 실시간 배지 + 빠른 작성 버튼 */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              안녕하세요, {user?.name || '사용자'}님! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              오늘의 견적 현황을 확인하세요
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 실시간 모니터링 배지 */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-full">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse-orange"></div>
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">실시간 업데이트</span>
            </div>
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

      {/* 통계 카드 - 오렌지 테마 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="제출완료"
          value={stats.submitted}
          icon={Send}
          color="orange"
          trend="up"
          href="/quotations?status=sent"
        />
        <StatsCard
          title="수주"
          value={stats.won}
          icon={Trophy}
          color="amber"
          trend="up"
          href="/quotations?status=accepted"
        />
        <StatsCard
          title="총 견적"
          value={`${stats.totalQuotations}건`}
          icon={FileText}
          color="blue"
          href="/quotations"
        />
        <StatsCard
          title="수주율"
          value={`${stats.winRate}%`}
          icon={TrendingUp}
          color="green"
          trend={stats.winRate > 50 ? 'up' : stats.winRate < 30 ? 'down' : 'stable'}
          href="/reports"
        />
      </div>

      {/* 보조 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="작성중"
          value={stats.draft}
          icon={FileText}
          color="gray"
          subtitle="진행중인 견적"
          href="/quotations?status=draft"
        />
        <StatsCard
          title="고객사"
          value={`${stats.customerCount}개`}
          icon={Users}
          color="purple"
          href="/customers"
        />
        <StatsCard
          title="이번달 계약"
          value={stats.monthlyTotal > 0 ? `${(stats.monthlyTotal / 100000000).toFixed(1)}억` : '0원'}
          icon={DollarSign}
          color="green"
          subtitle={`${stats.monthlyCount}건`}
          trend="up"
          href="/reports"
        />
        <StatsCard
          title="실주"
          value={stats.lost}
          icon={Clock}
          color="gray"
          trend="down"
          href="/quotations?status=rejected"
        />
      </div>

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
