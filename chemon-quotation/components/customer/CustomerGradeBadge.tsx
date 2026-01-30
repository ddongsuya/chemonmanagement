'use client';

import { cn } from '@/lib/utils';
import type { CustomerGrade } from '@/types';

interface CustomerGradeBadgeProps {
  grade: CustomerGrade;
  size?: 'sm' | 'md' | 'lg';
}

const gradeConfig: Record<CustomerGrade, { label: string; color: string }> = {
  LEAD: { label: '리드', color: 'bg-gray-100 text-gray-700' },
  PROSPECT: { label: '잠재고객', color: 'bg-blue-100 text-blue-700' },
  CUSTOMER: { label: '고객', color: 'bg-green-100 text-green-700' },
  VIP: { label: 'VIP', color: 'bg-purple-100 text-purple-700' },
  INACTIVE: { label: '비활성', color: 'bg-red-100 text-red-700' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export default function CustomerGradeBadge({ 
  grade, 
  size = 'md' 
}: CustomerGradeBadgeProps) {
  const config = gradeConfig[grade];
  
  if (!config) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        config.color,
        sizeClasses[size]
      )}
    >
      {config.label}
    </span>
  );
}
