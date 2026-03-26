'use client';

import Link from 'next/link';
import { StitchCard } from '@/components/ui/StitchCard';
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

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  trend,
  subtitle,
  href,
}: StatsCardProps) {
  const content = (
    <StitchCard
      variant="elevated"
      hover={!!href}
      padding="md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-[#FAF2E9]">
          <Icon className="w-4 h-4 text-primary" />
        </div>

        {(change || trend) && (
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1',
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
            trend === 'down' ? 'bg-red-50 text-red-600' :
            'bg-slate-100 text-slate-500'
          )}>
            {trend && getTrendIcon(trend)}
            {change && <span>{change}</span>}
          </span>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-black tracking-tighter text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </StitchCard>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
