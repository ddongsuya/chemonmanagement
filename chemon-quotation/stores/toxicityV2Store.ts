import { create } from 'zustand';
import type {
  TestMode,
  RouteType,
  StandardType,
  SelectedTest,
  QuotationInfo,
  ToxicityV2Item,
} from '@/types/toxicity-v2';
import {
  getItemPrice,
  getComboPrice,
  calcFormulationCost,
  calculateTotal,
} from '@/lib/toxicity-v2/priceEngine';
import { OV_OVERLAY, OE_OVERLAY } from '@/lib/toxicity-v2/data/overlays';
import { IM_MAPPING } from '@/lib/toxicity-v2/data/metadata';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';

const defaultInfo: QuotationInfo = {
  org: '',
  person: '',
  contact: '',
  email: '',
  purpose: '',
  substance: '',
  quotationNumber: '',
};

interface ToxicityV2State {
  // 모드 및 옵션
  mode: TestMode | null;
  route: RouteType;
  standard: StandardType;
  comboType: 2 | 3 | 4;

  // 선택된 시험 항목
  selectedTests: SelectedTest[];

  // 견적서 정보
  info: QuotationInfo;

  // 할인
  discountRate: number;
  discountReason: string;

  // 미리보기 탭
  previewTab: 'cover' | 'quote' | 'detail' | 'all';

  // 계산된 값 (파생)
  subtotalTest: number;
  formulationCost: number;
  discountAmount: number;
  totalAmount: number;

  // 액션
  setMode: (mode: TestMode | null, keepItems?: boolean) => void;
  setRoute: (route: RouteType) => void;
  setStandard: (standard: StandardType) => void;
  setComboType: (type: 2 | 3 | 4) => void;
  addTest: (test: SelectedTest) => void;
  removeTest: (id: string) => void;
  toggleTest: (itemId: number, allItems: ToxicityV2Item[]) => void;
  updateTestName: (id: string, customName: string) => void;
  updateTestPrice: (id: string, customPrice: number) => void;
  setInfo: (info: Partial<QuotationInfo>) => void;
  setDiscountRate: (rate: number) => void;
  setDiscountReason: (reason: string) => void;
  setPreviewTab: (tab: 'cover' | 'quote' | 'detail' | 'all') => void;
  recalculate: () => void;
  reset: () => void;
}

/**
 * 선택된 시험 항목의 가격을 현재 옵션(route, standard, comboType)에 맞게 재계산한다.
 */
function recalcPrices(
  tests: SelectedTest[],
  mode: TestMode | null,
  route: RouteType,
  standard: StandardType,
  comboType: 2 | 3 | 4
): SelectedTest[] {
  if (!mode) return tests;

  return tests.map((t) => {
    if (mode === 'drug_single') {
      const item = TOXICITY_DATA.find((d) => d.id === t.itemId);
      if (item) {
        const price = getItemPrice(item, route, standard, OV_OVERLAY, OE_OVERLAY);
        return { ...t, price: price ?? 0 };
      }
    }
    // 복합제/기타 모드는 가격 구조가 다르므로 기존 가격 유지
    // (복합제는 comboType 변경 시 별도 처리)
    return t;
  });
}

