import { Router, Request, Response, NextFunction } from 'express';
import { ReportService, ReportType } from '../services/reportService';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
const reportService = new ReportService(prisma);

// ==================== Report Definitions ====================

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: 리포트 목록 조회
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { type, isSystem, search, page = '1', limit = '20' } = req.query;
    
    const result = await reportService.getReports(userId, {
      type: type as ReportType | undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
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
 * /api/reports/system:
 *   get:
 *     summary: 시스템 리포트 템플릿 목록
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/system', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = reportService.getSystemReports();
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/exports:
 *   get:
 *     summary: 내보내기 기록 조회
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/exports', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { page = '1', limit = '20' } = req.query;
    const result = await reportService.getExports(
      userId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/exports/{exportId}:
 *   get:
 *     summary: 내보내기 상태 확인
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/exports/:exportId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const exportRecord = await reportService.getExportStatus(req.params.exportId, userId);
    res.json(exportRecord);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: 리포트 상세 조회
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const report = await reportService.getReportById(req.params.id, userId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: 리포트 생성
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const report = await reportService.createReport(userId, req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: 리포트 수정
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const report = await reportService.updateReport(req.params.id, userId, req.body);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: 리포트 삭제
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await reportService.deleteReport(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ==================== Report Execution ====================

/**
 * @swagger
 * /api/reports/{id}/execute:
 *   post:
 *     summary: 리포트 실행 (데이터 조회)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/execute', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await reportService.executeReport(req.params.id, userId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ==================== Report Export ====================

/**
 * @swagger
 * /api/reports/{id}/export:
 *   post:
 *     summary: 리포트 내보내기
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/export', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const exportRecord = await reportService.exportReport(req.params.id, userId, req.body);
    res.json(exportRecord);
  } catch (error) {
    next(error);
  }
});

export default router;
