/**
 * 효력시험 견적서 관리
 * - 백엔드 API 연동 완료
 * Requirements: 5.1, 5.2, 7.4
 */

import {
  SavedEfficacyQuotation,
  EfficacyMasterData,
  EfficacyQuotationStatus,
} from '@/types/efficacy';
import {
  getCachedEfficacyPriceItems,
  getCachedEfficacyModels,
} from '@/hooks/useMasterData';
import { efficacyQuotationApi } from './efficacy-api';

// Import default master data as fallback
import defaultMasterData from '@/data/efficacy_master_data.json';

// ============================================
// Quotation CRUD Functions (API 기반)
// ============================================

/**
 * 모든 효력시험 견적서 조회 (API)
 */
export async function getAllEfficacyQuotationsAsync(): Promise<SavedEfficacyQuotation[]> {
  try {
    return await efficacyQuotationApi.getAll();
  } catch {
    return [];
  }
}

/**
 * 단일 효력시험 견적서 조회 (API)
 */
export async function getEfficacyQuotationByIdAsync(id: string): Promise<SavedEfficacyQuotation | null> {
  try {
    return await efficacyQuotationApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 견적번호로 효력시험 견적서 조회 (API)
 */
export async function getEfficacyQuotationByNumberAsync(
  quotationNumber: string
): Promise<SavedEfficacyQuotation | null> {
  try {
    return await efficacyQuotationApi.getByNumber(quotationNumber);
  } catch {
    return null;
  }
}

/**
 * 효력시험 견적서 저장 (API)
 * Requirements: 5.1, 5.2
 */
export async function saveEfficacyQuotationAsync(
  quotation: SavedEfficacyQuotation
): Promise<SavedEfficacyQuotation> {
  if (quotation.id) {
    // 기존 견적서 업데이트
    return await efficacyQuotationApi.update(quotation.id, quotation);
  } else {
    // 새 견적서 생성
    const { id, quotation_number, created_at, updated_at, ...createData } = quotation;
    return await efficacyQuotationApi.create(createData);
  }
}

/**
 * 효력시험 견적서 삭제 (API)
 */
export async function deleteEfficacyQuotationAsync(id: string): Promise<boolean> {
  try {
    return await efficacyQuotationApi.delete(id);
  } catch {
    return false;
  }
}

/**
 * 효력시험 견적서 상태 업데이트 (API)
 */
export async function updateEfficacyQuotationStatusAsync(
  id: string,
  status: EfficacyQuotationStatus
): Promise<SavedEfficacyQuotation | null> {
  try {
    return await efficacyQuotationApi.updateStatus(id, status);
  } catch {
    return null;
  }
}

// ============================================
// Quotation Query Functions (API 기반)
// ============================================

/**
 * 고객별 효력시험 견적서 조회 (API)
 */
export async function getEfficacyQuotationsByCustomerAsync(
  customerId: string
): Promise<SavedEfficacyQuotation[]> {
  try {
    return await efficacyQuotationApi.getByCustomerId(customerId);
  } catch {
    return [];
  }
}

/**
 * 상태별 효력시험 견적서 조회 (API)
 */
export async function getEfficacyQuotationsByStatusAsync(
  status: EfficacyQuotationStatus
): Promise<SavedEfficacyQuotation[]> {
  try {
    return await efficacyQuotationApi.getByStatus(status);
  } catch {
    return [];
  }
}

// ============================================
// Quotation Number Generation
// ============================================

/**
 * 효력시험 견적번호 생성
 * Format: EQ-YYYY-NNNN
 * Note: 실제 번호는 백엔드에서 생성됨
 * Requirements: 5.1
 */
export function generateEfficacyQuotationNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-4);
  return `EQ-${year}-${timestamp}`;
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

    // model_items는 기본 데이터에서 가져옴
    const modelItems = (defaultMasterData as EfficacyMasterData).model_items || [];

    return {
      price_master: priceMaster,
      models: models,
      model_items: modelItems,
    } as EfficacyMasterData;
  }

  // 캐시가 없으면 기본 데이터 반환
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
 */
