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
import { Plus, Search, Users } from 'lucide-react';
import { Requester } from '@/types/customer';
import {
  getRequestersByCustomerId,
  deleteRequester,
} from '@/lib/requester-storage';
import { getQuotations } from '@/lib/data-api';
import RequesterForm from '../RequesterForm';
import RequesterCard from '../RequesterCard';

interface RequesterTabProps {
  customerId: string;
}

export default function RequesterTab({ customerId }: RequesterTabProps) {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequester, setEditingRequester] = useState<Requester | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Requester | null>(null);
  const [hasRelatedData, setHasRelatedData] = useState(false);

  const loadRequesters = () => {
    const data = getRequestersByCustomerId(customerId);
    setRequesters(data);
  };

  useEffect(() => {
    loadRequesters();
  }, [customerId]);


  // 필터링된 의뢰자 목록 - Requirements 1.3
  const filteredRequesters = useMemo(() => {
    return requesters.filter((requester) => {
      // 검색어 필터
      const matchesSearch =
        !searchQuery ||
        requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        requester.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        requester.department.toLowerCase().includes(searchQuery.toLowerCase());

      // 상태 필터
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && requester.is_active) ||
        (statusFilter === 'inactive' && !requester.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [requesters, searchQuery, statusFilter]);

  const handleEdit = (requester: Requester) => {
    setEditingRequester(requester);
    setIsFormOpen(true);
  };

  const handleDelete = async (requester: Requester) => {
    // 연관 데이터 확인 (견적서에서 해당 의뢰자 사용 여부)
    try {
      const response = await getQuotations({ customerId, limit: 1 });
      const hasQuotations = response.success && response.data && response.data.data.length > 0;
      setHasRelatedData(hasQuotations);
    } catch {
      setHasRelatedData(false);
    }
    setDeleteTarget(requester);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const result = deleteRequester(deleteTarget.id, hasRelatedData);
    if (result.success) {
      loadRequesters();
    }
    setDeleteTarget(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingRequester(undefined);
    loadRequesters();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRequester(undefined);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">의뢰자 목록</h2>
          <span className="text-sm text-gray-500">
            ({filteredRequesters.length}명)
          </span>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRequester(undefined)}>
              <Plus className="w-4 h-4 mr-2" />
              의뢰자 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <RequesterForm
              customerId={customerId}
              requester={editingRequester}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="이름, 이메일, 부서로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | 'active' | 'inactive') =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 의뢰자 목록 */}
      {filteredRequesters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {requesters.length === 0 ? (
            <div>
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 의뢰자가 없습니다.</p>
              <p className="text-sm mt-1">의뢰자 추가 버튼을 클릭하여 등록해주세요.</p>
            </div>
          ) : (
            <p>검색 결과가 없습니다.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequesters.map((requester) => (
            <RequesterCard
              key={requester.id}
              requester={requester}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>의뢰자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {hasRelatedData ? (
                <>
                  <strong>{deleteTarget?.name}</strong> 의뢰자에게 연관된 견적/계약
                  데이터가 있습니다.
                  <br />
                  삭제 대신 비활성화 처리됩니다.
                </>
              ) : (
                <>
                  <strong>{deleteTarget?.name}</strong> 의뢰자를 삭제하시겠습니까?
                  <br />
                  이 작업은 되돌릴 수 없습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {hasRelatedData ? '비활성화' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
