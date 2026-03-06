/**
 * Lifecycle Service
 * 
 * 고객 라이프사이클 전환 관리
 */

import { PrismaClient, CustomerGrade } from '@prisma/client';

const prisma = new PrismaClient();

// 단계 정체 기본 기간 (일)
const STAGNATION_THRESHOLDS: Partial<Record<CustomerGrade, number>> = {
  LEAD: 30,
  PROSPECT: 60,
};

/**
 * 라이프사이클 전환 기록
 */
export async function recordTransition(params: {
  customerId: string;
  fromStage: string;
  toStage: string;
  reason?: string;
  isAutomatic?: boolean;
  triggeredBy: string;
}) {
  return prisma.lifecycleTransition.create({
    data: {
      customerId: params.customerId,
      fromStage: params.fromStage,
      toStage: params.toStage,
      reason: params.reason,
      isAutomatic: params.isAutomatic || false,
      triggeredBy: params.triggeredBy,
    },
  });
}

/**
 * 고객 라이프사이클 전환 이력 조회
 */
export async function getTransitionHistory(customerId: string) {
  return prisma.lifecycleTransition.findMany({
    where: { customerId },
    orderBy: { transitionAt: 'asc' },
  });
}

/**
 * 단계별 평균 체류 기간 계산
 */
export async function getAverageStageDuration() {
  const transitions = await prisma.lifecycleTransition.findMany({
    orderBy: { transitionAt: 'asc' },
  });

  // 고객별로 그룹핑
  const byCustomer = new Map<string, typeof transitions>();
  for (const t of transitions) {
    const list = byCustomer.get(t.customerId) || [];
    list.push(t);
    byCustomer.set(t.customerId, list);
  }

  const stageDurations: Record<string, number[]> = {};

  for (const [, customerTransitions] of byCustomer) {
    for (let i = 0; i < customerTransitions.length; i++) {
      const current = customerTransitions[i];
      const next = customerTransitions[i + 1];
      if (next) {
        const days = Math.floor(
          (next.transitionAt.getTime() - current.transitionAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (!stageDurations[current.toStage]) stageDurations[current.toStage] = [];
        stageDurations[current.toStage].push(days);
      }
    }
  }

  const result: Record<string, { averageDays: number; count: number }> = {};
  for (const [stage, durations] of Object.entries(stageDurations)) {
    result[stage] = {
      averageDays: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      count: durations.length,
    };
  }

  return result;
}

/**
 * 단계 간 전환율 계산 (최근 6개월)
 */
export async function getConversionRates() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transitions = await prisma.lifecycleTransition.findMany({
    where: { transitionAt: { gte: sixMonthsAgo } },
  });

  const transitionCounts: Record<string, number> = {};
  const stageCounts: Record<string, number> = {};

  for (const t of transitions) {
    const key = `${t.fromStage}->${t.toStage}`;
    transitionCounts[key] = (transitionCounts[key] || 0) + 1;
    stageCounts[t.fromStage] = (stageCounts[t.fromStage] || 0) + 1;
  }

  const rates: Record<string, { count: number; total: number; rate: number }> = {};
  for (const [key, count] of Object.entries(transitionCounts)) {
    const fromStage = key.split('->')[0];
    const total = stageCounts[fromStage] || 1;
    rates[key] = { count, total, rate: Math.round((count / total) * 100) };
  }

  return rates;
}

/**
 * 자동 전환 조건 평가
 */
export async function evaluateAutoTransition(customerId: string): Promise<{
  shouldTransition: boolean;
  suggestedStage?: CustomerGrade;
  reason?: string;
} | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      contracts: { where: { deletedAt: null } },
      quotations: { where: { deletedAt: null } },
    },
  });

  if (!customer) return null;

  // 첫 계약 체결 시 PROSPECT → CUSTOMER
  if (customer.grade === 'PROSPECT') {
    const hasSignedContract = customer.contracts.some(
      (c) => c.status === 'SIGNED' || c.status === 'IN_PROGRESS'
    );
    if (hasSignedContract) {
      return {
        shouldTransition: true,
        suggestedStage: 'CUSTOMER',
        reason: '첫 계약 체결로 인한 자동 전환 제안',
      };
    }
  }

  // 총 거래액 기준 CUSTOMER → VIP (5천만원 이상)
  if (customer.grade === 'CUSTOMER') {
    const totalAmount = customer.quotations.reduce(
      (sum, q) => sum + Number(q.totalAmount || 0), 0
    );
    if (totalAmount >= 50000000) {
      return {
        shouldTransition: true,
        suggestedStage: 'VIP',
        reason: `총 거래액 ${totalAmount.toLocaleString()}원으로 VIP 전환 제안`,
      };
    }
  }

  return { shouldTransition: false };
}

/**
 * 단계 정체 고객 감지
 */
export async function detectStagnantCustomers(): Promise<
  { customerId: string; grade: CustomerGrade; daysSinceLastTransition: number; threshold: number }[]
