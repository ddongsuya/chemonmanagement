/**
 * Property-Based Tests for Meeting Record Request Status Management
 * 
 * **Feature: customer-management, Property 17: 요청사항 상태 관리**
 * **Validates: Requirements 5.4, 5.5**
 * 
 * Property: For any 요청사항 등록, 초기 상태는 'pending'이고, 
 * 처리 완료 시 'completed'로 변경되며 처리일이 기록된다
 */

import * as fc from 'fast-check';
import {
  saveMeetingRecord,
  getMeetingRecordById,
  updateRequestStatus,
  getRequestsByCustomerId,
  getPendingRequestsByCustomerId,
} from '@/lib/meeting-record-storage';
import { MeetingRecord } from '@/types/customer';

// Helper to generate ISO date strings safely
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

// Arbitrary generator for MeetingRecord that is a request
const requestRecordArb: fc.Arbitrary<MeetingRecord> = fc.record({
  id: fc.uuid(),
  customer_id: fc.uuid(),
  requester_id: fc.option(fc.uuid(), { nil: undefined }),
  type: fc.constantFrom('meeting', 'call', 'email', 'visit') as fc.Arbitrary<MeetingRecord['type']>,
  date: isoDateArb,
  time: fc.option(fc.stringMatching(/^\d{2}:\d{2}$/), { nil: undefined }),
  duration: fc.option(fc.integer({ min: 15, max: 480 }), { nil: undefined }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  attendees: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
  content: fc.string({ minLength: 0, maxLength: 500 }),
  follow_up_actions: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  attachments: fc.constant(undefined),
  is_request: fc.constant(true), // Always a request
  request_status: fc.constant(undefined), // No initial status - should be set to 'pending' by saveMeetingRecord
  request_completed_at: fc.constant(undefined),
  request_response: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for non-request MeetingRecord
const nonRequestRecordArb: fc.Arbitrary<MeetingRecord> = fc.record({
  id: fc.uuid(),
  customer_id: fc.uuid(),
  requester_id: fc.option(fc.uuid(), { nil: undefined }),
  type: fc.constantFrom('meeting', 'call', 'email', 'visit') as fc.Arbitrary<MeetingRecord['type']>,
  date: isoDateArb,
  time: fc.option(fc.stringMatching(/^\d{2}:\d{2}$/), { nil: undefined }),
  duration: fc.option(fc.integer({ min: 15, max: 480 }), { nil: undefined }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  attendees: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
  content: fc.string({ minLength: 0, maxLength: 500 }),
  follow_up_actions: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  attachments: fc.constant(undefined),
  is_request: fc.constant(false), // Not a request
  request_status: fc.constant(undefined),
  request_completed_at: fc.constant(undefined),
  request_response: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

describe('Meeting Record Request Status Management - Property 17', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 17: 요청사항 상태 관리**
   * **Validates: Requirements 5.4**
   * 
   * Property: When a request is registered, initial status is 'pending'
   */
  it('should set initial request status to pending when saving a new request', () => {
    fc.assert(
      fc.property(requestRecordArb, (record) => {
        localStorage.clear();
        
        // Save the request record (without request_status)
        const saved = saveMeetingRecord(record);

        // Verify the request_status is set to 'pending'
        expect(saved.request_status).toBe('pending');

        // Verify by loading from storage
        const loaded = getMeetingRecordById(record.id);
        expect(loaded).not.toBeNull();
        expect(loaded?.request_status).toBe('pending');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 17: 요청사항 상태 관리**
   * **Validates: Requirements 5.5**
   * 
   * Property: When request is completed, status changes to 'completed' and completion date is recorded
   */
  it('should set status to completed and record completion date when completing a request', () => {
    fc.assert(
      fc.property(
        requestRecordArb,
        fc.string({ minLength: 1, maxLength: 200 }),
        (record, response) => {
          localStorage.clear();
          
          // Save the request record
          saveMeetingRecord(record);

          // Complete the request
          const beforeComplete = new Date().toISOString();
          const completed = updateRequestStatus(record.id, 'completed', response);
          const afterComplete = new Date().toISOString();

          expect(completed).not.toBeNull();
          if (!completed) return false;

          // Verify status is 'completed'
          expect(completed.request_status).toBe('completed');

          // Verify completion date is recorded
          expect(completed.request_completed_at).toBeDefined();
          
          // Verify completion date is within the expected range
          const completedAt = new Date(completed.request_completed_at!).getTime();
          expect(completedAt).toBeGreaterThanOrEqual(new Date(beforeComplete).getTime());
          expect(completedAt).toBeLessThanOrEqual(new Date(afterComplete).getTime());

          // Verify response is recorded
          expect(completed.request_response).toBe(response);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 17: 요청사항 상태 관리**
   * **Validates: Requirements 5.4, 5.5**
   * 
   * Property: Request status can transition through pending -> in_progress -> completed
   */
  it('should allow status transitions from pending to in_progress to completed', () => {
    fc.assert(
      fc.property(requestRecordArb, (record) => {
        localStorage.clear();
        
        // Save the request record
        saveMeetingRecord(record);

        // Verify initial status is pending
        let current = getMeetingRecordById(record.id);
        expect(current?.request_status).toBe('pending');

        // Transition to in_progress
        updateRequestStatus(record.id, 'in_progress');
        current = getMeetingRecordById(record.id);
        expect(current?.request_status).toBe('in_progress');

        // Transition to completed
        updateRequestStatus(record.id, 'completed', 'Task completed');
        current = getMeetingRecordById(record.id);
        expect(current?.request_status).toBe('completed');
        expect(current?.request_completed_at).toBeDefined();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 17: 요청사항 상태 관리**
   * **Validates: Requirements 5.4**
   * 
   * Property: getRequestsByCustomerId only returns records where is_request is true
   */
  it('should only return request records when filtering by customer', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.array(requestRecordArb, { minLength: 1, maxLength: 5 }),
          fc.array(nonRequestRecordArb, { minLength: 1, maxLength: 5 })
        ).map(([customerId, requests, nonRequests]) => {
          const seen = new Set<string>();
          const allRecords = [...requests, ...nonRequests]
            .filter(r => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            })
            .map(r => ({ ...r, customer_id: customerId }));
          return { customerId, allRecords, requestCount: requests.filter(r => !seen.has(r.id) || requests.includes(r)).length };
        }),
        ({ customerId, allRecords }) => {
          localStorage.clear();
          
          // Save all records
          allRecords.forEach(r => saveMeetingRecord(r));

          // Get only requests
          const requests = getRequestsByCustomerId(customerId);

          // Verify all returned records are requests
          for (const request of requests) {
            expect(request.is_request).toBe(true);
          }

          // Verify count matches expected request count
          const expectedRequestCount = allRecords.filter(r => r.is_request).length;
          expect(requests.length).toBe(expectedRequestCount);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 17: 요청사항 상태 관리**
   * **Validates: Requirements 5.4, 5.5**
   * 
   * Property: getPendingRequestsByCustomerId only returns pending or in_progress requests
   */
  it('should only return pending or in_progress requests when filtering pending', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.array(requestRecordArb, { minLength: 3, maxLength: 10 })
        ).map(([customerId, records]) => {
          const seen = new Set<string>();
          return records
            .filter(r => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            })
            .map(r => ({ ...r, customer_id: customerId }));
        }),
        (records) => {
          localStorage.clear();
          
          if (records.length < 3) return true;

          // Save all records
          records.forEach(r => saveMeetingRecord(r));

          // Complete some requests
          const toComplete = records.slice(0, Math.floor(records.length / 2));
          toComplete.forEach(r => updateRequestStatus(r.id, 'completed', 'Done'));

          // Get pending requests
          const customerId = records[0].customer_id;
          const pending = getPendingRequestsByCustomerId(customerId);

          // Verify all returned requests are pending or in_progress
          for (const request of pending) {
            expect(['pending', 'in_progress']).toContain(request.request_status);
          }

          // Verify completed requests are not included
          for (const completed of toComplete) {
            const found = pending.find(r => r.id === completed.id);
            expect(found).toBeUndefined();
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 17: 요청사항 상태 관리**
   * **Validates: Requirements 5.4**
   * 
   * Property: Non-request records should not have request_status set to pending
   */
  it('should not set request_status for non-request records', () => {
    fc.assert(
      fc.property(nonRequestRecordArb, (record) => {
        localStorage.clear();
        
        // Save the non-request record
        const saved = saveMeetingRecord(record);

        // Verify request_status is not set (undefined)
        expect(saved.request_status).toBeUndefined();

        // Verify by loading from storage
        const loaded = getMeetingRecordById(record.id);
        expect(loaded).not.toBeNull();
        expect(loaded?.request_status).toBeUndefined();

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
