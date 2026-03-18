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
import { meetingRecordApi } from '@/lib/customer-data-api';
import { useToast } from '@/hooks/use-toast';

interface InlineMeetingFormProps {
  customerId: string;
  requesterId?: string | null;
  onSuccess?: () => void;
}

export default function InlineMeetingForm({ customerId, requesterId, onSuccess }: InlineMeetingFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'meeting' as 'meeting' | 'call' | 'email' | 'visit',
    date: new Date().toISOString().split('T')[0],
    time: '',
    duration: '',
    content: '',
    attendees: '',
    follow_up_actions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast({ title: '오류', description: '제목과 날짜는 필수입니다', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await meetingRecordApi.create(customerId, {
        title: form.title,
        type: form.type,
        date: form.date,
        time: form.time || undefined,
        duration: form.duration ? parseInt(form.duration) : undefined,
        content: form.content || undefined,
        attendees: form.attendees ? form.attendees.split(',').map(a => a.trim()) : [],
        follow_up_actions: form.follow_up_actions || undefined,
        ...(requesterId ? { requesterId } : {}),
      } as any);
      toast({ title: '미팅 기록 추가 완료' });
      setOpen(false);
      setForm({ title: '', type: 'meeting', date: new Date().toISOString().split('T')[0], time: '', duration: '', content: '', attendees: '', follow_up_actions: '' });
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
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />미팅 추가</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>미팅 기록 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">제목 *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="미팅 제목" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">유형</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">미팅</SelectItem>
                  <SelectItem value="call">통화</SelectItem>
                  <SelectItem value="email">이메일</SelectItem>
                  <SelectItem value="visit">방문</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">날짜 *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">시간</Label>
              <Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">소요시간 (분)</Label>
              <Input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="60" />
            </div>
          </div>
          <div>
            <Label className="text-xs">참석자 (쉼표 구분)</Label>
            <Input value={form.attendees} onChange={e => setForm(p => ({ ...p, attendees: e.target.value }))} placeholder="홍길동, 김철수" />
          </div>
          <div>
            <Label className="text-xs">내용</Label>
            <Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={3} />
          </div>
          <div>
            <Label className="text-xs">후속 조치</Label>
            <Input value={form.follow_up_actions} onChange={e => setForm(p => ({ ...p, follow_up_actions: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
