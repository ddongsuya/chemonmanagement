'use client';

import { useState, useEffect } from 'react';
import { StitchCard } from '@/components/ui/StitchCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { getQuotations } from '@/lib/data-api';
import {
  AMBER_CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  CHART_AXIS_STYLE,
  CHART_GRID_STYLE,
} from '@/lib/chart-theme';

interface MonthlyData {
  month: string;
  견적: number;
  수주: number;
  금액: number;
}

export default function MonthlyTrendChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getQuotations({ limit: 500 });
        if (response.success && response.data) {
          const monthlyMap: Record<string, { quotations: number; won: number; amount: number }> = {};
          
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[key] = { quotations: 0, won: 0, amount: 0 };
          }

          const quotationData = response.data.data || [];
          quotationData.forEach((q: any) => {
            const date = new Date(q.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyMap[key]) {
              monthlyMap[key].quotations += 1;
              if (q.status === 'ACCEPTED') {
                monthlyMap[key].won += 1;
                monthlyMap[key].amount += Number(q.totalAmount) || 0;
              }
            }
          });

          const chartData = Object.entries(monthlyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, stats]) => {
              const [year, month] = key.split('-');
              return {
                month: `${parseInt(month)}월`,
                견적: stats.quotations,
                수주: stats.won,
                금액: Math.round(stats.amount / 100000000 * 10) / 10,
              };
            });

          setData(chartData);
        }
      } catch (error) {
        console.error('Failed to load monthly data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <StitchCard variant="surface-low" padding="lg" className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </StitchCard>
    );
  }

  return (
    <StitchCard variant="surface-low" padding="lg" className="min-h-[400px]">
      <div className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF8F1] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">월별 견적/수주 추이</h3>
            <p className="text-sm text-slate-500">최근 6개월</p>
          </div>
        </div>
      </div>
      <div className="pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorQuotation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={AMBER_CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={AMBER_CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={AMBER_CHART_COLORS.secondary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={AMBER_CHART_COLORS.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...CHART_GRID_STYLE} />
            <XAxis
              dataKey="month"
              {...CHART_AXIS_STYLE}
              axisLine={false}
            />
            <YAxis
              {...CHART_AXIS_STYLE}
              axisLine={false}
            />
            <Tooltip
              {...CHART_TOOLTIP_STYLE}
              formatter={(value: number, name: string) => {
                if (name === '금액') return [`${value}억`, name];
                return [`${value}건`, name];
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="견적"
              stroke={AMBER_CHART_COLORS.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorQuotation)"
            />
            <Area
              type="monotone"
              dataKey="수주"
              stroke={AMBER_CHART_COLORS.secondary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWon)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </StitchCard>
  );
}
