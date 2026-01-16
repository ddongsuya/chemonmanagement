'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  modalityData,
  getModalityLevel1,
  getModalityLevel2,
} from '@/lib/quotation/modality-data';
import { useWorkflowQuotationStore } from '@/stores/workflowQuotationStore';
import type { SelectedModality } from '@/types/workflow-quotation';

type SelectionLevel = 'level1' | 'level2' | 'level3';

export function Step1ModalitySelector() {
  const { selectedModality, setModality, setStep } = useWorkflowQuotationStore();

  const [currentLevel, setCurrentLevel] = useState<SelectionLevel>('level1');
  const [selectedLevel1, setSelectedLevel1] = useState<string | null>(
    selectedModality?.level1 || null
  );
  const [selectedLevel2, setSelectedLevel2] = useState<string | null>(
    selectedModality?.level2 || null
  );
  const [selectedLevel3, setSelectedLevel3] = useState<string | null>(
    selectedModality?.level3 || null
  );

  // Level 1 선택
  const handleLevel1Select = (level1Id: string) => {
    setSelectedLevel1(level1Id);
    setSelectedLevel2(null);
    setSelectedLevel3(null);
    setCurrentLevel('level2');
  };

  // Level 2 선택
  const handleLevel2Select = (level2Id: string) => {
    setSelectedLevel2(level2Id);
    setSelectedLevel3(null);
    setCurrentLevel('level3');
  };

  // Level 3 선택 및 완료
  const handleLevel3Select = (level3Id: string) => {
    setSelectedLevel3(level3Id);

    // 선택 완료 - 스토어에 저장
    const level1 = getModalityLevel1(selectedLevel1!);
    const level2 = getModalityLevel2(selectedLevel1!, selectedLevel2!);
    const level3 = level2?.level3.find((l) => l.level3_id === level3Id);

    if (level1 && level2 && level3) {
      const modality: SelectedModality = {
        level1: level1.level1_id,
        level1_name: level1.level1_name,
        level2: level2.level2_id,
        level2_name: level2.level2_name,
        level3: level3.level3_id,
        level3_name: level3.level3_name,
      };
      setModality(modality);
    }
  };

  // 뒤로가기
  const handleBack = () => {
    if (currentLevel === 'level2') {
      setCurrentLevel('level1');
      setSelectedLevel1(null);
    } else if (currentLevel === 'level3') {
      setCurrentLevel('level2');
      setSelectedLevel2(null);
    }
  };

  // 다음 단계로
  const handleNext = () => {
    if (selectedModality) {
      setStep(2);
    }
  };

  // 현재 선택된 Level 1 데이터
  const currentLevel1Data = selectedLevel1
    ? getModalityLevel1(selectedLevel1)
    : null;

  // 현재 선택된 Level 2 데이터
  const currentLevel2Data =
    selectedLevel1 && selectedLevel2
      ? getModalityLevel2(selectedLevel1, selectedLevel2)
      : null;

  return (
    <div className="space-y-6">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={cn(currentLevel === 'level1' && 'text-primary font-medium')}
        >
          의약품 유형
        </span>
        {selectedLevel1 && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span
              className={cn(
                currentLevel === 'level2' && 'text-primary font-medium'
              )}
            >
              {currentLevel1Data?.level1_name}
            </span>
          </>
        )}
        {selectedLevel2 && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span
              className={cn(
                currentLevel === 'level3' && 'text-primary font-medium'
              )}
            >
              {currentLevel2Data?.level2_name}
            </span>
          </>
        )}
      </div>

      {/* 뒤로가기 버튼 */}
      {currentLevel !== 'level1' && (
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          뒤로
        </Button>
      )}


      {/* 선택 영역 */}
      {/* Level 1 선택 */}
      {currentLevel === 'level1' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {modalityData.map((modality) => (
            <Card
              key={modality.level1_id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                selectedLevel1 === modality.level1_id &&
                  'border-primary bg-primary/5'
              )}
              onClick={() => handleLevel1Select(modality.level1_id)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{modality.icon}</div>
                <h3 className="font-semibold text-sm">{modality.level1_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {modality.level1_name_en}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Level 2 선택 */}
      {currentLevel === 'level2' && currentLevel1Data && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">
            {currentLevel1Data.level1_name} 유형을 선택해주세요
          </h2>
          {currentLevel1Data.level2.map((level2) => (
            <Card
              key={level2.level2_id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                selectedLevel2 === level2.level2_id &&
                  'border-primary bg-primary/5'
              )}
              onClick={() => handleLevel2Select(level2.level2_id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{level2.level2_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {level2.level2_name_en}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {level2.level3.map((l) => l.level3_name).join(', ')}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Level 3 선택 */}
      {currentLevel === 'level3' && currentLevel2Data && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">
            {currentLevel2Data.level2_name} 세부 유형을 선택해주세요
          </h2>
          {currentLevel2Data.level3.map((level3) => (
            <Card
              key={level3.level3_id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                selectedLevel3 === level3.level3_id &&
                  'border-primary bg-primary/5'
              )}
              onClick={() => handleLevel3Select(level3.level3_id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{level3.level3_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {level3.level3_name_en}
                  </p>
                </div>
                {selectedLevel3 === level3.level3_id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 선택 완료 시 다음 버튼 */}
      {selectedModality && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleNext}>
            다음 단계
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
