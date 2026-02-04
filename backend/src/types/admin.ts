import { z } from 'zod';

// Validation schemas
export const userListFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export const activityLogFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const usageStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// Types
export type UserListFilters = z.infer<typeof userListFiltersSchema>;
export type UpdateUserStatusDTO = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleDTO = z.infer<typeof updateUserRoleSchema>;
export type ActivityLogFilters = z.infer<typeof activityLogFiltersSchema>;
export type UsageStatsParams = z.infer<typeof usageStatsSchema>;

export interface AdminUserResponse {
  id: string;
  email: string;
  name: string;
  department: 'BD1' | 'BD2' | 'SUPPORT' | null;
  position: 'MANAGER' | 'CENTER_HEAD' | 'DIVISION_HEAD' | 'CEO' | 'CHAIRMAN' | null;
  title: 'TEAM_LEADER' | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  canViewAllSales: boolean;
  canViewAllData: boolean;
  loginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    quotations: number;
    customers: number;
  };
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  todayQuotations: number;
  totalQuotations: number;
  todayCustomers: number;
  totalCustomers: number;
  recentActivity: ActivityLogResponse[];
}

export interface UsageStats {
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  data: UsageDataPoint[];
}

export interface UsageDataPoint {
  date: string;
  newUsers: number;
  newQuotations: number;
  newCustomers: number;
  activeUsers: number;
}

export interface ActivityLogResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CreateActivityLogDTO {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Sales Statistics Types
export interface SalesStats {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalQuotations: number;
    totalContracts: number;
    totalQuotationAmount: number;
    totalContractAmount: number;
    totalPaidAmount: number;
    conversionRate: number;
  };
  quotationsByStatus: Record<string, number>;
  contractsByStatus: Record<string, number>;
  byUser: SalesUserStats[];
  byMonth: SalesMonthStats[];
}

export interface SalesUserStats {
  userId: string;
  userName: string;
  department: string | null;
  quotationCount: number;
  contractCount: number;
  quotationAmount: number;
  contractAmount: number;
  conversionRate: number;
}

export interface SalesMonthStats {
  month: string;
  quotationCount: number;
  contractCount: number;
  quotationAmount: number;
  contractAmount: number;
}

export const salesStatsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  groupBy: z.enum(['day', 'month', 'user', 'modality']).optional().default('month'),
});

export type SalesStatsParams = z.infer<typeof salesStatsSchema>;
