'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface QuotationWizardProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { id: 1, name: '기본정보', shortName: '정보' },
  { id: 2, name: '시험선택', shortName: '시험' },
  { id: 3, name: '검토/계산', shortName: '계산' },
  { id: 4, name: '미리보기', shortName: '출력' },
];

export default function QuotationWizard({ currentStep, onStepClick }: QuotationWizardProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = step.id < currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                'relative',
                stepIdx !== steps.length - 1 ? 'flex-1' : ''
              )}
            >
              <div className="flex items-center">
                {/* 스텝 원형 */}
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-colors flex-shrink-0',
                    isCompleted
                      ? 'border-primary bg-primary text-white cursor-pointer hover:bg-primary/90'
                      : isCurrent
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-500',
                    !isClickable && !isCurrent && 'cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-xs sm:text-sm font-medium">{step.id}</span>
                  )}
                </button>

                {/* 스텝 이름 */}
                <span
                  className={cn(
                    'ml-3 text-sm font-medium hidden sm:block',
                    isCurrent ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {step.name}
                </span>

                {/* 모바일용 짧은 이름 */}
                <span
                  className={cn(
                    'ml-2 text-xs font-medium sm:hidden',
                    isCurrent ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {step.shortName}
                </span>

                {/* 연결선 */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      'ml-2 sm:ml-4 h-0.5 flex-1 min-w-[12px] sm:min-w-[40px]',
                      isCompleted ? 'bg-primary' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
