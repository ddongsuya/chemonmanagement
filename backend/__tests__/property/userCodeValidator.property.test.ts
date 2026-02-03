/**
 * Property-Based Tests for UserCodeValidator Service
 * Feature: unified-quotation-code
 * 
 * These tests verify universal properties of the user code validation system
 * using fast-check for property-based testing.
 * 
 * Properties tested:
 * - Property 6: 코드 중복 검사 정확성
 * - Property 7: 코드 정규화
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { UserCodeValidator } from '../../src/services/userCodeValidator';
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

// Arbitrary for generating valid 2-letter alphabetic codes (any case)
const validUserCodeArb = fc.string({ minLength: 2, maxLength: 2 }).filter(s => /^[A-Za-z]{2}$/.test(s));

// Arbitrary for generating valid UUIDs
const userIdArb = fc.uuid();

describe('UserCodeValidator Property Tests', () => {
  let validator: UserCodeValidator;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    validator = new UserCodeValidator(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Feature: unified-quotation-code, Property 6: 코드 중복 검사 정확성
   * 
   * For any two users A and B, if A tries to set a code identical to B's User_Code
   * (case-insensitive), a duplicate error should occur. However, if a user enters
   * the same value as their existing code, no duplicate error should occur.
   * 
   * Validates: Requirements 4.1, 4.2, 4.3, 4.5
   */
  describe('Property 6: 코드 중복 검사 정확성', () => {
    it('should detect duplicates case-insensitively when another user has the same code', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          userIdArb,
          userIdArb,
          async (code, userIdA, userIdB) => {
            // Ensure different users
            fc.pre(userIdA !== userIdB);

            // Mock: User B already has this code (normalized to uppercase)
            const normalizedCode = code.toUpperCase();
            (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
              userId: userIdB,
              userCode: normalizedCode,
            });

            // User A tries to set the same code
            const result = await validator.validateUniqueness(code, userIdA);

            // Property: Should detect duplicate and return invalid
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('이미 사용 중인 견적서 코드입니다');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect duplicates regardless of case variation', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          userIdArb,
          userIdArb,
          fc.constantFrom('upper', 'lower', 'mixed') as fc.Arbitrary<'upper' | 'lower' | 'mixed'>,
          async (baseCode, userIdA, userIdB, caseVariation) => {
            // Ensure different users
            fc.pre(userIdA !== userIdB);

            // Generate different case variations of the same code
            let inputCode: string;
            switch (caseVariation) {
              case 'upper':
                inputCode = baseCode.toUpperCase();
                break;
              case 'lower':
                inputCode = baseCode.toLowerCase();
                break;
              case 'mixed':
                inputCode = baseCode.charAt(0).toUpperCase() + baseCode.charAt(1).toLowerCase();
                break;
            }

            // Mock: User B has the code in uppercase (as stored in DB)
            const storedCode = baseCode.toUpperCase();
            (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
              userId: userIdB,
              userCode: storedCode,
            });

            // User A tries to set the code with different case
            const result = await validator.validateUniqueness(inputCode, userIdA);

            // Property: Should detect duplicate regardless of case
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('이미 사용 중인 견적서 코드입니다');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow user to keep their own code (no duplicate error for self)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          userIdArb,
          async (code, userId) => {
            // Mock: No other user has this code (current user is excluded from search)
            (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

            // User tries to set their own existing code
            const result = await validator.validateUniqueness(code, userId);

            // Property: Should allow without duplicate error
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow setting a code when no other user has it', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          userIdArb,
          async (code, userId) => {
            // Mock: No user has this code
            (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await validator.validateUniqueness(code, userId);

            // Property: Should be valid when code is available
            expect(result.isValid).toBe(true);
            expect(result.normalizedCode).toBe(code.toUpperCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly exclude current user from duplicate check', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          userIdArb,
          async (code, userId) => {
            // Mock: No other user found (current user excluded)
            (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

            await validator.validateUniqueness(code, userId);

            // Property: Prisma query should exclude current user
            expect(mockPrisma.userSettings.findFirst).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  NOT: {
                    userId: userId,
                  },
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: unified-quotation-code, Property 7: 코드 정규화
   * 
   * For any case combination of User_Code input, the stored value should always
   * be converted to uppercase. Example: "dl" → "DL", "Dl" → "DL"
   * 
   * Validates: Requirements 4.6
   */
  describe('Property 7: 코드 정규화', () => {
    it('should always normalize code to uppercase', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          async (inputCode) => {
            const normalizedCode = validator.normalizeCode(inputCode);

            // Property: Normalized code should be uppercase
            expect(normalizedCode).toBe(inputCode.toUpperCase());
            
            // Property: Normalized code should only contain uppercase letters
            expect(normalizedCode).toMatch(/^[A-Z]{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return normalized code in validation result', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          userIdArb,
          async (inputCode, userId) => {
            // Mock: No duplicate found
            (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await validator.validateUniqueness(inputCode, userId);

            // Property: Result should contain normalized (uppercase) code
            expect(result.normalizedCode).toBe(inputCode.toUpperCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should normalize code consistently regardless of input case', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          async (baseCode) => {
            // Generate all case variations
            const upperCase = baseCode.toUpperCase();
            const lowerCase = baseCode.toLowerCase();
            const mixedCase1 = baseCode.charAt(0).toUpperCase() + baseCode.charAt(1).toLowerCase();
            const mixedCase2 = baseCode.charAt(0).toLowerCase() + baseCode.charAt(1).toUpperCase();

            // Property: All variations should normalize to the same uppercase value
            const normalizedUpper = validator.normalizeCode(upperCase);
            const normalizedLower = validator.normalizeCode(lowerCase);
            const normalizedMixed1 = validator.normalizeCode(mixedCase1);
            const normalizedMixed2 = validator.normalizeCode(mixedCase2);

            expect(normalizedUpper).toBe(normalizedLower);
            expect(normalizedLower).toBe(normalizedMixed1);
            expect(normalizedMixed1).toBe(normalizedMixed2);
            expect(normalizedUpper).toBe(baseCode.toUpperCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use normalized code for database comparison', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          userIdArb,
          async (inputCode, userId) => {
            // Mock: No duplicate found
            (mockPrisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

            await validator.validateUniqueness(inputCode, userId);

            // Property: Database query should use normalized (uppercase) code
            expect(mockPrisma.userSettings.findFirst).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  userCode: expect.objectContaining({
                    equals: inputCode.toUpperCase(),
                  }),
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve idempotency - normalizing twice gives same result', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          async (inputCode) => {
            const normalizedOnce = validator.normalizeCode(inputCode);
            const normalizedTwice = validator.normalizeCode(normalizedOnce);

            // Property: Normalizing an already normalized code should give the same result
            expect(normalizedOnce).toBe(normalizedTwice);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
