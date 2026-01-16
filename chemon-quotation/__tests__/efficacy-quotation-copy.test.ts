/**
 * Property-Based Tests for Efficacy Quotation Copy Operation
 * 
 * **Feature: efficacy-quotation, Property 12: Copy Preserves Items But Changes Identity**
 * **Validates: Requirements 9.1, 9.2**
 * 
 * Property: For any quotation copy operation, the new quotation SHALL have 
 * identical items (same item_id, quantity, multiplier) but different id and quotation_number.
 */

import * as fc from 'fast-check';
import {
  saveEfficacyQuotation,
  copyEfficacyQuotation,
  getEfficacyQuotationById,
  getAllEfficacyQuotations,
} from '@/lib/efficacy-storage';
import {
  SavedEfficacyQuotation,
  SelectedEfficacyItem,
  EfficacyQuotationStatus,
} from '@/types/efficacy';

// Arbitrary generators for efficacy quotation data
const statusArb = fc.constantFrom<EfficacyQuotationStatus>('draft', 'sent', 'accepted', 'rejected');

const selectedItemArb: fc.Arbitrary<SelectedEfficacyItem> = fc.record({
  id: fc.uuid(),
  item_id: fc.stringMatching(/^[A-Z]{3}-\d{3}$/),
  item_name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('동물비', '사육비', '측정', '조직병리', '기타'),
  unit_price: fc.integer({ min: 1000, max: 10000000 }),
  unit: fc.constantFrom('/head', '/day', '/회', '/건', '/ea'),
  quantity: fc.integer({ min: 1, max: 1000 }),
  multiplier: fc.integer({ min: 1, max: 100 }),
  amount: fc.integer({ min: 1000, max: 100000000 }),
  is_default: fc.boolean(),
  usage_note: fc.string({ maxLength: 100 }),
});

// Helper to generate ISO date strings safely
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

