/**
 * Custom Fields API Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as fieldService from '../services/customFieldService';

const router = Router();

// GET /api/custom-fields - 커스텀 필드 정의 목록
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fields = await fieldService.getFields();
    res.json({ success: true, data: fields });
  } catch (error) { next(error); }
});

// POST /api/custom-fields - 커스텀 필드 추가
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, fieldType, options, isRequired, displayOrder } = req.body;
    if (!name || !fieldType) return res.status(400).json({ success: false, error: { message: '필드명과 유형이 필요합니다' } });
    const field = await fieldService.createField({ name, fieldType, options, isRequired, displayOrder, createdBy: req.user!.id });
    res.status(201).json({ success: true, data: field });
  } catch (error) { next(error); }
});

// PATCH /api/custom-fields/:id - 커스텀 필드 수정
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const field = await fieldService.updateField(req.params.id, req.body);
    res.json({ success: true, data: field });
  } catch (error) { next(error); }
});

// DELETE /api/custom-fields/:id - 커스텀 필드 삭제 (비활성화)
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fieldService.deleteField(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
});

// GET /api/custom-fields/values/:customerId - 고객별 커스텀 필드 값
router.get('/values/:customerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const values = await fieldService.getCustomerFieldValues(req.params.customerId);
    res.json({ success: true, data: values });
  } catch (error) { next(error); }
});

// PATCH /api/custom-fields/values/:customerId - 고객별 커스텀 필드 값 수정
router.patch('/values/:customerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { values } = req.body;
    if (!values?.length) return res.status(400).json({ success: false, error: { message: '값이 필요합니다' } });
    await fieldService.setCustomerFieldValues(req.params.customerId, values);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
