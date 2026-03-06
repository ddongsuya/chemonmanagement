'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { customerConsultationApi } from '@/lib/customer-data-api';
import { useToast } from '@/hooks/use-toast';

interface InlineConsultationFormProps {
  customerId: string;
  onSuccess?: () => void;
}

export default function InlineConsultationForm({ customerId, onSuccess }: InlineConsultationFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'phone',
    date: new Date().toISOString().split('T')[0],
    content: '',
    result: '',
    nextAction: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast({ title: '오류', description: '제목은 필수입니다', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await (customerConsultationApi as any).create(customerId, {
        title: form.title,
        type: form.type,
        date: form.date,
        content: form.content || undefined,
        result: form.result || undefined,
        nextAction: form.nextAction || undefined,
      });
      toast({ title: '상담기록 추가 완료' });
      setOpen(false);
      setForm({ title: '', type: 'phone', date: new Date().toISOString().split('T')[0], content: '', result: '', nextAction: '' });
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
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />상담 추가</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>상담기록 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">제목 *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="상담 제목" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">유형</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">전화</SelectItem>
                  <SelectItem value="email">이메일</SelectItem>
                  <SelectItem value="visit">방문</SelectItem>
                  <SelectItem value="online">온라인</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">날짜</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">내용</Label>
            <Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={3} />
          </div>
          <div>
            <Label className="text-xs">결과</Label>
            <Input value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">후속 조치</Label>
            <Input value={form.nextAction} onChange={e => setForm(p => ({ ...p, nextAction: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
