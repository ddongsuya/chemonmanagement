/**
 * Property-Based Tests for LeadNumberService
 * Feature: unified-quotation-code
 * 
 * These tests verify universal properties of the lead number generation system
 * using fast-check for property-based testing.
 * 
 * Updated: Uses UserSettings.nextLeadSeq atomic increment approach
 * 
 * Properties tested:
 * - Property 4: 리드 번호 형식 및 시퀀스
 * 
 * Validates: Requirements 3.1, 3.3
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { LeadNumberService, UserCodeNotSetError } from '../../src/services/leadNumberService';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient with $transaction support
const createMockPrisma = () => {
  const mockUpdate = jest.fn().mockResolvedValue({});
  const mockFindUnique = jest.fn();

  // $transaction executes the callback with a tx proxy
  // The tx proxy shares the same mocks so tests can control behavior
  const mockTx = {
    userSettings: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  };

  const mock = {
    userSettings: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
      return cb(mockTx);
    }),
  } as unknown as PrismaClient;

  return mock;
};

// Arbitrary for generating valid 2-letter uppercase user codes
const validUserCodeArb = fc.string({ minLength: 2, maxLength: 2 }).filter(s => /^[A-Z]{2}$/.test(s));

// Arbitrary for generating valid years (4-digit)
const yearArb = fc.integer({ min: 2020, max: 2099 });

// Arbitrary for generating valid sequence numbers (1-9999)
const sequenceArb = fc.integer({ min: 1, max: 9999 });

// Arbitrary for generating UUIDs
const userIdArb = fc.uuid();

describe('LeadNumberService Property Tests', () => {
  let leadNumberService: LeadNumberService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    leadNumberService = new LeadNumberService(mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Feature: unified-quotation-code, Property 4: 리드 번호 형식 및 시퀀스
   * 
   * For any user code, the generated lead number should follow the "UC-YYYY-NNNN" format.
   * Uses UserSettings.nextLeadSeq for atomic sequence generation.
   * 
   * Validates: Requirements 3.1, 3.3
   */
  describe('Property 4: 리드 번호 형식 및 시퀀스', () => {
    it('should generate lead number in UC-YYYY-NNNN format', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          async (userCode, year, seq, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 5, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: seq,
            });

            const result = await leadNumberService.generateLeadNumber(userId);

            // Property 4: Format should be UC-YYYY-NNNN
            const pattern = /^[A-Z]{2}-\d{4}-\d{4,}$/;
            expect(result).toMatch(pattern);

            const parts = result.split('-');
            expect(parts).toHaveLength(3);
            expect(parts[0]).toBe(userCode);
            expect(parts[1]).toBe(year.toString());
            expect(parseInt(parts[2], 10)).toBe(seq);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use user code exactly as stored (uppercase)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: 1,
            });

            const result = await leadNumberService.generateLeadNumber(userId);

            const parts = result.split('-');
            expect(parts[0]).toBe(userCode);
            expect(parts[0]).toBe(parts[0].toUpperCase());

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly format sequence numbers with leading zeros', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          async (userCode, year, seq, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: seq,
            });

            const result = await leadNumberService.generateLeadNumber(userId);

            const parts = result.split('-');
            const seqPart = parts[2];

            // For sequences 1-9999, should be 4 digits (zero-padded)
            if (seq <= 9999) {
              expect(seqPart.length).toBe(4);
            }
            expect(parseInt(seqPart, 10)).toBe(seq);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should atomically increment nextLeadSeq via $transaction', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          async (userCode, year, seq, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: seq,
            });

            await leadNumberService.generateLeadNumber(userId);

            // Property: $transaction should be called
            expect(mockPrisma.$transaction).toHaveBeenCalled();

            // Property: update should increment nextLeadSeq
            expect((mockPrisma.userSettings as any).update).toHaveBeenCalledWith({
              where: { userId },
              data: { nextLeadSeq: { increment: 1 } },
            });

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should start from 1 when nextLeadSeq is 1 (default)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: 1,
            });

            const result = await leadNumberService.generateLeadNumber(userId);

            const parts = result.split('-');
            expect(parseInt(parts[2], 10)).toBe(1);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use 4-digit year in lead number format', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: 1,
            });

            const result = await leadNumberService.generateLeadNumber(userId);

            const parts = result.split('-');
            expect(parts[1].length).toBe(4);
            expect(parseInt(parts[1], 10)).toBe(year);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Error Handling Properties
   * Validates: Requirement 3.4
   */
  describe('Error Handling Properties', () => {
    it('should throw UserCodeNotSetError when user code is not set', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          async (userId) => {
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: null,
              nextLeadSeq: 1,
            });

            await expect(
              leadNumberService.generateLeadNumber(userId)
            ).rejects.toThrow(UserCodeNotSetError);

            await expect(
              leadNumberService.generateLeadNumber(userId)
            ).rejects.toThrow('견적서 코드가 설정되지 않았습니다');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw UserCodeNotSetError when user settings do not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          async (userId) => {
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
              leadNumberService.generateLeadNumber(userId)
            ).rejects.toThrow(UserCodeNotSetError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error for getNextLeadSequence when user code is not set', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          async (userId) => {
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: null,
              nextLeadSeq: 1,
            });

            await expect(
              leadNumberService.getNextLeadSequence(userId)
            ).rejects.toThrow(UserCodeNotSetError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * getNextLeadSequence Properties
   */
  describe('getNextLeadSequence Properties', () => {
    it('should return nextLeadSeq from UserSettings', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          sequenceArb,
          userIdArb,
          async (userCode, seq, userId) => {
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: seq,
            });

            const result = await leadNumberService.getNextLeadSequence(userId, userCode);

            // Property: Should return the nextLeadSeq value directly
            expect(result).toBe(seq);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return nextLeadSeq even without providing userCode param', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          sequenceArb,
          userIdArb,
          async (userCode, seq, userId) => {
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode,
              nextLeadSeq: seq,
            });

            const result = await leadNumberService.getNextLeadSequence(userId);

            expect(result).toBe(seq);
            expect(mockPrisma.userSettings.findUnique).toHaveBeenCalledWith({
              where: { userId },
              select: { userCode: true, nextLeadSeq: true },
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
