'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { requesterApi } from '@/lib/customer-data-api';
import { useToast } from '@/hooks/use-toast';

interface InlineRequesterFormProps {
  customerId: string;
  onSuccess?: () => void;
}

export default function InlineRequesterForm({ customerId, onSuccess }: InlineRequesterFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
    isPrimary: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast({ title: '오류', description: '이름은 필수입니다', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await requesterApi.create(customerId, {
        name: form.name,
        position: form.position || undefined,
        department: form.department || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        is_primary: form.isPrimary,
      } as any);
      toast({ title: '의뢰자 추가 완료' });
      setOpen(false);
      setForm({ name: '', position: '', department: '', phone: '', email: '', isPrimary: false });
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
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />의뢰자 추가</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#E9E1D8] rounded-xl">
        <DialogHeader><DialogTitle>의뢰자 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이름 *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="의뢰자 이름" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">직책</Label>
              <Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="팀장" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">부서</Label>
              <Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="연구개발부" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">전화번호</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" type="tel" autoComplete="tel" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이메일</Label>
              <Input type="email" autoComplete="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isPrimary} onCheckedChange={v => setForm(p => ({ ...p, isPrimary: v }))} />
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">주 담당자</Label>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
