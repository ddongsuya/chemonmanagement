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

export default router;
