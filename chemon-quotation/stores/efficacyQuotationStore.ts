/**
 * 효력시험 견적 V2 Zustand Store
 * 모델 기반 견적 시스템
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  StudyModelTemplate,
  StudyDesign,
  ScheduleStep,
  ScheduleStepType,
  StudyGroup,
  EvalItem,
  CostItem,
} from '@/types/efficacy-v2';
import { STUDY_MODELS, getModelById } from '@/lib/efficacy-v2/study-models';
import {
  calculateCostItems,
  calculateTotalCost,
  calculateCostByCategory,
  calculateTotalWeeks,
} from '@/lib/efficacy-v2/cost-engine';

// ============================================
// Helper
// ============================================

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** scheduleDurations 문자열 → ScheduleStep 변환 */
function parseDurations(durations: string[]): ScheduleStep[] {
  const typeGuess: ScheduleStepType[] = ['acclimation', 'induction', 'administration', 'analysis', 'report', 'observation'];
  return durations.map((d, i) => {
    const match = d.match(/^(\d+)-(week|day|hour)$/);
    const duration = match ? parseInt(match[1]) : 1;
    const unit = (match?.[2] ?? 'week') as 'week' | 'day' | 'hour';
    const type = typeGuess[i] ?? 'custom';
    const labels: Record<ScheduleStepType, string> = {
      acclimation: '순화', induction: '유발', administration: '투여',
      observation: '관찰', sacrifice: '부검', analysis: '분석',
      report: '보고서', cell_culture: '세포배양', custom: '기타',
    };
    return {
      id: uid(),
      order: i,
      label: labels[type],
      duration,
      durationUnit: unit,
      type,
      evalItems: [],
    };
  });
}

/** 모델에서 평가항목 파싱 */
function parseEvalItems(raw: string): EvalItem[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(name => ({
    id: uid(),
    name,
    code: '',
    category: '기타' as const,
    costBasis: 'PER_ANIMAL' as const,
    isOutsourced: false,
    isEnabled: true,
  }));
}

/** 모델에서 기본 군구성 생성 */
function createDefaultGroups(model: StudyModelTemplate): StudyGroup[] {
  const groups: StudyGroup[] = [
    { id: uid(), groupNumber: 1, treatment: 'NORMAL', label: '정상군', animalCount: 8 },
    { id: uid(), groupNumber: 2, treatment: 'VEHICLE', label: '유발군 (Vehicle)', animalCount: 8 },
    { id: uid(), groupNumber: 3, treatment: 'TEST', label: '시험군 1', animalCount: 8 },
    { id: uid(), groupNumber: 4, treatment: 'TEST', label: '시험군 2', animalCount: 8 },
  ];
  if (model.positiveControl) {
    groups.push({ id: uid(), groupNumber: 5, treatment: 'POSITIVE', label: '양성대조군', animalCount: 8 });
  }
  return groups;
}

// ============================================
// State Interface
// ============================================

export interface EfficacyQuotationState {
  // Tab navigation
  currentTab: number;

  // Model selection
  selectedModel: StudyModelTemplate | null;
  selectedCategory: string;

  // Study design (editable)
  scheduleSteps: ScheduleStep[];
  groups: StudyGroup[];
  evalItems: EvalItem[];
  designInfo: {
    species: string;
    sex: string;
    ageWeeks: number;
    animalsPerGroup: number;
    route: string;
    inductionMethod: string;
    positiveControl: string;
  };

  // Client info
  client: {
    org: string;
    name: string;
    phone: string;
    email: string;
  };

  // Cost
  costItems: CostItem[];
  totalCost: number;
  costByCategory: { name: string; value: number }[];

  // Quotation
  discount: number;   // 0~0.4
  margin: number;     // 0~0.3

  // Computed
  withProfit: number;
  discounted: number;
  vatIncluded: number;

