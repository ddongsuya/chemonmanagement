// Stitch Amber Curator chart color palette
export const AMBER_CHART_COLORS = {
  primary: '#E8772E',    // warm orange (primary)
  secondary: '#F5A623',  // amber gold
  tertiary: '#C45D1A',   // deep brown-orange
  accent1: '#2D9F93',    // teal accent
  accent2: '#7C5CBF',    // purple accent
  accent3: '#D4845A',    // muted terracotta
  success: '#10B981',    // emerald
  warning: '#F59E0B',    // amber
  error: '#EF4444',      // red
  neutral: '#94A3B8',    // slate
};

// Ordered palette for pie/bar charts
export const CHART_PALETTE = [
  '#E8772E', '#F5A623', '#C45D1A', '#2D9F93', '#7C5CBF', '#D4845A',
  '#10B981', '#F59E0B', '#94A3B8', '#EF4444',
];

// Shared recharts tooltip style
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#FFF8F1',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(30, 27, 21, 0.06)',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#1E1B15',
  },
  itemStyle: {
    color: '#64748B',
    fontSize: '12px',
    padding: '2px 0',
  },
  labelStyle: {
    color: '#1E1B15',
    fontWeight: 700,
    fontSize: '13px',
    marginBottom: '4px',
  },
};

// Shared axis style
export const CHART_AXIS_STYLE = {
  tick: { fontSize: 11, fill: '#94A3B8', fontWeight: 500 },
  axisLine: { stroke: '#E9E1D8' },
  tickLine: false as const,
};

// Shared grid style
export const CHART_GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: '#EFE7DD',
  vertical: false as const,
};

// Format Korean currency for tooltips
export function formatChartCurrency(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억원`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만원`;
  return `${value.toLocaleString()}원`;
}
