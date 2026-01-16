import { PrismaClient, Notification, NotificationType, Prisma } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  CreateNotificationDTO,
  NotificationFilters,
  NotificationResponse,
  BulkCreateNotificationDTO,
} from '../types/notification';
import { PaginatedResult } from '../types';

export class NotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a single notification for a user
   */
  async create(userId: string, data: CreateNotificationDTO): Promise<NotificationResponse> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    return this.toNotificationResponse(notification);
  }

  /**
   * Create notifications for multiple users (bulk)
   */
  async createBulk(data: BulkCreateNotificationDTO): Promise<number> {
    if (data.userIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.notification.createMany({
      data: data.userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      })),
    });

    return result.count;
  }

  /**
   * Get notifications for a user with pagination and filters
   * Returns notifications sorted by createdAt in descending order (newest first)
   */
  async getByUser(
    userId: string,
    filters: NotificationFilters
  ): Promise<PaginatedResult<NotificationResponse>> {
    const { page, limit, type, isRead } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications.map((n) => this.toNotificationResponse(n)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<NotificationResponse> {
    // Find notification and verify ownership
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('알림을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return this.toNotificationResponse(updated);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Delete old read notifications (cleanup job)
   * Deletes notifications that are read and older than specified days
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Get notification by ID (with ownership check)
   */
  async getById(userId: string, notificationId: string): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('알림을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    return this.toNotificationResponse(notification);
  }

  /**
   * Convert Prisma Notification to NotificationResponse
   */
  private toNotificationResponse(notification: Notification): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      link: notification.link,
      createdAt: notification.createdAt,
    };
  }
}

export default NotificationService;
