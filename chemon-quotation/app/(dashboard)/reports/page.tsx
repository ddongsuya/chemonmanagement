'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StitchBadge } from '@/components/ui/StitchBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Download,
  TrendingUp,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getQuotations, Quotation } from '@/lib/data-api';
import LostReasonStats from '@/components/analytics/LostReasonStats';
import {
  CHART_PALETTE,
  CHART_TOOLTIP_STYLE,
  CHART_AXIS_STYLE,
  CHART_GRID_STYLE,
} from '@/lib/chart-theme';

// 상태 라벨 매핑
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '제출',
  ACCEPTED: '수주',
  REJECTED: '실주',
  EXPIRED: '만료',
};

// 상태 색상 매핑
const STATUS_COLORS: Record<string, string> = {
  DRAFT: CHART_PALETTE[8],   // neutral
  SENT: CHART_PALETTE[3],    // teal
  ACCEPTED: CHART_PALETTE[6], // success
  REJECTED: CHART_PALETTE[9], // error
  EXPIRED: CHART_PALETTE[1],  // amber gold
};

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로드 (연도별 서버 사이드 필터링)
  useEffect(() => {
    const loadQuotations = async () => {
      setLoading(true);
      try {
        const response = await getQuotations({
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
          limit: 5000,
        });
        if (response.success && response.data) {
          setQuotations(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load quotations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, [year]);

  // 연도별 필터링 (서버에서 이미 필터링됨)
  const filteredQuotations = useMemo(() => {
    if (!quotations || quotations.length === 0) return [];
    return quotations;
  }, [quotations]);

  // 요약 통계 계산
  const summary = useMemo(() => {
    const total = filteredQuotations.length;
    const won = filteredQuotations.filter(q => q.status === 'ACCEPTED').length;
    const lost = filteredQuotations.filter(q => q.status === 'REJECTED').length;
    const totalAmount = filteredQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
    const wonAmount = filteredQuotations
      .filter(q => q.status === 'ACCEPTED')
      .reduce((sum, q) => sum + q.totalAmount, 0);
    const decided = won + lost;
    const winRate = decided > 0 ? (won / decided) * 100 : 0;
    const avgAmount = total > 0 ? totalAmount / total : 0;

    return { total, won, totalAmount, wonAmount, winRate: Math.round(winRate * 10) / 10, avgAmount };
  }, [filteredQuotations]);

  // 월별 데이터 계산
  const monthlyData = useMemo(() => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    
    return months.map((month, index) => {
      const monthStr = `${year}-${String(index + 1).padStart(2, '0')}`;
      const monthQuotations = filteredQuotations.filter(q => q.createdAt.startsWith(monthStr));
      const wonQuotations = monthQuotations.filter(q => q.status === 'ACCEPTED');
      
      return {
        month,
        견적수: monthQuotations.length,
        수주수: wonQuotations.length,
      };
    });
  }, [filteredQuotations, year]);

  // 상태별 분포 계산
  const statusData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    
    filteredQuotations.forEach(q => {
      const label = STATUS_LABELS[q.status] || q.status;
      statusCount[label] = (statusCount[label] || 0) + 1;
    });

    const colorMap: Record<string, string> = {
      '작성중': CHART_PALETTE[8],
      '제출': CHART_PALETTE[3],
      '수주': CHART_PALETTE[6],
      '실주': CHART_PALETTE[9],
      '만료': CHART_PALETTE[1],
    };

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || '#6b7280',
    }));
  }, [filteredQuotations]);

  // 유형별 데이터 계산
  const typeData = useMemo(() => {
    const toxicity = filteredQuotations.filter(q => q.quotationType === 'TOXICITY');
    const efficacy = filteredQuotations.filter(q => q.quotationType === 'EFFICACY');
    
    return [
      { 
        name: '독성시험', 
        견적: toxicity.length, 
        수주: toxicity.filter(q => q.status === 'ACCEPTED').length 
      },
      { 
        name: '효력시험', 
        견적: efficacy.length, 
        수주: efficacy.filter(q => q.status === 'ACCEPTED').length 
      },
    ];
  }, [filteredQuotations]);

  // 고객사별 순위 계산
  const customerData = useMemo(() => {
    const customerStats: Record<string, { quotations: number; amount: number; won: number }> = {};
    
    filteredQuotations.forEach(q => {
      if (!customerStats[q.customerName]) {
        customerStats[q.customerName] = { quotations: 0, amount: 0, won: 0 };
      }
      customerStats[q.customerName].quotations += 1;
      customerStats[q.customerName].amount += q.totalAmount;
      if (q.status === 'ACCEPTED') {
        customerStats[q.customerName].won += 1;
      }
    });

    return Object.entries(customerStats)
      .map(([name, stats]) => ({
        rank: 0,
        name,
        quotations: stats.quotations,
        amount: stats.amount,
        winRate: stats.quotations > 0 ? Math.round((stats.won / stats.quotations) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [filteredQuotations]);

  const handleExportExcel = () => {
    alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
  };

  const hasData = quotations && quotations.length > 0;

  return (
    <div>
      <StitchPageHeader
        label="REPORTS"
        title="리포트"
        description="견적 및 수주 통계를 분석합니다"
        actions={
          <Button
            onClick={handleExportExcel}
            disabled={!hasData}
            className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold"
          >
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
        }
        className="mb-6"
      />

      {/* 필터 */}
      <StitchCard variant="surface-low" padding="md" className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">연도:</span>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28 bg-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026년</SelectItem>
              <SelectItem value="2025">2025년</SelectItem>
              <SelectItem value="2024">2024년</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">
            {year}년 {quotations?.length || 0}건의 견적 데이터
          </span>
        </div>
      </StitchCard>

      {loading ? (
        <StitchCard variant="surface-low" padding="lg">
          <div className="py-10 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-slate-400 animate-spin mb-4" />
            <p className="text-slate-500">데이터를 불러오는 중...</p>
          </div>
        </StitchCard>
      ) : !hasData ? (
        <StitchCard variant="surface-low" padding="lg">
          <div className="py-10 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600 mb-2">견적 데이터가 없습니다</h3>
            <p className="text-slate-500">견적서를 작성하면 통계가 표시됩니다.</p>
          </div>
        </StitchCard>
      ) : (
        <>
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StitchCard variant="elevated" padding="sm">
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">총 견적</p>
                <p className="text-2xl font-black tracking-tighter text-blue-600">{summary.total}건</p>
              </div>
            </StitchCard>
            <StitchCard variant="elevated" padding="sm">
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">수주</p>
                <p className="text-2xl font-black tracking-tighter text-emerald-600">{summary.won}건</p>
              </div>
            </StitchCard>
            <StitchCard variant="elevated" padding="sm">
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">수주율</p>
                <p className="text-2xl font-black tracking-tighter text-primary">{summary.winRate}%</p>
              </div>
            </StitchCard>
            <StitchCard variant="elevated" padding="sm">
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">총 견적금액</p>
                <p className="text-xl font-black tracking-tighter">
                  {summary.totalAmount >= 100000000 
                    ? `${(summary.totalAmount / 100000000).toFixed(1)}억`
                    : `${(summary.totalAmount / 10000).toFixed(0)}만`}
                </p>
              </div>
            </StitchCard>
            <StitchCard variant="elevated" padding="sm">
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">수주금액</p>
                <p className="text-xl font-black tracking-tighter text-emerald-600">
                  {summary.wonAmount >= 100000000 
                    ? `${(summary.wonAmount / 100000000).toFixed(1)}억`
                    : `${(summary.wonAmount / 10000).toFixed(0)}만`}
                </p>
              </div>
            </StitchCard>
            <StitchCard variant="elevated" padding="sm">
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">평균 견적금액</p>
                <p className="text-xl font-black tracking-tighter">
                  {summary.avgAmount >= 100000000 
                    ? `${(summary.avgAmount / 100000000).toFixed(1)}억`
                    : `${(summary.avgAmount / 10000).toFixed(0)}만`}
                </p>
              </div>
            </StitchCard>
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 월별 견적/수주 추이 */}
            <StitchCard variant="surface-low" padding="lg">
              <h3 className="text-lg font-bold mb-4">월별 견적/수주 건수</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid {...CHART_GRID_STYLE} />
                  <XAxis dataKey="month" {...CHART_AXIS_STYLE} />
                  <YAxis {...CHART_AXIS_STYLE} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="견적수" fill={CHART_PALETTE[0]} name="견적" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="수주수" fill={CHART_PALETTE[1]} name="수주" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </StitchCard>

            {/* 상태별 분포 */}
            <StitchCard variant="surface-low" padding="lg">
              <h3 className="text-lg font-bold mb-4">상태별 분포</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value}건`, '건수']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  데이터가 없습니다
                </div>
              )}
            </StitchCard>
          </div>

          {/* 유형별 통계 */}
          {typeData.some(t => t.견적 > 0) && (
            <StitchCard variant="surface-low" padding="lg" className="mb-6">
              <h3 className="text-lg font-bold mb-4">유형별 견적/수주</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid {...CHART_GRID_STYLE} />
                  <XAxis type="number" {...CHART_AXIS_STYLE} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    {...CHART_AXIS_STYLE}
                    width={80}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="견적" fill={CHART_PALETTE[0]} radius={[0, 6, 6, 0]} />
                  <Bar dataKey="수주" fill={CHART_PALETTE[1]} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </StitchCard>
          )}

          {/* 고객사별 순위 */}
          {customerData.length > 0 && (
            <StitchCard variant="surface-low" padding="lg" className="mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                고객사별 견적 순위 (Top 5)
              </h3>
              <div className="bg-[#FAF2E9] rounded-xl md:rounded-[2.5rem] p-4 md:p-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="pb-4 font-bold text-[11px] uppercase tracking-widest w-16">순위</th>
                      <th className="pb-4 font-bold text-[11px] uppercase tracking-widest">고객사</th>
                      <th className="pb-4 font-bold text-[11px] uppercase tracking-widest text-center">견적 건수</th>
                      <th className="pb-4 font-bold text-[11px] uppercase tracking-widest text-right">견적 금액</th>
                      <th className="pb-4 font-bold text-[11px] uppercase tracking-widest text-center">수주율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerData.map((customer) => (
                      <tr key={customer.name} className="group hover:bg-[#FFF8F1] transition-colors">
                        <td className="py-4">
                          <StitchBadge
                            variant={
                              customer.rank === 1
                                ? 'warning'
                                : customer.rank <= 3
                                ? 'neutral'
                                : 'neutral'
                            }
                          >
                            {customer.rank}
                          </StitchBadge>
                        </td>
                        <td className="py-4 font-bold">{customer.name}</td>
                        <td className="py-4 text-center">{customer.quotations}건</td>
                        <td className="py-4 text-right">{formatCurrency(customer.amount)}</td>
                        <td className="py-4 text-center">
                          <span
                            className={
                              customer.winRate >= 70
                                ? 'text-emerald-600 font-bold'
                                : customer.winRate >= 50
                                ? 'text-blue-600 font-bold'
                                : 'text-slate-600'
                            }
                          >
                            {customer.winRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StitchCard>
          )}

          {/* 미진행 사유 통계 */}
          <LostReasonStats
            onPeriodChange={(startDate, endDate) => {
              console.log('Period changed:', startDate, endDate);
              // API 호출로 기간별 데이터 로드
            }}
          />
        </>
      )}
    </div>
  );
}
