import React from 'react';

interface StepperProps {
  currentStep: number;
  onChangeStep: (step: number) => void;
}

const STEP_LABELS = [
  { title: 'Overview' },
  { title: 'Achievements' },
  { title: 'Challenges' },
  { title: 'Goals' },
  { title: 'Review' },
];

export const QuarterlyReviewStepperMobile: React.FC<StepperProps> = ({
  currentStep,
  onChangeStep,
}) => {
  return (
    <div className="bg-white border border-slate-100 p-3 sm:p-4 rounded-2xl mb-6 shadow-sm w-full">
      {/* 5-Column Grid layout prevents overflow without scrollbars */}
      <div className="relative grid grid-cols-5 w-full">

        {/* Background Progress Line */}
        <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-slate-200 -z-0" />

        {/* Active Progress Line */}
        <div
          className="absolute top-4 left-[10%] h-[2px] bg-indigo-600 transition-all duration-300 -z-0"
          style={{
            width: `${(currentStep / (STEP_LABELS.length - 1)) * 80}%`
          }}
        />

        {STEP_LABELS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={idx} className="flex flex-col items-center z-10 w-full px-0.5">
              <button
                type="button"
                onClick={() => onChangeStep(idx)}
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 font-bold text-xs sm:text-sm transition-all duration-200 bg-white ${isActive
                  ? 'border-indigo-600 text-indigo-600 shadow-sm scale-105'
                  : isCompleted
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-slate-300 text-slate-400'
                  }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </button>

              {/* Step Title Below Circle */}
              <span
                className={`text-[10px] sm:text-[11px] mt-1.5 text-center leading-tight break-words max-w-full ${isActive
                  ? 'text-indigo-600 font-bold'
                  : isCompleted
                    ? 'text-slate-700 font-semibold'
                    : 'text-slate-400 font-normal'
                  }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};