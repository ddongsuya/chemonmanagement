'use client';

/**
 * SortControl - 정렬 기준 드롭다운
 */

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UnifiedCustomerFilters } from '@/types/unified-customer';

interface SortControlProps {
  filters: UnifiedCustomerFilters;
  onFilterChange: (filters: UnifiedCustomerFilters) => void;
}

const SORT_OPTIONS: { value: NonNullable<UnifiedCustomerFilters['sortBy']>; label: string }[] = [
  { value: 'updatedAt', label: '최근 수정일' },
  { value: 'createdAt', label: '등록일' },
  { value: 'companyName', label: '회사명' },
  { value: 'lastActivityAt', label: '최근 활동일' },
  { value: 'quotationCount', label: '견적 수' },
  { value: 'totalAmount', label: '총 금액' },
  { value: 'healthScore', label: '건강도' },
  { value: 'dataQualityScore', label: '데이터 품질' },
];

export function SortControl({ filters, onFilterChange }: SortControlProps) {
  const toggleOrder = () => {
    onFilterChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
  };

  return (
    <div className="flex items-center gap-1">
      <Select
        value={filters.sortBy || 'updatedAt'}
        onValueChange={(v) => onFilterChange({ ...filters, sortBy: v as UnifiedCustomerFilters['sortBy'], page: 1 })}
      >
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={toggleOrder} className="h-8 w-8 p-0" aria-label="정렬 순서 변경">
        {filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </Button>
    </div>
  );
}
