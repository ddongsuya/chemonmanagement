/**
 * 독성시험 견적서 v2 — 필터링 로직 속성 기반 테스트
 *
 * Property 10: 카테고리 필터링 정확성
 * Property 11: 검색 필터링 정확성
 * Property 15: 옵션 항목 숨김
 *
 * V2TestSelector의 필터링 로직을 순수 함수로 추출하여 테스트한다.
 */
import * as fc from 'fast-check';
import type { ToxicityV2Item } from '@/types/toxicity-v2';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { CATS_MAPPING } from '@/lib/toxicity-v2/data/metadata';
import { OPT_IDS } from '@/lib/toxicity-v2/data/relations';

const NUM_RUNS = 20;

// ─── Pure filtering functions (extracted from V2TestSelector) ─────

/** 카테고리 필터: '전체'가 아닌 경우 해당 카테고리만 반환 */
function filterByCategory(items: ToxicityV2Item[], category: string): ToxicityV2Item[] {
  if (category === '전체') return items;
  return items.filter((item) => item.category === category);
}

/** 검색 필터: 시험명(name)에 검색어가 포함된 항목만 반환 (대소문자 무시) */
function filterBySearch(items: ToxicityV2Item[], search: string): ToxicityV2Item[] {
  if (!search) return items;
  const lowerSearch = search.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(lowerSearch));
}

/** OPT_IDS 필터: drug_single 모드에서 옵션 항목을 숨김 */
function filterOutOptIds(items: ToxicityV2Item[]): ToxicityV2Item[] {
  return items.filter((item) => !OPT_IDS.has(item.id));
}

// ─── Generators ───────────────────────────────────────────────────

/** drug_single 모드의 카테고리 중 '전체'를 제외한 실제 카테고리 생성기 */
const drugSingleCategories = CATS_MAPPING['drug_single'].filter((c) => c !== '전체');
const arbCategory: fc.Arbitrary<string> = fc.constantFrom(...drugSingleCategories);

/** TOXICITY_DATA의 실제 시험명에서 부분 문자열을 추출하는 생성기 */
const arbSearchSubstring: fc.Arbitrary<string> = fc
  .constantFrom(...TOXICITY_DATA)
  .chain((item) => {
    const name = item.name;
    // 이름에서 1~전체길이 사이의 부분 문자열 추출
    return fc.tuple(
      fc.integer({ min: 0, max: Math.max(0, name.length - 1) }),
      fc.integer({ min: 1, max: name.length })
    ).map(([start, len]) => {
      const end = Math.min(start + len, name.length);
      return name.substring(start, end);
    });
  });

// ─── Property 10: 카테고리 필터링 정확성 ──────────────────────────

describe('Feature: toxicity-quotation-v2, Property 10: 카테고리 필터링 정확성', () => {
  /**
   * **Validates: Requirements 9.2**
   *
   * For any 카테고리 필터 선택, 필터링 결과의 모든 항목은 선택된 카테고리에
   * 속해야 하며, 해당 카테고리의 모든 항목이 결과에 포함되어야 한다.
   */

  it('필터링 결과의 모든 항목은 선택된 카테고리에 속한다', () => {
    fc.assert(
      fc.property(arbCategory, (category) => {
        const result = filterByCategory(TOXICITY_DATA, category);
        return result.every((item) => item.category === category);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('해당 카테고리의 모든 항목이 결과에 포함된다 (완전성)', () => {
    fc.assert(
      fc.property(arbCategory, (category) => {
        const result = filterByCategory(TOXICITY_DATA, category);
        const expected = TOXICITY_DATA.filter((item) => item.category === category);
        return result.length === expected.length;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('"전체" 카테고리 선택 시 모든 항목이 반환된다', () => {
    const result = filterByCategory(TOXICITY_DATA, '전체');
    expect(result.length).toBe(TOXICITY_DATA.length);
  });
});

// ─── Property 11: 검색 필터링 정확성 ──────────────────────────────

describe('Feature: toxicity-quotation-v2, Property 11: 검색 필터링 정확성', () => {
  /**
   * **Validates: Requirements 9.3**
   *
   * For any 검색어, 필터링 결과의 모든 항목의 시험명(name)은 검색어를 포함해야 한다.
   */

  it('필터링 결과의 모든 항목의 시험명이 검색어를 포함한다', () => {
    fc.assert(
      fc.property(arbSearchSubstring, (search) => {
        const result = filterBySearch(TOXICITY_DATA, search);
        const lowerSearch = search.toLowerCase();
        return result.every((item) =>
          item.name.toLowerCase().includes(lowerSearch)
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('검색어를 포함하는 모든 항목이 결과에 포함된다 (완전성)', () => {
    fc.assert(
      fc.property(arbSearchSubstring, (search) => {
        const result = filterBySearch(TOXICITY_DATA, search);
        const lowerSearch = search.toLowerCase();
        const expected = TOXICITY_DATA.filter((item) =>
          item.name.toLowerCase().includes(lowerSearch)
        );
        return result.length === expected.length;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('빈 검색어는 모든 항목을 반환한다', () => {
    const result = filterBySearch(TOXICITY_DATA, '');
    expect(result.length).toBe(TOXICITY_DATA.length);
  });
});

// ─── Property 15: 옵션 항목 숨김 ─────────────────────────────────

describe('Feature: toxicity-quotation-v2, Property 15: 옵션 항목 숨김', () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * For any 시험 항목 목록, OPT_IDS에 포함된 항목 ID는 기본 시험 목록에
   * 표시되지 않아야 한다.
   */

  it('필터링 결과에 OPT_IDS 항목이 포함되지 않는다', () => {
    const result = filterOutOptIds(TOXICITY_DATA);
    const hasOptId = result.some((item) => OPT_IDS.has(item.id));
    expect(hasOptId).toBe(false);
  });

  it('OPT_IDS에 포함되지 않은 모든 항목은 결과에 포함된다', () => {
    const result = filterOutOptIds(TOXICITY_DATA);
    const expected = TOXICITY_DATA.filter((item) => !OPT_IDS.has(item.id));
    expect(result.length).toBe(expected.length);
  });

  it('임의의 TOXICITY_DATA 항목에 대해 OPT_IDS 필터가 정확하다', () => {
    const arbItem: fc.Arbitrary<ToxicityV2Item> = fc.constantFrom(...TOXICITY_DATA);
    fc.assert(
      fc.property(arbItem, (item) => {
        const result = filterOutOptIds(TOXICITY_DATA);
        const isInResult = result.some((r) => r.id === item.id);
        const isOptId = OPT_IDS.has(item.id);
        // OPT_IDS에 포함된 항목은 결과에 없어야 하고, 아닌 항목은 있어야 한다
        return isOptId ? !isInResult : isInResult;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
