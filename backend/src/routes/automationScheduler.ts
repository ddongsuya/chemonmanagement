// backend/src/routes/automationScheduler.ts
// 날짜 기반 자동화 트리거 스케줄러 API
// **Requirements: 2.3.4**

import { Router, Request, Response, NextFunction } from 'express';
import { AutomationService } from '../services/automationService';
import prisma from '../lib/prisma';
import { AutomationTriggerType, AutomationStatus } from '@prisma/client';

const router = Router();
const automationService = new AutomationService(prisma);

// API 키 인증 미들웨어
const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const expectedKey = process.env.AUTOMATION_API_KEY || process.env.BACKUP_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'API 키 환경변수가 설정되지 않았습니다' 
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

// 모델별 쿼리 함수
async function queryModelByDateField(
  model: string,
  field: string,
  targetDate: Date
): Promise<Array<{ id: string; [key: string]: any }>> {
  const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  
  const whereClause = {
    [field]: {
      gte: targetDate,
      lt: nextDay,
    },
  };

  switch (model) {
    case 'Lead':
      return prisma.lead.findMany({
        where: { ...whereClause, deletedAt: null },
        select: { id: true, [field]: true },
      });

    case 'Quotation':
      return prisma.quotation.findMany({
        where: { ...whereClause, deletedAt: null },
        select: { id: true, [field]: true },
      });

    case 'Contract':
      return prisma.contract.findMany({
        where: { ...whereClause, deletedAt: null },
        select: { id: true, [field]: true },
      });

    case 'Study':
      return prisma.study.findMany({
        where: whereClause,
        select: { id: true, [field]: true },
      });

    default:
      return [];
  }
}

/**
 * @swagger
 * /api/admin/automation/process-date-triggers:
 *   post:
 *     summary: 날짜 기반 트리거 처리
 *     description: 날짜 조건을 만족하는 자동화 규칙을 실행합니다
 *     tags: [Admin - Automation]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: 처리 완료
 *       401:
 *         description: API 키 인증 실패
 *       500:
 *         description: 처리 실패
 */
router.post('/process-date-triggers', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // DATE_REACHED 트리거 타입의 활성 규칙 조회
    const dateRules = await prisma.automationRule.findMany({
      where: {
        triggerType: AutomationTriggerType.DATE_REACHED,
        status: AutomationStatus.ACTIVE,
      },
      include: {
        actions: true,
      },
    });

    const results: Array<{
      ruleId: string;
      ruleName: string;
      matchedItems: number;
      executedActions: number;
      errors: string[];
    }> = [];

    for (const rule of dateRules) {
      const ruleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        matchedItems: 0,
        executedActions: 0,
        errors: [] as string[],
      };

      try {
        const triggerConfig = rule.triggerConfig as {
          model: string;
          field: string;
          daysBefore?: number;
        };

        if (!triggerConfig.model || !triggerConfig.field) {
          ruleResult.errors.push('트리거 설정이 올바르지 않습니다');
          results.push(ruleResult);
          continue;
        }

        const daysBefore = triggerConfig.daysBefore || 0;
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysBefore);

        // 모델별 날짜 조건 체크
        const matchedItems = await queryModelByDateField(
          triggerConfig.model,
          triggerConfig.field,
          targetDate
        );

        ruleResult.matchedItems = matchedItems.length;

        // 매칭된 항목에 대해 상태 변경 트리거 호출
        for (const item of matchedItems) {
          try {
            // handleStatusChange를 사용하여 액션 실행
            await automationService.handleStatusChange(
              triggerConfig.model,
              item.id,
              triggerConfig.field,
              null, // oldValue
              item[triggerConfig.field] // newValue (날짜)
            );
            ruleResult.executedActions++;
          } catch (actionError) {
            ruleResult.errors.push(
              `항목 ${item.id} 처리 실패: ${actionError instanceof Error ? actionError.message : 'Unknown error'}`
            );
          }
        }
      } catch (ruleError) {
        ruleResult.errors.push(
          `규칙 처리 실패: ${ruleError instanceof Error ? ruleError.message : 'Unknown error'}`
        );
      }

      results.push(ruleResult);
    }

    const totalMatched = results.reduce((sum, r) => sum + r.matchedItems, 0);
    const totalExecuted = results.reduce((sum, r) => sum + r.executedActions, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    res.json({
      success: true,
      message: `${dateRules.length}개 규칙 처리 완료`,
      summary: {
        rulesProcessed: dateRules.length,
        totalMatchedItems: totalMatched,
        totalExecutedActions: totalExecuted,
        totalErrors,
      },
      results,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Date trigger processing failed:', error);
    res.status(500).json({
      success: false,
      error: '날짜 트리거 처리에 실패했습니다',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/admin/automation/status:
 *   get:
 *     summary: 자동화 상태 조회
 *     description: 자동화 규칙 및 실행 통계 조회
 *     tags: [Admin - Automation]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: 자동화 상태 정보
 *       401:
 *         description: API 키 인증 실패
 */
router.get('/status', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    // 규칙 통계
    const totalRules = await prisma.automationRule.count();
    const activeRules = await prisma.automationRule.count({
      where: { status: AutomationStatus.ACTIVE },
    });

    // 트리거 타입별 규칙 수
    const rulesByTrigger = await prisma.automationRule.groupBy({
      by: ['triggerType'],
      _count: true,
    });

    // 최근 실행 통계 (24시간)
    const recentExecutions = await prisma.automationExecution.count({
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const successfulExecutions = await prisma.automationExecution.count({
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        status: 'SUCCESS',
      },
    });

    res.json({
      success: true,
      status: {
        rules: {
          total: totalRules,
          active: activeRules,
          inactive: totalRules - activeRules,
          byTriggerType: rulesByTrigger.reduce((acc, item) => {
            acc[item.triggerType] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
        executions: {
          last24Hours: recentExecutions,
          successful: successfulExecutions,
          failed: recentExecutions - successfulExecutions,
          successRate: recentExecutions > 0 
            ? Math.round((successfulExecutions / recentExecutions) * 100) 
            : 100,
        },
      },
    });
  } catch (error) {
    console.error('Automation status check failed:', error);
    res.status(500).json({
      success: false,
      error: '자동화 상태 조회에 실패했습니다',
    });
  }
});

export default router;
