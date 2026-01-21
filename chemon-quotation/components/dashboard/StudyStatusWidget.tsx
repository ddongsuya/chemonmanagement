'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Loader2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getStudyOverview, getDelayedStudies } from '@/lib/study-dashboard-api';
import Link from 'next/link';

interface StudySummary {
  total: number;
  byStatus: Record<string, number>;
  inProgress: number;
  delayed: number;
  completedThisMonth: number;
}

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: '접수',
  PREPARING: '준비중',
  IN_PROGRESS: '진행중',
  ANALYSIS: '분석중',
  REPORT_DRAFT: '보고서 작성',
  REPORT_REVIEW: '보고서 검토',
  COMPLETED: '완료',
  SUSPENDED: '중단',
};

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: 'bg-slate-100 text-slate-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
  ANALYSIS: 'bg-purple-100 text-purple-700',
  REPORT_DRAFT: 'bg-amber-100 text-amber-700',
  REPORT_REVIEW: 'bg-pink-100 text-pink-700',
  COMPLETED: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export default function StudyStatusWidget() {
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getStudyOverview();
        if (response) {
          setSummary(response.summary);
        }
      } catch (error) {
        console.error('Failed to load study overview:', error);
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

  if (!summary) {
    return (
      <Card className="border-0 shadow-soft h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-slate-400">데이터를 불러올 수 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-soft h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">시험 현황</CardTitle>
              <p className="text-sm text-slate-500">전체 {summary.total}건</p>
            </div>
          </div>
          <Link href="/studies" className="text-sm text-blue-500 hover:text-blue-600">
            전체보기
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* 주요 지표 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-center">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-600">{summary.inProgress}</p>
            <p className="text-xs text-slate-500">진행중</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-600">{summary.delayed}</p>
            <p className="text-xs text-slate-500">지연</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-600">{summary.completedThisMonth}</p>
            <p className="text-xs text-slate-500">이번달 완료</p>
          </div>
        </div>

        {/* 상태별 분포 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 mb-2">상태별 현황</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byStatus)
              .filter(([_, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <Badge
                  key={status}
                  variant="secondary"
                  className={`${STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'} rounded-lg`}
                >
                  {STATUS_LABELS[status] || status} {count}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
