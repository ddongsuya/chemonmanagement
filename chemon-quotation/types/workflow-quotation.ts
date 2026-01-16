// 모달리티 3단계 분류
export interface ModalityLevel3 {
  level3_id: string;
  level3_name: string;
  level3_name_en: string;
}

export interface ModalityLevel2 {
  level2_id: string;
  level2_name: string;
  level2_name_en: string;
  level3: ModalityLevel3[];
}

export interface ModalityLevel1 {
  level1_id: string;
  level1_name: string;
  level1_name_en: string;
  icon: string;
  level2: ModalityLevel2[];
}

// 선택된 모달리티
export interface SelectedModality {
  level1: string;
  level1_name: string;
  level2: string;
  level2_name: string;
  level3: string;
  level3_name: string;
}

// 프로젝트 유형
export type ProjectType = 'ind_package' | 'single_test' | 'drf_only' | 'phase_extension';

export interface ProjectTypeOption {
  id: ProjectType;
  name: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

// 임상 단계
export type ClinicalPhase = 'PHASE1' | 'PHASE2' | 'PHASE3' | 'NDA';

// 워크플로우 단계
export interface WorkflowStage {
  stage_id: string;
  stage_name: string;
  stage_name_en: string;
  order: number;
  description: string;
}


// 시험 옵션
export interface TestOptions {
  species?: string;
  strain?: string;
  route?: string;
  duration?: string;
  includeTK?: boolean;
  includeRecovery?: boolean;
  additionalGroups?: number;
}

// 선택된 시험
export interface WorkflowSelectedTest {
  testId: string;
  testCode: string;
  testName: string;
  testNameEn: string;
  category: string;
  subcategory: string;
  options: TestOptions;
  basePrice: number;
  optionPrice: number;
  totalPrice: number;
  workflowStage: string;
  workflowOrder: number;
  relatedTests: string[];
  prerequisiteTests: string[];
  status: 'auto_added' | 'user_selected' | 'recommended';
  isRequired: boolean;
}

// 검증 결과
export interface ValidationResult {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  action?: 'block' | 'confirm' | 'suggest';
  suggestedTests?: string[];
  acknowledged?: boolean;
}

// 견적 세션 상태
export interface WorkflowQuotationState {
  // 현재 단계
  currentStep: 1 | 2 | 3 | 4;

  // Step 1: 모달리티
  selectedModality: SelectedModality | null;

  // Step 2: 프로젝트 유형
  projectType: ProjectType | null;
  targetPhase: ClinicalPhase | null;

  // Step 3: 선택된 시험
  selectedTests: WorkflowSelectedTest[];

  // 검증 결과
  validationResults: ValidationResult[];

  // 가격 합계
  totalPrice: number;

  // 액션
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setModality: (modality: SelectedModality) => void;
  setProjectType: (type: ProjectType, phase?: ClinicalPhase) => void;
  addTest: (test: WorkflowSelectedTest) => void;
  removeTest: (testId: string) => void;
  updateTestOptions: (testId: string, options: Partial<TestOptions>) => void;
  setValidationResults: (results: ValidationResult[]) => void;
  acknowledgeValidation: (id: string) => void;
  reset: () => void;
}
