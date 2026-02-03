/**
 * 효력시험 견적 Zustand Store
 * Requirements: 1.2, 2.2, 4.1
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  EfficacyModel,
  ModelItem,
  PriceItem,
  SelectedEfficacyItem,
  StudyGroup,
  SchedulePhase,
  ScheduleEvent,
  StudyDesign,
} from '@/types/efficacy';
import { getEfficacyMasterData } from '@/lib/efficacy-storage';

// ============================================
// Types
// ============================================

export interface EfficacyQuotationState {
  // Step 1: Basic Info
  customerId: string;
  customerName: string;
  leadId: string | null;
  leadContactName: string;
  leadContactEmail: string;
  leadContactPhone: string;
  projectName: string;
  validDays: number;
  notes: string;

  // Step 2: Model Selection
  selectedModelId: string | null;
  selectedModel: EfficacyModel | null;

  // Step 3: Item Configuration
  selectedItems: SelectedEfficacyItem[];

  // Step 4: Study Design (군 구성 & 스케쥴)
  studyDesign: StudyDesign;

  // Calculations
  subtotalByCategory: Record<string, number>;
  subtotal: number;
  vat: number;
  grandTotal: number;

  // Navigation
  currentStep: number;

  // Actions
  setCustomer: (id: string, name: string) => void;
  setLead: (id: string, companyName: string, contactName: string, contactEmail: string, contactPhone: string) => void;
  setProjectName: (name: string) => void;
  setValidDays: (days: number) => void;
  setNotes: (notes: string) => void;
  setModel: (modelId: string) => void;
  addItem: (item: ModelItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, quantity: number, multiplier: number) => void;
  calculateTotals: () => void;
  reset: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: number) => void;
  
  // Study Design Actions
  setStudyDesignModelName: (name: string) => void;
  setStudyDesignAnimalInfo: (info: StudyDesign['animalInfo']) => void;
  addGroup: () => void;
  updateGroup: (id: string, updates: Partial<StudyGroup>) => void;
  removeGroup: (id: string) => void;
  addPhase: () => void;
  updatePhase: (id: string, updates: Partial<SchedulePhase>) => void;
  removePhase: (id: string) => void;
  addEvent: (phaseId: string) => void;
  updateEvent: (id: string, updates: Partial<ScheduleEvent>) => void;
  removeEvent: (id: string) => void;
  
  // Load from saved quotation
  loadQuotation: (data: {
    customerId: string;
    customerName: string;
    projectName: string;
    validDays: number;
    notes: string;
    modelId: string;
    items: SelectedEfficacyItem[];
    studyDesign?: StudyDesign;
  }) => void;
}

// ============================================
// Initial State
// ============================================

/**
 * Convert number to Roman numeral
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

// Default study design
const defaultStudyDesign: StudyDesign = {
  modelName: '',
  animalInfo: {
    species: '',
    sex: '',
    age: '',
  },
  groups: [],
  phases: [
    {
      id: 'phase-1',
      name: 'Acclimation',
      duration: 1,
      durationUnit: 'week',
      color: '#3B82F6', // blue
      order: 1,
    },
    {
      id: 'phase-2',
      name: 'Test article treatment',
      duration: 8,
      durationUnit: 'week',
      color: '#10B981', // green
      order: 2,
    },
    {
      id: 'phase-3',
      name: 'Observation',
      duration: 8,
      durationUnit: 'week',
      color: '#6366F1', // indigo
      order: 3,
    },
    {
      id: 'phase-4',
      name: 'Final report',
      duration: 4,
      durationUnit: 'week',
      color: '#F59E0B', // amber
      order: 4,
    },
  ],
  events: [],
};

const initialState = {
  // Step 1: Basic Info
  customerId: '',
  customerName: '',
  leadId: null as string | null,
  leadContactName: '',
  leadContactEmail: '',
  leadContactPhone: '',
  projectName: '',
  validDays: 30,
  notes: '',

  // Step 2: Model Selection
  selectedModelId: null as string | null,
  selectedModel: null as EfficacyModel | null,

  // Step 3: Item Configuration
  selectedItems: [] as SelectedEfficacyItem[],

  // Step 4: Study Design
  studyDesign: { ...defaultStudyDesign } as StudyDesign,

  // Calculations
  subtotalByCategory: {} as Record<string, number>,
  subtotal: 0,
  vat: 0,
  grandTotal: 0,

  // Navigation
  currentStep: 1,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate item amount: unit_price × quantity × multiplier
 * Property 1: Item Amount Calculation Invariant
 * Validates: Requirements 2.2, 4.1
 */
