/**
 * Health Score Service
 * 
 * 고객 건강도 점수 산출 엔진
 * 가중치: 활동 빈도(30%), 거래 규모(25%), 미팅/상담 빈도(20%), 미수금 상태(15%), 계약 상태(10%)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HealthScoreBreakdown {
  score: number;
  activityScore: number;
  dealScore: number;
  meetingScore: number;
  paymentScore: number;
  contractScore: number;
  churnRiskScore: number;
}

const WEIGHTS = {
  activity: 0.30,
  deal: 0.25,
  meeting: 0.20,
  payment: 0.15,
  contract: 0.10,
} as const;

/**
 * 활동 빈도 점수 (0~100)
 * 최근 30일 내 활동 기반, 30일 이상 비활동 시 일별 1점 감소
 */
async function calculateActivityScore(customerId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 최근 활동 조회: 미팅, 상담, 견적
  const [meetingCount, consultationCount, quotationCount] = await Promise.all([
    prisma.meetingRecord.count({
      where: { customerId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.consultationRecord.count({
      where: { customerId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.quotation.count({
      where: { customerId, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const totalActivities = meetingCount + consultationCount + quotationCount;

  if (totalActivities >= 5) return 100;
  if (totalActivities >= 3) return 80;
  if (totalActivities >= 1) return 60;

  // 비활동 기간 계산
  const lastActivity = await prisma.meetingRecord.findFirst({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (!lastActivity) return 20;

  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity <= 30) return 50;
  // 30일 이상 비활동 시 일별 1점 감소
  return Math.max(0, 50 - (daysSinceActivity - 30));
}

/**
 * 거래 규모 점수 (0~100)
 * 총 거래액 기반
 */
async function calculateDealScore(customerId: string): Promise<number> {
  const quotations = await prisma.quotation.findMany({
    where: { customerId, deletedAt: null },
    select: { totalAmount: true },
  });

  const totalAmount = quotations.reduce(
    (sum, q) => sum + Number(q.totalAmount || 0), 0
  );

  if (totalAmount >= 100000000) return 100; // 1억 이상
  if (totalAmount >= 50000000) return 80;
  if (totalAmount >= 10000000) return 60;
  if (totalAmount >= 1000000) return 40;
  if (totalAmount > 0) return 20;
  return 0;
}

/**
 * 미팅/상담 빈도 점수 (0~100)
 * 최근 90일 내 미팅/상담 횟수
 */
async function calculateMeetingScore(customerId: string): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [meetingCount, consultationCount] = await Promise.all([
    prisma.meetingRecord.count({
      where: { customerId, createdAt: { gte: ninetyDaysAgo } },
    }),
    prisma.consultationRecord.count({
      where: { customerId, createdAt: { gte: ninetyDaysAgo } },
    }),
  ]);

  const total = meetingCount + consultationCount;
  if (total >= 6) return 100;
  if (total >= 4) return 80;
  if (total >= 2) return 60;
  if (total >= 1) return 40;
  return 0;
}

/**
 * 미수금 상태 점수 (0~100)
 * 미수금 없으면 100, 연체일 비례 감소
 */
async function calculatePaymentScore(customerId: string): Promise<number> {
  const overdueInvoices = await prisma.invoiceSchedule.findMany({
    where: {
      customerId,
      status: 'overdue',
    },
    select: { scheduledDate: true, amount: true },
  });

  if (overdueInvoices.length === 0) return 100;

  // 최장 연체일 계산
  const maxOverdueDays = overdueInvoices.reduce((max, inv) => {
    const days = Math.floor(
      (Date.now() - inv.scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(max, days);
  }, 0);

  if (maxOverdueDays <= 7) return 80;
  if (maxOverdueDays <= 30) return 50;
  if (maxOverdueDays <= 60) return 25;
  return 0;
}

/**
 * 계약 상태 점수 (0~100)
 * 활성 계약 있으면 100, 만료 임박 시 감소
 */
async function calculateContractScore(customerId: string): Promise<number> {
  const activeContracts = await prisma.contract.findMany({
    where: {
      customerId,
      status: { in: ['SIGNED', 'IN_PROGRESS', 'TEST_RECEIVED'] },
      deletedAt: null,
    },
    select: { endDate: true },
  });

  if (activeContracts.length === 0) return 20;

  // 만료 임박 확인
  const now = new Date();
  const hasExpiringSoon = activeContracts.some((c) => {
    if (!c.endDate) return false;
    const daysUntilExpiry = Math.floor(
      (c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30;
  });

  return hasExpiringSoon ? 60 : 100;
}

/**
 * 이탈 위험 점수 산출 (0~100)
 * 비활동 기간(35%), 미수금 연체일(25%), 계약 만료 잔여일(20%), 건강도 하락 추세(20%)
 */
async function calculateChurnRiskScore(
  customerId: string,
  currentHealthScore: number
): Promise<number> {
  // 1. 비활동 기간 (35%)
  const lastMeeting = await prisma.meetingRecord.findFirst({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  let inactivityRisk = 0;
  if (!lastMeeting) {
    inactivityRisk = 80;
  } else {
    const daysSince = Math.floor(
      (Date.now() - lastMeeting.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    inactivityRisk = Math.min(100, daysSince * 2);
  }

  // 2. 미수금 연체일 (25%)
  const overdueInvoices = await prisma.invoiceSchedule.findMany({
    where: { customerId, status: 'overdue' },
    select: { scheduledDate: true },
  });

  let paymentRisk = 0;
  if (overdueInvoices.length > 0) {
    const maxDays = overdueInvoices.reduce((max, inv) => {
      const days = Math.floor(
        (Date.now() - inv.scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(max, days);
    }, 0);
    paymentRisk = Math.min(100, maxDays * 2);
  }

  // 3. 계약 만료 잔여일 (20%)
  const nearestContract = await prisma.contract.findFirst({
    where: {
      customerId,
      status: { in: ['SIGNED', 'IN_PROGRESS'] },
      endDate: { not: null },
      deletedAt: null,
    },
    orderBy: { endDate: 'asc' },
    select: { endDate: true },
  });

  let contractRisk = 50; // 계약 없으면 중간 위험
  if (nearestContract?.endDate) {
    const daysLeft = Math.floor(
      (nearestContract.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 0) contractRisk = 100;
    else if (daysLeft <= 30) contractRisk = 80;
    else if (daysLeft <= 60) contractRisk = 50;
    else contractRisk = 10;
  }

  // 4. 건강도 하락 추세 (20%)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const previousScore = await prisma.customerHealthScore.findFirst({
    where: { customerId, calculatedAt: { lte: thirtyDaysAgo } },
    orderBy: { calculatedAt: 'desc' },
    select: { score: true },
  });

  let trendRisk = 30;
  if (previousScore) {
    const decline = previousScore.score - currentHealthScore;
    trendRisk = decline > 0 ? Math.min(100, decline * 3) : 0;
  }

  return Math.round(
    inactivityRisk * 0.35 +
    paymentRisk * 0.25 +
    contractRisk * 0.20 +
    trendRisk * 0.20
  );
}

/**
 * 고객 건강도 점수 계산 및 저장
 */
export async function calculateHealthScore(customerId: string): Promise<HealthScoreBreakdown> {
  const [activityScore, dealScore, meetingScore, paymentScore, contractScore] =
    await Promise.all([
      calculateActivityScore(customerId),
      calculateDealScore(customerId),
      calculateMeetingScore(customerId),
      calculatePaymentScore(customerId),
      calculateContractScore(customerId),
    ]);

  const score = Math.round(
    activityScore * WEIGHTS.activity +
    dealScore * WEIGHTS.deal +
    meetingScore * WEIGHTS.meeting +
    paymentScore * WEIGHTS.payment +
    contractScore * WEIGHTS.contract
  );

  const churnRiskScore = await calculateChurnRiskScore(customerId, score);

  // 이력 저장
  await prisma.customerHealthScore.create({
    data: {
      customerId,
      score,
      activityScore,
      dealScore,
      meetingScore,
      paymentScore,
      contractScore,
      churnRiskScore,
    },
  });

  return { score, activityScore, dealScore, meetingScore, paymentScore, contractScore, churnRiskScore };
}

/**
 * 최근 건강도 점수 조회 (캐시된 값)
 */
export async function getLatestHealthScore(customerId: string): Promise<HealthScoreBreakdown | null> {
  const latest = await prisma.customerHealthScore.findFirst({
    where: { customerId },
    orderBy: { calculatedAt: 'desc' },
  });

  if (!latest) return null;

  return {
    score: latest.score,
    activityScore: latest.activityScore,
    dealScore: latest.dealScore,
    meetingScore: latest.meetingScore,
    paymentScore: latest.paymentScore,
    contractScore: latest.contractScore,
    churnRiskScore: latest.churnRiskScore,
  };
}

/**
 * 건강도 점수 이력 조회 (최근 90일)
 */
export async function getHealthScoreHistory(customerId: string, days: number = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.customerHealthScore.findMany({
    where: { customerId, calculatedAt: { gte: since } },
    orderBy: { calculatedAt: 'asc' },
    select: { score: true, churnRiskScore: true, calculatedAt: true },
  });
}

/**
 * 일괄 건강도 재계산
 */
export async function batchRecalculate(customerIds?: string[]): Promise<number> {
  const where = customerIds
    ? { id: { in: customerIds }, deletedAt: null }
    : { deletedAt: null };

  const customers = await prisma.customer.findMany({
    where,
    select: { id: true },
  });

  let count = 0;
  for (const customer of customers) {
    try {
      await calculateHealthScore(customer.id);
      count++;
    } catch {
      // 개별 실패는 무시하고 계속 진행
    }
  }

  return count;
}
