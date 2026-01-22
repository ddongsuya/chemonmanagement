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
