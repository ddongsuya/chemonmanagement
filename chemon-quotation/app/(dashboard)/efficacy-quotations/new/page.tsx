'use client';

import { useQuery } from '@tanstack/react-query';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import ModelSelector from '@/components/efficacy-quotation/ModelSelector';
import StudyDesigner from '@/components/efficacy-quotation/StudyDesigner';
import CostCalculator from '@/components/efficacy-quotation/CostCalculator';
import QuotationPreview from '@/components/efficacy-quotation/QuotationPreview';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import { QuotationCodeGuard } from '@/components/quotation/QuotationCodeGuard';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';
import { getUserSettings } from '@/lib/package-api';

const TABS = ['모델 선택', '시험 디자인', '비용 계산', '견적서'] as const;

export default function NewEfficacyQuotationPage() {
  const { currentTab, setTab, selectedModel, reset } = useEfficacyQuotationStore();

  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const userCode = settingsResponse?.success && settingsResponse.data?.userCode?.trim()
    ? settingsResponse.data.userCode
    : undefined;

  const handleReset = () => {
    if (window.confirm('작성 중인 견적서를 초기화하시겠습니까?')) {
      reset();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <QuotationCodeGuard userCode={userCode} quotationType="EFFICACY">
      <div className="max-w-[1400px] mx-auto">
        <StitchPageHeader
          label="EFFICACY QUOTATION V2"
          title="비임상 효력시험 견적 시스템"
          description="코아스템켐온 신약개발지원본부"
          actions={
            <div className="flex items-center gap-2">
              {selectedModel && (
                <span className="px-2.5 py-0.5 border border-blue-200 text-blue-700 text-[10px] font-medium rounded">
                  {selectedModel.category}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleReset} className="bg-white border-border rounded-lg font-semibold">
                <RotateCcw className="w-4 h-4 mr-2" />
                초기화
              </Button>
            </div>
          }
        />

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mt-4 mb-5">
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              disabled={i > 0 && !selectedModel}
              className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${
                currentTab === i ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              } ${i > 0 && !selectedModel ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded text-[9px] flex items-center justify-center font-semibold"
                  style={{
                    background: currentTab === i ? '#3b82f6' : '#e5e7eb',
                    color: currentTab === i ? '#fff' : '#9ca3af',
                  }}
                >
                  {i + 1}
                </span>
                {t}
              </span>
              {currentTab === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {currentTab === 0 && <ModelSelector />}
          {currentTab === 1 && <StudyDesigner />}
          {currentTab === 2 && <CostCalculator />}
          {currentTab === 3 && <QuotationPreview />}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
          <span>
            {selectedModel
              ? `${selectedModel.title} | ${useEfficacyQuotationStore.getState().groups.reduce((s, g) => s + g.animalCount, 0)}마리 | ${Math.ceil(useEfficacyQuotationStore.getState().scheduleSteps.reduce((s, st) => s + (st.durationUnit === 'week' ? st.duration * 7 : st.durationUnit === 'day' ? st.duration : 1), 0) / 7)}주`
              : '시험 모델을 선택하세요'}
          </span>
          {selectedModel && (
            <span className="font-medium text-gray-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {(useEfficacyQuotationStore.getState().totalCost ?? 0).toLocaleString('ko-KR')}원
            </span>
          )}
        </div>
      </div>
    </QuotationCodeGuard>
  );
}
