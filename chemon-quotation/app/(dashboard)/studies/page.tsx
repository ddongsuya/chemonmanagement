'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Search,
  FlaskConical,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { getStudies, Study, StudyListResponse } from '@/lib/study-api';
import {
  StudyStatus,
  STUDY_STATUS_LABELS,
  STUDY_STATUS_COLORS,
  getStudyOverview,
  getStudyWorkload,
  getDelayedStudies,
  getReportStatus,
  getStudyCalendar,
  StudyOverview,
  StudyWorkload,
  DelayedStudiesResponse,
  ReportStatusResponse,
  StudyCalendarEvent,
} from '@/lib/study-dashboard-api';
import { useToast } from '@/hooks/use-toast';

const statusOptions: StudyStatus[] = [
  'REGISTERED', 'PREPARING', 'IN_PROGRESS', 'ANALYSIS',
  'REPORT_DRAFT', 'REPORT_REVIEW', 'COMPLETED', 'SUSPENDED',
];

function getStatusBadgeClass(status: StudyStatus): string {
  const map: Record<StudyStatus, string> = {
    REGISTERED: 'border-gray-300 text-gray-600',
    PREPARING: 'border-blue-300 text-blue-600',
    IN_PROGRESS: 'border-green-300 text-green-600',
    ANALYSIS: 'border-purple-300 text-purple-600',
    REPORT_DRAFT: 'border-amber-300 text-amber-600',
    REPORT_REVIEW: 'border-pink-300 text-pink-600',
    COMPLETED: 'border-emerald-300 text-emerald-600',
    SUSPENDED: 'border-red-300 text-red-600',
  };
  return map[status] || '';
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function StudiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('list');

  // List state
  const [data, setData] = useState<StudyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Dashboard state
  const [overview, setOverview] = useState<StudyOverview | null>(null);
  const [workload, setWorkload] = useState<StudyWorkload | null>(null);
  const [delayedStudies, setDelayedStudies] = useState<DelayedStudiesResponse | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportStatusResponse | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<StudyCalendarEvent[]>([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getStudies({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit: 20,
      });
      setData(result);
    } catch {
      toast({ title: '오류', description: '시험 목록을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, toast]);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const [o, w, d, r, c] = await Promise.all([
        getStudyOverview().catch(() => null),
        getStudyWorkload().catch(() => null),
        getDelayedStudies(7).catch(() => null),
        getReportStatus().catch(() => null),
        getStudyCalendar(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        ).catch(() => []),
      ]);
      setOverview(o);
      setWorkload(w);
      setDelayedStudies(d);
      setReportStatus(r);
      setCalendarEvents(c);
    } catch {
      // silent
    } finally {
      setDashLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    if (activeTab === 'list') loadList();
  }, [activeTab, loadList]);

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
  }, [activeTab, loadDashboard]);

  const handleSearch = () => {
    setPage(1);
    loadList();
  };

  const studies = data?.studies || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">시험 관리</h1>
          <p className="text-sm text-muted-foreground">시험 진행 현황 및 관리</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 ${
            activeTab === 'list'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          시험 목록
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 ${
            activeTab === 'dashboard'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          대시보드
        </button>
      </div>

      {activeTab === 'list' ? (
        <StudyListView
          studies={studies}
          pagination={pagination}
          loading={loading}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          page={page}
          setPage={setPage}
          onSearch={handleSearch}
          router={router}
        />
      ) : (
        <StudyDashboardView
          overview={overview}
          workload={workload}
          delayedStudies={delayedStudies}
          reportStatus={reportStatus}
          calendarEvents={calendarEvents}
          loading={dashLoading}
          currentMonth={currentMonth}
          onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          onRefresh={loadDashboard}
        />
      )}
    </div>
  );
}

