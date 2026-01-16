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
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
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
