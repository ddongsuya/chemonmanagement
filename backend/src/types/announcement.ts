import { z } from 'zod';
import { AnnouncementPriority } from '@prisma/client';

// Create announcement schema
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
  content: z.string().min(1, '내용은 필수입니다').max(10000, '내용은 10000자 이하여야 합니다'),
  priority: z.nativeEnum(AnnouncementPriority).default('NORMAL'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreateAnnouncementDTO = z.infer<typeof createAnnouncementSchema>;

// Update announcement schema
export const updateAnnouncementSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다').optional(),
  content: z.string().min(1, '내용은 필수입니다').max(10000, '내용은 10000자 이하여야 합니다').optional(),
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateAnnouncementDTO = z.infer<typeof updateAnnouncementSchema>;

// Announcement filters schema
export const announcementFiltersSchema = z.object({
  search: z.string().optional(),
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type AnnouncementFilters = z.infer<typeof announcementFiltersSchema>;

// Announcement response type
export interface AnnouncementResponse {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  viewCount: number;
  createdBy: string;
  creatorName?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Announcement view stats
export interface AnnouncementViewStats {
  totalViews: number;
  uniqueViews: number;
  viewsByDate: { date: string; count: number }[];
}
