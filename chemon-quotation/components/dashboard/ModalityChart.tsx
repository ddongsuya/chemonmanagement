'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Sector, Tooltip } from 'recharts';
import { ArrowRight, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getQuotations } from '@/lib/data-api';

interface ModalityData {
  name: string;
  fullName: string;
  value: number;
  amount: number;
  color: string;
}

const MODALITY_COLORS: Record<string, string> = {
  '저분자': '#3b82f6',
  '저분자화합물': '#3b82f6',
  '세포치료제': '#ec4899',
  '화장품': '#f59e0b',
  '의료기기': '#10b981',
  '바이오의약품': '#8b5cf6',
  '천연물': '#06b6d4',
  '기타': '#6b7280',
};

const DEFAULT_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#6b7280'];

// 활성 섹터 렌더러
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        strokeWidth={2}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={4} fill={fill} />
      <text
        x={ex + (cos >= 0 ? 8 : -8)}
        y={ey - 8}
        textAnchor={textAnchor}
        fill="#1e293b"
        fontSize={13}
        fontWeight={600}
      >
        {payload.name}
      </text>
      <text
        x={ex + (cos >= 0 ? 8 : -8)}
        y={ey + 10}
        textAnchor={textAnchor}
        fill="#64748b"
        fontSize={11}
      >
        {`${(percent * 100).toFixed(0)}% · ${value}건`}
      </text>
    </g>
  );
};

export default function ModalityChart() {
  const router = useRouter();
  const [data, setData] = useState<ModalityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModality, setSelectedModality] = useState<ModalityData | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getQuotations({ limit: 500 });
        if (response.success && response.data) {
          // 모달리티별 집계
          const modalityMap: Record<string, { count: number; amount: number }> = {};
          
          const quotationData = response.data.data || [];
          quotationData.forEach((q: any) => {
            const modality = q.modality || '기타';
            if (!modalityMap[modality]) {
              modalityMap[modality] = { count: 0, amount: 0 };
            }
            modalityMap[modality].count += 1;
            modalityMap[modality].amount += Number(q.totalAmount) || 0;
          });

          const chartData = Object.entries(modalityMap)
            .map(([name, stats], index) => ({
              name: name.length > 6 ? name.slice(0, 6) : name,
              fullName: name,
              value: stats.count,
              amount: stats.amount,
              color: MODALITY_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

          setData(chartData);
        }
      } catch (error) {
        console.error('Failed to load modality data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 자동 순환 애니메이션
  useEffect(() => {
    if (!isAutoPlaying || data.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % data.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isAutoPlaying, data.length]);

  const handleClick = (entry: ModalityData) => {
    setSelectedModality(entry);
    setShowDialog(true);
  };

  const handleViewAll = () => {
    if (selectedModality) {
      router.push(
        `/quotations?modality=${encodeURIComponent(selectedModality.fullName)}`
      );
    }
  };

  const onPieEnter = (_: any, index: number) => {
    setIsAutoPlaying(false);
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setIsAutoPlaying(true);
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Card className="border-0 shadow-soft h-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-soft h-full min-h-[400px]">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">모달리티별 분포</CardTitle>
              <p className="text-sm text-slate-500">데이터 없음</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-slate-400">견적 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-soft h-full min-h-[400px]">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">모달리티별 분포</CardTitle>
              <p className="text-sm text-slate-500">총 {total}건</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <PieChart width={360} height={280}>
            <Pie
              data={data}
              cx={180}
              cy={130}
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              paddingAngle={2}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={(_, index) => handleClick(data[index])}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                  opacity={index === activeIndex ? 1 : 0.7}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value}건`, '견적 수']}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            />
          </PieChart>

          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            {data.map((item, index) => (
              <button
                key={item.fullName}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveIndex(index);
                }}
                className="group flex flex-col items-center gap-1"
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeIndex ? 'scale-125' : 'scale-100 opacity-50'
                  }`}
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className={`text-xs transition-all duration-300 ${
                    index === activeIndex
                      ? 'text-slate-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {item.name}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-4">
            차트를 클릭하면 상세 정보를 볼 수 있습니다
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedModality?.color }}
              />
              {selectedModality?.fullName} 견적 현황
            </DialogTitle>
          </DialogHeader>
          {selectedModality && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-sm text-slate-500">견적 건수</p>
                  <p className="text-2xl font-bold">
                    {selectedModality.value}건
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-sm text-slate-500">총 견적 금액</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatCurrency(selectedModality.amount)}
                  </p>
                </div>
              </div>

              <Button onClick={handleViewAll} className="w-full rounded-xl">
                전체 목록 보기 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
