// Activities Routes - 활동 타임라인 API
import { Router, Request, Response } from 'express';
import { activityService } from '../services/activityService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: 활동 타임라인 관리 API
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: 활동 목록 조회
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
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
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 활동 목록
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const query = {
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
      type: req.query.type as any,
      userId: req.query.userId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await activityService.getActivities(query);
    res.json(result);
  } catch (error: any) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: 활동 생성
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *               - type
 *               - subject
 *             properties:
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CALL, EMAIL, MEETING, NOTE, TASK, STATUS_CHANGE, DOCUMENT, SYSTEM]
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               contactName:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               duration:
 *                 type: integer
 *               activityDate:
 *                 type: string
 *                 format: date-time
 *               nextAction:
 *                 type: string
 *               nextDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 활동 생성 성공
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const activity = await activityService.createActivity({
      ...req.body,
      userId,
      activityDate: req.body.activityDate ? new Date(req.body.activityDate) : undefined,
      nextDate: req.body.nextDate ? new Date(req.body.nextDate) : undefined
    });

    res.status(201).json(activity);
  } catch (error: any) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: 활동 상세 조회
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 활동 상세
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const activity = await activityService.getActivityById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(activity);
  } catch (error: any) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: 활동 수정
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: 활동 수정 성공
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const activity = await activityService.updateActivity(req.params.id, {
      ...req.body,
      activityDate: req.body.activityDate ? new Date(req.body.activityDate) : undefined,
      nextDate: req.body.nextDate ? new Date(req.body.nextDate) : undefined
    });

    res.json(activity);
  } catch (error: any) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: 활동 삭제
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 활동 삭제 성공
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await activityService.deleteActivity(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/activities/timeline/{entityType}/{entityId}:
 *   get:
 *     summary: 엔티티 타임라인 조회
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 타임라인 데이터
 */
router.get('/timeline/:entityType/:entityId', authenticate, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const timeline = await activityService.getTimeline(entityType, entityId);
    res.json(timeline);
  } catch (error: any) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/activities/upcoming:
 *   get:
 *     summary: 예정된 활동 조회
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: 예정된 활동 목록
 */
router.get('/upcoming', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    
    const activities = await activityService.getUpcomingActivities(userId, days);
    res.json(activities);
  } catch (error: any) {
    console.error('Get upcoming activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
