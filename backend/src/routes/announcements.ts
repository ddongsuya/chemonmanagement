import { Router, Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcementService';
import { prisma } from '../lib/prisma';
import {
  authenticate,
  requireAdmin,
  validateQuery,
  validateBody,
  activityLogger,
} from '../middleware';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementFiltersSchema,
  createCommentSchema,
  updateCommentSchema,
} from '../types/announcement';

const router = Router();
const announcementService = new AnnouncementService(prisma);

// ==================== Public Routes (User) ====================

/**
 * GET /api/announcements
 * Get active announcements (for users)
 * Returns only announcements within publication period
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const announcements = await announcementService.getActive();
      res.json({ success: true, data: announcements });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/announcements/:id
 * Get active announcement by ID (for users)
 * Also increments view count
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const announcement = await announcementService.getActiveById(id, userId);
      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Comment Routes ====================

/**
 * GET /api/announcements/:id/comments
 * Get comments for an announcement
 */
router.get(
  '/:id/comments',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const comments = await announcementService.getComments(id);
      res.json({ success: true, data: comments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/announcements/:id/comments
 * Create a comment on an announcement
 */
router.post(
  '/:id/comments',
  authenticate,
  validateBody(createCommentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data = createCommentSchema.parse(req.body);
      const comment = await announcementService.createComment(id, userId, data);
      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/announcements/:announcementId/comments/:commentId
 * Update a comment
 */
router.put(
  '/:announcementId/comments/:commentId',
  authenticate,
  validateBody(updateCommentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;
      const data = updateCommentSchema.parse(req.body);
      const comment = await announcementService.updateComment(commentId, userId, data);
      res.json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/announcements/:announcementId/comments/:commentId
 * Delete a comment
 */
router.delete(
  '/:announcementId/comments/:commentId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';
      await announcementService.deleteComment(commentId, userId, isAdmin);
      res.json({ success: true, message: '댓글이 삭제되었습니다' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
