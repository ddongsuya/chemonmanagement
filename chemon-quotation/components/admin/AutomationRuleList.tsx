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
import { Switch } from '@/components/ui/switch';
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
  Zap, Plus, MoreHorizontal, Pencil, Trash2, RefreshCw, AlertCircle, Play, History,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type AutomationStatus = 'ACTIVE' | 'INACTIVE';
type AutomationTriggerType = 'STATUS_CHANGE' | 'DATE_REACHED' | 'ITEM_CREATED' | 'ITEM_UPDATED';

interface AutomationRule {
  id: string; name: string; description: string | null;
  triggerType: AutomationTriggerType; triggerConfig: Record<string, unknown>;
  conditions: Record<string, unknown>[] | null; status: AutomationStatus;
  priority: number; executionCount: number; lastExecutedAt: string | null;
  lastError: string | null; createdBy: string; isSystem: boolean;
  createdAt: string; updatedAt: string;
}

interface AutomationRulesResponse {
  data: AutomationRule[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}

const TRIGGER_TYPE_LABELS: Record<AutomationTriggerType, string> = {
  STATUS_CHANGE: '상태 변경', DATE_REACHED: '날짜 도달',
  ITEM_CREATED: '항목 생성', ITEM_UPDATED: '항목 수정',
};

const TRIGGER_TYPE_COLORS: Record<AutomationTriggerType, string> = {
  STATUS_CHANGE: 'text-blue-600 bg-blue-50',
  DATE_REACHED: 'text-orange-600 bg-orange-50',
  ITEM_CREATED: 'text-emerald-600 bg-emerald-50',
  ITEM_UPDATED: 'text-violet-600 bg-violet-50',
};

export default function AutomationRuleList() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules?limit=100`, {
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) throw new Error('규칙 목록을 불러오는데 실패했습니다');
      const data: AutomationRulesResponse = await response.json();
      setRules(data.data || []);
    } catch (error) {
      toast({ title: '오류', description: error instanceof Error ? error.message : '규칙 목록을 불러오는데 실패했습니다', variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [toast]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleToggle = async (rule: AutomationRule) => {
    setTogglingIds(prev => new Set(prev).add(rule.id));
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules/${rule.id}/toggle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) throw new Error('상태 변경에 실패했습니다');
      const updatedRule: AutomationRule = await response.json();
      setRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r));
      toast({ title: '상태 변경 완료', description: `"${rule.name}" 규칙이 ${updatedRule.status === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다` });
    } catch (error) {
      toast({ title: '상태 변경 실패', description: error instanceof Error ? error.message : '상태 변경에 실패했습니다', variant: 'destructive' });
    } finally {
      setTogglingIds(prev => { const next = new Set(prev); next.delete(rule.id); return next; });
    }
  };

  const handleOpenDeleteDialog = (rule: AutomationRule) => { setRuleToDelete(rule); setDeleteDialogOpen(true); };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules/${ruleToDelete.id}`, {
        method: 'DELETE', headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error?.message || '삭제에 실패했습니다'); }
      toast({ title: '삭제 완료', description: `"${ruleToDelete.name}" 규칙이 삭제되었습니다` });
      setRules(prev => prev.filter(r => r.id !== ruleToDelete.id));
      setDeleteDialogOpen(false); setRuleToDelete(null);
    } catch (error) {
      toast({ title: '삭제 실패', description: error instanceof Error ? error.message : '삭제에 실패했습니다', variant: 'destructive' });
    } finally { setIsDeleting(false); }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const renderTriggerBadge = (triggerType: AutomationTriggerType) => (
    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${TRIGGER_TYPE_COLORS[triggerType] || 'text-slate-600 bg-slate-100'}`}>
      {TRIGGER_TYPE_LABELS[triggerType] || triggerType}
    </span>
  );

  const renderStatusBadge = (status: AutomationStatus) => (
    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
      {status === 'ACTIVE' ? '활성' : '비활성'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <StitchCard variant="surface-low">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100">
              <Zap className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">자동화 규칙</h2>
              <p className="text-sm text-slate-500">트리거 기반 자동화 규칙을 관리합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRules} disabled={isLoading} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />새로고침
            </Button>
            <Link href="/admin/automation/executions">
              <Button variant="outline" size="sm" className="rounded-xl"><History className="h-4 w-4 mr-2" />실행 로그</Button>
            </Link>
            <Link href="/admin/automation/new">
              <Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />규칙 추가</Button>
            </Link>
          </div>
        </div>
      </StitchCard>

      {/* 규칙 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : rules.length === 0 ? (
        <StitchCard variant="surface-low">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500">등록된 자동화 규칙이 없습니다</p>
            <p className="text-sm text-slate-400 mt-1">&quot;규칙 추가&quot; 버튼을 클릭하여 첫 번째 규칙을 생성하세요</p>
          </div>
        </StitchCard>
      ) : (
        <StitchTable>
          <StitchTableHeader>
            <StitchTableRow>
              <StitchTableHead>규칙 이름</StitchTableHead>
              <StitchTableHead>트리거</StitchTableHead>
              <StitchTableHead>상태</StitchTableHead>
              <StitchTableHead className="text-center">실행 횟수</StitchTableHead>
              <StitchTableHead>마지막 실행</StitchTableHead>
              <StitchTableHead className="text-center">활성화</StitchTableHead>
              <StitchTableHead className="text-right">작업</StitchTableHead>
            </StitchTableRow>
          </StitchTableHeader>
          <StitchTableBody>
            {rules.map((rule) => (
              <StitchTableRow key={rule.id}>
                <StitchTableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{rule.name}</span>
                    {rule.description && <span className="text-sm text-slate-500 truncate max-w-[200px]">{rule.description}</span>}
                    {rule.isSystem && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">시스템</span>}
                  </div>
                </StitchTableCell>
                <StitchTableCell>{renderTriggerBadge(rule.triggerType)}</StitchTableCell>
                <StitchTableCell>{renderStatusBadge(rule.status)}</StitchTableCell>
                <StitchTableCell className="text-center"><span className="font-mono">{rule.executionCount.toLocaleString()}</span></StitchTableCell>
                <StitchTableCell>
                  <span className="text-sm text-slate-500">{formatDate(rule.lastExecutedAt)}</span>
                  {rule.lastError && <div className="text-xs text-red-500 truncate max-w-[150px]" title={rule.lastError}>오류: {rule.lastError}</div>}
                </StitchTableCell>
                <StitchTableCell className="text-center">
                  <Switch checked={rule.status === 'ACTIVE'} onCheckedChange={() => handleToggle(rule)} disabled={togglingIds.has(rule.id)} aria-label={`${rule.name} 활성화 토글`} />
                </StitchTableCell>
                <StitchTableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link href={`/admin/automation/${rule.id}/edit`}><Pencil className="h-4 w-4 mr-2" />수정</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenDeleteDialog(rule)} className="text-red-600" disabled={rule.isSystem}><Trash2 className="h-4 w-4 mr-2" />삭제</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </StitchTableCell>
              </StitchTableRow>
            ))}
          </StitchTableBody>
        </StitchTable>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#E9E1D8] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>규칙 삭제</AlertDialogTitle>
            <AlertDialogDescription>&quot;{ruleToDelete?.name}&quot; 규칙을 삭제하시겠습니까?<br />이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 rounded-xl">{isDeleting ? '삭제 중...' : '삭제'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
