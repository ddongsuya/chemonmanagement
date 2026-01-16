import { Router, Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import { prisma } from '../lib/prisma';
import {
  authenticate,
  validateQuery,
  activityLogger,
} from '../middleware';
import { notificationFiltersSchema } from '../types/notification';

const router = Router();
const notificationService = new NotificationService(prisma);

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * Returns notifications sorted by createdAt in descending order (newest first)
 */
router.get(
  '/',
  authenticate,
  validateQuery(notificationFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const filters = req.query as unknown as {
        type?: 'ANNOUNCEMENT' | 'SYSTEM' | 'REMINDER';
        isRead?: boolean;
        page: number;
        limit: number;
      };

      const result = await notificationService.getByUser(userId, {
        type: filters.type,
        isRead: filters.isRead,
        page: filters.page || 1,
        limit: filters.limit || 20,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the authenticated user
 */
router.get(
  '/unread-count',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch(
  '/:id/read',
  authenticate,
  activityLogger('NOTIFICATION_READ', 'notification'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await notificationService.markAsRead(userId, id);

      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.post(
  '/read-all',
  authenticate,
  activityLogger('NOTIFICATION_READ_ALL', 'notification'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const count = await notificationService.markAllAsRead(userId);

      res.json({ success: true, data: { markedAsRead: count } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
