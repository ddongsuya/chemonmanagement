/**
 * Filter Presets API Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as presetService from '../services/filterPresetService';

const router = Router();

// GET /api/filter-presets - 프리셋 목록
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const presets = await presetService.getPresets(req.user!.id);
    res.json({ success: true, data: presets });
  } catch (error) { next(error); }
});

// POST /api/filter-presets - 프리셋 저장
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, filters, sortBy, sortOrder } = req.body;
    if (!name || !filters) return res.status(400).json({ success: false, error: { message: '이름과 필터가 필요합니다' } });
    const preset = await presetService.createPreset({ userId: req.user!.id, name, filters, sortBy, sortOrder });
    res.status(201).json({ success: true, data: preset });
  } catch (error) { next(error); }
});

// PATCH /api/filter-presets/:id - 프리셋 수정
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preset = await presetService.updatePreset(req.params.id, req.body);
    res.json({ success: true, data: preset });
  } catch (error) { next(error); }
});

// DELETE /api/filter-presets/:id - 프리셋 삭제
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await presetService.deletePreset(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
