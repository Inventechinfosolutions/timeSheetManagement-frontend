import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  Sliders,
  X,
  Lock,
  Loader2,
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
import {
  ReviewFormData,
  QuarterlyReviewAssignment,
  StoredPerformanceFile,
  PerformanceProject,
} from "../../types/appraisal.types";
import { emptyReviewFormData } from "../../constants/emptyReviewForm";
import { AppraisalApi, readApiError, toPerformancePayload, toReviewFormData } from "../../reducers/appraisal.reducer";
import { readProjectList } from "../../utils/appraisalHelpers";
import { EmployeePerformanceStatus, QuaterlyEnum, QuarterlyReviewStatus } from "../../enums/appraisal.enums";
import { message, Modal } from "antd";
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
  initialStep?: number;
  onBack: () => void;
  onSubmitSuccess?: () => void;
  onGoToEvaluation?: () => void;
}


const hasCompletedFirstStep = (data: ReviewFormData): boolean => {
  // Step 1 is "done" when the primary required field (Overall Performance Summary) is filled
  const ov = (data.overview || data.roleSummary || "").trim();
  const summary = (
    data.overallPerformanceSummary ||
    (ov.startsWith("{") ? "" : ov)
  ).trim();
  return summary.length > 0;
};

/**
 * Returns true if the user has entered ANY meaningful data across all steps.
 * Used to determine whether "Save & Exit" should persist DRAFT or reset to NOT_STARTED.
 */
const hasAnyDataEntered = (data: ReviewFormData): boolean => {
  // Step 1 – Overview fields
  const ov = (data.overview || data.roleSummary || "").trim();
  if (ov.length > 0 && !ov.startsWith("{")) return true;
  if ((data.overallPerformanceSummary || "").trim().length > 0) return true;
  if ((data.keyHighlights || "").trim().length > 0) return true;
  if ((data.majorContributions || "").trim().length > 0) return true;
  if ((data.areasForImprovement || "").trim().length > 0) return true;

  // Step 2 – Achievements / Projects
  if (
    (data.projects || []).some(
      (p) =>
        (p.projectName || p.title || "").trim() ||
        (p.description || "").trim() ||
        (p.challenge || "").trim()
    )
  )
    return true;
  if (
    (data.projectName || data.projectTitle || "").trim() ||
    (data.projectDescription || "").trim() ||
    (data.projectChallenge || "").trim() ||
    (data.keyResponsibilities || "").trim() ||
    (data.keyAchievementsOutcomes || "").trim() ||
    (data.majorAchievements || "").trim()
  )
    return true;

  // Step 3 – Team Contribution
  if (
    (data.teamCollaborationSummary || "").trim() ||
    (data.crossTeamContributions || "").trim() ||
    (data.knowledgeSharingMentoring || "").trim() ||
    (data.teamworkExamples || "").trim()
  )
    return true;
  if (
    data.teamRatings &&
    Object.values(data.teamRatings).some((v) => typeof v === "number" && v > 0)
  )
    return true;

  // Step 4 – Learning Goals
  if (
    (data.learningGoalItems || []).some((g) => g.trim().length > 0) ||
    (data.learningGoals || "").trim().length > 0 ||
    (data.skillsAcquired || "").trim().length > 0 ||
    (data.certificationsOrCourses || "").trim().length > 0 ||
    (data.skillsToImprove || "").trim().length > 0 ||
    (data.nextQuarterLearningGoals || "").trim().length > 0
  )
    return true;

  // Step 5 – Company Environment
  if (
    (data.workCultureFeedback || "").trim() ||
    (data.workLifeBalance || "").trim() ||
    (data.suggestionsForImprovement || "").trim() ||
    (data.challengesAffectingProductivity || "").trim()
  )
    return true;
  if (data.companyEnvironmentRating && data.companyEnvironmentRating > 0) return true;
  if (data.toolingAndResourcesRating && data.toolingAndResourcesRating > 0) return true;
  if (data.managementSupportRating && data.managementSupportRating > 0) return true;

  // Step 6 – Final Review
  if (data.overallSelfRating && data.overallSelfRating > 0) return true;
  if ((data.overallEmployeeComments || "").trim()) return true;
  if ((data.careerGrowthInterests || "").trim()) return true;

  return false;
};


const isStepDone = (stepId: number, data: ReviewFormData): boolean => {
  if (stepId === 1) {
    const summary = (
      data.overallPerformanceSummary ||
      data.overview ||
      data.roleSummary ||
      ""
    ).trim();
    return Boolean(summary && !summary.startsWith("{"));
  }
  if (stepId === 2) {
    return Boolean(
      (data.projects && data.projects.length > 0) ||
      (data.projectTitle || "").trim() ||
      (data.projectName || "").trim() ||
      (data.majorAchievements || "").trim()
    );
  }
  if (stepId === 3) {
    const r = data.teamRatings || {};
    const d = data as any;
    return Boolean(
      (r.communication || 0) > 0 && Boolean((d.communicationDescription || "").trim()) &&
      (r.ownership || 0) > 0 && Boolean((d.ownershipDescription || "").trim()) &&
      (r.collaboration || 0) > 0 && Boolean((d.collaborationDescription || "").trim()) &&
      (r.problemSolving || 0) > 0 && Boolean((d.problemSolvingDescription || "").trim()) &&
      (r.leadership || 0) > 0 && Boolean((d.leadershipDescription || "").trim()) &&
      (r.adaptability || 0) > 0 && Boolean((d.adaptabilityDescription || "").trim())
    );
  }
  if (stepId === 4) {
    return Boolean(
      (data.learningGoalItems && data.learningGoalItems.length > 0) ||
      (data.learningGoals || "").trim() ||
      (data.skillsAcquired || "").trim() ||
      (data.certificationsOrCourses || "").trim() ||
      (data.skillsToImprove || "").trim() ||
      (data.nextQuarterLearningGoals || "").trim()
    );
  }
  if (stepId === 5) {
    return Boolean(
      (data.workCultureFeedback || "").trim() ||
      (data.workLifeBalance || "").trim() ||
      (data.suggestionsForImprovement || "").trim() ||
      (data.challengesAffectingProductivity || "").trim() ||
      (data.companyEnvironmentRating && data.companyEnvironmentRating > 0) ||
      (data.toolingAndResourcesRating && data.toolingAndResourcesRating > 0) ||
      (data.managementSupportRating && data.managementSupportRating > 0)
    );
  }
  return false;
};

