/**
 * Unit Tests for Lead Lost Reason API Route
 * Feature: crm-workflow-enhancement
 * 
 * These tests verify the PUT /api/leads/:id/lost endpoint functionality.
 * 
 * Requirements: 2.3, 2.4, 2.6
 */

/// <reference types="jest" />

import express, { Express } from 'express';
import request from 'supertest';

// Mock the prisma module
jest.mock('../../src/lib/prisma', () => {
  const mockPrisma = {
    lead: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    leadActivity: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
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
      canViewAllSales: false,
      canViewAllData: false,
    };
    next();
  },
}));

// Mock the dataSyncService
jest.mock('../../src/services/dataSyncService', () => ({
  dataSyncService: {
    syncLeadToCustomer: jest.fn(),
  },
}));

// Mock the leadNumberService
jest.mock('../../src/services/leadNumberService', () => ({
  leadNumberService: {
    generateLeadNumber: jest.fn(),
  },
  UserCodeNotSetError: class UserCodeNotSetError extends Error {},
}));

import leadRoutes from '../../src/routes/leads';
import prisma from '../../src/lib/prisma';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('Lead Lost Reason API Route', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/leads', leadRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/leads/:id/lost', () => {
    const mockLead = {
      id: 'test-lead-id',
      userId: 'test-user-id',
      companyName: 'Test Company',
      contactName: 'Test Contact',
      status: 'NEW',
      deletedAt: null,
    };

    const mockUpdatedLead = {
      ...mockLead,
      lostReason: 'PRICE_ISSUE',
      lostReasonDetail: null,
      lostAt: new Date(),
      status: 'LOST',
      stage: { id: 'stage-1', name: 'Test Stage' },
      customer: null,
    };

    const mockActivity = {
      id: 'activity-id',
      leadId: 'test-lead-id',
      userId: 'test-user-id',
      type: 'LOST_REASON',
      subject: '미진행 사유 기록',
      content: '미진행 사유: PRICE_ISSUE',
    };

    /**
     * Validates: Requirement 2.3
     * WHEN 리드의 status가 LOST로 변경되면 THEN THE System SHALL lostReason 필드 입력을 필수로 요구해야 합니다
     */
    it('should return 400 when lostReason is missing', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('미진행 사유를 선택해주세요');
    });

    /**
     * Validates: Requirement 2.3
     * lostReason이 빈 문자열인 경우 오류 반환
     */
    it('should return 400 when lostReason is empty string', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('미진행 사유를 선택해주세요');
    });

    /**
     * Validates: Requirement 2.4
     * WHEN lostReason이 OTHER로 선택되면 THEN THE System SHALL lostReasonDetail 필드 입력을 필수로 요구해야 합니다
     */
    it('should return 400 when lostReason is OTHER but lostReasonDetail is missing', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'OTHER' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('기타 사유를 입력해주세요');
    });

    /**
     * Validates: Requirement 2.4
     * OTHER 선택 시 lostReasonDetail이 빈 문자열인 경우 오류 반환
     */
    it('should return 400 when lostReason is OTHER but lostReasonDetail is empty', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'OTHER', lostReasonDetail: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('기타 사유를 입력해주세요');
    });

    /**
     * Validates: Requirement 2.4
     * OTHER 선택 시 lostReasonDetail이 공백만 있는 경우 오류 반환
     */
    it('should return 400 when lostReason is OTHER but lostReasonDetail is whitespace only', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'OTHER', lostReasonDetail: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('기타 사유를 입력해주세요');
    });

    /**
     * Validates: Requirements 2.3, 2.6
     * 유효한 lostReason으로 성공적으로 미진행 처리
     */
    it('should successfully record lost reason with valid lostReason', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          lead: {
            update: jest.fn().mockResolvedValue(mockUpdatedLead),
          },
          leadActivity: {
            create: jest.fn().mockResolvedValue(mockActivity),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'PRICE_ISSUE' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lead).toBeDefined();
      expect(response.body.data.activity).toBeDefined();
    });

    /**
     * Validates: Requirements 2.4, 2.6
     * OTHER 선택 시 lostReasonDetail과 함께 성공적으로 미진행 처리
     */
    it('should successfully record lost reason with OTHER and detail', async () => {
      const mockUpdatedLeadWithOther = {
        ...mockUpdatedLead,
        lostReason: 'OTHER',
        lostReasonDetail: '고객사 내부 사정으로 프로젝트 취소',
      };
      const mockActivityWithOther = {
        ...mockActivity,
        content: '미진행 사유: 기타 - 고객사 내부 사정으로 프로젝트 취소',
      };

      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          lead: {
            update: jest.fn().mockResolvedValue(mockUpdatedLeadWithOther),
          },
          leadActivity: {
            create: jest.fn().mockResolvedValue(mockActivityWithOther),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ 
          lostReason: 'OTHER', 
          lostReasonDetail: '고객사 내부 사정으로 프로젝트 취소' 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lead).toBeDefined();
      expect(response.body.data.activity).toBeDefined();
    });

    /**
     * 존재하지 않는 리드에 대한 요청 시 404 반환
     */
    it('should return 404 when lead does not exist', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/leads/non-existent-id/lost')
        .send({ lostReason: 'PRICE_ISSUE' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('리드를 찾을 수 없습니다.');
    });

    /**
     * 유효하지 않은 lostReason 값에 대한 오류 반환
     */
    it('should return 400 for invalid lostReason value', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);

      const response = await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'INVALID_REASON' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('유효하지 않은 미진행 사유입니다');
    });

    /**
     * 모든 유효한 lostReason 값에 대한 테스트
     */
    it('should accept all valid lostReason values', async () => {
      const validReasons = [
        'BUDGET_PLANNING',
        'COMPETITOR_SELECTED',
        'PRICE_ISSUE',
        'SCHEDULE_ISSUE',
        'ON_HOLD',
      ];

      for (const reason of validReasons) {
        (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          const tx = {
            lead: {
              update: jest.fn().mockResolvedValue({
                ...mockUpdatedLead,
                lostReason: reason,
              }),
            },
            leadActivity: {
              create: jest.fn().mockResolvedValue({
                ...mockActivity,
                content: `미진행 사유: ${reason}`,
              }),
            },
          };
          return callback(tx);
        });

        const response = await request(app)
          .put('/api/leads/test-lead-id/lost')
          .send({ lostReason: reason });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    /**
     * Validates: Requirement 2.6
     * LeadActivity가 type: "LOST_REASON"으로 생성되는지 확인
     */
    it('should create LeadActivity with type LOST_REASON', async () => {
      let capturedActivityData: any = null;

      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          lead: {
            update: jest.fn().mockResolvedValue(mockUpdatedLead),
          },
          leadActivity: {
            create: jest.fn().mockImplementation((data) => {
              capturedActivityData = data;
              return Promise.resolve(mockActivity);
            }),
          },
        };
        return callback(tx);
      });

      await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'PRICE_ISSUE' });

      expect(capturedActivityData).toBeDefined();
      expect(capturedActivityData.data.type).toBe('LOST_REASON');
      expect(capturedActivityData.data.subject).toBe('미진행 사유 기록');
    });

    /**
     * 리드 업데이트 시 status가 LOST로 변경되는지 확인
     */
    it('should update lead status to LOST', async () => {
      let capturedLeadUpdateData: any = null;

      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          lead: {
            update: jest.fn().mockImplementation((data) => {
              capturedLeadUpdateData = data;
              return Promise.resolve(mockUpdatedLead);
            }),
          },
          leadActivity: {
            create: jest.fn().mockResolvedValue(mockActivity),
          },
        };
        return callback(tx);
      });

      await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'PRICE_ISSUE' });

      expect(capturedLeadUpdateData).toBeDefined();
      expect(capturedLeadUpdateData.data.status).toBe('LOST');
      expect(capturedLeadUpdateData.data.lostReason).toBe('PRICE_ISSUE');
      expect(capturedLeadUpdateData.data.lostAt).toBeDefined();
    });

    /**
     * OTHER가 아닌 경우 lostReasonDetail이 null로 설정되는지 확인
     */
    it('should set lostReasonDetail to null when lostReason is not OTHER', async () => {
      let capturedLeadUpdateData: any = null;

      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          lead: {
            update: jest.fn().mockImplementation((data) => {
              capturedLeadUpdateData = data;
              return Promise.resolve(mockUpdatedLead);
            }),
          },
          leadActivity: {
            create: jest.fn().mockResolvedValue(mockActivity),
          },
        };
        return callback(tx);
      });

      await request(app)
        .put('/api/leads/test-lead-id/lost')
        .send({ lostReason: 'PRICE_ISSUE', lostReasonDetail: 'This should be ignored' });

      expect(capturedLeadUpdateData.data.lostReasonDetail).toBeNull();
    });
  });

  /**
   * Tests for GET /api/leads/lost-reason-stats endpoint
   * Validates: Requirement 2.7
   * THE System SHALL 미진행 사유별 통계를 조회할 수 있는 API를 제공해야 합니다
   */
  describe('GET /api/leads/lost-reason-stats', () => {
    /**
     * Validates: Requirement 2.7
     * 미진행 사유별 통계 조회 - 빈 결과
     */
    it('should return empty statistics when no lost leads exist', async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leads/lost-reason-stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLost).toBe(0);
      expect(response.body.data.byReason).toEqual({
        BUDGET_PLANNING: 0,
        COMPETITOR_SELECTED: 0,
        PRICE_ISSUE: 0,
        SCHEDULE_ISSUE: 0,
        ON_HOLD: 0,
        OTHER: 0,
      });
      expect(response.body.data.byMonth).toEqual([]);
    });

    /**
     * Validates: Requirement 2.7
     * 미진행 사유별 통계 조회 - 사유별 집계
     */
    it('should aggregate lost leads by reason', async () => {
      const mockLostLeads = [
        { id: '1', lostReason: 'PRICE_ISSUE', lostAt: new Date('2025-01-15') },
        { id: '2', lostReason: 'PRICE_ISSUE', lostAt: new Date('2025-01-20') },
        { id: '3', lostReason: 'COMPETITOR_SELECTED', lostAt: new Date('2025-01-25') },
        { id: '4', lostReason: 'BUDGET_PLANNING', lostAt: new Date('2025-02-10') },
        { id: '5', lostReason: 'OTHER', lostAt: new Date('2025-02-15') },
      ];

      (prisma.lead.findMany as jest.Mock).mockResolvedValue(mockLostLeads);

      const response = await request(app)
        .get('/api/leads/lost-reason-stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLost).toBe(5);
      expect(response.body.data.byReason).toEqual({
        BUDGET_PLANNING: 1,
        COMPETITOR_SELECTED: 1,
        PRICE_ISSUE: 2,
        SCHEDULE_ISSUE: 0,
        ON_HOLD: 0,
        OTHER: 1,
      });
    });

    /**
     * Validates: Requirement 2.7
     * 미진행 사유별 통계 조회 - 월별 집계
     */
    it('should aggregate lost leads by month with reason breakdown', async () => {
      const mockLostLeads = [
        { id: '1', lostReason: 'PRICE_ISSUE', lostAt: new Date('2025-01-15') },
        { id: '2', lostReason: 'PRICE_ISSUE', lostAt: new Date('2025-01-20') },
        { id: '3', lostReason: 'COMPETITOR_SELECTED', lostAt: new Date('2025-01-25') },
        { id: '4', lostReason: 'BUDGET_PLANNING', lostAt: new Date('2025-02-10') },
        { id: '5', lostReason: 'OTHER', lostAt: new Date('2025-02-15') },
      ];

      (prisma.lead.findMany as jest.Mock).mockResolvedValue(mockLostLeads);

      const response = await request(app)
        .get('/api/leads/lost-reason-stats');

      expect(response.status).toBe(200);
      expect(response.body.data.byMonth).toHaveLength(2);
      
      // January 2025
      expect(response.body.data.byMonth[0].month).toBe('2025-01');
      expect(response.body.data.byMonth[0].count).toBe(3);
      expect(response.body.data.byMonth[0].reasons.PRICE_ISSUE).toBe(2);
      expect(response.body.data.byMonth[0].reasons.COMPETITOR_SELECTED).toBe(1);
      
      // February 2025
      expect(response.body.data.byMonth[1].month).toBe('2025-02');
      expect(response.body.data.byMonth[1].count).toBe(2);
      expect(response.body.data.byMonth[1].reasons.BUDGET_PLANNING).toBe(1);
      expect(response.body.data.byMonth[1].reasons.OTHER).toBe(1);
    });

    /**
     * Validates: Requirement 2.7
     * 기간 필터 적용 - startDate
     */
    it('should filter by startDate', async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValue([]);

      await request(app)
        .get('/api/leads/lost-reason-stats')
        .query({ startDate: '2025-01-01' });

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lostAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    /**
     * Validates: Requirement 2.7
     * 기간 필터 적용 - endDate
     */
    it('should filter by endDate', async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValue([]);

      await request(app)
        .get('/api/leads/lost-reason-stats')
        .query({ endDate: '2025-12-31' });

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lostAt: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    /**
     * Validates: Requirement 2.7
     * 기간 필터 적용 - startDate와 endDate 모두
     */
    it('should filter by both startDate and endDate', async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValue([]);

      await request(app)
        .get('/api/leads/lost-reason-stats')
        .query({ startDate: '2025-01-01', endDate: '2025-12-31' });

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lostAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    /**
     * Validates: Requirement 2.7
     * userId 필터 적용
     */
    it('should filter by userId when provided', async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValue([]);

      await request(app)
        .get('/api/leads/lost-reason-stats')
        .query({ userId: 'specific-user-id' });

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'specific-user-id',
          }),
        })
      );
    });

    /**
     * Validates: Requirement 2.7
     * userId 미제공 시 현재 사용자 기준 조회
     */
    it('should use current user id when userId is not provided', async () => {
      (prisma.lead.findMany as jest.Mock).mockResolvedValue([]);

      await request(app)
        .get('/api/leads/lost-reason-stats');

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'test-user-id', // from mock auth middleware
          }),
        })
      );
    });

    /**
     * Validates: Requirement 2.7
     * 월별 데이터가 정렬되어 반환되는지 확인
     */
    it('should return byMonth data sorted chronologically', async () => {
      const mockLostLeads = [
        { id: '1', lostReason: 'PRICE_ISSUE', lostAt: new Date('2025-03-15') },
        { id: '2', lostReason: 'PRICE_ISSUE', lostAt: new Date('2025-01-20') },
        { id: '3', lostReason: 'COMPETITOR_SELECTED', lostAt: new Date('2025-02-25') },
      ];

      (prisma.lead.findMany as jest.Mock).mockResolvedValue(mockLostLeads);

      const response = await request(app)
        .get('/api/leads/lost-reason-stats');

      expect(response.status).toBe(200);
      expect(response.body.data.byMonth).toHaveLength(3);
      expect(response.body.data.byMonth[0].month).toBe('2025-01');
      expect(response.body.data.byMonth[1].month).toBe('2025-02');
      expect(response.body.data.byMonth[2].month).toBe('2025-03');
    });

    /**
     * Validates: Requirement 2.7
     * 응답 형식이 LostReasonStatsResponse 인터페이스와 일치하는지 확인
     */
    it('should return response matching LostReasonStatsResponse interface', async () => {
      const mockLostLeads = [
        { id: '1', lostReason: 'PRICE_ISSUE', lostAt: new Date('2025-01-15') },
      ];

      (prisma.lead.findMany as jest.Mock).mockResolvedValue(mockLostLeads);

      const response = await request(app)
        .get('/api/leads/lost-reason-stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalLost');
      expect(response.body.data).toHaveProperty('byReason');
      expect(response.body.data).toHaveProperty('byMonth');
      expect(typeof response.body.data.totalLost).toBe('number');
      expect(typeof response.body.data.byReason).toBe('object');
      expect(Array.isArray(response.body.data.byMonth)).toBe(true);
    });
  });
});