export function calculateItemAmount(
  unitPrice: number,
  quantity: number,
  multiplier: number
): number {
  return unitPrice * quantity * multiplier;
}

/**
 * Calculate category subtotals
 * Property 2: Category Subtotal Consistency
 * Validates: Requirements 4.2
 */
export function calculateSubtotalByCategory(
  items: SelectedEfficacyItem[]
): Record<string, number> {
  const subtotals: Record<string, number> = {};
  
  for (const item of items) {
    const category = item.category;
    if (!subtotals[category]) {
      subtotals[category] = 0;
    }
    subtotals[category] += item.amount;
  }
  
  return subtotals;
}

/**
 * Calculate VAT (10%) - rounded down
 * Property 3: VAT and Grand Total Calculation
 * Validates: Requirements 4.3
 */
export function calculateVAT(subtotal: number): number {
  return Math.floor(subtotal * 0.1);
}

/**
 * Calculate grand total: subtotal + VAT
 * Property 3: VAT and Grand Total Calculation
 * Validates: Requirements 4.3
 */
export function calculateGrandTotal(subtotal: number, vat: number): number {
  return subtotal + vat;
}

/**
 * Recalculate all totals from items
 */
function recalculateAll(items: SelectedEfficacyItem[]) {
  const subtotalByCategory = calculateSubtotalByCategory(items);
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const vat = calculateVAT(subtotal);
  const grandTotal = calculateGrandTotal(subtotal, vat);

  return {
    subtotalByCategory,
    subtotal,
    vat,
    grandTotal,
  };
}

/**
 * Get price item from master data
 */
function getPriceItem(itemId: string): PriceItem | undefined {
  const masterData = getEfficacyMasterData();
  return masterData.price_master.find((p) => p.item_id === itemId);
}

/**
 * Get model from master data
 */
function getModel(modelId: string): EfficacyModel | undefined {
  const masterData = getEfficacyMasterData();
  return masterData.models.find((m) => m.model_id === modelId);
}

/**
 * Get default items for a model
 * Property 4: Model Selection Loads Correct Defaults
 * Validates: Requirements 1.2, 3.2
 */
export function getDefaultItemsForModel(modelId: string): ModelItem[] {
  const masterData = getEfficacyMasterData();
  return masterData.model_items.filter(
    (mi) => mi.model_id === modelId && mi.is_default === true
  );
}

/**
 * Convert ModelItem to SelectedEfficacyItem
 * Note: Default quantity and multiplier are set to 0 for user input
 */
