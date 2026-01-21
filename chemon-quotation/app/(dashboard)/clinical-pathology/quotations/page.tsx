'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, FileText, MoreHorizontal, Copy, Trash2, Send, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getQuotations, deleteQuotation, sendQuotation, acceptQuotation, rejectQuotation, copyQuotation } from '@/lib/clinical-pathology-api';
import type { ClinicalQuotation, ClinicalQuotationStatus } from '@/types/clinical-pathology';
import { QUOTATION_STATUS_LABELS } from '@/types/clinical-pathology';
import { useToast } from '@/hooks/use-toast';

export default function ClinicalQuotationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<ClinicalQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadQuotations();
  }, [statusFilter, pagination.page]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const result = await getQuotations({
        status: statusFilter !== 'all' ? statusFilter as ClinicalQuotationStatus : undefined,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setQuotations(result.quotations);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load quotations:', error);
      toast({ title: '오류', description: '견적서 목록을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadQuotations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteQuotation(id);
      toast({ title: '성공', description: '견적서가 삭제되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleSend = async (id: string) => {
    try {
      await sendQuotation(id);
      toast({ title: '성공', description: '견적서가 발송되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '발송에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptQuotation(id);
      toast({ title: '성공', description: '견적서가 승인되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '승인에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectQuotation(id);
      toast({ title: '성공', description: '견적서가 거절되었습니다.' });
      loadQuotations();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '거절에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCopy = async (id: string) => {
    try {
      const newQuotation = await copyQuotation(id);
      toast({ title: '성공', description: '견적서가 복사되었습니다.' });
      router.push(`/clinical-pathology/quotations/${newQuotation.id}`);
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '복사에 실패했습니다.', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getStatusBadge = (status: ClinicalQuotationStatus) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'secondary',
      SENT: 'default',
      ACCEPTED: 'default',
      REJECTED: 'destructive',
      EXPIRED: 'outline',
      CONVERTED: 'default',
    };
    const colors: Record<string, string> = {
      ACCEPTED: 'bg-green-500',
      CONVERTED: 'bg-purple-500',
    };
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {QUOTATION_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">임상병리검사 견적서</h1>
          <p className="text-muted-foreground">견적서 목록 및 관리</p>
        </div>
        <Button onClick={() => router.push('/clinical-pathology/quotations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          새 견적서
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="견적번호, 고객명 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="DRAFT">작성중</SelectItem>
                <SelectItem value="SENT">발송완료</SelectItem>
                <SelectItem value="ACCEPTED">승인됨</SelectItem>
                <SelectItem value="REJECTED">거절됨</SelectItem>
                <SelectItem value="CONVERTED">의뢰서 전환됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">견적서가 없습니다.</p>
              <Button className="mt-4" onClick={() => router.push('/clinical-pathology/quotations/new')}>
                새 견적서 작성
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>견적번호</TableHead>
                    <TableHead>고객사</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>검체수</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow
                      key={quotation.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/clinical-pathology/quotations/${quotation.id}`)}
                    >
                      <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
                      <TableCell>{quotation.customerName}</TableCell>
                      <TableCell>{quotation.contactName}</TableCell>
                      <TableCell>{quotation.totalSamples}개</TableCell>
                      <TableCell className="text-right">{formatCurrency(quotation.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell>{new Date(quotation.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {quotation.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleSend(quotation.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                발송
                              </DropdownMenuItem>
                            )}
                            {quotation.status === 'SENT' && (
                              <>
                                <DropdownMenuItem onClick={() => handleAccept(quotation.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  승인
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(quotation.id)}>
                                  <X className="h-4 w-4 mr-2" />
                                  거절
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleCopy(quotation.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              복사
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {quotation.status === 'DRAFT' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(quotation.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
