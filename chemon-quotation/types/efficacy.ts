/**
 * 효력시험 견적 모듈 타입 정의
 * Requirements: 1.1, 2.1, 5.2
 */

// ============================================
// Master Data Types
// ============================================

/**
 * 단가 항목 (Price Master)
 * 182개 항목의 마스터 데이터
 */
export interface PriceItem {
  item_id: string;           // "ANI-001"
  category: string;          // "동물비"
  subcategory: string | null; // "설치류"
  item_name: string;         // "SD랫드"
  item_detail: string;       // "7주령"
  unit_price: number;        // 22000
  unit: string;              // "/head"
  remarks: string;           // 비고
  is_active: boolean;        // 활성 여부
}

/**
 * 효력시험 모델 (22개 질환 모델)
 */
export interface EfficacyModel {
  model_id: string;          // "EFF-001"
  model_name: string;        // "모발형성"
  category: string;          // "피부"
  indication: string;        // "탈모, 발모촉진"
  description: string;       // "누드마우스 피내투여 후..."
  is_active: boolean;        // 활성 여부
}

/**
 * 모델별 항목 매핑 (Model Item Pool)
 * 각 모델에서 사용 가능한 항목 목록
 */
export interface ModelItem {
  model_id: string;          // "EFF-001"
  model_name: string;        // "모발형성"
  item_id: string;           // "ANI-007"
  item_name: string;         // "누드마우스"
  is_default: boolean;       // true = 기본 항목, false = 옵션 항목
  typical_qty: number;       // 기본 수량 (예: 70)
  typical_mult: number;      // 기본 횟수 (예: 1)
  usage_note: string;        // 사용 참고 (예: "기본 동물")
}

/**
 * 효력시험 마스터 데이터 전체 구조
 */
export interface EfficacyMasterData {
  price_master: PriceItem[];
  models: EfficacyModel[];
  model_items: ModelItem[];
}

// ============================================
// Quotation Data Types
// ============================================

/**
 * 선택된 효력시험 항목
 * 견적서에 포함된 개별 항목
 */
export interface SelectedEfficacyItem {
  id: string;                // 선택 항목의 고유 ID (UUID)
  item_id: string;           // price_master 참조 ID
  item_name: string;         // 항목명
  category: string;          // 카테고리
  unit_price: number;        // 단가
  unit: string;              // 단위
  quantity: number;          // 수량
  multiplier: number;        // 횟수
  amount: number;            // 금액 = unit_price × quantity × multiplier
  is_default: boolean;       // 기본 항목 여부
  usage_note: string;        // 사용 참고
}

/**
 * 저장된 효력시험 견적서
 */
export interface SavedEfficacyQuotation {
  id: string;                          // 견적서 고유 ID
  quotation_number: string;            // "EQ-2024-0001"
  quotation_type: 'efficacy';          // 견적 유형 (효력시험)

  // Customer Info
  customer_id: string;                 // 고객사 ID
  customer_name: string;               // 고객사명

  // Project Info
  project_name: string;                // 프로젝트명

  // Model Info
  model_id: string;                    // 선택된 모델 ID
  model_name: string;                  // 모델명
  model_category: string;              // 모델 카테고리
  indication: string;                  // 적응증

  // Items
  items: SelectedEfficacyItem[];       // 선택된 항목 목록

  // Calculations
  subtotal_by_category: Record<string, number>; // 카테고리별 소계
  subtotal: number;                    // 소계 (VAT 제외)
  vat: number;                         // VAT (10%)
  grand_total: number;                 // 총계 (VAT 포함)

  // Metadata
  valid_days: number;                  // 유효 기간 (일)
  valid_until: string;                 // 유효 만료일 (ISO date string)
  notes: string;                       // 비고
  status: EfficacyQuotationStatus;     // 상태
  created_at: string;                  // 생성일 (ISO date string)
  updated_at: string;                  // 수정일 (ISO date string)
}

/**
 * 효력시험 견적서 상태
 */
export type EfficacyQuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

// ============================================
// Storage Keys
// ============================================

export const EFFICACY_STORAGE_KEYS = {
  QUOTATIONS: 'chemon_efficacy_quotations',
  MASTER_DATA: 'chemon_efficacy_master_data',
  QUOTATION_COUNTER: 'chemon_efficacy_quotation_counter',
} as const;

// ============================================
// Form/Input Types
// ============================================

/**
 * 효력시험 견적 생성 폼 데이터
 */
export interface EfficacyQuotationFormData {
  customer_id: string;
  customer_name: string;
  project_name: string;
  valid_days: number;
  notes: string;
  model_id: string;
  items: SelectedEfficacyItem[];
}

/**
 * 항목 업데이트 입력
 */
export interface ItemUpdateInput {
  item_id: string;
  quantity: number;
  multiplier: number;
}

// ============================================
// Study Design Types (군 구성 & 스케쥴)
// ============================================

/**
 * 시험군 (Group)
 */
export interface StudyGroup {
  id: string;                // 고유 ID
  groupNumber: number;       // 군 번호 (1, 2, 3...)
  treatment: string;         // 처리 (Vehicle, Test article I, etc.)
  dose: string;              // 용량 (TBD, 10 mg/kg, etc.)
  animalCount: number;       // N수 (동물 수)
}

/**
 * 스케쥴 단계 (Schedule Phase)
 */
export interface SchedulePhase {
  id: string;                // 고유 ID
  name: string;              // 단계명 (Acclimation, Test article treatment, etc.)
  duration: number;          // 기간 (숫자)
  durationUnit: 'day' | 'week' | 'month'; // 기간 단위
  color: string;             // 색상 (hex)
  order: number;             // 순서
}

/**
 * 스케쥴 이벤트 마커 (측정 시점 등)
 */
export interface ScheduleEvent {
  id: string;                // 고유 ID
  name: string;              // 이벤트명 (Grip strength, Sacrifice, etc.)
  phaseId: string;           // 해당 단계 ID
  position: number;          // 단계 내 위치 (0-100%)
  color: string;             // 화살표 색상
}

/**
 * 시험 디자인 전체 구조
 */
export interface StudyDesign {
  // 기본 정보
  modelName: string;         // 모델명 (Senile sarcopenia)
  animalInfo: {
    species: string;         // 종 (C57BL/6J mice)
    sex: string;             // 성별 (male)
    age: string;             // 연령 (18M)
  };
  
  // 군 구성
  groups: StudyGroup[];
  
  // 스케쥴
  phases: SchedulePhase[];
  events: ScheduleEvent[];
}
