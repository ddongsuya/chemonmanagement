// Admin API functions
import { getAccessToken } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  loginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    quotations: number;
    customers: number;
  };
}

export interface UserListFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  role?: 'USER' | 'ADMIN';
  page?: number;
  limit?: number;
}

// System stats types
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  todayQuotations: number;
  totalQuotations: number;
  todayCustomers: number;
  totalCustomers: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
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
  createdAt: string;
}

// Announcement types
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  startDate: string;
  endDate: string;
  isActive: boolean;
  viewCount: number;
  createdBy: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAnnouncementDTO {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  startDate: string;
  endDate: string;
}

export interface UpdateAnnouncementDTO {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface AnnouncementFilters {
  search?: string;
  priority?: AnnouncementPriority;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Settings types
export interface SystemSettings {
  allowRegistration: boolean;
  defaultUserRole: 'USER';
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
}

export interface SettingChange {
  id: string;
  key: string;
  oldValue: string | null;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export interface UpdateSettingsDTO {
  allowRegistration?: boolean;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpFrom?: string;
}

// API request helper with authentication
async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.',
      },
    };
  }
}

// Build query string from filters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

// ============ User Management APIs ============

export async function getUsers(
  filters: UserListFilters = {}
): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
  const query = buildQueryString(filters);
  return adminFetch<PaginatedResult<AdminUser>>(`/api/admin/users?${query}`);
}

export async function getUserById(id: string): Promise<ApiResponse<AdminUser>> {
  return adminFetch<AdminUser>(`/api/admin/users/${id}`);
}

export async function updateUserStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<ApiResponse<AdminUser>> {
  return adminFetch<AdminUser>(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateUserRole(
  id: string,
  role: 'USER' | 'ADMIN'
): Promise<ApiResponse<AdminUser>> {
  return adminFetch<AdminUser>(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function resetUserPassword(
  id: string
): Promise<ApiResponse<{ tempPassword: string }>> {
  return adminFetch<{ tempPassword: string }>(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
  });
}

// ============ System Stats APIs ============

export async function getSystemStats(): Promise<ApiResponse<SystemStats>> {
  return adminFetch<SystemStats>('/api/admin/stats');
}

export async function getActivityLogs(
  filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ApiResponse<PaginatedResult<ActivityLog>>> {
  const query = buildQueryString(filters);
  return adminFetch<PaginatedResult<ActivityLog>>(`/api/admin/logs?${query}`);
}

// ============ Announcement APIs ============

export async function getAnnouncements(
  filters: AnnouncementFilters = {}
): Promise<ApiResponse<PaginatedResult<Announcement>>> {
  const query = buildQueryString(filters);
  return adminFetch<PaginatedResult<Announcement>>(`/api/admin/announcements?${query}`);
}

export async function getAnnouncementById(
  id: string
): Promise<ApiResponse<Announcement>> {
  return adminFetch<Announcement>(`/api/admin/announcements/${id}`);
}

export async function createAnnouncement(
  data: CreateAnnouncementDTO
): Promise<ApiResponse<Announcement>> {
  return adminFetch<Announcement>('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementDTO
): Promise<ApiResponse<Announcement>> {
  return adminFetch<Announcement>(`/api/admin/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAnnouncement(
  id: string
): Promise<ApiResponse<void>> {
  return adminFetch<void>(`/api/admin/announcements/${id}`, {
    method: 'DELETE',
  });
}

// ============ Settings APIs ============

export async function getSettings(): Promise<ApiResponse<SystemSettings>> {
  return adminFetch<SystemSettings>('/api/admin/settings');
}

export async function updateSettings(
  data: UpdateSettingsDTO
): Promise<ApiResponse<SystemSettings>> {
  return adminFetch<SystemSettings>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getSettingsHistory(
  limit: number = 50
): Promise<ApiResponse<SettingChange[]>> {
  return adminFetch<SettingChange[]>(`/api/admin/settings/history?limit=${limit}`);
}
