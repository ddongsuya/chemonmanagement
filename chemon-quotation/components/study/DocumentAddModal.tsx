'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  createStudyDocument,
  DOCUMENT_TYPE_CONFIG,
  VERSION_LABELS,
  VERSION_OPTIONS,
  StudyDocumentType,
  DocumentVersion,
} from '@/lib/study-document-api';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyId: string;
  studyCode: string;
  onSuccess: () => void;
}

export default function DocumentAddModal({ open, onOpenChange, studyId, studyCode, onSuccess }: Props) {
  const now = new Date();
  const [docType, setDocType] = useState<StudyDocumentType>('PROTOCOL');
  const [version, setVersion] = useState<DocumentVersion>('FIRST_DRAFT');
  const [sentYear, setSentYear] = useState(now.getFullYear());
  const [sentMonth, setSentMonth] = useState(now.getMonth() + 1);
  const [sentDate, setSentDate] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const availableVersions = VERSION_OPTIONS[docType] || ['N_A'];

  const handleDocTypeChange = (val: StudyDocumentType) => {
    setDocType(val);
    const opts = VERSION_OPTIONS[val] || ['N_A'];
    if (!opts.includes(version)) setVersion(opts[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await createStudyDocument(studyId, {
        documentType: docType,
        version,
        sentYear,
        sentMonth,
        sentDate: sentDate || undefined,
        comment: comment || undefined,
      });
      toast({ title: '문서 기록이 추가되었습니다.' });
      onSuccess();
      onOpenChange(false);
      // reset
      setComment('');
      setSentDate('');
    } catch {
      toast({ title: '문서 기록 추가에 실패했습니다.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#E9E1D8] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">문서 송부 기록 추가</DialogTitle>
          <p className="text-xs text-slate-500">{studyCode}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* 문서 유형 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">문서 유형</label>
            <Select value={docType} onValueChange={v => handleDocTypeChange(v as StudyDocumentType)}>
              <SelectTrigger className="h-9 bg-white border-none rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(DOCUMENT_TYPE_CONFIG) as [StudyDocumentType, typeof DOCUMENT_TYPE_CONFIG[StudyDocumentType]][]).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 버전 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">버전</label>
            <Select value={version} onValueChange={v => setVersion(v as DocumentVersion)}>
              <SelectTrigger className="h-9 bg-white border-none rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableVersions.map(v => (
                  <SelectItem key={v} value={v}>
                    {VERSION_LABELS[v] || '해당없음'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 송부 연월 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">송부 연월</label>
            <div className="flex gap-2">
              <Select value={sentYear.toString()} onValueChange={v => setSentYear(parseInt(v))}>
                <SelectTrigger className="h-9 w-24 bg-white border-none rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sentMonth.toString()} onValueChange={v => setSentMonth(parseInt(v))}>
                <SelectTrigger className="h-9 w-20 bg-white border-none rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>{m}월</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 송부 일자 (선택) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">송부 일자 (선택)</label>
            <Input
              type="date"
              value={sentDate}
              onChange={e => setSentDate(e.target.value)}
              className="h-9 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* 코멘트 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">코멘트 (선택)</label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="예: 고객사 검토 의견 반영"
              rows={2}
              className="text-sm bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-none bg-white font-bold">취소</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-primary to-orange-400 font-bold">
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
