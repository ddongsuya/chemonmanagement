// Clinical Pathology Routes
// 임상병리검사 견적서 및 시험의뢰서 API

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as clinicalPathologyService from '../services/clinicalPathologyService';

const router = Router();

// 모든 라우트에 인증 적용
router.use(authenticate);

// ==================== 마스터데이터 - 검사항목 ====================

// GET /api/clinical-pathology/master/test-items
router.get('/master/test-items', async (req: Request, res: Response) => {
  try {
    const { category, isActive, search } = req.query;
    const result = await clinicalPathologyService.getTestItems({
      category: category as any,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clinical-pathology/master/test-items/:id
router.get('/master/test-items/:id', async (req: Request, res: Response) => {
  try {
    const item = await clinicalPathologyService.getTestItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: '검사항목을 찾을 수 없습니다.' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/master/test-items
router.post('/master/test-items', async (req: Request, res: Response) => {
  try {
    const item = await clinicalPathologyService.createTestItem(req.body);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/clinical-pathology/master/test-items/:id
router.put('/master/test-items/:id', async (req: Request, res: Response) => {
  try {
    const item = await clinicalPathologyService.updateTestItem(req.params.id, req.body);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/clinical-pathology/master/test-items/:id/toggle
router.post('/master/test-items/:id/toggle', async (req: Request, res: Response) => {
  try {
    const item = await clinicalPathologyService.toggleTestItemActive(req.params.id);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== 마스터데이터 - QC 설정 ====================

// GET /api/clinical-pathology/master/qc-settings
router.get('/master/qc-settings', async (req: Request, res: Response) => {
  try {
    const settings = await clinicalPathologyService.getQcSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clinical-pathology/master/qc-settings
router.put('/master/qc-settings', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    const result = await clinicalPathologyService.updateQcSettings(settings);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


// ==================== 금액 계산 ====================

// POST /api/clinical-pathology/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const result = await clinicalPathologyService.calculateQuotation(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== 견적서 ====================

// GET /api/clinical-pathology/quotations
router.get('/quotations', async (req: Request, res: Response) => {
  try {
    const { status, customerId, search, dateFrom, dateTo, page, limit } = req.query;
    const result = await clinicalPathologyService.getQuotations({
      status: status as any,
      customerId: customerId as string,
      search: search as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      userId: (req as any).user?.id,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clinical-pathology/quotations/:id
router.get('/quotations/:id', async (req: Request, res: Response) => {
  try {
    const quotation = await clinicalPathologyService.getQuotationById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: '견적서를 찾을 수 없습니다.' });
    }
    res.json(quotation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/quotations
router.post('/quotations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    const result = await clinicalPathologyService.createQuotation({
      ...req.body,
      createdById: userId,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/clinical-pathology/quotations/:id
router.put('/quotations/:id', async (req: Request, res: Response) => {
  try {
    const quotation = await clinicalPathologyService.updateQuotation(req.params.id, req.body);
    res.json(quotation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/clinical-pathology/quotations/:id
router.delete('/quotations/:id', async (req: Request, res: Response) => {
  try {
    await clinicalPathologyService.deleteQuotation(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/quotations/:id/send
router.post('/quotations/:id/send', async (req: Request, res: Response) => {
  try {
    const quotation = await clinicalPathologyService.sendQuotation(req.params.id);
    res.json(quotation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/quotations/:id/accept
router.post('/quotations/:id/accept', async (req: Request, res: Response) => {
  try {
    const quotation = await clinicalPathologyService.acceptQuotation(req.params.id);
    res.json(quotation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/quotations/:id/reject
router.post('/quotations/:id/reject', async (req: Request, res: Response) => {
  try {
    const quotation = await clinicalPathologyService.rejectQuotation(req.params.id);
    res.json(quotation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/quotations/:id/copy
router.post('/quotations/:id/copy', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    const quotation = await clinicalPathologyService.copyQuotation(req.params.id, userId);
    res.json(quotation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/quotations/:id/convert-to-request
router.post('/quotations/:id/convert-to-request', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    const testRequest = await clinicalPathologyService.convertToTestRequest(req.params.id, userId);
    res.json(testRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


// ==================== 시험의뢰서 ====================

// GET /api/clinical-pathology/test-requests
router.get('/test-requests', async (req: Request, res: Response) => {
  try {
    const { status, quotationId, search, dateFrom, dateTo, page, limit } = req.query;
    const result = await clinicalPathologyService.getTestRequests({
      status: status as any,
      quotationId: quotationId as string,
      search: search as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      userId: (req as any).user?.id,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clinical-pathology/test-requests/:id
router.get('/test-requests/:id', async (req: Request, res: Response) => {
  try {
    const request = await clinicalPathologyService.getTestRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: '시험의뢰서를 찾을 수 없습니다.' });
    }
    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clinical-pathology/test-requests/:id
router.put('/test-requests/:id', async (req: Request, res: Response) => {
  try {
    const request = await clinicalPathologyService.updateTestRequest(req.params.id, req.body);
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/clinical-pathology/test-requests/:id
router.delete('/test-requests/:id', async (req: Request, res: Response) => {
  try {
    await clinicalPathologyService.deleteTestRequest(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/test-requests/:id/submit
router.post('/test-requests/:id/submit', async (req: Request, res: Response) => {
  try {
    const request = await clinicalPathologyService.submitTestRequest(req.params.id);
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/test-requests/:id/receive
router.post('/test-requests/:id/receive', async (req: Request, res: Response) => {
  try {
    const request = await clinicalPathologyService.receiveTestRequest(req.params.id, req.body);
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/test-requests/:id/start
router.post('/test-requests/:id/start', async (req: Request, res: Response) => {
  try {
    const request = await clinicalPathologyService.startTestRequest(req.params.id);
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/test-requests/:id/complete
router.post('/test-requests/:id/complete', async (req: Request, res: Response) => {
  try {
    const request = await clinicalPathologyService.completeTestRequest(req.params.id);
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/clinical-pathology/test-requests/:id/cancel
router.post('/test-requests/:id/cancel', async (req: Request, res: Response) => {
  try {
    const request = await clinicalPathologyService.cancelTestRequest(req.params.id);
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== 통계 ====================

// GET /api/clinical-pathology/statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const stats = await clinicalPathologyService.getStatistics(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