export function validateEfficacyQuotation(data: {
  customer_id: string;
  project_name: string;
  model_id: string | null;
  items: Array<{ quantity: number; multiplier: number }>;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.customer_id || data.customer_id.trim() === '') {
    errors.push({
      code: 'E001',
      message: '고객사를 선택해주세요',
      field: 'customer_id',
    });
  }

  if (!data.project_name || data.project_name.trim() === '') {
    errors.push({
      code: 'E002',
      message: '프로젝트명을 입력해주세요',
      field: 'project_name',
    });
  }

  if (!data.model_id || data.model_id.trim() === '') {
    errors.push({
      code: 'E003',
      message: '효력시험 모델을 선택해주세요',
      field: 'model_id',
    });
  }

  if (!data.items || data.items.length === 0) {
    errors.push({
      code: 'E004',
      message: '최소 1개 이상의 항목을 선택해주세요',
      field: 'items',
    });
  }

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
// Statistics Functions (API 기반)
// ============================================

/**
 * 효력시험 견적 통계 계산 (API)
 */
export async function getEfficacyQuotationStatsAsync() {
  try {
    return await efficacyQuotationApi.getStats();
  } catch {
    return {
      total: 0,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      totalAmount: 0,
      acceptedAmount: 0,
    };
  }
}

// ============================================
// Copy Quotation Function (API 기반)
// ============================================

/**
 * 효력시험 견적서 복사 (API)
 * Requirements: 9.1, 9.2
 */
export async function copyEfficacyQuotationAsync(
  sourceId: string
): Promise<SavedEfficacyQuotation | null> {
  try {
    return await efficacyQuotationApi.copy(sourceId);
  } catch {
    return null;
  }
}

// ============================================
// Legacy Sync Functions (테스트 호환성 유지)
// ============================================

// 동기 함수들은 테스트 호환성을 위해 빈 배열/null 반환
export function getAllEfficacyQuotations(): SavedEfficacyQuotation[] {
  console.warn('getAllEfficacyQuotations is deprecated. Use getAllEfficacyQuotationsAsync instead.');
  return [];
}

export function getEfficacyQuotationById(id: string): SavedEfficacyQuotation | null {
  console.warn('getEfficacyQuotationById is deprecated. Use getEfficacyQuotationByIdAsync instead.');
  return null;
}

export function getEfficacyQuotationByNumber(quotationNumber: string): SavedEfficacyQuotation | null {
  console.warn('getEfficacyQuotationByNumber is deprecated. Use getEfficacyQuotationByNumberAsync instead.');
  return null;
}

export function saveEfficacyQuotation(quotation: SavedEfficacyQuotation): SavedEfficacyQuotation {
  console.warn('saveEfficacyQuotation is deprecated. Use saveEfficacyQuotationAsync instead.');
  return quotation;
}

export function deleteEfficacyQuotation(id: string): boolean {
  console.warn('deleteEfficacyQuotation is deprecated. Use deleteEfficacyQuotationAsync instead.');
  return false;
}

export function updateEfficacyQuotationStatus(id: string, status: EfficacyQuotationStatus): SavedEfficacyQuotation | null {
  console.warn('updateEfficacyQuotationStatus is deprecated. Use updateEfficacyQuotationStatusAsync instead.');
  return null;
}

export function getEfficacyQuotationsByCustomer(customerId: string): SavedEfficacyQuotation[] {
  console.warn('getEfficacyQuotationsByCustomer is deprecated. Use getEfficacyQuotationsByCustomerAsync instead.');
  return [];
}

export function getEfficacyQuotationsByStatus(status: EfficacyQuotationStatus): SavedEfficacyQuotation[] {
  console.warn('getEfficacyQuotationsByStatus is deprecated. Use getEfficacyQuotationsByStatusAsync instead.');
  return [];
}

export function getEfficacyQuotationStats() {
  console.warn('getEfficacyQuotationStats is deprecated. Use getEfficacyQuotationStatsAsync instead.');
  return {
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    monthlyCount: 0,
    monthlyTotal: 0,
    totalAmount: 0,
    acceptedAmount: 0,
  };
}

export function copyEfficacyQuotation(sourceId: string): SavedEfficacyQuotation | null {
  console.warn('copyEfficacyQuotation is deprecated. Use copyEfficacyQuotationAsync instead.');
  return null;
}
