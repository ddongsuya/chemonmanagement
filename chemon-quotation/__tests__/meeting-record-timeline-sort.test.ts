/**
 * Property-Based Tests for Meeting Record Timeline Sorting
 * 
 * **Feature: customer-management, Property 16: 타임라인 시간순 정렬**
 * **Validates: Requirements 5.2, 7.4**
 * 
 * Property: For any 미팅 기록 또는 활동 타임라인 조회, 반환된 목록은 
 * 날짜 기준 내림차순(최신순)으로 정렬된다
 */

import * as fc from 'fast-check';
import {
  saveMeetingRecord,
  getMeetingRecordsByCustomerId,
  getRequestsByCustomerId,
  getAllMeetingRecords,
} from '@/lib/meeting-record-storage';
import { MeetingRecord } from '@/types/customer';

// Helper to generate ISO date strings safely
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

// Arbitrary generator for MeetingRecord
const meetingRecordArb: fc.Arbitrary<MeetingRecord> = fc.record({
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
  is_request: fc.boolean(),
  request_status: fc.option(fc.constantFrom('pending', 'in_progress', 'completed') as fc.Arbitrary<'pending' | 'in_progress' | 'completed'>, { nil: undefined }),
  request_completed_at: fc.option(isoDateArb, { nil: undefined }),
  request_response: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Generate meeting records with same customer_id but different dates
const meetingRecordsWithSameCustomerArb = fc.tuple(
  fc.uuid(), // shared customer_id
  fc.array(meetingRecordArb, { minLength: 2, maxLength: 10 })
).map(([customerId, records]) => {
  // Ensure unique IDs and same customer_id
  const seen = new Set<string>();
  return records
    .filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    })
    .map(r => ({ ...r, customer_id: customerId }));
});

describe('Meeting Record Timeline Sort - Property 16', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 16: 타임라인 시간순 정렬**
   * **Validates: Requirements 5.2, 7.4**
   * 
   * Property: getMeetingRecordsByCustomerId returns records sorted by date descending
   */
  it('should return meeting records sorted by date in descending order', () => {
    fc.assert(
      fc.property(meetingRecordsWithSameCustomerArb, (records) => {
        localStorage.clear();
        
        if (records.length < 2) return true;

        // Save all records
        records.forEach(r => saveMeetingRecord(r));

        // Get records by customer_id
        const customerId = records[0].customer_id;
        const retrieved = getMeetingRecordsByCustomerId(customerId);

        // Verify the list is sorted by date descending (newest first)
        for (let i = 0; i < retrieved.length - 1; i++) {
          const currentDate = new Date(retrieved[i].date).getTime();
          const nextDate = new Date(retrieved[i + 1].date).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 16: 타임라인 시간순 정렬**
   * **Validates: Requirements 5.2, 7.4**
   * 
   * Property: getRequestsByCustomerId returns requests sorted by date descending
   */
  it('should return requests sorted by date in descending order', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.array(meetingRecordArb.map(r => ({ ...r, is_request: true })), { minLength: 2, maxLength: 10 })
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
          
          if (records.length < 2) return true;

          // Save all records (all are requests)
          records.forEach(r => saveMeetingRecord(r));

          // Get requests by customer_id
          const customerId = records[0].customer_id;
          const retrieved = getRequestsByCustomerId(customerId);

          // Verify the list is sorted by date descending (newest first)
          for (let i = 0; i < retrieved.length - 1; i++) {
            const currentDate = new Date(retrieved[i].date).getTime();
            const nextDate = new Date(retrieved[i + 1].date).getTime();
            expect(currentDate).toBeGreaterThanOrEqual(nextDate);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 16: 타임라인 시간순 정렬**
   * **Validates: Requirements 5.2, 7.4**
   * 
   * Property: Sorting is stable - records with same date maintain consistent order
   */
  it('should maintain stable sorting for records with same date', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          isoDateArb,
          fc.array(meetingRecordArb, { minLength: 2, maxLength: 5 })
        ).map(([customerId, sharedDate, records]) => {
          const seen = new Set<string>();
          return records
            .filter(r => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            })
            .map(r => ({ ...r, customer_id: customerId, date: sharedDate }));
        }),
        (records) => {
          localStorage.clear();
          
          if (records.length < 2) return true;

          // Save all records
          records.forEach(r => saveMeetingRecord(r));

          // Get records twice
          const customerId = records[0].customer_id;
          const retrieved1 = getMeetingRecordsByCustomerId(customerId);
          const retrieved2 = getMeetingRecordsByCustomerId(customerId);

          // Verify both retrievals return same order
          expect(retrieved1.length).toBe(retrieved2.length);
          for (let i = 0; i < retrieved1.length; i++) {
            expect(retrieved1[i].id).toBe(retrieved2[i].id);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 16: 타임라인 시간순 정렬**
   * **Validates: Requirements 5.2, 7.4**
   * 
   * Property: All records for a customer are included in the sorted result
   */
  it('should include all customer records in sorted result', () => {
    fc.assert(
      fc.property(meetingRecordsWithSameCustomerArb, (records) => {
        localStorage.clear();
        
        if (records.length === 0) return true;

        // Save all records
        records.forEach(r => saveMeetingRecord(r));

        // Get records by customer_id
        const customerId = records[0].customer_id;
        const retrieved = getMeetingRecordsByCustomerId(customerId);

        // Verify count matches
        expect(retrieved.length).toBe(records.length);

        // Verify all original records are present
        const retrievedIds = new Set(retrieved.map(r => r.id));
        for (const original of records) {
          expect(retrievedIds.has(original.id)).toBe(true);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
