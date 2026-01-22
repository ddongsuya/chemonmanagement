import { create } from 'zustand';
import { QuotationItem, AnalysisCost, Test } from '@/types';
import { ToxicityTest } from '@/lib/master-api';

// 새로운 독성시험 선택 항목 타입
export interface SelectedToxicityTest {
  id: string;
  test: ToxicityTest;
  displayName: string;
  selectedRoute?: string;
  includeAnalysis: boolean;
  quantity: number;
}

interface QuotationState {
  // 마법사 단계
  currentStep: number;
  
  // Step 1: 기본정보
  customerId: string;
  customerName: string;
  projectName: string;
  validDays: number;
  notes: string;
  
  // Step 2: 모달리티
  modality: string;
  
  // Step 3: 선택된 시험 (기존 - 레거시)
  selectedItems: QuotationItem[];
  
  // Step 3: 선택된 독성시험 (새 구조)
  selectedToxicityTests: SelectedToxicityTest[];
  
  // Step 4: 계산
  analysisCost: AnalysisCost;
  discountRate: number;
  discountReason: string;
  
  // 계산된 값
  subtotalTest: number;
  subtotalAnalysis: number;
  discountAmount: number;
  totalAmount: number;
  
  // 액션
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setBasicInfo: (info: {
    customerId: string;
    customerName: string;
    projectName: string;
    validDays: number;
    notes: string;
  }) => void;
  setCustomer: (id: string, name: string) => void;
  setProjectName: (name: string) => void;
  setModality: (modality: string) => void;
  setValidDays: (days: number) => void;
  setNotes: (notes: string) => void;
  addItem: (test: Test, isOption?: boolean, parentItemId?: string | null) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<QuotationItem>) => void;
  clearItems: () => void;
  moveItem: (itemId: string, direction: 'up' | 'down') => void;
  reorderItems: (newItems: QuotationItem[]) => void;
  setDiscountRate: (rate: number) => void;
  setDiscountReason: (reason: string) => void;
  reset: () => void;
  
  // 새 독성시험 관련 액션
  setSelectedToxicityTests: (tests: SelectedToxicityTest[]) => void;
  addToxicityTest: (test: SelectedToxicityTest) => void;
  removeToxicityTest: (id: string) => void;
  updateToxicityTest: (id: string, updates: Partial<SelectedToxicityTest>) => void;
  clearToxicityTests: () => void;
  getToxicityTestsTotal: () => number;
  
  // 유효성 검사
  validate: () => { isValid: boolean; errors: string[] };
}

const initialAnalysisCost: AnalysisCost = {
  validation_invivo: false,
  validation_invitro: false,
  validation_cost: 0,
  analysis_count: 0,
  analysis_cost: 0,
  total_cost: 0,
};

const initialState = {
  currentStep: 1,
  customerId: '',
  customerName: '',
  projectName: '',
  modality: '',
  validDays: 30,
  notes: '',
  selectedItems: [] as QuotationItem[],
  selectedToxicityTests: [] as SelectedToxicityTest[],
  analysisCost: initialAnalysisCost,
  discountRate: 0,
  discountReason: '',
  subtotalTest: 0,
  subtotalAnalysis: 0,
  discountAmount: 0,
  totalAmount: 0,
};

