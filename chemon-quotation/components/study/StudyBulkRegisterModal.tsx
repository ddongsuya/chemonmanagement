'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload, ImageIcon, Loader2, Trash2, Plus, Camera, AlertCircle,
} from 'lucide-react';
import { parseStudyImage, ParsedStudyRow } from '@/lib/ocr-service';
import { bulkCreateStudies } from '@/lib/study-document-api';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onSuccess: () => void;
}

const EMPTY_ROW: ParsedStudyRow = {
  substanceCode: '', projectCode: '', testSubstance: '',
  sponsor: '', studyCode: '', studyTitle: '', studyDirector: '',
};

export default function StudyBulkRegisterModal({ open, onOpenChange, contractId, onSuccess }: Props) {
  const [rows, setRows] = useState<ParsedStudyRow[]>([{ ...EMPTY_ROW }]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrConfidence(null);
    try {
      const result = await parseStudyImage(file);
      setOcrConfidence(result.confidence);

      if (result.studies.length > 0) {
        setRows(result.studies);
        toast({ title: `${result.studies.length}건의 시험 데이터를 인식했습니다.` });
      } else {
        toast({ title: '시험 데이터를 인식하지 못했습니다. 수동으로 입력해주세요.', variant: 'destructive' });
      }
    } catch {
      toast({ title: '이미지 인식에 실패했습니다.', variant: 'destructive' });
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, []);

  const updateRow = (idx: number, field: keyof ParsedStudyRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    // 새 행에 공통 필드 복사 (물질코드, 프로젝트코드, 시험물질, 의뢰기관)
    const last = rows[rows.length - 1];
    setRows(prev => [...prev, {
      substanceCode: last?.substanceCode || '',
      projectCode: last?.projectCode || '',
      testSubstance: last?.testSubstance || '',
      sponsor: last?.sponsor || '',
      studyCode: '', studyTitle: '', studyDirector: '',
    }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.studyTitle || r.studyCode);
    if (validRows.length === 0) {
      toast({ title: '등록할 시험 데이터가 없습니다.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const result = await bulkCreateStudies(contractId, validRows);
      toast({ title: `${result.count}건의 시험이 등록되었습니다.` });
      onSuccess();
      onOpenChange(false);
      setRows([{ ...EMPTY_ROW }]);
    } catch {
      toast({ title: '시험 등록에 실패했습니다.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">시험 일괄 등록</DialogTitle>
        </DialogHeader>

        {/* OCR 이미지 업로드 */}
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={ocrLoading}
            >
              {ocrLoading ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />인식 중...</>
              ) : (
                <><Camera className="w-4 h-4 mr-1.5" />이미지로 등록</>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              시험관리팀 접수 안내 캡쳐를 업로드하면 자동으로 데이터를 인식합니다
            </span>
          </div>
          {ocrConfidence !== null && (
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span className="text-muted-foreground">
                인식 신뢰도: {Math.round(ocrConfidence)}% — 결과를 확인하고 수정해주세요
              </span>
            </div>
          )}
        </div>

        {/* 데이터 입력 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground w-8">#</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">물질코드</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">프로젝트코드</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">시험물질</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">의뢰기관</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">시험번호</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">시험제목</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">시험책임자</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-border/40">
                  <td className="py-1 px-1 text-xs text-muted-foreground">{idx + 1}</td>
                  {(['substanceCode', 'projectCode', 'testSubstance', 'sponsor', 'studyCode', 'studyTitle', 'studyDirector'] as const).map(field => (
                    <td key={field} className="py-1 px-1">
                      <Input
                        value={row[field]}
                        onChange={e => updateRow(idx, field, e.target.value)}
                        className="h-7 text-xs"
                        placeholder={field === 'studyCode' ? '25-NV-0194' : ''}
                      />
                    </td>
                  ))}
                  <td className="py-1 px-1">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="w-fit">
          <Plus className="w-3.5 h-3.5 mr-1" />행 추가
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            {rows.filter(r => r.studyTitle || r.studyCode).length}건 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
