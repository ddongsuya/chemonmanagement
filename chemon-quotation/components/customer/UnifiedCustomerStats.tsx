'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Building2, UserCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedCustomerStats as StatsType } from '@/types/unified-customer';

/**
 * UnifiedCustomerStats 컴포넌트 Props
 * 
 * @requirements 7.1, 7.2
 */
export interface UnifiedCustomerStatsProps {
  /** 통계 데이터 */
  stats: StatsType;
  /** 로딩 상태 */
  loading?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 통계 카드 아이템 인터페이스
 */
interface StatCardItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

/**
 * UnifiedCustomerStats 컴포넌트
 * 
 * 통합 고객 목록의 통계 정보를 카드 형태로 표시합니다.
 * 
 * @requirements 7.1 - 총 항목 수 표시
 * @requirements 7.2 - 리드 수, 고객 수 카드 표시
 */
export default function UnifiedCustomerStats({
  stats,
  loading = false,
  className,
}: UnifiedCustomerStatsProps) {
  // 통계 카드 데이터 구성
  const statCards: StatCardItem[] = [
    {
      label: '전체',
      value: stats.totalCount,
      icon: Users,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
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

  if (loading) {
    return <UnifiedCustomerStatsSkeleton className={className} />;
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}>
      {statCards.map((card) => (
        <Card key={card.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* 아이콘 */}
              <div className={cn('p-3 rounded-lg', card.bgColor)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              
              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={cn('text-2xl font-bold', card.color)}>
                  {card.value.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * UnifiedCustomerStats 스켈레톤 컴포넌트
 * 로딩 상태에서 표시되는 플레이스홀더
 */
export function UnifiedCustomerStatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse', className)}>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
