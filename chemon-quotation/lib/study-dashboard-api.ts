import { api } from './api';

// Types
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
  expectedEndDate: string | null;
  actualEndDate: string | null;
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
  expectedEndDate: string;
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
    reportDraftDate: string | null;
    reportFinalDate: string | null;
    status: 'PENDING' | 'DRAFT' | 'REVIEW' | 'COMPLETED';
  }>;
}

export interface StudyCalendarEvent {
  id: string;
  studyId: string;
  studyNumber: string;
  testName: string;
  type: 'start' | 'expected-end' | 'actual-end' | 'report-draft' | 'report-final';
  date: string;
  title: string;
  color: string;
}

export type StudyStatus = 
  | 'REGISTERED'
  | 'PREPARING'
  | 'IN_PROGRESS'
  | 'ANALYSIS'
  | 'REPORT_DRAFT'
  | 'REPORT_REVIEW'
  | 'COMPLETED'
  | 'SUSPENDED';

// API Functions

export async function getStudyOverview(): Promise<StudyOverview> {
  return api.get<StudyOverview>('/study-dashboard/overview');
}

export async function getStudyWorkload(): Promise<StudyWorkload> {
  return api.get<StudyWorkload>('/study-dashboard/workload');
}

export async function getDelayedStudies(thresholdDays?: number): Promise<DelayedStudiesResponse> {
  const params = thresholdDays ? `?thresholdDays=${thresholdDays}` : '';
  return api.get<DelayedStudiesResponse>(`/study-dashboard/delays${params}`);
}

export async function getReportStatus(month?: string): Promise<ReportStatusResponse> {
  const params = month ? `?month=${month}` : '';
  return api.get<ReportStatusResponse>(`/study-dashboard/reports${params}`);
}

export async function getStudyCalendar(startDate: string, endDate: string): Promise<StudyCalendarEvent[]> {
  return api.get<StudyCalendarEvent[]>(`/study-dashboard/calendar?startDate=${startDate}&endDate=${endDate}`);
}

// Study Status Labels
export const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  REGISTERED: '접수',
  PREPARING: '준비중',
  IN_PROGRESS: '진행중',
  ANALYSIS: '분석중',
  REPORT_DRAFT: '보고서 작성중',
  REPORT_REVIEW: '보고서 검토중',
  COMPLETED: '완료',
  SUSPENDED: '중단',
};

// Study Status Colors
export const STUDY_STATUS_COLORS: Record<StudyStatus, string> = {
  REGISTERED: '#6B7280',    // gray
  PREPARING: '#3B82F6',     // blue
  IN_PROGRESS: '#10B981',   // green
  ANALYSIS: '#8B5CF6',      // purple
  REPORT_DRAFT: '#F59E0B',  // amber
  REPORT_REVIEW: '#EC4899', // pink
  COMPLETED: '#059669',     // emerald
  SUSPENDED: '#EF4444',     // red
};
