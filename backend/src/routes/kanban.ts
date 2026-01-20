// Kanban Routes - 칸반 뷰 API
import { Router, Request, Response } from 'express';
import { kanbanService } from '../services/kanbanService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Kanban
 *   description: 칸반 뷰 관리 API
 */

/**
 * @swagger
 * /api/kanban/{entityType}:
 *   get:
 *     summary: 칸반 뷰 데이터 조회
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [lead, quotation, contract, study]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 칸반 뷰 데이터
 */
router.get('/:entityType', authenticate, async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const userId = (req as any).user.id;
    const filters = req.query;

    const validTypes = ['lead', 'quotation', 'contract', 'study'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    const data = await kanbanService.getKanbanView(
      entityType as 'lead' | 'quotation' | 'contract' | 'study',
      userId,
      filters
    );

    res.json(data);
  } catch (error: any) {
    console.error('Get kanban view error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/kanban/{entityType}/{id}/move:
 *   put:
 *     summary: 칸반 아이템 이동
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetColumn:
 *                 type: string
 *               targetIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: 이동 성공
 */
router.put('/:entityType/:id/move', authenticate, async (req: Request, res: Response) => {
  try {
    const { entityType, id } = req.params;
    const { targetColumn } = req.body;
    const userId = (req as any).user.id;

    const validTypes = ['lead', 'quotation', 'contract', 'study'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    const result = await kanbanService.moveItem(
      entityType as 'lead' | 'quotation' | 'contract' | 'study',
      id,
      targetColumn,
      userId
    );

    res.json(result);
  } catch (error: any) {
    console.error('Move kanban item error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/kanban/{entityType}/settings:
 *   get:
 *     summary: 칸반 설정 조회
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 칸반 설정
 */
router.get('/:entityType/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const userId = (req as any).user.id;

    const settings = await kanbanService.getSettings(userId, entityType);
    res.json(settings);
  } catch (error: any) {
    console.error('Get kanban settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/kanban/{entityType}/settings:
 *   put:
 *     summary: 칸반 설정 저장
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupByField:
 *                 type: string
 *               columns:
 *                 type: array
 *               cardFields:
 *                 type: array
 *               filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: 설정 저장 성공
 */
router.put('/:entityType/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const userId = (req as any).user.id;
    const settings = req.body;

    const result = await kanbanService.saveSettings(userId, entityType, settings);
    res.json(result);
  } catch (error: any) {
    console.error('Save kanban settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
