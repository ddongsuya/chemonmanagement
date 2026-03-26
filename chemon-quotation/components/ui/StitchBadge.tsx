'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const STATUS_BADGE_MAP: Record<string, { bg: string; text: string }> = {
  // 견적 상태
  DRAFT:    { bg: 'bg-slate-100',   text: 'text-slate-600' },
  SENT:     { bg: 'bg-blue-50',     text: 'text-blue-600' },
  ACCEPTED: { bg: 'bg-emerald-50',  text: 'text-emerald-600' },
  REJECTED: { bg: 'bg-red-50',      text: 'text-red-600' },
  EXPIRED:  { bg: 'bg-amber-50',    text: 'text-amber-600' },
  // 고객 등급
  LEAD:     { bg: 'bg-sky-50',      text: 'text-sky-600' },
  PROSPECT: { bg: 'bg-violet-50',   text: 'text-violet-600' },
  CUSTOMER: { bg: 'bg-emerald-50',  text: 'text-emerald-600' },
  VIP:      { bg: 'bg-orange-50',   text: 'text-orange-600' },
  INACTIVE: { bg: 'bg-slate-100',   text: 'text-slate-500' },
};

const VARIANT_COLORS = {
  success:  { bg: 'bg-emerald-50',  text: 'text-emerald-600' },
  warning:  { bg: 'bg-amber-50',    text: 'text-amber-600' },
  error:    { bg: 'bg-red-50',      text: 'text-red-600' },
  info:     { bg: 'bg-blue-50',     text: 'text-blue-600' },
  neutral:  { bg: 'bg-slate-100',   text: 'text-slate-600' },
  primary:  { bg: 'bg-orange-50',   text: 'text-orange-600' },
} as const;

type BadgeVariant = keyof typeof VARIANT_COLORS;

export interface StitchBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  status?: string;
}

function StitchBadge({ className, variant, status, children, ...props }: StitchBadgeProps) {
  // status string takes priority if provided and exists in map
  const colors = status && STATUS_BADGE_MAP[status]
    ? STATUS_BADGE_MAP[status]
    : VARIANT_COLORS[variant ?? 'neutral'];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-bold uppercase tracking-wider',
        colors.bg,
        colors.text,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { StitchBadge, STATUS_BADGE_MAP, VARIANT_COLORS };
export type { BadgeVariant };
