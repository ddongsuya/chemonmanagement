'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import {
  Dialog, DialogContent, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CustomerForm from '@/components/customer/CustomerForm';
import { ViewModeToggle } from '@/components/customer/ViewModeToggle';
import { TableView } from '@/components/customer/TableView';
import { KanbanView } from '@/components/customer/KanbanView';
import { AdvancedFilterPanel } from '@/components/customer/AdvancedFilterPanel';
import { FilterPresetManager } from '@/components/customer/FilterPresetManager';
import { SortControl } from '@/components/customer/SortControl';
import { CustomerSummaryBar } from '@/components/customer/CustomerSummaryBar';
import { BulkActionBar } from '@/components/customer/BulkActionBar';
import { ImportExportPanel } from '@/components/customer/ImportExportPanel';
import { CommandPalette } from '@/components/customer/CommandPalette';
import { KeyboardShortcutsOverlay } from '@/components/customer/KeyboardShortcutsOverlay';
import { useCustomerKeyboardShortcuts } from '@/hooks/useCustomerKeyboardShortcuts';
import { useCustomerManagementStore } from '@/stores/customerManagementStore';
import { VirtualizedCardGrid } from '@/components/customer/VirtualizedCardGrid';
import { Plus, RefreshCw, Users, Loader2, MoreHorizontal, Upload, Download, Phone, Mail, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StitchBadge } from '@/components/ui/StitchBadge';
import {
  getUnifiedCustomers, getPipelineStagesForFilter, updateCustomerStage, getMonthlyStats,
  type UnifiedEntity, type UnifiedCustomerFilters as FilterType, type PipelineStageInfo, type MonthlyStats,
} from '@/lib/unified-customer-api';
import { updateCustomer, bulkUpdateCustomerGrade, bulkDeleteCustomers } from '@/lib/data-api';
import type { CustomerGrade } from '@/lib/data-api';
import { DEFAULT_UNIFIED_CUSTOMER_FILTERS } from '@/types/unified-customer';

/**
 * 통합 고객사 관리 페이지 — Monday Sales CRM 스타일 리디자인
 */
