'use client';

/**
 * ViewModeToggle - 카드/테이블/칸반 뷰 전환 토글
 */

import { LayoutGrid, Table, Columns3 } from 'lucide-react';
import { useCustomerManagementStore } from '@/stores/customerManagementStore';
import { cn } from '@/lib/utils';

type ViewMode = 'card' | 'table' | 'kanban';

const VIEW_OPTIONS: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: 'card', icon: LayoutGrid, label: '카드 뷰' },
  { mode: 'table', icon: Table, label: '테이블 뷰' },
  { mode: 'kanban', icon: Columns3, label: '칸반 뷰' },
];

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useCustomerManagementStore();

  return (
    <div className="flex items-center rounded-lg border bg-muted p-1" role="radiogroup" aria-label="뷰 모드 선택">
      {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          role="radio"
          aria-checked={viewMode === mode}
          aria-label={label}
          onClick={() => setViewMode(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === mode
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
