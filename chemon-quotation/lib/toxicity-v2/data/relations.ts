/**
 * 시험 관계 트리 (TR) 및 옵션 항목 ID 집합 (OPT_IDS)
 *
 * 본시험 → 회복시험, TK 옵션 관계를 정의한다.
 * OPT_IDS는 기본 시험 목록에서 숨겨야 하는 옵션 항목 ID 집합이다.
 */
import type { TestRelationNode, TkOptionTree } from '@/types/toxicity-v2';

/**
 * TEST_RELATIONS: 본시험 → 회복시험/TK 옵션 관계 트리
 *
 * 관계 유형:
 * - rec + tkOptions: 회복시험 + TK 옵션 트리 (채혈방식→포인트수→[채혈횟수]→항목ID)
 * - tkList: 단순 TK 항목 ID 목록 (안전성약리 등)
 * - tkSimple: 단일 TK 항목 ID
 */
export const TEST_RELATIONS: TestRelationNode[] = [
  // 설치류 2주 반복투여 독성 (id=6)
  {
    mainTestId: 6,
    recoveryTestId: 7,
    tkOptions: {
      '채혈+분석': { '6pt': 8, '8pt': 9 },
      '채혈만': { '6pt': 10, '8pt': 11 },
    },
  },
  // 설치류 4주 반복투여 독성 (id=12)
  {
    mainTestId: 12,
    recoveryTestId: 13,
    tkOptions: {
      '채혈+분석': { '6pt': 14, '8pt': 15 },
      '채혈만': { '6pt': 16, '8pt': 17 },
    },
  },
  // 설치류 13주 반복투여 독성 (id=18)
  {
    mainTestId: 18,
    recoveryTestId: 19,
    tkOptions: {
      '채혈+분석': {
        '6pt': { '2회': 20, '3회': 24 },
        '8pt': { '2회': 21, '3회': 25 },
      },
      '채혈만': {
        '6pt': { '2회': 22, '3회': 26 },
        '8pt': { '2회': 23, '3회': 27 },
      },
    },
  },
  // 설치류 26주 반복투여 독성 (id=28)
  {
    mainTestId: 28,
    recoveryTestId: 29,
    tkOptions: {
      '채혈+분석': {
        '6pt': { '2회': 30, '3회': 34 },
        '8pt': { '2회': 31, '3회': 35 },
      },
      '채혈만': {
        '6pt': { '2회': 32, '3회': 36 },
        '8pt': { '2회': 33, '3회': 37 },
      },
    },
  },
  // 비설치류 2주 반복투여 독성 (id=45)
  {
    mainTestId: 45,
    recoveryTestId: 46,
    tkOptions: {
      '채혈+분석': { '6pt': 47, '8pt': 48 },
    },
  },
  // 비설치류 4주 반복투여 독성 (id=49)
  {
    mainTestId: 49,
    recoveryTestId: 50,
    tkOptions: {
      '채혈+분석': { '6pt': 51, '8pt': 52 },
    },
  },
  // 비설치류 13주 반복투여 독성 (id=53)
  {
    mainTestId: 53,
    recoveryTestId: 54,
    tkOptions: {
      '채혈+분석': {
        '6pt': { '2회': 55, '3회': 57 },
        '8pt': { '2회': 56, '3회': 58 },
      },
    },
  },
  // 비설치류 26주 반복투여 독성 (id=59)
  {
    mainTestId: 59,
    recoveryTestId: 60,
    tkOptions: {
      '채혈+분석': {
        '6pt': { '2회': 61, '3회': 63 },
        '8pt': { '2회': 62, '3회': 64 },
      },
    },
  },
  // 비설치류 39주 반복투여 독성 (id=65)
  {
    mainTestId: 65,
    recoveryTestId: 66,
    tkOptions: {
      '채혈+분석': {
        '6pt': { '2회': 67, '3회': 69 },
        '8pt': { '2회': 68, '3회': 70 },
      },
    },
  },
  // 안전성약리 — hERG (id=84)
  {
    mainTestId: 84,
    tkList: [85, 86],
  },
  // 안전성약리 — Irwin/FOB (id=88)
  {
    mainTestId: 88,
    tkList: [89, 90],
  },
  // 발암성시험 관련 (id=101)
  {
    mainTestId: 101,
    tkSimple: 102,
  },
  // 발암성시험 관련 (id=103)
  {
    mainTestId: 103,
    tkSimple: 104,
  },
];

/**
 * OPT_IDS: 기본 시험 목록에서 숨겨야 하는 옵션 항목 ID 집합
 *
 * TR 트리에서 회복시험(rec), TK 옵션(tk), TK 목록(tk_list), TK 단순(tk_simple)에
 * 해당하는 모든 항목 ID를 수집한다.
 */
function collectOptionIds(relations: TestRelationNode[]): Set<number> {
  const ids = new Set<number>();

  for (const rel of relations) {
    if (rel.recoveryTestId != null) {
      ids.add(rel.recoveryTestId);
    }

    if (rel.tkOptions) {
      const walk = (obj: TkOptionTree[string] | number | { [k: string]: number }): void => {
        if (typeof obj === 'number') {
          ids.add(obj);
        } else if (typeof obj === 'object') {
          Object.values(obj).forEach(walk);
        }
      };
      Object.values(rel.tkOptions).forEach(walk);
    }

    if (rel.tkList) {
      rel.tkList.forEach((id) => ids.add(id));
    }

    if (rel.tkSimple != null) {
      ids.add(rel.tkSimple);
    }
  }

  return ids;
}

export const OPT_IDS: Set<number> = collectOptionIds(TEST_RELATIONS);
