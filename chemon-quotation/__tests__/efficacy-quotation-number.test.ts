/**
 * Property-Based Tests for Efficacy Quotation Number Format
 * 
 * **Feature: efficacy-quotation, Property 9: Quotation Number Format**
 * **Validates: Requirements 5.1**
 * 
 * Property: For any saved efficacy quotation, the quotation_number SHALL match 
 * the pattern "EQ-YYYY-NNNN" where YYYY is a 4-digit year and NNNN is a 4-digit sequence.
 */

import * as fc from 'fast-check';
import {
  generateEfficacyQuotationNumber,
  isValidEfficacyQuotationNumber,
} from '@/lib/efficacy-storage';

describe('Efficacy Quotation Number Format - Property 9', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: efficacy-quotation, Property 9: Quotation Number Format**
   * **Validates: Requirements 5.1**
   */
  it('should generate quotation numbers matching EQ-YYYY-NNNN pattern', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Generate multiple quotation numbers
        (count) => {
          localStorage.clear();
          
          for (let i = 0; i < count; i++) {
            const quotationNumber = generateEfficacyQuotationNumber();
            
            // Verify the format matches EQ-YYYY-NNNN
            expect(isValidEfficacyQuotationNumber(quotationNumber)).toBe(true);
            
            // Additional structural validation
            const pattern = /^EQ-(\d{4})-(\d{4})$/;
            const match = quotationNumber.match(pattern);
            
            expect(match).not.toBeNull();
            
            if (match) {
              const year = parseInt(match[1], 10);
              const sequence = parseInt(match[2], 10);
              
              // Year should be a valid 4-digit year (reasonable range)
              expect(year).toBeGreaterThanOrEqual(2000);
              expect(year).toBeLessThanOrEqual(2100);
              
              // Sequence should be the expected value (i + 1)
              expect(sequence).toBe(i + 1);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 9: Quotation Number Format**
   * **Validates: Requirements 5.1**
   * 
   * Property: The validation function correctly identifies valid and invalid formats
   */
  it('should correctly validate quotation number format', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2100 }), // Valid year range
        fc.integer({ min: 1, max: 9999 }),    // Valid sequence range
        (year, sequence) => {
          const seqStr = sequence.toString().padStart(4, '0');
          const validNumber = `EQ-${year}-${seqStr}`;
          
          // Valid format should pass validation
          expect(isValidEfficacyQuotationNumber(validNumber)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 9: Quotation Number Format**
   * **Validates: Requirements 5.1**
   * 
   * Property: Invalid formats are correctly rejected
   */
  it('should reject invalid quotation number formats', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Wrong prefix
          fc.tuple(
            fc.constantFrom('QT', 'AB', 'XX', 'TQ', 'AA'),
            fc.integer({ min: 2000, max: 2100 }),
            fc.integer({ min: 1, max: 9999 })
          ).map(([prefix, year, seq]) => `${prefix}-${year}-${seq.toString().padStart(4, '0')}`),
          
          // Wrong year format (3 digits)
          fc.integer({ min: 100, max: 999 }).map(year => `EQ-${year}-0001`),
          
          // Wrong sequence format (3 digits)
          fc.integer({ min: 1, max: 999 }).map(seq => `EQ-2024-${seq.toString().padStart(3, '0')}`),
          
          // Missing parts
          fc.constant('EQ-2024'),
          fc.constant('EQ--0001'),
          fc.constant('2024-0001'),
          
          // Extra characters
          fc.integer({ min: 2000, max: 2100 }).map(year => `EQ-${year}-0001-extra`)
        ),
        (invalidNumber) => {
          expect(isValidEfficacyQuotationNumber(invalidNumber)).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 9: Quotation Number Format**
   * **Validates: Requirements 5.1**
   * 
   * Property: Generated quotation numbers use current year
   */
  it('should use current year in generated quotation numbers', () => {
    localStorage.clear();
    const currentYear = new Date().getFullYear();
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (count) => {
          localStorage.clear();
          
          for (let i = 0; i < count; i++) {
            const quotationNumber = generateEfficacyQuotationNumber();
            const pattern = /^EQ-(\d{4})-\d{4}$/;
            const match = quotationNumber.match(pattern);
            
            expect(match).not.toBeNull();
            if (match) {
              const year = parseInt(match[1], 10);
              expect(year).toBe(currentYear);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 9: Quotation Number Format**
   * **Validates: Requirements 5.1**
   * 
   * Property: Sequence numbers increment correctly
   */
  it('should increment sequence numbers correctly', () => {
    localStorage.clear();
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (count) => {
          localStorage.clear();
          const generatedNumbers: string[] = [];
          
          for (let i = 0; i < count; i++) {
            generatedNumbers.push(generateEfficacyQuotationNumber());
          }
          
          // All numbers should be unique
          const uniqueNumbers = new Set(generatedNumbers);
          expect(uniqueNumbers.size).toBe(count);
          
          // Sequences should be consecutive
          for (let i = 0; i < generatedNumbers.length; i++) {
            const match = generatedNumbers[i].match(/^EQ-\d{4}-(\d{4})$/);
            expect(match).not.toBeNull();
            if (match) {
              expect(parseInt(match[1], 10)).toBe(i + 1);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
