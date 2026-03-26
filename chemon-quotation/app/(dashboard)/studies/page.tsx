'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
} from '@/components/ui/StitchTable';
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
  ClipboardList,
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
    REGISTERED: 'bg-slate-100 text-slate-600',
    PREPARING: 'bg-blue-50 text-blue-600',
    IN_PROGRESS: 'bg-emerald-50 text-emerald-600',
    ON_HOLD: 'bg-amber-50 text-amber-600',
    ANALYSIS: 'bg-violet-50 text-violet-600',
    REPORT_DRAFT: 'bg-amber-50 text-amber-600',
    REPORT_REVIEW: 'bg-pink-50 text-pink-600',
    COMPLETED: 'bg-emerald-50 text-emerald-600',
    SUSPENDED: 'bg-red-50 text-red-600',
  };
  return map[status] || '';
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function getStudyCustomerName(study: Study): string {
  if (study.contract?.customer?.company) return study.contract.customer.company;
  if (study.contract?.customer?.name) return study.contract.customer.name;
  if (study.testReception?.customer?.company) return study.testReception.customer.company;
  if (study.testReception?.customer?.name) return study.testReception.customer.name;
  return '-';
}

function getStudyCustomerId(study: Study): string | null {
  if (study.contract?.customer?.id) return study.contract.customer.id;
  if (study.testReception?.customer?.id) return study.testReception.customer.id;
  return null;
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
      <StitchPageHeader
        label="STUDIES"
        title="시험 관리"
        description="시험 진행 현황 및 관리"
      />

      {/* 탭 */}
      <div className="flex gap-1 bg-[#FAF2E9] rounded-xl p-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors duration-150 ${
            activeTab === 'list'
              ? 'bg-white text-primary shadow-ambient'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          시험 목록
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors duration-150 ${
            activeTab === 'dashboard'
              ? 'bg-white text-primary shadow-ambient'
              : 'text-slate-500 hover:text-slate-700'
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
  const testReceptionCount = studies.filter(s => (s as any)._isTestReception).length;

  return (
    <>
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">전체</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <FlaskConical className="w-7 h-7 text-slate-400" />
          </div>
        </StitchCard>
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">진행중</p>
              <p className="text-2xl font-bold text-emerald-600">{inProgress}</p>
            </div>
            <TrendingUp className="w-7 h-7 text-emerald-400" />
          </div>
        </StitchCard>
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">완료</p>
              <p className="text-2xl font-bold text-blue-600">{completed}</p>
            </div>
            <CheckCircle2 className="w-7 h-7 text-blue-400" />
          </div>
        </StitchCard>
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시험접수</p>
              <p className="text-2xl font-bold text-amber-600">{testReceptionCount}</p>
            </div>
            <ClipboardList className="w-7 h-7 text-amber-400" />
          </div>
        </StitchCard>
      </div>

      {/* 필터 */}
      <StitchCard variant="surface-low">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  placeholder="시험번호, 시험명 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  className="w-full bg-white border-none rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px] bg-white border-none rounded-xl">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{STUDY_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onSearch} className="flex-shrink-0 bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold">검색</Button>
            </div>
          </div>
      </StitchCard>

      {/* 시험 목록 */}
      <StitchCard variant="surface-low" padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            시험 목록 {pagination ? `(${pagination.total}건)` : ''}
          </h2>
        </div>
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">로딩 중...</div>
          ) : studies.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">등록된 시험이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 모바일: 카드 */}
              <div className="md:hidden space-y-3">
                {studies.map((study) => {
                  const isTR = !!(study as any)._isTestReception;
                  const customerId = getStudyCustomerId(study);
                  const handleClick = () => {
                    if (isTR && customerId) {
                      router.push(`/customers/${customerId}`);
                    } else if (!isTR) {
                      router.push(`/studies/${study.id}`);
                    }
                  };
                  return (
                    <StitchCard
                      key={study.id}
                      variant="elevated"
                      hover
                      padding="sm"
                      onClick={handleClick}
                    >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">{study.studyNumber}</span>
                            {isTR && (
                              <StitchBadge variant="warning">
                                시험접수
                              </StitchBadge>
                            )}
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadgeClass(study.status)}`}>
                            {STUDY_STATUS_LABELS[study.status]}
                          </span>
                        </div>
                        <div className="font-bold text-sm mb-1 truncate">{study.testName}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{getStudyCustomerName(study)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{formatDate(study.startDate || study.receivedDate)}</span>
                          <span className="font-mono">{study.contract?.contractNumber || '-'}</span>
                        </div>
                    </StitchCard>
                  );
                })}
              </div>

              {/* 데스크톱: 테이블 */}
              <div className="hidden md:block">
                <StitchTable>
                  <StitchTableHeader>
                    <StitchTableRow>
                      <StitchTableHead>구분</StitchTableHead>
                      <StitchTableHead>시험번호</StitchTableHead>
                      <StitchTableHead>시험명</StitchTableHead>
                      <StitchTableHead>고객사</StitchTableHead>
                      <StitchTableHead>계약번호</StitchTableHead>
                      <StitchTableHead>상태</StitchTableHead>
                      <StitchTableHead>시작일</StitchTableHead>
                      <StitchTableHead>예상종료일</StitchTableHead>
                    </StitchTableRow>
                  </StitchTableHeader>
                  <StitchTableBody>
                    {studies.map((study) => {
                      const isTR = !!(study as any)._isTestReception;
                      const customerId = getStudyCustomerId(study);
                      const handleClick = () => {
                        if (isTR && customerId) {
                          router.push(`/customers/${customerId}`);
                        } else if (!isTR) {
                          router.push(`/studies/${study.id}`);
                        }
                      };
                      return (
                        <StitchTableRow
                          key={study.id}
                          className="cursor-pointer"
                          onClick={handleClick}
                        >
                          <StitchTableCell>
                            {isTR ? (
                              <StitchBadge variant="warning">
                                시험접수
                              </StitchBadge>
                            ) : (
                              <StitchBadge variant="neutral">
                                시험
                              </StitchBadge>
                            )}
                          </StitchTableCell>
                          <StitchTableCell className="font-mono text-sm">{study.studyNumber}</StitchTableCell>
                          <StitchTableCell className="font-bold">{study.testName}</StitchTableCell>
                          <StitchTableCell>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]">
                                {getStudyCustomerName(study)}
                              </span>
                            </div>
                          </StitchTableCell>
                          <StitchTableCell className="font-mono text-xs text-slate-500">
                            {study.contract?.contractNumber || '-'}
                          </StitchTableCell>
                          <StitchTableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadgeClass(study.status)}`}>
                              {STUDY_STATUS_LABELS[study.status]}
                            </span>
                          </StitchTableCell>
                          <StitchTableCell className="text-sm text-slate-500">
                            {formatDate(study.startDate || study.receivedDate)}
                          </StitchTableCell>
                          <StitchTableCell className="text-sm text-slate-500">
                            {formatDate(study.expectedEndDate)}
                          </StitchTableCell>
                        </StitchTableRow>
                      );
                    })}
                  </StitchTableBody>
                </StitchTable>
              </div>

              {/* 페이지네이션 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4">
                  <p className="text-sm text-slate-500">
                    {pagination.total}건 중 {(page - 1) * pagination.limit + 1}-
                    {Math.min(page * pagination.limit, pagination.total)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="rounded-xl border-none bg-white"
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
                      className="rounded-xl border-none bg-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
      </StitchCard>
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
        <StitchCard variant="surface-low">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">전체 시험</p>
                <p className="text-xl font-bold">{overview?.summary.total || 0}</p>
              </div>
            </div>
        </StitchCard>
        <StitchCard variant="surface-low">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">진행중</p>
                <p className="text-xl font-bold">{overview?.summary.inProgress || 0}</p>
              </div>
            </div>
        </StitchCard>
        <StitchCard variant="surface-low">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">지연</p>
                <p className="text-xl font-bold text-red-500">{overview?.summary.delayed || 0}</p>
              </div>
            </div>
        </StitchCard>
        <StitchCard variant="surface-low">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이번달 완료</p>
                <p className="text-xl font-bold">{overview?.summary.completedThisMonth || 0}</p>
              </div>
            </div>
        </StitchCard>
      </div>

      {/* 가동률 + 지연 시험 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StitchCard variant="surface-low" padding="lg">
          <div className="mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              연구소 가동률
            </h3>
          </div>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-slate-200" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(workload?.utilizationRate || 0) * 2.51} 251`}
                    className={getUtilizationColor(workload?.utilizationRate || 0)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getUtilizationColor(workload?.utilizationRate || 0)}`}>
                    {workload?.utilizationRate || 0}%
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">가동률</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                <div className="text-center p-2.5 bg-[#F5EDE3] rounded-xl">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">현재 작업량</p>
                  <p className="text-lg font-bold">{workload?.currentWorkload || 0}</p>
                </div>
                <div className="text-center p-2.5 bg-[#F5EDE3] rounded-xl">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">최대 용량</p>
                  <p className="text-lg font-bold">{workload?.capacity || 0}</p>
                </div>
              </div>
            </div>
        </StitchCard>

        <StitchCard variant="surface-low" padding="lg">
          <div className="mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              지연 시험 ({delayedStudies?.summary.totalDelayed || 0}건)
            </h3>
          </div>
            {delayedStudies?.studies && delayedStudies.studies.length > 0 ? (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
                {delayedStudies.studies.slice(0, 5).map((study) => (
                  <div key={study.id}
                    className="p-3 bg-red-50 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm">{study.studyNumber}</p>
                        <p className="text-xs text-slate-500">{study.testName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{study.customerName}</p>
                      </div>
                      <StitchBadge variant="error">+{study.delayDays}일</StitchBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="text-sm">지연된 시험이 없습니다</p>
              </div>
            )}
        </StitchCard>
      </div>

      {/* 보고서 현황 + 캘린더 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StitchCard variant="surface-low" padding="lg">
          <div className="mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              보고서 현황
            </h3>
          </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-center">
                <p className="text-xl font-bold text-amber-600">{reportStatus?.summary.draftInProgress || 0}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">작성중</p>
              </div>
              <div className="p-2.5 bg-pink-50 rounded-xl text-center">
                <p className="text-xl font-bold text-pink-600">{reportStatus?.summary.reviewInProgress || 0}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">검토중</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl text-center">
                <p className="text-xl font-bold text-emerald-600">{reportStatus?.summary.completedThisMonth || 0}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이번달 완료</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl text-center">
                <p className="text-xl font-bold text-blue-600">{reportStatus?.summary.expectedThisMonth || 0}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이번달 예정</p>
              </div>
            </div>
            {reportStatus?.timeline && reportStatus.timeline.length > 0 && (
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {reportStatus.timeline.slice(0, 5).map((item) => (
                  <div key={item.studyId}
                    className="flex items-center justify-between p-2 bg-[#F5EDE3] rounded-xl">
                    <div>
                      <p className="text-sm font-bold">{item.studyNumber}</p>
                      <p className="text-xs text-slate-500">{item.testName}</p>
                    </div>
                    <StitchBadge
                      variant={item.status === 'COMPLETED' ? 'success' : item.status === 'REVIEW' ? 'info' : 'neutral'}
                    >
                      {item.status === 'COMPLETED' ? '완료' : item.status === 'REVIEW' ? '검토중' : item.status === 'DRAFT' ? '작성중' : '대기'}
                    </StitchBadge>
                  </div>
                ))}
              </div>
            )}
        </StitchCard>

        <StitchCard variant="surface-low" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              시험 일정
            </h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-bold min-w-[90px] text-center">{formatMonth(currentMonth)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
          </div>
            {calendarEvents.length > 0 ? (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {calendarEvents.map((event) => (
                  <div key={event.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF8F1] transition-colors duration-150">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{event.title}</p>
                      <p className="text-xs text-slate-500">{event.studyNumber} - {event.testName}</p>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {new Date(event.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">이번 달 일정이 없습니다</p>
              </div>
            )}
        </StitchCard>
      </div>

      {/* 상태별 분포 */}
      {overview?.summary.byStatus && Object.keys(overview.summary.byStatus).length > 0 && (
        <StitchCard variant="surface-low" padding="lg">
          <div className="mb-4">
            <h3 className="text-base font-bold">상태별 분포</h3>
          </div>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(overview.summary.byStatus).map(([status, count]) => (
                <div key={status}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white">
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STUDY_STATUS_COLORS[status as StudyStatus] }} />
                  <span className="text-sm">
                    {STUDY_STATUS_LABELS[status as StudyStatus] || status}
                  </span>
                  <span className="text-sm text-slate-500">({count})</span>
                </div>
              ))}
            </div>
        </StitchCard>
      )}
    </div>
  );
}
