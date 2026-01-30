'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'orange' | 'amber' | 'blue' | 'pink' | 'yellow' | 'green' | 'purple' | 'gray';
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  href?: string;
}

// 오렌지 테마 기반 색상 스타일
const colorStyles = {
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40',
    iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    iconColor: 'text-white',
    accent: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200/50 dark:border-orange-800/30',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40',
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    iconColor: 'text-white',
    accent: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/50 dark:border-amber-800/30',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40',
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    iconColor: 'text-white',
    accent: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/50 dark:border-blue-800/30',
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40',
    iconBg: 'bg-gradient-to-br from-pink-400 to-pink-600',
    iconColor: 'text-white',
    accent: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200/50 dark:border-pink-800/30',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40',
    iconBg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    iconColor: 'text-white',
    accent: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200/50 dark:border-yellow-800/30',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    iconColor: 'text-white',
    accent: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/50 dark:border-emerald-800/30',
  },
  purple: {
    bg: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
    iconBg: 'bg-gradient-to-br from-violet-400 to-violet-600',
    iconColor: 'text-white',
    accent: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/50 dark:border-violet-800/30',
  },
  gray: {
    bg: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/40 dark:to-gray-900/40',
    iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600',
    iconColor: 'text-white',
    accent: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200/50 dark:border-slate-700/30',
  },
};

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4" />;
    case 'down':
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <Minus className="w-4 h-4" />;
  }
};

const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return 'text-emerald-500';
    case 'down':
      return 'text-red-500';
    default:
      return 'text-slate-400';
  }
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  change,
  trend,
  subtitle,
  href,
}: StatsCardProps) {
  const styles = colorStyles[color];

  const content = (
    <Card
      className={cn(
        'overflow-hidden border shadow-soft cursor-pointer h-[140px]',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-xl',
        styles.bg,
        styles.border
      )}
    >
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          {/* 아이콘 - 그라데이션 배경 */}
          <div
            className={cn(
              'p-2.5 rounded-xl shadow-lg',
              styles.iconBg
            )}
          >
            <Icon className={cn('w-5 h-5', styles.iconColor)} />
          </div>
          
          {/* 변화율 또는 트렌드 */}
          {(change || trend) && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              getTrendColor(trend)
            )}>
              {trend && getTrendIcon(trend)}
              {change && <span>{change}</span>}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <p className={cn('text-2xl font-bold', styles.accent)}>{value}</p>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
