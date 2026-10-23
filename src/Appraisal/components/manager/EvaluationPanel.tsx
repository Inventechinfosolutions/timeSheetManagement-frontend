import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  Star,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Award,
  Sliders,
  Mail,
  Lock,
  Clock,
  Eye,
  EyeOff,
  X,
  KeyRound,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import {
  ManagerQuarterlyReviewRecord,
  ReviewFormData,
} from "../../types/appraisal.types";
import { emptyReviewFormData } from "../../constants/emptyReviewForm";
import { EmployeePerformanceStatus, QuarterlyReviewStatus } from "../../enums/appraisal.enums";
import { AppraisalApi, formatAppraisalDisplayDate, readApiError, RevealedRating } from "../../reducers/appraisal.reducer";
import { DatePicker, Dropdown } from "../../../components/ui";
import { message } from "antd";
import { getRatingTierConfig } from "../../utils/appraisalHelpers";
import "./EvaluationPanel.css";
import AttachmentItem from "../common/AttachmentItem";

export interface EvaluationData {
  scores: Record<string, number>;
  averageScore: number;
  suggestedRating: string;
  strengths: string;
  improvements: string;
  remarks: string;
}

export interface EvaluationPanelProps {
  record: ManagerQuarterlyReviewRecord;
  mode?: "edit" | "view";
  grantAccess?: boolean;
  hideScoreParameters?: boolean;
  onBack: () => void;
  onSubmitEvaluation?: (recordId: string, evaluation: EvaluationData) => void;
  onAssignmentSaved?: (patch: {
    reviewId: number;
    assignedDate: string;
    deadline: string;
    description: string;
  }) => void;
  submissionData?: ReviewFormData;
  managerEvaluation?: {
    productivity?: number | string | null;
    qualityOfWork?: number | string | null;
    ownershipResponsibility?: number | string | null;
    communication?: number | string | null;
    teamCollaboration?: number | string | null;
    innovationProblemSolving?: number | string | null;
    technicalJobSkills?: number | string | null;
    overallPerformanceRating?: number | string | null;
    performanceStrengths?: string | null;
    areasOfImprovement?: string | null;
    additionalRemarks?: string | null;
    goalsForNextReviewPeriod?: string | null;
    trainingDevelopmentRecommendations?: string | null;
    careerGrowthRecommendation?: string | null;
    reviewOutcome?: string | null;
    performanceAction?: string | null;
    finalManagerComments?: string | null;
    managerConfirmation?: boolean | null;
    finalPerformanceRating?: number | string | null;
  };
}

interface ParameterDef {
  key: string;
  label: string;
  iconName?: string;
}

const EVALUATION_PARAMETERS: ParameterDef[] = [
  { key: "qualityOfWork", label: "Quality of Work" },
  { key: "productivity", label: "Productivity & Timely Delivery" },
  { key: "technicalJobSkills", label: "Technical / Job Skills" },
  { key: "teamCollaboration", label: "Teamwork & Collaboration" },
  { key: "communication", label: "Communication" },
  { key: "ownership", label: "Ownership & Accountability" },
  { key: "innovation", label: "Problem Solving & Initiative" },
];

const CAREER_GROWTH_OPTIONS = [
  { value: "Ready for Promotion", label: "Ready for Promotion" },
  { value: "Lateral Move", label: "Lateral Move" },
  { value: "Retention Risk", label: "Retention Risk" },
  { value: "Continue in Current Role", label: "Continue in Current Role" },
  { value: "Role Change Recommended", label: "Role Change Recommended" },
];

const REVIEW_OUTCOME_OPTIONS = [
  { value: "Satisfactory", label: "Satisfactory" },
  { value: "Exceptional Performance", label: "Exceptional Performance" },
  { value: "Needs Improvement", label: "Needs Improvement" },
  { value: "Performance Improvement Plan", label: "Performance Improvement Plan (PIP)" },
  { value: "Probation Extension", label: "Probation Extension" },
];

const PERFORMANCE_ACTION_OPTIONS = [
  { value: "No Action Required", label: "No Action Required" },
  { value: "Salary Increment", label: "Salary Increment" },
  { value: "Bonus Awarded", label: "Bonus Awarded" },
  { value: "Promotion Recommended", label: "Promotion Recommended" },
  { value: "PIP Initiated", label: "PIP Initiated" },
  { value: "Warning Issued", label: "Warning Issued" },
];

const RATING_LABEL_MAP: Record<number, string> = {
  1: "Needs Improvement",
  2: "Developing",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding",
};

const getRatingLabel = (score: number): string => {
  const rounded = Math.round(score);
  return RATING_LABEL_MAP[rounded] || "";
};

const TEAM_CRITERIA = [
  { key: "communication", title: "Communication" },
  { key: "ownership", title: "Ownership" },
  { key: "collaboration", title: "Collaboration" },
  { key: "problemSolving", title: "Problem Solving" },
  { key: "leadership", title: "Leadership" },
  { key: "adaptability", title: "Adaptability" },
];

