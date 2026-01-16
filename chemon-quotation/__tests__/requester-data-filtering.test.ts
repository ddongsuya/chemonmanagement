/**
 * Property-Based Tests for Requester Data Filtering
 * 
 * **Feature: customer-management, Property 2: 의뢰자별 데이터 필터링**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any 고객사와 해당 고객사의 의뢰자 목록, 특정 의뢰자로 필터링한
 * 견적/계약/시험접수 목록은 해당 의뢰자의 데이터만 포함한다
 */

import * as fc from 'fast-check';
import {
  saveRequester,
  getRequestersByCustomerId,
  getAllRequesters,
} from '@/lib/requester-storage';
import {
  saveTestReception,
  getTestReceptionsByRequesterId,
  getAllTestReceptions,
} from '@/lib/test-reception-storage';
import { Requester, TestReception } from '@/types/customer';

// Helper to generate ISO date strings safely
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

// Arbitrary generator for Requester
const requesterArb: fc.Arbitrary<Requester> = fc.record({
  id: fc.uuid(),
  customer_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  position: fc.string({ minLength: 0, maxLength: 30 }),
  department: fc.string({ minLength: 0, maxLength: 30 }),
  phone: fc.stringMatching(/^010-\d{4}-\d{4}$/),
  email: fc.emailAddress(),
  is_primary: fc.boolean(),
  is_active: fc.constant(true),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for TestReception
const testReceptionArb = (requesterId: string, customerId: string): fc.Arbitrary<TestReception> => 
  fc.record({
    id: fc.uuid(),
    customer_id: fc.constant(customerId),
    requester_id: fc.constant(requesterId),
    contract_id: fc.uuid(),
    quotation_id: fc.uuid(),
    substance_code: fc.string({ minLength: 1, maxLength: 20 }),
    project_code: fc.string({ minLength: 1, maxLength: 20 }),
    substance_name: fc.string({ minLength: 1, maxLength: 50 }),
    institution_name: fc.string({ minLength: 1, maxLength: 50 }),
    test_number: fc.stringMatching(/^TEST-\d{4}-\d{4}$/),
    test_title: fc.string({ minLength: 1, maxLength: 100 }),
    test_director: fc.string({ minLength: 1, maxLength: 30 }),
    total_amount: fc.integer({ min: 0, max: 100000000 }),
    paid_amount: fc.integer({ min: 0, max: 100000000 }),
    remaining_amount: fc.integer({ min: 0, max: 100000000 }),
    status: fc.constantFrom('received', 'in_progress', 'completed', 'cancelled') as fc.Arbitrary<TestReception['status']>,
    reception_date: isoDateArb,
    expected_completion_date: isoDateArb,
    created_at: isoDateArb,
    updated_at: isoDateArb,
  });


describe('Requester Data Filtering - Property 2', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 2: 의뢰자별 데이터 필터링**
   * **Validates: Requirements 1.3**
   * 
   * Property: 특정 의뢰자로 필터링한 시험접수 목록은 해당 의뢰자의 데이터만 포함한다
   */
  it('should filter test receptions by requester_id correctly', () => {
    fc.assert(
      fc.property(
        fc.tuple(requesterArb, requesterArb).filter(([r1, r2]) => r1.id !== r2.id),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        ([requester1, requester2], count1, count2) => {
          localStorage.clear();
          
          // Use same customer_id for both requesters
          const customerId = requester1.customer_id;
          requester2.customer_id = customerId;
          
          // Save requesters
          saveRequester(requester1);
          saveRequester(requester2);

          // Generate and save test receptions for requester1
          const receptions1: TestReception[] = [];
          for (let i = 0; i < count1; i++) {
            const reception = fc.sample(testReceptionArb(requester1.id, customerId), 1)[0];
            reception.id = `${requester1.id}-reception-${i}`;
            saveTestReception(reception);
            receptions1.push(reception);
          }

          // Generate and save test receptions for requester2
          const receptions2: TestReception[] = [];
          for (let i = 0; i < count2; i++) {
            const reception = fc.sample(testReceptionArb(requester2.id, customerId), 1)[0];
            reception.id = `${requester2.id}-reception-${i}`;
            saveTestReception(reception);
            receptions2.push(reception);
          }

          // Filter by requester1
          const filtered1 = getTestReceptionsByRequesterId(requester1.id);
          
          // Verify all returned items belong to requester1
          expect(filtered1.length).toBe(count1);
          filtered1.forEach(reception => {
            expect(reception.requester_id).toBe(requester1.id);
          });

          // Filter by requester2
          const filtered2 = getTestReceptionsByRequesterId(requester2.id);
          
          // Verify all returned items belong to requester2
          expect(filtered2.length).toBe(count2);
          filtered2.forEach(reception => {
            expect(reception.requester_id).toBe(requester2.id);
          });

          // Verify no cross-contamination
          const allReceptions = getAllTestReceptions();
          expect(allReceptions.length).toBe(count1 + count2);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 2: 의뢰자별 데이터 필터링**
   * **Validates: Requirements 1.3**
   * 
   * Property: 고객사별 의뢰자 필터링이 올바르게 동작한다
   */
  it('should filter requesters by customer_id correctly', () => {
    fc.assert(
      fc.property(
        fc.array(requesterArb, { minLength: 2, maxLength: 10 }).map(requesters => {
          // Ensure unique IDs
          const seen = new Set<string>();
          return requesters.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        }),
        (requesters) => {
          localStorage.clear();
          
          if (requesters.length < 2) return true;

          // Save all requesters
          requesters.forEach(r => saveRequester(r));

          // Group requesters by customer_id
          const byCustomer = new Map<string, Requester[]>();
          requesters.forEach(r => {
            const list = byCustomer.get(r.customer_id) || [];
            list.push(r);
            byCustomer.set(r.customer_id, list);
          });

          // Verify filtering for each customer
          byCustomer.forEach((expectedRequesters, customerId) => {
            const filtered = getRequestersByCustomerId(customerId);
            
            // Count should match
            expect(filtered.length).toBe(expectedRequesters.length);
            
            // All returned requesters should belong to this customer
            filtered.forEach(r => {
              expect(r.customer_id).toBe(customerId);
            });

            // All expected requesters should be in the result
            expectedRequesters.forEach(expected => {
              const found = filtered.find(r => r.id === expected.id);
              expect(found).toBeDefined();
            });
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 2: 의뢰자별 데이터 필터링**
   * **Validates: Requirements 1.3**
   * 
   * Property: 존재하지 않는 의뢰자로 필터링하면 빈 배열을 반환한다
   */
  it('should return empty array when filtering by non-existent requester', () => {
    fc.assert(
      fc.property(
        requesterArb,
        fc.uuid(),
        (requester, nonExistentId) => {
          localStorage.clear();
          
          // Save a requester
          saveRequester(requester);

          // Create some test receptions for the requester
          const reception = fc.sample(testReceptionArb(requester.id, requester.customer_id), 1)[0];
          saveTestReception(reception);

          // Filter by non-existent requester_id
          const filtered = getTestReceptionsByRequesterId(nonExistentId);
          
          // Should return empty array (unless by chance nonExistentId === requester.id)
          if (nonExistentId !== requester.id) {
            expect(filtered.length).toBe(0);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
