/**
 * Property-Based Tests for Requester Delete Policy
 * 
 * **Feature: customer-management, Property 4: 의뢰자 삭제 정책**
 * **Validates: Requirements 1.5**
 * 
 * Property: For any 의뢰자 삭제 요청, 연관된 견적/계약이 있으면 is_active가 false로 변경되고,
 * 연관 데이터가 없으면 완전 삭제된다
 */

import * as fc from 'fast-check';
import {
  saveRequester,
  getRequesterById,
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
  is_active: fc.constant(true),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

describe('Requester Delete Policy - Property 4', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 4: 의뢰자 삭제 정책**
   * **Validates: Requirements 1.5**
   * 
   * Property: 연관 데이터가 없는 의뢰자는 완전 삭제된다
   */
  it('should completely delete requester when no related data exists', () => {
    fc.assert(
      fc.property(requesterArb, (requester) => {
        localStorage.clear();
        
        // Save the requester
        saveRequester(requester);

        // Verify it exists
        const before = getRequesterById(requester.id);
        expect(before).not.toBeNull();
        expect(before?.is_active).toBe(true);

        // Delete without related data (hasRelatedData = false)
        const result = deleteRequester(requester.id, false);

        // Verify deletion result
        expect(result.success).toBe(true);
        expect(result.deactivated).toBe(false);

        // Verify requester no longer exists
        const after = getRequesterById(requester.id);
        expect(after).toBeNull();

        // Verify it's not in the list
        const all = getAllRequesters();
        const found = all.find(r => r.id === requester.id);
        expect(found).toBeUndefined();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 4: 의뢰자 삭제 정책**
   * **Validates: Requirements 1.5**
   * 
   * Property: 연관 데이터가 있는 의뢰자는 비활성화 처리된다
   */
  it('should deactivate requester when related data exists', () => {
    fc.assert(
      fc.property(requesterArb, (requester) => {
        localStorage.clear();
        
        // Save the requester
        saveRequester(requester);

        // Verify it exists and is active
        const before = getRequesterById(requester.id);
        expect(before).not.toBeNull();
        expect(before?.is_active).toBe(true);

        // Delete with related data (hasRelatedData = true)
        const result = deleteRequester(requester.id, true);

        // Verify deactivation result
        expect(result.success).toBe(true);
        expect(result.deactivated).toBe(true);

        // Verify requester still exists but is deactivated
        const after = getRequesterById(requester.id);
        expect(after).not.toBeNull();
        expect(after?.is_active).toBe(false);

        // Verify all other fields remain unchanged
        expect(after?.id).toBe(requester.id);
        expect(after?.customer_id).toBe(requester.customer_id);
        expect(after?.name).toBe(requester.name);
        expect(after?.position).toBe(requester.position);
        expect(after?.department).toBe(requester.department);
        expect(after?.phone).toBe(requester.phone);
        expect(after?.email).toBe(requester.email);
        expect(after?.is_primary).toBe(requester.is_primary);

        return true;
      }),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: customer-management, Property 4: 의뢰자 삭제 정책**
   * **Validates: Requirements 1.5**
   * 
   * Property: 존재하지 않는 의뢰자 삭제 시도는 실패한다
   */
  it('should fail when deleting non-existent requester', () => {
    fc.assert(
      fc.property(fc.uuid(), (nonExistentId) => {
        localStorage.clear();
        
        // Try to delete non-existent requester
        const result = deleteRequester(nonExistentId, false);

        // Should fail
        expect(result.success).toBe(false);
        expect(result.deactivated).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 4: 의뢰자 삭제 정책**
   * **Validates: Requirements 1.5**
   * 
   * Property: 삭제/비활성화는 다른 의뢰자에 영향을 주지 않는다
   */
  it('should not affect other requesters when deleting one', () => {
    fc.assert(
      fc.property(
        fc.array(requesterArb, { minLength: 2, maxLength: 5 }).map(requesters => {
          // Ensure unique IDs
          const seen = new Set<string>();
          return requesters.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        }),
        fc.boolean(),
        (requesters, hasRelatedData) => {
          localStorage.clear();
          
          if (requesters.length < 2) return true;

          // Save all requesters
          requesters.forEach(r => saveRequester(r));

          // Delete the first requester
          const toDelete = requesters[0];
          const others = requesters.slice(1);

          deleteRequester(toDelete.id, hasRelatedData);

          // Verify other requesters are unaffected
          others.forEach(original => {
            const loaded = getRequesterById(original.id);
            expect(loaded).not.toBeNull();
            expect(loaded?.id).toBe(original.id);
            expect(loaded?.name).toBe(original.name);
            expect(loaded?.is_active).toBe(original.is_active);
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 4: 의뢰자 삭제 정책**
   * **Validates: Requirements 1.5**
   * 
   * Property: 비활성화된 의뢰자를 다시 삭제 시도하면 비활성화 상태가 유지된다
   */
  it('should maintain deactivated state when trying to delete again', () => {
    fc.assert(
      fc.property(requesterArb, (requester) => {
        localStorage.clear();
        
        // Save the requester
        saveRequester(requester);

        // First deactivation (with related data)
        const result1 = deleteRequester(requester.id, true);
        expect(result1.success).toBe(true);
        expect(result1.deactivated).toBe(true);

        // Verify deactivated
        const after1 = getRequesterById(requester.id);
        expect(after1?.is_active).toBe(false);

        // Try to delete again (with related data)
        const result2 = deleteRequester(requester.id, true);
        expect(result2.success).toBe(true);
        expect(result2.deactivated).toBe(true);

        // Should still exist and be deactivated
        const after2 = getRequesterById(requester.id);
        expect(after2).not.toBeNull();
        expect(after2?.is_active).toBe(false);

        return true;
      }),
      { numRuns: 50 }
    );
  });
});
