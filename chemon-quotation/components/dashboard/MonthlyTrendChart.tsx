'use client';

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
import { TrendingUp } from 'lucide-react';

const data = [
  { month: '7월', 견적: 12, 수주: 5, 금액: 2.1 },
  { month: '8월', 견적: 15, 수주: 7, 금액: 2.8 },
  { month: '9월', 견적: 18, 수주: 8, 금액: 3.2 },
  { month: '10월', 견적: 14, 수주: 6, 금액: 2.5 },
  { month: '11월', 견적: 20, 수주: 9, 금액: 3.8 },
  { month: '12월', 견적: 22, 수주: 10, 금액: 4.2 },
];

export default function MonthlyTrendChart() {
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
