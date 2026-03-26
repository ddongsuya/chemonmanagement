'use client';

/**
 * ImportExportPanel - 가져오기/내보내기 패널
 */

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ImportExportPanelProps {
  onImportSuccess?: () => void;
}

const EXPORT_COLUMNS = [
  { key: 'companyName', label: '회사명', default: true },
  { key: 'contactName', label: '담당자명', default: true },
  { key: 'contactEmail', label: '이메일', default: true },
  { key: 'contactPhone', label: '전화번호', default: true },
  { key: 'grade', label: '등급', default: true },
  { key: 'segment', label: '세그먼트', default: false },
  { key: 'healthScore', label: '건강도', default: false },
  { key: 'totalAmount', label: '총금액', default: false },
  { key: 'tags', label: '태그', default: false },
  { key: 'createdAt', label: '등록일', default: true },
];

export function ImportExportPanel({ onImportSuccess }: ImportExportPanelProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'result'>('upload');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportColumns, setExportColumns] = useState<string[]>(EXPORT_COLUMNS.filter(c => c.default).map(c => c.key));
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportStep('mapping');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setProcessing(true);
    setProgress(30);
    // Simulate import process
    await new Promise(r => setTimeout(r, 1000));
    setProgress(70);
    await new Promise(r => setTimeout(r, 500));
    setProgress(100);
    setImportStep('result');
    setProcessing(false);
    toast({ title: '가져오기 완료' });
    onImportSuccess?.();
  };

  const handleExport = async () => {
    if (exportColumns.length === 0) {
      toast({ title: '내보낼 열을 선택해주세요', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    setProgress(50);
    await new Promise(r => setTimeout(r, 1000));
    setProgress(100);
    toast({ title: `${exportFormat.toUpperCase()} 내보내기 완료` });
    setProcessing(false);
    setShowExport(false);
  };

  const toggleColumn = (key: string) => {
    setExportColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { setShowImport(true); setImportStep('upload'); setImportFile(null); }}>
          <Upload className="h-3.5 w-3.5 mr-1" /> 가져오기
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
          <Download className="h-3.5 w-3.5 mr-1" /> 내보내기
        </Button>
      </div>

      {/* 가져오기 다이얼로그 */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-md bg-[#E9E1D8] rounded-xl">
          <DialogHeader><DialogTitle>고객 데이터 가져오기</DialogTitle></DialogHeader>
          {importStep === 'upload' && (
            <div
              className="flex flex-col items-center justify-center rounded-xl bg-[#FAF2E9] p-8 cursor-pointer hover:bg-[#F5EDE3] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-900">Excel 파일을 선택하세요</p>
              <p className="text-xs text-slate-500 mt-1">.xlsx, .csv 지원</p>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileSelect} />
            </div>
          )}
          {importStep === 'mapping' && importFile && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{importFile.name}</span>
                <span className="text-slate-500">({(importFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              {processing && <Progress value={progress} />}
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportStep('upload')}>뒤로</Button>
                <Button onClick={handleImport} disabled={processing}>
                  {processing ? '처리 중...' : '가져오기 실행'}
                </Button>
              </DialogFooter>
            </div>
          )}
          {importStep === 'result' && (
            <div className="flex flex-col items-center py-4">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
              <p className="text-sm font-bold text-slate-900">가져오기가 완료되었습니다</p>
              <Button className="mt-4" onClick={() => setShowImport(false)}>닫기</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 내보내기 다이얼로그 */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-sm bg-[#E9E1D8] rounded-xl">
          <DialogHeader><DialogTitle>고객 데이터 내보내기</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">파일 형식</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'xlsx' | 'csv')}>
                <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">내보낼 열 선택</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {EXPORT_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={exportColumns.includes(col.key)} onCheckedChange={() => toggleColumn(col.key)} />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>
            {processing && <Progress value={progress} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExport(false)}>취소</Button>
            <Button onClick={handleExport} disabled={processing}>
              {processing ? '처리 중...' : '내보내기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