  // Actions
  setTab: (tab: number) => void;
  setCategory: (cat: string) => void;
  selectModel: (model: StudyModelTemplate) => void;
  updateScheduleStep: (index: number, updates: Partial<ScheduleStep>) => void;
  addScheduleStep: (atIndex?: number) => void;
  removeScheduleStep: (index: number) => void;
  addGroup: () => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, updates: Partial<StudyGroup>) => void;
  updateEvalItem: (id: string, updates: Partial<EvalItem>) => void;
  addEvalItem: () => void;
  removeEvalItem: (id: string) => void;
  updateDesignInfo: (updates: Partial<EfficacyQuotationState['designInfo']>) => void;
  updateClient: (updates: Partial<EfficacyQuotationState['client']>) => void;
  setDiscount: (v: number) => void;
  setMargin: (v: number) => void;
  recalculate: () => void;
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialDesignInfo = {
  species: '',
  sex: 'male',
  ageWeeks: 7,
  animalsPerGroup: 8,
  route: 'SC',
  inductionMethod: '',
  positiveControl: '',
};

const initialClient = { org: '', name: '', phone: '', email: '' };

// ============================================
// Store
// ============================================

export const useEfficacyQuotationStore = create<EfficacyQuotationState>()(
  devtools(
    (set, get) => ({
      currentTab: 0,
      selectedModel: null,
      selectedCategory: '',
      scheduleSteps: [],
      groups: [],
      evalItems: [],
      designInfo: { ...initialDesignInfo },
      client: { ...initialClient },
      costItems: [],
      totalCost: 0,
      costByCategory: [],
      discount: 0.25,
      margin: 0.1,
      withProfit: 0,
      discounted: 0,
      vatIncluded: 0,

      setTab: (tab) => set({ currentTab: tab }),
      setCategory: (cat) => set({ selectedCategory: cat }),

      selectModel: (model) => {
        const steps = parseDurations(model.scheduleDurations);
        const evals = parseEvalItems(model.evalItemsRaw);
        const groups = createDefaultGroups(model);
        const info = {
          species: model.species[0] || model.speciesRaw,
          sex: model.sex,
          ageWeeks: model.ageWeeks ?? 7,
          animalsPerGroup: 8,
          route: 'SC',
          inductionMethod: model.inductionMethod,
          positiveControl: model.positiveControl,
        };

        const costItems = calculateCostItems({
          species: info.species,
          ageWeeks: info.ageWeeks,
          animalsPerGroup: info.animalsPerGroup,
          groupCount: groups.length,
          scheduleSteps: steps,
          evalItems: evals.map(e => ({ name: e.name, enabled: e.isEnabled })),
          reportWeeks: model.reportWeeks,
        });
        const totalCost = calculateTotalCost(costItems);
        const costByCat = calculateCostByCategory(costItems);
        const wp = Math.round(totalCost * (1 + get().margin));
        const disc = Math.round(wp * (1 - get().discount));

        set({
          selectedModel: model,
          scheduleSteps: steps,
          groups,
          evalItems: evals,
          designInfo: info,
          costItems,
          totalCost,
          costByCategory: costByCat,
          withProfit: wp,
          discounted: disc,
          vatIncluded: Math.round(disc * 1.1),
          currentTab: 1,
        });
      },

      updateScheduleStep: (index, updates) => {
        const steps = [...get().scheduleSteps];
        steps[index] = { ...steps[index], ...updates };
        set({ scheduleSteps: steps });
        get().recalculate();
      },

      addScheduleStep: (atIndex) => {
        const steps = [...get().scheduleSteps];
        const newStep: ScheduleStep = {
          id: uid(), order: steps.length, label: '새 단계',
          duration: 1, durationUnit: 'week', type: 'custom', evalItems: [],
        };
        if (atIndex !== undefined) {
          steps.splice(atIndex, 0, newStep);
        } else {
          steps.push(newStep);
        }
        set({ scheduleSteps: steps.map((s, i) => ({ ...s, order: i })) });
        get().recalculate();
      },

      removeScheduleStep: (index) => {
        const steps = get().scheduleSteps.filter((_, i) => i !== index);
        if (steps.length === 0) return;
        set({ scheduleSteps: steps.map((s, i) => ({ ...s, order: i })) });
        get().recalculate();
      },

      addGroup: () => {
        const groups = [...get().groups];
        const n = groups.length + 1;
        groups.push({
          id: uid(), groupNumber: n, treatment: 'TEST',
          label: `시험군 ${n - 2}`, animalCount: 8,
        });
        set({ groups });
        get().recalculate();
      },

      removeGroup: (id) => {
        const groups = get().groups.filter(g => g.id !== id);
        set({ groups: groups.map((g, i) => ({ ...g, groupNumber: i + 1 })) });
        get().recalculate();
      },

      updateGroup: (id, updates) => {
        set({ groups: get().groups.map(g => g.id === id ? { ...g, ...updates } : g) });
        get().recalculate();
      },

      updateEvalItem: (id, updates) => {
        set({ evalItems: get().evalItems.map(e => e.id === id ? { ...e, ...updates } : e) });
        get().recalculate();
      },

      addEvalItem: () => {
        set({ evalItems: [...get().evalItems, {
          id: uid(), name: '새 평가항목', code: '', category: '기타',
          costBasis: 'PER_ANIMAL', isOutsourced: false, isEnabled: true,
        }] });
        get().recalculate();
      },

      removeEvalItem: (id) => {
        set({ evalItems: get().evalItems.filter(e => e.id !== id) });
        get().recalculate();
      },

      updateDesignInfo: (updates) => {
        set({ designInfo: { ...get().designInfo, ...updates } });
        get().recalculate();
      },

      updateClient: (updates) => set({ client: { ...get().client, ...updates } }),

      setDiscount: (v) => {
        set({ discount: v });
        const { totalCost, margin } = get();
        const wp = Math.round(totalCost * (1 + margin));
        const disc = Math.round(wp * (1 - v));
        set({ withProfit: wp, discounted: disc, vatIncluded: Math.round(disc * 1.1) });
      },

      setMargin: (v) => {
        set({ margin: v });
        const { totalCost, discount } = get();
        const wp = Math.round(totalCost * (1 + v));
        const disc = Math.round(wp * (1 - discount));
        set({ withProfit: wp, discounted: disc, vatIncluded: Math.round(disc * 1.1) });
      },

      recalculate: () => {
        const { designInfo, groups, scheduleSteps, evalItems, selectedModel, margin, discount } = get();
        if (!selectedModel) return;
        const costItems = calculateCostItems({
          species: designInfo.species,
          ageWeeks: designInfo.ageWeeks,
          animalsPerGroup: designInfo.animalsPerGroup,
          groupCount: groups.length,
          scheduleSteps,
          evalItems: evalItems.map(e => ({ name: e.name, enabled: e.isEnabled })),
          reportWeeks: selectedModel.reportWeeks,
        });
        const totalCost = calculateTotalCost(costItems);
        const costByCat = calculateCostByCategory(costItems);
        const wp = Math.round(totalCost * (1 + margin));
        const disc = Math.round(wp * (1 - discount));
        set({
          costItems, totalCost, costByCategory: costByCat,
          withProfit: wp, discounted: disc, vatIncluded: Math.round(disc * 1.1),
        });
      },

      reset: () => set({
        currentTab: 0, selectedModel: null, selectedCategory: '',
        scheduleSteps: [], groups: [], evalItems: [],
        designInfo: { ...initialDesignInfo }, client: { ...initialClient },
        costItems: [], totalCost: 0, costByCategory: [],
        discount: 0.25, margin: 0.1, withProfit: 0, discounted: 0, vatIncluded: 0,
      }),
    }),
    { name: 'efficacy-quotation-v2-store' }
  )
);
