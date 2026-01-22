import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '../types/error';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../lib/logger';

// Prisma 에러 코드별 메시지 매핑
const PRISMA_ERROR_MESSAGES: Record<string, { status: number; message: string; code: string }> = {
  P2002: { status: 409, message: '이미 존재하는 데이터입니다', code: ErrorCodes.CONFLICT },
  P2003: { status: 400, message: '참조하는 데이터가 존재하지 않습니다', code: ErrorCodes.VALIDATION_ERROR },
  P2025: { status: 404, message: '요청한 데이터를 찾을 수 없습니다', code: ErrorCodes.RESOURCE_NOT_FOUND },
  P2014: { status: 400, message: '필수 관계 데이터가 누락되었습니다', code: ErrorCodes.VALIDATION_ERROR },
  P2021: { status: 500, message: '데이터베이스 테이블이 존재하지 않습니다', code: ErrorCodes.INTERNAL_ERROR },
  P2022: { status: 500, message: '데이터베이스 컬럼이 존재하지 않습니다', code: ErrorCodes.INTERNAL_ERROR },
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`[Error] ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Prisma Known Request Errors (P2002, P2003, P2025, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const errorInfo = PRISMA_ERROR_MESSAGES[err.code];
    
    if (errorInfo) {
      // P2002 unique constraint violation - 어떤 필드가 중복인지 상세 정보 제공
      let details: Record<string, string> | undefined;
      if (err.code === 'P2002' && err.meta?.target) {
        const target = Array.isArray(err.meta.target) 
          ? err.meta.target.join(', ') 
          : String(err.meta.target);
        details = { field: target };
      }

      res.status(errorInfo.status).json({
        success: false,
        error: {
          code: errorInfo.code,
          message: errorInfo.message,
          details,
        },
      });
      return;
    }

    // 알 수 없는 Prisma 에러 코드
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: process.env.NODE_ENV === 'production'
          ? '데이터베이스 오류가 발생했습니다'
          : `Prisma Error [${err.code}]: ${err.message}`,
      },
    });
    return;
  }

  // Handle Prisma Validation Errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: '데이터 형식이 올바르지 않습니다',
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(error.message);
    });

    res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: '입력 데이터가 유효하지 않습니다',
        details,
      },
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? '서버 내부 오류가 발생했습니다' 
        : err.message,
    },
  });
};
