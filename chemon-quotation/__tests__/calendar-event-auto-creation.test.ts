/**
 * Property-Based Tests for Calendar Event Auto Creation
 * 
 * **Feature: customer-management, Property 18: 자동 캘린더 이벤트 생성**
 * **Validates: Requirements 6.2, 6.3**
 * 
 * Property: For any 미팅 일정 또는 세금계산서 발행 예정일 등록, 
 * 해당 날짜에 캘린더 이벤트가 자동으로 생성된다
 */

import * as fc from 'fast-check';
import {
  createCalendarEventFromMeeting,
  createCalendarEventFromInvoice,
  getCalendarEventByMeetingId,
  getCalendarEventByInvoiceId,
  getAllCalendarEvents,
} from '@/lib/calendar-event-storage';
import { MeetingRecord, InvoiceSchedule } from '@/types/customer';

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

// Arbitrary generator for InvoiceSchedule
const invoiceScheduleArb: fc.Arbitrary<InvoiceSchedule> = fc.record({
  id: fc.uuid(),
  test_reception_id: fc.uuid(),
  customer_id: fc.uuid(),
  amount: fc.integer({ min: 1000, max: 1000000000 }),
  scheduled_date: isoDateArb,
  issued_date: fc.option(isoDateArb, { nil: undefined }),
  invoice_number: fc.option(fc.stringMatching(/^INV-\d{4}-\d{6}$/), { nil: undefined }),
  payment_type: fc.constantFrom('full', 'partial') as fc.Arbitrary<InvoiceSchedule['payment_type']>,
  installment_number: fc.option(fc.integer({ min: 1, max: 12 }), { nil: undefined }),
  total_installments: fc.option(fc.integer({ min: 1, max: 12 }), { nil: undefined }),
  status: fc.constantFrom('pending', 'issued', 'paid', 'overdue') as fc.Arbitrary<InvoiceSchedule['status']>,
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

describe('Calendar Event Auto Creation - Property 18', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 18: 자동 캘린더 이벤트 생성**
   * **Validates: Requirements 6.2**
   * 
   * Property: For any 미팅 일정 등록, 해당 날짜에 캘린더 이벤트가 자동으로 생성된다
   */
  it('should create calendar event when meeting is registered', () => {
    fc.assert(
      fc.property(meetingRecordArb, (meeting) => {
        localStorage.clear();
        
        // Create calendar event from meeting
        const calendarEvent = createCalendarEventFromMeeting(meeting);
        
        // Verify event was created
        expect(calendarEvent).toBeDefined();
        expect(calendarEvent.id).toBe(`meeting-${meeting.id}`);
        expect(calendarEvent.meeting_record_id).toBe(meeting.id);
        expect(calendarEvent.customer_id).toBe(meeting.customer_id);
        expect(calendarEvent.type).toBe('meeting');
        expect(calendarEvent.title).toBe(meeting.title);
        expect(calendarEvent.start_date).toBe(meeting.date);
        
        // Verify event is stored
        const storedEvent = getCalendarEventByMeetingId(meeting.id);
        expect(storedEvent).not.toBeNull();
        expect(storedEvent?.id).toBe(calendarEvent.id);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 18: 자동 캘린더 이벤트 생성**
   * **Validates: Requirements 6.3**
   * 
   * Property: For any 세금계산서 발행 예정일 등록, 해당 날짜에 캘린더 이벤트가 자동으로 생성된다
   */
  it('should create calendar event when invoice schedule is registered', () => {
    fc.assert(
      fc.property(invoiceScheduleArb, (invoice) => {
        localStorage.clear();
        
        // Create calendar event from invoice
        const calendarEvent = createCalendarEventFromInvoice(invoice);
        
        // Verify event was created
        expect(calendarEvent).toBeDefined();
        expect(calendarEvent.id).toBe(`invoice-${invoice.id}`);
        expect(calendarEvent.invoice_schedule_id).toBe(invoice.id);
        expect(calendarEvent.customer_id).toBe(invoice.customer_id);
        expect(calendarEvent.test_reception_id).toBe(invoice.test_reception_id);
        expect(calendarEvent.type).toBe('invoice');
        expect(calendarEvent.start_date).toBe(invoice.scheduled_date);
        expect(calendarEvent.all_day).toBe(true);
        
        // Verify event is stored
        const storedEvent = getCalendarEventByInvoiceId(invoice.id);
        expect(storedEvent).not.toBeNull();
        expect(storedEvent?.id).toBe(calendarEvent.id);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 18: 자동 캘린더 이벤트 생성**
   * **Validates: Requirements 6.2**
   * 
   * Property: Meeting calendar event should have correct all_day flag based on time
   */
  it('should set all_day flag correctly based on meeting time', () => {
    fc.assert(
      fc.property(meetingRecordArb, (meeting) => {
        localStorage.clear();
        
        const calendarEvent = createCalendarEventFromMeeting(meeting);
        
        // all_day should be true if no time is specified
        const expectedAllDay = !meeting.time;
        expect(calendarEvent.all_day).toBe(expectedAllDay);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 18: 자동 캘린더 이벤트 생성**
   * **Validates: Requirements 6.2**
   * 
   * Property: Meeting calendar event should have end_date if duration is specified
   */
  it('should set end_date based on meeting duration', () => {
    fc.assert(
      fc.property(meetingRecordArb, (meeting) => {
        localStorage.clear();
        
        const calendarEvent = createCalendarEventFromMeeting(meeting);
        
        if (meeting.duration) {
          // end_date should be start_date + duration
          expect(calendarEvent.end_date).toBeDefined();
          const startTime = new Date(meeting.date).getTime();
          const endTime = new Date(calendarEvent.end_date!).getTime();
          const durationMs = meeting.duration * 60 * 1000;
          expect(endTime - startTime).toBe(durationMs);
        } else {
          // end_date should be undefined if no duration
          expect(calendarEvent.end_date).toBeUndefined();
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 18: 자동 캘린더 이벤트 생성**
   * **Validates: Requirements 6.2, 6.3**
   * 
   * Property: Multiple events can be created and all are stored
   */
  it('should store multiple calendar events from different sources', () => {
    fc.assert(
      fc.property(
        fc.array(meetingRecordArb, { minLength: 1, maxLength: 5 }).map(meetings => {
          const seen = new Set<string>();
          return meetings.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        }),
        fc.array(invoiceScheduleArb, { minLength: 1, maxLength: 5 }).map(invoices => {
          const seen = new Set<string>();
          return invoices.filter(i => {
            if (seen.has(i.id)) return false;
            seen.add(i.id);
            return true;
          });
        }),
        (meetings, invoices) => {
          localStorage.clear();
          
          // Create events from meetings
          meetings.forEach(m => createCalendarEventFromMeeting(m));
          
          // Create events from invoices
          invoices.forEach(i => createCalendarEventFromInvoice(i));
          
          // Verify all events are stored
          const allEvents = getAllCalendarEvents();
          expect(allEvents.length).toBe(meetings.length + invoices.length);
          
          // Verify meeting events
          meetings.forEach(m => {
            const event = getCalendarEventByMeetingId(m.id);
            expect(event).not.toBeNull();
          });
          
          // Verify invoice events
          invoices.forEach(i => {
            const event = getCalendarEventByInvoiceId(i.id);
            expect(event).not.toBeNull();
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
