/**
 * 가격 계산 엔진 단위 테스트
 */
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
  OecdOverlay,
} from '@/types/toxicity-v2';

// ─── Helper factories ─────────────────────────────────────────────

function makeItem(overrides: Partial<ToxicityV2Item> = {}): ToxicityV2Item {
  return {
    id: 12,
    num: 12,
    name: '설치류 4주 반복투여 독성',
    category: '반복투여독성',
    species: 'SD rat',
    duration: '4주',
    description: '',
    priceOral: 79_000_000,
    routeOral: '경구',
    weeksOral: 22,
    priceIv: 86_000_000,
    routeIv: '정맥',
    weeksIv: 22,
    ...overrides,
  };
}

function makeComboItem(overrides: Partial<ComboItem> = {}): ComboItem {
  return {
    id: 1,
    num: 1,
    name: '복합제 4주 반복투여 독성(설치류)',
    formalName: '',
    category: '반복투여독성',
    species: 'SD rat',
    duration: '4주',
    description: '',
    priceP2: 100_000_000,
    priceP3: 120_000_000,
    priceP4: 140_000_000,
    weeks: 22,
    guideline: [],
    ...overrides,
  };
}

function makeSelected(overrides: Partial<SelectedTest> = {}): SelectedTest {
  return {
    id: 'test-1',
    itemId: 12,
    name: '설치류 4주 반복투여 독성',
    category: '반복투여독성',
    price: 79_000_000,
    isOption: false,
    ...overrides,
  };
}

// ─── getItemPrice ─────────────────────────────────────────────────

describe('getItemPrice', () => {
  const emptyOverlay: OecdOverlay = {};

  it('KGLP + oral → priceOral', () => {
    const item = makeItem();
    expect(getItemPrice(item, 'oral', 'KGLP', emptyOverlay, emptyOverlay)).toBe(79_000_000);
  });

  it('KGLP + iv → priceIv', () => {
    const item = makeItem();
    expect(getItemPrice(item, 'iv', 'KGLP', emptyOverlay, emptyOverlay)).toBe(86_000_000);
  });

  it('returns null when price is null', () => {
    const item = makeItem({ priceOral: null });
    expect(getItemPrice(item, 'oral', 'KGLP', emptyOverlay, emptyOverlay)).toBeNull();
  });

  it('KGLP_OECD with OV overlay replaces price', () => {
    const item = makeItem({ id: 28 });
    const ov: OecdOverlay = { 28: { oop: 294_000_000, oip: 397_000_000 } };
    expect(getItemPrice(item, 'oral', 'KGLP_OECD', ov, emptyOverlay)).toBe(294_000_000);
    expect(getItemPrice(item, 'iv', 'KGLP_OECD', ov, emptyOverlay)).toBe(397_000_000);
  });

  it('KGLP_OECD with OE overlay replaces price', () => {
    const item = makeItem({ id: 45 });
    const oe: OecdOverlay = { 45: { oop: 252_000_000, oip: 258_000_000 } };
    expect(getItemPrice(item, 'oral', 'KGLP_OECD', emptyOverlay, oe)).toBe(252_000_000);
  });

  it('KGLP_OECD falls back to base price when no overlay', () => {
    const item = makeItem({ id: 999 });
    expect(getItemPrice(item, 'oral', 'KGLP_OECD', emptyOverlay, emptyOverlay)).toBe(79_000_000);
  });

  it('OV overlay takes priority over OE overlay', () => {
    const item = makeItem({ id: 28 });
    const ov: OecdOverlay = { 28: { oop: 294_000_000 } };
    const oe: OecdOverlay = { 28: { oop: 999_000_000 } };
    expect(getItemPrice(item, 'oral', 'KGLP_OECD', ov, oe)).toBe(294_000_000);
  });

  it('OV partial overlay (only oip) falls back to base for oral', () => {
    const item = makeItem({ id: 60 });
    const ov: OecdOverlay = { 60: { oip: 99_000_000 } };
    // OV has no oop for id 60, so falls through to OE check, then base
    expect(getItemPrice(item, 'oral', 'KGLP_OECD', ov, emptyOverlay)).toBe(79_000_000);
  });
});

// ─── getComboPrice ────────────────────────────────────────────────

describe('getComboPrice', () => {
  const item = makeComboItem();

  it('returns p2 for comboType 2', () => {
    expect(getComboPrice(item, 2)).toBe(100_000_000);
  });

  it('returns p3 for comboType 3', () => {
    expect(getComboPrice(item, 3)).toBe(120_000_000);
  });

  it('returns p4 for comboType 4', () => {
    expect(getComboPrice(item, 4)).toBe(140_000_000);
  });
});

// ─── calcContentCount ─────────────────────────────────────────────

describe('calcContentCount', () => {
  it.each([
    ['단회', 1],
    ['1회', 1],
    ['3회', 1],
    ['수회', 1],
    ['1주', 1],
    ['2주', 1],
    ['3주', 1],
    ['4주', 1],
    ['13주', 4],   // ceil(13/4) = 4
    ['26주', 7],   // ceil(26/4) = 7
    ['39주', 10],  // ceil(39/4) = 10
    ['3일', 1],
    ['GD6-17', 1],
    ['GD6-19', 1],
    ['GD6~PND21', 1],
    ['-', 1],
    ['4-9주', 3],  // ceil(9/4) = 3
    ['1개월', 1],
    ['3개월', 3],
  ])('calcContentCount("%s") → %d', (duration, expected) => {
    expect(calcContentCount(duration)).toBe(expected);
  });
});

// ─── calcFormulationCost ──────────────────────────────────────────

