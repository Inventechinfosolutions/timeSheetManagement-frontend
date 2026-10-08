import React, { useState, useMemo, useEffect } from "react";
import {
  Award,
  BarChart3,
  Calendar,
  Clock,
  ClipboardList,
  Pencil,
  Eye,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  CalendarClock,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import {
  QuarterlyReviewAssignment,
  ManagerQuarterlyReviewRecord,
  AccessRequest,
  ReviewFormData,
} from "../../types/appraisal.types";
import {
  mockQuarterlyReviewAssignments,
  initialMockAccessRequests,
} from "../../mockData/quarterlyReview.mock";
import { useEmployeeAppraisal } from "../../hooks/useEmployeeAppraisal";
import { AppraisalApi, readApiError, toReviewFormData } from "../../services/appraisal.api";
import QuarterlyReviewStepper from "./QuarterlyReviewStepper";
import EvaluationPanel from "../manager/EvaluationPanel";
import RatingVerificationModal from "./RatingVerificationModal";
import AnnualRatingView from "./AnnualRatingView";
import AccessRequestModal from "./AccessRequestModal";
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

  // Annual Rating Page and Verification states
  const [isAnnualRatingOpen, setIsAnnualRatingOpen] = useState<boolean>(false);
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
  const handleOpenEdit = async (assignment: QuarterlyReviewAssignment) => {
    scrollToPageTop();
    try {
      const performance = await AppraisalApi.getPerformanceForAssignment(
        assignment.employeeId,
        assignment.quarter,
        assignment.financialYear,
      );
      setEditingForm(performance ? toReviewFormData(performance) : undefined);
      openAssignment({
        ...assignment,
        performanceId: performance?.id ?? assignment.performanceId,
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
      const [performance, review] = await Promise.all([
        AppraisalApi.getPerformanceForAssignment(
          assignment.employeeId,
          assignment.quarter,
          assignment.financialYear,
        ),
        AppraisalApi.getReviewById(Number(assignment.id)),
      ]);
      setViewingForm(performance ? toReviewFormData(performance) : undefined);
      setViewingPerformanceStatus(performance?.status || "");
      setViewingReviewStatus(review.status || "");
      setViewingEvaluation(undefined);
      setViewingAssignment(assignment);
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

  const handleVerificationSuccess = () => {
    setIsRatingAuthModalOpen(false);
    setIsAnnualRatingOpen(true);
    setTimeout(scrollToPageTop, 50);
  };

  // Access Request Modal & State
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(initialMockAccessRequests);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);
  const [selectedAccessAssignment, setSelectedAccessAssignment] = useState<QuarterlyReviewAssignment | null>(null);
  const [selectedAccessRemainingHours, setSelectedAccessRemainingHours] = useState<number>(24);

  const checkAccessEligibility = (assignment: QuarterlyReviewAssignment) => {
    const hidden = {
      visible: false,
      eligible: false,
      alreadyRequested: false,
      remainingHours: 0,
      tooltip: "",
    };
    const twoDayMs = 48 * 60 * 60 * 1000;
    if (assignment.status.toUpperCase() !== "SUBMITTED" || !assignment.submittedAt) {
      return hidden;
    }
    const submittedTime = new Date(assignment.submittedAt).getTime();
    if (Number.isNaN(submittedTime) || Date.now() - submittedTime > twoDayMs) {
      return hidden;
    }

    const remainingHours = Math.max(1, Math.round((twoDayMs - (Date.now() - submittedTime)) / (3600 * 1000)));
    const isAlreadyRequested = accessRequests.some(
      (req) => req.assignmentId === assignment.id || (req.quarter === assignment.quarter && req.financialYear === assignment.financialYear)
    );
    if (isAlreadyRequested) {
      return {
        visible: true,
        eligible: false,
        alreadyRequested: true,
        remainingHours: 0,
        tooltip: `Access request already sent to ${assignment.assignedBy}. Status: Pending Approval.`,
      };
    }

    return {
      visible: true,
      eligible: true,
      alreadyRequested: false,
      remainingHours,
      tooltip: `Request edit access from ${assignment.assignedBy} (~${remainingHours}h remaining in the 2-day window).`,
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

  const handleSubmitAccessRequest = (newRequest: AccessRequest) => {
    setAccessRequests((prev) => [newRequest, ...prev]);
    message.success(
      `Access request for ${newRequest.quarter} successfully routed to ${newRequest.recipientRole}!`,
      2.5
    );
  };

  // Ensure scroll to top whenever entering view or edit screen
  useEffect(() => {
    if (activeAssignment || viewingAssignment || isAnnualRatingOpen) {
      scrollToPageTop();
      const raf = requestAnimationFrame(scrollToPageTop);
      const t = setTimeout(scrollToPageTop, 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
  }, [activeAssignment, viewingAssignment, isAnnualRatingOpen]);

  // Pagination state (10 items per page, right-aligned)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [financialYear, quarter, statusFilter]);

  const totalItems = assignments.length;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return assignments.slice(startIndex, startIndex + pageSize);
  }, [assignments, currentPage, pageSize]);

  // Nearest deadline among assignments that are loaded and not finally submitted.
  const deadlineInfo = useMemo(() => {
    const MONTHS: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const parse = (value: string): Date | null => {
      const parts = (value || "").trim().split("-");
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
    const finished = new Set(["submitted", "reviewed", "completed"]);

    const pending = assignments
      .filter((assignment) => !finished.has((assignment.status || "").toLowerCase()))
      .map((assignment) => ({ assignment, date: parse(assignment.deadline) }))
      .filter((item): item is { assignment: QuarterlyReviewAssignment; date: Date } => item.date !== null)
      .sort((left, right) => {
        const leftDistance = Math.abs(left.date.getTime() - today.getTime());
        const rightDistance = Math.abs(right.date.getTime() - today.getTime());
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;
        return left.date.getTime() - right.date.getTime();
      });

    if (pending.length === 0) return null;

    const pick = pending[0];
    const days = Math.round((pick.date.getTime() - today.getTime()) / 86400000);
    return { assignment: pick.assignment, days, pendingCount: pending.length };
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
      reviewId: Number(viewingAssignment.id),
      reviewStatus: viewingReviewStatus,
      performanceStatus: viewingPerformanceStatus,
      submission: viewingForm,
      status: viewingReviewStatus,
    };

    return (
      <div className="w-full min-h-screen relative overflow-hidden font-sans p-4 sm:p-6 lg:p-8 manager-review-bg-container">
        {/* LUXURY BACKGROUND CANVAS */}
        <div className="manager-review-canvas" aria-hidden="true">
          <div className="manager-review-dot-grid" />
          <div className="manager-review-aurora-tr" />
          <div className="manager-review-aurora-tl" />
          <div className="manager-review-aurora-br" />
          <div className="manager-review-aurora-bl" />
          <div className="manager-review-wave-top" />
          <div className="manager-review-wave-bottom" />
          <div className="manager-review-star-1" />
          <div className="manager-review-star-2" />
          <div className="manager-review-star-3" />
        </div>

        <div className="relative z-10">
          <EvaluationPanel
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

  // If annual rating view is open, render AnnualRatingView
  if (isAnnualRatingOpen) {
    return (
      <AnnualRatingView
        onBack={() => {
          scrollToPageTop();
          setIsAnnualRatingOpen(false);
          setTimeout(scrollToPageTop, 50);
        }}
        employeeName="Current Employee"
        employeeRole="Software Engineer"
      />
    );
  }

  // If stepper is open, display 6-step review UI
  if (activeAssignment) {
    return (
      <div className="w-full min-h-screen relative overflow-hidden font-sans p-4 sm:p-6 lg:p-8 manager-review-bg-container">
        {/* LUXURY BACKGROUND CANVAS (All SVGs & animations managed and loaded via CSS) */}
        <div className="manager-review-canvas" aria-hidden="true">
          <div className="manager-review-dot-grid" />
          <div className="manager-review-aurora-tr" />
          <div className="manager-review-aurora-tl" />
          <div className="manager-review-aurora-br" />
          <div className="manager-review-aurora-bl" />
          <div className="manager-review-wave-top" />
          <div className="manager-review-wave-bottom" />
          <div className="manager-review-star-1" />
          <div className="manager-review-star-2" />
          <div className="manager-review-star-3" />
          <div className="manager-review-star-4" />
          <div className="manager-review-star-5" />
        </div>

        <div className="relative z-10">
          <QuarterlyReviewStepper
            key={activeAssignment.id}
            assignment={activeAssignment}
            initialFormData={editingForm}
            onBack={() => {
              scrollToPageTop();
              setEditingForm(undefined);
              closeAssignment();
              reloadAssignments();
              setTimeout(scrollToPageTop, 50);
            }}
            onSubmitSuccess={() => {
              submitReview(activeAssignment.id);
              reloadAssignments();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden font-sans p-4 sm:p-6 lg:p-8 manager-review-bg-container">
      {/* LUXURY BACKGROUND CANVAS (All SVGs & animations managed and loaded via CSS) */}
      <div className="manager-review-canvas" aria-hidden="true">
        <div className="manager-review-dot-grid" />
        <div className="manager-review-aurora-tr" />
        <div className="manager-review-aurora-tl" />
        <div className="manager-review-aurora-br" />
        <div className="manager-review-aurora-bl" />
        <div className="manager-review-wave-top" />
        <div className="manager-review-wave-bottom" />
        <div className="manager-review-star-1" />
        <div className="manager-review-star-2" />
        <div className="manager-review-star-3" />
        <div className="manager-review-star-4" />
        <div className="manager-review-star-5" />
      </div>

      {/* FOREGROUND CONTENT (z-10 layer for crisp interactivity and clarity) */}
      <div className="relative z-10">
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
            {/* DEADLINE CARD */}
            <div
              onClick={() => {
                if (deadlineInfo) {
                  handleOpenEdit(deadlineInfo.assignment);
                }
              }}
              className={`manager-review-glass-card employee-header-stat-card ${deadlineInfo ? "cursor-pointer" : "cursor-default"
                }`}
              title={deadlineInfo ? "Click to open review assignment" : undefined}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`employee-header-stat-icon-wrap ${deadlineInfo && deadlineInfo.days < 0
                      ? "bg-[#FEF2F2] border border-red-200 text-[#DC2626]"
                      : deadlineInfo && deadlineInfo.days <= 3
                        ? "bg-[#FFFBEB] border border-amber-200 text-[#D97706]"
                        : "bg-white/90 border border-white/90 text-[#0F172A]"
                    }`}
                >
                  <CalendarClock className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] sm:text-sm font-bold text-[#0F172A] tracking-tight leading-snug">
                      Deadline
                    </span>
                    {deadlineInfo && renderQuarterBadge(deadlineInfo.assignment.quarter)}
                  </div>

                  {deadlineInfo ? (
                    <div className="text-[11px] sm:text-xs font-semibold leading-snug mt-1">
                      <span
                        className={
                          deadlineInfo.days < 0
                            ? "text-[#DC2626]"
                            : deadlineInfo.days <= 3
                              ? "text-[#D97706]"
                              : "text-[#0F172A]"
                        }
                      >
                        {deadlineInfo.assignment.deadline}
                      </span>
                      <span className="text-[#94A3B8] font-normal">
                        {" "}· {deadlineInfo.days < 0
                          ? `Overdue by ${Math.abs(deadlineInfo.days)}d`
                          : deadlineInfo.days === 0
                            ? "Due today"
                            : `${deadlineInfo.days}d left`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] sm:text-xs text-[#94A3B8] font-medium leading-snug mt-1">
                      No pending reviews
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0 ml-1.5" />
            </div>

            {/* FINANCIAL RATING CARD */}
            <div
              onClick={handleOpenAnnualRating}
              className="manager-review-glass-card employee-header-stat-card cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              title="Click to view Financial Rating breakdown & calculation"
            >
              <div className="flex items-center gap-3">
                <div className="employee-header-stat-icon-wrap bg-white/90 border border-white/90 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-200 shadow-2xs">
                  <Award className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[13px] sm:text-sm font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#2563EB] transition-colors">
                    Financial Rating
                  </span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
            </div>
          </div>
        </div>

        {/* MAIN SECTION: QUARTERLY REVIEW HISTORY */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card">
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
            <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto no-scrollbar py-1.5 manager-review-filters-bar">
              {/* Financial Year Dropdown */}
              <Dropdown
                className="shrink-0"
                placeholder="Financial Year"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Calendar size={15} />}
                options={yearOptions}
                value={financialYear}
                onChange={setFinancialYear}
                onOpen={loadFinancialYears}
                loading={yearsLoading}
                maxLabelWidth="max-w-[105px]"
                buttonClassName="bg-white/90 border border-blue-200/80 hover:border-blue-500 rounded-2xl px-3 py-2 text-sm font-medium text-[#64748B] min-w-[140px] shadow-none hover:bg-blue-50/40"
              />

              {/* Quarter Dropdown */}
              <Dropdown
                className="shrink-0"
                placeholder="Quarter"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Clock size={15} />}
                options={quarterOptions}
                value={quarter}
                onChange={setQuarter}
                onOpen={loadQuarters}
                loading={quartersLoading && quarterOptions.length === 0}
                maxLabelWidth="max-w-[95px]"
                buttonClassName="bg-white/90 border border-blue-200/80 hover:border-blue-500 rounded-2xl px-3 py-2 text-sm font-medium text-[#64748B] min-w-[120px] shadow-none hover:bg-blue-50/40"
              />

              {/* Status Dropdown */}
              <Dropdown
                className="shrink-0"
                placeholder="Status"
                allowClear={true}
                defaultValue=""
                prefixIcon={<ClipboardList size={15} />}
                options={[
                  { value: "NOT_STARTED", label: "Not Started" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "COMPLETED", label: "Completed" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                maxLabelWidth="max-w-[95px]"
                buttonClassName="bg-white/90 border border-blue-200/80 hover:border-blue-500 rounded-2xl px-3 py-2 text-sm font-medium text-[#64748B] min-w-[120px] shadow-none hover:bg-blue-50/40"
              />

              {/* Clear Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<RotateCcw size={14} className="text-[#94A3B8]" />}
                  onClick={handleClearFilters}
                  className="text-[#94A3B8] hover:text-[#64748B] font-medium !shadow-none shrink-0 whitespace-nowrap"
                >
                  Clear
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
                            <th className="text-left min-w-[110px]">Quarter</th>
                            <th className="text-left min-w-[150px]">Financial Year</th>
                            <th className="text-center min-w-[130px]">Assigned By</th>
                            <th className="text-center min-w-[140px]">Assigned Date</th>
                            <th className="text-center min-w-[140px]">Deadline</th>
                            <th className="text-center min-w-[130px]">Status</th>
                            <th className="text-center min-w-[140px] qr-sticky-action-th">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAssignments.map((assignment) => {
                            return (
                              <tr key={assignment.id}>
                                {/* 1. Quarter with Dedicated Color */}
                                <td>{renderQuarterBadge(assignment.quarter)}</td>

                                {/* 2. Financial Year */}
                                <td>
                                  <span className="qr-fy-pill">{assignment.financialYear}</span>
                                </td>

                                {/* 3. Assigned By */}
                                <td className="text-center">
                                  <span
                                    className={`qr-assigned-by-pill ${assignment.assignedBy.toLowerCase() === "admin"
                                        ? "qr-assigned-by-admin"
                                        : ""
                                      }`}
                                  >
                                    {assignment.assignedBy.toLowerCase() === "admin" ? (
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    ) : (
                                      <UserCheck className="w-3.5 h-3.5" />
                                    )}
                                    {assignment.assignedBy}
                                  </span>
                                </td>

                                <td className="text-center">
                                  <span className="qr-date-chip">
                                    <Calendar className="w-3.5 h-3.5 text-[#A36361] mr-1.5 inline" />
                                    {assignment.assignedDate}
                                  </span>
                                </td>

                                <td className="text-center">
                                  <span className="qr-date-chip">
                                    <Calendar className="w-3.5 h-3.5 text-[#A36361] mr-1.5 inline" />
                                    {assignment.deadline}
                                  </span>
                                </td>

                                {/* 5. Status */}
                                <td className="text-center">
                                  {renderStatusBadge(assignment.status)}
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
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(assignment)}
                                      className="qr-action-icon-btn qr-action-btn-edit"
                                      title={`Edit review for ${assignment.quarter}`}
                                      aria-label={`Edit review for ${assignment.quarter}`}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
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
                                          className={`qr-action-icon-btn qr-action-btn-access ${
                                            elig.alreadyRequested
                                              ? "qr-action-btn-access-requested"
                                              : elig.eligible
                                              ? "qr-action-btn-access-enabled"
                                              : "qr-action-btn-access-disabled"
                                          }`}
                                          title={elig.tooltip}
                                          aria-label={
                                            elig.alreadyRequested
                                              ? `Access requested for ${assignment.quarter}`
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
                    return (
                      <Card
                        key={assignment.id}
                        className="p-4 rounded-2xl border border-[#BFDBFE]/60 bg-white shadow-xs space-y-3"
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
                              className={`qr-assigned-by-pill ${assignment.assignedBy.toLowerCase() === "admin"
                                  ? "qr-assigned-by-admin"
                                  : ""
                                }`}
                            >
                              {assignment.assignedBy.toLowerCase() === "admin" ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              {assignment.assignedBy}
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
                            <span className="qr-date-chip">
                              <Calendar className="w-3 h-3 text-[#A36361] mr-1 inline" />
                              {assignment.deadline}
                            </span>
                          </div>
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
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(assignment)}
                            className="qr-action-btn-edit flex-1 justify-center py-2 text-xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
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
                                className={`qr-action-icon-btn qr-action-btn-access !h-8 !w-8 justify-center shrink-0 ${
                                  elig.alreadyRequested
                                    ? "qr-action-btn-access-requested"
                                    : elig.eligible
                                    ? "qr-action-btn-access-enabled"
                                    : "qr-action-btn-access-disabled"
                                }`}
                                title={elig.tooltip}
                                aria-label={
                                  elig.alreadyRequested
                                    ? `Access requested for ${assignment.quarter}`
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
                <div className="relative mb-6">
                  <div className="appraisal-empty-glow" />
                  <div className="appraisal-empty-illustration" aria-hidden="true" />
                </div>
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
      />

    </div>
  );
};

export default AppraisalDashboard;
