// Dashboard API Client
import { api } from './api';
import { DashboardAccessLevel } from './dashboard-permissions';
import { PositionType, TitleType } from './auth-api';

export type WidgetType = 
  | 'KPI_CARD' 
  | 'BAR_CHART' 
  | 'LINE_CHART' 
  | 'PIE_CHART' 
  | 'FUNNEL_CHART' 
  | 'TABLE' 
  | 'TIMELINE' 
  | 'CALENDAR' 
  | 'LEADERBOARD' 
  | 'GAUGE' 
  | 'PROGRESS';

// 대시보드 통계 타입
export interface DashboardStatsData {
  count: number;
  amount: number;
  byStatus?: Record<string, { count: number; amount: number }>;
}

export interface DashboardKPI {
  conversionRate: number;
  won: number;
  lost: number;
}

export interface DashboardPersonalStats {
  quotation: DashboardStatsData;
  contract: DashboardStatsData;
  lead: { count: number };
  kpi: DashboardKPI;
}

export interface DepartmentStats {
  department: string;
  departmentName: string;
  quotation: { count: number; amount: number };
  contract: { count: number; amount: number };
  conversionRate: number;
}

export interface UserRankingItem {
  rank: number;
  userId: string;
  userName: string;
  department: string | null;
  departmentName: string | null;
  position: PositionType | null;
  quotationCount: number;
  quotationAmount: number;
}

export interface DashboardStatsResponse {
  accessLevel: DashboardAccessLevel;
  user: {
    id: string;
    name: string;
    department: string | null;
    position: PositionType | null;
    title: TitleType | null;
  };
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  personal: DashboardPersonalStats;
  company: DashboardPersonalStats | null;
  byDepartment: DepartmentStats[] | null;
  userRanking: UserRankingItem[] | null;
}

// 권한 기반 대시보드 통계 조회
export async function getDashboardStats(params?: { year?: number; month?: number }): Promise<DashboardStatsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.month) queryParams.append('month', params.month.toString());
  const queryString = queryParams.toString();
  return api.get(`/dashboard/stats${queryString ? `?${queryString}` : ''}`);
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  name: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  dataSource: string;
  query?: any;
  aggregation?: any;
  config: any;
  filters?: any;
  dateRange?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: any;
  isDefault: boolean;
  isPublic: boolean;
  ownerId: string;
  sharedWith: string[];
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDashboardInput {
  name: string;
  description?: string;
  layout?: any;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface CreateWidgetInput {
  name: string;
  type: WidgetType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  dataSource: string;
  query?: any;
  aggregation?: any;
  config?: any;
  filters?: any;
  dateRange?: string;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description?: string;
  type: WidgetType;
  category: string;
  defaultConfig: any;
  thumbnail?: string;
}

// 대시보드 목록 조회
export async function getDashboards(): Promise<{ dashboards: Dashboard[]; defaultDashboardId?: string }> {
  return api.get('/dashboard');
}

// 대시보드 생성
export async function createDashboard(input: CreateDashboardInput): Promise<Dashboard> {
  return api.post('/dashboard', input);
}

// 대시보드 상세 조회
export async function getDashboardById(id: string): Promise<Dashboard> {
  return api.get(`/dashboard/${id}`);
}

// 대시보드 수정
export async function updateDashboard(id: string, data: Partial<CreateDashboardInput>): Promise<Dashboard> {
  return api.put(`/dashboard/${id}`, data);
}

// 대시보드 삭제
export async function deleteDashboard(id: string): Promise<{ success: boolean }> {
  return api.delete(`/dashboard/${id}`);
}

// 대시보드 복제
export async function duplicateDashboard(id: string): Promise<Dashboard> {
  return api.post(`/dashboard/${id}/duplicate`, {});
}

// 레이아웃 업데이트
export async function updateDashboardLayout(id: string, layout: any): Promise<Dashboard> {
  return api.put(`/dashboard/${id}/layout`, { layout });
}

// 위젯 추가
export async function addWidget(dashboardId: string, input: CreateWidgetInput): Promise<DashboardWidget> {
  return api.post(`/dashboard/${dashboardId}/widgets`, input);
}

// 위젯 수정
export async function updateWidget(dashboardId: string, widgetId: string, data: Partial<CreateWidgetInput>): Promise<DashboardWidget> {
  return api.put(`/dashboard/${dashboardId}/widgets/${widgetId}`, data);
}

// 위젯 삭제
export async function deleteWidget(dashboardId: string, widgetId: string): Promise<{ success: boolean }> {
  return api.delete(`/dashboard/${dashboardId}/widgets/${widgetId}`);
}

// 위젯 데이터 조회
export async function getWidgetData(dashboardId: string, widgetId: string, params?: { dateRange?: string; filters?: any }): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.dateRange) queryParams.append('dateRange', params.dateRange);
  const queryString = queryParams.toString();
  return api.get(`/dashboard/${dashboardId}/widgets/${widgetId}/data${queryString ? `?${queryString}` : ''}`);
}

// 위젯 템플릿 목록
export async function getWidgetTemplates(): Promise<{ templates: WidgetTemplate[]; categories: string[] }> {
  return api.get('/widgets/templates');
}
