'use client';

import { useState, useMemo } from 'react';
import { useQuotationStore } from '@/stores/quotationStore';
import { Button } from '@/components/ui/button';
import { StitchCard } from '@/components/ui/StitchCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Pill,
  Syringe,
  Dna,
  FlaskConical,
  Stethoscope,
  Atom,
  Radiation,
  Microscope,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';

// 3단계 모달리티 데이터
import modalityHierarchy from '@/data/modalities_hierarchy.json';

// Level1 아이콘 매핑
const level1Icons: Record<string, React.ElementType> = {
  SM: Pill,
  BIO: FlaskConical,
  CELL: Syringe,
  GENE: Dna,
  OLIGO: Atom,
  RADIO: Radiation,
  DEVICE: Stethoscope,
  MICRO: Microscope,
  ADV: Sparkles,
};

// Level1 색상 매핑
const level1Colors: Record<string, { bg: string; text: string }> = {
  SM: { bg: 'bg-blue-50', text: 'text-blue-600' },
  BIO: { bg: 'bg-green-50', text: 'text-green-600' },
  CELL: { bg: 'bg-purple-50', text: 'text-purple-600' },
  GENE: { bg: 'bg-pink-50', text: 'text-pink-600' },
  OLIGO: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  RADIO: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  DEVICE: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  MICRO: { bg: 'bg-teal-50', text: 'text-teal-600' },
  ADV: { bg: 'bg-orange-50', text: 'text-orange-600' },
};

interface Level3 {
  level3_id: string;
  level3_name: string;
  level3_name_en: string;
}

interface Level2 {
  level2_id: string;
  level2_name: string;
  level2_name_en: string;
  level3: Level3[];
}

interface Level1 {
  level1_id: string;
  level1_name: string;
  level1_name_en: string;
  level2: Level2[];
}


