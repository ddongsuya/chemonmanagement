'use client';

/**
 * ImportExportPanel - 가져오기/내보내기 패널
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, ArrowRightLeft, SkipForward } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { uploadImportFile, executeImport } from '@/lib/unified-customer-api';

// ==================== Types ====================

type DuplicateAction = 'skip' | 'update';
type RowStatus = 'created' | 'skipped' | 'updated' | 'failed';

interface ImportRowResult {
  row: number;
  status: RowStatus;
  name: string;
  message?: string;
}

interface ImportResultData {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  rows: ImportRowResult[];
}

// ==================== Constants ====================

const MAX_IMPORT_ROWS = 500;

interface ImportExportPanelProps {
  onImportSuccess?: () => void;
  externalShowImport?: boolean;
  externalShowExport?: boolean;
  onExternalClose?: () => void;
  hideButtons?: boolean;
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

const STATUS_CONFIG: Record<RowStatus, { label: string; color: string; bg: string }> = {
  created: { label: '생성', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  updated: { label: '업데이트', color: 'text-blue-700', bg: 'bg-blue-50' },
  skipped: { label: '건너뜀', color: 'text-amber-700', bg: 'bg-amber-50' },
  failed: { label: '실패', color: 'text-red-700', bg: 'bg-red-50' },
};

export function ImportExportPanel({ onImportSuccess, externalShowImport, externalShowExport, onExternalClose, hideButtons }: ImportExportPanelProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<'upload' | 'options' | 'result'>('upload');
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('skip');
  const [processing, setProcessing] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedMapping, setUploadedMapping] = useState<unknown[] | null>(null);
  const [uploadedRowCount, setUploadedRowCount] = useState(0);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Export state (unchanged)
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportColumns, setExportColumns] = useState<string[]>(EXPORT_COLUMNS.filter(c => c.default).map(c => c.key));
  const [exportProcessing, setExportProcessing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // ==================== Import Handlers ====================

  const resetImport = () => {
    setImportFile(null);
    setImportStep('upload');
    setDuplicateAction('skip');
    setProcessing(false);
    setUploadedFilePath(null);
    setUploadedMapping(null);
    setUploadedRowCount(0);
    setImportResult(null);
    setImportError(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset file input so same file can be re-selected
    e.target.value = '';

    setImportFile(file);
    setImportError(null);
    setProcessing(true);

    try {
      const response = await uploadImportFile(file);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '파일 업로드에 실패했습니다');
      }

      const { filePath, suggestedMapping, rowCount } = response.data as {
        filePath: string;
        suggestedMapping: unknown[];
        rowCount: number;
      };

      if (rowCount > MAX_IMPORT_ROWS) {
        setImportError(`한 번에 최대 ${MAX_IMPORT_ROWS}행까지 가져올 수 있습니다. 현재 파일: ${rowCount}행`);
        setProcessing(false);
        return;
      }

      if (rowCount === 0) {
        setImportError('파일에 데이터가 없습니다. 헤더 행 아래에 데이터를 추가해주세요.');
        setProcessing(false);
        return;
      }

      setUploadedFilePath(filePath);
      setUploadedMapping(suggestedMapping);
      setUploadedRowCount(rowCount);

      // 필수 필드(고객명) 매핑 확인
      const nameMapping = (suggestedMapping as Array<{ field: string; excelColumn: number }>).find(m => m.field === 'name');
      if (!nameMapping || nameMapping.excelColumn === 0) {
        setImportError('파일에서 "고객명" 열을 찾을 수 없습니다. 고객 가져오기 템플릿을 사용해주세요. (첫 번째 열: 고객명*, 두 번째 열: 회사명, ...)');
        setProcessing(false);
        return;
      }

      setImportStep('options');
    } catch (err) {
      const message = err instanceof Error ? err.message : '파일 업로드에 실패했습니다';
      setImportError(message);
      toast({ title: '업로드 실패', description: message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!uploadedFilePath || !uploadedMapping) return;
    setProcessing(true);
    setImportError(null);

    try {
      const response = await executeImport(uploadedFilePath, uploadedMapping, duplicateAction);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '가져오기에 실패했습니다');
      }

      const data = response.data as ImportResultData;
      setImportResult(data);
      setImportStep('result');

      const total = data.created + data.updated + data.skipped + data.failed;
      toast({
        title: '가져오기 완료',
        description: `${total}건 처리: 생성 ${data.created}, 업데이트 ${data.updated}, 건너뜀 ${data.skipped}, 실패 ${data.failed}`,
      });
      onImportSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : '가져오기에 실패했습니다';
      setImportError(message);
      toast({ title: '가져오기 실패', description: message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  // ==================== Export Handlers (unchanged) ====================

  const handleExport = async () => {
    if (exportColumns.length === 0) {
      toast({ title: '내보낼 열을 선택해주세요', variant: 'destructive' });
      return;
    }
    setExportProcessing(true);
    setExportProgress(50);
    await new Promise(r => setTimeout(r, 1000));
    setExportProgress(100);
    toast({ title: `${exportFormat.toUpperCase()} 내보내기 완료` });
    setExportProcessing(false);
    setShowExport(false);
  };

  const toggleColumn = (key: string) => {
    setExportColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Respond to external dialog triggers
  useEffect(() => {
    if (externalShowImport) { setShowImport(true); resetImport(); }
  }, [externalShowImport]);

  useEffect(() => {
    if (externalShowExport) { setShowExport(true); }
  }, [externalShowExport]);

  // ==================== Render ====================

  // Respond to external dialog triggers via useEffect
  // (handled by parent passing externalShowImport/externalShowExport)
  // We use a simple pattern: parent sets external flag, we sync to internal state

  const handleImportClose = (open: boolean) => {
    if (!open) { setShowImport(false); onExternalClose?.(); }
  };
  const handleExportClose = (open: boolean) => {
    if (!open) { setShowExport(false); onExternalClose?.(); }
  };

  return (
    <>
      {!hideButtons && (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { setShowImport(true); resetImport(); }}>
          <Upload className="h-3.5 w-3.5 mr-1" /> 가져오기
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
          <Download className="h-3.5 w-3.5 mr-1" /> 내보내기
        </Button>
      </div>
      )}

      {/* 가져오기 다이얼로그 */}
      <Dialog open={showImport} onOpenChange={handleImportClose}>
        <DialogContent className="max-w-lg bg-[#E9E1D8] rounded-xl">
          <DialogHeader><DialogTitle>고객 데이터 가져오기</DialogTitle></DialogHeader>

          {/* Step 1: 파일 업로드 */}
          {importStep === 'upload' && (
            <div className="space-y-4">
              <div
                className="flex flex-col items-center justify-center rounded-xl bg-[#FAF2E9] p-8 cursor-pointer hover:bg-[#F5EDE3] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-3" />
                <p className="text-sm font-bold text-slate-900">Excel 파일을 선택하세요</p>
                <p className="text-xs text-slate-500 mt-1">.xlsx, .csv 지원 (최대 {MAX_IMPORT_ROWS}행)</p>
                <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileSelect} />
              </div>
              {processing && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                  파일 분석 중...
                </div>
              )}
              {importError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {importError}
                </div>
              )}
            </div>
          )}

          {/* Step 2: 옵션 선택 */}
          {importStep === 'options' && importFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm p-3 bg-[#FAF2E9] rounded-xl">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span className="font-medium">{importFile.name}</span>
                <span className="text-slate-500">({uploadedRowCount}행)</span>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">중복 데이터 처리</Label>
                <RadioGroup
                  value={duplicateAction}
                  onValueChange={(v) => setDuplicateAction(v as DuplicateAction)}
                  className="space-y-2"
                >
                  <label className="flex items-start gap-3 p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="skip" className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <SkipForward className="h-3.5 w-3.5" />
                        기존 유지 (건너뛰기)
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">이미 등록된 고객은 건너뛰고 새 고객만 추가합니다</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="update" className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        기존 레코드 업데이트
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">파일에 값이 있는 필드만 기존 데이터에 덮어씁니다</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <p className="text-xs text-slate-400">
                중복 판정: 이메일 우선, 이메일 없으면 고객명+회사명 조합
              </p>

              {importError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {importError}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => { resetImport(); setImportStep('upload'); }}>뒤로</Button>
                <Button onClick={handleImport} disabled={processing}>
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      처리 중...
                    </>
                  ) : '가져오기 실행'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: 결과 */}
          {importStep === 'result' && importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="font-bold text-slate-900">가져오기 완료</span>
              </div>

              {/* 요약 */}
              <div className="grid grid-cols-4 gap-2">
                {([
                  { key: 'created' as const, label: '생성', value: importResult.created, color: 'text-emerald-600' },
                  { key: 'updated' as const, label: '업데이트', value: importResult.updated, color: 'text-blue-600' },
                  { key: 'skipped' as const, label: '건너뜀', value: importResult.skipped, color: 'text-amber-600' },
                  { key: 'failed' as const, label: '실패', value: importResult.failed, color: 'text-red-600' },
                ]).map(({ key, label, value, color }) => (
                  <div key={key} className="text-center p-2 bg-white rounded-xl">
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>

              {/* 행별 상세 */}
              {importResult.rows.length > 0 && (
                <div className="max-h-60 overflow-y-auto rounded-xl bg-white">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="text-left p-2 font-medium text-slate-500">행</th>
                        <th className="text-left p-2 font-medium text-slate-500">고객명</th>
                        <th className="text-left p-2 font-medium text-slate-500">상태</th>
                        <th className="text-left p-2 font-medium text-slate-500">사유</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importResult.rows.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status];
                        return (
                          <tr key={i}>
                            <td className="p-2 text-slate-400">{r.row}</td>
                            <td className="p-2 font-medium">{r.name}</td>
                            <td className="p-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.color} ${cfg.bg}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500 max-w-[200px] truncate">{r.message || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setShowImport(false)}>닫기</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 내보내기 다이얼로그 (unchanged) */}
      <Dialog open={showExport} onOpenChange={handleExportClose}>
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
            {exportProcessing && <Progress value={exportProgress} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExport(false)}>취소</Button>
            <Button onClick={handleExport} disabled={exportProcessing}>
              {exportProcessing ? '처리 중...' : '내보내기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
