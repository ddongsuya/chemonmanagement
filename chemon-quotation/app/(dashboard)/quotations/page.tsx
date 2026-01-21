'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import DeleteConfirmDialog from '@/components/quotation/DeleteConfirmDialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileText,
  FileSignature,
  ClipboardList,
  FlaskConical,
  Microscope,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { QUOTATION_STATUSES } from '@/lib/constants';
import { 
  getQuotations, 
  deleteQuotationApi, 
  createQuotation,
  Quotation,
  QuotationType,
  QuotationStatus,
} from '@/lib/data-api';
import { useToast } from '@/hooks/use-toast';
import ExcelImportExport from '@/components/excel/ExcelImportExport';

// 상태 라벨 매핑
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '제출',
  ACCEPTED: '수주',
  REJECTED: '실주',
  EXPIRED: '만료',
};

// 상태 색상 매핑
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-yellow-100 text-yellow-700',
};

function QuotationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  // URL에서 초기 필터값 읽기
  const initialType = searchParams.get('type') || 'all';
  const initialStatus = searchParams.get('status') || 'all';
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    quotation: Quotation | null;
  }>({ open: false, quotation: null });

  // 견적 데이터 로드
  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getQuotations({
        type: typeFilter !== 'all' ? (typeFilter.toUpperCase() as QuotationType) : undefined,
        status: statusFilter !== 'all' ? (statusFilter.toUpperCase() as QuotationStatus) : undefined,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        setQuotations(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total || 0,
          totalPages: response.data?.pagination?.totalPages || 0,
        }));
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '견적서 목록을 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load quotations:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery, pagination.page, pagination.limit, toast]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // URL 파라미터 변경 시 필터 업데이트
  useEffect(() => {
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    if (type) setTypeFilter(type);
    if (status) setStatusFilter(status);
  }, [searchParams]);

  // 필터 변경 시 URL 업데이트
  const updateFilter = (filterType: 'type' | 'status', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'all') {
      params.delete(filterType);
    } else {
      params.set(filterType, value);
    }
    
    if (filterType === 'type') {
      setTypeFilter(value);
    } else {
      setStatusFilter(value);
    }
    
    setPagination(prev => ({ ...prev, page: 1 }));
    const newUrl = params.toString() ? `?${params.toString()}` : '/quotations';
    router.push(newUrl);
  };

  const handleDelete = (quotation: Quotation) => {
    setDeleteDialog({ open: true, quotation });
  };

  const confirmDelete = async () => {
    if (deleteDialog.quotation) {
      const { id, quotationNumber } = deleteDialog.quotation;
      
      const response = await deleteQuotationApi(id);
      
      if (response.success) {
        setQuotations(prev => prev.filter(q => q.id !== id));
        toast({
          title: '삭제 완료',
          description: `견적서 ${quotationNumber}가 삭제되었습니다.`,
        });
      } else {
        toast({
          title: '삭제 실패',
          description: response.error?.message || '견적서 삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    }
    setDeleteDialog({ open: false, quotation: null });
  };

  // 견적서 복사
  const handleCopy = async (quotation: Quotation) => {
    try {
      const response = await createQuotation({
        quotationType: quotation.quotationType,
        customerId: quotation.customerId,
        customerName: quotation.customerName,
        projectName: `${quotation.projectName} (복사본)`,
        modality: quotation.modality,
        modelId: quotation.modelId,
        modelCategory: quotation.modelCategory,
        indication: quotation.indication,
        items: quotation.items,
        subtotalTest: quotation.subtotalTest,
        subtotalAnalysis: quotation.subtotalAnalysis,
        subtotal: quotation.subtotal,
        discountRate: quotation.discountRate,
        discountAmount: quotation.discountAmount,
        vat: quotation.vat,
        totalAmount: quotation.totalAmount,
        validDays: quotation.validDays,
        notes: quotation.notes,
        status: 'DRAFT',
      });

      if (response.success && response.data) {
        loadQuotations();
        toast({
          title: '복사 완료',
          description: `견적서가 ${response.data.quotationNumber}로 복사되었습니다.`,
        });
      } else {
        toast({
          title: '복사 실패',
          description: response.error?.message || '견적서 복사에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '견적서 복사 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 검색 핸들러 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 페이지 타이틀
  const getPageTitle = () => {
    if (statusFilter !== 'all') {
      const statusLabel = STATUS_LABELS[statusFilter.toUpperCase()] || statusFilter;
      return `견적 관리 - ${statusLabel}`;
    }
    return '견적 관리';
  };

  return (
    <div>
      <PageHeader
        title={getPageTitle()}
        description="작성된 견적서를 관리합니다"
        actions={
          <div className="flex gap-2">
            <ExcelImportExport defaultType="quotations" onImportSuccess={loadQuotations} />
            <Button asChild>
              <Link href="/quotations/new">
                <Plus className="w-4 h-4 mr-2" />
                새 견적서 작성
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {/* 필터 */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={typeFilter} onValueChange={(v) => updateFilter('type', v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="toxicity">독성시험</SelectItem>
                <SelectItem value="efficacy">효력시험</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => updateFilter('status', v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="draft">작성중</SelectItem>
                <SelectItem value="sent">제출</SelectItem>
                <SelectItem value="accepted">수주</SelectItem>
                <SelectItem value="rejected">실주</SelectItem>
                <SelectItem value="expired">만료</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="견적번호, 고객사, 프로젝트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  router.push('/quotations');
                }}
              >
                필터 초기화
              </Button>
            )}
          </div>

          {/* 테이블 */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>유형</TableHead>
                  <TableHead>견적번호</TableHead>
                  <TableHead>고객사</TableHead>
                  <TableHead>프로젝트</TableHead>
                  <TableHead>모달리티/모델</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : quotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                        ? '검색 결과가 없습니다.'
                        : '저장된 견적서가 없습니다. 새 견적서를 작성해보세요.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((quotation) => {
                    const isEfficacy = quotation.quotationType === 'EFFICACY';
                    const detailPath = `/quotations/${quotation.id}`;
                    const editPath = `/quotations/${quotation.id}/edit`;

                    return (
                      <TableRow key={quotation.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {isEfficacy ? (
                              <Microscope className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <FlaskConical className="w-4 h-4 text-blue-500" />
                            )}
                            <span className={`text-xs font-medium ${isEfficacy ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {isEfficacy ? '효력' : '독성'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={detailPath}
                            className="font-medium text-primary hover:underline font-mono text-sm"
                          >
                            {quotation.quotationNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{quotation.customerName}</TableCell>
                        <TableCell>{quotation.projectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{quotation.modality || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[quotation.status] || ''}>
                            {STATUS_LABELS[quotation.status] || quotation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(quotation.totalAmount)}
                        </TableCell>
                        <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={detailPath}>
                                  <Eye className="w-4 h-4 mr-2" /> 보기
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={editPath}>
                                  <Edit className="w-4 h-4 mr-2" /> 수정
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopy(quotation)}>
                                <Copy className="w-4 h-4 mr-2" /> 복사
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="w-4 h-4 mr-2" /> PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(quotation)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> 삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              총 {pagination.total}개의 견적서
            </p>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                이전
              </Button>
              <Button variant="outline" size="sm" disabled>
                {pagination.page} / {pagination.totalPages || 1}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                다음
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        quotationNumber={deleteDialog.quotation?.quotationNumber || ''}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
      <QuotationsContent />
    </Suspense>
  );
}
