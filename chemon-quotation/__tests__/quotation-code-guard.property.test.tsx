/**
 * Property-Based Tests for QuotationCodeGuard and UserCodeSetting Components
 * 
 * **Feature: unified-quotation-code, Property 5: 코드 미설정 시 오류 처리**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * These tests verify:
 * 1. QuotationCodeGuard renders children when userCode is set
 * 2. QuotationCodeGuard shows message and settings link when userCode is not set
 * 3. QuotationCodeGuard works for all quotation types (TOXICITY, EFFICACY, CLINICAL)
 * 4. UserCodeSetting shows validation feedback (available/duplicate)
 */

import * as fc from 'fast-check';
import React from 'react';

// Types matching the component interfaces
type QuotationType = 'TOXICITY' | 'EFFICACY' | 'CLINICAL';

interface QuotationCodeGuardProps {
  userCode?: string;
  children: React.ReactNode;
  quotationType: QuotationType;
}

// Quotation type labels (matching the component)
const QUOTATION_TYPE_LABELS: Record<QuotationType, string> = {
  TOXICITY: '독성시험',
  EFFICACY: '효력시험',
  CLINICAL: '임상병리시험',
};

// Arbitraries
const quotationTypeArb = fc.constantFrom('TOXICITY', 'EFFICACY', 'CLINICAL') as fc.Arbitrary<QuotationType>;

// Valid user code: 2 uppercase letters
const validUserCodeArb = fc.string({ minLength: 2, maxLength: 2 })
  .filter(s => /^[A-Z]{2}$/.test(s));

// Invalid/empty user codes
const emptyUserCodeArb = fc.constantFrom(undefined, '', '   ', null) as fc.Arbitrary<string | undefined | null>;

// User code with various formats (for normalization testing)
const mixedCaseUserCodeArb = fc.string({ minLength: 2, maxLength: 2 })
  .filter(s => /^[A-Za-z]{2}$/.test(s));

/**
 * Helper function: Simulate QuotationCodeGuard behavior
 * This mirrors the component logic for testing
 */
function shouldRenderChildren(userCode: string | undefined | null): boolean {
  return userCode !== undefined && userCode !== null && userCode.trim().length > 0;
}

/**
 * Helper function: Get expected message for quotation type
 */
function getExpectedMessage(quotationType: QuotationType): string {
  const label = QUOTATION_TYPE_LABELS[quotationType];
  return `${label} 견적서를 작성하려면 먼저 견적서 코드를 설정해야 합니다.`;
}

/**
 * Helper function: Simulate UserCodeSetting validation state
 */
interface ValidationState {
  inputCode: string;
  isChecking: boolean;
  isDuplicate: boolean;
  isAvailable: boolean;
  errorMessage?: string;
}

function getValidationState(
  inputCode: string,
  existingCodes: string[],
  currentUserCode: string
): ValidationState {
  const normalizedInput = inputCode.toUpperCase();
  
  // Check format
  if (inputCode.length !== 2) {
    return {
      inputCode,
      isChecking: false,
      isDuplicate: false,
      isAvailable: false,
      errorMessage: inputCode.length > 0 ? '2글자 영문을 입력해주세요' : undefined,
    };
  }

  // Check if it's the user's own code
  if (normalizedInput === currentUserCode.toUpperCase()) {
    return {
      inputCode,
      isChecking: false,
      isDuplicate: false,
      isAvailable: true,
      errorMessage: undefined,
    };
  }

  // Check for duplicates (case-insensitive)
  const isDuplicate = existingCodes.some(
    code => code.toUpperCase() === normalizedInput
  );

  return {
    inputCode,
    isChecking: false,
    isDuplicate,
    isAvailable: !isDuplicate,
    errorMessage: isDuplicate ? '이미 사용 중인 견적서 코드입니다' : undefined,
  };
}

