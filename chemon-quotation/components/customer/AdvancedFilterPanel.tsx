'use client';

/**
 * AdvancedFilterPanel - 확장 필터 패널
 */

import { useState, useEffect } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import type { UnifiedCustomerFilters, PipelineStageInfo, SegmentType } from '@/types/unified-customer';
import type { CustomerGrade } from '@/types/customer';

interface AdvancedFilterPanelProps {
  filters: UnifiedCustomerFilters;
  stages: PipelineStageInfo[];
  onFilterChange: (filters: UnifiedCustomerFilters) => void;
  loading?: boolean;
}

const SEGMENT_OPTIONS: { value: SegmentType; label: string }[] = [
  { value: 'PHARMACEUTICAL', label: '의약품' },
  { value: 'COSMETICS', label: '화장품' },
  { value: 'HEALTH_FOOD', label: '건강기능식품' },
  { value: 'MEDICAL_DEVICE', label: '의료기기' },
  { value: 'OTHER', label: '기타' },
];

const GRADE_OPTIONS: { value: CustomerGrade; label: string }[] = [
  { value: 'LEAD', label: '리드' },
  { value: 'PROSPECT', label: '잠재고객' },
  { value: 'CUSTOMER', label: '고객' },
  { value: 'VIP', label: 'VIP' },
  { value: 'INACTIVE', label: '비활성' },
];

export function AdvancedFilterPanel({ filters, stages, onFilterChange, loading }: AdvancedFilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  // 디바운스된 검색어가 변경되면 필터 업데이트
  useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      onFilterChange({ ...filters, search: debouncedSearch || undefined, page: 1 });
    }
  }, [debouncedSearch]);

  const updateFilter = (key: string, value: unknown) => {
    onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  const clearFilter = (key: string) => {
    const next = { ...filters };
    delete (next as Record<string, unknown>)[key];
    next.page = 1;
    onFilterChange(next);
  };

  const resetAll = () => {
    onFilterChange({ type: 'all', page: 1, limit: 20, sortBy: 'updatedAt', sortOrder: 'desc' });
  };

  // Collect active filter chips
  const activeFilters: { key: string; label: string }[] = [];
  if (filters.type && filters.type !== 'all') activeFilters.push({ key: 'type', label: filters.type === 'lead' ? '리드' : '고객' });
  if (filters.stageId) activeFilters.push({ key: 'stageId', label: stages.find(s => s.id === filters.stageId)?.name || filters.stageId });
  if (filters.grade) activeFilters.push({ key: 'grade', label: GRADE_OPTIONS.find(g => g.value === filters.grade)?.label || filters.grade });
  if (filters.segment) activeFilters.push({ key: 'segment', label: SEGMENT_OPTIONS.find(s => s.value === filters.segment)?.label || filters.segment });
  if (filters.tags && filters.tags.length > 0) activeFilters.push({ key: 'tags', label: `태그: ${filters.tags.join(', ')}` });
  if (filters.healthScoreMin != null || filters.healthScoreMax != null) activeFilters.push({ key: 'healthScore', label: `건강도: ${filters.healthScoreMin ?? 0}~${filters.healthScoreMax ?? 100}` });
  if (filters.dataQualityMin != null || filters.dataQualityMax != null) activeFilters.push({ key: 'dataQuality', label: `품질: ${filters.dataQualityMin ?? 0}~${filters.dataQualityMax ?? 100}` });
  if (filters.lastActivityDays) activeFilters.push({ key: 'lastActivityDays', label: `${filters.lastActivityDays}일 이내 활동` });

  return (
    <div className="space-y-3">
      {/* 기본 필터 행 */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="회사명, 담당자, 연락처 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full sm:w-64"
          disabled={loading}
        />
        <Select value={filters.type || 'all'} onValueChange={(v) => updateFilter('type', v)}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="lead">리드</SelectItem>
            <SelectItem value="customer">고객</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.stageId || '_all'} onValueChange={(v) => updateFilter('stageId', v === '_all' ? undefined : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="단계 선택" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">전체 단계</SelectItem>
            {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          고급 필터
          {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={resetAll} className="text-muted-foreground">초기화</Button>
        )}
      </div>

      {/* 적용된 필터 칩 */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map(f => (
            <span key={f.key} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {f.label}
              <button onClick={() => clearFilter(f.key)} className="hover:text-primary/70" aria-label={`${f.label} 필터 제거`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 확장 필터 */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border p-4 bg-muted/20">
          <div>
            <Label className="text-xs mb-1.5 block">등급</Label>
            <Select value={filters.grade || '_all'} onValueChange={(v) => updateFilter('grade', v === '_all' ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">전체</SelectItem>
                {GRADE_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">세그먼트</Label>
            <Select value={filters.segment || '_all'} onValueChange={(v) => updateFilter('segment', v === '_all' ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">전체</SelectItem>
                {SEGMENT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">건강도 범위: {filters.healthScoreMin ?? 0} ~ {filters.healthScoreMax ?? 100}</Label>
            <Slider
              min={0} max={100} step={5}
              value={[filters.healthScoreMin ?? 0, filters.healthScoreMax ?? 100]}
              onValueChange={([min, max]) => onFilterChange({ ...filters, healthScoreMin: min > 0 ? min : undefined, healthScoreMax: max < 100 ? max : undefined, page: 1 })}
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">데이터 품질 범위: {filters.dataQualityMin ?? 0} ~ {filters.dataQualityMax ?? 100}</Label>
            <Slider
              min={0} max={100} step={5}
              value={[filters.dataQualityMin ?? 0, filters.dataQualityMax ?? 100]}
              onValueChange={([min, max]) => onFilterChange({ ...filters, dataQualityMin: min > 0 ? min : undefined, dataQualityMax: max < 100 ? max : undefined, page: 1 })}
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">최근 활동 (일 이내)</Label>
            <Select value={String(filters.lastActivityDays || '_all')} onValueChange={(v) => updateFilter('lastActivityDays', v === '_all' ? undefined : Number(v))}>
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">전체</SelectItem>
                <SelectItem value="7">7일</SelectItem>
                <SelectItem value="14">14일</SelectItem>
                <SelectItem value="30">30일</SelectItem>
                <SelectItem value="60">60일</SelectItem>
                <SelectItem value="90">90일</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">태그 (쉼표 구분)</Label>
            <Input
              placeholder="태그1, 태그2"
              value={(filters.tags || []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                updateFilter('tags', tags.length > 0 ? tags : undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
