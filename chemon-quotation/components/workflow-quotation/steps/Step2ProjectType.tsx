'use client';

import { ChevronLeft, ChevronRight, Package, FlaskConical, TestTube, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWorkflowQuotationStore } from '@/stores/workflowQuotationStore';
import type { ProjectType, ClinicalPhase } from '@/types/workflow-quotation';

const projectTypes = [
  {
    id: 'ind_package' as ProjectType,
    name: 'IND 패키지',
    description: 'IND 신청을 위한 전체 비임상시험 패키지',
    icon: Package,
    recommended: true,
  },
  {
    id: 'single_test' as ProjectType,
    name: '개별 시험',
    description: '필요한 시험만 개별 선택',
    icon: FlaskConical,
  },
  {
    id: 'drf_only' as ProjectType,
    name: 'DRF만',
    description: '용량결정시험(DRF)만 진행',
    icon: TestTube,
  },
  {
    id: 'phase_extension' as ProjectType,
    name: '임상단계 확장',
    description: '기존 IND 이후 추가 시험',
    icon: ArrowUpRight,
  },
];

const clinicalPhases = [
  { id: 'PHASE1' as ClinicalPhase, name: 'Phase 1', description: '최초 인체 투여' },
  { id: 'PHASE2' as ClinicalPhase, name: 'Phase 2', description: '탐색적 임상' },
  { id: 'PHASE3' as ClinicalPhase, name: 'Phase 3', description: '확증적 임상' },
  { id: 'NDA' as ClinicalPhase, name: 'NDA', description: '시판 허가' },
];

export function Step2ProjectType() {
  const {
    selectedModality,
    projectType,
    targetPhase,
    setProjectType,
    setStep,
  } = useWorkflowQuotationStore();

  const handleProjectTypeSelect = (type: ProjectType) => {
    setProjectType(type, targetPhase || undefined);
  };

  const handlePhaseSelect = (phase: ClinicalPhase) => {
    setProjectType(projectType!, phase);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleNext = () => {
    if (projectType) {
      setStep(3);
    }
  };

  const needsPhaseSelection = projectType === 'ind_package' || projectType === 'phase_extension';

  return (
    <div className="space-y-6">
      {/* 선택된 모달리티 표시 */}
      {selectedModality && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">선택된 모달리티</p>
          <p className="font-medium">
            {selectedModality.level1_name} &gt; {selectedModality.level2_name} &gt;{' '}
            {selectedModality.level3_name}
          </p>
        </div>
      )}

      {/* 프로젝트 유형 선택 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">프로젝트 유형을 선택해주세요</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                  projectType === type.id && 'border-primary bg-primary/5'
                )}
                onClick={() => handleProjectTypeSelect(type.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {type.name}
                    {type.recommended && (
                      <Badge variant="secondary" className="ml-auto">
                        추천
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{type.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>


      {/* 임상 단계 선택 (IND 패키지 또는 임상단계 확장 시) */}
      {needsPhaseSelection && projectType && (
        <div className="pt-4 border-t">
          <h3 className="text-md font-semibold mb-4">목표 임상 단계를 선택해주세요</h3>
          <RadioGroup
            value={targetPhase || ''}
            onValueChange={(value) => handlePhaseSelect(value as ClinicalPhase)}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {clinicalPhases.map((phase) => (
              <div key={phase.id}>
                <RadioGroupItem
                  value={phase.id}
                  id={phase.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={phase.id}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
                  )}
                >
                  <span className="font-semibold">{phase.name}</span>
                  <span className="text-xs text-muted-foreground">{phase.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={!projectType || (needsPhaseSelection && !targetPhase)}
        >
          다음 단계
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
