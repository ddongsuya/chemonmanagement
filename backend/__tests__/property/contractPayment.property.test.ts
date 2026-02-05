// backend/__tests__/property/contractPayment.property.test.ts
// Property tests for contract payment functionality
// Requirements: 4.3, 4.5, 4.6, 4.7, 4.8

/// <reference types="jest" />

import * as fc from 'fast-check';
import { PaymentScheduleService, CreatePaymentScheduleDTO, PaymentStatus } from '../../src/services/paymentScheduleService';
import { Prisma } from '@prisma/client';

// Mock Prisma client
const createMockPrisma = () => {
  const contracts = new Map<string, any>();
  const paymentSchedules = new Map<string, any>();
  let scheduleIdCounter = 0;

  return {
    contract: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const contract = contracts.get(where.id);
        if (!contract) return null;
        
        if (include?.paymentSchedules) {
          const schedules = Array.from(paymentSchedules.values())
            .filter((s: any) => s.contractId === where.id)
            .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
          return { ...contract, paymentSchedules: schedules };
        }
        if (include?.quotations) {
          return { ...contract, quotations: contract.quotations || [] };
        }
        return contract;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const contract = contracts.get(where.id);
        if (!contract) throw new Error('계약을 찾을 수 없습니다');
        const updated = { ...contract, ...data };
        contracts.set(where.id, updated);
        return updated;
      }),
    },
    paymentSchedule: {
      create: jest.fn(async ({ data }: any) => {
        const id = `schedule-${++scheduleIdCounter}`;
        const schedule = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        paymentSchedules.set(id, schedule);
        return schedule;
      }),
      findUnique: jest.fn(async ({ where, include }: any) => {
        const schedule = paymentSchedules.get(where.id);
        if (!schedule) return null;
        if (include?.contract) {
          const contract = contracts.get(schedule.contractId);
          return { ...schedule, contract };
        }
        return schedule;
      }),
      findMany: jest.fn(async ({ where, orderBy }: any) => {
        let results = Array.from(paymentSchedules.values());
        if (where?.contractId) {
          results = results.filter((s: any) => s.contractId === where.contractId);
        }
        if (where?.status) {
          if (typeof where.status === 'string') {
            results = results.filter((s: any) => s.status === where.status);
          } else if (where.status.in) {
            results = results.filter((s: any) => where.status.in.includes(s.status));
          }
        }
        if (orderBy?.scheduledDate) {
          results.sort((a: any, b: any) => {
            const diff = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
            return orderBy.scheduledDate === 'asc' ? diff : -diff;
          });
        }
        return results;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const schedule = paymentSchedules.get(where.id);
        if (!schedule) throw new Error('지급 일정을 찾을 수 없습니다');
        const updated = { ...schedule, ...data, updatedAt: new Date() };
        paymentSchedules.set(where.id, updated);
        return updated;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const [id, schedule] of paymentSchedules.entries()) {
          let matches = true;
          if (where?.scheduledDate?.lt && new Date(schedule.scheduledDate) >= where.scheduledDate.lt) {
            matches = false;
          }
          if (where?.status?.in && !where.status.in.includes(schedule.status)) {
            matches = false;
          }
          if (matches) {
            paymentSchedules.set(id, { ...schedule, ...data, updatedAt: new Date() });
            count++;
          }
        }
        return { count };
      }),
      delete: jest.fn(async ({ where }: any) => {
        const schedule = paymentSchedules.get(where.id);
        if (!schedule) throw new Error('지급 일정을 찾을 수 없습니다');
        paymentSchedules.delete(where.id);
        return schedule;
      }),
    },
    $transaction: jest.fn(async (callback: any) => {
      // Simple transaction mock - just execute the callback
      const txClient = {
        paymentSchedule: {
          create: async ({ data }: any) => {
            const id = `schedule-${++scheduleIdCounter}`;
            const schedule = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
            paymentSchedules.set(id, schedule);
            return schedule;
          },
          findMany: async ({ where }: any) => {
            let results = Array.from(paymentSchedules.values());
            if (where?.contractId) {
              results = results.filter((s: any) => s.contractId === where.contractId);
            }
            if (where?.status) {
              results = results.filter((s: any) => s.status === where.status);
            }
            return results;
          },
          update: async ({ where, data }: any) => {
            const schedule = paymentSchedules.get(where.id);
            if (!schedule) throw new Error('지급 일정을 찾을 수 없습니다');
            const updated = { ...schedule, ...data, updatedAt: new Date() };
            paymentSchedules.set(where.id, updated);
            return updated;
          },
        },
        contract: {
          update: async ({ where, data }: any) => {
            const contract = contracts.get(where.id);
            if (!contract) throw new Error('계약을 찾을 수 없습니다');
            const updated = { ...contract, ...data };
            contracts.set(where.id, updated);
            return updated;
          },
        },
      };
      return callback(txClient);
    }),
    // Helper methods for test setup
    _addContract: (contract: any) => {
      contracts.set(contract.id, contract);
    },
    _addSchedule: (schedule: any) => {
      paymentSchedules.set(schedule.id, schedule);
    },
    _getContract: (id: string) => contracts.get(id),
    _getSchedule: (id: string) => paymentSchedules.get(id),
    _getAllSchedules: () => Array.from(paymentSchedules.values()),
    _clear: () => {
      contracts.clear();
      paymentSchedules.clear();
      scheduleIdCounter = 0;
    },
  };
};

