// src/routes/paymentSchedules.ts
// 지급 일정 관리 API
// Requirements: 4.3, 4.6, 4.7

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { PaymentScheduleService, PaymentStatus, CreatePaymentScheduleDTO } from '../services/paymentScheduleService';

const router = Router();
const paymentScheduleService = new PaymentScheduleService();

router.use(authenticate);

/**
 * POST /api/payment-schedules
 * 지급 일정 생성
 * Requirements 4.3: PER_TEST인 경우 Payment_Schedule 모델을 통해 시험번호별 금액과 지급 일정을 관리
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      contractId,
      testReceptionId,
      testNumber,
      amount,
      scheduledDate,
      notes,
    } = req.body;

    // 필수 필드 검증
    if (!contractId) {
      return res.status(400).json({
        success: false,
        message: '계약 ID가 필요합니다.',
      });
    }

    if (amount === undefined || amount === null || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 금액을 입력해주세요.',
      });
    }

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: '예정일을 입력해주세요.',
      });
    }

    // 계약 존재 확인
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '계약을 찾을 수 없습니다.',
      });
    }

    // 지급 일정 생성
    const schedule = await prisma.paymentSchedule.create({
      data: {
        contractId,
        testReceptionId: testReceptionId || null,
        testNumber: testNumber || null,
        amount: new Prisma.Decimal(amount),
        scheduledDate: new Date(scheduledDate),
        status: 'PENDING',
        notes: notes || null,
      },
    });

    res.status(201).json({
      success: true,
      data: { schedule },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payment-schedules/bulk
 * 지급 일정 일괄 생성
 * Requirements 4.3: 시험번호별 금액과 지급 일정을 관리
 */
router.post('/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId, schedules } = req.body;

    // 필수 필드 검증
    if (!contractId) {
      return res.status(400).json({
        success: false,
        message: '계약 ID가 필요합니다.',
      });
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: '최소 1개 이상의 지급 일정이 필요합니다.',
      });
    }

    // 각 일정 데이터 검증
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      if (!s.amount || s.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: `지급 일정 ${i + 1}: 유효한 금액을 입력해주세요.`,
        });
      }
      if (!s.scheduledDate) {
        return res.status(400).json({
          success: false,
          message: `지급 일정 ${i + 1}: 예정일을 입력해주세요.`,
        });
      }
    }

    // 서비스를 통해 일괄 생성
    const scheduleDTOs: CreatePaymentScheduleDTO[] = schedules.map((s: any) => ({
      testReceptionId: s.testReceptionId,
      testNumber: s.testNumber,
      amount: s.amount,
      scheduledDate: new Date(s.scheduledDate),
      notes: s.notes,
    }));

    try {
      const createdSchedules = await paymentScheduleService.createSchedules(contractId, scheduleDTOs);
      
      res.status(201).json({
        success: true,
        data: { schedules: createdSchedules },
      });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message === '계약을 찾을 수 없습니다') {
          return res.status(404).json({ success: false, message: serviceError.message });
        }
        if (serviceError.message.includes('지급 금액 합계')) {
          return res.status(400).json({ success: false, message: serviceError.message });
        }
      }
      throw serviceError;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/payment-schedules/:id/status
 * 지급 상태 변경
 * Requirements 4.6: Payment_Schedule의 status가 PAID로 변경되면 Contract의 paidAmount를 자동으로 업데이트
 */
router.put('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, paidDate } = req.body;

    // 상태 유효성 검사
    const validStatuses: PaymentStatus[] = ['PENDING', 'SCHEDULED', 'PAID', 'OVERDUE'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태입니다. (PENDING, SCHEDULED, PAID, OVERDUE 중 선택)',
      });
    }

    try {
      const updatedSchedule = await paymentScheduleService.updateScheduleStatus(
        id,
        status,
        paidDate ? new Date(paidDate) : undefined
      );

      // 업데이트된 계약 정보도 함께 조회
      const contract = await prisma.contract.findUnique({
        where: { id: updatedSchedule.contractId },
        select: {
          id: true,
          paidAmount: true,
          totalAmount: true,
          status: true,
        },
      });

      res.json({
        success: true,
        data: {
          schedule: updatedSchedule,
          contract,
        },
      });
    } catch (serviceError) {
      if (serviceError instanceof Error && serviceError.message === '지급 일정을 찾을 수 없습니다') {
        return res.status(404).json({ success: false, message: serviceError.message });
      }
      throw serviceError;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payment-schedules/by-contract/:contractId
 * 계약별 지급 일정 조회
 * Requirements 4.7: 계약서별 지급 현황(총액, 지급완료액, 잔액)을 조회
 */
router.get('/by-contract/:contractId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;

    try {
      const summary = await paymentScheduleService.getContractPaymentSummary(contractId);

      res.json({
        success: true,
        data: {
          schedules: summary.schedules,
          summary: {
            totalAmount: summary.totalAmount,
            paidAmount: summary.paidAmount,
            remainingAmount: summary.remainingAmount,
            completionRate: summary.completionRate,
          },
        },
      });
    } catch (serviceError) {
      if (serviceError instanceof Error && serviceError.message === '계약을 찾을 수 없습니다') {
        return res.status(404).json({ success: false, message: serviceError.message });
      }
      throw serviceError;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payment-schedules/:id
 * 지급 일정 단건 조회
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const schedule = await paymentScheduleService.getScheduleById(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '지급 일정을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: { schedule },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/payment-schedules/:id
 * 지급 일정 수정
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { testReceptionId, testNumber, amount, scheduledDate, notes } = req.body;

    // 지급 일정 존재 확인
    const existingSchedule = await prisma.paymentSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: '지급 일정을 찾을 수 없습니다.',
      });
    }

    // 이미 PAID 상태인 경우 수정 불가
    if (existingSchedule.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: '이미 지급 완료된 일정은 수정할 수 없습니다.',
      });
    }

    // 업데이트 데이터 준비
    const updateData: any = {};
    if (testReceptionId !== undefined) updateData.testReceptionId = testReceptionId;
    if (testNumber !== undefined) updateData.testNumber = testNumber;
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: '유효한 금액을 입력해주세요.',
        });
      }
      updateData.amount = new Prisma.Decimal(amount);
    }
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);
    if (notes !== undefined) updateData.notes = notes;

    const updatedSchedule = await prisma.paymentSchedule.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { schedule: updatedSchedule },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/payment-schedules/:id
 * 지급 일정 삭제
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    try {
      await paymentScheduleService.deleteSchedule(id);

      res.json({
        success: true,
        message: '지급 일정이 삭제되었습니다.',
      });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message === '지급 일정을 찾을 수 없습니다') {
          return res.status(404).json({ success: false, message: serviceError.message });
        }
        if (serviceError.message === '이미 지급 완료된 일정은 삭제할 수 없습니다') {
          return res.status(400).json({ success: false, message: serviceError.message });
        }
      }
      throw serviceError;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payment-schedules/update-overdue
 * 연체 상태 일괄 업데이트 (관리자용)
 */
router.post('/update-overdue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedCount = await paymentScheduleService.updateOverdueSchedules();

    res.json({
      success: true,
      data: {
        updatedCount,
        message: `${updatedCount}개의 지급 일정이 연체 상태로 변경되었습니다.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