export default function StepModality() {
  const { modality, setModality, nextStep, prevStep, selectedItems } =
    useQuotationStore();

  // 선택 상태
  const [selectedLevel1, setSelectedLevel1] = useState<string | null>(null);
  const [selectedLevel2, setSelectedLevel2] = useState<string | null>(null);
  const [selectedLevel3, setSelectedLevel3] = useState<string | null>(null);

  const modalities = modalityHierarchy.modalities as Level1[];

  // Level2 목록
  const level2Options = useMemo(() => {
    if (!selectedLevel1) return [];
    const level1 = modalities.find((m) => m.level1_id === selectedLevel1);
    return level1?.level2 || [];
  }, [selectedLevel1, modalities]);

  // Level3 목록
  const level3Options = useMemo(() => {
    if (!selectedLevel2) return [];
    const level1 = modalities.find((m) => m.level1_id === selectedLevel1);
    const level2 = level1?.level2.find((l) => l.level2_id === selectedLevel2);
    return level2?.level3 || [];
  }, [selectedLevel1, selectedLevel2, modalities]);

  // 선택된 모달리티 정보
  const selectedInfo = useMemo(() => {
    if (!selectedLevel1) return null;
    const level1 = modalities.find((m) => m.level1_id === selectedLevel1);
    if (!level1) return null;

    const level2 = selectedLevel2
      ? level1.level2.find((l) => l.level2_id === selectedLevel2)
      : null;
    const level3 =
      selectedLevel3 && level2
        ? level2.level3.find((l) => l.level3_id === selectedLevel3)
        : null;

    return { level1, level2, level3 };
  }, [selectedLevel1, selectedLevel2, selectedLevel3, modalities]);

  // Level1 선택
  const handleLevel1Select = (id: string) => {
    if (selectedLevel1 === id) return;
    setSelectedLevel1(id);
    setSelectedLevel2(null);
    setSelectedLevel3(null);
  };

  // Level2 선택
  const handleLevel2Select = (id: string) => {
    if (selectedLevel2 === id) return;
    setSelectedLevel2(id);
    setSelectedLevel3(null);
  };

  // Level3 선택 및 모달리티 확정
  const handleLevel3Select = (id: string) => {
    setSelectedLevel3(id);

    // 모달리티 이름 조합 (Level1 이름 사용 - 기존 시스템과 호환)
    const level1 = modalities.find((m) => m.level1_id === selectedLevel1);
    if (level1) {
      const modalityName = level1.level1_name;

      if (modality !== modalityName && selectedItems.length > 0) {
        if (
          window.confirm(
            '모달리티를 변경하면 선택한 시험 항목이 초기화됩니다. 계속하시겠습니까?'
          )
        ) {
          setModality(modalityName);
        }
      } else {
        setModality(modalityName);
      }
    }
  };

  // 색상 가져오기
  const getColors = (id: string) =>
    level1Colors[id] || {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
    };

  return (
    <StitchCard variant="surface-low" padding="lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold">의약품 유형(모달리티) 선택</h2>
        <p className="text-sm text-slate-500 mt-1">
          3단계로 의약품 유형을 선택해주세요: 대분류 → 중분류 → 소분류
        </p>
      </div>
      <div className="space-y-6">
        {/* Step 1: Level1 선택 */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
            <Badge variant="outline">1단계</Badge>
            대분류 선택
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {modalities.map((item) => {
              const isSelected = selectedLevel1 === item.level1_id;
              const Icon = level1Icons[item.level1_id] || Pill;
              const colors = getColors(item.level1_id);

              return (
                <button
                  key={item.level1_id}
                  onClick={() => handleLevel1Select(item.level1_id)}
                  className={cn(
                    'p-3 rounded-xl transition-all text-center hover:shadow-ambient',
                    isSelected
                      ? `${colors.bg} shadow-ambient`
                      : 'bg-white hover:bg-[#FFF8F1]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 mx-auto mb-2',
                      isSelected ? colors.text : 'text-slate-400'
                    )}
                  />
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isSelected ? colors.text : 'text-slate-700'
                    )}
                  >
                    {item.level1_name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>


        {/* Step 2: Level2 선택 */}
        {selectedLevel1 && level2Options.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <Badge variant="outline">2단계</Badge>
              중분류 선택
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">{selectedInfo?.level1?.level1_name}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {level2Options.map((item) => {
                const isSelected = selectedLevel2 === item.level2_id;
                const colors = getColors(selectedLevel1);

                return (
                  <button
                    key={item.level2_id}
                    onClick={() => handleLevel2Select(item.level2_id)}
                    className={cn(
                      'p-3 rounded-xl transition-all text-left hover:shadow-ambient',
                      isSelected
                        ? `${colors.bg} shadow-ambient`
                        : 'bg-white hover:bg-[#FFF8F1]'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-bold',
                        isSelected ? colors.text : 'text-slate-700'
                      )}
                    >
                      {item.level2_name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.level2_name_en}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Level3 선택 */}
        {selectedLevel2 && level3Options.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <Badge variant="outline">3단계</Badge>
              소분류 선택
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">
                {selectedInfo?.level1?.level1_name} &gt; {selectedInfo?.level2?.level2_name}
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {level3Options.map((item) => {
                const isSelected = selectedLevel3 === item.level3_id;
                const colors = getColors(selectedLevel1!);

                return (
                  <button
                    key={item.level3_id}
                    onClick={() => handleLevel3Select(item.level3_id)}
                    className={cn(
                      'p-3 rounded-xl transition-all text-left hover:shadow-ambient relative',
                      isSelected
                        ? `${colors.bg} shadow-ambient`
                        : 'bg-white hover:bg-[#FFF8F1]'
                    )}
                  >
                    {isSelected && (
                      <Check className="absolute top-2 right-2 w-4 h-4 text-green-500" />
                    )}
                    <p
                      className={cn(
                        'text-sm font-bold',
                        isSelected ? colors.text : 'text-slate-700'
                      )}
                    >
                      {item.level3_name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.level3_name_en}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 선택 결과 표시 */}
        {selectedLevel3 && selectedInfo && (
          <div className="p-4 bg-emerald-50 rounded-xl animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-emerald-800">
                모달리티 선택 완료
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Badge variant="secondary">{selectedInfo.level1?.level1_name}</Badge>
              <ChevronRight className="w-4 h-4" />
              <Badge variant="secondary">{selectedInfo.level2?.level2_name}</Badge>
              <ChevronRight className="w-4 h-4" />
              <Badge variant="default">{selectedInfo.level3?.level3_name}</Badge>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              선택한 모달리티에 맞는 시험 항목을 다음 단계에서 선택할 수 있습니다.
            </p>
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>
          <Button onClick={nextStep} disabled={!modality} className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold">
            다음: 시험 선택
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </StitchCard>
  );
}
