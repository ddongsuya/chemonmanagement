'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuotationStore } from '@/stores/quotationStore';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import type { TestMode } from '@/types/toxicity-v2';
import ModeSelector from './ModeSelector';
import V2TestSelector from './V2TestSelector';
import TestRelationPanel from './TestRelationPanel';
import PreviewPanel from './PreviewPanel';

/**
 * ToxicityV2Step
 *
 * 독성시험 견적서 위자드 Step 2(시험선택)에서 v2 모드 선택 + 시험 선택 + 미리보기 패널을 통합하는 래퍼 컴포넌트.
 *
 * 흐름:
 * 1. 모드 미선택 → ModeSelector 표시
 * 2. 모드 선택 후 → V2TestSelector + TestRelationPanel (좌측) + PreviewPanel (우측/하단)
 *
 * Requirements: 18.4, 18.5
 */
export default function ToxicityV2Step() {
  const { nextStep, prevStep } = useQuotationStore();
  const mode = useToxicityV2Store((s) => s.mode);
  const setMode = useToxicityV2Store((s) => s.setMode);
  const selectedTests = useToxicityV2Store((s) => s.selectedTests);

  const handleModeSelect = useCallback(
    (selected: TestMode) => {
      setMode(selected);
    },
    [setMode],
  );

  const handleModeReset = useCallback(() => {
    setMode(null);
  }, [setMode]);

  // 모드 미선택 → ModeSelector
  if (!mode) {
    return (
      <div className="space-y-6">
        <ModeSelector onModeSelect={handleModeSelect} />

        {/* 이전 버튼 */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" /> 이전
          </Button>
        </div>
      </div>
    );
  }

  // 모드 선택 후 → 시험 선택 + 미리보기 레이아웃
  return (
    <div className="space-y-4">
      {/* 모드 변경 버튼 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleModeReset}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          모드 변경
        </Button>
        <span className="text-sm text-muted-foreground">
          {MODE_LABELS[mode] ?? mode}
        </span>
      </div>

      {/* 데스크톱: 좌측(시험선택+관계패널) + 우측(미리보기) / 모바일: 세로 스택 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 좌측: 시험 선택 + 관계 패널 */}
        <div className="flex-1 min-w-0 space-y-4">
          <V2TestSelector />
          <TestRelationPanel />
        </div>

        {/* 우측: 미리보기 패널 (데스크톱에서 고정 너비) */}
        <div className="w-full lg:w-[400px] lg:min-h-[600px] shrink-0">
          <PreviewPanel />
        </div>
      </div>

      {/* 위자드 네비게이션 */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={prevStep} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> 이전
        </Button>
        <Button
          onClick={nextStep}
          className="flex-1"
          disabled={selectedTests.length === 0}
        >
          검토/계산 <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/** 모드별 한글 라벨 */
const MODE_LABELS: Record<TestMode, string> = {
  drug_single: '의약품',
  drug_combo: '복합제',
  drug_vaccine: '백신',
  drug_screen_tox: '독성 스크리닝',
  drug_screen_cv: '심혈관계 스크리닝',
  hf_indv: '건기식 (개별인정형)',
  hf_prob: '건기식 (프로바이오틱스)',
  hf_temp: '건기식 (한시적식품)',
  md_bio: '의료기기 (생물학적안전성)',
};
