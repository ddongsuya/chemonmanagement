// Analytics API Client
import { api } from './api';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface RevenueData {
  period: string;
  revenue: number;
  count: number;
  growth?: number;
}

export interface RevenueAnalyticsResponse {
  data: RevenueData[];
  summary: {
    totalRevenue: number;
    totalCount: number;
    avgDealSize: number;
    growth: number;
  };
  forecast?: Array<{
    period: string;
    predictedRevenue: number;
    confidence: number;
  }>;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
  avgDaysInStage: number;
}

export interface ConversionAnalyticsResponse {
  funnel: FunnelStage[];
  overallConversionRate: number;
  comparison?: {
    previousPeriod: number;
    change: number;
  };
}

export interface LeadTimeStage {
  from: string;
  to: string;
  avg: number;
  median: number;
  min: number;
  max: number;
}

export interface LeadTimeAnalyticsResponse {
  stages: LeadTimeStage[];
  totalCycle: {
    avgDays: number;
    medianDays: number;
  };
  bottleneck: {
    stage: string;
    avgDays: number;
  } | null;
}

export interface PerformanceEntry {
  userId: string;
  userName: string;
  revenue: number;
  dealCount: number;
  avgDealSize: number;
  conversionRate: number;
  rank: number;
}

export interface PerformanceAnalyticsResponse {
  leaderboard: PerformanceEntry[];
  teamSummary: {
    totalRevenue: number;
    totalDeals: number;
    target?: number;
    achievement?: number;
  };
}

export interface LostReason {
  reason: string;
  count: number;
  percentage: number;
  amount: number;
}

export interface LostAnalyticsResponse {
  byReason: LostReason[];
  byStage: Array<{ stage: string; count: number; percentage: number }>;
  byCompetitor?: Array<{ competitor: string; count: number; percentage: number }>;
  recoverable: {
    count: number;
    amount: number;
  };
}

export interface StudyOverviewResponse {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    inProgress: number;
    delayed: number;
    completedThisMonth: number;
  };
}

export interface DelayedStudy {
  id: string;
  studyNumber: string;
  testName: string;
  contractId: string;
  customerName: string;
  expectedEndDate: string;
  delayDays: number;
  delayReason?: string;
  status: string;
}

export interface DelayedStudiesResponse {
  studies: DelayedStudy[];
  summary: {
    totalDelayed: number;
    avgDelayDays: number;
    byReason: Record<string, number>;
  };
}

export interface StudyWorkloadResponse {
  currentWorkload: number;
  capacity: number;
  utilizationRate: number;
  byLab?: Array<{
    labId: string;
    labName: string;
    workload: number;
    capacity: number;
    utilizationRate: number;
  }>;
}

// 매출 분석
export async function getRevenueAnalytics(
  params: DateRangeParams & { period?: string; groupBy?: string }
): Promise<RevenueAnalyticsResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  return api.get(`/analytics/revenue?${queryParams.toString()}`);
}

// 전환율 분석
export async function getConversionAnalytics(
  params: DateRangeParams & { entityType?: string }
): Promise<ConversionAnalyticsResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  return api.get(`/analytics/conversion?${queryParams.toString()}`);
}

// 리드타임 분석
export async function getLeadTimeAnalytics(
  params: DateRangeParams
): Promise<LeadTimeAnalyticsResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  return api.get(`/analytics/lead-time?${queryParams.toString()}`);
}

// 영업 성과 분석
export async function getPerformanceAnalytics(
  params: DateRangeParams & { userId?: string }
): Promise<PerformanceAnalyticsResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  return api.get(`/analytics/performance?${queryParams.toString()}`);
}

// Lost 분석
export async function getLostAnalytics(
  params: DateRangeParams & { groupBy?: string }
): Promise<LostAnalyticsResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  return api.get(`/analytics/lost?${queryParams.toString()}`);
}

// 시험 현황 개요
export async function getStudyOverview(): Promise<StudyOverviewResponse> {
  return api.get('/analytics/study-overview');
}

// 지연 시험 목록
export async function getDelayedStudies(thresholdDays?: number): Promise<DelayedStudiesResponse> {
  const params = thresholdDays ? `?thresholdDays=${thresholdDays}` : '';
  return api.get(`/analytics/delayed-studies${params}`);
}

// 연구소 가동률
export async function getStudyWorkload(labId?: string): Promise<StudyWorkloadResponse> {
  const params = labId ? `?labId=${labId}` : '';
  return api.get(`/analytics/study-workload${params}`);
}

// 부서별 요약 데이터
export interface DepartmentSummaryResponse {
  department: string;
  leads: number;
  quotations: {
    count: number;
    totalAmount: number;
  };
  contracts: {
    count: number;
    totalAmount: number;
  };
}

export async function getDepartmentSummary(
  department: 'BD1' | 'BD2' | 'SUPPORT',
  params?: DateRangeParams
): Promise<DepartmentSummaryResponse> {
  const queryParams = new URLSearchParams({ department });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }
  return api.get(`/analytics/department-summary?${queryParams.toString()}`);
}
