'use client';

/**
 * KPIDashboard - 고객 KPI 대시보드 (recharts)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
  FunnelChart, Funnel, LabelList,
} from 'recharts';
import { getKPIData, getFunnelData, getChurnRateTrend, getSegmentCLV } from '@/lib/unified-customer-api';

interface KPIDashboardProps {
  onFilterByGrade?: (grade: string) => void;
}

interface KPIData {
  newCustomers: number;
  newCustomersDelta: number;
  activeDeals: number;
  outstandingAmount: number;
  gradeDistribution: { name: string; value: number; color: string }[];
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
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
          {delta != null && (
            <p className={`text-xs ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta >= 0 ? '+' : ''}{delta}% 전월 대비
            </p>
          )}
        </div>
      </CardContent>
    </Card>
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
      if (kpiRes.success && kpiRes.data) setKpi(kpiRes.data as unknown as KPIData);
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
          <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted/50" /></Card>
        ))}
      </div>
    );
  }

  const gradeData = kpi?.gradeDistribution || Object.entries(GRADE_LABELS).map(([k, v]) => ({
    name: v, value: 0, color: GRADE_COLORS[k],
  }));

  return (
    <div className="space-y-4 mb-6">
      {/* KPI 카드 */}
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
        <div className="min-w-[160px] flex-shrink-0 md:min-w-0">
          <StatCard icon={Users} label="신규 등록" value={kpi?.newCustomers ?? 0} delta={kpi?.newCustomersDelta} />
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
        <Card className="min-w-[260px] flex-shrink-0 md:min-w-0">
          <CardHeader className="p-3 pb-0"><CardTitle className="text-xs">등급별 분포</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                  {gradeData.map((d, i) => <Cell key={i} fill={d.color} className="cursor-pointer" onClick={() => onFilterByGrade?.(Object.keys(GRADE_LABELS)[i])} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 전환 퍼널 */}
        <Card className="min-w-[260px] flex-shrink-0 md:min-w-0">
          <CardHeader className="p-3 pb-0"><CardTitle className="text-xs">전환 퍼널</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={funnel} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnel.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 이탈률 추이 */}
        <Card className="min-w-[260px] flex-shrink-0 md:min-w-0">
          <CardHeader className="p-3 pb-0"><CardTitle className="text-xs">이탈률 추이</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={churnTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 세그먼트별 CLV */}
        <Card className="min-w-[260px] flex-shrink-0 md:min-w-0">
          <CardHeader className="p-3 pb-0"><CardTitle className="text-xs">세그먼트별 CLV</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={segmentCLV} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="segment" width={70} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `₩${v.toLocaleString()}`} />
                <Bar dataKey="clv" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
