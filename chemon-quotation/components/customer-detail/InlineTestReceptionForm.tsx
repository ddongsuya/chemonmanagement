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
import { Plus, Loader2 } from 'lucide-react';
import { testReceptionApi } from '@/lib/customer-data-api';
import { useToast } from '@/hooks/use-toast';

interface InlineTestReceptionFormProps {
  customerId: string;
  requesterId?: string | null;
  onSuccess?: () => void;
}

export default function InlineTestReceptionForm({ customerId, requesterId, onSuccess }: InlineTestReceptionFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    test_title: '',
    test_number: '',
    substance_name: '',
    substance_code: '',
    project_code: '',
    institution_name: '',
    test_director: '',
    total_amount: '',
    reception_date: new Date().toISOString().split('T')[0],
    expected_completion_date: '',
    status: 'received' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.test_title || !form.reception_date) {
      toast({ title: '오류', description: '시험제목과 접수일은 필수입니다', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await testReceptionApi.create(customerId, {
        test_title: form.test_title,
        test_number: form.test_number || undefined,
        substance_name: form.substance_name || undefined,
        substance_code: form.substance_code || undefined,
        project_code: form.project_code || undefined,
        institution_name: form.institution_name || undefined,
        test_director: form.test_director || undefined,
        total_amount: form.total_amount ? Number(form.total_amount) : 0,
        paid_amount: 0,
        remaining_amount: form.total_amount ? Number(form.total_amount) : 0,
        status: form.status,
        reception_date: form.reception_date,
        expected_completion_date: form.expected_completion_date || undefined,
        ...(requesterId ? { requester_id: requesterId } : {}),
      } as any);
      toast({ title: '시험 접수 추가 완료' });
      setOpen(false);
      setForm({
        test_title: '', test_number: '', substance_name: '', substance_code: '',
        project_code: '', institution_name: '', test_director: '', total_amount: '',
        reception_date: new Date().toISOString().split('T')[0], expected_completion_date: '', status: 'received',
      });
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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>시험 접수 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">시험제목 *</Label>
            <Input value={form.test_title} onChange={e => setForm(p => ({ ...p, test_title: e.target.value }))} placeholder="시험 제목" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">시험번호</Label>
              <Input value={form.test_number} onChange={e => setForm(p => ({ ...p, test_number: e.target.value }))} placeholder="TEST-001" />
            </div>
            <div>
              <Label className="text-xs">상태</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">접수</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">물질코드</Label>
              <Input value={form.substance_code} onChange={e => setForm(p => ({ ...p, substance_code: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">프로젝트코드</Label>
              <Input value={form.project_code} onChange={e => setForm(p => ({ ...p, project_code: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">시험물질</Label>
            <Input value={form.substance_name} onChange={e => setForm(p => ({ ...p, substance_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">의뢰기관</Label>
              <Input value={form.institution_name} onChange={e => setForm(p => ({ ...p, institution_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">시험책임자</Label>
              <Input value={form.test_director} onChange={e => setForm(p => ({ ...p, test_director: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">총 금액 (원)</Label>
            <Input type="number" value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">접수일 *</Label>
              <Input type="date" value={form.reception_date} onChange={e => setForm(p => ({ ...p, reception_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">예상완료일</Label>
              <Input type="date" value={form.expected_completion_date} onChange={e => setForm(p => ({ ...p, expected_completion_date: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
