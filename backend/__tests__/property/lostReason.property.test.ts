/**
 * Property-Based Tests for Lost Reason Validation
 * Feature: crm-workflow-enhancement
 * 
 * These tests verify universal properties of the lost reason validation system
 * ensuring that lostReason is required for LOST status changes and
 * lostReasonDetail is required when lostReason is OTHER.
 * 
 * **Validates: Requirements 2.3, 2.4**
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { 
  validateLostReasonData, 
  LOST_REASON_VALUES, 
  LostReason,
  isValidLostReason 
} from '../../src/types/lostReason';

describe('Lost Reason Validation', () => {
  /**
   * Property 2: 미진행 사유 유효성 검사
   * Feature: crm-workflow-enhancement, Task 4.3
   * 
   * For any request to change lead status to LOST, if lostReason field is null
   * or empty string, the request must be rejected. Also, when lostReason is 'OTHER',
   * if lostReasonDetail field is null or empty string, the request must be rejected.
   * 
   * **Validates: Requirements 2.3, 2.4**
   */
  describe('Property 2: 미진행 사유 유효성 검사', () => {
    /**
     * Test 1: Empty/null lostReason should be rejected
     * Validates: Requirement 2.3 - LOST 상태 변경 시 lostReason 필수
     */
    it.each([
      [undefined, 'undefined'],
      [null, 'null'],
      ['', 'empty string'],
    ])('should reject when lostReason is %s', (lostReason, description) => {
      const result = validateLostReasonData({ lostReason: lostReason as any });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    /**
     * Property test: Any null/undefined/empty lostReason should be rejected
     */
    it('should require lostReason for LOST status change', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various invalid lostReason values
          fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant('')
          ),
          // Optional lostReasonDetail (shouldn't matter when lostReason is invalid)
          fc.option(fc.string()),
          async (lostReason, lostReasonDetail) => {
            const data: any = { lostReason };
            if (lostReasonDetail !== null) {
              data.lostReasonDetail = lostReasonDetail;
            }
            
            const result = validateLostReasonData(data);
            
            // Property: Invalid lostReason must always be rejected
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 2: Invalid lostReason values should be rejected
     */
    it('should reject invalid lostReason values', async () => {
      // Generate random strings that are not valid LostReason values
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            s => !LOST_REASON_VALUES.includes(s as LostReason)
          ),
          async (invalidReason) => {
            const result = validateLostReasonData({ lostReason: invalidReason as any });
            
            // Property: Invalid lostReason values must be rejected
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 3: Valid lostReason values (except OTHER) should be accepted without lostReasonDetail
     */
    it('should accept valid lostReason values (except OTHER) without lostReasonDetail', async () => {
      // Get all valid reasons except OTHER
      const validReasonsExceptOther = LOST_REASON_VALUES.filter(r => r !== 'OTHER');
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validReasonsExceptOther),
          async (lostReason) => {
            // Test without lostReasonDetail
            const resultWithoutDetail = validateLostReasonData({ lostReason });
            expect(resultWithoutDetail.isValid).toBe(true);
            expect(resultWithoutDetail.error).toBeUndefined();
            
            // Test with empty lostReasonDetail (should still be valid for non-OTHER)
            const resultWithEmptyDetail = validateLostReasonData({ 
              lostReason, 
              lostReasonDetail: '' 
            });
            expect(resultWithEmptyDetail.isValid).toBe(true);
            
            // Test with undefined lostReasonDetail
            const resultWithUndefinedDetail = validateLostReasonData({ 
              lostReason, 
              lostReasonDetail: undefined 
            });
            expect(resultWithUndefinedDetail.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 4: OTHER requires non-empty lostReasonDetail
     * Validates: Requirement 2.4 - OTHER 선택 시 lostReasonDetail 필수
     */
    it('should require lostReasonDetail when lostReason is OTHER', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate non-empty, non-whitespace-only strings for valid detail
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (validDetail) => {
            const result = validateLostReasonData({ 
              lostReason: 'OTHER', 
              lostReasonDetail: validDetail 
            });
            
            // Property: OTHER with valid detail must be accepted
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 5: OTHER with empty/whitespace lostReasonDetail should be rejected
     */
    it('should reject OTHER with empty or whitespace-only lostReasonDetail', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate empty or whitespace-only strings
          fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            // Generate whitespace-only strings
            fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0)
          ),
          async (invalidDetail) => {
            const result = validateLostReasonData({ 
              lostReason: 'OTHER', 
              lostReasonDetail: invalidDetail as any 
            });
            
            // Property: OTHER with invalid detail must be rejected
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 6: All valid lostReason values with appropriate lostReasonDetail should be accepted
     */
    it('should accept all valid lostReason values with appropriate lostReasonDetail', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...LOST_REASON_VALUES),
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (lostReason, lostReasonDetail) => {
            const result = validateLostReasonData({ lostReason, lostReasonDetail });
            
            // Property: Valid lostReason with valid detail must always be accepted
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for isValidLostReason function
   */
  describe('isValidLostReason validation', () => {
    it('should return true for all LOST_REASON_VALUES', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...LOST_REASON_VALUES),
          async (validReason) => {
            expect(isValidLostReason(validReason)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for null and undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.constant(null), fc.constant(undefined)),
          async (invalidValue) => {
            expect(isValidLostReason(invalidValue)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for invalid string values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 100 }).filter(
            s => !LOST_REASON_VALUES.includes(s as LostReason)
          ),
          async (invalidReason) => {
            expect(isValidLostReason(invalidReason)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * LOST_REASON_VALUES constant validation
   */
  describe('LOST_REASON_VALUES constant validation', () => {
    it('should have exactly 6 lost reason values defined', () => {
      expect(LOST_REASON_VALUES.length).toBe(6);
    });

    it('should include OTHER as a valid reason', () => {
      expect(LOST_REASON_VALUES).toContain('OTHER');
    });

    it('should have unique values', () => {
      const uniqueValues = new Set(LOST_REASON_VALUES);
      expect(uniqueValues.size).toBe(LOST_REASON_VALUES.length);
    });

    it('should contain all expected reason codes', () => {
      const expectedReasons = [
        'BUDGET_PLANNING',
        'COMPETITOR_SELECTED',
        'PRICE_ISSUE',
        'SCHEDULE_ISSUE',
        'ON_HOLD',
        'OTHER',
      ];
      
      for (const reason of expectedReasons) {
        expect(LOST_REASON_VALUES).toContain(reason);
      }
    });
  });
});
