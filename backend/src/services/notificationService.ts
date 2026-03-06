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

  // ==================== CRM 확장 알림 메서드 ====================

  /**
   * 관리자 사용자 ID 목록 조회 (알림 수신 대상)
   */
  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  /**
   * 비활동 리마인더 알림 (14일 이상 비활동 고객)
   */
  async sendInactivityReminders(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const inactiveCustomers = await this.prisma.customer.findMany({
      where: { updatedAt: { lt: cutoff }, grade: { notIn: ['INACTIVE'] } },
      select: { id: true, company: true, userId: true },
      take: 100,
    });

    const adminIds = await this.getAdminUserIds();
    let count = 0;
    for (const cust of inactiveCustomers) {
      const targetIds = [...new Set([cust.userId, ...adminIds])];
      for (const uid of targetIds) {
        await this.prisma.notification.create({
          data: {
            userId: uid,
            type: 'SYSTEM',
            title: '비활동 고객 리마인더',
            message: `${cust.company || '고객'}이(가) 14일 이상 비활동 상태입니다.`,
            link: `/customers/${cust.id}`,
          },
        });
        count++;
      }
    }
    return count;
  }

  /**
   * 이탈 위험 알림 (churnRiskScore >= 70)
   */
  async sendChurnRiskAlerts(): Promise<number> {
    const highRisk = await this.prisma.customerHealthScore.findMany({
      where: { churnRiskScore: { gte: 70 } },
      include: { customer: { select: { id: true, company: true, userId: true } } },
      orderBy: { calculatedAt: 'desc' },
      distinct: ['customerId'],
      take: 50,
    });

    const adminIds = await this.getAdminUserIds();
    let count = 0;
    for (const hs of highRisk) {
      const targetIds = [...new Set([hs.customer?.userId, ...adminIds].filter(Boolean))] as string[];
      for (const uid of targetIds) {
        await this.prisma.notification.create({
          data: {
            userId: uid,
            type: 'SYSTEM',
            title: '이탈 위험 경고',
            message: `${hs.customer?.company || '고객'}의 이탈 위험 점수가 ${hs.churnRiskScore}점입니다.`,
            link: `/customers/${hs.customerId}`,
          },
        });
        count++;
      }
    }
    return count;
  }

  /**
   * 계약 만료 알림 (30일 이내 만료 예정)
   */
  async sendContractExpiryAlerts(): Promise<number> {
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const expiringContracts = await this.prisma.contract.findMany({
      where: {
        endDate: { lte: thirtyDaysLater, gte: new Date() },
        status: 'IN_PROGRESS',
      },
      include: { customer: { select: { id: true, company: true, userId: true } } },
      take: 50,
    });

    const adminIds = await this.getAdminUserIds();
    let count = 0;
    for (const contract of expiringContracts) {
      const targetIds = [...new Set([contract.customer?.userId, ...adminIds].filter(Boolean))] as string[];
      const daysLeft = Math.ceil((new Date(contract.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      for (const uid of targetIds) {
        await this.prisma.notification.create({
          data: {
            userId: uid,
            type: 'SYSTEM',
            title: '계약 만료 예정',
            message: `${contract.customer?.company || '고객'}의 계약이 ${daysLeft}일 후 만료됩니다.`,
            link: `/customers/${contract.customerId}`,
          },
        });
        count++;
      }
    }
    return count;
  }

  /**
   * 미수금 연체 에스컬레이션 알림 (30일 이상 연체)
   */
  async sendOverduePaymentAlerts(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueSchedules = await this.prisma.paymentSchedule.findMany({
      where: {
        scheduledDate: { lt: thirtyDaysAgo },
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: {
        contract: {
          include: { customer: { select: { id: true, company: true, userId: true } } },
        },
      },
      take: 50,
    });

    const adminIds = await this.getAdminUserIds();
    let count = 0;
    for (const ps of overdueSchedules) {
      const targetIds = [...new Set([ps.contract?.customer?.userId, ...adminIds].filter(Boolean))] as string[];
      for (const uid of targetIds) {
        await this.prisma.notification.create({
          data: {
            userId: uid,
            type: 'SYSTEM',
            title: '미수금 연체 경고',
            message: `${ps.contract?.customer?.company || '고객'}의 미수금이 30일 이상 연체되었습니다.`,
            link: `/customers/${ps.contract?.customerId}`,
          },
        });
        count++;
      }
    }
    return count;
  }
}

export default NotificationService;
