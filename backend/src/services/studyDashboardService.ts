import { PrismaClient, StudyStatus } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';

export interface StudyOverview {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    inProgress: number;
    delayed: number;
    completedThisMonth: number;
  };
  recentCompletions: StudySummary[];
  upcomingDeadlines: StudySummary[];
}

export interface StudySummary {
  id: string;
  studyNumber: string;
  testName: string;
  status: StudyStatus;
  customerName: string;
  expectedEndDate: Date | null;
  actualEndDate: Date | null;
  delayDays?: number;
}

export interface StudyWorkload {
  currentWorkload: number;
  capacity: number;
  utilizationRate: number;
  byStatus: Record<string, number>;
  forecast: Array<{ date: string; expectedWorkload: number }>;
}

export interface DelayedStudy {
  id: string;
  studyNumber: string;
  testName: string;
  contractId: string;
  customerName: string;
  expectedEndDate: Date;
  delayDays: number;
  delayReason: string | null;
  status: StudyStatus;
}

export interface DelayedStudiesResponse {
  studies: DelayedStudy[];
  summary: {
    totalDelayed: number;
    avgDelayDays: number;
    byReason: Record<string, number>;
  };
}

export interface ReportStatusResponse {
  summary: {
    draftInProgress: number;
    reviewInProgress: number;
    completedThisMonth: number;
    expectedThisMonth: number;
  };
  timeline: Array<{
    studyId: string;
    studyNumber: string;
    testName: string;
    reportDraftDate: Date | null;
    reportFinalDate: Date | null;
    status: string;
  }>;
}

export interface StudyCalendarEvent {
  id: string;
  studyId: string;
  studyNumber: string;
  testName: string;
  type: string;
  date: Date;
  title: string;
  color: string;
}

export class StudyDashboardService {
  private prisma: PrismaClient;
  private defaultCapacity = 100; // Default study capacity

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Overview ====================

  async getOverview(): Promise<StudyOverview> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all studies
    const studies = await this.prisma.study.findMany({
      include: { contract: { include: { customer: true } } },
    });

