import { Router, Request, Response, NextFunction } from 'express';
import { DataService } from '../services/dataService';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createQuotationSchema, updateQuotationSchema, QuotationFilters } from '../types/quotation';
import { QuotationStatus, QuotationType } from '@prisma/client';
import { pipelineAutomationService } from '../services/pipelineAutomationService';

const router = Router();
const dataService = new DataService(prisma);

/**
 * GET /api/quotations
 * Get quotations list with pagination and filters
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: QuotationFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 10, 100),
        quotationType: req.query.type as QuotationType | undefined,
        status: req.query.status as QuotationStatus | undefined,
        customerId: req.query.customerId as string | undefined,
        search: req.query.search as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await dataService.getQuotations(req.user!.id, filters);
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
 * POST /api/quotations
 * Create a new quotation
 */
router.post(
  '/',
  authenticate,
  validateBody(createQuotationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quotation = await dataService.createQuotation(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        data: quotation,
        message: '견적서가 생성되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/quotations/:id
 * Get quotation by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quotation = await dataService.getQuotationById(req.user!.id, req.params.id);
      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/quotations/:id
 * Update quotation
 * 
 * Requirements 2.1: 견적서 상태가 SENT로 변경되고 해당 견적서에 연결된 리드가 존재하면
 * 해당 리드의 status를 PROPOSAL로 자동 업데이트해야 합니다.
 */
router.put(
  '/:id',
  authenticate,
  validateBody(updateQuotationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quotation = await dataService.updateQuotation(req.user!.id, req.params.id, req.body);
      
      // Requirements 2.1: 상태가 SENT로 변경된 경우 파이프라인 자동화 트리거
      // triggerAutomation 파라미터가 false가 아닌 경우에만 실행 (기본값: true)
      if (req.body.status === QuotationStatus.SENT && req.body.triggerAutomation !== false) {
        try {
          await pipelineAutomationService.onQuotationStatusChange(
            req.params.id,
            QuotationStatus.SENT,
            req.user!.id
          );
        } catch (automationError) {
          // 자동화 실패는 견적서 업데이트에 영향을 주지 않음
          // 오류 로그만 기록하고 계속 진행
          console.error('Pipeline automation failed:', automationError);
        }
      }
      
      res.json({
        success: true,
        data: quotation,
        message: '견적서가 수정되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/quotations/:id
 * Soft delete quotation
 */
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await dataService.deleteQuotation(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
