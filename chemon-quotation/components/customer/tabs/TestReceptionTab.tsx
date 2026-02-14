'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, FlaskConical, AlertCircle } from 'lucide-react';
import { TestReception, Requester } from '@/types/customer';
import { testReceptionApi, requesterApi } from '@/lib/customer-data-api';
import TestReceptionForm from '../TestReceptionForm';
import TestReceptionTable from '../TestReceptionTable';

interface TestReceptionTabProps {
  customerId: string;
  contractId?: string;
  quotationId?: string;
  isContractCompleted?: boolean;
}

export default function TestReceptionTab({
  customerId,
  contractId = '',
  quotationId = '',
  isContractCompleted = false,
}: TestReceptionTabProps) {
  const [testReceptions, setTestReceptions] = useState<TestReception[]>([]);
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TestReception['status']>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReception, setEditingReception] = useState<TestReception | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<TestReception | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [receptions, requesterList] = await Promise.all([
        testReceptionApi.getByCustomerId(customerId),
        requesterApi.getByCustomerId(customerId),
      ]);
      setTestReceptions(receptions);
      setRequesters(requesterList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  // 필터링된 시험 접수 목록 - Requirements 2.4
  const filteredReceptions = useMemo(() => {
    return testReceptions.filter((reception) => {
      // 검색어 필터
      const matchesSearch =
        !searchQuery ||
        reception.test_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reception.test_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reception.test_director.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reception.substance_name.toLowerCase().includes(searchQuery.toLowerCase());

      // 상태 필터
      const matchesStatus =
        statusFilter === 'all' || reception.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [testReceptions, searchQuery, statusFilter]);

  const handleEdit = (reception: TestReception) => {
    setEditingReception(reception);
    setIsFormOpen(true);
  };

  const handleDelete = (reception: TestReception) => {
    setDeleteTarget(reception);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await testReceptionApi.delete(deleteTarget.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete test reception:', error);
    }
    setDeleteTarget(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingReception(undefined);
    loadData();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingReception(undefined);
  };

  // 총 금액 계산
  const totalAmount = filteredReceptions.reduce(
    (sum, r) => sum + r.total_amount,
    0
  );

  // 계약 완료 여부에 따른 등록 버튼 활성화 - Requirements 2.1
  const canAddReception = isContractCompleted && contractId;

  return (
    <div className="space-y-4">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">시험 접수 목록</h2>
          <span className="text-sm text-gray-500">
            ({filteredReceptions.length}건)
          </span>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingReception(undefined)}
              disabled={!canAddReception}
            >
              <Plus className="w-4 h-4 mr-2" />
              시험 접수 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <TestReceptionForm
              customerId={customerId}
              contractId={contractId}
              quotationId={quotationId}
              requesters={requesters}
              testReception={editingReception}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 계약 미완료 경고 - Requirements 2.1 */}
      {!canAddReception && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            시험 접수를 등록하려면 먼저 계약을 완료해야 합니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="시험번호, 제목, 책임자, 물질명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | TestReception['status']) =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="received">접수완료</SelectItem>
            <SelectItem value="in_progress">진행중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="cancelled">취소</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 요약 정보 */}
      {filteredReceptions.length > 0 && (
        <div className="flex justify-end text-sm text-gray-600">
          총 금액:{' '}
          <span className="font-semibold ml-1">
            {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
          </span>
        </div>
      )}

      {/* 시험 접수 테이블 - Requirements 2.4 */}
      <TestReceptionTable
        testReceptions={filteredReceptions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시험 접수 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.test_number}</strong> 시험 접수를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
