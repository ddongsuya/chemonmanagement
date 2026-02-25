import { Router, Request, Response, NextFunction } from 'express';
import { DataService } from '../services/dataService';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createCustomerSchema, updateCustomerSchema, CustomerFilters, CustomerGrade } from '../types/customer';
import { dataSyncService } from '../services/dataSyncService';
import { LeadStatus, LeadSource } from '@prisma/client';
import { leadNumberService } from '../services/leadNumberService';

const router = Router();
const dataService = new DataService(prisma);

/**
 * 고객 등급이 LEAD로 변경될 때 Lead 레코드 자동 생성
 * 이미 연결된 Lead가 있으면 상태를 NEW로 재활성화
 */
async function ensureLeadForCustomer(userId: string, customerId: string): Promise<void> {
  // 이미 연결된 Lead가 있는지 확인
  const existingLead = await prisma.lead.findFirst({
    where: { customerId, deletedAt: null },
  });

  if (existingLead) {
    // 종료 상태인 Lead가 있으면 재활성화
    if (['CONVERTED', 'LOST', 'DORMANT'].includes(existingLead.status)) {
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: { status: LeadStatus.NEW },
      });
    }
    return;
  }

  // 고객 정보 조회
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) return;

  // 리드 번호 생성 (userCode 미설정 시 LD 접두사 사용)
  let leadNumber: string;
  try {
    leadNumber = await leadNumberService.generateLeadNumber(userId);
  } catch {
    const year = new Date().getFullYear();
    const lastLead = await prisma.lead.findFirst({
      where: { leadNumber: { startsWith: `LD-${year}` } },
      orderBy: { leadNumber: 'desc' },
    });
    const seq = lastLead ? parseInt(lastLead.leadNumber.split('-')[2]) + 1 : 1;
    leadNumber = `LD-${year}-${seq.toString().padStart(4, '0')}`;
  }

  // 기본 파이프라인 단계 조회
  let defaultStage = await prisma.pipelineStage.findFirst({
    where: { isDefault: true, isActive: true },
  });
  if (!defaultStage) {
    defaultStage = await prisma.pipelineStage.findFirst({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }
  if (!defaultStage) return;

  // Lead 레코드 생성
  await prisma.lead.create({
    data: {
      leadNumber,
      userId,
      companyName: customer.company || customer.name,
      contactName: customer.name,
      contactEmail: customer.email,
      contactPhone: customer.phone,
      stageId: defaultStage.id,
      status: LeadStatus.NEW,
      customerId,
      source: LeadSource.OTHER,
    },
  });
}

// Valid customer grades for validation
const validGrades: CustomerGrade[] = ['LEAD', 'PROSPECT', 'CUSTOMER', 'VIP', 'INACTIVE'];

/**
 * PATCH /api/customers/bulk/grade
 * 고객 등급 일괄 변경
 */
router.patch(
  '/bulk/grade',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerIds, grade } = req.body;
      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({ success: false, error: { message: '고객 ID 목록이 필요합니다' } });
      }
      if (!grade || !validGrades.includes(grade.toUpperCase() as CustomerGrade)) {
        return res.status(400).json({ success: false, error: { message: '유효한 등급이 필요합니다' } });
      }
      const upperGrade = grade.toUpperCase();
      const count = await dataService.bulkUpdateCustomerGrade(req.user!.id, customerIds, upperGrade);

      // 등급이 LEAD로 변경되면 Lead 레코드 자동 생성
      if (upperGrade === 'LEAD') {
        await Promise.allSettled(
          customerIds.map(id => ensureLeadForCustomer(req.user!.id, id))
        );
      }

      res.json({ success: true, data: { updatedCount: count } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/customers/bulk
 * 고객 일괄 삭제
 */
router.delete(
  '/bulk',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerIds } = req.body;
      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({ success: false, error: { message: '고객 ID 목록이 필요합니다' } });
      }
      const count = await dataService.bulkDeleteCustomers(req.user!.id, customerIds);
      res.json({ success: true, data: { deletedCount: count } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/customers
 * Get customers list with pagination and filters
 * Supports grade filtering via query parameter
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate grade parameter
      const gradeParam = req.query.grade as string | undefined;
      let grade: CustomerGrade | undefined;
      
      if (gradeParam) {
        const upperGrade = gradeParam.toUpperCase() as CustomerGrade;
        if (validGrades.includes(upperGrade)) {
          grade = upperGrade;
        }
        // Invalid grade values are silently ignored (returns all customers)
      }

      const filters: CustomerFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 10, 100),
        search: req.query.search as string | undefined,
        grade,  // grade 필터 추가
      };

      const result = await dataService.getCustomers(req.user!.id, filters);
      res.json({
        success: true,
        data: {
          data: result.data,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/customers
 * Create a new customer
 */
router.post(
  '/',
  authenticate,
  validateBody(createCustomerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await dataService.createCustomer(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        data: customer,
        message: '고객이 생성되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await dataService.getCustomerById(req.user!.id, req.params.id);
      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/customers/:id
 * Update customer
 * Requirements 5.2: Customer 정보 수정 시 연결된 Lead 동기화
 */
router.put(
  '/:id',
  authenticate,
  validateBody(updateCustomerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await dataService.updateCustomer(req.user!.id, req.params.id, req.body);
      
      // 등급이 LEAD로 변경되면 Lead 레코드 자동 생성
      if (req.body.grade === 'LEAD') {
        try {
          await ensureLeadForCustomer(req.user!.id, req.params.id);
        } catch (err) {
          console.error('Auto-create lead for customer failed:', err);
        }
      }

      // Requirements 5.2: Customer 정보 수정 시 연결된 Lead 동기화
      // 동기화 대상 필드가 변경되었는지 확인
      const syncFields = ['name', 'company', 'email', 'phone'];
      const hasSyncFieldChanged = syncFields.some(field => req.body[field] !== undefined);

      if (hasSyncFieldChanged) {
        try {
          await dataSyncService.syncCustomerToLead(req.params.id, req.user!.id);
        } catch (syncError) {
          // 동기화 실패는 로그만 기록하고 주요 작업은 완료 처리
          console.error('Customer to Lead sync failed:', syncError);
        }
      }
      
      res.json({
        success: true,
        data: customer,
        message: '고객 정보가 수정되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/customers/:id
 * Soft delete customer
 */
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await dataService.deleteCustomer(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