// ─── List View ───
interface StudyListViewProps {
  studies: Study[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  onSearch: () => void;
  router: ReturnType<typeof useRouter>;
}

function StudyListView({
  studies, pagination, loading, search, setSearch,
  statusFilter, setStatusFilter, page, setPage, onSearch, router,
}: StudyListViewProps) {
  // Summary counts from current data
  const total = pagination?.total || 0;
  const inProgress = studies.filter(s => s.status === 'IN_PROGRESS').length;
  const completed = studies.filter(s => s.status === 'COMPLETED').length;

  return (
    <>
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체</p>
                <p className="text-2xl font-semibold">{total}</p>
              </div>
              <FlaskConical className="w-7 h-7 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">진행중</p>
                <p className="text-2xl font-semibold text-green-600">{inProgress}</p>
              </div>
              <TrendingUp className="w-7 h-7 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-semibold text-blue-600">{completed}</p>
              </div>
              <CheckCircle2 className="w-7 h-7 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="border shadow-sm">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="시험번호, 시험명 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{STUDY_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onSearch} className="flex-shrink-0">검색</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 시험 목록 */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">
            시험 목록 {pagination ? `(${pagination.total}건)` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">로딩 중...</div>
          ) : studies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">등록된 시험이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 모바일: 카드 */}
              <div className="md:hidden space-y-3">
                {studies.map((study) => (
                  <Card
                    key={study.id}
                    className="border cursor-pointer active:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/studies/${study.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{study.studyNumber}</span>
                        <Badge variant="outline" className={getStatusBadgeClass(study.status)}>
                          {STUDY_STATUS_LABELS[study.status]}
                        </Badge>
                      </div>
                      <div className="font-medium text-sm mb-1 truncate">{study.testName}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {study.contract?.customer?.company || study.contract?.customer?.name || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(study.startDate || study.receivedDate)}</span>
                        <span className="font-mono">{study.contract?.contractNumber || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 데스크톱: 테이블 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시험번호</TableHead>
                      <TableHead>시험명</TableHead>
                      <TableHead>고객사</TableHead>
                      <TableHead>계약번호</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>시작일</TableHead>
                      <TableHead>예상종료일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studies.map((study) => (
                      <TableRow
                        key={study.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/studies/${study.id}`)}
                      >
                        <TableCell className="font-mono text-sm">{study.studyNumber}</TableCell>
                        <TableCell className="font-medium">{study.testName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">
                              {study.contract?.customer?.company || study.contract?.customer?.name || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {study.contract?.contractNumber || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeClass(study.status)}>
                            {STUDY_STATUS_LABELS[study.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(study.startDate)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(study.expectedEndDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {pagination.total}건 중 {(page - 1) * pagination.limit + 1}-
                    {Math.min(page * pagination.limit, pagination.total)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-3">
                      {page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Dashboard View ───
interface StudyDashboardViewProps {
  overview: StudyOverview | null;
  workload: StudyWorkload | null;
  delayedStudies: DelayedStudiesResponse | null;
  reportStatus: ReportStatusResponse | null;
  calendarEvents: StudyCalendarEvent[];
  loading: boolean;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onRefresh: () => void;
}

function StudyDashboardView({
  overview, workload, delayedStudies, reportStatus,
  calendarEvents, loading, currentMonth, onPrevMonth, onNextMonth, onRefresh,
}: StudyDashboardViewProps) {
  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-500';
    if (rate >= 70) return 'text-amber-500';
    return 'text-green-500';
  };

  const formatMonth = (date: Date) =>
    date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-muted rounded-lg" />
          <div className="h-72 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          새로고침
        </Button>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">전체 시험</p>
                <p className="text-xl font-semibold">{overview?.summary.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">진행중</p>
                <p className="text-xl font-semibold">{overview?.summary.inProgress || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">지연</p>
                <p className="text-xl font-semibold text-red-500">{overview?.summary.delayed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">이번달 완료</p>
                <p className="text-xl font-semibold">{overview?.summary.completedThisMonth || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 가동률 + 지연 시험 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              연구소 가동률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-muted/30" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(workload?.utilizationRate || 0) * 2.51} 251`}
                    className={getUtilizationColor(workload?.utilizationRate || 0)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-semibold ${getUtilizationColor(workload?.utilizationRate || 0)}`}>
                    {workload?.utilizationRate || 0}%
                  </span>
                  <span className="text-xs text-muted-foreground">가동률</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">현재 작업량</p>
                  <p className="text-lg font-semibold">{workload?.currentWorkload || 0}</p>
                </div>
                <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">최대 용량</p>
                  <p className="text-lg font-semibold">{workload?.capacity || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              지연 시험 ({delayedStudies?.summary.totalDelayed || 0}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {delayedStudies?.studies && delayedStudies.studies.length > 0 ? (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
                {delayedStudies.studies.slice(0, 5).map((study) => (
                  <div key={study.id}
                    className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{study.studyNumber}</p>
                        <p className="text-xs text-muted-foreground">{study.testName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{study.customerName}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">+{study.delayDays}일</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-60" />
                <p className="text-sm">지연된 시험이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 보고서 현황 + 캘린더 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              보고서 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
                <p className="text-xl font-semibold text-amber-600">{reportStatus?.summary.draftInProgress || 0}</p>
                <p className="text-xs text-muted-foreground">작성중</p>
              </div>
              <div className="p-2.5 bg-pink-50 dark:bg-pink-950/20 rounded-lg text-center">
                <p className="text-xl font-semibold text-pink-600">{reportStatus?.summary.reviewInProgress || 0}</p>
                <p className="text-xs text-muted-foreground">검토중</p>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
                <p className="text-xl font-semibold text-emerald-600">{reportStatus?.summary.completedThisMonth || 0}</p>
                <p className="text-xs text-muted-foreground">이번달 완료</p>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                <p className="text-xl font-semibold text-blue-600">{reportStatus?.summary.expectedThisMonth || 0}</p>
                <p className="text-xs text-muted-foreground">이번달 예정</p>
              </div>
            </div>
            {reportStatus?.timeline && reportStatus.timeline.length > 0 && (
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {reportStatus.timeline.slice(0, 5).map((item) => (
                  <div key={item.studyId}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.studyNumber}</p>
                      <p className="text-xs text-muted-foreground">{item.testName}</p>
                    </div>
                    <Badge variant={item.status === 'COMPLETED' ? 'default' : item.status === 'REVIEW' ? 'secondary' : 'outline'}>
                      {item.status === 'COMPLETED' ? '완료' : item.status === 'REVIEW' ? '검토중' : item.status === 'DRAFT' ? '작성중' : '대기'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                시험 일정
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[90px] text-center">{formatMonth(currentMonth)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {calendarEvents.length > 0 ? (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {calendarEvents.map((event) => (
                  <div key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-150">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.studyNumber} - {event.testName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(event.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">이번 달 일정이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 상태별 분포 */}
      {overview?.summary.byStatus && Object.keys(overview.summary.byStatus).length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">상태별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(overview.summary.byStatus).map(([status, count]) => (
                <div key={status}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border">
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STUDY_STATUS_COLORS[status as StudyStatus] }} />
                  <span className="text-sm">
                    {STUDY_STATUS_LABELS[status as StudyStatus] || status}
                  </span>
                  <span className="text-sm text-muted-foreground">({count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
