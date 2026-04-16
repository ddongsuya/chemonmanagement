'use client';

/**
 * BulkActionBar - 일괄 작업 바
 */

import { useState } from 'react';
import { Tag, Layers, Trash2, X } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { bulkTags, updateSegment } from '@/lib/unified-customer-api';
import { bulkDeleteCustomers } from '@/lib/data-api';
import type { SegmentType } from '@/types/unified-customer';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

const SEGMENT_OPTIONS: { value: SegmentType; label: string }[] = [
  { value: 'PHARMACEUTICAL', label: '의약품' },
  { value: 'COSMETICS', label: '화장품' },
  { value: 'HEALTH_FOOD', label: '건강기능식품' },
  { value: 'MEDICAL_DEVICE', label: '의료기기' },
  { value: 'OTHER', label: '기타' },
];

export function BulkActionBar({ selectedIds, onClearSelection, onRefresh }: BulkActionBarProps) {
  const { toast } = useToast();
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add');
  const [segment, setSegment] = useState<SegmentType>('PHARMACEUTICAL');
  const [processing, setProcessing] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleBulkTag = async () => {
    if (!tagName.trim()) return;
    setProcessing(true);
    const res = await bulkTags(selectedIds, tagName, tagAction);
    if (res.success) {
      toast({ title: `태그 ${tagAction === 'add' ? '추가' : '제거'} 완료` });
      setShowTagDialog(false);
      setTagName('');
      onRefresh();
    } else {
      toast({ title: '실패', variant: 'destructive' });
    }
    setProcessing(false);
  };

  const handleBulkSegment = async () => {
    setProcessing(true);
    let success = 0;
    for (const id of selectedIds) {
      const res = await updateSegment(id, segment);
      if (res.success) success++;
    }
    toast({ title: `세그먼트 변경 완료 (${success}/${selectedIds.length})` });
    setShowSegmentDialog(false);
    onRefresh();
    setProcessing(false);
  };

  return (
    <>
      <div className="flex items-center justify-between bg-[#E9E1D8] rounded-xl px-4 py-2 mb-4">
        <span className="text-sm font-bold text-slate-900">{selectedIds.length}건 선택됨</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTagDialog(true)}>
            <Tag className="h-3.5 w-3.5 mr-1" /> 태그
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSegmentDialog(true)}>
            <Layers className="h-3.5 w-3.5 mr-1" /> 세그먼트
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> 삭제
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-3.5 w-3.5 mr-1" /> 해제
          </Button>
        </div>
      </div>

      {/* 태그 다이얼로그 */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="max-w-sm bg-[#E9E1D8] rounded-xl">
          <DialogHeader><DialogTitle>일괄 태그 {tagAction === 'add' ? '추가' : '제거'}</DialogTitle></DialogHeader>
          <Select value={tagAction} onValueChange={(v) => setTagAction(v as 'add' | 'remove')}>
            <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="add">추가</SelectItem>
              <SelectItem value="remove">제거</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="태그 이름" value={tagName} onChange={(e) => setTagName(e.target.value)} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>취소</Button>
            <Button onClick={handleBulkTag} disabled={processing || !tagName.trim()}>적용</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 세그먼트 다이얼로그 */}
      <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
        <DialogContent className="max-w-sm bg-[#E9E1D8] rounded-xl">
          <DialogHeader><DialogTitle>일괄 세그먼트 변경</DialogTitle></DialogHeader>
          <Select value={segment} onValueChange={(v) => setSegment(v as SegmentType)}>
            <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEGMENT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSegmentDialog(false)}>취소</Button>
            <Button onClick={handleBulkSegment} disabled={processing}>적용</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm bg-[#E9E1D8] rounded-xl">
          <DialogHeader><DialogTitle>고객 일괄 삭제</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-700">
            선택한 <span className="font-bold text-red-600">{selectedIds.length}건</span>의 고객을 삭제하시겠습니까?
          </p>
          <p className="text-xs text-slate-500">삭제된 고객은 복구할 수 없습니다. 연결된 견적서, 계약 등은 유지됩니다.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>취소</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setProcessing(true);
                try {
                  const res = await bulkDeleteCustomers(selectedIds);
                  if (res.success) {
                    toast({ title: `${res.data?.deletedCount || selectedIds.length}건 삭제 완료` });
                    onClearSelection();
                    onRefresh();
                  } else {
                    toast({ title: '삭제 실패', description: res.error?.message, variant: 'destructive' });
                  }
                } catch {
                  toast({ title: '삭제 실패', variant: 'destructive' });
                }
                setProcessing(false);
                setShowDeleteDialog(false);
              }}
              disabled={processing}
            >
              {processing ? '삭제 중...' : `${selectedIds.length}건 삭제`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
