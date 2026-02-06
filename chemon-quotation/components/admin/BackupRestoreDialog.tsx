'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Database, RotateCcw } from 'lucide-react';

// 복구 가능한 테이블 목록
const RESTORABLE_TABLES = [
  { id: 'users', label: '사용자 (Users)', description: '사용자 계정 정보' },
  { id: 'customers', label: '고객 (Customers)', description: '고객 정보' },
  { id: 'leads', label: '리드 (Leads)', description: '영업 리드 정보' },
  { id: 'quotations', label: '견적서 (Quotations)', description: '견적서 정보' },
  { id: 'contracts', label: '계약 (Contracts)', description: '계약 정보' },
  { id: 'studies', label: '연구 (Studies)', description: '연구 프로젝트 정보' },
  { id: 'systemSettings', label: '시스템 설정 (SystemSettings)', description: '시스템 설정 값' },
  { id: 'pipelineStages', label: '파이프라인 단계 (PipelineStages)', description: '영업 파이프라인 단계' },
  { id: 'stageTasks', label: '단계 작업 (StageTasks)', description: '파이프라인 단계별 작업' },
] as const;

export interface RestoreOptions {
  tables?: string[];
  dryRun?: boolean;
}

interface BackupRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupFilename: string;
  backupDate: string;
  onConfirm: (options: RestoreOptions) => void;
  isRestoring?: boolean;
}

/**
 * 복구 확인 다이얼로그 컴포넌트
 * Requirements: 1.3.2 - 복구 전 확인 다이얼로그 표시 (경고 메시지 포함)
 * Requirements: 1.3.3 - 테이블별 선택적 복구 옵션 제공
 */
export default function BackupRestoreDialog({
  open,
  onOpenChange,
  backupFilename,
  backupDate,
  onConfirm,
  isRestoring = false,
}: BackupRestoreDialogProps) {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedTables(RESTORABLE_TABLES.map((t) => t.id));
    } else {
      setSelectedTables([]);
    }
  };

  const handleTableToggle = (tableId: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedTables, tableId];
      setSelectedTables(newSelected);
      setSelectAll(newSelected.length === RESTORABLE_TABLES.length);
    } else {
      const newSelected = selectedTables.filter((id) => id !== tableId);
      setSelectedTables(newSelected);
      setSelectAll(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      tables: selectedTables.length > 0 ? selectedTables : undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when dialog closes
      setSelectedTables([]);
      setSelectAll(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            백업 복구 확인
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* 경고 메시지 */}
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">주의: 이 작업은 되돌릴 수 없습니다!</p>
                  <p className="mt-1">
                    선택한 테이블의 현재 데이터가 백업 시점의 데이터로 대체됩니다.
                    복구 전에 현재 데이터를 백업하는 것을 권장합니다.
                  </p>
                </div>
              </div>

              {/* 백업 정보 */}
              <div className="rounded-lg bg-gray-50 border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">백업 파일:</span>
                  <span className="text-muted-foreground">{backupFilename}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1 ml-6">
                  생성일: {backupDate}
                </div>
              </div>

              {/* 테이블 선택 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">복구할 테이블 선택</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    />
                    <Label htmlFor="select-all" className="text-sm cursor-pointer">
                      전체 선택
                    </Label>
                  </div>
                </div>
                
                <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-2">
                  {RESTORABLE_TABLES.map((table) => (
                    <div
                      key={table.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={table.id}
                        checked={selectedTables.includes(table.id)}
                        onCheckedChange={(checked) =>
                          handleTableToggle(table.id, checked === true)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={table.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {table.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {table.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedTables.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    * 테이블을 선택하지 않으면 모든 테이블이 복구됩니다.
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRestoring}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRestoring}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isRestoring ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                복구 중...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                복구 시작
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