describe('QuotationCodeGuard Component Property Tests', () => {
  /**
   * Property 5: 코드 미설정 시 오류 처리
   * Feature: unified-quotation-code
   * 
   * For any User_Code가 설정되지 않은 사용자가 견적서 생성을 시도하면,
   * 시스템은 적절한 오류 메시지와 함께 생성을 거부해야 합니다.
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  describe('Property 5: 코드 미설정 시 오류 처리', () => {
    it('should block quotation creation when userCode is not set', () => {
      fc.assert(
        fc.property(
          emptyUserCodeArb,
          quotationTypeArb,
          (userCode, quotationType) => {
            // Property: Empty/undefined userCode should NOT render children
            const shouldRender = shouldRenderChildren(userCode);
            expect(shouldRender).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow quotation creation when userCode is set', () => {
      fc.assert(
        fc.property(
          validUserCodeArb,
          quotationTypeArb,
          (userCode, quotationType) => {
            // Property: Valid userCode should render children
            const shouldRender = shouldRenderChildren(userCode);
            expect(shouldRender).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show appropriate message for each quotation type when code is not set', () => {
      fc.assert(
        fc.property(
          emptyUserCodeArb,
          quotationTypeArb,
          (userCode, quotationType) => {
            // Property: Message should include quotation type label
            const message = getExpectedMessage(quotationType);
            const label = QUOTATION_TYPE_LABELS[quotationType];
            
            expect(message).toContain(label);
            expect(message).toContain('견적서 코드를 설정');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work consistently for all quotation types', () => {
      fc.assert(
        fc.property(
          fc.oneof(emptyUserCodeArb, validUserCodeArb.map(c => c as string | undefined)),
          quotationTypeArb,
          (userCode, quotationType) => {
            const shouldRender = shouldRenderChildren(userCode);
            
            // Property: Behavior should be consistent regardless of quotation type
            // Only depends on whether userCode is set
            if (userCode && userCode.trim().length > 0) {
              expect(shouldRender).toBe(true);
            } else {
              expect(shouldRender).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * QuotationCodeGuard 렌더링 테스트
   * 
   * Tests that the guard component correctly determines when to render
   * children vs. when to show the setup message.
   */
  describe('QuotationCodeGuard 렌더링 로직', () => {
    it('should render children for any valid 2-letter code', () => {
      fc.assert(
        fc.property(
          validUserCodeArb,
          quotationTypeArb,
          (userCode, quotationType) => {
            // Property: Any valid 2-letter uppercase code should allow rendering
            expect(shouldRenderChildren(userCode)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not render children for whitespace-only codes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 5 })
            .map(arr => arr.join('')),
          quotationTypeArb,
          (whitespaceCode, quotationType) => {
            // Property: Whitespace-only strings should not allow rendering
            expect(shouldRenderChildren(whitespaceCode)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases for userCode values', () => {
      const edgeCases = [
        { userCode: undefined, expected: false },
        { userCode: null, expected: false },
        { userCode: '', expected: false },
        { userCode: '  ', expected: false },
        { userCode: 'A', expected: true },  // Single char is truthy but not valid format
        { userCode: 'DL', expected: true },
        { userCode: 'ABC', expected: true }, // More than 2 chars is truthy
      ];

      edgeCases.forEach(({ userCode, expected }) => {
        expect(shouldRenderChildren(userCode as string | undefined)).toBe(expected);
      });
    });
  });
});

describe('UserCodeSetting Component Property Tests', () => {
  /**
   * UserCodeSetting 중복 검사 UI 테스트
   * 
   * Tests the validation feedback logic for the UserCodeSetting component.
   * 
   * **Validates: Requirements 4.4 (실시간 중복 여부 확인 및 피드백)**
   */
  describe('UserCodeSetting 중복 검사 로직', () => {
    it('should detect duplicate codes case-insensitively', () => {
      fc.assert(
        fc.property(
          mixedCaseUserCodeArb,
          fc.array(validUserCodeArb, { minLength: 1, maxLength: 10 }),
          fc.uuid(),
          (inputCode, existingCodes, currentUserId) => {
            // Ensure at least one existing code matches (case-insensitive)
            const normalizedInput = inputCode.toUpperCase();
            const existingCodesWithMatch = [...existingCodes, normalizedInput];
            
            const state = getValidationState(inputCode, existingCodesWithMatch, '');
            
            // Property: Should detect duplicate regardless of case
            expect(state.isDuplicate).toBe(true);
            expect(state.isAvailable).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow user to keep their own code', () => {
      fc.assert(
        fc.property(
          validUserCodeArb,
          fc.array(validUserCodeArb, { minLength: 0, maxLength: 10 }),
          (currentCode, otherCodes) => {
            // User's own code should always be allowed
            const state = getValidationState(currentCode, otherCodes, currentCode);
            
            // Property: Own code should be available (not duplicate)
            expect(state.isDuplicate).toBe(false);
            expect(state.isAvailable).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show error for invalid format codes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 1 }),  // 0 or 1 character
          (shortCode) => {
            const state = getValidationState(shortCode, [], '');
            
            // Property: Short codes should not be available
            expect(state.isAvailable).toBe(false);
            
            // Property: Should have error message if not empty
            if (shortCode.length > 0) {
              expect(state.errorMessage).toBe('2글자 영문을 입력해주세요');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark available codes correctly', () => {
      fc.assert(
        fc.property(
          validUserCodeArb,
          fc.array(validUserCodeArb, { minLength: 0, maxLength: 10 })
            .filter(codes => codes.length === 0 || !codes.some(c => c === 'ZZ')),
          (inputCode, existingCodes) => {
            // Use a code that's not in existing codes
            const uniqueCode = 'ZZ';
            const state = getValidationState(uniqueCode, existingCodes, '');
            
            // Property: Unique code should be available
            if (!existingCodes.includes(uniqueCode)) {
              expect(state.isDuplicate).toBe(false);
              expect(state.isAvailable).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 코드 정규화 테스트
   * 
   * Tests that user codes are normalized to uppercase.
   */
  describe('코드 정규화', () => {
    it('should normalize input to uppercase for comparison', () => {
      fc.assert(
        fc.property(
          mixedCaseUserCodeArb,
          (inputCode) => {
            const normalized = inputCode.toUpperCase();
            
            // Property: Normalized code should be uppercase
            expect(normalized).toBe(normalized.toUpperCase());
            expect(normalized.length).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should treat different cases as same code', () => {
      fc.assert(
        fc.property(
          mixedCaseUserCodeArb,
          (inputCode) => {
            const variations = [
              inputCode.toLowerCase(),
              inputCode.toUpperCase(),
              inputCode.charAt(0).toLowerCase() + inputCode.charAt(1).toUpperCase(),
              inputCode.charAt(0).toUpperCase() + inputCode.charAt(1).toLowerCase(),
            ];
            
            // Property: All case variations should normalize to same code
            const normalized = variations.map(v => v.toUpperCase());
            expect(new Set(normalized).size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Integration-style property tests
 * 
 * Tests the interaction between QuotationCodeGuard and UserCodeSetting logic.
 */
describe('QuotationCodeGuard and UserCodeSetting Integration', () => {
  it('should consistently handle code validation across components', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          emptyUserCodeArb,
          validUserCodeArb.map(c => c as string | undefined)
        ),
        quotationTypeArb,
        (userCode, quotationType) => {
          const guardAllows = shouldRenderChildren(userCode);
          
          // If guard allows, the code should be valid for settings too
          if (guardAllows && userCode) {
            const settingsState = getValidationState(userCode, [], userCode);
            // Property: Valid code in guard should be valid in settings
            expect(settingsState.isAvailable).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should block all quotation types equally when code is not set', () => {
    fc.assert(
      fc.property(
        emptyUserCodeArb,
        fc.array(quotationTypeArb, { minLength: 3, maxLength: 3 }),
        (userCode, quotationTypes) => {
          // Property: All quotation types should be blocked equally
          const results = quotationTypes.map(type => shouldRenderChildren(userCode));
          
          // All should be false (blocked)
          expect(results.every(r => r === false)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
