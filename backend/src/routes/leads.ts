// src/routes/leads.ts
// 리드 관리 API

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { LeadStatus, LeadSource } from '@prisma/client';
import { dataSyncService } from '../services/dataSyncService';
import { leadNumberService, UserCodeNotSetError } from '../services/leadNumberService';
import { validateLostReasonData, LostReasonData } from '../types/lostReason';
import { AutomationService } from '../services/automationService';

// AutomationService 인스턴스 생성 (Requirements 2.2.1: 리드 상태 변경 시 트리거 발동)
const automationService = new AutomationService(prisma);

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

// 미진행 사유 통계 조회 (GET /api/leads/lost-reason-stats)
// Requirements: 2.7
// - 기간별, 사유별 통계 집계
// - startDate, endDate, userId 필터 지원
// NOTE: This route MUST be defined before /:id routes to avoid matching 'lost-reason-stats' as an id
router.get('/lost-reason-stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = (req as any).user.id;
    const { startDate, endDate, userId } = req.query;

    // 필터 조건 구성
    const where: any = {
      status: LeadStatus.LOST,
      deletedAt: null,
      lostReason: { not: null },
    };

    // userId 필터: 지정된 경우 해당 사용자, 아니면 현재 사용자
    where.userId = userId ? (userId as string) : currentUserId;

    // 기간 필터
    if (startDate || endDate) {
      where.lostAt = {};
      if (startDate) {
        where.lostAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        // endDate는 해당 날짜의 끝까지 포함
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        where.lostAt.lte = endDateTime;
      }
    }

    // 미진행 리드 조회
    const lostLeads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        lostReason: true,
        lostAt: true,
      },
      orderBy: { lostAt: 'asc' },
    });

    // 총 미진행 건수
    const totalLost = lostLeads.length;

    // 사유별 집계
    const byReason: Record<string, number> = {
      BUDGET_PLANNING: 0,
      COMPETITOR_SELECTED: 0,
      PRICE_ISSUE: 0,
      SCHEDULE_ISSUE: 0,
      ON_HOLD: 0,
      OTHER: 0,
    };

    // 월별 집계를 위한 맵
    const byMonthMap: Map<string, { count: number; reasons: Record<string, number> }> = new Map();

    for (const lead of lostLeads) {
      const reason = lead.lostReason as string;
      
      // 사유별 집계
      if (reason && byReason.hasOwnProperty(reason)) {
        byReason[reason]++;
      }

      // 월별 집계
      if (lead.lostAt) {
        const monthKey = `${lead.lostAt.getFullYear()}-${String(lead.lostAt.getMonth() + 1).padStart(2, '0')}`;
        
        if (!byMonthMap.has(monthKey)) {
          byMonthMap.set(monthKey, {
            count: 0,
            reasons: {
              BUDGET_PLANNING: 0,
              COMPETITOR_SELECTED: 0,
              PRICE_ISSUE: 0,
              SCHEDULE_ISSUE: 0,
              ON_HOLD: 0,
              OTHER: 0,
            },
          });
        }

        const monthData = byMonthMap.get(monthKey)!;
        monthData.count++;
        if (reason && monthData.reasons.hasOwnProperty(reason)) {
          monthData.reasons[reason]++;
        }
      }
    }

    // 월별 데이터를 배열로 변환 (정렬된 상태)
    const byMonth = Array.from(byMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        count: data.count,
        reasons: data.reasons,
      }));

    res.json({
      success: true,
      data: {
        totalLost,
        byReason,
        byMonth,
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
// Requirements 2.2.1: 리드 상태 변경 시 트리거 발동
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, lostReason } = req.body;

    // 기존 리드 조회하여 이전 상태 확인
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existingLead) {
      return res.status(404).json({ success: false, message: '리드를 찾을 수 없습니다.' });
    }

    const oldStatus = existingLead.status;

    const updateData: any = { status };
    if (status === LeadStatus.LOST && lostReason) {
      updateData.lostReason = lostReason;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: { stage: true },
    });

    // Requirements 2.2.1: 상태가 변경된 경우 자동화 트리거 호출
    if (oldStatus !== status) {
      try {
        await automationService.handleStatusChange(
          'Lead',
          id,
          oldStatus,
          status,
          { leadNumber: lead.leadNumber, companyName: lead.companyName }
        );
      } catch (automationError) {
        // 자동화 실패는 로그만 기록하고 주요 작업은 완료 처리
        console.error('Lead status change automation failed:', automationError);
      }
    }

    res.json({ success: true, data: { lead } });
  } catch (error) {
    next(error);
  }
});

