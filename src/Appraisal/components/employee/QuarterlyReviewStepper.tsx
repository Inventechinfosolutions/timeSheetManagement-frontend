import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  StepOverviewIcon,
  StepAchievementsIcon,
  StepTeamworkIcon,
  StepGoalsIcon,
  StepEnvironmentIcon,
  StepFinalReviewIcon,
} from "./StepSvgIcons";
import {
  animateStepSlide,
  initActiveStepperCircle,
  animateFieldError,
} from "../../animations/appraisalAnimations";
import { ReviewFormData, QuarterlyReviewAssignment, StoredPerformanceFile } from "../../types/appraisal.types";
import { emptyReviewFormData } from "../../constants/emptyReviewForm";
import { AppraisalApi, readApiError, toPerformancePayload, toReviewFormData } from "../../reducers/appraisal.reducer";
import { EmployeePerformanceStatus, QuaterlyEnum, QuarterlyReviewStatus } from "../../enums/appraisal.enums";
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


const hasCompletedFirstStep = (data: ReviewFormData): boolean => {
  const overview = (data.overview || data.roleSummary || "").trim();
  return overview.length > 0;
};

const hasAnyDataEntered = (data: ReviewFormData): boolean => {
  if ((data.overview || data.roleSummary || "").trim().length > 0) return true;
  if (
    (data.projects || []).some(
      (p) =>
        (p.title || "").trim() ||
        (p.description || "").trim() ||
        (p.challenge || "").trim()
    )
  )
    return true;
  if (
    (data.projectTitle || "").trim() ||
    (data.projectDescription || "").trim() ||
    (data.projectChallenge || "").trim()
  )
    return true;
  if (
    (data.learningGoalItems || []).some((g) => g.trim().length > 0) ||
    (data.learningGoals || "").trim().length > 0
  )
    return true;
  if (
    (data.workCultureFeedback || "").trim() ||
    (data.workLifeBalance || "").trim() ||
    (data.suggestionsForImprovement || "").trim()
  )
    return true;
  if (data.companyEnvironmentRating && data.companyEnvironmentRating > 0) return true;
  if (data.managementSupportRating && data.managementSupportRating > 0) return true;
  if (
    data.teamRatings &&
    Object.values(data.teamRatings).some((v) => typeof v === "number" && v > 0)
  )
    return true;
  return false;
};


const isStepDone = (stepId: number, data: ReviewFormData): boolean => {
  if (stepId === 1) return Boolean((data.overview || data.roleSummary || "").trim());
  if (stepId === 2) {
    return Boolean(
      (data.projects && data.projects.length > 0) ||
      (data.projectTitle || "").trim() ||
      (data.majorAchievements || "").trim()
    );
  }
  if (stepId === 3) {
    return Boolean(
      data.teamRatings &&
      Object.values(data.teamRatings).some((v) => typeof v === "number" && v > 0)
    );
  }
  if (stepId === 4) {
    return Boolean(
      (data.learningGoalItems && data.learningGoalItems.length > 0) ||
      (data.learningGoals || "").trim()
    );
  }
  if (stepId === 5) {
    return Boolean(
      (data.workCultureFeedback || "").trim() ||
      (data.workLifeBalance || "").trim() ||
      (data.companyEnvironmentRating && data.companyEnvironmentRating > 0)
    );
  }
  return false;
};

