/**
 * Customer Tags API Routes
 * 태그/세그먼트 관리
 *
 * @swagger
 * tags:
 *   - name: CustomerTags
 *     description: 고객 태그/세그먼트 관리 API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as tagService from '../services/customerTagService';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * @swagger
 * /api/customer-tags:
 *   get:
 *     tags: [CustomerTags]
 *     summary: 전체 태그 목록 조회 (자동완성용)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 태그 목록
 */
// GET /api/customer-tags - 전체 태그 목록 (자동완성용)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await tagService.getAllTagNames();
    res.json({ success: true, data: tags });
  } catch (error) { next(error); }
});

// POST /api/customer-tags/:customerId/tags - 태그 추가
router.post('/:customerId/tags', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { message: '태그명이 필요합니다' } });
    const tag = await tagService.addTag(req.params.customerId, name, color || null, req.user!.id);
    res.status(201).json({ success: true, data: tag });
  } catch (error) { next(error); }
});

// DELETE /api/customer-tags/:customerId/tags/:tagId - 태그 제거
router.delete('/:customerId/tags/:tagId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tagService.removeTag(req.params.customerId, req.params.tagId);
    res.status(204).send();
  } catch (error) { next(error); }
});

// POST /api/customer-tags/bulk - 일괄 태그 추가/제거
router.post('/bulk', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerIds, tagName, color, action } = req.body;
    if (!customerIds?.length || !tagName) {
      return res.status(400).json({ success: false, error: { message: '필수 파라미터가 누락되었습니다' } });
    }
    if (action === 'remove') {
      await tagService.bulkRemoveTags(customerIds, tagName);
    } else {
      await tagService.bulkAddTags(customerIds, tagName, color || null, req.user!.id);
    }
    res.json({ success: true });
  } catch (error) { next(error); }
});

// PATCH /api/customer-tags/:customerId/segment - 세그먼트 변경
router.patch('/:customerId/segment', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { segment } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.customerId },
      data: { segment },
    });
    res.json({ success: true, data: customer });
  } catch (error) { next(error); }
});

// GET /api/customer-tags/segments/stats - 세그먼트별 통계
router.get('/segments/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await prisma.customer.groupBy({
      by: ['segment'],
      where: { deletedAt: null },
      _count: true,
    });
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
});

export default router;
