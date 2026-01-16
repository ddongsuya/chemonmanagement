/**
 * Property-Based Tests for Efficacy Item Calculations
 * 
 * **Feature: efficacy-quotation, Property 1: Item Amount Calculation Invariant**
 * **Validates: Requirements 2.2, 4.1**
 * 
 * Property: For any selected item with unit_price, quantity, and multiplier, 
 * the calculated amount SHALL equal unit_price × quantity × multiplier exactly.
 */

import * as fc from 'fast-check';
import {
  calculateItemAmount,
  calculateSubtotalByCategory,
  calculateVAT,
  calculateGrandTotal,
} from '@/stores/efficacyQuotationStore';
import type { SelectedEfficacyItem } from '@/types/efficacy';

describe('Efficacy Item Amount Calculation - Property 1', () => {
  /**
   * **Feature: efficacy-quotation, Property 1: Item Amount Calculation Invariant**
   * **Validates: Requirements 2.2, 4.1**
   */
  it('should calculate item amount as unit_price × quantity × multiplier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000000 }), // unit_price (1 to 100M won)
        fc.integer({ min: 1, max: 10000 }),     // quantity
        fc.integer({ min: 1, max: 1000 }),      // multiplier
        (unitPrice, quantity, multiplier) => {
          const amount = calculateItemAmount(unitPrice, quantity, multiplier);
          const expected = unitPrice * quantity * multiplier;
          
          expect(amount).toBe(expected);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 1: Item Amount Calculation Invariant**
   * **Validates: Requirements 2.2, 4.1**
   * 
   * Property: Amount calculation is commutative in terms of quantity and multiplier
   */
  it('should produce same amount regardless of quantity/multiplier order', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 1000 }),
        (unitPrice, a, b) => {
          // quantity=a, multiplier=b should equal quantity=b, multiplier=a
          const amount1 = calculateItemAmount(unitPrice, a, b);
          const amount2 = calculateItemAmount(unitPrice, b, a);
          
          expect(amount1).toBe(amount2);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 1: Item Amount Calculation Invariant**
   * **Validates: Requirements 2.2, 4.1**
   * 
   * Property: Amount with quantity=1 and multiplier=1 equals unit_price
   */
  it('should return unit_price when quantity and multiplier are both 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000000 }),
        (unitPrice) => {
          const amount = calculateItemAmount(unitPrice, 1, 1);
          expect(amount).toBe(unitPrice);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 1: Item Amount Calculation Invariant**
   * **Validates: Requirements 2.2, 4.1**
   * 
   * Property: Doubling quantity doubles the amount
   */
  it('should double amount when quantity is doubled', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50000000 }),  // smaller to avoid overflow
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 500 }),
        (unitPrice, quantity, multiplier) => {
          const amount1 = calculateItemAmount(unitPrice, quantity, multiplier);
          const amount2 = calculateItemAmount(unitPrice, quantity * 2, multiplier);
          
          expect(amount2).toBe(amount1 * 2);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Efficacy Category Subtotal Consistency - Property 2', () => {
  // Arbitrary for generating selected items
  const selectedItemArb: fc.Arbitrary<SelectedEfficacyItem> = fc.record({
    id: fc.uuid(),
    item_id: fc.stringMatching(/^[A-Z]{3}-\d{3}$/),
    item_name: fc.string({ minLength: 1, maxLength: 50 }),
    category: fc.constantFrom('동물비', '사육비', '측정', '조직병리', '유발', '투여', '영상', '분자분석'),
    unit_price: fc.integer({ min: 1000, max: 10000000 }),
    unit: fc.constantFrom('/head', '/day', '/회', '/건', '/ea'),
    quantity: fc.integer({ min: 1, max: 1000 }),
    multiplier: fc.integer({ min: 1, max: 100 }),
    amount: fc.integer({ min: 1000, max: 100000000 }),
    is_default: fc.boolean(),
    usage_note: fc.string({ maxLength: 100 }),
  });

  /**
   * **Feature: efficacy-quotation, Property 2: Category Subtotal Consistency**
   * **Validates: Requirements 4.2**
   */
  it('should have category subtotals sum equal to overall subtotal', () => {
    fc.assert(
      fc.property(
        fc.array(selectedItemArb, { minLength: 1, maxLength: 30 }),
        (items) => {
          const subtotalByCategory = calculateSubtotalByCategory(items);
          
          // Sum of all category subtotals
          const categorySum = Object.values(subtotalByCategory).reduce(
            (sum, val) => sum + val,
            0
          );
          
          // Direct sum of all item amounts
          const directSum = items.reduce((sum, item) => sum + item.amount, 0);
          
          expect(categorySum).toBe(directSum);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 2: Category Subtotal Consistency**
   * **Validates: Requirements 4.2**
   * 
   * Property: Each category subtotal equals sum of items in that category
   */
  it('should calculate correct subtotal for each category', () => {
    fc.assert(
      fc.property(
        fc.array(selectedItemArb, { minLength: 1, maxLength: 30 }),
        (items) => {
          const subtotalByCategory = calculateSubtotalByCategory(items);
          
          // Verify each category
          for (const [category, subtotal] of Object.entries(subtotalByCategory)) {
            const categoryItems = items.filter((item) => item.category === category);
            const expectedSubtotal = categoryItems.reduce(
              (sum, item) => sum + item.amount,
              0
            );
            
            expect(subtotal).toBe(expectedSubtotal);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 2: Category Subtotal Consistency**
   * **Validates: Requirements 4.2**
   * 
   * Property: Empty items array produces empty category subtotals
   */
  it('should return empty object for empty items array', () => {
    const subtotalByCategory = calculateSubtotalByCategory([]);
    expect(Object.keys(subtotalByCategory).length).toBe(0);
  });
});

describe('Efficacy VAT and Grand Total Calculation - Property 3', () => {
  /**
   * **Feature: efficacy-quotation, Property 3: VAT and Grand Total Calculation**
   * **Validates: Requirements 4.3**
   */
  it('should calculate VAT as subtotal × 0.1 (rounded down)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000000 }), // subtotal up to 1B won
        (subtotal) => {
          const vat = calculateVAT(subtotal);
          const expected = Math.floor(subtotal * 0.1);
          
          expect(vat).toBe(expected);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 3: VAT and Grand Total Calculation**
   * **Validates: Requirements 4.3**
   */
  it('should calculate grand total as subtotal + VAT', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000000 }),
        (subtotal) => {
          const vat = calculateVAT(subtotal);
          const grandTotal = calculateGrandTotal(subtotal, vat);
          
          expect(grandTotal).toBe(subtotal + vat);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 3: VAT and Grand Total Calculation**
   * **Validates: Requirements 4.3**
   * 
   * Property: VAT is always less than or equal to 10% of subtotal
   */
  it('should have VAT less than or equal to 10% of subtotal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000000 }),
        (subtotal) => {
          const vat = calculateVAT(subtotal);
          
          // Due to floor rounding, VAT should be <= 10%
          expect(vat).toBeLessThanOrEqual(subtotal * 0.1);
          // But should be close (within 1 won due to rounding)
          expect(vat).toBeGreaterThanOrEqual(subtotal * 0.1 - 1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 3: VAT and Grand Total Calculation**
   * **Validates: Requirements 4.3**
   * 
   * Property: Grand total is always 110% of subtotal (approximately, due to rounding)
   */
  it('should have grand total approximately 110% of subtotal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000000 }),
        (subtotal) => {
          const vat = calculateVAT(subtotal);
          const grandTotal = calculateGrandTotal(subtotal, vat);
          
          // Grand total should be between subtotal and subtotal * 1.1
          expect(grandTotal).toBeGreaterThanOrEqual(subtotal);
          expect(grandTotal).toBeLessThanOrEqual(Math.ceil(subtotal * 1.1));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 3: VAT and Grand Total Calculation**
   * **Validates: Requirements 4.3**
   * 
   * Property: Zero subtotal produces zero VAT and zero grand total
   */
  it('should return zero VAT and grand total for zero subtotal', () => {
    const vat = calculateVAT(0);
    const grandTotal = calculateGrandTotal(0, vat);
    
    expect(vat).toBe(0);
    expect(grandTotal).toBe(0);
  });
});
