/**
 * 진행 단계 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 진행 단계 데이터 관리
 * - 7단계 워크플로우: 문의접수→견적서송부→시험의뢰요청→계약체결→시험접수→시험관리→자금관리
 * - Requirements: 4.1, 4.2, 4.3, 4.4, 4.6
 */

import { ProgressStage, ChecklistItem, StageHistoryItem } from '@/types/customer';

const PROGRESS_STAGES_STORAGE_KEY = 'chemon_progress_stages';

// 7단계 워크플로우 정의
export const WORKFLOW_STAGES = [
  'inquiry',           // 문의접수
  'quotation_sent',    // 견적서 송부
  'test_request',      // 시험 의뢰 요청
  'contract_signed',   // 계약 체결
  'test_reception',    // 시험접수
  'test_management',   // 시험관리
  'fund_management',   // 자금관리
] as const;

export type WorkflowStage = typeof WORKFLOW_STAGES[number];

// 단계별 한글 라벨
export const STAGE_LABELS: Record<WorkflowStage, string> = {
  inquiry: '문의접수',
  quotation_sent: '견적서 송부',
  test_request: '시험 의뢰 요청',
  contract_signed: '계약 체결',
  test_reception: '시험접수',
  test_management: '시험관리',
  fund_management: '자금관리',
};

// 단계별 기본 체크리스트 템플릿
export const DEFAULT_CHECKLISTS: Record<WorkflowStage, Omit<ChecklistItem, 'id' | 'is_completed' | 'completed_at' | 'completed_by'>[]> = {
  inquiry: [
    { stage: 'inquiry', title: '고객 문의 내용 확인', description: '고객의 시험 요청 내용을 상세히 파악' },
    { stage: 'inquiry', title: '담당자 정보 확인', description: '의뢰자 연락처 및 담당자 정보 확인' },
    { stage: 'inquiry', title: '시험 가능 여부 검토', description: '요청된 시험의 수행 가능 여부 내부 검토' },
  ],
  quotation_sent: [
    { stage: 'quotation_sent', title: '견적서 작성', description: '시험 항목 및 금액이 포함된 견적서 작성' },
    { stage: 'quotation_sent', title: '견적서 내부 검토', description: '견적서 내용 및 금액 내부 승인' },
    { stage: 'quotation_sent', title: '견적서 발송', description: '고객에게 견적서 이메일 또는 우편 발송' },
  ],
  test_request: [
    { stage: 'test_request', title: '시험 의뢰서 수령', description: '고객으로부터 공식 시험 의뢰서 수령' },
    { stage: 'test_request', title: '의뢰 내용 확인', description: '의뢰서 내용과 견적서 내용 일치 여부 확인' },
    { stage: 'test_request', title: '시험 일정 협의', description: '시험 시작일 및 완료 예정일 협의' },
  ],
  contract_signed: [
    { stage: 'contract_signed', title: '계약서 작성', description: '시험 계약서 초안 작성' },
    { stage: 'contract_signed', title: '계약 조건 협의', description: '지급 조건, 일정 등 계약 조건 협의' },
    { stage: 'contract_signed', title: '계약서 서명', description: '양측 계약서 서명 완료' },
    { stage: 'contract_signed', title: '계약서 보관', description: '서명된 계약서 스캔 및 보관' },
  ],
  test_reception: [
    { stage: 'test_reception', title: '시험번호 부여', description: '내부 시험번호 생성 및 부여' },
    { stage: 'test_reception', title: '시험책임자 배정', description: '담당 시험책임자 지정' },
    { stage: 'test_reception', title: '시험물질 접수', description: '시험물질 수령 및 상태 확인' },
    { stage: 'test_reception', title: '시험 접수 등록', description: '시스템에 시험 접수 정보 등록' },
  ],
  test_management: [
    { stage: 'test_management', title: '시험 진행 상황 모니터링', description: '시험 진행 상황 주기적 확인' },
    { stage: 'test_management', title: '중간 보고', description: '필요시 고객에게 중간 진행 상황 보고' },
    { stage: 'test_management', title: '시험 완료 확인', description: '모든 시험 항목 완료 확인' },
    { stage: 'test_management', title: '최종 보고서 작성', description: '시험 결과 최종 보고서 작성' },
    { stage: 'test_management', title: '보고서 발송', description: '고객에게 최종 보고서 발송' },
  ],
  fund_management: [
    { stage: 'fund_management', title: '세금계산서 발행', description: '계약 조건에 따른 세금계산서 발행' },
    { stage: 'fund_management', title: '입금 확인', description: '고객 입금 확인' },
    { stage: 'fund_management', title: '수금 완료 처리', description: '모든 금액 수금 완료 확인 및 처리' },
  ],
};

