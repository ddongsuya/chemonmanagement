'use client';

import { useState, useMemo } from 'react';
import { useQuotationStore } from '@/stores/quotationStore';
import {
  useTests,
  useCategories,
  useTestRelations,
  usePackageTemplates,
} from '@/hooks/useTests';
import { Test } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import TestCard from './TestCard';
import SelectedTestList from './SelectedTestList';
import {
  Search,
  Package,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function StepTestSelection() {
  const {
    modality,
    selectedItems,
    addItem,
    removeItem,
    clearItems,
    nextStep,
    prevStep,
  } = useQuotationStore();

  const { data: tests = [], isLoading: testsLoading } = useTests(modality);
  const { data: categories = [] } = useCategories();
  const { data: testRelations = {} } = useTestRelations();
  const { data: packages = [] } = usePackageTemplates();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState<string>('all');
  const [animalFilter, setAnimalFilter] = useState<string>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');

  // 필터링된 시험 목록
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // 본시험 또는 독립 시험만 표시 (옵션은 본시험 하위에 표시)
      if (test.test_class === '옵션') return false;

      // 카테고리 필터 (v2)
      if (selectedCategory !== 'all' && test.category_code !== selectedCategory)
        return false;

      // 시험유형 필터
      if (testTypeFilter !== 'all' && test.test_type_class !== testTypeFilter)
        return false;

      // 동물종 필터
      if (animalFilter !== 'all' && test.animal_class !== animalFilter)
        return false;

      // 투여경로 필터
      if (routeFilter !== 'all' && test.route_class !== routeFilter)
        return false;

      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          test.test_name.toLowerCase().includes(query) ||
          test.test_id.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [tests, selectedCategory, testTypeFilter, animalFilter, routeFilter, searchQuery]);

  // 카테고리별 그룹핑 (v2)
  const groupedTests = useMemo(() => {
    const groups: Record<string, Test[]> = {};
    filteredTests.forEach((test) => {
      const key = test.category_name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(test);
    });
    return groups;
  }, [filteredTests]);

  // 시험의 옵션 목록 가져오기
  const getOptionsForTest = (testId: string): Test[] => {
    const relations = testRelations[testId] || [];
    return relations
      .map((rel) => tests.find((t) => t.test_id === rel.option_id))
      .filter(Boolean) as Test[];
  };

  // 패키지 적용
  const applyPackage = (pkg: { tests: { test_id: string }[] }) => {
    clearItems();
    pkg.tests.forEach((item) => {
      const test = tests.find((t) => t.test_id === item.test_id);
      if (test) addItem(test, false, null);
    });
  };

  // 시험 선택 여부 확인
  const isTestSelected = (testId: string) => {
    return selectedItems.some((item) => item.test.test_id === testId);
  };

  // 시험 토글
  const toggleTest = (
    test: Test,
    isOption: boolean = false,
    parentId?: string
  ) => {
    if (isTestSelected(test.test_id)) {
      const item = selectedItems.find((i) => i.test.test_id === test.test_id);
      if (item) removeItem(item.id);
    } else {
      addItem(test, isOption, parentId || null);
    }
  };

  // 선택된 옵션 ID 목록 가져오기
  const getSelectedOptionsForTest = (testId: string): string[] => {
    const parentItem = selectedItems.find(
      (item) => item.test.test_id === testId
    );
    if (!parentItem) return [];

    return selectedItems
      .filter((item) => item.parent_item_id === parentItem.id)
      .map((item) => item.test.test_id);
  };

  if (testsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 좌측: 시험 목록 */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span>시험 선택</span>
              <Badge variant="outline">{modality}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 필터 영역 */}
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.code} value={cat.code}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="시험유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 유형</SelectItem>
                    <SelectItem value="repeat_dose">반복투여독성</SelectItem>
                    <SelectItem value="genotox">유전독성</SelectItem>
                    <SelectItem value="repro">생식독성</SelectItem>
                    <SelectItem value="safety_pharm">안전성약리</SelectItem>
                    <SelectItem value="local_tox">국소독성</SelectItem>
                    <SelectItem value="immuno">면역독성</SelectItem>
                    <SelectItem value="photo">광독성</SelectItem>
                    <SelectItem value="carcino">발암성</SelectItem>
                    <SelectItem value="analysis">조제물분석</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={animalFilter} onValueChange={setAnimalFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="동물종" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 동물</SelectItem>
                    <SelectItem value="rodent">설치류</SelectItem>
                    <SelectItem value="non_rodent">비설치류</SelectItem>
                    <SelectItem value="rabbit">토끼</SelectItem>
                    <SelectItem value="primate">영장류</SelectItem>
                    <SelectItem value="in_vitro">In vitro</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={routeFilter} onValueChange={setRouteFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="투여경로" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 경로</SelectItem>
                    <SelectItem value="oral">경구</SelectItem>
                    <SelectItem value="iv">정맥</SelectItem>
                    <SelectItem value="sc">피하</SelectItem>
                    <SelectItem value="im">근육</SelectItem>
                    <SelectItem value="dermal">경피</SelectItem>
                    <SelectItem value="inhalation">흡입</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="시험명 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* 패키지 버튼 */}
              <div className="flex flex-wrap gap-2">
                {packages.map((pkg) => (
                  <Button
                    key={pkg.package_id}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPackage(pkg)}
                  >
                    <Package className="w-4 h-4 mr-1" />
                    {pkg.package_name}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={clearItems}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  선택 초기화
                </Button>
              </div>
            </div>

            {/* 시험 목록 */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-6 pr-4">
                {Object.keys(groupedTests).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>해당 조건의 시험이 없습니다.</p>
                    <p className="text-sm mt-1">
                      필터를 변경하거나 검색어를 확인해주세요.
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedTests).map(([categoryName, catTests]) => (
                    <div key={categoryName}>
                      <h3 className="font-semibold text-gray-900 mb-3 sticky top-0 bg-white py-2 z-10">
                        {categoryName} ({catTests.length})
                      </h3>
                      <div className="space-y-3">
                        {catTests.map((test) => (
                          <TestCard
                            key={test.test_id}
                            test={test}
                            options={getOptionsForTest(test.test_id)}
                            isSelected={isTestSelected(test.test_id)}
                            selectedOptions={getSelectedOptionsForTest(
                              test.test_id
                            )}
                            onToggle={() => toggleTest(test)}
                            onToggleOption={(optionTest) => {
                              const parentItem = selectedItems.find(
                                (i) => i.test.test_id === test.test_id
                              );
                              if (parentItem) {
                                toggleTest(optionTest, true, parentItem.id);
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 우측: 선택된 시험 */}
      <div className="space-y-4">
        <SelectedTestList />

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" /> 이전
          </Button>
          <Button
            onClick={nextStep}
            className="flex-1"
            disabled={selectedItems.length === 0}
          >
            검토/계산 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
