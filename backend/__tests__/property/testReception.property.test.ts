/**
 * Property-Based Tests for Test Reception Validation
 * Feature: crm-workflow-enhancement
 * 
 * These tests verify universal properties of the test reception validation system:
 * - Property 4: substanceCode and projectCode are required for test reception creation
 * - Property 5: 시험번호 발행 데이터 무결성 (Test number issuance data integrity)
 * 
 * **Validates: Requirements 3.2, 3.3, 3.7**
 */

/// <reference types="jest" />

import * as fc from 'fast-check';

/**
 * Validation function for test reception required fields
 * This mirrors the validation logic in backend/src/routes/customerData.ts
 */
interface TestReceptionCreateData {
  substanceCode?: string | null;
  projectCode?: string | null;
  totalAmount?: number;
  [key: string]: unknown;
}

interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  error?: string;
}

/**
 * Validates test reception creation data for required fields
 * @param data - The test reception creation data
 * @returns Validation result with isValid flag and missing fields
 */
function validateTestReceptionRequiredFields(data: TestReceptionCreateData): ValidationResult {
  const missingFields: string[] = [];
  
  // Check substanceCode - must be non-null, non-empty, and not whitespace-only
  if (
    data.substanceCode === null ||
    data.substanceCode === undefined ||
    data.substanceCode.trim() === ''
  ) {
    missingFields.push('substanceCode (물질코드)');
  }
  
  // Check projectCode - must be non-null, non-empty, and not whitespace-only
  if (
    data.projectCode === null ||
    data.projectCode === undefined ||
    data.projectCode.trim() === ''
  ) {
    missingFields.push('projectCode (프로젝트코드)');
  }
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
      error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
    };
  }
  
  return {
    isValid: true,
    missingFields: [],
  };
}

/**
 * Checks if a string is valid (non-null, non-empty, not whitespace-only)
 */
function isValidRequiredString(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() !== '';
}

