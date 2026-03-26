'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Calendar } from 'lucide-react';
import { StitchCard } from '@/components/ui/StitchCard';
import { Button } from '@/components/ui/button';
import { StitchInput } from '@/components/ui/StitchInput';
import { Progress } from '@/components/ui/progress';

// 미진행 사유 타입
export type LostReason = 
  | 'BUDGET_PLANNING'
  | 'COMPETITOR_SELECTED'
  | 'PRICE_ISSUE'
  | 'SCHEDULE_ISSUE'
  | 'ON_HOLD'
  | 'OTHER';

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  BUDGET_PLANNING: '예산 미확보',
  COMPETITOR_SELECTED: '경쟁사 선정',
  PRICE_ISSUE: '가격 문제',
  SCHEDULE_ISSUE: '일정 문제',
  ON_HOLD: '보류',
  OTHER: '기타',
};

export const LOST_REASON_COLORS: Record<LostReason, string> = {
  BUDGET_PLANNING: '#6366F1', // indigo
  COMPETITOR_SELECTED: '#EF4444', // red
  PRICE_ISSUE: '#F59E0B', // amber
  SCHEDULE_ISSUE: '#3B82F6', // blue
  ON_HOLD: '#8B5CF6', // violet
  OTHER: '#6B7280', // gray
};

// 통계 데이터 인터페이스
export interface LostReasonStat {
  reason: LostReason;
  count: number;
  percentage: number;
}

export interface LostReasonStatsData {
  total: number;
  byReason: LostReasonStat[];
  period: {
    startDate: string;
    endDate: string;
  };
}

interface LostReasonStatsProps {
  data?: LostReasonStatsData;
  onPeriodChange?: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

/**
 * LostReasonStats 컴포넌트
 * 
 * 미진행 사유별 통계를 차트로 표시합니다.
 * 
 * Requirements 2.7: 미진행 사유별 통계 차트 및 기간 필터
 */
export default function LostReasonStats({
  data,
  onPeriodChange,
  loading = false,
}: LostReasonStatsProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // 기간 변경 시 콜백 호출
  const handleApplyPeriod = () => {
    if (onPeriodChange) {
      onPeriodChange(startDate, endDate);
    }
  };

  // 빠른 기간 선택
  const setQuickPeriod = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    
    if (onPeriodChange) {
      onPeriodChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    }
  };

  // 최대 카운트 (차트 스케일용)
  const maxCount = data?.byReason.reduce((max, stat) => Math.max(max, stat.count), 0) || 1;

  return (
    <StitchCard variant="elevated" padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            미진행 사유 분석
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            기간별 미진행 사유 통계를 확인합니다.
          </p>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-2xl font-black tracking-tighter">{data.total}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">총 미진행 건수</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* 기간 필터 */}
        <div className="p-4 bg-[#FAF2E9] rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <Calendar className="h-4 w-4" />
            기간 설정
          </div>
          
          {/* 빠른 선택 버튼 */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setQuickPeriod(1)} className="rounded-xl font-bold">
              1개월
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setQuickPeriod(3)} className="rounded-xl font-bold">
              3개월
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setQuickPeriod(6)} className="rounded-xl font-bold">
              6개월
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setQuickPeriod(12)} className="rounded-xl font-bold">
              1년
            </Button>
          </div>

          {/* 직접 입력 */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">시작일</label>
              <StitchInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="pb-3 text-slate-400">~</span>
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">종료일</label>
              <StitchInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleApplyPeriod}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold"
            >
              적용
            </Button>
          </div>
        </div>

        {/* 통계 차트 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-[#FAF2E9] rounded w-24" />
                <div className="h-6 bg-[#FAF2E9] rounded" />
              </div>
            ))}
          </div>
        ) : data && data.byReason.length > 0 ? (
          <div className="space-y-4">
            {data.byReason.map((stat) => (
              <div key={stat.reason} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{LOST_REASON_LABELS[stat.reason]}</span>
                  <span className="text-slate-500">
                    {stat.count}건 ({stat.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={(stat.count / maxCount) * 100}
                    className="h-6"
                    style={{
                      // @ts-ignore - custom CSS variable
                      '--progress-background': LOST_REASON_COLORS[stat.reason],
                    }}
                  />
                  <div
                    className="absolute inset-0 h-6 rounded-full transition-all"
                    style={{
                      width: `${(stat.count / maxCount) * 100}%`,
                      backgroundColor: LOST_REASON_COLORS[stat.reason],
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>해당 기간에 미진행 데이터가 없습니다.</p>
          </div>
        )}

        {/* 범례 */}
        {data && data.byReason.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-4">
            {(Object.entries(LOST_REASON_LABELS) as [LostReason, string][]).map(([reason, label]) => (
              <div key={reason} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: LOST_REASON_COLORS[reason] }}
                />
                <span className="text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </StitchCard>
  );
}
