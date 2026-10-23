import React, { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import {
  Award,
  BarChart3,
  Calendar,
  Clock,
  ClipboardList,
  Pencil,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  CalendarClock,
  ChevronRight,
  KeyRound,
  Lock,
  X,
  AlertCircle,
  ArrowRight,
  Star,
  Send,
} from "lucide-react";
import {
  animateKeyIconBounce,
} from "../../animations/appraisalAnimations";
import {
  QuarterlyReviewAssignment,
  ManagerQuarterlyReviewRecord,
  AccessRequest,
  ReviewFormData,
} from "../../types/appraisal.types";
import { useEmployeeAppraisal } from "../../hooks/useEmployeeAppraisal";
import { AppraisalApi, formatAppraisalDisplayDate, isResubmittedStatus, readApiError, toReviewFormData } from "../../reducers/appraisal.reducer";
import QuarterlyReviewStepper from "./QuarterlyReviewStepper";
import EvaluationPanel from "../manager/EvaluationPanel";
import RatingVerificationModal from "./RatingVerificationModal";
import AccessRequestModal from "./AccessRequestModal";
import { RevealedRatingModal, RevealedRatingData } from "./RevealedRatingModal";
import { message } from "antd";
import {
  Card,
  CardTitle,
  CardContent,
  Button,
  Dropdown,
  Pagination,
} from "../../../components/ui";
import "./AppraisalDashboard.css";

// Empty State Illustration using modern vector illustration style from manager side
export const EmptyReviewIllustration: React.FC = () => {
  return (
    <div className="relative mb-5 flex items-center justify-center">
      <div className="manager-review-empty-glow" />
      <div className="manager-review-empty-illustration" />
    </div>
  );
};

const renderQuarterBadge = (quarter: string) => {
  const q = (quarter || "").trim().toUpperCase();
  let qClass = "qr-quarter-q1";
  if (q === "Q2") qClass = "qr-quarter-q2";
  else if (q === "Q3") qClass = "qr-quarter-q3";
  else if (q === "Q4") qClass = "qr-quarter-q4";

  return <span className={`qr-quarter-pill ${qClass}`}>{quarter}</span>;
};

const renderStatusBadge = (status: string) => {
  const raw = (status || "").trim();
  if (raw.toUpperCase() === "NOT_UPDATED" || raw.toUpperCase() === "LOCKED") {
    return (
      <span className="qr-status-badge qr-status-locked" title="Locked because the deadline was missed">
        <Lock className="w-3 h-3 text-rose-500 mr-0.5 inline" />
        Locked
      </span>
    );
  }
  const normalized = raw.toLowerCase().replace(/_/g, " ");
  let badgeClass = "qr-status-not-started";

  if (normalized.includes("progress") || normalized === "draft" || normalized.includes("requested")) {
    badgeClass = "qr-status-in-progress";
  } else if (normalized.includes("submitted") || normalized.includes("received")) {
    badgeClass = "qr-status-submitted";
  } else if (normalized.includes("completed") || normalized === "reviewed") {
    badgeClass = "qr-status-completed";
  }

  const label = normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span className={`qr-status-badge ${badgeClass}`}>
      <span className="qr-status-dot" />
      {label}
    </span>
  );
};

const Marquee: React.FC<
  React.HTMLAttributes<HTMLElement> & {
    scrollamount?: number | string;
    behavior?: string;
    direction?: string;
  }
> = ({ children, ...props }) => {
  return React.createElement("marquee", props, children);
};

// ==========================================
// EXECUTIVE HEADER SUMMARY STAT CARDS (GSAP & BESPOKE SVGs)
// ==========================================

const DeadlineSvgIcon: React.FC<{
  urgency: "overdue" | "warning" | "normal" | "empty";
}> = ({ urgency }) => {
  const theme = {
    overdue: {
      bgGradStart: "#FEF2F2",
      bgGradEnd: "#FEE2E2",
      border: "#FECACA",
      accent: "#EF4444",
      calTop: "#DC2626",
      pin: "#991B1B",
    },
    warning: {
      bgGradStart: "#FFFBEB",
      bgGradEnd: "#FEF3C7",
      border: "#FDE68A",
      accent: "#F59E0B",
      calTop: "#D97706",
      pin: "#92400E",
    },
    normal: {
      bgGradStart: "#EFF6FF",
      bgGradEnd: "#DBEAFE",
      border: "#BFDBFE",
      accent: "#2563EB",
      calTop: "#1D4ED8",
      pin: "#1E40AF",
    },
    empty: {
      bgGradStart: "#F8FAFC",
      bgGradEnd: "#F1F5F9",
      border: "#E2E8F0",
      accent: "#64748B",
      calTop: "#475569",
      pin: "#334155",
    },
  }[urgency];

  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`dlBg-${urgency}`} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.bgGradStart} />
          <stop offset="100%" stopColor={theme.bgGradEnd} />
        </linearGradient>
        <linearGradient id={`dlCalTop-${urgency}`} x1="0" y1="0" x2="20" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.calTop} />
          <stop offset="100%" stopColor={theme.accent} />
        </linearGradient>
      </defs>

      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="12"
        fill={`url(#dlBg-${urgency})`}
        stroke={theme.border}
        strokeWidth="1.5"
      />

      <g transform="translate(6, 6.5)">
        <rect
          x="1"
          y="3"
          width="18"
          height="18"
          rx="4"
          fill="#FFFFFF"
          stroke={theme.border}
          strokeWidth="1"
        />
        <path
          d="M 1 7 C 1 4.79 2.79 3 5 3 L 15 3 C 17.21 3 19 4.79 19 7 L 19 8 L 1 8 Z"
          fill={`url(#dlCalTop-${urgency})`}
        />
        <rect x="4.5" y="1" width="1.8" height="3" rx="0.9" fill="#FFFFFF" />
        <rect x="13.7" y="1" width="1.8" height="3" rx="0.9" fill="#FFFFFF" />
        <circle cx="5.5" cy="11.5" r="1" fill={theme.accent} opacity="0.7" />
        <circle cx="10" cy="11.5" r="1" fill={theme.accent} opacity="0.7" />
        <circle cx="14.5" cy="11.5" r="1" fill={theme.accent} opacity="0.7" />
        <circle cx="5.5" cy="15.5" r="1" fill={theme.accent} opacity="0.7" />
        <circle cx="10" cy="15.5" r="1" fill={theme.accent} opacity="0.7" />
        <circle cx="14.5" cy="15.5" r="1" fill={theme.accent} opacity="0.5" />
      </g>

      <g transform="translate(19.5, 18.5)">
        <circle cx="10" cy="10" r="9.5" fill="#FFFFFF" stroke={theme.border} strokeWidth="1.2" />
        <circle cx="10" cy="10" r="7.5" fill={theme.bgGradStart} />
        <circle cx="10" cy="10" r="1.3" fill={theme.pin} />
        <line x1="10" y1="10" x2="10" y2="6.2" stroke={theme.pin} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="10" x2="13.8" y2="10" stroke={theme.accent} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
};

