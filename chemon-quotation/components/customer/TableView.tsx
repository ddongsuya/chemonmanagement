'use client';

/**
 * TableView - Monday Sales CRM 스프레드시트 스타일 테이블
 */

import { useMemo, useState } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import {
  ArrowUpDown, ArrowUp, ArrowDown, FileText, Briefcase,
  Phone, Mail, MoreHorizontal,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { UnifiedEntity } from '@/types/unified-customer';
import { ENTITY_TYPE_BADGE_CONFIG } from '@/types/unified-customer';

interface TableViewProps {
  entities: UnifiedEntity[];
  selectedIds: string[];
  onToggleSelection?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onClick?: (entity: UnifiedEntity) => void;
  onGradeChange?: (entity: UnifiedEntity, grade: string) => void;
}

const GRADE_CONFIG: Record<string, { label: string; color: string }> = {
  LEAD: { label: '리드', color: '#6B7280' },
  PROSPECT: { label: '잠재고객', color: '#3B82F6' },
  CUSTOMER: { label: '고객', color: '#10B981' },
  VIP: { label: 'VIP', color: '#8B5CF6' },
  INACTIVE: { label: '비활성', color: '#EF4444' },
};

function HealthBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-muted-foreground text-xs">-</span>;
  const color = score >= 70 ? 'bg-green-50 text-green-700 border-green-200'
    : score >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
    : 'bg-red-50 text-red-700 border-red-200';
  return <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium border', color)}>{score}</span>;
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
  return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
}

function InlineGradeCell({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const config = GRADE_CONFIG[value || 'CUSTOMER'] || GRADE_CONFIG.CUSTOMER;
  if (!onChange) return <span className="text-xs" style={{ color: config.color }}>{config.label}</span>;

  return (
    <Select value={value || 'CUSTOMER'} onValueChange={onChange}>
      <SelectTrigger
        className="h-6 w-[80px] border-0 bg-transparent text-xs font-medium px-1.5 focus:ring-0"
        style={{ color: config.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(GRADE_CONFIG).map(([k, v]) => (
          <SelectItem key={k} value={k}>
            <span style={{ color: v.color }}>{v.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TableView({ entities, selectedIds, onToggleSelection, onSelectAll, onClick, onGradeChange }: TableViewProps) {
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
      size: 36,
      enableSorting: false,
    },
    {
      accessorKey: 'companyName',
      header: '회사명',
      cell: ({ row }) => {
        const badge = ENTITY_TYPE_BADGE_CONFIG[row.original.entityType];
        return (
          <div className="flex items-center gap-2">
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', badge.className)}>{badge.label}</span>
            <span className="font-medium text-sm">{row.original.companyName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'contactName',
      header: '담당자',
      cell: ({ row }) => <span className="text-sm">{row.original.contactName}</span>,
    },
    {
      id: 'contact',
      header: '연락처',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.contactPhone || row.original.contactEmail || '-'}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'displayStage',
      header: '단계',
      cell: ({ row }) => (
        <span
          className="inline-block rounded px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: row.original.stageColor + '15',
            color: row.original.stageColor,
            borderLeft: `3px solid ${row.original.stageColor}`,
          }}
        >
          {row.original.displayStage}
        </span>
      ),
    },
    {
      accessorKey: 'grade',
      header: '등급',
      cell: ({ row }) => (
        <InlineGradeCell
          value={row.original.grade}
          onChange={row.original.entityType === 'CUSTOMER'
            ? (v) => onGradeChange?.(row.original, v)
            : undefined}
        />
      ),
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
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />{row.original.activeQuotationCount ?? row.original.quotationCount ?? 0}
        </span>
      ),
    },
    {
      id: 'contracts',
      header: '계약',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Briefcase className="h-3 w-3" />{row.original.activeContractCount ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: '총금액',
      cell: ({ row }) => {
        const amt = row.original.totalAmount;
        return <span className="text-sm">{amt != null ? `₩${amt.toLocaleString()}` : '-'}</span>;
      },
    },
    {
      accessorKey: 'lastActivityAt',
      header: '최근활동',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDaysAgo(row.original.lastActivityAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
          {row.original.contactPhone && (
            <a href={`tel:${row.original.contactPhone}`} className="p-1 rounded hover:bg-muted" onClick={(e) => e.stopPropagation()} aria-label="전화">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          )}
          {row.original.contactEmail && (
            <a href={`mailto:${row.original.contactEmail}`} className="p-1 rounded hover:bg-muted" onClick={(e) => e.stopPropagation()} aria-label="이메일">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          )}
        </div>
      ),
      size: 60,
      enableSorting: false,
    },
  ], [entities, selectedIds, onToggleSelection, onSelectAll, onGradeChange]);

  const table = useReactTable({
    data: entities,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm" role="grid">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="border-b bg-muted/30">
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className={cn(
                    'px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                    header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                  )}
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
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className={cn(
                'group/row hover:bg-muted/20 cursor-pointer transition-colors',
                selectedIds.includes(row.original.id) && 'bg-primary/5'
              )}
              onClick={() => onClick?.(row.original)}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-3 py-2">
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
