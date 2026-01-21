'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Loader2, ArrowRight } from 'lucide-react';
import { getConversionAnalytics } from '@/lib/analytics-api';

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
  avgDaysInStage: number;
}

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-blue-400',
  'bg-emerald-400',
  'bg-emerald-500',
];

export default function PipelineFunnel() {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [overallRate, setOverallRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await getConversionAnalytics({
          startDate,
          endDate,
          entityType: 'quotation',
        });

        if (response) {
          setFunnel(response.funnel);
          setOverallRate(response.overallConversionRate);
        }
      } catch (error) {
        console.error('Failed to load funnel data:', error);
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

  const maxCount = Math.max(...funnel.map(s => s.count), 1);

  return (
    <Card className="border-0 shadow-soft h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">파이프라인 현황</CardTitle>
              <p className="text-sm text-slate-500">견적 전환율</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{overallRate}%</p>
            <p className="text-xs text-slate-500">전체 전환율</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnel.map((stage, index) => {
            const width = (stage.count / maxCount) * 100;
            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {stage.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{stage.count}건</span>
                    {index > 0 && (
                      <span className="text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {stage.conversionRate}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${STAGE_COLORS[index % STAGE_COLORS.length]} transition-all duration-500 rounded-lg flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(width, 10)}%` }}
                  >
                    {index < funnel.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-white/70" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {funnel.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            데이터가 없습니다
          </div>
        )}
      </CardContent>
    </Card>
  );
}
