import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import { TokenPayload } from '../types/auth';

// 환경 변수에서 JWT 시크릿 로드
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

// 프로덕션에서는 환경변수 필수
if (process.env.NODE_ENV === 'production' && !ACCESS_TOKEN_SECRET) {
  throw new Error('FATAL: JWT_ACCESS_SECRET must be set in production');
}

if (!ACCESS_TOKEN_SECRET) {
  console.warn('⚠️  WARNING: JWT_ACCESS_SECRET 환경 변수가 설정되지 않았습니다. 기본값을 사용합니다.');
}

const JWT_SECRET = ACCESS_TOKEN_SECRET || 'chemon-default-secret-dev-only';

const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT tokens
 * Extracts and verifies the access token from Authorization header
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('인증 토큰이 필요합니다', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('잘못된 인증 형식입니다', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }

    const token = parts[1];
    if (!token || token.trim() === '') {
      throw new AppError('토큰이 비어있습니다', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Fetch user from DB to get canViewAllSales
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, canViewAllSales: true, canViewAllData: true },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      canViewAllSales: user.canViewAllSales,
      canViewAllData: user.canViewAllData,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('토큰이 만료되었습니다', 401, ErrorCodes.AUTH_TOKEN_EXPIRED));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('유효하지 않은 토큰입니다', 401, ErrorCodes.AUTH_TOKEN_INVALID));
      return;
    }

    next(new AppError('인증 처리 중 오류가 발생했습니다', 401, ErrorCodes.AUTH_TOKEN_INVALID));
  }
};

/**
 * Middleware factory for role-based access control
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const authorize = (...allowedRoles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('인증이 필요합니다', 401, ErrorCodes.AUTH_TOKEN_INVALID));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED));
      return;
    }

    next();
  };
};

/**
 * Middleware that requires admin role
 */
export const requireAdmin = authorize('ADMIN');

/**
 * Middleware that allows both USER and ADMIN roles
 */
export const requireUser = authorize('USER', 'ADMIN');

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];
    if (!token || token.trim() === '') {
      next();
      return;
    }

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, canViewAllSales: true, canViewAllData: true },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        canViewAllSales: user.canViewAllSales,
        canViewAllData: user.canViewAllData,
      };
    }

    next();
  } catch {
    // Silently continue without authentication
    next();
  }
};
