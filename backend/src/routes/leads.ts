// src/routes/leads.ts
// 리드 관리 API

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { LeadStatus, LeadSource } from '@prisma/client';
import { dataSyncService } from '../services/dataSyncService';
import { leadNumberService, UserCodeNotSetError } from '../services/leadNumberService';

const router = Router();

// 모든 라우트에 인증 적용
router.use(authenticate);

// 리드 목록 조회
// IMMUTABILITY GUARANTEE (Requirements 5.5, 3.5):
// This endpoint returns leadNumber exactly as stored in the database.
// When a user changes their User_Code, existing lead numbers are NOT affected.
// Each lead retains the number assigned at creation time.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { status, stageId, search, excludeConverted, page = '1', limit = '20' } = req.query;

    const where: any = { userId, deletedAt: null };
    
    if (status) where.status = status as LeadStatus;
    if (stageId) where.stageId = stageId as string;
    
    // excludeConverted 필터: 전환된 리드 제외 (Requirements 1.3)
    // 견적서 작성 시 리드 목록에서 이미 고객으로 전환된 리드를 제외하기 위해 사용
    if (excludeConverted === 'true') {
      where.status = { not: LeadStatus.CONVERTED };
    }
    
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
// IMMUTABILITY GUARANTEE (Requirements 5.5, 3.5):
// This endpoint returns leadNumber exactly as stored in the database.
// The stored leadNumber is immutable and reflects the User_Code at the time of creation.
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

    // 리드 번호 생성 - LeadNumberService 사용 (Requirements 3.1, 3.4)
    // User_Code 기반으로 리드 번호 생성 (형식: UC-YYYY-NNNN)
    let leadNumber: string;
    try {
      leadNumber = await leadNumberService.generateLeadNumber(userId);
    } catch (error) {
      // Requirement 3.4: User_Code 미설정 시 오류 반환
      if (error instanceof UserCodeNotSetError) {
        return res.status(400).json({
          success: false,
          message: error.message, // "견적서 코드가 설정되지 않았습니다"
          code: 'USER_CODE_NOT_SET',
        });
      }
      throw error;
    }

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

    // Requirements 5.1: 리드 정보 수정 시 연결된 Customer 동기화
    // 동기화 대상 필드가 변경되었는지 확인
    const syncFields = ['contactName', 'companyName', 'contactEmail', 'contactPhone'];
    const hasSyncFieldChanged = syncFields.some(field => updateData[field] !== undefined);
    
    if (hasSyncFieldChanged && lead.customerId) {
      try {
        await dataSyncService.syncLeadToCustomer(id, userId);
      } catch (syncError) {
        // 동기화 실패는 로그만 기록하고 주요 작업은 완료 처리
        console.error('Lead to Customer sync failed:', syncError);
      }
    }

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
