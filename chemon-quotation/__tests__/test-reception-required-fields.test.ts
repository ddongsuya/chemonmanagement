/**
 * Property-Based Tests for Test Reception and Invoice Schedule Required Fields
 * 
 * **Feature: customer-management, Property 6: 조회 결과 필수 필드 포함**
 * **Validates: Requirements 2.4, 3.3**
 * 
 * Property: For any 시험 목록 또는 세금계산서 일정 조회, 반환된 모든 항목은 
 * 필수 필드(시험번호, 금액, 상태 등)를 포함한다
 */

import * as fc from 'fast-check';
import {
  saveTestReception,
  getTestReceptionById,
  getTestReceptionsByCustomerId,
  getAllTestReceptions,
} from '@/lib/test-reception-storage';
import {
  saveInvoiceSchedule,
  getInvoiceScheduleById,
  getInvoiceSchedulesByCustomerId,
  getAllInvoiceSchedules,
} from '@/lib/invoice-schedule-storage';
import { TestReception, InvoiceSchedule } from '@/types/customer';

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
  
  // 헤더 정보 - 필수 필드
  substance_code: fc.stringMatching(/^[A-Z]{2,4}-\d{3,6}$/),
  project_code: fc.stringMatching(/^PRJ-\d{4}-\d{3}$/),
  substance_name: fc.string({ minLength: 1, maxLength: 100 }),
  institution_name: fc.string({ minLength: 1, maxLength: 100 }),
  test_number: fc.stringMatching(/^TEST-\d{4}-\d{4}$/),
  test_title: fc.string({ minLength: 1, maxLength: 200 }),
  test_director: fc.string({ minLength: 1, maxLength: 50 }),
  
  // 금액 정보 - 필수 필드
  total_amount: fc.integer({ min: 0, max: 1000000000 }),
  paid_amount: fc.integer({ min: 0, max: 1000000000 }),
  remaining_amount: fc.integer({ min: 0, max: 1000000000 }),
  
  // 상태 - 필수 필드
  status: fc.constantFrom('received', 'in_progress', 'completed', 'cancelled') as fc.Arbitrary<TestReception['status']>,
  reception_date: isoDateArb,
  expected_completion_date: isoDateArb,
  actual_completion_date: fc.option(isoDateArb, { nil: undefined }),
  
  created_at: isoDateArb,
  updated_at: isoDateArb,
});