> {
  const results: { customerId: string; grade: CustomerGrade; daysSinceLastTransition: number; threshold: number }[] = [];

  for (const [grade, threshold] of Object.entries(STAGNATION_THRESHOLDS)) {
    if (!threshold) continue;

    const customers = await prisma.customer.findMany({
      where: { grade: grade as CustomerGrade, deletedAt: null },
      select: { id: true, grade: true, updatedAt: true },
    });

    for (const customer of customers) {
      const lastTransition = await prisma.lifecycleTransition.findFirst({
        where: { customerId: customer.id },
        orderBy: { transitionAt: 'desc' },
        select: { transitionAt: true },
      });

      const referenceDate = lastTransition?.transitionAt || customer.updatedAt;
      const daysSince = Math.floor(
        (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince >= threshold) {
        results.push({
          customerId: customer.id,
          grade: customer.grade,
          daysSinceLastTransition: daysSince,
          threshold,
        });
      }
    }
  }

  return results;
}

/**
 * 파이프라인 속도 (평균 리드→고객 전환 소요일)
 */
export async function getPipelineVelocity(): Promise<number | null> {
  const conversions = await prisma.lifecycleTransition.findMany({
    where: { toStage: 'CUSTOMER' },
    select: { customerId: true, transitionAt: true },
  });

  if (conversions.length === 0) return null;

  const durations: number[] = [];
  for (const conv of conversions) {
    const firstTransition = await prisma.lifecycleTransition.findFirst({
      where: { customerId: conv.customerId },
      orderBy: { transitionAt: 'asc' },
      select: { transitionAt: true },
    });

    if (firstTransition) {
      const days = Math.floor(
        (conv.transitionAt.getTime() - firstTransition.transitionAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      durations.push(days);
    }
  }

  if (durations.length === 0) return null;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

/**
 * 자동 단계 전환 실행 (승인 후 호출)
 */
export async function executeAutoTransition(
  customerId: string,
  toStage: CustomerGrade,
  reason: string,
  triggeredBy: string
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { grade: true },
  });
  if (!customer) return null;

  const fromStage = customer.grade;

  // 고객 등급 업데이트
  await prisma.customer.update({
    where: { id: customerId },
    data: { grade: toStage },
  });

  // 전환 이력 기록
  const transition = await recordTransition({
    customerId,
    fromStage,
    toStage,
    reason,
    isAutomatic: true,
    triggeredBy,
  });

  return { fromStage, toStage, transition };
}

/**
 * 전체 고객 자동 전환 평가 및 제안 목록 반환
 */
export async function evaluateAllAutoTransitions(): Promise<
  { customerId: string; company: string | null; currentGrade: CustomerGrade; suggestedStage: CustomerGrade; reason: string }[]
> {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, grade: { in: ['PROSPECT', 'CUSTOMER'] } },
    select: { id: true, company: true, grade: true },
  });

  const suggestions: { customerId: string; company: string | null; currentGrade: CustomerGrade; suggestedStage: CustomerGrade; reason: string }[] = [];

  for (const cust of customers) {
    const result = await evaluateAutoTransition(cust.id);
    if (result?.shouldTransition && result.suggestedStage && result.reason) {
      suggestions.push({
        customerId: cust.id,
        company: cust.company,
        currentGrade: cust.grade,
        suggestedStage: result.suggestedStage,
        reason: result.reason,
      });
    }
  }

  return suggestions;
}

/**
 * 주간 요약 리포트 데이터 생성
 */
export async function generateWeeklySummary(): Promise<{
  period: { from: string; to: string };
  newCustomers: number;
  churnRiskCount: number;
  expiringContracts: number;
  overduePayments: { count: number; totalAmount: number };
  stagnantCustomers: number;
  transitionSuggestions: number;
  topMetrics: {
    totalActive: number;
    averageHealthScore: number;
    conversionRate: number;
  };
}> {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  // 신규 고객 (최근 7일)
  const newCustomers = await prisma.customer.count({
    where: { createdAt: { gte: weekAgo }, deletedAt: null },
  });

  // 이탈 위험 고객 (churnRiskScore >= 70)
  const churnRiskCount = await prisma.customerHealthScore.count({
    where: { churnRiskScore: { gte: 70 } },
    // distinct on customerId - approximate with groupBy
  });

  // 만료 예정 계약 (30일 이내)
  const expiringContracts = await prisma.contract.count({
    where: {
      endDate: { lte: thirtyDaysLater, gte: now },
      status: 'ACTIVE',
    },
  });

  // 연체 미수금
  const overdueSchedules = await prisma.paymentSchedule.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ['PENDING', 'OVERDUE'] },
    },
    select: { amount: true },
  });
  const overduePayments = {
    count: overdueSchedules.length,
    totalAmount: overdueSchedules.reduce((sum, s) => sum + Number(s.amount || 0), 0),
  };

  // 정체 고객
  const stagnant = await detectStagnantCustomers();

  // 전환 제안
  const suggestions = await evaluateAllAutoTransitions();

  // 전체 활성 고객
  const totalActive = await prisma.customer.count({
    where: { deletedAt: null, grade: { notIn: ['INACTIVE'] } },
  });

  // 평균 건강도
  const healthScores = await prisma.customerHealthScore.findMany({
    orderBy: { calculatedAt: 'desc' },
    distinct: ['customerId'],
    select: { score: true },
  });
  const averageHealthScore = healthScores.length > 0
    ? Math.round(healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length)
    : 0;

  // 전환율 (최근 6개월 리드→고객)
  const rates = await getConversionRates();
  const leadToCustomer = rates['LEAD->CUSTOMER'] || rates['PROSPECT->CUSTOMER'];
  const conversionRate = leadToCustomer?.rate || 0;

  return {
    period: { from: weekAgo.toISOString(), to: now.toISOString() },
    newCustomers,
    churnRiskCount,
    expiringContracts,
    overduePayments,
    stagnantCustomers: stagnant.length,
    transitionSuggestions: suggestions.length,
    topMetrics: {
      totalActive,
      averageHealthScore,
      conversionRate,
    },
  };
}



