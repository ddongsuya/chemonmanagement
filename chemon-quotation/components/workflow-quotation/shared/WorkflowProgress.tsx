'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WorkflowProgressProps {
  currentStep: 1 | 2 | 3 | 4;
}

const steps = [
  { id: 1, name: '모달리티' },
  { id: 2, name: '프로젝트' },
  { id: 3, name: '시험선택' },
  { id: 4, name: '검토확인' },
];

export function WorkflowProgress({ currentStep }: WorkflowProgressProps) {
  return (
    <div className="flex items-center justify-between mt-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          {/* Step circle */}
          <div className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step.id < currentStep &&
                  'bg-primary text-primary-foreground',
                step.id === currentStep &&
                  'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                step.id > currentStep && 'bg-muted text-muted-foreground'
              )}
            >
              {step.id < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                'ml-2 text-sm hidden sm:inline',
                step.id === currentStep && 'font-medium',
                step.id > currentStep && 'text-muted-foreground'
              )}
            >
              {step.name}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-4',
                step.id < currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
