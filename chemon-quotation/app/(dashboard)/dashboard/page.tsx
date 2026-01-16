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

        setStats({
          draft,
          submitted: sent,
          won,
          lost,
          monthlyTotal: 0, // TODO: 월별 통계 API 추가 필요
          monthlyCount: 0,
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
      {/* 상단: 환영 메시지 + 빠른 작성 버튼 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            안녕하세요, {user?.name || '사용자'}님! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            오늘의 견적 현황을 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/efficacy-quotations/new">
              <FlaskConical className="w-4 h-4 mr-2" />
              효력시험 견적
            </Link>
          </Button>
          <Button asChild className="shadow-lg shadow-blue-500/20">
            <Link href="/quotations/new">
              <Plus className="w-4 h-4 mr-2" />
              새 견적서 작성
            </Link>
          </Button>
        </div>
      </div>

      {/* 통계 카드 - 통일된 크기, 파스텔톤 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="제출완료"
          value={stats.submitted}
          icon={Send}
          color="blue"
          href="/quotations?status=sent"
        />
        <StatsCard
          title="수주"
          value={stats.won}
          icon={Trophy}
          color="pink"
          href="/quotations?status=accepted"
        />
        <StatsCard
          title="총 견적"
          value={`${stats.totalQuotations}건`}
          icon={FileText}
          color="yellow"
          href="/quotations"
        />
        <StatsCard
          title="수주율"
          value={`${stats.winRate}%`}
          icon={TrendingUp}
          color="green"
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
          title="효력시험"
          value="견적"
          icon={FlaskConical}
          color="purple"
          subtitle="효력시험 견적"
          href="/quotations?type=efficacy"
        />
        <StatsCard
          title="실주"
          value={stats.lost}
          icon={Clock}
          color="gray"
          href="/quotations?status=rejected"
        />
      </div>

      {/* 메인 캐러셀 영역 */}
      <DashboardCarousel />

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/quotations">
          <Card className="group hover:shadow-soft-lg transition-all duration-300 border-0 shadow-soft overflow-hidden h-[100px]">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  독성시험 견적
                </h3>
                <p className="text-sm text-slate-500 truncate">견적 관리</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/efficacy-quotations">
          <Card className="group hover:shadow-soft-lg transition-all duration-300 border-0 shadow-soft overflow-hidden h-[100px]">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-6 h-6 text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  효력시험 견적
                </h3>
                <p className="text-sm text-slate-500 truncate">견적 관리</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/customers">
          <Card className="group hover:shadow-soft-lg transition-all duration-300 border-0 shadow-soft overflow-hidden h-[100px]">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  고객사 관리
                </h3>
                <p className="text-sm text-slate-500 truncate">고객 정보</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="group hover:shadow-soft-lg transition-all duration-300 border-0 shadow-soft overflow-hidden h-[100px]">
            <CardContent className="p-4 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  리포트
                </h3>
                <p className="text-sm text-slate-500 truncate">통계 분석</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