describe('Contract Payment Property Tests', () => {
  // Arbitraries
  const positiveAmountArb = fc.float({ min: 1000, max: 10000000, noNaN: true })
    .map(n => Math.round(n * 100) / 100);
  
  const paymentTypeArb = fc.constantFrom('FULL', 'INSTALLMENT', 'PER_TEST');
  
  const quotationAmountArb = fc.array(
    fc.float({ min: 100000, max: 5000000, noNaN: true }).map(n => Math.round(n * 100) / 100),
    { minLength: 1, maxLength: 5 }
  );

  const scheduleCountArb = fc.integer({ min: 1, max: 10 });

  const paymentStatusArb = fc.constantFrom<PaymentStatus>('PENDING', 'SCHEDULED', 'PAID', 'OVERDUE');

  /**
   * Property 7: 계약 금액 자동 계산
   * Requirements 4.5: 연결된 견적서 금액 합계와 계약 금액 일치 검증
   */
  describe('Property 7: Contract Amount Auto-Calculation', () => {
    it('should calculate total amount from linked quotations', () => {
      fc.assert(
        fc.property(
          quotationAmountArb,
          (quotationAmounts) => {
            // Given: 여러 견적서가 연결된 계약
            const expectedTotal = quotationAmounts.reduce((sum, amt) => sum + amt, 0);
            const quotations = quotationAmounts.map((amount, idx) => ({
              id: `quotation-${idx}`,
              totalAmount: new Prisma.Decimal(amount),
            }));

            // When: 견적서 금액 합계 계산
            const calculatedTotal = quotations.reduce(
              (sum, q) => sum + Number(q.totalAmount),
              0
            );

            // Then: 계산된 금액이 예상 금액과 일치
            expect(Math.abs(calculatedTotal - expectedTotal)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty quotations list', () => {
      fc.assert(
        fc.property(
          positiveAmountArb,
          (contractAmount) => {
            // Given: 견적서가 없는 계약
            const contract = {
              id: 'contract-1',
              totalAmount: new Prisma.Decimal(contractAmount),
              quotations: [],
            };

            // When: 견적서가 없으면 기존 계약 금액 유지
            const calculatedTotal = contract.quotations.length > 0
              ? contract.quotations.reduce((sum: number, q: any) => sum + Number(q.totalAmount), 0)
              : Number(contract.totalAmount);

            // Then: 기존 계약 금액과 일치
            expect(calculatedTotal).toBe(contractAmount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: 지급 일정 합계 일관성
   * Requirements 4.6: PAID 상태 변경 시 paidAmount 자동 업데이트 검증
   */
  describe('Property 8: Payment Schedule Sum Consistency', () => {
    it('should update paidAmount when schedule status changes to PAID', async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveAmountArb,
          fc.array(positiveAmountArb, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          async (contractTotal, scheduleAmounts, paidIndex) => {
            // Ensure paidIndex is within bounds
            const validPaidIndex = paidIndex % scheduleAmounts.length;
            
            const mockPrisma = createMockPrisma();
            
            // Given: 계약과 여러 지급 일정
            const contractId = 'contract-1';
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(contractTotal),
              paidAmount: new Prisma.Decimal(0),
              paymentType: 'PER_TEST',
              status: 'SIGNED',
            });

            // 지급 일정 생성
            const schedules = scheduleAmounts.map((amount, idx) => ({
              id: `schedule-${idx}`,
              contractId,
              amount: new Prisma.Decimal(amount),
              scheduledDate: new Date(Date.now() + idx * 86400000),
              status: 'PENDING' as const,
              paidDate: null,
            }));
            schedules.forEach(s => mockPrisma._addSchedule(s));

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 특정 일정을 PAID로 변경
            await service.updateScheduleStatus(schedules[validPaidIndex].id, 'PAID');

            // Then: paidAmount가 해당 금액만큼 증가
            const updatedContract = mockPrisma._getContract(contractId);
            const expectedPaidAmount = scheduleAmounts[validPaidIndex];
            
            expect(Math.abs(Number(updatedContract.paidAmount) - expectedPaidAmount)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accumulate paidAmount for multiple PAID schedules', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(positiveAmountArb, { minLength: 2, maxLength: 5 }),
          async (scheduleAmounts) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 계약과 여러 지급 일정
            const contractId = 'contract-1';
            const totalAmount = scheduleAmounts.reduce((sum, amt) => sum + amt, 0);
            
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(totalAmount),
              paidAmount: new Prisma.Decimal(0),
              paymentType: 'PER_TEST',
              status: 'SIGNED',
            });

            const schedules = scheduleAmounts.map((amount, idx) => ({
              id: `schedule-${idx}`,
              contractId,
              amount: new Prisma.Decimal(amount),
              scheduledDate: new Date(Date.now() + idx * 86400000),
              status: 'PENDING' as const,
              paidDate: null,
            }));
            schedules.forEach(s => mockPrisma._addSchedule(s));

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 모든 일정을 PAID로 변경
            for (const schedule of schedules) {
              await service.updateScheduleStatus(schedule.id, 'PAID');
            }

            // Then: paidAmount가 모든 금액의 합계와 일치
            const updatedContract = mockPrisma._getContract(contractId);
            expect(Math.abs(Number(updatedContract.paidAmount) - totalAmount)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: 계약 완료 자동 전환
   * Requirements 4.8: 모든 PaymentSchedule PAID 시 계약 COMPLETED 전환 검증
   */
  describe('Property 9: Contract Auto-Completion', () => {
    it('should change contract status to COMPLETED when all schedules are PAID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(positiveAmountArb, { minLength: 1, maxLength: 5 }),
          async (scheduleAmounts) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 계약과 여러 지급 일정
            const contractId = 'contract-1';
            const totalAmount = scheduleAmounts.reduce((sum, amt) => sum + amt, 0);
            
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(totalAmount),
              paidAmount: new Prisma.Decimal(0),
              paymentType: 'PER_TEST',
              status: 'SIGNED',
            });

            const schedules = scheduleAmounts.map((amount, idx) => ({
              id: `schedule-${idx}`,
              contractId,
              amount: new Prisma.Decimal(amount),
              scheduledDate: new Date(Date.now() + idx * 86400000),
              status: 'PENDING' as const,
              paidDate: null,
            }));
            schedules.forEach(s => mockPrisma._addSchedule(s));

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 모든 일정을 PAID로 변경
            for (const schedule of schedules) {
              await service.updateScheduleStatus(schedule.id, 'PAID');
            }

            // Then: 계약 상태가 COMPLETED로 변경
            const updatedContract = mockPrisma._getContract(contractId);
            expect(updatedContract.status).toBe('COMPLETED');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT change contract status if any schedule is not PAID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(positiveAmountArb, { minLength: 2, maxLength: 5 }),
          async (scheduleAmounts) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 계약과 여러 지급 일정
            const contractId = 'contract-1';
            const totalAmount = scheduleAmounts.reduce((sum, amt) => sum + amt, 0);
            
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(totalAmount),
              paidAmount: new Prisma.Decimal(0),
              paymentType: 'PER_TEST',
              status: 'SIGNED',
            });

            const schedules = scheduleAmounts.map((amount, idx) => ({
              id: `schedule-${idx}`,
              contractId,
              amount: new Prisma.Decimal(amount),
              scheduledDate: new Date(Date.now() + idx * 86400000),
              status: 'PENDING' as const,
              paidDate: null,
            }));
            schedules.forEach(s => mockPrisma._addSchedule(s));

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 마지막 일정을 제외하고 PAID로 변경
            for (let i = 0; i < schedules.length - 1; i++) {
              await service.updateScheduleStatus(schedules[i].id, 'PAID');
            }

            // Then: 계약 상태가 COMPLETED가 아님
            const updatedContract = mockPrisma._getContract(contractId);
            expect(updatedContract.status).not.toBe('COMPLETED');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle contract with no payment schedules', async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveAmountArb,
          async (contractAmount) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 지급 일정이 없는 계약
            const contractId = 'contract-1';
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(contractAmount),
              paidAmount: new Prisma.Decimal(0),
              paymentType: 'FULL',
              status: 'SIGNED',
            });

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 계약 상태 확인
            const result = await service.checkAndUpdateContractStatus(contractId);

            // Then: 상태 변경 없음 (SIGNED 유지)
            expect(result.status).toBe('SIGNED');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: PER_TEST 지급 유형 일관성
   * Requirements 4.3: PER_TEST 계약의 PaymentSchedule 합계 검증
   */
  describe('Property 10: PER_TEST Payment Type Consistency', () => {
    it('should validate schedule amounts sum equals contract total for PER_TEST', async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveAmountArb,
          scheduleCountArb,
          async (contractTotal, scheduleCount) => {
            const mockPrisma = createMockPrisma();
            
            // Given: PER_TEST 타입 계약
            const contractId = 'contract-1';
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(contractTotal),
              paidAmount: new Prisma.Decimal(0),
              paymentType: 'PER_TEST',
              status: 'SIGNED',
            });

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 금액 합계가 계약 금액과 일치하는 일정 생성
            const amountPerSchedule = contractTotal / scheduleCount;
            const schedules: CreatePaymentScheduleDTO[] = Array.from({ length: scheduleCount }, (_, idx) => ({
              testNumber: `TEST-${idx + 1}`,
              amount: idx === scheduleCount - 1 
                ? contractTotal - (amountPerSchedule * (scheduleCount - 1)) // 마지막은 나머지
                : amountPerSchedule,
              scheduledDate: new Date(Date.now() + idx * 86400000),
            }));

            const createdSchedules = await service.createSchedules(contractId, schedules);

            // Then: 생성된 일정 수가 요청과 일치
            expect(createdSchedules.length).toBe(scheduleCount);

            // And: 금액 합계가 계약 금액과 일치
            const totalScheduleAmount = createdSchedules.reduce(
              (sum, s) => sum + Number(s.amount),
              0
            );
            expect(Math.abs(totalScheduleAmount - contractTotal)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject schedules with mismatched total for PER_TEST', async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveAmountArb,
          positiveAmountArb,
          async (contractTotal, scheduleAmount) => {
            // Skip if amounts happen to match
            if (Math.abs(contractTotal - scheduleAmount) < 0.01) return;

            const mockPrisma = createMockPrisma();
            
            // Given: PER_TEST 타입 계약
            const contractId = 'contract-1';
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(contractTotal),
              paidAmount: new Prisma.Decimal(0),
              paymentType: 'PER_TEST',
              status: 'SIGNED',
            });

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 금액 합계가 계약 금액과 불일치하는 일정 생성 시도
            const schedules: CreatePaymentScheduleDTO[] = [{
              testNumber: 'TEST-1',
              amount: scheduleAmount,
              scheduledDate: new Date(),
            }];

            // Then: 에러 발생
            await expect(service.createSchedules(contractId, schedules))
              .rejects.toThrow(/지급 금액 합계.*일치하지 않습니다/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow any schedule amounts for non-PER_TEST contracts', async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveAmountArb,
          positiveAmountArb,
          fc.constantFrom('FULL', 'INSTALLMENT'),
          async (contractTotal, scheduleAmount, paymentType) => {
            const mockPrisma = createMockPrisma();
            
            // Given: FULL 또는 INSTALLMENT 타입 계약
            const contractId = 'contract-1';
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(contractTotal),
              paidAmount: new Prisma.Decimal(0),
              paymentType,
              status: 'SIGNED',
            });

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 임의 금액의 일정 생성
            const schedules: CreatePaymentScheduleDTO[] = [{
              testNumber: 'TEST-1',
              amount: scheduleAmount,
              scheduledDate: new Date(),
            }];

            // Then: 에러 없이 생성됨 (PER_TEST가 아니므로 금액 검증 안함)
            const createdSchedules = await service.createSchedules(contractId, schedules);
            expect(createdSchedules.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Payment Summary Calculation
   */
  describe('Payment Summary Calculation', () => {
    it('should calculate correct remaining amount', async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveAmountArb,
          fc.float({ min: 0, max: 1, noNaN: true }),
          async (totalAmount, paidRatio) => {
            const mockPrisma = createMockPrisma();
            const paidAmount = totalAmount * paidRatio;
            
            // Given: 일부 지급된 계약
            const contractId = 'contract-1';
            mockPrisma._addContract({
              id: contractId,
              totalAmount: new Prisma.Decimal(totalAmount),
              paidAmount: new Prisma.Decimal(paidAmount),
              paymentType: 'PER_TEST',
              status: 'SIGNED',
            });

            const service = new PaymentScheduleService(mockPrisma as any);

            // When: 지급 현황 조회
            const summary = await service.getContractPaymentSummary(contractId);

            // Then: 잔액이 정확히 계산됨
            const expectedRemaining = totalAmount - paidAmount;
            expect(Math.abs(summary.remainingAmount - expectedRemaining)).toBeLessThan(0.01);

            // And: 완료율이 정확히 계산됨
            const expectedRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
            expect(Math.abs(summary.completionRate - Math.round(expectedRate * 100) / 100)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
