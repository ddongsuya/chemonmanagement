'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/**
 * EfficacyQuotationWizard Component
 * 5-step progress indicator for efficacy quotation creation
 * Requirements: 1.1, 8.1
 */

interface EfficacyQuotationWizardProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { id: 1, name: '기본정보', shortName: '정보' },
  { id: 2, name: '모델선택', shortName: '모델' },
  { id: 3, name: '항목구성', shortName: '항목' },
  { id: 4, name: '시험디자인', shortName: '디자인' },
  { id: 5, name: '금액계산', shortName: '계산' },
  { id: 6, name: '미리보기', shortName: '출력' },
];

export default function EfficacyQuotationWizard({
  currentStep,
  onStepClick,
}: EfficacyQuotationWizardProps) {
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
                {/* Step circle */}
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-colors flex-shrink-0',
                    isCompleted
                      ? 'border-primary bg-primary text-white cursor-pointer hover:bg-primary/90'
                      : isCurrent
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-500',
                    !isClickable && !isCurrent && 'cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-[10px] sm:text-sm font-medium">{step.id}</span>
                  )}
                </button>

                {/* Step name - desktop */}
                <span
                  className={cn(
                    'ml-3 text-sm font-medium hidden sm:block',
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  )}
                >
                  {step.name}
                </span>

                {/* Step name - mobile (only show current step name) */}
                <span
                  className={cn(
                    'ml-1 text-[10px] font-medium sm:hidden',
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-gray-900'
                      : 'text-gray-500',
                    !isCurrent && 'hidden'
                  )}
                >
                  {step.shortName}
                </span>

                {/* Connector line */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      'ml-1 sm:ml-4 h-0.5 flex-1 min-w-[8px] sm:min-w-[40px]',
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
