'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'pink' | 'yellow' | 'green' | 'purple' | 'gray';
  change?: string;
  subtitle?: string;
  href?: string;
}

// 파스텔톤 색상 스타일
const colorStyles = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-500',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    iconBg: 'bg-pink-100 dark:bg-pink-900/50',
    iconColor: 'text-pink-500',
    accent: 'text-pink-600 dark:text-pink-400',
  },
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-500',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    iconColor: 'text-violet-500',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  gray: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    iconColor: 'text-slate-500',
    accent: 'text-slate-600 dark:text-slate-400',
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  change,
  subtitle,
  href,
}: StatsCardProps) {
  const styles = colorStyles[color];

  const content = (
    <Card
      className={cn(
        'overflow-hidden border-0 shadow-soft hover-lift cursor-pointer h-[140px]',
        styles.bg
      )}
    >
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div
            className={cn('p-2.5 rounded-xl', styles.iconBg)}
          >
            <Icon className={cn('w-5 h-5', styles.iconColor)} />
          </div>
          {change && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-full',
                change.startsWith('+')
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                  : change.startsWith('-')
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              )}
            >
              {change}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <p className={cn('text-2xl font-bold', styles.accent)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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
