import { PrismaClient, User, UserStatus, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError, ErrorCodes } from '../types/error';
import {
  UserListFilters,
  AdminUserResponse,
  SystemStats,
  UsageStats,
  UsageDataPoint,
  ActivityLogFilters,
  ActivityLogResponse,
  CreateActivityLogDTO,
  SalesStats,
  SalesUserStats,
  SalesMonthStats,
} from '../types/admin';
import { PaginatedResult } from '../types';

const SALT_ROUNDS = 10;
const TEMP_PASSWORD_LENGTH = 12;

export class AdminService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== User Management ====================

  /**
   * Get paginated list of users with optional filters
   */
  async getUsers(filters: UserListFilters): Promise<PaginatedResult<AdminUserResponse>> {
    const { page, limit, search, status, role } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(status && { status }),
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              quotations: true,
              customers: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.toAdminUserResponse(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quotations: true,
            customers: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    return this.toAdminUserResponse(user);
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status,
        // Reset login attempts and lock when activating
        ...(status === 'ACTIVE' && {
          loginAttempts: 0,
          lockedUntil: null,
        }),
      },
      include: {
        _count: {
          select: {
            quotations: true,
            customers: true,
          },
        },
      },
    });

    // If deactivating, invalidate all refresh tokens
    if (status === 'INACTIVE') {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: id },
      });
    }

    return this.toAdminUserResponse(updatedUser);
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: 'USER' | 'ADMIN'): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role },
      include: {
        _count: {
          select: {
            quotations: true,
            customers: true,
          },
        },
      },
    });

    // Invalidate all refresh tokens to force re-login with new role
    await this.prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    return this.toAdminUserResponse(updatedUser);
  }

  /**
   * Reset user password to a temporary password
   */
  async resetUserPassword(id: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    // Update password and reset login attempts
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null,
        status: user.status === UserStatus.LOCKED ? UserStatus.ACTIVE : user.status,
      },
    });

    // Invalidate all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    return tempPassword;
  }

  /**
   * Unlock a locked user account
   */
  async unlockUser(id: string): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (user.status !== UserStatus.LOCKED) {
      throw new AppError('잠금 상태가 아닌 계정입니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
        loginAttempts: 0,
        lockedUntil: null,
      },
      include: {
        _count: {
          select: {
            quotations: true,
            customers: true,
          },
        },
      },
    });

    return this.toAdminUserResponse(updatedUser);
  }

  // ==================== Statistics ====================

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      lockedUsers,
      todayQuotations,
      totalQuotations,
      todayCustomers,
      totalCustomers,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.LOCKED } }),
      this.prisma.quotation.count({
        where: {
          createdAt: { gte: today },
          deletedAt: null,
        },
      }),
      this.prisma.quotation.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({
        where: {
          createdAt: { gte: today },
          deletedAt: null,
        },
      }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      lockedUsers,
      todayQuotations,
      totalQuotations,
      todayCustomers,
      totalCustomers,
      recentActivity: recentActivity.map((log) => this.toActivityLogResponse(log)),
    };
  }


  /**
   * Get usage statistics for a period
   */
  async getUsageStats(
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): Promise<UsageStats> {
    const data: UsageDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [newUsers, newQuotations, newCustomers, activeUsers] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        }),
        this.prisma.quotation.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            deletedAt: null,
          },
        }),
        this.prisma.customer.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: {
            lastLoginAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        }),
      ]);

      data.push({
        date: dayStart.toISOString().split('T')[0],
        newUsers,
        newQuotations,
        newCustomers,
        activeUsers,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      period,
      startDate,
      endDate,
      data,
    };
  }

  // ==================== Sales Statistics ====================

  /**
   * Get sales statistics (admin only - requires canViewAllSales permission)
   */
  async getSalesStats(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'month' | 'user' | 'modality' = 'month'
  ): Promise<SalesStats> {
    // 전체 견적 통계
    const quotations = await this.prisma.quotation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    // 전체 계약 통계
    const contracts = await this.prisma.contract.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    // 총계 계산
    const totalQuotationAmount = quotations.reduce(
      (sum, q) => sum + Number(q.totalAmount || 0),
      0
    );
    const totalContractAmount = contracts.reduce(
      (sum, c) => sum + Number(c.totalAmount || 0),
      0
    );
    const totalPaidAmount = contracts.reduce(
      (sum, c) => sum + Number(c.paidAmount || 0),
      0
    );

    // 상태별 견적 수
    const quotationsByStatus = quotations.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 상태별 계약 수
    const contractsByStatus = contracts.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 사용자별 통계
    const byUser: SalesUserStats[] = [];
    const userMap = new Map<string, { name: string; department: string | null; quotations: number; contracts: number; quotationAmount: number; contractAmount: number }>();

    quotations.forEach((q) => {
      const existing = userMap.get(q.userId) || {
        name: q.user.name,
        department: q.user.department,
        quotations: 0,
        contracts: 0,
        quotationAmount: 0,
        contractAmount: 0,
      };
      existing.quotations += 1;
      existing.quotationAmount += Number(q.totalAmount || 0);
      userMap.set(q.userId, existing);
    });

    contracts.forEach((c) => {
      const existing = userMap.get(c.userId) || {
        name: c.user.name,
        department: c.user.department,
        quotations: 0,
        contracts: 0,
        quotationAmount: 0,
        contractAmount: 0,
      };
      existing.contracts += 1;
      existing.contractAmount += Number(c.totalAmount || 0);
      userMap.set(c.userId, existing);
    });

    userMap.forEach((stats, userId) => {
      byUser.push({
        userId,
        userName: stats.name,
        department: stats.department,
        quotationCount: stats.quotations,
        contractCount: stats.contracts,
        quotationAmount: stats.quotationAmount,
        contractAmount: stats.contractAmount,
        conversionRate: stats.quotations > 0 ? (stats.contracts / stats.quotations) * 100 : 0,
      });
    });

    // 월별 통계
    const byMonth: SalesMonthStats[] = [];
    const monthMap = new Map<string, { quotations: number; contracts: number; quotationAmount: number; contractAmount: number }>();

    quotations.forEach((q) => {
      const month = q.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthMap.get(month) || { quotations: 0, contracts: 0, quotationAmount: 0, contractAmount: 0 };
      existing.quotations += 1;
      existing.quotationAmount += Number(q.totalAmount || 0);
      monthMap.set(month, existing);
    });

    contracts.forEach((c) => {
      const month = c.createdAt.toISOString().slice(0, 7);
      const existing = monthMap.get(month) || { quotations: 0, contracts: 0, quotationAmount: 0, contractAmount: 0 };
      existing.contracts += 1;
      existing.contractAmount += Number(c.totalAmount || 0);
      monthMap.set(month, existing);
    });

    monthMap.forEach((stats, month) => {
      byMonth.push({
        month,
        quotationCount: stats.quotations,
        contractCount: stats.contracts,
        quotationAmount: stats.quotationAmount,
        contractAmount: stats.contractAmount,
      });
    });

    byMonth.sort((a, b) => a.month.localeCompare(b.month));

    return {
      period: { startDate, endDate },
      summary: {
        totalQuotations: quotations.length,
        totalContracts: contracts.length,
        totalQuotationAmount,
        totalContractAmount,
        totalPaidAmount,
        conversionRate: quotations.length > 0 ? (contracts.length / quotations.length) * 100 : 0,
      },
      quotationsByStatus,
      contractsByStatus,
      byUser: byUser.sort((a, b) => b.contractAmount - a.contractAmount),
      byMonth,
    };
  }

  // ==================== Activity Logs ====================

  /**
   * Create activity log entry
   */
  async createActivityLog(data: CreateActivityLogDTO): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        details: data.details as Prisma.InputJsonValue | undefined,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  }

  /**
   * Get activity logs with pagination and filters
   */
  async getActivityLogs(
    filters: ActivityLogFilters
  ): Promise<PaginatedResult<ActivityLogResponse>> {
    const { page, limit, userId, action, resource, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action: { contains: action, mode: 'insensitive' } }),
      ...(resource && { resource: { contains: resource, mode: 'insensitive' } }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => this.toActivityLogResponse(log)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Generate a random temporary password
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Convert User to AdminUserResponse
   */
  private toAdminUserResponse(
    user: User & {
      _count?: {
        quotations: number;
        customers: number;
      };
    }
  ): AdminUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      position: user.position,
      title: user.title,
      role: user.role,
      status: user.status,
      canViewAllSales: user.canViewAllSales,
      canViewAllData: user.canViewAllData,
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: user._count,
    };
  }

  /**
   * Convert ActivityLog to ActivityLogResponse
   */
  private toActivityLogResponse(
    log: {
      id: string;
      userId: string;
      action: string;
      resource: string;
      resourceId: string | null;
      details: Prisma.JsonValue;
      ipAddress: string | null;
      userAgent: string | null;
      createdAt: Date;
      user: {
        name: string;
        email: string;
      };
    }
  ): ActivityLogResponse {
    return {
      id: log.id,
      userId: log.userId,
      userName: log.user.name,
      userEmail: log.user.email,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };
  }
}

export default AdminService;
