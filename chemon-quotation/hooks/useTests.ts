'use client';

import { useQuery } from '@tanstack/react-query';
import { Test, Category, SubCategory, TestRelation, PackageTemplate } from '@/types';
import { getToxicityTests, ToxicityTest } from '@/lib/master-api';

// JSON 파일에서 데이터 로드 (fallback)
import masterTestsJson from '@/data/chemon_master_data.json';
import categories from '@/data/categories.json';
import subCategories from '@/data/sub_categories.json';
import testRelations from '@/data/test_relations.json';
import packageTemplates from '@/data/package_templates.json';

// 모달리티 한글명 매핑 (DB에 저장된 값과 일치)
// 프론트엔드에서 선택하는 모달리티 -> DB의 modalityLevel1 값
// 원본 마스터데이터의 modality 값: 저분자화합물, 복합제, 건강기능식품, 화장품, 세포치료제, 백신, 유전자치료제, 의료기기, 농약/화학물질, 문서/서비스
const MODALITY_NAME_MAP: Record<string, string[]> = {
  // 직접 매핑
  '저분자화합물': ['저분자화합물'],
  '복합제': ['복합제'],
  '건강기능식품': ['건강기능식품'],
  '화장품': ['화장품'],
  '세포치료제': ['세포치료제'],
  '백신': ['백신'],
  '유전자치료제': ['유전자치료제'],
  '의료기기': ['의료기기'],
  '농약/화학물질': ['농약/화학물질'],
  '문서/서비스': ['문서/서비스'],
  // 계층 구조에서 사용되는 이름 -> 원본 데이터 매핑
  '바이오의약품': ['저분자화합물'], // 바이오의약품 데이터가 없으므로 저분자화합물로 대체
  '핵산치료제': ['저분자화합물'], // 핵산치료제 데이터가 없으므로 저분자화합물로 대체
  '방사성의약품': ['저분자화합물'], // 방사성의약품 데이터가 없으므로 저분자화합물로 대체
  '마이크로바이옴': ['저분자화합물'], // 마이크로바이옴 데이터가 없으므로 저분자화합물로 대체
  '기타첨단바이오': ['저분자화합물'], // 기타첨단바이오 데이터가 없으므로 저분자화합물로 대체
};

// API 응답을 기존 Test 타입으로 변환
function convertApiTestToTest(apiTest: ToxicityTest): Test {
  const priceStr = apiTest.price;
  const price = priceStr ? parseInt(priceStr.replace(/,/g, ''), 10) : 0;
  
  return {
    test_id: `toxicity-${apiTest.itemId}`,
    modality: '',
    category_code: apiTest.category || '',
    category_name: apiTest.category || '',
    source_file: apiTest.sheet || '',
    sub_category: apiTest.subcategory || null,
    oecd_code: apiTest.oecd || '',
    test_type: apiTest.testType || 'in vivo',
    test_name: apiTest.testName || apiTest.subcategory || '',
    animal_species: apiTest.species || null,
    dosing_period: apiTest.duration || null,
    route: apiTest.routes || null,
    lead_time_weeks: apiTest.leadTime ? parseInt(apiTest.leadTime) : null,
    unit_price: price,
    remarks: apiTest.remarks || null,
    glp_status: 'GLP',
    clinical_phase: '',
    guidelines: apiTest.oecd || '',
    test_class: '본시험',
    parent_test_id: null,
    option_type: null,
    analysis_count: 1,
    analysis_excluded: null,
    animals_per_sex: apiTest.animalsPerSex || null,
    sex_type: apiTest.sexConfig || null,
    control_groups: apiTest.controlGroups || null,
    test_groups: apiTest.testGroups || null,
    total_groups: apiTest.totalGroups || null,
  };
}

export function useTests(modality: string) {
  return useQuery({
    queryKey: ['tests', modality],
    queryFn: async () => {
      // 백엔드 API에서 데이터 가져오기
      const response = await getToxicityTests();
      
      if (response.success && response.data && response.data.length > 0) {
        // 새 구조에서는 모달리티 필터링 없이 모든 시험 반환
        // 시험 선택은 StepTestSelectionNew에서 카테고리/서브카테고리로 처리
        return response.data.map(convertApiTestToTest);
      }

      // API 실패 시 JSON 파일 fallback
      const filtered = (masterTestsJson as Test[]).filter(
        (test) => test.modality === modality
      );
      return filtered;
    },
    enabled: !!modality,
  });
}

export function useAllTests() {
  return useQuery({
    queryKey: ['allTests'],
    queryFn: async () => {
      const response = await getToxicityTests();
      if (response.success && response.data) {
        return response.data.map(convertApiTestToTest);
      }
      return masterTestsJson as Test[];
    },
  });
}

export function useTestsByCategory(categoryCode: string) {
  return useQuery({
    queryKey: ['tests', 'byCategory', categoryCode],
    queryFn: async () => {
      const response = await getToxicityTests();
      if (response.success && response.data) {
        const allTests = response.data.map(convertApiTestToTest);
        if (!categoryCode || categoryCode === 'all') {
          return allTests;
        }
        return allTests.filter((test) => test.category_name === categoryCode || test.category_code === categoryCode);
      }
      
      if (!categoryCode || categoryCode === 'all') {
        return masterTestsJson as Test[];
      }
      return (masterTestsJson as Test[]).filter(
        (test) => test.category_code === categoryCode
      );
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categories as Category[],
  });
}

export function useSubCategories(categoryCode?: string) {
  return useQuery({
    queryKey: ['subCategories', categoryCode],
    queryFn: () => {
      if (!categoryCode || categoryCode === 'all') {
        return subCategories as SubCategory[];
      }
      return (subCategories as SubCategory[]).filter(
        (sub) => sub.category_code === categoryCode
      );
    },
  });
}

export function useTestRelations() {
  return useQuery({
    queryKey: ['testRelations'],
    queryFn: () => testRelations as unknown as TestRelation,
  });
}

export function usePackageTemplates() {
  return useQuery({
    queryKey: ['packageTemplates'],
    queryFn: async () => {
      // 백엔드 API에서 패키지 템플릿 가져오기
      const { getPackages } = await import('@/lib/package-api');
      const response = await getPackages(true);
      
      if (response.success && response.data && response.data.length > 0) {
        // API 응답을 기존 PackageTemplate 형식으로 변환
        return response.data.map(pkg => ({
          package_id: pkg.packageId,
          package_name: pkg.packageName,
          description: pkg.description || '',
          modality: pkg.modality || '',
          clinical_phase: pkg.clinicalPhase || '',
          tests: pkg.tests || [],
          optional_tests: pkg.optionalTests || [],
        })) as PackageTemplate[];
      }
      
      // API 실패 시 JSON 파일 fallback
      return packageTemplates as PackageTemplate[];
    },
  });
}
