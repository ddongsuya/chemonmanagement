// Notification API functions
import { apiFetch, buildQueryString, ApiResponse, PaginatedResult } from './api-utils';

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

// Re-export types from api-utils
export type { ApiResponse, PaginatedResult } from './api-utils';

/**
 * Get notifications for the authenticated user
 * Returns notifications sorted by createdAt in descending order (newest first)
 */
export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<ApiResponse<PaginatedResult<Notification>>> {
  const query = buildQueryString(filters);
  return apiFetch<PaginatedResult<Notification>>(`/api/notifications?${query}`);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiFetch<{ count: number }>('/api/notifications/unread-count');
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
  return apiFetch<Notification>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ApiResponse<{ markedAsRead: number }>> {
  return apiFetch<{ markedAsRead: number }>('/api/notifications/read-all', {
    method: 'POST',
  });
}
