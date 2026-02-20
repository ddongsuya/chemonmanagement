'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { exportData, importData, importQuotationsLegacy, getTemplate, getLegacyTemplate, downloadFile, ExportType, ExportFilters } from '@/lib/excel-api';

interface ExcelImportExportProps {
  defaultType?: ExportType;
  onImportSuccess?: () => void;
}

type ImportMode = 'standard' | 'legacy';

const typeLabels: Record<ExportType, string> = {
  leads: '리드',
  quotations: '견적서',
  contracts: '계약',
  studies: '시험',
  customers: '고객',
};

export default function ExcelImportExport({ defaultType, onImportSuccess }: ExcelImportExportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<ExportType>(defaultType || 'leads');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('standard');
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: Array<{ row: number; message: string }> } | null>(null);

  // 내보내기
  const handleExport = async () => {
    setLoading(true);
    try {
      const filters: ExportFilters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await exportData(selectedType, filters);
      downloadFile(result.downloadUrl, result.filename);
      
      toast({ title: '내보내기 완료', description: `${typeLabels[selectedType]} 데이터가 다운로드되었습니다.` });
      setExportOpen(false);
    } catch (error: any) {
      toast({ title: '내보내기 실패', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 다운로드
  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
      const result = importMode === 'legacy'
        ? await getLegacyTemplate()
        : await getTemplate(selectedType);
      downloadFile(result.downloadUrl, result.filename);
      toast({ title: '템플릿 다운로드 완료' });
    } catch (error: any) {
      toast({ title: '템플릿 다운로드 실패', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // 가져오기
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportResult(null);
    try {
      const result = importMode === 'legacy'
        ? await importQuotationsLegacy(file)
        : await importData(selectedType, file);
      setImportResult(result);
      
      if (result.success > 0) {
        toast({ 
          title: '가져오기 완료', 
          description: `${result.success}건 성공${result.failed > 0 ? `, ${result.failed}건 실패` : ''}` 
        });
        onImportSuccess?.();
      } else {
        toast({ title: '가져오기 실패', description: '모든 데이터 가져오기에 실패했습니다.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: '가져오기 실패', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      {/* 내보내기 다이얼로그 */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Excel 내보내기
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              데이터 내보내기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>데이터 유형</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ExportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일 (선택)</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>종료일 (선택)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleExport} disabled={loading} className="w-full">
              {loading ? '처리 중...' : 'Excel 다운로드'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 가져오기 다이얼로그 */}
      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) setImportResult(null); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Excel 가져오기
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              데이터 가져오기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>가져오기 방식</Label>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">표준 양식</SelectItem>
                  <SelectItem value="legacy">기존 엑셀 양식 (견적서)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importMode === 'standard' && (
              <div className="space-y-2">
                <Label>데이터 유형</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ExportType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).filter(([key]) => key !== 'studies').map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {importMode === 'legacy' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">기존 엑셀 양식 헤더:</p>
                <p className="text-xs">견적 송부 날짜 | 견적서 번호 | 계약번호 | 시험기준 | 견적명 | 의뢰기관 | 의뢰자 | 의뢰자 연락처 | 의뢰자 e-mail | 제출용도 | 물질종류 | 담당자 | 견적금액 | 할인율 | 계약금액 | 결론</p>
                <p className="mt-1 text-xs">견적서 + 고객 + 계약이 자동으로 생성됩니다.</p>
              </div>
            )}

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                1. 먼저 템플릿을 다운로드하여 양식을 확인하세요.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                2. 템플릿에 맞게 데이터를 입력한 후 업로드하세요.
              </p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                템플릿 다운로드
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Excel 파일 선택</Label>
              <Input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={loading} />
              <p className="text-xs text-gray-500">.xlsx, .xls 파일만 지원 (최대 10MB)</p>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">데이터 처리 중...</p>
              </div>
            )}

            {importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{importResult.success}건 성공</span>
                  </div>
                  {importResult.failed > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">{importResult.failed}건 실패</span>
                    </div>
                  )}
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                    <p className="text-sm font-medium text-red-600 mb-2">오류 상세:</p>
                    {importResult.errors.slice(0, 10).map((err, idx) => (
                      <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                        행 {err.row}: {err.message}
                      </p>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-xs text-gray-500 mt-1">... 외 {importResult.errors.length - 10}건</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
