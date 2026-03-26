'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const SURFACE_COLORS = {
  'surface': 'bg-[#FFF8F1]',
  'surface-low': 'bg-[#FAF2E9]',
  'surface-container': 'bg-[#F5EDE3]',
  'surface-high': 'bg-[#EFE7DD]',
  'surface-highest': 'bg-[#E9E1D8]',
  'elevated': 'bg-white',
} as const;

type SurfaceVariant = keyof typeof SURFACE_COLORS;

const PADDING_MAP = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

export interface StitchCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const StitchCard = React.forwardRef<HTMLDivElement, StitchCardProps>(
  ({ className, variant = 'surface-low', hover = false, padding = 'md', children, ...props }, ref) => {
    const isElevated = variant === 'elevated';

    return (
      <div
        ref={ref}
        className={cn(
          SURFACE_COLORS[variant],
          isElevated ? 'rounded-2xl shadow-ambient' : 'rounded-xl',
          PADDING_MAP[padding],
          hover && 'hover:translate-y-[-2px] hover:shadow-ambient transition-all duration-200 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StitchCard.displayName = 'StitchCard';

export { StitchCard, SURFACE_COLORS };
export type { SurfaceVariant };