const STEP_DEFINITIONS = [
  { id: 1, label: "Overview", IconComponent: StepOverviewIcon },
  { id: 2, label: "Achievements", IconComponent: StepAchievementsIcon },
  { id: 3, label: "Teamwork", IconComponent: StepTeamworkIcon },
  { id: 4, label: "Learning Goals", IconComponent: StepGoalsIcon },
  { id: 5, label: "Environment", IconComponent: StepEnvironmentIcon },
  { id: 6, label: "Final Review", IconComponent: StepFinalReviewIcon },
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
  const isLocked = readOnly || assignment.canEdit === false;
  const isReassignedReview = Boolean(
    (assignment.reassignCount && assignment.reassignCount >= 1) ||
    [
      QuarterlyReviewStatus.EDIT_GRANTED,
      QuarterlyReviewStatus.ALLOWED_TO_EDIT,
      QuarterlyReviewStatus.APPROVED_FOR_EDITING,
    ].some(
      (s) =>
        s &&
        (s.toUpperCase() === String(assignment.status || "").toUpperCase() ||
          s.toUpperCase() === String(assignment.reviewStatus || "").toUpperCase())
    ) ||
    Boolean(assignment.submittedAt)
  );
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

  const activeCircleRef = useRef<HTMLDivElement | null>(null);
  const enterContentRef = useRef<HTMLDivElement | null>(null);
  const exitContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return initActiveStepperCircle(activeCircleRef.current);
  }, [currentStep]);

  useEffect(() => {
    if (exitingStep !== null) {
      animateStepSlide(enterContentRef.current, exitContentRef.current, direction);
    }
  }, [currentStep, exitingStep, direction]);

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

        animateFieldError(el);
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

  const commitDraftsIfNeeded = (currentData: ReviewFormData): ReviewFormData => {
    let updated = { ...currentData };
    let hasChanged = false;

    // Step 2: Auto-commit project draft if all required fields are filled
    const pTitle = (updated.projectTitle || "").trim();
    const pDesc = (updated.projectDescription || "").trim();
    const pChallenge = (updated.projectChallenge || "").trim();
    if (pTitle && pDesc && pChallenge) {
      const existing = updated.projects || [];
      const newProject = {
        title: pTitle,
        description: pDesc,
        challenge: pChallenge,
        attachments: updated.projectAttachments ? [...updated.projectAttachments] : [],
      };
      updated = {
        ...updated,
        projects: [...existing, newProject],
        projectTitle: "",
        projectDescription: "",
        projectChallenge: "",
        projectAttachments: [],
      };
      hasChanged = true;
    }

    // Step 4: Auto-commit learning goal draft if filled
    const goalDraft = (updated.learningGoals || "").trim();
    if (goalDraft) {
      const existingGoals = updated.learningGoalItems || [];
      const newGoals = [...existingGoals, goalDraft];
      updated = {
        ...updated,
        learningGoalItems: newGoals,
        learningGoals: "",
        skillsAcquired: newGoals.join("\n"),
        nextQuarterLearningGoals: newGoals.join("\n"),
      };
      hasChanged = true;
    }

    return hasChanged ? updated : currentData;
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
      const pTitle = (data.projectTitle || "").trim();
      const pDesc = (data.projectDescription || "").trim();
      const pChallenge = (data.projectChallenge || "").trim();
      const hasAnyDraft = Boolean(pTitle || pDesc || pChallenge);
      const isDraftComplete = Boolean(pTitle && pDesc && pChallenge);

      const savedProjects = (data.projects || []).filter(
        (project) => project.title.trim() && project.description.trim() && project.challenge.trim(),
      );

      // If user partially filled draft in active input fields, point out missing field
      if (hasAnyDraft && !isDraftComplete) {
        if (!pTitle) {
          stepErrors.projectTitle = "Project title is required.";
          if (!firstFieldId) firstFieldId = "field-projectTitle";
        }
        if (!pDesc) {
          stepErrors.projectDescription = "Project description is required.";
          if (!firstFieldId) firstFieldId = "field-projectDescription";
        }
        if (!pChallenge) {
          stepErrors.projectChallenge = "Challenge overcome is required.";
          if (!firstFieldId) firstFieldId = "field-projectChallenge";
        }
      } else if (!isDraftComplete && savedProjects.length === 0) {
        stepErrors.projectTitle = "Project title is required.";
        stepErrors.projectDescription = "Project description is required.";
        stepErrors.projectChallenge = "Challenge overcome is required.";
        if (!firstFieldId) firstFieldId = "field-projectTitle";
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
      const goalDraft = (data.learningGoals || "").trim();
      const savedGoals = (data.learningGoalItems || []).filter((goal) => goal.trim());
      if (!goalDraft && savedGoals.length === 0) {
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

  const persistStep = async (
    asDraft = false,
    dataToPersist: ReviewFormData = formData,
    targetStatus?: EmployeePerformanceStatus | string,
  ): Promise<boolean> => {
    const quarter = quarterValue(assignment.quarter);
    if (!assignment.employeeId || !quarter || !assignment.financialYear) {
      setSaveError("This quarter is missing an employee, quarter, or financial year.");
      return false;
    }
    const payload = toPerformancePayload(
      assignment.employeeId,
      quarter,
      assignment.financialYear,
      dataToPersist,
    );
    if (targetStatus) {
      payload.status = targetStatus;
    }
    setSaving(true);
    setSaveError("");
    try {
      const existingId = performanceIdRef.current || assignment.performanceId;
      if (existingId) {
        await AppraisalApi.updatePerformance(existingId, payload);
        performanceIdRef.current = existingId;
        setPerformanceId(existingId);
        return true;
      }
      const shouldSaveAsDraft = asDraft && !isReassignedReview;
      const saved = shouldSaveAsDraft
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

    let currentData = formData;
    if (currentStep === 2 || currentStep === 4) {
      currentData = commitDraftsIfNeeded(formData);
      if (currentData !== formData) {
        setFormData(currentData);
        formDataRef.current = currentData;
      }
    }

    const validation = validateStep(currentStep, currentData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      scrollToField(validation.firstFieldId);
      return;
    }
    setErrors({});
    // Advancing past Step 1 (or any step) completes the step -> save as DRAFT
    const saved = await persistStep(true, currentData, EmployeePerformanceStatus.DRAFT);
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
    const finishedFirstStep = currentStep > 1 || hasCompletedFirstStep(formData);
    const targetStatus = finishedFirstStep && !isReassignedReview
      ? EmployeePerformanceStatus.DRAFT
      : undefined;
    const saved = await persistStep(Boolean(targetStatus), formData, targetStatus);
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

    let currentData = formData;
    if (currentStep === 2 || currentStep === 4) {
      currentData = commitDraftsIfNeeded(formData);
      if (currentData !== formData) {
        setFormData(currentData);
        formDataRef.current = currentData;
      }
    }

    if (targetStep > currentStep) {
      for (let s = currentStep; s < targetStep; s++) {
        const validation = validateStep(s, currentData);
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
    const finishedFirstStep = currentStep > 1 || targetStep > 1 || hasCompletedFirstStep(currentData);
    const targetStatus = finishedFirstStep && !isReassignedReview
      ? EmployeePerformanceStatus.DRAFT
      : undefined;
    const saved = await persistStep(Boolean(targetStatus), currentData, targetStatus);
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
    if (isLocked) {
      onBack();
      return;
    }
    if (saving) {
      return;
    }
    let currentData = formData;
    if (currentStep === 2 || currentStep === 4) {
      currentData = commitDraftsIfNeeded(formData);
      if (currentData !== formData) {
        setFormData(currentData);
        formDataRef.current = currentData;
      }
    }

    const hasData = hasAnyDataEntered(currentData);
    const finishedFirstStep = currentStep > 1 || hasCompletedFirstStep(currentData);
    const isAlreadyDraft =
      String(assignment.status || "").toUpperCase() === EmployeePerformanceStatus.DRAFT ||
      String(assignment.reviewStatus || "").toUpperCase() === QuarterlyReviewStatus.DRAFT;

    // 1. If user did not enter any data and review is not yet draft:
    if (!hasData && !isAlreadyDraft && !isReassignedReview) {
      const existingId = performanceIdRef.current || assignment.performanceId;
      if (existingId) {
        // Explicitly maintain/reset status as NOT_STARTED
        await persistStep(false, currentData, EmployeePerformanceStatus.NOT_STARTED);
      }
      scrollToTop();
      onBack();
      return;
    }

    // 2. Only save as DRAFT if user entered data AND finished the one stepper (Step 1)
    let targetStatus: EmployeePerformanceStatus | undefined = undefined;
    if (!isReassignedReview) {
      if (finishedFirstStep || isAlreadyDraft) {
        targetStatus = EmployeePerformanceStatus.DRAFT;
      } else {
        targetStatus = EmployeePerformanceStatus.NOT_STARTED;
      }
    }

    const saved = await persistStep(
      targetStatus === EmployeePerformanceStatus.DRAFT,
      currentData,
      targetStatus,
    );
    if (!saved) {
      return;
    }
    scrollToTop();
    onBack();
  };

  const handleSubmit = async () => {
    if (isLocked || saving) {
      return;
    }
    let currentData = formData;
    if (currentStep === 2 || currentStep === 4) {
      currentData = commitDraftsIfNeeded(formData);
      if (currentData !== formData) {
        setFormData(currentData);
        formDataRef.current = currentData;
      }
    }
    for (let s = 1; s <= 5; s++) {
      const validation = validateStep(s, currentData);
      if (!validation.isValid) {
        goToStep(s, false);
        setErrors(validation.errors);
        scrollToField(validation.firstFieldId);
        return;
      }
    }
    const saved = await persistStep(false, currentData);
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
            readOnly={readOnly}
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
            readOnly={readOnly}
          />
        );
      case 3:
        return (
          <TeamContributionStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
            readOnly={readOnly}
          />
        );
      case 4:
        return (
          <LearningGoalsStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
            readOnly={readOnly}
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
            readOnly={readOnly}
          />
        );
      case 6:
        return (
          <ReviewStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            clearError={handleClearError}
            readOnly={readOnly}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div ref={topRef} className="w-full space-y-6 font-sans">
      {assignment.canEdit === false && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-amber-900 text-sm font-semibold shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            {assignment.status.toUpperCase() === "EDIT_GRANTED"
              ? "Your edit deadline granted by your manager has expired. This review is locked."
              : assignment.canRequestEdit
                ? "The deadline is today. Submit is closed. Request access from your manager."
                : "This review is currently locked for editing."}
          </span>
        </div>
      )}

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
              const hasData = isStepDone(step.id, formData);
              const isCompleted = currentStep > step.id || hasData;
              const isActive = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  title={`Go to Step ${step.id}: ${step.label}`}
                  className="group relative z-10 flex flex-col items-center cursor-pointer select-none focus:outline-none"
                >
                  {/* Circle with Step Icon */}
                  <div
                    ref={isActive ? activeCircleRef : undefined}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-200 ${
                      isActive
                        ? "bg-[#2563EB] text-white ring-4 ring-blue-400/25 shadow-md shadow-blue-500/20"
                        : isCompleted
                        ? "bg-blue-500 text-white border-2 border-blue-500 shadow-xs"
                        : "bg-white text-[#64748B] border-2 border-blue-200/80 hover:border-[#2563EB] hover:text-[#2563EB]"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.8]" />
                    ) : (
                      <step.IconComponent isActive={isActive} />
                    )}
                  </div>

                  {/* Title Placed Below Circle */}
                  <span
                    className={`mt-2 text-xs font-semibold text-center whitespace-nowrap transition-colors duration-200 ${
                      isActive
                        ? "text-[#2563EB] font-bold"
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
            <fieldset
              disabled={readOnly}
              className={`relative min-h-[380px] border-0 p-0 m-0 min-w-0 ${
                exitingStep !== null ? "overflow-hidden" : "overflow-visible"
              }`}
            >
              {exitingStep !== null && (
                <div
                  ref={exitContentRef}
                  key={`exit-${exitingStep}`}
                  className="absolute inset-x-0 top-0 pointer-events-none"
                >
                  {renderStepContent(exitingStep)}
                </div>
              )}

              <div
                ref={enterContentRef}
                key={`enter-${currentStep}`}
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
                {!isLocked && (
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

                {currentStep < 6 ? (
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
                ) : isLocked ? (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-xl font-bold border-blue-200 bg-white hover:bg-blue-50 text-[#2563EB] shadow-xs cursor-pointer"
                  >
                    Back to Reviews
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
