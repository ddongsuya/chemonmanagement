'use client';

import { useQuery } from '@tanstack/react-query';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import EfficacyQuotationWizard from '@/components/efficacy-quotation/EfficacyQuotationWizard';
import StepBasicInfo from '@/components/efficacy-quotation/StepBasicInfo';
import StepModelSelection from '@/components/efficacy-quotation/StepModelSelection';
import StepItemConfiguration from '@/components/efficacy-quotation/StepItemConfiguration';
import StepCalculation from '@/components/efficacy-quotation/StepCalculation';
import StepPreview from '@/components/efficacy-quotation/StepPreview';
import PageHeader from '@/components/layout/PageHeader';
import { QuotationCodeGuard } from '@/components/quotation/QuotationCodeGuard';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';
import { getUserSettings } from '@/lib/package-api';

/**
 * New Efficacy Quotation Page
 * 5-step wizard for creating efficacy quotations
 * Requirements: 1.1, 5.1, 8.1, 8.2, 8.3
 */

export default function NewEfficacyQuotationPage() {
  const { currentStep, setCurrentStep, reset } = useEfficacyQuotationStore();

  // useQuery로 사용자 설정 조회 (캐시 공유)
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    retry: 2,
  });

  // userCode 추출
  const userCode = settingsResponse?.success && settingsResponse.data?.userCode?.trim()
    ? settingsResponse.data.userCode
    : undefined;

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

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <QuotationCodeGuard userCode={userCode} quotationType="EFFICACY">
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
    </QuotationCodeGuard>
  );
}