export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const { viewMode, selectedIds: storeSelectedIds, toggleSelection, selectAll, clearSelection } = useCustomerManagementStore();

  const [entities, setEntities] = useState<UnifiedEntity[]>([]);
  const [stages, setStages] = useState<PipelineStageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const [bulkGradeDialogOpen, setBulkGradeDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkGrade, setBulkGrade] = useState<CustomerGrade>('CUSTOMER');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const { showHelp, setShowHelp } = useCustomerKeyboardShortcuts({ entities });

  // Mobile-specific state
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [mobileShowImport, setMobileShowImport] = useState(false);
  const [mobileShowExport, setMobileShowExport] = useState(false);

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

  // Load monthly stats for mobile KPI
  useEffect(() => {
    async function loadMonthlyStats() {
      try {
        const response = await getMonthlyStats();
        if (response.success && response.data) {
          setMonthlyStats(response.data);
        }
      } catch (error) {
        console.error('Failed to load monthly stats:', error);
      }
    }
    loadMonthlyStats();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUnifiedCustomers(filters);
      if (response.success && response.data) {
        const responseData = response.data as any;
        setEntities(responseData.entities || responseData.data || []);
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
        clearSelection(); setBulkGradeDialogOpen(false); await loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '일괄 변경 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    } finally { setBulkProcessing(false); }
  }, [storeSelectedIds, bulkGrade, entities, loadData, clearSelection]);

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
        clearSelection(); setBulkDeleteDialogOpen(false); await loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '일괄 삭제 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    } finally { setBulkProcessing(false); }
  }, [storeSelectedIds, entities, loadData, clearSelection]);

  const handleAddSuccess = useCallback(() => {
    setShowAddDialog(false);
    loadData();
  }, [loadData]);

  const toggleCardExpand = useCallback((id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const formatDaysAgo = (dateStr?: string): string => {
    if (!dateStr) return '';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    return `${days}일 전`;
  };

  // 로딩 스켈레톤
  if (loading && entities.length === 0) {
    return (
      <div className="space-y-3">
        <StitchPageHeader
          label="CUSTOMERS"
          title="고객사 관리"
          description="리드와 고객을 통합하여 관리합니다"
        />
    
        <StitchCard variant="surface-low" padding="sm" className="animate-pulse">
          <div className="h-5 w-64 bg-slate-200 rounded" />
        </StitchCard>
        <StitchCard variant="surface-low" padding="md" className="animate-pulse space-y-3">
          <div className="h-8 w-full bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
        </StitchCard>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-x-hidden">
      {/* ─── 모바일 헤더 ─── */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CUSTOMERS</p>
            <h1 className="text-xl font-extrabold tracking-tight">고객사 관리</h1>
            <p className="text-xs text-slate-500">리드와 고객을 통합 관리</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl min-w-[44px] min-h-[44px]">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setMobileShowImport(true)}>
                  <Upload className="w-4 h-4 mr-2" />가져오기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMobileShowExport(true)}>
                  <Download className="w-4 h-4 mr-2" />내보내기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={loadData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />새로고침
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl bg-gradient-to-r from-primary to-orange-400 font-bold min-h-[44px] px-4">
                  <Plus className="w-4 h-4 mr-1" />추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <CustomerForm onSuccess={handleAddSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ─── 데스크톱 헤더 ─── */}
      <div className="hidden md:block">
        <StitchPageHeader
          label="CUSTOMERS"
          title="고객사 관리"
          description="리드와 고객을 통합하여 관리합니다"
          actions={
            <div className="flex items-center gap-2">
              <ImportExportPanel onImportSuccess={loadData} />
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl">
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-primary to-orange-400 font-bold"><Plus className="w-4 h-4 mr-1" />신규 등록</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <CustomerForm onSuccess={handleAddSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          }
        />
      </div>

      {/* 모바일 전용 ImportExportPanel (버튼 숨김, 다이얼로그만) */}
      <div className="md:hidden">
        <ImportExportPanel
          onImportSuccess={loadData}
          hideButtons
          externalShowImport={mobileShowImport}
          externalShowExport={mobileShowExport}
          onExternalClose={() => { setMobileShowImport(false); setMobileShowExport(false); }}
        />
      </div>

      {/* ─── 모바일 월간 지표 ─── */}
      <div className="md:hidden">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">이번 달</div>
        <div className="grid grid-cols-3 gap-3">
          <StitchCard variant="elevated" padding="sm">
            <p className="text-[11px] font-bold text-slate-500 mb-1">신규 고객사</p>
            <p className="text-xl font-black tracking-tighter">{monthlyStats?.newCustomers ?? '-'}<span className="text-xs font-normal text-slate-500 ml-0.5">건</span></p>
          </StitchCard>
          <StitchCard variant="elevated" padding="sm">
            <p className="text-[11px] font-bold text-slate-500 mb-1">견적 송부</p>
            <p className="text-xl font-black tracking-tighter">{monthlyStats?.sentQuotations ?? '-'}<span className="text-xs font-normal text-slate-500 ml-0.5">건</span></p>
          </StitchCard>
          <StitchCard variant="elevated" padding="sm">
            <p className="text-[11px] font-bold text-slate-500 mb-1">계약 체결</p>
            <p className="text-xl font-black tracking-tighter">{monthlyStats?.newContracts ?? '-'}<span className="text-xs font-normal text-slate-500 ml-0.5">건</span></p>
          </StitchCard>
        </div>
      </div>

      {/* ─── 데스크톱 KPI 요약 바 ─── */}
      <div className="hidden md:block">
        <CustomerSummaryBar onFilterByGrade={handleFilterByGrade} />
      </div>

      {/* 뷰 탭 + 필터 통합 카드 */}
      <StitchCard variant="surface-low" padding="sm">
        <div className="flex items-center justify-between px-1 py-1">
          <ViewModeToggle />
          <div className="flex items-center gap-2">
            <SortControl filters={filters} onFilterChange={handleFilterChange} />
            <FilterPresetManager filters={filters} onApplyPreset={handleFilterChange} />
          </div>
        </div>
        <div className="px-1 py-2">
          <AdvancedFilterPanel
            filters={filters}
            stages={stages}
            onFilterChange={handleFilterChange}
            loading={loading || stagesLoading}
          />
        </div>
      </StitchCard>

      {/* 일괄 작업 바 */}
      <BulkActionBar
        selectedIds={storeSelectedIds}
        onClearSelection={clearSelection}
        onRefresh={loadData}
      />

      {/* 엔티티 목록 */}
      {entities.length === 0 ? (
        <StitchCard variant="surface-low">
          <div className="py-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>{filters.search || filters.stageId || filters.type !== 'all'
              ? '검색 결과가 없습니다. 필터를 조정해보세요.'
              : '등록된 리드 또는 고객이 없습니다.'}</p>
          </div>
        </StitchCard>
      ) : (
        <>
          {viewMode === 'card' && (
            <>
              {/* 모바일: 아코디언 카드 */}
              <div className="md:hidden space-y-3">
                {entities.map((entity) => {
                  const isExpanded = expandedCards.has(entity.id);
                  const badge = entity.entityType === 'LEAD'
                    ? { label: '리드', className: 'bg-slate-100 text-slate-700' }
                    : { label: entity.grade === 'VIP' ? 'VIP' : '고객', className: entity.grade === 'VIP' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700' };

                  return (
                    <StitchCard key={`${entity.entityType}-${entity.id}`} variant="elevated" padding="sm" className="touch-manipulation">
                      {/* 기본 상태 (항상 표시) */}
                      <div
                        className="cursor-pointer active:bg-slate-50 transition-colors rounded-lg"
                        onClick={() => toggleCardExpand(entity.id)}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <h3 className="font-medium text-sm truncate flex-1 mr-2">{entity.companyName}</h3>
                          <StitchBadge variant="neutral" className="text-[10px] shrink-0">{badge.label}</StitchBadge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium shrink-0">
                            {entity.contactName.slice(0, 2)}
                          </div>
                          <span className="text-xs text-slate-700">{entity.contactName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {(entity.activeQuotationCount ?? 0) > 0
                              ? `견적 ${entity.activeQuotationCount}건 진행중`
                              : (entity.activeContractCount ?? 0) > 0
                                ? `계약 ${entity.activeContractCount}건 진행중`
                                : entity.displayStage}
                          </span>
                          <span className="text-slate-500">
                            {entity.lastActivityAt ? `최근 접촉: ${formatDaysAgo(entity.lastActivityAt)}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* 펼친 상태 */}
                      <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-60 mt-3 pt-3 border-t border-slate-100' : 'max-h-0'}`}>
                        <div className="space-y-2">
                          {entity.contactPhone && (
                            <a href={`tel:${entity.contactPhone}`} className="flex items-center gap-2 text-sm text-blue-600 active:text-blue-800 min-h-[44px]">
                              <Phone className="w-4 h-4 shrink-0" />{entity.contactPhone}
                            </a>
                          )}
                          {entity.contactEmail && (
                            <a href={`mailto:${entity.contactEmail}`} className="flex items-center gap-2 text-sm text-blue-600 active:text-blue-800 min-h-[44px]">
                              <Mail className="w-4 h-4 shrink-0" /><span className="truncate">{entity.contactEmail}</span>
                            </a>
                          )}
                          <div className="text-xs text-slate-500">
                            최근 접촉: {entity.lastActivityAt ? formatDaysAgo(entity.lastActivityAt) : '기록 없음'}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-xl min-h-[44px]"
                            onClick={(e) => { e.stopPropagation(); handleEntityClick(entity); }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />상세 페이지 열기
                          </Button>
                        </div>
                      </div>
                    </StitchCard>
                  );
                })}
              </div>

              {/* 데스크톱: 기존 카드 그리드 */}
              <div className="hidden md:block">
                <VirtualizedCardGrid
                  entities={entities}
                  selectedIds={storeSelectedIds}
                  onToggleSelection={toggleSelection}
                  onClick={handleEntityClick}
                />
              </div>
            </>
          )}

          {viewMode === 'table' && (
            <TableView
              entities={entities}
              selectedIds={storeSelectedIds}
              onToggleSelection={toggleSelection}
              onSelectAll={selectAll}
              onClick={handleEntityClick}
              onGradeChange={handleGradeChange}
            />
          )}

          {viewMode === 'kanban' && (
            <KanbanView
              entities={entities}
              onStageChange={handleStageChange}
              onClick={handleEntityClick}
            />
          )}

          {/* 페이지네이션 */}
          {viewMode !== 'kanban' && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
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
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">…</span>
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
      <KeyboardShortcutsOverlay open={showHelp} onOpenChange={setShowHelp} />

      {/* 일괄 처리 중 오버레이 */}
      {bulkProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-base font-medium text-slate-700">일괄 처리 중입니다...</p>
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
