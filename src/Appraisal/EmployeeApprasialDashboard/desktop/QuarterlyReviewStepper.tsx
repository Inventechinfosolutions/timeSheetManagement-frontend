import React from 'react';
import { Check } from 'lucide-react';
import { ReviewStatus } from '../enums/Appraisal.enums';

interface StepperProps {
  currentStep: number;
  onChangeStep: (step: number) => void;
}

const STEP_LABELS = [
  { title: 'Overview' },
  { title: 'Achievements' },
  { title: 'Challenges' },
  { title: 'Learning & Goals' },
  { title: 'Review & Confirm' },
];

export const QuarterlyReviewStepper: React.FC<StepperProps> = ({
  currentStep,
  onChangeStep,
}) => {
  const getStepState = (idx: number): 'Completed' | 'Active' | 'Upcoming' => {
    if (idx < currentStep) return 'Completed';
    if (idx === currentStep) return 'Active';
    return 'Upcoming';
  };

  const getLineColorClass = (idx: number) => {
    if (idx + 1 < currentStep) return 'bg-emerald-500';
    if (idx + 1 === currentStep) return 'bg-gradient-to-r from-emerald-500 to-indigo-600';
    return 'bg-slate-200';
  };

  return (
    <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl mb-8 shadow-sm overflow-x-auto">
      <div className="flex items-start xl:items-center justify-between w-full min-w-[600px] xl:min-w-0">
        {STEP_LABELS.map((step, idx) => {
          const state = getStepState(idx);
          const isLast = idx === STEP_LABELS.length - 1;

          return (
            <React.Fragment key={idx}>
              {/* Step item wrapper - vertical stacked on zoomed/smaller screens, horizontal on wide unzoomed screens */}
              <div className="flex flex-col xl:flex-row items-center gap-2 xl:gap-2.5 shrink-0 relative group">
                <button
                  type="button"
                  onClick={() => onChangeStep(idx)}
                  className={`flex items-center justify-center shrink-0 w-10 h-10 rounded-full font-bold text-sm transition-all duration-200 ${state === ReviewStatus.COMPLETED
                    ? 'bg-emerald-50 border border-emerald-500 text-emerald-500 hover:bg-emerald-100'
                    : state === ReviewStatus.ACTIVE
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                >
                  {state === ReviewStatus.COMPLETED ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    idx + 1
                  )}
                </button>

                {/* Step Text Label */}
                <div className="flex flex-col text-center xl:text-left shrink-0 max-w-[100px] xl:max-w-none">
                  <div className="font-bold text-slate-800 text-[12px] sm:text-[13px] xl:text-[14px] leading-tight">
                    {step.title}
                  </div>
                  <div
                    className={`text-[10px] xl:text-[12px] font-semibold mt-0.5 ${state === ReviewStatus.COMPLETED
                      ? 'text-emerald-600'
                      : state === ReviewStatus.ACTIVE
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                      }`}
                  >
                    {state === ReviewStatus.COMPLETED ? ReviewStatus.COMPLETED : state === ReviewStatus.ACTIVE ? ReviewStatus.IN_PROGRESS : ReviewStatus.UPCOMING}
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className={`flex-1 h-[2px] mt-5 xl:mt-0 min-w-[20px] rounded-full shrink ${getLineColorClass(idx)}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};