const quotationArb: fc.Arbitrary<SavedEfficacyQuotation> = fc.record({
  id: fc.uuid(),
  quotation_number: fc.stringMatching(/^EQ-\d{4}-\d{4}$/),
  quotation_type: fc.constant('efficacy' as const),
  customer_id: fc.uuid(),
  customer_name: fc.string({ minLength: 1, maxLength: 100 }),
  project_name: fc.string({ minLength: 1, maxLength: 200 }),
  model_id: fc.stringMatching(/^EFF-\d{3}$/),
  model_name: fc.string({ minLength: 1, maxLength: 50 }),
  model_category: fc.constantFrom('피부', '항암', '대사', '신경', '근골격'),
  indication: fc.string({ minLength: 1, maxLength: 200 }),
  items: fc.array(selectedItemArb, { minLength: 1, maxLength: 20 }),
  subtotal_by_category: fc.dictionary(
    fc.constantFrom('동물비', '사육비', '측정', '조직병리', '기타'),
    fc.integer({ min: 0, max: 100000000 })
  ),
  subtotal: fc.integer({ min: 0, max: 100000000 }),
  vat: fc.integer({ min: 0, max: 10000000 }),
  grand_total: fc.integer({ min: 0, max: 110000000 }),
  valid_days: fc.integer({ min: 7, max: 90 }),
  valid_until: isoDateArb,
  notes: fc.string({ maxLength: 500 }),
  status: statusArb,
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

describe('Efficacy Quotation Copy Operation - Property 12', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: efficacy-quotation, Property 12: Copy Preserves Items But Changes Identity**
   * **Validates: Requirements 9.1, 9.2**
   * 
   * Property: Copied quotation SHALL have different id and quotation_number
   */
  it('should generate new id and quotation_number when copying', () => {
    fc.assert(
      fc.property(quotationArb, (quotation) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Save the original quotation
        saveEfficacyQuotation(quotation);

        // Copy the quotation
        const copied = copyEfficacyQuotation(quotation.id);

        // Verify copy was successful
        expect(copied).not.toBeNull();
        if (!copied) return false;

        // Verify id is different
        expect(copied.id).not.toBe(quotation.id);

        // Verify quotation_number is different
        expect(copied.quotation_number).not.toBe(quotation.quotation_number);

        // Verify quotation_number follows the correct format
        expect(copied.quotation_number).toMatch(/^EQ-\d{4}-\d{4}$/);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 12: Copy Preserves Items But Changes Identity**
   * **Validates: Requirements 9.1, 9.2**
   * 
   * Property: Copied quotation SHALL have identical items (same item_id, quantity, multiplier)
   */
  it('should preserve all items with same item_id, quantity, and multiplier', () => {
    fc.assert(
      fc.property(quotationArb, (quotation) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Save the original quotation
        saveEfficacyQuotation(quotation);

        // Copy the quotation
        const copied = copyEfficacyQuotation(quotation.id);

        // Verify copy was successful
        expect(copied).not.toBeNull();
        if (!copied) return false;

        // Verify items count matches
        expect(copied.items.length).toBe(quotation.items.length);

        // Verify each item's core properties are preserved
        for (let i = 0; i < quotation.items.length; i++) {
          const originalItem = quotation.items[i];
          const copiedItem = copied.items[i];

          // item_id should be identical
          expect(copiedItem.item_id).toBe(originalItem.item_id);

          // quantity should be identical
          expect(copiedItem.quantity).toBe(originalItem.quantity);

          // multiplier should be identical
          expect(copiedItem.multiplier).toBe(originalItem.multiplier);

          // Other item properties should also be preserved
          expect(copiedItem.item_name).toBe(originalItem.item_name);
          expect(copiedItem.category).toBe(originalItem.category);
          expect(copiedItem.unit_price).toBe(originalItem.unit_price);
          expect(copiedItem.unit).toBe(originalItem.unit);
          expect(copiedItem.amount).toBe(originalItem.amount);
          expect(copiedItem.is_default).toBe(originalItem.is_default);
          expect(copiedItem.usage_note).toBe(originalItem.usage_note);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 12: Copy Preserves Items But Changes Identity**
   * **Validates: Requirements 9.1, 9.2**
   * 
   * Property: Copied quotation SHALL preserve model and customer information
   */
  it('should preserve model and customer information', () => {
    fc.assert(
      fc.property(quotationArb, (quotation) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Save the original quotation
        saveEfficacyQuotation(quotation);

        // Copy the quotation
        const copied = copyEfficacyQuotation(quotation.id);

        // Verify copy was successful
        expect(copied).not.toBeNull();
        if (!copied) return false;

        // Verify customer info is preserved
        expect(copied.customer_id).toBe(quotation.customer_id);
        expect(copied.customer_name).toBe(quotation.customer_name);
        expect(copied.project_name).toBe(quotation.project_name);

        // Verify model info is preserved
        expect(copied.model_id).toBe(quotation.model_id);
        expect(copied.model_name).toBe(quotation.model_name);
        expect(copied.model_category).toBe(quotation.model_category);
        expect(copied.indication).toBe(quotation.indication);

        // Verify calculations are preserved
        expect(copied.subtotal).toBe(quotation.subtotal);
        expect(copied.vat).toBe(quotation.vat);
        expect(copied.grand_total).toBe(quotation.grand_total);
        expect(copied.subtotal_by_category).toEqual(quotation.subtotal_by_category);

        // Verify other metadata is preserved
        expect(copied.valid_days).toBe(quotation.valid_days);
        expect(copied.notes).toBe(quotation.notes);
        expect(copied.quotation_type).toBe('efficacy');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 12: Copy Preserves Items But Changes Identity**
   * **Validates: Requirements 9.1, 9.2**
   * 
   * Property: Copied quotation SHALL have status reset to 'draft'
   */
  it('should reset status to draft when copying', () => {
    fc.assert(
      fc.property(quotationArb, (quotation) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Save the original quotation
        saveEfficacyQuotation(quotation);

        // Copy the quotation
        const copied = copyEfficacyQuotation(quotation.id);

        // Verify copy was successful
        expect(copied).not.toBeNull();
        if (!copied) return false;

        // Verify status is reset to 'draft'
        expect(copied.status).toBe('draft');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 12: Copy Preserves Items But Changes Identity**
   * **Validates: Requirements 9.1, 9.2**
   * 
   * Property: Both original and copied quotations should exist independently
   */
  it('should create independent copy that does not affect original', () => {
    fc.assert(
      fc.property(quotationArb, (quotation) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Save the original quotation
        saveEfficacyQuotation(quotation);

        // Copy the quotation
        const copied = copyEfficacyQuotation(quotation.id);

        // Verify copy was successful
        expect(copied).not.toBeNull();
        if (!copied) return false;

        // Verify both quotations exist
        const allQuotations = getAllEfficacyQuotations();
        expect(allQuotations.length).toBe(2);

        // Verify original can still be retrieved
        const originalLoaded = getEfficacyQuotationById(quotation.id);
        expect(originalLoaded).not.toBeNull();
        expect(originalLoaded?.quotation_number).toBe(quotation.quotation_number);

        // Verify copy can be retrieved
        const copiedLoaded = getEfficacyQuotationById(copied.id);
        expect(copiedLoaded).not.toBeNull();
        expect(copiedLoaded?.quotation_number).toBe(copied.quotation_number);

        // Verify they are different entities
        expect(originalLoaded?.id).not.toBe(copiedLoaded?.id);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 12: Copy Preserves Items But Changes Identity**
   * **Validates: Requirements 9.1, 9.2**
   * 
   * Property: Copying non-existent quotation should return null
   */
  it('should return null when copying non-existent quotation', () => {
    fc.assert(
      fc.property(fc.uuid(), (nonExistentId) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Try to copy a non-existent quotation
        const copied = copyEfficacyQuotation(nonExistentId);

        // Verify copy returns null
        expect(copied).toBeNull();

        return true;
      }),
      { numRuns: 50 }
    );
  });
});
