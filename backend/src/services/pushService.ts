import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

// VAPID 키 설정 (환경변수에서 가져오거나 기본값 사용)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@chemon.co.kr';

// VAPID 키가 설정되어 있으면 web-push 설정
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface SendPushResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

export class PushService {
  constructor(private prisma: PrismaClient) {}

  /**
   * VAPID 공개 키 반환 (프론트엔드에서 구독 시 필요)
   */
  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * VAPID 키가 설정되어 있는지 확인
   */
  isConfigured(): boolean {
    return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
  }

  /**
   * 특정 사용자에게 푸시 알림 발송
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<SendPushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['VAPID 키가 설정되지 않았습니다.'],
      };
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return {
        success: true,
        sent: 0,
        failed: 0,
        errors: [],
      };
    }

    return this.sendToSubscriptions(subscriptions, payload);
  }

  /**
   * 여러 사용자에게 푸시 알림 발송
   */
  async sendToUsers(
    userIds: string[],
    payload: PushNotificationPayload
  ): Promise<SendPushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['VAPID 키가 설정되지 않았습니다.'],
      };
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });

    if (subscriptions.length === 0) {
      return {
        success: true,
        sent: 0,
        failed: 0,
        errors: [],
      };
    }

    return this.sendToSubscriptions(subscriptions, payload);
  }

  /**
   * 모든 관리자에게 푸시 알림 발송
   */
  async sendToAdmins(payload: PushNotificationPayload): Promise<SendPushResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ['VAPID 키가 설정되지 않았습니다.'],
      };
    }

    const adminUsers = await this.prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    const adminIds = adminUsers.map((u) => u.id);

    if (adminIds.length === 0) {
      return {
        success: true,
        sent: 0,
        failed: 0,
        errors: [],
      };
    }

    return this.sendToUsers(adminIds, payload);
  }

  /**
   * 구독 목록에 푸시 알림 발송
   */
  private async sendToSubscriptions(
    subscriptions: Array<{
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    }>,
    payload: PushNotificationPayload
  ): Promise<SendPushResult> {
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        this.sendPush(sub, payload).catch(async (error) => {
          // 410 Gone 또는 404 Not Found인 경우 구독 삭제
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(() => {});
          }
          throw error;
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason?.message || '알 수 없는 오류');

    return {
      success: failed === 0,
      sent,
      failed,
      errors,
    };
  }

  /**
   * 단일 구독에 푸시 발송
   */
  private async sendPush(
    subscription: {
      endpoint: string;
      p256dh: string;
      auth: string;
    },
    payload: PushNotificationPayload
  ): Promise<void> {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24시간
      }
    );
  }

  // ==================== 이벤트 기반 푸시 알림 ====================

  /**
   * 리드 등록 시 담당자에게 푸시 알림
   */
  async notifyLeadCreated(
    leadId: string,
    leadNumber: string,
    companyName: string,
    assignedUserId: string
  ): Promise<SendPushResult> {
    return this.sendToUser(assignedUserId, {
      title: '새 리드 등록',
      body: `${companyName} (${leadNumber})`,
      icon: '/icons/icon-192.png',
      tag: `lead-${leadId}`,
      data: {
        type: 'LEAD_CREATED',
        leadId,
        url: `/leads/${leadId}`,
      },
    });
  }

  /**
   * 견적서 상태 변경 시 담당자에게 푸시 알림
   */
  async notifyQuotationStatusChanged(
    quotationId: string,
    quotationNumber: string,
    newStatus: string,
    assignedUserId: string
  ): Promise<SendPushResult> {
    const statusLabels: Record<string, string> = {
      DRAFT: '작성중',
      SENT: '발송완료',
      ACCEPTED: '승인됨',
      REJECTED: '거절됨',
      EXPIRED: '만료됨',
    };

    return this.sendToUser(assignedUserId, {
      title: '견적서 상태 변경',
      body: `${quotationNumber}: ${statusLabels[newStatus] || newStatus}`,
      icon: '/icons/icon-192.png',
      tag: `quotation-${quotationId}`,
      data: {
        type: 'QUOTATION_STATUS_CHANGED',
        quotationId,
        status: newStatus,
        url: `/quotations/${quotationId}`,
      },
    });
  }

  /**
   * 계약 상태 변경 시 담당자에게 푸시 알림
   */
  async notifyContractStatusChanged(
    contractId: string,
    contractNumber: string,
    newStatus: string,
    assignedUserId: string
  ): Promise<SendPushResult> {
    const statusLabels: Record<string, string> = {
      NEGOTIATING: '협의중',
      SIGNED: '체결',
      TEST_RECEIVED: '시험접수',
      IN_PROGRESS: '진행중',
      COMPLETED: '완료',
      TERMINATED: '해지',
    };

    return this.sendToUser(assignedUserId, {
      title: '계약 상태 변경',
      body: `${contractNumber}: ${statusLabels[newStatus] || newStatus}`,
      icon: '/icons/icon-192.png',
      tag: `contract-${contractId}`,
      data: {
        type: 'CONTRACT_STATUS_CHANGED',
        contractId,
        status: newStatus,
        url: `/contracts/${contractId}`,
      },
    });
  }

  /**
   * 백업 완료/실패 시 관리자에게 푸시 알림
   */
  async notifyBackupResult(
    success: boolean,
    backupId?: string,
    error?: string
  ): Promise<SendPushResult> {
    if (success) {
      return this.sendToAdmins({
        title: '백업 완료',
        body: '자동 백업이 성공적으로 완료되었습니다.',
        icon: '/icons/icon-192.png',
        tag: `backup-${backupId}`,
        data: {
          type: 'BACKUP_COMPLETED',
          backupId,
          url: '/admin/backups',
        },
      });
    } else {
      return this.sendToAdmins({
        title: '백업 실패',
        body: error || '자동 백업 중 오류가 발생했습니다.',
        icon: '/icons/icon-192.png',
        tag: 'backup-failed',
        data: {
          type: 'BACKUP_FAILED',
          error,
          url: '/admin/backups',
        },
      });
    }
  }
}
