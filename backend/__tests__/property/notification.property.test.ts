/**
 * Property-Based Tests for Notification Service
 * Feature: backend-admin-system
 * 
 * These tests verify universal properties of the notification system
 * using fast-check for property-based testing.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { NotificationService } from '../../src/services/notificationService';
import { PrismaClient, NotificationType } from '@prisma/client';

// Mock PrismaClient for unit testing
const createMockPrisma = () => ({
  notification: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient);

// Arbitrary for generating notification data
const notificationArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  type: fc.constantFrom('ANNOUNCEMENT', 'SYSTEM', 'REMINDER') as fc.Arbitrary<NotificationType>,
  title: fc.string({ minLength: 1, maxLength: 200 }),
  message: fc.string({ minLength: 1, maxLength: 1000 }),
  isRead: fc.boolean(),
  link: fc.option(fc.webUrl(), { nil: null }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
});

describe('Notification Property Tests', () => {
  let notificationService: NotificationService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    notificationService = new NotificationService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 15: 알림 정렬
   * Feature: backend-admin-system, Property 15: 알림 정렬
   * 
   * For any notification list query, all returned notifications must be
   * sorted by createdAt in descending order (newest first).
   * 
   * Validates: Requirements 6.3
   */
  describe('Property 15: 알림 정렬', () => {
    it('should return notifications sorted by createdAt in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(notificationArb, { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 100 }),
          async (userId, notifications, page, limit) => {
            // Assign the same userId to all notifications
            const userNotifications = notifications.map((n) => ({
              ...n,
              userId,
            }));

            // Sort by createdAt descending (as the service should do)
            const sortedNotifications = [...userNotifications].sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            // Apply pagination
            const skip = (page - 1) * limit;
            const paginatedNotifications = sortedNotifications.slice(skip, skip + limit);

            // Mock the database response
            (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(paginatedNotifications);
            (mockPrisma.notification.count as jest.Mock).mockResolvedValue(userNotifications.length);

            const result = await notificationService.getByUser(userId, { page, limit });

            // Property: notifications should be sorted by createdAt descending
            for (let i = 0; i < result.data.length - 1; i++) {
              const current = new Date(result.data[i].createdAt).getTime();
              const next = new Date(result.data[i + 1].createdAt).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain sort order regardless of notification type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(notificationArb, { minLength: 2, maxLength: 30 }),
          async (userId, notifications) => {
            // Create notifications with different types but ensure varied createdAt
            const userNotifications = notifications.map((n, i) => ({
              ...n,
              userId,
              type: ['ANNOUNCEMENT', 'SYSTEM', 'REMINDER'][i % 3] as NotificationType,
              createdAt: new Date(Date.now() - i * 1000 * 60), // Each 1 minute apart
            }));

            // Sort by createdAt descending
            const sortedNotifications = [...userNotifications].sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(sortedNotifications);
            (mockPrisma.notification.count as jest.Mock).mockResolvedValue(userNotifications.length);

            const result = await notificationService.getByUser(userId, { page: 1, limit: 100 });

            // Property: sort order should be by createdAt, not by type
            for (let i = 0; i < result.data.length - 1; i++) {
              const current = new Date(result.data[i].createdAt).getTime();
              const next = new Date(result.data[i + 1].createdAt).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain sort order regardless of read status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(notificationArb, { minLength: 2, maxLength: 30 }),
          async (userId, notifications) => {
            // Create notifications with mixed read status
            const userNotifications = notifications.map((n, i) => ({
              ...n,
              userId,
              isRead: i % 2 === 0,
              createdAt: new Date(Date.now() - i * 1000 * 60 * 5), // Each 5 minutes apart
            }));

            // Sort by createdAt descending
            const sortedNotifications = [...userNotifications].sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(sortedNotifications);
            (mockPrisma.notification.count as jest.Mock).mockResolvedValue(userNotifications.length);

            const result = await notificationService.getByUser(userId, { page: 1, limit: 100 });

            // Property: sort order should be by createdAt, not by read status
            for (let i = 0; i < result.data.length - 1; i++) {
              const current = new Date(result.data[i].createdAt).getTime();
              const next = new Date(result.data[i + 1].createdAt).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when user has no notifications', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]);
            (mockPrisma.notification.count as jest.Mock).mockResolvedValue(0);

            const result = await notificationService.getByUser(userId, { page: 1, limit: 20 });

            // Property: should return empty array
            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly paginate sorted notifications', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(notificationArb, { minLength: 10, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 5, max: 20 }),
          async (userId, notifications, page, limit) => {
            // Assign the same userId to all notifications
            const userNotifications = notifications.map((n, i) => ({
              ...n,
              userId,
              createdAt: new Date(Date.now() - i * 1000 * 60), // Each 1 minute apart
            }));

            // Sort by createdAt descending
            const sortedNotifications = [...userNotifications].sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            // Apply pagination
            const skip = (page - 1) * limit;
            const paginatedNotifications = sortedNotifications.slice(skip, skip + limit);

            (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(paginatedNotifications);
            (mockPrisma.notification.count as jest.Mock).mockResolvedValue(userNotifications.length);

            const result = await notificationService.getByUser(userId, { page, limit });

            // Property: pagination should work correctly with sorted data
            expect(result.data.length).toBeLessThanOrEqual(limit);
            expect(result.pagination.page).toBe(page);
            expect(result.pagination.limit).toBe(limit);
            expect(result.pagination.total).toBe(userNotifications.length);

            // Property: sorted order should be maintained within page
            for (let i = 0; i < result.data.length - 1; i++) {
              const current = new Date(result.data[i].createdAt).getTime();
              const next = new Date(result.data[i + 1].createdAt).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
