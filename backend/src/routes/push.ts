import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, activityLogger } from '../middleware';
import { z } from 'zod';
import { PushService } from '../services/pushService';

const router = Router();
const pushService = new PushService(prisma);

// 푸시 구독 등록 스키마
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/**
 * GET /api/push/vapid-public-key
 * VAPID 공개 키 조회 (구독 시 필요)
 */
router.get(
  '/vapid-public-key',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const publicKey = pushService.getVapidPublicKey();
      const isConfigured = pushService.isConfigured();

      res.json({
        success: true,
        data: {
          publicKey,
          isConfigured,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/push/subscribe
 * 푸시 알림 구독 등록
 */
router.post(
  '/subscribe',
  authenticate,
  activityLogger('PUSH_SUBSCRIBE', 'push'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const validation = subscribeSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: '잘못된 구독 정보입니다.',
          details: validation.error.errors,
        });
      }

      const { endpoint, keys } = validation.data;

      // 기존 구독이 있으면 업데이트, 없으면 생성
      const subscription = await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: {
          userId,
          p256dh: keys.p256dh,
          auth: keys.auth,
          updatedAt: new Date(),
        },
        create: {
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });

      res.json({
        success: true,
        data: {
          id: subscription.id,
          endpoint: subscription.endpoint,
          createdAt: subscription.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/push/unsubscribe
 * 푸시 알림 구독 해제
 */
router.delete(
  '/unsubscribe',
  authenticate,
  activityLogger('PUSH_UNSUBSCRIBE', 'push'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({
          success: false,
          error: 'endpoint가 필요합니다.',
        });
      }

      // 해당 사용자의 구독만 삭제
      const deleted = await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint,
        },
      });

      if (deleted.count === 0) {
        return res.status(404).json({
          success: false,
          error: '구독 정보를 찾을 수 없습니다.',
        });
      }

      res.json({
        success: true,
        message: '푸시 알림 구독이 해제되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/push/status
 * 현재 사용자의 푸시 구독 상태 조회
 */
router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
        select: {
          id: true,
          endpoint: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          isSubscribed: subscriptions.length > 0,
          subscriptionCount: subscriptions.length,
          subscriptions,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
