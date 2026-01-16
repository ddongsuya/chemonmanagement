'use client';

import { useWorkflowQuotationStore } from '@/stores/workflowQuotationStore';
import { Step1ModalitySelector } from './steps/Step1ModalitySelector';
import { Step2ProjectType } from './steps/Step2ProjectType';
import { Step3TestSelection } from './steps/Step3TestSelection';
import { Step4ReviewConfirm } from './steps/Step4ReviewConfirm';
import { WorkflowProgress } from './shared/WorkflowProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const stepTitles = {
  1: '모달리티 선택',
  2: '프로젝트 유형',
  3: '시험 선택',
  4: '검토 및 확인',
};

export function WorkflowQuotationWizard() {
  const { currentStep, reset } = useWorkflowQuotationStore();

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <span className="text-2xl">워크플로우 기반 견적 작성</span>
              <span className="ml-4 text-sm font-normal text-muted-foreground">
                Step {currentStep}: {stepTitles[currentStep]}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              초기화
            </Button>
          </CardTitle>
          <WorkflowProgress currentStep={currentStep} />
        </CardHeader>
        <CardContent className="pt-6">
          {currentStep === 1 && <Step1ModalitySelector />}
          {currentStep === 2 && <Step2ProjectType />}
          {currentStep === 3 && <Step3TestSelection />}
          {currentStep === 4 && <Step4ReviewConfirm />}
        </CardContent>
      </Card>
    </div>
  );
}
