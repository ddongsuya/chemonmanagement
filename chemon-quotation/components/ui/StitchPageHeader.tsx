'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StitchPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  label?: string;
  large?: boolean;
  className?: string;
}

function StitchPageHeader({
  title,
  description,
  actions,
  label,
  large = false,
  className,
}: StitchPageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        {label && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {label}
          </p>
        )}
        <h1
          className={cn(
            'tracking-tight',
            large
              ? 'text-[2.75rem] font-black'
              : 'text-2xl font-extrabold'
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export { StitchPageHeader };
