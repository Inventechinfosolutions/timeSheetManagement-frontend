import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onChangeStep: (step: number) => void;
}

const STEP_LABELS = [
  { title: 'Overview' },
  { title: 'Achievements' },
  { title: 'Challenges Faced & Blockers' },
  { title: 'Learning & Future Goals' },
  { title: 'Review & Confirm' },
];

export const QuarterlyReviewStepper: React.FC<StepperProps> = ({
  currentStep,
  onChangeStep,
}) => {
  const getStepState = (idx: number): 'completed' | 'active' | 'upcoming' => {
    if (idx < currentStep) return 'completed';
    if (idx === currentStep) return 'active';
    return 'upcoming';
  };

  const getLineColorClass = (idx: number) => {
    if (idx + 1 < currentStep) return 'bg-emerald-500';
    if (idx + 1 === currentStep) return 'bg-gradient-to-r from-emerald-500 to-indigo-600';
    return 'bg-slate-200';
  };

  return (
    <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl mb-8 shadow-sm">
      <div className="flex items-center justify-between w-full gap-2 overflow-x-hidden">
        {STEP_LABELS.map((step, idx) => {
          const state = getStepState(idx);
          const isLast = idx === STEP_LABELS.length - 1;

          return (
            <React.Fragment key={idx}>
              {/* Step item wrapper */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onChangeStep(idx)}
                  className={`flex items-center justify-center shrink-0 w-10 h-10 rounded-full font-bold text-sm transition-all duration-200 ${
                    state === 'completed'
                      ? 'bg-emerald-50 border border-emerald-500 text-emerald-500 hover:bg-emerald-100'
                      : state === 'active'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {state === 'completed' ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    idx + 1
                  )}
                </button>
                
                <div className="flex flex-col text-left shrink-0">
                  <div className="font-bold text-slate-800 text-[13px] sm:text-[14px] leading-tight">
                    {step.title}
                  </div>
                  <div
                    className={`text-[11px] sm:text-[12px] font-semibold mt-0.5 ${
                      state === 'completed'
                        ? 'text-emerald-600'
                        : state === 'active'
                          ? 'text-indigo-600'
                          : 'text-slate-400'
                    }`}
                  >
                    {state === 'completed' ? 'Completed' : state === 'active' ? 'In Progress' : 'Upcoming'}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className={`flex-1 h-[2px] min-w-[24px] rounded-full shrink ${getLineColorClass(idx)}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};