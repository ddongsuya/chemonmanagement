import { api } from './api';

// Types
export interface ReportDefinition {
  id: string;
  name: string;
  description: string | null;
  type: ReportType;
  dataSources: Record<string, unknown>;
  columns: ColumnConfig[];
  filters: Record<string, unknown>[] | null;
  groupBy: Record<string, unknown>[] | null;
  orderBy: Record<string, unknown>[] | null;
  charts: Record<string, unknown>[] | null;
  isSystem: boolean;
  isPublic: boolean;
  ownerId: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ColumnConfig {
  field: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'percent' | 'date';
}

export interface ReportExport {
  id: string;
  reportId: string;
  format: string;
  filters: Record<string, unknown> | null;
  dateRange: { start: string; end: string } | null;
  fileName: string;
  fileUrl: string | null;
  fileSize: number | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error: string | null;
  exportedBy: string;
  exportedAt: string;
  completedAt: string | null;
}

export interface ReportExecutionResult {
  data: Record<string, unknown>[];
  columns: ColumnConfig[];
  summary: Record<string, unknown>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SystemReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  dataSources: Record<string, unknown>;
  columns: ColumnConfig[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ReportType = 
  | 'SALES_SUMMARY'
  | 'PIPELINE_STATUS'
  | 'CONVERSION_RATE'
  | 'LEAD_TIME'
  | 'TEAM_PERFORMANCE'
  | 'CUSTOMER_ANALYSIS'
  | 'STUDY_STATUS'
  | 'CUSTOM';

// API Functions

// Reports
export async function getReports(params?: {
  type?: ReportType;
  isSystem?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<ReportDefinition>> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.isSystem !== undefined) searchParams.set('isSystem', params.isSystem.toString());
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  return api.get<PaginatedResult<ReportDefinition>>(`/reports?${searchParams.toString()}`);
}

export async function getSystemReports(): Promise<SystemReport[]> {
  return api.get<SystemReport[]>('/reports/system');
}

export async function getReport(id: string): Promise<ReportDefinition> {
  return api.get<ReportDefinition>(`/reports/${id}`);
}

export async function createReport(data: {
  name: string;
  description?: string;
  type: ReportType;
  dataSources: Record<string, unknown>;
  columns: ColumnConfig[];
  filters?: Record<string, unknown>[];
  groupBy?: Record<string, unknown>[];
  orderBy?: Record<string, unknown>[];
  charts?: Record<string, unknown>[];
  isPublic?: boolean;
}): Promise<ReportDefinition> {
  return api.post<ReportDefinition>('/reports', data);
}

export async function updateReport(id: string, data: Partial<{
  name: string;
  description: string;
  type: ReportType;
  dataSources: Record<string, unknown>;
  columns: ColumnConfig[];
  filters: Record<string, unknown>[];
  groupBy: Record<string, unknown>[];
  orderBy: Record<string, unknown>[];
  charts: Record<string, unknown>[];
  isPublic: boolean;
}>): Promise<ReportDefinition> {
  return api.put<ReportDefinition>(`/reports/${id}`, data);
}

export async function deleteReport(id: string): Promise<void> {
  return api.delete<void>(`/reports/${id}`);
}

// Report Execution
export async function executeReport(id: string, params?: {
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
  page?: number;
  limit?: number;
}): Promise<ReportExecutionResult> {
  return api.post<ReportExecutionResult>(`/reports/${id}/execute`, params || {});
}

// Report Export
export async function exportReport(id: string, data: {
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
}): Promise<ReportExport> {
  return api.post<ReportExport>(`/reports/${id}/export`, data);
}

export async function getExportStatus(exportId: string): Promise<ReportExport> {
  return api.get<ReportExport>(`/reports/exports/${exportId}`);
}

export async function getExports(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<ReportExport>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  return api.get<PaginatedResult<ReportExport>>(`/reports/exports?${searchParams.toString()}`);
}

// Report Types
export const REPORT_TYPES = [
  { value: 'SALES_SUMMARY', label: '매출 요약' },
  { value: 'PIPELINE_STATUS', label: '파이프라인 현황' },
  { value: 'CONVERSION_RATE', label: '전환율 분석' },
  { value: 'LEAD_TIME', label: '리드타임 분석' },
  { value: 'TEAM_PERFORMANCE', label: '팀 성과' },
  { value: 'CUSTOMER_ANALYSIS', label: '고객 분석' },
  { value: 'STUDY_STATUS', label: '시험 현황' },
  { value: 'CUSTOM', label: '사용자 정의' },
];

// Export Formats
export const EXPORT_FORMATS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
];
