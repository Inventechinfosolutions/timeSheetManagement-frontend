import React, { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ArrowLeft,
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
import { AppraisalFilterAll } from "../../enums/appraisal.enums";
import { isYearlyReview, yearlyQuarterLabels, formatQuarterDisplay, PERFORMANCE_STEP_PATH, applyStepDataToForm } from "../../utils/appraisalHelpers";
import { AppraisalApi, formatAppraisalDisplayDate, isResubmittedStatus, readApiError, toReviewFormData } from "../../reducers/appraisal.reducer";
import { emptyReviewFormData } from "../../constants/emptyReviewForm";
import { RATING_REVEAL_DURATION_MS } from "../../constants/appraisal.constants";
import QuarterlyReviewStepper from "./QuarterlyReviewStepper";
import EvaluationPanel from "../manager/EvaluationPanel";
import RatingVerificationModal from "./RatingVerificationModal";
import AccessRequestModal from "./AccessRequestModal";
import { RevealedRatingModal, RevealedRatingData } from "./RevealedRatingModal";
import { message } from "antd";
import {
  Card,
  CardContent,
  Button,
  Dropdown,
  Pagination,
  SearchBox,
} from "../../../components/ui";
import { useAppSelector } from "../../../hooks";
import { isAdminAccess } from "../../../utils/roleAccess";
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

const renderQuarterBadge = (assignmentOrQuarter: QuarterlyReviewAssignment | string) => {
  const assignment = typeof assignmentOrQuarter === "string"
    ? { quarter: assignmentOrQuarter }
    : assignmentOrQuarter;
  if (isYearlyReview(assignment)) {
    return (
      <div className="qr-yearly-capsule" title="Yearly Review (Q1 - Q4)">
        <span className="qr-yearly-capsule-tag">Yearly</span>
        <span className="qr-yearly-capsule-divider" />
        <div className="qr-yearly-capsule-quarters">
          {yearlyQuarterLabels(assignment.yearlyQuarterReviews).map((item) => (
            <span
              key={item.quarter}
              className={`qr-capsule-q qr-quarter-${item.quarter.toLowerCase()} ${item.assigned ? "" : "is-empty"}`}
              title={`${item.quarter}${item.assigned ? "" : " (Pending)"}`}
            >
              {item.quarter}
            </span>
          ))}
        </div>
      </div>
    );
  }
  const qRaw = formatQuarterDisplay(assignment.quarter).trim();
  if (qRaw.includes(",")) {
    const parts = qRaw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    return (
      <div className="qr-yearly-capsule">
        <div className="qr-yearly-capsule-quarters">
          {parts.map((p) => {
            const qClass =
              p === "Q2" ? "qr-quarter-q2" : p === "Q3" ? "qr-quarter-q3" : p === "Q4" ? "qr-quarter-q4" : "qr-quarter-q1";
            return (
              <span key={p} className={`qr-capsule-q ${qClass}`}>
                {p}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  const q = qRaw.toUpperCase();
  let qClass = "qr-quarter-q1";
  if (q === "Q2") qClass = "qr-quarter-q2";
  else if (q === "Q3") qClass = "qr-quarter-q3";
  else if (q === "Q4") qClass = "qr-quarter-q4";

  return <span className={`qr-quarter-pill ${qClass}`}>{qRaw}</span>;
};

const renderStatusBadge = (status: string, reassignCount?: number) => {
  const rawUpper = (status || "").trim().toUpperCase();
  const effective =
    rawUpper === "REASSIGNED" || (rawUpper === "ASSIGNED" && Number(reassignCount || 0) >= 1)
      ? "REASSIGNED"
      : rawUpper;
  if (effective === "NOT_UPDATED" || effective === "LOCKED") {
    return (
      <span className="qr-status-badge qr-status-locked" title="Locked because the deadline was missed">
        <Lock className="w-3 h-3 text-rose-500 mr-0.5 inline" />
        Locked
      </span>
    );
  }
  if (effective === "REASSIGNED") {
    return (
      <span className="qr-status-badge qr-status-not-started" title="Reopened after deadline miss">
        <span className="qr-status-dot" />
        Re-Assigned
      </span>
    );
  }
  if (effective === "REQUESTED_FOR_EDIT") {
    return (
      <span
        className="qr-status-badge qr-status-in-progress"
        title="Edit request sent. Waiting for reviewer approval — access is not granted yet."
      >
        <Clock className="w-3 h-3 text-sky-600 mr-0.5 inline" />
        Requested For Edit
      </span>
    );
  }
  if (
    effective === "EDIT_GRANTED" ||
    effective === "APPROVED_FOR_EDITING" ||
    effective === "ALLOWED_TO_EDIT"
  ) {
    return (
      <span
        className="qr-status-badge qr-status-in-progress"
        title="Edit access granted. Update your answers and resubmit. Until you resubmit, your old submitted data stays as is."
      >
        <KeyRound className="w-3 h-3 text-[#4318FF] mr-0.5 inline" />
        Edit Granted
      </span>
    );
  }
  const normalized = effective.toLowerCase().replace(/_/g, " ");
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

/** Dashboard-style icon badge (matches AttendanceStatsCards 4th-card look) */
const HeaderStatIcon: React.FC<{
  color: string;
  tint: string;
  children: React.ReactNode;
}> = ({ color, tint, children }) => (
  <div
    className="employee-stat-modern-icon shrink-0"
    style={{ backgroundColor: tint, color, boxShadow: `0 8px 18px -6px ${color}55` }}
  >
    {children}
  </div>
);

const DeadlineSvgIcon: React.FC<{
  urgency: "overdue" | "warning" | "normal" | "empty";
}> = ({ urgency }) => {
  const theme = {
    overdue: { color: "#EF4444", tint: "#FEECEC" },
    warning: { color: "#EF4444", tint: "#FEECEC" }, // within 3 days → red
    normal: { color: "#4318FF", tint: "#F4F7FE" },
    empty: { color: "#707EAE", tint: "#F4F7FE" },
  }[urgency];

  return (
    <HeaderStatIcon color={theme.color} tint={theme.tint}>
      <CalendarClock size={18} strokeWidth={2.4} />
    </HeaderStatIcon>
  );
};

const FinancialRatingSvgIcon: React.FC = () => (
  <HeaderStatIcon color="#F59E0B" tint="#FFF8E8">
    <Award size={18} strokeWidth={2.4} />
  </HeaderStatIcon>
);

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
  renderQuarterBadge: (assignmentOrQuarter: QuarterlyReviewAssignment | string) => React.ReactNode;
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
    if (chevronRef.current) {
      gsap.to(chevronRef.current, { x: 3, duration: 0.2, ease: "power2.out" });
    }
  };

  const handleMouseLeave = () => {
    if (!isClickable) return;
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
      className={`employee-stat-card-executive group ${isOverdue || isUrgent
        ? "employee-stat-card-executive-overdue"
        : "employee-stat-card-executive-deadline"
        } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Colored Left Edge Bar */}
      <div className="employee-stat-edge-bar" />

      <div className="flex items-center gap-3">
        <DeadlineSvgIcon urgency={urgencyState} />

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className={`text-[13px] sm:text-sm font-bold tracking-tight leading-snug ${isOverdue || isUrgent ? "text-[#DC2626]" : "text-[#2B3674]"}`}>
              Deadline
            </span>
            {deadlineInfo && renderQuarterBadge(deadlineInfo.assignment)}
          </div>

          {deadlineInfo ? (
            <div className="text-[11px] sm:text-xs font-semibold leading-snug mt-1 flex items-center flex-wrap gap-1">
              <span
                className={
                  isOverdue || isUrgent
                    ? "text-[#DC2626] font-bold"
                    : "text-[#2B3674]"
                }
              >
                {deadlineInfo.deadlineLabel}
              </span>
              <span className={`font-semibold ${isOverdue || isUrgent ? "text-[#DC2626]" : "text-[#2B3674]"}`}>
                {" "}· {isOverdue
                  ? `Overdue by ${Math.abs(days!)}d`
                  : days === 0
                    ? "Due today"
                    : `${days}d left`}
              </span>
            </div>
          ) : (
            <span className="text-[11px] sm:text-xs text-[#A3AED0] font-medium leading-snug mt-1 flex items-center gap-1.5">
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
    if (chevronRef.current) {
      gsap.to(chevronRef.current, { x: 3, duration: 0.2, ease: "power2.out" });
    }
  };

  const handleMouseLeave = () => {
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
      className="employee-stat-card-executive employee-stat-card-executive-rating cursor-pointer group"
    >
      {/* Colored Left Edge Bar */}
      <div className="employee-stat-edge-bar" />

      <div className="flex items-center gap-3">
        <FinancialRatingSvgIcon />

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] sm:text-sm font-bold text-[#2B3674] tracking-tight leading-snug group-hover:text-[#4318FF] transition-colors">
              Financial Rating
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#F4F7FE] text-[#4318FF] border border-[#4318FF]/15">
              Annual
            </span>
          </div>

          <span className="text-[11px] sm:text-xs text-[#707EAE] font-medium leading-snug mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4318FF] shrink-0" />
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
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const hideAdminHeaderCards = isAdminAccess(currentUser);
  const {
    assignments,
    activeAssignment,
    financialYear,
    defaultYear,
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
  const [editingOpenStep, setEditingOpenStep] = useState<number | undefined>(undefined);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  // Scroll lock & background blur for password + security reveal modals
  useEffect(() => {
    if (ratingTarget || revealedModalData) {
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
  }, [ratingTarget, revealedModalData]);

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
      const expiresAt = Date.now() + RATING_REVEAL_DURATION_MS;

      // Do NOT write score into the table while Security View is open — that leaked the
      // rating (e.g. "5") in the blurred background behind the champion modal.
      // Score is only shown inside RevealedRatingModal; table stays locked.

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
    // While Security View modal is open for this row, keep the lock — never show the score in the table.
    const modalOpenForRow = revealedModalData?.rowId === assignment.id;
    const revealed = !modalOpenForRow ? rowRatings[assignment.id] : undefined;
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
    managerComment?: string | null;
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

  /** Resolve performance id from assignment (list row or quarter lookup) — no full GET. */
  const resolvePerformanceId = async (assignment: QuarterlyReviewAssignment): Promise<number | null> => {
    if (assignment.performanceId) {
      return Number(assignment.performanceId);
    }
    const q = (
      assignment.quarter === "Q1" ||
      assignment.quarter === "Q2" ||
      assignment.quarter === "Q3" ||
      assignment.quarter === "Q4" ||
      assignment.quarter === "YEARLY"
    ) ? (assignment.quarter as any) : undefined;
    if (assignment.employeeId && q && assignment.financialYear) {
      try {
        const found = await AppraisalApi.getEmployeePerformance(assignment.employeeId, q, assignment.financialYear);
        return found?.id ? Number(found.id) : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  /** Full record — only for evaluation / flows that need every step at once. */
  const loadRowPerformance = async (assignment: QuarterlyReviewAssignment) => {
    const id = await resolvePerformanceId(assignment);
    if (!id) return null;
    try {
      return await AppraisalApi.getPerformanceById(id);
    } catch {
      return null;
    }
  };

  /**
   * Edit resume: `step` comes from DB (list row). Call only that step GET — no full GET, no local storage.
   */
  const loadResumeEditForm = async (assignment: QuarterlyReviewAssignment) => {
    const id = await resolvePerformanceId(assignment);
    if (!id) return null;
    const openStep = Math.min(Math.max(Number(assignment.step) || 1, 1), 6);
    const stepRes = await AppraisalApi.getPerformanceStep(
      id,
      PERFORMANCE_STEP_PATH[openStep],
    );
    return {
      id: stepRes.id,
      status: stepRes.status,
      form: applyStepDataToForm(emptyReviewFormData, openStep, stepRes.data),
      step: stepRes.step || openStep,
    };
  };

  const handleOpenEdit = async (assignment: QuarterlyReviewAssignment) => {
    scrollToPageTop();
    try {
      const stepLoad = await loadResumeEditForm(assignment);
      setStepperReadOnly(false);
      setEditingForm(stepLoad?.form);
      setEditingOpenStep(stepLoad?.step);
      openAssignment({
        ...assignment,
        performanceId: stepLoad?.id ?? assignment.performanceId,
        step: stepLoad?.step ?? assignment.step,
        assignedBy: assignment.assignedBy,
        assignedDate: assignment.assignedDate,
        deadline: assignment.deadline,
        description: assignment.description,
      });
    } catch (error) {
      message.error(readApiError(error));
      return;
    }
    setTimeout(scrollToPageTop, 50);
  };

  /** View mode: full GET /:id (all steps) — not the per-step APIs. */
  const handleOpenView = async (assignment: QuarterlyReviewAssignment) => {
    scrollToPageTop();
    try {
      const performance = await loadRowPerformance(assignment);
      setStepperReadOnly(true);
      setEditingForm(performance ? toReviewFormData(performance) : undefined);
      setEditingOpenStep(undefined);
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

    // Waiting for reviewer approval — access NOT granted yet
    if (statusUpper === "REQUESTED_FOR_EDIT") {
      return {
        visible: true,
        eligible: true,
        alreadyRequested: true,
        remainingHours: 0,
        tooltip: `Edit request sent to ${assignment.assignedBy}. Waiting for approval — access is not granted yet.`,
      };
    }

    // Edit already granted — use pencil to edit; hide redundant access key
    if (
      statusUpper === "EDIT_GRANTED" ||
      statusUpper === "APPROVED_FOR_EDITING" ||
      statusUpper === "ALLOWED_TO_EDIT"
    ) {
      return hidden;
    }

    const isPending = accessRequests.some(
      (req) =>
        req.assignmentId === assignment.id ||
        (req.quarter === assignment.quarter && req.financialYear === assignment.financialYear),
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

  const filteredAssignments = useMemo(() => {
    if (!debouncedSearch.trim()) return assignments;
    const q = debouncedSearch.toLowerCase().trim();
    return assignments.filter((a) => {
      const quarterMatch = (a.quarter || "").toLowerCase().includes(q);
      const fyMatch = (a.financialYear || "").toLowerCase().includes(q);
      const assignedByMatch = (a.assignedBy || "").toLowerCase().includes(q);
      const statusMatch = (a.status || "").toLowerCase().includes(q);
      const descMatch = (a.description || "").toLowerCase().includes(q);
      return quarterMatch || fyMatch || assignedByMatch || statusMatch || descMatch;
    });
  }, [assignments, debouncedSearch]);

  const totalItems = debouncedSearch.trim() ? filteredAssignments.length : total;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const paginatedAssignments = filteredAssignments;

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
    // Already past employee submission — no deadline countdown (incl. assigner→manager final).
    const closed = new Set([
      "submitted",
      "reviewed",
      "completed",
      "re_submitted",
      "under_review",
      "evaluation_in_progress",
      "awaiting_manager_final_review",
      "performance_received",
    ]);
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
            initialActiveView="matrix"
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
            key={`${activeAssignment.id}-${stepperReadOnly ? "view" : "edit"}-${editingOpenStep ?? "auto"}`}
            assignment={activeAssignment}
            initialFormData={editingForm}
            initialStep={stepperReadOnly ? undefined : editingOpenStep}
            readOnly={stepperReadOnly}
            onBack={() => {
              scrollToPageTop();
              setStepperReadOnly(false);
              setEditingForm(undefined);
              setEditingOpenStep(undefined);
              closeAssignment();
              reloadAssignments();
              setTimeout(scrollToPageTop, 50);
            }}
            onGoToEvaluation={async () => {
              scrollToPageTop();
              try {
                const targetAssignment = activeAssignment;
                let resolvedReviewId = targetAssignment.reviewId ?? 0;
                let resolvedReviewStatus =
                  targetAssignment.reviewStatus || targetAssignment.status || "";

                // Do not GET /employee-performance here. Scores load only after the password.
                if (!resolvedReviewId && targetAssignment.employeeId) {
                  try {
                    const list = await AppraisalApi.getManagerReviewList(
                      targetAssignment.employeeId,
                      {
                        financialYear: targetAssignment.financialYear,
                        quarter:
                          typeof targetAssignment.quarter === "string"
                            ? targetAssignment.quarter
                            : undefined,
                      },
                    );
                    const match = (list.data || []).find(
                      (row: { id?: number; quarter?: string; financialYear?: string; status?: string }) =>
                        row.financialYear === targetAssignment.financialYear &&
                        (typeof targetAssignment.quarter !== "string" ||
                          row.quarter === targetAssignment.quarter),
                    );
                    if (match?.id) {
                      resolvedReviewId = match.id;
                      resolvedReviewStatus = match.status || resolvedReviewStatus;
                    }
                  } catch {
                    /* keep existing ids */
                  }
                }

                if (!resolvedReviewId) {
                  message.error(
                    "This evaluation is not ready to open yet. Please refresh and try again.",
                  );
                  return;
                }

                setViewingForm(editingForm);
                setViewingPerformanceStatus(targetAssignment.status || "");
                setViewingReviewStatus(resolvedReviewStatus);
                setViewingEvaluation(undefined);
                setViewingAssignment({
                  ...targetAssignment,
                  reviewId: resolvedReviewId,
                });
                setStepperReadOnly(false);
                setEditingForm(undefined);
                closeAssignment();
              } catch (error) {
                message.error(readApiError(error));
              }
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
            <button
              type="button"
              onClick={() => navigate("/employee-dashboard")}
              className="group flex items-center gap-2 text-[#A3AED0] hover:text-[#4318FF] transition-all mb-2 w-fit cursor-pointer"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span className="text-[11px] font-black uppercase tracking-widest pl-1">
                Back
              </span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight w-fit">
              <span className="manager-review-title-anim">Appraisal</span>
            </h1>
          </div>

          {/* Deadline + Financial Rating cards — hidden for Admin/CEO/GM */}
          {!hideAdminHeaderCards && (
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
          )}
        </div>

        {/* MAIN SECTION: QUARTERLY REVIEW HISTORY */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card min-h-[calc(100vh-230px)]">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-4 mb-6">
            <div
              ref={employeeFiltersDockRef}
              className="manager-review-filters-dock flex items-center gap-1.5 flex-nowrap shrink-0 justify-end"
            >
              <div className="w-28 sm:w-32 lg:w-36 shrink-0 filter-item-stagger-1">
                <SearchBox
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => {
                    setSearchTerm("");
                    setDebouncedSearch("");
                  }}
                  onDebounce={setDebouncedSearch}
                  placeholder="Search..."
                  variant="outlined"
                  inputSize="md"
                  containerClassName="w-full rounded-xl manager-review-search-box"
                  className="text-xs manager-review-search-input"
                  allowClear
                />
              </div>

              {/* Financial Year Dropdown */}
              <Dropdown
                className="shrink-0 filter-item-stagger-2"
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
                maxLabelWidth="max-w-[95px]"
                buttonClassName={`manager-review-filter-btn filter-btn-fy ${
                  financialYear && financialYear !== defaultYear ? "filter-active" : ""
                } rounded-xl px-2.5 py-1.5 text-xs font-semibold min-w-[145px]`}
              />

              {/* Quarters Dropdown */}
              <Dropdown
                className="shrink-0 filter-item-stagger-3"
                placeholder="All Quarters"
                allowClear={false}
                defaultValue=""
                prefixIcon={
                  <span className="filter-icon-badge filter-icon-badge-quarters">
                    <Clock size={13} />
                  </span>
                }
                options={quarterOptions}
                value={quarter}
                onChange={(val) => setQuarter(val || AppraisalFilterAll.ALL)}
                onOpen={loadQuarters}
                loading={quartersLoading && quarterOptions.length === 0}
                maxLabelWidth="max-w-[85px]"
                buttonClassName={`manager-review-filter-btn filter-btn-quarters ${
                  quarter && quarter !== AppraisalFilterAll.ALL ? "filter-active" : ""
                } rounded-xl px-2.5 py-1.5 text-xs font-semibold min-w-[122px]`}
              />

              {/* Status Dropdown */}
              <Dropdown
                className="shrink-0 filter-item-stagger-4"
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
                  { value: "ASSIGNED", label: "Assigned" },
                  { value: "REASSIGNED", label: "Re-Assigned" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "EVALUATION_IN_PROGRESS", label: "Evaluation In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                maxLabelWidth="max-w-[75px]"
                contentWidth
                align="right"
                buttonClassName={`manager-review-filter-btn filter-btn-status ${
                  statusFilter ? "filter-active" : ""
                } rounded-xl px-2.5 py-1.5 text-xs font-semibold min-w-[110px]`}
              />

              {/* Clear Button */}
              {(hasActiveFilters || Boolean(searchTerm) || Boolean(debouncedSearch)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearch("");
                    handleClearFilters();
                  }}
                  className="manager-review-clear-btn shrink-0"
                  title="Clear all filters"
                >
                  <RotateCcw size={14} className="filter-clear-icon shrink-0" />
                </Button>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            {filteredAssignments.length > 0 ? (
              /* STATE 2: Populated Table with Styled Brand Layout */
              <div className="space-y-4">
                <div className="hidden sm:block">
                  <div className="quarterly-review-table-card">
                    <div className="quarterly-review-table-scroll">
                      <table className="quarterly-review-table qr-header-indigo">
                        <thead>
                          <tr>
                            <th className="text-center min-w-[70px]">Sl No</th>
                            <th className="text-left min-w-[170px]">Quarter</th>
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
                                <td>{renderQuarterBadge(assignment)}</td>

                                {/* 2. Financial Year */}
                                <td>
                                  <span className="qr-fy-pill">{assignment.financialYear}</span>
                                </td>

                                {/* 3. Assigned By */}
                                <td className="text-center">
                                  <span className="qr-assigned-by-pill">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    {assignment.assignedBy || "—"}
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
                                  {renderStatusBadge(assignment.status, assignment.reassignCount)}
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
                                            ["EDIT_GRANTED", "APPROVED_FOR_EDITING", "ALLOWED_TO_EDIT"].includes(
                                              assignment.status.toUpperCase(),
                                            )
                                              ? `Edit access granted for ${assignment.quarter}. Edit and resubmit.`
                                              : assignment.status.toUpperCase() === "REQUESTED_FOR_EDIT"
                                                ? `Edit request pending approval for ${assignment.quarter}.`
                                                : elig.alreadyRequested
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
                            {renderQuarterBadge(assignment)}
                            <span className="qr-fy-pill">
                              {assignment.financialYear}
                            </span>
                          </div>
                          {renderStatusBadge(assignment.status, assignment.reassignCount)}
                        </div>

                        <div className="text-xs text-[#64748B] space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span>Assigned by:</span>
                            <span className="qr-assigned-by-pill">
                              <UserCheck className="w-3 h-3" />
                              {assignment.assignedBy || "—"}
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
                                  ["EDIT_GRANTED", "APPROVED_FOR_EDITING", "ALLOWED_TO_EDIT"].includes(
                                    assignment.status.toUpperCase(),
                                  )
                                    ? `Edit access granted for ${assignment.quarter}. Edit and resubmit.`
                                    : assignment.status.toUpperCase() === "REQUESTED_FOR_EDIT"
                                      ? `Edit request pending approval for ${assignment.quarter}.`
                                      : elig.alreadyRequested
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
              className="eval-themed-modal-card max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-[#2B3674] relative"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeRatingModal}
                className="absolute top-4 right-4 text-[#A3AED0] hover:text-[#2B3674] w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F4F7FE] transition-colors z-20 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <form onSubmit={(event) => void revealRowRating(event)} className="relative z-10 space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#4318FF] flex items-center justify-center text-white shadow-lg shadow-[#4318FF]/25 mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[#2B3674]">
                    Authenticate Rating Access
                  </h3>
                  <p className="text-xs text-[#707EAE] max-w-xs mx-auto leading-relaxed">
                    Enter your login password to see the final rating and average for {formatQuarterDisplay(ratingTarget.quarter)}.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B3674] mb-1.5">
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
                      className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-white border border-[#E0E5F2] text-sm text-[#2B3674] placeholder-[#A3AED0] focus:outline-none focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 transition-all"
                      autoFocus
                    />
                    <Lock className="w-4 h-4 text-[#A3AED0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowRatingPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3AED0] hover:text-[#4318FF] cursor-pointer"
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
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={closeRatingModal}
                    className="flex-1 py-3 rounded-xl border border-[#E0E5F2] text-[#2B3674] text-xs font-semibold hover:bg-[#F4F7FE] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={unlockingRating}
                    className="flex-1 py-3 rounded-xl bg-[#4318FF] hover:bg-[#3311CC] text-white text-xs font-bold shadow-lg shadow-[#4318FF]/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
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
