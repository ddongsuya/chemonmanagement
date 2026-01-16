/**
 * Property-Based Tests for Efficacy Quotation Type Filter
 * 
 * **Feature: efficacy-quotation, Property 11: Quotation Type Filter**
 * **Validates: Requirements 5.3**
 * 
 * Property: For any quotation list filtered by type='efficacy', 
 * all returned quotations SHALL have quotation_type='efficacy'.
 */

import * as fc from 'fast-check';
import {
  saveEfficacyQuotation,
  getAllEfficacyQuotations,
  getEfficacyQuotationsByStatus,
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

describe('Efficacy Quotation Type Filter - Property 11', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: efficacy-quotation, Property 11: Quotation Type Filter**
   * **Validates: Requirements 5.3**
   * 
   * Property: All efficacy quotations returned from getAllEfficacyQuotations 
   * SHALL have quotation_type='efficacy'
   */
  it('should return only efficacy type quotations from getAllEfficacyQuotations', () => {
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

          // Get all efficacy quotations
          const allEfficacy = getAllEfficacyQuotations();

          // Verify all returned quotations have quotation_type='efficacy'
          for (const quotation of allEfficacy) {
            expect(quotation.quotation_type).toBe('efficacy');
          }

          // Verify count matches
          expect(allEfficacy.length).toBe(quotations.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 11: Quotation Type Filter**
   * **Validates: Requirements 5.3**
   * 
   * Property: All efficacy quotations filtered by status 
   * SHALL have quotation_type='efficacy'
   */
  it('should return only efficacy type quotations when filtering by status', () => {
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
        statusArb,
        (quotations, filterStatus) => {
          // Clear localStorage at the start of each iteration
          localStorage.clear();
          
          if (quotations.length === 0) return true;

          // Save all quotations
          quotations.forEach(q => saveEfficacyQuotation(q));

          // Get efficacy quotations filtered by status
          const filteredQuotations = getEfficacyQuotationsByStatus(filterStatus);

          // Verify all returned quotations have quotation_type='efficacy'
          for (const quotation of filteredQuotations) {
            expect(quotation.quotation_type).toBe('efficacy');
          }

          // Verify all returned quotations have the correct status
          for (const quotation of filteredQuotations) {
            expect(quotation.status).toBe(filterStatus);
          }

          // Verify count matches expected
          const expectedCount = quotations.filter(q => q.status === filterStatus).length;
          expect(filteredQuotations.length).toBe(expectedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 11: Quotation Type Filter**
   * **Validates: Requirements 5.3**
   * 
   * Property: Efficacy quotations are stored separately from toxicity quotations
   * and filtering returns only the correct type
   */
  it('should maintain separation between efficacy and toxicity quotation storage', () => {
    fc.assert(
      fc.property(
        fc.array(quotationArb, { minLength: 1, maxLength: 5 }).map(quotations => {
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

          // Save efficacy quotations
          quotations.forEach(q => saveEfficacyQuotation(q));

          // Simulate toxicity quotations in separate storage
          const toxicityKey = 'chemon_quotations';
          const toxicityQuotations = quotations.map(q => ({
            ...q,
            id: `tox-${q.id}`,
            quotation_number: q.quotation_number.replace('EQ-', 'QT-'),
            quotation_type: 'toxicity',
          }));
          localStorage.setItem(toxicityKey, JSON.stringify(toxicityQuotations));

          // Get all efficacy quotations
          const allEfficacy = getAllEfficacyQuotations();

          // Verify only efficacy quotations are returned
          expect(allEfficacy.length).toBe(quotations.length);
          for (const quotation of allEfficacy) {
            expect(quotation.quotation_type).toBe('efficacy');
            expect(quotation.quotation_number).toMatch(/^EQ-/);
          }

          // Verify toxicity quotations are not mixed in
          const toxicityIds = toxicityQuotations.map(q => q.id);
          for (const quotation of allEfficacy) {
            expect(toxicityIds).not.toContain(quotation.id);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
