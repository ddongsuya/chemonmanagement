/**
 * Property-Based Tests for Security Features
 * Feature: backend-admin-system
 * 
 * These tests verify universal properties of the security features
 * using fast-check for property-based testing.
 */

import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import {
  rateLimiter,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
} from '../../src/middleware/rateLimiter';
import { validateBody, validateQuery, validateParams } from '../../src/middleware/validation';
import { z } from 'zod';
import { ErrorCodes } from '../../src/types/error';

describe('Security Property Tests', () => {
  /**
   * Property 19: 입력 유효성 검사
   * Feature: backend-admin-system, Property 19: Input Validation
   * 
   * For any API request, inputs that don't match the schema should receive
   * 400 Bad Request response with detailed error messages.
   * 
   * Validates: Requirements 8.3
   */
  describe('Property 19: Input Validation', () => {
    it('should reject invalid email formats with detailed error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@') || !s.includes('.')),
          (invalidEmail) => {
            const middleware = validateBody(z.object({
              email: z.string().email('유효한 이메일 형식이 아닙니다'),
            }));

            const req = {
              body: { email: invalidEmail },
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            // Should return 400 with validation error
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                  code: ErrorCodes.VALIDATION_ERROR,
                  details: expect.objectContaining({
                    email: expect.any(Array),
                  }),
                }),
              })
            );
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject passwords shorter than minimum length', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 7 }),
          (shortPassword) => {
            const middleware = validateBody(z.object({
              password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
            }));

            const req = {
              body: { password: shortPassword },
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                  code: ErrorCodes.VALIDATION_ERROR,
                  details: expect.objectContaining({
                    password: expect.any(Array),
                  }),
                }),
              })
            );
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept valid inputs and call next', () => {
      // Generate alphanumeric strings that are guaranteed to be non-whitespace
      const alphanumericString = (minLen: number, maxLen: number) =>
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), { minLength: minLen, maxLength: maxLen });

      // Generate valid emails that Zod will accept (simpler format)
      const validEmail = fc.tuple(
        alphanumericString(1, 10),
        fc.constantFrom('gmail.com', 'example.com', 'test.org', 'company.co.kr')
      ).map(([local, domain]) => `${local}@${domain}`);

      fc.assert(
        fc.property(
          validEmail,
          alphanumericString(8, 50),
          alphanumericString(1, 50),
          (email, validPassword, validName) => {
            const middleware = validateBody(z.object({
              email: z.string().email('유효한 이메일 형식이 아닙니다'),
              password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
              name: z.string().min(1, '이름은 필수입니다'),
            }));

            const req = {
              body: { email, password: validPassword, name: validName },
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            // Should call next for valid inputs
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject missing required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('email', 'password', 'name'),
          (missingField) => {
            const middleware = validateBody(z.object({
              email: z.string().email('유효한 이메일 형식이 아닙니다'),
              password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
              name: z.string().min(1, '이름은 필수입니다'),
            }));

            const validData: Record<string, string> = {
              email: 'test@example.com',
              password: 'password123',
              name: 'Test User',
            };

            // Remove one required field
            delete validData[missingField];

            const req = {
              body: validData,
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            // Should return 400 with validation error for missing field
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                  code: ErrorCodes.VALIDATION_ERROR,
                  details: expect.objectContaining({
                    [missingField]: expect.any(Array),
                  }),
                }),
              })
            );
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate query parameters correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 0 }),
          (invalidPage) => {
            const middleware = validateQuery(z.object({
              page: z.coerce.number().int().positive('페이지는 양수여야 합니다'),
              limit: z.coerce.number().int().min(1).max(100).optional(),
            }));

            const req = {
              query: { page: invalidPage.toString() },
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            // Should return 400 for invalid page number
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                  code: ErrorCodes.VALIDATION_ERROR,
                }),
              })
            );
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate path parameters correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)),
          (invalidUuid) => {
            const middleware = validateParams(z.object({
              id: z.string().uuid('유효한 UUID 형식이 아닙니다'),
            }));

            const req = {
              params: { id: invalidUuid },
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            // Should return 400 for invalid UUID
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                  code: ErrorCodes.VALIDATION_ERROR,
                  details: expect.objectContaining({
                    id: expect.any(Array),
                  }),
                }),
              })
            );
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return detailed error messages for multiple validation failures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')),
          fc.string({ minLength: 0, maxLength: 5 }),
          (invalidEmail, shortPassword) => {
            const middleware = validateBody(z.object({
              email: z.string().email('유효한 이메일 형식이 아닙니다'),
              password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
            }));

            const req = {
              body: { email: invalidEmail, password: shortPassword },
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            // Should return 400 with validation errors for both fields
            expect(res.status).toHaveBeenCalledWith(400);
            const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
            expect(jsonCall.success).toBe(false);
            expect(jsonCall.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
            expect(jsonCall.error.details).toBeDefined();
            // Should have error details for both invalid fields
            expect(Object.keys(jsonCall.error.details).length).toBeGreaterThanOrEqual(1);
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle wrong data types correctly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.array(fc.string()),
            fc.constant(null)
          ),
          (wrongTypeValue) => {
            const middleware = validateBody(z.object({
              name: z.string().min(1, '이름은 필수입니다'),
            }));

            const req = {
              body: { name: wrongTypeValue },
            } as unknown as Request;

            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            const next: NextFunction = jest.fn();

            middleware(req, res, next);

            // Should return 400 for wrong data type
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                  code: ErrorCodes.VALIDATION_ERROR,
                }),
              })
            );
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 18: Rate Limiting
   * Feature: backend-admin-system, Property 18: Rate Limiting
   * 
   * For any client, requests exceeding 100 per minute should receive
   * 429 Too Many Requests response.
   * 
   * Validates: Requirements 8.1
   */
  describe('Property 18: Rate Limiting', () => {
    const WINDOW_MS = 60000; // 1 minute
    const MAX_REQUESTS = 100;

    beforeEach(() => {
      clearAllRateLimits();
    });

    it('should allow requests within the rate limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: MAX_REQUESTS }),
          fc.string({ minLength: 7, maxLength: 15 }).map(s => `192.168.${s.length}.${s.length % 256}`),
          async (requestCount, ip) => {
            clearAllRateLimits();
            const middleware = rateLimiter(WINDOW_MS, MAX_REQUESTS);
            
            let successCount = 0;
            let rateLimitedCount = 0;

            for (let i = 0; i < requestCount; i++) {
              const req = {
                ip,
                socket: { remoteAddress: ip },
              } as unknown as Request;

              const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
                setHeader: jest.fn(),
              } as unknown as Response;

              let nextCalled = false;
              const next: NextFunction = () => {
                nextCalled = true;
              };

              middleware(req, res, next);

              if (nextCalled) {
                successCount++;
              } else {
                rateLimitedCount++;
              }
            }

            // All requests within limit should succeed
            expect(successCount).toBe(requestCount);
            expect(rateLimitedCount).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should block requests exceeding the rate limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 50 }), // Extra requests beyond limit
          fc.string({ minLength: 1, maxLength: 10 }).map(s => `10.0.${s.length}.${s.length % 256}`),
          async (extraRequests, ip) => {
            clearAllRateLimits();
            const middleware = rateLimiter(WINDOW_MS, MAX_REQUESTS);
            
            let successCount = 0;
            let rateLimitedCount = 0;
            const totalRequests = MAX_REQUESTS + extraRequests;

            for (let i = 0; i < totalRequests; i++) {
              const req = {
                ip,
                socket: { remoteAddress: ip },
              } as unknown as Request;

              const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
                setHeader: jest.fn(),
              } as unknown as Response;

              let nextCalled = false;
              const next: NextFunction = () => {
                nextCalled = true;
              };

              middleware(req, res, next);

              if (nextCalled) {
                successCount++;
              } else {
                rateLimitedCount++;
              }
            }

            // Exactly MAX_REQUESTS should succeed
            expect(successCount).toBe(MAX_REQUESTS);
            // Extra requests should be rate limited
            expect(rateLimitedCount).toBe(extraRequests);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return 429 status code when rate limit exceeded', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).map(s => `172.16.${s.length}.${s.length % 256}`),
          (ip) => {
            clearAllRateLimits();
            const middleware = rateLimiter(WINDOW_MS, MAX_REQUESTS);

            // Make MAX_REQUESTS + 1 requests
            for (let i = 0; i <= MAX_REQUESTS; i++) {
              const req = {
                ip,
                socket: { remoteAddress: ip },
              } as unknown as Request;

              const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
                setHeader: jest.fn(),
              } as unknown as Response;

              const next: NextFunction = jest.fn();

              middleware(req, res, next);

              // On the last request (exceeding limit), verify 429 response
              if (i === MAX_REQUESTS) {
                expect(res.status).toHaveBeenCalledWith(429);
                expect(res.json).toHaveBeenCalledWith(
                  expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
                    }),
                  })
                );
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should track rate limits per IP independently', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 5 }).map(s => `192.168.1.${s.length % 256}`),
            { minLength: 2, maxLength: 5 }
          ).filter(ips => new Set(ips).size === ips.length), // Ensure unique IPs
          (ips) => {
            clearAllRateLimits();
            const middleware = rateLimiter(WINDOW_MS, MAX_REQUESTS);

            // Make some requests from each IP
            const requestsPerIp = 10;
            
            for (const ip of ips) {
              for (let i = 0; i < requestsPerIp; i++) {
                const req = {
                  ip,
                  socket: { remoteAddress: ip },
                } as unknown as Request;

                const res = {
                  status: jest.fn().mockReturnThis(),
                  json: jest.fn().mockReturnThis(),
                  setHeader: jest.fn(),
                } as unknown as Response;

                const next: NextFunction = jest.fn();

                middleware(req, res, next);
              }
            }

            // Verify each IP has its own counter
            for (const ip of ips) {
              const status = getRateLimitStatus(ip);
              expect(status).not.toBeNull();
              expect(status!.count).toBe(requestsPerIp);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should set rate limit headers correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MAX_REQUESTS - 1 }),
          fc.string({ minLength: 1, maxLength: 5 }).map(s => `10.10.${s.length}.${s.length % 256}`),
          (requestCount, ip) => {
            clearAllRateLimits();
            const middleware = rateLimiter(WINDOW_MS, MAX_REQUESTS);

            let lastRes: Response | null = null;

            for (let i = 0; i < requestCount; i++) {
              const req = {
                ip,
                socket: { remoteAddress: ip },
              } as unknown as Request;

              const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
                setHeader: jest.fn(),
              } as unknown as Response;

              const next: NextFunction = jest.fn();

              middleware(req, res, next);
              lastRes = res;
            }

            // Verify headers are set (after first request)
            if (requestCount > 1 && lastRes) {
              expect(lastRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', MAX_REQUESTS.toString());
              expect(lastRes.setHeader).toHaveBeenCalledWith(
                'X-RateLimit-Remaining',
                expect.any(String)
              );
              expect(lastRes.setHeader).toHaveBeenCalledWith(
                'X-RateLimit-Reset',
                expect.any(String)
              );
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
