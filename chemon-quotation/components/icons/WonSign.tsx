'use client';

import { cn } from '@/lib/utils';

interface WonSignProps {
  className?: string;
}

/**
 * 원화(₩) 아이콘 컴포넌트
 * lucide-react의 DollarSign 대체용
 */
export default function WonSign({ className }: WonSignProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-4 h-4', className)}
    >
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
      >
        ₩
      </text>
    </svg>
  );
}
