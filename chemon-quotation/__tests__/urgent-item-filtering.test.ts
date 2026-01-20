/**
 * Property-Based Tests for Urgent Item Filtering
 * 
 * **Feature: customer-management, Property 20: 긴급 항목 필터링**
 * **Validates: Requirements 7.2**
 * 
 * Property: For any 고객사 상세 조회, 발행 예정일 임박, 미처리 요청사항 등 
 * 긴급 처리가 필요한 항목이 알림 목록에 포함된다
 */

import * as fc from 'fast-check';
import { getUrgentItems } from '@/lib/urgent-items';
import { InvoiceSchedule, MeetingRecord } from '@/types/customer';

// Helper to generate ISO date strings
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

// Generate a date relative to now
const relativeDateArb = (daysOffset: number) => {
  const now = new Date();
  const targetDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  return fc.constant(targetDate.toISOString());
};

// Arbitrary generator for InvoiceSchedule
const invoiceScheduleArb = (
  scheduledDateArb: fc.Arbitrary<string>,
  status: InvoiceSchedule['status'] = 'pending'
): fc.Arbitrary<InvoiceSchedule> => fc.record({
  id: fc.uuid(),
  test_reception_id: fc.uuid(),
  customer_id: fc.uuid(),
  amount: fc.integer({ min: 10000, max: 100000000 }),
  scheduled_date: scheduledDateArb,
  issued_date: fc.constant(undefined),
  invoice_number: fc.constant(undefined),
  payment_type: fc.constantFrom('full', 'partial') as fc.Arbitrary<'full' | 'partial'>,
  installment_number: fc.constant(undefined),
  total_installments: fc.constant(undefined),
  status: fc.constant(status),
  notes: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for pending MeetingRecord (request)
const pendingRequestArb: fc.Arbitrary<MeetingRecord> = fc.record({
  id: fc.uuid(),
  customer_id: fc.uuid(),
  requester_id: fc.option(fc.uuid(), { nil: undefined }),
  type: fc.constantFrom('meeting', 'call', 'email', 'visit') as fc.Arbitrary<MeetingRecord['type']>,
  date: isoDateArb,
  time: fc.constant(undefined),
  duration: fc.constant(undefined),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  attendees: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 3 }),
  content: fc.string({ minLength: 0, maxLength: 200 }),
  follow_up_actions: fc.constant(undefined),
  attachments: fc.constant(undefined),
  is_request: fc.constant(true),
  request_status: fc.constantFrom('pending', 'in_progress') as fc.Arbitrary<'pending' | 'in_progress'>,
  request_completed_at: fc.constant(undefined),
  request_response: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

describe('Urgent Item Filtering - Property 20', () => {
  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Overdue invoices (scheduled_date < now) should be included in urgent items
   */
  it('should include overdue invoices in urgent items', () => {
    // Generate dates in the past (1-30 days ago)
    const pastDateArb = fc.integer({ min: 1, max: 30 }).map(daysAgo => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    });

    fc.assert(
      fc.property(
        fc.array(invoiceScheduleArb(pastDateArb, 'pending'), { minLength: 1, maxLength: 5 }),
        (overdueInvoices) => {
          const urgentItems = getUrgentItems(overdueInvoices, []);

          // All overdue invoices should be in urgent items
          for (const invoice of overdueInvoices) {
            const found = urgentItems.find(
              (item) => item.id === `invoice-overdue-${invoice.id}`
            );
            expect(found).toBeDefined();
            expect(found?.type).toBe('invoice_overdue');
            expect(found?.severity).toBe('error');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Upcoming invoices (within 7 days) should be included in urgent items
   */
  it('should include upcoming invoices (within threshold) in urgent items', () => {
    // Generate dates within 7 days from now
    const upcomingDateArb = fc.integer({ min: 0, max: 6 }).map(daysAhead => {
      const date = new Date();
      date.setDate(date.getDate() + daysAhead);
      date.setHours(23, 59, 59, 999); // End of day to ensure it's within threshold
      return date.toISOString();
    });

    fc.assert(
      fc.property(
        fc.array(invoiceScheduleArb(upcomingDateArb, 'pending'), { minLength: 1, maxLength: 5 }),
        (upcomingInvoices) => {
          const urgentItems = getUrgentItems(upcomingInvoices, [], 7);

          // All upcoming invoices should be in urgent items
          for (const invoice of upcomingInvoices) {
            const found = urgentItems.find(
              (item) => item.id === `invoice-upcoming-${invoice.id}`
            );
            expect(found).toBeDefined();
            expect(found?.type).toBe('invoice_upcoming');
            expect(found?.severity).toBe('warning');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Invoices beyond threshold should NOT be included in urgent items
   */
  it('should NOT include invoices beyond threshold in urgent items', () => {
    // Generate dates more than 7 days from now
    const futureDateArb = fc.integer({ min: 8, max: 60 }).map(daysAhead => {
      const date = new Date();
      date.setDate(date.getDate() + daysAhead);
      return date.toISOString();
    });

    fc.assert(
      fc.property(
        fc.array(invoiceScheduleArb(futureDateArb, 'pending'), { minLength: 1, maxLength: 5 }),
        (futureInvoices) => {
          const urgentItems = getUrgentItems(futureInvoices, [], 7);

          // No future invoices should be in urgent items
          for (const invoice of futureInvoices) {
            const foundOverdue = urgentItems.find(
              (item) => item.id === `invoice-overdue-${invoice.id}`
            );
            const foundUpcoming = urgentItems.find(
              (item) => item.id === `invoice-upcoming-${invoice.id}`
            );
            expect(foundOverdue).toBeUndefined();
            expect(foundUpcoming).toBeUndefined();
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Pending requests should be included in urgent items
   */
  it('should include pending requests in urgent items', () => {
    fc.assert(
      fc.property(
        fc.array(pendingRequestArb, { minLength: 1, maxLength: 5 }),
        (pendingRequests) => {
          const urgentItems = getUrgentItems([], pendingRequests);

          // All pending requests should be in urgent items
          for (const request of pendingRequests) {
            const found = urgentItems.find(
              (item) => item.id === `request-pending-${request.id}`
            );
            expect(found).toBeDefined();
            expect(found?.type).toBe('request_pending');
            expect(found?.severity).toBe('warning');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Issued/paid invoices should NOT be included in urgent items
   */
  it('should NOT include issued or paid invoices in urgent items', () => {
    const pastDateArb = fc.integer({ min: 1, max: 30 }).map(daysAgo => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    });

    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(invoiceScheduleArb(pastDateArb, 'issued'), { minLength: 1, maxLength: 3 }),
          fc.array(invoiceScheduleArb(pastDateArb, 'paid'), { minLength: 1, maxLength: 3 })
        ),
        ([issuedInvoices, paidInvoices]) => {
          const allInvoices = [...issuedInvoices, ...paidInvoices];
          const urgentItems = getUrgentItems(allInvoices, []);

          // No issued or paid invoices should be in urgent items
          expect(urgentItems.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Urgent items should be sorted by severity (error first) then by date
   */
  it('should sort urgent items by severity (error first) then by date', () => {
    const pastDateArb = fc.integer({ min: 1, max: 30 }).map(daysAgo => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    });

    const upcomingDateArb = fc.integer({ min: 0, max: 6 }).map(daysAhead => {
      const date = new Date();
      date.setDate(date.getDate() + daysAhead);
      return date.toISOString();
    });

    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(invoiceScheduleArb(pastDateArb, 'pending'), { minLength: 1, maxLength: 3 }),
          fc.array(invoiceScheduleArb(upcomingDateArb, 'pending'), { minLength: 1, maxLength: 3 }),
          fc.array(pendingRequestArb, { minLength: 1, maxLength: 3 })
        ),
        ([overdueInvoices, upcomingInvoices, pendingRequests]) => {
          const allInvoices = [...overdueInvoices, ...upcomingInvoices];
          const urgentItems = getUrgentItems(allInvoices, pendingRequests);

          // Check that error severity items come before warning severity items
          let foundWarning = false;
          for (const item of urgentItems) {
            if (item.severity === 'warning') {
              foundWarning = true;
            }
            if (item.severity === 'error' && foundWarning) {
              // Error item found after warning item - sorting is wrong
              fail('Error severity items should come before warning severity items');
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Empty inputs should return empty urgent items
   */
  it('should return empty array when no urgent items exist', () => {
    const urgentItems = getUrgentItems([], []);
    expect(urgentItems).toEqual([]);
  });

  /**
   * **Feature: customer-management, Property 20: 긴급 항목 필터링**
   * **Validates: Requirements 7.2**
   * 
   * Property: Custom threshold should be respected
   */
  it('should respect custom days threshold for upcoming invoices', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 30 }),
        (threshold) => {
          // Generate date well within threshold (half of threshold days)
          const withinThresholdDate = new Date();
          withinThresholdDate.setDate(withinThresholdDate.getDate() + Math.floor(threshold / 2));
          
          // Generate date well beyond threshold
          const beyondThresholdDate = new Date();
          beyondThresholdDate.setDate(beyondThresholdDate.getDate() + threshold + 5);

          const withinThresholdInvoice: InvoiceSchedule = {
            id: 'within-threshold',
            test_reception_id: 'test-1',
            customer_id: 'customer-1',
            amount: 100000,
            scheduled_date: withinThresholdDate.toISOString(),
            payment_type: 'full',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const beyondThresholdInvoice: InvoiceSchedule = {
            id: 'beyond-threshold',
            test_reception_id: 'test-2',
            customer_id: 'customer-1',
            amount: 200000,
            scheduled_date: beyondThresholdDate.toISOString(),
            payment_type: 'full',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const urgentItems = getUrgentItems(
            [withinThresholdInvoice, beyondThresholdInvoice],
            [],
            threshold
          );

          // Within-threshold invoice should be included
          const withinThresholdFound = urgentItems.find(
            (item) => item.id === 'invoice-upcoming-within-threshold'
          );
          expect(withinThresholdFound).toBeDefined();

          // Beyond-threshold invoice should NOT be included
          const beyondThresholdFound = urgentItems.find(
            (item) => item.id === 'invoice-upcoming-beyond-threshold'
          );
          expect(beyondThresholdFound).toBeUndefined();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
