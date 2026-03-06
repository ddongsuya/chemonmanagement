/**
 * Customer Health Score & Churn Risk API Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as healthService from '../services/healthScoreService';

const router = Router();

// GET /api/customer-health/:customerId - 건강도 점수 조회
router.get('/:customerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let score = await healthService.getLatestHealthScore(req.params.customerId);
    if (!score) {
      score = await healthService.calculateHealthScore(req.params.customerId);
    }
    res.json({ success: true, data: score });
  } catch (error) { next(error); }
});

// GET /api/customer-health/:customerId/history - 건강도 추이 (90일)
router.get('/:customerId/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const history = await healthService.getHealthScoreHistory(req.params.customerId, days);
    res.json({ success: true, data: history });
  } catch (error) { next(error); }
});

// POST /api/customer-health/batch - 일괄 건강도 재계산
router.post('/batch', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerIds } = req.body;
    const count = await healthService.batchRecalculate(customerIds);
    res.json({ success: true, data: { recalculatedCount: count } });
  } catch (error) { next(error); }
});

export default router;
