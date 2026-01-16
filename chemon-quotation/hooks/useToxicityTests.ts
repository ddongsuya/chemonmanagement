'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getToxicityTests,
  getToxicityTestCategories,
  getAnimalClasses,
  getSpecies,
  getRoutes,
  ToxicityTest,
  ToxicityCategory,
  AnimalClass,
  Species,
  Route,
  ToxicityTestFilters,
} from '@/lib/master-api';

// ============ 독성시험 항목 훅 ============

/**
 * 모든 독성시험 항목 조회
 */
export function useAllToxicityTests() {
  return useQuery({
    queryKey: ['toxicityTests', 'all'],
    queryFn: async () => {
      const response = await getToxicityTests();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '데이터를 불러오는데 실패했습니다');
    },
  });
}

/**
 * 필터링된 독성시험 항목 조회
 */
export function useToxicityTests(filters: ToxicityTestFilters = {}) {
  return useQuery({
    queryKey: ['toxicityTests', filters],
    queryFn: async () => {
      const response = await getToxicityTests(filters);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '데이터를 불러오는데 실패했습니다');
    },
  });
}

/**
 * 서브카테고리별 독성시험 항목 조회
 */
export function useToxicityTestsBySubcategory(subcategory: string) {
  return useQuery({
    queryKey: ['toxicityTests', 'bySubcategory', subcategory],
    queryFn: async () => {
      const response = await getToxicityTests({ subcategory });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '데이터를 불러오는데 실패했습니다');
    },
    enabled: !!subcategory,
  });
}

/**
 * 시트별 독성시험 항목 조회
 */
export function useToxicityTestsBySheet(sheet: string) {
  return useQuery({
    queryKey: ['toxicityTests', 'bySheet', sheet],
    queryFn: async () => {
      const response = await getToxicityTests({ sheet });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '데이터를 불러오는데 실패했습니다');
    },
    enabled: !!sheet,
  });
}

// ============ 카테고리 훅 ============

/**
 * 독성시험 카테고리 조회
 */
export function useToxicityCategories() {
  return useQuery({
    queryKey: ['toxicityCategories'],
    queryFn: async () => {
      const response = await getToxicityTestCategories();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '카테고리를 불러오는데 실패했습니다');
    },
  });
}

// ============ 참조 데이터 훅 ============

/**
 * 동물 분류 조회
 */
export function useAnimalClasses() {
  return useQuery({
    queryKey: ['animalClasses'],
    queryFn: async () => {
      const response = await getAnimalClasses();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '동물 분류를 불러오는데 실패했습니다');
    },
  });
}

/**
 * 동물 종 조회
 */
export function useSpecies() {
  return useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      const response = await getSpecies();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '동물 종을 불러오는데 실패했습니다');
    },
  });
}

/**
 * 투여경로 조회
 */
export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await getRoutes();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || '투여경로를 불러오는데 실패했습니다');
    },
  });
}

// ============ 유틸리티 함수 ============

/**
 * 가격 문자열을 숫자로 변환
 */
export function parsePrice(price: string | null): number | null {
  if (!price) return null;
  const num = parseInt(price.replace(/,/g, ''), 10);
  return isNaN(num) ? null : num;
}

/**
 * 투여경로 문자열을 배열로 변환
 */
export function parseRoutes(routes: string | null): string[] {
  if (!routes) return [];
  return routes.split('/').map(r => r.trim());
}

/**
 * 시험 항목의 표시 이름 생성
 */
export function getTestDisplayName(test: ToxicityTest): string {
  const parts: string[] = [];
  
  if (test.testName) {
    parts.push(test.testName);
  }
  
  if (test.animalClass) {
    parts.push(test.animalClass);
  }
  
  if (test.species) {
    parts.push(test.species);
  }
  
  if (test.duration) {
    parts.push(test.duration);
  }
  
  if (test.routes) {
    parts.push(test.routes);
  }
  
  return parts.join(' / ') || test.subcategory;
}

/**
 * 시험 항목의 가격 정보 가져오기
 */
export function getTestPriceInfo(test: ToxicityTest): {
  basePrice: number | null;
  withAnalysis: number | null;
  samplingOnly: number | null;
} {
  return {
    basePrice: parsePrice(test.price),
    withAnalysis: parsePrice(test.priceWithAnalysis),
    samplingOnly: test.priceSamplingOnly === '-' ? null : parsePrice(test.priceSamplingOnly),
  };
}