// ToxicityTest를 레거시 Test 타입으로 변환
const convertToxicityTestToLegacy = (
  toxicityTest: ToxicityTest,
  displayName: string,
  includeAnalysis: boolean
): Test => {
  const priceStr = includeAnalysis 
    ? toxicityTest.priceWithAnalysis 
    : toxicityTest.price;
  const price = priceStr ? parseInt(priceStr.replace(/,/g, ''), 10) : 0;

  return {
    test_id: `toxicity-${toxicityTest.itemId}`,
    modality: '',
    category_code: toxicityTest.category || '',
    category_name: toxicityTest.category || '',
    source_file: toxicityTest.sheet || '',
    sub_category: toxicityTest.subcategory || null,
    oecd_code: toxicityTest.oecd || '',
    test_type: toxicityTest.testType || 'in vivo',
    test_name: displayName,
    animal_species: toxicityTest.species || null,
    dosing_period: toxicityTest.duration || null,
    route: toxicityTest.routes || null,
    lead_time_weeks: toxicityTest.leadTime ? parseInt(toxicityTest.leadTime) : null,
    unit_price: price,
    remarks: toxicityTest.remarks || null,
    glp_status: 'GLP',
    clinical_phase: '',
    guidelines: toxicityTest.oecd || '',
    test_class: '본시험',
    parent_test_id: null,
    option_type: null,
    analysis_count: 1,
    analysis_excluded: null,
    animals_per_sex: toxicityTest.animalsPerSex || null,
    sex_type: toxicityTest.sexConfig || null,
    control_groups: toxicityTest.controlGroups || null,
    test_groups: toxicityTest.testGroups || null,
    total_groups: toxicityTest.totalGroups || null,
  };
};

// 조제물분석 비용 계산 (v2)
const calculateAnalysisCost = (items: QuotationItem[]): AnalysisCost => {
  const VALIDATION_COST = 10000000; // 1천만원
  const ANALYSIS_UNIT_COST = 1000000; // 1백만원

  let hasInVivo = false;
  let hasInVitro = false;
  let totalAnalysisCount = 0;

  items.forEach((item) => {
    const test = item.test;
    // v2: analysis_excluded가 null이면 분석 포함
    if (!test.analysis_excluded) {
      if (test.test_type === 'in vivo') {
        hasInVivo = true;
        totalAnalysisCount += test.analysis_count || 1;
      } else if (test.test_type === 'in vitro') {
        hasInVitro = true;
        totalAnalysisCount += test.analysis_count || 1;
      }
    }
  });

  const validation_cost =
    (hasInVivo ? VALIDATION_COST : 0) + (hasInVitro ? VALIDATION_COST : 0);
  const analysis_cost = totalAnalysisCount * ANALYSIS_UNIT_COST;

  return {
    validation_invivo: hasInVivo,
    validation_invitro: hasInVitro,
    validation_cost,
    analysis_count: totalAnalysisCount,
    analysis_cost,
    total_cost: validation_cost + analysis_cost,
  };
};

// 모든 금액 재계산
const recalculateAll = (
  items: QuotationItem[],
  discountRate: number
) => {
  const subtotalTest = items.reduce((sum, item) => sum + item.amount, 0);
  const analysisCost = calculateAnalysisCost(items);
  const subtotalAnalysis = analysisCost.total_cost;
  const subtotal = subtotalTest + subtotalAnalysis;
  const discountAmount = Math.floor(subtotal * (discountRate / 100));
  const totalAmount = subtotal - discountAmount;

  return {
    subtotalTest,
    analysisCost,
    subtotalAnalysis,
    discountAmount,
    totalAmount,
  };
};

