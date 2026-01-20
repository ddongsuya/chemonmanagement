// Analytics Service - 분석 데이터 서비스
import prisma from '../lib/prisma';

interface DateRangeQuery {
  startDate: Date;
  endDate: Date;
  groupBy?: string;
  userId?: string;
}

export class AnalyticsService {
  // 매출 분석
  async getRevenueAnalytics(query: DateRangeQuery & { period?: string }) {
    const { startDate, endDate, period = 'monthly', groupBy } = query;

    const contracts = await prisma.contract.findMany({
      where: {
        signedDate: { gte: startDate, lte: endDate },
        status: { in: ['SIGNED', 'IN_PROGRESS', 'COMPLETED'] },
        deletedAt: null
      },
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } }
      }
    });

    // 기간별 집계
    const periodData: Record<string, { revenue: number; count: number }> = {};
    
    contracts.forEach(c => {
      if (!c.signedDate) return;
      
      let key: string;
      switch (period) {
        case 'daily':
          key = c.signedDate.toISOString().slice(0, 10);
          break;
        case 'weekly':
          const weekStart = new Date(c.signedDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        case 'quarterly':
          const quarter = Math.floor(c.signedDate.getMonth() / 3) + 1;
          key = `${c.signedDate.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          key = c.signedDate.getFullYear().toString();
          break;
        default: // monthly
          key = c.signedDate.toISOString().slice(0, 7);
      }

      if (!periodData[key]) {
        periodData[key] = { revenue: 0, count: 0 };
      }
      periodData[key].revenue += Number(c.totalAmount);
      periodData[key].count += 1;
    });

    // 이전 기간 대비 성장률 계산
    const sortedPeriods = Object.keys(periodData).sort();
    const data = sortedPeriods.map((period, index) => {
      const current = periodData[period];
      const previous = index > 0 ? periodData[sortedPeriods[index - 1]] : null;
      const growth = previous ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;

      return {
        period,
        revenue: current.revenue,
        count: current.count,
        growth: Math.round(growth * 100) / 100
      };
    });

    const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const totalCount = contracts.length;
    const avgDealSize = totalCount > 0 ? totalRevenue / totalCount : 0;

    // 전체 성장률 (첫 기간 대비 마지막 기간)
    const firstPeriod = data[0];
    const lastPeriod = data[data.length - 1];
    const overallGrowth = firstPeriod && lastPeriod && firstPeriod.revenue > 0
      ? ((lastPeriod.revenue - firstPeriod.revenue) / firstPeriod.revenue) * 100
      : 0;

    return {
      data,
      summary: {
        totalRevenue,
        totalCount,
        avgDealSize: Math.round(avgDealSize),
        growth: Math.round(overallGrowth * 100) / 100
      }
    };
  }

  // 전환율 분석
  async getConversionAnalytics(query: DateRangeQuery & { entityType?: string }) {
    const { startDate, endDate, entityType = 'lead' } = query;

    if (entityType === 'lead') {
      // 리드 파이프라인 전환율
      const leads = await prisma.lead.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        include: { stage: true }
      });

      const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
      });

      const funnel = stages.map((stage, index) => {
        const count = leads.filter(l => l.stageId === stage.id || 
          stages.findIndex(s => s.id === l.stageId) >= index).length;
        const prevCount = index > 0 ? 
          leads.filter(l => stages.findIndex(s => s.id === l.stageId) >= index - 1).length : 
          leads.length;
        
        return {
          stage: stage.name,
          count,
          conversionRate: prevCount > 0 ? Math.round((count / prevCount) * 100) : 0,
          avgDaysInStage: 0 // TODO: 단계별 평균 체류일 계산
        };
      });

      const overallConversionRate = leads.length > 0 
        ? Math.round((leads.filter(l => l.status === 'CONVERTED').length / leads.length) * 100)
        : 0;

      return { funnel, overallConversionRate };
    }

    // 견적서 전환율
    const quotations = await prisma.quotation.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null
      }
    });

    const statusCounts = {
      DRAFT: quotations.filter(q => q.status === 'DRAFT').length,
      SENT: quotations.filter(q => ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(q.status)).length,
      ACCEPTED: quotations.filter(q => q.status === 'ACCEPTED').length
    };

    const funnel = [
      { stage: '작성', count: quotations.length, conversionRate: 100, avgDaysInStage: 0 },
      { stage: '발송', count: statusCounts.SENT, conversionRate: quotations.length > 0 ? Math.round((statusCounts.SENT / quotations.length) * 100) : 0, avgDaysInStage: 0 },
      { stage: '승인', count: statusCounts.ACCEPTED, conversionRate: statusCounts.SENT > 0 ? Math.round((statusCounts.ACCEPTED / statusCounts.SENT) * 100) : 0, avgDaysInStage: 0 }
    ];

    return {
      funnel,
      overallConversionRate: quotations.length > 0 ? Math.round((statusCounts.ACCEPTED / quotations.length) * 100) : 0
    };
  }

  // 리드타임 분석
  async getLeadTimeAnalytics(query: DateRangeQuery) {
    const { startDate, endDate } = query;

    // 완료된 계약 기준 리드타임 분석
    const contracts = await prisma.contract.findMany({
      where: {
        signedDate: { gte: startDate, lte: endDate },
        deletedAt: null
      },
      include: {
        quotations: {
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      }
    });

    // 단계별 소요일 계산
    const leadTimes: number[] = [];
    const quotationToContract: number[] = [];

    contracts.forEach(c => {
      if (c.quotations.length > 0 && c.signedDate) {
        const quotationDate = c.quotations[0].createdAt;
        const days = Math.ceil((c.signedDate.getTime() - quotationDate.getTime()) / (1000 * 60 * 60 * 24));
        quotationToContract.push(days);
      }
    });

    const calcStats = (arr: number[]) => {
      if (arr.length === 0) return { avg: 0, median: 0, min: 0, max: 0 };
      const sorted = [...arr].sort((a, b) => a - b);
      return {
        avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
        median: sorted[Math.floor(sorted.length / 2)],
        min: sorted[0],
        max: sorted[sorted.length - 1]
      };
    };

    const stages = [
      {
        from: '견적',
        to: '계약',
        ...calcStats(quotationToContract)
      }
    ];

    const totalStats = calcStats(quotationToContract);

    return {
      stages,
      totalCycle: {
        avgDays: totalStats.avg,
        medianDays: totalStats.median
      },
      bottleneck: stages.length > 0 ? {
        stage: stages.reduce((max, s) => s.avg > max.avg ? s : max).from + ' → ' + stages.reduce((max, s) => s.avg > max.avg ? s : max).to,
        avgDays: stages.reduce((max, s) => s.avg > max.avg ? s : max).avg
      } : null
    };
  }

  // 영업 성과 분석
  async getPerformanceAnalytics(query: DateRangeQuery) {
    const { startDate, endDate, userId } = query;

    const where: any = {
      signedDate: { gte: startDate, lte: endDate },
      status: { in: ['SIGNED', 'IN_PROGRESS', 'COMPLETED'] },
      deletedAt: null
    };

    if (userId) {
      where.userId = userId;
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    // 사용자별 집계
    const userStats: Record<string, { revenue: number; count: number; name: string }> = {};
    
    contracts.forEach(c => {
      if (!userStats[c.userId]) {
        userStats[c.userId] = { revenue: 0, count: 0, name: c.user.name };
      }
      userStats[c.userId].revenue += Number(c.totalAmount);
      userStats[c.userId].count += 1;
    });

    // 리더보드 생성
    const leaderboard = Object.entries(userStats)
      .map(([userId, stats]) => ({
        userId,
        userName: stats.name,
        revenue: stats.revenue,
        dealCount: stats.count,
        avgDealSize: stats.count > 0 ? Math.round(stats.revenue / stats.count) : 0,
        conversionRate: 0 // TODO: 전환율 계산
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const totalDeals = contracts.length;

    return {
      leaderboard,
      teamSummary: {
        totalRevenue,
        totalDeals
      }
    };
  }

  // Lost 분석
  async getLostAnalytics(query: DateRangeQuery & { groupBy?: string }) {
    const { startDate, endDate, groupBy = 'reason' } = query;

    const lostLeads = await prisma.lead.findMany({
      where: {
        status: 'LOST',
        updatedAt: { gte: startDate, lte: endDate },
        deletedAt: null
      }
    });

    // 사유별 집계
    const byReason: Record<string, { count: number; amount: number }> = {};
    
    lostLeads.forEach(l => {
      const reason = l.lostReason || '미지정';
      if (!byReason[reason]) {
        byReason[reason] = { count: 0, amount: 0 };
      }
      byReason[reason].count += 1;
      byReason[reason].amount += Number(l.expectedAmount || 0);
    });

    const total = lostLeads.length;
    const byReasonArray = Object.entries(byReason).map(([reason, stats]) => ({
      reason,
      count: stats.count,
      percentage: total > 0 ? Math.round((stats.count / total) * 100) : 0,
      amount: stats.amount
    })).sort((a, b) => b.count - a.count);

    // 단계별 집계
    const byStage: Record<string, number> = {};
    // TODO: 단계별 Lost 집계

    return {
      byReason: byReasonArray,
      byStage: [],
      recoverable: {
        count: lostLeads.filter(l => l.lostReason === 'PRICE' || l.lostReason === 'SCHEDULE').length,
        amount: lostLeads
          .filter(l => l.lostReason === 'PRICE' || l.lostReason === 'SCHEDULE')
          .reduce((sum, l) => sum + Number(l.expectedAmount || 0), 0)
      }
    };
  }

  // 시험 현황 개요
  async getStudyOverview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, byStatus, delayed, completedThisMonth] = await Promise.all([
      prisma.study.count(),
      prisma.study.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.study.count({
        where: {
          expectedEndDate: { lt: now },
          status: { notIn: ['COMPLETED', 'SUSPENDED'] }
        }
      }),
      prisma.study.count({
        where: {
          status: 'COMPLETED',
          actualEndDate: { gte: monthStart }
        }
      })
    ]);

    const inProgress = byStatus
      .filter(s => ['PREPARING', 'IN_PROGRESS', 'ANALYSIS', 'REPORT_DRAFT', 'REPORT_REVIEW'].includes(s.status))
      .reduce((sum, s) => sum + s._count, 0);

    return {
      summary: {
        total,
        byStatus: byStatus.reduce((acc, s) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>),
        inProgress,
        delayed,
        completedThisMonth
      }
    };
  }

  // 지연 시험 목록
  async getDelayedStudies(thresholdDays: number = 0) {
    const now = new Date();

    const studies = await prisma.study.findMany({
      where: {
        expectedEndDate: { lt: now },
        status: { notIn: ['COMPLETED', 'SUSPENDED'] }
      },
      include: {
        contract: {
          include: {
            customer: { select: { name: true } }
          }
        }
      },
      orderBy: { expectedEndDate: 'asc' }
    });

    const delayedStudies = studies.map(s => {
      const delayDays = Math.ceil((now.getTime() - (s.expectedEndDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));
      return {
        id: s.id,
        studyNumber: s.studyNumber,
        testName: s.testName,
        contractId: s.contractId,
        customerName: s.contract.customer.name,
        expectedEndDate: s.expectedEndDate?.toISOString(),
        delayDays,
        status: s.status
      };
    }).filter(s => s.delayDays >= thresholdDays);

    const avgDelayDays = delayedStudies.length > 0
      ? Math.round(delayedStudies.reduce((sum, s) => sum + s.delayDays, 0) / delayedStudies.length)
      : 0;

    return {
      studies: delayedStudies,
      summary: {
        totalDelayed: delayedStudies.length,
        avgDelayDays,
        byReason: {} // TODO: 지연 사유별 집계
      }
    };
  }

  // 연구소 가동률
  async getStudyWorkload(labId?: string) {
    const inProgressStatuses = ['PREPARING', 'IN_PROGRESS', 'ANALYSIS', 'REPORT_DRAFT', 'REPORT_REVIEW'];
    
    const currentWorkload = await prisma.study.count({
      where: {
        status: { in: inProgressStatuses as any }
      }
    });

    // 기본 최대 처리량 (설정에서 가져올 수 있음)
    const capacity = 50;
    const utilizationRate = Math.round((currentWorkload / capacity) * 100);

    return {
      currentWorkload,
      capacity,
      utilizationRate
    };
  }
}

export const analyticsService = new AnalyticsService();
