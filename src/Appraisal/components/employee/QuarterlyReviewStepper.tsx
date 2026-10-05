import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Send,
} from "lucide-react";
import { ReviewFormData, QuarterlyReviewAssignment } from "../../types/appraisal.types";
import { initialReviewFormData } from "../../mockData/quarterlyReview.mock";
import OverviewStep from "./steps/OverviewStep";
import AchievementsStep from "./steps/AchievementsStep";
import TeamContributionStep from "./steps/TeamContributionStep";
import LearningGoalsStep from "./steps/LearningGoalsStep";
import CompanyEnvironmentStep from "./steps/CompanyEnvironmentStep";
import ReviewStep from "./steps/ReviewStep";
import { Button, Card } from "../../../components/ui";
import "./AppraisalDashboard.css";

interface QuarterlyReviewStepperProps {
  assignment: QuarterlyReviewAssignment;
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

const STEP_DEFINITIONS = [
  { id: 1, label: "Overview" },
  { id: 2, label: "Achievements" },
  { id: 3, label: "Teamwork" },
  { id: 4, label: "Learning Goals" },
  { id: 5, label: "Environment" },
  { id: 6, label: "Final Review" },
];

export const QuarterlyReviewStepper: React.FC<QuarterlyReviewStepperProps> = ({
  assignment,
  onBack,
  onSubmitSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ReviewFormData>(initialReviewFormData);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFieldChange = (field: keyof ReviewFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
      scrollToTop();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      scrollToTop();
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
    scrollToTop();
  };

  const handleSaveAndExit = () => {
    scrollToTop();
    onBack();
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onSubmitSuccess?.();
    }, 1200);
  };

  return (
    <div ref={topRef} className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Top Header Card */}
      <Card className="rounded-3xl p-5 sm:p-6 manager-review-glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveAndExit}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-[#14B8A6] hover:text-[#0F766E] !p-2 rounded-xl"
              title="Back to history"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  {assignment.quarter} Performance Review
                </h1>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {assignment.financialYear} • Deadline: <span className="font-semibold text-[#0F172A]">{assignment.deadline}</span> • Assigned by {assignment.assignedBy}
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-[#94A3B8] block">Progress</span>
            <span className="text-sm font-bold text-[#14B8A6]">Step {currentStep} of 6</span>
          </div>
        </div>

        {/* Numbered Stepper with Title Below and Smooth Animations */}
        <div className="mt-7 pt-6 border-t border-[#99F6E4]/40 overflow-x-auto no-scrollbar pb-2">
          <div className="relative flex items-center justify-between min-w-[620px] px-6">
            {/* Background connecting progress line */}
            <div className="absolute top-5 -translate-y-1/2 left-[44px] right-[44px] h-[3px] bg-[#C5B0A0] rounded-full z-0">
              <div
                className="h-full bg-[#05CD99] rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{
                  width: `${((currentStep - 1) / (STEP_DEFINITIONS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Stepper Steps (Number in Circle, Title Below) */}
            {STEP_DEFINITIONS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  className="group relative z-10 flex flex-col items-center cursor-pointer select-none focus:outline-none transition-transform"
                >
                  {/* Circle with Step Number */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ease-out ${
                      isActive
                        ? "bg-[#14B8A6] text-white ring-4 ring-teal-100 shadow-lg shadow-teal-300 scale-110 stepper-circle-active"
                        : isCompleted
                        ? "bg-[#05CD99] text-white shadow-xs hover:scale-105 border-2 border-[#05CD99]"
                        : "bg-white text-[#64748B] border-2 border-[#C5B0A0] hover:border-[#14B8A6] hover:text-[#14B8A6] hover:scale-105"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.8] animate-in zoom-in-50 duration-200" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>

                  {/* Title Placed Below Circle (Outside of Circle) */}
                  <span
                    className={`mt-2 text-xs font-semibold text-center whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? "text-[#14B8A6] font-extrabold scale-105"
                        : isCompleted
                        ? "text-[#0F172A] font-semibold"
                        : "text-[#64748B] group-hover:text-[#0F172A]"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Step Body Card */}
      <Card className="rounded-3xl p-6 sm:p-8 manager-review-glass-card">
        {submitted ? (
          <div className="py-16 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-[#E6F9F0] text-[#05CD99] mx-auto flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A]">Quarterly Review Submitted!</h3>
            <p className="text-sm text-[#64748B] mt-1 max-w-md mx-auto">
              Your self-evaluation has been successfully recorded. Your manager has been notified for subsequent review.
            </p>
          </div>
        ) : (
          <>
            {currentStep === 1 && <OverviewStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 2 && <AchievementsStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 3 && <TeamContributionStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 4 && <LearningGoalsStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 5 && <CompanyEnvironmentStep key="step-5-environment" formData={formData} onChange={handleFieldChange} />}
            {currentStep === 6 && <ReviewStep formData={formData} onChange={handleFieldChange} />}

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-[#99F6E4]/40">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-5 py-2.5 rounded-xl border-[#99F6E4] bg-white/80 hover:bg-white text-[#0F172A] font-bold disabled:opacity-40 shadow-xs"
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleSaveAndExit}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  Save & Exit
                </Button>

                {currentStep < 6 ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="px-6 py-2.5 rounded-xl font-bold !bg-gradient-to-r !from-[#14B8A6] !to-[#0F766E] hover:!opacity-95 !text-white shadow-md shadow-teal-500/25 border-0"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="md"
                    onClick={handleSubmit}
                    leftIcon={<Send className="w-4 h-4 fill-white -rotate-12" />}
                    className="px-7 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-100"
                  >
                    Submit Review
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default QuarterlyReviewStepper;
