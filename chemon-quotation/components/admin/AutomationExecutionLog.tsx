'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  History,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Zap,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 실행 상태 타입
type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING';

// 실행 로그 인터페이스
interface AutomationExecution {
  id: string;
  ruleId: string;
  triggerData: Record<string, unknown>;
  targetModel: string;
  targetId: string;
  status: ExecutionStatus;
  results: Record<string, unknown>[] | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  rule?: {
    name: string;
  };
}

// 자동화 규칙 인터페이스 (필터용)
interface AutomationRule {
  id: string;
  name: string;
}

interface ExecutionsResponse {
  data: AutomationExecution[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RulesResponse {
  data: AutomationRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 상태 색상 매핑
const STATUS_COLORS: Record<ExecutionStatus, string> = {
  SUCCESS: 'bg-green-100 text-green-700 border-green-300',
  FAILED: 'bg-red-100 text-red-700 border-red-300',
  RUNNING: 'bg-blue-100 text-blue-700 border-blue-300',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

// 상태 한글 매핑
const STATUS_LABELS: Record<ExecutionStatus, string> = {
  SUCCESS: '성공',
  FAILED: '실패',
  RUNNING: '실행 중',
  PENDING: '대기 중',
};

// 상태 아이콘 매핑
const STATUS_ICONS: Record<ExecutionStatus, React.ReactNode> = {
  SUCCESS: <CheckCircle2 className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
  RUNNING: <RefreshCw className="h-4 w-4 animate-spin" />,
  PENDING: <Clock className="h-4 w-4" />,
};

// 모델 한글 매핑
const MODEL_LABELS: Record<string, string> = {
  Lead: '리드',
  Quotation: '견적서',
  Contract: '계약',
  Customer: '고객',
};

/**
 * 자동화 실행 로그 컴포넌트
 * Requirements: 2.5.4 - 규칙 실행 히스토리 조회
 */
export default function AutomationExecutionLog() {
  const { toast } = useToast();
  
  // 실행 로그 상태
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 필터 상태
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 상세 보기 다이얼로그 상태
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  /**
   * 규칙 목록 조회 (필터용)
   */
  const fetchRules = useCallback(async () => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('규칙 목록을 불러오는데 실패했습니다');
      }

      const data: RulesResponse = await response.json();
      setRules(data.data || []);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    }
  }, []);

  /**
   * 실행 로그 목록 조회
   * Requirements: 2.5.4 - 규칙 실행 히스토리 조회
   */
  const fetchExecutions = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const accessToken = getAccessToken();
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (selectedRuleId && selectedRuleId !== 'all') {
        params.append('ruleId', selectedRuleId);
      }
      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (startDate) {
        params.append('startDate', new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append('endDate', new Date(endDate).toISOString());
      }

      const response = await fetch(`${API_BASE_URL}/api/automation/executions?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('실행 로그를 불러오는데 실패했습니다');
      }

      const data: ExecutionsResponse = await response.json();
      setExecutions(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '실행 로그를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, pagination.limit, selectedRuleId, selectedStatus, startDate, endDate]);

  /**
   * 실행 상세 정보 조회
   */
  const fetchExecutionDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/executions/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('실행 상세 정보를 불러오는데 실패했습니다');
      }

      const data: AutomationExecution = await response.json();
      setSelectedExecution(data);
      setDetailDialogOpen(true);
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '실행 상세 정보를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    fetchExecutions(1);
  }, [selectedRuleId, selectedStatus, startDate, endDate]);

  /**
   * 필터 초기화
   */
  const handleResetFilters = () => {
    setSelectedRuleId('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
  };

  /**
   * 페이지 변경
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchExecutions(newPage);
    }
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * 실행 시간 계산
   */
  const calculateDuration = (startedAt: string, completedAt: string | null): string => {
    if (!completedAt) return '진행 중';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(1)}초`;
    } else {
      return `${Math.floor(durationMs / 60000)}분 ${Math.floor((durationMs % 60000) / 1000)}초`;
    }
  };

  /**
   * 상태 배지 렌더링
   */
  const renderStatusBadge = (status: ExecutionStatus) => {
    return (
      <Badge 
        variant="outline" 
        className={`${STATUS_COLORS[status] || 'border-gray-300 text-gray-600'} flex items-center gap-1`}
      >
        {STATUS_ICONS[status]}
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  /**
   * 규칙 이름 가져오기
   */
  const getRuleName = (execution: AutomationExecution): string => {
    if (execution.rule?.name) {
      return execution.rule.name;
    }
    const rule = rules.find(r => r.id === execution.ruleId);
    return rule?.name || '알 수 없음';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/automation">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 rounded-lg bg-blue-100">
                <History className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>실행 히스토리</CardTitle>
                <CardDescription>
                  자동화 규칙 실행 로그를 조회합니다
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchExecutions(pagination.page)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* 규칙 필터 */}
            <div className="space-y-2">
              <Label htmlFor="rule-filter">규칙</Label>
              <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
                <SelectTrigger id="rule-filter">
                  <SelectValue placeholder="전체 규칙" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 규칙</SelectItem>
                  {rules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 상태 필터 */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">상태</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="전체 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="SUCCESS">성공</SelectItem>
                  <SelectItem value="FAILED">실패</SelectItem>
                  <SelectItem value="RUNNING">실행 중</SelectItem>
                  <SelectItem value="PENDING">대기 중</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 시작일 필터 */}
            <div className="space-y-2">
              <Label htmlFor="start-date">시작일</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* 종료일 필터 */}
            <div className="space-y-2">
              <Label htmlFor="end-date">종료일</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* 필터 초기화 */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full"
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실행 로그 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                실행 로그
              </CardTitle>
              <CardDescription>
                총 {pagination.total.toLocaleString()}건의 실행 기록
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">실행 기록이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                자동화 규칙이 실행되면 여기에 기록됩니다
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>규칙명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>대상</TableHead>
                    <TableHead>시작 시간</TableHead>
                    <TableHead>완료 시간</TableHead>
                    <TableHead>소요 시간</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <span className="font-medium">{getRuleName(execution)}</span>
                      </TableCell>
                      <TableCell>{renderStatusBadge(execution.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {MODEL_LABELS[execution.targetModel] || execution.targetModel}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                            {execution.targetId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(execution.startedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(execution.completedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {calculateDuration(execution.startedAt, execution.completedAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchExecutionDetail(execution.id)}
                          disabled={isLoadingDetail}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}건 표시
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                    <span className="text-sm px-2">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              실행 상세 정보
            </DialogTitle>
            <DialogDescription>
              자동화 규칙 실행의 상세 정보입니다
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  기본 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">규칙명</Label>
                    <p className="font-medium">{getRuleName(selectedExecution)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">상태</Label>
                    <div className="mt-1">{renderStatusBadge(selectedExecution.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">대상 모델</Label>
                    <p className="font-medium">
                      {MODEL_LABELS[selectedExecution.targetModel] || selectedExecution.targetModel}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">대상 ID</Label>
                    <p className="font-mono text-sm break-all">{selectedExecution.targetId}</p>
                  </div>
                </div>
              </div>

              {/* 시간 정보 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  시간 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">시작 시간</Label>
                    <p className="font-medium">{formatDate(selectedExecution.startedAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">완료 시간</Label>
                    <p className="font-medium">{formatDate(selectedExecution.completedAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">소요 시간</Label>
                    <p className="font-medium font-mono">
                      {calculateDuration(selectedExecution.startedAt, selectedExecution.completedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 트리거 데이터 */}
              {selectedExecution.triggerData && Object.keys(selectedExecution.triggerData).length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    트리거 데이터
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedExecution.triggerData, null, 2)}
                  </pre>
                </div>
              )}

              {/* 실행 결과 */}
              {selectedExecution.results && selectedExecution.results.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    실행 결과
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedExecution.results, null, 2)}
                  </pre>
                </div>
              )}

              {/* 에러 정보 */}
              {selectedExecution.error && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide text-red-600">
                    에러 정보
                  </h4>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-700 text-sm whitespace-pre-wrap">
                      {selectedExecution.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
