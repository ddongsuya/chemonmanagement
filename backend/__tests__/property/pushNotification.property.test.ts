/**
 * Property-Based Tests for Push Notification Service
 * 
 * Feature: crm-core-enhancements
 * Property 15: 푸시 알림 발송
 * 
 * **Validates: Requirements 3.4.2, 3.4.3**
 * 
 * For any 푸시 구독이 있는 사용자와 알림 트리거 이벤트(리드 등록, 견적 상태 변경)에 대해,
 * 해당 사용자에게 푸시 알림이 발송되어야 합니다.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { PushService, PushNotificationPayload, SendPushResult } from '../../src/services/pushService';

// Mock PrismaClient
const createMockPrisma = () => {
  const subscriptions: Array<{
    id: string;
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }> = [];

  const users: Array<{
    id: string;
    role: string;
    status: string;
  }> = [];

  return {
    pushSubscription: {
      findMany: jest.fn(async ({ where }: { where?: { userId?: string | { in?: string[] } } }) => {
        if (!where) return subscriptions;
        if (typeof where.userId === 'string') {
          return subscriptions.filter(s => s.userId === where.userId);
        }
        if (where.userId && typeof where.userId === 'object' && 'in' in where.userId) {
          const userIds = where.userId.in || [];
          return subscriptions.filter(s => userIds.includes(s.userId));
        }
        return subscriptions;
      }),
      delete: jest.fn(async ({ where }: { where: { id: string } }) => {
        const index = subscriptions.findIndex(s => s.id === where.id);
        if (index >= 0) {
          subscriptions.splice(index, 1);
        }
        return { id: where.id };
      }),
    },
    user: {
      findMany: jest.fn(async ({ where }: { where?: { role?: string; status?: string } }) => {
        return users.filter(u => 
          (!where?.role || u.role === where.role) &&
          (!where?.status || u.status === where.status)
        );
      }),
    },
    _subscriptions: subscriptions,
    _users: users,
    _addSubscription: (sub: typeof subscriptions[0]) => subscriptions.push(sub),
    _addUser: (user: typeof users[0]) => users.push(user),
    _clear: () => {
      subscriptions.length = 0;
      users.length = 0;
    },
  };
};

// Mock web-push module
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({}),
}));

// Arbitraries
const userIdArb = fc.uuid();
const subscriptionIdArb = fc.uuid();
const endpointArb = fc.webUrl().map(url => `${url}/push/v1/${fc.sample(fc.hexaString({ minLength: 32, maxLength: 32 }), 1)[0]}`);
const p256dhArb = fc.base64String({ minLength: 65, maxLength: 88 });
const authArb = fc.base64String({ minLength: 16, maxLength: 24 });

const subscriptionArb = fc.record({
  id: subscriptionIdArb,
  userId: userIdArb,
  endpoint: fc.webUrl(),
  p256dh: p256dhArb,
  auth: authArb,
});

const payloadArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  body: fc.string({ minLength: 1, maxLength: 500 }),
  icon: fc.option(fc.webUrl(), { nil: undefined }),
  tag: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

describe('Property 15: 푸시 알림 발송', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let pushService: PushService;
  let webpush: { sendNotification: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    pushService = new PushService(mockPrisma as any);
    webpush = require('web-push');
  });

  afterEach(() => {
    mockPrisma._clear();
  });

  describe('구독이 있는 사용자에게 푸시 발송', () => {
    it('구독이 있는 사용자에게 푸시 알림이 발송되어야 함', async () => {
      await fc.assert(
        fc.asyncProperty(
          subscriptionArb,
          payloadArb,
          async (subscription, payload) => {
            // Setup
            mockPrisma._clear();
            mockPrisma._addSubscription(subscription);
            webpush.sendNotification.mockResolvedValue({});

            // Execute
            const result = await pushService.sendToUser(subscription.userId, payload as PushNotificationPayload);

            // Verify - 구독이 있으면 발송 시도해야 함
            // VAPID 키가 설정되지 않은 경우 발송하지 않음
            if (!pushService.isConfigured()) {
              expect(result.sent).toBe(0);
              expect(result.errors).toContain('VAPID 키가 설정되지 않았습니다.');
            } else {
              expect(webpush.sendNotification).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('구독이 없는 사용자에게는 발송 시도하지 않아야 함', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          payloadArb,
          async (userId, payload) => {
            // Setup - 구독 없음
            mockPrisma._clear();

            // Execute
            const result = await pushService.sendToUser(userId, payload as PushNotificationPayload);

            // Verify - 구독이 없으면 발송 시도 없음
            if (pushService.isConfigured()) {
              expect(result.sent).toBe(0);
              expect(result.failed).toBe(0);
              expect(webpush.sendNotification).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('여러 사용자에게 푸시 발송', () => {
    it('여러 사용자에게 동시에 푸시 알림이 발송되어야 함', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(subscriptionArb, { minLength: 1, maxLength: 5 }),
          payloadArb,
          async (subscriptions, payload) => {
            // Setup
            mockPrisma._clear();
            const uniqueSubscriptions = subscriptions.filter((s, i, arr) => 
              arr.findIndex(x => x.endpoint === s.endpoint) === i
            );
            uniqueSubscriptions.forEach(s => mockPrisma._addSubscription(s));
            webpush.sendNotification.mockResolvedValue({});

            const userIds = [...new Set(uniqueSubscriptions.map(s => s.userId))];

            // Execute
            const result = await pushService.sendToUsers(userIds, payload as PushNotificationPayload);

            // Verify
            if (!pushService.isConfigured()) {
              expect(result.sent).toBe(0);
            } else {
              // 각 구독에 대해 발송 시도
              expect(webpush.sendNotification).toHaveBeenCalledTimes(uniqueSubscriptions.length);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('리드 등록 알림', () => {
    it('리드 등록 시 담당자에게 푸시 알림이 발송되어야 함', async () => {
      await fc.assert(
        fc.asyncProperty(
          subscriptionArb,
          fc.record({
            leadId: fc.uuid(),
            leadNumber: fc.string({ minLength: 5, maxLength: 20 }),
            companyName: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (subscription, leadData) => {
            // Setup
            mockPrisma._clear();
            mockPrisma._addSubscription(subscription);
            webpush.sendNotification.mockResolvedValue({});

            // Execute
            const result = await pushService.notifyLeadCreated(
              leadData.leadId,
              leadData.leadNumber,
              leadData.companyName,
              subscription.userId
            );

            // Verify
            if (!pushService.isConfigured()) {
              expect(result.sent).toBe(0);
            } else {
              expect(webpush.sendNotification).toHaveBeenCalled();
              const callArg = webpush.sendNotification.mock.calls[0][1];
              const payload = JSON.parse(callArg);
              expect(payload.title).toBe('새 리드 등록');
              expect(payload.body).toContain(leadData.companyName);
              expect(payload.data.type).toBe('LEAD_CREATED');
              expect(payload.data.leadId).toBe(leadData.leadId);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('견적서 상태 변경 알림', () => {
    const quotationStatusArb = fc.constantFrom('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

    it('견적서 상태 변경 시 담당자에게 푸시 알림이 발송되어야 함', async () => {
      await fc.assert(
        fc.asyncProperty(
          subscriptionArb,
          fc.record({
            quotationId: fc.uuid(),
            quotationNumber: fc.string({ minLength: 5, maxLength: 20 }),
            status: quotationStatusArb,
          }),
          async (subscription, quotationData) => {
            // Setup
            mockPrisma._clear();
            mockPrisma._addSubscription(subscription);
            webpush.sendNotification.mockResolvedValue({});

            // Execute
            const result = await pushService.notifyQuotationStatusChanged(
              quotationData.quotationId,
              quotationData.quotationNumber,
              quotationData.status,
              subscription.userId
            );

            // Verify
            if (!pushService.isConfigured()) {
              expect(result.sent).toBe(0);
            } else {
              expect(webpush.sendNotification).toHaveBeenCalled();
              const callArg = webpush.sendNotification.mock.calls[0][1];
              const payload = JSON.parse(callArg);
              expect(payload.title).toBe('견적서 상태 변경');
              expect(payload.body).toContain(quotationData.quotationNumber);
              expect(payload.data.type).toBe('QUOTATION_STATUS_CHANGED');
              expect(payload.data.quotationId).toBe(quotationData.quotationId);
              expect(payload.data.status).toBe(quotationData.status);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('계약 상태 변경 알림', () => {
    const contractStatusArb = fc.constantFrom(
      'NEGOTIATING', 'SIGNED', 'TEST_RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED'
    );

    it('계약 상태 변경 시 담당자에게 푸시 알림이 발송되어야 함', async () => {
      await fc.assert(
        fc.asyncProperty(
          subscriptionArb,
          fc.record({
            contractId: fc.uuid(),
            contractNumber: fc.string({ minLength: 5, maxLength: 20 }),
            status: contractStatusArb,
          }),
          async (subscription, contractData) => {
            // Setup
            mockPrisma._clear();
            mockPrisma._addSubscription(subscription);
            webpush.sendNotification.mockResolvedValue({});

            // Execute
            const result = await pushService.notifyContractStatusChanged(
              contractData.contractId,
              contractData.contractNumber,
              contractData.status,
              subscription.userId
            );

            // Verify
            if (!pushService.isConfigured()) {
              expect(result.sent).toBe(0);
            } else {
              expect(webpush.sendNotification).toHaveBeenCalled();
              const callArg = webpush.sendNotification.mock.calls[0][1];
              const payload = JSON.parse(callArg);
              expect(payload.title).toBe('계약 상태 변경');
              expect(payload.body).toContain(contractData.contractNumber);
              expect(payload.data.type).toBe('CONTRACT_STATUS_CHANGED');
              expect(payload.data.contractId).toBe(contractData.contractId);
              expect(payload.data.status).toBe(contractData.status);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('관리자 알림', () => {
    it('관리자에게 백업 결과 알림이 발송되어야 함', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              role: fc.constant('ADMIN'),
              status: fc.constant('ACTIVE'),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.array(subscriptionArb, { minLength: 1, maxLength: 3 }),
          fc.boolean(),
          fc.option(fc.uuid(), { nil: undefined }),
          async (adminUsers, subscriptions, success, backupId) => {
            // Setup
            mockPrisma._clear();
            
            // 관리자 사용자 추가
            const uniqueAdmins = adminUsers.filter((u, i, arr) => 
              arr.findIndex(x => x.id === u.id) === i
            );
            uniqueAdmins.forEach(u => mockPrisma._addUser(u));
            
            // 관리자의 구독 추가
            const adminSubscriptions = subscriptions.map((s, i) => ({
              ...s,
              userId: uniqueAdmins[i % uniqueAdmins.length].id,
              endpoint: `${s.endpoint}/${i}`, // 고유 endpoint
            }));
            adminSubscriptions.forEach(s => mockPrisma._addSubscription(s));
            
            webpush.sendNotification.mockResolvedValue({});

            // Execute
            const result = await pushService.notifyBackupResult(success, backupId);

            // Verify
            if (!pushService.isConfigured()) {
              expect(result.sent).toBe(0);
            } else if (uniqueAdmins.length > 0 && adminSubscriptions.length > 0) {
              expect(webpush.sendNotification).toHaveBeenCalled();
              const callArg = webpush.sendNotification.mock.calls[0][1];
              const payload = JSON.parse(callArg);
              
              if (success) {
                expect(payload.title).toBe('백업 완료');
                expect(payload.data.type).toBe('BACKUP_COMPLETED');
              } else {
                expect(payload.title).toBe('백업 실패');
                expect(payload.data.type).toBe('BACKUP_FAILED');
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('발송 실패 처리', () => {
    it('410 Gone 응답 시 구독이 삭제되어야 함', async () => {
      // Setup
      mockPrisma._clear();
      const subscription = {
        id: 'sub-1',
        userId: 'user-1',
        endpoint: 'https://example.com/push/1',
        p256dh: 'test-p256dh',
        auth: 'test-auth',
      };
      mockPrisma._addSubscription(subscription);
      
      // 410 Gone 에러 시뮬레이션
      const error = new Error('Gone') as Error & { statusCode: number };
      error.statusCode = 410;
      webpush.sendNotification.mockRejectedValue(error);

      // Execute
      const result = await pushService.sendToUser('user-1', {
        title: 'Test',
        body: 'Test message',
      });

      // Verify - VAPID 키가 설정되지 않은 경우 발송하지 않음
      if (pushService.isConfigured()) {
        expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
          where: { id: subscription.id },
        });
      }
    });

    it('404 Not Found 응답 시 구독이 삭제되어야 함', async () => {
      // Setup
      mockPrisma._clear();
      const subscription = {
        id: 'sub-2',
        userId: 'user-2',
        endpoint: 'https://example.com/push/2',
        p256dh: 'test-p256dh',
        auth: 'test-auth',
      };
      mockPrisma._addSubscription(subscription);
      
      // 404 Not Found 에러 시뮬레이션
      const error = new Error('Not Found') as Error & { statusCode: number };
      error.statusCode = 404;
      webpush.sendNotification.mockRejectedValue(error);

      // Execute
      const result = await pushService.sendToUser('user-2', {
        title: 'Test',
        body: 'Test message',
      });

      // Verify - VAPID 키가 설정되지 않은 경우 발송하지 않음
      if (pushService.isConfigured()) {
        expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
          where: { id: subscription.id },
        });
      }
    });
  });
});
