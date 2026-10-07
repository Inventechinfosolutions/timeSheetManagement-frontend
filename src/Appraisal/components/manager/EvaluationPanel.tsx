import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Star,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Award,
  Compass,
  Sliders,
  Mail,
  Lock,
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
import { sampleCompletedReviewFormData } from "../../mockData/quarterlyReview.mock";
import { message } from "antd";
import "./EvaluationPanel.css";

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
  hideScoreParameters?: boolean;
  onBack: () => void;
  onSubmitEvaluation?: (recordId: string, evaluation: EvaluationData) => void;
  submissionData?: ReviewFormData;
}

interface ParameterDef {
  key: string;
  label: string;
  iconName?: string;
}

const EVALUATION_PARAMETERS: ParameterDef[] = [
  { key: "productivity", label: "Productivity" },
  { key: "qualityOfWork", label: "Quality of Work" },
  { key: "ownership", label: "Ownership & Responsibility" },
  { key: "communication", label: "Communication" },
  { key: "teamCollaboration", label: "Team Collaboration" },
  { key: "innovation", label: "Innovation & Problem Solving" },
];

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
  hideScoreParameters = false,
  onBack,
  onSubmitEvaluation,
  submissionData,
}) => {
  const isViewMode = mode === "view";
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

  // Modal flow state: 'email' | 'otp' | 'success'
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [modalStage, setModalStage] = useState<"email" | "otp" | "success">("email");
  const [emailInput, setEmailInput] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);
  const [illuminatedIndex, setIlluminatedIndex] = useState<number | null>(null);
  const [isGlowPhase, setIsGlowPhase] = useState<boolean>(false);
  const [isMorphingPhase, setIsMorphingPhase] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(45);
  const [isRatingUnlocked, setIsRatingUnlocked] = useState<boolean>(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Evaluation Scores: Start unrated (0) or initialized with record.finalRating if available
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const parsedRating = parseFloat(record.finalRating);
    const defaultScore =
      !isNaN(parsedRating) && parsedRating > 0
        ? Math.min(5, Math.max(1, Math.round(parsedRating)))
        : isViewMode
          ? 4
          : 0;
    EVALUATION_PARAMETERS.forEach((p) => {
      initial[p.key] = defaultScore;
    });
    return initial;
  });

  // Track raw text input value
  const [rawInputValues, setRawInputValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const parsedRating = parseFloat(record.finalRating);
    const defaultScore =
      !isNaN(parsedRating) && parsedRating > 0
        ? Math.min(5, Math.max(1, Math.round(parsedRating)))
        : isViewMode
          ? 4
          : 0;
    EVALUATION_PARAMETERS.forEach((p) => {
      initial[p.key] = defaultScore > 0 ? String(defaultScore) : "";
    });
    return initial;
  });

  // Track currently hovered star for instant feedback
  const [hoveredStar, setHoveredStar] = useState<{
    key: string;
    value: number;
  } | null>(null);

  // Form comments
  const [strengths, setStrengths] = useState<string>(() => {
    return isViewMode || record.status === "COMPLETED"
      ? "Demonstrates great ownership, high quality deliverables, and strong technical problem-solving capabilities."
      : "";
  });
  const [improvements, setImprovements] = useState<string>(() => {
    return isViewMode || record.status === "COMPLETED"
      ? "Continue mentoring junior engineers and leading system architecture discussions."
      : "";
  });
  const [remarks, setRemarks] = useState<string>(() => {
    return isViewMode || record.status === "COMPLETED"
      ? "Consistently exceeds delivery expectations. Recommended for senior engineering track."
      : "";
  });

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
    return submissionData || sampleCompletedReviewFormData;
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
          className={`eval-star-icon eval-star-icon-filled ${
            isHovering ? "scale-105" : ""
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
        className={`eval-star-icon eval-star-icon-empty ${
          isHovering ? "eval-star-icon-hovered" : ""
        }`}
      />
    );
  };

  // Average score & suggested rating calculation
  const { averageScore, suggestedRating, ratingTierClass } = useMemo(() => {
    const values = Object.values(scores);
    const validScores = values.filter((v) => typeof v === "number" && v > 0);

    if (validScores.length === 0) {
      return {
        averageScore: null,
        suggestedRating: "Pending Manager Rating",
        ratingTierClass: "eval-tier-badge-3",
      };
    }

    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    const avg = Number((sum / values.length).toFixed(2));

    let tier = "Meets Expectations";
    let tierClass = "eval-tier-badge-3";

    if (avg >= 4.5) {
      tier = "Exceptional Performer";
      tierClass = "eval-tier-badge-5";
    } else if (avg >= 3.5) {
      tier = "Exceeds Expectations";
      tierClass = "eval-tier-badge-4";
    } else if (avg >= 2.5) {
      tier = "Meets Expectations";
      tierClass = "eval-tier-badge-3";
    } else if (avg >= 1.5) {
      tier = "Needs Improvement";
      tierClass = "eval-tier-badge-2";
    } else {
      tier = "Unsatisfactory";
      tierClass = "eval-tier-badge-1";
    }

    return {
      averageScore: avg,
      suggestedRating: tier,
      ratingTierClass: tierClass,
    };
  }, [scores]);

  const scoredCount = useMemo(() => {
    return Object.values(scores).filter((v) => typeof v === "number" && v > 0).length;
  }, [scores]);

  const gaugeRadius = 32;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // ~201.06
  const gaugePercent =
    averageScore !== null ? Math.min(Math.max(averageScore / 5, 0), 1) : 0;
  const gaugeOffset = gaugeCircumference - gaugeCircumference * gaugePercent;

  const gaugeColor = useMemo(() => {
    if (averageScore === null) return "#CBD5E1";
    if (averageScore >= 4.5) return "#A36361";
    if (averageScore >= 3.5) return "#D3A29D";
    if (averageScore >= 2.5) return "#EECC8C";
    return "#E8B298";
  }, [averageScore]);

  const handleAddStrength = (tag: string) => {
    setStrengths((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
    clearFieldError("strengths");
  };

  const handleAddImprovement = (tag: string) => {
    setImprovements((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
    clearFieldError("improvements");
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    let firstErrorElement: HTMLElement | null = null;

    // 1. Check all evaluation parameters
    const unratedParams = EVALUATION_PARAMETERS.filter(
      (p) => !scores[p.key] || scores[p.key] === 0
    );
    if (unratedParams.length > 0) {
      unratedParams.forEach((p) => {
        newErrors[p.key] = `Please rate ${p.label}`;
      });
      firstErrorElement = document.getElementById(`eval-param-${unratedParams[0].key}`);
    }

    // 2. Check Performance Strengths
    if (!strengths.trim()) {
      newErrors.strengths = "Please fill out the Performance Strengths.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-strengths");
      }
    }

    // 3. Check Areas of Improvement
    if (!improvements.trim()) {
      newErrors.improvements = "Please fill out the Areas of Improvement.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-improvements");
      }
    }

    // 4. Check Additional Remarks
    if (!remarks.trim()) {
      newErrors.remarks = "Please fill out the Additional Remarks.";
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById("eval-field-remarks");
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

    if (submitButtonState !== "idle") return;

    // Step 1: Animate the Send rocket launch
    setSubmitButtonState("animating");
    setIsSubmitting(true);

    const evaluationResult: EvaluationData = {
      scores,
      averageScore: averageScore || 0,
      suggestedRating,
      strengths,
      improvements,
      remarks,
    };

    // Step 2: Morph to emerald green & checkmark pop
    setTimeout(() => {
      setSubmitButtonState("assigned");
    }, 280);

    // Step 3: Trigger submission callback, scroll to top, and success state
    setTimeout(() => {
      scrollToTop();
      onSubmitEvaluation?.(record.id, evaluationResult);
      setIsSubmitting(false);
      setIsSuccess(true);

      // Step 4: Gracefully transition back to team list
      setTimeout(() => {
        scrollToTop();
        onBack();
        setSubmitButtonState("idle");
      }, 1200);
    }, 850);
  };

  // Team ratings calculations
  const teamRatings = formData.teamRatings || {};
  const ratedTeamKeys = Object.keys(teamRatings).filter(
    (k) => (teamRatings[k as keyof typeof teamRatings] || 0) > 0
  );
  const ratedDimensionsCount = ratedTeamKeys.length > 0 ? ratedTeamKeys.length : 6;

  // Environment rating info
  const envRating = formData.companyEnvironmentRating || 5;
  const envInfo = ENVIRONMENT_RATINGS[envRating] || ENVIRONMENT_RATINGS[5];

  // Employee initials for avatar
  const empInitials = (record.name || "Rahul Verma")
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A36361] to-[#D3A29D] flex items-center justify-center text-white shadow-md shadow-[#A36361]/20 shrink-0 eval-trophy-box">
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
              <p className="text-xs sm:text-sm font-medium text-[#64748B] mt-1 flex items-center gap-1.5 eval-subtitle-anim">
                <span>{isViewMode ? "Reviewing" : "Evaluating"}</span>
                <span className="font-bold text-[#0F172A]">{record.name}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A36361]/40" />
                <span>
                  {record.quarter} {record.financialYear}
                </span>
                {isViewMode && (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A36361]/40" />
                    <span className="text-[#A36361] font-bold">View Mode</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>



        {isSuccess && (
          <div className="bg-[#FAF2EE] border border-[#D3A29D]/40 text-[#3B2221] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-[#A36361] shrink-0" />
            <span>Evaluation submitted successfully! Returning to list...</span>
          </div>
        )}
      </div>

      {/* Top Metadata Banner Card with Tech SVG Artwork & Animated Avatar Ring */}
      <div className="eval-meta-banner eval-reveal-card mb-4">
        {/* Subtle Tech Circuit SVG Pattern in Background Corner */}
        <svg
          className="absolute right-0 top-0 bottom-0 h-full w-48 opacity-[0.06] pointer-events-none text-[#A36361]"
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
                className="absolute -inset-1.5 w-15 h-15 animate-spin-slow pointer-events-none opacity-40 text-[#A36361]"
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A36361] to-[#D3A29D] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-[#A36361]/25 ring-4 ring-[#A36361]/10">
                {empInitials}
              </div>
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-0.5">
                EMPLOYEE NAME
              </span>
              <span className="text-sm font-extrabold text-[#0F172A] truncate block">
                {record.name || "Rahul Verma"}
              </span>
              <span className="text-[11px] font-bold text-[#A36361] block mt-0.5">
                Verified Employee
              </span>
            </div>
          </div>

          {/* 2. Employee ID */}
          <div className="eval-meta-segment eval-meta-segment-2 sm:pl-4 eval-stagger-item eval-stagger-2">
            <div>
              <span className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-0.5">
                EMPLOYEE ID
              </span>
              <span className="text-sm font-extrabold text-[#0F172A] block">
                {record.id || "EE-I-071"}
              </span>
              <span className="text-[11px] font-medium text-[#64748B] block mt-0.5">
                Permanent Staff
              </span>
            </div>
          </div>

          {/* 3. Designation & Department */}
          <div className="eval-meta-segment eval-meta-segment-3 sm:pl-4 eval-stagger-item eval-stagger-3">
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-0.5">
                DESIGNATION &amp; DEPT
              </span>
              <span className="text-sm font-extrabold text-[#0F172A] block truncate">
                {record.role || "Frontend Developer"}
              </span>
              <span className="text-[11px] font-semibold text-[#64748B] block mt-0.5 truncate">
                Engineering &amp; Technology
              </span>
            </div>
          </div>

          {/* 4. Submitted Date */}
          <div className="eval-meta-segment eval-meta-segment-4 sm:pl-4 eval-stagger-item eval-stagger-4">
            <div>
              <span className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-0.5">
                SUBMITTED DATE
              </span>
              <span className="text-sm font-extrabold text-[#0F172A] block">
                {record.assignedOn || "07/09/2026"}
              </span>
              <span className="text-[11px] font-semibold text-[#A36361] block mt-0.5">
                On-Time Submission
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
            {/* Header Card */}
            <div className="eval-glass-card eval-reveal-card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A36361] to-[#8D4E4D] flex items-center justify-center text-white shrink-0 shadow-sm eval-stagger-item eval-stagger-1">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0F172A] eval-stagger-item eval-stagger-2">
                    Employee Performance Review
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5 eval-stagger-item eval-stagger-3">
                    Detailed review of quarterly outputs submitted by employee.
                  </p>
                </div>
              </div>
            </div>

          {/* STEP 1: ROLE & QUARTER OVERVIEW */}
          <div className="eval-step-card eval-reveal-card space-y-3">
            <div className="flex items-center justify-between border-b border-[#D3A29D]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#A36361] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                  1
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                  Step 1: Role &amp; Quarter Overview
                </h3>
              </div>
            </div>

            <div className="eval-stagger-item eval-stagger-3">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1.5 uppercase tracking-wider">
                Overview
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.overview ||
                  "Frontend Developer focused on building and optimizing web applications. Delivered responsive UI components, collaborated with backend and design teams, and completed major modules ahead of schedule with zero critical bugs."}
              </div>
            </div>
          </div>

          {/* STEP 2: KEY ACHIEVEMENTS & PROJECTS */}
          <div className="eval-step-card eval-reveal-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#D3A29D]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#A36361] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                  2
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                  Step 2: Key Achievements &amp; Projects
                </h3>
              </div>
            </div>

            {/* Project Title */}
            <div className="eval-stagger-item eval-stagger-3">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Project Title
              </label>
              <div
                className="eval-readonly-field p-3 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm font-extrabold text-[#0F172A]"
                title="Employee submitted response (Read-only)"
              >
                {formData.projectTitle || "Worksphere Timesheet & Appraisal Platform"}
              </div>
            </div>

            {/* Project Description */}
            <div className="eval-stagger-item eval-stagger-4">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Project Description
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.projectDescription ||
                  "Spearheaded the component library unification, streamlined workflow interfaces, and achieved 99% on-time delivery across quarterly deliverables."}
              </div>
            </div>

            {/* Challenge */}
            <div className="eval-stagger-item eval-stagger-4">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Challenge
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.projectChallenge ||
                  "Adapted to rapid requirements changes and resolved complex state synchronization challenges without delaying deployment milestones."}
              </div>
            </div>
          </div>

          {/* STEP 3: TEAMWORK & COLLABORATION with Interactive Score Bars */}
          <div className="eval-step-card eval-reveal-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#D3A29D]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#A36361] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                  3
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                  Step 3: Teamwork &amp; Collaboration
                </h3>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-2 uppercase tracking-wider eval-stagger-item eval-stagger-3">
                Evaluated Teamwork Dimensions ({ratedDimensionsCount}/6)
              </label>

              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 eval-stagger-item eval-stagger-4">
                {TEAM_CRITERIA.map((criterion) => {
                  const score =
                    teamRatings[criterion.key as keyof typeof teamRatings] || 4;
                  return (
                    <div
                      key={criterion.key}
                      className="eval-teamwork-item eval-readonly-field flex items-center justify-between"
                      title="Employee submitted rating (Read-only)"
                    >
                      <span className="text-xs font-bold text-[#0F172A] leading-snug">
                        {criterion.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= score
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]"
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
            <div className="flex items-center justify-between border-b border-[#D3A29D]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#A36361] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                  4
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                  Step 4: Continuous Learning &amp; Goals
                </h3>
              </div>
            </div>

            <div className="eval-stagger-item eval-stagger-3">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1.5 uppercase tracking-wider">
                Learning Goals
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.learningGoals ||
                  formData.nextQuarterLearningGoals ||
                  "Explore Next.js server components and GraphQL integration."}
              </div>
            </div>
          </div>

          {/* STEP 5: COMPANY ENVIRONMENT */}
          <div className="eval-step-card eval-reveal-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#D3A29D]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#A36361] text-white flex items-center justify-center text-xs font-bold shadow-xs eval-stagger-item eval-stagger-1">
                  5
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                  Step 5: Company Environment
                </h3>
              </div>
              <span className="text-xs font-bold text-[#A36361] px-3 py-1 rounded-full bg-[#A36361]/10 flex items-center gap-1.5 border border-[#A36361]/20 shadow-xs eval-stagger-item eval-stagger-2">
                <span className="text-sm">{envInfo.emoji}</span>
                <span>
                  {envInfo.label} ({envRating}/5)
                </span>
              </span>
            </div>

            {/* Feedback on Work Culture */}
            <div className="eval-stagger-item eval-stagger-3">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Feedback on Work Culture
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.workCultureFeedback ||
                  "The collaborative workspace is highly productive. The developer tools provided are excellent and help speed up development cycles."}
              </div>
            </div>

            {/* Work Life Balance */}
            <div className="eval-stagger-item eval-stagger-4">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Work Life Balance
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.workLifeBalance ||
                  "I feel highly aligned with the company's vision of delivering fast, reliable employee portals."}
              </div>
            </div>

            {/* Suggestions for Improvement */}
            <div className="eval-stagger-item eval-stagger-4">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Suggestions for Improvement
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#D3A29D]/50 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.suggestionsForImprovement ||
                  "I feel highly aligned with the company's vision of delivering fast, reliable employee portals."}
              </div>
            </div>
          </div>

          {/* End of Review Action: Button to navigate to Manager Review & Evaluation Matrix */}
          <div className="eval-matrix-cta-card eval-reveal-card relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[#D3A29D]/50 bg-gradient-to-br from-white via-[#FAF2EE] to-[#E8B298]/20 shadow-lg shadow-[#A36361]/10 mt-6">
            {/* Ambient Decorative SVG in Background */}
              <svg
                className="absolute -right-8 -bottom-10 w-72 h-72 text-[#A36361]/10 pointer-events-none eval-cta-bg-svg"
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
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#A36361] to-[#8D4E4D] flex items-center justify-center text-white shadow-md shadow-[#A36361]/25 eval-matrix-btn-icon-glow">
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
                        <circle cx="8" cy="6" r="2.5" fill="#D3A29D" stroke="#A36361" strokeWidth="1.5" />
                        <circle cx="16" cy="12" r="2.5" fill="#D3A29D" stroke="#A36361" strokeWidth="1.5" />
                        <circle cx="11" cy="18" r="2.5" fill="#D3A29D" stroke="#A36361" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <span className="absolute -inset-1 rounded-2xl border border-[#A36361]/40 animate-ping opacity-25 pointer-events-none" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#A36361] font-bold">
                        {record.quarter} Evaluation Ready
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mt-1">
                      {isViewMode ? "View Evaluation & Ratings" : "Evaluate Employee Performance"}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5 max-w-xl leading-relaxed">
                      {isViewMode
                        ? "Navigate to the scored evaluation matrix to inspect finalized competencies, ratings, and feedback."
                        : "Completed review of all quarterly submissions. Proceed to the Evaluation Matrix to score parameters (1-5 scale) and finalize the appraisal."}
                    </p>
                  </div>
                </div>

                {/* Action Button that navigates to the Evaluation Matrix */}
                <button
                  type="button"
                  onClick={handleNavigateToMatrix}
                  className="eval-open-matrix-btn shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#A36361] via-[#8D4E4D] to-[#7A3F3D] hover:from-[#8D4E4D] hover:to-[#633231] text-white font-bold text-sm shadow-lg shadow-[#A36361]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#A36361]/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
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
          </div>
        )}

        {/* ===================================================================
            SECTION 2: Manager Review & Evaluation Matrix (Full Width)
           =================================================================== */}
        {activeView === "matrix" && (
          <div className="w-full space-y-6">
          <div className="eval-glass-card eval-reveal-card p-6 sm:p-7 w-full">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A36361] to-[#D3A29D] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#A36361]/20 eval-stagger-item eval-stagger-1">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A] eval-stagger-item eval-stagger-2">
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
              {hideScoreParameters && !isRatingUnlocked ? (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2.5 eval-stagger-item eval-stagger-2">
                      <label className="block text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
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
                          <div className="w-8 h-8 rounded-xl bg-[#A36361]/10 text-[#A36361] flex items-center justify-center font-bold">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#0F172A] block">
                              Score Evaluation Parameters (1-5 Scale)
                            </span>
                            <span className="text-[11px] text-[#64748B]">
                              Evaluation ratings are confidential
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FAF2EE] text-[#A36361] border border-[#D3A29D]/50 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF2EE] to-[#FFF9EE] border border-[#D3A29D]/50 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-200 group-hover:border-[#A36361]/40 group-hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white text-[#A36361] flex items-center justify-center shadow-xs shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#0F172A]">
                              Request Rating Access
                            </h4>
                            <p className="text-[11px] text-[#64748B] mt-0.5">
                              Click to enter email and view evaluation rating
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEmailModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#A36361] hover:bg-[#8D4E4D] text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
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
                      <label className="block text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                        Score Evaluation Parameters (1-5 Scale)
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 border border-[#E2E8F0] rounded-2xl p-3 sm:p-4 bg-[#FAF5F2]/80 shadow-inner">
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
                              className={`eval-param-row bg-white/90 border ${
                                fieldErrors[param.key]
                                  ? "!border-red-500 !ring-2 !ring-red-100 !bg-red-50/25"
                                  : "border-[#E2E8F0]/70"
                              } rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs transition-all`}
                            >
                              <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] pr-2">
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
                                      className={`eval-star-btn ${
                                        isViewMode ? "eval-disabled-cursor" : ""
                                      }`}
                                      title={
                                        isViewMode
                                          ? "Evaluation is in view-only mode"
                                          : `Rate ${starNum} star${
                                              starNum > 1 ? "s" : ""
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
                                  className={`eval-star-score-input ${
                                    isViewMode ? "eval-score-input-disabled" : ""
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
                  <div className="eval-kpi-card eval-reveal-card flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#A36361]/10 text-[#A36361] flex items-center justify-center font-bold shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block">
                            Live Performance Index
                          </span>
                          <span className="text-xs font-bold text-[#0F172A]">
                            Weighted Average Score
                          </span>
                        </div>
                      </div>
                      <div className="pt-0.5">
                        <span
                          className={`inline-block text-xs font-bold px-3 py-1 rounded-full shadow-xs ${ratingTierClass}`}
                        >
                          {suggestedRating}
                        </span>
                      </div>
                    </div>

                    {/* Animated Radial SVG Score Gauge */}
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
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
                        <span className="text-base font-extrabold text-[#0F172A] leading-none">
                          {averageScore !== null ? averageScore.toFixed(1) : "—"}
                        </span>
                        <span className="text-[9px] font-bold text-[#64748B] mt-0.5">/ 5.0</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Feedback Textareas with Smart Suggestion Chips */}
              <div className="space-y-4">
                <div className="eval-reveal-card" id="eval-field-container-strengths">
                  <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 flex items-center justify-between eval-stagger-item eval-stagger-1">
                    <span>
                      Performance Strengths <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
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
                    className={`eval-textarea-field eval-stagger-item eval-stagger-2 ${
                      fieldErrors.strengths ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""
                    } ${
                      isViewMode ? "eval-textarea-readonly" : ""
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
                  <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 flex items-center justify-between eval-stagger-item eval-stagger-1">
                    <span>
                      Areas of Improvement <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
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
                    className={`eval-textarea-field eval-stagger-item eval-stagger-2 ${
                      fieldErrors.improvements ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""
                    } ${
                      isViewMode ? "eval-textarea-readonly" : ""
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
                  <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 flex items-center justify-between eval-stagger-item eval-stagger-1">
                    <span>
                      Additional Remarks <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
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
                    placeholder="General comments or HR guidelines..."
                    className={`eval-textarea-field eval-stagger-item eval-stagger-2 ${
                      fieldErrors.remarks ? "eval-input-error !border-red-500 !ring-2 !ring-red-100" : ""
                    } ${
                      isViewMode ? "eval-textarea-readonly" : ""
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
              </div>

              {/* Bottom Actions: View Mode gives 'Back to Employee Review' and 'Back to Team List'. Edit Mode gives 'Back to Review' and 'Submit Evaluation' */}
              {isViewMode ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#D3A29D]/40 mt-3 eval-reveal-card">
                  <button
                    type="button"
                    onClick={handleNavigateToReview}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#D3A29D]/60 bg-white hover:bg-[#FAF2EE]/80 text-[#3B2221] font-bold text-sm transition-all duration-200 shadow-xs hover:border-[#A36361] cursor-pointer min-h-[48px]"
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
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-[#020617] text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer min-h-[48px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Back to Team List</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#D3A29D]/40 mt-3 eval-reveal-card">
                  <button
                    type="button"
                    onClick={handleNavigateToReview}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#D3A29D]/60 bg-white hover:bg-[#FAF2EE]/80 text-[#3B2221] font-bold text-sm transition-all duration-200 shadow-xs hover:border-[#A36361] hover:shadow-sm active:scale-[0.98] cursor-pointer min-h-[48px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Review</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || submitButtonState !== "idle"}
                    className={`eval-submit-assign-btn ${
                      submitButtonState === "animating"
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
                          className={`w-4 h-4 fill-white -rotate-12 ${
                            submitButtonState === "animating" ? "assign-icon-launching" : ""
                          }`}
                        />
                      )}
                    </span>
                    <span className="assign-btn-text">
                      {submitButtonState === "assigned"
                        ? "Evaluation Submitted"
                        : submitButtonState === "animating"
                        ? "Submitting..."
                        : "Submit Evaluation"}
                    </span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
        )}
      </div>

      {/* Themed Authentication / OTP Verification Modal */}
      {isEmailModalOpen && (
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
            className="eval-themed-modal-card max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-[#0F172A] relative shadow-2xl"
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

            {/* STAGE 1: Email Input */}
            {modalStage === "email" && (
              <div className="relative z-10 space-y-5 animate-in fade-in duration-200">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#A36361] to-[#D3A29D] flex items-center justify-center text-white shadow-lg shadow-[#A36361]/25 mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                    Authenticate Rating Access
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Enter your corporate email address to receive the verification code.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Corporate Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        placeholder="kusumahk92@gmail.com"
                        className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#FFFDFB] border border-[#E2E8F0] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#A36361] focus:ring-2 focus:ring-[#A36361]/15 transition-all"
                        autoFocus
                      />
                      <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                      className="flex-1 py-3 rounded-2xl border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#A36361] to-[#8D4E4D] hover:from-[#8D4E4D] hover:to-[#7A3F3D] text-white text-xs font-bold shadow-lg shadow-[#A36361]/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <span>Continue</span>
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
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                    Let's verify your number
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Enter the 6-digit verification code sent to{" "}
                    <span className="text-[#0F172A] font-semibold">{emailInput || "your email"}</span>
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
                          className={`eval-theme-otp-box cursor-text ${
                            hasNumber ? "has-number" : ""
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
                      Resend in <span className="text-[#A36361] font-semibold">{resendTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-[#A36361] hover:text-[#8D4E4D] font-bold flex items-center gap-1 hover:underline"
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
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
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
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#A36361] to-[#8D4E4D] hover:from-[#8D4E4D] hover:to-[#7A3F3D] text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    View Unlocked Rating
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default EvaluationPanel;
