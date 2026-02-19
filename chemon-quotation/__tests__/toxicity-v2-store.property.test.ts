/**
 * 독성시험 견적서 v2 — 스토어 속성 기반 테스트
 *
 * fast-check를 사용한 Property-Based Testing
 */
import * as fc from 'fast-check';
import type { SelectedTest } from '@/types/toxicity-v2';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';

// ─── Constants ────────────────────────────────────────────────────

const NUM_RUNS = 20;

// ─── Generators ───────────────────────────────────────────────────

/** 고유 UUID 생성기 */
const arbUuid = fc.uuid();

/** SelectedTest 생성기 (본시험) */
function arbMainTest(id: string): fc.Arbitrary<SelectedTest> {
  return fc.record({
    id: fc.constant(id),
    itemId: fc.integer({ min: 1, max: 104 }),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    category: fc.constantFrom('단회투여독성', '반복투여독성', '유전독성', '안전성약리'),
    price: fc.integer({ min: 0, max: 500_000_000 }),
    isOption: fc.constant(false),
  });
}

/** SelectedTest 생성기 (옵션 — 회복시험/TK, parentId 지정) */
function arbOptionTest(parentId: string): fc.Arbitrary<SelectedTest> {
  return fc.record({
    id: arbUuid,
    itemId: fc.integer({ min: 1, max: 104 }),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    category: fc.constantFrom('반복투여독성', '독성동태'),
    price: fc.integer({ min: 0, max: 500_000_000 }),
    isOption: fc.constant(true),
    parentId: fc.constant(parentId),
  });
}

/** SelectedTest 생성기 (관련 없는 시험 — parentId 없음) */
function arbUnrelatedTest(): fc.Arbitrary<SelectedTest> {
  return fc.record({
    id: arbUuid,
    itemId: fc.integer({ min: 1, max: 104 }),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    category: fc.constantFrom('단회투여독성', '유전독성', '안전성약리', '생식독성'),
    price: fc.integer({ min: 0, max: 500_000_000 }),
    isOption: fc.constant(false),
  });
}

/**
 * 본시험 + 옵션(0~3개) + 관련 없는 시험(0~3개) 조합 생성기
 * 반환: { mainTest, options, unrelated, allTests }
 */
function arbTestScenario() {
  return arbUuid.chain((mainId) =>
    fc.tuple(
      arbMainTest(mainId),
      fc.array(arbOptionTest(mainId), { minLength: 0, maxLength: 3 }),
      fc.array(arbUnrelatedTest(), { minLength: 0, maxLength: 3 })
    ).map(([mainTest, options, unrelated]) => ({
      mainTest,
      options,
      unrelated,
      allTests: [mainTest, ...options, ...unrelated],
    }))
  );
}

// ─── Property Tests ───────────────────────────────────────────────

describe('Feature: toxicity-quotation-v2, Property 9: 본시험 제거 시 연쇄 삭제', () => {
  /**
   * **Validates: Requirements 7.3**
   *
   * For any 선택된 시험 목록에서 본시험을 제거하면,
   * 해당 본시험의 parentId를 가진 모든 옵션 항목(회복시험, TK)도
   * 함께 제거되어야 한다.
   */

  afterEach(() => {
    useToxicityV2Store.getState().reset();
  });

  it('본시험 제거 시 해당 본시험과 연결된 모든 옵션 항목이 함께 제거된다', () => {
    fc.assert(
      fc.property(arbTestScenario(), (scenario) => {
        const { mainTest, options, unrelated, allTests } = scenario;

        // 스토어에 모든 시험 항목 설정
        useToxicityV2Store.setState({
          selectedTests: allTests,
          mode: 'drug_single',
        });

        // 본시험 제거
        useToxicityV2Store.getState().removeTest(mainTest.id);

        const remaining = useToxicityV2Store.getState().selectedTests;

        // 1. 본시험이 제거되었는지 확인
        const mainStillExists = remaining.some((t) => t.id === mainTest.id);
        expect(mainStillExists).toBe(false);

        // 2. 본시험의 parentId를 가진 모든 옵션이 제거되었는지 확인
        const orphanedOptions = remaining.filter((t) => t.parentId === mainTest.id);
        expect(orphanedOptions).toHaveLength(0);

        // 3. 관련 없는 시험은 모두 남아있는지 확인
        for (const u of unrelated) {
          const stillExists = remaining.some((t) => t.id === u.id);
          expect(stillExists).toBe(true);
        }

        // 4. 남은 항목 수 = 관련 없는 시험 수
        expect(remaining.length).toBe(unrelated.length);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
