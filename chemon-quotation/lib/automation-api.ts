import { api } from './api';

// Types
export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions: Record<string, unknown>[] | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  priority: number;
  executionCount: number;
  lastExecutedAt: string | null;
  lastError: string | null;
  createdBy: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: AutomationAction[];
}

export interface AutomationAction {
  id: string;
  ruleId: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
  order: number;
  delayMinutes: number | null;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  triggerData: Record<string, unknown>;
  targetModel: string;
  targetId: string;
  status: string;
  results: Record<string, unknown>[] | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  defaultConfig: CreateAutomationRuleDTO;
}

export interface CreateAutomationRuleDTO {
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions?: Record<string, unknown>[];
  actions: CreateAutomationActionDTO[];
  status?: 'ACTIVE' | 'INACTIVE';
  priority?: number;
}

export interface CreateAutomationActionDTO {
  actionType: string;
  actionConfig: Record<string, unknown>;
  order?: number;
  delayMinutes?: number;
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

// API Functions

// Rules
export async function getAutomationRules(params?: {
  status?: string;
  triggerType?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<AutomationRule>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.triggerType) searchParams.set('triggerType', params.triggerType);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  return api.get<PaginatedResult<AutomationRule>>(`/automation/rules?${searchParams.toString()}`);
}

export async function getAutomationRule(id: string): Promise<AutomationRule> {
  return api.get<AutomationRule>(`/automation/rules/${id}`);
}

export async function createAutomationRule(data: CreateAutomationRuleDTO): Promise<AutomationRule> {
  return api.post<AutomationRule>('/automation/rules', data);
}

export async function updateAutomationRule(id: string, data: Partial<CreateAutomationRuleDTO>): Promise<AutomationRule> {
  return api.put<AutomationRule>(`/automation/rules/${id}`, data);
}

export async function deleteAutomationRule(id: string): Promise<void> {
  return api.delete<void>(`/automation/rules/${id}`);
}

export async function toggleAutomationRule(id: string): Promise<AutomationRule> {
  return api.post<AutomationRule>(`/automation/rules/${id}/toggle`, {});
}

export async function executeAutomationRule(id: string, data: {
  targetModel: string;
  targetId: string;
  triggerData?: Record<string, unknown>;
}): Promise<AutomationExecution> {
  return api.post<AutomationExecution>(`/automation/rules/${id}/execute`, data);
}

// Executions
export async function getAutomationExecutions(params?: {
  ruleId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<AutomationExecution>> {
  const searchParams = new URLSearchParams();
  if (params?.ruleId) searchParams.set('ruleId', params.ruleId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  return api.get<PaginatedResult<AutomationExecution>>(`/automation/executions?${searchParams.toString()}`);
}

export async function getAutomationExecution(id: string): Promise<AutomationExecution> {
  return api.get<AutomationExecution>(`/automation/executions/${id}`);
}

// Templates
export async function getAutomationTemplates(): Promise<AutomationTemplate[]> {
  return api.get<AutomationTemplate[]>('/automation/templates');
}

export async function applyAutomationTemplate(templateId: string): Promise<AutomationRule> {
  return api.post<AutomationRule>(`/automation/templates/${templateId}/apply`, {});
}

// Trigger Types
export const TRIGGER_TYPES = [
  { value: 'STATUS_CHANGE', label: '상태 변경' },
  { value: 'DATE_REACHED', label: '날짜 도달' },
  { value: 'ITEM_CREATED', label: '항목 생성' },
  { value: 'ITEM_UPDATED', label: '항목 수정' },
  { value: 'FIELD_CHANGE', label: '필드 변경' },
  { value: 'SCHEDULE', label: '정기 스케줄' },
];

// Action Types
export const ACTION_TYPES = [
  { value: 'SEND_NOTIFICATION', label: '알림 발송' },
  { value: 'SEND_EMAIL', label: '이메일 발송' },
  { value: 'UPDATE_STATUS', label: '상태 업데이트' },
  { value: 'ASSIGN_USER', label: '담당자 배정' },
  { value: 'CREATE_TASK', label: '태스크 생성' },
  { value: 'CREATE_ACTIVITY', label: '활동 생성' },
  { value: 'WEBHOOK', label: '웹훅 호출' },
];

// Target Models
export const TARGET_MODELS = [
  { value: 'Lead', label: '리드' },
  { value: 'Quotation', label: '견적' },
  { value: 'Contract', label: '계약' },
  { value: 'Study', label: '시험' },
  { value: 'Customer', label: '고객' },
];
