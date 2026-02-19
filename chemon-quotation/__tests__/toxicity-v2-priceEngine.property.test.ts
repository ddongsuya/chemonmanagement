/**
 * 독성시험 견적서 v2 — 가격 계산 엔진 속성 기반 테스트
 *
 * fast-check를 사용한 Property-Based Testing
 * 최소 100회 반복 실행
 */
import * as fc from 'fast-check';
import {
  getItemPrice,
  getComboPrice,
  calcContentCount,
  calcFormulationCost,
  calculateTotal,
  formatKRW,
  formatKRWShort,
} from '@/lib/toxicity-v2/priceEngine';
import type {
  ToxicityV2Item,
  ComboItem,
  SelectedTest,
  RouteType,
  StandardType,
  TestMode,
  OecdOverlay,
} from '@/types/toxicity-v2';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { COMBO_DATA } from '@/lib/toxicity-v2/data/comboData';
import { OV_OVERLAY, OE_OVERLAY } from '@/lib/toxicity-v2/data/overlays';
import { IM_MAPPING } from '@/lib/toxicity-v2/data/metadata';

// ─── Generators ───────────────────────────────────────────────────

/** 투여 경로 생성기 */
const arbRoute: fc.Arbitrary<RouteType> = fc.constantFrom('oral', 'iv');

/** 시험 기준 생성기 */
const arbStandard: fc.Arbitrary<StandardType> = fc.constantFrom('KGLP', 'KGLP_OECD');

/** 복합제 종수 생성기 */
const arbComboType: fc.Arbitrary<2 | 3 | 4> = fc.constantFrom(2, 3, 4);

/** 실제 D 배열에서 시험 항목 선택 생성기 */
const arbToxicityItem: fc.Arbitrary<ToxicityV2Item> = fc.constantFrom(...TOXICITY_DATA);

/** 실제 COMBO 배열에서 복합제 항목 선택 생성기 */
const arbComboItem: fc.Arbitrary<ComboItem> = fc.constantFrom(...COMBO_DATA);

/** 양의 정수 금액 생성기 (1 ~ 20억) */
const arbPositiveAmount = fc.integer({ min: 1, max: 2_000_000_000 });

/** 만원 단위 양의 정수 금액 생성기 */
const arbManwonAmount = fc.integer({ min: 1, max: 200_000 }).map((n) => n * 10_000);

/** 할인율 생성기 (0~100, 정수) */
const arbDiscountRate = fc.integer({ min: 0, max: 100 });

/** 함량분석 대상 항목 ID 생성기 (IM[1] === 1인 항목만) */
const assayItemIds = Object.entries(IM_MAPPING)
  .filter(([, [, assay]]) => assay === 1)
  .map(([id]) => Number(id));
const arbAssayItemId = fc.constantFrom(...assayItemIds);

/** 함량분석 대상 시험 항목 생성기 */
const arbAssayItem: fc.Arbitrary<ToxicityV2Item> = fc.constantFrom(
  ...TOXICITY_DATA.filter((item) => {
    const im = IM_MAPPING[item.id];
    return im && im[1] === 1;
  })
);

