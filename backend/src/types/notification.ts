import { z } from 'zod';
import { NotificationType } from '@prisma/client';

// Create notification schema
export const createNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType).default('SYSTEM'),
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
  message: z.string().min(1, '메시지는 필수입니다').max(1000, '메시지는 1000자 이하여야 합니다'),
  link: z.string().max(500).optional(),
});

export type CreateNotificationDTO = z.infer<typeof createNotificationSchema>;

// Notification filters schema
export const notificationFiltersSchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
  isRead: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;

// Notification response type
export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

// Bulk create notification DTO
export interface BulkCreateNotificationDTO {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}