const getFirstIncompleteStep = (data: ReviewFormData): number => {
  for (let s = 1; s <= 5; s++) {
    if (!isStepDone(s, data)) return s;
  }
  return 6;
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
  initialStep,
  onBack,
  onSubmitSuccess,
  onGoToEvaluation,
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
  const normalizedStatus = String(assignment.status || assignment.reviewStatus || "").toUpperCase();
  const isNotStarted =
    normalizedStatus === "NOT_STARTED" ||
    normalizedStatus === "NOT STARTED" ||
    String(assignment.status || "").toUpperCase() === "NOT_STARTED" ||
    String(assignment.status || "").toUpperCase() === "NOT STARTED";
  const isCompleted =
    normalizedStatus === "COMPLETED" ||
    String(assignment.status || "").toUpperCase() === "COMPLETED" ||
    String(assignment.reviewStatus || "").toUpperCase() === "COMPLETED";
  const isAlreadySubmitted =
    Boolean(assignment.submittedAt) ||
    Boolean(assignment.performanceDate) ||
    [
      "SUBMITTED",
      "RE_SUBMITTED",
      "UNDER_REVIEW",
      "REVIEWED",
      "COMPLETED",
      "PERFORMANCE_RECEIVED",
      "EVALUATION_IN_PROGRESS",
    ].includes(normalizedStatus);
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof initialStep === "number") return initialStep;
    if (readOnly) return 6;
    const initialData = initialFormData || emptyReviewFormData;
    return getFirstIncompleteStep(initialData);
  });
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
  // formDirty: tracks whether user has modified the form from its initial loaded state
  const [formDirty, setFormDirty] = useState<boolean>(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<ReviewFormData | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState<boolean>(false);
  const initialFormDataRef = useRef<ReviewFormData>(initialFormData || emptyReviewFormData);

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

  // Sync initialFormDataRef when a fresh form is loaded from the server
  useEffect(() => {
    if (initialFormData) {
      initialFormDataRef.current = initialFormData;
      setFormDirty(false);
    }
  }, [initialFormData]);

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

  // ── formWatch: mark form as dirty whenever formData changes from the initial snapshot ──
  useEffect(() => {
    if (readOnly || isLocked) return;
    const initial = initialFormDataRef.current;
    const current = formData;
    // Compare serialized snapshots of meaningful fields only
    const pickMeaningful = (d: ReviewFormData) => ({
      overallPerformanceSummary: (
        d.overallPerformanceSummary ||
        (d.overview && !d.overview.startsWith("{") ? d.overview : "")
      ).trim(),
      keyHighlights: (d.keyHighlights || "").trim(),
      majorContributions: (d.majorContributions || "").trim(),
      areasForImprovement: (d.areasForImprovement || "").trim(),
      projects: (d.projects || []).map((p) => ({
        name: (p.projectName || p.title || "").trim(),
        desc: (p.description || "").trim(),
        challenge: (p.challenge || p.challengesFaced || "").trim(),
        role: (p.projectRole || "").trim(),
      })),
      skillsAcquired: (d.skillsAcquired || "").trim(),
      skillsToImprove: (d.skillsToImprove || "").trim(),
      nextQuarterLearningGoals: (d.nextQuarterLearningGoals || "").trim(),
      workCultureFeedback: (d.workCultureFeedback || "").trim(),
      workLifeBalance: (d.workLifeBalance || "").trim(),
      suggestionsForImprovement: (d.suggestionsForImprovement || "").trim(),
      teamRatingsCount: Object.values(d.teamRatings || {}).filter((v) => typeof v === "number" && (v as number) > 0).length,
      companyEnvironmentRating: d.companyEnvironmentRating || 0,
      toolingAndResourcesRating: d.toolingAndResourcesRating || 0,
      managementSupportRating: d.managementSupportRating || 0,
      overallSelfRating: d.overallSelfRating || 0,
      overallEmployeeComments: (d.overallEmployeeComments || "").trim(),
      careerGrowthInterests: (d.careerGrowthInterests || "").trim(),
      teamCollaborationSummary: (d.teamCollaborationSummary || "").trim(),
      crossTeamContributions: (d.crossTeamContributions || "").trim(),
      majorAchievements: (d.majorAchievements || "").trim(),
      certificationsOrCourses: (d.certificationsOrCourses || "").trim(),
      challengesAffectingProductivity: (d.challengesAffectingProductivity || "").trim(),
    });
    const isDirty = JSON.stringify(pickMeaningful(initial)) !== JSON.stringify(pickMeaningful(current));
    setFormDirty(isDirty);
  }, [formData, readOnly, isLocked]);

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

        // If inner layout container (main or overflow-y-auto) exists, ensure target is centered
        const main = document.querySelector("main");
        if (main && main.contains(el)) {
          const mainRect = main.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const targetScrollTop = main.scrollTop + (elRect.top - mainRect.top) - main.clientHeight / 2 + elRect.height / 2;
          main.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
        }

        const focusTarget = el.matches("input, textarea, button")
          ? (el as HTMLElement)
          : (el.querySelector("input, textarea, button") as HTMLElement | null);
        if (focusTarget && typeof focusTarget.focus === "function") {
          try {
            focusTarget.focus({ preventScroll: true });
          } catch {
            focusTarget.focus();
          }
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
    const el = document.getElementById(`field-${field}`);
    if (el) {
      el.style.borderColor = "";
      el.style.boxShadow = "";
    }
  };

  const handleFieldChange = (field: keyof ReviewFormData, value: any) => {
    formDataRef.current = {
      ...formDataRef.current,
      [field]: value,
    };
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      formDataRef.current = next;
      return next;
    });
    handleClearError(field as string);
  };

  const commitDraftsIfNeeded = (currentData: ReviewFormData): ReviewFormData => {
    let updated = { ...currentData };
    let hasChanged = false;

    // Step 2: Auto-commit or update project draft
    const pName = (updated.projectName || "").trim();
    const pDesc = (updated.projectDescription || "").trim();
    const pChallenge = (updated.challengesFaced || updated.projectChallenge || "").trim();
    const pRole = (updated.projectRole || "").trim();
    const pResp = (updated.responsibilityType || "").trim();
    const pKeyResp = (updated.keyResponsibilities || "").trim();
    const pOutcomes = (updated.keyAchievementsOutcomes || "").trim();
    const pTechs = Array.isArray(updated.technologiesUsed) ? updated.technologiesUsed : [];

    const hasAnyDraft = Boolean(
      pName ||
      pDesc ||
      pChallenge ||
      pRole ||
      pResp ||
      updated.leadershipQualities ||
      updated.clientReviewFeedback ||
      pKeyResp ||
      pOutcomes ||
      pTechs.length > 0 ||
      (updated.projectAttachments && updated.projectAttachments.length > 0)
    );

    const isComplete = Boolean(
      pName &&
      pDesc &&
      pRole &&
      pResp &&
      pKeyResp &&
      pChallenge &&
      pOutcomes &&
      pTechs.length > 0
    );

    const editIdx = updated.editingProjectIndex;
    const isEditing = typeof editIdx === "number" && editIdx >= 0 && editIdx < (updated.projects || []).length;

    if (isEditing) {
      const existing = [...(updated.projects || [])];
      existing[editIdx] = {
        ...existing[editIdx],
        projectName: pName || existing[editIdx].projectName || "Untitled Project",
        description: pDesc || existing[editIdx].description || "",
        challenge: pChallenge || existing[editIdx].challenge || "",
        challengesFaced: pChallenge || existing[editIdx].challengesFaced || "",
        projectRole: pRole || existing[editIdx].projectRole || "",
        responsibilityType: pResp || existing[editIdx].responsibilityType || "",
        leadershipQualities: updated.leadershipQualities || existing[editIdx].leadershipQualities || "",
        clientReviewFeedback: updated.clientReviewFeedback || existing[editIdx].clientReviewFeedback || "",
        keyResponsibilities: pKeyResp || existing[editIdx].keyResponsibilities || "",
        solutionsImplemented: updated.solutionsImplemented || existing[editIdx].solutionsImplemented || "",
        keyAchievementsOutcomes: pOutcomes || existing[editIdx].keyAchievementsOutcomes || "",
        technologiesUsed: updated.technologiesUsed ? [...updated.technologiesUsed] : existing[editIdx].technologiesUsed || [],
        attachments: updated.projectAttachments ? [...updated.projectAttachments] : existing[editIdx].attachments || [],
        isDraft: existing[editIdx].isDraft ? !isComplete : false,
      };
      if (isComplete) {
        updated = {
          ...updated,
          projects: existing,
          editingProjectIndex: null,
          projectName: "",
          projectDescription: "",
          projectRole: "",
          responsibilityType: "",
          leadershipQualities: "",
          clientReviewFeedback: "",
          keyResponsibilities: "",
          challengesFaced: "",
          projectChallenge: "",
          solutionsImplemented: "",
          keyAchievementsOutcomes: "",
          technologiesUsed: [],
          projectAttachments: [],
        };
        hasChanged = true;
      }
    } else if (hasAnyDraft && isComplete) {
      const existing = updated.projects || [];
      const newProject: PerformanceProject = {
        projectName: pName,
        description: pDesc,
        challenge: pChallenge,
        challengesFaced: pChallenge,
        projectRole: pRole,
        responsibilityType: pResp,
        leadershipQualities: updated.leadershipQualities || "",
        clientReviewFeedback: updated.clientReviewFeedback || "",
        keyResponsibilities: pKeyResp,
        solutionsImplemented: updated.solutionsImplemented || "",
        keyAchievementsOutcomes: pOutcomes,
        technologiesUsed: [...pTechs],
        attachments: updated.projectAttachments ? [...updated.projectAttachments] : [],
        isDraft: false,
      };
      updated = {
        ...updated,
        projects: [...existing, newProject],
        editingProjectIndex: null,
        projectName: "",
        projectDescription: "",
        projectRole: "",
        responsibilityType: "",
        leadershipQualities: "",
        clientReviewFeedback: "",
        keyResponsibilities: "",
        challengesFaced: "",
        projectChallenge: "",
        solutionsImplemented: "",
        keyAchievementsOutcomes: "",
        technologiesUsed: [],
        projectAttachments: [],
      };
      hasChanged = true;
    }

    // Step 4: Sync goals list if needed
    const skillsLearned = (updated.skillsAcquired || "").trim();
    const nextGoals = (updated.nextQuarterLearningGoals || "").trim();
    const goalsList = [skillsLearned, nextGoals].filter(Boolean);
    if (goalsList.length > 0 && (!updated.learningGoalItems || updated.learningGoalItems.length === 0)) {
      updated = {
        ...updated,
        learningGoalItems: goalsList,
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
      const summary = (data.overallPerformanceSummary || data.overview || "").trim();
      if (!summary) {
        stepErrors.overallPerformanceSummary = "Overall performance summary is required.";
        if (!firstFieldId) firstFieldId = "field-overallPerformanceSummary";
      }
    } else if (stepNum === 2) {
      const pName = (data.projectName || "").trim();
      const pDesc = (data.projectDescription || "").trim();
      const pRole = (data.projectRole || "").trim();
      const pResp = (data.responsibilityType || "").trim();
      const pKeyResp = (data.keyResponsibilities || "").trim();
      const pChallenge = (data.challengesFaced || data.projectChallenge || "").trim();
      const pOutcomes = (data.keyAchievementsOutcomes || "").trim();
      const pTechs = Array.isArray(data.technologiesUsed) ? data.technologiesUsed : [];

      const hasAnyDraft = Boolean(pName || pDesc || pRole || pResp || pKeyResp || pChallenge || pOutcomes || pTechs.length > 0);
      const isDraftComplete = Boolean(pName && pDesc && pRole && pResp && pKeyResp && pChallenge && pOutcomes && pTechs.length > 0);

      const allProjects = data.projects || [];
      const hasAnySavedProject = allProjects.length > 0;

      // If user partially filled draft in active input fields, point out missing field
      if (hasAnyDraft && !isDraftComplete) {
        if (!pName) {
          stepErrors.projectName = "Project name is required.";
          if (!firstFieldId) firstFieldId = "field-projectName";
        }
        if (!pDesc) {
          stepErrors.projectDescription = "Project description is required.";
          if (!firstFieldId) firstFieldId = "field-projectDescription";
        }
        if (!pRole) {
          stepErrors.projectRole = "Project role is required.";
          if (!firstFieldId) firstFieldId = "field-projectRole";
        }
        if (!pResp) {
          stepErrors.responsibilityType = "Responsibility type is required.";
          if (!firstFieldId) firstFieldId = "field-responsibilityType";
        }
        if (!pKeyResp) {
          stepErrors.keyResponsibilities = "Key responsibilities is required.";
          if (!firstFieldId) firstFieldId = "field-keyResponsibilities";
        }
        if (!pChallenge) {
          stepErrors.challengesFaced = "Challenges faced is required.";
          if (!firstFieldId) firstFieldId = "field-challengesFaced";
        }
        if (!pOutcomes) {
          stepErrors.keyAchievementsOutcomes = "Key achievements / outcomes is required.";
          if (!firstFieldId) firstFieldId = "field-keyAchievementsOutcomes";
        }
        if (pTechs.length === 0) {
          stepErrors.technologiesUsed = "At least one technology is required.";
          if (!firstFieldId) firstFieldId = "field-technologiesUsed";
        }
      }

      // Check if any project already in list is in draft or incomplete
      const incompleteProjectIdx = allProjects.findIndex((p) => {
        if (p.isDraft) return true;
        if (!p.projectName?.trim()) return true;
        if (!p.description?.trim()) return true;
        if (!p.projectRole?.trim()) return true;
        if (!p.responsibilityType?.trim()) return true;
        if (!p.keyResponsibilities?.trim()) return true;
        if (!(p.challengesFaced?.trim() || p.challenge?.trim())) return true;
        if (!p.keyAchievementsOutcomes?.trim()) return true;
        if (!Array.isArray(p.technologiesUsed) || p.technologiesUsed.length === 0) return true;
        return false;
      });

      if (incompleteProjectIdx !== -1) {
        const dProj = allProjects[incompleteProjectIdx];
        const missing = !dProj.projectName?.trim()
          ? "Project name is required."
          : !dProj.description?.trim()
            ? "Project description should not be empty."
            : !dProj.projectRole?.trim()
              ? "Project role should not be empty."
              : !dProj.responsibilityType?.trim()
                ? "Responsibility type should not be empty."
                : !dProj.keyResponsibilities?.trim()
                  ? "Key responsibilities should not be empty."
                  : !(dProj.challengesFaced?.trim() || dProj.challenge?.trim())
                    ? "Challenges faced should not be empty."
                    : !dProj.keyAchievementsOutcomes?.trim()
                      ? "Key achievements / outcomes should not be empty."
                      : (!Array.isArray(dProj.technologiesUsed) || dProj.technologiesUsed.length === 0)
                        ? "At least one technology is required."
                        : "This project is in draft. Please edit and complete all required fields.";

        stepErrors[`project_${incompleteProjectIdx}`] = missing;
        stepErrors[`projects.${incompleteProjectIdx}.description`] = missing;
        if (!firstFieldId) firstFieldId = `accordion-project-${incompleteProjectIdx}`;
      }

      // Only require adding a project if there are NO projects saved in the list at all and active form is empty
      if (!hasAnySavedProject && !hasAnyDraft) {
        stepErrors.projectName = "At least one project is required.";
        if (!firstFieldId) firstFieldId = "field-projectName";
      }
    } else if (stepNum === 3) {
      const ratings = (data.teamRatings as any) || {};
      const criteriaList = [
        { key: "communication", descKey: "communicationDescription", title: "Communication & Coordination" },
        { key: "ownership", descKey: "ownershipDescription", title: "Ownership" },
        { key: "collaboration", descKey: "collaborationDescription", title: "Collaboration" },
        { key: "problemSolving", descKey: "problemSolvingDescription", title: "Problem Solving" },
        { key: "leadership", descKey: "leadershipDescription", title: "Leadership" },
        { key: "adaptability", descKey: "adaptabilityDescription", title: "Adaptability" },
      ];
      for (const item of criteriaList) {
        const score = ratings[item.key];
        if (!score || score <= 0) {
          stepErrors[item.key] = `Please select a rating for ${item.title}.`;
          if (!firstFieldId) firstFieldId = `field-criterion-${item.key}`;
        }
        const desc = ((data as any)[item.descKey] || "").trim();
        if (!desc) {
          stepErrors[item.descKey] = `${item.title} description is required.`;
          if (!firstFieldId) firstFieldId = `field-desc-${item.key}`;
        }
      }
    } else if (stepNum === 4) {
      const skillsLearned = (data.skillsAcquired || "").trim();
      const skillsToImprove = (data.skillsToImprove || "").trim();
      const nextQuarterGoals = (data.nextQuarterLearningGoals || "").trim();

      if (!skillsLearned) {
        stepErrors.skillsAcquired = "Skills learned during this period is required.";
        if (!firstFieldId) firstFieldId = "field-skillsAcquired";
      }
      if (!skillsToImprove) {
        stepErrors.skillsToImprove = "Skills to improve is required.";
        if (!firstFieldId) firstFieldId = "field-skillsToImprove";
      }
      if (!nextQuarterGoals) {
        stepErrors.nextQuarterLearningGoals = "Learning goals for next quarter is required.";
        if (!firstFieldId) firstFieldId = "field-nextQuarterLearningGoals";
      }
    } else if (stepNum === 5) {
      const envRating = data.companyEnvironmentRating || 0;
      const toolsRating = data.toolingAndResourcesRating || 0;
      const mgrRating = data.managementSupportRating || 0;

      if (!envRating || envRating <= 0) {
        stepErrors.companyEnvironmentRating = "Please rate work environment satisfaction (1 to 5).";
        if (!firstFieldId) firstFieldId = "field-companyEnvironmentRating";
      }
      if (!toolsRating || toolsRating <= 0) {
        stepErrors.toolingAndResourcesRating = "Please rate availability of tools & resources (1 to 5).";
        if (!firstFieldId) firstFieldId = "field-toolingAndResourcesRating";
      }
      if (!mgrRating || mgrRating <= 0) {
        stepErrors.managementSupportRating = "Please rate manager support (1 to 5).";
        if (!firstFieldId) firstFieldId = "field-managementSupportRating";
      }
      const culture = (data.workCultureFeedback || data.feedbackOnWorkCulture || "").trim();
      if (!culture) {
        stepErrors.workCultureFeedback = "Feedback on work culture is required.";
        if (!firstFieldId) firstFieldId = "field-workCultureFeedback";
      }
      const lifeBalance = (data.workLifeBalance || "").trim();
      if (!lifeBalance) {
        stepErrors.workLifeBalance = "Work life balance feedback is required.";
        if (!firstFieldId) firstFieldId = "field-workLifeBalance";
      }
      const suggestions = (data.suggestionsForImprovement || "").trim();
      if (!suggestions) {
        stepErrors.suggestionsForImprovement = "Suggestions for improvement is required.";
        if (!firstFieldId) firstFieldId = "field-suggestionsForImprovement";
      }
    } else if (stepNum === 6) {
      const selfRating = data.overallSelfRating || 0;
      if (!selfRating || selfRating <= 0) {
        stepErrors.overallSelfRating = "Please provide your overall self-rating (1 to 5).";
        if (!firstFieldId) firstFieldId = "field-overallSelfRating";
      }
      if (!data.confirmationAccepted) {
        stepErrors.confirmationAccepted = "Please confirm the review accuracy checkbox before submitting.";
        if (!firstFieldId) firstFieldId = "field-confirmationAccepted";
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
      let existingId = performanceIdRef.current || assignment.performanceId;
      if (!existingId && assignment.employeeId && quarter && assignment.financialYear) {
        try {
          const found = await AppraisalApi.getEmployeePerformance(
            assignment.employeeId,
            quarter,
            assignment.financialYear,
          );
          if (found?.id) {
            existingId = found.id;
            performanceIdRef.current = found.id;
            setPerformanceId(found.id);
          }
        } catch (_) {
          // ignore lookup error
        }
      }
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
      const apiErrMsg = readApiError(error);
      const match = apiErrMsg.match(/projects\.(\d+)\.(\w+)/i);
      if (match) {
        const idx = parseInt(match[1], 10);
        const field = match[2];
        const humanField =
          field === "description" ? "Project description" :
            field === "projectName" ? "Project name" :
              field === "projectRole" ? "Project role" :
                field === "responsibilityType" ? "Responsibility type" :
                  field === "keyResponsibilities" ? "Key responsibilities" :
                    field === "challengesFaced" ? "Challenges faced" :
                      field === "keyAchievementsOutcomes" ? "Key achievements / outcomes" :
                        field === "technologiesUsed" ? "Technologies used" : field;
        const formattedErr = `${humanField} should not be empty.`;
        setErrors((prev) => ({
          ...prev,
          [`project_${idx}`]: formattedErr,
          [`projects.${idx}.${field}`]: formattedErr,
        }));
        scrollToField(`accordion-project-${idx}`);
      } else {
        setSaveError(apiErrMsg);
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const loadFreshForm = async (preserveDraftInputs = true): Promise<boolean> => {
    const id = performanceIdRef.current || assignment.performanceId;
    if (!id) {
      return true;
    }
    try {
      const performance = await AppraisalApi.getPerformanceById(id);
      const fresh = toReviewFormData(performance);
      if (preserveDraftInputs && formDataRef.current) {
        const current = formDataRef.current;
        fresh.projectName = current.projectName;
        fresh.projectDescription = current.projectDescription;
        fresh.projectRole = current.projectRole;
        fresh.responsibilityType = current.responsibilityType;
        fresh.leadershipQualities = current.leadershipQualities;
        fresh.clientReviewFeedback = current.clientReviewFeedback;
        fresh.keyResponsibilities = current.keyResponsibilities;
        fresh.challengesFaced = current.challengesFaced;
        fresh.projectChallenge = current.projectChallenge;
        fresh.solutionsImplemented = current.solutionsImplemented;
        fresh.keyAchievementsOutcomes = current.keyAchievementsOutcomes;
        fresh.technologiesUsed = current.technologiesUsed;
        fresh.projectAttachments = current.projectAttachments;
        fresh.editingProjectIndex = current.editingProjectIndex;
      }
      formDataRef.current = fresh;
      initialFormDataRef.current = fresh;
      performanceIdRef.current = performance.id;
      setPerformanceId(performance.id);
      setFormData(fresh);
      return true;
    } catch (error) {
      setSaveError(readApiError(error));
      return false;
    }
  };

  const handleSaveProject = async (
    updatedProjects: PerformanceProject[],
  ): Promise<boolean> => {
    const updatedData: ReviewFormData = {
      ...formDataRef.current,
      projects: updatedProjects,
      editingProjectIndex: null,
      projectName: "",
      projectDescription: "",
      projectRole: "",
      responsibilityType: "",
      leadershipQualities: "",
      clientReviewFeedback: "",
      keyResponsibilities: "",
      challengesFaced: "",
      projectChallenge: "",
      solutionsImplemented: "",
      keyAchievementsOutcomes: "",
      technologiesUsed: [],
      projectAttachments: [],
    };
    setFormData(updatedData);
    formDataRef.current = updatedData;

    const targetStatus = !isReassignedReview
      ? EmployeePerformanceStatus.DRAFT
      : undefined;

    const saved = await persistStep(true, updatedData, targetStatus);
    if (saved) {
      await loadFreshForm(false);
    }
    return saved;
  };

  const handleDeleteProject = async (
    index: number,
    updatedProjects: PerformanceProject[],
  ): Promise<boolean> => {
    let existingId = performanceIdRef.current || assignment.performanceId;
    if (!existingId && assignment.employeeId && quarterValue(assignment.quarter) && assignment.financialYear) {
      try {
        const found = await AppraisalApi.getEmployeePerformance(
          assignment.employeeId,
          quarterValue(assignment.quarter)!,
          assignment.financialYear,
        );
        if (found?.id) {
          existingId = found.id;
          performanceIdRef.current = found.id;
          setPerformanceId(found.id);
        }
      } catch (_) {
        // ignore
      }
    }

    const current = {
      ...formDataRef.current,
      ...formData,
    };
    const isEditingThis = current.editingProjectIndex === index;
    const nextEditingIndex =
      current.editingProjectIndex !== null && current.editingProjectIndex !== undefined
        ? isEditingThis
          ? null
          : current.editingProjectIndex > index
          ? current.editingProjectIndex - 1
          : current.editingProjectIndex
        : null;

    if (existingId) {
      try {
        const updatedPerf = await AppraisalApi.deletePerformanceProject(existingId, index);
        const freshProjects = updatedPerf?.projects
          ? readProjectList(updatedPerf.projects)
          : updatedProjects;

        const nextData: ReviewFormData = {
          ...current,
          projects: freshProjects,
          editingProjectIndex: nextEditingIndex,
        };
        formDataRef.current = nextData;
        setFormData(nextData);
        return true;
      } catch (error) {
        console.warn("[Appraisal] deletePerformanceProject endpoint failed, falling back to updatePerformance:", error);
      }
    }

    const nextData: ReviewFormData = {
      ...current,
      projects: updatedProjects,
      editingProjectIndex: nextEditingIndex,
    };
    setFormData(nextData);
    formDataRef.current = nextData;

    const targetStatus = !isReassignedReview
      ? EmployeePerformanceStatus.DRAFT
      : undefined;

    const saved = await persistStep(true, nextData, targetStatus);
    return saved;
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

    // 1. Save changes via PUT by id
    const saved = await persistStep(true, currentData, EmployeePerformanceStatus.DRAFT);
    if (!saved) {
      return;
    }

    // 2. Fetch fresh data via GET by id to keep state synchronized
    await loadFreshForm();

    // 3. Show success toast message & log
    message.success(`Step ${currentStep} saved successfully`);
    console.info(`[Appraisal] Step ${currentStep} saved successfully. Moving to Step ${currentStep + 1}`);

    // 4. Navigate to next step
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

    setErrors({});

    // Do NOT call PUT. Call GET by id to fetch fresh saved data from database
    await loadFreshForm();

    goToStep(currentStep - 1, true);
  };

  const handleStepClick = async (targetStep: number) => {
    if (readOnly) {
      const el = document.getElementById(`review-step-${targetStep}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (targetStep === currentStep || saving) return;

    // Moving backward: do not PUT, call GET to re-sync
    if (targetStep < currentStep) {
      setErrors({});
      await loadFreshForm();
      goToStep(targetStep, true);
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

    setErrors({});
    const saved = await persistStep(true, currentData, EmployeePerformanceStatus.DRAFT);
    if (!saved) return;
    await loadFreshForm();
    message.success(`Step ${currentStep} saved successfully`);
    console.info(`[Appraisal] Step ${currentStep} saved successfully. Moving to Step ${targetStep}`);
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
    const existingId = performanceIdRef.current || assignment.performanceId;

    // ── Case 1: No meaningful data in form (empty or all cleared) ──
    // Reset to NOT_STARTED regardless of previous status (even if was DRAFT)
    if (!hasData && !isReassignedReview) {
      if (existingId) {
        await persistStep(false, emptyReviewFormData, EmployeePerformanceStatus.NOT_STARTED);
      }
      message.info("Form reset and saved");
      console.info("[Appraisal] Form cleared, status reset to NOT_STARTED");
      scrollToTop();
      onBack();
      return;
    }

    // ── Case 2: Form has not been modified since it was loaded (not dirty) ──
    // No need to save again; just exit
    if (!formDirty && existingId) {
      console.info("[Appraisal] Form not dirty, exiting without extra save");
      scrollToTop();
      onBack();
      return;
    }

    // ── Case 3: User has data and form is dirty — persist it ──
    let targetStatus: EmployeePerformanceStatus | undefined = undefined;
    if (!isReassignedReview) {
      // Only mark DRAFT if Step 1 required field (Overall Performance Summary) is filled
      targetStatus = finishedFirstStep
        ? EmployeePerformanceStatus.DRAFT
        : EmployeePerformanceStatus.NOT_STARTED;
    }

    const saved = await persistStep(
      targetStatus === EmployeePerformanceStatus.DRAFT,
      currentData,
      targetStatus,
    );
    if (!saved) {
      return;
    }
    message.success("Draft saved successfully");
    console.info("[Appraisal] Draft saved successfully and exiting");
    scrollToTop();
    onBack();
  };

  const executeSubmit = async (currentData: ReviewFormData) => {
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
      message.success("Appraisal submitted successfully!");
      console.info("[Appraisal] Appraisal submitted successfully for performanceId:", performanceId);
    } catch (error) {
      const errMsg = readApiError(error);
      setSaveError(errMsg);
      message.error(errMsg || "Failed to submit appraisal.");
      console.error("[Appraisal] Submission error:", error);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSubmitted(true);
    setTimeout(() => {
      onSubmitSuccess?.();
    }, 1200);
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
    for (let s = 1; s <= 6; s++) {
      const validation = validateStep(s, currentData);
      if (!validation.isValid) {
        if (s !== currentStep) {
          goToStep(s, false);
        }
        setErrors(validation.errors);
        scrollToField(validation.firstFieldId);
        message.warning(`Please complete required fields in Step ${s}`);
        return;
      }
    }
    setPendingSubmitData(currentData);
    setShowSubmitConfirmModal(true);
  };

  const handleCloseSubmitModal = () => {
    if (isSubmittingModal) return;
    setShowSubmitConfirmModal(false);
    setPendingSubmitData(null);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingSubmitData || isSubmittingModal) return;
    setIsSubmittingModal(true);
    try {
      await executeSubmit(pendingSubmitData);
    } finally {
      setIsSubmittingModal(false);
      setShowSubmitConfirmModal(false);
      setPendingSubmitData(null);
    }
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
            assignment={assignment}
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
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
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
            assignment={assignment}
            onEditStep={readOnly ? undefined : (step) => goToStep(step, true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div ref={topRef} className="w-full space-y-6 font-sans">
      {!readOnly && !isAlreadySubmitted && assignment.canEdit === false && (
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
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50/80 !p-2 rounded-xl cursor-pointer"
              title="Back to history"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight w-fit">
                  <span className="manager-review-title-anim">
                    {assignment.quarter} Performance Review{readOnly ? " (View Mode)" : ""}
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

          {!readOnly && (
            <div className="text-right hidden sm:block">
              <span className="text-xs text-[#64748B] block">Progress</span>
              <span className="text-sm font-bold text-[#2563EB]">Step {currentStep} of 6</span>
            </div>
          )}
        </div>

        {/* Numbered Stepper with Title Below and Click Navigation (Hidden in View Mode) */}
        {!readOnly && (
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
                const isCompleted = isAlreadySubmitted ? true : hasData;
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-200 ${isActive
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
                      className={`mt-2 text-xs font-semibold text-center whitespace-nowrap transition-colors duration-200 ${isActive
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
        )}
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
            <div
              className={`relative min-h-[380px] border-0 p-0 m-0 min-w-0 ${exitingStep !== null ? "overflow-hidden" : "overflow-visible"
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
            </div>

            {/* Evaluation CTA Card: strictly shown on Step 6 only when evaluation is completed */}
            {currentStep === 6 && onGoToEvaluation && isCompleted && (
              <div className="eval-matrix-cta-card relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-blue-200/70 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/20 shadow-lg shadow-blue-500/10 mt-6 !opacity-100">
                {/* Ambient Decorative SVG in Background */}
                <svg
                  className="absolute -right-8 -bottom-10 w-72 h-72 text-blue-500/10 pointer-events-none eval-cta-bg-svg"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                  <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M40 100 Q70 60 100 100 T160 100" stroke="currentColor" strokeWidth="2" />
                </svg>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Glowing Matrix Icon SVG Box with Animated Orbital Pulse */}
                    <div className="relative shrink-0">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shadow-blue-500/25 eval-matrix-btn-icon-glow">
                        <svg
                          className="w-7 h-7 eval-matrix-icon-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6H20M4 12H20M4 18H20"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="16"
                            strokeDashoffset="0"
                            className="eval-matrix-svg-lines"
                          />
                          <circle cx="8" cy="6" r="2.5" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
                          <circle cx="16" cy="12" r="2.5" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
                          <circle cx="11" cy="18" r="2.5" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <span className="absolute -inset-1 rounded-2xl border border-blue-400/40 animate-ping opacity-25 pointer-events-none" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 font-bold">
                          {assignment.quarter} Evaluation Ready
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#2B3674] mt-1">
                        View Evaluation & Ratings
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5 max-w-xl leading-relaxed">
                        Navigate to the scored evaluation matrix to inspect finalized competencies, ratings, and feedback.
                      </p>
                    </div>
                  </div>

                  {/* Action Button that navigates to the Evaluation Matrix */}
                  <button
                    type="button"
                    onClick={onGoToEvaluation}
                    className="eval-open-matrix-btn shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
                  >
                    <Sliders className="w-4 h-4 transition-transform group-hover:rotate-45" />
                    <span>Go to Evaluation Matrix</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12H19M19 12L13 6M19 12L13 18"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Stepper Navigation Footer */}
            <div className={`flex items-center ${readOnly && isNotStarted ? "justify-end" : "justify-between"} pt-6 mt-8 border-t border-blue-100`}>
              {!(readOnly && isNotStarted) && (
                currentStep === 1 ? (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={onBack}
                    leftIcon={
                      <span className="relative inline-flex items-center justify-center w-4 h-4 shrink-0 self-center leading-none">
                        <ChevronLeft className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:opacity-0 group-hover:-translate-x-1" />
                        <ArrowLeft className="w-4 h-4 shrink-0 absolute inset-0 m-auto opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-1" />
                      </span>
                    }
                    className="group px-5 py-2.5 rounded-xl border-blue-200/80 bg-white/80 hover:bg-white text-[#0F172A] font-bold shadow-xs cursor-pointer hover:border-blue-400 [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center !gap-1.5"
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handlePrev}
                    leftIcon={
                      <span className="relative inline-flex items-center justify-center w-4 h-4 shrink-0 self-center leading-none">
                        <ChevronLeft className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:opacity-0 group-hover:-translate-x-1" />
                        <ArrowLeft className="w-4 h-4 shrink-0 absolute inset-0 m-auto opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-1" />
                      </span>
                    }
                    className="group px-5 py-2.5 rounded-xl border-blue-200/80 bg-white/80 hover:bg-white text-[#0F172A] font-bold shadow-xs cursor-pointer hover:border-blue-400 [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center !gap-1.5"
                  >
                    Previous
                  </Button>
                )
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
                    onClick={handleNext}
                    disabled={saving}
                    rightIcon={
                      <span className="relative inline-flex items-center justify-center w-4 h-4 shrink-0 self-center leading-none">
                        <ChevronRight className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:opacity-0 group-hover:translate-x-1" />
                        <ArrowRight className="w-4 h-4 shrink-0 absolute inset-0 m-auto opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1" />
                      </span>
                    }
                    className="group px-6 py-2.5 rounded-xl font-bold !bg-gradient-to-b !from-[#3B82F6] !to-[#1D4ED8] hover:!from-[#2563EB] hover:!to-[#1E40AF] !text-white shadow-md shadow-blue-500/30 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all !shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45),0_8px_20px_rgba(37,99,235,0.35)] [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center !gap-1.5"
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

      {/* Modern Custom Submit Appraisal Confirmation Modal */}
      {showSubmitConfirmModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0F172A]/25 backdrop-blur-[3.5px] animate-in fade-in duration-200"
          style={{ backdropFilter: "blur(3.5px)", WebkitBackdropFilter: "blur(3.5px)" }}
          onClick={handleCloseSubmitModal}
        >
          <div
            className="relative w-full max-w-[440px] bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-[#0F172A] animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

            {/* Close Button */}
            <button
              type="button"
              disabled={isSubmittingModal}
              onClick={handleCloseSubmitModal}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header: Icon + Title & Description in clean structured layout */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                <Send className="w-5 h-5 stroke-[2.2] -rotate-12 translate-x-0.5" />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight leading-snug">
                  Submit Quarterly Appraisal
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Are you sure you want to submit your appraisal? Once submitted, your self-assessment will be locked and sent to your manager for evaluation.
                </p>
              </div>
            </div>

            {/* Assessment Details Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 my-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Review
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                  {assignment.quarter || "Quarterly"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {assignment.quarter || "Q"} Performance Review
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  FY {assignment.financialYear || "Current"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-lg px-2.5 py-1.5 pt-1 mt-1">
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>Self-assessment will be locked for editing upon submission.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isSubmittingModal}
                onClick={handleCloseSubmitModal}
                className="flex-1 sm:flex-initial py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
              >
                Review Again
              </button>
              <button
                type="button"
                disabled={isSubmittingModal}
                onClick={handleConfirmSubmit}
                className="flex-1 sm:flex-initial py-2 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmittingModal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
                    <span>Submit Appraisal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default QuarterlyReviewStepper;
