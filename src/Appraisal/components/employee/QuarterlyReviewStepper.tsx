import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Send,
  AlertCircle,
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
  const [exitingStep, setExitingStep] = useState<number | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [formData, setFormData] = useState<ReviewFormData>(initialReviewFormData);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<any>(null);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
    const mainElements = document.querySelectorAll("main");
    mainElements.forEach((m) => {
      m.scrollTop = 0;
      if (typeof m.scrollTo === "function") {
        m.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    });
  };

  useEffect(() => {
    scrollToTop();
    const raf = requestAnimationFrame(scrollToTop);
    const t = setTimeout(scrollToTop, 60);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const goToStep = (targetStep: number, shouldScroll: boolean = true) => {
    if (targetStep === currentStep || targetStep < 1 || targetStep > 6) return;
    const dir = targetStep > currentStep ? "forward" : "backward";
    setDirection(dir);
    setExitingStep(currentStep);
    setCurrentStep(targetStep);

    if (shouldScroll) {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
      setTimeout(scrollToTop, 40);
    }

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      setExitingStep(null);
    }, 480);
  };

  const scrollToField = (fieldId?: string) => {
    if (!fieldId) return;
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        const focusTarget = el.matches("input, textarea, button")
          ? (el as HTMLElement)
          : (el.querySelector("input, textarea, button") as HTMLElement | null);
        if (focusTarget && typeof focusTarget.focus === "function") {
          focusTarget.focus({ preventScroll: true });
        }

        el.classList.remove("eval-field-error-pulse");
        // Trigger reflow
        void el.offsetWidth;
        el.classList.add("eval-field-error-pulse");
        setTimeout(() => {
          el.classList.remove("eval-field-error-pulse");
        }, 1500);
      }
    }, 120);
  };

  const handleClearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFieldChange = (field: keyof ReviewFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    handleClearError(field as string);
  };

  const validateStep = (
    stepNum: number,
    data: ReviewFormData = formData
  ): { isValid: boolean; errors: Record<string, string>; firstFieldId?: string } => {
    const stepErrors: Record<string, string> = {};
    let firstFieldId: string | undefined = undefined;

    if (stepNum === 1) {
      const overview = (data.overview || data.roleSummary || "").trim();
      if (!overview) {
        stepErrors.overview = "Role & quarter overview summary is required.";
        if (!firstFieldId) firstFieldId = "field-overview";
      }
    } else if (stepNum === 2) {
      const title = (data.projectTitle || data.majorAchievements || "").trim();
      const desc = (data.projectDescription || data.kpisMet || "").trim();
      const challenge = (data.projectChallenge || data.challengesOvercome || "").trim();

      if (!title) {
        stepErrors.projectTitle = "Project title is required.";
        if (!firstFieldId) firstFieldId = "field-projectTitle";
      }
      if (!desc) {
        stepErrors.projectDescription = "Project description is required.";
        if (!firstFieldId) firstFieldId = "field-projectDescription";
      }
      if (!challenge) {
        stepErrors.projectChallenge = "Challenge overcome is required.";
        if (!firstFieldId) firstFieldId = "field-projectChallenge";
      }
    } else if (stepNum === 3) {
      const ratings = data.teamRatings || {};
      const CRITERIA = [
        { key: "communication", title: "Communication" },
        { key: "ownership", title: "Ownership" },
        { key: "collaboration", title: "Collaboration" },
        { key: "problemSolving", title: "Problem Solving" },
        { key: "leadership", title: "Leadership" },
        { key: "adaptability", title: "Adaptability" },
      ];

      for (const c of CRITERIA) {
        const val = ratings[c.key as keyof typeof ratings];
        if (!val || val <= 0) {
          stepErrors[c.key] = `Please select a rating for ${c.title}.`;
          if (!firstFieldId) firstFieldId = `field-criterion-${c.key}`;
        }
      }
    } else if (stepNum === 4) {
      const goals = (
        data.learningGoals ||
        data.nextQuarterLearningGoals ||
        data.skillsAcquired ||
        ""
      ).trim();
      if (!goals) {
        stepErrors.learningGoals = "Continuous learning goals are required.";
        if (!firstFieldId) firstFieldId = "field-learningGoals";
      }
    } else if (stepNum === 5) {
      const culture = (data.workCultureFeedback || "").trim();
      const balance = (data.workLifeBalance || "").trim();
      const suggestions = (data.suggestionsForImprovement || data.toolingAndResources || "").trim();
      const rating = data.companyEnvironmentRating || data.managementSupportRating || 0;

      if (!culture) {
        stepErrors.workCultureFeedback = "Feedback on work culture is required.";
        if (!firstFieldId) firstFieldId = "field-workCultureFeedback";
      }
      if (!balance) {
        stepErrors.workLifeBalance = "Work-life balance feedback is required.";
        if (!firstFieldId) firstFieldId = "field-workLifeBalance";
      }
      if (!suggestions) {
        stepErrors.suggestionsForImprovement = "Suggestions for improvement are required.";
        if (!firstFieldId) firstFieldId = "field-suggestionsForImprovement";
      }
      if (!rating || rating <= 0) {
        stepErrors.companyEnvironmentRating = "Please rate the company environment (1 to 5).";
        if (!firstFieldId) firstFieldId = "field-companyEnvironmentRating";
      }
    }

    return {
      isValid: Object.keys(stepErrors).length === 0,
      errors: stepErrors,
      firstFieldId,
    };
  };

  const handleNext = () => {
    if (currentStep < 6) {
      const validation = validateStep(currentStep);
      if (!validation.isValid) {
        setErrors(validation.errors);
        scrollToField(validation.firstFieldId);
        return;
      }
      setErrors({});
      goToStep(currentStep + 1, true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setErrors({});
      goToStep(currentStep - 1, true);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;

    if (targetStep > currentStep) {
      // Validate all steps from currentStep up to targetStep - 1
      for (let s = currentStep; s < targetStep; s++) {
        const validation = validateStep(s);
        if (!validation.isValid) {
          if (s !== currentStep) {
            goToStep(s, false);
          }
          setErrors(validation.errors);
          scrollToField(validation.firstFieldId);
          return;
        }
      }
    }

    setErrors({});
    goToStep(targetStep, true);
  };

  const handleSaveAndExit = () => {
    scrollToTop();
    onBack();
  };

  const handleSubmit = () => {
    // Validate all 5 input steps before final submission
    for (let s = 1; s <= 5; s++) {
      const validation = validateStep(s);
      if (!validation.isValid) {
        goToStep(s, false);
        setErrors(validation.errors);
        scrollToField(validation.firstFieldId);
        return;
      }
    }

    setSubmitted(true);
    setTimeout(() => {
      onSubmitSuccess?.();
    }, 1200);
  };

  const renderStepContent = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return (
          <OverviewStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
          />
        );
      case 2:
        return (
          <AchievementsStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
          />
        );
      case 3:
        return (
          <TeamContributionStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
          />
        );
      case 4:
        return (
          <LearningGoalsStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
          />
        );
      case 5:
        return (
          <CompanyEnvironmentStep
            key="step-5-environment"
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
          />
        );
      case 6:
        return (
          <ReviewStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
          />
        );
      default:
        return null;
    }
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
              className="text-[#6D5284] hover:text-[#4A355E] !p-2 rounded-xl"
              title="Back to history"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  {assignment.quarter} Performance Review
                </h1>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {assignment.financialYear} • Deadline:{" "}
                <span className="font-semibold text-[#0F172A]">{assignment.deadline}</span> •
                Assigned by {assignment.assignedBy}
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-[#94A3B8] block">Progress</span>
            <span className="text-sm font-bold text-[#6D5284]">Step {currentStep} of 6</span>
          </div>
        </div>

        {/* Numbered Stepper with Title Below and Click Navigation */}
        <div className="mt-7 pt-6 border-t border-[#D7B6C7]/40 overflow-x-auto no-scrollbar pb-2">
          <div className="relative flex items-center justify-between min-w-[620px] px-6">
            {/* Background connecting progress line */}
            <div className="absolute top-5 -translate-y-1/2 left-[44px] right-[44px] h-[3px] bg-[#C5B0A0] rounded-full z-0">
              <div
                className="h-full bg-[#8D73A8] rounded-full transition-all duration-500 ease-out shadow-xs"
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
                  title={`Go to Step ${step.id}: ${step.label}`}
                  className="group relative z-10 flex flex-col items-center cursor-pointer select-none focus:outline-none transition-transform"
                >
                  {/* Circle with Step Number */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ease-out ${
                      isActive
                        ? "bg-[#6D5284] text-white ring-4 ring-teal-100 shadow-lg shadow-teal-300 scale-110 stepper-circle-active"
                        : isCompleted
                        ? "bg-[#8D73A8] text-white shadow-xs hover:scale-105 border-2 border-[#8D73A8]"
                        : "bg-white text-[#64748B] border-2 border-[#C5B0A0] hover:border-[#6D5284] hover:text-[#6D5284] hover:scale-105"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.8] animate-in zoom-in-50 duration-200" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>

                  {/* Title Placed Below Circle */}
                  <span
                    className={`mt-2 text-xs font-semibold text-center whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? "text-[#6D5284] font-extrabold scale-105"
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
            <div className="w-16 h-16 rounded-full bg-[#E6F9F0] text-[#8D73A8] mx-auto flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A]">Quarterly Review Submitted!</h3>
            <p className="text-sm text-[#64748B] mt-1 max-w-md mx-auto">
              Your self-evaluation has been successfully recorded. Your manager has been notified for subsequent review.
            </p>
          </div>
        ) : (
          <>
            {/* Animated Step Sliding Content Container */}
            <div className="relative overflow-hidden min-h-[380px]">
              {exitingStep !== null && (
                <div
                  key={`exit-${exitingStep}`}
                  className={`absolute inset-x-0 top-0 pointer-events-none ${
                    direction === "forward" ? "step-slide-out-up" : "step-slide-out-down"
                  }`}
                >
                  {renderStepContent(exitingStep)}
                </div>
              )}
              <div
                key={`enter-${currentStep}`}
                className={
                  exitingStep !== null
                    ? direction === "forward"
                      ? "step-slide-in-up"
                      : "step-slide-in-down"
                    : ""
                }
              >
                {renderStepContent(currentStep)}
              </div>
            </div>

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-[#D7B6C7]/40">
              {currentStep === 1 ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleSaveAndExit}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="px-5 py-2.5 rounded-xl border-[#D7B6C7] bg-white/80 hover:bg-white text-[#0F172A] font-bold shadow-xs cursor-pointer"
                >
                  Back
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handlePrev}
                  className="px-5 py-2.5 rounded-xl border-[#D7B6C7] bg-white/80 hover:bg-white text-[#0F172A] font-bold shadow-xs cursor-pointer"
                >
                  Previous
                </Button>
              )}

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
                    className="px-6 py-2.5 rounded-xl font-bold !bg-gradient-to-r !from-[#6D5284] !to-[#4A355E] hover:!opacity-95 !text-white shadow-md shadow-[#6D5284]/25 border-0"
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
