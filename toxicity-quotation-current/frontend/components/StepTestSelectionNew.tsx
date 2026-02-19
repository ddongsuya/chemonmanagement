'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuotationStore, SelectedToxicityTest } from '@/stores/quotationStore';
import {
  useToxicityCategories,
  useAllToxicityTests,
  parsePrice,
} from '@/hooks/useToxicityTests';
import { ToxicityTest } from '@/lib/master-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FlaskConical,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react';

// 시험 종류 순서 정의 (논리적 순서)
const TEST_TYPE_ORDER = [
  '단회투여 독성시험',
  '용량결정시험',
  '반복투여독성시험',
  '회복시험',
  '독성동태시험',
  '생식독성시험',
  '유전독성시험',
  '안전성약리',
  '항원성시험',
];

export default function StepTestSelectionNew() {
  const { 
    nextStep, 
    prevStep, 
    selectedToxicityTests,
    addToxicityTest,
    removeToxicityTest,
    clearToxicityTests,
  } = useQuotationStore();

  // API 데이터 로드
  const { data: categoriesData, isLoading: categoriesLoading } = useToxicityCategories();
  const { data: tests = [], isLoading: testsLoading } = useAllToxicityTests();

  // 단계별 선택 상태 - 기본값 설정 (2,3,4,5번 먼저)
  const [selectedAnimalClass, setSelectedAnimalClass] = useState<string>('설치류');
  const [selectedRouteGroup, setSelectedRouteGroup] = useState<string>('경구피하근육독성');
  const [selectedDuration, setSelectedDuration] = useState<string>('1회');
  const [selectedRoute, setSelectedRoute] = useState<string>('경구');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [includeAnalysis, setIncludeAnalysis] = useState<boolean>(false);

  // 서브카테고리 목록 (정렬된 순서로)
  const subcategories = useMemo(() => {
    if (!categoriesData?.raw) return [];
    const rawCategories = categoriesData.raw.map(c => c.subcategory);
    // 정의된 순서대로 정렬
    return rawCategories.sort((a, b) => {
      const indexA = TEST_TYPE_ORDER.indexOf(a);
      const indexB = TEST_TYPE_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [categoriesData]);

  // 동물분류 옵션 (전체 시험에서)
  const animalClassOptions = useMemo(() => {
    const classes = [...new Set(tests.map(t => t.animalClass).filter(Boolean))];
    return classes as string[];
  }, [tests]);

  // 투여경로 그룹 옵션 (선택된 동물분류 기준)
  const routeGroupOptions = useMemo(() => {
    if (!selectedAnimalClass) return [];
    const filtered = tests.filter(t => t.animalClass === selectedAnimalClass);
    const groups = [...new Set(filtered.map(t => t.routeGroup).filter(Boolean))];
    return groups as string[];
  }, [tests, selectedAnimalClass]);

  // 기간 옵션 (선택된 동물분류, 투여경로 그룹 기준)
  const durationOptions = useMemo(() => {
    if (!selectedAnimalClass || !selectedRouteGroup) return [];
    const filtered = tests.filter(
      t => t.animalClass === selectedAnimalClass && t.routeGroup === selectedRouteGroup
    );
    const durations = [...new Set(filtered.map(t => t.duration).filter(Boolean))];
    return durations as string[];
  }, [tests, selectedAnimalClass, selectedRouteGroup]);

  // 선택된 조건에 맞는 시험 종류 필터링
  const availableSubcategories = useMemo(() => {
    if (!selectedAnimalClass || !selectedRouteGroup || !selectedDuration) return subcategories;
    
    const matchingTests = tests.filter(
      t => t.animalClass === selectedAnimalClass &&
           t.routeGroup === selectedRouteGroup &&
           t.duration === selectedDuration
    );
    
    const availableSubs = [...new Set(matchingTests.map(t => t.subcategory))];
    
    // 정의된 순서대로 정렬
    return availableSubs.sort((a, b) => {
      const indexA = TEST_TYPE_ORDER.indexOf(a);
      const indexB = TEST_TYPE_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [tests, selectedAnimalClass, selectedRouteGroup, selectedDuration, subcategories]);

  // 최종 매칭된 시험 항목
  const matchedTest = useMemo(() => {
    if (!selectedSubcategory || !selectedAnimalClass || !selectedRouteGroup || !selectedDuration) {
      return null;
    }
    return tests.find(
      t =>
        t.subcategory === selectedSubcategory &&
        t.animalClass === selectedAnimalClass &&
        t.routeGroup === selectedRouteGroup &&
        t.duration === selectedDuration
    ) || null;
  }, [tests, selectedSubcategory, selectedAnimalClass, selectedRouteGroup, selectedDuration]);

  // 투여경로 옵션 (routes 필드에서 파싱)
  const routeOptions = useMemo(() => {
    if (!matchedTest?.routes) return [];
    return matchedTest.routes.split('/').map(r => r.trim());
  }, [matchedTest]);

  // 시험명 생성
  const generateTestName = () => {
    if (!matchedTest) return '';
    const parts: string[] = [];
    
    if (matchedTest.animalClass) parts.push(matchedTest.animalClass);
    if (matchedTest.duration) parts.push(matchedTest.duration);
    parts.push(selectedSubcategory);
    if (selectedRoute) parts.push(`(${selectedRoute})`);
    
    return parts.join(' ');
  };

  // 시험 추가
  const addTest = () => {
    if (!matchedTest) return;

    const displayName = generateTestName();
    const newTest: SelectedToxicityTest = {
      id: `test-${matchedTest.itemId}-${Date.now()}`,
      test: matchedTest,
      displayName,
      selectedRoute,
      includeAnalysis,
      quantity: 1,
    };

    addToxicityTest(newTest);
    
    // 시험 종류만 초기화 (다른 조건은 유지)
    setSelectedSubcategory('');
    setIncludeAnalysis(false);
  };

  // 선택 초기화
  const resetSelection = () => {
    setSelectedAnimalClass('설치류');
    setSelectedRouteGroup('경구피하근육독성');
    setSelectedDuration('1회');
    setSelectedRoute('경구');
    setSelectedSubcategory('');
    setIncludeAnalysis(false);
  };

  // 시험 삭제
  const removeTest = (id: string) => {
    removeToxicityTest(id);
  };

  // 전체 초기화
  const clearAll = () => {
    clearToxicityTests();
    resetSelection();
  };

  // 총 금액 계산
  const totalAmount = useMemo(() => {
    return selectedToxicityTests.reduce((sum, item) => {
      const price = item.includeAnalysis
        ? parsePrice(item.test.priceWithAnalysis)
        : parsePrice(item.test.price);
      return sum + (price || 0) * item.quantity;
    }, 0);
  }, [selectedToxicityTests]);

  // 가격 포맷
  const formatPrice = (price: number | null) => {
    if (price === null) return '별도 협의';
    return price.toLocaleString() + '원';
  };

  // 동물분류 변경 시 하위 선택 초기화
  const handleAnimalClassChange = (value: string) => {
    setSelectedAnimalClass(value);
    setSelectedRouteGroup('');
    setSelectedDuration('');
    setSelectedRoute('');
    setSelectedSubcategory('');
  };

  // 투여경로 그룹 변경 시 하위 선택 초기화
  const handleRouteGroupChange = (value: string) => {
    setSelectedRouteGroup(value);
    setSelectedDuration('');
    setSelectedRoute('');
    setSelectedSubcategory('');
  };

  // 기간 변경 시 시험 종류 초기화
  const handleDurationChange = (value: string) => {
    setSelectedDuration(value);
    setSelectedSubcategory('');
  };

  // 시험 종류 변경
  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
    setSelectedRoute('');
  };

  if (testsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 좌측: 시험 선택 */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                시험 항목 선택
              </span>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <RotateCcw className="w-4 h-4 mr-1" />
                초기화
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 조건 설정 영역 */}
            <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
              <h4 className="font-medium text-gray-700 text-sm">기본 조건 설정</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Step 1: 동물분류 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">1</Badge>
                    동물분류
                  </label>
                  <Select value={selectedAnimalClass} onValueChange={handleAnimalClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="동물분류 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {animalClassOptions.map((ac) => (
                        <SelectItem key={ac} value={ac}>
                          {ac}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: 투여경로 그룹 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">2</Badge>
                    투여경로 그룹
                  </label>
                  <Select 
                    value={selectedRouteGroup} 
                    onValueChange={handleRouteGroupChange}
                    disabled={!selectedAnimalClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="투여경로 그룹 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {routeGroupOptions.map((rg) => (
                        <SelectItem key={rg} value={rg}>
                          {rg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 3: 투여기간 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">3</Badge>
                    투여기간
                  </label>
                  <Select 
                    value={selectedDuration} 
                    onValueChange={handleDurationChange}
                    disabled={!selectedRouteGroup}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="투여기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 4: 투여경로 (선택) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">4</Badge>
                    투여경로 (선택)
                  </label>
                  <Select 
                    value={selectedRoute} 
                    onValueChange={setSelectedRoute}
                    disabled={!matchedTest || routeOptions.length <= 1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={routeOptions.length > 0 ? routeOptions[0] : "투여경로 선택"} />
                    </SelectTrigger>
                    <SelectContent>
                      {routeOptions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 시험 종류 선택 */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Badge className="bg-blue-600">5</Badge>
                시험 종류 선택
              </label>
              
              {availableSubcategories.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  위의 조건을 먼저 선택해주세요
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableSubcategories.map((sub) => {
                    const isSelected = selectedSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => handleSubcategoryChange(sub)}
                        className={`p-3 text-sm rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 매칭된 시험 정보 */}
            {matchedTest && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">
                      {generateTestName()}
                    </h4>
                    <div className="mt-2 text-sm text-blue-700 space-y-1">
                      <p>동물종: {matchedTest.species}</p>
                      {matchedTest.sexConfig && (
                        <p>성별: {matchedTest.sexConfig} {matchedTest.animalsPerSex}마리/군</p>
                      )}
                      {matchedTest.totalGroups && (
                        <p>군 구성: 대조군 {matchedTest.controlGroups}, 시험군 {matchedTest.testGroups} (총 {matchedTest.totalGroups}군)</p>
                      )}
                      {matchedTest.leadTime && (
                        <p>소요기간: {matchedTest.leadTime}</p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(parsePrice(matchedTest.price))}
                      </span>
                      {matchedTest.priceWithAnalysis && (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={includeAnalysis}
                            onCheckedChange={(checked) => setIncludeAnalysis(!!checked)}
                          />
                          분석 포함 ({formatPrice(parsePrice(matchedTest.priceWithAnalysis))})
                        </label>
                      )}
                    </div>
                    {matchedTest.optionNote && (
                      <p className="mt-2 text-xs text-orange-600">{matchedTest.optionNote}</p>
                    )}
                  </div>
                  <Button onClick={addTest} className="ml-4">
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
              </div>
            )}

            {/* 선택 경로 표시 */}
            {(selectedAnimalClass || selectedRouteGroup || selectedDuration || selectedSubcategory) && (
              <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                {selectedAnimalClass && <Badge variant="secondary">{selectedAnimalClass}</Badge>}
                {selectedRouteGroup && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <Badge variant="secondary">{selectedRouteGroup}</Badge>
                  </>
                )}
                {selectedDuration && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <Badge variant="secondary">{selectedDuration}</Badge>
                  </>
                )}
                {selectedSubcategory && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <Badge variant="default">{selectedSubcategory}</Badge>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 우측: 선택된 시험 */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>선택된 시험</span>
              <Badge>{selectedToxicityTests.length}개</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedToxicityTests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>선택된 시험이 없습니다.</p>
                <p className="text-sm mt-1">좌측에서 시험을 선택해주세요.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-2">
                  {selectedToxicityTests.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg bg-blue-50 border-blue-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.displayName}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.test.species} / {item.test.leadTime}
                          </p>
                          {item.includeAnalysis && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              분석 포함
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTest(item.id)}
                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-semibold text-blue-700">
                          {formatPrice(
                            item.includeAnalysis
                              ? parsePrice(item.test.priceWithAnalysis)
                              : parsePrice(item.test.price)
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* 합계 */}
            {selectedToxicityTests.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">예상 합계</span>
                  <span className="text-lg font-bold text-blue-600">
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" /> 이전
          </Button>
          <Button
            onClick={nextStep}
            className="flex-1"
            disabled={selectedToxicityTests.length === 0}
          >
            검토/계산 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
