/**
 * Property-Based Tests for Authentication
 * Feature: backend-admin-system
 * 
 * These tests verify universal properties of the authentication system
 * using fast-check for property-based testing.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/authService';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient for unit testing
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  notification: {
    count: jest.fn(),
  },
} as unknown as PrismaClient;

describe('Auth Property Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 3: 비밀번호 암호화 저장
   * Feature: backend-admin-system, Property 3: 비밀번호 암호화 저장
   * 
   * For any password, the hashed password must:
   * 1. Be different from the original password
   * 2. Be in bcrypt hash format (starts with $2b$ or $2a$)
   * 3. Be verifiable against the original password
   * 
   * Validates: Requirements 1.2, 8.6
   */
  describe('Property 3: 비밀번호 암호화 저장', () => {
    it('should hash passwords such that they differ from original and are in bcrypt format', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random passwords (8-20 characters, printable ASCII)
          fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
          async (password) => {
            const hashedPassword = await authService.hashPassword(password);
            
            // Property 1: Hashed password must be different from original
            expect(hashedPassword).not.toBe(password);
            
            // Property 2: Hashed password must be in bcrypt format
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$/);
            
            // Property 3: Original password must verify against hash
            const isValid = await authService.verifyPassword(password, hashedPassword);
            expect(isValid).toBe(true);
            
            // Property 4: Different password must not verify against hash
            const wrongPassword = password + 'x';
            const isInvalid = await authService.verifyPassword(wrongPassword, hashedPassword);
            expect(isInvalid).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    it('should produce different hashes for the same password (due to salt)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
          async (password) => {
            const hash1 = await authService.hashPassword(password);
            const hash2 = await authService.hashPassword(password);
            
            // Same password should produce different hashes (due to random salt)
            expect(hash1).not.toBe(hash2);
            
            // But both should verify correctly
            expect(await authService.verifyPassword(password, hash1)).toBe(true);
            expect(await authService.verifyPassword(password, hash2)).toBe(true);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);
  });

  /**
   * Property 2: 무효한 토큰 거부
   * Feature: backend-admin-system, Property 2: 무효한 토큰 거부
   * 
   * For any invalid token (expired, tampered, empty, or logged out),
   * the system must return 401 Unauthorized.
   * 
   * Validates: Requirements 1.3, 1.5
   */
  describe('Property 2: 무효한 토큰 거부', () => {
    const TEST_SECRET = 'test-jwt-secret';
    const WRONG_SECRET = 'wrong-secret-key';

    it('should reject tampered tokens', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('USER' as const, 'ADMIN' as const),
          }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (payload, tamperString) => {
            // Create a valid token
            const validToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
            
            // Tamper with the token by modifying its payload section
            const parts = validToken.split('.');
            if (parts.length === 3) {
              const tamperedToken = parts[0] + '.' + tamperString + '.' + parts[2];
              
              // Tampered token should throw an error
              expect(() => {
                jwt.verify(tamperedToken, TEST_SECRET);
              }).toThrow();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject tokens signed with wrong secret', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('USER' as const, 'ADMIN' as const),
          }),
          (payload) => {
            // Create a token with wrong secret
            const tokenWithWrongSecret = jwt.sign(payload, WRONG_SECRET, { expiresIn: '1h' });
            
            // Should throw when verifying with correct secret
            expect(() => {
              jwt.verify(tokenWithWrongSecret, TEST_SECRET);
            }).toThrow();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject empty or malformed tokens', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('invalid'),
            fc.constant('a.b'),
            fc.constant('a.b.c.d'),
            fc.string({ minLength: 0, maxLength: 50 }).filter(s => !s.includes('.'))
          ),
          (invalidToken) => {
            expect(() => {
              jwt.verify(invalidToken, TEST_SECRET);
            }).toThrow();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject expired tokens', async () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'USER' as const,
      };

      // Create an already expired token
      const expiredToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });

      expect(() => {
        jwt.verify(expiredToken, TEST_SECRET);
      }).toThrow(jwt.TokenExpiredError);
    });
  });

  /**
   * Property 5: 계정 잠금
   * Feature: backend-admin-system, Property 5: 계정 잠금
   * 
   * For any user account, after 5 consecutive login failures,
   * the account must be locked and even correct password should be rejected
   * during the lockout period.
   * 
   * Validates: Requirements 1.6
   */
  describe('Property 5: 계정 잠금', () => {
    const MAX_LOGIN_ATTEMPTS = 5;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should lock account after 5 consecutive failed login attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            correctPassword: fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
          }),
          async ({ email, correctPassword }) => {
            const hashedPassword = await authService.hashPassword(correctPassword);
            const wrongPassword = correctPassword + 'wrong';
            
            // Mock user with increasing login attempts
            let currentAttempts = 0;
            let userStatus: 'ACTIVE' | 'LOCKED' = 'ACTIVE';
            let lockedUntil: Date | null = null;

            (mockPrisma.user.findUnique as jest.Mock).mockImplementation(() => {
              return Promise.resolve({
                id: 'test-user-id',
                email,
                password: hashedPassword,
                name: 'Test User',
                role: 'USER',
                status: userStatus,
                loginAttempts: currentAttempts,
                lockedUntil,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            });

            (mockPrisma.user.update as jest.Mock).mockImplementation(({ data }) => {
              if (data.loginAttempts !== undefined) {
                currentAttempts = data.loginAttempts;
              }
              if (data.status !== undefined) {
                userStatus = data.status;
              }
              if (data.lockedUntil !== undefined) {
                lockedUntil = data.lockedUntil;
              }
              return Promise.resolve({
                id: 'test-user-id',
                email,
                password: hashedPassword,
                name: 'Test User',
                role: 'USER',
                status: userStatus,
                loginAttempts: currentAttempts,
                lockedUntil,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            });

            // Attempt login with wrong password MAX_LOGIN_ATTEMPTS times
            for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
              try {
                await authService.login({ email, password: wrongPassword });
              } catch (error) {
                // Expected to fail
              }
            }

            // After 5 failed attempts, account should be locked
            expect(userStatus).toBe('LOCKED');
            expect(lockedUntil).not.toBeNull();
            expect(currentAttempts).toBe(MAX_LOGIN_ATTEMPTS);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should reject login with correct password when account is locked', async () => {
      const email = 'locked@example.com';
      const correctPassword = 'correctPassword123';
      const hashedPassword = await authService.hashPassword(correctPassword);
      
      // Mock a locked user
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email,
        password: hashedPassword,
        name: 'Test User',
        role: 'USER',
        status: 'LOCKED',
        loginAttempts: 5,
        lockedUntil,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Even with correct password, login should fail
      await expect(authService.login({ email, password: correctPassword }))
        .rejects
        .toThrow('계정이 잠금 상태입니다');
    });
  });

  /**
   * Property 17: 로그인 응답에 읽지 않은 알림 수 포함
   * Feature: backend-admin-system, Property 17: 로그인 응답에 읽지 않은 알림 수 포함
   * 
   * For any successful login, the response must include the count of
   * unread notifications for that user.
   * 
   * Validates: Requirements 6.5
   */
  describe('Property 17: 로그인 응답에 읽지 않은 알림 수 포함', () => {
    it('should include unread notification count in login response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
          }),
          fc.nat({ max: 100 }), // unread notification count
          async ({ email, password }, unreadCount) => {
            const hashedPassword = await authService.hashPassword(password);
            const userId = 'test-user-id';

            // Mock user
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
              id: userId,
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

            // Mock user update (for resetting login attempts and updating lastLoginAt)
            (mockPrisma.user.update as jest.Mock).mockResolvedValue({
              id: userId,
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

            // Mock refresh token creation
            (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({
              id: 'token-id',
              token: 'refresh-token',
              userId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdAt: new Date(),
            });

            // Mock unread notification count
            (mockPrisma.notification.count as jest.Mock).mockResolvedValue(unreadCount);

            const result = await authService.login({ email, password });

            // Property: login response must include unreadNotifications field
            expect(result).toHaveProperty('unreadNotifications');
            expect(typeof result.unreadNotifications).toBe('number');
            expect(result.unreadNotifications).toBe(unreadCount);
            expect(result.unreadNotifications).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    it('should return 0 unread notifications when user has no unread notifications', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const hashedPassword = await authService.hashPassword(password);
      const userId = 'test-user-id';

      // Mock user
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
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

      // Mock user update
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
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

      // Mock refresh token creation
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      // Mock 0 unread notifications
      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(0);

      const result = await authService.login({ email, password });

      expect(result.unreadNotifications).toBe(0);
    });

    it('should query unread notifications for the correct user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
          async (userId, email, password) => {
            const hashedPassword = await authService.hashPassword(password);

            // Mock user
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
              id: userId,
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

            // Mock user update
            (mockPrisma.user.update as jest.Mock).mockResolvedValue({
              id: userId,
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

            // Mock refresh token creation
            (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({
              id: 'token-id',
              token: 'refresh-token',
              userId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdAt: new Date(),
            });

            // Mock notification count
            (mockPrisma.notification.count as jest.Mock).mockResolvedValue(5);

            await authService.login({ email, password });

            // Property: notification count should be queried for the correct user
            expect(mockPrisma.notification.count).toHaveBeenCalledWith({
              where: {
                userId,
                isRead: false,
              },
            });
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);
  });
});