describe('Test Reception Required Fields Validation', () => {
  /**
   * Property 4: 시험 접수 필수 필드 검증
   * Feature: crm-workflow-enhancement, Task 6.2
   * 
   * For any test reception (TestReception) creation request, if substanceCode or
   * projectCode field is null or empty string, the request must be rejected.
   * 
   * **Validates: Requirements 3.2**
   */
  describe('Property 4: 시험 접수 필수 필드 검증', () => {
    /**
     * Test 1: Missing substanceCode should be rejected
     * Validates: Requirement 3.2 - substanceCode 필수
     */
    it.each([
      [undefined, 'undefined'],
      [null, 'null'],
      ['', 'empty string'],
    ])('should reject when substanceCode is %s', (substanceCode, description) => {
      const result = validateTestReceptionRequiredFields({
        substanceCode: substanceCode as any,
        projectCode: 'PRJ-001',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('substanceCode (물질코드)');
    });

    /**
     * Test 2: Missing projectCode should be rejected
     * Validates: Requirement 3.2 - projectCode 필수
     */
    it.each([
      [undefined, 'undefined'],
      [null, 'null'],
      ['', 'empty string'],
    ])('should reject when projectCode is %s', (projectCode, description) => {
      const result = validateTestReceptionRequiredFields({
        substanceCode: 'SUB-001',
        projectCode: projectCode as any,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('projectCode (프로젝트코드)');
    });

    /**
     * Property test: Any null/undefined/empty substanceCode should be rejected
     * **Validates: Requirements 3.2**
     */
    it('should reject when substanceCode is null, undefined, or empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid substanceCode values
          fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant('')
          ),
          // Generate valid projectCode
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (invalidSubstanceCode, validProjectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode: invalidSubstanceCode as any,
              projectCode: validProjectCode,
            });
            
            // Property: Invalid substanceCode must always be rejected
            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('substanceCode (물질코드)');
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property test: Any null/undefined/empty projectCode should be rejected
     * **Validates: Requirements 3.2**
     */
    it('should reject when projectCode is null, undefined, or empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid substanceCode
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // Generate invalid projectCode values
          fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant('')
          ),
          async (validSubstanceCode, invalidProjectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode: validSubstanceCode,
              projectCode: invalidProjectCode as any,
            });
            
            // Property: Invalid projectCode must always be rejected
            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('projectCode (프로젝트코드)');
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 3: Whitespace-only substanceCode should be rejected
     * **Validates: Requirements 3.2**
     */
    it('should reject when substanceCode is whitespace only', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate whitespace-only strings
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0),
          // Generate valid projectCode
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (whitespaceSubstanceCode, validProjectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode: whitespaceSubstanceCode,
              projectCode: validProjectCode,
            });
            
            // Property: Whitespace-only substanceCode must be rejected
            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('substanceCode (물질코드)');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 4: Whitespace-only projectCode should be rejected
     * **Validates: Requirements 3.2**
     */
    it('should reject when projectCode is whitespace only', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid substanceCode
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // Generate whitespace-only strings
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0),
          async (validSubstanceCode, whitespaceProjectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode: validSubstanceCode,
              projectCode: whitespaceProjectCode,
            });
            
            // Property: Whitespace-only projectCode must be rejected
            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('projectCode (프로젝트코드)');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 5: Both fields missing should report both as missing
     * **Validates: Requirements 3.2**
     */
    it('should report both fields when both substanceCode and projectCode are missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid substanceCode values
          fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0)
          ),
          // Generate invalid projectCode values
          fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0)
          ),
          async (invalidSubstanceCode, invalidProjectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode: invalidSubstanceCode as any,
              projectCode: invalidProjectCode as any,
            });
            
            // Property: Both missing fields must be reported
            expect(result.isValid).toBe(false);
            expect(result.missingFields).toHaveLength(2);
            expect(result.missingFields).toContain('substanceCode (물질코드)');
            expect(result.missingFields).toContain('projectCode (프로젝트코드)');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 6: Valid substanceCode and projectCode should be accepted
     * **Validates: Requirements 3.2**
     */
    it('should accept valid substanceCode and projectCode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid substanceCode (non-empty, non-whitespace-only)
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // Generate valid projectCode (non-empty, non-whitespace-only)
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (validSubstanceCode, validProjectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode: validSubstanceCode,
              projectCode: validProjectCode,
            });
            
            // Property: Valid fields must always be accepted
            expect(result.isValid).toBe(true);
            expect(result.missingFields).toHaveLength(0);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 7: Strings with leading/trailing whitespace but valid content should be accepted
     * **Validates: Requirements 3.2**
     */
    it('should accept strings with leading/trailing whitespace but valid content', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid content with optional leading/trailing whitespace
          fc.tuple(
            fc.stringOf(fc.constantFrom(' ', '\t')),
            fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            fc.stringOf(fc.constantFrom(' ', '\t'))
          ).map(([leading, content, trailing]) => leading + content + trailing),
          fc.tuple(
            fc.stringOf(fc.constantFrom(' ', '\t')),
            fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            fc.stringOf(fc.constantFrom(' ', '\t'))
          ).map(([leading, content, trailing]) => leading + content + trailing),
          async (substanceCodeWithWhitespace, projectCodeWithWhitespace) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode: substanceCodeWithWhitespace,
              projectCode: projectCodeWithWhitespace,
            });
            
            // Property: Strings with valid content (after trim) must be accepted
            expect(result.isValid).toBe(true);
            expect(result.missingFields).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for isValidRequiredString helper function
   */
  describe('isValidRequiredString validation', () => {
    it('should return false for null and undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.constant(null), fc.constant(undefined)),
          async (invalidValue) => {
            expect(isValidRequiredString(invalidValue)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for empty string', () => {
      expect(isValidRequiredString('')).toBe(false);
    });

    it('should return false for whitespace-only strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0),
          async (whitespaceString) => {
            expect(isValidRequiredString(whitespaceString)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true for non-empty, non-whitespace-only strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (validString) => {
            expect(isValidRequiredString(validString)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge case tests for specific code patterns
   */
  describe('Edge cases for substanceCode and projectCode patterns', () => {
    it('should accept typical substance code patterns', async () => {
      const typicalSubstanceCodes = [
        'SUB-001',
        'SUB-2025-0001',
        'SUBSTANCE_CODE_123',
        'A1B2C3',
        '물질코드-001',
      ];
      
      for (const code of typicalSubstanceCodes) {
        const result = validateTestReceptionRequiredFields({
          substanceCode: code,
          projectCode: 'PRJ-001',
        });
        expect(result.isValid).toBe(true);
      }
    });

    it('should accept typical project code patterns', async () => {
      const typicalProjectCodes = [
        'PRJ-001',
        'PRJ-2025-0001',
        'PROJECT_CODE_123',
        'P1Q2R3',
        '프로젝트-001',
      ];
      
      for (const code of typicalProjectCodes) {
        const result = validateTestReceptionRequiredFields({
          substanceCode: 'SUB-001',
          projectCode: code,
        });
        expect(result.isValid).toBe(true);
      }
    });

    it('should handle special characters in codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with special characters but non-empty after trim
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0)
            .map(s => s + '-!@#$%'),
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0)
            .map(s => s + '_()[]{}'),
          async (substanceCode, projectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode,
              projectCode,
            });
            
            // Property: Special characters should not affect validation
            // (validation only checks for non-empty after trim)
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle unicode characters in codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.unicodeString({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.unicodeString({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (substanceCode, projectCode) => {
            const result = validateTestReceptionRequiredFields({
              substanceCode,
              projectCode,
            });
            
            // Property: Unicode characters should be accepted if non-empty after trim
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property 5: 시험번호 발행 데이터 무결성
 * Feature: crm-workflow-enhancement, Task 6.3
 * 
 * For any successful test number issuance request, the TestReception's testNumber field
 * must be updated, testNumberIssuedAt field must be set to the current time, and
 * testNumberIssuedBy must be set to the issuing user. Additionally, duplicate test
 * numbers must be rejected.
 * 
 * **Validates: Requirements 3.3, 3.7**
 */

/**
 * Interface for test number issuance request
 */
interface IssueTestNumberRequest {
  testNumber: string;
  testTitle?: string;
  testDirector?: string;
  issuedBy: string;
}

/**
 * Interface for TestReception entity
 */
interface TestReception {
  id: string;
  customerId: string;
  substanceCode: string;
  projectCode: string;
  testNumber: string | null;
  testNumberIssuedAt: Date | null;
  testNumberIssuedBy: string | null;
  testTitle?: string | null;
  testDirector?: string | null;
  leadId?: string | null;
  status: string;
}

/**
 * Interface for test number issuance result
 */
interface IssueTestNumberResult {
  success: boolean;
  testReception?: TestReception;
  error?: string;
  errorCode?: 'DUPLICATE_TEST_NUMBER' | 'INVALID_TEST_NUMBER' | 'NOT_FOUND';
}

/**
 * Simulates the test number issuance logic
 * This mirrors the validation and update logic in backend/src/services/customerDataService.ts
 */
function issueTestNumber(
  reception: TestReception,
  request: IssueTestNumberRequest,
  existingTestNumbers: Map<string, string> // testNumber -> receptionId
): IssueTestNumberResult {
  const trimmedTestNumber = request.testNumber?.trim();
  
  // Validate test number is not empty
  if (!trimmedTestNumber || trimmedTestNumber === '') {
    return {
      success: false,
      error: '시험번호를 입력해주세요.',
      errorCode: 'INVALID_TEST_NUMBER',
    };
  }
  
  // Check for duplicate test number (excluding current reception)
  const existingReceptionId = existingTestNumbers.get(trimmedTestNumber);
  if (existingReceptionId && existingReceptionId !== reception.id) {
    return {
      success: false,
      error: '이미 사용 중인 시험번호입니다.',
      errorCode: 'DUPLICATE_TEST_NUMBER',
    };
  }
  
  // Issue the test number
  const now = new Date();
  const updatedReception: TestReception = {
    ...reception,
    testNumber: trimmedTestNumber,
    testNumberIssuedAt: now,
    testNumberIssuedBy: request.issuedBy,
    testTitle: request.testTitle?.trim() || reception.testTitle,
    testDirector: request.testDirector?.trim() || reception.testDirector,
  };
  
  return {
    success: true,
    testReception: updatedReception,
  };
}

/**
 * Validates test number format (non-empty after trim)
 */
function isValidTestNumber(testNumber: string | null | undefined): boolean {
  return testNumber !== null && testNumber !== undefined && testNumber.trim() !== '';
}

describe('Property 5: 시험번호 발행 데이터 무결성', () => {
  /**
   * Arbitrary for generating valid test reception data
   */
  const testReceptionArbitrary = fc.record({
    id: fc.uuid(),
    customerId: fc.uuid(),
    substanceCode: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    projectCode: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    testNumber: fc.constant(null as string | null),
    testNumberIssuedAt: fc.constant(null as Date | null),
    testNumberIssuedBy: fc.constant(null as string | null),
    testTitle: fc.constant(null as string | null),
    testDirector: fc.constant(null as string | null),
    leadId: fc.option(fc.uuid(), { nil: null }),
    status: fc.constant('received'),
  });

  /**
   * Arbitrary for generating valid test number strings
   */
  const validTestNumberArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());

  /**
   * Arbitrary for generating invalid test number strings
   */
  const invalidTestNumberArbitrary = fc.oneof(
    fc.constant(''),
    fc.constant(null as any),
    fc.constant(undefined as any),
    fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0)
  );

  /**
   * Arbitrary for generating user IDs
   */
  const userIdArbitrary = fc.uuid();

  /**
   * Test 1: Successful test number issuance updates testNumber field
   * **Validates: Requirements 3.3**
   */
  it('should update testNumber field when issuance is successful', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        async (reception, testNumber, userId) => {
          const result = issueTestNumber(
            reception,
            { testNumber, issuedBy: userId },
            new Map() // No existing test numbers
          );
          
          // Property: Successful issuance must update testNumber
          expect(result.success).toBe(true);
          expect(result.testReception).toBeDefined();
          expect(result.testReception!.testNumber).toBe(testNumber.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 2: Successful test number issuance sets testNumberIssuedAt to current time
   * **Validates: Requirements 3.3**
   */
  it('should set testNumberIssuedAt to current time when issuance is successful', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        async (reception, testNumber, userId) => {
          const beforeIssuance = new Date();
          
          const result = issueTestNumber(
            reception,
            { testNumber, issuedBy: userId },
            new Map()
          );
          
          const afterIssuance = new Date();
          
          // Property: testNumberIssuedAt must be set to a time between before and after
          expect(result.success).toBe(true);
          expect(result.testReception!.testNumberIssuedAt).toBeDefined();
          expect(result.testReception!.testNumberIssuedAt).toBeInstanceOf(Date);
          expect(result.testReception!.testNumberIssuedAt!.getTime()).toBeGreaterThanOrEqual(beforeIssuance.getTime());
          expect(result.testReception!.testNumberIssuedAt!.getTime()).toBeLessThanOrEqual(afterIssuance.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 3: Successful test number issuance sets testNumberIssuedBy to the issuing user
   * **Validates: Requirements 3.3**
   */
  it('should set testNumberIssuedBy to the issuing user when issuance is successful', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        async (reception, testNumber, userId) => {
          const result = issueTestNumber(
            reception,
            { testNumber, issuedBy: userId },
            new Map()
          );
          
          // Property: testNumberIssuedBy must be set to the issuing user
          expect(result.success).toBe(true);
          expect(result.testReception!.testNumberIssuedBy).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 4: Duplicate test numbers are rejected
   * **Validates: Requirements 3.3 (Error handling)**
   */
  it('should reject duplicate test numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        fc.uuid(), // ID of the reception that already has this test number
        async (reception, testNumber, userId, existingReceptionId) => {
          // Ensure the existing reception is different from the current one
          fc.pre(existingReceptionId !== reception.id);
          
          const existingTestNumbers = new Map<string, string>();
          existingTestNumbers.set(testNumber.trim(), existingReceptionId);
          
          const result = issueTestNumber(
            reception,
            { testNumber, issuedBy: userId },
            existingTestNumbers
          );
          
          // Property: Duplicate test numbers must be rejected
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('DUPLICATE_TEST_NUMBER');
          expect(result.error).toBe('이미 사용 중인 시험번호입니다.');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 5: Same reception can update its own test number
   * **Validates: Requirements 3.3**
   */
  it('should allow updating test number for the same reception', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        async (reception, originalTestNumber, newTestNumber, userId) => {
          // Set up existing test numbers with the same reception's original number
          const existingTestNumbers = new Map<string, string>();
          existingTestNumbers.set(originalTestNumber.trim(), reception.id);
          
          const result = issueTestNumber(
            reception,
            { testNumber: newTestNumber, issuedBy: userId },
            existingTestNumbers
          );
          
          // Property: Same reception should be able to update its test number
          // (unless the new number is already used by another reception)
          if (!existingTestNumbers.has(newTestNumber.trim()) || 
              existingTestNumbers.get(newTestNumber.trim()) === reception.id) {
            expect(result.success).toBe(true);
            expect(result.testReception!.testNumber).toBe(newTestNumber.trim());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 6: Invalid test numbers are rejected
   * **Validates: Requirements 3.3**
   */
  it('should reject invalid test numbers (empty, null, undefined, whitespace-only)', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        invalidTestNumberArbitrary,
        userIdArbitrary,
        async (reception, invalidTestNumber, userId) => {
          const result = issueTestNumber(
            reception,
            { testNumber: invalidTestNumber, issuedBy: userId },
            new Map()
          );
          
          // Property: Invalid test numbers must be rejected
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('INVALID_TEST_NUMBER');
          expect(result.error).toBe('시험번호를 입력해주세요.');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 7: Test number is trimmed before storage
   * **Validates: Requirements 3.3**
   */
  it('should trim test number before storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        // Generate strings with leading/trailing whitespace but valid content
        fc.tuple(
          fc.stringOf(fc.constantFrom(' ', '\t')),
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          fc.stringOf(fc.constantFrom(' ', '\t'))
        ).map(([leading, content, trailing]) => leading + content + trailing),
        userIdArbitrary,
        async (reception, testNumberWithWhitespace, userId) => {
          const result = issueTestNumber(
            reception,
            { testNumber: testNumberWithWhitespace, issuedBy: userId },
            new Map()
          );
          
          // Property: Test number must be trimmed
          expect(result.success).toBe(true);
          expect(result.testReception!.testNumber).toBe(testNumberWithWhitespace.trim());
          expect(result.testReception!.testNumber).not.toMatch(/^\s|\s$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 8: Optional fields (testTitle, testDirector) are preserved
   * **Validates: Requirements 3.3**
   */
  it('should preserve optional fields when provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
        fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { nil: undefined }),
        async (reception, testNumber, userId, testTitle, testDirector) => {
          const result = issueTestNumber(
            reception,
            { testNumber, issuedBy: userId, testTitle, testDirector },
            new Map()
          );
          
          // Property: Optional fields must be preserved when provided
          expect(result.success).toBe(true);
          if (testTitle) {
            expect(result.testReception!.testTitle).toBe(testTitle.trim());
          }
          if (testDirector) {
            expect(result.testReception!.testDirector).toBe(testDirector.trim());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 9: All three fields are updated atomically on successful issuance
   * **Validates: Requirements 3.3**
   */
  it('should update testNumber, testNumberIssuedAt, and testNumberIssuedBy atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        async (reception, testNumber, userId) => {
          const result = issueTestNumber(
            reception,
            { testNumber, issuedBy: userId },
            new Map()
          );
          
          // Property: All three fields must be updated together
          expect(result.success).toBe(true);
          
          // All fields must be non-null after successful issuance
          expect(result.testReception!.testNumber).not.toBeNull();
          expect(result.testReception!.testNumberIssuedAt).not.toBeNull();
          expect(result.testReception!.testNumberIssuedBy).not.toBeNull();
          
          // Values must be correct
          expect(result.testReception!.testNumber).toBe(testNumber.trim());
          expect(result.testReception!.testNumberIssuedBy).toBe(userId);
          expect(result.testReception!.testNumberIssuedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 10: Original reception data is preserved except for updated fields
   * **Validates: Requirements 3.3**
   */
  it('should preserve original reception data except for updated fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        validTestNumberArbitrary,
        userIdArbitrary,
        async (reception, testNumber, userId) => {
          const result = issueTestNumber(
            reception,
            { testNumber, issuedBy: userId },
            new Map()
          );
          
          // Property: Original data must be preserved
          expect(result.success).toBe(true);
          expect(result.testReception!.id).toBe(reception.id);
          expect(result.testReception!.customerId).toBe(reception.customerId);
          expect(result.testReception!.substanceCode).toBe(reception.substanceCode);
          expect(result.testReception!.projectCode).toBe(reception.projectCode);
          expect(result.testReception!.leadId).toBe(reception.leadId);
          expect(result.testReception!.status).toBe(reception.status);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional validation tests for isValidTestNumber helper
 */
describe('isValidTestNumber validation', () => {
  it('should return false for null and undefined', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(null), fc.constant(undefined)),
        async (invalidValue) => {
          expect(isValidTestNumber(invalidValue)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false for empty string', () => {
    expect(isValidTestNumber('')).toBe(false);
  });

  it('should return false for whitespace-only strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0),
        async (whitespaceString) => {
          expect(isValidTestNumber(whitespaceString)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return true for non-empty, non-whitespace-only strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (validString) => {
          expect(isValidTestNumber(validString)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Edge case tests for test number patterns
 */
describe('Edge cases for test number patterns', () => {
  it('should accept typical test number patterns', () => {
    const typicalTestNumbers = [
      'TEST-2025-0001',
      'T-001',
      'TEST_NUMBER_123',
      'A1B2C3',
      '시험번호-001',
      '2025-TEST-001',
    ];
    
    for (const testNumber of typicalTestNumbers) {
      expect(isValidTestNumber(testNumber)).toBe(true);
    }
  });

  it('should handle special characters in test numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 })
          .filter(s => s.trim().length > 0)
          .map(s => s + '-!@#$%'),
        async (testNumber) => {
          expect(isValidTestNumber(testNumber)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle unicode characters in test numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.unicodeString({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (testNumber) => {
          expect(isValidTestNumber(testNumber)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 6: 시험 접수-상담기록 연동
 * Feature: crm-workflow-enhancement, Task 6.5
 * 
 * For any test reception query with withConsultation option set to true,
 * the response must include all ConsultationRecords linked to that test reception.
 * 
 * **Validates: Requirements 3.5**
 */

/**
 * Interface for ConsultationRecord entity
 */
interface ConsultationRecord {
  id: string;
  recordNumber: string;
  customerId: string;
  contractId?: string | null;
  userId: string;
  customerInfo: Record<string, unknown>;
  testInfo?: Record<string, unknown> | null;
  substanceInfo?: Record<string, unknown> | null;
  substanceName?: string | null;
  storageStatus?: string | null;
  storageLocation?: string | null;
  clientRequests?: string | null;
  internalNotes?: string | null;
  consultDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Interface for TestReception with consultation records
 */
interface TestReceptionWithConsultation {
  id: string;
  customerId: string;
  substanceCode: string;
  projectCode: string;
  testNumber: string | null;
  consultationRecords: ConsultationRecord[];
}

/**
 * Simulates the getByIdWithConsultation service logic
 * This mirrors the logic in backend/src/services/customerDataService.ts
 * 
 * @param testReception - The test reception to query
 * @param allConsultationRecords - All consultation records in the system
 * @param withConsultation - Whether to include consultation records
 * @returns Test reception with or without consultation records
 */
function getTestReceptionWithConsultation(
  testReception: { id: string; customerId: string; substanceCode: string; projectCode: string; testNumber: string | null },
  allConsultationRecords: ConsultationRecord[],
  withConsultation: boolean
): TestReceptionWithConsultation | { id: string; customerId: string; substanceCode: string; projectCode: string; testNumber: string | null } {
  if (!withConsultation) {
    return testReception;
  }

  // Filter consultation records by customerId and exclude deleted ones
  const consultationRecords = allConsultationRecords
    .filter(record => 
      record.customerId === testReception.customerId && 
      record.deletedAt === null
    )
    // Sort by consultDate descending
    .sort((a, b) => b.consultDate.getTime() - a.consultDate.getTime());

  return {
    ...testReception,
    consultationRecords,
  };
}

/**
 * Checks if consultation records are properly ordered by consultDate descending
 */
function isOrderedByConsultDateDescending(records: ConsultationRecord[]): boolean {
  if (records.length <= 1) return true;
  
  for (let i = 0; i < records.length - 1; i++) {
    if (records[i].consultDate.getTime() < records[i + 1].consultDate.getTime()) {
      return false;
    }
  }
  return true;
}

describe('Property 6: 시험 접수-상담기록 연동', () => {
  /**
   * Arbitrary for generating valid test reception data
   */
  const testReceptionArbitrary = fc.record({
    id: fc.uuid(),
    customerId: fc.uuid(),
    substanceCode: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    projectCode: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    testNumber: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { nil: null }),
  });

  /**
   * Arbitrary for generating consultation record data
   */
  const consultationRecordArbitrary = (customerId: string) => fc.record({
    id: fc.uuid(),
    recordNumber: fc.string({ minLength: 5, maxLength: 20 }).map(s => `CR-${s}`),
    customerId: fc.constant(customerId),
    contractId: fc.option(fc.uuid(), { nil: null }),
    userId: fc.uuid(),
    customerInfo: fc.constant({ companyName: 'Test Company', contactName: 'Test Contact' }),
    testInfo: fc.option(fc.constant({ testType: 'Type A' }), { nil: null }),
    substanceInfo: fc.option(fc.constant({ substanceName: 'Test Substance' }), { nil: null }),
    substanceName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    storageStatus: fc.option(fc.constantFrom('stored', 'pending', 'disposed'), { nil: null }),
    storageLocation: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    clientRequests: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    internalNotes: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    consultDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    deletedAt: fc.constant(null as Date | null),
  });

  /**
   * Arbitrary for generating deleted consultation record data
   */
  const deletedConsultationRecordArbitrary = (customerId: string) => fc.record({
    id: fc.uuid(),
    recordNumber: fc.string({ minLength: 5, maxLength: 20 }).map(s => `CR-DEL-${s}`),
    customerId: fc.constant(customerId),
    contractId: fc.option(fc.uuid(), { nil: null }),
    userId: fc.uuid(),
    customerInfo: fc.constant({ companyName: 'Deleted Company', contactName: 'Deleted Contact' }),
    testInfo: fc.option(fc.constant({ testType: 'Type B' }), { nil: null }),
    substanceInfo: fc.option(fc.constant({ substanceName: 'Deleted Substance' }), { nil: null }),
    substanceName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    storageStatus: fc.option(fc.constantFrom('stored', 'pending', 'disposed'), { nil: null }),
    storageLocation: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    clientRequests: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    internalNotes: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    consultDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    deletedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  });

  /**
   * Test 1: When withConsultation is true, consultationRecords array is included
   * **Validates: Requirements 3.5**
   */
  it('should include consultationRecords array when withConsultation is true', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        async (testReception) => {
          const result = getTestReceptionWithConsultation(
            testReception,
            [], // No consultation records
            true // withConsultation = true
          );

          // Property: When withConsultation is true, consultationRecords must be included
          expect(result).toHaveProperty('consultationRecords');
          expect(Array.isArray((result as TestReceptionWithConsultation).consultationRecords)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 2: consultationRecords contains all records for the customer
   * **Validates: Requirements 3.5**
   */
  it('should include all consultation records for the customer', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        fc.integer({ min: 1, max: 10 }),
        async (testReception, recordCount) => {
          // Generate consultation records for this customer
          const customerRecords = await fc.sample(
            consultationRecordArbitrary(testReception.customerId),
            recordCount
          );

          const result = getTestReceptionWithConsultation(
            testReception,
            customerRecords,
            true
          ) as TestReceptionWithConsultation;

          // Property: All non-deleted records for the customer must be included
          expect(result.consultationRecords).toHaveLength(recordCount);
          
          // All returned records must belong to the same customer
          result.consultationRecords.forEach(record => {
            expect(record.customerId).toBe(testReception.customerId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 3: Deleted consultation records are excluded
   * **Validates: Requirements 3.5**
   */
  it('should exclude deleted consultation records', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (testReception, activeCount, deletedCount) => {
          // Generate active consultation records
          const activeRecords = await fc.sample(
            consultationRecordArbitrary(testReception.customerId),
            activeCount
          );

          // Generate deleted consultation records
          const deletedRecords = await fc.sample(
            deletedConsultationRecordArbitrary(testReception.customerId),
            deletedCount
          );

          const allRecords = [...activeRecords, ...deletedRecords];

          const result = getTestReceptionWithConsultation(
            testReception,
            allRecords,
            true
          ) as TestReceptionWithConsultation;

          // Property: Only non-deleted records must be included
          expect(result.consultationRecords).toHaveLength(activeCount);
          
          // No deleted records should be in the result
          result.consultationRecords.forEach(record => {
            expect(record.deletedAt).toBeNull();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 4: Records are ordered by consultDate descending
   * **Validates: Requirements 3.5**
   */
  it('should order consultation records by consultDate descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        fc.integer({ min: 2, max: 10 }),
        async (testReception, recordCount) => {
          // Generate consultation records with different dates
          const records = await fc.sample(
            consultationRecordArbitrary(testReception.customerId),
            recordCount
          );

          const result = getTestReceptionWithConsultation(
            testReception,
            records,
            true
          ) as TestReceptionWithConsultation;

          // Property: Records must be ordered by consultDate descending
          expect(isOrderedByConsultDateDescending(result.consultationRecords)).toBe(true);
          
          // Verify ordering explicitly
          for (let i = 0; i < result.consultationRecords.length - 1; i++) {
            const currentDate = result.consultationRecords[i].consultDate.getTime();
            const nextDate = result.consultationRecords[i + 1].consultDate.getTime();
            expect(currentDate).toBeGreaterThanOrEqual(nextDate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 5: Records from other customers are not included
   * **Validates: Requirements 3.5**
   */
  it('should not include consultation records from other customers', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        fc.uuid(), // Different customer ID
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (testReception, otherCustomerId, ownRecordCount, otherRecordCount) => {
          // Ensure different customer IDs
          fc.pre(otherCustomerId !== testReception.customerId);

          // Generate records for the test reception's customer
          const ownRecords = await fc.sample(
            consultationRecordArbitrary(testReception.customerId),
            ownRecordCount
          );

          // Generate records for a different customer
          const otherRecords = await fc.sample(
            consultationRecordArbitrary(otherCustomerId),
            otherRecordCount
          );

          const allRecords = [...ownRecords, ...otherRecords];

          const result = getTestReceptionWithConsultation(
            testReception,
            allRecords,
            true
          ) as TestReceptionWithConsultation;

          // Property: Only records for the test reception's customer must be included
          expect(result.consultationRecords).toHaveLength(ownRecordCount);
          
          // All returned records must belong to the test reception's customer
          result.consultationRecords.forEach(record => {
            expect(record.customerId).toBe(testReception.customerId);
            expect(record.customerId).not.toBe(otherCustomerId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 6: When withConsultation is false, consultationRecords is not included
   * **Validates: Requirements 3.5**
   */
  it('should not include consultationRecords when withConsultation is false', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        fc.integer({ min: 1, max: 5 }),
        async (testReception, recordCount) => {
          // Generate consultation records
          const records = await fc.sample(
            consultationRecordArbitrary(testReception.customerId),
            recordCount
          );

          const result = getTestReceptionWithConsultation(
            testReception,
            records,
            false // withConsultation = false
          );

          // Property: When withConsultation is false, consultationRecords must not be included
          expect(result).not.toHaveProperty('consultationRecords');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 7: Empty consultation records array when no records exist for customer
   * **Validates: Requirements 3.5**
   */
  it('should return empty consultationRecords array when no records exist for customer', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        fc.uuid(), // Different customer ID
        fc.integer({ min: 1, max: 5 }),
        async (testReception, otherCustomerId, otherRecordCount) => {
          // Ensure different customer IDs
          fc.pre(otherCustomerId !== testReception.customerId);

          // Generate records only for a different customer
          const otherRecords = await fc.sample(
            consultationRecordArbitrary(otherCustomerId),
            otherRecordCount
          );

          const result = getTestReceptionWithConsultation(
            testReception,
            otherRecords,
            true
          ) as TestReceptionWithConsultation;

          // Property: When no records exist for the customer, array must be empty
          expect(result.consultationRecords).toHaveLength(0);
          expect(Array.isArray(result.consultationRecords)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 8: All consultation record fields are preserved
   * **Validates: Requirements 3.5**
   */
  it('should preserve all consultation record fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        async (testReception) => {
          // Generate a single consultation record with all fields
          const [record] = await fc.sample(
            consultationRecordArbitrary(testReception.customerId),
            1
          );

          const result = getTestReceptionWithConsultation(
            testReception,
            [record],
            true
          ) as TestReceptionWithConsultation;

          // Property: All fields must be preserved
          expect(result.consultationRecords).toHaveLength(1);
          const returnedRecord = result.consultationRecords[0];
          
          expect(returnedRecord.id).toBe(record.id);
          expect(returnedRecord.recordNumber).toBe(record.recordNumber);
          expect(returnedRecord.customerId).toBe(record.customerId);
          expect(returnedRecord.userId).toBe(record.userId);
          expect(returnedRecord.customerInfo).toEqual(record.customerInfo);
          expect(returnedRecord.consultDate).toEqual(record.consultDate);
          expect(returnedRecord.deletedAt).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 9: Mixed scenario - active and deleted records with multiple customers
   * **Validates: Requirements 3.5**
   */
  it('should correctly filter in mixed scenario with multiple customers and deleted records', async () => {
    await fc.assert(
      fc.asyncProperty(
        testReceptionArbitrary,
        fc.uuid(),
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        async (testReception, otherCustomerId, ownActiveCount, ownDeletedCount, otherCount) => {
          // Ensure different customer IDs
          fc.pre(otherCustomerId !== testReception.customerId);

          // Generate active records for own customer
          const ownActiveRecords = await fc.sample(
            consultationRecordArbitrary(testReception.customerId),
            ownActiveCount
          );

          // Generate deleted records for own customer
          const ownDeletedRecords = await fc.sample(
            deletedConsultationRecordArbitrary(testReception.customerId),
            ownDeletedCount
          );

          // Generate records for other customer
          const otherRecords = await fc.sample(
            consultationRecordArbitrary(otherCustomerId),
            otherCount
          );

          const allRecords = [...ownActiveRecords, ...ownDeletedRecords, ...otherRecords];

          const result = getTestReceptionWithConsultation(
            testReception,
            allRecords,
            true
          ) as TestReceptionWithConsultation;

          // Property: Only own customer's active records must be included
          expect(result.consultationRecords).toHaveLength(ownActiveCount);
          
          result.consultationRecords.forEach(record => {
            expect(record.customerId).toBe(testReception.customerId);
            expect(record.deletedAt).toBeNull();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function tests for ordering validation
 */
describe('isOrderedByConsultDateDescending validation', () => {
  it('should return true for empty array', () => {
    expect(isOrderedByConsultDateDescending([])).toBe(true);
  });

  it('should return true for single element array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          recordNumber: fc.string(),
          customerId: fc.uuid(),
          userId: fc.uuid(),
          customerInfo: fc.constant({}),
          consultDate: fc.date(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          deletedAt: fc.constant(null as Date | null),
        }),
        async (record) => {
          expect(isOrderedByConsultDateDescending([record as ConsultationRecord])).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return true for correctly ordered array', () => {
    const records: ConsultationRecord[] = [
      { id: '1', recordNumber: 'CR-1', customerId: 'c1', userId: 'u1', customerInfo: {}, consultDate: new Date('2025-03-01'), createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: '2', recordNumber: 'CR-2', customerId: 'c1', userId: 'u1', customerInfo: {}, consultDate: new Date('2025-02-01'), createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: '3', recordNumber: 'CR-3', customerId: 'c1', userId: 'u1', customerInfo: {}, consultDate: new Date('2025-01-01'), createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];
    expect(isOrderedByConsultDateDescending(records)).toBe(true);
  });

  it('should return false for incorrectly ordered array', () => {
    const records: ConsultationRecord[] = [
      { id: '1', recordNumber: 'CR-1', customerId: 'c1', userId: 'u1', customerInfo: {}, consultDate: new Date('2025-01-01'), createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: '2', recordNumber: 'CR-2', customerId: 'c1', userId: 'u1', customerInfo: {}, consultDate: new Date('2025-03-01'), createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];
    expect(isOrderedByConsultDateDescending(records)).toBe(false);
  });

  it('should return true for array with same dates', () => {
    const sameDate = new Date('2025-01-15');
    const records: ConsultationRecord[] = [
      { id: '1', recordNumber: 'CR-1', customerId: 'c1', userId: 'u1', customerInfo: {}, consultDate: sameDate, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: '2', recordNumber: 'CR-2', customerId: 'c1', userId: 'u1', customerInfo: {}, consultDate: sameDate, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];
    expect(isOrderedByConsultDateDescending(records)).toBe(true);
  });
});