const ENVIRONMENT_RATINGS: Record<number, { label: string; emoji: string }> = {
  1: { label: "Very Bad", emoji: "😡" },
  2: { label: "Bad", emoji: "🙁" },
  3: { label: "Neutral", emoji: "😐" },
  4: { label: "Good", emoji: "😊" },
  5: { label: "Excellent", emoji: "🤩" },
};

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  record,
  mode = "edit",
  grantAccess = false,
  hideScoreParameters = false,
  onBack,
  onSubmitEvaluation,
  onAssignmentSaved,
  submissionData,
  managerEvaluation,
}) => {
  const isViewMode = mode === "view";
  const savedManagerScore = (key: string): number => {
    const source: Record<string, number | string | null | undefined> = {
      productivity: managerEvaluation?.productivity,
      qualityOfWork: managerEvaluation?.qualityOfWork,
      ownership: managerEvaluation?.ownershipResponsibility,
      communication: managerEvaluation?.communication,
      teamCollaboration: managerEvaluation?.teamCollaboration,
      innovation: managerEvaluation?.innovationProblemSolving,
      technicalJobSkills: managerEvaluation?.technicalJobSkills,
      overallPerformanceRating: managerEvaluation?.overallPerformanceRating,
    };
    const value = Number(source[key]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  const hasManagerEvaluation = Boolean(
    managerEvaluation &&
    (savedManagerScore("productivity") > 0 ||
      managerEvaluation.performanceStrengths?.trim() ||
      managerEvaluation.areasOfImprovement?.trim() ||
      managerEvaluation.additionalRemarks?.trim()),
  );
  const [activeView, setActiveView] = useState<"review" | "matrix">("review");
  const panelTopRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (panelTopRef.current) {
      panelTopRef.current.scrollIntoView({ behavior: "instant", block: "start" });
    }

    // Target all <main> tags (primary scrollable container in SidebarLayout)
    const mainElements = document.querySelectorAll("main");
    mainElements.forEach((m) => {
      m.scrollTop = 0;
      if (typeof m.scrollTo === "function") {
        m.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    });

    // Target any container with overflow-y-auto
    const overflowElements = document.querySelectorAll("[class*='overflow-y-auto']");
    overflowElements.forEach((el) => {
      if (el.scrollHeight > 600) {
        el.scrollTop = 0;
        if (typeof el.scrollTo === "function") {
          el.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }
    });

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Scroll to the top immediately upon mounting or switching records/modes
  useEffect(() => {
    scrollToTop();
    const rafId = requestAnimationFrame(scrollToTop);
    const t1 = setTimeout(scrollToTop, 20);
    const t2 = setTimeout(scrollToTop, 80);
    const t3 = setTimeout(scrollToTop, 200);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [record.id, mode]);

  const handleNavigateToMatrix = () => {
    if (isEditAccessPendingOrGranted) {
      return;
    }
    setActiveView("matrix");
    scrollToTop();
    setTimeout(scrollToTop, 30);
    setTimeout(scrollToTop, 100);
  };

  const handleNavigateToReview = () => {
    setActiveView("review");
    scrollToTop();
    setTimeout(scrollToTop, 30);
    setTimeout(scrollToTop, 100);
  };

  // Scroll-based reveal animation for Employee Performance Review and Manager Evaluation cards using IntersectionObserver
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".eval-reveal-card").forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".eval-reveal-card").forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.15) {
            entry.target.classList.add("is-revealed");
          } else if (entry.intersectionRatio === 0 || !entry.isIntersecting) {
            entry.target.classList.remove("is-revealed");
          }
        });
      },
      {
        root: null,
        threshold: [0, 0.15],
      }
    );

    const observeAllCards = () => {
      const cards = document.querySelectorAll(".eval-reveal-card");
      cards.forEach((card) => {
        observer.observe(card);
      });
    };

    // Observe immediately and after layout paint for seamless view transitions
    const rafId = requestAnimationFrame(observeAllCards);
    const timerId = setTimeout(observeAllCards, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      observer.disconnect();
    };
  }, [activeView]);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isEmailModalOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open-active");
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    };
  }, [isEmailModalOpen]);
  const [modalStage, setModalStage] = useState<"email" | "otp" | "success">("email");
  const [emailInput, setEmailInput] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [ratingPassword, setRatingPassword] = useState<string>("");
  const [showRatingPassword, setShowRatingPassword] = useState<boolean>(false);
  const [unlockingRating, setUnlockingRating] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);
  const [illuminatedIndex, setIlluminatedIndex] = useState<number | null>(null);
  const [isGlowPhase, setIsGlowPhase] = useState<boolean>(false);
  const [isMorphingPhase, setIsMorphingPhase] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(45);
  const [isRatingUnlocked, setIsRatingUnlocked] = useState<boolean>(false);
  const ratingHideTimerRef = useRef<number | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    return () => {
      if (ratingHideTimerRef.current != null) {
        window.clearTimeout(ratingHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hideScoreParameters || !isRatingUnlocked) return;
    const reveal = () => {
      panelTopRef.current?.querySelectorAll(".eval-reveal-card").forEach((el) => {
        el.classList.add("is-revealed");
      });
    };
    reveal();
    const rafId = requestAnimationFrame(reveal);
    const timerId = window.setTimeout(reveal, 50);
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [hideScoreParameters, isRatingUnlocked]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any;
    if (modalStage === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalStage, resendTimer]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setEmailError("Please enter a valid corporate email address.");
      return;
    }
    setEmailError("");

    // 1. Trigger notification using existing antd message API
    message.success(
      `Verification code has been submitted to your mail ID: ${emailInput.trim()}`,
      2
    );

    // 2. Morph modal to OTP verification stage
    setModalStage("otp");
    setResendTimer(45);
    setOtp(["", "", "", "", "", ""]);
    setActiveOtpIndex(0);
    setIsGlowPhase(false);
    setIsMorphingPhase(false);
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 200);
  };

  const handleOtpInput = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split("");
      const nextOtp = [...otp];
      digits.forEach((d, i) => {
        nextOtp[i] = d;
      });
      setOtp(nextOtp);
      const nextFocus = Math.min(digits.length, 5);
      setActiveOtpIndex(nextFocus);
      otpInputRefs.current[nextFocus]?.focus();
      if (digits.length >= 6) {
        setTimeout(() => triggerVerificationSequence(), 250);
      }
      return;
    }

    const singleDigit = clean.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = singleDigit;
    setOtp(nextOtp);

    // Box feedback illumination (short spring pulse with green glow)
    setIlluminatedIndex(index);
    setTimeout(() => setIlluminatedIndex(null), 300);

    if (index < 5) {
      setActiveOtpIndex(index + 1);
      setTimeout(() => {
        otpInputRefs.current[index + 1]?.focus();
      }, 50);
    } else {
      setActiveOtpIndex(5);
      if (nextOtp.every((d) => d !== "")) {
        setTimeout(() => {
          triggerVerificationSequence();
        }, 300);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const nextOtp = [...otp];
        nextOtp[index - 1] = "";
        setOtp(nextOtp);
        setActiveOtpIndex(index - 1);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      setActiveOtpIndex(index - 1);
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      setActiveOtpIndex(index + 1);
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const triggerVerificationSequence = () => {
    // 1. Green Glow / Energy Effect across completed OTP
    setIsGlowPhase(true);

    // 2. Verification Transition
    setTimeout(() => {
      setIsMorphingPhase(true);

      setTimeout(() => {
        setModalStage("success");
        setIsGlowPhase(false);
        setIsMorphingPhase(false);
        setIsRatingUnlocked(true);

        // Settle success state, then smoothly close modal
        setTimeout(() => {
          setIsEmailModalOpen(false);
        }, 1600);
      }, 600);
    }, 550);
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setResendTimer(45);
    setOtp(["", "", "", "", "", ""]);
    setActiveOtpIndex(0);
    setIsGlowPhase(false);
    setIsMorphingPhase(false);
    message.info(
      `A fresh 6-digit verification code was sent to ${emailInput}`,
      2
    );
    otpInputRefs.current[0]?.focus();
  };

  // Evaluation Scores: Start with saved score for each parameter or unrated (0)
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    EVALUATION_PARAMETERS.forEach((p) => {
      const saved = savedManagerScore(p.key);
      initial[p.key] = saved > 0 ? saved : 0;
    });
    return initial;
  });

  // Track raw text input value
  const [rawInputValues, setRawInputValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    EVALUATION_PARAMETERS.forEach((p) => {
      const saved = savedManagerScore(p.key);
      initial[p.key] = saved > 0 ? String(saved) : "";
    });
    return initial;
  });

  // Track currently hovered star for instant feedback
  const [hoveredStar, setHoveredStar] = useState<{
    key: string;
    value: number;
  } | null>(null);

  // Form comments
  const [reviewId, setReviewId] = useState<number | undefined>(record.reviewId);
  const [assignedDate, setAssignedDate] = useState<string>(record.assignedOn || record.fromDate || "");
  const [deadlineDate, setDeadlineDate] = useState<string>(record.toDate || "");
  const [assignmentDescription, setAssignmentDescription] = useState<string>(record.description || "");
  const [savingAssignment, setSavingAssignment] = useState<boolean>(false);
  const [assignmentError, setAssignmentError] = useState<string>("");

  const [strengths, setStrengths] = useState<string>(managerEvaluation?.performanceStrengths || "");
  const [improvements, setImprovements] = useState<string>(managerEvaluation?.areasOfImprovement || "");
  const [remarks, setRemarks] = useState<string>(managerEvaluation?.additionalRemarks || "");

  // Final Review & Submission state
  const [goalsForNextReview, setGoalsForNextReview] = useState<string>(managerEvaluation?.goalsForNextReviewPeriod || "");
  const [trainingRecommendations, setTrainingRecommendations] = useState<string>(managerEvaluation?.trainingDevelopmentRecommendations || "");
  const [careerGrowthRecommendation, setCareerGrowthRecommendation] = useState<string>(managerEvaluation?.careerGrowthRecommendation || "");
  const [reviewOutcome, setReviewOutcome] = useState<string>(managerEvaluation?.reviewOutcome || "");
  const [performanceAction, setPerformanceAction] = useState<string>(managerEvaluation?.performanceAction || "");
  const [finalManagerComments, setFinalManagerComments] = useState<string>(managerEvaluation?.finalManagerComments || "");
  const [managerConfirmation, setManagerConfirmation] = useState<boolean>(Boolean(managerEvaluation?.managerConfirmation));
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isDraftSaving, setIsDraftSaving] = useState<boolean>(false);
  const [finalPerformanceRating, setFinalPerformanceRating] = useState<number>(() => {
    const perfRating = Number(managerEvaluation?.finalPerformanceRating);
    if (Number.isFinite(perfRating) && perfRating > 0) return perfRating;
    const parsedFinal = parseFloat(record.finalRating);
    return !Number.isNaN(parsedFinal) && parsedFinal >= 1 && parsedFinal <= 5 ? parsedFinal : 0;
  });
  const [rawFinalPerformanceRating, setRawFinalPerformanceRating] = useState<string>(() => {
    const perfRating = Number(managerEvaluation?.finalPerformanceRating);
    if (Number.isFinite(perfRating) && perfRating > 0) return String(perfRating);
    const parsedFinal = parseFloat(record.finalRating);
    return !Number.isNaN(parsedFinal) && parsedFinal >= 1 && parsedFinal <= 5 ? String(parsedFinal) : "";
  });
  const [hoveredFinalStar, setHoveredFinalStar] = useState<number>(0);


  const [finalScoreText, setFinalScoreText] = useState<string>(() => {
    const parsed = parseFloat(record.finalRating);
    return !Number.isNaN(parsed) && parsed >= 1 && parsed <= 5 ? String(parsed) : "";
  });

  const applyRevealedEvaluation = (rating: RevealedRating) => {
    const nextScores: Record<string, number> = {
      productivity: Number(rating.productivity) || 0,
      qualityOfWork: Number(rating.qualityOfWork) || 0,
      ownership: Number(rating.ownershipResponsibility) || 0,
      communication: Number(rating.communication) || 0,
      teamCollaboration: Number(rating.teamCollaboration) || 0,
      innovation: Number(rating.innovationProblemSolving) || 0,
      technicalJobSkills: Number(rating.technicalJobSkills) || 0,
      overallPerformanceRating: Number(rating.overallPerformanceRating) || 0,
    };
    setScores(nextScores);
    setRawInputValues(
      Object.fromEntries(
        Object.entries(nextScores).map(([key, value]) => [key, value > 0 ? String(value) : ""]),
      ),
    );
    setStrengths(rating.performanceStrengths || "");
    setImprovements(rating.areasOfImprovement || "");
    setRemarks(rating.additionalRemarks || "");
    const revealedScore = Number(rating.finalRating);
    setFinalScoreText(
      Number.isFinite(revealedScore) && revealedScore >= 1 && revealedScore <= 5
        ? String(revealedScore)
        : "",
    );

    // Section 5: Final Review & Submission Fields
    setGoalsForNextReview(rating.goalsForNextReviewPeriod || "");
    setTrainingRecommendations(rating.trainingDevelopmentRecommendations || "");
    setCareerGrowthRecommendation(rating.careerGrowthRecommendation || "");
    setReviewOutcome(rating.reviewOutcome || "");
    setPerformanceAction(rating.performanceAction || "");
    const finalRatingNum =
      rating.finalPerformanceRating !== undefined && rating.finalPerformanceRating !== null && Number(rating.finalPerformanceRating) > 0
        ? Number(rating.finalPerformanceRating)
        : Number(rating.finalRating) || 0;
    setFinalPerformanceRating(finalRatingNum);
    setRawFinalPerformanceRating(finalRatingNum > 0 ? String(finalRatingNum) : "");
    setFinalManagerComments(rating.finalManagerComments || "");
    if (rating.managerConfirmation != null) {
      setManagerConfirmation(Boolean(rating.managerConfirmation));
    }

    setIsRatingUnlocked(true);
    setIsEmailModalOpen(false);
    setRatingPassword("");
    setShowRatingPassword(false);
    setEmailError("");
    if (hideScoreParameters) {
      if (ratingHideTimerRef.current != null) {
        window.clearTimeout(ratingHideTimerRef.current);
      }
      ratingHideTimerRef.current = window.setTimeout(() => {
        setIsRatingUnlocked(false);
        setScores({});
        setRawInputValues({});
        setStrengths("");
        setImprovements("");
        setRemarks("");
        setFinalScoreText("");
        setGoalsForNextReview("");
        setTrainingRecommendations("");
        setCareerGrowthRecommendation("");
        setReviewOutcome("");
        setPerformanceAction("");
        setFinalPerformanceRating(0);
        setRawFinalPerformanceRating("");
        setFinalManagerComments("");
        ratingHideTimerRef.current = null;
      }, 2 * 60 * 1000);
    }
  };

  const handlePasswordUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ratingPassword.trim()) {
      setEmailError("Password is required.");
      return;
    }
    if (!reviewId) {
      setEmailError("This review cannot be opened yet.");
      return;
    }
    setUnlockingRating(true);
    setEmailError("");
    try {
      const revealed = await AppraisalApi.revealRating(reviewId, record.id, ratingPassword.trim());
      if (!revealed.passwordVerified) {
        setEmailError("Wrong password.");
        return;
      }
      applyRevealedEvaluation(revealed);
    } catch (error) {
      setEmailError(readApiError(error));
    } finally {
      setUnlockingRating(false);
    }
  };

  // Submission / Loading states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submitButtonState, setSubmitButtonState] = useState<"idle" | "animating" | "assigned">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldKey: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  // Form data for employee submission
  const formData: ReviewFormData = useMemo(() => {
    return submissionData || emptyReviewFormData;
  }, [submissionData]);

  // Click on a star
  const handleStarClick = (paramKey: string, ratingValue: number) => {
    if (isViewMode) return;
    setScores((prev) => ({
      ...prev,
      [paramKey]: ratingValue,
    }));
    setRawInputValues((prev) => ({
      ...prev,
      [paramKey]: ratingValue.toString(),
    }));
    clearFieldError(paramKey);
  };

  // Type directly in the numeric input
  const handleInputChange = (paramKey: string, text: string) => {
    if (isViewMode) return;
    if (text === "") {
      setRawInputValues((prev) => ({ ...prev, [paramKey]: "" }));
      setScores((prev) => ({ ...prev, [paramKey]: 0 }));
      return;
    }

    if (!/^[0-9]*\.?[0-9]*$/.test(text)) {
      return;
    }

    setRawInputValues((prev) => ({ ...prev, [paramKey]: text }));

    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, 0), 5);
      setScores((prev) => ({ ...prev, [paramKey]: clamped }));
    } else {
      setScores((prev) => ({ ...prev, [paramKey]: 0 }));
    }

    clearFieldError(paramKey);
  };

  const handleInputBlur = (paramKey: string) => {
    if (isViewMode) return;
    const raw = rawInputValues[paramKey];
    if (!raw || raw.trim() === "") {
      setScores((prev) => ({ ...prev, [paramKey]: 0 }));
      setRawInputValues((prev) => ({ ...prev, [paramKey]: "" }));
      return;
    }

    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed <= 0) {
      setScores((prev) => ({ ...prev, [paramKey]: 0 }));
      setRawInputValues((prev) => ({ ...prev, [paramKey]: "" }));
    } else {
      const clamped = Math.min(Math.max(parsed, 0), 5);
      const formatted = Number.isInteger(clamped)
        ? clamped.toString()
        : clamped.toString();
      setScores((prev) => ({ ...prev, [paramKey]: clamped }));
      setRawInputValues((prev) => ({ ...prev, [paramKey]: formatted }));
    }
  };

  const getParamNumericValue = (paramKey: string): number => {
    return scores[paramKey] ?? 0;
  };

  // Render individual star with true 50% half-star clipping support
  const renderStarIcon = (
    starIndex: number,
    currentScore: number,
    isHovering = false
  ) => {
    if (currentScore >= starIndex) {
      return (
        <Star
          className={`eval-star-icon eval-star-icon-filled ${isHovering ? "scale-105" : ""
            }`}
        />
      );
    }

    const diff = starIndex - currentScore;
    if (diff > 0 && diff < 1) {
      return (
        <span className="eval-star-half-wrapper" aria-hidden="true">
          <Star className="eval-star-icon eval-star-icon-empty" />
          <Star className="eval-star-icon eval-star-icon-filled eval-star-half-overlay" />
        </span>
      );
    }

    return (
      <Star
        className={`eval-star-icon eval-star-icon-empty ${isHovering ? "eval-star-icon-hovered" : ""
          }`}
      />
    );
  };

  // System-calculated average from all 8 evaluation parameters — this IS the final rating
  const calculatedAverage = useMemo(() => {
    const vals = EVALUATION_PARAMETERS.map((p) => scores[p.key] || 0).filter((v) => v > 0);
    if (vals.length === 0) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  }, [scores]);

  // averageScore = auto-computed (no manual entry required)
  const averageScore = calculatedAverage;


  const suggestedRating = useMemo(() => {
    if (averageScore === null) {
      return "";
    }
    if (averageScore >= 4.5) return "Exceptional Performer";
    if (averageScore >= 3.5) return "Exceeds Expectations";
    if (averageScore >= 2.5) return "Meets Expectations";
    if (averageScore >= 1.5) return "Needs Improvement";
    return "Unsatisfactory";
  }, [averageScore]);

  const handleFinalScoreChange = (text: string) => {
    if (isViewMode) return;
    if (text === "") {
      setFinalScoreText("");
      clearFieldError("finalScore");
      return;
    }
    if (!/^\d+(\.\d{0,2})?$/.test(text)) return;
    const parsed = Number(text);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) return;
    setFinalScoreText(text);
    clearFieldError("finalScore");
  };

  const handleFinalScoreBlur = () => {
    if (isViewMode) return;
    const parsed = parseFloat(finalScoreText);
    if (finalScoreText.trim() === "" || Number.isNaN(parsed) || parsed < 1 || parsed > 5) {
      setFinalScoreText("");
      return;
    }
    setFinalScoreText(String(parsed));
  };

  const handleFinalRatingChange = (val: string) => {
    if (isViewMode) return;
    setRawFinalPerformanceRating(val);
    clearFieldError("finalPerformanceRating");
    if (val.trim() === "") {
      setFinalPerformanceRating(0);
      return;
    }
    const num = parseFloat(val);
    if (!Number.isNaN(num) && num >= 1 && num <= 5) {
      setFinalPerformanceRating(Math.round(num * 10) / 10);
    }
  };

  const handleFinalRatingBlur = () => {
    if (isViewMode) return;
    const num = parseFloat(rawFinalPerformanceRating);
    if (rawFinalPerformanceRating.trim() === "" || Number.isNaN(num) || num < 1 || num > 5) {
      if (finalPerformanceRating > 0) {
        setRawFinalPerformanceRating(String(finalPerformanceRating));
      } else {
        setRawFinalPerformanceRating("");
        setFinalPerformanceRating(0);
      }
    } else {
      const clamped = Math.min(5, Math.max(1, Math.round(num * 10) / 10));
      setFinalPerformanceRating(clamped);
      setRawFinalPerformanceRating(String(clamped));
    }
  };

  const scoredCount = useMemo(() => {
    return Object.values(scores).filter((v) => typeof v === "number" && v > 0).length;
  }, [scores]);

  const gaugeRadius = 32;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // ~201.06
  const gaugePercent =
    averageScore !== null ? Math.min(Math.max(averageScore / 5, 0), 1) : 0;
  const gaugeOffset = gaugeCircumference - gaugeCircumference * gaugePercent;

  const currentTier = useMemo(() => {
    if (averageScore === null) return null;
    return getRatingTierConfig(averageScore);
  }, [averageScore]);

  const gaugeColor = useMemo(() => {
    if (averageScore === null || !currentTier) return "#CBD5E1";
    return currentTier.accentHex;
  }, [averageScore, currentTier]);

  const finalRatingTier = useMemo(() => {
    if (!finalPerformanceRating || finalPerformanceRating <= 0) return null;
    return getRatingTierConfig(finalPerformanceRating);
  }, [finalPerformanceRating]);

  const finalGaugeColor = useMemo(() => {
    if (!finalPerformanceRating || !finalRatingTier) return "#CBD5E1";
    return finalRatingTier.accentHex;
  }, [finalPerformanceRating, finalRatingTier]);

  const finalGaugePercent =
    finalPerformanceRating > 0 ? Math.min(Math.max(finalPerformanceRating / 5, 0), 1) : 0;
  const finalGaugeOffset = gaugeCircumference - gaugeCircumference * finalGaugePercent;

  const handleAddStrength = (tag: string) => {
    setStrengths((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
    clearFieldError("strengths");
  };

  const handleAddImprovement = (tag: string) => {
    setImprovements((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
    clearFieldError("improvements");
  };

  // Handle Form Submission — opens confirm modal first
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    let firstErrorElement: HTMLElement | null = null;

    // 1. All 8 evaluation parameters required
    const unratedParams = EVALUATION_PARAMETERS.filter(
      (p) => !scores[p.key] || scores[p.key] === 0
    );
    if (unratedParams.length > 0) {
      unratedParams.forEach((p) => {
        newErrors[p.key] = `Please rate ${p.label}`;
      });
      firstErrorElement = document.getElementById(`eval-param-${unratedParams[0].key}`);
    }

    // 2. Key Strengths (required)
    if (!strengths.trim()) {
      newErrors.strengths = "Please fill out the Key Strengths.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-strengths");
      }
    }

    // 3. Areas of Improvement (required)
    if (!improvements.trim()) {
      newErrors.improvements = "Please fill out the Areas of Improvement.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-improvements");
      }
    }

    // 4. Manager Comments (required)
    if (!remarks.trim()) {
      newErrors.remarks = "Please fill out the Manager Comments.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-remarks");
      }
    }

    // 5. Goals for Next Review (required)
    if (!goalsForNextReview.trim()) {
      newErrors.goalsForNextReview = "Please fill out Goals for Next Review Period.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-goals");
      }
    }

    // 6. Review Outcome (required)
    if (!reviewOutcome) {
      newErrors.reviewOutcome = "Please select a Review Outcome.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-review-outcome");
      }
    }

    // 7. Final Manager Comments (required)
    if (!finalManagerComments.trim()) {
      newErrors.finalManagerComments = "Please fill out the Final Manager Comments.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-final-comments");
      }
    }

    // 8. Manager Confirmation checkbox
    if (!managerConfirmation) {
      newErrors.managerConfirmation = "Please confirm the declaration to submit.";
    }

    // 9. Final Performance Rating (required)
    if (!finalPerformanceRating || finalPerformanceRating < 1) {
      newErrors.finalPerformanceRating = "Please select a Final Performance Rating (1–5 stars).";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-final-perf-rating");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof (firstErrorElement as HTMLTextAreaElement).focus === "function") {
          setTimeout(() => {
            (firstErrorElement as HTMLTextAreaElement).focus();
          }, 350);
        }
      }
      return;
    }

    setFieldErrors({});
    // Open confirm modal before final submit
    setShowConfirmModal(true);
  };

  // Called after user confirms in the modal
  const handleConfirmedSubmit = () => {
    setShowConfirmModal(false);
    if (submitButtonState !== "idle") return;
    if (!reviewId) {
      message.error("This review cannot be saved.");
      return;
    }

    const evaluationResult: EvaluationData = {
      scores,
      averageScore: averageScore || 0,
      suggestedRating,
      strengths,
      improvements,
      remarks,
    };

    setSubmitButtonState("animating");
    setIsSubmitting(true);

    void AppraisalApi.evaluateReview(reviewId, {
      managerId: record.managerId || record.assignedBy || undefined,
      productivity: scores.productivity,
      qualityOfWork: scores.qualityOfWork,
      ownership: scores.ownership,
      ownershipResponsibility: scores.ownership,
      communication: scores.communication,
      teamCollaboration: scores.teamCollaboration,
      innovation: scores.innovation,
      innovationProblemSolving: scores.innovation,
      technicalJobSkills: scores.technicalJobSkills,
      overallPerformanceRating: scores.overallPerformanceRating,
      performanceStrengths: strengths.trim(),
      areasOfImprovement: improvements.trim(),
      additionalRemarks: remarks.trim(),
      goalsForNextReviewPeriod: goalsForNextReview.trim(),
      trainingDevelopmentRecommendations: trainingRecommendations.trim() || undefined,
      careerGrowthRecommendation: careerGrowthRecommendation || undefined,
      reviewOutcome: reviewOutcome,
      performanceAction: performanceAction || undefined,
      finalManagerComments: finalManagerComments.trim(),
      managerConfirmation: true,
      finalRating: averageScore || undefined,
      finalPerformanceRating: finalPerformanceRating || undefined,
      isDraft: false,
    })
      .then(() => {
        setSubmitButtonState("assigned");
        setIsSubmitting(false);
        setIsSuccess(true);
        scrollToTop();
        onSubmitEvaluation?.(record.reviewId ? String(record.reviewId) : record.id, evaluationResult);
        setTimeout(() => {
          scrollToTop();
          onBack();
          setSubmitButtonState("idle");
        }, 1200);
      })
      .catch((error) => {
        setIsSubmitting(false);
        setSubmitButtonState("idle");
        message.error(readApiError(error));
      });
  };

  // Save as Draft — no validation required
  const handleSaveDraft = () => {
    if (!reviewId) {
      message.error("This review cannot be saved.");
      return;
    }
    setIsDraftSaving(true);
    void AppraisalApi.evaluateReview(reviewId, {
      managerId: record.managerId || record.assignedBy || undefined,
      productivity: scores.productivity || undefined,
      qualityOfWork: scores.qualityOfWork || undefined,
      ownership: scores.ownership || undefined,
      ownershipResponsibility: scores.ownership || undefined,
      communication: scores.communication || undefined,
      teamCollaboration: scores.teamCollaboration || undefined,
      innovation: scores.innovation || undefined,
      innovationProblemSolving: scores.innovation || undefined,
      technicalJobSkills: scores.technicalJobSkills || undefined,
      overallPerformanceRating: scores.overallPerformanceRating || undefined,
      performanceStrengths: strengths.trim() || undefined,
      areasOfImprovement: improvements.trim() || undefined,
      additionalRemarks: remarks.trim() || undefined,
      goalsForNextReviewPeriod: goalsForNextReview.trim() || undefined,
      trainingDevelopmentRecommendations: trainingRecommendations.trim() || undefined,
      careerGrowthRecommendation: careerGrowthRecommendation || undefined,
      reviewOutcome: reviewOutcome || undefined,
      performanceAction: performanceAction || undefined,
      finalManagerComments: finalManagerComments.trim() || undefined,
      managerConfirmation: managerConfirmation,
      finalRating: averageScore || undefined,
      finalPerformanceRating: finalPerformanceRating || undefined,
      isDraft: true,
    })
      .then(() => {
        message.success("Draft saved successfully.");
      })
      .catch((error) => {
        message.error(readApiError(error));
      })
      .finally(() => {
        setIsDraftSaving(false);
      });
  };


  // Team ratings calculations
  const teamRatings = formData.teamRatings || {};
  const ratedTeamKeys = Object.keys(teamRatings).filter(
    (k) => (teamRatings[k as keyof typeof teamRatings] || 0) > 0
  );
  const ratedDimensionsCount = ratedTeamKeys.length;
  const avgTeamScore =
    ratedDimensionsCount > 0
      ? (
        ratedTeamKeys.reduce(
          (acc, k) => acc + (teamRatings[k as keyof typeof teamRatings] || 0),
          0
        ) / ratedDimensionsCount
      ).toFixed(1)
      : null;

  const envRating = formData.companyEnvironmentRating || 0;
  const envInfo = ENVIRONMENT_RATINGS[envRating];
  const managerEvaluationReady =
    record.reviewStatus === QuarterlyReviewStatus.COMPLETED &&
    record.performanceStatus === EmployeePerformanceStatus.COMPLETED;
  const normalizedPerfStatus = String(record.performanceStatus || record.status || "").toUpperCase();
  const isEditAccessPendingOrGranted =
    Boolean(grantAccess) ||
    [
      QuarterlyReviewStatus.REQUESTED_FOR_EDIT,
      QuarterlyReviewStatus.EDIT_GRANTED,
      QuarterlyReviewStatus.APPROVED_FOR_EDITING,
      QuarterlyReviewStatus.ALLOWED_TO_EDIT,
    ].some(
      (s) =>
        s &&
        (s.toUpperCase() === normalizedPerfStatus ||
          s.toUpperCase() === String(record.reviewStatus || "").toUpperCase() ||
          s.toUpperCase() === String(record.status || "").toUpperCase())
    );
  const employeeSubmitted =
    [
      EmployeePerformanceStatus.SUBMITTED,
      EmployeePerformanceStatus.UNDER_REVIEW,
      EmployeePerformanceStatus.REVIEWED,
      EmployeePerformanceStatus.APPROVED,
      EmployeePerformanceStatus.REQUESTED_FOR_EDIT,
      EmployeePerformanceStatus.APPROVED_FOR_EDITING,
      EmployeePerformanceStatus.ALLOWED_TO_EDIT,
      EmployeePerformanceStatus.COMPLETED,
    ].some((s) => s && s.toUpperCase() === normalizedPerfStatus) || Boolean(record.submittedOn);
  const canShowEvaluationCta = !isEditAccessPendingOrGranted && (
    hideScoreParameters
      ? managerEvaluationReady
      : (
          !isViewMode ||
          managerEvaluationReady ||
          hasManagerEvaluation ||
          record.reviewStatus === QuarterlyReviewStatus.EVALUATION_IN_PROGRESS ||
          record.status === QuarterlyReviewStatus.EVALUATION_IN_PROGRESS ||
          employeeSubmitted
        )
  );

  const toIsoDate = (value: string): string | undefined => {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
    if (!match) {
      return undefined;
    }
    return `${match[3]}-${match[2]}-${match[1]}`;
  };

  const todayDisplayDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${now.getFullYear()}`;
  };

  useEffect(() => {
    setReviewId(record.reviewId);
    setAssignmentDescription(record.description || "");
    if (grantAccess) {
      setAssignedDate(todayDisplayDate());
      setDeadlineDate("");
      return;
    }
    setAssignedDate(record.assignedOn || record.fromDate || "");
    setDeadlineDate(record.toDate || "");
    if (hideScoreParameters || record.reviewId) {
      return;
    }
    void AppraisalApi.getManagerReviewList(record.id)
      .then((result) => {
        const match = (result.data || []).find(
          (item) => item.quarter === record.quarter && item.financialYear === record.financialYear,
        );
        if (!match) {
          return;
        }
        setReviewId(match.id);
        setAssignmentDescription(match.description || "");
        setAssignedDate(formatAppraisalDisplayDate(match.assignedDate));
        setDeadlineDate(formatAppraisalDisplayDate(match.deadlineDate));
      })
      .catch(() => undefined);
  }, [record, hideScoreParameters, grantAccess]);

  const saveAssignment = async () => {
    if (!reviewId) {
      setAssignmentError("This assignment cannot be saved.");
      return;
    }
    const deadlineIso = toIsoDate(deadlineDate);
    if (!deadlineIso) {
      setAssignmentError(grantAccess ? "Select a deadline." : "Enter the deadline as dd-mm-yyyy.");
      return;
    }
    setSavingAssignment(true);
    setAssignmentError("");
    try {
      const todayDisplay = todayDisplayDate();
      const todayIso = toIsoDate(todayDisplay);
      if (grantAccess) {
        if (!todayIso || deadlineIso <= todayIso) {
          setAssignmentError("Select a deadline after today.");
          setSavingAssignment(false);
          return;
        }
        await AppraisalApi.reassignReview({
          reviewId,
          deadlineDate: deadlineIso,
          reassignedDate: todayIso,
        });
        setAssignedDate(todayDisplay);
        onAssignmentSaved?.({
          reviewId,
          assignedDate: todayDisplay,
          deadline: deadlineDate,
          description: assignmentDescription.trim(),
        });
        message.success("Access granted with the new deadline");
        return;
      }
      await AppraisalApi.updateReview(reviewId, {
        deadlineDate: deadlineIso,
        assignedDate: todayIso,
        description: assignmentDescription.trim(),
      });
      setAssignedDate(todayDisplay);
      onAssignmentSaved?.({
        reviewId,
        assignedDate: todayDisplay,
        deadline: deadlineDate,
        description: assignmentDescription.trim(),
      });
      message.success("Assignment saved");
    } catch (error) {
      setAssignmentError(readApiError(error));
    } finally {
      setSavingAssignment(false);
    }
  };

  // Employee initials for avatar
  const empInitials = (record.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div ref={panelTopRef} className="evaluation-panel-container relative">
      {/* Top Navigation & Title Header */}
      <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={activeView === "matrix" ? handleNavigateToReview : onBack}
            className="eval-back-btn mb-2 group cursor-pointer"
            title={activeView === "matrix" ? "Back to Employee Review" : "Return to Quarterly Review List"}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>{activeView === "matrix" ? "Back to Employee Review" : "Back to Team List"}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 eval-trophy-box">
              {activeView === "matrix" ? <Sliders className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight relative w-fit">
                <span className="eval-title-anim">
                  {activeView === "matrix"
                    ? isViewMode
                      ? "Manager Evaluation (View Mode)"
                      : "Manager Review & Evaluation Matrix"
                    : isViewMode
                      ? "Quarterly Review Details"
                      : "Employee Performance Review"}
                </span>
                <span className="eval-title-accent-line" />
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#64748B] mt-1 flex flex-wrap items-center gap-1.5 eval-subtitle-anim">
                <span>{isViewMode ? "Assigned" : "Evaluating"}</span>
                <span className="font-bold text-[#2B3674]">{record.name}</span>
                <span className="inline-flex items-center justify-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-extrabold text-[#1D4ED8]">
                  {record.quarter}
                </span>
                <span className="inline-flex items-center justify-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-extrabold text-[#1D4ED8]">
                  {record.financialYear}
                </span>
              </p>
            </div>
          </div>
        </div>

        {isSuccess && (
          <div className="bg-blue-50/90 border border-blue-200/80 text-blue-950 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Evaluation submitted successfully! Returning to list...</span>
          </div>
        )}
      </div>

      {/* Top Metadata Banner Card with Tech SVG Artwork & Animated Avatar Ring */}
      <div className="eval-meta-banner eval-reveal-card mb-4">
        {/* Subtle Tech Circuit SVG Pattern in Background Corner */}
        <svg
          className="absolute right-0 top-0 bottom-0 h-full w-48 opacity-[0.06] pointer-events-none text-blue-600"
          viewBox="0 0 200 120"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 60 Q50 10 100 60 T200 60"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0 80 Q50 30 100 80 T200 80"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            fill="none"
          />
          <circle cx="100" cy="60" r="4" fill="currentColor" />
          <circle cx="150" cy="40" r="3" fill="currentColor" />
          <circle cx="50" cy="80" r="3" fill="currentColor" />
        </svg>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 relative z-10">
          {/* 1. Employee Name & Avatar with Animated Rotating Ring */}
          <div className="eval-meta-segment eval-meta-segment-1 eval-stagger-item eval-stagger-1">
            <div className="relative shrink-0">
              <svg
                className="absolute -inset-1.5 w-15 h-15 animate-spin-slow pointer-events-none opacity-40 text-blue-500"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="14 10"
                />
              </svg>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-blue-500/25 ring-4 ring-blue-500/10">
                {empInitials}
              </div>
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-0.5">
                EMPLOYEE NAME
              </span>
              <span className="text-sm font-bold text-[#2B3674] truncate block">
                {record.name}
              </span>
            </div>
          </div>

          {/* 2. Employee ID */}
          <div className="eval-meta-segment eval-meta-segment-2 sm:pl-4 eval-stagger-item eval-stagger-2">
            <div>
              <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-0.5">
                EMPLOYEE ID
              </span>
              <span className="text-sm font-bold text-[#2B3674] block">
                {record.id}
              </span>
            </div>
          </div>

          {/* 3. Designation & Department */}
          <div className="eval-meta-segment eval-meta-segment-3 sm:pl-4 eval-stagger-item eval-stagger-3">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-0.5">
                DESIGNATION &amp; DEPT
              </span>
              <span className="text-sm font-bold text-[#2B3674] block truncate">
                {record.role || "—"}
              </span>
            </div>
          </div>

          {/* 4. Submitted Date */}
          <div className="eval-meta-segment eval-meta-segment-4 sm:pl-4 eval-stagger-item eval-stagger-4">
            <div>
              <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-0.5">
                EMPLOYEE PERFORMANCE SUBMITTED DATE
              </span>
              <span className="text-sm font-bold text-[#2B3674] block">
                {employeeSubmitted ? record.submittedOn || "—" : "Not submitted"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stacked Layout: Employee Performance Submission OR Manager Evaluation based on activeView */}
      <div className="flex flex-col gap-6 w-full">
        {/* ===================================================================
            SECTION 1: Employee Performance Submission (Full Width)
           =================================================================== */}
        {activeView === "review" && (
          <div className="w-full space-y-4 eval-submission-col">
            <div className="eval-glass-card eval-reveal-card p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#2B3674]">Assignment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-1">
                    Assigned quarter
                  </span>
                  <div className="rounded-xl border border-blue-200/60 bg-gray-50/80 px-3 py-2.5 text-sm font-bold text-[#2B3674] eval-assignment-readonly-field cursor-not-allowed select-none">
                    {record.quarter} · {record.financialYear}
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-1">
                    Assigned date
                  </span>
                  <div className="rounded-xl border border-blue-200/60 bg-gray-50/80 px-3 py-2.5 text-sm font-bold text-[#2B3674] eval-assignment-readonly-field cursor-not-allowed select-none">
                    {assignedDate || "—"}
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-1">
                    Deadline{grantAccess ? " *" : ""}
                  </span>
                  {(isViewMode || employeeSubmitted) && !grantAccess ? (
                    <div className="rounded-xl border border-blue-200/60 bg-gray-50/80 px-3 py-2.5 text-sm font-bold text-[#2B3674] eval-assignment-readonly-field cursor-not-allowed select-none">
                      {deadlineDate || "—"}
                    </div>
                  ) : (
                    <DatePicker className="w-full" value={deadlineDate} onChange={setDeadlineDate} />
                  )}
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider mb-1">
                  Description
                </span>
                <textarea
                  rows={3}
                  readOnly={isViewMode || employeeSubmitted || grantAccess}
                  value={assignmentDescription}
                  onChange={(event) => setAssignmentDescription(event.target.value)}
                  placeholder="Assignment description"
                  className={`eval-textarea-field w-full ${isViewMode || employeeSubmitted || grantAccess ? "eval-textarea-readonly !cursor-not-allowed" : "!cursor-text cursor-text"}`}
                />
              </div>
              {((!isViewMode && !employeeSubmitted) || grantAccess) && (
                <div className="flex items-center justify-end gap-3">
                  {assignmentError ? (
                    <p className="text-xs font-bold text-red-600">{assignmentError}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={savingAssignment}
                    onClick={() => void saveAssignment()}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
                  >
                    {savingAssignment ? "Saving" : grantAccess ? "Grant access" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {employeeSubmitted ? (
              <>
                {/* STEP 1: ROLE & QUARTER OVERVIEW */}
                <div className="eval-step-card eval-reveal-card space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                        1
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2B3674] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                        Role &amp; Quarter Overview
                      </h3>
                    </div>
                  </div>

                  <div className="eval-stagger-item eval-stagger-3">
                    <label className="text-[11px] font-bold text-[#A3AED0] block mb-1.5 uppercase tracking-wider">
                      Overview
                    </label>
                    <div
                      className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#2B3674] leading-relaxed whitespace-pre-line font-medium"
                      title="Employee submitted response (Read-only)"
                    >
                      {formData.overview || "—"}
                    </div>
                  </div>
                </div>

                {/* STEP 2: KEY ACHIEVEMENTS & PROJECTS */}
                <div className="eval-step-card eval-reveal-card space-y-3.5">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                        2
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2B3674] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                        Key Achievements &amp; Projects
                      </h3>
                    </div>
                  </div>

                  {(formData.projects || []).length === 0 ? (
                    <div className="eval-readonly-field p-3 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#64748B]">
                      —
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {(formData.projects || []).map((project, index) => (
                        <div key={`${project.title}-${index}`} className="space-y-2 p-3 bg-blue-50/20 border border-blue-100 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                              Project {index + 1}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-[#A3AED0] block mb-1 uppercase tracking-wider">
                                Project Title
                              </label>
                              <div className="eval-readonly-field p-3 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm font-bold text-[#2B3674]">
                                {project.title || "—"}
                              </div>
                              {(project.attachments || []).length > 0 && (
                                <div className="mt-2.5">
                                  <label className="text-[11px] font-bold text-[#A3AED0] block mb-1 uppercase tracking-wider">
                                    Attachments
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {(project.attachments || []).map((file) => (
                                      <AttachmentItem
                                        key={file.objectKey || file.fileName}
                                        file={file}
                                        readOnly
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-[#A3AED0] block mb-1 uppercase tracking-wider">
                                Project Description
                              </label>
                              <div className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#2B3674] whitespace-pre-line font-medium">
                                {project.description || "—"}
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-[#A3AED0] block mb-1 uppercase tracking-wider">
                                Challenge Overcome
                              </label>
                              <div className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#2B3674] whitespace-pre-line font-medium">
                                {project.challenge || "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* STEP 3: TEAMWORK & COLLABORATION with Interactive Score Bars */}
                <div className="eval-step-card eval-reveal-card space-y-3.5">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                        3
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2B3674] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                        Teamwork &amp; Collaboration
                      </h3>
                    </div>
                    {avgTeamScore ? (
                      <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border border-blue-200/80 shadow-2xs flex items-center gap-1.5 shrink-0 eval-stagger-item eval-stagger-2">
                        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)] shrink-0" />
                        <span className="text-[11px] font-semibold text-[#64748B]">Average:</span>
                        <span className="text-xs sm:text-sm font-bold text-[#2B3674]">{avgTeamScore}</span>
                        <span className="text-[10px] font-bold text-[#94A3B8]">/ 5.0</span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#A3AED0] block mb-2 uppercase tracking-wider eval-stagger-item eval-stagger-3">
                      Evaluated Teamwork Dimensions ({ratedDimensionsCount}/6)
                    </label>

                    {/* 2-Column Responsive Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 eval-stagger-item eval-stagger-4">
                      {TEAM_CRITERIA.map((criterion) => {
                        const score =
                          teamRatings[criterion.key as keyof typeof teamRatings] || 0;
                        return (
                          <div
                            key={criterion.key}
                            className="eval-teamwork-item eval-readonly-field flex items-center justify-between"
                            title="Employee submitted rating (Read-only)"
                          >
                            <span className="text-xs font-bold text-[#2B3674] leading-snug">
                              {criterion.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${s <= score
                                    ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.35)]"
                                    : "fill-transparent text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* STEP 4: CONTINUOUS LEARNING & GOALS */}
                <div className="eval-step-card eval-reveal-card space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                        4
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2B3674] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                        Continuous Learning &amp; Goals
                      </h3>
                    </div>
                  </div>

                  <div className="eval-stagger-item eval-stagger-3">
                    <label className="text-[11px] font-bold text-[#A3AED0] block mb-1.5 uppercase tracking-wider">
                      Learning Goals
                    </label>
                    {(formData.learningGoalItems || []).length === 0 ? (
                      <div
                        className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#64748B] leading-relaxed font-medium"
                        title="Employee submitted response (Read-only)"
                      >
                        —
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(formData.learningGoalItems || []).map((goal, index) => (
                          <div key={`${goal}-${index}`} className="space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                              Goal {index + 1}
                            </span>
                            <div
                              className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#2B3674] leading-relaxed whitespace-pre-line font-medium"
                              title="Employee submitted response (Read-only)"
                            >
                              {goal}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP 5: COMPANY ENVIRONMENT */}
                <div className="eval-step-card eval-reveal-card space-y-3.5">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                        5
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2B3674] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                        Company Environment
                      </h3>
                    </div>
                    {envInfo ? (
                      <span className="text-xs font-bold text-blue-600 px-3 py-1 rounded-full bg-blue-50 flex items-center gap-1.5 border border-blue-200 shadow-xs eval-stagger-item eval-stagger-2">
                        <span className="text-sm">{envInfo.emoji}</span>
                        <span>
                          {envInfo.label} ({envRating}/5)
                        </span>
                      </span>
                    ) : null}
                  </div>

                  {/* Feedback on Work Culture */}
                  <div className="eval-stagger-item eval-stagger-3">
                    <label className="text-[11px] font-bold text-[#A3AED0] block mb-1 uppercase tracking-wider">
                      Feedback on Work Culture
                    </label>
                    <div
                      className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#2B3674] leading-relaxed whitespace-pre-line font-medium"
                      title="Employee submitted response (Read-only)"
                    >
                      {formData.workCultureFeedback || "—"}
                    </div>
                  </div>

                  {/* Work Life Balance */}
                  <div className="eval-stagger-item eval-stagger-4">
                    <label className="text-[11px] font-bold text-[#A3AED0] block mb-1 uppercase tracking-wider">
                      Work Life Balance
                    </label>
                    <div
                      className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#2B3674] leading-relaxed whitespace-pre-line font-medium"
                      title="Employee submitted response (Read-only)"
                    >
                      {formData.workLifeBalance || "—"}
                    </div>
                  </div>

                  {/* Suggestions for Improvement */}
                  <div className="eval-stagger-item eval-stagger-4">
                    <label className="text-[11px] font-bold text-[#A3AED0] block mb-1 uppercase tracking-wider">
                      Suggestions for Improvement
                    </label>
                    <div
                      className="eval-readonly-field p-3.5 bg-gray-50/80 border border-blue-200/60 rounded-xl text-sm text-[#2B3674] leading-relaxed whitespace-pre-line font-medium"
                      title="Employee submitted response (Read-only)"
                    >
                      {formData.suggestionsForImprovement || "—"}
                    </div>
                  </div>
                </div>

                {/* Evaluation CTA Card: shown to manager if submitted/drafted/completed, but strictly hidden for employee until completed */}
                {canShowEvaluationCta ? (
                  <div className="eval-matrix-cta-card eval-reveal-card relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-blue-200/70 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/20 shadow-lg shadow-blue-500/10 mt-6">
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
                              {record.reviewStatus === QuarterlyReviewStatus.EVALUATION_IN_PROGRESS
                                ? `${record.quarter} Evaluation Draft Saved`
                                : `${record.quarter} Evaluation Ready`}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#2B3674] mt-1">
                            {isViewMode
                              ? record.reviewStatus === QuarterlyReviewStatus.EVALUATION_IN_PROGRESS
                                ? "View Draft Evaluation"
                                : "View Evaluation & Ratings"
                              : "Evaluate Employee Performance"}
                          </h3>
                          <p className="text-xs text-[#64748B] mt-0.5 max-w-xl leading-relaxed">
                            {isViewMode
                              ? record.reviewStatus === QuarterlyReviewStatus.EVALUATION_IN_PROGRESS
                                ? "Navigate to the scored evaluation matrix to inspect draft competencies, ratings, and feedback."
                                : "Navigate to the scored evaluation matrix to inspect finalized competencies, ratings, and feedback."
                              : "Completed review of all quarterly submissions. Proceed to the Evaluation Matrix to score parameters (1-5 scale) and finalize the appraisal."}
                          </p>
                        </div>
                      </div>

                      {/* Action Button that navigates to the Evaluation Matrix */}
                      <button
                        type="button"
                        onClick={handleNavigateToMatrix}
                        className="eval-open-matrix-btn shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
                      >
                        <Sliders className="w-4 h-4 transition-transform group-hover:rotate-45" />
                        <span>{isViewMode ? "Go to Evaluation Matrix" : "Open Evaluation Matrix"}</span>
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
                ) : isEditAccessPendingOrGranted ? (
                  <div className="eval-glass-card eval-reveal-card p-4 sm:p-5 mt-6 border border-amber-200/70 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-amber-50/70 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          {grantAccess || [QuarterlyReviewStatus.EDIT_GRANTED, QuarterlyReviewStatus.APPROVED_FOR_EDITING, QuarterlyReviewStatus.ALLOWED_TO_EDIT].some((s) => s && (s.toUpperCase() === normalizedPerfStatus || s.toUpperCase() === String(record.reviewStatus || "").toUpperCase()))
                            ? "Edit Window Active"
                            : "Edit Access Requested"}
                        </p>
                        <p className="text-xs text-amber-700/90 mt-0.5 font-medium">
                          {grantAccess || [QuarterlyReviewStatus.EDIT_GRANTED, QuarterlyReviewStatus.APPROVED_FOR_EDITING, QuarterlyReviewStatus.ALLOWED_TO_EDIT].some((s) => s && (s.toUpperCase() === normalizedPerfStatus || s.toUpperCase() === String(record.reviewStatus || "").toUpperCase()))
                            ? "Employee has been granted edit access. The Evaluation Matrix will become accessible once they resubmit their review."
                            : "Employee has submitted an access request to update this review. The Evaluation Matrix will become accessible once the review is resubmitted."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : hideScoreParameters ? (
                  <div className="eval-glass-card eval-reveal-card p-4 sm:p-5 mt-4">
                    <p className="text-sm font-medium text-[#64748B]">
                      Quarterly review submitted. Waiting for manager review.
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="eval-glass-card eval-reveal-card p-4 sm:p-5">
                <p className="text-sm font-medium text-[#64748B]">
                  {hideScoreParameters
                    ? "You have not submitted the quarterly review yet. The data will appear here after you submit."
                    : "This employee has not submitted the quarterly review yet. The data appear here after they submit."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            SECTION 2: Manager Review & Evaluation Matrix (Full Width)
           =================================================================== */}
        {activeView === "matrix" && (
          <div className="w-full space-y-6">
            <div className="eval-glass-card eval-reveal-card p-6 sm:p-7 w-full">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E2E8F0]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 eval-stagger-item eval-stagger-1">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#2B3674] eval-stagger-item eval-stagger-2">
                    {isViewMode
                      ? "Manager Evaluation (View Mode)"
                      : "Manager Review & Evaluation Matrix"}
                  </h2>
                  <p className="text-xs text-[#64748B] eval-stagger-item eval-stagger-3">
                    {isViewMode
                      ? "Evaluation record is read-only. Editing is disabled."
                      : "Rate employee across parameters or type score directly"}
                  </p>
                </div>
              </div>

              <form
                onSubmit={isViewMode ? (e) => e.preventDefault() : handleSubmit}
                className={`space-y-5 ${isViewMode ? "eval-view-mode" : ""}`}
              >
                {/* Score Evaluation Parameters Box / Hidden State */}
                {hideScoreParameters && !isRatingUnlocked && !hasManagerEvaluation ? (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2.5 eval-stagger-item eval-stagger-2">
                        <label className="block text-xs font-bold text-[#A3AED0] uppercase tracking-wider">
                          Score Evaluation Parameters (1-5 Scale)
                        </label>
                      </div>

                      <div
                        onClick={() => setIsEmailModalOpen(true)}
                        className="eval-rating-hidden-card group cursor-pointer eval-stagger-item eval-stagger-3"
                        role="button"
                        tabIndex={0}
                        title="Click to view rating verification popup"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center font-bold">
                              <Lock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#2B3674] block">
                                Score Evaluation Parameters (1-5 Scale)
                              </span>
                              <span className="text-[11px] text-[#64748B]">
                                Enter your password to view the evaluation
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Hidden
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/60 to-white border border-blue-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#2B3674]">
                                Request Rating Access
                              </h4>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                Enter your password to view the completed evaluation
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEmailModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>View Rating</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Score Evaluation Parameters Box */}
                    <div>
                      <div className="mb-2.5 eval-stagger-item eval-stagger-2">
                        <label className="block text-xs font-bold text-[#A3AED0] uppercase tracking-wider">
                          Score Evaluation Parameters (1-5 Scale)
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 border border-blue-100 rounded-2xl p-3 sm:p-4 bg-blue-50/30 shadow-inner">
                        {EVALUATION_PARAMETERS.map((param, pIdx) => {
                          const currentRating = getParamNumericValue(param.key);
                          const isParamHovered = hoveredStar?.key === param.key;
                          const activeHoverValue = isParamHovered
                            ? hoveredStar.value
                            : 0;

                          return (
                            <div
                              key={param.key}
                              id={`eval-param-${param.key}`}
                              className={`eval-reveal-card eval-stagger-${(pIdx % 4) + 1} flex flex-col`}
                            >
                              <div
                                className={`eval-param-row bg-white/90 border ${fieldErrors[param.key]
                                  ? "!border-red-500 !ring-2 !ring-red-100 !bg-red-50/25"
                                  : "border-[#E2E8F0]/70"
                                  } rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs transition-all`}
                              >
                                <span className="text-xs sm:text-[13px] font-bold text-[#2B3674] pr-2">
                                  {param.label}
                                </span>

                                <div className="eval-star-group shrink-0">
                                  {[1, 2, 3, 4, 5].map((starNum) => {
                                    return (
                                      <button
                                        key={starNum}
                                        type="button"
                                        disabled={isViewMode}
                                        onClick={
                                          isViewMode
                                            ? undefined
                                            : () => handleStarClick(param.key, starNum)
                                        }
                                        onMouseEnter={
                                          isViewMode
                                            ? undefined
                                            : () =>
                                              setHoveredStar({
                                                key: param.key,
                                                value: starNum,
                                              })
                                        }
                                        onMouseLeave={
                                          isViewMode ? undefined : () => setHoveredStar(null)
                                        }
                                        className={`eval-star-btn ${isViewMode ? "eval-disabled-cursor" : ""
                                          }`}
                                        title={
                                          isViewMode
                                            ? "Evaluation is in view-only mode"
                                            : `Rate ${starNum} star${starNum > 1 ? "s" : ""
                                            } for ${param.label}`
                                        }
                                        aria-label={`Rate ${starNum} out of 5 for ${param.label}`}
                                      >
                                        {renderStarIcon(
                                          starNum,
                                          !isViewMode && activeHoverValue > 0
                                            ? activeHoverValue
                                            : currentRating,
                                          !isViewMode && activeHoverValue > 0
                                        )}
                                      </button>
                                    );
                                  })}

                                  {/* Numeric Input allowing direct typing */}
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="—"
                                    disabled={isViewMode}
                                    readOnly={isViewMode}
                                    value={
                                      !isViewMode && activeHoverValue > 0
                                        ? activeHoverValue
                                        : rawInputValues[param.key] ?? ""
                                    }
                                    onChange={(e) =>
                                      handleInputChange(param.key, e.target.value)
                                    }
                                    onBlur={() => handleInputBlur(param.key)}
                                    onFocus={isViewMode ? undefined : (e) => e.target.select()}
                                    className={`eval-star-score-input ${isViewMode ? "eval-score-input-disabled" : ""
                                      }`}
                                    title={
                                      isViewMode
                                        ? "Evaluation is in view-only mode (Editing disabled)"
                                        : "Type rating number (e.g. 3.3, .2, 4.7) or click stars"
                                    }
                                    aria-label={`Enter rating for ${param.label}`}
                                  />
                                </div>
                              </div>

                              {/* Rating description label shown when rated */}
                              {currentRating > 0 && !fieldErrors[param.key] && (
                                <div className="mt-1 px-1 flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-blue-600">
                                    {currentRating} – {getRatingLabel(currentRating)}
                                  </span>
                                </div>
                              )}

                              {/* Error message rendered cleanly UNDER THE CARD */}
                              {fieldErrors[param.key] && (
                                <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 px-1 text-[11px] font-semibold text-red-600 animate-in fade-in slide-in-from-top-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <span>{fieldErrors[param.key]}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Calculated Average Score Banner with Circular Radial SVG Gauge */}
                    <div
                      className="eval-kpi-card eval-reveal-card flex items-center gap-4 transition-all duration-300"
                      style={
                        currentTier
                          ? {
                              borderColor: currentTier.badgeBorderHex,
                              boxShadow: `0 4px 18px -2px ${currentTier.accentHex}26`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0 shrink-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors duration-300"
                          style={
                            currentTier
                              ? {
                                  backgroundColor: currentTier.badgeBgHex,
                                  color: currentTier.badgeTextHex,
                                  border: `1px solid ${currentTier.badgeBorderHex}60`,
                                }
                              : { backgroundColor: "rgba(219, 234, 254, 0.8)", color: "#2563EB" }
                          }
                        >
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
        
                            {currentTier && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase transition-all duration-300"
                                style={{
                                  backgroundColor: currentTier.badgeBgHex,
                                  color: currentTier.badgeTextHex,
                                  border: `1.5px solid ${currentTier.badgeBorderHex}`,
                                }}
                              >
                                {currentTier.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs sm:text-[13px] font-bold text-[#2B3674]">
                            Overall Performance Rating
                            <span className="ml-1.5 text-[11px] font-medium text-[#A3AED0] normal-case">(auto-calculated)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 items-center justify-center min-w-0">
                        <div className="flex flex-col items-center gap-1">
                          {/* Auto-calculated read-only badge */}
                          <div
                            id="eval-field-final-score"
                            className={`eval-star-score-input eval-final-score-input pointer-events-none select-none text-center font-bold text-sm ${fieldErrors.finalScore ? "!border-red-500" : ""}`}
                            style={
                              currentTier && averageScore !== null
                                ? {
                                    borderColor: currentTier.badgeBorderHex,
                                    color: currentTier.badgeTextHex,
                                    backgroundColor: currentTier.badgeBgHex + "33",
                                  }
                                : { color: "#94A3B8", backgroundColor: "#F8FAFC" }
                            }
                            title="Auto-calculated from evaluation parameters"
                            aria-label="Auto-calculated final rating"
                          >
                            {averageScore !== null ? averageScore.toFixed(1) : "—"}
                          </div>
                          {fieldErrors.finalScore ? (
                            <span className="text-[11px] font-semibold text-red-600">{fieldErrors.finalScore}</span>
                          ) : averageScore !== null ? (
                            <span className="text-[9px] font-bold text-[#64748B]">{getRatingLabel(averageScore)}</span>
                          ) : (
                            <span className="text-[9px] font-semibold text-[#94A3B8]">Rate parameters above</span>
                          )}
                        </div>
                      </div>


                      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                        <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke="#E2E8F0"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke={gaugeColor}
                            strokeWidth="6"
                            strokeDasharray="201.06"
                            strokeDashoffset={gaugeOffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                          <span
                            className="text-base font-bold leading-none transition-colors duration-300"
                            style={currentTier ? { color: currentTier.badgeTextHex } : { color: "#2B3674" }}
                          >
                            {averageScore !== null ? averageScore.toFixed(1) : "—"}
                          </span>
                          <span className="text-[9px] font-bold text-[#64748B] mt-0.5">/ 5.0</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {(!hideScoreParameters || isRatingUnlocked) && (
                  <div className="space-y-4">
                    <div className="eval-reveal-card" id="eval-field-container-strengths">
                      <label className="block text-xs font-bold text-[#2B3674] mb-1.5 flex items-center justify-between eval-stagger-item eval-stagger-1">
                        <span>
                          Key Strengths <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#A3AED0]">
                          Key Highlights
                        </span>
                      </label>
                      <textarea
                        id="eval-field-strengths"
                        rows={3}
                        readOnly={isViewMode}
                        disabled={isViewMode}
                        value={strengths}
                        onChange={(e) => {
                          setStrengths(e.target.value);
                          clearFieldError("strengths");
                        }}
                        placeholder="Highlight major strengths and positive attributes..."
                        className={`eval-textarea-field eval-stagger-item eval-stagger-2 ${fieldErrors.strengths ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""
                          } ${isViewMode ? "eval-textarea-readonly !cursor-not-allowed cursor-not-allowed" : ""
                          }`}
                        title={
                          isViewMode
                            ? "Evaluation is in view-only mode (Editing disabled)"
                            : undefined
                        }
                      />
                      {fieldErrors.strengths && (
                        <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-red-600 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                          <span>{fieldErrors.strengths}</span>
                        </div>
                      )}
                    </div>

                    <div className="eval-reveal-card" id="eval-field-container-improvements">
                      <label className="block text-xs font-bold text-[#2B3674] mb-1.5 flex items-center justify-between eval-stagger-item eval-stagger-1">
                        <span>
                          Areas of Improvement <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#A3AED0]">
                          Growth Objectives
                        </span>
                      </label>
                      <textarea
                        id="eval-field-improvements"
                        rows={3}
                        readOnly={isViewMode}
                        disabled={isViewMode}
                        value={improvements}
                        onChange={(e) => {
                          setImprovements(e.target.value);
                          clearFieldError("improvements");
                        }}
                        placeholder="Identify growth areas and learning objectives..."
                        className={`eval-textarea-field eval-stagger-item eval-stagger-2 ${fieldErrors.improvements ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""
                          } ${isViewMode ? "eval-textarea-readonly !cursor-not-allowed cursor-not-allowed" : ""
                          }`}
                        title={
                          isViewMode
                            ? "Evaluation is in view-only mode (Editing disabled)"
                            : undefined
                        }
                      />
                      {fieldErrors.improvements && (
                        <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-red-600 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                          <span>{fieldErrors.improvements}</span>
                        </div>
                      )}
                    </div>

                    <div className="eval-reveal-card" id="eval-field-container-remarks">
                      <label className="block text-xs font-bold text-[#2B3674] mb-1.5 flex items-center justify-between eval-stagger-item eval-stagger-1">
                        <span>
                          Manager Comments <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#A3AED0]">
                          Guidance &amp; Notes
                        </span>
                      </label>
                      <textarea
                        id="eval-field-remarks"
                        rows={2}
                        readOnly={isViewMode}
                        disabled={isViewMode}
                        value={remarks}
                        onChange={(e) => {
                          setRemarks(e.target.value);
                          clearFieldError("remarks");
                        }}
                        placeholder="General comments or guidance..."
                        className={`eval-textarea-field eval-stagger-item eval-stagger-2 ${fieldErrors.remarks ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""
                          } ${isViewMode ? "eval-textarea-readonly !cursor-not-allowed cursor-not-allowed" : ""
                          }`}
                        title={
                          isViewMode
                            ? "Evaluation is in view-only mode (Editing disabled)"
                            : undefined
                        }
                      />
                      {fieldErrors.remarks && (
                        <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-red-600 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                          <span>{fieldErrors.remarks}</span>
                        </div>
                      )}
                    </div>

                    {/* ========== FINAL REVIEW & SUBMISSION SECTION ========== */}
                    <div className="eval-step-card eval-reveal-card space-y-4 mt-2 border-2 border-blue-200/60 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-50/30 to-white">
                        {/* Section Header */}
                        <div className="flex items-center gap-2.5 border-b border-blue-100 pb-3">
                          <h3 className="text-xs sm:text-sm font-bold text-[#2B3674] uppercase tracking-wider">Final Review &amp; Submission</h3>
                          {calculatedAverage !== null && (
                            <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              Avg: {calculatedAverage.toFixed(1)} / 5.0
                            </span>
                          )}
                        </div>

                        {/* Goals for Next Review Period */}
                        <div id="eval-field-container-goals">
                          <label className="block text-xs font-bold text-[#2B3674] mb-1.5">
                            Goals for Next Review Period <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="eval-field-goals"
                            rows={3}
                            readOnly={isViewMode}
                            disabled={isViewMode}
                            value={goalsForNextReview}
                            onChange={(e) => { setGoalsForNextReview(e.target.value); clearFieldError("goalsForNextReview"); }}
                            placeholder="Define measurable goals and objectives for next review period..."
                            className={`eval-textarea-field ${fieldErrors.goalsForNextReview ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""} ${isViewMode ? "eval-textarea-readonly !cursor-not-allowed" : ""}`}
                          />
                          {fieldErrors.goalsForNextReview && (
                            <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-red-600">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                              <span>{fieldErrors.goalsForNextReview}</span>
                            </div>
                          )}
                        </div>

                        {/* Training / Development Recommendations */}
                        <div>
                          <label className="block text-xs font-bold text-[#2B3674] mb-1.5">
                            Training / Development Recommendations
                            <span className="ml-1.5 text-[10px] font-bold text-[#A3AED0]">(optional)</span>
                          </label>
                          <textarea
                            rows={2}
                            readOnly={isViewMode}
                            disabled={isViewMode}
                            value={trainingRecommendations}
                            onChange={(e) => setTrainingRecommendations(e.target.value)}
                            placeholder="Suggest relevant training, courses, or learning programs..."
                            className={`eval-textarea-field ${isViewMode ? "eval-textarea-readonly !cursor-not-allowed" : ""}`}
                          />
                        </div>

                        {/* 2-col: Career Growth + Review Outcome */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Career Growth Recommendation */}
                          <div>
                            <label className="block text-xs font-bold text-[#2B3674] mb-1.5">
                              Career Growth Recommendation
                              <span className="ml-1.5 text-[10px] font-bold text-[#A3AED0]">(optional)</span>
                            </label>
                            <Dropdown
                              options={CAREER_GROWTH_OPTIONS}
                              value={careerGrowthRecommendation}
                              onChange={(val) => setCareerGrowthRecommendation(val)}
                              placeholder="Select..."
                              disabled={isViewMode}
                              allowClear={!isViewMode}
                              className="w-full"
                              maxLabelWidth="max-w-none"
                              buttonClassName={`eval-dropdown-btn ${
                                isViewMode
                                  ? "eval-dropdown-disabled"
                                  : careerGrowthRecommendation
                                  ? "!text-[#2B3674]"
                                  : "!text-[#A3AED0]"
                              }`}
                            />
                          </div>

                          {/* Review Outcome */}
                          <div id="eval-field-container-review-outcome">
                            <label className="block text-xs font-bold text-[#2B3674] mb-1.5">
                              Review Outcome <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                              options={REVIEW_OUTCOME_OPTIONS}
                              value={reviewOutcome}
                              onChange={(val) => {
                                setReviewOutcome(val);
                                clearFieldError("reviewOutcome");
                              }}
                              placeholder="Select outcome..."
                              disabled={isViewMode}
                              allowClear={false}
                              className="w-full"
                              maxLabelWidth="max-w-none"
                              buttonClassName={`eval-dropdown-btn ${
                                fieldErrors.reviewOutcome
                                  ? "eval-dropdown-error"
                                  : isViewMode
                                  ? "eval-dropdown-disabled"
                                  : reviewOutcome
                                  ? "!text-[#2B3674]"
                                  : "!text-[#A3AED0]"
                              }`}
                            />
                            {fieldErrors.reviewOutcome && (
                              <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-red-600">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                <span>{fieldErrors.reviewOutcome}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Performance Action */}
                        <div>
                          <label className="block text-xs font-bold text-[#2B3674] mb-1.5">
                            Performance Action
                            <span className="ml-1.5 text-[10px] font-bold text-[#A3AED0]">(optional)</span>
                          </label>
                          <Dropdown
                            options={PERFORMANCE_ACTION_OPTIONS}
                            value={performanceAction}
                            onChange={(val) => setPerformanceAction(val)}
                            placeholder="Select action..."
                            disabled={isViewMode}
                            allowClear={!isViewMode}
                            className="w-full"
                            maxLabelWidth="max-w-none"
                            buttonClassName={`eval-dropdown-btn ${
                              isViewMode
                                ? "eval-dropdown-disabled"
                                : performanceAction
                                ? "!text-[#2B3674]"
                                : "!text-[#A3AED0]"
                            }`}
                          />
                        </div>

                        {/* Final Performance Rating — Image 1 KPI Card Design (no stars) */}
                        <div id="eval-field-container-final-perf-rating" className="w-full">
                          <label className="block text-xs font-bold text-[#2B3674] mb-1.5">
                            Final Performance Rating <span className="text-red-500">*</span>
                          </label>
                          <div
                            id="eval-field-final-perf-rating"
                            className="eval-kpi-card eval-reveal-card flex items-center justify-between gap-4 transition-all duration-300"
                            style={
                              finalRatingTier
                                ? {
                                    borderColor: finalRatingTier.badgeBorderHex,
                                    boxShadow: `0 4px 18px -2px ${finalRatingTier.accentHex}26`,
                                  }
                                : fieldErrors.finalPerformanceRating
                                ? { borderColor: "#EF4444" }
                                : undefined
                            }
                          >
                            {/* Left: Icon + Labels */}
                            <div className="flex items-center gap-2 min-w-0 shrink-0">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors duration-300"
                                style={
                                  finalRatingTier
                                    ? {
                                        backgroundColor: finalRatingTier.badgeBgHex,
                                        color: finalRatingTier.badgeTextHex,
                                        border: `1px solid ${finalRatingTier.badgeBorderHex}60`,
                                      }
                                    : { backgroundColor: "rgba(219, 234, 254, 0.8)", color: "#2563EB" }
                                }
                              >
                                <Award className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {finalRatingTier && (
                                    <span
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase transition-all duration-300"
                                      style={{
                                        backgroundColor: finalRatingTier.badgeBgHex,
                                        color: finalRatingTier.badgeTextHex,
                                        border: `1.5px solid ${finalRatingTier.badgeBorderHex}`,
                                      }}
                                    >
                                      {finalRatingTier.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs sm:text-[13px] font-bold text-[#2B3674]">
                                  Final Rating <span className="text-red-500">*</span>
                                </span>
                              </div>
                            </div>

                            {/* Center: Input Box */}
                            <div className="flex flex-1 items-center justify-center min-w-0">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="—"
                                  disabled={isViewMode}
                                  readOnly={isViewMode}
                                  value={rawFinalPerformanceRating}
                                  onChange={(e) => handleFinalRatingChange(e.target.value)}
                                  onBlur={handleFinalRatingBlur}
                                  onFocus={isViewMode ? undefined : (e) => e.target.select()}
                                  className={`eval-star-score-input eval-final-score-input text-center font-bold ${
                                    isViewMode ? "eval-score-input-disabled" : ""
                                  } ${fieldErrors.finalPerformanceRating ? "!border-red-500" : ""}`}
                                  style={
                                    finalRatingTier && finalPerformanceRating > 0
                                      ? {
                                          borderColor: finalRatingTier.badgeBorderHex,
                                          color: finalRatingTier.badgeTextHex,
                                          backgroundColor: finalRatingTier.badgeBgHex + "33",
                                        }
                                      : { color: "#94A3B8", backgroundColor: "#F8FAFC" }
                                  }
                                  title={
                                    isViewMode
                                      ? "Evaluation is in view-only mode"
                                      : "Type final rating score (1.0 to 5.0)"
                                  }
                                  aria-label="Enter Final Performance Rating"
                                />
                                {fieldErrors.finalPerformanceRating ? (
                                  <span className="text-[11px] font-semibold text-red-600">{fieldErrors.finalPerformanceRating}</span>
                                ) : finalPerformanceRating > 0 ? (
                                  <span className="text-[9px] font-bold text-[#64748B]">{getRatingLabel(finalPerformanceRating)}</span>
                                ) : (
                                  <span className="text-[9px] font-semibold text-[#94A3B8]">Enter 1.0 – 5.0</span>
                                )}
                              </div>
                            </div>

                            {/* Right: Circular Gauge */}
                            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                              <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  stroke="#E2E8F0"
                                  strokeWidth="6"
                                  fill="transparent"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  stroke={finalGaugeColor}
                                  strokeWidth="6"
                                  strokeDasharray="201.06"
                                  strokeDashoffset={finalGaugeOffset}
                                  strokeLinecap="round"
                                  fill="transparent"
                                  className="transition-all duration-700 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                <span
                                  className="text-base font-bold leading-none transition-colors duration-300"
                                  style={finalRatingTier ? { color: finalRatingTier.badgeTextHex } : { color: "#2B3674" }}
                                >
                                  {finalPerformanceRating > 0 ? finalPerformanceRating.toFixed(1) : "—"}
                                </span>
                                <span className="text-[9px] font-bold text-[#94A3B8] mt-0.5">/ 5.0</span>
                              </div>
                            </div>
                          </div>

                          {/* Error message */}
                          {fieldErrors.finalPerformanceRating && (
                            <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-red-600">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                              <span>{fieldErrors.finalPerformanceRating}</span>
                            </div>
                          )}
                        </div>

                        {/* Final Manager Comments */}
                        <div id="eval-field-container-final-comments">
                          <label className="block text-xs font-bold text-[#2B3674] mb-1.5">
                            Final Manager Comments <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="eval-field-final-comments"
                            rows={3}
                            readOnly={isViewMode}
                            disabled={isViewMode}
                            value={finalManagerComments}
                            onChange={(e) => { setFinalManagerComments(e.target.value); clearFieldError("finalManagerComments"); }}
                            placeholder="Provide a comprehensive final summary and closing remarks..."
                            className={`eval-textarea-field ${fieldErrors.finalManagerComments ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""} ${isViewMode ? "eval-textarea-readonly !cursor-not-allowed" : ""}`}
                          />
                          {fieldErrors.finalManagerComments && (
                            <div className="eval-field-error-msg flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-red-600">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                              <span>{fieldErrors.finalManagerComments}</span>
                            </div>
                          )}
                        </div>

                        {/* Manager Confirmation Checkbox */}
                        {!isViewMode && (
                          <div className={`p-3.5 rounded-xl border transition-all ${managerConfirmation ? "border-green-300 bg-green-50/60" : fieldErrors.managerConfirmation ? "border-red-400 bg-red-50/40" : "border-blue-200 bg-blue-50/30"}`}>
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={managerConfirmation}
                                onChange={(e) => { setManagerConfirmation(e.target.checked); clearFieldError("managerConfirmation"); }}
                                className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0"
                              />
                              <span className="text-xs font-semibold text-[#2B3674] leading-relaxed">
                                I confirm that the information provided in this appraisal review is accurate and complete to the best of my knowledge. I understand that this evaluation will be finalized and shared with the employee.
                              </span>
                            </label>
                            {fieldErrors.managerConfirmation && (
                              <div className="eval-field-error-msg flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-600">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                <span>{fieldErrors.managerConfirmation}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                  </div>
                )}

                {/* Bottom Actions */}
                {isViewMode ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-blue-100 mt-3 eval-reveal-card">
                    <button
                      type="button"
                      onClick={handleNavigateToReview}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-blue-200/80 bg-white hover:bg-blue-50/80 text-blue-900 font-bold text-sm transition-all duration-200 shadow-xs hover:border-blue-400 cursor-pointer min-h-[48px]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Employee Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        scrollToTop();
                        onBack();
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-bold text-sm transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-[0.99] cursor-pointer min-h-[48px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Back to List</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-blue-100 mt-3 eval-reveal-card">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleNavigateToReview}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-blue-200/80 bg-white hover:bg-blue-50/80 text-blue-900 font-bold text-sm transition-all duration-200 shadow-xs hover:border-blue-400 hover:shadow-sm active:scale-[0.98] cursor-pointer min-h-[48px]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Review</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isDraftSaving || isSubmitting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm transition-all duration-200 shadow-xs hover:border-amber-400 active:scale-[0.98] cursor-pointer min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isDraftSaving ? (
                          <span className="w-4 h-4 border-2 border-amber-600/40 border-t-amber-700 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                          </svg>
                        )}
                        <span>{isDraftSaving ? "Saving..." : "Save as Draft"}</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || submitButtonState !== "idle" || !managerConfirmation}
                      title={!managerConfirmation ? "Please check the confirmation declaration to submit" : undefined}
                      className={`eval-submit-assign-btn ${!managerConfirmation ? "opacity-60 cursor-not-allowed" : ""} ${submitButtonState === "animating"
                        ? "assign-btn-animating"
                        : submitButtonState === "assigned"
                          ? "assign-btn-assigned"
                          : ""
                        }`}
                    >
                      <span className="assign-btn-icon-wrapper">
                        {submitButtonState === "assigned" ? (
                          <Check className="w-4 h-4 text-white stroke-[3] assign-icon-check" />
                        ) : (
                          <Send
                            className={`w-4 h-4 fill-white -rotate-12 ${submitButtonState === "animating" ? "assign-icon-launching" : ""
                              }`}
                          />
                        )}
                      </span>
                      <span className="assign-btn-text">
                        {submitButtonState === "assigned"
                          ? "Review Submitted"
                          : submitButtonState === "animating"
                            ? "Submitting..."
                            : "Submit Review"}
                      </span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 eval-themed-modal-overlay animate-in fade-in duration-200"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="eval-themed-modal-card max-w-sm w-full p-6 sm:p-7 text-[#2B3674] relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3 mb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#2B3674]">Submit Final Review?</h3>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                Once submitted, the appraisal will be <span className="font-bold text-[#2B3674]">finalized and shared with the employee</span>. This action cannot be undone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 mb-5">
              <p className="text-xs font-semibold text-amber-800 text-center">
                ⚠️ Please make sure all information is accurate before submitting.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl border border-[#E2E8F0] text-[#2B3674] text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmedSubmit}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Yes, Submit Review</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Themed Authentication / OTP Verification Modal */}
      {isEmailModalOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 eval-themed-modal-overlay animate-in fade-in duration-300"
          onClick={() => {
            if (!isGlowPhase && !isMorphingPhase) {
              setIsEmailModalOpen(false);
              setModalStage("email");
              setEmailError("");
            }
          }}
        >
          <div
            className="eval-themed-modal-card max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-[#2B3674] relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Energy Glow */}
            <div className={`eval-modal-ambient-glow ${isGlowPhase ? "glowing" : ""}`} />

            {/* Subtle Close Button */}
            {!isGlowPhase && !isMorphingPhase && modalStage !== "success" && (
              <button
                type="button"
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setModalStage("email");
                  setEmailError("");
                }}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-20"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {modalStage === "email" && (
              <div className="relative z-10 space-y-5 animate-in fade-in duration-200">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[#2B3674]">
                    Authenticate Rating Access
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Enter your login password. The evaluation is returned only after both rows are completed.
                  </p>
                </div>

                <form onSubmit={(event) => void handlePasswordUnlock(event)} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#2B3674] mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRatingPassword ? "text" : "password"}
                        required
                        value={ratingPassword}
                        onChange={(e) => {
                          setRatingPassword(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full px-4 py-3 pl-10 pr-10 rounded-2xl bg-white border border-[#E2E8F0] text-sm text-[#2B3674] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        autoFocus
                      />
                      <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowRatingPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2563EB]"
                        aria-label={showRatingPassword ? "Hide password" : "Show password"}
                      >
                        {showRatingPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {emailError && (
                      <p className="text-xs font-medium text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(false)}
                      className="flex-1 py-3 rounded-2xl border border-[#E2E8F0] text-[#2B3674] text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={unlockingRating}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                    >
                      <span>{unlockingRating ? "Checking" : "Continue"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STAGE 2: 6-Digit OTP Verification Screen */}
            {modalStage === "otp" && (
              <div className={`relative z-10 space-y-6 ${isMorphingPhase ? "eval-otp-fade-out" : ""}`}>
                {/* 1. Centered Header & Supporting Text */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B3674]">
                    Let's verify your number
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Enter the 6-digit verification code sent to{" "}
                    <span className="text-[#2B3674] font-semibold">{emailInput || "your email"}</span>
                  </p>
                </div>

                {/* 2 & 3. Six OTP Input Boxes */}
                <div className="py-2">
                  <div className={`eval-otp-boxes-wrap flex items-center justify-center gap-1.5 sm:gap-2.5 ${isGlowPhase ? "energy-glow" : ""}`}>
                    {isGlowPhase && <div className="eval-energy-beam" />}
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const digit = otp[idx] || "";
                      const hasNumber = Boolean(digit);
                      const isIlluminated = illuminatedIndex === idx;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveOtpIndex(idx);
                            otpInputRefs.current[idx]?.focus();
                          }}
                          className={`eval-theme-otp-box cursor-text ${hasNumber ? "has-number" : ""
                            } ${isIlluminated ? "illuminated" : ""}`}
                        >
                          <input
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpInput(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onFocus={() => setActiveOtpIndex(idx)}
                            className="eval-otp-digit-input select-none"
                            aria-label={`Digit ${idx + 1}`}
                            autoFocus={idx === 0}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resend Code Option */}
                <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-[#F1F5F9]">
                  <span className="text-[#64748B]">Didn't get the code?</span>
                  {resendTimer > 0 ? (
                    <span className="text-[#64748B]">
                      Resend in <span className="text-blue-600 font-semibold">{resendTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 3: Success State with Rounded Square Container & Drawn Checkmark */}
            {modalStage === "success" && (
              <div className="eval-success-fade-in relative z-10 py-5 flex flex-col items-center justify-center text-center space-y-6">
                {/* Centered text: "Verified successfully" */}
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B3674]">
                    Verified successfully
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-xs mx-auto">
                    Score Evaluation Parameters &amp; Ratings unlocked
                  </p>
                </div>

                {/* Below the text, rounded-square success icon/container with checkmark */}
                <div className="eval-success-square-wrap my-2">
                  <div className="eval-success-glow-ring" />
                  <div className="eval-success-square">
                    <svg className="eval-success-checkmark-svg" viewBox="0 0 24 24">
                      <path
                        className="eval-success-checkmark-path"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Unlocked Confirmation Button */}
                <div className="w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    View Unlocked Rating
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default EvaluationPanel;
