'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StitchCard } from '@/components/ui/StitchCard';
import {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
} from '@/components/ui/StitchTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  History, RefreshCw, AlertCircle, ArrowLeft, ChevronLeft, ChevronRight,
  Search, Filter, CheckCircle2, XCircle, Clock, Eye, Zap,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING';

interface AutomationExecution {
  id: string; ruleId: string; triggerData: Record<string, unknown>;
  targetModel: string; targetId: string; status: ExecutionStatus;
  results: Record<string, unknown>[] | null; error: string | null;
  startedAt: string; completedAt: string | null;
  rule?: { name: string; };
}

interface AutomationRule { id: string; name: string; }

interface ExecutionsResponse {
  data: AutomationExecution[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}

interface RulesResponse {
  data: AutomationRule[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-600',
  FAILED: 'bg-red-50 text-red-600',
  RUNNING: 'bg-blue-50 text-blue-600',
  PENDING: 'bg-amber-50 text-amber-600',
};

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  SUCCESS: '성공', FAILED: '실패', RUNNING: '실행 중', PENDING: '대기 중',
};

const STATUS_ICONS: Record<ExecutionStatus, React.ReactNode> = {
  SUCCESS: <CheckCircle2 className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
  RUNNING: <RefreshCw className="h-4 w-4 animate-spin" />,
  PENDING: <Clock className="h-4 w-4" />,
};

const MODEL_LABELS: Record<string, string> = {
  Lead: '리드', Quotation: '견적서', Contract: '계약', Customer: '고객',
};

/**
 * 자동화 실행 로그 컴포넌트
 * Requirements: 2.5.4 - 규칙 실행 히스토리 조회
 */
export default function AutomationExecutionLog() {
  const { toast } = useToast();
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules?limit=100`, {
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) throw new Error('규칙 목록을 불러오는데 실패했습니다');
      const data: RulesResponse = await response.json();
      setRules(data.data || []);
    } catch (error) { console.error('Failed to fetch rules:', error); }
  }, []);

  const fetchExecutions = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const accessToken = getAccessToken();
      const params = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
      if (selectedRuleId && selectedRuleId !== 'all') params.append('ruleId', selectedRuleId);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const response = await fetch(`${API_BASE_URL}/api/automation/executions?${params}`, {
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) throw new Error('실행 로그를 불러오는데 실패했습니다');
      const data: ExecutionsResponse = await response.json();
      setExecutions(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      toast({ title: '오류', description: error instanceof Error ? error.message : '실행 로그를 불러오는데 실패했습니다', variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [toast, pagination.limit, selectedRuleId, selectedStatus, startDate, endDate]);

  const fetchExecutionDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/executions/${id}`, {
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) throw new Error('실행 상세 정보를 불러오는데 실패했습니다');
      const data: AutomationExecution = await response.json();
      setSelectedExecution(data);
      setDetailDialogOpen(true);
    } catch (error) {
      toast({ title: '오류', description: error instanceof Error ? error.message : '실행 상세 정보를 불러오는데 실패했습니다', variant: 'destructive' });
    } finally { setIsLoadingDetail(false); }
  };

  useEffect(() => { fetchRules(); }, [fetchRules]);
  useEffect(() => { fetchExecutions(1); }, [selectedRuleId, selectedStatus, startDate, endDate]);

  const handleResetFilters = () => { setSelectedRuleId('all'); setSelectedStatus('all'); setStartDate(''); setEndDate(''); };
  const handlePageChange = (newPage: number) => { if (newPage >= 1 && newPage <= pagination.totalPages) fetchExecutions(newPage); };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const calculateDuration = (startedAt: string, completedAt: string | null): string => {
    if (!completedAt) return '진행 중';
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}초`;
    return `${Math.floor(durationMs / 60000)}분 ${Math.floor((durationMs % 60000) / 1000)}초`;
  };

  const renderStatusBadge = (status: ExecutionStatus) => (
    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || 'text-slate-600 bg-slate-100'} flex items-center gap-1 w-fit`}>
      {STATUS_ICONS[status]}{STATUS_LABELS[status] || status}
    </span>
  );

  const getRuleName = (execution: AutomationExecution): string => {
    if (execution.rule?.name) return execution.rule.name;
    return rules.find(r => r.id === execution.ruleId)?.name || '알 수 없음';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <StitchCard variant="surface-low">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/automation">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="p-2 rounded-xl bg-blue-100">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">실행 히스토리</h2>
              <p className="text-sm text-slate-500">자동화 규칙 실행 로그를 조회합니다</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchExecutions(pagination.page)} disabled={isLoading} className="rounded-xl">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />새로고침
          </Button>
        </div>
      </StitchCard>

      {/* 필터 */}
      <StitchCard variant="surface-low">
        <div className="mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Filter className="h-5 w-5 text-primary" />필터</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="rule-filter" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">규칙</label>
            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
              <SelectTrigger id="rule-filter" className="bg-white border-none rounded-xl"><SelectValue placeholder="전체 규칙" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 규칙</SelectItem>
                {rules.map((rule) => (<SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="status-filter" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">상태</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status-filter" className="bg-white border-none rounded-xl"><SelectValue placeholder="전체 상태" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="SUCCESS">성공</SelectItem>
                <SelectItem value="FAILED">실패</SelectItem>
                <SelectItem value="RUNNING">실행 중</SelectItem>
                <SelectItem value="PENDING">대기 중</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="start-date" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시작일</label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border-none rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="end-date" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">종료일</label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border-none rounded-xl" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={handleResetFilters} className="w-full rounded-xl">필터 초기화</Button>
          </div>
        </div>
      </StitchCard>

      {/* 실행 로그 목록 */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />실행 로그</h2>
          <p className="text-sm text-slate-500">총 {pagination.total.toLocaleString()}건의 실행 기록</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : executions.length === 0 ? (
          <StitchCard variant="surface-low">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500">실행 기록이 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">자동화 규칙이 실행되면 여기에 기록됩니다</p>
            </div>
          </StitchCard>
        ) : (
          <>
            <StitchTable>
              <StitchTableHeader>
                <StitchTableRow>
                  <StitchTableHead>규칙명</StitchTableHead>
                  <StitchTableHead>상태</StitchTableHead>
                  <StitchTableHead>대상</StitchTableHead>
                  <StitchTableHead>시작 시간</StitchTableHead>
                  <StitchTableHead>완료 시간</StitchTableHead>
                  <StitchTableHead>소요 시간</StitchTableHead>
                  <StitchTableHead className="text-right">작업</StitchTableHead>
                </StitchTableRow>
              </StitchTableHeader>
              <StitchTableBody>
                {executions.map((execution) => (
                  <StitchTableRow key={execution.id}>
                    <StitchTableCell><span className="font-bold">{getRuleName(execution)}</span></StitchTableCell>
                    <StitchTableCell>{renderStatusBadge(execution.status)}</StitchTableCell>
                    <StitchTableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{MODEL_LABELS[execution.targetModel] || execution.targetModel}</span>
                        <span className="text-xs text-slate-500 font-mono truncate max-w-[120px]">{execution.targetId}</span>
                      </div>
                    </StitchTableCell>
                    <StitchTableCell><span className="text-sm text-slate-500">{formatDate(execution.startedAt)}</span></StitchTableCell>
                    <StitchTableCell><span className="text-sm text-slate-500">{formatDate(execution.completedAt)}</span></StitchTableCell>
                    <StitchTableCell><span className="text-sm font-mono">{calculateDuration(execution.startedAt, execution.completedAt)}</span></StitchTableCell>
                    <StitchTableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => fetchExecutionDetail(execution.id)} disabled={isLoadingDetail}>
                        <Eye className="h-4 w-4 mr-1" />상세
                      </Button>
                    </StitchTableCell>
                  </StitchTableRow>
                ))}
              </StitchTableBody>
            </StitchTable>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-500">
                  {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}건 표시
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded-xl"><ChevronLeft className="h-4 w-4" />이전</Button>
                  <span className="text-sm px-2">{pagination.page} / {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded-xl">다음<ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#E9E1D8] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" />실행 상세 정보</DialogTitle>
            <DialogDescription>자동화 규칙 실행의 상세 정보입니다</DialogDescription>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">기본 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-slate-500">규칙명</Label><p className="font-medium">{getRuleName(selectedExecution)}</p></div>
                  <div><Label className="text-slate-500">상태</Label><div className="mt-1">{renderStatusBadge(selectedExecution.status)}</div></div>
                  <div><Label className="text-slate-500">대상 모델</Label><p className="font-medium">{MODEL_LABELS[selectedExecution.targetModel] || selectedExecution.targetModel}</p></div>
                  <div><Label className="text-slate-500">대상 ID</Label><p className="font-mono text-sm break-all">{selectedExecution.targetId}</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시간 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-slate-500">시작 시간</Label><p className="font-medium">{formatDate(selectedExecution.startedAt)}</p></div>
                  <div><Label className="text-slate-500">완료 시간</Label><p className="font-medium">{formatDate(selectedExecution.completedAt)}</p></div>
                  <div className="col-span-2"><Label className="text-slate-500">소요 시간</Label><p className="font-medium font-mono">{calculateDuration(selectedExecution.startedAt, selectedExecution.completedAt)}</p></div>
                </div>
              </div>
              {selectedExecution.triggerData && Object.keys(selectedExecution.triggerData).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">트리거 데이터</h4>
                  <pre className="bg-[#F5EDE3] p-4 rounded-xl text-sm overflow-x-auto">{JSON.stringify(selectedExecution.triggerData, null, 2)}</pre>
                </div>
              )}
              {selectedExecution.results && selectedExecution.results.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">실행 결과</h4>
                  <pre className="bg-[#F5EDE3] p-4 rounded-xl text-sm overflow-x-auto">{JSON.stringify(selectedExecution.results, null, 2)}</pre>
                </div>
              )}
              {selectedExecution.error && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-red-600">에러 정보</h4>
                  <div className="bg-red-50 p-4 rounded-xl"><p className="text-red-700 text-sm whitespace-pre-wrap">{selectedExecution.error}</p></div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
