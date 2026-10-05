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
} from "lucide-react";
import {
  ManagerQuarterlyReviewRecord,
  ReviewFormData,
} from "../../types/appraisal.types";
import { initialReviewFormData } from "../../mockData/quarterlyReview.mock";
import Toast from "../../../components/Toast";
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
  { key: "crossCollaboration", title: "Cross-Department Collaboration" },
  { key: "communication", title: "Communication & Transparency" },
  { key: "mentorship", title: "Mentorship & Knowledge Sharing" },
  { key: "peerSupport", title: "Peer Support & Team Spirit" },
  { key: "reliability", title: "Reliability & Accountability" },
  { key: "initiative", title: "Adaptability & Initiative" },
];

const ENVIRONMENT_RATINGS: Record<number, { label: string; emoji: string }> = {
  1: { label: "Very Bad", emoji: "😠" },
  2: { label: "Bad", emoji: "🙁" },
  3: { label: "Neutral", emoji: "😐" },
  4: { label: "Good", emoji: "🙂" },
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

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

    // 1. Trigger Toast notification
    setToast({
      message: `Verification code has been submitted to your mail ID: ${emailInput.trim()}`,
      type: "success",
    });

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
    setToast({
      message: `A fresh 6-digit verification code was sent to ${emailInput}`,
      type: "info",
    });
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
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form data for employee submission
  const formData: ReviewFormData = useMemo(() => {
    return submissionData || initialReviewFormData;
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
    if (validationError) setValidationError(null);
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

    if (validationError) setValidationError(null);
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
    if (averageScore >= 4.5) return "#05CD99";
    if (averageScore >= 3.5) return "#14B8A6";
    if (averageScore >= 2.5) return "#F59E0B";
    return "#EF4444";
  }, [averageScore]);

  const handleAddStrength = (tag: string) => {
    setStrengths((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
  };

  const handleAddImprovement = (tag: string) => {
    setImprovements((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const values = Object.values(scores);
    const unratedCount = values.filter((s) => !s || s === 0).length;

    if (unratedCount > 0) {
      setValidationError(
        `Please rate all evaluation parameters (${unratedCount} remaining).`
      );
      return;
    }

    if (!strengths.trim()) {
      setValidationError("Please fill out the Performance Strengths.");
      return;
    }
    if (!improvements.trim()) {
      setValidationError("Please fill out the Areas of Improvement.");
      return;
    }
    if (!remarks.trim()) {
      setValidationError("Please fill out the Additional Remarks.");
      return;
    }

    setIsSubmitting(true);

    const evaluationResult: EvaluationData = {
      scores,
      averageScore: averageScore || 0,
      suggestedRating,
      strengths,
      improvements,
      remarks,
    };

    setTimeout(() => {
      onSubmitEvaluation?.(record.id, evaluationResult);
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onBack();
      }, 1200);
    }, 450);
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
    <div className="evaluation-panel-container relative">
      {/* Top Navigation & Title Header */}
      <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="eval-back-btn mb-2"
            title="Return to Quarterly Review List"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Team List</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#14B8A6] to-[#5EEAD4] flex items-center justify-center text-white shadow-md shadow-[#14B8A6]/20 shrink-0 eval-trophy-box">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight relative w-fit">
                <span className="eval-title-anim">
                  {isViewMode ? "Quarterly Review Details" : "Appraisal Review Evaluation"}
                </span>
                <span className="eval-title-accent-line" />
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#64748B] mt-1 flex items-center gap-1.5 eval-subtitle-anim">
                <span>{isViewMode ? "Reviewing" : "Evaluating"}</span>
                <span className="font-bold text-[#0F172A]">{record.name}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#14B8A6]/40" />
                <span>
                  {record.quarter} {record.financialYear}
                </span>
                {isViewMode && (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#14B8A6]/40" />
                    <span className="text-[#14B8A6] font-bold">View Mode</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>



        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Evaluation submitted successfully! Returning to list...</span>
          </div>
        )}
      </div>

      {/* Top Metadata Banner Card with Tech SVG Artwork & Animated Avatar Ring */}
      <div className="eval-meta-banner mb-4">
        {/* Subtle Tech Circuit SVG Pattern in Background Corner */}
        <svg
          className="absolute right-0 top-0 bottom-0 h-full w-48 opacity-[0.06] pointer-events-none text-[#14B8A6]"
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
          <div className="eval-meta-segment eval-meta-segment-1">
            <div className="relative shrink-0">
              <svg
                className="absolute -inset-1.5 w-15 h-15 animate-spin-slow pointer-events-none opacity-40 text-[#14B8A6]"
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#5EEAD4] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-[#14B8A6]/25 ring-4 ring-[#14B8A6]/10">
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
              <span className="text-[11px] font-bold text-[#05CD99] block mt-0.5">
                Verified Employee
              </span>
            </div>
          </div>

          {/* 2. Employee ID */}
          <div className="eval-meta-segment eval-meta-segment-2 sm:pl-4">
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
          <div className="eval-meta-segment eval-meta-segment-3 sm:pl-4">
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
          <div className="eval-meta-segment eval-meta-segment-4 sm:pl-4">
            <div>
              <span className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-0.5">
                SUBMITTED DATE
              </span>
              <span className="text-sm font-extrabold text-[#0F172A] block">
                {record.assignedOn || "07/09/2026"}
              </span>
              <span className="text-[11px] font-semibold text-[#05CD99] block mt-0.5">
                On-Time Submission
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stacked Layout: Employee Performance Submission followed by Manager Evaluation (Full Width) */}
      <div className="flex flex-col gap-6 w-full">
        {/* ===================================================================
            SECTION 1: Employee Performance Submission (Full Width)
           =================================================================== */}
        <div className="w-full space-y-4 eval-submission-col">
          {/* Header Card */}
          <div className="eval-glass-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  Employee Performance Submission
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Detailed review of quarterly outputs submitted by employee.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1: ROLE & QUARTER OVERVIEW */}
          <div className="eval-step-card space-y-3">
            <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  1
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  Step 1: Role &amp; Quarter Overview
                </h3>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1.5 uppercase tracking-wider">
                Overview
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.overview ||
                  "Frontend Developer focused on building and optimizing web applications. Delivered responsive UI components, collaborated with backend and design teams, and completed major modules ahead of schedule with zero critical bugs."}
              </div>
            </div>
          </div>

          {/* STEP 2: KEY ACHIEVEMENTS & PROJECTS */}
          <div className="eval-step-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  2
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  Step 2: Key Achievements &amp; Projects
                </h3>
              </div>
            </div>

            {/* Project Title */}
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Project Title
              </label>
              <div
                className="eval-readonly-field p-3 bg-gray-50/80 border border-[#CCFBF1] rounded-xl text-sm font-extrabold text-[#0F172A]"
                title="Employee submitted response (Read-only)"
              >
                {formData.projectTitle || "Worksphere Timesheet & Appraisal Platform"}
              </div>
            </div>

            {/* Project Description */}
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Project Description
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.projectDescription ||
                  "Spearheaded the component library unification, streamlined workflow interfaces, and achieved 99% on-time delivery across quarterly deliverables."}
              </div>
            </div>

            {/* Challenge */}
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Challenge
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.projectChallenge ||
                  "Adapted to rapid requirements changes and resolved complex state synchronization challenges without delaying deployment milestones."}
              </div>
            </div>
          </div>

          {/* STEP 3: TEAMWORK & COLLABORATION with Interactive Score Bars */}
          <div className="eval-step-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  3
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  Step 3: Teamwork &amp; Collaboration
                </h3>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-2 uppercase tracking-wider">
                Evaluated Teamwork Dimensions ({ratedDimensionsCount}/6)
              </label>

              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
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
          <div className="eval-step-card space-y-3">
            <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  4
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  Step 4: Continuous Learning &amp; Goals
                </h3>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1.5 uppercase tracking-wider">
                Learning Goals
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.learningGoals ||
                  formData.nextQuarterLearningGoals ||
                  "Explore Next.js server components and GraphQL integration."}
              </div>
            </div>
          </div>

          {/* STEP 5: COMPANY ENVIRONMENT */}
          <div className="eval-step-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  5
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  Step 5: Company Environment
                </h3>
              </div>
              <span className="text-xs font-bold text-[#14B8A6] px-3 py-1 rounded-full bg-[#14B8A6]/10 flex items-center gap-1.5 border border-[#14B8A6]/20 shadow-xs">
                <span className="text-sm">{envInfo.emoji}</span>
                <span>
                  {envInfo.label} ({envRating}/5)
                </span>
              </span>
            </div>

            {/* Feedback on Work Culture */}
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Feedback on Work Culture
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.workCultureFeedback ||
                  "The collaborative workspace is highly productive. The developer tools provided are excellent and help speed up development cycles."}
              </div>
            </div>

            {/* Work Life Balance */}
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Work Life Balance
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.workLifeBalance ||
                  "I feel highly aligned with the company's vision of delivering fast, reliable employee portals."}
              </div>
            </div>

            {/* Suggestions for Improvement */}
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Suggestions for Improvement
              </label>
              <div
                className="eval-readonly-field p-3.5 bg-gray-50/80 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium"
                title="Employee submitted response (Read-only)"
              >
                {formData.suggestionsForImprovement ||
                  "I feel highly aligned with the company's vision of delivering fast, reliable employee portals."}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECTION 2: Manager Review & Evaluation Matrix (Full Width)
           =================================================================== */}
        <div className="w-full space-y-6">
          <div className="eval-glass-card p-6 sm:p-7 w-full">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#5EEAD4] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#14B8A6]/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  {isViewMode
                    ? "Manager Evaluation (View Mode)"
                    : "Manager Review & Evaluation Matrix"}
                </h2>
                <p className="text-xs text-[#64748B]">
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
                    <div className="mb-2.5">
                      <label className="block text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                        Score Evaluation Parameters (1-5 Scale)
                      </label>
                    </div>

                    <div
                      onClick={() => setIsEmailModalOpen(true)}
                      className="eval-rating-hidden-card group cursor-pointer"
                      role="button"
                      tabIndex={0}
                      title="Click to view rating verification popup"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center font-bold">
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
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-r from-[#F7FEFD] to-[#F0FDFA] border border-[#99F6E4] flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-200 group-hover:border-[#14B8A6]/40 group-hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white text-[#14B8A6] flex items-center justify-center shadow-xs shrink-0">
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
                          className="px-4 py-2 rounded-xl bg-[#14B8A6] hover:bg-[#0F766E] text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
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
                    <div className="mb-2.5">
                      <label className="block text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                        Score Evaluation Parameters (1-5 Scale)
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 border border-[#E2E8F0] rounded-2xl p-3 sm:p-4 bg-[#FAFFFE]/90 shadow-inner">
                      {EVALUATION_PARAMETERS.map((param) => {
                        const currentRating = getParamNumericValue(param.key);
                        const isParamHovered = hoveredStar?.key === param.key;
                        const activeHoverValue = isParamHovered
                          ? hoveredStar.value
                          : 0;

                        return (
                          <div
                            key={param.key}
                            className="eval-param-row bg-white/90 border border-[#E2E8F0]/70 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs"
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
                        );
                      })}
                    </div>
                  </div>

                  {/* Calculated Average Score Banner with Circular Radial SVG Gauge */}
                  <div className="eval-kpi-card flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center font-bold shrink-0">
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
                <div>
                  <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 flex items-center justify-between">
                    <span>
                      Performance Strengths <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
                      Key Highlights
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    readOnly={isViewMode}
                    disabled={isViewMode}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Highlight major strengths and positive attributes..."
                    className={`eval-textarea-field ${
                      isViewMode ? "eval-textarea-readonly" : ""
                    }`}
                    title={
                      isViewMode
                        ? "Evaluation is in view-only mode (Editing disabled)"
                        : undefined
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 flex items-center justify-between">
                    <span>
                      Areas of Improvement <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
                      Growth Objectives
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    readOnly={isViewMode}
                    disabled={isViewMode}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Identify growth areas and learning objectives..."
                    className={`eval-textarea-field ${
                      isViewMode ? "eval-textarea-readonly" : ""
                    }`}
                    title={
                      isViewMode
                        ? "Evaluation is in view-only mode (Editing disabled)"
                        : undefined
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 flex items-center justify-between">
                    <span>
                      Additional Remarks <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
                      Guidance &amp; Notes
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    readOnly={isViewMode}
                    disabled={isViewMode}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="General comments or HR guidelines..."
                    className={`eval-textarea-field ${
                      isViewMode ? "eval-textarea-readonly" : ""
                    }`}
                    title={
                      isViewMode
                        ? "Evaluation is in view-only mode (Editing disabled)"
                        : undefined
                    }
                  />
                </div>
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Bottom Actions: View Mode gives ONLY 'Back to Team List' (No edit or submit option). Edit Mode gives 'Submit Evaluation' */}
              {isViewMode ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-[#020617] text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Team List</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="eval-submit-btn-glow group flex-1"
                  >
                    <Check className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>
                      {isSubmitting
                        ? "Submitting Evaluation..."
                        : "Submit Evaluation"}
                    </span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
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
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#14B8A6] to-[#5EEAD4] flex items-center justify-center text-white shadow-lg shadow-[#14B8A6]/25 mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                    Authenticate Rating Access
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Enter your corporate email address to receive the 4-digit verification code.
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
                        className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#FAFFFE] border border-[#E2E8F0] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/15 transition-all"
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
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#14B8A6] to-[#5EEAD4] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#14B8A6]/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
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

                {/* 2 & 3. Six OTP Input Boxes with Green Shadow on Each Typed Number */}
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
                      Resend in <span className="text-[#14B8A6] font-semibold">{resendTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-[#14B8A6] hover:text-[#0F766E] font-bold flex items-center gap-1 hover:underline"
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
                    className="w-full py-3 rounded-2xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    View Unlocked Rating
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={1500}
        />
      )}
    </div>
  );
};

export default EvaluationPanel;
