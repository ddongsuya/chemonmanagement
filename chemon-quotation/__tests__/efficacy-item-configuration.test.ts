/**
 * Property-Based Tests for Efficacy Item Configuration
 * 
 * Tests for item removal, optional items filter, and search filter
 */

import * as fc from 'fast-check';
import type { SelectedEfficacyItem, ModelItem } from '@/types/efficacy';
import {
  getOptionalItemsForModel,
  filterItemsBySearch,
  calculateSubtotal,
  removeItemFromList,
} from '@/lib/efficacy-item-utils';

// ============================================
// Arbitraries
// ============================================

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

const modelItemArb: fc.Arbitrary<ModelItem> = fc.record({
  model_id: fc.stringMatching(/^EFF-\d{3}$/),
  model_name: fc.string({ minLength: 1, maxLength: 30 }),
  item_id: fc.stringMatching(/^[A-Z]{3}-\d{3}$/),
  item_name: fc.string({ minLength: 1, maxLength: 50 }),
  is_default: fc.boolean(),
  typical_qty: fc.integer({ min: 1, max: 1000 }),
  typical_mult: fc.integer({ min: 1, max: 100 }),
  usage_note: fc.string({ maxLength: 100 }),
});

// ============================================
// Property 6: Item Removal Decreases Total
// ============================================