// 미진행 사유 기록 (PUT /api/leads/:id/lost)
// Requirements: 2.3, 2.4, 2.6
// - lostReason 필수 검증
// - OTHER 선택 시 lostReasonDetail 필수 검증
// - LeadActivity 생성 (type: "LOST_REASON")
// Requirements 2.2.1: 리드 상태 변경 시 트리거 발동
router.put('/:id/lost', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { lostReason, lostReasonDetail } = req.body;

    // 리드 존재 확인
    const existing = await prisma.lead.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '리드를 찾을 수 없습니다.' });
    }

    // 이전 상태 저장 (자동화 트리거용)
    const oldStatus = existing.status;

    // 미진행 사유 유효성 검사 (Requirements 2.3, 2.4)
    const validation = validateLostReasonData({ lostReason, lostReasonDetail });
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // 트랜잭션으로 리드 업데이트 및 활동 기록 생성
    const result = await prisma.$transaction(async (tx) => {
      // 리드 업데이트: lostReason, lostReasonDetail, lostAt, status = 'LOST'
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          lostReason,
          lostReasonDetail: lostReason === 'OTHER' ? lostReasonDetail : null,
          lostAt: new Date(),
          status: LeadStatus.LOST,
        },
        include: { stage: true, customer: true },
      });

      // LeadActivity 생성 (type: "LOST_REASON") - Requirements 2.6
      const activity = await tx.leadActivity.create({
        data: {
          leadId: id,
          userId,
          type: 'LOST_REASON',
          subject: '미진행 사유 기록',
          content: lostReason === 'OTHER' 
            ? `미진행 사유: 기타 - ${lostReasonDetail}` 
            : `미진행 사유: ${lostReason}`,
          contactedAt: new Date(),
        },
      });

      return { lead: updatedLead, activity };
    });

    // Requirements 2.2.1: 상태가 변경된 경우 자동화 트리거 호출
    if (oldStatus !== LeadStatus.LOST) {
      try {
        await automationService.handleStatusChange(
          'Lead',
          id,
          oldStatus,
          LeadStatus.LOST,
          { 
            leadNumber: result.lead.leadNumber, 
            companyName: result.lead.companyName,
            lostReason,
            lostReasonDetail: lostReason === 'OTHER' ? lostReasonDetail : null,
          }
        );
      } catch (automationError) {
        // 자동화 실패는 로그만 기록하고 주요 작업은 완료 처리
        console.error('Lead lost status automation failed:', automationError);
      }
    }

    res.json({ success: true, data: { lead: result.lead, activity: result.activity } });
  } catch (error) {
    next(error);
  }
});

// 리드 → 고객 전환
// Requirements 2.2.1: 리드 상태 변경 시 트리거 발동
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

    // 이전 상태 저장 (자동화 트리거용)
    const oldStatus = lead.status;

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

    // Requirements 2.2.1: 상태가 변경된 경우 자동화 트리거 호출
    if (oldStatus !== LeadStatus.CONVERTED) {
      try {
        await automationService.handleStatusChange(
          'Lead',
          id,
          oldStatus,
          LeadStatus.CONVERTED,
          { 
            leadNumber: updatedLead.leadNumber, 
            companyName: updatedLead.companyName,
            customerId: customer.id,
            customerName: customer.name,
          }
        );
      } catch (automationError) {
        // 자동화 실패는 로그만 기록하고 주요 작업은 완료 처리
        console.error('Lead conversion automation failed:', automationError);
      }
    }

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
