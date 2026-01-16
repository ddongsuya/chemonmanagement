import { QuotationItem, AnalysisCost } from '@/types';

// 조제물분석 비용 계산 (v2)
export function calculateAnalysisCost(items: QuotationItem[]): AnalysisCost {
  const VALIDATION_COST = 10000000; // 1천만원
  const ANALYSIS_UNIT_COST = 1000000; // 1백만원

  let hasInVivo = false;
  let hasInVitro = false;
  let totalAnalysisCount = 0;

  items.forEach(item => {
    const test = item.test;
    // v2: analysis_excluded가 null이면 분석 포함
    if (!test.analysis_excluded) {
      if (test.test_type === 'in vivo') {
        hasInVivo = true;
        totalAnalysisCount += test.analysis_count || 1;
      } else if (test.test_type === 'in vitro') {
        hasInVitro = true;
        totalAnalysisCount += test.analysis_count || 1;
      }
    }
  });

  const validation_cost = (hasInVivo ? VALIDATION_COST : 0) + (hasInVitro ? VALIDATION_COST : 0);
  const analysis_cost = totalAnalysisCount * ANALYSIS_UNIT_COST;

  return {
    validation_invivo: hasInVivo,
    validation_invitro: hasInVitro,
    validation_cost,
    analysis_count: totalAnalysisCount,
    analysis_cost,
    total_cost: validation_cost + analysis_cost,
  };
}

// 할인 금액 계산
export function calculateDiscount(subtotal: number, discountRate: number): number {
  return Math.floor(subtotal * (discountRate / 100));
}

// 총액 계산
export function calculateTotal(
  subtotalTest: number,
  subtotalAnalysis: number,
  discountAmount: number
): number {
  return subtotalTest + subtotalAnalysis - discountAmount;
}
