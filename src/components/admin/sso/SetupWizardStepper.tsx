'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description: string;
}

interface SetupWizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: number[];
}

// ============================================================================
// Component
// ============================================================================

export function SetupWizardStepper({ steps, currentStep, completedSteps }: SetupWizardStepperProps) {
  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => {
            const isCompleted = completedSteps.includes(stepIdx);
            const isCurrent = currentStep === stepIdx;
            const isUpcoming = currentStep < stepIdx;

            return (
              <li
                key={step.id}
                className={cn('relative', stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : '')}
              >
                {/* Connector Line */}
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div
                      className={cn(
                        'h-0.5 w-full transition-colors duration-300',
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}

                {/* Step Circle */}
                <div className="relative flex items-start group">
                  <span className="flex items-center">
                    <span
                      className={cn(
                        'relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300',
                        isCompleted && 'bg-green-600',
                        isCurrent && 'border-2 border-blue-600 bg-white',
                        isUpcoming && 'border-2 border-gray-300 bg-white'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isCurrent && 'text-blue-600',
                            isUpcoming && 'text-gray-500'
                          )}
                        >
                          {stepIdx + 1}
                        </span>
                      )}
                    </span>
                  </span>

                  {/* Step Label */}
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors duration-300',
                        isCompleted && 'text-gray-900',
                        isCurrent && 'text-blue-600',
                        isUpcoming && 'text-gray-500'
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{step.description}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
