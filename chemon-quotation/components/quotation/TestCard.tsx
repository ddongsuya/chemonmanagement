'use client';

import { useState } from 'react';
import { Test } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
    <Card
      className={cn(
        'p-4 transition-all',
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
            <span className="font-medium text-gray-900 text-sm">
              {testName}
            </span>
            <Badge
              variant={test.glp_status === 'GLP' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {test.glp_status}
            </Badge>
            {test.clinical_phase && (
              <Badge variant="outline" className="text-xs">
                {test.clinical_phase}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
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
            <div className="text-xs text-gray-400 mt-1 line-clamp-1">
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
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
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
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
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
    </Card>
  );
}
