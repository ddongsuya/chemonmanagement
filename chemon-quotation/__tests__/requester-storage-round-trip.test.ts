/**
 * Property-Based Tests for Requester Storage Round Trip
 * 
 * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
 * **Validates: Requirements 1.2, 8.1**
 * 
 * Property: For any 의뢰자 데이터, 저장 후 조회하면 원본 데이터와 동일한 값을 반환하고,
 * 연결된 ID(customer_id)가 올바르게 유지된다
 */

import * as fc from 'fast-check';
import {
  saveRequester,
  getRequesterById,
  getRequestersByCustomerId,
  updateRequester,
  deleteRequester,
  getAllRequesters,
} from '@/lib/requester-storage';
import { Requester } from '@/types/customer';

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
  is_active: fc.constant(true), // New requesters are always active
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

describe('Requester Storage Round Trip - Property 1', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 1.2, 8.1**
   */
  it('should restore all fields when loading a saved requester', () => {
    fc.assert(
      fc.property(requesterArb, (requester) => {
        localStorage.clear();
        
        // Save the requester
        saveRequester(requester);

        // Load it back by ID
        const loaded = getRequesterById(requester.id);

        // Verify the requester was found
        expect(loaded).not.toBeNull();
        if (!loaded) return false;

        // Verify all core fields match
        expect(loaded.id).toBe(requester.id);
        expect(loaded.customer_id).toBe(requester.customer_id);
        expect(loaded.name).toBe(requester.name);
        expect(loaded.position).toBe(requester.position);
        expect(loaded.department).toBe(requester.department);
        expect(loaded.phone).toBe(requester.phone);
        expect(loaded.email).toBe(requester.email);
        expect(loaded.is_primary).toBe(requester.is_primary);
        expect(loaded.is_active).toBe(requester.is_active);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 1.2, 8.1**
   * 
   * Property: customer_id 연결이 올바르게 유지된다
   */
  it('should correctly filter requesters by customer_id', () => {
    fc.assert(
      fc.property(
        fc.array(requesterArb, { minLength: 1, maxLength: 10 }).map(requesters => {
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
          
          if (requesters.length === 0) return true;

          // Save all requesters
          requesters.forEach(r => saveRequester(r));

          // Pick a random customer_id from the saved requesters
          const targetCustomerId = requesters[0].customer_id;
          const expectedCount = requesters.filter(r => r.customer_id === targetCustomerId).length;

          // Get requesters by customer_id
          const filtered = getRequestersByCustomerId(targetCustomerId);

          // Verify all returned requesters have the correct customer_id
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
   * **Validates: Requirements 1.2, 8.1**
   * 
   * Property: Multiple requesters can be saved and loaded independently
   */
  it('should preserve all requesters when saving multiple', () => {
    fc.assert(
      fc.property(
        fc.array(requesterArb, { minLength: 1, maxLength: 10 }).map(requesters => {
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
          
          if (requesters.length === 0) return true;

          // Save all requesters
          requesters.forEach(r => saveRequester(r));

          // Load all requesters
          const allLoaded = getAllRequesters();

          // Verify count matches
          expect(allLoaded.length).toBe(requesters.length);

          // Verify each requester can be found and matches
          for (const original of requesters) {
            const loaded = getRequesterById(original.id);
            expect(loaded).not.toBeNull();
            if (loaded) {
              expect(loaded.id).toBe(original.id);
              expect(loaded.customer_id).toBe(original.customer_id);
              expect(loaded.name).toBe(original.name);
              expect(loaded.email).toBe(original.email);
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
   * **Validates: Requirements 1.2, 8.1**
   * 
   * Property: Updating a requester preserves all fields except updated_at
   */
  it('should preserve fields when updating an existing requester', () => {
    fc.assert(
      fc.property(
        requesterArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (requester, newName) => {
          localStorage.clear();
          
          // Save original
          saveRequester(requester);

          // Update with new name
          const updated = updateRequester(requester.id, { name: newName });

          expect(updated).not.toBeNull();
          if (!updated) return false;

          // Name should be updated
          expect(updated.name).toBe(newName);

          // Other fields should remain unchanged
          expect(updated.id).toBe(requester.id);
          expect(updated.customer_id).toBe(requester.customer_id);
          expect(updated.position).toBe(requester.position);
          expect(updated.department).toBe(requester.department);
          expect(updated.phone).toBe(requester.phone);
          expect(updated.email).toBe(requester.email);
          expect(updated.is_primary).toBe(requester.is_primary);
          expect(updated.is_active).toBe(requester.is_active);

          // Should only have one requester (not duplicated)
          const all = getAllRequesters();
          expect(all.length).toBe(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 1.2, 8.1**
   * 
   * Property: Deleted requesters (without related data) cannot be loaded
   */
  it('should not find deleted requesters when no related data exists', () => {
    fc.assert(
      fc.property(requesterArb, (requester) => {
        localStorage.clear();
        
        // Save the requester
        saveRequester(requester);

        // Verify it exists
        expect(getRequesterById(requester.id)).not.toBeNull();

        // Delete it (no related data)
        const result = deleteRequester(requester.id, false);
        expect(result.success).toBe(true);
        expect(result.deactivated).toBe(false);

        // Verify it no longer exists
        expect(getRequesterById(requester.id)).toBeNull();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 1: 데이터 저장 라운드트립**
   * **Validates: Requirements 1.5**
   * 
   * Property: Requesters with related data are deactivated instead of deleted
   */
  it('should deactivate requesters when related data exists', () => {
    fc.assert(
      fc.property(requesterArb, (requester) => {
        localStorage.clear();
        
        // Save the requester
        saveRequester(requester);

        // Verify it exists and is active
        const before = getRequesterById(requester.id);
        expect(before).not.toBeNull();
        expect(before?.is_active).toBe(true);

        // Delete it (with related data)
        const result = deleteRequester(requester.id, true);
        expect(result.success).toBe(true);
        expect(result.deactivated).toBe(true);

        // Verify it still exists but is deactivated
        const after = getRequesterById(requester.id);
        expect(after).not.toBeNull();
        expect(after?.is_active).toBe(false);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
