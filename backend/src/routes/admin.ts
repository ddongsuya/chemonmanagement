import { Router, Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { AnnouncementService } from '../services/announcementService';
import { SettingsService } from '../services/settingsService';
import { BackupService } from '../services/backupService';
import { prisma } from '../lib/prisma';
import {
  authenticate,
  requireAdmin,
  validateQuery,
  validateBody,
  activityLogger,
} from '../middleware';
import {
  userListFiltersSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  activityLogFiltersSchema,
  usageStatsSchema,
  salesStatsSchema,
} from '../types/admin';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementFiltersSchema,
} from '../types/announcement';
import {
  updateSettingsSchema,
  settingsHistoryQuerySchema,
} from '../types/settings';
import {
  createBackupSchema,
  backupFiltersSchema,
} from '../types/backup';
import { AppError, ErrorCodes } from '../types/error';

const router = Router();
const adminService = new AdminService(prisma);
const announcementService = new AnnouncementService(prisma);
const settingsService = new SettingsService(prisma);
const backupService = new BackupService(prisma);

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ==================== User Management Routes ====================

/**
 * GET /api/admin/users
 * Get paginated list of users with optional filters
 */
router.get(
  '/users',
  validateQuery(userListFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = userListFiltersSchema.parse(req.query);
      const result = await adminService.getUsers(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
router.get(
  '/users/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/status
 * Update user status (activate/deactivate)
 */
router.patch(
  '/users/:id/status',
  validateBody(updateUserStatusSchema),
  activityLogger('STATUS_CHANGE', 'user'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = updateUserStatusSchema.parse(req.body);
      const user = await adminService.updateUserStatus(id, status);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/role
 * Update user role
 */
router.patch(
  '/users/:id/role',
  validateBody(updateUserRoleSchema),
  activityLogger('ROLE_CHANGE', 'user'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role } = updateUserRoleSchema.parse(req.body);
      const user = await adminService.updateUserRole(id, role);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password to temporary password
 */
router.post(
  '/users/:id/reset-password',
  activityLogger('PASSWORD_RESET', 'user'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tempPassword = await adminService.resetUserPassword(id);
      res.json({
        success: true,
        data: {
          message: '비밀번호가 초기화되었습니다',
          tempPassword,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/users/:id/unlock
 * Unlock a locked user account
 */
router.post(
  '/users/:id/unlock',
  activityLogger('UNLOCK', 'user'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await adminService.unlockUser(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/permissions
 * Update user permissions (canViewAllSales, etc.)
 */
router.patch(
  '/users/:id/permissions',
  activityLogger('PERMISSION_CHANGE', 'user'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { canViewAllSales } = req.body;
      
      const user = await prisma.user.update({
        where: { id },
        data: { canViewAllSales },
        include: {
          _count: {
            select: {
              quotations: true,
              customers: true,
            },
          },
        },
      });
      
      res.json({ 
        success: true, 
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          canViewAllSales: user.canViewAllSales,
          department: user.department,
          position: user.position,
          _count: user._count,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);


// ==================== Statistics Routes ====================

/**
 * GET /api/admin/stats
 * Get system statistics
 */
router.get(
  '/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminService.getSystemStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/stats/usage
 * Get usage statistics for a period
 */
router.get(
  '/stats/usage',
  validateQuery(usageStatsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period, startDate, endDate } = usageStatsSchema.parse(req.query);
      const stats = await adminService.getUsageStats(period, startDate, endDate);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/stats/sales
 * Get sales statistics (requires canViewAllSales permission)
 */
router.get(
  '/stats/sales',
  validateQuery(salesStatsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user has permission to view all sales
      if (!req.user?.canViewAllSales && req.user?.role !== 'ADMIN') {
        throw new AppError('전체 매출 조회 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
      }
      
      const { startDate, endDate, groupBy } = salesStatsSchema.parse(req.query);
      const stats = await adminService.getSalesStats(startDate, endDate, groupBy);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Activity Log Routes ====================

/**
 * GET /api/admin/logs
 * Get activity logs with pagination and filters
 */
router.get(
  '/logs',
  validateQuery(activityLogFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = activityLogFiltersSchema.parse(req.query);
      const result = await adminService.getActivityLogs(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Announcement Management Routes ====================

/**
 * GET /api/admin/announcements
 * Get all announcements with pagination and filters (admin only)
 */
router.get(
  '/announcements',
  validateQuery(announcementFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = announcementFiltersSchema.parse(req.query);
      const result = await announcementService.getAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/announcements/:id
 * Get announcement by ID (admin only)
 */
router.get(
  '/announcements/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const announcement = await announcementService.getById(id);
      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/announcements/:id/stats
 * Get announcement view statistics (admin only)
 */
router.get(
  '/announcements/:id/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const stats = await announcementService.getViewStats(id);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/announcements
 * Create a new announcement (admin only)
 */
router.post(
  '/announcements',
  validateBody(createAnnouncementSchema),
  activityLogger('CREATE', 'announcement'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createAnnouncementSchema.parse(req.body);
      const adminId = req.user!.id;
      const announcement = await announcementService.create(adminId, data);
      res.status(201).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/announcements/:id
 * Update an announcement (admin only)
 */
router.put(
  '/announcements/:id',
  validateBody(updateAnnouncementSchema),
  activityLogger('UPDATE', 'announcement'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateAnnouncementSchema.parse(req.body);
      const announcement = await announcementService.update(id, data);
      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/announcements/:id
 * Soft delete an announcement (admin only)
 */
router.delete(
  '/announcements/:id',
  activityLogger('DELETE', 'announcement'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await announcementService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Settings Routes ====================

/**
 * GET /api/admin/settings
 * Get all system settings
 */
router.get(
  '/settings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.get();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/settings
 * Update system settings
 */
router.put(
  '/settings',
  validateBody(updateSettingsSchema),
  activityLogger('UPDATE', 'settings'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateSettingsSchema.parse(req.body);
      const adminId = req.user!.id;
      const settings = await settingsService.update(adminId, data);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/settings/history
 * Get settings change history
 */
router.get(
  '/settings/history',
  validateQuery(settingsHistoryQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = settingsHistoryQuerySchema.parse(req.query);
      const history = await settingsService.getChangeHistory(limit);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Backup Routes ====================

/**
 * GET /api/admin/backups
 * Get list of backups with pagination and filters
 */
router.get(
  '/backups',
  validateQuery(backupFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = backupFiltersSchema.parse(req.query);
      const result = await backupService.getAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/backups/:id
 * Get backup by ID
 */
router.get(
  '/backups/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const backup = await backupService.getById(id);
      res.json({ success: true, data: backup });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/backups
 * Create a new manual backup
 */
router.post(
  '/backups',
  validateBody(createBackupSchema),
  activityLogger('CREATE', 'backup'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createBackupSchema.parse(req.body);
      const backup = await backupService.create(data);
      res.status(201).json({ success: true, data: backup });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/backups/:id
 * Delete a backup
 */
router.delete(
  '/backups/:id',
  activityLogger('DELETE', 'backup'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await backupService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
