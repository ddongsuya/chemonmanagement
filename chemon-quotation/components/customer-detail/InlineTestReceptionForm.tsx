'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { testReceptionApi } from '@/lib/customer-data-api';
import { useToast } from '@/hooks/use-toast';

interface InlineTestReceptionFormProps {
  customerId: string;
  requesterId?: string | null;
  onSuccess?: () => void;
}

interface TestEntry {
  test_number: string;
  test_title: string;
  test_director: string;
  total_amount: string;
}

export default function InlineTestReceptionForm({ customerId, requesterId, onSuccess }: InlineTestReceptionFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 공통 정보
  const [common, setCommon] = useState({
    substance_code: '',
    project_code: '',
    substance_name: '',
    institution_name: '',
    reception_date: new Date().toISOString().split('T')[0],
    expected_completion_date: '',
    status: 'received',
  });

  // 개별 시험 항목 (시험번호 + 시험제목 + 금액)
  const [entries, setEntries] = useState<TestEntry[]>([
    { test_number: '', test_title: '', test_director: '', total_amount: '' },
  ]);

  const addEntry = () => {
    setEntries(prev => [...prev, { test_number: '', test_title: '', test_director: '', total_amount: '' }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof TestEntry, value: string) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const resetForm = () => {
    setCommon({
      substance_code: '', project_code: '', substance_name: '',
      institution_name: '',
      reception_date: new Date().toISOString().split('T')[0],
      expected_completion_date: '', status: 'received',
    });
    setEntries([{ test_number: '', test_title: '', test_director: '', total_amount: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validEntries = entries.filter(en => en.test_title.trim());
    if (validEntries.length === 0) {
      toast({ title: '오류', description: '시험제목을 1개 이상 입력해주세요', variant: 'destructive' });
      return;
    }
    if (!common.reception_date) {
      toast({ title: '오류', description: '접수일은 필수입니다', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;
      for (const entry of validEntries) {
        const amt = entry.total_amount ? Number(entry.total_amount) : 0;
        await testReceptionApi.create(customerId, {
          test_title: entry.test_title,
          test_number: entry.test_number || undefined,
          substance_name: common.substance_name || undefined,
          substance_code: common.substance_code || undefined,
          project_code: common.project_code || undefined,
          institution_name: common.institution_name || undefined,
          test_director: entry.test_director || undefined,
          total_amount: amt,
          paid_amount: 0,
          remaining_amount: amt,
          status: common.status,
          reception_date: common.reception_date,
          expected_completion_date: common.expected_completion_date || undefined,
          ...(requesterId ? { requester_id: requesterId } : {}),
        } as any);
        successCount++;
      }
      toast({ title: `시험 접수 ${successCount}건 추가 완료` });
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch {
      toast({ title: '오류', description: '저장에 실패했습니다', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />시험접수 추가</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>시험 접수 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 공통 정보 섹션 */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">공통 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">물질코드</Label>
                <Input value={common.substance_code} onChange={e => setCommon(p => ({ ...p, substance_code: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">프로젝트코드</Label>
                <Input value={common.project_code} onChange={e => setCommon(p => ({ ...p, project_code: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">시험물질</Label>
              <Input value={common.substance_name} onChange={e => setCommon(p => ({ ...p, substance_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">의뢰기관</Label>
                <Input value={common.institution_name} onChange={e => setCommon(p => ({ ...p, institution_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">상태</Label>
                <Select value={common.status} onValueChange={v => setCommon(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">접수</SelectItem>
                    <SelectItem value="in_progress">진행중</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">접수일 *</Label>
                <Input type="date" value={common.reception_date} onChange={e => setCommon(p => ({ ...p, reception_date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">예상완료일</Label>
                <Input type="date" value={common.expected_completion_date} onChange={e => setCommon(p => ({ ...p, expected_completion_date: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t" />

          {/* 시험 항목 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">시험 항목 ({entries.length}건)</p>
              <Button type="button" variant="outline" size="sm" onClick={addEntry} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />항목 추가
              </Button>
            </div>
            {entries.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border bg-slate-50/50">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">시험번호</Label>
                    <Input value={entry.test_number} onChange={e => updateEntry(idx, 'test_number', e.target.value)} placeholder={`TEST-${String(idx + 1).padStart(3, '0')}`} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">시험제목 *</Label>
                    <Input value={entry.test_title} onChange={e => updateEntry(idx, 'test_title', e.target.value)} placeholder="시험 제목" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">시험책임자</Label>
                    <Input value={entry.test_director} onChange={e => updateEntry(idx, 'test_director', e.target.value)} placeholder="책임자명" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">금액 (원)</Label>
                    <Input type="number" value={entry.total_amount} onChange={e => updateEntry(idx, 'total_amount', e.target.value)} placeholder="0" className="h-8 text-sm" />
                  </div>
                </div>
                {entries.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(idx)} className="h-8 w-8 p-0 mt-5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : `${entries.filter(e => e.test_title.trim()).length}건 저장`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
