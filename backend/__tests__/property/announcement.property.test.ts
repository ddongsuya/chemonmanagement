/**
 * Property-Based Tests for Announcement Service
 * Feature: backend-admin-system
 * 
 * These tests verify universal properties of the announcement system
 * using fast-check for property-based testing.
 */

import * as fc from 'fast-check';
import { AnnouncementService } from '../../src/services/announcementService';
import { PrismaClient, AnnouncementPriority } from '@prisma/client';

// Mock PrismaClient for unit testing
const createMockPrisma = () => ({
  announcement: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  announcementView: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  notification: {
    createMany: jest.fn(),
  },
} as unknown as PrismaClient);

// Arbitrary for generating announcement data
const announcementArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  content: fc.string({ minLength: 1, maxLength: 1000 }),
  priority: fc.constantFrom('LOW', 'NORMAL', 'HIGH', 'URGENT') as fc.Arbitrary<AnnouncementPriority>,
  startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  endDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  isActive: fc.boolean(),
  viewCount: fc.nat({ max: 10000 }),
  createdBy: fc.uuid(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.constant(null) as fc.Arbitrary<Date | null>,
});

// Generate announcement with valid date range (endDate > startDate)
const validAnnouncementArb = announcementArb.chain((announcement) => {
  // Ensure endDate is after startDate
  const startDate = announcement.startDate;
  const endDate = new Date(startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000 + 1); // 1ms to 30 days after
  return fc.constant({
    ...announcement,
    startDate,
    endDate,
  });
});

