/**
 * Unit Tests for QuotationNumberService (DataService extension)
 * Feature: unified-quotation-code
 * 
 * These tests verify the unified quotation number generation functionality
 * for all test types (TOXICITY, EFFICACY, CLINICAL).
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

/// <reference types="jest" />

import { DataService } from '../../src/services/dataService';
import { PrismaClient, QuotationType } from '@prisma/client';
import { AppError } from '../../src/types/error';

// Mock PrismaClient for unit testing
const createMockPrisma = () => {
  return {
    userSettings: {
      findUnique: jest.fn(),
    },
    quotation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaClient;
};

describe('QuotationNumberService Unit Tests', () => {
  let dataService: DataService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    dataService = new DataService(mockPrisma);
    jest.clearAllMocks();
    
    // Mock Date to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Static Configuration', () => {
    it('should have correct quotation number format configuration', () => {
      expect(DataService.QUOTATION_NUMBER_CONFIG).toEqual({
        format: 'YY-MM-UC-NNNN',
        yearDigits: 2,
        sequenceDigits: 4,
      });
    });

    it('should support all three quotation types', () => {
      expect(DataService.SUPPORTED_QUOTATION_TYPES).toContain('TOXICITY');
      expect(DataService.SUPPORTED_QUOTATION_TYPES).toContain('EFFICACY');
      expect(DataService.SUPPORTED_QUOTATION_TYPES).toContain('CLINICAL');
    });
  });

  describe('validateUserCode', () => {
    const userId = 'user-123';

    it('should return true when user has a valid user code', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });

      const result = await dataService.validateUserCode(userId);

      expect(result).toBe(true);
      expect(mockPrisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { userCode: true },
      });
    });

    it('should return false when user has no user code', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: null,
      });

      const result = await dataService.validateUserCode(userId);

      expect(result).toBe(false);
    });

    it('should return false when user settings do not exist', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await dataService.validateUserCode(userId);

      expect(result).toBe(false);
    });

    it('should return false when user code is empty string', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: '',
      });

      const result = await dataService.validateUserCode(userId);

      expect(result).toBe(false);
    });
  });

  describe('getNextQuotationSequence', () => {
    const userId = 'user-123';

    it('should return 1 when no previous quotations exist', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.getNextQuotationSequence(userId);

      expect(result).toBe(1);
    });

    it('should return next sequence number based on last quotation', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
        quotationNumber: '25-01-DL-0005',
      });

      const result = await dataService.getNextQuotationSequence(userId);

      expect(result).toBe(6);
    });

    it('should throw error when user code is not set', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: null,
      });

      await expect(dataService.getNextQuotationSequence(userId)).rejects.toThrow(AppError);
      await expect(dataService.getNextQuotationSequence(userId)).rejects.toThrow(
        '견적서 코드가 설정되지 않았습니다'
      );
    });
  });

  describe('generateQuotationNumber', () => {
    const userId = 'user-123';

    /**
     * Validates: Requirement 1.1
     * 독성시험 견적서 생성 시 사용자의 User_Code를 사용하여 Quotation_Number 생성
     */
    it('should generate quotation number for TOXICITY type', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      expect(result).toBe('25-01-DL-0001');
    });

    /**
     * Validates: Requirement 1.2
     * 효력시험 견적서 생성 시 독성시험과 동일한 번호 체계(YY-MM-UC-NNNN)로 Quotation_Number 생성
     */
    it('should generate quotation number for EFFICACY type with same format', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'EFFICACY');

      expect(result).toBe('25-01-DL-0001');
      expect(result).toMatch(/^\d{2}-\d{2}-[A-Z]{2}-\d{4}$/);
    });

    /**
     * Validates: Requirement 1.3
     * 임상병리시험 견적서 생성 시 독성시험과 동일한 번호 체계로 Quotation_Number 생성
     */
    it('should generate quotation number for CLINICAL type with same format', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'CLINICAL');

      expect(result).toBe('25-01-DL-0001');
      expect(result).toMatch(/^\d{2}-\d{2}-[A-Z]{2}-\d{4}$/);
    });

    /**
     * Validates: Requirement 1.4
     * 동일 사용자가 같은 월에 여러 유형의 견적서 생성 시 시험 유형에 관계없이 일련번호 순차 증가
     */
    it('should increment sequence regardless of quotation type', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
        quotationNumber: '25-01-DL-0003',
      });

      const toxicityResult = await dataService.generateQuotationNumber(userId, 'TOXICITY');
      expect(toxicityResult).toBe('25-01-DL-0004');

      const efficacyResult = await dataService.generateQuotationNumber(userId, 'EFFICACY');
      expect(efficacyResult).toBe('25-01-DL-0004');

      const clinicalResult = await dataService.generateQuotationNumber(userId, 'CLINICAL');
      expect(clinicalResult).toBe('25-01-DL-0004');
    });

    it('should throw error when user code is not set', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: null,
      });

      await expect(dataService.generateQuotationNumber(userId, 'TOXICITY')).rejects.toThrow(AppError);
      await expect(dataService.generateQuotationNumber(userId, 'TOXICITY')).rejects.toThrow(
        '견적서 코드가 설정되지 않았습니다'
      );
    });

    it('should throw error when user settings do not exist', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(dataService.generateQuotationNumber(userId, 'EFFICACY')).rejects.toThrow(AppError);
    });

    it('should use correct date format (YY-MM-UC-NNNN)', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'PK',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      // Date is mocked to 2025-01-15
      expect(result).toBe('25-01-PK-0001');
    });

    it('should pad sequence number to 4 digits', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
        quotationNumber: '25-01-DL-0099',
      });

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      expect(result).toBe('25-01-DL-0100');
    });

    it('should handle high sequence numbers', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
        quotationNumber: '25-01-DL-9999',
      });

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      expect(result).toBe('25-01-DL-10000');
    });

    it('should query quotations with correct prefix for current month', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      await dataService.generateQuotationNumber(userId, 'TOXICITY');

      expect(mockPrisma.quotation.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          quotationNumber: {
            startsWith: '25-01-DL-',
          },
        },
        orderBy: {
          quotationNumber: 'desc',
        },
      });
    });
  });

  describe('Quotation Number Format Validation', () => {
    const userId = 'user-123';

    it('should generate numbers matching YY-MM-UC-NNNN pattern', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'KS',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      // Pattern: 2 digits - 2 digits - 2 uppercase letters - 4 digits
      const pattern = /^\d{2}-\d{2}-[A-Z]{2}-\d{4}$/;
      expect(result).toMatch(pattern);
    });

    it('should use 2-digit year', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      const parts = result.split('-');
      expect(parts[0]).toBe('25'); // 2025 -> 25
      expect(parts[0].length).toBe(2);
    });

    it('should use 2-digit month with leading zero', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      const parts = result.split('-');
      expect(parts[1]).toBe('01'); // January -> 01
      expect(parts[1].length).toBe(2);
    });

    it('should use 4-digit sequence with leading zeros', async () => {
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      const parts = result.split('-');
      expect(parts[3]).toBe('0001');
      expect(parts[3].length).toBe(4);
    });
  });

  describe('Different Months', () => {
    const userId = 'user-123';

    it('should generate correct month for December', async () => {
      jest.setSystemTime(new Date('2025-12-15T10:00:00Z'));
      
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      expect(result).toBe('25-12-DL-0001');
    });

    it('should generate correct month for single-digit months', async () => {
      jest.setSystemTime(new Date('2025-09-15T10:00:00Z'));
      
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'DL',
      });
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await dataService.generateQuotationNumber(userId, 'TOXICITY');

      expect(result).toBe('25-09-DL-0001');
    });
  });

  describe('Different User Codes', () => {
    const userId = 'user-123';

    it('should use different user codes correctly', async () => {
      (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

      // Test with user code 'PK'
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'PK',
      });
      let result = await dataService.generateQuotationNumber(userId, 'TOXICITY');
      expect(result).toBe('25-01-PK-0001');

      // Test with user code 'KS'
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'KS',
      });
      result = await dataService.generateQuotationNumber(userId, 'EFFICACY');
      expect(result).toBe('25-01-KS-0001');

      // Test with user code 'AB'
      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
        userCode: 'AB',
      });
      result = await dataService.generateQuotationNumber(userId, 'CLINICAL');
      expect(result).toBe('25-01-AB-0001');
    });
  });
});
