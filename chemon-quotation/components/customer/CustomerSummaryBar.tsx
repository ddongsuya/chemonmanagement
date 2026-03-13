'use client';

/**
 * CustomerSummaryBar - 접이식 KPI 요약 바 (Monday CRM 스타일)
 * KPIDashboard를 대체하는 컴팩트한 요약 + 접이식 차트
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown, ChevronUp, Users, TrendingUp, AlertTriangle, DollarSign,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { getKPIData, getFunnelData, getChurnRateTrend, getSegmentCLV } from '@/lib/unified-customer-api';

interface CustomerSummaryBarProps {
  onFilterByGrade?: (grade: string) => void;
}

const GRADE_COLORS: Record<string, string> = {
  LEAD: '#6B7280', PROSPECT: '#3B82F6', CUSTOMER: '#10B981', VIP: '#8B5CF6', INACTIVE: '#EF4444',
};
const GRADE_LABELS: Record<string, string> = {
  LEAD: '리드', PROSPECT: '잠재고객', CUSTOMER: '고객', VIP: 'VIP', INACTIVE: '비활성',
};

export function CustomerSummaryBar({ onFilterByGrade }: CustomerSummaryBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [kpi, setKpi] = useState<any>(null);
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
      if (kpiRes.success && kpiRes.data) setKpi(kpiRes.data);
      if (funnelRes.success && funnelRes.data) {
        const fd = funnelRes.data as unknown as { stage: string; count: number }[];
        setFunnel(fd.map((d, i) => ({
          name: d.stage, value: d.count,
          fill: Object.values(GRADE_COLORS)[i] || '#888',
        })));
      }
      if (churnRes.success && churnRes.data) setChurnTrend(churnRes.data as any);
      if (clvRes.success && clvRes.data) setSegmentCLV(clvRes.data as any);
      setLoading(false);
    }
    load();
  }, []);

  const newCount = typeof kpi?.newCustomers === 'object'
    ? kpi.newCustomers.count : (kpi?.newCustomers ?? 0);
  const newDelta = typeof kpi?.newCustomers === 'object'
    ? kpi.newCustomers.changeRate : undefined;

  const gradeData = (kpi?.gradeDistribution || []).map((g: any) => ({
    name: GRADE_LABELS[g.grade] || g.grade,
    value: g.count,
    color: GRADE_COLORS[g.grade] || '#888',
  }));

  if (loading) {
    return (
      <div className="mb-4 rounded-lg border bg-card px-4 py-3 animate-pulse">
        <div className="h-5 w-64 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      {/* 한 줄 요약 바 */}
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
        <div className="flex items-center gap-5 text-sm overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            <Users className="h-3.5 w-3.5" />
            신규
            <span className="font-semibold text-foreground">{newCount}</span>
            {newDelta != null && (
              <span className={`text-xs ${newDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {newDelta >= 0 ? '+' : ''}{newDelta}%
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            <TrendingUp className="h-3.5 w-3.5" />
            활성 거래
            <span className="font-semibold text-foreground">{kpi?.activeDeals ?? 0}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
            미수금
            <span className="font-semibold text-foreground">₩{(kpi?.outstandingAmount ?? 0).toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            <DollarSign className="h-3.5 w-3.5" />
            등급
            <span className="font-semibold text-foreground">{gradeData.length}개</span>
          </span>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-7 px-2 shrink-0 ml-2"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* 접이식 차트 패널 */}
      {expanded && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 등급 분포 도넛 */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs">등급별 분포</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={gradeData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2}
                  >
                    {gradeData.map((d: any, i: number) => (
                      <Cell
                        key={i} fill={d.color} className="cursor-pointer"
                        onClick={() => onFilterByGrade?.(Object.keys(GRADE_LABELS)[i])}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 전환 퍼널 */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs">전환 퍼널</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={funnel} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnel.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 이탈률 추이 */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs">이탈률 추이</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={churnTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 세그먼트별 CLV */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs">세그먼트별 CLV</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={segmentCLV} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="segment" width={65} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => `₩${v.toLocaleString()}`} />
                  <Bar dataKey="clv" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
