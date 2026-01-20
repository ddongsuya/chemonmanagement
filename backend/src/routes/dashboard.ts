// Dashboard Routes - 대시보드 API
import { Router, Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: 대시보드 관리 API
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: 대시보드 목록 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 목록
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await dashboardService.getDashboards(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Get dashboards error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard:
 *   post:
 *     summary: 대시보드 생성
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               layout:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 대시보드 생성 성공
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const dashboard = await dashboardService.createDashboard({
      ...req.body,
      ownerId: userId
    });
    res.status(201).json(dashboard);
  } catch (error: any) {
    console.error('Create dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{id}:
 *   get:
 *     summary: 대시보드 상세 조회
 *     tags: [Dashboard]
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
 *         description: 대시보드 상세
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const dashboard = await dashboardService.getDashboardById(req.params.id, userId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{id}:
 *   put:
 *     summary: 대시보드 수정
 *     tags: [Dashboard]
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
 *         description: 대시보드 수정 성공
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const dashboard = await dashboardService.updateDashboard(req.params.id, userId, req.body);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Update dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{id}:
 *   delete:
 *     summary: 대시보드 삭제
 *     tags: [Dashboard]
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
 *         description: 대시보드 삭제 성공
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await dashboardService.deleteDashboard(req.params.id, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{id}/duplicate:
 *   post:
 *     summary: 대시보드 복제
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: 대시보드 복제 성공
 */
router.post('/:id/duplicate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const dashboard = await dashboardService.duplicateDashboard(req.params.id, userId);
    res.status(201).json(dashboard);
  } catch (error: any) {
    console.error('Duplicate dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{id}/layout:
 *   put:
 *     summary: 대시보드 레이아웃 업데이트
 *     tags: [Dashboard]
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
 *             properties:
 *               layout:
 *                 type: object
 *     responses:
 *       200:
 *         description: 레이아웃 업데이트 성공
 */
router.put('/:id/layout', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const dashboard = await dashboardService.updateLayout(req.params.id, userId, req.body.layout);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Update layout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{dashboardId}/widgets:
 *   get:
 *     summary: 대시보드 위젯 목록 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 위젯 목록
 */
router.get('/:dashboardId/widgets', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const dashboard = await dashboardService.getDashboardById(req.params.dashboardId, userId);
    res.json(dashboard.widgets);
  } catch (error: any) {
    console.error('Get widgets error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{dashboardId}/widgets:
 *   post:
 *     summary: 위젯 추가
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - dataSource
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               x:
 *                 type: integer
 *               y:
 *                 type: integer
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *               dataSource:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       201:
 *         description: 위젯 추가 성공
 */
router.post('/:dashboardId/widgets', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const widget = await dashboardService.addWidget({
      ...req.body,
      dashboardId: req.params.dashboardId
    }, userId);
    res.status(201).json(widget);
  } catch (error: any) {
    console.error('Add widget error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{dashboardId}/widgets/{widgetId}:
 *   put:
 *     summary: 위젯 수정
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: widgetId
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
 *         description: 위젯 수정 성공
 */
router.put('/:dashboardId/widgets/:widgetId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const widget = await dashboardService.updateWidget(req.params.widgetId, userId, req.body);
    res.json(widget);
  } catch (error: any) {
    console.error('Update widget error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{dashboardId}/widgets/{widgetId}:
 *   delete:
 *     summary: 위젯 삭제
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: widgetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 위젯 삭제 성공
 */
router.delete('/:dashboardId/widgets/:widgetId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await dashboardService.deleteWidget(req.params.widgetId, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete widget error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/{dashboardId}/widgets/{widgetId}/data:
 *   get:
 *     summary: 위젯 데이터 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: widgetId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 위젯 데이터
 */
router.get('/:dashboardId/widgets/:widgetId/data', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = await dashboardService.getWidgetData(req.params.widgetId, userId, {
      dateRange: req.query.dateRange as string,
      filters: req.query.filters
    });
    res.json(data);
  } catch (error: any) {
    console.error('Get widget data error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/widgets/templates:
 *   get:
 *     summary: 위젯 템플릿 목록 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 위젯 템플릿 목록
 */
router.get('/widgets/templates', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getWidgetTemplates();
    res.json(result);
  } catch (error: any) {
    console.error('Get widget templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
