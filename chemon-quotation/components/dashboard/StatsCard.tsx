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

const colorStyles = {
  orange: {
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    accent: 'text-orange-600 dark:text-orange-400',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  pink: {
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
    accent: 'text-pink-600 dark:text-pink-400',
  },
  yellow: {
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    accent: 'text-yellow-600 dark:text-yellow-400',
  },
  green: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  gray: {
    iconBg: 'bg-slate-100 dark:bg-slate-800/50',
    iconColor: 'text-slate-600 dark:text-slate-400',
    accent: 'text-slate-600 dark:text-slate-400',
  },
};

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-3.5 h-3.5" />;
    case 'down': return <TrendingDown className="w-3.5 h-3.5" />;
    default: return <Minus className="w-3.5 h-3.5" />;
  }
};

const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return 'text-emerald-500';
    case 'down': return 'text-red-500';
    default: return 'text-muted-foreground';
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
    <Card className="shadow-soft hover:shadow-soft-lg transition-shadow duration-200 h-[130px]">
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', styles.iconBg)}>
            <Icon className={cn('w-4 h-4', styles.iconColor)} />
          </div>
          
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
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <p className={cn('text-xl font-semibold', styles.accent)}>{value}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