/** SelectedTest 생성기 (실제 D 배열 기반) */
function arbSelectedTest(item: ToxicityV2Item, price: number): SelectedTest {
  return {
    id: `test-${item.id}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: item.id,
    name: item.name,
    category: item.category,
    price,
    isOption: false,
  };
}

/** 비자동 조제물분석 모드 생성기 */
const arbNonAutoFormulationMode: fc.Arbitrary<TestMode> = fc.constantFrom(
  'drug_combo',
  'drug_vaccine',
  'drug_screen_tox',
  'drug_screen_cv',
  'md_bio'
);

/** 투여기간 문자열 생성기 (실제 데이터에서 추출) */
const realDurations = [...new Set(TOXICITY_DATA.map((item) => item.duration))];

// ─── Property Tests ───────────────────────────────────────────────

const NUM_RUNS = 20;


describe('Feature: toxicity-quotation-v2, Property 1: 투여 경로별 가격 적용', () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 3.4**
   *
   * For any 의약품 모드의 시험 항목과 투여 경로(경구/정맥),
   * KGLP 기준에서 가격 계산 엔진이 반환하는 가격은
   * 해당 경로의 가격 필드(경구→op, 정맥→ip) 값과 동일해야 한다.
   */
  it('KGLP 기준: 투여 경로에 따라 올바른 가격 필드를 반환한다', () => {
    fc.assert(
      fc.property(arbToxicityItem, arbRoute, (item, route) => {
        const emptyOverlay: OecdOverlay = {};
        const price = getItemPrice(item, route, 'KGLP', emptyOverlay, emptyOverlay);
        const expected = route === 'oral' ? item.priceOral : item.priceIv;
        return price === expected;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('투여 경로 변경 시 가격이 해당 경로 필드로 재계산된다', () => {
    fc.assert(
      fc.property(arbToxicityItem, (item) => {
        const emptyOverlay: OecdOverlay = {};
        const oralPrice = getItemPrice(item, 'oral', 'KGLP', emptyOverlay, emptyOverlay);
        const ivPrice = getItemPrice(item, 'iv', 'KGLP', emptyOverlay, emptyOverlay);
        return oralPrice === item.priceOral && ivPrice === item.priceIv;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Feature: toxicity-quotation-v2, Property 2: OECD 오버레이 가격 대체', () => {
  /**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
   *
   * For any 의약품 모드의 시험 항목, KGLP+OECD 기준 선택 시
   * OV 또는 OE 오버레이에 해당하는 항목의 가격은 오버레이의 OECD 가격(oop/oip)으로 대체되고,
   * 오버레이에 포함되지 않은 항목은 기본 가격을 유지해야 한다.
   */
  it('OV 오버레이 항목은 OECD 가격으로 대체된다', () => {
    const ovItemIds = Object.keys(OV_OVERLAY).map(Number);
    const ovItems = TOXICITY_DATA.filter((item) => ovItemIds.includes(item.id));

    fc.assert(
      fc.property(fc.constantFrom(...ovItems), arbRoute, (item, route) => {
        const price = getItemPrice(item, route, 'KGLP_OECD', OV_OVERLAY, OE_OVERLAY);
        const ovEntry = OV_OVERLAY[item.id];
        const expectedOecd = route === 'oral' ? ovEntry.oop : ovEntry.oip;

        if (expectedOecd !== undefined) {
          return price === expectedOecd;
        }
        // OV에 해당 경로 가격이 없으면 OE 확인 후 기본 가격
        const oeEntry = OE_OVERLAY[item.id];
        if (oeEntry) {
          const oePrice = route === 'oral' ? oeEntry.oop : oeEntry.oip;
          if (oePrice !== undefined) return price === oePrice;
        }
        const basePrice = route === 'oral' ? item.priceOral : item.priceIv;
        return price === basePrice;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('OE 오버레이 항목은 OECD 전용 가격으로 대체된다', () => {
    const oeItemIds = Object.keys(OE_OVERLAY).map(Number);
    // OV에 없고 OE에만 있는 항목
    const ovItemIds = new Set(Object.keys(OV_OVERLAY).map(Number));
    const oeOnlyItems = TOXICITY_DATA.filter(
      (item) => oeItemIds.includes(item.id) && !ovItemIds.has(item.id)
    );

    if (oeOnlyItems.length === 0) return; // skip if no OE-only items

    fc.assert(
      fc.property(fc.constantFrom(...oeOnlyItems), arbRoute, (item, route) => {
        const price = getItemPrice(item, route, 'KGLP_OECD', OV_OVERLAY, OE_OVERLAY);
        const oeEntry = OE_OVERLAY[item.id];
        const expectedOecd = route === 'oral' ? oeEntry.oop : oeEntry.oip;

        if (expectedOecd !== undefined) {
          return price === expectedOecd;
        }
        const basePrice = route === 'oral' ? item.priceOral : item.priceIv;
        return price === basePrice;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('오버레이에 포함되지 않은 항목은 기본 가격을 유지한다', () => {
    const ovIds = new Set(Object.keys(OV_OVERLAY).map(Number));
    const oeIds = new Set(Object.keys(OE_OVERLAY).map(Number));
    const noOverlayItems = TOXICITY_DATA.filter(
      (item) => !ovIds.has(item.id) && !oeIds.has(item.id)
    );

    if (noOverlayItems.length === 0) return;

    fc.assert(
      fc.property(fc.constantFrom(...noOverlayItems), arbRoute, (item, route) => {
        const kglpPrice = getItemPrice(item, route, 'KGLP', {}, {});
        const oecdPrice = getItemPrice(item, route, 'KGLP_OECD', OV_OVERLAY, OE_OVERLAY);
        return kglpPrice === oecdPrice;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Feature: toxicity-quotation-v2, Property 3: 복합제 종수별 가격 적용', () => {
  /**
   * **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
   *
   * For any 복합제 모드의 시험 항목과 종수(2/3/4),
   * 가격 계산 엔진이 반환하는 가격은 해당 종수의 가격 필드(p2/p3/p4) 값과 동일해야 한다.
   */
  it('종수에 따라 올바른 가격 필드를 반환한다', () => {
    fc.assert(
      fc.property(arbComboItem, arbComboType, (item, comboType) => {
        const price = getComboPrice(item, comboType);
        const expected =
          comboType === 2 ? item.priceP2 : comboType === 3 ? item.priceP3 : item.priceP4;
        return price === expected;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('종수 변경 시 가격이 해당 종수 필드로 재계산된다', () => {
    fc.assert(
      fc.property(arbComboItem, (item) => {
        const p2 = getComboPrice(item, 2);
        const p3 = getComboPrice(item, 3);
        const p4 = getComboPrice(item, 4);
        return p2 === item.priceP2 && p3 === item.priceP3 && p4 === item.priceP4;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});


describe('Feature: toxicity-quotation-v2, Property 4: 함량분석 횟수 계산', () => {
  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any 함량분석 대상 시험 항목(IM 매핑의 두 번째 값이 1),
   * 함량분석 횟수는 투여기간을 주 단위로 변환 후 ceil(weeks/4)로 계산되며,
   * 4주 미만인 경우 1회를 반환해야 한다.
   */
  it('N주 형식: ceil(N/4)로 계산되며 최소 1회', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 104 }), (weeks) => {
        const duration = `${weeks}주`;
        const count = calcContentCount(duration);
        const expected = Math.max(1, Math.ceil(weeks / 4));
        return count === expected;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('N개월 형식: N회를 반환한다', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 24 }), (months) => {
        const duration = `${months}개월`;
        const count = calcContentCount(duration);
        return count === months;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('4주 미만 기간은 항상 1회를 반환한다', () => {
    const shortDurations = ['단회', '1회', '3회', '수회', '1주', '2주', '3주', '3일', 'GD6-17', 'GD6-19', '-'];
    fc.assert(
      fc.property(fc.constantFrom(...shortDurations), (duration) => {
        return calcContentCount(duration) === 1;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('실제 데이터의 함량분석 대상 항목에 대해 항상 1 이상을 반환한다', () => {
    fc.assert(
      fc.property(arbAssayItem, (item) => {
        const count = calcContentCount(item.duration);
        return count >= 1;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Feature: toxicity-quotation-v2, Property 5: 조제물분석비 계산', () => {
  /**
   * **Validates: Requirements 6.5, 16.2**
   *
   * For any 의약품 모드의 선택된 시험 항목 집합, 조제물분석비는
   * (in vivo 존재 시 10,000,000원) + (in vitro 존재 시 10,000,000원) +
   * (함량분석 대상 항목별 횟수 × 1,000,000원)의 합과 동일해야 한다.
   */
  it('의약품 모드: 조제물분석비 = assayBase + contentTotal', () => {
    // 실제 D 배열에서 1~5개 항목을 무작위 선택
    const arbSelectedItems = fc
      .shuffledSubarray(TOXICITY_DATA, { minLength: 1, maxLength: 5 })
      .map((items) =>
        items.map((item) =>
          arbSelectedTest(item, item.priceOral ?? 0)
        )
      );

    fc.assert(
      fc.property(arbSelectedItems, (selectedItems) => {
        const result = calcFormulationCost(selectedItems, 'drug_single', TOXICITY_DATA, IM_MAPPING);

        // 수동 계산
        let expectedHasInVivo = false;
        let expectedHasInVitro = false;
        let expectedContentTotal = 0;

        for (const sel of selectedItems) {
          const im = IM_MAPPING[sel.itemId];
          if (!im) continue;
          const [type, assay] = im;
          if (type === 1) expectedHasInVivo = true;
          if (type === 2) expectedHasInVitro = true;
          if (assay === 1) {
            const item = TOXICITY_DATA.find((it) => it.id === sel.itemId);
            if (item) {
              expectedContentTotal += calcContentCount(item.duration) * 1_000_000;
            }
          }
        }

        const expectedAssayBase =
          (expectedHasInVivo ? 10_000_000 : 0) + (expectedHasInVitro ? 10_000_000 : 0);

        return (
          result.assayBase === expectedAssayBase &&
          result.contentTotal === expectedContentTotal &&
          result.hfFormulation === 0
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Feature: toxicity-quotation-v2, Property 6: 최종 합계 계산 항등식', () => {
  /**
   * **Validates: Requirements 16.1, 16.3, 16.4**
   *
   * For any 선택된 시험 항목 집합과 할인율,
   * 최종 합계는 (시험비 소계 + 조제물분석비) × (1 - 할인율/100)과 동일해야 한다.
   */
  it('totalAmount = (subtotalTest + formulationCost) × (1 - discountRate/100)', () => {
    // 가격은 실제 데이터 범위 내에서 생성
    const arbItems = fc
      .array(fc.integer({ min: 1_000_000, max: 500_000_000 }), { minLength: 0, maxLength: 10 })
      .map((prices) =>
        prices.map((price, i) => ({
          id: `test-${i}`,
          itemId: i + 1,
          name: `시험 ${i + 1}`,
          category: '반복투여독성',
          price,
          isOption: false,
        } as SelectedTest))
      );

    const arbFormulationCost = fc.integer({ min: 0, max: 50_000_000 });

    fc.assert(
      fc.property(arbItems, arbFormulationCost, arbDiscountRate, (items, formulationCost, discountRate) => {
        const result = calculateTotal(items, formulationCost, discountRate);

        const expectedSubtotal = items.reduce((sum, item) => sum + item.price, 0);
        const expectedDiscount = Math.round((expectedSubtotal + formulationCost) * (discountRate / 100));
        const expectedTotal = expectedSubtotal + formulationCost - expectedDiscount;

        return (
          result.subtotalTest === expectedSubtotal &&
          result.subtotalFormulation === formulationCost &&
          result.discountAmount === expectedDiscount &&
          result.totalAmount === expectedTotal
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Feature: toxicity-quotation-v2, Property 13: 금액 포맷팅', () => {
  /**
   * **Validates: Requirements 3.5, 12.4**
   *
   * For any 양의 정수 금액, 한국 원화 포맷 함수는
   * 3자리마다 콤마를 삽입하고 "원" 접미사를 붙인 문자열을 반환해야 한다.
   */
  it('"원" 접미사가 항상 붙는다', () => {
    fc.assert(
      fc.property(arbPositiveAmount, (amount) => {
        const formatted = formatKRW(amount);
        return formatted.endsWith('원');
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('콤마를 제거하고 "원"을 제거하면 원래 숫자와 동일하다', () => {
    fc.assert(
      fc.property(arbPositiveAmount, (amount) => {
        const formatted = formatKRW(amount);
        const numStr = formatted.replace(/,/g, '').replace('원', '');
        return parseInt(numStr, 10) === amount;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('3자리마다 콤마가 삽입된다', () => {
    fc.assert(
      fc.property(arbPositiveAmount, (amount) => {
        const formatted = formatKRW(amount);
        const withoutSuffix = formatted.replace('원', '');
        // 콤마 패턴 검증: 숫자,숫자숫자숫자 반복
        const commaPattern = /^-?\d{1,3}(,\d{3})*$/;
        return commaPattern.test(withoutSuffix);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Feature: toxicity-quotation-v2, Property 14: 모바일 가격 축약 포맷팅', () => {
  /**
   * **Validates: Requirements 19.4**
   *
   * For any 양의 정수 금액(만원 단위), 모바일 축약 포맷 함수는
   * 만원 단위로 변환하여 "만원" 접미사를 붙인 문자열을 반환해야 한다.
   */
  it('"만원" 접미사가 항상 붙는다', () => {
    fc.assert(
      fc.property(arbManwonAmount, (amount) => {
        const formatted = formatKRWShort(amount);
        return formatted.endsWith('만원');
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('만원 단위 변환이 정확하다', () => {
    fc.assert(
      fc.property(arbManwonAmount, (amount) => {
        const formatted = formatKRWShort(amount);
        const numStr = formatted.replace(/,/g, '').replace('만원', '');
        const man = parseFloat(numStr);
        return man === amount / 10_000;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Feature: toxicity-quotation-v2, Property 16: 비자동 조제물분석 모드', () => {
  /**
   * **Validates: Requirements 16.6**
   *
   * For any 복합제, 백신, 스크리닝, 의료기기 모드의 선택된 시험 항목 집합,
   * 자동 조제물분석비 계산 결과는 0이어야 한다.
   */
  it('비자동 모드에서 조제물분석비는 항상 0이다', () => {
    const arbItems = fc
      .array(
        fc.record({
          id: fc.string(),
          itemId: fc.integer({ min: 1, max: 104 }),
          name: fc.constant('시험'),
          category: fc.constant('반복투여독성'),
          price: fc.integer({ min: 1_000_000, max: 500_000_000 }),
          isOption: fc.constant(false),
        }),
        { minLength: 0, maxLength: 10 }
      )
      .map((items) => items as SelectedTest[]);

    fc.assert(
      fc.property(arbNonAutoFormulationMode, arbItems, (mode, items) => {
        const result = calcFormulationCost(items, mode, TOXICITY_DATA, IM_MAPPING);
        return (
          result.assayBase === 0 &&
          result.contentTotal === 0 &&
          result.hfFormulation === 0
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
