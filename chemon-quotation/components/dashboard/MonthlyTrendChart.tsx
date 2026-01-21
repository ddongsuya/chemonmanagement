'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        // 최근 6개월 데이터 가져오기
        const response = await getQuotations({ limit: 500 });
        if (response.success && response.data) {
          // 월별 집계
          const monthlyMap: Record<string, { quotations: number; won: number; amount: number }> = {};
          
          // 최근 6개월 초기화
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
                금액: Math.round(stats.amount / 100000000 * 10) / 10, // 억 단위
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
      <Card className="border-0 shadow-soft min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-soft min-h-[400px]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-lg">월별 견적/수주 추이</CardTitle>
            <p className="text-sm text-slate-500">최근 6개월</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorQuotation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
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
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorQuotation)"
            />
            <Area
              type="monotone"
              dataKey="수주"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWon)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
