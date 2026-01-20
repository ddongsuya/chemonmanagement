import { Router, Request, Response, NextFunction } from 'express';
import { StudyDashboardService } from '../services/studyDashboardService';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
const studyDashboardService = new StudyDashboardService(prisma);

/**
 * @swagger
 * /api/study-dashboard/overview:
 *   get:
 *     summary: 시험 현황 개요
 *     tags: [Study Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/overview', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await studyDashboardService.getOverview();
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/study-dashboard/workload:
 *   get:
 *     summary: 연구소 가동률/워크로드
 *     tags: [Study Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/workload', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workload = await studyDashboardService.getWorkload();
    res.json(workload);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/study-dashboard/delays:
 *   get:
 *     summary: 지연 시험 목록
 *     tags: [Study Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/delays', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { thresholdDays = '7' } = req.query;
    const result = await studyDashboardService.getDelayedStudies(parseInt(thresholdDays as string, 10));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/study-dashboard/reports:
 *   get:
 *     summary: 보고서 발행 현황
 *     tags: [Study Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month } = req.query;
    const result = await studyDashboardService.getReportStatus(month as string | undefined);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/study-dashboard/calendar:
 *   get:
 *     summary: 시험 일정 캘린더
 *     tags: [Study Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/calendar', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate와 endDate가 필요합니다' });
    }
    
    const events = await studyDashboardService.getCalendar(startDate as string, endDate as string);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

export default router;
