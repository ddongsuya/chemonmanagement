'use client';

import { useState } from 'react';
import { useQuotationStore } from '@/stores/quotationStore';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import QuotationWizard from '@/components/quotation/QuotationWizard';
import EfficacyQuotationWizard from '@/components/efficacy-quotation/EfficacyQuotationWizard';
import StepBasicInfo from '@/components/quotation/StepBasicInfo';
import StepTestSelectionNew from '@/components/quotation/StepTestSelectionNew';
import StepCalculation from '@/components/quotation/StepCalculation';
import StepPreview from '@/components/quotation/StepPreview';
import EfficacyStepBasicInfo from '@/components/efficacy-quotation/StepBasicInfo';
import EfficacyStepModelSelection from '@/components/efficacy-quotation/StepModelSelection';
import EfficacyStepItemConfiguration from '@/components/efficacy-quotation/StepItemConfiguration';
import EfficacyStepStudyDesign from '@/components/efficacy-quotation/StepStudyDesign';
import EfficacyStepCalculation from '@/components/efficacy-quotation/StepCalculation';
import EfficacyStepPreview from '@/components/efficacy-quotation/StepPreview';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, FlaskConical, Microscope, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuotationType = 'toxicity' | 'efficacy' | null;

export default function NewQuotationPage() {
  const [quotationType, setQuotationType] = useState<QuotationType>(null);
  
  const toxicityStore = useQuotationStore();
  const efficacyStore = useEfficacyQuotationStore();

  const handleStepClick = (step: number) => {
    if (quotationType === 'toxicity' && step < toxicityStore.currentStep) {
      toxicityStore.setCurrentStep(step);
    } else if (quotationType === 'efficacy' && step < efficacyStore.currentStep) {
      efficacyStore.setCurrentStep(step);
    }
  };

  const handleReset = () => {
    if (window.confirm('작성 중인 견적서를 초기화하시겠습니까?')) {
      if (quotationType === 'toxicity') {
        toxicityStore.reset();
      } else if (quotationType === 'efficacy') {
        efficacyStore.reset();
      }
    }
  };

  const handleBack = () => {
    if (window.confirm('견적서 유형 선택으로 돌아가시겠습니까? 작성 중인 내용이 초기화됩니다.')) {
      if (quotationType === 'toxicity') {
        toxicityStore.reset();
      } else if (quotationType === 'efficacy') {
        efficacyStore.reset();
      }
      setQuotationType(null);
    }
  };

  const renderToxicityStep = () => {
    switch (toxicityStore.currentStep) {
      case 1:
        return <StepBasicInfo />;
      case 2:
        return <StepTestSelectionNew />;
      case 3:
        return <StepCalculation />;
      case 4:
        return <StepPreview />;
      default:
        return <StepBasicInfo />;
    }
  };

  const renderEfficacyStep = () => {
    switch (efficacyStore.currentStep) {
      case 1:
        return <EfficacyStepBasicInfo />;
      case 2:
        return <EfficacyStepModelSelection />;
      case 3:
        return <EfficacyStepItemConfiguration />;
      case 4:
        return <EfficacyStepStudyDesign />;
      case 5:
        return <EfficacyStepCalculation />;
      case 6:
        return <EfficacyStepPreview />;
      default:
        return <EfficacyStepBasicInfo />;
    }
  };

  // 유형 선택 화면
  if (!quotationType) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="새 견적서 작성"
          description="견적서 유형을 선택해주세요"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* 독성시험 카드 */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
              'border-2 border-transparent hover:border-blue-400/50',
              'bg-gradient-to-br from-blue-50 to-cyan-50'
            )}
            onClick={() => setQuotationType('toxicity')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <FlaskConical className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">독성시험 견적서</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                GLP 독성시험 관련 견적서를 작성합니다.<br />
                모달리티 선택, 시험항목 구성, 가격 산출까지<br />
                단계별로 진행됩니다.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">단회투여</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">반복투여</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">유전독성</span>
              </div>
            </CardContent>
          </Card>

          {/* 효력시험 카드 */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
              'border-2 border-transparent hover:border-emerald-400/50',
              'bg-gradient-to-br from-emerald-50 to-teal-50'
            )}
            onClick={() => setQuotationType('efficacy')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Microscope className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">효력시험 견적서</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                효력시험 관련 견적서를 작성합니다.<br />
                모델 선택, 항목 구성, 가격 산출까지<br />
                단계별로 진행됩니다.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">동물모델</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">세포모델</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">분석항목</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 독성시험 견적서 작성
  if (quotationType === 'toxicity') {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="독성시험 견적서 작성"
          description="단계별로 독성시험 견적서를 작성합니다"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                유형 선택
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                초기화
              </Button>
            </div>
          }
        />

        <QuotationWizard currentStep={toxicityStore.currentStep} onStepClick={handleStepClick} />

        {renderToxicityStep()}
      </div>
    );
  }

  // 효력시험 견적서 작성
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="효력시험 견적서 작성"
        description="단계별로 효력시험 견적서를 작성합니다"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              유형 선택
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              초기화
            </Button>
          </div>
        }
      />

      <EfficacyQuotationWizard
        currentStep={efficacyStore.currentStep}
        onStepClick={handleStepClick}
      />

      {renderEfficacyStep()}
    </div>
  );
}
