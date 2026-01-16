'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Check,
  ChevronRight,
  Circle,
  MessageSquare,
  FileText,
  ClipboardList,
  FileSignature,
  FlaskConical,
  Settings,
  Wallet,
} from 'lucide-react';
import { ProgressStage } from '@/types/customer';
import {
  WORKFLOW_STAGES,
  STAGE_LABELS,
  WorkflowStage,
  getStageIndex,
  isStageChecklistComplete,
} from '@/lib/progress-stage-storage';
import { cn } from '@/lib/utils';

interface ProgressWorkflowProps {
  progressStage: ProgressStage | null;
  onStageClick?: (stage: WorkflowStage) => void;
  className?: string;
}

// 단계별 아이콘 매핑
const STAGE_ICONS: Record<WorkflowStage, React.ReactNode> = {
  inquiry: <MessageSquare className="w-4 h-4" />,
  quotation_sent: <FileText className="w-4 h-4" />,
  test_request: <ClipboardList className="w-4 h-4" />,
  contract_signed: <FileSignature className="w-4 h-4" />,
  test_reception: <FlaskConical className="w-4 h-4" />,
  test_management: <Settings className="w-4 h-4" />,
  fund_management: <Wallet className="w-4 h-4" />,
};

export default function ProgressWorkflow({
  progressStage,
  onStageClick,
  className,
}: ProgressWorkflowProps) {
  const currentStageIndex = useMemo(() => {
    if (!progressStage) return -1;
    return getStageIndex(progressStage.current_stage);
  }, [progressStage]);

  // 각 단계의 상태 계산
  const stageStatuses = useMemo(() => {
    if (!progressStage) {
      return WORKFLOW_STAGES.map(() => ({
        isCompleted: false,
        isCurrent: false,
        isUpcoming: true,
        checklistComplete: false,
      }));
    }

    return WORKFLOW_STAGES.map((stage, index) => {
      const isCompleted = index < currentStageIndex;
      const isCurrent = index === currentStageIndex;
      const isUpcoming = index > currentStageIndex;
      const checklistComplete = isStageChecklistComplete(progressStage.id, stage);

      return {
        isCompleted,
        isCurrent,
        isUpcoming,
        checklistComplete,
      };
    });
  }, [progressStage, currentStageIndex]);

  if (!progressStage) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">진행 단계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Circle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>진행 단계 정보가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">진행 단계</CardTitle>
          <Badge variant="outline" className="text-xs">
            {currentStageIndex + 1} / {WORKFLOW_STAGES.length} 단계
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* 프로그레스 바 */}
        <div className="relative">
          {/* 연결선 */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `${(currentStageIndex / (WORKFLOW_STAGES.length - 1)) * 100}%`,
            }}
          />

          {/* 단계 노드들 */}
          <TooltipProvider>
            <div className="relative flex justify-between">
              {WORKFLOW_STAGES.map((stage, index) => {
                const status = stageStatuses[index];
                const label = STAGE_LABELS[stage];
                const icon = STAGE_ICONS[stage];

                return (
                  <Tooltip key={stage}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 h-auto min-w-0',
                          'hover:bg-transparent focus:bg-transparent',
                          status.isCurrent && 'scale-110'
                        )}
                        onClick={() => onStageClick?.(stage)}
                      >
                        {/* 원형 노드 */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            'border-2 transition-all duration-300',
                            status.isCompleted && 'bg-primary border-primary text-white',
                            status.isCurrent && 'bg-white border-primary text-primary ring-4 ring-primary/20',
                            status.isUpcoming && 'bg-gray-100 border-gray-300 text-gray-400'
                          )}
                        >
                          {status.isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            icon
                          )}
                        </div>

                        {/* 라벨 */}
                        <span
                          className={cn(
                            'text-xs font-medium text-center whitespace-nowrap',
                            'max-w-[60px] truncate',
                            status.isCompleted && 'text-primary',
                            status.isCurrent && 'text-primary font-semibold',
                            status.isUpcoming && 'text-gray-400'
                          )}
                        >
                          {label}
                        </span>

                        {/* 체크리스트 완료 표시 */}
                        {status.isCurrent && status.checklistComplete && (
                          <Badge
                            variant="default"
                            className="text-[10px] px-1.5 py-0 h-4 bg-green-500"
                          >
                            완료
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">{label}</p>
                        <p className="text-xs text-gray-400">
                          {status.isCompleted && '완료됨'}
                          {status.isCurrent && (status.checklistComplete ? '체크리스트 완료' : '진행 중')}
                          {status.isUpcoming && '대기 중'}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* 현재 단계 정보 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {STAGE_ICONS[progressStage.current_stage]}
            </div>
            <div>
              <p className="text-sm text-gray-500">현재 단계</p>
              <p className="font-semibold">{STAGE_LABELS[progressStage.current_stage]}</p>
            </div>
          </div>
          
          {currentStageIndex < WORKFLOW_STAGES.length - 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
              <ChevronRight className="w-4 h-4" />
              <span>다음 단계: {STAGE_LABELS[WORKFLOW_STAGES[currentStageIndex + 1]]}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
