'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { calculateTotalWeeks } from '@/lib/efficacy-v2/cost-engine';
import { CHART_PALETTE, CHART_TOOLTIP_STYLE, formatChartCurrency } from '@/lib/chart-theme';
import {
  StitchTable, StitchTableHeader, StitchTableBody,
  StitchTableRow, StitchTableHead, StitchTableCell,
} from '@/components/ui/StitchTable';

const fmt = (n: number) => (n ?? 0).toLocaleString('ko-KR');

export default function CostCalculator() {
  const {
    selectedModel, costItems, totalCost, costByCategory,
    groups, evalItems, scheduleSteps,
  } = useEfficacyQuotationStore();

  const totalAnimals = groups.reduce((s, g) => s + g.animalCount, 0);
  const totalWeeks = calculateTotalWeeks(scheduleSteps);
  const enabledEvals = evalItems.filter(e => e.isEnabled).length;

  if (!selectedModel) return null;

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ['총 동물', `${totalAnimals}마리`],
          ['시험기간', `${totalWeeks}주`],
          ['평가항목', `${enabledEvals}개`],
          ['총 비용', `${fmt(totalCost)}원`],
        ] as const).map(([label, value]) => (
          <div key={label} className="border border-border rounded-lg p-3 text-center bg-white">
            <div className="text-lg font-semibold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            <div className="text-[10px] mt-0.5 text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Cost Table + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <StitchTable>
            <StitchTableHeader>
              <tr>
                <StitchTableHead>카테고리</StitchTableHead>
                <StitchTableHead>항목</StitchTableHead>
                <StitchTableHead className="text-right">단가</StitchTableHead>
                <StitchTableHead className="text-right">수량</StitchTableHead>
                <StitchTableHead className="text-right">계수</StitchTableHead>
                <StitchTableHead className="text-right">소계</StitchTableHead>
              </tr>
            </StitchTableHeader>
            <StitchTableBody>
              {costItems.map((it) => (
                <StitchTableRow key={it.id}>
                  <StitchTableCell className="text-muted-foreground text-[11px]">{it.category}</StitchTableCell>
                  <StitchTableCell className="font-medium text-[11px]">{it.name}</StitchTableCell>
                  <StitchTableCell className="text-right text-[11px]">{fmt(it.unitPrice)}</StitchTableCell>
                  <StitchTableCell className="text-right text-[11px]">{it.quantity}</StitchTableCell>
                  <StitchTableCell className="text-right text-[11px]">{it.multiplier}</StitchTableCell>
                  <StitchTableCell className="text-right font-semibold text-[11px]">{fmt(it.subtotal)}</StitchTableCell>
                </StitchTableRow>
              ))}
              <tr className="border-t-2 border-border font-semibold">
                <td colSpan={5} className="px-4 py-3 text-sm text-foreground">합계</td>
                <td className="px-4 py-3 text-right text-sm text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCost)}</td>
              </tr>
            </StitchTableBody>
          </StitchTable>
        </div>

        <div className="lg:col-span-2 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={costByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={35}
                paddingAngle={2}
              >
                {costByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatChartCurrency(v)}
                contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                itemStyle={CHART_TOOLTIP_STYLE.itemStyle}
                labelStyle={CHART_TOOLTIP_STYLE.labelStyle}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
            {costByCategory.map((d, i) => (
              <span key={i} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="w-2 h-2 rounded-sm" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