export const useQuotationStore = create<QuotationState>((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  setBasicInfo: (info) =>
    set({
      customerId: info.customerId,
      customerName: info.customerName,
      projectName: info.projectName,
      validDays: info.validDays,
      notes: info.notes,
    }),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setProjectName: (name) => set({ projectName: name }),

  setModality: (modality) =>
    set((state) => ({
      modality,
      // 모달리티 변경 시 선택된 시험 초기화
      selectedItems: state.modality !== modality ? [] : state.selectedItems,
      ...(state.modality !== modality
        ? {
            subtotalTest: 0,
            subtotalAnalysis: 0,
            analysisCost: initialAnalysisCost,
            discountAmount: 0,
            totalAmount: 0,
          }
        : {}),
    })),

  setValidDays: (days) => set({ validDays: days }),
  setNotes: (notes) => set({ notes }),

  addItem: (test, isOption = false, parentItemId = null) => {
    const state = get();
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      test,
      quantity: 1,
      unit_price: test.unit_price || 0,
      amount: test.unit_price || 0,
      is_option: isOption,
      parent_item_id: parentItemId,
      sort_order: state.selectedItems.length,
    };

    const newItems = [...state.selectedItems, newItem];
    const calculated = recalculateAll(newItems, state.discountRate);

    set({
      selectedItems: newItems,
      ...calculated,
    });
  },

  removeItem: (itemId) => {
    const state = get();
    // 본시험 삭제 시 연결된 옵션도 함께 삭제
    const itemToRemove = state.selectedItems.find((item) => item.id === itemId);
    let newItems = state.selectedItems.filter((item) => item.id !== itemId);

    if (itemToRemove && !itemToRemove.is_option) {
      // 본시험인 경우 연결된 옵션도 삭제
      newItems = newItems.filter((item) => item.parent_item_id !== itemId);
    }

    const calculated = recalculateAll(newItems, state.discountRate);

    set({
      selectedItems: newItems,
      ...calculated,
    });
  },

  updateItem: (itemId, updates) => {
    const state = get();
    const newItems = state.selectedItems.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    const calculated = recalculateAll(newItems, state.discountRate);

    set({
      selectedItems: newItems,
      ...calculated,
    });
  },

  clearItems: () =>
    set({
      selectedItems: [],
      subtotalTest: 0,
      subtotalAnalysis: 0,
      analysisCost: initialAnalysisCost,
      discountAmount: 0,
      totalAmount: 0,
    }),

  moveItem: (itemId, direction) => {
    const state = get();
    const items = [...state.selectedItems];
    const currentIndex = items.findIndex((item) => item.id === itemId);
    
    if (currentIndex === -1) return;
    
    const item = items[currentIndex];
    
    // 옵션은 이동 불가 (본시험만 이동 가능)
    if (item.is_option) return;
    
    // 본시험만 필터링하여 인덱스 계산
    const mainItems = items.filter((i) => !i.is_option);
    const mainIndex = mainItems.findIndex((i) => i.id === itemId);
    
    if (direction === 'up' && mainIndex > 0) {
      // 위로 이동: 이전 본시험과 위치 교환
      const prevMainItem = mainItems[mainIndex - 1];
      const prevMainIndex = items.findIndex((i) => i.id === prevMainItem.id);
      
      // 현재 항목과 연결된 옵션들
      const currentOptions = items.filter((i) => i.parent_item_id === itemId);
      // 이전 항목과 연결된 옵션들
      const prevOptions = items.filter((i) => i.parent_item_id === prevMainItem.id);
      
      // 새 배열 구성
      const newItems: QuotationItem[] = [];
      items.forEach((i) => {
        if (i.id === prevMainItem.id || i.parent_item_id === prevMainItem.id) return;
        if (i.id === itemId || i.parent_item_id === itemId) return;
        
        // 이전 본시험 위치에 현재 항목 삽입
        if (newItems.length === prevMainIndex) {
          newItems.push(item, ...currentOptions);
        }
        newItems.push(i);
      });
      
      // 현재 항목 위치에 이전 항목 삽입
      const insertIndex = newItems.findIndex((i) => i.id === item.id);
      if (insertIndex !== -1) {
        newItems.splice(insertIndex + 1 + currentOptions.length, 0, prevMainItem, ...prevOptions);
      }
      
      set({ selectedItems: newItems });
    } else if (direction === 'down' && mainIndex < mainItems.length - 1) {
      // 아래로 이동: 다음 본시험과 위치 교환
      const nextMainItem = mainItems[mainIndex + 1];
      
      // 현재 항목과 연결된 옵션들
      const currentOptions = items.filter((i) => i.parent_item_id === itemId);
      // 다음 항목과 연결된 옵션들
      const nextOptions = items.filter((i) => i.parent_item_id === nextMainItem.id);
      
      // 새 배열 구성
      const newItems: QuotationItem[] = [];
      let skipNext = false;
      
      for (let i = 0; i < items.length; i++) {
        const curr = items[i];
        
        if (curr.id === itemId) {
          // 현재 항목 대신 다음 항목 삽입
          newItems.push(nextMainItem, ...nextOptions);
          skipNext = true;
          continue;
        }
        
        if (curr.parent_item_id === itemId) continue; // 현재 옵션 스킵
        
        if (curr.id === nextMainItem.id) {
          // 다음 항목 대신 현재 항목 삽입
          newItems.push(item, ...currentOptions);
          continue;
        }
        
        if (curr.parent_item_id === nextMainItem.id) continue; // 다음 옵션 스킵
        
        newItems.push(curr);
      }
      
      set({ selectedItems: newItems });
    }
  },

  reorderItems: (newItems) => {
    const state = get();
    const calculated = recalculateAll(newItems, state.discountRate);
    set({
      selectedItems: newItems,
      ...calculated,
    });
  },

  setDiscountRate: (rate) => {
    const state = get();
    const calculated = recalculateAll(state.selectedItems, rate);
    set({
      discountRate: rate,
      discountAmount: calculated.discountAmount,
      totalAmount: calculated.totalAmount,
    });
  },

  setDiscountReason: (reason) => set({ discountReason: reason }),

  reset: () => set(initialState),

  // 새 독성시험 관련 액션
  setSelectedToxicityTests: (tests) => set({ selectedToxicityTests: tests }),

  addToxicityTest: (test) => {
    const state = get();
    
    // 레거시 Test 타입으로 변환
    const legacyTest = convertToxicityTestToLegacy(
      test.test,
      test.displayName,
      test.includeAnalysis
    );
    
    // 레거시 QuotationItem 생성
    const newItem: QuotationItem = {
      id: test.id,
      test: legacyTest,
      quantity: test.quantity,
      unit_price: legacyTest.unit_price || 0,
      amount: (legacyTest.unit_price || 0) * test.quantity,
      is_option: false,
      parent_item_id: null,
      sort_order: state.selectedItems.length,
    };
    
    const newItems = [...state.selectedItems, newItem];
    const calculated = recalculateAll(newItems, state.discountRate);
    
    set({
      selectedToxicityTests: [...state.selectedToxicityTests, test],
      selectedItems: newItems,
      ...calculated,
    });
  },

  removeToxicityTest: (id) => {
    const state = get();
    const newItems = state.selectedItems.filter((item) => item.id !== id);
    const calculated = recalculateAll(newItems, state.discountRate);
    
    set({
      selectedToxicityTests: state.selectedToxicityTests.filter((t) => t.id !== id),
      selectedItems: newItems,
      ...calculated,
    });
  },

  updateToxicityTest: (id, updates) =>
    set((state) => ({
      selectedToxicityTests: state.selectedToxicityTests.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  clearToxicityTests: () => {
    set({
      selectedToxicityTests: [],
      selectedItems: [],
      subtotalTest: 0,
      subtotalAnalysis: 0,
      analysisCost: initialAnalysisCost,
      discountAmount: 0,
      totalAmount: 0,
    });
  },

  getToxicityTestsTotal: () => {
    const state = get();
    return state.selectedToxicityTests.reduce((sum, item) => {
      const priceStr = item.includeAnalysis
        ? item.test.priceWithAnalysis
        : item.test.price;
      const price = priceStr ? parseInt(priceStr.replace(/,/g, ''), 10) : 0;
      return sum + (isNaN(price) ? 0 : price) * item.quantity;
    }, 0);
  },

  validate: () => {
    const state = get();
    const errors: string[] = [];

    // 필수 필드 검사
    if (!state.customerName || state.customerName.trim() === '') {
      errors.push('고객명을 입력해주세요.');
    }

    if (!state.projectName || state.projectName.trim() === '') {
      errors.push('프로젝트명을 입력해주세요.');
    }

    // 시험 항목 검사
    if (state.selectedItems.length === 0 && state.selectedToxicityTests.length === 0) {
      errors.push('최소 1개 이상의 시험 항목을 선택해주세요.');
    }

    // 금액 검사
    if (state.totalAmount <= 0) {
      errors.push('총 금액이 0원 이하입니다. 시험 항목을 확인해주세요.');
    }

    // 유효기간 검사
    if (state.validDays <= 0) {
      errors.push('유효기간은 1일 이상이어야 합니다.');
    }

    // 할인율 검사
    if (state.discountRate < 0 || state.discountRate > 100) {
      errors.push('할인율은 0~100% 사이여야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
}));
