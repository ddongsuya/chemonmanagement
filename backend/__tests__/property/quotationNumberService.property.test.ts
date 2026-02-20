/**
 * Property-Based Tests for QuotationNumberService (DataService extension)
 * Feature: unified-quotation-code
 * 
 * These tests verify universal properties of the quotation number generation system
 * using fast-check for property-based testing.
 * 
 * Properties tested:
 * - Property 1: 견적서 번호 형식 일관성
 * - Property 2: 견적서 일련번호 순차 증가
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { DataService } from '../../src/services/dataService';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient for unit testing
const createMockPrisma = () => {
  return {
    userSettings: {
      findUnique: jest.fn(),
    },
    quotation: {
      findFirst: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaClient;
};

// Arbitrary for generating valid 2-letter uppercase user codes
const validUserCodeArb = fc.string({ minLength: 2, maxLength: 2 }).filter(s => /^[A-Z]{2}$/.test(s));

// Arbitrary for generating valid quotation types
const quotationTypeArb = fc.constantFrom('TOXICITY', 'EFFICACY', 'CLINICAL') as fc.Arbitrary<'TOXICITY' | 'EFFICACY' | 'CLINICAL'>;

// Arbitrary for generating valid years (2-digit)
const yearArb = fc.integer({ min: 2020, max: 2099 });

// Arbitrary for generating valid months (1-12)
const monthArb = fc.integer({ min: 1, max: 12 });

// Arbitrary for generating valid sequence numbers (1-9999)
const sequenceArb = fc.integer({ min: 1, max: 9999 });

// Arbitrary for generating UUIDs
const userIdArb = fc.uuid();

describe('QuotationNumberService Property Tests', () => {
  let dataService: DataService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    dataService = new DataService(mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Feature: unified-quotation-code, Property 1: 견적서 번호 형식 일관성
   * 
   * For any test type (TOXICITY, EFFICACY, CLINICAL) and user code, the generated
   * quotation number should always follow the "YY-MM-UC-NNNN" format where:
   * - YY is 2-digit year
   * - MM is 2-digit month
   * - UC is user code (2 uppercase letters)
   * - NNNN is 4-digit sequence number
   * 
   * Validates: Requirements 1.1, 1.2, 1.3
   */
  describe('Property 1: 견적서 번호 형식 일관성', () => {
    it('should generate quotation number in YY-MM-UC-NNNN format for all test types', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          validUserCodeArb,
          yearArb,
          monthArb,
          async (quotationType, userCode, year, month) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, month - 1, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await dataService.generateQuotationNumber('test-user-id', quotationType);

            // Property 1: Format should be YY-MM-UC-NNNN
            const pattern = /^\d{2}-\d{2}-[A-Z]{2}-\d{4}$/;
            expect(result).toMatch(pattern);

            const parts = result.split('-');
            expect(parts).toHaveLength(4);

            // YY: 2-digit year
            const expectedYear = year.toString().slice(-2);
            expect(parts[0]).toBe(expectedYear);

            // MM: 2-digit month with leading zero
            const expectedMonth = month.toString().padStart(2, '0');
            expect(parts[1]).toBe(expectedMonth);

            // UC: User code (2 uppercase letters)
            expect(parts[2]).toBe(userCode);
            expect(parts[2]).toMatch(/^[A-Z]{2}$/);

            // NNNN: 4-digit sequence with leading zeros
            expect(parts[3]).toBe('0001');
            expect(parts[3].length).toBe(4);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate same format for TOXICITY, EFFICACY, and CLINICAL types', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          monthArb,
          async (userCode, year, month) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, month - 1, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            const toxicityResult = await dataService.generateQuotationNumber('test-user-id', 'TOXICITY');
            const efficacyResult = await dataService.generateQuotationNumber('test-user-id', 'EFFICACY');
            const clinicalResult = await dataService.generateQuotationNumber('test-user-id', 'CLINICAL');

            const pattern = /^\d{2}-\d{2}-[A-Z]{2}-\d{4}$/;
            expect(toxicityResult).toMatch(pattern);
            expect(efficacyResult).toMatch(pattern);
            expect(clinicalResult).toMatch(pattern);

            expect(toxicityResult).toBe(efficacyResult);
            expect(efficacyResult).toBe(clinicalResult);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly format sequence numbers with leading zeros', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          validUserCodeArb,
          sequenceArb,
          async (quotationType, userCode, previousSeq) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2025, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            const previousQuotationNumber = `25-01-${userCode}-${previousSeq.toString().padStart(4, '0')}`;
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              quotationNumber: previousQuotationNumber,
            });

            const result = await dataService.generateQuotationNumber('test-user-id', quotationType);

            const parts = result.split('-');
            const seqPart = parts[3];
            
            if (previousSeq < 9999) {
              expect(seqPart.length).toBe(4);
            }
            
            const expectedSeq = previousSeq + 1;
            expect(parseInt(seqPart, 10)).toBe(expectedSeq);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use user code exactly as stored (uppercase)', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          validUserCodeArb,
          async (quotationType, userCode) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2025, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await dataService.generateQuotationNumber('test-user-id', quotationType);

            const parts = result.split('-');
            expect(parts[2]).toBe(userCode);
            expect(parts[2]).toBe(parts[2].toUpperCase());

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: unified-quotation-code, Property 2: 견적서 일련번호 순차 증가
   * 
   * Validates: Requirements 1.4, 1.5
   */
  describe('Property 2: 견적서 일련번호 순차 증가', () => {
    it('should increment sequence by 1 for each quotation regardless of type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(quotationTypeArb, { minLength: 1, maxLength: 10 }),
          validUserCodeArb,
          async (quotationTypes, userCode) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2025, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            let currentSeq = 0;
            const generatedNumbers: string[] = [];

            for (const quotationType of quotationTypes) {
              if (currentSeq === 0) {
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const prevNumber = `25-01-${userCode}-${currentSeq.toString().padStart(4, '0')}`;
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
                  quotationNumber: prevNumber,
                });
              }

              const result = await dataService.generateQuotationNumber('test-user-id', quotationType);
              generatedNumbers.push(result);
              currentSeq++;
            }

            for (let i = 0; i < generatedNumbers.length; i++) {
              const parts = generatedNumbers[i].split('-');
              const seq = parseInt(parts[3], 10);
              expect(seq).toBe(i + 1);
            }

            for (let i = 1; i < generatedNumbers.length; i++) {
              const prevSeq = parseInt(generatedNumbers[i - 1].split('-')[3], 10);
              const currSeq = parseInt(generatedNumbers[i].split('-')[3], 10);
              expect(currSeq).toBe(prevSeq + 1);
            }

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should share sequence across all quotation types for same user', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          fc.integer({ min: 1, max: 100 }),
          async (userCode, startingSeq) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2025, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            const existingNumber = `25-01-${userCode}-${startingSeq.toString().padStart(4, '0')}`;
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              quotationNumber: existingNumber,
            });

            const toxicityResult = await dataService.generateQuotationNumber('test-user-id', 'TOXICITY');
            const efficacyResult = await dataService.generateQuotationNumber('test-user-id', 'EFFICACY');
            const clinicalResult = await dataService.generateQuotationNumber('test-user-id', 'CLINICAL');

            const toxicitySeq = parseInt(toxicityResult.split('-')[3], 10);
            const efficacySeq = parseInt(efficacyResult.split('-')[3], 10);
            const clinicalSeq = parseInt(clinicalResult.split('-')[3], 10);

            expect(toxicitySeq).toBe(startingSeq + 1);
            expect(efficacySeq).toBe(startingSeq + 1);
            expect(clinicalSeq).toBe(startingSeq + 1);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should start from 1 when no previous quotations exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          validUserCodeArb,
          userIdArb,
          async (quotationType, userCode, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2025, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await dataService.generateQuotationNumber(userId, quotationType);

            const parts = result.split('-');
            const seq = parseInt(parts[3], 10);
            expect(seq).toBe(1);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate next sequence from previous quotation number', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          validUserCodeArb,
          sequenceArb,
          async (quotationType, userCode, previousSeq) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2025, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            const previousNumber = `25-01-${userCode}-${previousSeq.toString().padStart(4, '0')}`;
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              quotationNumber: previousNumber,
            });

            const result = await dataService.generateQuotationNumber('test-user-id', quotationType);

            const newSeq = parseInt(result.split('-')[3], 10);
            expect(newSeq).toBe(previousSeq + 1);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should query quotations with correct prefix to find last sequence', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          validUserCodeArb,
          yearArb,
          monthArb,
          userIdArb,
          async (quotationType, userCode, year, month, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, month - 1, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            await dataService.generateQuotationNumber(userId, quotationType);

            const expectedYear = year.toString().slice(-2);
            const expectedMonth = month.toString().padStart(2, '0');
            const expectedPrefix = `${expectedYear}-${expectedMonth}-${userCode}-`;

            expect(mockPrisma.quotation.findFirst).toHaveBeenCalledWith({
              where: {
                userId: userId,
                quotationNumber: {
                  startsWith: expectedPrefix,
                },
              },
              orderBy: {
                quotationNumber: 'desc',
              },
            });

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Handling Properties', () => {
    it('should throw error when user code is not set for any quotation type', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          userIdArb,
          async (quotationType, userId) => {
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: null,
            });

            await expect(
              dataService.generateQuotationNumber(userId, quotationType)
            ).rejects.toThrow('견적서 코드가 설정되지 않았습니다');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error when user settings do not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationTypeArb,
          userIdArb,
          async (quotationType, userId) => {
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
              dataService.generateQuotationNumber(userId, quotationType)
            ).rejects.toThrow('견적서 코드가 설정되지 않았습니다');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