    // Count by status
    const byStatus: Record<string, number> = {};
    studies.forEach(s => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    });

    // In progress studies
    const inProgressStatuses: StudyStatus[] = [
      StudyStatus.PREPARING,
      StudyStatus.IN_PROGRESS,
      StudyStatus.ANALYSIS,
      StudyStatus.REPORT_DRAFT,
      StudyStatus.REPORT_REVIEW,
    ];
    const inProgress = studies.filter(s => inProgressStatuses.includes(s.status)).length;

    // Delayed studies (expected end date passed but not completed)
    const delayed = studies.filter(s => 
      s.expectedEndDate && 
      s.expectedEndDate < now && 
      s.status !== StudyStatus.COMPLETED &&
      s.status !== StudyStatus.SUSPENDED
    ).length;

    // Completed this month
    const completedThisMonth = studies.filter(s => 
      s.status === StudyStatus.COMPLETED &&
      s.actualEndDate &&
      s.actualEndDate >= startOfMonth &&
      s.actualEndDate <= endOfMonth
    ).length;

    // Recent completions (last 5)
    const recentCompletions = studies
      .filter(s => s.status === StudyStatus.COMPLETED && s.actualEndDate)
      .sort((a, b) => (b.actualEndDate?.getTime() || 0) - (a.actualEndDate?.getTime() || 0))
      .slice(0, 5)
      .map(s => this.toStudySummary(s));

    // Upcoming deadlines (next 10)
    const upcomingDeadlines = studies
      .filter(s => 
        s.expectedEndDate && 
        s.expectedEndDate >= now &&
        s.status !== StudyStatus.COMPLETED &&
        s.status !== StudyStatus.SUSPENDED
      )
      .sort((a, b) => (a.expectedEndDate?.getTime() || 0) - (b.expectedEndDate?.getTime() || 0))
      .slice(0, 10)
      .map(s => this.toStudySummary(s));

    return {
      summary: {
        total: studies.length,
        byStatus,
        inProgress,
        delayed,
        completedThisMonth,
      },
      recentCompletions,
      upcomingDeadlines,
    };
  }

  // ==================== Workload ====================

  async getWorkload(): Promise<StudyWorkload> {
    const now = new Date();

    // Get capacity from settings or use default
    const capacitySetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'study_workload_capacity' },
    });
    const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : this.defaultCapacity;

    // Current in-progress studies
    const inProgressStatuses: StudyStatus[] = [
      StudyStatus.PREPARING,
      StudyStatus.IN_PROGRESS,
      StudyStatus.ANALYSIS,
      StudyStatus.REPORT_DRAFT,
      StudyStatus.REPORT_REVIEW,
    ];

    const currentStudies = await this.prisma.study.findMany({
      where: { status: { in: inProgressStatuses } },
    });

    const currentWorkload = currentStudies.length;
    const utilizationRate = Math.round((currentWorkload / capacity) * 100);

    // Count by status
    const byStatus: Record<string, number> = {};
    currentStudies.forEach(s => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    });

    // Forecast for next 30 days
    const forecast: Array<{ date: string; expectedWorkload: number }> = [];
    for (let i = 0; i < 30; i += 7) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      // Simple forecast: current workload minus expected completions plus expected new studies
      const expectedCompletions = await this.prisma.study.count({
        where: {
          status: { in: inProgressStatuses },
          expectedEndDate: {
            gte: now,
            lte: forecastDate,
          },
        },
      });

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        expectedWorkload: Math.max(0, currentWorkload - expectedCompletions),
      });
    }

    return {
      currentWorkload,
      capacity,
      utilizationRate,
      byStatus,
      forecast,
    };
  }

  // ==================== Delays ====================

  async getDelayedStudies(thresholdDays: number = 7): Promise<DelayedStudiesResponse> {
    const now = new Date();

    const delayedStudies = await this.prisma.study.findMany({
      where: {
        expectedEndDate: { lt: now },
        status: {
          notIn: [StudyStatus.COMPLETED, StudyStatus.SUSPENDED],
        },
      },
      include: { contract: { include: { customer: true } } },
      orderBy: { expectedEndDate: 'asc' },
    });

    const studies: DelayedStudy[] = delayedStudies.map(s => {
      const delayDays = Math.ceil((now.getTime() - (s.expectedEndDate?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24));
      return {
        id: s.id,
        studyNumber: s.studyNumber,
        testName: s.testName,
        contractId: s.contractId,
        customerName: s.contract.customer.name,
        expectedEndDate: s.expectedEndDate!,
        delayDays,
        delayReason: null, // Would need to add this field to Study model
        status: s.status,
      };
    });

    // Filter by threshold
    const filteredStudies = studies.filter(s => s.delayDays >= thresholdDays);

    // Summary
    const totalDelayed = filteredStudies.length;
    const avgDelayDays = totalDelayed > 0 
      ? Math.round(filteredStudies.reduce((sum, s) => sum + s.delayDays, 0) / totalDelayed)
      : 0;

    // Group by reason (placeholder since we don't have delayReason field yet)
    const byReason: Record<string, number> = {
      '미지정': totalDelayed,
    };

    return {
      studies: filteredStudies,
      summary: {
        totalDelayed,
        avgDelayDays,
        byReason,
      },
    };
  }

  // ==================== Report Status ====================

  async getReportStatus(month?: string): Promise<ReportStatusResponse> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get studies with report status
    const studies = await this.prisma.study.findMany({
      where: {
        OR: [
          { reportDraftDate: { gte: startDate, lte: endDate } },
          { reportFinalDate: { gte: startDate, lte: endDate } },
          { expectedEndDate: { gte: startDate, lte: endDate } },
        ],
      },
      include: { contract: { include: { customer: true } } },
      orderBy: { expectedEndDate: 'asc' },
    });

    // Count by report status
    const draftInProgress = studies.filter(s => s.status === StudyStatus.REPORT_DRAFT).length;
    const reviewInProgress = studies.filter(s => s.status === StudyStatus.REPORT_REVIEW).length;
    const completedThisMonth = studies.filter(s => 
      s.reportFinalDate && 
      s.reportFinalDate >= startDate && 
      s.reportFinalDate <= endDate
    ).length;
    const expectedThisMonth = studies.filter(s => 
      s.expectedEndDate && 
      s.expectedEndDate >= startDate && 
      s.expectedEndDate <= endDate &&
      s.status !== StudyStatus.COMPLETED
    ).length;

    // Timeline
    const timeline = studies.map(s => {
      let status = 'PENDING';
      if (s.reportFinalDate) status = 'COMPLETED';
      else if (s.status === StudyStatus.REPORT_REVIEW) status = 'REVIEW';
      else if (s.status === StudyStatus.REPORT_DRAFT) status = 'DRAFT';

      return {
        studyId: s.id,
        studyNumber: s.studyNumber,
        testName: s.testName,
        reportDraftDate: s.reportDraftDate,
        reportFinalDate: s.reportFinalDate,
        status,
      };
    });

    return {
      summary: {
        draftInProgress,
        reviewInProgress,
        completedThisMonth,
        expectedThisMonth,
      },
      timeline,
    };
  }

  // ==================== Calendar ====================

  async getCalendar(startDate: string, endDate: string): Promise<StudyCalendarEvent[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const studies = await this.prisma.study.findMany({
      where: {
        OR: [
          { startDate: { gte: start, lte: end } },
          { expectedEndDate: { gte: start, lte: end } },
          { actualEndDate: { gte: start, lte: end } },
          { reportDraftDate: { gte: start, lte: end } },
          { reportFinalDate: { gte: start, lte: end } },
        ],
      },
    });

    const events: StudyCalendarEvent[] = [];

    studies.forEach(s => {
      if (s.startDate && s.startDate >= start && s.startDate <= end) {
        events.push({
          id: `${s.id}-start`,
          studyId: s.id,
          studyNumber: s.studyNumber,
          testName: s.testName,
          type: 'start',
          date: s.startDate,
          title: `${s.studyNumber} 시험 시작`,
          color: '#3B82F6', // blue
        });
      }

      if (s.expectedEndDate && s.expectedEndDate >= start && s.expectedEndDate <= end) {
        events.push({
          id: `${s.id}-expected-end`,
          studyId: s.id,
          studyNumber: s.studyNumber,
          testName: s.testName,
          type: 'expected-end',
          date: s.expectedEndDate,
          title: `${s.studyNumber} 예상 종료`,
          color: '#F59E0B', // amber
        });
      }

      if (s.actualEndDate && s.actualEndDate >= start && s.actualEndDate <= end) {
        events.push({
          id: `${s.id}-actual-end`,
          studyId: s.id,
          studyNumber: s.studyNumber,
          testName: s.testName,
          type: 'actual-end',
          date: s.actualEndDate,
          title: `${s.studyNumber} 시험 완료`,
          color: '#10B981', // green
        });
      }

      if (s.reportDraftDate && s.reportDraftDate >= start && s.reportDraftDate <= end) {
        events.push({
          id: `${s.id}-report-draft`,
          studyId: s.id,
          studyNumber: s.studyNumber,
          testName: s.testName,
          type: 'report-draft',
          date: s.reportDraftDate,
          title: `${s.studyNumber} 보고서 초안`,
          color: '#8B5CF6', // purple
        });
      }

      if (s.reportFinalDate && s.reportFinalDate >= start && s.reportFinalDate <= end) {
        events.push({
          id: `${s.id}-report-final`,
          studyId: s.id,
          studyNumber: s.studyNumber,
          testName: s.testName,
          type: 'report-final',
          date: s.reportFinalDate,
          title: `${s.studyNumber} 보고서 발행`,
          color: '#EC4899', // pink
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // ==================== Helpers ====================

  private toStudySummary(study: Record<string, unknown> & { contract: { customer: { name: string } } }): StudySummary {
    const now = new Date();
    const expectedEndDate = study.expectedEndDate as Date | null;
    let delayDays: number | undefined;

    if (expectedEndDate && expectedEndDate < now && study.status !== StudyStatus.COMPLETED) {
      delayDays = Math.ceil((now.getTime() - expectedEndDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      id: study.id as string,
      studyNumber: study.studyNumber as string,
      testName: study.testName as string,
      status: study.status as StudyStatus,
      customerName: study.contract.customer.name,
      expectedEndDate,
      actualEndDate: study.actualEndDate as Date | null,
      delayDays,
    };
  }
}

export default StudyDashboardService;
