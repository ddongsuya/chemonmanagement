/**
 * Property-Based Tests for Customer Data Join Integrated View
 * 
 * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
 * **Validates: Requirements 8.5**
 * 
 * Property: For any 고객사 ID로 조회 요청, 해당 고객사의 의뢰자, 견적, 계약, 
 * 시험접수, 미팅기록이 모두 연결되어 반환된다
 */

import * as fc from 'fast-check';
import {
  getCustomerIntegratedData,
  validateCustomerDataIntegrity,
} from '@/lib/customer-data-join';
import { saveRequester, getAllRequesters } from '@/lib/requester-storage';
import { saveTestReception, getAllTestReceptions } from '@/lib/test-reception-storage';
import { saveInvoiceSchedule, getAllInvoiceSchedules } from '@/lib/invoice-schedule-storage';
import { saveMeetingRecord, getAllMeetingRecords } from '@/lib/meeting-record-storage';
import { saveQuotation, getAllQuotations } from '@/lib/quotation-storage';
import { Requester, TestReception, InvoiceSchedule, MeetingRecord } from '@/types/customer';

// Helper to generate ISO date strings
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

// Arbitrary generator for Requester
const requesterArb = (customerId: string): fc.Arbitrary<Requester> => fc.record({
  id: fc.uuid(),
  customer_id: fc.constant(customerId),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  position: fc.string({ minLength: 0, maxLength: 30 }),
  department: fc.string({ minLength: 0, maxLength: 30 }),
  phone: fc.string({ minLength: 0, maxLength: 20 }),
  email: fc.emailAddress(),
  is_primary: fc.boolean(),
  is_active: fc.constant(true),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for TestReception
const testReceptionArb = (customerId: string): fc.Arbitrary<TestReception> => fc.record({
  id: fc.uuid(),
  customer_id: fc.constant(customerId),
  requester_id: fc.uuid(),
  contract_id: fc.uuid(),
  quotation_id: fc.uuid(),
  substance_code: fc.string({ minLength: 1, maxLength: 20 }),
  project_code: fc.string({ minLength: 1, maxLength: 20 }),
  substance_name: fc.string({ minLength: 1, maxLength: 100 }),
  institution_name: fc.string({ minLength: 1, maxLength: 100 }),
  test_number: fc.string({ minLength: 1, maxLength: 30 }),
  test_title: fc.string({ minLength: 1, maxLength: 200 }),
  test_director: fc.string({ minLength: 1, maxLength: 50 }),
  total_amount: fc.integer({ min: 10000, max: 100000000 }),
  paid_amount: fc.integer({ min: 0, max: 100000000 }),
  remaining_amount: fc.integer({ min: 0, max: 100000000 }),
  status: fc.constantFrom('received', 'in_progress', 'completed', 'cancelled') as fc.Arbitrary<TestReception['status']>,
  reception_date: isoDateArb,
  expected_completion_date: isoDateArb,
  actual_completion_date: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for InvoiceSchedule
const invoiceScheduleArb = (customerId: string): fc.Arbitrary<InvoiceSchedule> => fc.record({
  id: fc.uuid(),
  test_reception_id: fc.uuid(),
  customer_id: fc.constant(customerId),
  amount: fc.integer({ min: 10000, max: 100000000 }),
  scheduled_date: isoDateArb,
  issued_date: fc.constant(undefined),
  invoice_number: fc.constant(undefined),
  payment_type: fc.constantFrom('full', 'partial') as fc.Arbitrary<'full' | 'partial'>,
  installment_number: fc.constant(undefined),
  total_installments: fc.constant(undefined),
  status: fc.constantFrom('pending', 'issued', 'paid', 'overdue') as fc.Arbitrary<InvoiceSchedule['status']>,
  notes: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for MeetingRecord
const meetingRecordArb = (customerId: string): fc.Arbitrary<MeetingRecord> => fc.record({
  id: fc.uuid(),
  customer_id: fc.constant(customerId),
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
  is_request: fc.boolean(),
  request_status: fc.constant(undefined),
  request_completed_at: fc.constant(undefined),
  request_response: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for SavedQuotation
const quotationArb = (customerId: string) => fc.record({
  id: fc.uuid(),
  quotation_number: fc.string({ minLength: 5, maxLength: 20 }),
  customer_id: fc.constant(customerId),
  customer_name: fc.string({ minLength: 1, maxLength: 100 }),
  project_name: fc.string({ minLength: 1, maxLength: 100 }),
  modality: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom('draft', 'submitted', 'won', 'lost', 'expired') as fc.Arbitrary<'draft' | 'submitted' | 'won' | 'lost' | 'expired'>,
  valid_days: fc.integer({ min: 7, max: 90 }),
  valid_until: isoDateArb,
  items: fc.constant([]),
  subtotal_test: fc.integer({ min: 0, max: 100000000 }),
  subtotal_analysis: fc.integer({ min: 0, max: 100000000 }),
  discount_rate: fc.integer({ min: 0, max: 100 }),
  discount_amount: fc.integer({ min: 0, max: 100000000 }),
  total_amount: fc.integer({ min: 0, max: 100000000 }),
  notes: fc.constant(undefined),
  created_at: isoDateArb,
  updated_at: isoDateArb,
  created_by: fc.string({ minLength: 1, maxLength: 50 }),
});

describe('Customer Data Join Integrated View - Property 21', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: All requesters returned should belong to the queried customer
   */
  it('should return only requesters belonging to the queried customer', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.uuid()
        ).chain(([customerId1, customerId2]) => 
          fc.tuple(
            fc.constant(customerId1),
            fc.constant(customerId2),
            fc.array(requesterArb(customerId1), { minLength: 1, maxLength: 3 }),
            fc.array(requesterArb(customerId2), { minLength: 1, maxLength: 3 })
          )
        ),
        ([customerId1, customerId2, requesters1, requesters2]) => {
          localStorage.clear();
          
          // Save requesters for both customers
          requesters1.forEach(r => saveRequester(r));
          requesters2.forEach(r => saveRequester(r));

          // Get integrated data for customer 1
          const data = getCustomerIntegratedData(customerId1);

          // All returned requesters should belong to customer 1
          expect(data.requesters.length).toBe(requesters1.length);
          for (const requester of data.requesters) {
            expect(requester.customer_id).toBe(customerId1);
          }

          // No requesters from customer 2 should be included
          for (const requester of data.requesters) {
            expect(requester.customer_id).not.toBe(customerId2);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: All test receptions returned should belong to the queried customer
   */
  it('should return only test receptions belonging to the queried customer', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.uuid()
        ).chain(([customerId1, customerId2]) => 
          fc.tuple(
            fc.constant(customerId1),
            fc.constant(customerId2),
            fc.array(testReceptionArb(customerId1), { minLength: 1, maxLength: 3 }),
            fc.array(testReceptionArb(customerId2), { minLength: 1, maxLength: 3 })
          )
        ),
        ([customerId1, customerId2, receptions1, receptions2]) => {
          localStorage.clear();
          
          // Save test receptions for both customers
          receptions1.forEach(r => saveTestReception(r));
          receptions2.forEach(r => saveTestReception(r));

          // Get integrated data for customer 1
          const data = getCustomerIntegratedData(customerId1);

          // All returned test receptions should belong to customer 1
          expect(data.testReceptions.length).toBe(receptions1.length);
          for (const reception of data.testReceptions) {
            expect(reception.customer_id).toBe(customerId1);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: All invoice schedules returned should belong to the queried customer
   */
  it('should return only invoice schedules belonging to the queried customer', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.uuid()
        ).chain(([customerId1, customerId2]) => 
          fc.tuple(
            fc.constant(customerId1),
            fc.constant(customerId2),
            fc.array(invoiceScheduleArb(customerId1), { minLength: 1, maxLength: 3 }),
            fc.array(invoiceScheduleArb(customerId2), { minLength: 1, maxLength: 3 })
          )
        ),
        ([customerId1, customerId2, schedules1, schedules2]) => {
          localStorage.clear();
          
          // Save invoice schedules for both customers
          schedules1.forEach(s => saveInvoiceSchedule(s));
          schedules2.forEach(s => saveInvoiceSchedule(s));

          // Get integrated data for customer 1
          const data = getCustomerIntegratedData(customerId1);

          // All returned invoice schedules should belong to customer 1
          expect(data.invoiceSchedules.length).toBe(schedules1.length);
          for (const schedule of data.invoiceSchedules) {
            expect(schedule.customer_id).toBe(customerId1);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: All meeting records returned should belong to the queried customer
   */
  it('should return only meeting records belonging to the queried customer', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.uuid()
        ).chain(([customerId1, customerId2]) => 
          fc.tuple(
            fc.constant(customerId1),
            fc.constant(customerId2),
            fc.array(meetingRecordArb(customerId1), { minLength: 1, maxLength: 3 }),
            fc.array(meetingRecordArb(customerId2), { minLength: 1, maxLength: 3 })
          )
        ),
        ([customerId1, customerId2, records1, records2]) => {
          localStorage.clear();
          
          // Save meeting records for both customers
          records1.forEach(r => saveMeetingRecord(r));
          records2.forEach(r => saveMeetingRecord(r));

          // Get integrated data for customer 1
          const data = getCustomerIntegratedData(customerId1);

          // All returned meeting records should belong to customer 1
          expect(data.meetingRecords.length).toBe(records1.length);
          for (const record of data.meetingRecords) {
            expect(record.customer_id).toBe(customerId1);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: All quotations returned should belong to the queried customer
   */
  it('should return only quotations belonging to the queried customer', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.uuid()
        ).chain(([customerId1, customerId2]) => 
          fc.tuple(
            fc.constant(customerId1),
            fc.constant(customerId2),
            fc.array(quotationArb(customerId1), { minLength: 1, maxLength: 3 }),
            fc.array(quotationArb(customerId2), { minLength: 1, maxLength: 3 })
          )
        ),
        ([customerId1, customerId2, quotations1, quotations2]) => {
          localStorage.clear();
          
          // Save quotations for both customers
          quotations1.forEach(q => saveQuotation(q as any));
          quotations2.forEach(q => saveQuotation(q as any));

          // Get integrated data for customer 1
          const data = getCustomerIntegratedData(customerId1);

          // All returned quotations should belong to customer 1
          expect(data.quotations.length).toBe(quotations1.length);
          for (const quotation of data.quotations) {
            expect(quotation.customer_id).toBe(customerId1);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: Data integrity validation should pass for correctly joined data
   */
  it('should pass data integrity validation for correctly joined data', () => {
    fc.assert(
      fc.property(
        fc.uuid().chain((customerId) => 
          fc.tuple(
            fc.constant(customerId),
            fc.array(requesterArb(customerId), { minLength: 0, maxLength: 3 }),
            fc.array(testReceptionArb(customerId), { minLength: 0, maxLength: 3 }),
            fc.array(invoiceScheduleArb(customerId), { minLength: 0, maxLength: 3 }),
            fc.array(meetingRecordArb(customerId), { minLength: 0, maxLength: 3 }),
            fc.array(quotationArb(customerId), { minLength: 0, maxLength: 3 })
          )
        ),
        ([customerId, requesters, testReceptions, invoiceSchedules, meetingRecords, quotations]) => {
          localStorage.clear();
          
          // Save all data
          requesters.forEach(r => saveRequester(r));
          testReceptions.forEach(t => saveTestReception(t));
          invoiceSchedules.forEach(i => saveInvoiceSchedule(i));
          meetingRecords.forEach(m => saveMeetingRecord(m));
          quotations.forEach(q => saveQuotation(q as any));

          // Get integrated data
          const data = getCustomerIntegratedData(customerId);

          // Validate data integrity
          const isValid = validateCustomerDataIntegrity(data);
          expect(isValid).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: Empty customer should return empty arrays for all data types
   */
  it('should return empty arrays for customer with no data', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (customerId) => {
          localStorage.clear();
          
          // Get integrated data for customer with no data
          const data = getCustomerIntegratedData(customerId);

          expect(data.customerId).toBe(customerId);
          expect(data.requesters).toEqual([]);
          expect(data.quotations).toEqual([]);
          expect(data.testReceptions).toEqual([]);
          expect(data.invoiceSchedules).toEqual([]);
          expect(data.meetingRecords).toEqual([]);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 21: 데이터 조인 통합 뷰**
   * **Validates: Requirements 8.5**
   * 
   * Property: Integrated data should contain all saved items for the customer
   */
  it('should contain all saved items for the customer', () => {
    fc.assert(
      fc.property(
        fc.uuid().chain((customerId) => 
          fc.tuple(
            fc.constant(customerId),
            fc.array(requesterArb(customerId), { minLength: 1, maxLength: 5 }),
            fc.array(meetingRecordArb(customerId), { minLength: 1, maxLength: 5 })
          )
        ),
        ([customerId, requesters, meetingRecords]) => {
          localStorage.clear();
          
          // Save data
          requesters.forEach(r => saveRequester(r));
          meetingRecords.forEach(m => saveMeetingRecord(m));

          // Get integrated data
          const data = getCustomerIntegratedData(customerId);

          // Verify all saved requesters are in the result
          const requesterIds = new Set(data.requesters.map(r => r.id));
          for (const requester of requesters) {
            expect(requesterIds.has(requester.id)).toBe(true);
          }

          // Verify all saved meeting records are in the result
          const meetingIds = new Set(data.meetingRecords.map(m => m.id));
          for (const record of meetingRecords) {
            expect(meetingIds.has(record.id)).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
