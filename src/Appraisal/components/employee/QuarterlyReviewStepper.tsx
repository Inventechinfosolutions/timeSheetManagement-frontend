import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  Trophy,
  Users,
  GraduationCap,
  Building2,
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

interface QuarterlyReviewStepperProps {
  assignment: QuarterlyReviewAssignment;
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

const STEP_DEFINITIONS = [
  { id: 1, label: "Overview", icon: FileCheck },
  { id: 2, label: "Achievements", icon: Trophy },
  { id: 3, label: "Teamwork", icon: Users },
  { id: 4, label: "Learning Goals", icon: GraduationCap },
  { id: 5, label: "Environment", icon: Building2 },
  { id: 6, label: "Final Review", icon: Send },
];

export const QuarterlyReviewStepper: React.FC<QuarterlyReviewStepperProps> = ({
  assignment,
  onBack,
  onSubmitSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ReviewFormData>(initialReviewFormData);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleFieldChange = (field: keyof ReviewFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onSubmitSuccess?.();
    }, 1200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Top Header Card */}
      <Card className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E0E5F2] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-[#4318FF] hover:text-[#3311CC] !p-2 rounded-xl"
              title="Back to history"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1B2559]">
                  {assignment.quarter} Performance Review
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-[#1B2559] border border-gray-200">
                  {assignment.status === "assigned" ? "Assigned" : "In Progress"}
                </span>
              </div>
              <p className="text-xs text-[#707EAE] mt-0.5">
                {assignment.financialYear} • Deadline: <span className="font-semibold text-[#1B2559]">{assignment.deadline}</span> • Assigned by {assignment.assignedBy}
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-[#A3AED0] block">Progress</span>
            <span className="text-sm font-bold text-[#4318FF]">Step {currentStep} of 6</span>
          </div>
        </div>

        {/* 6-Step Indicator Bar */}
        <div className="mt-6 pt-5 border-t border-gray-100 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center justify-between min-w-[620px] gap-2">
            {STEP_DEFINITIONS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              const StepIcon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Tab */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer select-none text-left shrink-0 ${
                      isActive
                        ? "bg-[#4318FF] text-white shadow-md shadow-indigo-100 font-bold"
                        : isCompleted
                        ? "bg-[#E6F9F0] text-[#05CD99] hover:bg-[#D1F7E4] font-semibold"
                        : "bg-[#F4F7FE] text-[#707EAE] hover:text-[#1B2559] hover:bg-gray-100 font-medium"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-xs whitespace-nowrap">{step.label}</span>
                  </button>

                  {/* Connector Line */}
                  {idx < STEP_DEFINITIONS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-colors ${
                        isCompleted ? "bg-[#05CD99]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Step Body Card */}
      <Card className="rounded-3xl p-6 sm:p-8 bg-white border border-[#E0E5F2] shadow-sm">
        {submitted ? (
          <div className="py-16 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-[#E6F9F0] text-[#05CD99] mx-auto flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-[#1B2559]">Quarterly Review Submitted!</h3>
            <p className="text-sm text-[#707EAE] mt-1 max-w-md mx-auto">
              Your self-evaluation has been successfully recorded. Your manager has been notified for subsequent review.
            </p>
          </div>
        ) : (
          <>
            {currentStep === 1 && <OverviewStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 2 && <AchievementsStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 3 && <TeamContributionStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 4 && <LearningGoalsStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 5 && <CompanyEnvironmentStep formData={formData} onChange={handleFieldChange} />}
            {currentStep === 6 && <ReviewStep formData={formData} onChange={handleFieldChange} />}

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-5 py-2.5 rounded-xl border-[#E0E5F2] text-[#1B2559] font-bold disabled:opacity-40"
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onBack}
                  className="text-[#707EAE] hover:text-[#1B2559]"
                >
                  Save & Exit
                </Button>

                {currentStep < 6 ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100"
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
