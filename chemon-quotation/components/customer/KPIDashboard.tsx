'use client';

/**
 * KPIDashboard - 고객 KPI 대시보드 (recharts)
 */

import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { getKPIData, getFunnelData, getChurnRateTrend, getSegmentCLV } from '@/lib/unified-customer-api';
import {
  CHART_PALETTE,
  CHART_TOOLTIP_STYLE,
  CHART_AXIS_STYLE,
  CHART_GRID_STYLE,
  AMBER_CHART_COLORS,
} from '@/lib/chart-theme';

interface KPIDashboardProps {
  onFilterByGrade?: (grade: string) => void;
}

interface KPIData {
  newCustomers: { count: number; changeRate: number } | number;
  activeDeals: number;
  outstandingAmount: number;
  gradeDistribution: { grade: string; count: number }[];
}

const GRADE_COLORS: Record<string, string> = {
  LEAD: '#6B7280', PROSPECT: '#3B82F6', CUSTOMER: '#10B981', VIP: '#8B5CF6', INACTIVE: '#EF4444',
};
const GRADE_LABELS: Record<string, string> = {
  LEAD: '리드', PROSPECT: '잠재고객', CUSTOMER: '고객', VIP: 'VIP', INACTIVE: '비활성',
};

function StatCard({ icon: Icon, label, value, delta, onClick }: {
  icon: typeof Users; label: string; value: string | number; delta?: number; onClick?: () => void;
}) {
  return (
    <div className={cn('bg-white rounded-xl p-4 shadow-ambient', onClick ? 'cursor-pointer hover:translate-y-[-2px] transition-all duration-200' : '')} onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
          {delta != null && (
            <p className={`text-xs ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {delta >= 0 ? '+' : ''}{delta}% 전월 대비
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function KPIDashboard({ onFilterByGrade }: KPIDashboardProps) {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [funnel, setFunnel] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [churnTrend, setChurnTrend] = useState<{ month: string; rate: number }[]>([]);
  const [segmentCLV, setSegmentCLV] = useState<{ segment: string; clv: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [kpiRes, funnelRes, churnRes, clvRes] = await Promise.all([
        getKPIData(), getFunnelData(), getChurnRateTrend(), getSegmentCLV(),
      ]);
      if (kpiRes.success && kpiRes.data) {
        const raw = kpiRes.data as any;
        setKpi({
          newCustomers: raw.newCustomers,
          activeDeals: raw.activeDeals,
          outstandingAmount: raw.outstandingAmount,
          gradeDistribution: raw.gradeDistribution || [],
        });
      }
      if (funnelRes.success && funnelRes.data) {
        const fd = funnelRes.data as unknown as { stage: string; count: number }[];
        setFunnel(fd.map((d, i) => ({ name: d.stage, value: d.count, fill: Object.values(GRADE_COLORS)[i] || '#888' })));
      }
      if (churnRes.success && churnRes.data) setChurnTrend(churnRes.data as unknown as { month: string; rate: number }[]);
      if (clvRes.success && clvRes.data) setSegmentCLV(clvRes.data as unknown as { segment: string; clv: number }[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 h-20 animate-pulse shadow-ambient" />
        ))}
      </div>
    );
  }

  const gradeData = (kpi?.gradeDistribution || []).map((g: any) => ({
    name: GRADE_LABELS[g.grade] || g.grade,
    value: g.count,
    color: GRADE_COLORS[g.grade] || '#888',
  }));

  // newCustomers can be { count, changeRate } or number
  const newCustomerCount = typeof kpi?.newCustomers === 'object' && kpi?.newCustomers !== null
    ? (kpi.newCustomers as { count: number; changeRate: number }).count
    : (kpi?.newCustomers as number) ?? 0;
  const newCustomerDelta = typeof kpi?.newCustomers === 'object' && kpi?.newCustomers !== null
    ? (kpi.newCustomers as { count: number; changeRate: number }).changeRate
    : undefined;

  return (
    <div className="space-y-4 mb-6">
      {/* KPI 카드 */}
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
        <div className="min-w-[160px] flex-shrink-0 md:min-w-0">
          <StatCard icon={Users} label="신규 등록" value={newCustomerCount} delta={newCustomerDelta} />
        </div>
        <div className="min-w-[160px] flex-shrink-0 md:min-w-0">
          <StatCard icon={TrendingUp} label="활성 거래" value={kpi?.activeDeals ?? 0} />
        </div>
        <div className="min-w-[160px] flex-shrink-0 md:min-w-0">
          <StatCard icon={AlertTriangle} label="미수금 합계" value={`₩${(kpi?.outstandingAmount ?? 0).toLocaleString()}`} />
        </div>
        <div className="min-w-[160px] flex-shrink-0 md:min-w-0">
          <StatCard icon={DollarSign} label="등급 분포" value={`${gradeData.length}개 등급`} />
        </div>
      </div>

      {/* 차트 행 */}
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
        {/* 등급 분포 도넛 */}
        <div className="bg-white rounded-xl shadow-ambient min-w-[260px] flex-shrink-0 md:min-w-0">
          <div className="p-3 pb-0"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">등급별 분포</p></div>
          <div className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                  {gradeData.map((d, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} className="cursor-pointer" onClick={() => onFilterByGrade?.(Object.keys(GRADE_LABELS)[i])} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 전환 퍼널 */}
        <div className="bg-white rounded-xl shadow-ambient min-w-[260px] flex-shrink-0 md:min-w-0">
          <div className="p-3 pb-0"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">전환 퍼널</p></div>
          <div className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={funnel} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} {...CHART_AXIS_STYLE} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnel.map((d, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 이탈률 추이 */}
        <div className="bg-white rounded-xl shadow-ambient min-w-[260px] flex-shrink-0 md:min-w-0">
          <div className="p-3 pb-0"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이탈률 추이</p></div>
          <div className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={churnTrend}>
                <CartesianGrid {...CHART_GRID_STYLE} />
                <XAxis dataKey="month" {...CHART_AXIS_STYLE} />
                <YAxis {...CHART_AXIS_STYLE} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="rate" stroke={AMBER_CHART_COLORS.error} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 세그먼트별 CLV */}
        <div className="bg-white rounded-xl shadow-ambient min-w-[260px] flex-shrink-0 md:min-w-0">
          <div className="p-3 pb-0"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">세그먼트별 CLV</p></div>
          <div className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={segmentCLV} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="segment" width={70} {...CHART_AXIS_STYLE} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => `₩${v.toLocaleString()}`} />
                <Bar dataKey="clv" fill={AMBER_CHART_COLORS.accent2} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
