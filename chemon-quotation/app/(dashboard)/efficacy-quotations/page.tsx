'use client';

import { useState, useEffect, Suspense } from 'react';
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
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils';
import {
  getAllEfficacyQuotations,
  deleteEfficacyQuotation,
  copyEfficacyQuotation,
} from '@/lib/efficacy-storage';
import { SavedEfficacyQuotation, EfficacyQuotationStatus } from '@/types/efficacy';
import { useToast } from '@/hooks/use-toast';

// 효력시험 견적 상태 옵션
const EFFICACY_STATUSES = [
  { value: 'draft', label: '작성중' },
  { value: 'sent', label: '발송완료' },
  { value: 'accepted', label: '수주' },
  { value: 'rejected', label: '실주' },
];

// 모델 카테고리 옵션
const MODEL_CATEGORIES = [
  { value: '피부', label: '피부' },
  { value: '항암', label: '항암' },
  { value: '대사', label: '대사' },
  { value: '신경', label: '신경' },
  { value: '근골격', label: '근골격' },
];

// 견적 목록 아이템 타입
interface EfficacyQuotationListItem {
  id: string;
  quotation_number: string;
  customer_name: string;
  project_name: string;
  model_name: string;
  model_category: string;
  status: EfficacyQuotationStatus;
  grand_total: number;
  created_at: string;
}

function EfficacyQuotationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // URL에서 초기 필터값 읽기
  const initialStatus = searchParams.get('status') || 'all';
  const initialCategory = searchParams.get('category') || 'all';

  const [quotations, setQuotations] = useState<EfficacyQuotationListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    quotation: EfficacyQuotationListItem | null;
  }>({ open: false, quotation: null });

  // localStorage에서 견적 데이터 로드
  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = () => {
    const savedQuotations = getAllEfficacyQuotations();
    const mapped: EfficacyQuotationListItem[] = savedQuotations.map((q) => ({
      id: q.id,
      quotation_number: q.quotation_number,
      customer_name: q.customer_name,
      project_name: q.project_name,
      model_name: q.model_name,
      model_category: q.model_category,
      status: q.status,
      grand_total: q.grand_total,
      created_at: q.created_at.split('T')[0],
    }));
    setQuotations(mapped);
  };

  // URL 파라미터 변경 시 필터 업데이트
  useEffect(() => {
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    if (status) setStatusFilter(status);
    if (category) setCategoryFilter(category);
  }, [searchParams]);

  // 필터 변경 시 URL 업데이트
  const updateFilter = (type: 'status' | 'category', value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      params.delete(type);
    } else {
      params.set(type, value);
    }

    if (type === 'status') {
      setStatusFilter(value);
    } else {
      setCategoryFilter(value);
    }

    const newUrl = params.toString()
      ? `/efficacy-quotations?${params.toString()}`
      : '/efficacy-quotations';
    router.push(newUrl);
  };

  // 필터링된 견적 목록
  const filteredQuotations = quotations.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && q.model_category !== categoryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        q.quotation_number.toLowerCase().includes(query) ||
        q.customer_name.toLowerCase().includes(query) ||
        q.project_name.toLowerCase().includes(query) ||
        q.model_name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // 삭제 핸들러
  const handleDelete = (quotation: EfficacyQuotationListItem) => {
    setDeleteDialog({ open: true, quotation });
  };

  const confirmDelete = () => {
    if (deleteDialog.quotation) {
      const success = deleteEfficacyQuotation(deleteDialog.quotation.id);
      if (success) {
        setQuotations((prev) =>
          prev.filter((q) => q.id !== deleteDialog.quotation?.id)
        );
        toast({
          title: '삭제 완료',
          description: `견적서 ${deleteDialog.quotation.quotation_number}가 삭제되었습니다.`,
        });
      } else {
        toast({
          title: '삭제 실패',
          description: '견적서 삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    }
    setDeleteDialog({ open: false, quotation: null });
  };

  // 복사 핸들러
  const handleCopy = (quotationId: string) => {
    const copied = copyEfficacyQuotation(quotationId);

    if (copied) {
      loadQuotations();
      toast({
        title: '복사 완료',
        description: `견적서가 ${copied.quotation_number}로 복사되었습니다.`,
      });
    } else {
      toast({
        title: '복사 실패',
        description: '원본 견적서를 찾을 수 없습니다.',
        variant: 'destructive',
      });
    }
  };

  // 상태 라벨 가져오기
  const getEfficacyStatusLabel = (status: string): string => {
    const found = EFFICACY_STATUSES.find((s) => s.value === status);
    return found ? found.label : status;
  };

  return (
    <div>
      <PageHeader
        title="효력시험 견적 관리"
        description="효력시험 견적서를 관리합니다"
        actions={
          <Button asChild>
            <Link href="/efficacy-quotations/new">
              <Plus className="w-4 h-4 mr-2" />
              새 효력시험 견적서
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {/* 필터 */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Select
              value={statusFilter}
              onValueChange={(v) => updateFilter('status', v)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {EFFICACY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(v) => updateFilter('category', v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="모델 카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {MODEL_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="견적번호, 고객사, 프로젝트, 모델 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 필터 초기화 버튼 */}
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  router.push('/efficacy-quotations');
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
                  <TableHead>견적번호</TableHead>
                  <TableHead>고객사</TableHead>
                  <TableHead>프로젝트</TableHead>
                  <TableHead>모델</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      {quotations.length === 0
                        ? '저장된 효력시험 견적서가 없습니다. 새 견적서를 작성해보세요.'
                        : statusFilter !== 'all'
                        ? `'${getEfficacyStatusLabel(statusFilter)}' 상태의 견적서가 없습니다.`
                        : '검색 결과가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>
                        <Link
                          href={`/efficacy-quotations/${quotation.id}`}
                          className="font-medium text-primary hover:underline font-mono text-sm"
                        >
                          {quotation.quotation_number}
                        </Link>
                      </TableCell>
                      <TableCell>{quotation.customer_name}</TableCell>
                      <TableCell>{quotation.project_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{quotation.model_name}</span>
                          <Badge variant="outline" className="w-fit text-xs">
                            {quotation.model_category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(quotation.status)}>
                          {getEfficacyStatusLabel(quotation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(quotation.grand_total)}
                      </TableCell>
                      <TableCell>{formatDate(quotation.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/efficacy-quotations/${quotation.id}`}>
                                <Eye className="w-4 h-4 mr-2" /> 보기
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/efficacy-quotations/${quotation.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" /> 수정
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopy(quotation.id)}
                            >
                              <Copy className="w-4 h-4 mr-2" /> 복사
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" /> PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/contract/new?efficacyQuotationId=${quotation.id}`}
                              >
                                <FileSignature className="w-4 h-4 mr-2" /> 계약서
                                생성
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/consultation/new?efficacyQuotationId=${quotation.id}`}
                              >
                                <ClipboardList className="w-4 h-4 mr-2" />{' '}
                                상담기록지
                              </Link>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              총 {filteredQuotations.length}개의 효력시험 견적서
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>
                이전
              </Button>
              <Button variant="outline" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                다음
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>견적서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              견적서 {deleteDialog.quotation?.quotation_number}를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EfficacyQuotationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
      <EfficacyQuotationsContent />
    </Suspense>
  );
}
