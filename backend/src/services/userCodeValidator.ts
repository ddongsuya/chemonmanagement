import { PrismaClient } from '@prisma/client';

/**
 * 유효성 검사 결과 인터페이스
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedCode?: string;
}

/**
 * UserCodeValidator 서비스
 * 
 * 사용자 코드(견적서 코드) 중복 검사 및 유효성 검증을 수행합니다.
 * 
 * 주요 기능:
 * - validateUniqueness: 다른 사용자와의 중복 검사 (대소문자 무시)
 * - normalizeCode: 코드를 대문자로 정규화
 * - isValidFormat: 코드 형식 검증 (2글자 영문)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6
 */
export class UserCodeValidator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 사용자 코드의 고유성을 검증합니다.
   * 
   * - 대소문자를 구분하지 않고 비교합니다 (Requirement 4.3)
   * - 다른 사용자가 이미 사용 중인 코드인지 확인합니다 (Requirement 4.1)
   * - 자신의 기존 코드와 동일한 경우 중복 오류 없이 허용합니다 (Requirement 4.5)
   * - 중복 시 "이미 사용 중인 견적서 코드입니다" 오류 메시지를 반환합니다 (Requirement 4.2)
   * 
   * @param userCode - 검증할 사용자 코드
   * @param currentUserId - 현재 사용자 ID
   * @returns ValidationResult - 유효성 검사 결과
   */
  async validateUniqueness(userCode: string, currentUserId: string): Promise<ValidationResult> {
    // 형식 검증 먼저 수행
    if (!this.isValidFormat(userCode)) {
      return {
        isValid: false,
        error: '견적서 코드는 2글자 영문이어야 합니다',
      };
    }

    // 대문자로 정규화 (Requirement 4.6)
    const normalizedCode = this.normalizeCode(userCode);

    // 동일한 코드를 사용하는 다른 사용자 조회 (대소문자 무시 - Requirement 4.3)
    // PostgreSQL에서 대소문자 무시 비교를 위해 정규화된 코드로 비교
    const existingUser = await this.prisma.userSettings.findFirst({
      where: {
        userCode: {
          equals: normalizedCode,
          mode: 'insensitive', // 대소문자 무시
        },
        NOT: {
          userId: currentUserId, // 자신은 제외 (Requirement 4.5)
        },
      },
      select: {
        userId: true,
        userCode: true,
      },
    });

    // 다른 사용자가 이미 사용 중인 경우 (Requirement 4.1, 4.2)
    if (existingUser) {
      return {
        isValid: false,
        error: '이미 사용 중인 견적서 코드입니다',
        normalizedCode,
      };
    }

    // 중복 없음 - 유효한 코드
    return {
      isValid: true,
      normalizedCode,
    };
  }

  /**
   * 사용자 코드를 대문자로 정규화합니다.
   * 
   * 저장 시 항상 대문자로 변환하여 저장합니다 (Requirement 4.6)
   * 예: "dl" → "DL", "Dl" → "DL"
   * 
   * @param userCode - 정규화할 사용자 코드
   * @returns 대문자로 변환된 코드
   */
  normalizeCode(userCode: string): string {
    return userCode.toUpperCase();
  }

  /**
   * 사용자 코드의 형식이 유효한지 검증합니다.
   * 
   * 유효한 형식: 2글자 영문 (대소문자 모두 허용)
   * 예: "DL", "dl", "Pk", "KS" 등
   * 
   * @param userCode - 검증할 사용자 코드
   * @returns 형식이 유효하면 true, 그렇지 않으면 false
   */
  isValidFormat(userCode: string): boolean {
    // null, undefined, 빈 문자열 체크
    if (!userCode) {
      return false;
    }

    // 2글자 영문만 허용하는 정규식
    const validPattern = /^[A-Za-z]{2}$/;
    return validPattern.test(userCode);
  }
}

export default UserCodeValidator;
