/**
 * LostReason types and constants for CRM workflow
 * 
 * Used to track reasons why leads/quotations did not proceed to contract.
 * Validates: Requirements 2.2
 */

/**
 * LostReason enum values representing reasons for non-progression
 */
export type LostReason =
  | 'BUDGET_PLANNING'     // 예산편성용
  | 'COMPETITOR_SELECTED' // 타사결정
  | 'PRICE_ISSUE'         // 가격문제
  | 'SCHEDULE_ISSUE'      // 일정문제
  | 'ON_HOLD'             // 대기중
  | 'OTHER';              // 기타

/**
 * Array of all valid LostReason values
 */
export const LOST_REASON_VALUES: readonly LostReason[] = [
  'BUDGET_PLANNING',
  'COMPETITOR_SELECTED',
  'PRICE_ISSUE',
  'SCHEDULE_ISSUE',
  'ON_HOLD',
  'OTHER',
] as const;

/**
 * Korean labels for each LostReason value
 */
export const lostReasonLabels: Record<LostReason, string> = {
  BUDGET_PLANNING: '예산편성용',
  COMPETITOR_SELECTED: '타사결정',
  PRICE_ISSUE: '가격문제',
  SCHEDULE_ISSUE: '일정문제',
  ON_HOLD: '대기중',
  OTHER: '기타',
};

/**
 * Validates if a string is a valid LostReason value
 * @param value - The string to validate
 * @returns true if the value is a valid LostReason, false otherwise
 */
export function isValidLostReason(value: string | null | undefined): value is LostReason {
  if (value === null || value === undefined) {
    return false;
  }
  return LOST_REASON_VALUES.includes(value as LostReason);
}

/**
 * Gets the Korean label for a LostReason value
 * @param reason - The LostReason value
 * @returns The Korean label for the reason, or undefined if invalid
 */
export function getLostReasonLabel(reason: LostReason): string;
export function getLostReasonLabel(reason: string): string | undefined;
export function getLostReasonLabel(reason: string): string | undefined {
  if (isValidLostReason(reason)) {
    return lostReasonLabels[reason];
  }
  return undefined;
}

/**
 * Data structure for recording lost reason information
 */
export interface LostReasonData {
  lostReason: LostReason;
  lostReasonDetail?: string;
}

/**
 * Validates LostReasonData according to business rules:
 * - lostReason is required
 * - lostReasonDetail is required when lostReason is 'OTHER'
 * 
 * @param data - The data to validate
 * @returns An object with isValid flag and optional error message
 */
export function validateLostReasonData(data: Partial<LostReasonData>): {
  isValid: boolean;
  error?: string;
} {
  // Check if lostReason is provided
  if (!data.lostReason) {
    return {
      isValid: false,
      error: '미진행 사유를 선택해주세요',
    };
  }

  // Check if lostReason is valid
  if (!isValidLostReason(data.lostReason)) {
    return {
      isValid: false,
      error: '유효하지 않은 미진행 사유입니다',
    };
  }

  // Check if lostReasonDetail is required (when lostReason is OTHER)
  if (data.lostReason === 'OTHER') {
    if (!data.lostReasonDetail || data.lostReasonDetail.trim() === '') {
      return {
        isValid: false,
        error: '기타 사유를 입력해주세요',
      };
    }
  }

  return { isValid: true };
}