/**
 * 자동 단계 전환 실행 (승인 후 호출)
 */
export async function executeAutoTransition(
  customerId: string,
  toStage: CustomerGrade,
  reason: string,
  triggeredBy: string
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { grade: true },
  });
  if (!customer) return null;

  const fromStage = customer.grade;

  await prisma.customer.update({
    where: { id: customerId },
    data: { grade: toStage },
  });

  const transition = await recordTransition({
    customerId,
    fromStage,
    toStage,
    reason,
    isAutomatic: true,
    triggeredBy,
  });

  return { fromStage, toStage, transition };
}

/**
 * 전체 고객 자동 전환 평가 및 제안 목록 반환
 */
export async function evaluateAllAutoTransitions(): Promise<
  { customerId: string; company: string | null; currentGrade: CustomerGrade; suggestedStage: CustomerGrade; reason: string }[]
> {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, grade: { in: ['PROSPECT', 'CUSTOMER'] } },
    select: { id: true, company: true, grade: true },
  });

  const suggestions: { customerId: string; company: string | null; currentGrade: CustomerGrade; suggestedStage: CustomerGrade; reason: string }[] = [];

  for (const cust of customers) {
    const result = await evaluateAutoTransition(cust.id);
    if (result?.shouldTransition && result.suggestedStage && result.reason) {
      suggestions.push({
        customerId: cust.id,
        company: cust.company,
        currentGrade: cust.grade,
        suggestedStage: result.suggestedStage,
        reason: result.reason,
      });
    }
  }

  return suggestions;
}

/**
 * 주간 요약 리포트 데이터 생성
 */
export async function generateWeeklySummary(): Promise<{
  period: { from: string; to: string };
  newCustomers: number;
  churnRiskCount: number;
  expiringContracts: number;
  overduePayments: { count: number; totalAmount: number };
  stagnantCustomers: number;
  transitionSuggestions: number;
  topMetrics: {
    totalActive: number;
    averageHealthScore: number;
    conversionRate: number;
  };
}> {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const newCustomers = await prisma.customer.count({
    where: { createdAt: { gte: weekAgo }, deletedAt: null },
  });

  const churnRiskScores = await prisma.customerHealthScore.findMany({
    where: { churnRiskScore: { gte: 70 } },
    distinct: ['customerId'],
    select: { customerId: true },
  });
  const churnRiskCount = churnRiskScores.length;

  const expiringContracts = await prisma.contract.count({
    where: {
      endDate: { lte: thirtyDaysLater, gte: now },
      status: 'ACTIVE',
    },
  });

  const overdueSchedules = await prisma.paymentSchedule.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ['PENDING', 'OVERDUE'] },
    },
    select: { amount: true },
  });
  const overduePayments = {
    count: overdueSchedules.length,
    totalAmount: overdueSchedules.reduce((sum, s) => sum + Number(s.amount || 0), 0),
  };

  const stagnant = await detectStagnantCustomers();
  const suggestions = await evaluateAllAutoTransitions();

  const totalActive = await prisma.customer.count({
    where: { deletedAt: null, grade: { notIn: ['INACTIVE'] } },
  });

  const healthScores = await prisma.customerHealthScore.findMany({
    orderBy: { calculatedAt: 'desc' },
    distinct: ['customerId'],
    select: { score: true },
  });
  const averageHealthScore = healthScores.length > 0
    ? Math.round(healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length)
    : 0;

  const rates = await getConversionRates();
  const leadToCustomer = rates['LEAD->CUSTOMER'] || rates['PROSPECT->CUSTOMER'];
  const conversionRate = leadToCustomer?.rate || 0;

  return {
    period: { from: weekAgo.toISOString(), to: now.toISOString() },
    newCustomers,
    churnRiskCount,
    expiringContracts,
    overduePayments,
    stagnantCustomers: stagnant.length,
    transitionSuggestions: suggestions.length,
    topMetrics: {
      totalActive,
      averageHealthScore,
      conversionRate,
    },
  };
}
