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

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-3.5 h-3.5" />;
    case 'down': return <TrendingDown className="w-3.5 h-3.5" />;
    default: return <Minus className="w-3.5 h-3.5" />;
  }
};

const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return 'text-emerald-600 dark:text-emerald-400';
    case 'down': return 'text-red-600 dark:text-red-400';
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
  const content = (
    <Card className={cn(
      "h-[130px]",
      href && "transition-colors hover:bg-accent/50 cursor-pointer"
    )}>
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-4 h-4 text-muted-foreground" />
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
          <p className="text-xl font-semibold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
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
