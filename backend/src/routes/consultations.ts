// src/routes/consultations.ts
// 상담기록 API

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

// 상담기록 목록 조회
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { customerId, contractId, search, page = '1', limit = '20' } = req.query;

    const where: any = { userId, deletedAt: null };
    
    if (customerId) where.customerId = customerId as string;
    if (contractId) where.contractId = contractId as string;
    if (search) {
      where.OR = [
        { recordNumber: { contains: search as string, mode: 'insensitive' } },
        { substanceName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [records, total] = await Promise.all([
      prisma.consultationRecord.findMany({
        where,
        include: {
          customer: true,
          contract: true,
        },
        orderBy: { consultDate: 'desc' },
        skip,
        take,
      }),
      prisma.consultationRecord.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        records,
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

// 상담기록 상세 조회
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const record = await prisma.consultationRecord.findUnique({
      where: { id },
      include: {
        customer: true,
        contract: { include: { studies: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: '상담기록을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: { record } });
  } catch (error) {
    next(error);
  }
});

// 상담기록 생성
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const {
      customerId,
      contractId,
      customerInfo,
      testInfo,
      substanceInfo,
      substanceName,
      storageStatus,
      storageLocation,
      clientRequests,
      internalNotes,
      consultDate,
    } = req.body;

    // 상담기록 번호 생성
    const year = new Date().getFullYear();
    const count = await prisma.consultationRecord.count({
      where: { recordNumber: { startsWith: `CR-${year}` } },
    });
    const recordNumber = `CR-${year}-${String(count + 1).padStart(4, '0')}`;

    const record = await prisma.consultationRecord.create({
      data: {
        recordNumber,
        userId,
        customerId,
        contractId,
        customerInfo,
        testInfo,
        substanceInfo,
        substanceName,
        storageStatus,
        storageLocation,
        clientRequests,
        internalNotes,
        consultDate: consultDate ? new Date(consultDate) : new Date(),
      },
      include: { customer: true, contract: true },
    });

    res.status(201).json({ success: true, data: { record } });
  } catch (error) {
    next(error);
  }
});

// 상담기록 수정
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.consultDate) {
      updateData.consultDate = new Date(updateData.consultDate);
    }

    const record = await prisma.consultationRecord.update({
      where: { id },
      data: updateData,
      include: { customer: true, contract: true },
    });

    res.json({ success: true, data: { record } });
  } catch (error) {
    next(error);
  }
});

// 상담기록 삭제 (소프트 삭제)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.consultationRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: '상담기록이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 고객별 상담기록 조회
router.get('/customer/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;

    const records = await prisma.consultationRecord.findMany({
      where: { customerId, deletedAt: null },
      include: { contract: true },
      orderBy: { consultDate: 'desc' },
    });

    res.json({ success: true, data: { records } });
  } catch (error) {
    next(error);
  }
});

// 계약별 상담기록 조회
router.get('/contract/:contractId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;

    const records = await prisma.consultationRecord.findMany({
      where: { contractId, deletedAt: null },
      include: { customer: true },
      orderBy: { consultDate: 'desc' },
    });

    res.json({ success: true, data: { records } });
  } catch (error) {
    next(error);
  }
});

export default router;
