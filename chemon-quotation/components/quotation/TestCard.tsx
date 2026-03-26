'use client';

import { useState } from 'react';
import { Test } from '@/types';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { Plus, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestCardProps {
  test: Test;
  options: Test[];
  isSelected: boolean;
  selectedOptions: string[];
  onToggle: () => void;
  onToggleOption: (option: Test) => void;
}

export default function TestCard({
  test,
  options,
  isSelected,
  selectedOptions,
  onToggle,
  onToggleOption,
}: TestCardProps) {
  const [showOptions, setShowOptions] = useState(false);

  // 시험명에서 첫 줄만 추출
  const testName = test.test_name.split('\n')[0];

  return (
    <StitchCard
      variant={isSelected ? 'surface-low' : 'elevated'}
      padding="sm"
      className={cn(
        'transition-all',
        isSelected && 'ring-2 ring-primary bg-primary/5'
      )}
    >
      {/* 메인 시험 정보 */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 text-sm">
              {testName}
            </span>
            <StitchBadge
              variant={test.glp_status === 'GLP' ? 'primary' : 'neutral'}
            >
              {test.glp_status}
            </StitchBadge>
            {test.clinical_phase && (
              <StitchBadge variant="info">
                {test.clinical_phase}
              </StitchBadge>
            )}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {test.animal_species && <span>{test.animal_species}</span>}
            {test.animals_per_sex && test.animals_per_sex > 0 && (
              <span className="ml-2">
                {test.sex_type} {test.animals_per_sex}마리/군
              </span>
            )}
            {test.total_groups && test.total_groups > 0 && (
              <span className="ml-2">| {test.total_groups}군</span>
            )}
            {test.lead_time_weeks && test.lead_time_weeks > 0 && (
              <span className="ml-2">| 약 {test.lead_time_weeks}주</span>
            )}
          </div>
          {test.guidelines && (
            <div className="text-xs text-slate-400 mt-1 line-clamp-1">
              {test.guidelines}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-semibold text-primary text-sm">
            {test.unit_price && test.unit_price > 0 ? formatCurrency(test.unit_price) : '별도협의'}
          </div>
          <Button
            size="sm"
            variant={isSelected ? 'default' : 'outline'}
            onClick={onToggle}
            className="mt-2"
          >
            {isSelected ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 옵션 시험 */}
      {options.length > 0 && isSelected && (
        <div className="mt-3 pt-3">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            {showOptions ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            옵션 시험 ({options.length}개)
          </button>

          {showOptions && (
            <div className="mt-2 space-y-2 pl-4">
              {options.map((option) => (
                <div
                  key={option.test_id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF2E9]"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedOptions.includes(option.test_id)}
                      onCheckedChange={() => onToggleOption(option)}
                    />
                    <span className="text-sm">
                      {option.option_type || option.test_name.split('\n')[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {option.unit_price && option.unit_price > 0
                      ? formatCurrency(option.unit_price)
                      : '별도협의'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </StitchCard>
  );
}
