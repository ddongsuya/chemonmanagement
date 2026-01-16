/**
 * Property-Based Tests for Efficacy Quotation Save/Load Round Trip
 * 
 * **Feature: efficacy-quotation, Property 10: Quotation Save/Load Round Trip**
 * **Validates: Requirements 5.2, 5.4**
 * 
 * Property: For any saved quotation, loading it back SHALL restore all fields 
 * (model, items, quantities, multipliers, customer info, calculations) to their original values.
 */

import * as fc from 'fast-check';
import {
  saveEfficacyQuotation,
  getEfficacyQuotationById,
  getAllEfficacyQuotations,
  deleteEfficacyQuotation,
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

describe('Efficacy Quotation Save/Load Round Trip - Property 10', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: efficacy-quotation, Property 10: Quotation Save/Load Round Trip**
   * **Validates: Requirements 5.2, 5.4**
   */
  it('should restore all fields when loading a saved quotation', () => {
    fc.assert(
      fc.property(quotationArb, (quotation) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Save the quotation
        saveEfficacyQuotation(quotation);

        // Load it back by ID
        const loaded = getEfficacyQuotationById(quotation.id);

        // Verify the quotation was found
        expect(loaded).not.toBeNull();
        if (!loaded) return false;

        // Verify all core fields match (excluding updated_at which may change on save)
        expect(loaded.id).toBe(quotation.id);
        expect(loaded.quotation_number).toBe(quotation.quotation_number);
        expect(loaded.quotation_type).toBe(quotation.quotation_type);
        
        // Customer info
        expect(loaded.customer_id).toBe(quotation.customer_id);
        expect(loaded.customer_name).toBe(quotation.customer_name);
        
        // Project info
        expect(loaded.project_name).toBe(quotation.project_name);
        
        // Model info
        expect(loaded.model_id).toBe(quotation.model_id);
        expect(loaded.model_name).toBe(quotation.model_name);
        expect(loaded.model_category).toBe(quotation.model_category);
        expect(loaded.indication).toBe(quotation.indication);
        
        // Items - verify count and each item's properties
        expect(loaded.items.length).toBe(quotation.items.length);
        for (let i = 0; i < quotation.items.length; i++) {
          expect(loaded.items[i].id).toBe(quotation.items[i].id);
          expect(loaded.items[i].item_id).toBe(quotation.items[i].item_id);
          expect(loaded.items[i].item_name).toBe(quotation.items[i].item_name);
          expect(loaded.items[i].category).toBe(quotation.items[i].category);
          expect(loaded.items[i].unit_price).toBe(quotation.items[i].unit_price);
          expect(loaded.items[i].unit).toBe(quotation.items[i].unit);
          expect(loaded.items[i].quantity).toBe(quotation.items[i].quantity);
          expect(loaded.items[i].multiplier).toBe(quotation.items[i].multiplier);
          expect(loaded.items[i].amount).toBe(quotation.items[i].amount);
          expect(loaded.items[i].is_default).toBe(quotation.items[i].is_default);
          expect(loaded.items[i].usage_note).toBe(quotation.items[i].usage_note);
        }
        
        // Calculations
        expect(loaded.subtotal_by_category).toEqual(quotation.subtotal_by_category);
        expect(loaded.subtotal).toBe(quotation.subtotal);
        expect(loaded.vat).toBe(quotation.vat);
        expect(loaded.grand_total).toBe(quotation.grand_total);
        
        // Metadata
        expect(loaded.valid_days).toBe(quotation.valid_days);
        expect(loaded.valid_until).toBe(quotation.valid_until);
        expect(loaded.notes).toBe(quotation.notes);
        expect(loaded.status).toBe(quotation.status);
        expect(loaded.created_at).toBe(quotation.created_at);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 10: Quotation Save/Load Round Trip**
   * **Validates: Requirements 5.2, 5.4**
   * 
   * Property: Multiple quotations can be saved and loaded independently
   */
  it('should preserve all quotations when saving multiple', () => {
    fc.assert(
      fc.property(
        fc.array(quotationArb, { minLength: 1, maxLength: 10 }).map(quotations => {
          // Ensure unique IDs
          const seen = new Set<string>();
          return quotations.filter(q => {
            if (seen.has(q.id)) return false;
            seen.add(q.id);
            return true;
          });
        }),
        (quotations) => {
          // Clear localStorage at the start of each iteration
          localStorage.clear();
          
          if (quotations.length === 0) return true;

          // Save all quotations
          quotations.forEach(q => saveEfficacyQuotation(q));

          // Load all quotations
          const allLoaded = getAllEfficacyQuotations();

          // Verify count matches
          expect(allLoaded.length).toBe(quotations.length);

          // Verify each quotation can be found and matches
          for (const original of quotations) {
            const loaded = getEfficacyQuotationById(original.id);
            expect(loaded).not.toBeNull();
            if (loaded) {
              expect(loaded.id).toBe(original.id);
              expect(loaded.quotation_number).toBe(original.quotation_number);
              expect(loaded.customer_name).toBe(original.customer_name);
              expect(loaded.model_id).toBe(original.model_id);
              expect(loaded.items.length).toBe(original.items.length);
              expect(loaded.grand_total).toBe(original.grand_total);
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 10: Quotation Save/Load Round Trip**
   * **Validates: Requirements 5.2, 5.4**
   * 
   * Property: Updating a quotation preserves all fields except updated_at
   */
  it('should preserve fields when updating an existing quotation', () => {
    fc.assert(
      fc.property(
        quotationArb,
        fc.string({ minLength: 1, maxLength: 200 }),
        (quotation, newProjectName) => {
          // Clear localStorage at the start of each iteration
          localStorage.clear();
          
          // Save original
          saveEfficacyQuotation(quotation);

          // Modify and save again
          const modified = {
            ...quotation,
            project_name: newProjectName,
          };
          saveEfficacyQuotation(modified);

          // Load and verify
          const loaded = getEfficacyQuotationById(quotation.id);
          expect(loaded).not.toBeNull();
          if (!loaded) return false;

          // Project name should be updated
          expect(loaded.project_name).toBe(newProjectName);

          // Other fields should remain unchanged
          expect(loaded.id).toBe(quotation.id);
          expect(loaded.quotation_number).toBe(quotation.quotation_number);
          expect(loaded.customer_id).toBe(quotation.customer_id);
          expect(loaded.model_id).toBe(quotation.model_id);
          expect(loaded.items.length).toBe(quotation.items.length);

          // Should only have one quotation (not duplicated)
          const all = getAllEfficacyQuotations();
          expect(all.length).toBe(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 10: Quotation Save/Load Round Trip**
   * **Validates: Requirements 5.2, 5.4**
   * 
   * Property: Deleted quotations cannot be loaded
   */
  it('should not find deleted quotations', () => {
    fc.assert(
      fc.property(quotationArb, (quotation) => {
        // Clear localStorage at the start of each iteration
        localStorage.clear();
        
        // Save the quotation
        saveEfficacyQuotation(quotation);

        // Verify it exists
        expect(getEfficacyQuotationById(quotation.id)).not.toBeNull();

        // Delete it
        const deleted = deleteEfficacyQuotation(quotation.id);
        expect(deleted).toBe(true);

        // Verify it no longer exists
        expect(getEfficacyQuotationById(quotation.id)).toBeNull();

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
