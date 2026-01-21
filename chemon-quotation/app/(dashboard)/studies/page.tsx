'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FlaskConical,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  getStudyOverview,
  getStudyWorkload,
  getDelayedStudies,
  getReportStatus,
  getStudyCalendar,
  STUDY_STATUS_LABELS,
  STUDY_STATUS_COLORS,
  type StudyOverview,
  type StudyWorkload,
  type DelayedStudiesResponse,
  type ReportStatusResponse,
  type StudyCalendarEvent,
} from '@/lib/study-dashboard-api';

export default function StudiesPage() {
  const [overview, setOverview] = useState<StudyOverview | null>(null);
  const [workload, setWorkload] = useState<StudyWorkload | null>(null);
  const [delayedStudies, setDelayedStudies] = useState<DelayedStudiesResponse | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportStatusResponse | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<StudyCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const [overviewData, workloadData, delayedData, reportData, calendarData] = await Promise.all([
        getStudyOverview().catch(() => null),
        getStudyWorkload().catch(() => null),
        getDelayedStudies(7).catch(() => null),
        getReportStatus().catch(() => null),
        getStudyCalendar(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        ).catch(() => []),
      ]);

      setOverview(overviewData);
      setWorkload(workloadData);
      setDelayedStudies(delayedData);
      setReportStatus(reportData);
      setCalendarEvents(calendarData);
    } catch (error) {
      console.error('Failed to load study dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  };

  // 가동률 게이지 색상
  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-500';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            시험 대시보드
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            진행중인 시험 현황을 한눈에 확인하세요
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">전체 시험</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {overview?.summary.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">진행중</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {overview?.summary.inProgress || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">지연</p>
                <p className="text-2xl font-bold text-red-500">
                  {overview?.summary.delayed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">이번달 완료</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {overview?.summary.completedThisMonth || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 가동률 게이지 */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              연구소 가동률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(workload?.utilizationRate || 0) * 2.51} 251`}
                    className={getUtilizationColor(workload?.utilizationRate || 0)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${getUtilizationColor(workload?.utilizationRate || 0)}`}>
                    {workload?.utilizationRate || 0}%
                  </span>
                  <span className="text-sm text-slate-500">가동률</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500">현재 작업량</p>
                  <p className="text-xl font-semibold">{workload?.currentWorkload || 0}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500">최대 용량</p>
                  <p className="text-xl font-semibold">{workload?.capacity || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 지연 시험 목록 */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              지연 시험 ({delayedStudies?.summary.totalDelayed || 0}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {delayedStudies?.studies && delayedStudies.studies.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {delayedStudies.studies.slice(0, 5).map((study) => (
                  <div
                    key={study.id}
                    className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {study.studyNumber}
                        </p>
                        <p className="text-sm text-slate-500">{study.testName}</p>
                        <p className="text-xs text-slate-400 mt-1">{study.customerName}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        +{study.delayDays}일
                      </Badge>
                    </div>
                    {study.delayReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        사유: {study.delayReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>지연된 시험이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 보고서 현황 & 캘린더 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 보고서 현황 */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              보고서 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {reportStatus?.summary.draftInProgress || 0}
                </p>
                <p className="text-sm text-slate-500">작성중</p>
              </div>
              <div className="p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-pink-600">
                  {reportStatus?.summary.reviewInProgress || 0}
                </p>
                <p className="text-sm text-slate-500">검토중</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {reportStatus?.summary.completedThisMonth || 0}
                </p>
                <p className="text-sm text-slate-500">이번달 완료</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {reportStatus?.summary.expectedThisMonth || 0}
                </p>
                <p className="text-sm text-slate-500">이번달 예정</p>
              </div>
            </div>

            {/* 타임라인 */}
            {reportStatus?.timeline && reportStatus.timeline.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {reportStatus.timeline.slice(0, 5).map((item) => (
                  <div
                    key={item.studyId}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.studyNumber}</p>
                      <p className="text-xs text-slate-500">{item.testName}</p>
                    </div>
                    <Badge
                      variant={
                        item.status === 'COMPLETED'
                          ? 'default'
                          : item.status === 'REVIEW'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {item.status === 'COMPLETED'
                        ? '완료'
                        : item.status === 'REVIEW'
                        ? '검토중'
                        : item.status === 'DRAFT'
                        ? '작성중'
                        : '대기'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 시험 캘린더 */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                시험 일정
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {formatMonth(currentMonth)}
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {calendarEvents.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {calendarEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-slate-500">
                        {event.studyNumber} - {event.testName}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(event.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>이번 달 일정이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 상태별 분포 */}
      {overview?.summary.byStatus && Object.keys(overview.summary.byStatus).length > 0 && (
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">상태별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(overview.summary.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: `${STUDY_STATUS_COLORS[status as keyof typeof STUDY_STATUS_COLORS]}20`,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: STUDY_STATUS_COLORS[status as keyof typeof STUDY_STATUS_COLORS],
                    }}
                  />
                  <span className="text-sm font-medium">
                    {STUDY_STATUS_LABELS[status as keyof typeof STUDY_STATUS_LABELS] || status}
                  </span>
                  <span className="text-sm text-slate-500">({count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
