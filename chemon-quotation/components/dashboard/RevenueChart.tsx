'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DollarSign, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { getRevenueAnalytics } from '@/lib/analytics-api';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
  period: string;
  revenue: number;
  count: number;
  growth?: number;
}

export default function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCount: 0,
    avgDealSize: 0,
    growth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await getRevenueAnalytics({
          startDate,
          endDate,
          period: 'monthly',
        });

        if (response && response.data) {
          setData((response.data || []).map(d => ({
            ...d,
            period: d.period.slice(5) + '월', // 2025-01 -> 01월
          })));
          setSummary(response.summary || {
            totalRevenue: 0,
            totalCount: 0,
            avgDealSize: 0,
            growth: 0,
          });
        }
      } catch (error) {
        console.error('Failed to load revenue data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-soft h-full flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-soft h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg">매출 현황</CardTitle>
              <p className="text-sm text-slate-500">최근 6개월</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(summary.totalRevenue)}
            </p>
            <div className="flex items-center gap-1 justify-end">
              {summary.growth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${summary.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {summary.growth >= 0 ? '+' : ''}{summary.growth.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 100000000).toFixed(0)}억`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [formatCurrency(value), '매출']}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={index === data.length - 1 ? '#10b981' : '#a7f3d0'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-slate-500">계약 건수</p>
            <p className="text-lg font-semibold">{summary.totalCount}건</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">평균 계약금액</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.avgDealSize)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
