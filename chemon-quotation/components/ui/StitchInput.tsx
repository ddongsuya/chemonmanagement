'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StitchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hasError?: boolean;
}

const StitchInput = React.forwardRef<HTMLInputElement, StitchInputProps>(
  ({ className, label, hasError = false, id, ...props }, ref) => {
    const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold uppercase tracking-widest text-slate-500"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'bg-white border-none rounded-xl px-4 py-3 text-sm outline-none',
            'focus:ring-2 focus:ring-primary/40',
            hasError && 'ring-2 ring-red-500',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
StitchInput.displayName = 'StitchInput';

export { StitchInput };
