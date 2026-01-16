import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  WorkflowQuotationState,
  SelectedModality,
  ProjectType,
  ClinicalPhase,
  WorkflowSelectedTest,
  TestOptions,
  ValidationResult,
} from '@/types/workflow-quotation';

const initialState = {
  currentStep: 1 as const,
  selectedModality: null as SelectedModality | null,
  projectType: null as ProjectType | null,
  targetPhase: null as ClinicalPhase | null,
  selectedTests: [] as WorkflowSelectedTest[],
  validationResults: [] as ValidationResult[],
  totalPrice: 0,
};

// 옵션 가격 계산 헬퍼
function calculateOptionPrice(options: TestOptions, basePrice: number): number {
  let optionPrice = 0;

  if (options.includeTK) {
    optionPrice += basePrice * 0.2; // 20% 추가
  }

  if (options.includeRecovery) {
    optionPrice += basePrice * 0.3; // 30% 추가
  }

  if (options.additionalGroups) {
    optionPrice += basePrice * 0.15 * options.additionalGroups; // 군당 15%
  }

  return optionPrice;
}

export const useWorkflowQuotationStore = create<WorkflowQuotationState>()(
  devtools(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setModality: (modality: SelectedModality) =>
        set({
          selectedModality: modality,
          // 모달리티 변경 시 이후 선택 초기화
          selectedTests: [],
          validationResults: [],
          totalPrice: 0,
        }),

      setProjectType: (type: ProjectType, phase?: ClinicalPhase) =>
        set({
          projectType: type,
          targetPhase: phase || null,
        }),

      addTest: (test: WorkflowSelectedTest) =>
        set((state) => {
          const exists = state.selectedTests.find((t) => t.testId === test.testId);
          if (exists) return state;

          const newTests = [...state.selectedTests, test].sort(
            (a, b) => a.workflowOrder - b.workflowOrder
          );

          return {
            selectedTests: newTests,
            totalPrice: newTests.reduce((sum, t) => sum + t.totalPrice, 0),
          };
        }),

      removeTest: (testId: string) =>
        set((state) => {
          const newTests = state.selectedTests.filter((t) => t.testId !== testId);
          return {
            selectedTests: newTests,
            totalPrice: newTests.reduce((sum, t) => sum + t.totalPrice, 0),
          };
        }),

      updateTestOptions: (testId: string, options: Partial<TestOptions>) =>
        set((state) => {
          const newTests = state.selectedTests.map((test) => {
            if (test.testId !== testId) return test;

            const newOptions = { ...test.options, ...options };
            const optionPrice = calculateOptionPrice(newOptions, test.basePrice);

            return {
              ...test,
              options: newOptions,
              optionPrice,
              totalPrice: test.basePrice + optionPrice,
            };
          });

          return {
            selectedTests: newTests,
            totalPrice: newTests.reduce((sum, t) => sum + t.totalPrice, 0),
          };
        }),

      setValidationResults: (results: ValidationResult[]) =>
        set({
          validationResults: results,
        }),

      acknowledgeValidation: (id: string) =>
        set((state) => ({
          validationResults: state.validationResults.map((v) =>
            v.id === id ? { ...v, acknowledged: true } : v
          ),
        })),

      reset: () => set(initialState),
    }),
    { name: 'workflow-quotation-store' }
  )
);
