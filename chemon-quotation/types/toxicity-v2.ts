// 독성시험 견적서 v2 타입 정의

/**
 * 시험 모드 열거형
 * 9개 시험 유형을 구분한다.
 */
export type TestMode =
  | 'drug_single'     // 의약품
  | 'drug_combo'      // 복합제
  | 'drug_vaccine'    // 백신
  | 'drug_screen_tox' // 독성 스크리닝
  | 'drug_screen_cv'  // 심혈관계 스크리닝
  | 'hf_indv'         // 건기식 개별인정형
  | 'hf_prob'         // 건기식 프로바이오틱스
  | 'hf_temp'         // 건기식 한시적식품
  | 'md_bio';         // 의료기기 생물학적안전성

/**
 * 투여 경로
 * 경구(oral) 또는 정맥(iv)
 */
export type RouteType = 'oral' | 'iv';

/**
 * 시험 기준
 * KGLP 단독 또는 KGLP+OECD 병행
 */
export type StandardType = 'KGLP' | 'KGLP_OECD';

/**
 * 기본 시험 항목 (D 배열 구조)
 * 의약품 모드의 104개 항목에 사용된다.
 * 경구/정맥 이중 가격 체계를 지원한다.
 */
export interface ToxicityV2Item {
  id: number;
  num: number | null;
  name: string;                  // n: 시험명
  category: string;              // c: 카테고리
  species: string;               // s: 동물종
  duration: string;              // d: 투여기간
  description: string;           // desc: 설명
  priceOral: number | null;      // op: 경구 가격
  routeOral: string;             // or: 경구 투여경로
  weeksOral: number | string;    // ow: 경구 소요기간(주)
  priceIv: number | null;        // ip: 정맥 가격
  routeIv: string;               // ir: 정맥 투여경로
  weeksIv: number | string;      // iw: 정맥 소요기간(주)
  formalName?: string;           // FN 매핑: 정식명칭
  guideline?: string[];          // GL 매핑: 가이드라인
  note?: string;                 // 비고
}

/**
 * 복합제 시험 항목
 * 종수별(2종/3종/4종) 가격 체계를 지원한다.
 */
export interface ComboItem {
  id: number;
  num: number;
  name: string;
  formalName: string;            // fn: 정식명칭
  category: string;
  species: string;
  duration: string;
  description: string;
  priceP2: number;               // p2: 2종 가격
  priceP3: number;               // p3: 3종 가격
  priceP4: number;               // p4: 4종 가격
  weeks: number | string;
  guideline: string[];
  note?: string;
}

/**
 * 건기식/백신/스크리닝/의료기기 시험 항목
 * 단일 가격 체계를 사용한다.
 */
export interface SimpleItem {
  id: number;
  num: number;
  name: string;
  formalName: string;            // fn: 정식명칭
  category: string;
  species: string;
  duration: string;
  description: string;
  price: number;                 // p: 단일 가격
  weeks: number | string;
  guideline: string[];
  note?: string;
}

/**
 * 시험 관계 트리 노드
 * 본시험 → 회복시험, TK 옵션 관계를 정의한다.
 */
export interface TestRelationNode {
  mainTestId: number;
  recoveryTestId?: number;
  tkOptions?: TkOptionTree;
  tkList?: number[];       // 단순 TK 항목 ID 목록 (예: 안전성약리)
  tkSimple?: number;       // 단일 TK 항목 ID
}

/**
 * TK 옵션 트리
 * 채혈방식 → 포인트수 → (채혈횟수) → 시험 항목 ID 매핑
 */
export interface TkOptionTree {
  [method: string]: {                    // "채혈+분석" | "채혈만"
    [points: string]:                    // "6pt" | "8pt"
      number                             // 시험 항목 ID (단순)
      | { [count: string]: number };     // "2회" | "3회" → 시험 항목 ID
  };
}

/**
 * OECD 가격 오버레이
 * KGLP+OECD 기준 선택 시 기본 가격을 대체하는 가격 매핑
 */
export interface OecdOverlay {
  [itemId: number]: {
    oop?: number;  // OECD 경구 가격
    oip?: number;  // OECD 정맥 가격
  };
}

/**
 * 카테고리 색상 매핑
 * UI에서 카테고리를 시각적으로 구분하기 위한 색상 코드
 */
export interface CategoryColorMap {
  [category: string]: string;
}

/**
 * 선택된 시험 항목
 * 견적서에 추가된 개별 시험 항목의 상태를 나타낸다.
 */
export interface SelectedTest {
  id: string;              // 고유 ID (uuid)
  itemId: number;          // 시험 항목 ID
  name: string;
  category: string;
  price: number;           // 계산된 가격
  isOption: boolean;       // 옵션 여부 (회복시험, TK)
  parentId?: string;       // 부모 시험 ID
  tkConfig?: {             // TK 선택 설정
    method: string;
    points: string;
    count?: string;
  };
}

/**
 * 견적서 정보
 * 견적서 표지에 표시되는 기관/담당자 정보
 */
export interface QuotationInfo {
  org: string;
  person: string;
  contact: string;
  email: string;
  purpose: string;
  substance: string;
  quotationNumber: string;
}
