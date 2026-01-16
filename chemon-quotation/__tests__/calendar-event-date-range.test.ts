/**
 * Property-Based Tests for Calendar Event Date Range Search
 * 
 * **Feature: customer-management, Property 19: 캘린더 이벤트 날짜 범위 검색**
 * **Validates: Requirements 8.4**
 * 
 * Property: For any 날짜 범위 검색 요청, 해당 범위 내의 모든 캘린더 이벤트가 반환된다
 */

import * as fc from 'fast-check';
import {
  saveCalendarEvent,
  getCalendarEventsByDateRange,
  getAllCalendarEvents,
} from '@/lib/calendar-event-storage';
import { CalendarEvent } from '@/types/customer';

// Helper to generate ISO date strings safely
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

// Arbitrary generator for CalendarEvent
const calendarEventArb: fc.Arbitrary<CalendarEvent> = fc.record({
  id: fc.uuid(),
  customer_id: fc.option(fc.uuid(), { nil: undefined }),
  test_reception_id: fc.option(fc.uuid(), { nil: undefined }),
  invoice_schedule_id: fc.option(fc.uuid(), { nil: undefined }),
  meeting_record_id: fc.option(fc.uuid(), { nil: undefined }),
  type: fc.constantFrom('meeting', 'invoice', 'deadline', 'reminder', 'other') as fc.Arbitrary<CalendarEvent['type']>,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  start_date: isoDateArb,
  end_date: fc.option(isoDateArb, { nil: undefined }),
  all_day: fc.boolean(),
  color: fc.option(fc.stringMatching(/^#[0-9A-Fa-f]{6}$/), { nil: undefined }),
  reminder_before: fc.option(fc.integer({ min: 5, max: 1440 }), { nil: undefined }),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Generate a date range (start and end dates)
const dateRangeArb = fc.tuple(isoDateArb, isoDateArb).map(([d1, d2]) => {
  const date1 = new Date(d1).getTime();
  const date2 = new Date(d2).getTime();
  return date1 <= date2 
    ? { start: d1, end: d2 }
    : { start: d2, end: d1 };
});

describe('Calendar Event Date Range Search - Property 19', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 19: 캘린더 이벤트 날짜 범위 검색**
   * **Validates: Requirements 8.4**
   * 
   * Property: All events within the date range are returned
   */
  it('should return all events within the specified date range', () => {
    fc.assert(
      fc.property(
        fc.array(calendarEventArb, { minLength: 1, maxLength: 10 }).map(events => {
          const seen = new Set<string>();
          return events.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
        }),
        dateRangeArb,
        (events, range) => {
          localStorage.clear();
          
          // Save all events
          events.forEach(e => saveCalendarEvent(e));
          
          // Get events by date range
          const result = getCalendarEventsByDateRange(range.start, range.end);
          
          const rangeStart = new Date(range.start).getTime();
          const rangeEnd = new Date(range.end).getTime();
          
          // Calculate expected events (those that overlap with the range)
          const expectedEvents = events.filter(e => {
            const eventStart = new Date(e.start_date).getTime();
            const eventEnd = e.end_date ? new Date(e.end_date).getTime() : eventStart;
            // Event overlaps if it starts before range ends AND ends after range starts
            return eventStart <= rangeEnd && eventEnd >= rangeStart;
          });
          
          // Verify count matches
          expect(result.length).toBe(expectedEvents.length);
          
          // Verify all expected events are in result
          const resultIds = new Set(result.map(r => r.id));
          expectedEvents.forEach(e => {
            expect(resultIds.has(e.id)).toBe(true);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 19: 캘린더 이벤트 날짜 범위 검색**
   * **Validates: Requirements 8.4**
   * 
   * Property: Events outside the date range are not returned
   */
  it('should not return events outside the date range', () => {
    fc.assert(
      fc.property(
        fc.array(calendarEventArb, { minLength: 1, maxLength: 10 }).map(events => {
          const seen = new Set<string>();
          return events.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
        }),
        dateRangeArb,
        (events, range) => {
          localStorage.clear();
          
          // Save all events
          events.forEach(e => saveCalendarEvent(e));
          
          // Get events by date range
          const result = getCalendarEventsByDateRange(range.start, range.end);
          
          const rangeStart = new Date(range.start).getTime();
          const rangeEnd = new Date(range.end).getTime();
          
          // Verify all returned events are within range
          result.forEach(event => {
            const eventStart = new Date(event.start_date).getTime();
            const eventEnd = event.end_date ? new Date(event.end_date).getTime() : eventStart;
            
            // Event should overlap with range
            const overlaps = eventStart <= rangeEnd && eventEnd >= rangeStart;
            expect(overlaps).toBe(true);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 19: 캘린더 이벤트 날짜 범위 검색**
   * **Validates: Requirements 8.4**
   * 
   * Property: Results are sorted by start_date ascending
   */
  it('should return events sorted by start_date ascending', () => {
    fc.assert(
      fc.property(
        fc.array(calendarEventArb, { minLength: 2, maxLength: 10 }).map(events => {
          const seen = new Set<string>();
          return events.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
        }),
        dateRangeArb,
        (events, range) => {
          localStorage.clear();
          
          // Save all events
          events.forEach(e => saveCalendarEvent(e));
          
          // Get events by date range
          const result = getCalendarEventsByDateRange(range.start, range.end);
          
          // Verify sorting (ascending by start_date)
          for (let i = 0; i < result.length - 1; i++) {
            const currentDate = new Date(result[i].start_date).getTime();
            const nextDate = new Date(result[i + 1].start_date).getTime();
            expect(currentDate).toBeLessThanOrEqual(nextDate);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 19: 캘린더 이벤트 날짜 범위 검색**
   * **Validates: Requirements 8.4**
   * 
   * Property: Events with end_date spanning the range boundary are included
   */
  it('should include events that span across the range boundary', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          isoDateArb, // event start (before range)
          isoDateArb, // event end (after range start)
          isoDateArb, // range start
          isoDateArb  // range end
        ).filter(([, eventStart, eventEnd, rangeStart, rangeEnd]) => {
          // Ensure valid ranges
          const es = new Date(eventStart).getTime();
          const ee = new Date(eventEnd).getTime();
          const rs = new Date(rangeStart).getTime();
          const re = new Date(rangeEnd).getTime();
          return es < ee && rs < re;
        }),
        ([id, eventStart, eventEnd, rangeStart, rangeEnd]) => {
          localStorage.clear();
          
          // Normalize dates
          const es = new Date(eventStart).getTime();
          const ee = new Date(eventEnd).getTime();
          const rs = new Date(rangeStart).getTime();
          const re = new Date(rangeEnd).getTime();
          
          const normalizedEventStart = es < ee ? eventStart : eventEnd;
          const normalizedEventEnd = es < ee ? eventEnd : eventStart;
          const normalizedRangeStart = rs < re ? rangeStart : rangeEnd;
          const normalizedRangeEnd = rs < re ? rangeEnd : rangeStart;
          
          // Create an event
          const event: CalendarEvent = {
            id,
            type: 'meeting',
            title: 'Test Event',
            start_date: normalizedEventStart,
            end_date: normalizedEventEnd,
            all_day: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          saveCalendarEvent(event);
          
          // Get events by date range
          const result = getCalendarEventsByDateRange(normalizedRangeStart, normalizedRangeEnd);
          
          // Calculate if event should be in range
          const eventStartTime = new Date(normalizedEventStart).getTime();
          const eventEndTime = new Date(normalizedEventEnd).getTime();
          const rangeStartTime = new Date(normalizedRangeStart).getTime();
          const rangeEndTime = new Date(normalizedRangeEnd).getTime();
          
          const shouldBeInRange = eventStartTime <= rangeEndTime && eventEndTime >= rangeStartTime;
          
          if (shouldBeInRange) {
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(id);
          } else {
            expect(result.length).toBe(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 19: 캘린더 이벤트 날짜 범위 검색**
   * **Validates: Requirements 8.4**
   * 
   * Property: Empty result for range with no events
   */
  it('should return empty array when no events in range', () => {
    fc.assert(
      fc.property(
        fc.array(calendarEventArb, { minLength: 0, maxLength: 5 }).map(events => {
          const seen = new Set<string>();
          return events.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
        }),
        (events) => {
          localStorage.clear();
          
          // Save all events
          events.forEach(e => saveCalendarEvent(e));
          
          // Create a range that's definitely outside all events
          // Use a far future date range
          const farFutureStart = '2099-01-01T00:00:00.000Z';
          const farFutureEnd = '2099-12-31T23:59:59.999Z';
          
          // Get events by date range
          const result = getCalendarEventsByDateRange(farFutureStart, farFutureEnd);
          
          // Should be empty since all generated events are before 2030
          expect(result.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
