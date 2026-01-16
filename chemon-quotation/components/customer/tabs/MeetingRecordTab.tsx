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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Search, MessageSquare, Filter } from 'lucide-react';
import { MeetingRecord } from '@/types/customer';
import {
  getMeetingRecordsByCustomerId,
  deleteMeetingRecord,
  updateRequestStatus,
} from '@/lib/meeting-record-storage';
import MeetingRecordForm from '../MeetingRecordForm';
import MeetingRecordList from '../MeetingRecordList';

interface MeetingRecordTabProps {
  customerId: string;
}

type FilterType = 'all' | 'meeting' | 'call' | 'email' | 'visit';
type RequestFilter = 'all' | 'requests_only' | 'pending' | 'completed';

export default function MeetingRecordTab({ customerId }: MeetingRecordTabProps) {
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MeetingRecord | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<MeetingRecord | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    record: MeetingRecord;
    newStatus: 'pending' | 'in_progress' | 'completed';
  } | null>(null);
  const [responseText, setResponseText] = useState('');

  const loadRecords = () => {
    const data = getMeetingRecordsByCustomerId(customerId);
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, [customerId]);

  // 필터링된 미팅 기록 목록 - Requirements 5.1, 5.2, 5.5
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 검색어 필터
      const matchesSearch =
        !searchQuery ||
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.attendees.some((a) =>
          a.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // 유형 필터
      const matchesType = typeFilter === 'all' || record.type === typeFilter;

      // 요청사항 필터 - Requirements 5.5
      let matchesRequest = true;
      if (requestFilter === 'requests_only') {
        matchesRequest = record.is_request;
      } else if (requestFilter === 'pending') {
        matchesRequest =
          record.is_request &&
          (record.request_status === 'pending' ||
            record.request_status === 'in_progress');
      } else if (requestFilter === 'completed') {
        matchesRequest =
          record.is_request && record.request_status === 'completed';
      }

      return matchesSearch && matchesType && matchesRequest;
    });
  }, [records, searchQuery, typeFilter, requestFilter]);

  const handleEdit = (record: MeetingRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = (record: MeetingRecord) => {
    setDeleteTarget(record);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMeetingRecord(deleteTarget.id);
    loadRecords();
    setDeleteTarget(null);
  };

  const handleStatusChange = (
    record: MeetingRecord,
    newStatus: 'pending' | 'in_progress' | 'completed'
  ) => {
    if (newStatus === 'completed') {
      setStatusChangeTarget({ record, newStatus });
      setResponseText('');
    } else {
      updateRequestStatus(record.id, newStatus);
      loadRecords();
    }
  };

  const confirmStatusChange = () => {
    if (!statusChangeTarget) return;
    updateRequestStatus(
      statusChangeTarget.record.id,
      statusChangeTarget.newStatus,
      responseText || undefined
    );
    loadRecords();
    setStatusChangeTarget(null);
    setResponseText('');
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingRecord(undefined);
    loadRecords();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRecord(undefined);
  };

  // 통계 계산
  const stats = useMemo(() => {
    const total = records.length;
    const requests = records.filter((r) => r.is_request).length;
    const pendingRequests = records.filter(
      (r) =>
        r.is_request &&
        (r.request_status === 'pending' || r.request_status === 'in_progress')
    ).length;
    return { total, requests, pendingRequests };
  }, [records]);

  return (
    <div className="space-y-4">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">미팅 기록</h2>
          <span className="text-sm text-gray-500">
            (총 {stats.total}건
            {stats.pendingRequests > 0 && (
              <span className="text-orange-500 ml-1">
                / 미처리 요청 {stats.pendingRequests}건
              </span>
            )}
            )
          </span>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRecord(undefined)}>
              <Plus className="w-4 h-4 mr-2" />
              미팅 기록 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <MeetingRecordForm
              customerId={customerId}
              meetingRecord={editingRecord}
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
            placeholder="제목, 내용, 참석자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value: FilterType) => setTypeFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="유형 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="meeting">미팅</SelectItem>
            <SelectItem value="call">전화</SelectItem>
            <SelectItem value="email">이메일</SelectItem>
            <SelectItem value="visit">방문</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={requestFilter}
          onValueChange={(value: RequestFilter) => setRequestFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="요청사항 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="requests_only">요청사항만</SelectItem>
            <SelectItem value="pending">미처리 요청</SelectItem>
            <SelectItem value="completed">처리완료 요청</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 미팅 기록 목록 - Requirements 5.2 타임라인 형태 */}
      <MeetingRecordList
        records={filteredRecords}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>미팅 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.title}</strong> 기록을 삭제하시겠습니까?
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

      {/* 요청사항 처리 완료 다이얼로그 - Requirements 5.5 */}
      <AlertDialog
        open={!!statusChangeTarget}
        onOpenChange={(open) => !open && setStatusChangeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>요청사항 처리 완료</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  <strong>{statusChangeTarget?.record.title}</strong> 요청사항을
                  처리 완료로 변경합니다.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="response">처리 내용 (선택)</Label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="처리 내용을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              처리 완료
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
