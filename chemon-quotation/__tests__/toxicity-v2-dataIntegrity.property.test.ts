/**
 * 독성시험 견적서 v2 — 데이터 무결성 속성 기반 테스트
 *
 * fast-check를 사용한 Property-Based Testing
 */
import * as fc from 'fast-check';
import type { TestMode, ToxicityV2Item, ComboItem, SimpleItem } from '@/types/toxicity-v2';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { COMBO_DATA } from '@/lib/toxicity-v2/data/comboData';
import { VACCINE_DATA } from '@/lib/toxicity-v2/data/vaccineData';
import { SCREEN_DATA, CV_SCREEN_DATA } from '@/lib/toxicity-v2/data/screenData';
import { HF_INDV_DATA, HF_PROB_DATA, HF_TEMP_DATA } from '@/lib/toxicity-v2/data/healthFoodData';
import { MD_BIO_DATA } from '@/lib/toxicity-v2/data/medicalDeviceData';
import { CATS_MAPPING, FN_MAPPING, GL_MAPPING } from '@/lib/toxicity-v2/data/metadata';

// ─── Mode-to-Dataset Mapping ─────────────────────────────────────

interface ModeConfig {
  mode: TestMode;
  data: (ToxicityV2Item | ComboItem | SimpleItem)[];
  expectedCount: number;
  catsKey: string;
}

const MODE_CONFIGS: ModeConfig[] = [
  { mode: 'drug_single', data: TOXICITY_DATA, expectedCount: 104, catsKey: 'drug_single' },
  { mode: 'drug_combo', data: COMBO_DATA, expectedCount: 9, catsKey: 'drug_combo' },
  { mode: 'drug_vaccine', data: VACCINE_DATA, expectedCount: 3, catsKey: 'drug_vaccine' },
  { mode: 'drug_screen_tox', data: SCREEN_DATA, expectedCount: 8, catsKey: 'drug_screen_tox' },
  { mode: 'drug_screen_cv', data: CV_SCREEN_DATA, expectedCount: 6, catsKey: 'drug_screen_cv' },
  { mode: 'hf_indv', data: HF_INDV_DATA, expectedCount: 7, catsKey: 'hf_indv' },
  { mode: 'hf_prob', data: HF_PROB_DATA, expectedCount: 5, catsKey: 'hf_prob' },
  { mode: 'hf_temp', data: HF_TEMP_DATA, expectedCount: 8, catsKey: 'hf_temp' },
  { mode: 'md_bio', data: MD_BIO_DATA, expectedCount: 18, catsKey: 'md_bio' },
];

// ─── Generators ───────────────────────────────────────────────────

const NUM_RUNS = 20;

/** 모드 설정 생성기 */
const arbModeConfig: fc.Arbitrary<ModeConfig> = fc.constantFrom(...MODE_CONFIGS);

// ─── Property Tests ───────────────────────────────────────────────