function modelItemToSelectedItem(modelItem: ModelItem): SelectedEfficacyItem | null {
  const priceItem = getPriceItem(modelItem.item_id);
  if (!priceItem) return null;

  // Set default quantity and multiplier to 0 for user input
  const quantity = 0;
  const multiplier = 0;
  const amount = calculateItemAmount(priceItem.unit_price, quantity, multiplier);

  return {
    id: `${modelItem.item_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    item_id: modelItem.item_id,
    item_name: priceItem.item_name,
    category: priceItem.category,
    unit_price: priceItem.unit_price,
    unit: priceItem.unit,
    quantity,
    multiplier,
    amount,
    is_default: modelItem.is_default,
    usage_note: modelItem.usage_note,
  };
}

// ============================================
// Store
// ============================================

export const useEfficacyQuotationStore = create<EfficacyQuotationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Step 1: Basic Info Actions
      setCustomer: (id, name) => set({ 
        customerId: id, 
        customerName: name,
        leadId: null,
        leadContactName: '',
        leadContactEmail: '',
        leadContactPhone: '',
      }),
      
      setLead: (id, companyName, contactName, contactEmail, contactPhone) => set({
        leadId: id,
        customerName: companyName,
        customerId: '',
        leadContactName: contactName,
        leadContactEmail: contactEmail,
        leadContactPhone: contactPhone,
      }),
      
      setProjectName: (name) => set({ projectName: name }),
      
      setValidDays: (days) => set({ validDays: days }),
      
      setNotes: (notes) => set({ notes }),

      // Step 2: Model Selection
      /**
       * Set model and load default items
       * Property 4: Model Selection Loads Correct Defaults
       * Property 5: Model Change Clears Previous Selection
       * Validates: Requirements 1.2, 1.4, 3.2
       */
      setModel: (modelId) => {
        const model = getModel(modelId);
        if (!model) return;

        // Get default items for the model
        const defaultModelItems = getDefaultItemsForModel(modelId);
        
        // Convert to selected items
        const selectedItems: SelectedEfficacyItem[] = [];
        for (const modelItem of defaultModelItems) {
          const selectedItem = modelItemToSelectedItem(modelItem);
          if (selectedItem) {
            selectedItems.push(selectedItem);
          }
        }

        // Calculate totals
        const calculated = recalculateAll(selectedItems);

        set({
          selectedModelId: modelId,
          selectedModel: model,
          selectedItems,
          ...calculated,
        });
      },

      // Step 3: Item Configuration
      /**
       * Add an item to the quotation
       * Validates: Requirements 3.2
       */
      addItem: (modelItem) => {
        const state = get();
        
        // Check if item already exists
        const exists = state.selectedItems.some(
          (item) => item.item_id === modelItem.item_id
        );
        if (exists) return;

        const selectedItem = modelItemToSelectedItem(modelItem);
        if (!selectedItem) return;

        const newItems = [...state.selectedItems, selectedItem];
        const calculated = recalculateAll(newItems);

        set({
          selectedItems: newItems,
          ...calculated,
        });
      },

      /**
       * Remove an item from the quotation
       * Property 6: Item Removal Decreases Total
       * Validates: Requirements 2.3
       */
      removeItem: (itemId) => {
        const state = get();
        const newItems = state.selectedItems.filter((item) => item.id !== itemId);
        const calculated = recalculateAll(newItems);

        set({
          selectedItems: newItems,
          ...calculated,
        });
      },

      /**
       * Update item quantity and multiplier
       * Property 1: Item Amount Calculation Invariant
       * Validates: Requirements 2.2, 4.1
       */
      updateItem: (itemId, quantity, multiplier) => {
        const state = get();
        const newItems = state.selectedItems.map((item) => {
          if (item.id !== itemId) return item;

          const amount = calculateItemAmount(item.unit_price, quantity, multiplier);
          return {
            ...item,
            quantity,
            multiplier,
            amount,
          };
        });

        const calculated = recalculateAll(newItems);

        set({
          selectedItems: newItems,
          ...calculated,
        });
      },

      /**
       * Recalculate all totals
       */
      calculateTotals: () => {
        const state = get();
        const calculated = recalculateAll(state.selectedItems);
        set(calculated);
      },

      // Navigation
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 6),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      setCurrentStep: (step) => set({ currentStep: step }),

      // Study Design Actions
      setStudyDesignModelName: (name) =>
        set((state) => ({
          studyDesign: { ...state.studyDesign, modelName: name },
        })),

      setStudyDesignAnimalInfo: (info) =>
        set((state) => ({
          studyDesign: { ...state.studyDesign, animalInfo: info },
        })),

      addGroup: () =>
        set((state) => {
          const newGroupNumber = state.studyDesign.groups.length + 1;
          const newGroup: StudyGroup = {
            id: `group-${Date.now()}`,
            groupNumber: newGroupNumber,
            treatment: newGroupNumber === 1 ? 'Vehicle' : `Test article ${toRoman(newGroupNumber - 1)}`,
            dose: 'TBD',
            animalCount: 7,
          };
          return {
            studyDesign: {
              ...state.studyDesign,
              groups: [...state.studyDesign.groups, newGroup],
            },
          };
        }),

      updateGroup: (id, updates) =>
        set((state) => ({
          studyDesign: {
            ...state.studyDesign,
            groups: state.studyDesign.groups.map((g) =>
              g.id === id ? { ...g, ...updates } : g
            ),
          },
        })),

      removeGroup: (id) =>
        set((state) => {
          const filteredGroups = state.studyDesign.groups.filter((g) => g.id !== id);
          // Renumber groups
          const renumberedGroups = filteredGroups.map((g, idx) => ({
            ...g,
            groupNumber: idx + 1,
          }));
          return {
            studyDesign: {
              ...state.studyDesign,
              groups: renumberedGroups,
            },
          };
        }),

      addPhase: () =>
        set((state) => {
          const newOrder = state.studyDesign.phases.length + 1;
          const newPhase: SchedulePhase = {
            id: `phase-${Date.now()}`,
            name: 'New Phase',
            duration: 1,
            durationUnit: 'week',
            color: '#6B7280', // gray
            order: newOrder,
          };
          return {
            studyDesign: {
              ...state.studyDesign,
              phases: [...state.studyDesign.phases, newPhase],
            },
          };
        }),

      updatePhase: (id, updates) =>
        set((state) => ({
          studyDesign: {
            ...state.studyDesign,
            phases: state.studyDesign.phases.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          },
        })),

      removePhase: (id) =>
        set((state) => {
          const filteredPhases = state.studyDesign.phases.filter((p) => p.id !== id);
          // Reorder phases
          const reorderedPhases = filteredPhases.map((p, idx) => ({
            ...p,
            order: idx + 1,
          }));
          // Remove events associated with this phase
          const filteredEvents = state.studyDesign.events.filter((e) => e.phaseId !== id);
          return {
            studyDesign: {
              ...state.studyDesign,
              phases: reorderedPhases,
              events: filteredEvents,
            },
          };
        }),

      addEvent: (phaseId) =>
        set((state) => {
          const newEvent: ScheduleEvent = {
            id: `event-${Date.now()}`,
            name: 'New Event',
            phaseId,
            position: 50,
            color: '#EF4444', // red
          };
          return {
            studyDesign: {
              ...state.studyDesign,
              events: [...state.studyDesign.events, newEvent],
            },
          };
        }),

      updateEvent: (id, updates) =>
        set((state) => ({
          studyDesign: {
            ...state.studyDesign,
            events: state.studyDesign.events.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          },
        })),

      removeEvent: (id) =>
        set((state) => ({
          studyDesign: {
            ...state.studyDesign,
            events: state.studyDesign.events.filter((e) => e.id !== id),
          },
        })),

      // Reset
      reset: () => set({ ...initialState, studyDesign: { ...defaultStudyDesign } }),

      // Load from saved quotation
      loadQuotation: (data) => {
        const model = getModel(data.modelId);
        const calculated = recalculateAll(data.items);

        set({
          customerId: data.customerId,
          customerName: data.customerName,
          projectName: data.projectName,
          validDays: data.validDays,
          notes: data.notes,
          selectedModelId: data.modelId,
          selectedModel: model || null,
          selectedItems: data.items,
          studyDesign: data.studyDesign || { ...defaultStudyDesign },
          ...calculated,
        });
      },
    }),
    { name: 'efficacy-quotation-store' }
  )
);
