// Analytics Routes - 분석 데이터 API
import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: 분석 데이터 API
 */

// 날짜 범위 파싱 헬퍼
const parseDateRange = (req: Request) => {
  const endDate = new Date();
  const startDate = new Date();
  
  if (req.query.startDate) {
    startDate.setTime(new Date(req.query.startDate as string).getTime());
  } else {
    startDate.setMonth(startDate.getMonth() - 3); // 기본 3개월
  }
  
  if (req.query.endDate) {
    endDate.setTime(new Date(req.query.endDate as string).getTime());
  }

  return { startDate, endDate };
};

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: 매출 분석 데이터
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, quarterly, yearly]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [user, customer, type]
 *     responses:
 *       200:
 *         description: 매출 분석 데이터
 */
router.get('/revenue', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = parseDateRange(req);
    const period = req.query.period as string || 'monthly';
    const groupBy = req.query.groupBy as string;

    const data = await analyticsService.getRevenueAnalytics({
      startDate,
      endDate,
      period,
      groupBy,
      userId
    });

    res.json(data);
  } catch (error: any) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/conversion:
 *   get:
 *     summary: 전환율 분석 데이터
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [lead, quotation, contract]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 전환율 분석 데이터
 */
router.get('/conversion', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = parseDateRange(req);
    const entityType = req.query.entityType as string || 'lead';

    const data = await analyticsService.getConversionAnalytics({
      startDate,
      endDate,
      entityType,
      userId
    });

    res.json(data);
  } catch (error: any) {
    console.error('Get conversion analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/lead-time:
 *   get:
 *     summary: 리드타임 분석 데이터
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 리드타임 분석 데이터
 */
router.get('/lead-time', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = parseDateRange(req);

    const data = await analyticsService.getLeadTimeAnalytics({
      startDate,
      endDate,
      userId
    });

    res.json(data);
  } catch (error: any) {
    console.error('Get lead time analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/performance:
 *   get:
 *     summary: 영업 성과 분석 데이터
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 영업 성과 분석 데이터
 */
router.get('/performance', authenticate, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { startDate, endDate } = parseDateRange(req);
    // 특정 사용자 필터가 있으면 사용, 없으면 현재 사용자 기준
    const targetUserId = req.query.userId as string || currentUserId;
    const department = req.query.department as any;

    const data = await analyticsService.getPerformanceAnalytics({
      startDate,
      endDate,
      userId: currentUserId, // 권한 체크용
      department
    });

    res.json(data);
  } catch (error: any) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/lost:
 *   get:
 *     summary: Lost 분석 데이터
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [reason, stage, competitor]
 *     responses:
 *       200:
 *         description: Lost 분석 데이터
 */
router.get('/lost', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = parseDateRange(req);
    const groupBy = req.query.groupBy as string;

    const data = await analyticsService.getLostAnalytics({
      startDate,
      endDate,
      groupBy,
      userId
    });

    res.json(data);
  } catch (error: any) {
    console.error('Get lost analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/study-overview:
 *   get:
 *     summary: 시험 현황 개요
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 시험 현황 개요
 */
router.get('/study-overview', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = await analyticsService.getStudyOverview(userId);
    res.json(data);
  } catch (error: any) {
    console.error('Get study overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/delayed-studies:
 *   get:
 *     summary: 지연 시험 목록
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: thresholdDays
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 지연 시험 목록
 */
router.get('/delayed-studies', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const thresholdDays = req.query.thresholdDays ? parseInt(req.query.thresholdDays as string) : 0;
    const data = await analyticsService.getDelayedStudies(thresholdDays, userId);
    res.json(data);
  } catch (error: any) {
    console.error('Get delayed studies error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/study-workload:
 *   get:
 *     summary: 연구소 가동률
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: labId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 연구소 가동률
 */
router.get('/study-workload', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const labId = req.query.labId as string;
    const data = await analyticsService.getStudyWorkload(labId, userId);
    res.json(data);
  } catch (error: any) {
    console.error('Get study workload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/department-summary:
 *   get:
 *     summary: 부서별 요약 데이터
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         required: true
 *         schema:
 *           type: string
 *           enum: [BD1, BD2, SUPPORT]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 부서별 요약 데이터
 */
router.get('/department-summary', authenticate, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const department = req.query.department as any;

    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    const data = await analyticsService.getDepartmentSummary(department, {
      startDate,
      endDate
    });

    res.json(data);
  } catch (error: any) {
    console.error('Get department summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
