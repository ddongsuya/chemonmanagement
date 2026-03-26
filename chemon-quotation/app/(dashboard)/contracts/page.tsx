'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import {
  StitchTable,
  StitchTableBody,
  StitchTableCell,
  StitchTableHead,
  StitchTableHeader,
  StitchTableRow,
} from '@/components/ui/StitchTable';
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
      <StitchPageHeader
        label="CONTRACTS"
        title="계약 관리"
        description="계약서 및 시험 진행 관리"
        actions={
          <div className="flex gap-2 flex-shrink-0">
            <div className="hidden sm:block">
              <ExcelImportExport defaultType="contracts" onImportSuccess={loadData} />
            </div>
            <Button size="sm" className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold" onClick={() => router.push('/contract/new')}>
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">새 계약</span>
              <span className="sm:hidden">추가</span>
            </Button>
          </div>
        }
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">전체 계약</p>
              <p className="text-2xl font-bold">{contracts.length}</p>
            </div>
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
        </StitchCard>
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">진행중</p>
              <p className="text-2xl font-bold text-emerald-600">
                {contracts.filter(c => c.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
          </div>
        </StitchCard>
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">완료</p>
              <p className="text-2xl font-bold text-blue-600">
                {contracts.filter(c => c.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
          </div>
        </StitchCard>
        <StitchCard variant="surface-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">총 계약금액</p>
              <p className="text-xl font-bold">
                {formatAmount(contracts.reduce((sum, c) => sum + Number(c.totalAmount ?? c.total_amount ?? 0), 0))}
              </p>
            </div>
            <WonSign className="w-8 h-8 text-slate-400" />
          </div>
        </StitchCard>
      </div>

      {/* 필터 */}
      <StitchCard variant="surface-low">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="계약번호, 계약명 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-none rounded-xl">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="flex-shrink-0 bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold">검색</Button>
          </div>
        </div>
      </StitchCard>

      {/* 계약 목록 */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">계약 목록</h2>
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">로딩 중...</div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
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
                  <StitchCard
                    key={contract.id}
                    variant="elevated"
                    hover
                    padding="sm"
                    className="touch-manipulation cursor-pointer"
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500">{contractNumber}</span>
                      <StitchBadge status={contract.status}>
                        {statusLabels[contract.status]}
                      </StitchBadge>
                    </div>
                    <div className="font-medium text-sm mb-1 truncate">{title}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{contract.customer?.company || (contract.customer as any)?.leads?.[0]?.companyName || contract.customer_name || contract.customer?.name || '-'}</span>
                      <StitchBadge variant="neutral" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                        {contractType === 'TOXICITY' ? '독성' : contractType === 'EFFICACY' ? '효력' : '임상병리'}
                      </StitchBadge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{formatDate(signedDate)}</span>
                      <span className="font-semibold">{formatAmount(totalAmount)}</span>
                    </div>
                  </StitchCard>
                );
              })}
            </div>

            {/* 데스크톱: 테이블 */}
            <div className="hidden md:block">
              <StitchTable>
                <StitchTableHeader>
                  <StitchTableRow>
                    <StitchTableHead>계약번호</StitchTableHead>
                    <StitchTableHead>계약명</StitchTableHead>
                    <StitchTableHead>고객사</StitchTableHead>
                    <StitchTableHead>유형</StitchTableHead>
                    <StitchTableHead>계약금액</StitchTableHead>
                    <StitchTableHead>상태</StitchTableHead>
                    <StitchTableHead>체결일</StitchTableHead>
                    <StitchTableHead>시험</StitchTableHead>
                  </StitchTableRow>
                </StitchTableHeader>
                <StitchTableBody>
                  {contracts.map((contract) => {
                    const contractNumber = contract.contractNumber || contract.contract_number || '';
                    const title = contract.title || contract.project_name || '';
                    const contractType = contract.contractType || contract.contract_type || 'TOXICITY';
                    const totalAmount = contract.totalAmount ?? contract.total_amount ?? 0;
                    const signedDate = contract.signedDate || contract.signed_date;
                    
                    return (
                      <StitchTableRow
                        key={contract.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/contracts/${contract.id}`)}
                      >
                        <StitchTableCell className="font-bold text-primary">{contractNumber}</StitchTableCell>
                        <StitchTableCell>{title}</StitchTableCell>
                        <StitchTableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            {contract.customer?.company || (contract.customer as any)?.leads?.[0]?.companyName || contract.customer_name || contract.customer?.name || '-'}
                          </div>
                        </StitchTableCell>
                        <StitchTableCell>
                          <StitchBadge variant="neutral">
                            {contractType === 'TOXICITY' ? '독성' : contractType === 'EFFICACY' ? '효력' : contractType === 'CLINICAL_PATHOLOGY' ? '임상병리' : contractType}
                          </StitchBadge>
                        </StitchTableCell>
                        <StitchTableCell>{formatAmount(totalAmount)}</StitchTableCell>
                        <StitchTableCell>
                          <StitchBadge status={contract.status}>
                            {statusLabels[contract.status]}
                          </StitchBadge>
                        </StitchTableCell>
                        <StitchTableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {formatDate(signedDate)}
                          </div>
                        </StitchTableCell>
                        <StitchTableCell>
                          {(contract as any)._count?.studies || contract.studies?.length || 0}건
                        </StitchTableCell>
                      </StitchTableRow>
                    );
                  })}
                </StitchTableBody>
              </StitchTable>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
