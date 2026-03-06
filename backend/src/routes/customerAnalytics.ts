/**
 * Customer Analytics API Routes
 * KPI, 전환 퍼널, 이탈률, CLV
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as analyticsService from '../services/customerAnalyticsService';

const router = Router();

// GET /api/customer-analytics/kpi - KPI 대시보드 데이터
router.get('/kpi', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getKPIData();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// GET /api/customer-analytics/funnel - 전환 퍼널
router.get('/funnel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getFunnelData();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// GET /api/customer-analytics/churn-rate - 이탈률 추이
router.get('/churn-rate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getChurnRateTrend();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// GET /api/customer-analytics/segment-clv - 세그먼트별 CLV
router.get('/segment-clv', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getSegmentCLV();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

export default router;
