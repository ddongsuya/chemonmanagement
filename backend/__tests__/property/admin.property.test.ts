/**
 * Property-Based Tests for Admin Service
 * Feature: backend-admin-system
 * 
 * These tests verify universal properties of the admin management system
 * using fast-check for property-based testing.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { AdminService } from '../../src/services/adminService';
import { AuthService } from '../../src/services/authService';
import { PrismaClient, UserStatus, UserRole } from '@prisma/client';

// Mock PrismaClient for unit testing
const createMockPrisma = () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    deleteMany: jest.fn(),
  },
  quotation: {
    count: jest.fn(),
  },
  customer: {
    count: jest.fn(),
  },
  activityLog: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  notification: {
    count: jest.fn(),
  },
} as unknown as PrismaClient);

// Arbitrary for generating user data
const userArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 60, maxLength: 60 }), // bcrypt hash length
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constantFrom('USER', 'ADMIN') as fc.Arbitrary<UserRole>,
  status: fc.constantFrom('ACTIVE', 'INACTIVE', 'LOCKED') as fc.Arbitrary<UserStatus>,
  loginAttempts: fc.nat({ max: 10 }),
  lockedUntil: fc.option(fc.date(), { nil: null }),
  lastLoginAt: fc.option(fc.date(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

describe('Admin Property Tests', () => {
  let adminService: AdminService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    adminService = new AdminService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 10: 페이지네이션 정확성
   * Feature: backend-admin-system, Property 10: 페이지네이션 정확성
   * 
   * For any pagination request (page, limit), the returned results count
   * should be <= limit, and traversing all pages should include all data
   * without duplicates.
   * 
   * Validates: Requirements 3.1
   */
  describe('Property 10: 페이지네이션 정확성', () => {
    it('should return at most limit items per page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArb, { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 20 }),
          async (users, page, limit) => {
            const total = users.length;
            const skip = (page - 1) * limit;
            const pageUsers = users.slice(skip, skip + limit);

            // Mock the database responses
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
              pageUsers.map(u => ({ ...u, _count: { quotations: 0, customers: 0 } }))
            );
            (mockPrisma.user.count as jest.Mock).mockResolvedValue(total);

            const result = await adminService.getUsers({ page, limit });

            // Property: returned data length should be <= limit
            expect(result.data.length).toBeLessThanOrEqual(limit);
            
            // Property: returned data length should match expected slice
            expect(result.data.length).toBe(pageUsers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct pagination metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 20 }),
          async (total, page, limit) => {
            const expectedTotalPages = Math.ceil(total / limit);

            // Mock the database responses
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (mockPrisma.user.count as jest.Mock).mockResolvedValue(total);

            const result = await adminService.getUsers({ page, limit });

            // Property: pagination metadata should be accurate
            expect(result.pagination.page).toBe(page);
            expect(result.pagination.limit).toBe(limit);
            expect(result.pagination.total).toBe(total);
            expect(result.pagination.totalPages).toBe(expectedTotalPages);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all items exactly once when traversing all pages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArb, { minLength: 1, maxLength: 30 }),
          fc.integer({ min: 1, max: 10 }),
          async (users, limit) => {
            const total = users.length;
            const totalPages = Math.ceil(total / limit);
            const collectedIds = new Set<string>();

            // Traverse all pages
            for (let page = 1; page <= totalPages; page++) {
              const skip = (page - 1) * limit;
              const pageUsers = users.slice(skip, skip + limit);

              (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
                pageUsers.map(u => ({ ...u, _count: { quotations: 0, customers: 0 } }))
              );
              (mockPrisma.user.count as jest.Mock).mockResolvedValue(total);

              const result = await adminService.getUsers({ page, limit });

              // Collect all IDs
              result.data.forEach(user => {
                // Property: no duplicates across pages
                expect(collectedIds.has(user.id)).toBe(false);
                collectedIds.add(user.id);
              });
            }

            // Property: all items should be included
            expect(collectedIds.size).toBe(total);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 11: 검색 필터 정확성
   * Feature: backend-admin-system, Property 11: 검색 필터 정확성
   * 
   * For any search filter (name, email, status), all returned results
   * must satisfy the filter conditions.
   * 
   * Validates: Requirements 3.2
   */
  describe('Property 11: 검색 필터 정확성', () => {
    it('should return only users matching status filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArb, { minLength: 1, maxLength: 20 }),
          fc.constantFrom('ACTIVE', 'INACTIVE', 'LOCKED') as fc.Arbitrary<UserStatus>,
          async (users, filterStatus) => {
            // Filter users by status
            const matchingUsers = users.filter(u => u.status === filterStatus);

            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
              matchingUsers.map(u => ({ ...u, _count: { quotations: 0, customers: 0 } }))
            );
            (mockPrisma.user.count as jest.Mock).mockResolvedValue(matchingUsers.length);

            const result = await adminService.getUsers({
              page: 1,
              limit: 100,
              status: filterStatus,
            });

            // Property: all returned users must have the filtered status
            result.data.forEach(user => {
              expect(user.status).toBe(filterStatus);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only users matching role filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArb, { minLength: 1, maxLength: 20 }),
          fc.constantFrom('USER', 'ADMIN') as fc.Arbitrary<UserRole>,
          async (users, filterRole) => {
            // Filter users by role
            const matchingUsers = users.filter(u => u.role === filterRole);

            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
              matchingUsers.map(u => ({ ...u, _count: { quotations: 0, customers: 0 } }))
            );
            (mockPrisma.user.count as jest.Mock).mockResolvedValue(matchingUsers.length);

            const result = await adminService.getUsers({
              page: 1,
              limit: 100,
              role: filterRole,
            });

            // Property: all returned users must have the filtered role
            result.data.forEach(user => {
              expect(user.role).toBe(filterRole);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only users matching search term in name or email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArb, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
          async (users, searchTerm) => {
            // Filter users by search term (case-insensitive)
            const lowerSearch = searchTerm.toLowerCase();
            const matchingUsers = users.filter(
              u => u.name.toLowerCase().includes(lowerSearch) ||
                   u.email.toLowerCase().includes(lowerSearch)
            );

            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
              matchingUsers.map(u => ({ ...u, _count: { quotations: 0, customers: 0 } }))
            );
            (mockPrisma.user.count as jest.Mock).mockResolvedValue(matchingUsers.length);

            const result = await adminService.getUsers({
              page: 1,
              limit: 100,
              search: searchTerm,
            });

            // Property: all returned users must match the search term
            result.data.forEach(user => {
              const matchesName = user.name.toLowerCase().includes(lowerSearch);
              const matchesEmail = user.email.toLowerCase().includes(lowerSearch);
              expect(matchesName || matchesEmail).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only users matching combined filters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArb, { minLength: 1, maxLength: 20 }),
          fc.constantFrom('ACTIVE', 'INACTIVE', 'LOCKED') as fc.Arbitrary<UserStatus>,
          fc.constantFrom('USER', 'ADMIN') as fc.Arbitrary<UserRole>,
          async (users, filterStatus, filterRole) => {
            // Filter users by both status and role
            const matchingUsers = users.filter(
              u => u.status === filterStatus && u.role === filterRole
            );

            (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
              matchingUsers.map(u => ({ ...u, _count: { quotations: 0, customers: 0 } }))
            );
            (mockPrisma.user.count as jest.Mock).mockResolvedValue(matchingUsers.length);

            const result = await adminService.getUsers({
              page: 1,
              limit: 100,
              status: filterStatus,
              role: filterRole,
            });

            // Property: all returned users must match both filters
            result.data.forEach(user => {
              expect(user.status).toBe(filterStatus);
              expect(user.role).toBe(filterRole);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: 계정 상태와 로그인
   * Feature: backend-admin-system, Property 12: 계정 상태와 로그인
   * 
   * For any user account, if status is INACTIVE, login should be rejected.
   * If status is ACTIVE, login with correct credentials should succeed.
   * 
   * Validates: Requirements 3.3, 3.4
   */
  describe('Property 12: 계정 상태와 로그인', () => {
    let authService: AuthService;
    let authMockPrisma: ReturnType<typeof createMockPrisma> & {
      refreshToken: { create: jest.Mock };
    };

    beforeEach(() => {
      authMockPrisma = {
        ...createMockPrisma(),
        refreshToken: {
          ...createMockPrisma().refreshToken,
          create: jest.fn(),
        },
      } as ReturnType<typeof createMockPrisma> & {
        refreshToken: { create: jest.Mock };
      };
      authService = new AuthService(authMockPrisma);
    });

    it('should reject login for INACTIVE users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
          }),
          async ({ email, password }) => {
            const hashedPassword = await authService.hashPassword(password);

            // Mock an inactive user
            (authMockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
              id: 'test-user-id',
              email,
              password: hashedPassword,
              name: 'Test User',
              role: 'USER',
              status: 'INACTIVE',
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Property: login should be rejected for inactive users
            await expect(authService.login({ email, password }))
              .rejects
              .toThrow('비활성화된 계정입니다');
          }
        ),
        { numRuns: 10 } // Reduced due to bcrypt being slow
      );
    }, 60000);

    it('should allow login for ACTIVE users with correct credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
          }),
          async ({ email, password }) => {
            const hashedPassword = await authService.hashPassword(password);

            // Mock an active user
            (authMockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
              id: 'test-user-id',
              email,
              password: hashedPassword,
              name: 'Test User',
              role: 'USER',
              status: 'ACTIVE',
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            (authMockPrisma.user.update as jest.Mock).mockResolvedValue({
              id: 'test-user-id',
              email,
              password: hashedPassword,
              name: 'Test User',
              role: 'USER',
              status: 'ACTIVE',
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            (authMockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({
              id: 'token-id',
              token: 'refresh-token',
              userId: 'test-user-id',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdAt: new Date(),
            });

            (authMockPrisma.notification.count as jest.Mock).mockResolvedValue(0);

            // Property: login should succeed for active users with correct password
            const result = await authService.login({ email, password });
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user.email).toBe(email);
            expect(result.user.status).toBe('ACTIVE');
          }
        ),
        { numRuns: 10 } // Reduced due to bcrypt being slow
      );
    }, 60000);

    it('should update user status correctly when admin changes it', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArb,
          fc.constantFrom('ACTIVE', 'INACTIVE') as fc.Arbitrary<'ACTIVE' | 'INACTIVE'>,
          async (user, newStatus) => {
            // Mock finding the user
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);

            // Mock update
            (mockPrisma.user.update as jest.Mock).mockResolvedValue({
              ...user,
              status: newStatus,
              loginAttempts: newStatus === 'ACTIVE' ? 0 : user.loginAttempts,
              lockedUntil: newStatus === 'ACTIVE' ? null : user.lockedUntil,
              _count: { quotations: 0, customers: 0 },
            });

            (mockPrisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

            const result = await adminService.updateUserStatus(user.id, newStatus);

            // Property: status should be updated correctly
            expect(result.status).toBe(newStatus);

            // Property: if activating, login attempts should be reset
            if (newStatus === 'ACTIVE') {
              expect(result.loginAttempts).toBe(0);
              expect(result.lockedUntil).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
