'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DashboardStatsResponse,
  DepartmentStats,
  UserRankingItem,
} from '@/lib/dashboard-api';
import { Building2, Trophy, TrendingUp, Users } from 'lucide-react';

interface CompanyDashboardProps {
  stats: DashboardStatsResponse;
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

export default function CompanyDashboard({ stats }: CompanyDashboardProps) {
  const { company, byDepartment, userRanking } = stats;

  if (!company) return null;

  return (
    <div className="space-y-6">
      {/* 전사 현황 헤더 */}
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-semibold">전사 현황</h2>
        <Badge variant="outline" className="ml-2">
          {stats.period.year}년 {stats.period.month}월
        </Badge>
      </div>

      {/* 전사 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">전사 견적 금액</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatAmount(company.quotation.amount)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {company.quotation.count}건
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">전사 계약 금액</div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatAmount(company.contract.amount)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {company.contract.count}건
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">전사 수주율</div>
            <div className="text-2xl font-bold text-blue-600">
              {company.kpi.conversionRate}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              수주 {company.kpi.won} / 실주 {company.kpi.lost}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">전사 리드</div>
            <div className="text-2xl font-bold text-violet-600">
              {company.lead.count}건
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              신규 문의
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 센터별 현황 */}
      {byDepartment && byDepartment.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              센터별 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">센터</th>
                    <th className="text-right py-2 px-3 font-medium">견적금액</th>
                    <th className="text-right py-2 px-3 font-medium">견적수</th>
                    <th className="text-right py-2 px-3 font-medium">계약금액</th>
                    <th className="text-right py-2 px-3 font-medium">계약수</th>
                    <th className="text-right py-2 px-3 font-medium">수주율</th>
                  </tr>
                </thead>
                <tbody>
                  {byDepartment.map((dept) => (
                    <tr key={dept.department} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{dept.departmentName}</td>
                      <td className="py-2 px-3 text-right">{formatAmount(dept.quotation.amount)}</td>
                      <td className="py-2 px-3 text-right">{dept.quotation.count}건</td>
                      <td className="py-2 px-3 text-right">{formatAmount(dept.contract.amount)}</td>
                      <td className="py-2 px-3 text-right">{dept.contract.count}건</td>
                      <td className="py-2 px-3 text-right">
                        <Badge variant={dept.conversionRate >= 30 ? 'default' : 'secondary'}>
                          {dept.conversionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 담당자별 순위 */}
      {userRanking && userRanking.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              담당자별 순위 (견적 금액 기준)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">순위</th>
                    <th className="text-left py-2 px-3 font-medium">담당자</th>
                    <th className="text-left py-2 px-3 font-medium">소속</th>
                    <th className="text-right py-2 px-3 font-medium">견적금액</th>
                    <th className="text-right py-2 px-3 font-medium">견적수</th>
                  </tr>
                </thead>
                <tbody>
                  {userRanking.map((user) => (
                    <tr key={user.userId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-3">
                        {user.rank <= 3 ? (
                          <Badge variant={user.rank === 1 ? 'default' : 'secondary'} className={
                            user.rank === 1 ? 'bg-amber-500' : 
                            user.rank === 2 ? 'bg-gray-400' : 
                            'bg-amber-700'
                          }>
                            {user.rank}위
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{user.rank}위</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium">{user.userName}</td>
                      <td className="py-2 px-3 text-muted-foreground">{user.departmentName || '-'}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatAmount(user.quotationAmount)}</td>
                      <td className="py-2 px-3 text-right">{user.quotationCount}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
