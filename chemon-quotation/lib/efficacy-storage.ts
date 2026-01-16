/**
 * 효력시험 견적서 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 효력시험 견적 데이터 관리
 * Requirements: 5.1, 5.2, 7.4
 */

import {
  SavedEfficacyQuotation,
  EfficacyMasterData,
  EfficacyQuotationStatus,
  EFFICACY_STORAGE_KEYS,
} from '@/types/efficacy';
import {
  getCachedEfficacyPriceItems,
  getCachedEfficacyModels,
} from '@/hooks/useMasterData';

// Import default master data as fallback
import defaultMasterData from '@/data/efficacy_master_data.json';

// ============================================
// Quotation CRUD Functions
// ============================================

/**
 * 모든 효력시험 견적서 조회
 */
export function getAllEfficacyQuotations(): SavedEfficacyQuotation[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(EFFICACY_STORAGE_KEYS.QUOTATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 단일 효력시험 견적서 조회 (ID)
 */
export function getEfficacyQuotationById(id: string): SavedEfficacyQuotation | null {
  const quotations = getAllEfficacyQuotations();
  return quotations.find((q) => q.id === id) || null;
}

/**
 * 견적번호로 효력시험 견적서 조회
 */
export function getEfficacyQuotationByNumber(
  quotationNumber: string
): SavedEfficacyQuotation | null {
  const quotations = getAllEfficacyQuotations();
  return quotations.find((q) => q.quotation_number === quotationNumber) || null;
}

/**
 * 효력시험 견적서 저장
 * Requirements: 5.1, 5.2
 */
export function saveEfficacyQuotation(
  quotation: SavedEfficacyQuotation
): SavedEfficacyQuotation {
  const quotations = getAllEfficacyQuotations();
  const existingIndex = quotations.findIndex((q) => q.id === quotation.id);

  if (existingIndex >= 0) {
    quotations[existingIndex] = {
      ...quotation,
      updated_at: new Date().toISOString(),
    };
  } else {
    quotations.unshift(quotation); // 최신 항목을 앞에 추가
  }

  localStorage.setItem(
    EFFICACY_STORAGE_KEYS.QUOTATIONS,
    JSON.stringify(quotations)
  );
  return quotation;
}

/**
 * 효력시험 견적서 삭제
 */
export function deleteEfficacyQuotation(id: string): boolean {
  const quotations = getAllEfficacyQuotations();
  const filtered = quotations.filter((q) => q.id !== id);

  if (filtered.length === quotations.length) return false;

  localStorage.setItem(
    EFFICACY_STORAGE_KEYS.QUOTATIONS,
    JSON.stringify(filtered)
  );
  return true;
}

/**
 * 효력시험 견적서 상태 업데이트
 */
export function updateEfficacyQuotationStatus(
  id: string,
  status: EfficacyQuotationStatus
): SavedEfficacyQuotation | null {
  const quotations = getAllEfficacyQuotations();
  const index = quotations.findIndex((q) => q.id === id);

  if (index < 0) return null;

  quotations[index] = {
    ...quotations[index],
    status,
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(
    EFFICACY_STORAGE_KEYS.QUOTATIONS,
    JSON.stringify(quotations)
  );
  return quotations[index];
}

// ============================================
// Quotation Query Functions
// ============================================

/**
 * 고객별 효력시험 견적서 조회
 */
export function getEfficacyQuotationsByCustomer(
  customerId: string
): SavedEfficacyQuotation[] {
  const quotations = getAllEfficacyQuotations();
  return quotations.filter((q) => q.customer_id === customerId);
}

/**
 * 상태별 효력시험 견적서 조회
 */
export function getEfficacyQuotationsByStatus(
  status: EfficacyQuotationStatus
): SavedEfficacyQuotation[] {
  const quotations = getAllEfficacyQuotations();
  return quotations.filter((q) => q.status === status);
}

/**
 * 모델별 효력시험 견적서 조회
 */
export function getEfficacyQuotationsByModel(
  modelId: string
): SavedEfficacyQuotation[] {
  const quotations = getAllEfficacyQuotations();
  return quotations.filter((q) => q.model_id === modelId);
}

// ============================================
// Quotation Number Generation
// ============================================

/**
 * 다음 견적번호 시퀀스 조회
 */
function getNextQuotationSequence(): number {
  if (typeof window === 'undefined') return 1;

  try {
    const counter = localStorage.getItem(EFFICACY_STORAGE_KEYS.QUOTATION_COUNTER);
    return counter ? parseInt(counter, 10) + 1 : 1;
  } catch {
    return 1;
  }
}

/**
 * 견적번호 시퀀스 저장
 */
function saveQuotationSequence(seq: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EFFICACY_STORAGE_KEYS.QUOTATION_COUNTER, seq.toString());
}

/**
 * 효력시험 견적번호 생성
 * Format: EQ-YYYY-NNNN
 * Requirements: 5.1
 */
export function generateEfficacyQuotationNumber(): string {
  const year = new Date().getFullYear();
  const seq = getNextQuotationSequence();
  const seqStr = seq.toString().padStart(4, '0');

  // 시퀀스 저장
  saveQuotationSequence(seq);

  return `EQ-${year}-${seqStr}`;
}

/**
 * 효력시험 견적번호 유효성 검사
 * Pattern: EQ-YYYY-NNNN
 */
export function isValidEfficacyQuotationNumber(quotationNumber: string): boolean {
  const pattern = /^EQ-\d{4}-\d{4}$/;
  return pattern.test(quotationNumber);
}

// ============================================
// Master Data Functions
// ============================================

/**
 * 효력시험 마스터 데이터 조회
 * 백엔드 API 캐시 데이터 우선 사용, 없으면 기본 데이터 반환
 * Requirements: 7.4
 */
export function getEfficacyMasterData(): EfficacyMasterData {
  // 백엔드 API 캐시에서 데이터 가져오기
  const cachedPriceItems = getCachedEfficacyPriceItems();
  const cachedModels = getCachedEfficacyModels();

  // 캐시된 데이터가 있으면 변환하여 반환
  if (cachedPriceItems.length > 0 || cachedModels.length > 0) {
    // API 응답을 기존 형식으로 변환
    const priceMaster = cachedPriceItems.map((item) => ({
      item_id: item.itemId,
      category: item.category,
      subcategory: item.subcategory || '',
      item_name: item.itemName,
      item_detail: item.itemDetail || '',
      unit_price: Number(item.unitPrice),
      unit: item.unit || '',
      remarks: item.remarks || '',
      is_active: item.isActive,
    }));

    const models = cachedModels.map((model) => ({
      model_id: model.modelId,
      model_name: model.modelName,
      category: model.category,
      indication: model.indication || '',
      animal_type: model.animalType || '',
      induction_method: model.inductionMethod || '',
      duration: model.duration || '',
      description: model.description || '',
      is_active: model.isActive,
    }));

    // model_items는 기본 데이터에서 가져옴 (아직 백엔드에 없음)
    const modelItems = (defaultMasterData as EfficacyMasterData).model_items || [];

    return {
      price_master: priceMaster,
      models: models,
      model_items: modelItems,
    } as EfficacyMasterData;
  }

  // 캐시가 없으면 localStorage 또는 기본 데이터 반환
  if (typeof window === 'undefined') {
    return defaultMasterData as EfficacyMasterData;
  }

  try {
    const data = localStorage.getItem(EFFICACY_STORAGE_KEYS.MASTER_DATA);
    if (data) {
      return JSON.parse(data) as EfficacyMasterData;
    }
    return defaultMasterData as EfficacyMasterData;
  } catch {
    return defaultMasterData as EfficacyMasterData;
  }
}

/**
 * 효력시험 마스터 데이터 저장
 * Requirements: 7.4
 */
export function saveEfficacyMasterData(masterData: EfficacyMasterData): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(
    EFFICACY_STORAGE_KEYS.MASTER_DATA,
    JSON.stringify(masterData)
  );
}

/**
 * 효력시험 마스터 데이터 초기화 (기본값으로 리셋)
 */
export function resetEfficacyMasterData(): EfficacyMasterData {
  if (typeof window === 'undefined') {
    return defaultMasterData as EfficacyMasterData;
  }

  localStorage.removeItem(EFFICACY_STORAGE_KEYS.MASTER_DATA);
  return defaultMasterData as EfficacyMasterData;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validation error codes
 * Requirements: 8.4
 */
export type ValidationErrorCode = 'E001' | 'E002' | 'E003' | 'E004' | 'E005' | 'E006';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate required fields for efficacy quotation
 * Property 14: Required Field Validation
 * Requirements: 8.4
 * 
 * For any quotation save attempt, if customer_id is empty OR project_name is empty 
 * OR model_id is null OR items array is empty, the save SHALL be rejected with appropriate error.
 */
export function validateEfficacyQuotation(data: {
  customer_id: string;
  project_name: string;
  model_id: string | null;
  items: Array<{ quantity: number; multiplier: number }>;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // E001: Customer not selected
  if (!data.customer_id || data.customer_id.trim() === '') {
    errors.push({
      code: 'E001',
      message: '고객사를 선택해주세요',
      field: 'customer_id',
    });
  }

  // E002: Project name empty
  if (!data.project_name || data.project_name.trim() === '') {
    errors.push({
      code: 'E002',
      message: '프로젝트명을 입력해주세요',
      field: 'project_name',
    });
  }

  // E003: Model not selected
  if (!data.model_id || data.model_id.trim() === '') {
    errors.push({
      code: 'E003',
      message: '효력시험 모델을 선택해주세요',
      field: 'model_id',
    });
  }

  // E004: No items selected
  if (!data.items || data.items.length === 0) {
    errors.push({
      code: 'E004',
      message: '최소 1개 이상의 항목을 선택해주세요',
      field: 'items',
    });
  }

  // E005 & E006: Invalid quantity or multiplier in items
  if (data.items && data.items.length > 0) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      
      if (item.quantity < 1) {
        errors.push({
          code: 'E005',
          message: `수량은 1 이상이어야 합니다 (항목 ${i + 1})`,
          field: `items[${i}].quantity`,
        });
      }
      
      if (item.multiplier < 1) {
        errors.push({
          code: 'E006',
          message: `횟수는 1 이상이어야 합니다 (항목 ${i + 1})`,
          field: `items[${i}].multiplier`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// Statistics Functions
// ============================================

/**
 * 효력시험 견적 통계 계산
 */
export function getEfficacyQuotationStats() {
  const quotations = getAllEfficacyQuotations();

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthQuotations = quotations.filter((q) =>
    q.created_at.startsWith(thisMonth)
  );

  return {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === 'draft').length,
    sent: quotations.filter((q) => q.status === 'sent').length,
    accepted: quotations.filter((q) => q.status === 'accepted').length,
    rejected: quotations.filter((q) => q.status === 'rejected').length,
    monthlyCount: thisMonthQuotations.length,
    monthlyTotal: thisMonthQuotations.reduce((sum, q) => sum + q.grand_total, 0),
    totalAmount: quotations.reduce((sum, q) => sum + q.grand_total, 0),
    acceptedAmount: quotations
      .filter((q) => q.status === 'accepted')
      .reduce((sum, q) => sum + q.grand_total, 0),
  };
}

/**
 * 모델별 견적 통계
 */
export function getEfficacyQuotationStatsByModel() {
  const quotations = getAllEfficacyQuotations();
  const statsByModel: Record<
    string,
    { count: number; totalAmount: number; modelName: string }
  > = {};

  quotations.forEach((q) => {
    if (!statsByModel[q.model_id]) {
      statsByModel[q.model_id] = {
        count: 0,
        totalAmount: 0,
        modelName: q.model_name,
      };
    }
    statsByModel[q.model_id].count += 1;
    statsByModel[q.model_id].totalAmount += q.grand_total;
  });

  return statsByModel;
}

// ============================================
// Copy Quotation Function
// ============================================

/**
 * 효력시험 견적서 복사
 * Requirements: 9.1, 9.2
 */
export function copyEfficacyQuotation(
  sourceId: string
): SavedEfficacyQuotation | null {
  const source = getEfficacyQuotationById(sourceId);
  if (!source) return null;

  const now = new Date().toISOString();
  const newQuotationNumber = generateEfficacyQuotationNumber();

  const copied: SavedEfficacyQuotation = {
    ...source,
    id: crypto.randomUUID(),
    quotation_number: newQuotationNumber,
    status: 'draft',
    created_at: now,
    updated_at: now,
  };

  return saveEfficacyQuotation(copied);
}
