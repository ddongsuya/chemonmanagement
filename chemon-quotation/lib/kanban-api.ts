// Kanban API Client
import { api } from './api';

export interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  fields: Record<string, any>;
  assignee?: { id: string; name: string };
  dueDate?: string;
  priority?: string;
  tags?: string[];
}

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  items: KanbanItem[];
  count: number;
  totalAmount?: number;
}

export interface KanbanViewResponse {
  columns: KanbanColumn[];
  settings: {
    groupByField: string;
    cardFields: string[];
    filters: Record<string, any>;
  };
}

export interface KanbanSettings {
  groupByField?: string;
  columns?: Array<{ id: string; visible: boolean; order: number }>;
  cardFields?: string[];
  filters?: Record<string, any>;
}

// 칸반 뷰 데이터 조회
export async function getKanbanView(
  entityType: 'lead' | 'quotation' | 'contract' | 'study',
  filters?: Record<string, any>
): Promise<KanbanViewResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const queryString = params.toString();
  const url = `/kanban/${entityType}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
}

// 칸반 아이템 이동
export async function moveKanbanItem(
  entityType: 'lead' | 'quotation' | 'contract' | 'study',
  itemId: string,
  targetColumn: string,
  targetIndex?: number
): Promise<{ success: boolean; item: KanbanItem }> {
  return api.put(`/kanban/${entityType}/${itemId}/move`, {
    targetColumn,
    targetIndex
  });
}

// 칸반 설정 조회
export async function getKanbanSettings(
  entityType: string
): Promise<KanbanSettings> {
  return api.get(`/kanban/${entityType}/settings`);
}

// 칸반 설정 저장
export async function saveKanbanSettings(
  entityType: string,
  settings: KanbanSettings
): Promise<KanbanSettings> {
  return api.put(`/kanban/${entityType}/settings`, settings);
}
