/**
 * Unit Tests for TestReception API Routes
 * Feature: crm-workflow-enhancement
 * 
 * These tests verify the TestReception API endpoints:
 * - POST /api/customer-data/customers/:customerId/test-receptions (substanceCode, projectCode required)
 * - PUT /api/customer-data/test-receptions/:id/issue-test-number (test number issuance)
 * 
 * Requirements: 3.2, 3.3
 */

/// <reference types="jest" />

import express, { Express } from 'express';
import request from 'supertest';

// Mock the prisma module
jest.mock('../../src/lib/prisma', () => {
  const mockPrisma = {
    testReception: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    consultationRecord: {
      findMany: jest.fn(),
    },
    invoiceSchedule: {
      deleteMany: jest.fn(),
    },
    calendarEvent: {
      deleteMany: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

// Mock the auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (req as any).user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'USER' as const,
    };
    next();
  },
}));

import customerDataRoutes from '../../src/routes/customerData';
import prisma from '../../src/lib/prisma';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('TestReception API Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/customer-data', customerDataRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/customer-data/customers/:customerId/test-receptions', () => {
    const mockTestReception = {
      id: 'test-reception-id',
      customerId: 'customer-id',
      substanceCode: 'SUB-001',
      projectCode: 'PRJ-001',
      status: 'received',
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      requester: null,
    };

    /**
     * Validates: Requirement 3.2
     * WHEN 시험 접수가 생성되면 THEN THE System SHALL substanceCode, projectCode 필드를 필수로 요구해야 합니다
     */
    it('should return 400 when substanceCode is missing', async () => {
      const response = await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          projectCode: 'PRJ-001',
          totalAmount: 1000000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('substanceCode');
      expect(response.body.missingFields).toContain('substanceCode (물질코드)');
    });

    /**
     * Validates: Requirement 3.2
     * projectCode 누락 시 400 오류 반환
     */
    it('should return 400 when projectCode is missing', async () => {
      const response = await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          substanceCode: 'SUB-001',
          totalAmount: 1000000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('projectCode');
      expect(response.body.missingFields).toContain('projectCode (프로젝트코드)');
    });

    /**
     * Validates: Requirement 3.2
     * substanceCode와 projectCode 모두 누락 시 400 오류 반환
     */
    it('should return 400 when both substanceCode and projectCode are missing', async () => {
      const response = await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          totalAmount: 1000000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.missingFields).toHaveLength(2);
      expect(response.body.missingFields).toContain('substanceCode (물질코드)');
      expect(response.body.missingFields).toContain('projectCode (프로젝트코드)');
    });

    /**
     * Validates: Requirement 3.2
     * substanceCode가 빈 문자열인 경우 400 오류 반환
     */
    it('should return 400 when substanceCode is empty string', async () => {
      const response = await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          substanceCode: '',
          projectCode: 'PRJ-001',
          totalAmount: 1000000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.missingFields).toContain('substanceCode (물질코드)');
    });

    /**
     * Validates: Requirement 3.2
     * projectCode가 빈 문자열인 경우 400 오류 반환
     */
    it('should return 400 when projectCode is empty string', async () => {
      const response = await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          substanceCode: 'SUB-001',
          projectCode: '',
          totalAmount: 1000000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.missingFields).toContain('projectCode (프로젝트코드)');
    });

    /**
     * Validates: Requirement 3.2
     * substanceCode가 공백만 있는 경우 400 오류 반환
     */
    it('should return 400 when substanceCode is whitespace only', async () => {
      const response = await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          substanceCode: '   ',
          projectCode: 'PRJ-001',
          totalAmount: 1000000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.missingFields).toContain('substanceCode (물질코드)');
    });

    /**
     * Validates: Requirement 3.2
     * 유효한 substanceCode와 projectCode로 성공적으로 시험 접수 생성
     */
    it('should successfully create test reception with valid substanceCode and projectCode', async () => {
      (prisma.testReception.create as jest.Mock).mockResolvedValue(mockTestReception);

      const response = await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          substanceCode: 'SUB-001',
          projectCode: 'PRJ-001',
          totalAmount: 1000000,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.testReception).toBeDefined();
    });

    /**
     * Validates: Requirement 3.2
     * substanceCode와 projectCode가 trim되어 저장되는지 확인
     */
    it('should trim substanceCode and projectCode before saving', async () => {
      (prisma.testReception.create as jest.Mock).mockResolvedValue(mockTestReception);

      await request(app)
        .post('/api/customer-data/customers/customer-id/test-receptions')
        .send({
          substanceCode: '  SUB-001  ',
          projectCode: '  PRJ-001  ',
          totalAmount: 1000000,
        });

      expect(prisma.testReception.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            substanceCode: 'SUB-001',
            projectCode: 'PRJ-001',
          }),
        })
      );
    });
  });

  describe('PUT /api/customer-data/test-receptions/:id/issue-test-number', () => {
    const mockTestReception = {
      id: 'test-reception-id',
      customerId: 'customer-id',
      substanceCode: 'SUB-001',
      projectCode: 'PRJ-001',
      testNumber: null,
      testNumberIssuedAt: null,
      testNumberIssuedBy: null,
      status: 'received',
      requester: null,
      customer: { id: 'customer-id', companyName: 'Test Company' },
    };

    const mockIssuedTestReception = {
      ...mockTestReception,
      testNumber: 'TEST-2025-0001',
      testTitle: '시험 제목',
      testDirector: '홍길동',
      testNumberIssuedAt: new Date(),
      testNumberIssuedBy: 'test-user-id',
    };

    /**
     * Validates: Requirement 3.3
     * 시험번호 필수 검증
     */
    it('should return 400 when testNumber is missing', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);

      const response = await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('시험번호를 입력해주세요.');
    });

    /**
     * Validates: Requirement 3.3
     * 시험번호가 빈 문자열인 경우 400 오류 반환
     */
    it('should return 400 when testNumber is empty string', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);

      const response = await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({ testNumber: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('시험번호를 입력해주세요.');
    });

    /**
     * Validates: Requirement 3.3
     * 시험번호가 공백만 있는 경우 400 오류 반환
     */
    it('should return 400 when testNumber is whitespace only', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);

      const response = await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({ testNumber: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('시험번호를 입력해주세요.');
    });

    /**
     * 존재하지 않는 시험 접수에 대한 요청 시 404 반환
     */
    it('should return 404 when test reception does not exist', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/customer-data/test-receptions/non-existent-id/issue-test-number')
        .send({ testNumber: 'TEST-2025-0001' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('시험 접수를 찾을 수 없습니다.');
    });

    /**
     * Validates: Requirement 3.3 (Error handling from design.md)
     * 중복 시험번호 발행 시도 시 409 Conflict 반환
     */
    it('should return 409 when testNumber already exists', async () => {
      // First call for getById
      (prisma.testReception.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTestReception) // getById
        .mockResolvedValueOnce({ id: 'other-reception-id', testNumber: 'TEST-2025-0001' }); // checkTestNumberExists

      const response = await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({ testNumber: 'TEST-2025-0001' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('이미 사용 중인 시험번호입니다.');
    });

    /**
     * Validates: Requirement 3.3
     * WHEN PM팀에서 시험번호를 발행하면 THEN THE System SHALL testNumber 필드를 업데이트하고 발행일시를 기록해야 합니다
     */
    it('should successfully issue test number with testNumberIssuedAt and testNumberIssuedBy', async () => {
      (prisma.testReception.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTestReception) // getById
        .mockResolvedValueOnce(null) // checkTestNumberExists - no duplicate
        .mockResolvedValueOnce(null); // issueTestNumber - duplicate check
      
      (prisma.testReception.update as jest.Mock).mockResolvedValue(mockIssuedTestReception);

      const response = await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({
          testNumber: 'TEST-2025-0001',
          testTitle: '시험 제목',
          testDirector: '홍길동',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.testReception).toBeDefined();
    });

    /**
     * Validates: Requirement 3.3
     * testNumberIssuedAt이 자동으로 현재 시간으로 설정되는지 확인
     */
    it('should set testNumberIssuedAt to current time', async () => {
      (prisma.testReception.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTestReception)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      (prisma.testReception.update as jest.Mock).mockResolvedValue(mockIssuedTestReception);

      await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({ testNumber: 'TEST-2025-0001' });

      expect(prisma.testReception.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            testNumberIssuedAt: expect.any(Date),
          }),
        })
      );
    });

    /**
     * Validates: Requirement 3.3
     * testNumberIssuedBy가 현재 사용자 ID로 설정되는지 확인
     */
    it('should set testNumberIssuedBy to current user id', async () => {
      (prisma.testReception.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTestReception)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      (prisma.testReception.update as jest.Mock).mockResolvedValue(mockIssuedTestReception);

      await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({ testNumber: 'TEST-2025-0001' });

      expect(prisma.testReception.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            testNumberIssuedBy: 'test-user-id',
          }),
        })
      );
    });

    /**
     * Validates: Requirement 3.3
     * testTitle과 testDirector가 선택적으로 저장되는지 확인
     */
    it('should save optional testTitle and testDirector', async () => {
      (prisma.testReception.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTestReception)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      (prisma.testReception.update as jest.Mock).mockResolvedValue(mockIssuedTestReception);

      await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({
          testNumber: 'TEST-2025-0001',
          testTitle: '시험 제목',
          testDirector: '홍길동',
        });

      expect(prisma.testReception.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            testNumber: 'TEST-2025-0001',
            testTitle: '시험 제목',
            testDirector: '홍길동',
          }),
        })
      );
    });

    /**
     * Validates: Requirement 3.3
     * testNumber가 trim되어 저장되는지 확인
     */
    it('should trim testNumber before saving', async () => {
      (prisma.testReception.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTestReception)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      (prisma.testReception.update as jest.Mock).mockResolvedValue(mockIssuedTestReception);

      await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({ testNumber: '  TEST-2025-0001  ' });

      expect(prisma.testReception.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            testNumber: 'TEST-2025-0001',
          }),
        })
      );
    });

    /**
     * 동일한 시험 접수에 대해 시험번호 재발행 허용 (업데이트)
     */
    it('should allow updating test number for the same test reception', async () => {
      const receptionWithTestNumber = {
        ...mockTestReception,
        testNumber: 'TEST-2025-0001',
      };

      (prisma.testReception.findUnique as jest.Mock)
        .mockResolvedValueOnce(receptionWithTestNumber) // getById
        .mockResolvedValueOnce(receptionWithTestNumber) // checkTestNumberExists - same reception
        .mockResolvedValueOnce(receptionWithTestNumber); // issueTestNumber - duplicate check
      
      (prisma.testReception.update as jest.Mock).mockResolvedValue({
        ...mockIssuedTestReception,
        testNumber: 'TEST-2025-0002',
      });

      const response = await request(app)
        .put('/api/customer-data/test-receptions/test-reception-id/issue-test-number')
        .send({ testNumber: 'TEST-2025-0002' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/customer-data/test-receptions/:id/with-consultation', () => {
    const mockTestReception = {
      id: 'test-reception-id',
      customerId: 'customer-id',
      substanceCode: 'SUB-001',
      projectCode: 'PRJ-001',
      testNumber: 'TEST-2025-0001',
      status: 'received',
      totalAmount: 1000000,
      createdAt: new Date(),
      updatedAt: new Date(),
      requester: null,
      customer: { id: 'customer-id', companyName: 'Test Company' },
      invoiceSchedules: [],
    };

    const mockConsultationRecords = [
      {
        id: 'consultation-1',
        recordNumber: 'CR-2025-0001',
        customerId: 'customer-id',
        userId: 'user-id',
        customerInfo: { companyName: 'Test Company' },
        consultDate: new Date('2025-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: 'consultation-2',
        recordNumber: 'CR-2025-0002',
        customerId: 'customer-id',
        userId: 'user-id',
        customerInfo: { companyName: 'Test Company' },
        consultDate: new Date('2025-01-10'),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    /**
     * Validates: Requirements 3.4, 3.5
     * WHEN 시험 접수가 생성되면 THEN THE System SHALL 연결된 상담기록지(Consultation_Record)를 함께 조회할 수 있어야 합니다
     */
    it('should return test reception with consultation records', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);
      (prisma.consultationRecord.findMany as jest.Mock).mockResolvedValue(mockConsultationRecords);

      const response = await request(app)
        .get('/api/customer-data/test-receptions/test-reception-id/with-consultation');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.testReception).toBeDefined();
      expect(response.body.data.testReception.consultationRecords).toBeDefined();
      expect(response.body.data.testReception.consultationRecords).toHaveLength(2);
    });

    /**
     * Validates: Requirements 3.4, 3.5
     * 시험 접수가 존재하지 않는 경우 404 반환
     */
    it('should return 404 when test reception does not exist', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/customer-data/test-receptions/non-existent-id/with-consultation');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('시험 접수를 찾을 수 없습니다.');
    });

    /**
     * Validates: Requirements 3.4, 3.5
     * 상담기록이 없는 경우 빈 배열 반환
     */
    it('should return empty consultation records array when no records exist', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);
      (prisma.consultationRecord.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/customer-data/test-receptions/test-reception-id/with-consultation');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.testReception.consultationRecords).toEqual([]);
    });

    /**
     * Validates: Requirements 3.4, 3.5
     * 상담기록 조회 시 customerId로 필터링되는지 확인
     */
    it('should query consultation records by customerId', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);
      (prisma.consultationRecord.findMany as jest.Mock).mockResolvedValue(mockConsultationRecords);

      await request(app)
        .get('/api/customer-data/test-receptions/test-reception-id/with-consultation');

      expect(prisma.consultationRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: 'customer-id',
            deletedAt: null,
          }),
        })
      );
    });

    /**
     * Validates: Requirements 3.4, 3.5
     * 상담기록이 consultDate 기준 내림차순으로 정렬되는지 확인
     */
    it('should order consultation records by consultDate descending', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);
      (prisma.consultationRecord.findMany as jest.Mock).mockResolvedValue(mockConsultationRecords);

      await request(app)
        .get('/api/customer-data/test-receptions/test-reception-id/with-consultation');

      expect(prisma.consultationRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { consultDate: 'desc' },
        })
      );
    });

    /**
     * Validates: Requirements 3.4, 3.5
     * 삭제된 상담기록은 제외되는지 확인
     */
    it('should exclude deleted consultation records', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);
      (prisma.consultationRecord.findMany as jest.Mock).mockResolvedValue(mockConsultationRecords);

      await request(app)
        .get('/api/customer-data/test-receptions/test-reception-id/with-consultation');

      expect(prisma.consultationRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });

    /**
     * Validates: Requirements 3.4, 3.5
     * 시험 접수의 기본 정보도 함께 반환되는지 확인
     */
    it('should include test reception basic info in response', async () => {
      (prisma.testReception.findUnique as jest.Mock).mockResolvedValue(mockTestReception);
      (prisma.consultationRecord.findMany as jest.Mock).mockResolvedValue(mockConsultationRecords);

      const response = await request(app)
        .get('/api/customer-data/test-receptions/test-reception-id/with-consultation');

      expect(response.status).toBe(200);
      expect(response.body.data.testReception.id).toBe('test-reception-id');
      expect(response.body.data.testReception.customerId).toBe('customer-id');
      expect(response.body.data.testReception.substanceCode).toBe('SUB-001');
      expect(response.body.data.testReception.projectCode).toBe('PRJ-001');
      expect(response.body.data.testReception.testNumber).toBe('TEST-2025-0001');
    });
  });
});
