import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Send,
  AlertCircle,
} from "lucide-react";
import { ReviewFormData, QuarterlyReviewAssignment, StoredPerformanceFile } from "../../types/appraisal.types";
import { emptyReviewFormData } from "../../constants/emptyReviewForm";
import { AppraisalApi, readApiError, toPerformancePayload, toReviewFormData } from "../../services/appraisal.api";
import { QuaterlyEnum } from "../../enums/appraisal.enums";
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
  initialFormData?: ReviewFormData;
  readOnly?: boolean;
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

const quarterValue = (value: string): QuaterlyEnum | null => {
  if (
    value === QuaterlyEnum.Q1 ||
    value === QuaterlyEnum.Q2 ||
    value === QuaterlyEnum.Q3 ||
    value === QuaterlyEnum.Q4
  ) {
    return value;
  }
  return null;
};

export const QuarterlyReviewStepper: React.FC<QuarterlyReviewStepperProps> = ({
  assignment,
  initialFormData,
  readOnly = false,
  onBack,
  onSubmitSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [exitingStep, setExitingStep] = useState<number | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [formData, setFormData] = useState<ReviewFormData>(initialFormData || emptyReviewFormData);
  const [performanceId, setPerformanceId] = useState<number | null>(assignment.performanceId ?? null);
  const formDataRef = useRef(formData);
  const performanceIdRef = useRef(performanceId);
  formDataRef.current = formData;
  performanceIdRef.current = performanceId;
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");
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
      const savedProjects = (data.projects || []).filter(
        (project) => project.title.trim() && project.description.trim() && project.challenge.trim(),
      );
      if (savedProjects.length === 0) {
        stepErrors.projects = "Add at least one project.";
        if (!firstFieldId) firstFieldId = "field-projects";
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
      const goals = (data.learningGoalItems || []).filter((goal) => goal.trim());
      if (goals.length === 0) {
        stepErrors.learningGoals = "Add at least one learning goal.";
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

  const ensurePerformanceId = async (): Promise<number> => {
    if (performanceIdRef.current) {
      return performanceIdRef.current;
    }
    const quarter = quarterValue(assignment.quarter);
    if (!assignment.employeeId || !quarter || !assignment.financialYear) {
      throw new Error("This quarter is missing an employee, quarter, or financial year.");
    }
    const created = await AppraisalApi.createPerformance(
      toPerformancePayload(
        assignment.employeeId,
        quarter,
        assignment.financialYear,
        formDataRef.current,
      ),
    );
    performanceIdRef.current = created.id;
    setPerformanceId(created.id);
    return created.id;
  };

  const uploadAttachment = async (file: File): Promise<StoredPerformanceFile> => {
    try {
      const id = await ensurePerformanceId();
      return await AppraisalApi.uploadPerformanceAttachment(id, file);
    } catch (error) {
      throw new Error(error instanceof Error && error.message && !("isAxiosError" in error) ? error.message : readApiError(error));
    }
  };

  const removeAttachment = async (objectKey: string): Promise<void> => {
    const id = performanceIdRef.current;
    if (!id || !objectKey) {
      return;
    }
    try {
      await AppraisalApi.removePerformanceAttachment(id, objectKey);
    } catch (error) {
      throw new Error(readApiError(error));
    }
  };

  const persistStep = async (asDraft = false): Promise<boolean> => {
    const quarter = quarterValue(assignment.quarter);
    if (!assignment.employeeId || !quarter || !assignment.financialYear) {
      setSaveError("This quarter is missing an employee, quarter, or financial year.");
      return false;
    }
    const payload = toPerformancePayload(
      assignment.employeeId,
      quarter,
      assignment.financialYear,
      formData,
    );
    setSaving(true);
    setSaveError("");
    try {
      const existingId = performanceIdRef.current;
      if (existingId) {
        await AppraisalApi.updatePerformance(existingId, payload);
        return true;
      }
      const saved = asDraft
        ? await AppraisalApi.savePerformanceDraft(payload)
        : await AppraisalApi.createPerformance(payload);
      performanceIdRef.current = saved.id;
      setPerformanceId(saved.id);
      return true;
    } catch (error) {
      setSaveError(readApiError(error));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const loadFreshForm = async (): Promise<boolean> => {
    const id = performanceIdRef.current;
    if (!id) {
      return true;
    }
    try {
      const performance = await AppraisalApi.getPerformanceById(id);
      const fresh = toReviewFormData(performance);
      formDataRef.current = fresh;
      performanceIdRef.current = performance.id;
      setPerformanceId(performance.id);
      setFormData(fresh);
      return true;
    } catch (error) {
      setSaveError(readApiError(error));
      return false;
    }
  };

  const handleNext = async () => {
    if (readOnly) {
      if (currentStep < 6) {
        setErrors({});
        goToStep(currentStep + 1, true);
      }
      return;
    }
    if (currentStep >= 6 || saving) {
      return;
    }
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setErrors(validation.errors);
      scrollToField(validation.firstFieldId);
      return;
    }
    const saved = await persistStep();
    if (!saved) {
      return;
    }
    const loaded = await loadFreshForm();
    if (!loaded) {
      return;
    }
    setErrors({});
    goToStep(currentStep + 1, true);
  };

  const handlePrev = async () => {
    if (readOnly) {
      if (currentStep > 1) {
        setErrors({});
        goToStep(currentStep - 1, true);
      }
      return;
    }
    if (currentStep <= 1 || saving) {
      return;
    }
    const saved = await persistStep();
    if (!saved) {
      return;
    }
    const loaded = await loadFreshForm();
    if (!loaded) {
      return;
    }
    setErrors({});
    goToStep(currentStep - 1, true);
  };

  const handleStepClick = async (targetStep: number) => {
    if (readOnly) {
      if (targetStep !== currentStep) {
        setErrors({});
        goToStep(targetStep, true);
      }
      return;
    }
    if (targetStep === currentStep || saving) return;

    if (targetStep > currentStep) {
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

    const saved = await persistStep();
    if (!saved) {
      return;
    }
    const loaded = await loadFreshForm();
    if (!loaded) {
      return;
    }
    setErrors({});
    goToStep(targetStep, true);
  };

  const handleSaveAndExit = async () => {
    if (readOnly) {
      onBack();
      return;
    }
    if (saving) {
      return;
    }
    const saved = await persistStep(true);
    if (!saved) {
      return;
    }
    scrollToTop();
    onBack();
  };

  const handleSubmit = async () => {
    if (saving) {
      return;
    }
    for (let s = 1; s <= 5; s++) {
      const validation = validateStep(s);
      if (!validation.isValid) {
        goToStep(s, false);
        setErrors(validation.errors);
        scrollToField(validation.firstFieldId);
        return;
      }
    }
    const saved = await persistStep();
    if (!saved) {
      return;
    }
    const quarter = quarterValue(assignment.quarter);
    const performanceId = performanceIdRef.current;
    if (!quarter || !performanceId) {
      return;
    }
    setSaving(true);
    try {
      await AppraisalApi.submitPerformance(performanceId, {
        employeeId: assignment.employeeId,
        quarter,
        financialYear: assignment.financialYear,
      });
    } catch (error) {
      setSaveError(readApiError(error));
      setSaving(false);
      return;
    }
    setSaving(false);
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
            onUploadAttachment={uploadAttachment}
            onRemoveAttachment={removeAttachment}
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
              className="text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50/80 !p-2 rounded-xl cursor-pointer"
              title="Back to history"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight w-fit">
                  <span className="manager-review-title-anim">
                    {assignment.quarter} Performance Review
                  </span>
                </h1>
              </div>
              <p className="text-xs mt-0.5 font-normal w-fit">
                <span className="manager-review-subtitle-anim">
                  {assignment.financialYear} • Deadline:{" "}
                  <strong className="font-semibold text-[#0F172A]">{assignment.deadline}</strong> •
                  {" "}Assigned by {assignment.assignedBy}
                  {readOnly ? " • View only" : ""}
                </span>
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-[#64748B] block">Progress</span>
            <span className="text-sm font-bold text-[#2563EB]">Step {currentStep} of 6</span>
          </div>
        </div>

        {/* Numbered Stepper with Title Below and Click Navigation */}
        <div className="mt-7 pt-6 border-t border-blue-100 overflow-x-auto no-scrollbar pb-2">
          <div className="relative flex items-center justify-between min-w-[620px] px-6">
            {/* Background connecting progress line */}
            <div className="absolute top-5 -translate-y-1/2 left-[44px] right-[44px] h-[3px] bg-blue-100 rounded-full z-0">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-[#2563EB] rounded-full transition-all duration-500 ease-out shadow-xs"
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
                        ? "bg-[#2563EB] text-white ring-4 ring-blue-400/30 shadow-lg shadow-blue-500/25 scale-110 stepper-circle-active"
                        : isCompleted
                        ? "bg-blue-500 text-white shadow-xs hover:scale-105 border-2 border-blue-500"
                        : "bg-white text-[#64748B] border-2 border-blue-200/80 hover:border-[#2563EB] hover:text-[#2563EB] hover:scale-105"
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
                        ? "text-[#2563EB] font-extrabold scale-105"
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
            <div className="w-16 h-16 rounded-full bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center mb-4 shadow-sm border border-[#BFDBFE]">
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
            <fieldset disabled={readOnly} className="relative overflow-hidden min-h-[380px] border-0 p-0 m-0 min-w-0">
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
            </fieldset>

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-blue-100">
              {currentStep === 1 ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={onBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="px-5 py-2.5 rounded-xl border-blue-200/80 bg-white/80 hover:bg-white text-[#0F172A] font-bold shadow-xs cursor-pointer hover:border-blue-400"
                >
                  Back
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handlePrev}
                  className="px-5 py-2.5 rounded-xl border-blue-200/80 bg-white/80 hover:bg-white text-[#0F172A] font-bold shadow-xs cursor-pointer hover:border-blue-400"
                >
                  Previous
                </Button>
              )}

              <div className="flex items-center gap-3">
                {saveError ? <p className="text-xs font-bold text-red-600">{saveError}</p> : null}
                {!readOnly && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => void handleSaveAndExit()}
                  disabled={saving}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  {saving ? "Saving" : "Save & Exit"}
                </Button>
                )}

                {readOnly && currentStep === 6 ? null : currentStep < 6 ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => void handleNext()}
                    disabled={saving}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="px-6 py-2.5 rounded-xl font-bold !bg-gradient-to-b !from-[#3B82F6] !to-[#1D4ED8] hover:!from-[#2563EB] hover:!to-[#1E40AF] !text-white shadow-md shadow-blue-500/30 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all !shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45),0_8px_20px_rgba(37,99,235,0.35)]"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => void handleSubmit()}
                    disabled={saving}
                    leftIcon={<Send className="w-4 h-4 fill-white -rotate-12" />}
                    className="px-7 py-2.5 rounded-xl font-bold !bg-gradient-to-b !from-[#3B82F6] !to-[#1D4ED8] hover:!from-[#2563EB] hover:!to-[#1E40AF] !text-white shadow-md shadow-blue-500/30 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 !shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45),0_8px_20px_rgba(37,99,235,0.4)]"
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
