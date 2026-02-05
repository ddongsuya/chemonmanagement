'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
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
  DRAFT: '#9ca3af',
  SENT: '#3b82f6',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  EXPIRED: '#f59e0b',
};

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    const loadQuotations = async () => {
      setLoading(true);
      try {
        // 모든 견적서 가져오기 (최대 1000개)
        const response = await getQuotations({ limit: 1000 });
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
  }, []);

  // 연도별 필터링
  const filteredQuotations = useMemo(() => {
    if (!quotations || quotations.length === 0) return [];
    return quotations.filter(q => q.createdAt.startsWith(year));
  }, [quotations, year]);

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
      '작성중': '#9ca3af',
      '제출': '#3b82f6',
      '수주': '#10b981',
      '실주': '#ef4444',
      '만료': '#f59e0b',
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
      <PageHeader
        title="리포트"
        description="견적 및 수주 통계를 분석합니다"
        actions={
          <Button onClick={handleExportExcel} disabled={!hasData}>
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
        }
      />

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">연도:</span>
            </div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026년</SelectItem>
                <SelectItem value="2025">2025년</SelectItem>
                <SelectItem value="2024">2024년</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">
              총 {quotations?.length || 0}건의 견적 데이터
            </span>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500">데이터를 불러오는 중...</p>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">견적 데이터가 없습니다</h3>
            <p className="text-gray-500">견적서를 작성하면 통계가 표시됩니다.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">총 견적</p>
                <p className="text-2xl font-bold text-blue-600">{summary.total}건</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">수주</p>
                <p className="text-2xl font-bold text-green-600">{summary.won}건</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">수주율</p>
                <p className="text-2xl font-bold text-primary">{summary.winRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">총 견적금액</p>
                <p className="text-xl font-bold">
                  {summary.totalAmount >= 100000000 
                    ? `${(summary.totalAmount / 100000000).toFixed(1)}억`
                    : `${(summary.totalAmount / 10000).toFixed(0)}만`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">수주금액</p>
                <p className="text-xl font-bold text-green-600">
                  {summary.wonAmount >= 100000000 
                    ? `${(summary.wonAmount / 100000000).toFixed(1)}억`
                    : `${(summary.wonAmount / 10000).toFixed(0)}만`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">평균 견적금액</p>
                <p className="text-xl font-bold">
                  {summary.avgAmount >= 100000000 
                    ? `${(summary.avgAmount / 100000000).toFixed(1)}억`
                    : `${(summary.avgAmount / 10000).toFixed(0)}만`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 월별 견적/수주 추이 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">월별 견적/수주 건수</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="견적수" fill="#3b82f6" name="견적" />
                    <Bar dataKey="수주수" fill="#10b981" name="수주" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 상태별 분포 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">상태별 분포</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <Tooltip formatter={(value: number) => [`${value}건`, '건수']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    데이터가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 유형별 통계 */}
          {typeData.some(t => t.견적 > 0) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">유형별 견적/수주</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={typeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={80}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="견적" fill="#3b82f6" />
                    <Bar dataKey="수주" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 고객사별 순위 */}
          {customerData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  고객사별 견적 순위 (Top 5)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">순위</TableHead>
                      <TableHead>고객사</TableHead>
                      <TableHead className="text-center">견적 건수</TableHead>
                      <TableHead className="text-right">견적 금액</TableHead>
                      <TableHead className="text-center">수주율</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerData.map((customer) => (
                      <TableRow key={customer.name}>
                        <TableCell>
                          <Badge
                            variant={customer.rank <= 3 ? 'default' : 'outline'}
                            className={
                              customer.rank === 1
                                ? 'bg-yellow-500'
                                : customer.rank === 2
                                ? 'bg-gray-400'
                                : customer.rank === 3
                                ? 'bg-amber-600'
                                : ''
                            }
                          >
                            {customer.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-center">{customer.quotations}건</TableCell>
                        <TableCell className="text-right">{formatCurrency(customer.amount)}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              customer.winRate >= 70
                                ? 'text-green-600'
                                : customer.winRate >= 50
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }
                          >
                            {customer.winRate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
