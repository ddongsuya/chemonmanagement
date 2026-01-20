// src/routes/leads.ts
// 리드 관리 API

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { LeadStatus, LeadSource } from '@prisma/client';

const router = Router();

// 모든 라우트에 인증 적용
router.use(authenticate);

// 리드 목록 조회
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { status, stageId, search, page = '1', limit = '20' } = req.query;

    const where: any = { userId, deletedAt: null };
    
    if (status) where.status = status as LeadStatus;
    if (stageId) where.stageId = stageId as string;
    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { contactName: { contains: search as string, mode: 'insensitive' } },
        { leadNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          stage: true,
          customer: true,
          _count: { select: { activities: true, quotations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        leads,
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

// 리드 상세 조회
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const lead = await prisma.lead.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        stage: { include: { tasks: true } },
        customer: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 10 },
        taskCompletions: { include: { task: true } },
        quotations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: '리드를 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: { lead } });
  } catch (error) {
    next(error);
  }
});

// 리드 생성
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      department,
      position,
      source,
      inquiryType,
      inquiryDetail,
      expectedAmount,
      expectedDate,
      stageId,
    } = req.body;

    // 리드 번호 생성
    const year = new Date().getFullYear();
    const count = await prisma.lead.count({
      where: { leadNumber: { startsWith: `LD-${year}` } },
    });
    const leadNumber = `LD-${year}-${String(count + 1).padStart(4, '0')}`;

    // 기본 단계 조회 (stageId가 없으면)
    let finalStageId = stageId;
    if (!finalStageId) {
      const defaultStage = await prisma.pipelineStage.findFirst({
        where: { isDefault: true, isActive: true },
      });
      finalStageId = defaultStage?.id;
    }

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        userId,
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        department,
        position,
        source: source || LeadSource.OTHER,
        inquiryType,
        inquiryDetail,
        expectedAmount,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        stageId: finalStageId,
        status: LeadStatus.NEW,
      },
      include: { stage: true },
    });

    res.status(201).json({ success: true, data: { lead } });
  } catch (error) {
    next(error);
  }
});

// 리드 수정
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const updateData = req.body;

    const existing = await prisma.lead.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '리드를 찾을 수 없습니다.' });
    }

    if (updateData.expectedDate) {
      updateData.expectedDate = new Date(updateData.expectedDate);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: { stage: true, customer: true },
    });

    res.json({ success: true, data: { lead } });
  } catch (error) {
    next(error);
  }
});

// 리드 단계 변경
router.patch('/:id/stage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stageId } = req.body;
    const userId = (req as any).user.id;

    const lead = await prisma.lead.update({
      where: { id },
      data: { stageId },
      include: { stage: true },
    });

    res.json({ success: true, data: { lead } });
  } catch (error) {
    next(error);
  }
});

// 리드 상태 변경
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, lostReason } = req.body;

    const updateData: any = { status };
    if (status === LeadStatus.LOST && lostReason) {
      updateData.lostReason = lostReason;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: { stage: true },
    });

    res.json({ success: true, data: { lead } });
  } catch (error) {
    next(error);
  }
});

// 리드 → 고객 전환
router.post('/:id/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const lead = await prisma.lead.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: '리드를 찾을 수 없습니다.' });
    }

    // 고객 생성
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: lead.contactName,
        company: lead.companyName,
        email: lead.contactEmail,
        phone: lead.contactPhone,
        grade: 'CUSTOMER',
      },
    });

    // 리드 업데이트
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        customerId: customer.id,
        convertedAt: new Date(),
        status: LeadStatus.CONVERTED,
      },
      include: { customer: true, stage: true },
    });

    res.json({ success: true, data: { lead: updatedLead, customer } });
  } catch (error) {
    next(error);
  }
});

// 리드 삭제 (소프트 삭제)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: '리드가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 리드 활동 추가
router.post('/:id/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { type, subject, content, contactedAt, nextAction, nextDate } = req.body;

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId,
        type,
        subject,
        content,
        contactedAt: contactedAt ? new Date(contactedAt) : new Date(),
        nextAction,
        nextDate: nextDate ? new Date(nextDate) : null,
      },
    });

    res.status(201).json({ success: true, data: { activity } });
  } catch (error) {
    next(error);
  }
});

// 리드 태스크 완료 처리
router.post('/:id/tasks/:taskId/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, taskId } = req.params;
    const userId = (req as any).user.id;
    const { notes } = req.body;

    const completion = await prisma.leadTaskCompletion.upsert({
      where: { leadId_taskId: { leadId: id, taskId } },
      update: { notes, completedBy: userId, completedAt: new Date() },
      create: { leadId: id, taskId, completedBy: userId, notes },
      include: { task: true },
    });

    res.json({ success: true, data: { completion } });
  } catch (error) {
    next(error);
  }
});

export default router;
