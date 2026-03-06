'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import CustomerForm from '@/components/customer/CustomerForm';
import UnifiedCustomerCard, { UnifiedCustomerCardSkeleton } from '@/components/customer/UnifiedCustomerCard';
import { EnhancedCustomerCard } from '@/components/customer/EnhancedCustomerCard';
import { ViewModeToggle } from '@/components/customer/ViewModeToggle';
import { TableView } from '@/components/customer/TableView';
import { KanbanView } from '@/components/customer/KanbanView';
import { AdvancedFilterPanel } from '@/components/customer/AdvancedFilterPanel';
import { FilterPresetManager } from '@/components/customer/FilterPresetManager';
import { SortControl } from '@/components/customer/SortControl';
import { KPIDashboard } from '@/components/customer/KPIDashboard';
import { BulkActionBar } from '@/components/customer/BulkActionBar';
import { ImportExportPanel } from '@/components/customer/ImportExportPanel';
import { CommandPalette } from '@/components/customer/CommandPalette';
import { KeyboardShortcutsOverlay } from '@/components/customer/KeyboardShortcutsOverlay';
import { useCustomerKeyboardShortcuts } from '@/hooks/useCustomerKeyboardShortcuts';
import { useCustomerManagementStore } from '@/stores/customerManagementStore';
import { VirtualizedCardGrid } from '@/components/customer/VirtualizedCardGrid';
import { Plus, RefreshCw, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getUnifiedCustomers,
  getPipelineStagesForFilter,
  updateCustomerStage,
  type UnifiedEntity,
  type UnifiedCustomerFilters as FilterType,
  type PipelineStageInfo,
} from '@/lib/unified-customer-api';
import { updateCustomer, bulkUpdateCustomerGrade, bulkDeleteCustomers } from '@/lib/data-api';
import type { CustomerGrade } from '@/lib/data-api';
import { DEFAULT_UNIFIED_CUSTOMER_FILTERS } from '@/types/unified-customer';

/**
 * 통합 고객사 관리 페이지 (CRM 개선 버전)
 */
