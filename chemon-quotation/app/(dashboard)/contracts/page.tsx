'use client';

import React, { useState, useEffect } from 'react';
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
import { Plus, Search, FileText, Building2, Calendar } from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import { getContracts, Contract } from '@/lib/contract-api';
import { useToast } from '@/hooks/use-toast';
import ExcelImportExport from '@/components/excel/ExcelImportExport';

const statusLabels: Record<string, string> = {
  NEGOTIATING: '협의중',
  SIGNED: '체결',
  TEST_RECEIVED: '시험접수',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  TERMINATED: '해지',
};

const statusColors: Record<string, string> = {
  NEGOTIATING: 'bg-yellow-100 text-yellow-800',
  SIGNED: 'bg-blue-100 text-blue-800',
  TEST_RECEIVED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  TERMINATED: 'bg-red-100 text-red-800',
};

export default function ContractsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getContracts({
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        search: search || undefined,
      });
      setContracts(data);
    } catch (error) {
      toast({ title: '오류', description: '데이터를 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return Number(amount).toLocaleString() + '원';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">계약 관리</h1>
          <p className="text-sm text-muted-foreground">계약서 및 시험 진행 관리</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="hidden sm:block">
            <ExcelImportExport defaultType="contracts" onImportSuccess={loadData} />
          </div>
          <Button size="sm" onClick={() => router.push('/contract/new')}>
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">새 계약</span>
            <span className="sm:hidden">추가</span>
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 계약</p>
                <p className="text-2xl font-bold">{contracts.length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">진행중</p>
                <p className="text-2xl font-bold text-green-600">
                  {contracts.filter(c => c.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-bold text-blue-600">
                  {contracts.filter(c => c.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 계약금액</p>
                <p className="text-xl font-bold">
                  {formatAmount(contracts.reduce((sum, c) => sum + Number(c.totalAmount ?? c.total_amount ?? 0), 0))}
                </p>
              </div>
              <WonSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="계약번호, 계약명 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="flex-shrink-0">검색</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계약 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">계약 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">로딩 중...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              등록된 계약이 없습니다.
            </div>
          ) : (
            <>
              {/* 모바일: 카드 리스트 */}
              <div className="md:hidden space-y-3">
                {contracts.map((contract) => {
                  const contractNumber = contract.contractNumber || contract.contract_number || '';
                  const title = contract.title || contract.project_name || '';
                  const contractType = contract.contractType || contract.contract_type || 'TOXICITY';
                  const totalAmount = contract.totalAmount ?? contract.total_amount ?? 0;
                  const signedDate = contract.signedDate || contract.signed_date;

                  return (
                    <Card
                      key={contract.id}
                      className="touch-manipulation active:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-mono text-muted-foreground">{contractNumber}</span>
                          <Badge className={statusColors[contract.status]}>
                            {statusLabels[contract.status]}
                          </Badge>
                        </div>
                        <div className="font-medium text-sm mb-1 truncate">{title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{contract.customer?.company || contract.customer?.name || contract.customer_name || '-'}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                            {contractType === 'TOXICITY' ? '독성' : contractType === 'EFFICACY' ? '효력' : '임상병리'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{formatDate(signedDate)}</span>
                          <span className="font-semibold">{formatAmount(totalAmount)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* 데스크톱: 테이블 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>계약번호</TableHead>
                      <TableHead>계약명</TableHead>
                      <TableHead>고객사</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>계약금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>체결일</TableHead>
                      <TableHead>시험</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => {
                      const contractNumber = contract.contractNumber || contract.contract_number || '';
                      const title = contract.title || contract.project_name || '';
                      const contractType = contract.contractType || contract.contract_type || 'TOXICITY';
                      const totalAmount = contract.totalAmount ?? contract.total_amount ?? 0;
                      const signedDate = contract.signedDate || contract.signed_date;
                      
                      return (
                        <TableRow
                          key={contract.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/contracts/${contract.id}`)}
                        >
                          <TableCell className="font-medium">{contractNumber}</TableCell>
                          <TableCell>{title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {contract.customer?.company || contract.customer?.name || contract.customer_name || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {contractType === 'TOXICITY' ? '독성' : contractType === 'EFFICACY' ? '효력' : contractType === 'CLINICAL_PATHOLOGY' ? '임상병리' : contractType}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatAmount(totalAmount)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[contract.status]}>
                              {statusLabels[contract.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(signedDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(contract as any)._count?.studies || contract.studies?.length || 0}건
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
