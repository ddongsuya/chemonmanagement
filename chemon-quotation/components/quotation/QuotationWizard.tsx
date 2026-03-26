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
    <nav aria-label="Progress" className="mb-8 bg-[#FAF2E9] rounded-xl p-4 sm:p-6">
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
                    'relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all duration-200 flex-shrink-0',
                    isCompleted
                      ? 'bg-primary text-white cursor-pointer hover:bg-primary/90 shadow-ambient'
                      : isCurrent
                      ? 'bg-primary text-white shadow-ambient'
                      : 'bg-white text-slate-500',
                    !isClickable && !isCurrent && 'cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold">{step.id}</span>
                  )}
                </button>

                {/* 스텝 이름 */}
                <span
                  className={cn(
                    'ml-3 text-[11px] font-bold uppercase tracking-widest hidden sm:block',
                    isCurrent ? 'text-primary' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                  )}
                >
                  {step.name}
                </span>

                {/* 모바일용 짧은 이름 */}
                <span
                  className={cn(
                    'ml-2 text-[10px] font-bold uppercase tracking-widest sm:hidden',
                    isCurrent ? 'text-primary' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                  )}
                >
                  {step.shortName}
                </span>

                {/* 연결선 */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      'ml-2 sm:ml-4 h-0.5 flex-1 min-w-[12px] sm:min-w-[40px] rounded-full',
                      isCompleted ? 'bg-primary' : 'bg-slate-200'
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
