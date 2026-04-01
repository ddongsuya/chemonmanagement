// types/efficacy-v2.ts
// 효력시험 견적 V2 — 모델 기반 견적 시스템 타입 정의

// ============================================================
// Study Model (시험 모델 템플릿)
// ============================================================

export interface StudyModelTemplate {
  id: string;
  title: string;
  titleEn?: string;
  titleKr?: string;
  category: string;
  categoryCode: string;
  species: string[];
  speciesRaw: string;
  sex: 'male' | 'female' | 'both';
  ageWeeks: number | null;
  inductionMethod: string;
  durationWeeks: number | null;
  reportWeeks: number;
  evalItemsRaw: string;
  positiveControl: string;
  isInVitro: boolean;
  cellLine: string;
  cultureCondition: string;
  scheduleDurations: string[];
}

// ============================================================
// Study Design (시험 디자인 - 사용자 편집 가능)
// ============================================================

export interface StudyDesign {
  id: string;
  modelId: string;
  title: string;

  // Client info
  clientOrg: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  purpose: string;

  // Animal
  species: string;
  sex: 'male' | 'female' | 'both';
  ageWeeks: number;
  animalsPerGroup: number;

  // Schedule
  acclimationDays: number;
  scheduleSteps: ScheduleStep[];

  // Groups
  groups: StudyGroup[];

  // Eval items
  evalItems: EvalItem[];

  // Options
  glpType: 'GLP' | 'NON_GLP';
  inductionMethod: string;
  positiveControl: string;
  route: string;
  routeDetail: string;
}


// ============================================================
// Schedule (스케줄 시각화 핵심)
// ============================================================

export interface ScheduleStep {
  id: string;
  order: number;
  label: string;
  duration: number;
  durationUnit: 'day' | 'week' | 'hour';
  type: ScheduleStepType;
  evalItems: string[];
  description?: string;
  isSacrifice?: boolean;
  sacrificeWeek?: number;
  color?: string;
}

export type ScheduleStepType =
  | 'acclimation'
  | 'induction'
  | 'administration'
  | 'observation'
  | 'sacrifice'
  | 'analysis'
  | 'report'
  | 'cell_culture'
  | 'custom';

export const STEP_TYPE_CONFIG: Record<ScheduleStepType, { label: string; color: string; icon: string }> = {
  acclimation:    { label: '순화',     color: '#6366f1', icon: '🏠' },
  induction:      { label: '유발',     color: '#ef4444', icon: '⚡' },
  administration: { label: '투여',     color: '#3b82f6', icon: '💉' },
  observation:    { label: '관찰',     color: '#10b981', icon: '👁' },
  sacrifice:      { label: '부검',     color: '#f59e0b', icon: '🔬' },
  analysis:       { label: '분석',     color: '#8b5cf6', icon: '📊' },
  report:         { label: '보고서',   color: '#6b7280', icon: '📝' },
  cell_culture:   { label: '세포배양', color: '#ec4899', icon: '🧫' },
  custom:         { label: '사용자 정의', color: '#64748b', icon: '⚙' },
};

// ============================================================
// Groups (군구성)
// ============================================================

export interface StudyGroup {
  id: string;
  groupNumber: number;
  treatment: TreatmentType;
  label: string;
  animalCount: number;
  sacrificeWeek?: number;
  dose?: string;
  route?: string;
}

export type TreatmentType = 'NORMAL' | 'VEHICLE' | 'TEST' | 'REFERENCE' | 'POSITIVE' | 'SHAM';

export const TREATMENT_LABELS: Record<TreatmentType, string> = {
  NORMAL: '정상군',
  VEHICLE: '유발군 (Vehicle)',
  TEST: '시험군',
  REFERENCE: '대조군 (Reference)',
  POSITIVE: '양성대조군',
  SHAM: 'Sham군',
};

// ============================================================
// Evaluation Items (평가항목)
// ============================================================

export interface EvalItem {
  id: string;
  name: string;
  code: string;
  category: EvalCategory;
  costBasis: CostBasis;
  isOutsourced: boolean;
  outsourceTo?: string;
  isEnabled: boolean;
  frequency?: string;
  timingDescription?: string;
  unitPriceCode?: string;
}

export type EvalCategory =
  | '관찰' | '측정' | '혈액검사' | '조직병리'
  | '영상' | '행동평가' | '분자생물학' | '기타';

export type CostBasis =
  | 'PER_ANIMAL' | 'PER_ANIMAL_PER_DAY' | 'PER_ANIMAL_PER_SESSION'
  | 'PER_THREAD' | 'PER_SAMPLE' | 'PER_SESSION' | 'FIXED';

// ============================================================
// Unit Price (단가)
// ============================================================

export interface UnitPrice {
  id: string;
  code: string;
  category: string;
  name: string;
  price: number;
  unit: string;
  species?: string;
  isActive: boolean;
}

// ============================================================
// Cost Calculation (비용 계산)
// ============================================================

export interface CostItem {
  id: string;
  category: string;
  name: string;
  section?: string;
  unitPrice: number;
  quantity: number;
  multiplier: number;
  subtotal: number;
  note?: string;
  isOverridden: boolean;
  sortOrder: number;
}

export interface HousingPeriod {
  label: string;
  days: number;
  animalCount: number;
  sacrificedCount: number;
}

export interface CalculationResult {
  groups: StudyGroup[];
  housingPeriods: HousingPeriod[];
  costItems: CostItem[];
  summary: CalculationSummary;
}

export interface CalculationSummary {
  totalAnimals: number;
  spareAnimals: number;
  totalCost: number;
  totalDurationWeeks: number;
}

// ============================================================
// Quotation (견적서)
// ============================================================

export interface Quotation {
  id: string;
  quotationNumber: string;
  version: number;
  studyDesign: StudyDesign;
  costItems: CostItem[];
  summary: CalculationSummary;
  totalAmount: number;
  discountRate: number;
  discountedAmount: number;
  profitMargin: number;
  finalAmount: number;
  vat: number;
  issuedAt: string;
  validDays: number;
  notes: string;
  status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
}
