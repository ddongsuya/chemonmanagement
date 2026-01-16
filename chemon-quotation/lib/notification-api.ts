// Notification API functions
import { getAccessToken } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type NotificationType = 'ANNOUNCEMENT' | 'SYSTEM' | 'REMINDER';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

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

// API request helper with authentication
async function notificationFetch<T>(
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

/**
 * Get notifications for the authenticated user
 * Returns notifications sorted by createdAt in descending order (newest first)
 */
export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<ApiResponse<PaginatedResult<Notification>>> {
  const query = buildQueryString(filters);
  return notificationFetch<PaginatedResult<Notification>>(`/api/notifications?${query}`);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return notificationFetch<{ count: number }>('/api/notifications/unread-count');
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
  return notificationFetch<Notification>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ApiResponse<{ markedAsRead: number }>> {
  return notificationFetch<{ markedAsRead: number }>('/api/notifications/read-all', {
    method: 'POST',
  });
}
