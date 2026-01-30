// Announcement API functions for users
import { apiFetch, ApiResponse } from './api-utils';

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

// Re-export types
export type { ApiResponse } from './api-utils';

/**
 * Get active announcements for users
 * Returns only announcements within publication period
 */
export async function getActiveAnnouncements(): Promise<ApiResponse<Announcement[]>> {
  return apiFetch<Announcement[]>('/api/announcements');
}

/**
 * Get active announcement by ID
 * Also increments view count
 */
export async function getAnnouncementById(id: string): Promise<ApiResponse<Announcement>> {
  return apiFetch<Announcement>(`/api/announcements/${id}`);
}

// ==================== Comment Types & API ====================

export interface Comment {
  id: string;
  announcementId: string;
  userId: string;
  userName: string;
  content: string;
  parentId: string | null;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get comments for an announcement
 */
export async function getComments(announcementId: string): Promise<ApiResponse<Comment[]>> {
  return apiFetch<Comment[]>(`/api/announcements/${announcementId}/comments`);
}

/**
 * Create a comment
 */
export async function createComment(
  announcementId: string,
  content: string,
  parentId?: string | null
): Promise<ApiResponse<Comment>> {
  return apiFetch<Comment>(`/api/announcements/${announcementId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId }),
  });
}

/**
 * Update a comment
 */
export async function updateComment(
  announcementId: string,
  commentId: string,
  content: string
): Promise<ApiResponse<Comment>> {
  return apiFetch<Comment>(`/api/announcements/${announcementId}/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

/**
 * Delete a comment
 */
export async function deleteComment(
  announcementId: string,
  commentId: string
): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/api/announcements/${announcementId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}