// 모든 진행 단계 조회
export function getAllProgressStages(): ProgressStage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(PROGRESS_STAGES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 진행 단계 조회
export function getProgressStageById(id: string): ProgressStage | null {
  const stages = getAllProgressStages();
  return stages.find(s => s.id === id) || null;
}

// 고객사별 진행 단계 조회
export function getProgressStageByCustomerId(customerId: string): ProgressStage | null {
  const stages = getAllProgressStages();
  return stages.find(s => s.customer_id === customerId) || null;
}

// 특정 단계의 기본 체크리스트 생성
function createDefaultChecklist(stage: WorkflowStage): ChecklistItem[] {
  const templates = DEFAULT_CHECKLISTS[stage];
  return templates.map((template, index) => ({
    ...template,
    id: `${stage}-${index + 1}`,
    is_completed: false,
  }));
}

// 모든 단계의 체크리스트 생성
function createAllChecklists(): ChecklistItem[] {
  const allChecklists: ChecklistItem[] = [];
  for (const stage of WORKFLOW_STAGES) {
    allChecklists.push(...createDefaultChecklist(stage));
  }
  return allChecklists;
}

// 진행 단계 저장
export function saveProgressStage(progressStage: ProgressStage): ProgressStage {
  const stages = getAllProgressStages();
  const existingIndex = stages.findIndex(s => s.id === progressStage.id);
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    stages[existingIndex] = { ...progressStage, updated_at: now };
  } else {
    const newStage = {
      ...progressStage,
      created_at: progressStage.created_at || now,
      updated_at: now,
    };
    stages.unshift(newStage);
  }
  
  localStorage.setItem(PROGRESS_STAGES_STORAGE_KEY, JSON.stringify(stages));
  return existingIndex >= 0 ? stages[existingIndex] : stages[0];
}

// 새 진행 단계 생성 (고객사용)
export function createProgressStage(
  customerId: string,
  quotationId?: string,
  contractId?: string
): ProgressStage {
  const now = new Date().toISOString();
  
  const progressStage: ProgressStage = {
    id: `progress-${customerId}-${Date.now()}`,
    customer_id: customerId,
    quotation_id: quotationId,
    contract_id: contractId,
    current_stage: 'inquiry',
    checklist: createAllChecklists(),
    stage_history: [
      {
        stage: 'inquiry',
        entered_at: now,
      },
    ],
    created_at: now,
    updated_at: now,
  };
  
  return saveProgressStage(progressStage);
}

// 단계 전환
export function updateStage(
  id: string,
  newStage: WorkflowStage,
  notes?: string
): ProgressStage | null {
  const stages = getAllProgressStages();
  const index = stages.findIndex(s => s.id === id);
  
  if (index < 0) return null;
  
  const currentProgress = stages[index];
  const now = new Date().toISOString();
  
  // 현재 단계 완료 처리
  const updatedHistory = currentProgress.stage_history.map(h => {
    if (h.stage === currentProgress.current_stage && !h.completed_at) {
      return { ...h, completed_at: now, notes };
    }
    return h;
  });
  
  // 새 단계 이력 추가
  updatedHistory.push({
    stage: newStage,
    entered_at: now,
  });
  
  stages[index] = {
    ...currentProgress,
    current_stage: newStage,
    stage_history: updatedHistory,
    updated_at: now,
  };
  
  localStorage.setItem(PROGRESS_STAGES_STORAGE_KEY, JSON.stringify(stages));
  return stages[index];
}

