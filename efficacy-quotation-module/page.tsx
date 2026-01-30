'use client';

import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import EfficacyQuotationWizard from '@/components/efficacy-quotation/EfficacyQuotationWizard';
import StepBasicInfo from '@/components/efficacy-quotation/StepBasicInfo';
import StepModelSelection from '@/components/efficacy-quotation/StepModelSelection';
import StepItemConfiguration from '@/components/efficacy-quotation/StepItemConfiguration';
import StepCalculation from '@/components/efficacy-quotation/StepCalculation';
import StepPreview from '@/components/efficacy-quotation/StepPreview';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

/**
 * New Efficacy Quotation Page
 * 5-step wizard for creating efficacy quotations
 * Requirements: 1.1, 8.1, 8.2, 8.3
 */

export default function NewEfficacyQuotationPage() {
  const { currentStep, setCurrentStep, reset } = useEfficacyQuotationStore();

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleReset = () => {
    if (window.confirm('작성 중인 견적서를 초기화하시겠습니까?')) {
      reset();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo />;
      case 2:
        return <StepModelSelection />;
      case 3:
        return <StepItemConfiguration />;
      case 4:
        return <StepCalculation />;
      case 5:
        return <StepPreview />;
      default:
        return <StepBasicInfo />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="새 효력시험 견적서 작성"
        description="단계별로 효력시험 견적서를 작성합니다"
        actions={
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        }
      />

      <EfficacyQuotationWizard
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {renderStep()}
    </div>
  );
}
