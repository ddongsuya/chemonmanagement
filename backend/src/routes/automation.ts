import { Router, Request, Response, NextFunction } from 'express';
import { AutomationService, AutomationTriggerType, AutomationStatus } from '../services/automationService';
import { authenticate, requireAdmin } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
const automationService = new AutomationService(prisma);

// ==================== Rules CRUD ====================

/**
 * @swagger
 * /api/automation/rules:
 *   get:
 *     summary: 자동화 규칙 목록 조회
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/rules', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, triggerType, search, page = '1', limit = '20' } = req.query;
    
    const result = await automationService.getRules({
      status: status as AutomationStatus | 'ALL' | undefined,
      triggerType: triggerType as AutomationTriggerType | undefined,
      search: search as string | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/automation/rules/{id}:
 *   get:
 *     summary: 자동화 규칙 상세 조회
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/rules/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await automationService.getRuleById(req.params.id);
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/automation/rules:
 *   post:
 *     summary: 자동화 규칙 생성
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.post('/rules', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const rule = await automationService.createRule(userId, req.body);
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/automation/rules/{id}:
 *   put:
 *     summary: 자동화 규칙 수정
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.put('/rules/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await automationService.updateRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/automation/rules/{id}:
 *   delete:
 *     summary: 자동화 규칙 삭제
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/rules/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await automationService.deleteRule(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/automation/rules/{id}/toggle:
 *   post:
 *     summary: 자동화 규칙 활성/비활성 토글
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.post('/rules/:id/toggle', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await automationService.toggleRule(req.params.id);
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

// ==================== Executions ====================

/**
 * @swagger
 * /api/automation/executions:
 *   get:
 *     summary: 자동화 실행 로그 조회
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/executions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ruleId, status, startDate, endDate, page = '1', limit = '20' } = req.query;
    
    const result = await automationService.getExecutions({
      ruleId: ruleId as string | undefined,
      status: status as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/automation/executions/{id}:
 *   get:
 *     summary: 자동화 실행 로그 상세 조회
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/executions/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const execution = await automationService.getExecutionById(req.params.id);
    res.json(execution);
  } catch (error) {
    next(error);
  }
});

// ==================== Templates ====================

/**
 * @swagger
 * /api/automation/templates:
 *   get:
 *     summary: 자동화 템플릿 목록 조회
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/templates', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = automationService.getTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/automation/templates/{id}/apply:
 *   post:
 *     summary: 템플릿으로 자동화 규칙 생성
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.post('/templates/:id/apply', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const rule = await automationService.applyTemplate(userId, req.params.id);
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// ==================== Manual Execution ====================

/**
 * @swagger
 * /api/automation/rules/{id}/execute:
 *   post:
 *     summary: 자동화 규칙 수동 실행
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 */
router.post('/rules/:id/execute', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetModel, targetId, triggerData = {} } = req.body;
    const execution = await automationService.executeRule(req.params.id, targetModel, targetId, triggerData);
    res.json(execution);
  } catch (error) {
    next(error);
  }
});

export default router;
