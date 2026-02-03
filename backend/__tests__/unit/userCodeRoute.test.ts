/**
 * Unit Tests for User Code Validation API Route
 * Feature: unified-quotation-code
 * 
 * These tests verify the POST /api/user-code/validate endpoint functionality.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

/// <reference types="jest" />

import express, { Express } from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Mock the prisma module
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    userSettings: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock the auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'USER' as const,
      canViewAllSales: false,
      canViewAllData: false,
    };
    next();
  },
}));

import userCodeRoutes from '../../src/routes/userCode';
import { prisma } from '../../src/lib/prisma';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('User Code Validation API Route', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/user-code', userCodeRoutes);
    app.use('/api/user-settings', userCodeRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/user-code/validate', () => {
    /**
     * Validates: Requirement 4.1
     * 새 User_Code를 설정하려고 하면 다른 사용자가 이미 사용 중인 코드인지 확인해야 합니다
     */
    it('should return valid for available code', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: 'DL' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.isDuplicate).toBe(false);
      expect(response.body.data.normalizedCode).toBe('DL');
      expect(response.body.data.error).toBeUndefined();
    });

    /**
     * Validates: Requirement 4.2
     * 입력한 User_Code가 다른 사용자에 의해 이미 사용 중이면 
     * "이미 사용 중인 견적서 코드입니다" 오류 메시지를 표시
     */
    it('should return invalid with duplicate error for used code', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
        userId: 'other-user-id',
        userCode: 'DL',
      });

      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: 'DL' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.isDuplicate).toBe(true);
      expect(response.body.data.normalizedCode).toBe('DL');
      expect(response.body.data.error).toBe('이미 사용 중인 견적서 코드입니다');
    });

    /**
     * Validates: Requirement 4.3
     * User_Code 중복 검사를 수행하면 대소문자를 구분하지 않고 비교해야 합니다
     */
    it('should detect duplicate case-insensitively', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
        userId: 'other-user-id',
        userCode: 'DL',
      });

      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: 'dl' });

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.isDuplicate).toBe(true);
      expect(response.body.data.normalizedCode).toBe('DL');
    });

    it('should normalize code to uppercase in response', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: 'pk' });

      expect(response.status).toBe(200);
      expect(response.body.data.normalizedCode).toBe('PK');
    });

    it('should return format error for invalid code format', async () => {
      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: 'D1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.isDuplicate).toBe(false);
      expect(response.body.data.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should return format error for code with wrong length', async () => {
      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: 'ABC' });

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should return format error for single character code', async () => {
      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: 'D' });

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should return validation error for empty userCode', async () => {
      const response = await request(app)
        .post('/api/user-code/validate')
        .send({ userCode: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing userCode', async () => {
      const response = await request(app)
        .post('/api/user-code/validate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle various valid 2-letter codes', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);

      const codes = ['KS', 'PK', 'AB', 'ZZ', 'Xy', 'aB'];
      
      for (const code of codes) {
        const response = await request(app)
          .post('/api/user-code/validate')
          .send({ userCode: code });

        expect(response.status).toBe(200);
        expect(response.body.data.isValid).toBe(true);
        expect(response.body.data.normalizedCode).toBe(code.toUpperCase());
      }
    });

    it('should reject codes with special characters', async () => {
      const invalidCodes = ['D!', '@L', 'D-', 'A#', '$B'];
      
      for (const code of invalidCodes) {
        const response = await request(app)
          .post('/api/user-code/validate')
          .send({ userCode: code });

        expect(response.status).toBe(200);
        expect(response.body.data.isValid).toBe(false);
        expect(response.body.data.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
      }
    });

    it('should reject codes with numbers', async () => {
      const invalidCodes = ['D1', '1L', '12', 'A9'];
      
      for (const code of invalidCodes) {
        const response = await request(app)
          .post('/api/user-code/validate')
          .send({ userCode: code });

        expect(response.status).toBe(200);
        expect(response.body.data.isValid).toBe(false);
        expect(response.body.data.error).toBe('견적서 코드는 2글자 영문이어야 합니다');
      }
    });
  });

  describe('PUT /api/user-settings/user-code', () => {
    /**
     * Validates: Requirement 4.5
     * 자신의 기존 User_Code와 동일한 값 입력 시 중복 오류 없이 저장 허용
     */
    it('should save user code successfully when no duplicate exists', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
        userId: 'test-user-id',
        userCode: 'DL',
      });

      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: 'DL' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.userCode).toBe('DL');
      expect(response.body.data.error).toBeUndefined();
    });

    /**
     * Validates: Requirement 4.6
     * User_Code 저장 시 항상 대문자로 변환
     */
    it('should normalize code to uppercase when saving', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
        userId: 'test-user-id',
        userCode: 'PK',
      });

      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: 'pk' });

      expect(response.status).toBe(200);
      expect(response.body.data.userCode).toBe('PK');
      
      // Verify upsert was called with normalized code
      expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        update: { userCode: 'PK' },
        create: { userId: 'test-user-id', userCode: 'PK' },
      });
    });

    /**
     * Validates: Requirement 4.5
     * 자신의 기존 코드와 동일한 경우 중복 오류 없이 저장 허용
     */
    it('should allow saving own existing code without duplicate error', async () => {
      // No other user has this code (findFirst returns null because we exclude current user)
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
        userId: 'test-user-id',
        userCode: 'DL',
      });

      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: 'DL' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
    });

    /**
     * Validates: Requirements 4.1, 4.2
     * 다른 사용자가 이미 사용 중인 코드인지 확인하고 중복 시 오류 반환
     */
    it('should reject saving duplicate code used by another user', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
        userId: 'other-user-id',
        userCode: 'DL',
      });

      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: 'DL' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('이미 사용 중인 견적서 코드입니다');
    });

    /**
     * Validates: Requirement 4.3
     * 대소문자 구분 없이 중복 검사
     */
    it('should detect duplicate case-insensitively when saving', async () => {
      (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue({
        userId: 'other-user-id',
        userCode: 'DL',
      });

      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: 'dl' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('이미 사용 중인 견적서 코드입니다');
    });

    it('should reject invalid format code when saving', async () => {
      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: 'D1' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should reject code with wrong length when saving', async () => {
      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: 'ABC' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('견적서 코드는 2글자 영문이어야 합니다');
    });

    it('should return validation error for empty userCode when saving', async () => {
      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({ userCode: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing userCode when saving', async () => {
      const response = await request(app)
        .put('/api/user-settings/user-code')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle various valid 2-letter codes when saving', async () => {
      const codes = ['KS', 'PK', 'AB', 'ZZ', 'Xy', 'aB'];
      
      for (const code of codes) {
        (prisma.userSettings.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
          userId: 'test-user-id',
          userCode: code.toUpperCase(),
        });

        const response = await request(app)
          .put('/api/user-settings/user-code')
          .send({ userCode: code });

        expect(response.status).toBe(200);
        expect(response.body.data.success).toBe(true);
        expect(response.body.data.userCode).toBe(code.toUpperCase());
      }
    });

    it('should reject codes with special characters when saving', async () => {
      const invalidCodes = ['D!', '@L', 'D-', 'A#', '$B'];
      
      for (const code of invalidCodes) {
        const response = await request(app)
          .put('/api/user-settings/user-code')
          .send({ userCode: code });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('견적서 코드는 2글자 영문이어야 합니다');
      }
    });

    it('should reject codes with numbers when saving', async () => {
      const invalidCodes = ['D1', '1L', '12', 'A9'];
      
      for (const code of invalidCodes) {
        const response = await request(app)
          .put('/api/user-settings/user-code')
          .send({ userCode: code });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('견적서 코드는 2글자 영문이어야 합니다');
      }
    });
  });
});