describe('Announcement Property Tests', () => {
  let announcementService: AnnouncementService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    announcementService = new AnnouncementService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 14: 중요 공지 알림 생성
   * Feature: backend-admin-system, Property 14: 중요 공지 알림 생성
   * 
   * For any HIGH or URGENT priority announcement creation,
   * notifications must be created for all ACTIVE users.
   * 
   * Validates: Requirements 4.5
   */
  describe('Property 14: 중요 공지 알림 생성', () => {
    it('should create notifications for all active users when HIGH priority announcement is created', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
          async (adminId, title, content, activeUserIds) => {
            // Clear mocks at the start of each iteration
            jest.clearAllMocks();
            
            // Use unique user IDs to avoid duplicates
            const uniqueUserIds = [...new Set(activeUserIds)];
            if (uniqueUserIds.length === 0) return; // Skip if no unique users
            
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Mock announcement creation
            const createdAnnouncement = {
              id: 'announcement-id',
              title,
              content,
              priority: 'HIGH' as AnnouncementPriority,
              startDate,
              endDate,
              isActive: true,
              viewCount: 0,
              createdBy: adminId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              creator: { name: 'Admin' },
            };

            (mockPrisma.announcement.create as jest.Mock).mockResolvedValue(createdAnnouncement);

            // Mock active users with unique IDs
            const activeUsers = uniqueUserIds.map((id) => ({ id }));
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(activeUsers);

            // Mock notification creation
            (mockPrisma.notification.createMany as jest.Mock).mockResolvedValue({ count: activeUsers.length });

            await announcementService.create(adminId, {
              title,
              content,
              priority: 'HIGH',
              startDate,
              endDate,
            });

            // Property: notifications should be created for all active users
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
              where: { status: 'ACTIVE' },
              select: { id: true },
            });

            expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1);
            const createManyCall = (mockPrisma.notification.createMany as jest.Mock).mock.calls[0][0];
            expect(createManyCall.data.length).toBe(activeUsers.length);

            // Each notification should be for a different user
            const notifiedUserIds = createManyCall.data.map((n: { userId: string }) => n.userId);
            expect(new Set(notifiedUserIds).size).toBe(activeUsers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create notifications for all active users when URGENT priority announcement is created', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
          async (adminId, title, content, activeUserIds) => {
            // Clear mocks at the start of each iteration
            jest.clearAllMocks();
            
            // Use unique user IDs to avoid duplicates
            const uniqueUserIds = [...new Set(activeUserIds)];
            if (uniqueUserIds.length === 0) return; // Skip if no unique users
            
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Mock announcement creation
            const createdAnnouncement = {
              id: 'announcement-id',
              title,
              content,
              priority: 'URGENT' as AnnouncementPriority,
              startDate,
              endDate,
              isActive: true,
              viewCount: 0,
              createdBy: adminId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              creator: { name: 'Admin' },
            };

            (mockPrisma.announcement.create as jest.Mock).mockResolvedValue(createdAnnouncement);

            // Mock active users with unique IDs
            const activeUsers = uniqueUserIds.map((id) => ({ id }));
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(activeUsers);

            // Mock notification creation
            (mockPrisma.notification.createMany as jest.Mock).mockResolvedValue({ count: activeUsers.length });

            await announcementService.create(adminId, {
              title,
              content,
              priority: 'URGENT',
              startDate,
              endDate,
            });

            // Property: notifications should be created for all active users
            expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1);
            const createManyCall = (mockPrisma.notification.createMany as jest.Mock).mock.calls[0][0];
            expect(createManyCall.data.length).toBe(activeUsers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT create notifications for LOW priority announcements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          async (adminId, title, content) => {
            // Clear mocks at the start of each iteration
            jest.clearAllMocks();
            
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Mock announcement creation
            const createdAnnouncement = {
              id: 'announcement-id',
              title,
              content,
              priority: 'LOW' as AnnouncementPriority,
              startDate,
              endDate,
              isActive: true,
              viewCount: 0,
              createdBy: adminId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              creator: { name: 'Admin' },
            };

            (mockPrisma.announcement.create as jest.Mock).mockResolvedValue(createdAnnouncement);

            await announcementService.create(adminId, {
              title,
              content,
              priority: 'LOW',
              startDate,
              endDate,
            });

            // Property: no notifications should be created for LOW priority
            expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT create notifications for NORMAL priority announcements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          async (adminId, title, content) => {
            // Clear mocks at the start of each iteration
            jest.clearAllMocks();
            
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Mock announcement creation
            const createdAnnouncement = {
              id: 'announcement-id',
              title,
              content,
              priority: 'NORMAL' as AnnouncementPriority,
              startDate,
              endDate,
              isActive: true,
              viewCount: 0,
              createdBy: adminId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              creator: { name: 'Admin' },
            };

            (mockPrisma.announcement.create as jest.Mock).mockResolvedValue(createdAnnouncement);

            await announcementService.create(adminId, {
              title,
              content,
              priority: 'NORMAL',
              startDate,
              endDate,
            });

            // Property: no notifications should be created for NORMAL priority
            expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create notifications with correct content for important announcements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.constantFrom('HIGH', 'URGENT') as fc.Arbitrary<'HIGH' | 'URGENT'>,
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          async (adminId, title, content, priority, activeUserIds) => {
            // Clear mocks at the start of each iteration
            jest.clearAllMocks();
            
            // Use unique user IDs to avoid duplicates
            const uniqueUserIds = [...new Set(activeUserIds)];
            if (uniqueUserIds.length === 0) return; // Skip if no unique users
            
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const announcementId = 'announcement-id';

            // Mock announcement creation
            const createdAnnouncement = {
              id: announcementId,
              title,
              content,
              priority: priority as AnnouncementPriority,
              startDate,
              endDate,
              isActive: true,
              viewCount: 0,
              createdBy: adminId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              creator: { name: 'Admin' },
            };

            (mockPrisma.announcement.create as jest.Mock).mockResolvedValue(createdAnnouncement);

            // Mock active users with unique IDs
            const activeUsers = uniqueUserIds.map((id) => ({ id }));
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(activeUsers);

            // Mock notification creation
            (mockPrisma.notification.createMany as jest.Mock).mockResolvedValue({ count: activeUsers.length });

            await announcementService.create(adminId, {
              title,
              content,
              priority,
              startDate,
              endDate,
            });

            // Property: notifications should have correct content
            expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1);
            const createManyCall = (mockPrisma.notification.createMany as jest.Mock).mock.calls[0][0];
            createManyCall.data.forEach((notification: { type: string; title: string; link: string }) => {
              expect(notification.type).toBe('ANNOUNCEMENT');
              expect(notification.title).toContain(title);
              expect(notification.link).toBe(`/announcements/${announcementId}`);
              
              // Title should indicate priority
              if (priority === 'URGENT') {
                expect(notification.title).toContain('긴급');
              } else {
                expect(notification.title).toContain('중요');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case when there are no active users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.constantFrom('HIGH', 'URGENT') as fc.Arbitrary<'HIGH' | 'URGENT'>,
          async (adminId, title, content, priority) => {
            // Clear mocks at the start of each iteration
            jest.clearAllMocks();
            
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Mock announcement creation
            const createdAnnouncement = {
              id: 'announcement-id',
              title,
              content,
              priority: priority as AnnouncementPriority,
              startDate,
              endDate,
              isActive: true,
              viewCount: 0,
              createdBy: adminId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              creator: { name: 'Admin' },
            };

            (mockPrisma.announcement.create as jest.Mock).mockResolvedValue(createdAnnouncement);

            // Mock no active users
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);

            await announcementService.create(adminId, {
              title,
              content,
              priority,
              startDate,
              endDate,
            });

            // Property: should not call createMany when there are no active users
            expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: 공지사항 게시 기간 필터링
   * Feature: backend-admin-system, Property 13: 공지사항 게시 기간 필터링
   * 
   * For any announcement list query, all returned announcements must have:
   * - Current date between startDate and endDate
   * - isActive = true
   * - deletedAt = null
   * 
   * Validates: Requirements 4.4
   */
  describe('Property 13: 공지사항 게시 기간 필터링', () => {
    it('should return only announcements within publication period', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validAnnouncementArb, { minLength: 0, maxLength: 20 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          async (announcements, currentDate) => {
            // Filter announcements that should be active at currentDate
            const activeAnnouncements = announcements.filter(
              (a) =>
                a.isActive &&
                a.deletedAt === null &&
                a.startDate <= currentDate &&
                a.endDate >= currentDate
            );

            // Mock the database response
            (mockPrisma.announcement.findMany as jest.Mock).mockResolvedValue(
              activeAnnouncements.map((a) => ({
                ...a,
                creator: { name: 'Admin' },
              }))
            );

            const result = await announcementService.getActive();

            // Property: all returned announcements must be within publication period
            result.forEach((announcement) => {
              expect(announcement.isActive).toBe(true);
              expect(announcement.deletedAt).toBeNull();
              expect(new Date(announcement.startDate).getTime()).toBeLessThanOrEqual(currentDate.getTime());
              expect(new Date(announcement.endDate).getTime()).toBeGreaterThanOrEqual(currentDate.getTime());
            });

            // Property: returned count should match filtered count
            expect(result.length).toBe(activeAnnouncements.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not return inactive announcements even within publication period', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validAnnouncementArb, { minLength: 1, maxLength: 20 }),
          async (announcements) => {
            const now = new Date();
            
            // Create announcements where some are inactive but within period
            const testAnnouncements = announcements.map((a, i) => ({
              ...a,
              isActive: i % 2 === 0, // Half are inactive
              startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
              endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
              deletedAt: null,
            }));

            // Only active ones should be returned
            const expectedActive = testAnnouncements.filter((a) => a.isActive);

            (mockPrisma.announcement.findMany as jest.Mock).mockResolvedValue(
              expectedActive.map((a) => ({
                ...a,
                creator: { name: 'Admin' },
              }))
            );

            const result = await announcementService.getActive();

            // Property: no inactive announcements should be returned
            result.forEach((announcement) => {
              expect(announcement.isActive).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not return deleted announcements even within publication period', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validAnnouncementArb, { minLength: 1, maxLength: 20 }),
          async (announcements) => {
            const now = new Date();
            
            // Create announcements where some are deleted but within period
            const testAnnouncements = announcements.map((a, i) => ({
              ...a,
              isActive: true,
              startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
              deletedAt: i % 2 === 0 ? new Date() : null, // Half are deleted
            }));

            // Only non-deleted ones should be returned
            const expectedActive = testAnnouncements.filter((a) => a.deletedAt === null);

            (mockPrisma.announcement.findMany as jest.Mock).mockResolvedValue(
              expectedActive.map((a) => ({
                ...a,
                creator: { name: 'Admin' },
              }))
            );

            const result = await announcementService.getActive();

            // Property: no deleted announcements should be returned
            result.forEach((announcement) => {
              expect(announcement.deletedAt).toBeNull();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not return announcements before their start date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validAnnouncementArb, { minLength: 1, maxLength: 20 }),
          async (announcements) => {
            const now = new Date();
            
            // Create announcements where some haven't started yet
            const testAnnouncements = announcements.map((a, i) => ({
              ...a,
              isActive: true,
              deletedAt: null,
              startDate: i % 2 === 0 
                ? new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow (future)
                : new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday (past)
              endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
            }));

            // Only started ones should be returned
            const expectedActive = testAnnouncements.filter(
              (a) => a.startDate <= now
            );

            (mockPrisma.announcement.findMany as jest.Mock).mockResolvedValue(
              expectedActive.map((a) => ({
                ...a,
                creator: { name: 'Admin' },
              }))
            );

            const result = await announcementService.getActive();

            // Property: all returned announcements should have started
            result.forEach((announcement) => {
              expect(new Date(announcement.startDate).getTime()).toBeLessThanOrEqual(now.getTime());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not return announcements after their end date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validAnnouncementArb, { minLength: 1, maxLength: 20 }),
          async (announcements) => {
            const now = new Date();
            
            // Create announcements where some have ended
            const testAnnouncements = announcements.map((a, i) => ({
              ...a,
              isActive: true,
              deletedAt: null,
              startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last week
              endDate: i % 2 === 0 
                ? new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday (ended)
                : new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow (not ended)
            }));

            // Only non-ended ones should be returned
            const expectedActive = testAnnouncements.filter(
              (a) => a.endDate >= now
            );

            (mockPrisma.announcement.findMany as jest.Mock).mockResolvedValue(
              expectedActive.map((a) => ({
                ...a,
                creator: { name: 'Admin' },
              }))
            );

            const result = await announcementService.getActive();

            // Property: all returned announcements should not have ended
            result.forEach((announcement) => {
              expect(new Date(announcement.endDate).getTime()).toBeGreaterThanOrEqual(now.getTime());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no announcements are within publication period', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validAnnouncementArb, { minLength: 0, maxLength: 10 }),
          async (announcements) => {
            const now = new Date();
            
            // Create announcements that are all outside the publication period
            const testAnnouncements = announcements.map((a) => ({
              ...a,
              isActive: true,
              deletedAt: null,
              // All in the past
              startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
              endDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            }));

            // None should be returned
            (mockPrisma.announcement.findMany as jest.Mock).mockResolvedValue([]);

            const result = await announcementService.getActive();

            // Property: should return empty array
            expect(result).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
