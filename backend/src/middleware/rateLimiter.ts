import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '../types/error';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware
 * Limits requests per IP address within a time window
 */
export const rateLimiter = (
  windowMs: number = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  maxRequests: number = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[ip] || store[ip].resetTime < now) {
      // Initialize or reset the counter
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    store[ip].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[ip].count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[ip].resetTime / 1000).toString());

    if (store[ip].count > maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: ErrorCodes.RATE_LIMIT_EXCEEDED,
          message: '요청 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Get current rate limit status for an IP
 * Useful for testing
 */
export const getRateLimitStatus = (ip: string): { count: number; resetTime: number } | null => {
  return store[ip] || null;
};

/**
 * Reset rate limit for an IP
 * Useful for testing
 */
export const resetRateLimit = (ip: string): void => {
  delete store[ip];
};

/**
 * Clear all rate limit data
 * Useful for testing
 */
export const clearAllRateLimits = (): void => {
  for (const key in store) {
    delete store[key];
  }
};
