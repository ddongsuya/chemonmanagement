/**
 * 진행 단계 관리
 * - 백엔드 API 연동 완료
 * - 7단계 워크플로우: 문의접수→견적서송부→시험의뢰요청→계약체결→시험접수→시험관리→자금관리
 * - Requirements: 4.1, 4.2, 4.3, 4.4, 4.6
 */

import { ProgressStage, ChecklistItem, StageHistoryItem } from '@/types/customer';
import { progressStageApi } from './customer-data-api';

// 7단계 워크플로우 정의
export const WORKFLOW_STAGES = [
  { id: 'inquiry', name: '문의접수', order: 1 },
  { id: 'quotation_sent', name: '견적서송부', order: 2 },
  { id: 'test_request', name: '시험의뢰요청', order: 3 },
  { id: 'contract_signed', name: '계약체결', order: 4 },
  { id: 'test_reception', name: '시험접수', order: 5 },
  { id: 'test_management', name: '시험관리', order: 6 },
  { id: 'fund_management', name: '자금관리', order: 7 },
] as const;

export type WorkflowStageId = typeof WORKFLOW_STAGES[number]['id'];

// 단계별 기본 체크리스트 항목
export const DEFAULT_CHECKLIST_BY_STAGE: Record<WorkflowStageId, string[]> = {
  inquiry: ['고객 문의 내용 확인', '담당자 정보 확인', '시험 가능 여부 검토'],
  quotation_sent: ['견적서 작성', '견적서 내부 검토', '견적서 발송'],
  test_request: ['시험 의뢰서 수령', '의뢰 내용 확인', '시험 일정 협의'],
  contract_signed: ['계약서 작성', '계약 조건 협의', '계약서 서명', '계약서 보관'],
  test_reception: ['시험번호 부여', '시험책임자 배정', '시험물질 접수', '시험 접수 등록'],
  test_management: ['시험 진행 상황 모니터링', '중간 보고', '시험 완료 확인', '최종 보고서 작성', '보고서 발송'],
  fund_management: ['세금계산서 발행', '입금 확인', '수금 완료 처리'],
};

// ============================================
// Helper Functions
// ============================================

/**
 * 다음 단계 ID 반환
 */
export function getNextStage(currentStage: WorkflowStageId): WorkflowStageId | null {
  const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
  if (currentIndex < 0 || currentIndex >= WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[currentIndex + 1].id;
}

/**
 * 이전 단계 ID 반환
 */
export function getPreviousStage(currentStage: WorkflowStageId): WorkflowStageId | null {
  const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
  if (currentIndex <= 0) return null;
  return WORKFLOW_STAGES[currentIndex - 1].id;
}

/**
 * 단계 이름 반환
 */
export function getStageName(stageId: WorkflowStageId): string {
  const stage = WORKFLOW_STAGES.find(s => s.id === stageId);
  return stage?.name || stageId;
}

/**
 * 기본 체크리스트 생성
 */
export function createDefaultChecklist(): ChecklistItem[] {
  const checklist: ChecklistItem[] = [];
  let itemIndex = 0;

  for (const stage of WORKFLOW_STAGES) {
    const items = DEFAULT_CHECKLIST_BY_STAGE[stage.id];
    for (const title of items) {
      checklist.push({
        id: `${stage.id}-${++itemIndex}`,
        stage: stage.id,
        title,
        is_completed: false,
      });
    }
  }

  return checklist;
}

// ============================================
// API 기반 함수들
// ============================================

/**
 * 고객사 진행 단계 조회 (API)
 */
export async function getProgressStageByCustomerIdAsync(customerId: string): Promise<ProgressStage | null> {
  try {
    return await progressStageApi.getByCustomerId(customerId);
  } catch {
    return null;
  }
}

/**
 * 진행 단계 상세 조회 (API)
 */
export async function getProgressStageByIdAsync(id: string): Promise<ProgressStage | null> {
  try {
    return await progressStageApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 진행 단계 생성 (API)
 */
export async function createProgressStageAsync(
  customerId: string,
  quotationId?: string,
  contractId?: string
): Promise<ProgressStage> {
  return await progressStageApi.create(customerId, quotationId, contractId);
}

/**
 * 단계 전환 (API)
 */
export async function updateStageAsync(
  id: string,
  newStage: WorkflowStageId,
  notes?: string
): Promise<ProgressStage | null> {
  try {
    return await progressStageApi.updateStage(id, newStage, notes);
  } catch {
    return null;
  }
}

/**
 * 체크리스트 항목 업데이트 (API)
 */
export async function updateChecklistItemAsync(
  id: string,
  checklistItemId: string,
  isCompleted: boolean,
  completedBy?: string
): Promise<ProgressStage | null> {
  try {
    return await progressStageApi.updateChecklist(id, checklistItemId, isCompleted, completedBy);
  } catch {
    return null;
  }
}

/**
 * 진행 단계 삭제 (API)
 */
export async function deleteProgressStageAsync(id: string): Promise<boolean> {
  try {
    await progressStageApi.delete(id);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getProgressStages(): ProgressStage[] {
  console.warn('getProgressStages is deprecated. Use getProgressStageByCustomerIdAsync instead.');
  return [];
}

export function getProgressStageById(id: string): ProgressStage | null {
  console.warn('getProgressStageById is deprecated. Use getProgressStageByIdAsync instead.');
  return null;
}

export function getProgressStageByCustomerId(customerId: string): ProgressStage | null {
  console.warn('getProgressStageByCustomerId is deprecated. Use getProgressStageByCustomerIdAsync instead.');
  return null;
}

export function saveProgressStage(stage: ProgressStage): ProgressStage {
  console.warn('saveProgressStage is deprecated. Use createProgressStageAsync instead.');
  return stage;
}

export function updateProgressStage(id: string, data: Partial<ProgressStage>): ProgressStage | null {
  console.warn('updateProgressStage is deprecated. Use updateStageAsync instead.');
  return null;
}

export function transitionToNextStage(id: string, notes?: string): ProgressStage | null {
  console.warn('transitionToNextStage is deprecated. Use updateStageAsync instead.');
  return null;
}

export function updateChecklistItem(
  id: string,
  checklistItemId: string,
  isCompleted: boolean,
  completedBy?: string
): ProgressStage | null {
  console.warn('updateChecklistItem is deprecated. Use updateChecklistItemAsync instead.');
  return null;
}

export function deleteProgressStage(id: string): boolean {
  console.warn('deleteProgressStage is deprecated. Use deleteProgressStageAsync instead.');
  return false;
}