describe('Feature: toxicity-quotation-v2, Property 7: 모드별 데이터셋 매핑', () => {
  /**
   * **Validates: Requirements 2.2~2.10**
   *
   * For any 시험 모드, 해당 모드로 로딩되는 시험 항목은 모두 해당 모드의
   * 카테고리 목록에 포함되는 카테고리를 가져야 하며,
   * 항목 수는 모드별 정의된 수와 일치해야 한다.
   */
  it('모드별 항목 수가 정의된 수와 일치한다', () => {
    fc.assert(
      fc.property(arbModeConfig, (config) => {
        return config.data.length === config.expectedCount;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('모든 시험 항목의 카테고리가 해당 모드의 카테고리 목록에 포함된다', () => {
    fc.assert(
      fc.property(arbModeConfig, (config) => {
        const cats = CATS_MAPPING[config.catsKey];
        if (!cats) return false;
        const validCats = new Set(cats.filter((c) => c !== '전체'));

        return config.data.every((item) => validCats.has(item.category));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('CATS_MAPPING에 모든 9개 모드가 정의되어 있다', () => {
    fc.assert(
      fc.property(arbModeConfig, (config) => {
        return config.catsKey in CATS_MAPPING;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('각 모드의 CATS_MAPPING 첫 번째 항목은 "전체"이다', () => {
    fc.assert(
      fc.property(arbModeConfig, (config) => {
        const cats = CATS_MAPPING[config.catsKey];
        return cats !== undefined && cats[0] === '전체';
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('데이터셋의 모든 카테고리가 CATS_MAPPING에 빠짐없이 등록되어 있다', () => {
    fc.assert(
      fc.property(arbModeConfig, (config) => {
        const cats = CATS_MAPPING[config.catsKey];
        if (!cats) return false;
        const validCats = new Set(cats.filter((c) => c !== '전체'));
        const dataCats = new Set(config.data.map((item) => item.category));

        // 데이터에 존재하는 모든 카테고리가 CATS_MAPPING에 포함되어야 함
        for (const cat of dataCats) {
          if (!validCats.has(cat)) return false;
        }
        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

// ─── Property 8 Imports ───────────────────────────────────────────

import { TEST_RELATIONS, OPT_IDS } from '@/lib/toxicity-v2/data/relations';
import type { TestRelationNode, TkOptionTree } from '@/types/toxicity-v2';

// ─── Property 8 Helpers ──────────────────────────────────────────

/** TOXICITY_DATA의 모든 유효한 ID 집합 */
const VALID_IDS = new Set(TOXICITY_DATA.map((item) => item.id));

/** TkOptionTree에서 모든 leaf ID를 추출한다 */
function extractTkOptionIds(tkOptions: TkOptionTree): number[] {
  const ids: number[] = [];
  const walk = (obj: number | { [k: string]: number } | TkOptionTree[string]): void => {
    if (typeof obj === 'number') {
      ids.push(obj);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(walk);
    }
  };
  Object.values(tkOptions).forEach(walk);
  return ids;
}

// ─── Generators ──────────────────────────────────────────────────

/** TR_RELATIONS에서 임의의 관계 노드를 선택하는 생성기 */
const arbRelationNode: fc.Arbitrary<TestRelationNode> = fc.constantFrom(...TEST_RELATIONS);

// ─── Property 8 Tests ────────────────────────────────────────────

describe('Feature: toxicity-quotation-v2, Property 8: 시험 관계 트리 무결성', () => {
  /**
   * **Validates: Requirements 7.1, 8.5**
   *
   * For any TR 트리에 정의된 본시험, 해당 본시험의 회복시험 ID(rec)와
   * TK 옵션 ID는 모두 D 배열에 존재하는 유효한 시험 항목 ID여야 한다.
   */

  it('모든 mainTestId가 TOXICITY_DATA에 존재한다', () => {
    fc.assert(
      fc.property(arbRelationNode, (rel) => {
        return VALID_IDS.has(rel.mainTestId);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('모든 recoveryTestId(정의된 경우)가 TOXICITY_DATA에 존재한다', () => {
    fc.assert(
      fc.property(arbRelationNode, (rel) => {
        if (rel.recoveryTestId == null) return true;
        return VALID_IDS.has(rel.recoveryTestId);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('모든 TK 옵션 leaf ID가 TOXICITY_DATA에 존재한다', () => {
    fc.assert(
      fc.property(arbRelationNode, (rel) => {
        if (!rel.tkOptions) return true;
        const tkIds = extractTkOptionIds(rel.tkOptions);
        return tkIds.every((id) => VALID_IDS.has(id));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('모든 tkList ID가 TOXICITY_DATA에 존재한다', () => {
    fc.assert(
      fc.property(arbRelationNode, (rel) => {
        if (!rel.tkList) return true;
        return rel.tkList.every((id) => VALID_IDS.has(id));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('모든 tkSimple ID가 TOXICITY_DATA에 존재한다', () => {
    fc.assert(
      fc.property(arbRelationNode, (rel) => {
        if (rel.tkSimple == null) return true;
        return VALID_IDS.has(rel.tkSimple);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});


// ─── Property 12: 부가 데이터 완전성 ─────────────────────────────

/** TOXICITY_DATA에서 임의의 항목을 선택하는 생성기 */
const arbToxicityItem: fc.Arbitrary<(typeof TOXICITY_DATA)[number]> = fc.constantFrom(...TOXICITY_DATA);

describe('Feature: toxicity-quotation-v2, Property 12: 부가 데이터 완전성', () => {
  /**
   * **Validates: Requirements 10.1, 10.2**
   *
   * For any 의약품 모드의 시험 항목(id 1~104), FN 매핑에 해당 id의
   * 정식명칭이 존재하고, GL 매핑에 해당 id의 가이드라인 정보가 존재해야 한다.
   */

  it('모든 의약품 시험 항목(id 1~104)이 FN_MAPPING에 존재한다', () => {
    fc.assert(
      fc.property(arbToxicityItem, (item) => {
        return item.id in FN_MAPPING;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('FN_MAPPING의 정식명칭은 비어있지 않은 문자열이다', () => {
    fc.assert(
      fc.property(arbToxicityItem, (item) => {
        const fn = FN_MAPPING[item.id];
        return typeof fn === 'string' && fn.length > 0;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('모든 의약품 시험 항목(id 1~104)이 GL_MAPPING에 존재한다', () => {
    fc.assert(
      fc.property(arbToxicityItem, (item) => {
        return item.id in GL_MAPPING;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('GL_MAPPING의 가이드라인 정보는 비어있지 않은 배열이다', () => {
    fc.assert(
      fc.property(arbToxicityItem, (item) => {
        const gl = GL_MAPPING[item.id];
        return Array.isArray(gl) && gl.length > 0;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