describe('calcFormulationCost', () => {
  const allItems: ToxicityV2Item[] = [
    makeItem({ id: 6, duration: '2주' }),   // in vivo, assay=1
    makeItem({ id: 71, duration: '-' }),     // in vitro, assay=0
    makeItem({ id: 18, duration: '13주' }), // in vivo, assay=1
  ];

  const imMapping: Record<number, [number, number]> = {
    6: [1, 1],   // in vivo, 함량분석 적용
    71: [2, 0],  // in vitro, 함량분석 제외
    18: [1, 1],  // in vivo, 함량분석 적용
  };

  it('drug_single: in vivo + in vitro + content analysis', () => {
    const selected = [
      makeSelected({ itemId: 6, price: 73_000_000 }),
      makeSelected({ itemId: 71, price: 6_500_000 }),
      makeSelected({ itemId: 18, price: 112_000_000 }),
    ];
    const result = calcFormulationCost(selected, 'drug_single', allItems, imMapping);
    // in vivo exists → 10M, in vitro exists → 10M
    expect(result.assayBase).toBe(20_000_000);
    // id 6: 2주 → 1회 × 1M = 1M, id 18: 13주 → 4회 × 1M = 4M
    expect(result.contentTotal).toBe(5_000_000);
    expect(result.hfFormulation).toBe(0);
  });

  it('drug_single: only in vivo items', () => {
    const selected = [makeSelected({ itemId: 6, price: 73_000_000 })];
    const result = calcFormulationCost(selected, 'drug_single', allItems, imMapping);
    expect(result.assayBase).toBe(10_000_000);
    expect(result.contentTotal).toBe(1_000_000);
  });

  it('drug_single: empty selection', () => {
    const result = calcFormulationCost([], 'drug_single', allItems, imMapping);
    expect(result.assayBase).toBe(0);
    expect(result.contentTotal).toBe(0);
  });

  it('hf_indv: fixed 26M when items selected', () => {
    const selected = [makeSelected()];
    const result = calcFormulationCost(selected, 'hf_indv', [], imMapping);
    expect(result.hfFormulation).toBe(26_000_000);
    expect(result.assayBase).toBe(0);
    expect(result.contentTotal).toBe(0);
  });

  it('hf_prob: 0 when no items selected', () => {
    const result = calcFormulationCost([], 'hf_prob', [], imMapping);
    expect(result.hfFormulation).toBe(0);
  });

  it('drug_combo: always 0', () => {
    const selected = [makeSelected()];
    const result = calcFormulationCost(selected, 'drug_combo', [], imMapping);
    expect(result.assayBase).toBe(0);
    expect(result.contentTotal).toBe(0);
    expect(result.hfFormulation).toBe(0);
  });

  it('drug_vaccine: always 0', () => {
    const result = calcFormulationCost([makeSelected()], 'drug_vaccine', [], imMapping);
    expect(result.assayBase + result.contentTotal + result.hfFormulation).toBe(0);
  });

  it('md_bio: always 0', () => {
    const result = calcFormulationCost([makeSelected()], 'md_bio', [], imMapping);
    expect(result.assayBase + result.contentTotal + result.hfFormulation).toBe(0);
  });
});

// ─── calculateTotal ───────────────────────────────────────────────

describe('calculateTotal', () => {
  it('calculates totals with no discount', () => {
    const selected = [
      makeSelected({ price: 79_000_000 }),
      makeSelected({ price: 86_000_000 }),
    ];
    const result = calculateTotal(selected, 25_000_000, 0);
    expect(result.subtotalTest).toBe(165_000_000);
    expect(result.subtotalFormulation).toBe(25_000_000);
    expect(result.discountAmount).toBe(0);
    expect(result.totalAmount).toBe(190_000_000);
  });

  it('calculates totals with 10% discount', () => {
    const selected = [makeSelected({ price: 100_000_000 })];
    const result = calculateTotal(selected, 0, 10);
    expect(result.subtotalTest).toBe(100_000_000);
    expect(result.discountAmount).toBe(10_000_000);
    expect(result.totalAmount).toBe(90_000_000);
  });

  it('empty selection returns all zeros', () => {
    const result = calculateTotal([], 0, 0);
    expect(result.subtotalTest).toBe(0);
    expect(result.subtotalFormulation).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it('discount applies to test + formulation sum', () => {
    const selected = [makeSelected({ price: 80_000_000 })];
    const result = calculateTotal(selected, 20_000_000, 10);
    // (80M + 20M) × 10% = 10M
    expect(result.discountAmount).toBe(10_000_000);
    expect(result.totalAmount).toBe(90_000_000);
  });
});

// ─── formatKRW ────────────────────────────────────────────────────

describe('formatKRW', () => {
  it('formats 79000000 → "79,000,000원"', () => {
    expect(formatKRW(79_000_000)).toBe('79,000,000원');
  });

  it('formats 0 → "0원"', () => {
    expect(formatKRW(0)).toBe('0원');
  });

  it('formats 1230000000 → "1,230,000,000원"', () => {
    expect(formatKRW(1_230_000_000)).toBe('1,230,000,000원');
  });
});

// ─── formatKRWShort ───────────────────────────────────────────────

describe('formatKRWShort', () => {
  it('formats 79000000 → "7,900만원"', () => {
    expect(formatKRWShort(79_000_000)).toBe('7,900만원');
  });

  it('formats 0 → "0만원"', () => {
    expect(formatKRWShort(0)).toBe('0만원');
  });

  it('formats 10000 → "1만원"', () => {
    expect(formatKRWShort(10_000)).toBe('1만원');
  });

  it('formats 1230000000 → "123,000만원"', () => {
    expect(formatKRWShort(1_230_000_000)).toBe('123,000만원');
  });
});