export const useToxicityV2Store = create<ToxicityV2State>()((set, get) => ({
  // 초기 상태
  mode: null,
  route: 'oral' as RouteType,
  standard: 'KGLP' as StandardType,
  comboType: 2 as 2 | 3 | 4,
  selectedTests: [],
  info: { ...defaultInfo },
  discountRate: 0,
  discountReason: '',
  previewTab: 'cover' as const,
  subtotalTest: 0,
  formulationCost: 0,
  discountAmount: 0,
  totalAmount: 0,

  setMode: (mode, keepItems) => {
    if (keepItems) {
      // 기존 항목 유지하면서 모드만 변경
      set({ mode });
    } else {
      set({ mode, selectedTests: [], subtotalTest: 0, formulationCost: 0, discountAmount: 0, totalAmount: 0 });
    }
  },

  // Req 3.4: 투여 경로 변경 시 즉시 재계산
  setRoute: (route) => {
    const state = get();
    const updated = recalcPrices(state.selectedTests, state.mode, route, state.standard, state.comboType);
    set({ route, selectedTests: updated });
    // 파생 값 재계산
    get().recalculate();
  },

  // Req 4.4: 시험 기준 변경 시 즉시 재계산
  setStandard: (standard) => {
    const state = get();
    const updated = recalcPrices(state.selectedTests, state.mode, state.route, standard, state.comboType);
    set({ standard, selectedTests: updated });
    get().recalculate();
  },

  // Req 5.5: 복합제 종수 변경 시 즉시 재계산
  setComboType: (comboType) => {
    set({ comboType });
    get().recalculate();
  },

  // Req 15.2: 시험 추가 시 미리보기 즉시 업데이트
  addTest: (test) => {
    set((state) => ({ selectedTests: [...state.selectedTests, test] }));
    get().recalculate();
  },

  // Req 7.3: 본시험 제거 시 연쇄 삭제 (parentId 기반)
  removeTest: (id) => {
    set((state) => {
      const remaining = state.selectedTests.filter(
        (t) => t.id !== id && t.parentId !== id
      );
      return { selectedTests: remaining };
    });
    get().recalculate();
  },

  // 시험 항목 토글 (선택/해제)
  toggleTest: (itemId, allItems) => {
    const state = get();
    const existing = state.selectedTests.find((t) => t.itemId === itemId && !t.isOption);
    if (existing) {
      // 이미 선택된 항목 → 제거 (연쇄 삭제 포함)
      get().removeTest(existing.id);
    } else {
      // 새로 선택 → 가격 계산 후 추가
      const item = allItems.find((d) => d.id === itemId);
      if (!item) return;

      let price = 0;
      if (state.mode === 'drug_single') {
        const p = getItemPrice(
          item as ToxicityV2Item,
          state.route,
          state.standard,
          OV_OVERLAY,
          OE_OVERLAY
        );
        price = p ?? 0;
      } else if (state.mode === 'drug_combo') {
        price = getComboPrice(item as any, state.comboType);
      } else {
        // SimpleItem — 단일 가격
        price = (item as any).price ?? 0;
      }

      const newTest: SelectedTest = {
        id: crypto.randomUUID(),
        itemId: item.id,
        name: item.name,
        category: item.category,
        price,
        isOption: false,
        sourceMode: state.mode ?? undefined,
      };
      get().addTest(newTest);
    }
  },

  setInfo: (partial) => {
    set((state) => ({ info: { ...state.info, ...partial } }));
  },

  setDiscountRate: (rate) => {
    set({ discountRate: rate });
    get().recalculate();
  },

  setDiscountReason: (reason) => {
    set({ discountReason: reason });
  },

  updateTestName: (id, customName) => {
    set((state) => ({
      selectedTests: state.selectedTests.map((t) =>
        t.id === id ? { ...t, customName: customName || undefined } : t
      ),
    }));
  },

  updateTestPrice: (id, customPrice) => {
    set((state) => ({
      selectedTests: state.selectedTests.map((t) =>
        t.id === id ? { ...t, customPrice } : t
      ),
    }));
    get().recalculate();
  },

  setPreviewTab: (tab) => {
    set({ previewTab: tab });
  },

  // Req 15.3: 가격 재계산
  recalculate: () => {
    const { selectedTests, mode, discountRate } = get();
    // customPrice가 설정된 항목은 해당 가격을 사용
    const effectiveTests = selectedTests.map((t) =>
      t.customPrice !== undefined ? { ...t, price: t.customPrice } : t
    );
    const formCost = calcFormulationCost(effectiveTests, mode ?? 'drug_single', TOXICITY_DATA, IM_MAPPING);
    const totalFormulation = formCost.assayBase + formCost.contentTotal + formCost.hfFormulation;
    const totals = calculateTotal(effectiveTests, totalFormulation, discountRate);

    set({
      subtotalTest: totals.subtotalTest,
      formulationCost: totalFormulation,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
    });
  },

  reset: () => {
    set({
      mode: null,
      route: 'oral',
      standard: 'KGLP',
      comboType: 2,
      selectedTests: [],
      info: { ...defaultInfo },
      discountRate: 0,
      discountReason: '',
      previewTab: 'cover',
      subtotalTest: 0,
      formulationCost: 0,
      discountAmount: 0,
      totalAmount: 0,
    });
  },
}));
