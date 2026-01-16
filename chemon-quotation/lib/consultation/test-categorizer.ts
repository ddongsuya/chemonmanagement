/**
 * 시험 항목 카테고리 분류
 */

import { QuotationItem } from '@/types';

export interface CategorizedTests {
  toxicity: string[];
  genotoxicity: string[];
  efficacy: string[];
  safetyPharmacology: string[];
  hematology: string[];
  histopathology: string[];
  analysis: string[];
  others: string[];
}

/**
 * 견적서 시험 항목들을 카테고리별로 분류
 */
export function categorizeTests(items: QuotationItem[]): CategorizedTests {
  const result: CategorizedTests = {
    toxicity: [],
    genotoxicity: [],
    efficacy: [],
    safetyPharmacology: [],
    hematology: [],
    histopathology: [],
    analysis: [],
    others: [],
  };

  for (const item of items) {
    const name = (item.test?.test_name || '').toLowerCase();
    const category = (item.test?.category_name || '').toLowerCase();

    // 옵션 항목은 제외하거나 별도 처리
    if (item.is_option) continue;

    const testName = item.test?.test_name?.split('\n')[0] || '';

    // 분류 로직 - 더 구체적인 조건을 먼저 체크
    // 1. 유전독성 (독성보다 먼저 체크해야 함)
    if (
      name.includes('유전독성') ||
      name.includes('ames') ||
      name.includes('소핵') ||
      name.includes('염색체') ||
      name.includes('복귀돌연변이') ||
      name.includes('comet') ||
      name.includes('micronucleus') ||
      category.includes('유전독성')
    ) {
      result.genotoxicity.push(testName);
    }
    // 2. 안전성약리/일반약리 (독성보다 먼저 체크)
    else if (
      name.includes('안전성약리') ||
      name.includes('herg') ||
      name.includes('심혈관') ||
      name.includes('호흡') ||
      name.includes('중추신경') ||
      name.includes('일반약리') ||
      name.includes('irwin') ||
      name.includes('telemetry') ||
      category.includes('약리')
    ) {
      result.safetyPharmacology.push(testName);
    }
    // 3. 약효시험
    else if (
      name.includes('약효') ||
      name.includes('유효성') ||
      name.includes('efficacy')
    ) {
      result.efficacy.push(testName);
    }
    // 4. 혈액검사/임상병리
    else if (
      name.includes('혈액') ||
      name.includes('임상병리') ||
      name.includes('생화학') ||
      name.includes('혈청')
    ) {
      result.hematology.push(testName);
    }
    // 5. 조직병리검사
    else if (
      name.includes('병리') ||
      name.includes('조직') ||
      name.includes('부검')
    ) {
      result.histopathology.push(testName);
    }
    // 6. 분석시험
    else if (
      name.includes('분석') ||
      name.includes('조제물') ||
      name.includes('함량') ||
      name.includes('안정성') ||
      category.includes('분석')
    ) {
      result.analysis.push(testName);
    }
    // 7. 독성시험 (일반 독성 - 유전독성 제외)
    else if (
      name.includes('반복') ||
      name.includes('단회') ||
      name.includes('drf') ||
      name.includes('급성') ||
      name.includes('아급성') ||
      name.includes('만성') ||
      name.includes('국소내성') ||
      name.includes('피부감작') ||
      name.includes('광독성') ||
      name.includes('발암') ||
      name.includes('생식') ||
      name.includes('발생') ||
      name.includes('최대내성') ||
      (category.includes('독성') && !category.includes('유전'))
    ) {
      result.toxicity.push(testName);
    }
    // 8. 기타
    else {
      result.others.push(testName);
    }
  }

  return result;
}

/**
 * 카테고리별 시험 목록을 문자열로 변환
 */
export function categoriesToStrings(
  categorized: CategorizedTests
): Record<string, string> {
  return {
    toxicity: categorized.toxicity.join(', ') || '-',
    genotoxicity: categorized.genotoxicity.join(', ') || '-',
    efficacy: categorized.efficacy.join(', ') || '-',
    safetyPharmacology: categorized.safetyPharmacology.join(', ') || '-',
    hematology: categorized.hematology.join(', ') || '-',
    histopathology: categorized.histopathology.join(', ') || '-',
    analysis: categorized.analysis.join(', ') || '-',
    others: categorized.others.join(', ') || '-',
  };
}
