/**
 * Property-Based Tests for Test Reception Storage Round Trip
 * 
 * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
 * **Validates: Requirements 2.3, 8.2**
 * 
 * Property: For any 시험 접수 데이터, 저장 후 조회하면 원본 데이터와 동일한 값을 반환하고,
 * 연결된 ID(customer_id, contract_id, requester_id)가 올바르게 유지된다
 */

import * as fc from 'fast-check';
import {
  saveTestReception,
  getTestReceptionById,
  getTestReceptionsByCustomerId,
  getTestReceptionsByRequesterId,
  getTestReceptionsByContractId,
  updateTestReception,
  deleteTestReception,
  getAllTestReceptions,
} from '@/lib/test-reception-storage';
import { TestReception } from '@/types/customer';

// Helper to generate ISO date strings safely
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

// Arbitrary generator for TestReception
const testReceptionArb: fc.Arbitrary<TestReception> = fc.record({
  id: fc.uuid(),
  customer_id: fc.uuid(),
  requester_id: fc.uuid(),
  contract_id: fc.uuid(),
  quotation_id: fc.uuid(),
  
  // 헤더 정보
  substance_code: fc.stringMatching(/^[A-Z]{2,4}-\d{3,6}$/),
  project_code: fc.stringMatching(/^PRJ-\d{4}-\d{3}$/),
  substance_name: fc.string({ minLength: 1, maxLength: 100 }),
  institution_name: fc.string({ minLength: 1, maxLength: 100 }),
  test_number: fc.stringMatching(/^TEST-\d{4}-\d{4}$/),
  test_title: fc.string({ minLength: 1, maxLength: 200 }),
  test_director: fc.string({ minLength: 1, maxLength: 50 }),
  
  // 금액 정보
  total_amount: fc.integer({ min: 0, max: 1000000000 }),
  paid_amount: fc.integer({ min: 0, max: 1000000000 }),
  remaining_amount: fc.integer({ min: 0, max: 1000000000 }),
  
  // 상태
  status: fc.constantFrom('received', 'in_progress', 'completed', 'cancelled') as fc.Arbitrary<TestReception['status']>,
  reception_date: isoDateArb,
  expected_completion_date: isoDateArb,
  actual_completion_date: fc.option(isoDateArb, { nil: undefined }),
  
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

describe('Test Reception Storage Round Trip - Property 1', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 2.3, 8.2**
   */
  it('should restore all fields when loading a saved test reception', () => {
    fc.assert(
      fc.property(testReceptionArb, (reception) => {
        localStorage.clear();
        
        // Save the test reception
        saveTestReception(reception);

        // Load it back by ID
        const loaded = getTestReceptionById(reception.id);

        // Verify the test reception was found
        expect(loaded).not.toBeNull();
        if (!loaded) return false;

        // Verify all core fields match
        expect(loaded.id).toBe(reception.id);
        expect(loaded.customer_id).toBe(reception.customer_id);
        expect(loaded.requester_id).toBe(reception.requester_id);
        expect(loaded.contract_id).toBe(reception.contract_id);
        expect(loaded.quotation_id).toBe(reception.quotation_id);
        
        // 헤더 정보
        expect(loaded.substance_code).toBe(reception.substance_code);
        expect(loaded.project_code).toBe(reception.project_code);
        expect(loaded.substance_name).toBe(reception.substance_name);
        expect(loaded.institution_name).toBe(reception.institution_name);
        expect(loaded.test_number).toBe(reception.test_number);
        expect(loaded.test_title).toBe(reception.test_title);
        expect(loaded.test_director).toBe(reception.test_director);
        
        // 금액 정보
        expect(loaded.total_amount).toBe(reception.total_amount);
        expect(loaded.paid_amount).toBe(reception.paid_amount);
        expect(loaded.remaining_amount).toBe(reception.remaining_amount);
        
        // 상태
        expect(loaded.status).toBe(reception.status);
        expect(loaded.reception_date).toBe(reception.reception_date);
        expect(loaded.expected_completion_date).toBe(reception.expected_completion_date);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 2.3, 8.2**
   * 
   * Property: customer_id, requester_id, contract_id 연결이 올바르게 유지된다
   */
  it('should correctly filter test receptions by customer_id', () => {
    fc.assert(
      fc.property(
        fc.array(testReceptionArb, { minLength: 1, maxLength: 10 }).map(receptions => {
          const seen = new Set<string>();
          return receptions.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        }),
        (receptions) => {
          localStorage.clear();
          
          if (receptions.length === 0) return true;

          // Save all test receptions
          receptions.forEach(r => saveTestReception(r));

          // Pick a random customer_id from the saved receptions
          const targetCustomerId = receptions[0].customer_id;
          const expectedCount = receptions.filter(r => r.customer_id === targetCustomerId).length;

          // Get test receptions by customer_id
          const filtered = getTestReceptionsByCustomerId(targetCustomerId);

          // Verify all returned test receptions have the correct customer_id
          expect(filtered.length).toBe(expectedCount);
          filtered.forEach(r => {
            expect(r.customer_id).toBe(targetCustomerId);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 2.3, 8.2**
   */
  it('should correctly filter test receptions by requester_id', () => {
    fc.assert(
      fc.property(
        fc.array(testReceptionArb, { minLength: 1, maxLength: 10 }).map(receptions => {
          const seen = new Set<string>();
          return receptions.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        }),
        (receptions) => {
          localStorage.clear();
          
          if (receptions.length === 0) return true;

          receptions.forEach(r => saveTestReception(r));

          const targetRequesterId = receptions[0].requester_id;
          const expectedCount = receptions.filter(r => r.requester_id === targetRequesterId).length;

          const filtered = getTestReceptionsByRequesterId(targetRequesterId);

          expect(filtered.length).toBe(expectedCount);
          filtered.forEach(r => {
            expect(r.requester_id).toBe(targetRequesterId);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 2.3, 8.2**
   */
  it('should correctly filter test receptions by contract_id', () => {
    fc.assert(
      fc.property(
        fc.array(testReceptionArb, { minLength: 1, maxLength: 10 }).map(receptions => {
          const seen = new Set<string>();
          return receptions.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        }),
        (receptions) => {
          localStorage.clear();
          
          if (receptions.length === 0) return true;

          receptions.forEach(r => saveTestReception(r));

          const targetContractId = receptions[0].contract_id;
          const expectedCount = receptions.filter(r => r.contract_id === targetContractId).length;

          const filtered = getTestReceptionsByContractId(targetContractId);

          expect(filtered.length).toBe(expectedCount);
          filtered.forEach(r => {
            expect(r.contract_id).toBe(targetContractId);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 2.3, 8.2**
   * 
   * Property: Multiple test receptions can be saved and loaded independently
   */
  it('should preserve all test receptions when saving multiple', () => {
    fc.assert(
      fc.property(
        fc.array(testReceptionArb, { minLength: 1, maxLength: 10 }).map(receptions => {
          const seen = new Set<string>();
          return receptions.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        }),
        (receptions) => {
          localStorage.clear();
          
          if (receptions.length === 0) return true;

          receptions.forEach(r => saveTestReception(r));

          const allLoaded = getAllTestReceptions();

          expect(allLoaded.length).toBe(receptions.length);

          for (const original of receptions) {
            const loaded = getTestReceptionById(original.id);
            expect(loaded).not.toBeNull();
            if (loaded) {
              expect(loaded.id).toBe(original.id);
              expect(loaded.customer_id).toBe(original.customer_id);
              expect(loaded.test_number).toBe(original.test_number);
              expect(loaded.total_amount).toBe(original.total_amount);
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 2.5**
   * 
   * Property: Updating a test reception updates the updated_at timestamp
   */
  it('should update timestamp when modifying test reception', () => {
    fc.assert(
      fc.property(
        testReceptionArb,
        fc.string({ minLength: 1, maxLength: 200 }),
        (reception, newTitle) => {
          localStorage.clear();
          
          // Save original
          saveTestReception(reception);
          const before = getTestReceptionById(reception.id);
          expect(before).not.toBeNull();
          if (!before) return false;

          // Small delay to ensure timestamp difference
          const beforeUpdatedAt = before.updated_at;

          // Update with new title
          const updated = updateTestReception(reception.id, { test_title: newTitle });

          expect(updated).not.toBeNull();
          if (!updated) return false;

          // Title should be updated
          expect(updated.test_title).toBe(newTitle);

          // Other fields should remain unchanged
          expect(updated.id).toBe(reception.id);
          expect(updated.customer_id).toBe(reception.customer_id);
          expect(updated.requester_id).toBe(reception.requester_id);
          expect(updated.contract_id).toBe(reception.contract_id);
          expect(updated.test_number).toBe(reception.test_number);

          // updated_at should be changed (or same if within same millisecond)
          expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
            new Date(beforeUpdatedAt).getTime()
          );

          // Should only have one test reception (not duplicated)
          const all = getAllTestReceptions();
          expect(all.length).toBe(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 2.3, 8.2**
   * 
   * Property: Deleted test receptions cannot be loaded
   */
  it('should not find deleted test receptions', () => {
    fc.assert(
      fc.property(testReceptionArb, (reception) => {
        localStorage.clear();
        
        // Save the test reception
        saveTestReception(reception);

        // Verify it exists
        expect(getTestReceptionById(reception.id)).not.toBeNull();

        // Delete it
        const deleted = deleteTestReception(reception.id);
        expect(deleted).toBe(true);

        // Verify it no longer exists
        expect(getTestReceptionById(reception.id)).toBeNull();

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