describe('Efficacy Item Removal - Property 6', () => {
  /**
   * **Feature: efficacy-quotation, Property 6: Item Removal Decreases Total**
   * **Validates: Requirements 2.3**
   * 
   * Property: For any item removal, the new subtotal SHALL equal 
   * the previous subtotal minus the removed item's amount.
   */
  it('should decrease subtotal by removed item amount', () => {
    fc.assert(
      fc.property(
        fc.array(selectedItemArb, { minLength: 2, maxLength: 20 }),
        (items) => {
          // Pick a random item to remove
          const indexToRemove = Math.floor(Math.random() * items.length);
          const itemToRemove = items[indexToRemove];
          
          const originalSubtotal = calculateSubtotal(items);
          const newItems = removeItemFromList(items, itemToRemove.id);
          const newSubtotal = calculateSubtotal(newItems);
          
          // New subtotal should equal original minus removed item's amount
          expect(newSubtotal).toBe(originalSubtotal - itemToRemove.amount);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 6: Item Removal Decreases Total**
   * **Validates: Requirements 2.3**
   * 
   * Property: Removing an item reduces the item count by exactly 1
   */
  it('should reduce item count by 1 when removing an item', () => {
    fc.assert(
      fc.property(
        fc.array(selectedItemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const indexToRemove = Math.floor(Math.random() * items.length);
          const itemToRemove = items[indexToRemove];
          
          const originalCount = items.length;
          const newItems = removeItemFromList(items, itemToRemove.id);
          
          expect(newItems.length).toBe(originalCount - 1);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 6: Item Removal Decreases Total**
   * **Validates: Requirements 2.3**
   * 
   * Property: Removed item should not exist in the new list
   */
  it('should not contain removed item in new list', () => {
    fc.assert(
      fc.property(
        fc.array(selectedItemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const indexToRemove = Math.floor(Math.random() * items.length);
          const itemToRemove = items[indexToRemove];
          
          const newItems = removeItemFromList(items, itemToRemove.id);
          const stillExists = newItems.some((item) => item.id === itemToRemove.id);
          
          expect(stillExists).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Property 7: Optional Items Filter by Model
// ============================================

describe('Efficacy Optional Items Filter - Property 7', () => {
  /**
   * **Feature: efficacy-quotation, Property 7: Optional Items Filter by Model**
   * **Validates: Requirements 3.1**
   * 
   * Property: For any model, the optional items list SHALL contain only items 
   * where model_id matches and is_default=false.
   */
  it('should return only non-default items for the specified model', () => {
    // Test with actual master data
    const testModelIds = ['EFF-001', 'EFF-002', 'EFF-003'];
    
    testModelIds.forEach((modelId) => {
      const optionalItems = getOptionalItemsForModel(modelId);
      
      // All returned items should have matching model_id
      optionalItems.forEach((item) => {
        expect(item.model_id).toBe(modelId);
      });
      
      // All returned items should have is_default = false
      optionalItems.forEach((item) => {
        expect(item.is_default).toBe(false);
      });
    });
  });

  /**
   * **Feature: efficacy-quotation, Property 7: Optional Items Filter by Model**
   * **Validates: Requirements 3.1**
   * 
   * Property: Optional items should not include any default items
   */
  it('should not include any default items', () => {
    const testModelIds = ['EFF-001', 'EFF-002', 'EFF-003'];
    
    testModelIds.forEach((modelId) => {
      const optionalItems = getOptionalItemsForModel(modelId);
      const hasDefaultItem = optionalItems.some((item) => item.is_default === true);
      
      expect(hasDefaultItem).toBe(false);
    });
  });
});

// ============================================
// Property 8: Search Filter Returns Matching Items
// ============================================

describe('Efficacy Search Filter - Property 8', () => {
  /**
   * **Feature: efficacy-quotation, Property 8: Search Filter Returns Matching Items**
   * **Validates: Requirements 3.3**
   * 
   * Property: For any search query string, all returned items SHALL contain 
   * the query string in their item_name (case-insensitive).
   */
  it('should return only items containing search query (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(modelItemArb, { minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (items, query) => {
          const filteredItems = filterItemsBySearch(items, query);
          const lowerQuery = query.toLowerCase();
          
          // All returned items should contain the query in item_name
          filteredItems.forEach((item) => {
            expect(item.item_name.toLowerCase()).toContain(lowerQuery);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 8: Search Filter Returns Matching Items**
   * **Validates: Requirements 3.3**
   * 
   * Property: Empty search query returns all items
   */
  it('should return all items when search query is empty', () => {
    fc.assert(
      fc.property(
        fc.array(modelItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const filteredItems = filterItemsBySearch(items, '');
          expect(filteredItems.length).toBe(items.length);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 8: Search Filter Returns Matching Items**
   * **Validates: Requirements 3.3**
   * 
   * Property: Whitespace-only search query returns all items
   */
  it('should return all items when search query is whitespace only', () => {
    fc.assert(
      fc.property(
        fc.array(modelItemArb, { minLength: 0, maxLength: 30 }),
        fc.constantFrom('   ', '\t', '\n', '  \t  ', '\n\n'),
        (items, whitespace) => {
          const filteredItems = filterItemsBySearch(items, whitespace);
          expect(filteredItems.length).toBe(items.length);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 8: Search Filter Returns Matching Items**
   * **Validates: Requirements 3.3**
   * 
   * Property: Search is case-insensitive
   */
  it('should be case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(modelItemArb, { minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (items, query) => {
          const lowerResult = filterItemsBySearch(items, query.toLowerCase());
          const upperResult = filterItemsBySearch(items, query.toUpperCase());
          const mixedResult = filterItemsBySearch(items, query);
          
          // All variations should return the same number of items
          expect(lowerResult.length).toBe(upperResult.length);
          expect(lowerResult.length).toBe(mixedResult.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 8: Search Filter Returns Matching Items**
   * **Validates: Requirements 3.3**
   * 
   * Property: Filtered result is a subset of original items
   */
  it('should return a subset of original items', () => {
    fc.assert(
      fc.property(
        fc.array(modelItemArb, { minLength: 0, maxLength: 30 }),
        fc.string({ minLength: 0, maxLength: 10 }),
        (items, query) => {
          const filteredItems = filterItemsBySearch(items, query);
          
          // Filtered count should be <= original count
          expect(filteredItems.length).toBeLessThanOrEqual(items.length);
          
          // All filtered items should exist in original
          filteredItems.forEach((filtered) => {
            const exists = items.some(
              (item) => item.item_id === filtered.item_id && item.item_name === filtered.item_name
            );
            expect(exists).toBe(true);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