const FinancialRatingSvgIcon: React.FC = () => {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="frBgGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="frRibbonLeft" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="frRibbonRight" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="frGoldRim" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="frGoldCore" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <linearGradient id="frGlint" x1="0" y1="0" x2="8" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="12"
        fill="url(#frBgGrad)"
        stroke="#BFDBFE"
        strokeWidth="1.5"
      />

      {/* Perfectly Centered Medal Assembly */}
      <g transform="translate(11, 8.5)">
        <path
          d="M 5 14 L 2 26 L 6.5 23.5 L 11 26 L 9 14 Z"
          fill="url(#frRibbonLeft)"
        />
        <path
          d="M 13 14 L 11 26 L 15.5 23.5 L 20 26 L 17 14 Z"
          fill="url(#frRibbonRight)"
        />

        <circle cx="11" cy="11" r="9.5" fill="url(#frGoldRim)" stroke="#A16207" strokeWidth="0.6" />
        <circle cx="11" cy="11" r="8" fill="url(#frGoldCore)" />
        <circle cx="11" cy="11" r="6.8" stroke="#CA8A04" strokeWidth="0.75" strokeDasharray="1.5 1" fill="none" />

        <path
          d="M 5 8 A 7 7 0 0 1 17 8"
          stroke="url(#frGlint)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />

        <polygon
          points="11,6.5 12.4,9.5 15.5,9.8 13.1,11.9 13.8,15 11,13.3 8.2,15 8.9,11.9 6.5,9.8 9.6,9.5"
          fill="#FFFFFF"
          stroke="#B45309"
          strokeWidth="0.4"
        />
      </g>

      <g transform="translate(29, 9)">
        <path
          d="M 3 0 Q 3 3 6 3 Q 3 3 3 6 Q 3 3 0 3 Q 3 3 3 0 Z"
          fill="#3B82F6"
          opacity="0.8"
        />
      </g>
    </svg>
  );
};

interface DeadlineHeaderCardProps {
  deadlineInfo: {
    assignment: QuarterlyReviewAssignment;
    days: number;
    pendingCount: number;
    deadlineLabel: string;
    pendingMap: Map<string, { days: number; deadlineLabel: string }>;
  } | null;
  onOpenEdit: (assignment: QuarterlyReviewAssignment) => void;
  onOpenView: (assignment: QuarterlyReviewAssignment) => void;
  renderQuarterBadge: (quarter: string) => React.ReactNode;
}