// Arbitrary generator for InvoiceSchedule
const invoiceScheduleArb: fc.Arbitrary<InvoiceSchedule> = fc.record({
  id: fc.uuid(),
  test_reception_id: fc.uuid(),
  customer_id: fc.uuid(),
  
  // 필수 필드
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

describe('Test Reception Required Fields - Property 6', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 6: 조회 결과 필수 필드 포함**
   * **Validates: Requirements 2.4**
   * 
   * Property: For any 시험 목록 조회, 반환된 모든 항목은 필수 필드(시험번호, 시험제목, 
   * 시험책임자, 진행상태, 금액)를 포함한다
   */
  it('should include all required fields when retrieving test receptions by ID', () => {
    fc.assert(
      fc.property(testReceptionArb, (reception) => {
        localStorage.clear();
        
        // Save the test reception
        saveTestReception(reception);

        // Retrieve by ID
        const loaded = getTestReceptionById(reception.id);

        // Verify the test reception was found
        expect(loaded).not.toBeNull();
        if (!loaded) return false;

        // Verify all required fields are present (Requirements 2.4)
        // 시험번호
        expect(loaded.test_number).toBeDefined();
        expect(typeof loaded.test_number).toBe('string');
        expect(loaded.test_number.length).toBeGreaterThan(0);
        
        // 시험제목
        expect(loaded.test_title).toBeDefined();
        expect(typeof loaded.test_title).toBe('string');
        expect(loaded.test_title.length).toBeGreaterThan(0);
        
        // 시험책임자
        expect(loaded.test_director).toBeDefined();
        expect(typeof loaded.test_director).toBe('string');
        expect(loaded.test_director.length).toBeGreaterThan(0);
        
        // 진행상태
        expect(loaded.status).toBeDefined();
        expect(['received', 'in_progress', 'completed', 'cancelled']).toContain(loaded.status);
        
        // 금액 정보
        expect(loaded.total_amount).toBeDefined();
        expect(typeof loaded.total_amount).toBe('number');
        expect(loaded.total_amount).toBeGreaterThanOrEqual(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 6: 조회 결과 필수 필드 포함**
   * **Validates: Requirements 2.4**
   * 
   * Property: For any 고객사별 시험 목록 조회, 반환된 모든 항목은 필수 필드를 포함한다
   */
  it('should include all required fields when retrieving test receptions by customer ID', () => {
    fc.assert(
      fc.property(
        fc.array(testReceptionArb, { minLength: 1, maxLength: 10 }).map(receptions => {
          // Ensure unique IDs and same customer_id for some
          const seen = new Set<string>();
          const customerId = receptions[0].customer_id;
          return receptions
            .filter(r => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            })
            .map((r, i) => i < 3 ? { ...r, customer_id: customerId } : r);
        }),
        (receptions) => {
          localStorage.clear();
          
          if (receptions.length === 0) return true;

          // Save all test receptions
          receptions.forEach(r => saveTestReception(r));

          // Get the target customer ID
          const targetCustomerId = receptions[0].customer_id;

          // Retrieve by customer ID
          const loaded = getTestReceptionsByCustomerId(targetCustomerId);

          // Verify all returned items have required fields
          loaded.forEach(item => {
            // 시험번호
            expect(item.test_number).toBeDefined();
            expect(typeof item.test_number).toBe('string');
            
            // 시험제목
            expect(item.test_title).toBeDefined();
            expect(typeof item.test_title).toBe('string');
            
            // 시험책임자
            expect(item.test_director).toBeDefined();
            expect(typeof item.test_director).toBe('string');
            
            // 진행상태
            expect(item.status).toBeDefined();
            expect(['received', 'in_progress', 'completed', 'cancelled']).toContain(item.status);
            
            // 금액 정보
            expect(item.total_amount).toBeDefined();
            expect(typeof item.total_amount).toBe('number');
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 6: 조회 결과 필수 필드 포함**
   * **Validates: Requirements 2.4**
   * 
   * Property: For any 전체 시험 목록 조회, 반환된 모든 항목은 필수 필드를 포함한다
   */
  it('should include all required fields when retrieving all test receptions', () => {
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

          // Retrieve all
          const loaded = getAllTestReceptions();

          // Verify count matches
          expect(loaded.length).toBe(receptions.length);

          // Verify all returned items have required fields
          loaded.forEach(item => {
            // 시험번호
            expect(item.test_number).toBeDefined();
            expect(typeof item.test_number).toBe('string');
            
            // 시험제목
            expect(item.test_title).toBeDefined();
            expect(typeof item.test_title).toBe('string');
            
            // 시험책임자
            expect(item.test_director).toBeDefined();
            expect(typeof item.test_director).toBe('string');
            
            // 진행상태
            expect(item.status).toBeDefined();
            expect(['received', 'in_progress', 'completed', 'cancelled']).toContain(item.status);
            
            // 금액 정보
            expect(item.total_amount).toBeDefined();
            expect(typeof item.total_amount).toBe('number');
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});


describe('Invoice Schedule Required Fields - Property 6', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 6: 조회 결과 필수 필드 포함**
   * **Validates: Requirements 3.3**
   * 
   * Property: For any 세금계산서 일정 조회, 반환된 모든 항목은 필수 필드
   * (시험번호 연결, 금액, 발행예정일, 발행상태)를 포함한다
   */
  it('should include all required fields when retrieving invoice schedules by ID', () => {
    fc.assert(
      fc.property(invoiceScheduleArb, (schedule) => {
        localStorage.clear();
        
        // Save the invoice schedule
        saveInvoiceSchedule(schedule);

        // Retrieve by ID
        const loaded = getInvoiceScheduleById(schedule.id);

        // Verify the schedule was found
        expect(loaded).not.toBeNull();
        if (!loaded) return false;

        // Verify all required fields are present (Requirements 3.3)
        // 시험 접수 연결 (test_reception_id)
        expect(loaded.test_reception_id).toBeDefined();
        expect(typeof loaded.test_reception_id).toBe('string');
        expect(loaded.test_reception_id.length).toBeGreaterThan(0);
        
        // 금액
        expect(loaded.amount).toBeDefined();
        expect(typeof loaded.amount).toBe('number');
        expect(loaded.amount).toBeGreaterThan(0);
        
        // 발행예정일
        expect(loaded.scheduled_date).toBeDefined();
        expect(typeof loaded.scheduled_date).toBe('string');
        // Verify it's a valid date
        expect(new Date(loaded.scheduled_date).toString()).not.toBe('Invalid Date');
        
        // 발행상태
        expect(loaded.status).toBeDefined();
        expect(['pending', 'issued', 'paid', 'overdue']).toContain(loaded.status);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 6: 조회 결과 필수 필드 포함**
   * **Validates: Requirements 3.3**
   * 
   * Property: For any 고객사별 세금계산서 일정 조회, 반환된 모든 항목은 필수 필드를 포함한다
   */
  it('should include all required fields when retrieving invoice schedules by customer ID', () => {
    fc.assert(
      fc.property(
        fc.array(invoiceScheduleArb, { minLength: 1, maxLength: 10 }).map(schedules => {
          // Ensure unique IDs and same customer_id for some
          const seen = new Set<string>();
          const customerId = schedules[0].customer_id;
          return schedules
            .filter(s => {
              if (seen.has(s.id)) return false;
              seen.add(s.id);
              return true;
            })
            .map((s, i) => i < 3 ? { ...s, customer_id: customerId } : s);
        }),
        (schedules) => {
          localStorage.clear();
          
          if (schedules.length === 0) return true;

          // Save all invoice schedules
          schedules.forEach(s => saveInvoiceSchedule(s));

          // Get the target customer ID
          const targetCustomerId = schedules[0].customer_id;

          // Retrieve by customer ID
          const loaded = getInvoiceSchedulesByCustomerId(targetCustomerId);

          // Verify all returned items have required fields
          loaded.forEach(item => {
            // 시험 접수 연결
            expect(item.test_reception_id).toBeDefined();
            expect(typeof item.test_reception_id).toBe('string');
            
            // 금액
            expect(item.amount).toBeDefined();
            expect(typeof item.amount).toBe('number');
            
            // 발행예정일
            expect(item.scheduled_date).toBeDefined();
            expect(typeof item.scheduled_date).toBe('string');
            
            // 발행상태
            expect(item.status).toBeDefined();
            expect(['pending', 'issued', 'paid', 'overdue']).toContain(item.status);
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 6: 조회 결과 필수 필드 포함**
   * **Validates: Requirements 3.3**
   * 
   * Property: For any 전체 세금계산서 일정 조회, 반환된 모든 항목은 필수 필드를 포함한다
   */
  it('should include all required fields when retrieving all invoice schedules', () => {
    fc.assert(
      fc.property(
        fc.array(invoiceScheduleArb, { minLength: 1, maxLength: 10 }).map(schedules => {
          const seen = new Set<string>();
          return schedules.filter(s => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          });
        }),
        (schedules) => {
          localStorage.clear();
          
          if (schedules.length === 0) return true;

          // Save all invoice schedules
          schedules.forEach(s => saveInvoiceSchedule(s));

          // Retrieve all
          const loaded = getAllInvoiceSchedules();

          // Verify count matches
          expect(loaded.length).toBe(schedules.length);

          // Verify all returned items have required fields
          loaded.forEach(item => {
            // 시험 접수 연결
            expect(item.test_reception_id).toBeDefined();
            expect(typeof item.test_reception_id).toBe('string');
            
            // 금액
            expect(item.amount).toBeDefined();
            expect(typeof item.amount).toBe('number');
            
            // 발행예정일
            expect(item.scheduled_date).toBeDefined();
            expect(typeof item.scheduled_date).toBe('string');
            
            // 발행상태
            expect(item.status).toBeDefined();
            expect(['pending', 'issued', 'paid', 'overdue']).toContain(item.status);
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
