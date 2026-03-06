/**
 * Customer Analytics Service
 * KPI, 전환 퍼널, CLV, 이탈률 분석
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * KPI 대시보드 데이터
 */
export async function getKPIData() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    newThisMonth,
    newLastMonth,
    activeDeals,
    outstandingInvoices,
    gradeDistribution,
  ] = await Promise.all([
    // 이번 달 신규
    prisma.customer.count({
      where: { createdAt: { gte: thisMonthStart }, deletedAt: null },
    }),
    // 지난 달 신규
    prisma.customer.count({
      where: {
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        deletedAt: null,
      },
    }),
    // 활성 거래 (진행 중 견적 + 계약)
    Promise.all([
      prisma.quotation.count({
        where: { status: { in: ['DRAFT', 'SENT'] }, deletedAt: null },
      }),
      prisma.contract.count({
        where: { status: { in: ['NEGOTIATING', 'SIGNED', 'IN_PROGRESS'] }, deletedAt: null },
      }),
    ]).then(([q, c]) => q + c),
    // 미수금 합계
    prisma.invoiceSchedule.aggregate({
      where: { status: { in: ['pending', 'overdue'] } },
      _sum: { amount: true },
    }),
    // 등급별 분포
    prisma.customer.groupBy({
      by: ['grade'],
      where: { deletedAt: null },
      _count: true,
    }),
  ]);

  const changeRate = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : newThisMonth > 0 ? 100 : 0;

  return {
    newCustomers: { count: newThisMonth, changeRate },
    activeDeals,
    outstandingAmount: Number(outstandingInvoices._sum.amount || 0),
    gradeDistribution: gradeDistribution.map((g) => ({
      grade: g.grade,
      count: g._count,
    })),
  };
}

/**
 * 전환 퍼널 데이터
 */
export async function getFunnelData() {
  const grades = ['LEAD', 'PROSPECT', 'CUSTOMER', 'VIP'] as const;
  const counts: Record<string, number> = {};

  for (const grade of grades) {
    counts[grade] = await prisma.customer.count({
      where: { grade, deletedAt: null },
    });
  }

  // 전환율 계산
  const funnel = grades.map((grade, i) => ({
    stage: grade,
    count: counts[grade],
    conversionRate: i > 0 && counts[grades[i - 1]] > 0
      ? Math.round((counts[grade] / counts[grades[i - 1]]) * 100)
      : 100,
  }));

  return funnel;
}

/**
 * 이탈률 추이 (최근 12개월)
 */
export async function getChurnRateTrend() {
  const months: { month: string; churnRate: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const [totalAtStart, becameInactive] = await Promise.all([
      prisma.customer.count({
        where: {
          createdAt: { lte: monthStart },
          deletedAt: null,
        },
      }),
      prisma.lifecycleTransition.count({
        where: {
          toStage: 'INACTIVE',
          transitionAt: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]);

    months.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      churnRate: totalAtStart > 0 ? Math.round((becameInactive / totalAtStart) * 100) : 0,
    });
  }

  return months;
}

/**
 * 세그먼트별 CLV 계산
 */
export async function getSegmentCLV() {
  const segments = ['PHARMACEUTICAL', 'COSMETICS', 'HEALTH_FOOD', 'MEDICAL_DEVICE', 'OTHER'] as const;
  const result: { segment: string; averageCLV: number; customerCount: number }[] = [];

  for (const segment of segments) {
    const customers = await prisma.customer.findMany({
      where: { segment, deletedAt: null },
      include: {
        quotations: { where: { deletedAt: null }, select: { totalAmount: true } },
      },
    });

    if (customers.length === 0) {
      result.push({ segment, averageCLV: 0, customerCount: 0 });
      continue;
    }

    const totalCLV = customers.reduce((sum, c) => {
      const customerTotal = c.quotations.reduce(
        (qSum, q) => qSum + Number(q.totalAmount || 0), 0
      );
      return sum + customerTotal;
    }, 0);

    result.push({
      segment,
      averageCLV: Math.round(totalCLV / customers.length),
      customerCount: customers.length,
    });
  }

  return result;
}

/**
 * 개별 고객 CLV 계산
 */
export async function calculateCustomerCLV(customerId: string): Promise<number> {
  const quotations = await prisma.quotation.findMany({
    where: { customerId, deletedAt: null },
    select: { totalAmount: true },
  });

  return quotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
}
