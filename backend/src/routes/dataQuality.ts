/**
 * Data Quality & Duplicate Detection API Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as dqService from '../services/dataQualityService';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/data-quality/:customerId - 데이터 품질 점수
router.get('/:customerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.customerId } });
    if (!customer) return res.status(404).json({ success: false, error: { message: '고객을 찾을 수 없습니다' } });
    const result = dqService.calculateDataQualityScore(customer);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// POST /api/data-quality/duplicate-check - 중복 감지
router.post('/duplicate-check', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, phone, email, excludeId } = req.body;
    if (!companyName) return res.status(400).json({ success: false, error: { message: '회사명이 필요합니다' } });
    const duplicates = await dqService.detectDuplicates(companyName, phone, email, excludeId);
    res.json({ success: true, data: duplicates });
  } catch (error) { next(error); }
});

// POST /api/data-quality/merge - 고객 병합
router.post('/merge', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { primaryId, secondaryId, fieldSelections } = req.body;
    if (!primaryId || !secondaryId) {
      return res.status(400).json({ success: false, error: { message: '병합 대상 ID가 필요합니다' } });
    }
    await dqService.mergeCustomers(primaryId, secondaryId, fieldSelections || {}, req.user!.id);
    res.json({ success: true, message: '고객 병합이 완료되었습니다' });
  } catch (error) { next(error); }
});

export default router;
