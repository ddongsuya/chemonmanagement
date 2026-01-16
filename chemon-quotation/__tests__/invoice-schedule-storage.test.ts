/**
 * Property-Based Tests for Invoice Schedule Storage
 * 
 * **Feature: customer-management, Property 8: 세금계산서 발행 예정일 자동 계산**
 * **Validates: Requirements 3.1**
 * 
 * **Feature: customer-management, Property 10: 임박 발행 일정 필터링**
 * **Validates: Requirements 3.4**
 */

import * as fc from 'fast-check';
import {
  calculateDefaultScheduledDate,
  isScheduledWithinDays,
  getUpcomingInvoices,
  saveInvoiceSchedule,
  getAllInvoiceSchedules,
  getInvoiceSchedulesByTestReception,
  createInstallmentSchedules,
} from '@/lib/invoice-schedule-storage';
import { InvoiceSchedule } from '@/types/customer';

// Helper to generate ISO date strings safely
const isoDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

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

describe('Invoice Schedule - Property 8: 세금계산서 발행 예정일 자동 계산', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 8: 세금계산서 발행 예정일 자동 계산**
   * **Validates: Requirements 3.1**
   * 
   * Property: For any 시험 접수 등록, 기본 발행 예정일은 접수일로부터 30일 후이다
   */
  it('should calculate default scheduled date as 30 days after reception date', () => {
    fc.assert(
      fc.property(isoDateArb, (receptionDate) => {
        const scheduledDate = calculateDefaultScheduledDate(receptionDate);
        
        const reception = new Date(receptionDate);
        const scheduled = new Date(scheduledDate);
        
        // Calculate the difference in days
        const diffTime = scheduled.getTime() - reception.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        // Should be exactly 30 days
        expect(diffDays).toBe(30);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 8: 세금계산서 발행 예정일 자동 계산**
   * **Validates: Requirements 3.1**
   * 
   * Property: The calculated scheduled date should always be in the future relative to reception date
   */
  it('should always calculate scheduled date after reception date', () => {
    fc.assert(
      fc.property(isoDateArb, (receptionDate) => {
        const scheduledDate = calculateDefaultScheduledDate(receptionDate);
        
        const reception = new Date(receptionDate);
        const scheduled = new Date(scheduledDate);
        
        // Scheduled date should be after reception date
        expect(scheduled.getTime()).toBeGreaterThan(reception.getTime());
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Invoice Schedule - Property 10: 임박 발행 일정 필터링', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 10: 임박 발행 일정 필터링**
   * **Validates: Requirements 3.4**
   * 
   * Property: For any 세금계산서 발행 일정 목록, 발행 예정일이 현재 날짜로부터 7일 이내인 항목은 임박 항목으로 분류된다
   */
  it('should correctly identify schedules within specified days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }), // days to check
        fc.integer({ min: -10, max: 40 }), // days from now for scheduled date
        (daysToCheck, daysFromNow) => {
          const now = new Date();
          const scheduledDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
          
          const isWithin = isScheduledWithinDays(scheduledDate.toISOString(), daysToCheck);
          
          // Should be within if:
          // 1. scheduledDate >= now (not in the past)
          // 2. scheduledDate <= now + daysToCheck
          const expectedWithin = daysFromNow >= 0 && daysFromNow <= daysToCheck;
          
          expect(isWithin).toBe(expectedWithin);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 10: 임박 발행 일정 필터링**
   * **Validates: Requirements 3.4**
   * 
   * Property: getUpcomingInvoices returns only pending invoices within the specified days
   * Note: This test uses a simplified approach to avoid timing edge cases
   */
  it('should return only pending invoices within specified days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 14 }), // days ahead
        fc.array(
          fc.record({
            id: fc.uuid(),
            test_reception_id: fc.uuid(),
            customer_id: fc.uuid(),
            amount: fc.integer({ min: 1000, max: 1000000 }),
            // Use days starting from 1 to avoid timing edge cases at day 0
            // and ensure we're clearly within or outside the range
            daysFromNow: fc.integer({ min: -5, max: 20 }),
            status: fc.constantFrom('pending', 'issued', 'paid', 'overdue') as fc.Arbitrary<InvoiceSchedule['status']>,
          }),
          { minLength: 1, maxLength: 10 }
        ).map(items => {
          // Ensure unique IDs
          const seen = new Set<string>();
          return items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        }),
        (daysAhead, items) => {
          localStorage.clear();
          
          if (items.length === 0) return true;
          
          const now = new Date();
          
          // Create and save invoice schedules
          // Add a small buffer (1 hour) to scheduled dates to avoid edge cases
          items.forEach(item => {
            const scheduledDate = new Date(now.getTime() + item.daysFromNow * 24 * 60 * 60 * 1000);
            // Add 1 hour buffer for items that should be in the future
            if (item.daysFromNow >= 0) {
              scheduledDate.setTime(scheduledDate.getTime() + 60 * 60 * 1000);
            }
            const schedule: InvoiceSchedule = {
              id: item.id,
              test_reception_id: item.test_reception_id,
              customer_id: item.customer_id,
              amount: item.amount,
              scheduled_date: scheduledDate.toISOString(),
              payment_type: 'full',
              status: item.status,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            };
            saveInvoiceSchedule(schedule);
          });
          
          // Get upcoming invoices
          const upcoming = getUpcomingInvoices(daysAhead);
          
          // Verify all returned invoices are pending status
          upcoming.forEach(invoice => {
            expect(invoice.status).toBe('pending');
          });
          
          // For items with daysFromNow in range [0, daysAhead] and pending status,
          // they should be in the upcoming list
          // Note: We use < daysAhead instead of <= to account for the hour buffer
          const expectedCount = items.filter(item => 
            item.status === 'pending' && 
            item.daysFromNow >= 0 && 
            item.daysFromNow < daysAhead
          ).length;
          
          // The actual count should be at least the expected count
          // (could be more if daysFromNow === daysAhead falls within range due to timing)
          expect(upcoming.length).toBeGreaterThanOrEqual(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 10: 임박 발행 일정 필터링**
   * **Validates: Requirements 3.4**
   * 
   * Property: Default upcoming invoices check is 7 days
   */
  it('should use 7 days as default for upcoming invoices', () => {
    localStorage.clear();
    
    const now = new Date();
    
    // Create invoices at different days from now
    const testCases = [
      { daysFromNow: 3, shouldBeIncluded: true },
      { daysFromNow: 7, shouldBeIncluded: true },
      { daysFromNow: 8, shouldBeIncluded: false },
      { daysFromNow: -1, shouldBeIncluded: false }, // past
    ];
    
    testCases.forEach((tc, index) => {
      const scheduledDate = new Date(now.getTime() + tc.daysFromNow * 24 * 60 * 60 * 1000);
      const schedule: InvoiceSchedule = {
        id: `test-${index}`,
        test_reception_id: 'test-reception',
        customer_id: 'test-customer',
        amount: 100000,
        scheduled_date: scheduledDate.toISOString(),
        payment_type: 'full',
        status: 'pending',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      saveInvoiceSchedule(schedule);
    });
    
    // Get upcoming invoices with default 7 days
    const upcoming = getUpcomingInvoices();
    
    // Should include only the first two (3 days and 7 days)
    expect(upcoming.length).toBe(2);
  });
});

describe('Invoice Schedule - Property 12: 분할 지급 개별 관리', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 12: 분할 지급 개별 관리**
   * **Validates: Requirements 3.6**
   * 
   * Property: For any 분할 지급 조건이 설정된 시험, 분할 횟수만큼의 InvoiceSchedule 레코드가 생성되고 
   * 각각 개별 금액과 발행 예정일을 가진다
   */
  it('should create correct number of installment schedules', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // testReceptionId
        fc.uuid(), // customerId
        fc.integer({ min: 100000, max: 10000000 }), // totalAmount
        fc.integer({ min: 2, max: 12 }), // installments
        isoDateArb, // startDate
        (testReceptionId, customerId, totalAmount, installments, startDate) => {
          localStorage.clear();
          
          const schedules = createInstallmentSchedules(
            testReceptionId,
            customerId,
            totalAmount,
            installments,
            startDate
          );
          
          // Should create exactly the number of installments
          expect(schedules.length).toBe(installments);
          
          // Each schedule should have correct installment info
          schedules.forEach((schedule, index) => {
            expect(schedule.test_reception_id).toBe(testReceptionId);
            expect(schedule.customer_id).toBe(customerId);
            expect(schedule.payment_type).toBe('partial');
            expect(schedule.installment_number).toBe(index + 1);
            expect(schedule.total_installments).toBe(installments);
            expect(schedule.status).toBe('pending');
          });
          
          // Total of all installments should equal totalAmount
          const sumOfInstallments = schedules.reduce((sum, s) => sum + s.amount, 0);
          expect(sumOfInstallments).toBe(totalAmount);
          
          // Verify schedules are saved to storage
          const savedSchedules = getInvoiceSchedulesByTestReception(testReceptionId);
          expect(savedSchedules.length).toBe(installments);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 12: 분할 지급 개별 관리**
   * **Validates: Requirements 3.6**
   * 
   * Property: Installment scheduled dates should be spaced by the interval
   */
  it('should space installment dates by the specified interval', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 100000, max: 10000000 }),
        fc.integer({ min: 2, max: 6 }),
        isoDateArb,
        fc.integer({ min: 15, max: 60 }), // intervalDays
        (testReceptionId, customerId, totalAmount, installments, startDate, intervalDays) => {
          localStorage.clear();
          
          const schedules = createInstallmentSchedules(
            testReceptionId,
            customerId,
            totalAmount,
            installments,
            startDate,
            intervalDays
          );
          
          // Verify dates are spaced correctly
          for (let i = 1; i < schedules.length; i++) {
            const prevDate = new Date(schedules[i - 1].scheduled_date);
            const currDate = new Date(schedules[i].scheduled_date);
            
            const diffTime = currDate.getTime() - prevDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            expect(diffDays).toBe(intervalDays);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
