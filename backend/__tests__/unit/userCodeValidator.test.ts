/**
 * Unit Tests for UserCodeValidator Service
 * Feature: unified-quotation-code
 * 
 * These tests verify the UserCodeValidator service functionality
 * for validating user codes (quotation codes).
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6
 */

/// <reference types="jest" />

import { UserCodeValidator, ValidationResult } from '../../src/services/userCodeValidator';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient for unit testing
const createMockPrisma = () => {
  return {
    userSettings: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaClient;
};

describe('UserCodeValidator Unit Tests', () => {
  let validator: UserCodeValidator;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    validator = new UserCodeValidator(mockPrisma);
    jest.clearAllMocks();
  });

  describe('normalizeCode', () => {
    /**
     * Validates: Requirement 4.6
     * User_Code를 저장할 때 항상 대문자로 변환하여 저장해야 합니다
     */
    it('should convert lowercase to uppercase', () => {
      expect(validator.normalizeCode('dl')).toBe('DL');
    });

    it('should convert mixed case to uppercase', () => {
      expect(validator.normalizeCode('Dl')).toBe('DL');
      expect(validator.normalizeCode('dL')).toBe('DL');
    });

    it('should keep uppercase as uppercase', () => {
      expect(validator.normalizeCode('DL')).toBe('DL');
    });

    it('should handle various letter combinations', () => {
      expect(validator.normalizeCode('pk')).toBe('PK');
      expect(validator.normalizeCode('Ks')).toBe('KS');
      expect(validator.normalizeCode('aB')).toBe('AB');
    });
  });

  describe('isValidFormat', () => {
    /**
     * Validates: Format validation for 2-letter alphabetic codes
     */
    it('should return true for valid 2-letter uppercase codes', () => {
      expect(validator.isValidFormat('DL')).toBe(true);
      expect(validator.isValidFormat('PK')).toBe(true);
      expect(validator.isValidFormat('KS')).toBe(true);
    });

    it('should return true for valid 2-letter lowercase codes', () => {
      expect(validator.isValidFormat('dl')).toBe(true);
      expect(validator.isValidFormat('pk')).toBe(true);
    });

    it('should return true for valid 2-letter mixed case codes', () => {
      expect(validator.isValidFormat('Dl')).toBe(true);
      expect(validator.isValidFormat('dL')).toBe(true);
    });

    it('should return false for codes with numbers', () => {
      expect(validator.isValidFormat('D1')).toBe(false);
      expect(validator.isValidFormat('1L')).toBe(false);
      expect(validator.isValidFormat('12')).toBe(false);
    });

    it('should return false for codes with special characters', () => {
      expect(validator.isValidFormat('D!')).toBe(false);
      expect(validator.isValidFormat('@L')).toBe(false);
      expect(validator.isValidFormat('D-')).toBe(false);
    });

    it('should return false for codes with wrong length', () => {
      expect(validator.isValidFormat('D')).toBe(false);
      expect(validator.isValidFormat('DLK')).toBe(false);
      expect(validator.isValidFormat('DLKP')).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(validator.isValidFormat('')).toBe(false);
      expect(validator.isValidFormat(null as unknown as string)).toBe(false);
      expect(validator.isValidFormat(undefined as unknown as string)).toBe(false);
    });

    it('should return false for codes with spaces', () => {
      expect(validator.isValidFormat('D ')).toBe(false);
      expect(validator.isValidFormat(' L')).toBe(false);
      expect(validator.isValidFormat('  ')).toBe(false);
    });
  });

  describe('validateUniqueness', () => {
    const currentUserId = 'user-123';
    const otherUserId = 'user-456';

    /**
     * Validates: Requirement 4.1
     * 새 User_Code를 설정하려고 하면 다른 사용자가 이미 사용 중인 코드인지 확인해야 합니다
     */
    it('should return valid when code is not used by anyone', async () => {
      (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await validator.validateUniqueness('DL', currentUserId);

      expect(result.isValid).toBe(true);
      expect(result.normalizedCode).toBe('DL');
      expect(result.error).toBeUndefined();
    });

    /**
     * Validates: Requirement 4.2
     * 입력한 User_Code가 다른 사용자에 의해 이미 사용 중이면 
     * "이미 사용 중인 견적서 코드입니다" 오류 메시지를 표시하고 저장을 거부해야 합니다
     */
    it('should return invalid with error message when code is used by another user', async () => {
      (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
        userId: otherUserId,
        userCode: 'DL',
      });

      const result = await validator.validateUniqueness('DL', currentUserId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('이미 사용 중인 견적서 코드입니다');
      expect(result.normalizedCode).toBe('DL');
    });

    /**
     * Validates: Requirement 4.3
     * User_Code 중복 검사를 수행하면 대소문자를 구분하지 않고 비교해야 합니다
     */
    it('should detect duplicate case-insensitively (lowercase input)', async () => {
      (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
        userId: otherUserId,
        userCode: 'DL',
      });

      const result = await validator.validateUniqueness('dl', currentUserId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('이미 사용 중인 견적서 코드입니다');
    });

    it('should detect duplicate case-insensitively (mixed case input)', async () => {
      (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
        userId: otherUserId,
        userCode: 'DL',
      });

      const result = await validator.validateUniqueness('Dl', currentUserId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('이미 사용 중인 견적서 코드입니다');
    });

    /**
     * Validates: Requirement 4.5
     * 사용자가 자신의 기존 User_Code와 동일한 값을 입력하면 
     * 중복 오류 없이 저장을 허용해야 합니다
     */
    it('should allow user to keep their own code', async () => {
      // No other user found with the same code (current user is excluded from search)
      (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await validator.validateUniqueness('DL', currentUserId);

      expect(result.isValid).toBe(true);
      expect(result.normalizedCode).toBe('DL');
    });

    /**
     * Validates: Requirement 4.6
     * User_Code를 저장할 때 항상 대문자로 변환하여 저장해야 합니다
     */
    it('should return normalized (uppercase) code in result', async () => {
      (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await validator.validateUniqueness('dl', currentUserId);

      expect(result.normalizedCode).toBe('DL');
    });

    it('should return format error for invalid code format', async () => {
      const result = await validator.validateUniqueness('D1', currentUserId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should return format error for empty code', async () => {
      const result = await validator.validateUniqueness('', currentUserId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should return format error for code with wrong length', async () => {
      const result = await validator.validateUniqueness('ABC', currentUserId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should call prisma with correct parameters for case-insensitive search', async () => {
      (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

      await validator.validateUniqueness('dl', currentUserId);

      expect(mockPrisma.userSettings.findFirst).toHaveBeenCalledWith({
        where: {
          userCode: {
            equals: 'DL',
            mode: 'insensitive',
          },
          NOT: {
            userId: currentUserId,
          },
        },
        select: {
          userId: true,
          userCode: true,
        },
      });
    });
  });
});
