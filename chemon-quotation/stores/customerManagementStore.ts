/**
 * Customer Management Store
 * 고객 관리 모듈 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UnifiedCustomerFilters } from '@/types/unified-customer';

type ViewMode = 'card' | 'table' | 'kanban';

interface TabCacheEntry {
  data: unknown;
  timestamp: number;
}

interface CustomerManagementState {
  // 뷰 모드
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // 필터
  filters: UnifiedCustomerFilters;
  setFilters: (filters: Partial<UnifiedCustomerFilters>) => void;
  resetFilters: () => void;

  // 선택된 항목 (일괄 작업용)
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // 탭 데이터 캐시
  tabCache: Record<string, TabCacheEntry>;
  setTabCache: (tabKey: string, data: unknown) => void;
  getTabCache: (tabKey: string, maxAge?: number) => unknown | null;
  invalidateTabCache: (tabKey?: string) => void;

  // 커맨드 팔레트
  isCommandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
}

const DEFAULT_FILTERS: UnifiedCustomerFilters = {
  type: 'all',
  page: 1,
  limit: 20,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const TAB_CACHE_MAX_AGE = 5 * 60 * 1000; // 5분

export const useCustomerManagementStore = create<CustomerManagementState>()(
  persist(
    (set, get) => ({
      viewMode: 'card',
      setViewMode: (mode) => set({ viewMode: mode }),

      filters: { ...DEFAULT_FILTERS },
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

      selectedIds: [],
      toggleSelection: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((i) => i !== id)
            : [...state.selectedIds, id],
        })),
      selectAll: (ids) => set({ selectedIds: ids }),
      clearSelection: () => set({ selectedIds: [] }),

      tabCache: {},
      setTabCache: (tabKey, data) =>
        set((state) => ({
          tabCache: {
            ...state.tabCache,
            [tabKey]: { data, timestamp: Date.now() },
          },
        })),
      getTabCache: (tabKey, maxAge = TAB_CACHE_MAX_AGE) => {
        const entry = get().tabCache[tabKey];
        if (!entry) return null;
        if (Date.now() - entry.timestamp > maxAge) return null;
        return entry.data;
      },
      invalidateTabCache: (tabKey) =>
        set((state) => {
          if (tabKey) {
            const { [tabKey]: _, ...rest } = state.tabCache;
            return { tabCache: rest };
          }
          return { tabCache: {} };
        }),

      isCommandPaletteOpen: false,
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
    }),
    {
      name: 'customer-management-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);
