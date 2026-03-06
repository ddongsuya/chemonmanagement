/**
 * Customer Notes API Routes
 * 메모 CRUD
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as noteService from '../services/customerNoteService';

const router = Router();

// GET /api/customer-notes/:customerId - 메모 목록
router.get('/:customerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await noteService.getNotes(req.params.customerId, page, limit);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

// POST /api/customer-notes/:customerId - 메모 작성
router.post('/:customerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, mentions } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { message: '내용이 필요합니다' } });
    const note = await noteService.createNote({
      customerId: req.params.customerId,
      content,
      mentions,
      createdBy: req.user!.id,
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) { next(error); }
});

// PATCH /api/customer-notes/:customerId/:noteId - 메모 수정
router.patch('/:customerId/:noteId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, isPinned } = req.body;
    const note = await noteService.updateNote(req.params.noteId, { content, isPinned });
    res.json({ success: true, data: note });
  } catch (error) { next(error); }
});

// DELETE /api/customer-notes/:customerId/:noteId - 메모 삭제
router.delete('/:customerId/:noteId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await noteService.deleteNote(req.params.noteId);
    res.status(204).send();
  } catch (error) { next(error); }
});

// PATCH /api/customer-notes/:customerId/:noteId/pin - 고정 토글
router.patch('/:customerId/:noteId/pin', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = await noteService.togglePin(req.params.noteId);
    res.json({ success: true, data: note });
  } catch (error) { next(error); }
});

export default router;
