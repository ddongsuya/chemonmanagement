'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardPersonalStats } from '@/lib/dashboard-api';
import { FileText, Trophy, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';

interface PersonalDashboardProps {
  stats: DashboardPersonalStats;
  userName: string;
  period: { year: number; month: number };
}

function formatAmount(amount: number): string {
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
}

export default function PersonalDashboard({ stats, userName, period }: PersonalDashboardProps) {
  const { quotation, contract, lead, kpi } = stats;

  return (
    <div className="space-y-6">
      {/* 개인 현황 헤더 */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold">{userName}님의 현황</h2>
        <Badge variant="outline" className="ml-2">
          {period.year}년 {period.month}월
        </Badge>
      </div>

      {/* 개인 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/quotations">
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50 hover:scale-[1.02] transition-transform cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                내 견적 금액
              </div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                {formatAmount(quotation.amount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {quotation.count}건
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/contracts">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 hover:scale-[1.02] transition-transform cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                내 계약 금액
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {formatAmount(contract.amount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {contract.count}건
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 hover:scale-[1.02] transition-transform cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                내 수주율
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {kpi.conversionRate}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                수주 {kpi.won} / 실주 {kpi.lost}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/leads">
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/50 hover:scale-[1.02] transition-transform cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                내 리드
              </div>
              <div className="text-2xl font-bold text-violet-600 mt-1">
                {lead.count}건
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                신규 문의
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 견적서 상태별 현황 */}
      {quotation.byStatus && Object.keys(quotation.byStatus).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">견적서 상태별 현황</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-xs text-muted-foreground">작성중</div>
                <div className="text-lg font-semibold">
                  {quotation.byStatus['DRAFT']?.count || 0}건
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="text-xs text-muted-foreground">발송완료</div>
                <div className="text-lg font-semibold text-blue-600">
                  {quotation.byStatus['SENT']?.count || 0}건
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="text-xs text-muted-foreground">수주</div>
                <div className="text-lg font-semibold text-green-600">
                  {quotation.byStatus['ACCEPTED']?.count || 0}건
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <div className="text-xs text-muted-foreground">실주</div>
                <div className="text-lg font-semibold text-red-600">
                  {quotation.byStatus['REJECTED']?.count || 0}건
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
