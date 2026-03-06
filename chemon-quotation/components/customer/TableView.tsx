'use client';

/**
 * TableView - @tanstack/react-table 기반 고객 테이블 뷰
 */

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedEntity } from '@/types/unified-customer';
import { ENTITY_TYPE_BADGE_CONFIG } from '@/types/unified-customer';

interface TableViewProps {
  entities: UnifiedEntity[];
  selectedIds: string[];
  onToggleSelection?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onClick?: (entity: UnifiedEntity) => void;
}

function HealthBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-muted-foreground">-</span>;
  const color = score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', color)}>{score}</span>;
}

function formatDaysAgo(dateStr?: string): string {
  if (!dateStr) return '-';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ArrowUp className="ml-1 h-3 w-3" />;
  if (isSorted === 'desc') return <ArrowDown className="ml-1 h-3 w-3" />;
  return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
}

export function TableView({ entities, selectedIds, onToggleSelection, onSelectAll, onClick }: TableViewProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<UnifiedEntity>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={() => {
            if (table.getIsAllRowsSelected()) onSelectAll?.([]);
            else onSelectAll?.(entities.map(e => e.id));
          }}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="전체 선택"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => { e.stopPropagation(); onToggleSelection?.(row.original.id); }}
          className="h-4 w-4 rounded border-gray-300"
          aria-label={`${row.original.companyName} 선택`}
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: 'companyName',
      header: '회사명',
      cell: ({ row }) => {
        const badge = ENTITY_TYPE_BADGE_CONFIG[row.original.entityType];
        return (
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', badge.className)}>{badge.label}</span>
            <span className="font-medium">{row.original.companyName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'contactName',
      header: '담당자',
      cell: ({ row }) => row.original.contactName,
    },
    {
      id: 'contact',
      header: '연락처',
      cell: ({ row }) => (
        <span className="text-xs">{row.original.contactPhone || row.original.contactEmail || '-'}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'displayStage',
      header: '단계',
      cell: ({ row }) => (
        <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: row.original.stageColor + '20', color: row.original.stageColor }}>
          {row.original.displayStage}
        </span>
      ),
    },
    {
      accessorKey: 'grade',
      header: '등급',
      cell: ({ row }) => row.original.grade || '-',
    },
    {
      accessorKey: 'healthScore',
      header: '건강도',
      cell: ({ row }) => <HealthBadge score={row.original.healthScore} />,
    },
    {
      id: 'quotations',
      header: '견적',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs">
          <FileText className="h-3 w-3" />{row.original.activeQuotationCount ?? row.original.quotationCount ?? 0}
        </span>
      ),
    },
    {
      id: 'contracts',
      header: '계약',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs">
          <Briefcase className="h-3 w-3" />{row.original.activeContractCount ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: '총금액',
      cell: ({ row }) => {
        const amt = row.original.totalAmount;
        return amt != null ? `₩${amt.toLocaleString()}` : '-';
      },
    },
    {
      accessorKey: 'lastActivityAt',
      header: '최근활동',
      cell: ({ row }) => <span className="text-xs">{formatDaysAgo(row.original.lastActivityAt)}</span>,
    },
  ], [entities, selectedIds, onToggleSelection, onSelectAll]);

  const table = useReactTable({
    data: entities,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm" role="grid">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className={cn('px-3 py-2 text-left font-medium text-muted-foreground', header.column.getCanSort() && 'cursor-pointer select-none')}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                >
                  <div className="flex items-center">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <SortIcon isSorted={header.column.getIsSorted()} />}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className={cn('border-t hover:bg-muted/30 cursor-pointer transition-colors', selectedIds.includes(row.original.id) && 'bg-primary/5')}
              onClick={() => onClick?.(row.original)}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-3 py-2.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
