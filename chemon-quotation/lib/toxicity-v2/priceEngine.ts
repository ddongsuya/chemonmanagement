/**
 * 독성시험 견적서 v2 — 가격 계산 엔진
 *
 * 모든 함수는 순수 함수로 구현되어 부작용이 없다.
 * 테스트 용이성과 예측 가능성을 보장한다.
 */
import type {
  ToxicityV2Item,
  ComboItem,
  SelectedTest,
  TestMode,
  RouteType,
  StandardType,
  OecdOverlay,
} from '@/types/toxicity-v2';

/**
 * 의약품 모드 시험 항목의 가격 조회
 *
 * 1. KGLP 기준: 투여 경로에 따라 priceOral(경구) 또는 priceIv(정맥) 반환
 * 2. KGLP_OECD 기준: OV 오버레이 → OE 오버레이 → 기본 가격 순으로 조회
 *    - OV/OE 오버레이에 해당 항목이 있으면 OECD 가격(oop/oip)으로 대체
 *    - 없으면 기본 가격 유지
 *
 * @returns 가격 (원) 또는 null (별도 협의)
 */
export function getItemPrice(
  item: ToxicityV2Item,
  route: RouteType,
  standard: StandardType,
  ovOverlay: OecdOverlay,
  oeOverlay: OecdOverlay
): number | null {
  if (standard === 'KGLP') {
    return route === 'oral' ? item.priceOral : item.priceIv;
  }

  // KGLP_OECD: OV overlay first, then OE overlay, then base price
  const ovEntry = ovOverlay[item.id];
  if (ovEntry) {
    const oecdPrice = route === 'oral' ? ovEntry.oop : ovEntry.oip;
    if (oecdPrice !== undefined) return oecdPrice;
  }

  const oeEntry = oeOverlay[item.id];
  if (oeEntry) {
    const oecdPrice = route === 'oral' ? oeEntry.oop : oeEntry.oip;
    if (oecdPrice !== undefined) return oecdPrice;
  }

  // Fall back to base price
  return route === 'oral' ? item.priceOral : item.priceIv;
}


/**
 * 복합제 항목의 가격 조회
 *
 * 종수(2/3/4)에 따라 해당 가격 필드를 반환한다.
 */
export function getComboPrice(
  item: ComboItem,
  comboType: 2 | 3 | 4
): number {
  switch (comboType) {
    case 2: return item.priceP2;
    case 3: return item.priceP3;
    case 4: return item.priceP4;
  }
}

/**
 * 함량분석 횟수 계산
 *
 * 투여기간 문자열을 파싱하여 함량분석 횟수를 산출한다.
 * - "단회", "1회", "3회", "수회" → 1
 * - "N주" → ceil(N / 4), 최소 1
 * - "N개월" → N (= ceil(N*4 / 4))
 * - "GD6-17", "GD6-19", "GD6~PND21" 등 → 1
 * - "N-M주" (범위) → ceil(M / 4), 최소 1
 * - "3일" → 1
 * - "-" 또는 기타 → 1
 */
export function calcContentCount(duration: string): number {
  if (!duration || duration === '-') return 1;

  const trimmed = duration.trim();

  // "단회" → 1
  if (trimmed === '단회') return 1;

  // "N회" (1회, 3회, 수회) → 1
  if (/^\d*회$/.test(trimmed) || trimmed === '수회') return 1;

  // "N일" → 1 (less than a week)
  if (/^\d+일$/.test(trimmed)) return 1;

  // "GD..." patterns (gestational day) → 1
  if (/^GD/i.test(trimmed)) return 1;

  // "N개월" → N
  const monthMatch = trimmed.match(/^(\d+)개월$/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10);
  }

  // "N-M주" (range like "4-9주") → use the larger value
  const weekRangeMatch = trimmed.match(/^(\d+)-(\d+)주$/);
  if (weekRangeMatch) {
    const weeks = parseInt(weekRangeMatch[2], 10);
    return Math.max(1, Math.ceil(weeks / 4));
  }

  // "N주" → ceil(N / 4), minimum 1
  const weekMatch = trimmed.match(/^(\d+)주$/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10);
    return Math.max(1, Math.ceil(weeks / 4));
  }

  // Default fallback
  return 1;
}

/**
 * 조제물분석비 계산
 *
 * - 의약품(drug_single) 모드:
 *   - in vivo 항목 존재 시 assayBase += 10,000,000원
 *   - in vitro 항목 존재 시 assayBase += 10,000,000원
 *   - 함량분석 대상(IM[1]=1) 항목별: contentTotal += calcContentCount(duration) × 1,000,000원
 *
 * - 건기식(hf_indv, hf_prob, hf_temp) 모드:
 *   - 시험 항목 1개 이상 선택 시 hfFormulation = 26,000,000원
 *
 * - 복합제/백신/스크리닝/의료기기: 모두 0원
 */
export function calcFormulationCost(
  selectedItems: SelectedTest[],
  mode: TestMode,
  allItems: ToxicityV2Item[],
  imMapping: Record<number, [number, number]>
): { assayBase: number; contentTotal: number; hfFormulation: number } {
  // 건기식 모드: 고정 26,000,000원
  if (mode === 'hf_indv' || mode === 'hf_prob' || mode === 'hf_temp') {
    return {
      assayBase: 0,
      contentTotal: 0,
      hfFormulation: selectedItems.length > 0 ? 26_000_000 : 0,
    };
  }

  // 복합제/백신/스크리닝/의료기기: 0원
  if (mode !== 'drug_single') {
    return { assayBase: 0, contentTotal: 0, hfFormulation: 0 };
  }

  // 의약품 모드
  let hasInVivo = false;
  let hasInVitro = false;
  let contentTotal = 0;

  for (const sel of selectedItems) {
    const im = imMapping[sel.itemId];
    if (!im) continue;

    const [type, assay] = im;
    if (type === 1) hasInVivo = true;
    if (type === 2) hasInVitro = true;

    if (assay === 1) {
      const item = allItems.find((it) => it.id === sel.itemId);
      if (item) {
        contentTotal += calcContentCount(item.duration) * 1_000_000;
      }
    }
  }

  const assayBase = (hasInVivo ? 10_000_000 : 0) + (hasInVitro ? 10_000_000 : 0);

  return { assayBase, contentTotal, hfFormulation: 0 };
}

/**
 * 전체 견적 금액 계산
 *
 * - subtotalTest = 선택된 모든 시험 항목의 가격 합계
 * - subtotalFormulation = formulationCost (조제물분석비)
 * - discountAmount = (subtotalTest + subtotalFormulation) × (discountRate / 100)
 * - totalAmount = subtotalTest + subtotalFormulation - discountAmount
 */
export function calculateTotal(
  selectedItems: SelectedTest[],
  formulationCost: number,
  discountRate: number
): { subtotalTest: number; subtotalFormulation: number; discountAmount: number; totalAmount: number } {
  const subtotalTest = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const subtotalFormulation = formulationCost;
  const discountAmount = Math.round((subtotalTest + subtotalFormulation) * (discountRate / 100));
  const totalAmount = subtotalTest + subtotalFormulation - discountAmount;

  return { subtotalTest, subtotalFormulation, discountAmount, totalAmount };
}

/**
 * 한국 원화 포맷
 * 예: 79000000 → "79,000,000원"
 */
export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

/**
 * 모바일 축약 포맷
 * 만원 단위로 변환하여 표시한다.
 * 예: 79000000 → "7,900만원"
 */
export function formatKRWShort(amount: number): string {
  const man = amount / 10000;
  return man.toLocaleString('ko-KR') + '만원';
}
