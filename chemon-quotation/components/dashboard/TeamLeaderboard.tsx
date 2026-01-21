'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Loader2, Medal, Award } from 'lucide-react';
import { getPerformanceAnalytics } from '@/lib/analytics-api';
import { formatCurrency } from '@/lib/utils';

interface PerformanceEntry {
  userId: string;
  userName: string;
  revenue: number;
  dealCount: number;
  avgDealSize: number;
  conversionRate: number;
  rank: number;
}

const RANK_ICONS = [
  { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-50' },
  { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
];

export default function TeamLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<PerformanceEntry[]>([]);
  const [teamSummary, setTeamSummary] = useState({ totalRevenue: 0, totalDeals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await getPerformanceAnalytics({
          startDate,
          endDate,
        });

        if (response) {
          setLeaderboard(response.leaderboard.slice(0, 5));
          setTeamSummary(response.teamSummary);
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-soft h-full flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-soft h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">영업 성과</CardTitle>
              <p className="text-sm text-slate-500">최근 90일</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            데이터가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rankStyle = RANK_ICONS[index] || { icon: null, color: 'text-slate-400', bg: 'bg-slate-100' };
              const RankIcon = rankStyle.icon;
              
              return (
                <div
                  key={entry.userId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${rankStyle.bg} flex items-center justify-center`}>
                    {RankIcon ? (
                      <RankIcon className={`w-4 h-4 ${rankStyle.color}`} />
                    ) : (
                      <span className="text-sm font-bold text-slate-500">{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {entry.userName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.dealCount}건 계약
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(entry.revenue)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-slate-500">팀 총 매출</p>
            <p className="text-lg font-semibold">{formatCurrency(teamSummary.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">팀 총 계약</p>
            <p className="text-lg font-semibold">{teamSummary.totalDeals}건</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