// 체크리스트 항목 업데이트
export function updateChecklist(
  progressId: string,
  checklistItemId: string,
  isCompleted: boolean,
  completedBy?: string
): ProgressStage | null {
  const stages = getAllProgressStages();
  const index = stages.findIndex(s => s.id === progressId);
  
  if (index < 0) return null;
  
  const now = new Date().toISOString();
  
  const updatedChecklist = stages[index].checklist.map(item => {
    if (item.id === checklistItemId) {
      return {
        ...item,
        is_completed: isCompleted,
        completed_at: isCompleted ? now : undefined,
        completed_by: isCompleted ? completedBy : undefined,
      };
    }
    return item;
  });
  
  stages[index] = {
    ...stages[index],
    checklist: updatedChecklist,
    updated_at: now,
  };
  
  localStorage.setItem(PROGRESS_STAGES_STORAGE_KEY, JSON.stringify(stages));
  return stages[index];
}

// 특정 단계의 체크리스트 조회
export function getChecklistByStage(progressId: string, stage: WorkflowStage): ChecklistItem[] {
  const progress = getProgressStageById(progressId);
  if (!progress) return [];
  
  return progress.checklist.filter(item => item.stage === stage);
}

// 특정 단계의 체크리스트 완료 여부 확인
export function isStageChecklistComplete(progressId: string, stage: WorkflowStage): boolean {
  const checklist = getChecklistByStage(progressId, stage);
  if (checklist.length === 0) return false;
  
  return checklist.every(item => item.is_completed);
}

// 다음 단계로 진행 가능 여부 확인
export function canAdvanceToNextStage(progressId: string): boolean {
  const progress = getProgressStageById(progressId);
  if (!progress) return false;
  
  return isStageChecklistComplete(progressId, progress.current_stage);
}

// 다음 단계 가져오기
export function getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
  if (currentIndex < 0 || currentIndex >= WORKFLOW_STAGES.length - 1) {
    return null;
  }
  return WORKFLOW_STAGES[currentIndex + 1];
}

// 이전 단계 가져오기
export function getPreviousStage(currentStage: WorkflowStage): WorkflowStage | null {
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
  if (currentIndex <= 0) {
    return null;
  }
  return WORKFLOW_STAGES[currentIndex - 1];
}

// 단계 인덱스 가져오기 (0부터 시작)
export function getStageIndex(stage: WorkflowStage): number {
  return WORKFLOW_STAGES.indexOf(stage);
}

// 단계가 완료되었는지 확인
export function isStageCompleted(progressId: string, stage: WorkflowStage): boolean {
  const progress = getProgressStageById(progressId);
  if (!progress) return false;
  
  const historyItem = progress.stage_history.find(h => h.stage === stage);
  return historyItem?.completed_at !== undefined;
}

// 진행 단계 삭제
export function deleteProgressStage(id: string): boolean {
  const stages = getAllProgressStages();
  const filtered = stages.filter(s => s.id !== id);
  
  if (filtered.length === stages.length) return false;
  
  localStorage.setItem(PROGRESS_STAGES_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 다음 단계로 진행 (체크리스트 완료 여부 확인 후)
export function advanceToNextStage(
  progressId: string,
  force: boolean = false,
  notes?: string
): { success: boolean; progress: ProgressStage | null; warning?: string } {
  const progress = getProgressStageById(progressId);
  if (!progress) {
    return { success: false, progress: null };
  }
  
  const nextStage = getNextStage(progress.current_stage);
  if (!nextStage) {
    return { success: false, progress, warning: '이미 마지막 단계입니다.' };
  }
  
  const isComplete = isStageChecklistComplete(progressId, progress.current_stage);
  
  if (!isComplete && !force) {
    return { 
      success: false, 
      progress, 
      warning: '현재 단계의 체크리스트가 완료되지 않았습니다. 강제 진행하시겠습니까?' 
    };
  }
  
  const updatedProgress = updateStage(progressId, nextStage, notes);
  return { 
    success: true, 
    progress: updatedProgress,
    warning: !isComplete ? '체크리스트 미완료 상태에서 강제 진행되었습니다.' : undefined
  };
}
