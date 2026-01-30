import { PrismaClient, Announcement, AnnouncementPriority, Prisma, UserStatus } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  CreateAnnouncementDTO,
  UpdateAnnouncementDTO,
  AnnouncementFilters,
  AnnouncementResponse,
  AnnouncementViewStats,
  CreateCommentDTO,
  UpdateCommentDTO,
  CommentResponse,
} from '../types/announcement';
import { PaginatedResult } from '../types';

export class AnnouncementService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Admin Methods ====================

  /**
   * Create a new announcement (admin only)
   */
  async create(adminId: string, data: CreateAnnouncementDTO): Promise<AnnouncementResponse> {
    // Validate date range
    if (data.endDate <= data.startDate) {
      throw new AppError('종료일은 시작일 이후여야 합니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: adminId,
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notifications for HIGH/URGENT priority announcements
    if (data.priority === 'HIGH' || data.priority === 'URGENT') {
      await this.createNotificationsForAnnouncement(announcement);
    }

    return this.toAnnouncementResponse(announcement);
  }

  /**
   * Update an announcement (admin only)
   */
  async update(id: string, data: UpdateAnnouncementDTO): Promise<AnnouncementResponse> {
    const existing = await this.prisma.announcement.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new AppError('공지사항을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Validate date range if both dates are provided
    const startDate = data.startDate || existing.startDate;
    const endDate = data.endDate || existing.endDate;
    if (endDate <= startDate) {
      throw new AppError('종료일은 시작일 이후여야 합니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.priority && { priority: data.priority }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toAnnouncementResponse(announcement);
  }

  /**
   * Soft delete an announcement (admin only)
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.announcement.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new AppError('공지사항을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    await this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get all announcements with pagination and filters (admin only)
   */
  async getAll(filters: AnnouncementFilters): Promise<PaginatedResult<AnnouncementResponse>> {
    const { page, limit, search, priority, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {
      deletedAt: null,
      ...(priority && { priority }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data: announcements.map((a) => this.toAnnouncementResponse(a)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get announcement by ID (admin only)
   */
  async getById(id: string): Promise<AnnouncementResponse> {
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new AppError('공지사항을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    return this.toAnnouncementResponse(announcement);
  }

  // ==================== User Methods ====================

  /**
   * Get active announcements (for users)
   * Returns only announcements that are:
   * - Active (isActive = true)
   * - Within the publication period (startDate <= now <= endDate)
   * - Not deleted
   */
  async getActive(): Promise<AnnouncementResponse[]> {
    const now = new Date();

    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    return announcements.map((a) => this.toAnnouncementResponse(a));
  }

  /**
   * Get active announcement by ID (for users)
   * Also increments view count
   */
  async getActiveById(id: string, userId?: string): Promise<AnnouncementResponse> {
    const now = new Date();

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new AppError('공지사항을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Increment view count
    await this.incrementViewCount(id, userId);

    return this.toAnnouncementResponse(announcement);
  }

  /**
   * Increment view count for an announcement
   */
  async incrementViewCount(id: string, userId?: string): Promise<void> {
    // Always increment total view count
    await this.prisma.announcement.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // If userId is provided, record unique view
    if (userId) {
      try {
        await this.prisma.announcementView.create({
          data: {
            announcementId: id,
            userId,
          },
        });
      } catch {
        // Ignore duplicate view error (user already viewed)
      }
    }
  }

  /**
   * Get view statistics for an announcement (admin only)
   */
  async getViewStats(id: string): Promise<AnnouncementViewStats> {
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!announcement) {
      throw new AppError('공지사항을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const uniqueViews = await this.prisma.announcementView.count({
      where: { announcementId: id },
    });

    // Get views grouped by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const views = await this.prisma.announcementView.findMany({
      where: {
        announcementId: id,
        viewedAt: { gte: thirtyDaysAgo },
      },
      select: {
        viewedAt: true,
      },
    });

    // Group by date
    const viewsByDateMap = new Map<string, number>();
    views.forEach((view) => {
      const dateStr = view.viewedAt.toISOString().split('T')[0];
      viewsByDateMap.set(dateStr, (viewsByDateMap.get(dateStr) || 0) + 1);
    });

    const viewsByDate = Array.from(viewsByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalViews: announcement.viewCount,
      uniqueViews,
      viewsByDate,
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Create notifications for all active users when a high-priority announcement is created
   */
  private async createNotificationsForAnnouncement(
    announcement: Announcement
  ): Promise<void> {
    // Get all active users
    const activeUsers = await this.prisma.user.findMany({
      where: { status: UserStatus.ACTIVE },
      select: { id: true },
    });

    if (activeUsers.length === 0) return;

    // Create notifications in bulk
    await this.prisma.notification.createMany({
      data: activeUsers.map((user) => ({
        userId: user.id,
        type: 'ANNOUNCEMENT',
        title: `[${announcement.priority === 'URGENT' ? '긴급' : '중요'}] ${announcement.title}`,
        message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
        link: `/announcements/${announcement.id}`,
      })),
    });
  }

  /**
   * Convert Prisma Announcement to AnnouncementResponse
   */
  private toAnnouncementResponse(
    announcement: Announcement & {
      creator?: { name: string } | null;
    }
  ): AnnouncementResponse {
    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      isActive: announcement.isActive,
      viewCount: announcement.viewCount,
      createdBy: announcement.createdBy,
      creatorName: announcement.creator?.name,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      deletedAt: announcement.deletedAt,
    };
  }

  // ==================== Comment Methods ====================

  /**
   * Get comments for an announcement
   */
  async getComments(announcementId: string): Promise<CommentResponse[]> {
    const comments = await this.prisma.announcementComment.findMany({
      where: {
        announcementId,
        parentId: null, // Only top-level comments
        deletedAt: null,
      },
      include: {
        user: {
          select: { name: true },
        },
        replies: {
          where: { deletedAt: null },
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((c) => this.toCommentResponse(c));
  }

  /**
   * Create a comment
   */
  async createComment(
    announcementId: string,
    userId: string,
    data: CreateCommentDTO
  ): Promise<CommentResponse> {
    // Verify announcement exists and is active
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id: announcementId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!announcement) {
      throw new AppError('공지사항을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // If parentId is provided, verify parent comment exists
    if (data.parentId) {
      const parentComment = await this.prisma.announcementComment.findFirst({
        where: {
          id: data.parentId,
          announcementId,
          deletedAt: null,
        },
      });

      if (!parentComment) {
        throw new AppError('상위 댓글을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
      }
    }

    const comment = await this.prisma.announcementComment.create({
      data: {
        announcementId,
        userId,
        content: data.content,
        parentId: data.parentId || null,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return this.toCommentResponse(comment);
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    data: UpdateCommentDTO
  ): Promise<CommentResponse> {
    const comment = await this.prisma.announcementComment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new AppError('댓글을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Only the author can update their comment
    if (comment.userId !== userId) {
      throw new AppError('본인의 댓글만 수정할 수 있습니다', 403, ErrorCodes.FORBIDDEN);
    }

    const updated = await this.prisma.announcementComment.update({
      where: { id: commentId },
      data: { content: data.content },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return this.toCommentResponse(updated);
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string, userId: string, isAdmin: boolean): Promise<void> {
    const comment = await this.prisma.announcementComment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new AppError('댓글을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Only the author or admin can delete
    if (comment.userId !== userId && !isAdmin) {
      throw new AppError('본인의 댓글만 삭제할 수 있습니다', 403, ErrorCodes.FORBIDDEN);
    }

    await this.prisma.announcementComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Convert Prisma Comment to CommentResponse
   */
  private toCommentResponse(
    comment: any
  ): CommentResponse {
    return {
      id: comment.id,
      announcementId: comment.announcementId,
      userId: comment.userId,
      userName: comment.user?.name || '알 수 없음',
      content: comment.content,
      parentId: comment.parentId,
      replies: comment.replies?.map((r: any) => this.toCommentResponse(r)),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
