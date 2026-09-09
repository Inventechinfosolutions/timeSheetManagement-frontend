import React from 'react';
import { Check } from 'lucide-react';
import { ReviewStatus } from '../enums/Appraisal.enums';
import { QuarterlyReviewStepperMobile } from '../mobile/QuarterlyReviewStepperMobile';
import './quarterlyReviewDesktop.css';

interface StepperProps {
  currentStep: number;
  onChangeStep: (step: number) => void;
}

const StepperArt = () => (
  <svg
    className="qr-stepper-art"
    viewBox="0 0 88 72"
    width="88"
    height="72"
    aria-hidden
  >
    <ellipse cx="44" cy="40" rx="40" ry="26" fill="#e8f1ff" />
    <ellipse cx="22" cy="38" rx="16" ry="14" fill="#dce8ff" />
    <path d="M18 50c2-10 8-18 12-20 1 6-1 14-4 22-3 2-7 1-8-2z" fill="#3d6bff" />
    <path d="M30 48c-2-9 2-18 8-22 0 7-2 15-5 22-2 2-3 2-3 0z" fill="#5b8cff" />
    <path d="M24 46c6-8 14-10 18-8-4 6-10 12-16 14-2 0-3-3-2-6z" fill="#7aa1ff" />
    <rect x="42" y="10" width="34" height="44" rx="8" fill="#fff" stroke="#4d7cff" strokeWidth="3.5" />
    <path d="M64 10h12v12L64 10z" fill="#cfe0ff" stroke="#4d7cff" strokeWidth="3.5" strokeLinejoin="round" />
    <rect x="50" y="24" width="18" height="3.5" rx="1.75" fill="#b7d0ff" />
    <rect x="50" y="31" width="14" height="3.5" rx="1.75" fill="#b7d0ff" />
    <rect x="50" y="38" width="16" height="3.5" rx="1.75" fill="#b7d0ff" />
    <circle cx="18" cy="14" r="1.6" fill="#fff" />
    <circle cx="78" cy="20" r="1.4" fill="#fff" />
    <path d="M14 22l1.2 2.6L18 26l-2.8 1.2L14 30l-1.2-2.8L10 26l2.8-1.4L14 22z" fill="#fff" />
  </svg>
);
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

  const progressPercent =
    STEP_LABELS.length > 1
      ? (Math.min(currentStep, STEP_LABELS.length - 1) /
          (STEP_LABELS.length - 1)) *
        100
      : 0;

  return (
    <>
      <div className="xl:hidden">
        <QuarterlyReviewStepperMobile
          currentStep={currentStep}
          onChangeStep={onChangeStep}
        />
      </div>

      <div className="hidden xl:block">
        <div className="qr-stepper-card relative px-6 pr-8 py-3 rounded-[28px] mb-3">
          <div className="qr-glass-shine" />
          <div className="relative z-10 w-full flex items-center gap-6">
            <StepperArt />
            <div className="relative flex-1 min-w-0">
            <div className="absolute top-[18px] left-5 right-5 h-[2px] rounded-full bg-[#d6e4ff] z-0" />
            <div
              className="absolute top-[18px] left-5 h-[2px] rounded-full qr-progress-line z-0 transition-all duration-300"
              style={{
                width:
                  progressPercent === 0
                    ? '0px'
                    : `calc(${progressPercent}% - ${
                        (progressPercent / 100) * 40
                      }px)`,
              }}
            />

            <div className="relative z-10 flex justify-between">
              {STEP_LABELS.map((step, idx) => {
                const state = getStepState(idx);

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center w-12"
                  >
                    <div className="h-9 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onChangeStep(idx)}
                        className={`z-10 flex items-center justify-center rounded-full font-bold shrink-0 transition-all duration-200 ${
                          state === ReviewStatus.COMPLETED
                            ? 'qr-step-circle-done w-7 h-7 text-[11px]'
                            : state === ReviewStatus.ACTIVE
                              ? 'qr-step-circle-active w-9 h-9 text-sm'
                              : 'qr-step-circle-upcoming w-8 h-8 text-xs'
                        }`}
                      >
                        {state === ReviewStatus.COMPLETED ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          idx + 1
                        )}
                      </button>
                    </div>

                    <div className="text-center w-max max-w-[140px] mt-1.5">
                      <div
                        className={`font-semibold text-xs whitespace-nowrap ${
                          state === ReviewStatus.ACTIVE
                            ? 'text-[#3d6bff]'
                            : state === ReviewStatus.COMPLETED
                              ? 'text-[#4d7cff]'
                              : 'text-slate-400'
                        }`}
                      >
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
      </div>
    </>
  );
};
