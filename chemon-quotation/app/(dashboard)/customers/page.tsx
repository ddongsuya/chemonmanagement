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
import UnifiedCustomerFilters, { UnifiedCustomerFiltersSkeleton } from '@/components/customer/UnifiedCustomerFilters';
import UnifiedCustomerStats, { UnifiedCustomerStatsSkeleton } from '@/components/customer/UnifiedCustomerStats';
import { Plus, RefreshCw, Users, CheckSquare, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExcelImportExport from '@/components/excel/ExcelImportExport';
import { 
  getUnifiedCustomers, 
  getPipelineStagesForFilter,
  type UnifiedEntity,
  type UnifiedCustomerFilters as FilterType,
  type PipelineStageInfo,
} from '@/lib/unified-customer-api';
import { updateCustomer, bulkUpdateCustomerGrade, bulkDeleteCustomers } from '@/lib/data-api';
import type { CustomerGrade } from '@/lib/data-api';
import { DEFAULT_UNIFIED_CUSTOMER_FILTERS } from '@/types/unified-customer';

/**
 * 통합 고객사 관리 페이지
 * 
 * 리드(Lead)와 고객(Customer)을 통합하여 표시하는 페이지입니다.
 * 
 * @requirements 1.1 - 리드와 고객을 통합하여 표시
 * @requirements 3.4 - URL 쿼리 파라미터와 필터 상태 동기화
 * @requirements 3.5 - 뒤로가기 시 필터 상태 유지
 * @requirements 8.3 - 네비게이션 로직
 */
export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // 상태 관리
  const [entities, setEntities] = useState<UnifiedEntity[]>([]);
  const [stages, setStages] = useState<PipelineStageInfo[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    leadCount: 0,
    customerCount: 0,
    stageDistribution: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // 다중 선택 상태
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGradeDialogOpen, setBulkGradeDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkGrade, setBulkGrade] = useState<CustomerGrade>('CUSTOMER');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // URL 파라미터에서 필터 초기화 - Requirements 3.4
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
        if (responseData.stats) {
          setStats(responseData.stats);
        }
        if (responseData.pagination) {
          setPagination(responseData.pagination);
        }
      } else {
        setEntities([]);
        if (response.error?.code !== 'AUTH_TOKEN_EXPIRED') {
          toastRef.current({
            title: '오류',
            description: response.error?.message || '데이터를 불러오는데 실패했습니다',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      setEntities([]);
      toastRef.current({
        title: '오류',
        description: '서버 연결에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // URL 파라미터 동기화 - Requirements 3.4, 3.5
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.type && filters.type !== 'all') {
      params.set('type', filters.type);
    }
    if (filters.stageId) {
      params.set('stageId', filters.stageId);
    }
    if (filters.search) {
      params.set('search', filters.search);
    }
    if (filters.page && filters.page > 1) {
      params.set('page', filters.page.toString());
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '/customers';
    
    // URL 업데이트 (히스토리에 추가하지 않고 교체)
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  /**
   * 필터 변경 핸들러
   */
  const handleFilterChange = useCallback((newFilters: FilterType) => {
    setFilters(newFilters);
  }, []);

  /**
   * 엔티티 클릭 핸들러
   * @requirements 8.1 - 리드 클릭 시 /leads/{leadId} 페이지로 이동
   * @requirements 8.2 - 고객 클릭 시 상세 모달 또는 페이지 표시
   */
  const handleEntityClick = useCallback((entity: UnifiedEntity) => {
    if (entity.entityType === 'LEAD') {
      router.push(`/leads/${entity.id}`);
    } else {
      router.push(`/customers/${entity.id}`);
    }
  }, [router]);

  /**
   * 고객 등급 변경 핸들러
   */
  const handleGradeChange = useCallback(async (entity: UnifiedEntity, newGrade: string) => {
    try {
      const response = await updateCustomer(entity.id, { grade: newGrade as CustomerGrade });
      if (response.success) {
        toastRef.current({ title: '등급 변경 완료' });
        loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '등급 변경 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    }
  }, [loadData]);

  /**
   * 다중 선택 토글
   */
  const handleSelectChange = useCallback((entity: UnifiedEntity, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(entity.id);
      else next.delete(entity.id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    // 고객 타입만 선택 (리드는 bulk grade 변경 불가)
    const customerIds = entities.filter(e => e.entityType === 'CUSTOMER').map(e => e.id);
    setSelectedIds(new Set(customerIds));
  }, [entities]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  /**
   * 일괄 등급 변경
   */
  const handleBulkGradeChange = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const response = await bulkUpdateCustomerGrade(Array.from(selectedIds), bulkGrade);
      if (response.success) {
        toastRef.current({ title: '일괄 등급 변경 완료', description: `${response.data?.updatedCount || selectedIds.size}건 변경됨` });
        setSelectedIds(new Set());
        setSelectionMode(false);
        setBulkGradeDialogOpen(false);
        loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '일괄 변경 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    } finally {
      setBulkProcessing(false);
    }
  }, [selectedIds, bulkGrade, loadData]);

  /**
   * 일괄 삭제
   */
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const response = await bulkDeleteCustomers(Array.from(selectedIds));
      if (response.success) {
        toastRef.current({ title: '일괄 삭제 완료', description: `${response.data?.deletedCount || selectedIds.size}건 삭제됨` });
        setSelectedIds(new Set());
        setSelectionMode(false);
        setBulkDeleteDialogOpen(false);
        loadData();
      } else {
        toastRef.current({ title: '오류', description: response.error?.message || '일괄 삭제 실패', variant: 'destructive' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
    } finally {
      setBulkProcessing(false);
    }
  }, [selectedIds, loadData]);

  /**
   * 신규 고객 등록 성공 핸들러
   */
  const handleAddSuccess = useCallback(() => {
    setShowAddDialog(false);
    loadData();
  }, [loadData]);

  // 로딩 상태 렌더링
  if (loading && entities.length === 0) {
    return (
      <div>
        <PageHeader
          title="고객사 관리"
          description="리드와 고객을 통합하여 관리합니다"
        />
        <UnifiedCustomerStatsSkeleton className="mb-6" />
        <UnifiedCustomerFiltersSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UnifiedCustomerCardSkeleton key={i} />
          ))}
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
          <div className="flex gap-2">
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              onClick={toggleSelectionMode}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {selectionMode ? '선택 해제' : '다중 선택'}
            </Button>
            <ExcelImportExport defaultType="customers" onImportSuccess={loadData} />
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  신규 고객 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <CustomerForm onSuccess={handleAddSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* 통계 카드 - Requirements 7.1, 7.2 */}
      <UnifiedCustomerStats 
        stats={stats} 
        loading={loading} 
        className="mb-6" 
      />

      {/* 필터 - Requirements 3.1, 4.1, 5.1 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <UnifiedCustomerFilters
            filters={filters}
            stages={stages}
            onFilterChange={handleFilterChange}
            loading={loading || stagesLoading}
          />
        </CardContent>
      </Card>

      {/* 엔티티 목록 */}
      {entities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>
              {filters.search || filters.stageId || filters.type !== 'all'
                ? '검색 결과가 없습니다. 필터를 조정해보세요.'
                : '등록된 리드 또는 고객이 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 다중 선택 액션 바 */}
          {selectionMode && selectedIds.size > 0 && (
            <Card className="mb-4 border-primary">
              <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium">{selectedIds.size}건 선택됨</span>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>전체 선택 (고객)</Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>선택 해제</Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkGradeDialogOpen(true)}>
                    등급 일괄 변경
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    일괄 삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectionMode && selectedIds.size === 0 && (
            <Card className="mb-4">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">카드를 클릭하여 선택하세요</span>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>전체 선택 (고객)</Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity) => (
              <UnifiedCustomerCard
                key={`${entity.entityType}-${entity.id}`}
                entity={entity}
                onClick={handleEntityClick}
                onGradeChange={handleGradeChange}
                selectable={selectionMode}
                selected={selectedIds.has(entity.id)}
                onSelectChange={handleSelectChange}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                전체 {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}건
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                >
                  이전
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      const current = pagination.page;
                      return p === 1 || p === pagination.totalPages || Math.abs(p - current) <= 2;
                    })
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <Button
                          key={item}
                          variant={pagination.page === item ? 'default' : 'outline'}
                          size="sm"
                          className="min-w-[36px]"
                          onClick={() => setFilters(prev => ({ ...prev, page: item as number }))}
                          disabled={loading}
                        >
                          {item}
                        </Button>
                      )
                    )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 일괄 등급 변경 다이얼로그 */}
      <AlertDialog open={bulkGradeDialogOpen} onOpenChange={setBulkGradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>등급 일괄 변경</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}건의 고객 등급을 변경합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={bulkGrade} onValueChange={(v) => setBulkGrade(v as CustomerGrade)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
              {bulkProcessing ? '처리 중...' : '변경'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 일괄 삭제 다이얼로그 */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}건의 고객을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkProcessing ? '처리 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
