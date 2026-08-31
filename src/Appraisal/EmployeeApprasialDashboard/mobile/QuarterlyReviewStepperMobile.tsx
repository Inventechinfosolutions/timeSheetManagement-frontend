import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import './QuarterlyReviewStepperMobile.css';

interface StepperProps {
  currentStep: number;
  onChangeStep: (step: number) => void;
}

const STEP_LABELS = [
  { title: 'Overview' },
  { title: 'Achievements' },
  { title: 'Learning & Goals' },
  { title: 'Team Contribution' },
  { title: 'Company Environment' },
  { title: 'Review & Confirm' },
];

export const QuarterlyReviewStepperMobile: React.FC<StepperProps> = ({
  currentStep,
  onChangeStep,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const activeEl = stepRefs.current[currentStep];

    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentStep]);

  return (
    <div className="bg-white border border-slate-100 py-3 sm:p-4 rounded-2xl mb-3.5 shadow-sm w-full mobile-stepper-container">
      {/* Step counter - top right */}
      <div className="flex justify-end mb-2 px-1">
        <span className="text-xs sm:text-sm font-semibold text-slate-500">
          Step {currentStep + 1}/6
        </span>
      </div>

      <div className="mobile-stepper-scroll" ref={scrollContainerRef}>
        <div className="mobile-stepper-grid">
          <div className="mobile-progress-bg" />

          <div
            className="mobile-progress-active"
            style={{
              width: `${(currentStep / (STEP_LABELS.length - 1)) * 80}%`,
            }}
          />

          {STEP_LABELS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;

            return (
              <div
                key={idx}
                ref={(el) => {
                  stepRefs.current[idx] = el;
                }}
                className="mobile-step-item"
              >
                <button
                  type="button"
                  onClick={() => onChangeStep(idx)}
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-50 border border-emerald-500 text-emerald-500 hover:bg-emerald-100'
                      : isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      strokeWidth={3}
                    />
                  ) : (
                    idx + 1
                  )}
                </button>

                <div className="mobile-step-label">
                  <span className="mobile-step-title">
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};