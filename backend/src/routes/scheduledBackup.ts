// backend/src/routes/scheduledBackup.ts
// 스케줄된 백업 API 엔드포인트
// **Requirements: 1.1.1, 1.1.3, 1.1.4**

import { Router, Request, Response, NextFunction } from 'express';
import { BackupService } from '../services/backupService';
import { NotificationService } from '../services/notificationService';
import prisma from '../lib/prisma';

const router = Router();
const backupService = new BackupService(prisma);
const notificationService = new NotificationService(prisma);

// API 키 인증 미들웨어
const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const expectedKey = process.env.BACKUP_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'BACKUP_API_KEY 환경변수가 설정되지 않았습니다' 
    });
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({ 
      success: false, 
      error: '유효하지 않은 API 키입니다' 
    });
  }

  next();
};

/**
 * Send backup notification to all admin users
 * **Requirements: 1.1.3**
 */
async function sendBackupNotification(
  success: boolean,
  backupInfo?: { id: string; size: string; createdAt: Date },
  errorMessage?: string
): Promise<void> {
  try {
    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (adminUsers.length === 0) {
      console.log('No admin users found for backup notification');
      return;
    }

    const adminUserIds = adminUsers.map(u => u.id);

    if (success && backupInfo) {
      // Send success notification
      await notificationService.createBulk({
        userIds: adminUserIds,
        type: 'SYSTEM',
        title: '자동 백업 완료',
        message: `자동 백업이 성공적으로 완료되었습니다. (크기: ${formatBytes(parseInt(backupInfo.size))})`,
        link: '/admin/backups',
      });
    } else {
      // Send failure notification
      await notificationService.createBulk({
        userIds: adminUserIds,
        type: 'SYSTEM',
        title: '자동 백업 실패',
        message: `자동 백업에 실패했습니다. ${errorMessage || '관리자에게 문의하세요.'}`,
        link: '/admin/backups',
      });
    }
  } catch (error) {
    console.error('Failed to send backup notification:', error);
    // Don't throw - notification failure shouldn't fail the backup process
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * @swagger
 * /api/admin/backups/scheduled:
 *   post:
 *     summary: 스케줄된 자동 백업 실행
 *     description: GitHub Actions 등 외부 스케줄러에서 호출하는 자동 백업 API
 *     tags: [Admin - Backup]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: 백업 생성 성공
 *       401:
 *         description: API 키 인증 실패
 *       500:
 *         description: 백업 생성 실패
 */
router.post('/scheduled', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const backup = await backupService.create();

    // Send success notification to admins (Requirements: 1.1.3)
    await sendBackupNotification(true, {
      id: backup.id,
      size: backup.size,
      createdAt: backup.createdAt,
    });

    res.json({
      success: true,
      message: '자동 백업이 생성되었습니다',
      backup: {
        id: backup.id,
        createdAt: backup.createdAt,
        size: backup.size,
        status: backup.status,
      },
    });
  } catch (error) {
    console.error('Scheduled backup failed:', error);
    
    // Send failure notification to admins (Requirements: 1.1.3)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await sendBackupNotification(false, undefined, errorMessage);

    res.status(500).json({
      success: false,
      error: '자동 백업 생성에 실패했습니다',
      details: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/admin/backups/cleanup:
 *   post:
 *     summary: 오래된 백업 정리
 *     description: 보존 기간이 지난 백업을 삭제합니다 (기본 7일)
 *     tags: [Admin - Backup]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: retentionDays
 *         schema:
 *           type: integer
 *           default: 7
 *         description: 백업 보존 기간 (일)
 *     responses:
 *       200:
 *         description: 정리 완료
 *       401:
 *         description: API 키 인증 실패
 *       500:
 *         description: 정리 실패
 */
router.post('/cleanup', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const retentionDays = parseInt(req.query.retentionDays as string) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // 오래된 백업 조회
    const oldBackups = await prisma.backup.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // 자동 백업만 정리 (수동 백업은 유지)
        type: 'AUTO',
      },
      select: {
        id: true,
        createdAt: true,
        filename: true,
      },
    });

    // 백업 삭제
    const deletedCount = await prisma.backup.deleteMany({
      where: {
        id: {
          in: oldBackups.map(b => b.id),
        },
      },
    });

    res.json({
      success: true,
      message: `${deletedCount.count}개의 오래된 백업이 삭제되었습니다`,
      deletedBackups: oldBackups.map(b => ({
        id: b.id,
        createdAt: b.createdAt,
        filename: b.filename,
      })),
      retentionDays,
      cutoffDate,
    });
  } catch (error) {
    console.error('Backup cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: '백업 정리에 실패했습니다',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/admin/backups/status:
 *   get:
 *     summary: 백업 상태 조회
 *     description: 최근 백업 상태 및 통계 조회
 *     tags: [Admin - Backup]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: 백업 상태 정보
 *       401:
 *         description: API 키 인증 실패
 */
router.get('/status', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    // 최근 백업 조회
    const latestBackup = await prisma.backup.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        size: true,
        status: true,
        filename: true,
      },
    });

    // 백업 통계
    const totalBackups = await prisma.backup.count();
    const last7DaysBackups = await prisma.backup.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // 총 백업 크기
    const totalSize = await prisma.backup.aggregate({
      _sum: {
        size: true,
      },
    });

    const totalSizeNum = totalSize._sum.size ? Number(totalSize._sum.size) : 0;

    res.json({
      success: true,
      status: {
        latestBackup: latestBackup ? {
          ...latestBackup,
          size: Number(latestBackup.size),
        } : null,
        totalBackups,
        last7DaysBackups,
        totalSizeBytes: totalSizeNum,
        totalSizeMB: Math.round(totalSizeNum / 1024 / 1024 * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Backup status check failed:', error);
    res.status(500).json({
      success: false,
      error: '백업 상태 조회에 실패했습니다',
    });
  }
});

export default router;
