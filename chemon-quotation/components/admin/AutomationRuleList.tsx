'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  Play,
  History,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 자동화 상태 타입
type AutomationStatus = 'ACTIVE' | 'INACTIVE';

// 트리거 타입
type AutomationTriggerType = 'STATUS_CHANGE' | 'DATE_REACHED' | 'ITEM_CREATED' | 'ITEM_UPDATED';

// 자동화 규칙 인터페이스
interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  conditions: Record<string, unknown>[] | null;
  status: AutomationStatus;
  priority: number;
  executionCount: number;
  lastExecutedAt: string | null;
  lastError: string | null;
  createdBy: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AutomationRulesResponse {
  data: AutomationRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 트리거 타입 한글 매핑
const TRIGGER_TYPE_LABELS: Record<AutomationTriggerType, string> = {
  STATUS_CHANGE: '상태 변경',
  DATE_REACHED: '날짜 도달',
  ITEM_CREATED: '항목 생성',
  ITEM_UPDATED: '항목 수정',
};

// 트리거 타입 색상 매핑
const TRIGGER_TYPE_COLORS: Record<AutomationTriggerType, string> = {
  STATUS_CHANGE: 'border-blue-300 text-blue-600 bg-blue-50',
  DATE_REACHED: 'border-orange-300 text-orange-600 bg-orange-50',
  ITEM_CREATED: 'border-green-300 text-green-600 bg-green-50',
  ITEM_UPDATED: 'border-purple-300 text-purple-600 bg-purple-50',
};

/**
 * 자동화 규칙 목록 컴포넌트
 * Requirements: 2.5.1 - 규칙 목록 조회 (이름, 트리거, 상태, 실행 횟수)
 * Requirements: 2.5.2 - 규칙 활성화/비활성화 토글
 * Requirements: 2.5.3 - 규칙 수정 및 삭제
 */
export default function AutomationRuleList() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  
  // 삭제 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * 자동화 규칙 목록 조회
   * Requirements: 2.5.1 - 규칙 목록 조회
   */
  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
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

      const data: AutomationRulesResponse = await response.json();
      setRules(data.data || []);
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '규칙 목록을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  /**
   * 규칙 활성화/비활성화 토글
   * Requirements: 2.5.2 - 규칙 활성화/비활성화 토글
   */
  const handleToggle = async (rule: AutomationRule) => {
    setTogglingIds(prev => new Set(prev).add(rule.id));

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules/${rule.id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다');
      }

      const updatedRule: AutomationRule = await response.json();
      
      // 목록에서 해당 규칙 업데이트
      setRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r));
      
      toast({
        title: '상태 변경 완료',
        description: `"${rule.name}" 규칙이 ${updatedRule.status === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다`,
      });
    } catch (error) {
      toast({
        title: '상태 변경 실패',
        description: error instanceof Error ? error.message : '상태 변경에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(rule.id);
        return next;
      });
    }
  };

  /**
   * 삭제 다이얼로그 열기
   */
  const handleOpenDeleteDialog = (rule: AutomationRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  /**
   * 규칙 삭제
   * Requirements: 2.5.3 - 규칙 삭제
   */
  const handleDelete = async () => {
    if (!ruleToDelete) return;

    setIsDeleting(true);

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules/${ruleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '삭제에 실패했습니다');
      }

      toast({
        title: '삭제 완료',
        description: `"${ruleToDelete.name}" 규칙이 삭제되었습니다`,
      });

      // 목록에서 제거
      setRules(prev => prev.filter(r => r.id !== ruleToDelete.id));
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '삭제에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
    });
  };

  /**
   * 트리거 타입 배지 렌더링
   */
  const renderTriggerBadge = (triggerType: AutomationTriggerType) => {
    return (
      <Badge 
        variant="outline" 
        className={TRIGGER_TYPE_COLORS[triggerType] || 'border-gray-300 text-gray-600'}
      >
        {TRIGGER_TYPE_LABELS[triggerType] || triggerType}
      </Badge>
    );
  };

  /**
   * 상태 배지 렌더링
   */
  const renderStatusBadge = (status: AutomationStatus) => {
    return (
      <Badge 
        variant={status === 'ACTIVE' ? 'default' : 'secondary'}
        className={status === 'ACTIVE' ? 'bg-green-500' : ''}
      >
        {status === 'ACTIVE' ? '활성' : '비활성'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>자동화 규칙</CardTitle>
                <CardDescription>
                  트리거 기반 자동화 규칙을 관리합니다
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRules}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              <Link href="/admin/automation/executions">
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  실행 로그
                </Button>
              </Link>
              <Link href="/admin/automation/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  규칙 추가
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 규칙 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5" />
            규칙 목록
          </CardTitle>
          <CardDescription>
            등록된 자동화 규칙 목록입니다. 토글로 활성화/비활성화할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">등록된 자동화 규칙이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                &quot;규칙 추가&quot; 버튼을 클릭하여 첫 번째 규칙을 생성하세요
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>규칙 이름</TableHead>
                  <TableHead>트리거</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-center">실행 횟수</TableHead>
                  <TableHead>마지막 실행</TableHead>
                  <TableHead className="text-center">활성화</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{rule.name}</span>
                        {rule.description && (
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {rule.description}
                          </span>
                        )}
                        {rule.isSystem && (
                          <Badge variant="outline" className="w-fit mt-1 text-xs">
                            시스템
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderTriggerBadge(rule.triggerType)}</TableCell>
                    <TableCell>{renderStatusBadge(rule.status)}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono">{rule.executionCount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(rule.lastExecutedAt)}
                      </span>
                      {rule.lastError && (
                        <div className="text-xs text-red-500 truncate max-w-[150px]" title={rule.lastError}>
                          오류: {rule.lastError}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={rule.status === 'ACTIVE'}
                        onCheckedChange={() => handleToggle(rule)}
                        disabled={togglingIds.has(rule.id)}
                        aria-label={`${rule.name} 활성화 토글`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/automation/${rule.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              수정
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDeleteDialog(rule)}
                            className="text-red-600"
                            disabled={rule.isSystem}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>규칙 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{ruleToDelete?.name}&quot; 규칙을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
