'use client';

import { StitchCard } from '@/components/ui/StitchCard';
import { Users, Building2, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedCustomerStats as StatsType } from '@/types/unified-customer';

/**
 * UnifiedCustomerStats 컴포넌트 Props
 */
export interface UnifiedCustomerStatsProps {
  stats: StatsType;
  loading?: boolean;
  className?: string;
}

interface StatCardItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

/** 등급별 색상 매핑 */
const GRADE_COLORS: Record<string, string> = {
  '리드': '#6B7280',
  '잠재고객': '#3B82F6',
  '계약완료': '#10B981',
  'VIP': '#8B5CF6',
  '비활성': '#EF4444',
};

/**
 * UnifiedCustomerStats 컴포넌트
 * 
 * 통합 고객 목록의 통계 정보를 카드 형태로 표시합니다.
 * 등급별 분포도 함께 표시합니다.
 */
export default function UnifiedCustomerStats({
  stats,
  loading = false,
  className,
}: UnifiedCustomerStatsProps) {
  const statCards: StatCardItem[] = [
    {
      label: '전체',
      value: stats.totalCount,
      icon: Users,
      color: 'text-slate-700 dark:text-slate-300',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
    },
    {
      label: '리드',
      value: stats.leadCount,
      icon: Building2,
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: '고객',
      value: stats.customerCount,
      icon: UserCheck,
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  // 등급별 분포 데이터 (stageDistribution에서 추출)
  const gradeEntries = Object.entries(stats.stageDistribution || {});
  const hasGradeData = gradeEntries.length > 0;

  if (loading) {
    return <UnifiedCustomerStatsSkeleton className={className} />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 기본 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StitchCard key={card.label} variant="elevated" padding="sm" className="overflow-hidden">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', card.bgColor)}>
                  <card.icon className={cn('h-5 w-5', card.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
                  <p className={cn('text-xl font-bold', card.color)}>
                    {card.value.toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
          </StitchCard>
        ))}
      </div>

      {/* 등급별 분포 바 */}
      {hasGradeData && (
        <StitchCard variant="surface-low" padding="sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">단계별 분포</p>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {gradeEntries.map(([stage, count]) => {
                const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={stage}
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: GRADE_COLORS[stage] || '#9CA3AF',
                      minWidth: pct > 0 ? '4px' : '0',
                    }}
                    title={`${stage}: ${count}건 (${pct.toFixed(0)}%)`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {gradeEntries.map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: GRADE_COLORS[stage] || '#9CA3AF' }}
                  />
                  <span className="text-slate-500">{stage}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
        </StitchCard>
      )}
    </div>
  );
}

/**
 * UnifiedCustomerStats 스켈레톤 컴포넌트
 */
export function UnifiedCustomerStatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <StitchCard key={i} variant="elevated" padding="sm" className="overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
          </StitchCard>
        ))}
      </div>
      <StitchCard variant="surface-low" padding="sm">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </StitchCard>
    </div>
  );
}
