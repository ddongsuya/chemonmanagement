'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import {
  Check,
  ChevronRight,
  AlertTriangle,
  ListChecks,
  Clock,
} from 'lucide-react';
import { ProgressStage, ChecklistItem } from '@/types/customer';
import {
  STAGE_LABELS,
  WorkflowStage,
  updateChecklist,
  advanceToNextStage,
  getNextStage,
  isStageChecklistComplete,
} from '@/lib/progress-stage-storage';
import { cn } from '@/lib/utils';

interface WorkflowChecklistProps {
  progressStage: ProgressStage;
  selectedStage?: WorkflowStage;
  onUpdate?: (updatedProgress: ProgressStage) => void;
  className?: string;
}

export default function WorkflowChecklist({
  progressStage,
  selectedStage,
  onUpdate,
  className,
}: WorkflowChecklistProps) {
  const [showForceAdvanceDialog, setShowForceAdvanceDialog] = useState(false);
  const [advanceWarning, setAdvanceWarning] = useState<string>('');

  // 표시할 단계 (선택된 단계 또는 현재 단계)
  const displayStage = selectedStage || progressStage.current_stage;
  const isCurrentStage = displayStage === progressStage.current_stage;

  // 해당 단계의 체크리스트 필터링
  const stageChecklist = progressStage.checklist.filter(
    (item) => item.stage === displayStage
  );

  // 완료된 항목 수
  const completedCount = stageChecklist.filter((item) => item.is_completed).length;
  const totalCount = stageChecklist.length;
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  // 다음 단계 정보
  const nextStage = getNextStage(progressStage.current_stage);

  // 체크리스트 항목 토글 - Requirements 4.3
  const handleChecklistToggle = (item: ChecklistItem) => {
    if (!isCurrentStage) return; // 현재 단계만 수정 가능

    const updatedProgress = updateChecklist(
      progressStage.id,
      item.id,
      !item.is_completed,
      'current_user' // 실제로는 로그인된 사용자 정보 사용
    );

    if (updatedProgress) {
      onUpdate?.(updatedProgress);
    }
  };

  // 다음 단계로 진행 시도 - Requirements 4.4, 4.5
  const handleAdvanceStage = () => {
    const result = advanceToNextStage(progressStage.id, false);

    if (result.success && result.progress) {
      onUpdate?.(result.progress);
    } else if (result.warning) {
      setAdvanceWarning(result.warning);
      setShowForceAdvanceDialog(true);
    }
  };

  // 강제 진행 - Requirements 4.5
  const handleForceAdvance = () => {
    const result = advanceToNextStage(progressStage.id, true);

    if (result.success && result.progress) {
      onUpdate?.(result.progress);
    }
    setShowForceAdvanceDialog(false);
  };

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg">
                {STAGE_LABELS[displayStage]} 체크리스트
              </CardTitle>
            </div>
            <Badge
              variant={isAllComplete ? 'default' : 'secondary'}
              className={cn(isAllComplete && 'bg-green-500')}
            >
              {completedCount} / {totalCount}
            </Badge>
          </div>
          {!isCurrentStage && (
            <p className="text-sm text-gray-500 mt-1">
              이전 단계의 체크리스트입니다. (읽기 전용)
            </p>
          )}
        </CardHeader>
        <CardContent>
          {stageChecklist.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ListChecks className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>체크리스트 항목이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stageChecklist.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    item.is_completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300',
                    !isCurrentStage && 'opacity-70'
                  )}
                >
                  <Checkbox
                    id={item.id}
                    checked={item.is_completed}
                    onCheckedChange={() => handleChecklistToggle(item)}
                    disabled={!isCurrentStage}
                    className={cn(
                      'mt-0.5',
                      item.is_completed && 'data-[state=checked]:bg-green-500'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={item.id}
                      className={cn(
                        'block font-medium cursor-pointer',
                        item.is_completed && 'text-green-700 line-through'
                      )}
                    >
                      {item.title}
                    </label>
                    {item.description && (
                      <p
                        className={cn(
                          'text-sm mt-0.5',
                          item.is_completed ? 'text-green-600' : 'text-gray-500'
                        )}
                      >
                        {item.description}
                      </p>
                    )}
                    {item.is_completed && item.completed_at && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(item.completed_at)}</span>
                      </div>
                    )}
                  </div>
                  {item.is_completed && (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 다음 단계 진행 버튼 - Requirements 4.4 */}
          {isCurrentStage && nextStage && (
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={handleAdvanceStage}
                className="w-full"
                variant={isAllComplete ? 'default' : 'outline'}
              >
                {isAllComplete ? (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    다음 단계로 진행 ({STAGE_LABELS[nextStage]})
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    체크리스트 미완료 ({completedCount}/{totalCount})
                  </>
                )}
              </Button>
              {!isAllComplete && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  모든 체크리스트를 완료하면 다음 단계로 진행할 수 있습니다.
                </p>
              )}
            </div>
          )}

          {/* 마지막 단계 완료 표시 */}
          {isCurrentStage && !nextStage && (
            <div className="mt-6 pt-4 border-t">
              <div className="text-center py-4 bg-green-50 rounded-lg">
                <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium text-green-700">마지막 단계입니다</p>
                <p className="text-sm text-green-600 mt-1">
                  모든 워크플로우가 완료되었습니다.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 강제 진행 확인 다이얼로그 - Requirements 4.5 */}
      <AlertDialog
        open={showForceAdvanceDialog}
        onOpenChange={setShowForceAdvanceDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              체크리스트 미완료
            </AlertDialogTitle>
            <AlertDialogDescription>
              {advanceWarning}
              <br />
              <br />
              미완료 항목이 있는 상태에서 다음 단계로 진행하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceAdvance}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              강제 진행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
