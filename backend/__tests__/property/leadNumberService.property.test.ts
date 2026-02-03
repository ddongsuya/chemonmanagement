/**
 * Property-Based Tests for LeadNumberService
 * Feature: unified-quotation-code
 * 
 * These tests verify universal properties of the lead number generation system
 * using fast-check for property-based testing.
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

// Mock PrismaClient for unit testing
const createMockPrisma = () => {
  return {
    userSettings: {
      findUnique: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaClient;
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
   * After generating a lead, the user's next_lead_seq value should be previous value + 1.
   * 
   * Validates: Requirements 3.1, 3.3
   */
  describe('Property 4: 리드 번호 형식 및 시퀀스', () => {
    it('should generate lead number in UC-YYYY-NNNN format', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 5, 15, 10, 0, 0)); // June of the given year

            // Mock user settings with the user code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock no existing leads (first lead)
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Generate lead number
            const result = await leadNumberService.generateLeadNumber(userId);

            // Property 4: Format should be UC-YYYY-NNNN
            const pattern = /^[A-Z]{2}-\d{4}-\d{4}$/;
            expect(result).toMatch(pattern);

            // Verify each component
            const parts = result.split('-');
            expect(parts).toHaveLength(3);

            // UC: User code (2 uppercase letters)
            expect(parts[0]).toBe(userCode);
            expect(parts[0]).toMatch(/^[A-Z]{2}$/);

            // YYYY: 4-digit year
            expect(parts[1]).toBe(year.toString());
            expect(parts[1].length).toBe(4);

            // NNNN: 4-digit sequence with leading zeros (first lead = 0001)
            expect(parts[2]).toBe('0001');
            expect(parts[2].length).toBe(4);

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
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings with uppercase user code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock no existing leads
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Generate lead number
            const result = await leadNumberService.generateLeadNumber(userId);

            // Property: User code in result should match exactly
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
          async (userCode, year, previousSeq, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock existing lead with previous sequence
            const previousLeadNumber = `${userCode}-${year}-${previousSeq.toString().padStart(4, '0')}`;
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue({
              leadNumber: previousLeadNumber,
            });

            // Generate lead number
            const result = await leadNumberService.generateLeadNumber(userId);

            // Property: Sequence should be padded to 4 digits
            const parts = result.split('-');
            const seqPart = parts[2];

            // For sequences 1-9999, should be 4 digits
            if (previousSeq < 9999) {
              expect(seqPart.length).toBe(4);
            }

            // Sequence should be previous + 1
            const expectedSeq = previousSeq + 1;
            expect(parseInt(seqPart, 10)).toBe(expectedSeq);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increment sequence by 1 for each lead', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          fc.integer({ min: 1, max: 5 }),
          userIdArb,
          async (userCode, year, numLeads, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Track sequence numbers
            let currentSeq = 0;
            const generatedNumbers: string[] = [];

            // Generate multiple leads
            for (let i = 0; i < numLeads; i++) {
              // Mock the previous lead based on current sequence
              if (currentSeq === 0) {
                (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const prevNumber = `${userCode}-${year}-${currentSeq.toString().padStart(4, '0')}`;
                (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue({
                  leadNumber: prevNumber,
                });
              }

              // Generate lead number
              const result = await leadNumberService.generateLeadNumber(userId);
              generatedNumbers.push(result);

              // Update current sequence
              currentSeq++;
            }

            // Property: Each generated number should have incrementing sequence
            for (let i = 0; i < generatedNumbers.length; i++) {
              const parts = generatedNumbers[i].split('-');
              const seq = parseInt(parts[2], 10);

              // Sequence should be i + 1 (1-indexed)
              expect(seq).toBe(i + 1);
            }

            // Property: Sequences should be strictly increasing
            for (let i = 1; i < generatedNumbers.length; i++) {
              const prevSeq = parseInt(generatedNumbers[i - 1].split('-')[2], 10);
              const currSeq = parseInt(generatedNumbers[i].split('-')[2], 10);
              expect(currSeq).toBe(prevSeq + 1);
            }

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should start from 1 when no previous leads exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock no existing leads
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Generate lead number
            const result = await leadNumberService.generateLeadNumber(userId);

            // Property: First lead should have sequence 1
            const parts = result.split('-');
            const seq = parseInt(parts[2], 10);
            expect(seq).toBe(1);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate next sequence from previous lead number', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          async (userCode, year, previousSeq, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock existing lead
            const previousNumber = `${userCode}-${year}-${previousSeq.toString().padStart(4, '0')}`;
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue({
              leadNumber: previousNumber,
            });

            // Generate lead number
            const result = await leadNumberService.generateLeadNumber(userId);

            // Property: New sequence should be exactly previous + 1
            const newSeq = parseInt(result.split('-')[2], 10);
            expect(newSeq).toBe(previousSeq + 1);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should query leads with correct prefix to find last sequence', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 5, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock no existing leads
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Generate lead number
            await leadNumberService.generateLeadNumber(userId);

            // Property: Query should use correct prefix for current year
            const expectedPrefix = `${userCode}-${year}-`;

            expect(mockPrisma.lead.findFirst).toHaveBeenCalledWith({
              where: {
                userId: userId,
                leadNumber: {
                  startsWith: expectedPrefix,
                },
              },
              orderBy: {
                leadNumber: 'desc',
              },
              select: {
                leadNumber: true,
              },
            });

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
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock no existing leads
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Generate lead number
            const result = await leadNumberService.generateLeadNumber(userId);

            // Property: Year should be 4 digits
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
   * Additional property tests for error handling
   * 
   * Validates: Requirement 3.4
   */
  describe('Error Handling Properties', () => {
    it('should throw UserCodeNotSetError when user code is not set', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          async (userId) => {
            // Mock user settings without user code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: null,
            });

            // Property: Should throw UserCodeNotSetError
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
            // Mock no user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

            // Property: Should throw UserCodeNotSetError
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
            // Mock user settings without user code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: null,
            });

            // Property: Should throw UserCodeNotSetError
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
   * Additional property tests for getNextLeadSequence method
   */
  describe('getNextLeadSequence Properties', () => {
    it('should return 1 when no previous leads exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock no existing leads
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Get next sequence
            const result = await leadNumberService.getNextLeadSequence(userId, userCode, year);

            // Property: Should return 1 for first lead
            expect(result).toBe(1);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return previous sequence + 1 when leads exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          async (userCode, year, previousSeq, userId) => {
            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock existing lead
            const previousNumber = `${userCode}-${year}-${previousSeq.toString().padStart(4, '0')}`;
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue({
              leadNumber: previousNumber,
            });

            // Get next sequence
            const result = await leadNumberService.getNextLeadSequence(userId, userCode, year);

            // Property: Should return previous + 1
            expect(result).toBe(previousSeq + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fetch user code from database when not provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          userIdArb,
          async (userCode, year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 0, 15, 10, 0, 0));

            // Mock user settings
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: userCode,
            });

            // Mock no existing leads
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Get next sequence without providing userCode
            const result = await leadNumberService.getNextLeadSequence(userId);

            // Property: Should fetch user code and return valid sequence
            expect(result).toBe(1);
            expect(mockPrisma.userSettings.findUnique).toHaveBeenCalledWith({
              where: { userId },
              select: { userCode: true },
            });

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
