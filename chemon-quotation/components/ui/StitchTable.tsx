'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Outer Container ─── */

export interface StitchTableProps extends React.HTMLAttributes<HTMLDivElement> {}

const StitchTable = React.forwardRef<HTMLDivElement, StitchTableProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-[#FAF2E9] rounded-xl md:rounded-[2.5rem] p-4 md:p-8',
        className,
      )}
      {...props}
    >
      <table className="w-full text-left">{children}</table>
    </div>
  ),
);
StitchTable.displayName = 'StitchTable';

/* ─── Header (thead) ─── */

export interface StitchTableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const StitchTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  StitchTableHeaderProps
>(({ className, children, ...props }, ref) => (
  <thead ref={ref} className={cn('border-b border-[#EFE7DD]', className)} {...props}>
    {children}
  </thead>
));
StitchTableHeader.displayName = 'StitchTableHeader';

/* ─── Body (tbody) ─── */

export interface StitchTableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const StitchTableBody = React.forwardRef<
  HTMLTableSectionElement,
  StitchTableBodyProps
>(({ className, children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('divide-y divide-slate-100', className)}
    {...props}
  >
    {children}
  </tbody>
));
StitchTableBody.displayName = 'StitchTableBody';


/* ─── Row (tr) ─── */

export interface StitchTableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {}

const StitchTableRow = React.forwardRef<
  HTMLTableRowElement,
  StitchTableRowProps
>(({ className, children, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'group hover:bg-[#FFF8F1] transition-all duration-150 even:bg-[#FFF8F1]/50',
      className,
    )}
    {...props}
  >
    {children}
  </tr>
));
StitchTableRow.displayName = 'StitchTableRow';

/* ─── Head Cell (th) ─── */

export interface StitchTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const StitchTableHead = React.forwardRef<
  HTMLTableCellElement,
  StitchTableHeadProps
>(({ className, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'pb-6 text-[11px] font-bold uppercase tracking-widest text-slate-400 font-[inherit]',
      className,
    )}
    {...props}
  >
    {children}
  </th>
));
StitchTableHead.displayName = 'StitchTableHead';

/* ─── Data Cell (td) ─── */

export interface StitchTableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const StitchTableCell = React.forwardRef<
  HTMLTableCellElement,
  StitchTableCellProps
>(({ className, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('py-5 text-sm text-slate-700', className)}
    style={{ fontVariantNumeric: 'tabular-nums' }}
    {...props}
  >
    {children}
  </td>
));
StitchTableCell.displayName = 'StitchTableCell';

/* ─── Footer (tfoot) ─── */

export interface StitchTableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const StitchTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  StitchTableFooterProps
>(({ className, children, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('bg-[#F5EDE3] font-bold', className)}
    {...props}
  >
    {children}
  </tfoot>
));
StitchTableFooter.displayName = 'StitchTableFooter';

export {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
  StitchTableFooter,
};
