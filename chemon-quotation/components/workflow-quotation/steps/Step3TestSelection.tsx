'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useWorkflowQuotationStore } from '@/stores/workflowQuotationStore';
import { getAutoAddTests } from '@/lib/quotation/auto-add-rules';
import type { WorkflowSelectedTest } from '@/types/workflow-quotation';

// 워크플로우 단계 정의
const workflowStages = [
  { id: 'DRF', name: '용량결정시험 (DRF)', order: 1 },
  { id: 'REPEAT', name: '반복투여독성', order: 2 },
  { id: 'GENOTOX', name: '유전독성', order: 3 },
  { id: 'SAFETY_PHARM', name: '안전성약리', order: 4 },
  { id: 'REPRO', name: '생식독성', order: 5 },
  { id: 'BIODIST', name: '생체분포', order: 6 },
  { id: 'SHEDDING', name: '배출시험', order: 7 },
  { id: 'LOCAL_TOX', name: '국소독성', order: 8 },
  { id: 'IMMUNO', name: '면역독성', order: 9 },
  { id: 'ANALYSIS', name: '분석시험', order: 10 },
];

// 샘플 시험 데이터 (실제로는 마스터데이터에서 가져옴)
const sampleTests: WorkflowSelectedTest[] = [
  {
    testId: 'DRF-001',
    testCode: 'DRF-RAT-2W',
    testName: '설치류 2주 DRF',
    testNameEn: 'Rat 2-week DRF',
    category: '일반독성',
    subcategory: 'DRF',
    options: { species: 'rat', route: 'oral', duration: '2주' },
    basePrice: 15000000,
    optionPrice: 0,
    totalPrice: 15000000,
    workflowStage: 'DRF',
    workflowOrder: 1,
    relatedTests: ['REPEAT-RAT-4W'],
    prerequisiteTests: [],
    status: 'user_selected',
    isRequired: false,
  },
  {
    testId: 'REPEAT-001',
    testCode: 'REPEAT-RAT-4W',
    testName: '설치류 4주 반복투여독성',
    testNameEn: 'Rat 4-week Repeat Dose',
    category: '일반독성',
    subcategory: 'REPEAT',
    options: { species: 'rat', route: 'oral', duration: '4주', includeTK: true },
    basePrice: 80000000,
    optionPrice: 16000000,
    totalPrice: 96000000,
    workflowStage: 'REPEAT',
    workflowOrder: 2,
    relatedTests: [],
    prerequisiteTests: ['DRF-RAT-2W'],
    status: 'user_selected',
    isRequired: true,
  },
];

export function Step3TestSelection() {
  const {
    selectedModality,
    projectType,
    selectedTests,
    addTest,
    removeTest,
    setStep,
  } = useWorkflowQuotationStore();

  const [expandedStage, setExpandedStage] = useState<string | null>('DRF');

  // 자동 추가 및 추천 시험 가져오기
  const { autoAdd, recommend } = useMemo(() => {
    if (!selectedModality) return { autoAdd: [], recommend: [] };
    return getAutoAddTests(selectedModality.level2, selectedTests);
  }, [selectedModality, selectedTests]);

  // 총 금액 계산
  const totalPrice = useMemo(() => {
    return selectedTests.reduce((sum, test) => sum + test.totalPrice, 0);
  }, [selectedTests]);

  // 시험 추가 (샘플)
  const handleAddSampleTest = (test: WorkflowSelectedTest) => {
    addTest(test);
  };

  // 시험 제거
  const handleRemoveTest = (testId: string) => {
    removeTest(testId);
  };

  const handleBack = () => {
    setStep(2);
  };

  const handleNext = () => {
    setStep(4);
  };

  return (
    <div className="space-y-6">
      {/* 선택 정보 요약 */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
        <Badge variant="outline">{selectedModality?.level3_name}</Badge>
        <Badge variant="outline">
          {projectType === 'ind_package' && 'IND 패키지'}
          {projectType === 'single_test' && '개별 시험'}
          {projectType === 'drf_only' && 'DRF만'}
          {projectType === 'phase_extension' && '임상단계 확장'}
        </Badge>
      </div>


      {/* 자동 추가 알림 */}
      {autoAdd.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>자동 추가 시험</AlertTitle>
          <AlertDescription>
            선택한 모달리티에 따라 다음 시험이 자동으로 추가됩니다:
            <ul className="mt-2 space-y-1">
              {autoAdd.map((test) => (
                <li key={test.testType} className="text-sm">
                  • {test.testName} - <span className="text-muted-foreground">{test.reason}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 추천 시험 알림 */}
      {recommend.length > 0 && (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>추천 시험</AlertTitle>
          <AlertDescription>
            다음 시험을 추가로 고려해보세요:
            <ul className="mt-2 space-y-1">
              {recommend.map((test) => (
                <li key={test.testType} className="text-sm">
                  • {test.testName} - <span className="text-muted-foreground">{test.reason}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 워크플로우 단계별 시험 선택 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>시험 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {workflowStages.map((stage) => (
                    <div key={stage.id} className="border rounded-lg">
                      <button
                        className={cn(
                          'w-full p-3 flex items-center justify-between text-left',
                          expandedStage === stage.id && 'bg-muted'
                        )}
                        onClick={() =>
                          setExpandedStage(expandedStage === stage.id ? null : stage.id)
                        }
                      >
                        <span className="font-medium">{stage.name}</span>
                        <Badge variant="outline">
                          {selectedTests.filter((t) => t.workflowStage === stage.id).length}개
                        </Badge>
                      </button>

                      {expandedStage === stage.id && (
                        <div className="p-3 border-t space-y-2">
                          {/* 샘플 시험 추가 버튼 */}
                          {sampleTests
                            .filter((t) => t.workflowStage === stage.id)
                            .map((test) => {
                              const isSelected = selectedTests.some(
                                (t) => t.testId === test.testId
                              );
                              return (
                                <div
                                  key={test.testId}
                                  className={cn(
                                    'p-3 rounded-lg border cursor-pointer transition-colors',
                                    isSelected
                                      ? 'bg-primary/10 border-primary'
                                      : 'hover:bg-muted'
                                  )}
                                  onClick={() =>
                                    isSelected
                                      ? handleRemoveTest(test.testId)
                                      : handleAddSampleTest(test)
                                  }
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Checkbox checked={isSelected} />
                                      <div>
                                        <p className="font-medium">{test.testName}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {test.testNameEn}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="font-medium">
                                      {formatCurrency(test.totalPrice)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                          {sampleTests.filter((t) => t.workflowStage === stage.id)
                            .length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              이 단계에 해당하는 시험이 없습니다
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 우측: 선택된 시험 요약 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>선택된 시험</span>
                <Badge>{selectedTests.length}개</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {selectedTests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    선택된 시험이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedTests.map((test) => (
                      <div
                        key={test.testId}
                        className="flex items-center justify-between p-2 rounded bg-muted"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{test.testName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(test.totalPrice)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveTest(test.testId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator className="my-4" />

              <div className="flex justify-between items-center font-semibold">
                <span>총 견적금액</span>
                <span className="text-primary text-lg">{formatCurrency(totalPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <Button onClick={handleNext} disabled={selectedTests.length === 0}>
          검토 및 확인
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
