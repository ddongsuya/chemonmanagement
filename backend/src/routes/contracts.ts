// src/routes/contracts.ts
// 계약 관리 API

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { ContractStatus } from '@prisma/client';

const router = Router();

router.use(authenticate);

// 계약 목록 조회
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { status, customerId, search, page = '1', limit = '20' } = req.query;

    const where: any = { userId, deletedAt: null };
    
    if (status) where.status = status as ContractStatus;
    if (customerId) where.customerId = customerId as string;
    if (search) {
      where.OR = [
        { contractNumber: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          customer: true,
          quotations: { select: { id: true, quotationNumber: true } },
          _count: { select: { studies: true, amendments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.contract.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        contracts,
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

// 계약 상세 조회
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        customer: true,
        quotations: true,
        amendments: { orderBy: { version: 'desc' } },
        studies: { orderBy: { createdAt: 'desc' } },
        consultations: { orderBy: { consultDate: 'desc' } },
      },
    });

    if (!contract) {
      return res.status(404).json({ success: false, message: '계약을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: { contract } });
  } catch (error) {
    next(error);
  }
});

// 계약 생성
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const {
      customerId,
      title,
      contractType,
      totalAmount,
      signedDate,
      startDate,
      endDate,
      terms,
      notes,
      quotationIds,
    } = req.body;

    // 계약 번호 생성
    const year = new Date().getFullYear();
    const count = await prisma.contract.count({
      where: { contractNumber: { startsWith: `CT-${year}` } },
    });
    const contractNumber = `CT-${year}-${String(count + 1).padStart(4, '0')}`;

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        userId,
        customerId,
        title,
        contractType,
        totalAmount,
        signedDate: signedDate ? new Date(signedDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        terms,
        notes,
        status: signedDate ? ContractStatus.SIGNED : ContractStatus.NEGOTIATING,
        quotations: quotationIds ? { connect: quotationIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { customer: true, quotations: true },
    });

    res.status(201).json({ success: true, data: { contract } });
  } catch (error) {
    next(error);
  }
});

// 계약 수정
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.signedDate) updateData.signedDate = new Date(updateData.signedDate);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: { customer: true },
    });

    res.json({ success: true, data: { contract } });
  } catch (error) {
    next(error);
  }
});

// 계약 상태 변경
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contract = await prisma.contract.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: { contract } });
  } catch (error) {
    next(error);
  }
});

// 계약 삭제 (소프트 삭제)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: '계약이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 변경계약서 생성
router.post('/:id/amendments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, changes, amountChange, newTotalAmount, newEndDate, signedDate } = req.body;

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      return res.status(404).json({ success: false, message: '계약을 찾을 수 없습니다.' });
    }

    // 변경계약 번호 생성
    const amendmentCount = await prisma.contractAmendment.count({ where: { contractId: id } });
    const version = amendmentCount + 1;
    const amendmentNumber = `${contract.contractNumber}-A${version}`;

    const amendment = await prisma.contractAmendment.create({
      data: {
        amendmentNumber,
        contractId: id,
        version,
        reason,
        changes,
        amountChange,
        newTotalAmount,
        newEndDate: newEndDate ? new Date(newEndDate) : null,
        signedDate: signedDate ? new Date(signedDate) : null,
      },
    });

    // 계약 총액 업데이트
    if (newTotalAmount) {
      await prisma.contract.update({
        where: { id },
        data: { totalAmount: newTotalAmount },
      });
    }

    res.status(201).json({ success: true, data: { amendment } });
  } catch (error) {
    next(error);
  }
});

// 변경계약서 목록 조회
router.get('/:id/amendments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const amendments = await prisma.contractAmendment.findMany({
      where: { contractId: id },
      orderBy: { version: 'desc' },
    });

    res.json({ success: true, data: { amendments } });
  } catch (error) {
    next(error);
  }
});

export default router;