export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const { viewMode, selectedIds: storeSelectedIds, toggleSelection, selectAll, clearSelection } = useCustomerManagementStore();

  // 상태 관리
  const [entities, setEntities] = useState<UnifiedEntity[]>([]);
  const [stages, setStages] = useState<PipelineStageInfo[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0, leadCount: 0, customerCount: 0,
    stageDistribution: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // 일괄 처리
  const [bulkGradeDialogOpen, setBulkGradeDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkGrade, setBulkGrade] = useState<CustomerGrade>('CUSTOMER');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // 키보드 단축키
  const { focusIndex, showHelp, setShowHelp } = useCustomerKeyboardShortcuts({ entities });

  // URL 파라미터에서 필터 초기화
  const [filters, setFilters] = useState<FilterType>(() => {
    const type = searchParams.get('type') as 'all' | 'lead' | 'customer' | null;
    const stageId = searchParams.get('stageId');
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    return {
      type: type || DEFAULT_UNIFIED_CUSTOMER_FILTERS.type,
      stageId: stageId || undefined,
      search: search || undefined,
      page: page ? parseInt(page, 10) : DEFAULT_UNIFIED_CUSTOMER_FILTERS.page,
      limit: DEFAULT_UNIFIED_CUSTOMER_FILTERS.limit,
      sortBy: DEFAULT_UNIFIED_CUSTOMER_FILTERS.sortBy,
      sortOrder: DEFAULT_UNIFIED_CUSTOMER_FILTERS.sortOrder,
    };
  });

  // 파이프라인 단계 로드
  useEffect(() => {
    async function loadStages() {
      setStagesLoading(true);
      try {
        const response = await getPipelineStagesForFilter();
        if (response.success && response.data) {
          const stageData = response.data as any;
          setStages(stageData.stages || stageData || []);
        }
      } catch (error) {
        console.error('Failed to load pipeline stages:', error);
      } finally {
        setStagesLoading(false);
      }
    }
    loadStages();
  }, []);

  // 통합 고객 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUnifiedCustomers(filters);
      if (response.success && response.data) {
        const responseData = response.data as any;
        const entityList = responseData.entities || responseData.data || [];
        setEntities(entityList);
        if (responseData.stats) setStats(responseData.stats);
        if (responseData.pagination) setPagination(responseData.pagination);
      } else {
        setEntities([]);
        if (response.error?.code !== 'AUTH_TOKEN_EXPIRED') {
          toastRef.current({ title: '오류', description: response.error?.message || '데이터를 불러오는데 실패했습니다', variant: 'destructive' });
        }
      }
    } catch {
      setEntities([]);
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  // URL 파라미터 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.stageId) params.set('stageId', filters.stageId);
    if (filters.search) params.set('search', filters.search);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
    const queryString = params.toString();
    window.history.replaceState(null, '', queryString ? `?${queryString}` : '/customers');
  }, [filters]);

  const handleFilterChange = useCallback((newFilters: FilterType) => { setFilters(newFilters); }, []);

  const handleEntityClick = useCallback((entity: UnifiedEntity) => {
    if (entity.entityType === 'LEAD') router.push(`/leads/${entity.id}`);
    else router.push(`/customers/${entity.id}`);
  }, [router]);

  const handleGradeChange = useCallback(async (entity: UnifiedEntity, newGrade: string) => {
    try {
      const response = await updateCustomer(entity.id, { grade: newGrade as any });
      if (response.success) {
        toastRef.current({ title: '등급 변경 완료' });
        await loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '등급 변경 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    }
  }, [loadData]);

  const handleStageChange = useCallback(async (entityId: string, newStage: string) => {
    try {
      await updateCustomerStage(entityId, newStage);
      toastRef.current({ title: '단계 변경 완료' });
      await loadData();
    } catch {
      toastRef.current({ title: '오류', description: '단계 변경 실패', variant: 'destructive' });
    }
  }, [loadData]);

  const handleFilterByGrade = useCallback((grade: string) => {
    setFilters(prev => ({ ...prev, grade: grade as any, page: 1 }));
  }, []);

  // 일괄 등급 변경
  const handleBulkGradeChange = useCallback(async () => {
    if (storeSelectedIds.length === 0) return;
    setBulkProcessing(true);
    const customerOnlyIds = entities
      .filter(e => e.entityType === 'CUSTOMER' && storeSelectedIds.includes(e.id))
      .map(e => e.id);
    if (customerOnlyIds.length === 0) {
      toastRef.current({ title: '오류', description: '등급 변경 가능한 고객이 선택되지 않았습니다', variant: 'destructive' });
      setBulkProcessing(false);
      return;
    }
    try {
      const response = await bulkUpdateCustomerGrade(customerOnlyIds, bulkGrade);
      if (response.success) {
        toastRef.current({ title: '일괄 등급 변경 완료', description: `${response.data?.updatedCount ?? 0}건 변경됨` });
        clearSelection();
        setBulkGradeDialogOpen(false);
        await loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '일괄 변경 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    } finally {
      setBulkProcessing(false);
    }
  }, [storeSelectedIds, bulkGrade, entities, loadData, clearSelection]);

  // 일괄 삭제
  const handleBulkDelete = useCallback(async () => {
    if (storeSelectedIds.length === 0) return;
    setBulkProcessing(true);
    const customerOnlyIds = entities
      .filter(e => e.entityType === 'CUSTOMER' && storeSelectedIds.includes(e.id))
      .map(e => e.id);
    if (customerOnlyIds.length === 0) {
      toastRef.current({ title: '오류', description: '삭제 가능한 고객이 선택되지 않았습니다', variant: 'destructive' });
      setBulkProcessing(false);
      return;
    }
    try {
      const response = await bulkDeleteCustomers(customerOnlyIds);
      if (response.success) {
        toastRef.current({ title: '일괄 삭제 완료', description: `${response.data?.deletedCount || customerOnlyIds.length}건 삭제됨` });
        clearSelection();
        setBulkDeleteDialogOpen(false);
        await loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '일괄 삭제 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    } finally {
      setBulkProcessing(false);
    }
  }, [storeSelectedIds, entities, loadData, clearSelection]);

  const handleAddSuccess = useCallback(() => {
    setShowAddDialog(false);
    loadData();
  }, [loadData]);

  // 로딩 상태
  if (loading && entities.length === 0) {
    return (
      <div>
        <PageHeader title="고객사 관리" description="리드와 고객을 통합하여 관리합니다" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted/50" /></Card>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map(i => <UnifiedCustomerCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="고객사 관리"
        description="리드와 고객을 통합하여 관리합니다"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ImportExportPanel onImportSuccess={loadData} />
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />신규 등록</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <CustomerForm onSuccess={handleAddSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI 대시보드 */}
      <KPIDashboard onFilterByGrade={handleFilterByGrade} />

      {/* 필터 + 뷰 모드 + 정렬 */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <ViewModeToggle />
            <div className="flex items-center gap-2">
              <SortControl filters={filters} onFilterChange={handleFilterChange} />
              <FilterPresetManager filters={filters} onApplyPreset={handleFilterChange} />
            </div>
          </div>
          <AdvancedFilterPanel
            filters={filters}
            stages={stages}
            onFilterChange={handleFilterChange}
            loading={loading || stagesLoading}
          />
        </CardContent>
      </Card>

      {/* 일괄 작업 바 */}
      <BulkActionBar
        selectedIds={storeSelectedIds}
        onClearSelection={clearSelection}
        onRefresh={loadData}
      />

      {/* 엔티티 목록 */}
      {entities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{filters.search || filters.stageId || filters.type !== 'all'
              ? '검색 결과가 없습니다. 필터를 조정해보세요.'
              : '등록된 리드 또는 고객이 없습니다.'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'card' && (
            <VirtualizedCardGrid
              entities={entities}
              selectedIds={storeSelectedIds}
              onToggleSelection={toggleSelection}
              onClick={handleEntityClick}
            />
          )}

          {viewMode === 'table' && (
            <TableView
              entities={entities}
              selectedIds={storeSelectedIds}
              onToggleSelection={toggleSelection}
              onSelectAll={selectAll}
              onClick={handleEntityClick}
            />
          )}

          {viewMode === 'kanban' && (
            <KanbanView
              entities={entities}
              onStageChange={handleStageChange}
              onClick={handleEntityClick}
            />
          )}

          {/* 페이지네이션 (카드/테이블 뷰) */}
          {viewMode !== 'kanban' && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                전체 {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}건
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1 || loading}
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}>이전</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <Button key={item} variant={pagination.page === item ? 'default' : 'outline'} size="sm" className="min-w-[36px]"
                          onClick={() => setFilters(prev => ({ ...prev, page: item as number }))} disabled={loading}>{item}</Button>
                      )
                    )}
                </div>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}>다음</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 커맨드 팔레트 */}
      <CommandPalette />

      {/* 키보드 단축키 도움말 */}
      <KeyboardShortcutsOverlay open={showHelp} onOpenChange={setShowHelp} />

      {/* 일괄 처리 중 오버레이 */}
      {bulkProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-base font-medium text-gray-700">일괄 처리 중입니다...</p>
          </div>
        </div>
      )}

      {/* 일괄 등급 변경 다이얼로그 */}
      <AlertDialog open={bulkGradeDialogOpen} onOpenChange={(open) => { if (!bulkProcessing) setBulkGradeDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>등급 일괄 변경</AlertDialogTitle>
            <AlertDialogDescription>선택한 {storeSelectedIds.length}건의 고객 등급을 변경합니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={bulkGrade} onValueChange={(v) => setBulkGrade(v as CustomerGrade)} disabled={bulkProcessing}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LEAD">리드</SelectItem>
              <SelectItem value="PROSPECT">잠재고객</SelectItem>
              <SelectItem value="CUSTOMER">고객</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="INACTIVE">비활성</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkGradeChange} disabled={bulkProcessing}>
              {bulkProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />처리 중...</> : '변경'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 일괄 삭제 다이얼로그 */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={(open) => { if (!bulkProcessing) setBulkDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 삭제</AlertDialogTitle>
            <AlertDialogDescription>선택한 {storeSelectedIds.length}건의 고객을 삭제합니다. 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkProcessing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />처리 중...</> : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
