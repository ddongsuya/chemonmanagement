// backend/src/services/paymentScheduleService.ts
// 지급 일정 관리 서비스
// Requirements: 4.3, 4.6, 4.7, 4.8

import { PrismaClient, PaymentSchedule, Contract, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

/**
 * 지급 상태 타입
 */
export type PaymentStatus = 'PENDING' | 'SCHEDULED' | 'PAID' | 'OVERDUE';

/**
 * 지급 일정 생성 DTO
 */
export interface CreatePaymentScheduleDTO {
  testReceptionId?: string;
  testNumber?: string;
  amount: number;
  scheduledDate: Date;
  notes?: string;
}

/**
 * 지급 현황 요약 인터페이스
 * Requirements 4.7: 계약서별 지급 현황(총액, 지급완료액, 잔액)을 조회
 */
export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  schedules: PaymentSchedule[];
  completionRate: number;
}

/**
 * PaymentScheduleService
 * 
 * 지급 일정 관리를 담당하는 서비스입니다.
 * 
 * 주요 기능:
 * - 계약에 대한 지급 일정 생성
 * - 지급 상태 업데이트 및 계약 금액 자동 반영
 * - 계약별 지급 현황 조회
 * - 모든 지급 완료 시 계약 상태 자동 변경
 */
export class PaymentScheduleService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * 계약에 대한 지급 일정 생성
   * 
   * Requirements 4.3: PER_TEST인 경우 Payment_Schedule 모델을 통해 시험번호별 금액과 지급 일정을 관리
   * 
   * @param contractId - 계약 ID
   * @param schedules - 생성할 지급 일정 배열
   * @returns 생성된 지급 일정 배열
   * @throws Error 계약이 존재하지 않거나 금액 합계가 불일치하는 경우
   */
  async createSchedules(
    contractId: string,
    schedules: CreatePaymentScheduleDTO[]
  ): Promise<PaymentSchedule[]> {
    // 계약 존재 확인
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error('계약을 찾을 수 없습니다');
    }

    // 지급 일정이 비어있는 경우
    if (schedules.length === 0) {
      throw new Error('최소 1개 이상의 지급 일정이 필요합니다');
    }

    // 금액 합계 검증 (PER_TEST 타입인 경우)
    if (contract.paymentType === 'PER_TEST') {
      const totalScheduleAmount = schedules.reduce((sum, s) => sum + s.amount, 0);
      const contractTotalAmount = Number(contract.totalAmount);
      
      if (Math.abs(totalScheduleAmount - contractTotalAmount) > 0.01) {
        throw new Error(
          `지급 금액 합계(${totalScheduleAmount})가 계약 금액(${contractTotalAmount})과 일치하지 않습니다`
        );
      }
    }

    // 트랜잭션으로 모든 지급 일정 생성
    const createdSchedules = await this.prisma.$transaction(async (tx) => {
      const results: PaymentSchedule[] = [];

      for (const scheduleData of schedules) {
        const schedule = await tx.paymentSchedule.create({
          data: {
            contractId,
            testReceptionId: scheduleData.testReceptionId,
            testNumber: scheduleData.testNumber,
            amount: new Prisma.Decimal(scheduleData.amount),
            scheduledDate: scheduleData.scheduledDate,
            status: 'PENDING',
            notes: scheduleData.notes,
          },
        });
        results.push(schedule);
      }

      return results;
    });

    return createdSchedules;
  }

  /**
   * 지급 일정 상태 업데이트
   * 
   * Requirements 4.6: Payment_Schedule의 status가 PAID로 변경되면 Contract의 paidAmount를 자동으로 업데이트
   * 
   * @param scheduleId - 지급 일정 ID
   * @param status - 새로운 상태
   * @param paidDate - 지급일 (PAID 상태인 경우)
   * @returns 업데이트된 지급 일정
   * @throws Error 지급 일정이 존재하지 않는 경우
   */
  async updateScheduleStatus(
    scheduleId: string,
    status: PaymentStatus,
    paidDate?: Date
  ): Promise<PaymentSchedule> {
    // 지급 일정 존재 확인
    const schedule = await this.prisma.paymentSchedule.findUnique({
      where: { id: scheduleId },
      include: { contract: true },
    });

    if (!schedule) {
      throw new Error('지급 일정을 찾을 수 없습니다');
    }

    // 이미 PAID 상태인 경우 경고
    if (schedule.status === 'PAID' && status === 'PAID') {
      return schedule;
    }

    // 이전 상태 저장 (트랜잭션 내에서 비교용)
    const wasPreviouslyPaid = schedule.status === 'PAID';

    // 트랜잭션으로 상태 업데이트 및 계약 금액 반영
    const updatedSchedule = await this.prisma.$transaction(async (tx) => {
      // 지급 일정 상태 업데이트
      const updated = await tx.paymentSchedule.update({
        where: { id: scheduleId },
        data: {
          status,
          paidDate: status === 'PAID' ? (paidDate || new Date()) : null,
        },
      });

      // 상태 변경에 따른 계약 paidAmount 업데이트
      const needsRecalculation = status === 'PAID' || wasPreviouslyPaid;
      
      if (needsRecalculation) {
        // 해당 계약의 모든 PAID 상태 지급 일정 금액 합계 계산
        const paidSchedules = await tx.paymentSchedule.findMany({
          where: {
            contractId: schedule.contractId,
            status: 'PAID',
          },
        });

        const totalPaidAmount = paidSchedules.reduce(
          (sum, s) => sum + Number(s.amount),
          0
        );

        // 계약의 paidAmount 업데이트
        await tx.contract.update({
          where: { id: schedule.contractId },
          data: {
            paidAmount: new Prisma.Decimal(totalPaidAmount),
          },
        });
      }

      return updated;
    });

    // 계약 상태 자동 업데이트 확인
    await this.checkAndUpdateContractStatus(schedule.contractId);

    return updatedSchedule;
  }

  /**
   * 계약별 지급 현황 조회
   * 
   * Requirements 4.7: 계약서별 지급 현황(총액, 지급완료액, 잔액)을 조회할 수 있는 API를 제공
   * 
   * @param contractId - 계약 ID
   * @returns 지급 현황 요약
   * @throws Error 계약이 존재하지 않는 경우
   */
  async getContractPaymentSummary(contractId: string): Promise<PaymentSummary> {
    // 계약 조회
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        paymentSchedules: {
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });

    if (!contract) {
      throw new Error('계약을 찾을 수 없습니다');
    }

    const totalAmount = Number(contract.totalAmount);
    const paidAmount = Number(contract.paidAmount);
    const remainingAmount = totalAmount - paidAmount;
    const completionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      schedules: contract.paymentSchedules,
      completionRate: Math.round(completionRate * 100) / 100, // 소수점 2자리까지
    };
  }

  /**
   * 계약 상태 자동 업데이트 확인 및 실행
   * 
   * Requirements 4.8: 모든 Payment_Schedule이 PAID 상태가 되면 Contract의 status를 COMPLETED로 자동 변경
   * 
   * @param contractId - 계약 ID
   * @returns 업데이트된 계약
   * @throws Error 계약이 존재하지 않는 경우
   */
  async checkAndUpdateContractStatus(contractId: string): Promise<Contract> {
    // 계약 및 지급 일정 조회
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        paymentSchedules: true,
      },
    });

    if (!contract) {
      throw new Error('계약을 찾을 수 없습니다');
    }

    // 지급 일정이 없는 경우 현재 상태 유지
    if (contract.paymentSchedules.length === 0) {
      return contract;
    }

    // 모든 지급 일정이 PAID 상태인지 확인
    const allPaid = contract.paymentSchedules.every(
      (schedule) => schedule.status === 'PAID'
    );

    // 모든 지급이 완료되었고 현재 상태가 COMPLETED가 아닌 경우 상태 변경
    if (allPaid && contract.status !== 'COMPLETED') {
      const updatedContract = await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          status: 'COMPLETED',
        },
      });
      return updatedContract;
    }

    return contract;
  }

  /**
   * 특정 계약의 모든 지급 일정 조회
   * 
   * @param contractId - 계약 ID
   * @returns 지급 일정 배열
   */
  async getSchedulesByContractId(contractId: string): Promise<PaymentSchedule[]> {
    return this.prisma.paymentSchedule.findMany({
      where: { contractId },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  /**
   * 지급 일정 단건 조회
   * 
   * @param scheduleId - 지급 일정 ID
   * @returns 지급 일정 또는 null
   */
  async getScheduleById(scheduleId: string): Promise<PaymentSchedule | null> {
    return this.prisma.paymentSchedule.findUnique({
      where: { id: scheduleId },
    });
  }

  /**
   * 지급 일정 삭제
   * 
   * @param scheduleId - 지급 일정 ID
   * @returns 삭제된 지급 일정
   * @throws Error 지급 일정이 존재하지 않거나 이미 PAID 상태인 경우
   */
  async deleteSchedule(scheduleId: string): Promise<PaymentSchedule> {
    const schedule = await this.prisma.paymentSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error('지급 일정을 찾을 수 없습니다');
    }

    if (schedule.status === 'PAID') {
      throw new Error('이미 지급 완료된 일정은 삭제할 수 없습니다');
    }

    return this.prisma.paymentSchedule.delete({
      where: { id: scheduleId },
    });
  }

  /**
   * 연체 상태 일괄 업데이트
   * 
   * 예정일이 지났지만 PENDING 또는 SCHEDULED 상태인 일정을 OVERDUE로 변경
   * 
   * @returns 업데이트된 지급 일정 수
   */
  async updateOverdueSchedules(): Promise<number> {
    const now = new Date();
    
    const result = await this.prisma.paymentSchedule.updateMany({
      where: {
        scheduledDate: { lt: now },
        status: { in: ['PENDING', 'SCHEDULED'] },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return result.count;
  }
}

// 싱글톤 인스턴스 export
export const paymentScheduleService = new PaymentScheduleService();

export default PaymentScheduleService;
