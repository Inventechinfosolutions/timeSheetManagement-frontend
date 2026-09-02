import React from 'react';
import { Check } from 'lucide-react';
import { ReviewStatus } from '../enums/Appraisal.enums';
import { QuarterlyReviewStepperMobile } from '../mobile/QuarterlyReviewStepperMobile';

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
  { title: 'Review' },
];

export const QuarterlyReviewStepper: React.FC<StepperProps> = ({
  currentStep,
  onChangeStep,
}) => {
  const getStepState = (
    idx: number
  ): 'Completed' | 'Active' | 'Upcoming' => {
    if (idx < currentStep) return 'Completed';
    if (idx === currentStep) return 'Active';
    return 'Upcoming';
  };

  // % of the line (between first and last circle centers) that should be green
  const progressPercent =
    STEP_LABELS.length > 1
      ? (Math.min(currentStep, STEP_LABELS.length - 1) /
          (STEP_LABELS.length - 1)) *
        100
      : 0;

  return (
    <>
      {/* Mobile */}
      <div className="xl:hidden">
        <QuarterlyReviewStepperMobile
          currentStep={currentStep}
          onChangeStep={onChangeStep}
        />
      </div>

      {/* Desktop */}
      <div className="hidden xl:block">
        <div className="bg-white border border-slate-100 px-10 py-4 rounded-2xl mb-2 shadow-sm">
          <div className="relative w-full">
            {/* Connector line track (touches circle edges: inset by half the circle width, 40px -> 20px) */}
            <div className="absolute top-5 left-5 right-5 h-[2px] bg-slate-200 z-0" />
            <div
              className="absolute top-5 left-5 h-[2px] bg-emerald-500 z-0 transition-all duration-300"
              style={{
                width:
                  progressPercent === 0
                    ? '0px'
                    : `calc(${progressPercent}% - ${
                        (progressPercent / 100) * 40
                      }px)`,
              }}
            />

            {/* Steps */}
            <div className="relative z-10 flex justify-between">
              {STEP_LABELS.map((step, idx) => {
                const state = getStepState(idx);

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center w-10"
                  >
                    {/* Circle */}
                    <button
                      type="button"
                      onClick={() => onChangeStep(idx)}
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shrink-0 ${
                        state === ReviewStatus.COMPLETED
                          ? 'bg-emerald-50 border border-emerald-500 text-emerald-500'
                          : state === ReviewStatus.ACTIVE
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-400'
                      }`}
                    >
                      {state === ReviewStatus.COMPLETED ? (
                        <Check className="w-5 h-5" strokeWidth={3} />
                      ) : (
                        idx + 1
                      )}
                    </button>

                    {/* Title */}
                    <div className="text-center w-max max-w-[140px]">
                      <div className="font-bold text-sm whitespace-nowrap">
                        {step.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};