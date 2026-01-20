// src/routes/studies.ts
// 시험 관리 API

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { StudyStatus } from '@prisma/client';

const router = Router();

router.use(authenticate);

// 시험 목록 조회
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, contractId, search, page = '1', limit = '20' } = req.query;

    const where: any = {};
    
    if (status) where.status = status as StudyStatus;
    if (contractId) where.contractId = contractId as string;
    if (search) {
      where.OR = [
        { studyNumber: { contains: search as string, mode: 'insensitive' } },
        { testName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [studies, total] = await Promise.all([
      prisma.study.findMany({
        where,
        include: {
          contract: {
            include: { customer: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.study.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        studies,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// 시험 상세 조회
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        contract: {
          include: { customer: true },
        },
      },
    });

    if (!study) {
      return res.status(404).json({ success: false, message: '시험을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: { study } });
  } catch (error) {
    next(error);
  }
});

// 시험 생성
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      contractId,
      studyType,
      testName,
      testItemId,
      receivedDate,
      startDate,
      expectedEndDate,
      notes,
    } = req.body;

    // 시험 번호 생성
    const year = new Date().getFullYear();
    const count = await prisma.study.count({
      where: { studyNumber: { startsWith: `ST-${year}` } },
    });
    const studyNumber = `ST-${year}-${String(count + 1).padStart(4, '0')}`;

    const study = await prisma.study.create({
      data: {
        studyNumber,
        contractId,
        studyType,
        testName,
        testItemId,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        notes,
        status: StudyStatus.REGISTERED,
      },
      include: { contract: { include: { customer: true } } },
    });

    // 계약 상태 업데이트
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'TEST_RECEIVED' },
    });

    res.status(201).json({ success: true, data: { study } });
  } catch (error) {
    next(error);
  }
});

// 시험 수정
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.receivedDate) updateData.receivedDate = new Date(updateData.receivedDate);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.expectedEndDate) updateData.expectedEndDate = new Date(updateData.expectedEndDate);
    if (updateData.actualEndDate) updateData.actualEndDate = new Date(updateData.actualEndDate);
    if (updateData.reportDraftDate) updateData.reportDraftDate = new Date(updateData.reportDraftDate);
    if (updateData.reportFinalDate) updateData.reportFinalDate = new Date(updateData.reportFinalDate);

    const study = await prisma.study.update({
      where: { id },
      data: updateData,
      include: { contract: { include: { customer: true } } },
    });

    res.json({ success: true, data: { study } });
  } catch (error) {
    next(error);
  }
});

// 시험 상태 변경
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData: any = { status };

    // 상태에 따른 날짜 자동 설정
    if (status === StudyStatus.IN_PROGRESS && !updateData.startDate) {
      updateData.startDate = new Date();
    }
    if (status === StudyStatus.COMPLETED) {
      updateData.actualEndDate = new Date();
    }

    const study = await prisma.study.update({
      where: { id },
      data: updateData,
    });

    // 계약 상태 업데이트
    if (status === StudyStatus.IN_PROGRESS) {
      await prisma.contract.update({
        where: { id: study.contractId },
        data: { status: 'IN_PROGRESS' },
      });
    } else if (status === StudyStatus.COMPLETED) {
      // 모든 시험이 완료되었는지 확인
      const incompleteStudies = await prisma.study.count({
        where: {
          contractId: study.contractId,
          status: { not: StudyStatus.COMPLETED },
        },
      });
      if (incompleteStudies === 0) {
        await prisma.contract.update({
          where: { id: study.contractId },
          data: { status: 'COMPLETED' },
        });
      }
    }

    res.json({ success: true, data: { study } });
  } catch (error) {
    next(error);
  }
});

// 시험 삭제
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.study.delete({ where: { id } });

    res.json({ success: true, message: '시험이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

export default router;
