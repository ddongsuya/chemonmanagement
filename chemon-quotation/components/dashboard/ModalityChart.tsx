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
import { ArrowRight, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const data = [
  {
    name: '저분자',
    fullName: '저분자화합물',
    value: 45,
    amount: 1250000000,
    color: '#3b82f6',
  },
  {
    name: '세포치료제',
    fullName: '세포치료제',
    value: 20,
    amount: 580000000,
    color: '#ec4899',
  },
  {
    name: '화장품',
    fullName: '화장품',
    value: 15,
    amount: 320000000,
    color: '#f59e0b',
  },
  {
    name: '의료기기',
    fullName: '의료기기',
    value: 12,
    amount: 280000000,
    color: '#10b981',
  },
  {
    name: '기타',
    fullName: '기타',
    value: 8,
    amount: 150000000,
    color: '#8b5cf6',
  },
];

// 활성 섹터 렌더러 - 라벨 라인 포함
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
      {/* 확대된 섹터 */}
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
      {/* 연결선 */}
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        strokeWidth={2}
        fill="none"
      />
      {/* 끝점 원 */}
      <circle cx={ex} cy={ey} r={4} fill={fill} />
      {/* 라벨 */}
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
  const [selectedModality, setSelectedModality] = useState<(typeof data)[0] | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 자동 순환 애니메이션
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % data.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleClick = (entry: (typeof data)[0]) => {
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
          {/* 차트 */}
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

          {/* 하단 인디케이터 */}
          <div className="flex gap-2 mt-2">
            {data.map((item, index) => (
              <button
                key={item.name}
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

      {/* 상세 Dialog */}
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

              <div className="space-y-2">
                <p className="text-sm font-medium">최근 견적</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm font-medium">Q-2025-042</span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                    >
                      제출완료
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm font-medium">Q-2025-038</span>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                    >
                      수주
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm font-medium">Q-2025-035</span>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                    >
                      수주
                    </Badge>
                  </div>
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