const DeadlineHeaderCard: React.FC<DeadlineHeaderCardProps> = ({
  deadlineInfo,
  onOpenEdit,
  onOpenView,
  renderQuarterBadge,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 10, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" }
      );
    }
  }, []);

  const isClickable = Boolean(deadlineInfo);
  const days = deadlineInfo?.days ?? null;
  const isOverdue = days !== null && days < 0;
  const isUrgent = days !== null && days >= 0 && days <= 3;

  const urgencyState: "overdue" | "warning" | "normal" | "empty" = !deadlineInfo
    ? "empty"
    : isOverdue
      ? "overdue"
      : isUrgent
        ? "warning"
        : "normal";

  const handleMouseEnter = () => {
    if (!isClickable) return;
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -3,
        scale: 1.015,
        boxShadow: isOverdue
          ? "0 14px 28px -4px rgba(239,68,68,0.18), 0 4px 12px rgba(15,23,42,0.04)"
          : isUrgent
            ? "0 14px 28px -4px rgba(245,158,11,0.18), 0 4px 12px rgba(15,23,42,0.04)"
            : "0 14px 28px -4px rgba(37,99,235,0.14), 0 4px 12px rgba(15,23,42,0.04)",
        borderColor: isOverdue ? "#FCA5A5" : isUrgent ? "#FCD34D" : "#93C5FD",
        duration: 0.28,
        ease: "power2.out",
      });
    }
    if (chevronRef.current) {
      gsap.to(chevronRef.current, { x: 3, duration: 0.2, ease: "power2.out" });
    }
  };

  const handleMouseLeave = () => {
    if (!isClickable) return;
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: 0,
        scale: 1,
        boxShadow: "0 4px 16px -2px rgba(15,23,42,0.04)",
        borderColor: "#E2E8F0",
        duration: 0.25,
        ease: "power2.out",
      });
    }
    if (chevronRef.current) {
      gsap.to(chevronRef.current, { x: 0, duration: 0.2, ease: "power2.out" });
    }
  };

  const handleClick = () => {
    if (!deadlineInfo) return;
    if (deadlineInfo.assignment.canEdit) {
      onOpenEdit(deadlineInfo.assignment);
    } else {
      onOpenView(deadlineInfo.assignment);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`employee-stat-card-executive group ${isOverdue
        ? "employee-stat-card-executive-overdue"
        : isUrgent
          ? "employee-stat-card-executive-warning"
          : ""
        } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
      title={isClickable && deadlineInfo ? `Click to open ${deadlineInfo.assignment.quarter} review` : undefined}
    >
      {/* Colored Left Edge Bar */}
      <div className="employee-stat-edge-bar" />

      <div className="flex items-center gap-3">
        <DeadlineSvgIcon urgency={urgencyState} />

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] sm:text-sm font-bold text-[#0F172A] tracking-tight leading-snug">
              Deadline
            </span>
            {deadlineInfo && renderQuarterBadge(deadlineInfo.assignment.quarter)}
          </div>

          {deadlineInfo ? (
            <div className="text-[11px] sm:text-xs font-semibold leading-snug mt-1 flex items-center flex-wrap gap-1">
              <span
                className={
                  isOverdue
                    ? "text-[#DC2626] font-bold"
                    : isUrgent
                      ? "text-[#D97706] font-bold"
                      : "text-[#0F172A]"
                }
              >
                {deadlineInfo.deadlineLabel}
              </span>
              <span className="text-[#94A3B8] font-normal">
                {" "}· {isOverdue
                  ? `Overdue by ${Math.abs(days!)}d`
                  : days === 0
                    ? "Due today"
                    : `${days}d left`}
              </span>
            </div>
          ) : (
            <span className="text-[11px] sm:text-xs text-[#94A3B8] font-medium leading-snug mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              No pending reviews
            </span>
          )}
        </div>
      </div>

      <div ref={chevronRef} className="employee-stat-chevron-pill ml-2">
        <ChevronRight className="w-3.5 h-3.5 stroke-[2.4]" />
      </div>
    </div>
  );
};

interface FinancialRatingHeaderCardProps {
  onOpen: () => void;
}

const FinancialRatingHeaderCard: React.FC<FinancialRatingHeaderCardProps> = ({ onOpen }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 10, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, delay: 0.08, ease: "power2.out" }
      );
    }
  }, []);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -3,
        scale: 1.015,
        boxShadow: "0 14px 28px -4px rgba(37,99,235,0.15), 0 4px 12px rgba(15,23,42,0.04)",
        borderColor: "#93C5FD",
        duration: 0.28,
        ease: "power2.out",
      });
    }
    if (chevronRef.current) {
      gsap.to(chevronRef.current, { x: 3, duration: 0.2, ease: "power2.out" });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: 0,
        scale: 1,
        boxShadow: "0 4px 16px -2px rgba(15,23,42,0.04)",
        borderColor: "#E2E8F0",
        duration: 0.25,
        ease: "power2.out",
      });
    }
    if (chevronRef.current) {
      gsap.to(chevronRef.current, { x: 0, duration: 0.2, ease: "power2.out" });
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onOpen}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="employee-stat-card-executive cursor-pointer group"
      title="Click to view Financial Rating breakdown & calculation"
    >
      {/* Colored Left Edge Bar */}
      <div className="employee-stat-edge-bar" />

      <div className="flex items-center gap-3">
        <FinancialRatingSvgIcon />

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] sm:text-sm font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#2563EB] transition-colors">
              Financial Rating
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
              Annual
            </span>
          </div>

          <span className="text-[11px] sm:text-xs text-[#64748B] font-medium leading-snug mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Verified Evaluation
          </span>
        </div>
      </div>

      <div ref={chevronRef} className="employee-stat-chevron-pill ml-2">
        <ChevronRight className="w-3.5 h-3.5 stroke-[2.4]" />
      </div>
    </div>
  );
};

export const AppraisalDashboard: React.FC = () => {
  const {
    assignments,
    activeAssignment,
    financialYear,
    quarter,
    statusFilter,
    yearOptions,
    quarterOptions,
    yearsLoading,
    quartersLoading,
    loadFinancialYears,
    loadQuarters,
    hasActiveFilters,
    currentPage,
    pageSize,
    total,
    setCurrentPage,
    setFinancialYear,
    setQuarter,
    setStatusFilter,
    handleClearFilters,
    openAssignment,
    closeAssignment,
    reloadAssignments,
    submitReview,
  } = useEmployeeAppraisal();
  const [editingForm, setEditingForm] = useState<ReviewFormData | undefined>(undefined);
  const [stepperReadOnly, setStepperReadOnly] = useState<boolean>(false);
  interface ActiveRatingSession {
    finalRating: number;
    expiresAt: number;
    quarter: string;
    financialYear: string;
    reviewId: number;
  }

  const [rowRatings, setRowRatings] = useState<Record<string, ActiveRatingSession>>({});
  const [revealedModalData, setRevealedModalData] = useState<RevealedRatingData | null>(null);
  const [ratingTarget, setRatingTarget] = useState<QuarterlyReviewAssignment | null>(null);
  const [ratingPassword, setRatingPassword] = useState("");
  const employeeFiltersDockRef = useRef<HTMLDivElement>(null);

  // GSAP: Modern entrance animation for employee filter dock
  useEffect(() => {
    if (employeeFiltersDockRef.current) {
      gsap.fromTo(
        employeeFiltersDockRef.current.children,
        { opacity: 0, y: 7, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.05,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }
  }, []);
  const [showRatingPassword, setShowRatingPassword] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [unlockingRating, setUnlockingRating] = useState(false);
  const ratingTimersRef = useRef<Record<string, number>>({});
  const [, setTicker] = useState(0);

  // Live timer tick for active revealed ratings & auto-invalidation after 2 minutes
  useEffect(() => {
    const hasActive = Object.values(rowRatings).some((r) => r.expiresAt > Date.now());
    if (!hasActive) return;

    const intervalId = window.setInterval(() => {
      setTicker((prev) => prev + 1);
      const now = Date.now();
      setRowRatings((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [key, session] of Object.entries(next)) {
          if (session.expiresAt <= now) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [rowRatings]);

  useEffect(() => {
    const timers = ratingTimersRef.current;
    return () => {
      Object.values(timers).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const ratingReady = (assignment: QuarterlyReviewAssignment) =>
    assignment.status.toUpperCase() === "COMPLETED" &&
    (assignment.reviewStatus || "").toUpperCase() === "COMPLETED" &&
    Boolean(assignment.reviewId);

  // Scroll lock & background blur for password authentication modal
  useEffect(() => {
    if (ratingTarget) {
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
  }, [ratingTarget]);

  const closeRatingModal = () => {
    setRatingTarget(null);
    setRatingPassword("");
    setShowRatingPassword(false);
    setRatingError("");
  };

  const revealRowRating = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ratingTarget) return;
    if (!ratingPassword.trim()) {
      setRatingError("Password is required.");
      return;
    }
    setUnlockingRating(true);
    setRatingError("");
    try {
      if (!ratingTarget.reviewId) {
        setRatingError("This review cannot be opened yet.");
        return;
      }
      const revealed = await AppraisalApi.revealRating(
        ratingTarget.reviewId,
        ratingTarget.employeeId,
        ratingPassword.trim(),
      );
      if (!revealed.passwordVerified) {
        setRatingError("Wrong password.");
        return;
      }
      const rowId = ratingTarget.id;
      const scoreNum = Number(revealed.finalRating);
      const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes auto-timeout
      const sessionData: ActiveRatingSession = {
        finalRating: scoreNum,
        expiresAt,
        quarter: ratingTarget.quarter,
        financialYear: ratingTarget.financialYear,
        reviewId: ratingTarget.reviewId,
      };

      setRowRatings((current) => ({
        ...current,
        [rowId]: sessionData,
      }));

      if (ratingTimersRef.current[rowId] != null) {
        window.clearTimeout(ratingTimersRef.current[rowId]);
      }
      ratingTimersRef.current[rowId] = window.setTimeout(() => {
        setRowRatings((current) => {
          const next = { ...current };
          delete next[rowId];
          return next;
        });
        delete ratingTimersRef.current[rowId];
      }, 2 * 60 * 1000);

      // Open celebratory modern 3D rating modal
      setRevealedModalData({
        reviewId: ratingTarget.reviewId,
        rowId,
        quarter: ratingTarget.quarter,
        financialYear: ratingTarget.financialYear,
        finalRating: scoreNum,
        expiresAt,
      });

      closeRatingModal();
    } catch (error) {
      setRatingError(readApiError(error));
    } finally {
      setUnlockingRating(false);
    }
  };

  const handleCloseRevealedModal = () => {
    if (revealedModalData) {
      const rowId = revealedModalData.rowId;
      if (ratingTimersRef.current[rowId] != null) {
        window.clearTimeout(ratingTimersRef.current[rowId]);
        delete ratingTimersRef.current[rowId];
      }
      setRowRatings((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
    }
    setRevealedModalData(null);
  };

  const renderRowRating = (assignment: QuarterlyReviewAssignment) => {
    const revealed = rowRatings[assignment.id];
    if (revealed) {
      return (
        <span className="text-sm font-extrabold text-[#0F172A]">
          {Number.isFinite(revealed.finalRating) ? Number(revealed.finalRating.toFixed(2)) : "—"}
        </span>
      );
    }
    if (!ratingReady(assignment)) {
      return <span className="text-xs text-[#94A3B8]">—</span>;
    }
    return (
      <button
        type="button"
        onClick={() => {
          setRatingTarget(assignment);
          setRatingPassword("");
          setRatingError("");
          setShowRatingPassword(false);
        }}
        className="qr-action-icon-btn qr-action-btn-view"
        title={`View final rating for ${assignment.quarter}`}
        aria-label={`View final rating for ${assignment.quarter}`}
      >
        <Lock className="w-4 h-4" />
      </button>
    );
  };

  // Viewing assignment in EvaluationPanel
  const [viewingAssignment, setViewingAssignment] = useState<QuarterlyReviewAssignment | null>(null);
  const [viewingForm, setViewingForm] = useState<ReviewFormData | undefined>(undefined);
  const [viewingPerformanceStatus, setViewingPerformanceStatus] = useState<string>("");
  const [viewingReviewStatus, setViewingReviewStatus] = useState<string>("");
  const [viewingEvaluation, setViewingEvaluation] = useState<{
    productivity?: number | string | null;
    qualityOfWork?: number | string | null;
    ownershipResponsibility?: number | string | null;
    communication?: number | string | null;
    teamCollaboration?: number | string | null;
    innovationProblemSolving?: number | string | null;
    performanceStrengths?: string | null;
    areasOfImprovement?: string | null;
    additionalRemarks?: string | null;
  }>();

  const [isRatingAuthModalOpen, setIsRatingAuthModalOpen] = useState<boolean>(false);

  // Comprehensive scroll to top helper that handles window, body, documentElement,
  // and inner layout containers like <main> or overflow-y-auto elements in SidebarLayout
  const scrollToPageTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
      if (typeof document.documentElement.scrollTo === "function") {
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    }
    if (document.body) {
      document.body.scrollTop = 0;
      if (typeof document.body.scrollTo === "function") {
        document.body.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    }

    const mainElements = document.querySelectorAll("main");
    mainElements.forEach((m) => {
      m.scrollTop = 0;
      if (typeof m.scrollTo === "function") {
        m.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    });

    const overflowElements = document.querySelectorAll("[class*='overflow-y-auto']");
    overflowElements.forEach((el) => {
      if (el.scrollHeight > 400) {
        el.scrollTop = 0;
        if (typeof el.scrollTo === "function") {
          el.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }
      }
    });
  };

  // Scroll to top helper handlers for View and Edit
  const loadRowPerformance = async (assignment: QuarterlyReviewAssignment) => {
    if (assignment.performanceId) {
      try {
        const perf = await AppraisalApi.getPerformanceById(Number(assignment.performanceId));
        if (perf) return perf;
      } catch (err) {
        // Fallback to query by quarter
      }
    }
    const q = (
      assignment.quarter === "Q1" ||
      assignment.quarter === "Q2" ||
      assignment.quarter === "Q3" ||
      assignment.quarter === "Q4"
    ) ? (assignment.quarter as any) : undefined;
    if (assignment.employeeId && q && assignment.financialYear) {
      try {
        return await AppraisalApi.getEmployeePerformance(assignment.employeeId, q, assignment.financialYear);
      } catch (err) {
        return null;
      }
    }
    return null;
  };

  const handleOpenEdit = async (assignment: QuarterlyReviewAssignment) => {
    scrollToPageTop();
    try {
      const performance = await loadRowPerformance(assignment);
      setStepperReadOnly(false);
      setEditingForm(performance ? toReviewFormData(performance) : undefined);
      openAssignment({
        ...assignment,
        performanceId: performance?.id ?? assignment.performanceId,
        assignedBy: performance?.assignedBy || assignment.assignedBy,
        assignedDate: performance?.assignedDate
          ? formatAppraisalDisplayDate(performance.assignedDate)
          : assignment.assignedDate,
        deadline: performance?.deadlineDate
          ? formatAppraisalDisplayDate(performance.deadlineDate)
          : assignment.deadline,
        description: performance?.description ?? assignment.description,
      });
    } catch (error) {
      message.error(readApiError(error));
      return;
    }
    setTimeout(scrollToPageTop, 50);
  };

  const handleOpenView = async (assignment: QuarterlyReviewAssignment) => {
    scrollToPageTop();
    try {
      const performance = await loadRowPerformance(assignment);
      const formData = performance ? toReviewFormData(performance) : undefined;
      setStepperReadOnly(true);
      setEditingForm(formData);
      openAssignment({
        ...assignment,
        performanceId: performance?.id ?? assignment.performanceId,
        assignedBy: performance?.assignedBy || assignment.assignedBy,
        assignedDate: performance?.assignedDate
          ? formatAppraisalDisplayDate(performance.assignedDate)
          : assignment.assignedDate,
        deadline: performance?.deadlineDate
          ? formatAppraisalDisplayDate(performance.deadlineDate)
          : assignment.deadline,
        performanceDate: performance?.submittedAt
          ? formatAppraisalDisplayDate(performance.submittedAt)
          : assignment.performanceDate,
        reviewId: performance?.reviewId ?? assignment.reviewId,
        description: performance?.description ?? assignment.description,
      });
    } catch (error) {
      message.error(readApiError(error));
      return;
    }
    setTimeout(scrollToPageTop, 50);
  };

  const handleOpenAnnualRating = () => {
    scrollToPageTop();
    setIsRatingAuthModalOpen(true);
  };

  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);
  const [selectedAccessAssignment, setSelectedAccessAssignment] = useState<QuarterlyReviewAssignment | null>(null);
  const [selectedAccessRemainingHours, setSelectedAccessRemainingHours] = useState<number>(42);

  const checkAccessEligibility = (assignment: QuarterlyReviewAssignment) => {
    const hidden = {
      visible: false,
      eligible: false,
      alreadyRequested: false,
      remainingHours: 0,
      tooltip: "",
    };

    const statusUpper = (assignment.status || "").toUpperCase();
    if (isResubmittedStatus(assignment.status) || statusUpper === "RE_SUBMITTED") {
      return hidden;
    }

    const isPending =
      statusUpper === "REQUESTED_FOR_EDIT" ||
      accessRequests.some(
        (req) =>
          req.assignmentId === assignment.id ||
          (req.quarter === assignment.quarter && req.financialYear === assignment.financialYear)
      );

    if (isPending) {
      return {
        visible: true,
        eligible: true,
        alreadyRequested: true,
        remainingHours: 0,
        tooltip: `Access request submitted to ${assignment.assignedBy}. Status: Pending Approval. Click to view details.`,
      };
    }

    if (!assignment.canRequestEdit || (assignment.remainingRequestHours ?? 0) <= 0) {
      return hidden;
    }

    const remainingHours = assignment.remainingRequestHours ?? 0;
    return {
      visible: true,
      eligible: true,
      alreadyRequested: false,
      remainingHours,
      tooltip: `Request edit access from ${assignment.assignedBy} (~${remainingHours}h remaining in the 42-hour window).`,
    };
  };

  const handleOpenAccessRequest = (assignment: QuarterlyReviewAssignment, remainingHours: number) => {
    setSelectedAccessAssignment(assignment);
    setSelectedAccessRemainingHours(remainingHours);
    setIsAccessModalOpen(true);
  };

  const handleCloseAccessRequest = () => {
    setIsAccessModalOpen(false);
    setSelectedAccessAssignment(null);
  };

  const handleSubmitAccessRequest = async (newRequest: AccessRequest) => {
    try {
      if (selectedAccessAssignment) {
        await AppraisalApi.requestEdit({
          performanceId: selectedAccessAssignment.performanceId,
          reviewId: selectedAccessAssignment.reviewId,
          employeeId: selectedAccessAssignment.employeeId,
          reason: newRequest.description,
        });
        reloadAssignments();
      }
      setAccessRequests((prev) => [newRequest, ...prev]);
      message.success(
        `Access request for ${newRequest.quarter} successfully routed to ${newRequest.recipientRole}!`,
        2.5
      );
      handleCloseAccessRequest();
    } catch (error) {
      message.error(readApiError(error));
    }
  };

  // Ensure scroll to top whenever entering view or edit screen
  useEffect(() => {
    if (activeAssignment || viewingAssignment) {
      scrollToPageTop();
      const raf = requestAnimationFrame(scrollToPageTop);
      const t = setTimeout(scrollToPageTop, 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
  }, [activeAssignment, viewingAssignment]);

  const totalItems = total;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const paginatedAssignments = assignments;

  // Nearest deadline among assignments that are loaded and not finally submitted.
  const deadlineInfo = useMemo(() => {
    const MONTHS: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const parse = (value: string): Date | null => {
      const raw = (value || "").trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const isoDate = new Date(raw);
        if (Number.isNaN(isoDate.getTime())) return null;
        isoDate.setHours(0, 0, 0, 0);
        return isoDate;
      }
      const parts = raw.split("-");
      if (parts.length !== 3) return null;
      const [dayText, monthText, yearText] = parts;
      const day = Number(dayText);
      const year = Number(yearText);
      const monthNumber = Number(monthText);
      const month = Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12
        ? monthNumber - 1
        : MONTHS[monthText.slice(0, 3).toLowerCase()];
      if (!day || month === undefined || !year) return null;
      const date = new Date(year, month, day);
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
      }
      return date;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const closed = new Set(["submitted", "reviewed", "completed", "re_submitted", "under_review"]);
    const editWindow = new Set([
      "requested_for_edit",
      "edit_requested",
      "approved_for_editing",
      "edit_granted",
    ]);
    const approvedEdit = new Set(["approved_for_editing", "edit_granted"]);

    const pending = assignments
      .filter((assignment) => {
        const status = (assignment.status || "").toLowerCase();
        return editWindow.has(status) || !closed.has(status);
      })
      .map((assignment) => {
        const status = (assignment.status || "").toLowerCase();
        const deadlineDateParsed = assignment.deadline ? parse(assignment.deadline) : null;
        const editUntilParsed =
          approvedEdit.has(status) && assignment.editAllowedUntil
            ? parse(assignment.editAllowedUntil)
            : null;

        let targetDate: Date | null = null;
        let targetLabel: string = assignment.deadline || "";

        if (deadlineDateParsed && editUntilParsed) {
          if (deadlineDateParsed.getTime() >= editUntilParsed.getTime()) {
            targetDate = deadlineDateParsed;
            targetLabel = assignment.deadline || formatAppraisalDisplayDate(deadlineDateParsed);
          } else {
            targetDate = editUntilParsed;
            targetLabel = formatAppraisalDisplayDate(assignment.editAllowedUntil!);
          }
        } else if (deadlineDateParsed) {
          targetDate = deadlineDateParsed;
          targetLabel = assignment.deadline || formatAppraisalDisplayDate(deadlineDateParsed);
        } else if (editUntilParsed) {
          targetDate = editUntilParsed;
          targetLabel = formatAppraisalDisplayDate(assignment.editAllowedUntil!);
        }

        const days = targetDate ? Math.round((targetDate.getTime() - today.getTime()) / 86400000) : null;

        return {
          assignment,
          date: targetDate,
          deadlineLabel: targetLabel,
          days,
        };
      })
      .filter((item): item is { assignment: QuarterlyReviewAssignment; date: Date; deadlineLabel: string; days: number } => item.date !== null)
      .sort((left, right) => {
        const leftDistance = Math.abs(left.date.getTime() - today.getTime());
        const rightDistance = Math.abs(right.date.getTime() - today.getTime());
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;
        return left.date.getTime() - right.date.getTime();
      });

    const pendingMap = new Map<string, { days: number; deadlineLabel: string }>();
    pending.forEach((item) => {
      pendingMap.set(item.assignment.id, {
        days: item.days,
        deadlineLabel: item.deadlineLabel,
      });
    });

    if (pending.length === 0) return null;

    const pick = pending[0];
    const days = Math.round((pick.date.getTime() - today.getTime()) / 86400000);
    return {
      assignment: pick.assignment,
      days,
      pendingCount: pending.length,
      deadlineLabel: pick.deadlineLabel,
      pendingMap,
    };
  }, [assignments]);

  // If viewing assignment, display same luxury view page with hidden score parameters
  if (viewingAssignment) {
    const viewRecord: ManagerQuarterlyReviewRecord = {
      name: viewingAssignment.employeeName || "Employee",
      id: viewingAssignment.employeeId,
      role: viewingAssignment.designation || "",
      quarter: viewingAssignment.quarter,
      financialYear: viewingAssignment.financialYear,
      fromDate: viewingAssignment.assignedDate,
      toDate: viewingAssignment.deadline,
      assignedOn: viewingAssignment.assignedDate,
      assignedBy: viewingAssignment.assignedBy,
      finalRating: "",
      submittedOn: viewingAssignment.performanceDate,
      reviewId: viewingAssignment.reviewId ?? 0,
      reviewStatus: viewingReviewStatus,
      performanceStatus: viewingPerformanceStatus,
      submission: viewingForm,
      status: viewingReviewStatus,
      description: viewingAssignment.description,
    };

    return (
      <div className="w-full min-h-screen relative overflow-hidden font-sans p-4 sm:p-6 lg:p-8 bg-[#F4F7FE] flex-1 flex flex-col min-h-0">
        <div className="relative z-10 w-full flex-1 flex flex-col min-h-0">
          <EvaluationPanel
            key={`employee-${viewRecord.reviewId || viewRecord.id}`}
            record={viewRecord}
            submissionData={viewingForm}
            managerEvaluation={viewingEvaluation}
            mode="view"
            hideScoreParameters={true}
            onBack={() => {
              scrollToPageTop();
              setViewingAssignment(null);
              setViewingForm(undefined);
              setViewingEvaluation(undefined);
              setViewingPerformanceStatus("");
              setViewingReviewStatus("");
              setTimeout(scrollToPageTop, 50);
            }}
          />
        </div>
      </div>
    );
  }

  // If stepper is open, display 6-step review UI
  if (activeAssignment) {
    return (
      <div className="w-full min-h-screen relative overflow-hidden font-sans p-4 sm:p-6 lg:p-8 bg-[#F4F7FE] flex-1 flex flex-col min-h-0">
        <div className="relative z-10 w-full flex-1 flex flex-col min-h-0">
          <QuarterlyReviewStepper
            key={`${activeAssignment.id}-${stepperReadOnly ? "view" : "edit"}`}
            assignment={activeAssignment}
            initialFormData={editingForm}
            readOnly={stepperReadOnly}
            onBack={() => {
              scrollToPageTop();
              setStepperReadOnly(false);
              setEditingForm(undefined);
              closeAssignment();
              reloadAssignments();
              setTimeout(scrollToPageTop, 50);
            }}
            onSubmitSuccess={() => {
              if (activeAssignment) {
                setAccessRequests((prev) =>
                  prev.filter(
                    (req) =>
                      req.assignmentId !== activeAssignment.id &&
                      !(req.quarter === activeAssignment.quarter && req.financialYear === activeAssignment.financialYear)
                  )
                );
              }
              submitReview(activeAssignment.id);
              reloadAssignments();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden font-sans px-2 sm:px-3 lg:px-4 py-3 sm:py-4 lg:py-6 bg-[#F4F7FE] flex-1 flex flex-col min-h-0">



      {/* FOREGROUND CONTENT (z-10 layer for crisp interactivity and clarity) */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Page Header with Compact Summary Cards Beside Title */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight w-fit">
              <span className="manager-review-title-anim">Quarterly Review</span>
            </h1>
            <p className="text-sm mt-1 font-normal w-fit">
              <span className="manager-review-subtitle-anim">
                Complete authorized quarterly review assignments and track your performance appraisals.
              </span>
            </p>
          </div>

          {/* 2 Summary Cards beside title */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <DeadlineHeaderCard
              deadlineInfo={deadlineInfo}
              onOpenEdit={handleOpenEdit}
              onOpenView={handleOpenView}
              renderQuarterBadge={renderQuarterBadge}
            />

            <FinancialRatingHeaderCard
              onOpen={handleOpenAnnualRating}
            />
          </div>
        </div>

        {/* MAIN SECTION: QUARTERLY REVIEW HISTORY */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card min-h-[calc(100vh-230px)]">
          {/* Card Header & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold manager-review-card-title">
                Quarterly Review History
              </CardTitle>
            </div>

            {/* Filters Bar */}
            <div
              ref={employeeFiltersDockRef}
              className="manager-review-filters-dock flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-nowrap py-1 flex-1 justify-start xl:justify-end"
            >
              {/* Financial Year Dropdown */}
              <Dropdown
                className="shrink-0 filter-item-stagger-1"
                placeholder="Financial Year"
                allowClear={true}
                defaultValue=""
                prefixIcon={
                  <span className="filter-icon-badge filter-icon-badge-fy">
                    <Calendar size={13} />
                  </span>
                }
                options={yearOptions}
                value={financialYear}
                onChange={setFinancialYear}
                onOpen={loadFinancialYears}
                loading={yearsLoading}
                maxLabelWidth="max-w-[124px]"
                buttonClassName={`manager-review-filter-btn filter-btn-fy ${
                  financialYear ? "filter-active" : ""
                } rounded-xl px-2.5 py-1.5 text-xs font-semibold min-w-[172px]`}
              />

              <Dropdown
                className="shrink-0 filter-item-stagger-2"
                placeholder="Quarter"
                allowClear={false}
                defaultValue=""
                prefixIcon={
                  <span className="filter-icon-badge filter-icon-badge-quarters">
                    <Clock size={13} />
                  </span>
                }
                options={quarterOptions}
                value={quarter}
                onChange={setQuarter}
                onOpen={loadQuarters}
                loading={quartersLoading && quarterOptions.length === 0}
                maxLabelWidth="max-w-[100px]"
                buttonClassName={`manager-review-filter-btn filter-btn-quarters ${
                  quarter ? "filter-active" : ""
                } rounded-xl px-2.5 py-1.5 text-xs font-semibold min-w-[150px]`}
              />

              {/* Status Dropdown */}
              <Dropdown
                className="shrink-0 filter-item-stagger-3"
                placeholder="Status"
                allowClear={true}
                defaultValue=""
                prefixIcon={
                  <span className="filter-icon-badge filter-icon-badge-status">
                    <ClipboardList size={13} />
                  </span>
                }
                options={[
                  { value: "NOT_STARTED", label: "Not Started" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "EVALUATION_IN_PROGRESS", label: "Evaluation In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                maxLabelWidth="max-w-[80px]"
                contentWidth
                buttonClassName={`manager-review-filter-btn filter-btn-status ${
                  statusFilter ? "filter-active" : ""
                } rounded-xl px-2.5 py-1.5 text-xs font-semibold min-w-[124px]`}
              />

              {/* Clear Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="manager-review-clear-btn shrink-0"
                  title="Clear all filters"
                >
                  <RotateCcw size={14} className="filter-clear-icon shrink-0" />
                </Button>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            {assignments.length > 0 ? (
              /* STATE 2: Populated Table with Styled Brand Layout */
              <div className="space-y-4">
                <div className="hidden sm:block">
                  <div className="quarterly-review-table-card">
                    <div className="quarterly-review-table-scroll">
                      <table className="quarterly-review-table qr-header-indigo">
                        <thead>
                          <tr>
                            <th className="text-center min-w-[70px]">Sl No</th>
                            <th className="text-left min-w-[110px]">Quarter</th>
                            <th className="text-left min-w-[150px]">Financial Year</th>
                            <th className="text-center min-w-[130px]">Assigned By</th>
                            <th className="text-center min-w-[140px]">Assigned Date</th>
                            <th className="text-center min-w-[140px]">Deadline</th>
                            <th className="text-center min-w-[130px]">Status</th>
                            <th className="text-center min-w-[90px]">Rating</th>
                            <th className="text-center min-w-[140px] qr-sticky-action-th">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAssignments.map((assignment, index) => {
                            const pendingItem = deadlineInfo?.pendingMap?.get(assignment.id);
                            const daysLeft = pendingItem?.days ?? null;
                            const showRowMarquee = pendingItem !== undefined && daysLeft === 1;

                            return (
                              <tr key={assignment.id} className={showRowMarquee ? "qr-urgent-row" : ""}>
                                <td className="text-center font-semibold text-xs text-[#475569]">
                                  {index + 1}
                                </td>
                                {/* 1. Quarter with Dedicated Color */}
                                <td>{renderQuarterBadge(assignment.quarter)}</td>

                                {/* 2. Financial Year */}
                                <td>
                                  <span className="qr-fy-pill">{assignment.financialYear}</span>
                                </td>

                                {/* 3. Assigned By */}
                                <td className="text-center">
                                  <span
                                    className={`qr-assigned-by-pill ${(assignment.assignedBy || "Admin").toLowerCase() === "admin"
                                      ? "qr-assigned-by-admin"
                                      : ""
                                      }`}
                                  >
                                    {(assignment.assignedBy || "Admin").toLowerCase() === "admin" ? (
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    ) : (
                                      <UserCheck className="w-3.5 h-3.5" />
                                    )}
                                    {assignment.assignedBy || "Admin"}
                                  </span>
                                </td>

                                <td className="text-center">
                                  <span className="qr-date-chip">
                                    <Calendar className="w-3.5 h-3.5 text-[#A36361] mr-1.5 inline" />
                                    {assignment.assignedDate}
                                  </span>
                                </td>

                                <td className="text-center">
                                  <span className={`qr-date-chip ${showRowMarquee ? "qr-date-chip-urgent" : ""}`}>
                                    <Calendar className={`w-3.5 h-3.5 mr-1.5 inline ${showRowMarquee ? "text-rose-500" : "text-[#A36361]"}`} />
                                    {assignment.deadline}
                                  </span>
                                  {showRowMarquee && (
                                    <div className="qr-cell-marquee-container">
                                      <Marquee scrollamount={3} className="qr-cell-marquee-text">
                                        ⚠️ 1 day remaining — please submit your review before the deadline.
                                      </Marquee>
                                    </div>
                                  )}
                                </td>

                                {/* 5. Status */}
                                <td className="text-center">
                                  {renderStatusBadge(assignment.status)}
                                </td>

                                <td className="text-center">
                                  {renderRowRating(assignment)}
                                </td>

                                {/* 6. Action */}
                                <td className="text-center qr-sticky-action-td">
                                  <div className="qr-actions-container">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenView(assignment)}
                                      className="qr-action-icon-btn qr-action-btn-view"
                                      title={`View appraisal review for ${assignment.quarter}`}
                                      aria-label={`View appraisal review for ${assignment.quarter}`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    {assignment.canEdit && (
                                      (() => {
                                        const rawStatus = (assignment.status || assignment.reviewStatus || "").toUpperCase();
                                        const isDraft =
                                          rawStatus === "DRAFT" ||
                                          rawStatus === "EDIT_GRANTED" ||
                                          rawStatus === "ALLOWED_TO_EDIT";

                                        return isDraft ? (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEdit(assignment)}
                                            className="qr-action-icon-btn qr-action-btn-edit"
                                            title={`Edit review for ${assignment.quarter}`}
                                            aria-label={`Edit review for ${assignment.quarter}`}
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEdit(assignment)}
                                            className="qr-action-icon-btn qr-action-btn-send"
                                            title={`Start review for ${assignment.quarter}`}
                                            aria-label={`Start review for ${assignment.quarter}`}
                                          >
                                            <Send className="w-4 h-4" />
                                          </button>
                                        );
                                      })()
                                    )}

                                    {(() => {
                                      const elig = checkAccessEligibility(assignment);
                                      if (!elig.visible) return null;
                                      return (
                                        <button
                                          type="button"
                                          disabled={!elig.eligible}
                                          onMouseEnter={(e) => {
                                            if (elig.eligible && !elig.alreadyRequested) animateKeyIconBounce(e.currentTarget);
                                          }}
                                          onClick={() =>
                                            elig.eligible &&
                                            handleOpenAccessRequest(assignment, elig.remainingHours)
                                          }
                                          className={`qr-action-icon-btn qr-action-btn-access ${elig.alreadyRequested
                                            ? "qr-action-btn-access-requested cursor-pointer"
                                            : elig.eligible
                                              ? "qr-action-btn-access-enabled cursor-pointer"
                                              : "qr-action-btn-access-disabled"
                                            }`}
                                          title={elig.tooltip}
                                          aria-label={
                                            elig.alreadyRequested
                                              ? `Access request submitted for ${assignment.quarter}. Click to view.`
                                              : `Request access for ${assignment.quarter}`
                                          }
                                        >
                                          <KeyRound className="w-4 h-4" />
                                        </button>
                                      );
                                    })()}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer - Right Aligned */}
                    {totalItems > 0 && (
                      <div className="quarterly-review-pagination-bar">
                        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 select-none w-full">
                          <span className="text-xs text-gray-500 font-medium">
                            Showing <span className="text-[#0F172A] font-bold">{startItem}</span> to{" "}
                            <span className="text-[#0F172A] font-bold">{endItem}</span> of{" "}
                            <span className="text-[#0F172A] font-bold">{totalItems}</span> entries
                          </span>

                          <Pagination
                            currentPage={currentPage}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            showTotal={false}
                            activeClassName="!bg-[#2563EB] !text-white shadow-xs font-black shadow-blue-500/25"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Card Layout for Table Rows */}
                <div className="sm:hidden space-y-3">
                  {paginatedAssignments.map((assignment) => {
                    const pendingItem = deadlineInfo?.pendingMap?.get(assignment.id);
                    const daysLeft = pendingItem?.days ?? null;
                    const showRowMarquee = pendingItem !== undefined && daysLeft === 1;

                    return (
                      <Card
                        key={assignment.id}
                        className={`p-4 rounded-2xl border space-y-3 ${showRowMarquee ? "bg-[#FFF1F2] border-rose-300 ring-1 ring-rose-200" : "bg-white border-[#BFDBFE]/60 shadow-xs"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderQuarterBadge(assignment.quarter)}
                            <span className="qr-fy-pill">
                              {assignment.financialYear}
                            </span>
                          </div>
                          {renderStatusBadge(assignment.status)}
                        </div>

                        <div className="text-xs text-[#64748B] space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span>Assigned by:</span>
                            <span
                              className={`qr-assigned-by-pill ${(assignment.assignedBy || "Admin").toLowerCase() === "admin"
                                ? "qr-assigned-by-admin"
                                : ""
                                }`}
                            >
                              {(assignment.assignedBy || "Admin").toLowerCase() === "admin" ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              {assignment.assignedBy || "Admin"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Assigned date:</span>
                            <span className="qr-date-chip">
                              <Calendar className="w-3 h-3 text-[#A36361] mr-1 inline" />
                              {assignment.assignedDate}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Deadline:</span>
                            <div className="flex flex-col items-end">
                              <span className={`qr-date-chip ${showRowMarquee ? "qr-date-chip-urgent" : ""}`}>
                                <Calendar className={`w-3 h-3 mr-1 inline ${showRowMarquee ? "text-rose-500" : "text-[#A36361]"}`} />
                                {assignment.deadline}
                              </span>
                              {showRowMarquee && (
                                <div className="qr-cell-marquee-container w-[130px]">
                                  <Marquee scrollamount={3} className="qr-cell-marquee-text">
                                    ⚠️ 1 day left! Review not submitted
                                  </Marquee>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-[#64748B]">Rating</span>
                          {renderRowRating(assignment)}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenView(assignment)}
                            className="qr-action-btn-view flex-1 justify-center py-2 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          {assignment.canEdit && (
                            (() => {
                              const rawStatus = (assignment.status || assignment.reviewStatus || "").toUpperCase();
                              const isDraft =
                                rawStatus === "DRAFT" ||
                                rawStatus === "EDIT_GRANTED" ||
                                rawStatus === "ALLOWED_TO_EDIT";

                              return isDraft ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(assignment)}
                                  className="qr-action-btn-edit flex-1 justify-center py-2 text-xs"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(assignment)}
                                  className="qr-action-btn-send flex-1 justify-center py-2 text-xs"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Start
                                </button>
                              );
                            })()
                          )}

                          {(() => {
                            const elig = checkAccessEligibility(assignment);
                            if (!elig.visible) return null;
                            return (
                              <button
                                type="button"
                                disabled={!elig.eligible}
                                onClick={() =>
                                  elig.eligible &&
                                  handleOpenAccessRequest(assignment, elig.remainingHours)
                                }
                                className={`qr-action-icon-btn qr-action-btn-access !h-8 !w-8 justify-center shrink-0 ${elig.alreadyRequested
                                  ? "qr-action-btn-access-requested cursor-pointer"
                                  : elig.eligible
                                    ? "qr-action-btn-access-enabled cursor-pointer"
                                    : "qr-action-btn-access-disabled"
                                  }`}
                                title={elig.tooltip}
                                aria-label={
                                  elig.alreadyRequested
                                    ? `Access request submitted for ${assignment.quarter}. Click to view.`
                                    : `Request access for ${assignment.quarter}`
                                }
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            );
                          })()}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* STATE 1: Empty state matching reference image illustration (Rendered via CSS) */
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center px-4">
                <EmptyReviewIllustration />
                <h3 className="text-xl font-bold text-[#0F172A]">
                  No reviews available
                </h3>
                <p className="text-sm text-[#64748B] max-w-sm mt-1.5 leading-relaxed font-normal">
                  There are currently no quarterly reviews assigned to you. Once your manager assigns an appraisal, it will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {ratingTarget && typeof document !== "undefined" && createPortal(
        <>
          <style>{`
            header,
            .header,
            aside,
            footer,
            .footer,
            .sidebar-footer {
              transition: filter 0.3s ease, opacity 0.3s ease !important;
            }
            body.modal-open-active header,
            body.modal-open-active .header,
            body.modal-open-active aside,
            body.modal-open-active footer,
            body.modal-open-active .footer,
            body.modal-open-active .sidebar-footer {
              filter: blur(2.5px) !important;
              -webkit-filter: blur(2.5px) !important;
              pointer-events: none !important;
              user-select: none !important;
            }
          `}</style>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 eval-themed-modal-overlay"
            style={{
              backdropFilter: "blur(2.5px)",
              WebkitBackdropFilter: "blur(2.5px)",
              backgroundColor: "rgba(30, 58, 138, 0.35)",
            }}
            onClick={closeRatingModal}
          >
            <div
              className="eval-themed-modal-card max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-[#0F172A] relative shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeRatingModal}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-20 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <form onSubmit={(event) => void revealRowRating(event)} className="relative z-10 space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                    Authenticate Rating Access
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Enter your login password to see the final rating and average for {ratingTarget.quarter}.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRatingPassword ? "text" : "password"}
                      required
                      value={ratingPassword}
                      onChange={(event) => {
                        setRatingPassword(event.target.value);
                        if (ratingError) setRatingError("");
                      }}
                      placeholder="Password"
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pl-10 pr-10 rounded-2xl bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  {ratingError && (
                    <p className="text-xs font-medium text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {ratingError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeRatingModal}
                    className="flex-1 py-3 rounded-2xl border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer"
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
          </div>
        </>,
        document.body
      )}

      {/* RATING VERIFICATION MODAL */}
      <RatingVerificationModal
        isOpen={isRatingAuthModalOpen}
        onClose={() => setIsRatingAuthModalOpen(false)}
      />

      {/* ACCESS REQUEST MODAL */}
      <AccessRequestModal
        isOpen={isAccessModalOpen}
        onClose={handleCloseAccessRequest}
        assignment={selectedAccessAssignment}
        remainingHours={selectedAccessRemainingHours}
        onSubmit={handleSubmitAccessRequest}
        isReadOnly={Boolean(
          selectedAccessAssignment &&
          (selectedAccessAssignment.status.toUpperCase() === "REQUESTED_FOR_EDIT" ||
            accessRequests.some(
              (req) =>
                req.assignmentId === selectedAccessAssignment.id ||
                (req.quarter === selectedAccessAssignment.quarter &&
                  req.financialYear === selectedAccessAssignment.financialYear)
            ))
        )}
        requestDetails={
          selectedAccessAssignment
            ? accessRequests.find(
              (req) =>
                req.assignmentId === selectedAccessAssignment.id ||
                (req.quarter === selectedAccessAssignment.quarter &&
                  req.financialYear === selectedAccessAssignment.financialYear)
            ) || null
            : null
        }
      />

      {/* 3D CELEBRATORY REVEALED RATING MODAL */}
      <RevealedRatingModal
        data={revealedModalData}
        onClose={handleCloseRevealedModal}
      />
    </div>
  );
};

export default AppraisalDashboard;
