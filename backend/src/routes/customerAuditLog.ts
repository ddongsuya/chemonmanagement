/**
 * Customer Audit Log & Lifecycle API Routes
 *
 * @swagger
 * tags:
 *   - name: AuditLog
 *     description: 감사 추적/라이프사이클 API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as auditService from '../services/auditLogService';
import * as lifecycleService from '../services/lifecycleService';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/customer-audit/:customerId/audit-log - 감사 로그 조회
router.get('/:customerId/audit-log', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await auditService.getAuditLogs({
      customerId: req.params.customerId,
      fieldName: req.query.fieldName as string,
      changedBy: req.query.changedBy as string,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

// GET /api/customer-audit/:customerId/lifecycle - 라이프사이클 전환 이력
router.get('/:customerId/lifecycle', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await lifecycleService.getTransitionHistory(req.params.customerId);
    res.json({ success: true, data: history });
  } catch (error) { next(error); }
});

// POST /api/customer-audit/:customerId/lifecycle/transition - 수동 단계 전환
router.post('/:customerId/lifecycle/transition', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toStage, reason } = req.body;
    if (!toStage) return res.status(400).json({ success: false, error: { message: '전환 단계가 필요합니다' } });

    const customer = await prisma.customer.findUnique({ where: { id: req.params.customerId } });
    if (!customer) return res.status(404).json({ success: false, error: { message: '고객을 찾을 수 없습니다' } });

    const transition = await lifecycleService.recordTransition({
      customerId: req.params.customerId,
      fromStage: customer.grade,
      toStage,
      reason,
      triggeredBy: req.user!.id,
    });

    await prisma.customer.update({
      where: { id: req.params.customerId },
      data: { grade: toStage },
    });

    res.status(201).json({ success: true, data: transition });
  } catch (error) { next(error); }
});

// GET /api/customer-audit/lifecycle/stats - 라이프사이클 통계
router.get('/lifecycle/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [avgDuration, conversionRates, pipelineVelocity] = await Promise.all([
      lifecycleService.getAverageStageDuration(),
      lifecycleService.getConversionRates(),
      lifecycleService.getPipelineVelocity(),
    ]);
    res.json({ success: true, data: { avgDuration, conversionRates, pipelineVelocity } });
  } catch (error) { next(error); }
});

// GET /api/customer-audit/lifecycle/auto-transition-suggestions - 자동 전환 제안 목록
router.get('/lifecycle/auto-transition-suggestions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suggestions = await lifecycleService.evaluateAllAutoTransitions();
    res.json({ success: true, data: suggestions });
  } catch (error) { next(error); }
});

// POST /api/customer-audit/:customerId/lifecycle/auto-transition - 자동 전환 승인 실행
router.post('/:customerId/lifecycle/auto-transition', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toStage, reason } = req.body;
    if (!toStage) return res.status(400).json({ success: false, error: { message: '전환 단계가 필요합니다' } });

    const result = await lifecycleService.executeAutoTransition(
      req.params.customerId,
      toStage,
      reason || '자동 전환 승인',
      req.user!.id
    );

    if (!result) return res.status(404).json({ success: false, error: { message: '고객을 찾을 수 없습니다' } });

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// GET /api/customer-audit/lifecycle/stagnant - 정체 고객 목록
router.get('/lifecycle/stagnant', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stagnant = await lifecycleService.detectStagnantCustomers();
    res.json({ success: true, data: stagnant });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /api/customer-audit/weekly-summary:
 *   get:
 *     tags: [AuditLog]
 *     summary: 주간 요약 리포트
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 주간 요약 데이터
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeeklySummary'
 */
// GET /api/customer-audit/weekly-summary - 주간 요약 리포트
router.get('/weekly-summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await lifecycleService.generateWeeklySummary();
    res.json({ success: true, data: summary });
  } catch (error) { next(error); }
});

export default router;
