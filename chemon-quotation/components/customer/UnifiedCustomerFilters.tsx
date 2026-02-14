'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, Users, Building2, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  UnifiedCustomerFilters as FilterType, 
  PipelineStageInfo,
  StageFilterOption 
} from '@/types/unified-customer';

/**
 * UnifiedCustomerFilters 컴포넌트 Props
 * 
 * @requirements 3.1, 4.1, 5.1
 */
export interface UnifiedCustomerFiltersProps {
  /** 현재 필터 상태 */
  filters: FilterType;
  /** 파이프라인 단계 목록 */
  stages: PipelineStageInfo[];
  /** 필터 변경 콜백 */
  onFilterChange: (filters: FilterType) => void;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 로딩 상태 */
  loading?: boolean;
}

/**
 * 유형 필터 옵션
 */
const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '전체', icon: Users },
  { value: 'lead', label: '리드', icon: Building2 },
  { value: 'customer', label: '고객', icon: UserCheck },
] as const;

/**
 * 검색 디바운스 지연 시간 (ms)
 */
const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * UnifiedCustomerFilters 컴포넌트
 * 
 * 통합 고객 목록의 필터링 UI를 제공합니다.
 * 
 * @requirements 3.1 - 유형 필터 (전체/리드/고객) 구현
 * @requirements 4.1 - 파이프라인 단계 필터 구현
 * @requirements 5.1 - 검색 입력 필드 구현
 */
export default function UnifiedCustomerFilters({
  filters,
  stages,
  onFilterChange,
  className,
  loading = false,
}: UnifiedCustomerFiltersProps) {
  // 검색어 로컬 상태 (디바운스용)
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Ref로 최신 filters와 onFilterChange를 추적 (무한 루프 방지)
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  // 검색어 디바운스 처리 - searchInput만 의존성으로 사용
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentFilters = filtersRef.current;
      if (searchInput !== (currentFilters.search || '')) {
        onFilterChangeRef.current({ ...currentFilters, search: searchInput || undefined, page: 1 });
      }
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 외부에서 검색어가 초기화되면 로컬 상태 동기화
  const prevSearchRef = useRef(filters.search);
  useEffect(() => {
    if (filters.search !== prevSearchRef.current) {
      prevSearchRef.current = filters.search;
      setSearchInput(filters.search || '');
    }
  }, [filters.search]);

  /**
   * 유형 필터 변경 핸들러
   * @requirements 3.1
   */
  const handleTypeChange = useCallback((value: string) => {
    const type = value as 'all' | 'lead' | 'customer';
    onFilterChange({ ...filters, type, page: 1 });
  }, [filters, onFilterChange]);

  /**
   * 단계 필터 변경 핸들러
   * @requirements 4.1
   */
  const handleStageChange = useCallback((value: string) => {
    const stageId = value === 'all' ? undefined : value;
    onFilterChange({ ...filters, stageId, page: 1 });
  }, [filters, onFilterChange]);

  /**
   * 검색어 입력 핸들러
   * @requirements 5.1
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  /**
   * 검색어 초기화 핸들러
   */
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    onFilterChange({ ...filters, search: undefined, page: 1 });
  }, [filters, onFilterChange]);

  /**
   * 모든 필터 초기화 핸들러
   */
  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    onFilterChange({
      type: 'all',
      stageId: undefined,
      search: undefined,
      page: 1,
      limit: filters.limit,
    });
  }, [filters.limit, onFilterChange]);

  // 활성 필터 개수 계산
  const activeFilterCount = [
    filters.type && filters.type !== 'all',
    filters.stageId,
    filters.search,
  ].filter(Boolean).length;

  // 단계 필터 옵션 생성
  const stageOptions: StageFilterOption[] = [
    { value: 'all', label: '전체 단계' },
    ...stages.map(stage => ({
      value: stage.id,
      label: stage.name,
      color: stage.color || undefined,
    })),
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* 필터 행 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 유형 필터 - Requirements 3.1 */}
        <div className="w-full sm:w-40">
          <Select
            value={filters.type || 'all'}
            onValueChange={handleTypeChange}
            disabled={loading}
          >
            <SelectTrigger aria-label="유형 필터">
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTER_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 단계 필터 - Requirements 4.1 */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.stageId || 'all'}
            onValueChange={handleStageChange}
            disabled={loading}
          >
            <SelectTrigger aria-label="단계 필터">
              <SelectValue placeholder="단계 선택" />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 검색 입력 - Requirements 5.1 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="회사명, 담당자, 이메일, 전화번호 검색..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9 pr-9"
            disabled={loading}
            aria-label="검색"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 필터 초기화 버튼 */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="default"
            onClick={handleResetFilters}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span>초기화</span>
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * UnifiedCustomerFilters 스켈레톤 컴포넌트
 * 로딩 상태에서 표시되는 플레이스홀더
 */
export function UnifiedCustomerFiltersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="w-full sm:w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
      </div>
    </div>
  );
}
