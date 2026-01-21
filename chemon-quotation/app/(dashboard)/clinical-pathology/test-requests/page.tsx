'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Search, ClipboardList, MoreHorizontal, Play, CheckCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getTestRequests, submitTestRequest, startTestRequest, completeTestRequest, cancelTestRequest } from '@/lib/clinical-pathology-api';
import type { ClinicalTestRequest, ClinicalTestRequestStatus } from '@/types/clinical-pathology';
import { REQUEST_STATUS_LABELS } from '@/types/clinical-pathology';
import { useToast } from '@/hooks/use-toast';

export default function ClinicalTestRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ClinicalTestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadRequests();
  }, [statusFilter, pagination.page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const result = await getTestRequests({
        status: statusFilter !== 'all' ? statusFilter as ClinicalTestRequestStatus : undefined,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setRequests(result.requests);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load test requests:', error);
      toast({ title: '오류', description: '시험의뢰서 목록을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadRequests();
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitTestRequest(id);
      toast({ title: '성공', description: '시험의뢰서가 제출되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '제출에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startTestRequest(id);
      toast({ title: '성공', description: '시험이 시작되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '시작에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTestRequest(id);
      toast({ title: '성공', description: '시험이 완료되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '완료 처리에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('정말 취소하시겠습니까?')) return;
    try {
      await cancelTestRequest(id);
      toast({ title: '성공', description: '시험의뢰서가 취소되었습니다.' });
      loadRequests();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '취소에 실패했습니다.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: ClinicalTestRequestStatus) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'secondary',
      SUBMITTED: 'default',
      RECEIVED: 'default',
      IN_PROGRESS: 'default',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
    };
    const colors: Record<string, string> = {
      IN_PROGRESS: 'bg-blue-500',
      COMPLETED: 'bg-green-500',
    };
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {REQUEST_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시험의뢰서</h1>
          <p className="text-muted-foreground">임상병리검사 시험의뢰서 목록 및 관리</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="시험번호, 고객명 검색..."
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
                <SelectItem value="SUBMITTED">제출됨</SelectItem>
                <SelectItem value="RECEIVED">접수완료</SelectItem>
                <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">시험의뢰서가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">
                승인된 견적서에서 시험의뢰서를 생성할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시험번호</TableHead>
                    <TableHead>견적번호</TableHead>
                    <TableHead>고객사</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>검체수</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>의뢰일</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/clinical-pathology/test-requests/${request.id}`)}
                    >
                      <TableCell className="font-medium">
                        {request.testNumber || '-'}
                      </TableCell>
                      <TableCell>{request.quotation?.quotationNumber || '-'}</TableCell>
                      <TableCell>{request.customerName}</TableCell>
                      <TableCell>{request.contactName}</TableCell>
                      <TableCell>{request.totalSamples}개</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.requestDate).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {request.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleSubmit(request.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                제출
                              </DropdownMenuItem>
                            )}
                            {request.status === 'RECEIVED' && (
                              <DropdownMenuItem onClick={() => handleStart(request.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                시험 시작
                              </DropdownMenuItem>
                            )}
                            {request.status === 'IN_PROGRESS' && (
                              <DropdownMenuItem onClick={() => handleComplete(request.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                완료
                              </DropdownMenuItem>
                            )}
                            {!['COMPLETED', 'CANCELLED'].includes(request.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleCancel(request.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  취소
                                </DropdownMenuItem>
                              </>
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
