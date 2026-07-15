import React from 'react';
import { FileText, Award, AlertCircle, Compass, CheckCircle } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onChangeStep: (step: number) => void;
}

export const QuarterlyReviewStepperMobile: React.FC<StepperProps> = ({
  currentStep,
  onChangeStep,
}) => {
  const steps = [
    { title: 'Overview',          icon: FileText,      color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200'  },
    { title: 'Achievements',      icon: Award,         color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { title: 'Challenges',        icon: AlertCircle,   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'    },
    { title: 'Learning & Goals',  icon: Compass,       color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200'  },
    { title: 'Review',            icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  ];

  const currentStepInfo = steps[currentStep];
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="bg-white border border-slate-100 p-4 rounded-2xl mb-6 shadow-sm">
      {/* Progress Info */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-sm font-bold text-slate-800">
          {currentStepInfo.title}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Indicator Icons */}
      <div className="flex justify-between items-center px-2">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <button
              key={idx}
              onClick={() => onChangeStep(idx)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
                isActive
                  ? `${step.bg} border-2 scale-110 shadow-sm`
                  : isCompleted
                    ? 'bg-indigo-50/50 border-indigo-100 text-indigo-500'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}
            >
              <StepIcon className={`w-5 h-5 ${isActive ? step.color : ''}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
