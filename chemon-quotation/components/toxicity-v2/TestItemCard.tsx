'use client';

import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { formatKRW, formatKRWShort } from '@/lib/toxicity-v2/priceEngine';
import { cn } from '@/lib/utils';

interface TestItemCardProps {
  name: string;
  category: string;
  species?: string;
  duration?: string;
  price: number | null;
  isSelected: boolean;
  categoryColor?: string;
  onClick: () => void;
}

export default function TestItemCard({
  name,
  category,
  species,
  duration,
  price,
  isSelected,
  categoryColor,
  onClick,
}: TestItemCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative cursor-pointer transition-colors min-h-[44px]',
        'border-l-4',
        isSelected
          ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-300'
          : 'hover:border-orange-200'
      )}
      style={{ borderLeftColor: categoryColor }}
    >
      <div className="flex items-start gap-3 p-3 md:p-4">
        {/* Selected checkmark */}
        {isSelected && (
          <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span
              className="inline-block rounded px-1.5 py-0.5 text-white text-[10px] font-medium truncate max-w-[120px]"
              style={{ backgroundColor: categoryColor || '#6b7280' }}
            >
              {category}
            </span>
            {species && <span className="truncate">{species}</span>}
            {duration && <span className="flex-shrink-0">{duration}</span>}
          </div>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          {price !== null ? (
            <>
              <span className="hidden md:block text-sm font-semibold whitespace-nowrap">
                {formatKRW(price)}
              </span>
              <span className="block md:hidden text-sm font-semibold whitespace-nowrap">
                {formatKRWShort(price)}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground whitespace-nowrap">별도 협의</span>
          )}
        </div>
      </div>
    </Card>
  );
}
