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
} from "lucide-react";
import {
  QuarterlyReviewAssignment,
  ManagerQuarterlyReviewRecord,
} from "../../types/appraisal.types";
import { useEmployeeAppraisal } from "../../hooks/useEmployeeAppraisal";
import QuarterlyReviewStepper from "./QuarterlyReviewStepper";
import EvaluationPanel from "../manager/EvaluationPanel";
import RatingVerificationModal from "./RatingVerificationModal";
import AnnualRatingView from "./AnnualRatingView";
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
  const raw = (status || "").trim().toLowerCase();
  let badgeClass = "qr-status-not-started";
  let label = "Assigned";

  if (raw === "assigned" || raw === "not_started") {
    badgeClass = "qr-status-not-started";
    label = "Assigned";
  } else if (raw === "in_progress") {
    badgeClass = "qr-status-in-progress";
    label = "In Progress";
  } else if (raw === "submitted") {
    badgeClass = "qr-status-submitted";
    label = "Submitted";
  } else if (raw === "completed" || raw === "reviewed") {
    badgeClass = "qr-status-completed";
    label = "Completed";
  }

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
    hasActiveFilters,
    setFinancialYear,
    setQuarter,
    setStatusFilter,
    handleClearFilters,
    openAssignment,
    closeAssignment,
    submitReview,
  } = useEmployeeAppraisal();

  // Viewing assignment in EvaluationPanel
  const [viewingAssignment, setViewingAssignment] = useState<QuarterlyReviewAssignment | null>(null);

  // Annual Rating Page and Verification states
  const [isAnnualRatingOpen, setIsAnnualRatingOpen] = useState<boolean>(false);
  const [isRatingAuthModalOpen, setIsRatingAuthModalOpen] = useState<boolean>(false);
  const [isRatingAuthenticated, setIsRatingAuthenticated] = useState<boolean>(false);

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
  const handleOpenEdit = (assignment: QuarterlyReviewAssignment) => {
    scrollToPageTop();
    openAssignment(assignment);
    setTimeout(scrollToPageTop, 50);
  };

  const handleOpenView = (assignment: QuarterlyReviewAssignment) => {
    scrollToPageTop();
    setViewingAssignment(assignment);
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

  // Nearest pending deadline (upcoming first, otherwise most recent overdue)
  const deadlineInfo = useMemo(() => {
    const MONTHS: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const parse = (s: string): Date | null => {
      const [d, m, y] = (s || "").split("-");
      const mi = MONTHS[(m || "").slice(0, 3).toLowerCase()];
      if (!d || mi === undefined || !y) return null;
      return new Date(Number(y), mi, Number(d));
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = assignments
      .filter((a) => a.status === "assigned" || a.status === "in_progress")
      .map((a) => ({ a, date: parse(a.deadline) }))
      .filter((x): x is { a: QuarterlyReviewAssignment; date: Date } => x.date !== null);

    if (pending.length === 0) return null;

    const upcoming = pending
      .filter((x) => x.date >= today)
      .sort((p, q) => p.date.getTime() - q.date.getTime());
    const overdue = pending
      .filter((x) => x.date < today)
      .sort((p, q) => q.date.getTime() - p.date.getTime());
    const pick = upcoming[0] ?? overdue[0];
    const days = Math.round((pick.date.getTime() - today.getTime()) / 86400000);

    return { assignment: pick.a, days, pendingCount: pending.length };
  }, [assignments]);

  // If viewing assignment, display same luxury view page with hidden score parameters
  if (viewingAssignment) {
    const viewRecord: ManagerQuarterlyReviewRecord = {
      name: "Current Employee",
      id: viewingAssignment.id,
      role: "Software Engineer",
      quarter: viewingAssignment.quarter,
      financialYear: viewingAssignment.financialYear,
      fromDate: "01-04-2026",
      toDate: viewingAssignment.deadline,
      assignedOn: viewingAssignment.assignedDate,
      assignedBy: viewingAssignment.assignedBy,
      finalRating: "4.0",
      status:
        viewingAssignment.status === "submitted" ||
        viewingAssignment.status === "completed" ||
        viewingAssignment.status === "reviewed"
          ? "COMPLETED"
          : "IN_PROGRESS",
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
            mode="view"
            hideScoreParameters={true}
            onBack={() => {
              scrollToPageTop();
              setViewingAssignment(null);
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
            assignment={activeAssignment}
            onBack={() => {
              scrollToPageTop();
              closeAssignment();
              setTimeout(scrollToPageTop, 50);
            }}
            onSubmitSuccess={() => submitReview(activeAssignment.id)}
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
              className={`manager-review-glass-card employee-header-stat-card ${
                deadlineInfo ? "cursor-pointer" : "cursor-default"
              }`}
              title={deadlineInfo ? "Click to open review assignment" : undefined}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`employee-header-stat-icon-wrap ${
                    deadlineInfo && deadlineInfo.days < 0
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
                <div className="employee-header-stat-icon-wrap bg-white/90 border border-white/90 text-[#6D5284] group-hover:bg-[#6D5284] group-hover:text-white transition-colors duration-200 shadow-2xs">
                  <Award className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[13px] sm:text-sm font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#6D5284] transition-colors">
                    Financial Rating
                  </span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#6D5284] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
            </div>
          </div>
        </div>

        {/* MAIN SECTION: QUARTERLY REVIEW HISTORY */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card">
          {/* Card Header & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F7EEF2] text-[#6D5284] flex items-center justify-center shrink-0">
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
                defaultValue="FY 2026-27"
                prefixIcon={<Calendar size={15} />}
                options={[
                  { value: "FY 2026-27", label: "FY 2026-27" },
                  { value: "FY 2025-26", label: "FY 2025-26" },
                ]}
                value={financialYear}
                onChange={setFinancialYear}
                maxLabelWidth="max-w-[105px]"
                buttonClassName="bg-white border border-[#EBCED6] hover:border-gray-300 rounded-2xl px-3 py-2 text-sm font-medium text-[#64748B] min-w-[140px] shadow-none"
              />

              {/* Quarter Dropdown */}
              <Dropdown
                className="shrink-0"
                placeholder="Quarter"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Clock size={15} />}
                options={[
                  { value: "Q1", label: "Quarter 1" },
                  { value: "Q2", label: "Quarter 2" },
                  { value: "Q3", label: "Quarter 3" },
                  { value: "Q4", label: "Quarter 4" },
                ]}
                value={quarter}
                onChange={setQuarter}
                maxLabelWidth="max-w-[95px]"
                buttonClassName="bg-white border border-[#EBCED6] hover:border-gray-300 rounded-2xl px-3 py-2 text-sm font-medium text-[#64748B] min-w-[120px] shadow-none"
              />

              {/* Status Dropdown */}
              <Dropdown
                className="shrink-0"
                placeholder="Status"
                allowClear={true}
                defaultValue=""
                prefixIcon={<ClipboardList size={15} />}
                options={[
                  { value: "assigned", label: "Assigned" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "submitted", label: "Submitted" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                maxLabelWidth="max-w-[95px]"
                buttonClassName="bg-white border border-[#EBCED6] hover:border-gray-300 rounded-2xl px-3 py-2 text-sm font-medium text-[#64748B] min-w-[120px] shadow-none"
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
                            <th className="text-center min-w-[140px]">Deadline</th>
                            <th className="text-center min-w-[130px]">Status</th>
                            <th className="text-center min-w-[110px] qr-sticky-action-th">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAssignments.map((assignment) => {
                            const isSubmittedOrReviewed =
                              assignment.status === "submitted" ||
                              assignment.status === "completed" ||
                              assignment.status === "reviewed";

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
                                    className={`qr-assigned-by-pill ${
                                      assignment.assignedBy.toLowerCase() === "admin"
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

                                {/* 4. Deadline */}
                                <td className="text-center">
                                  <span className="qr-date-chip">
                                    <Calendar className="w-3.5 h-3.5 text-[#6D5284] mr-1.5 inline" />
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
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(assignment)}
                                      className="qr-action-icon-btn qr-action-btn-edit"
                                      title={`Edit review for ${assignment.quarter}`}
                                      aria-label={`Edit review for ${assignment.quarter}`}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
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
                            activeClassName="!bg-[#6D5284] !text-white shadow-xs font-black shadow-[#6D5284]/25"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Card Layout for Table Rows */}
                <div className="sm:hidden space-y-3">
                  {paginatedAssignments.map((assignment) => {
                    const isSubmittedOrReviewed =
                      assignment.status === "submitted" ||
                      assignment.status === "completed" ||
                      assignment.status === "reviewed";

                    return (
                      <Card
                        key={assignment.id}
                        className="p-4 rounded-2xl border border-[#EBCED6] bg-white shadow-xs space-y-3"
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
                              className={`qr-assigned-by-pill ${
                                assignment.assignedBy.toLowerCase() === "admin"
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
                            <span>Deadline:</span>
                            <span className="qr-date-chip">
                              <Calendar className="w-3 h-3 text-[#6D5284] mr-1 inline" />
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
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(assignment)}
                            className="qr-action-btn-edit flex-1 justify-center py-2 text-xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* STATE 1: Empty state matching reference image illustration */
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center px-4">
                {/* Clean illustration vector matching reference */}
                <div className="w-64 sm:w-72 max-w-full mb-6">
                  <svg
                    viewBox="0 0 240 180"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto drop-shadow-sm mx-auto"
                  >
                    <ellipse cx="120" cy="150" rx="90" ry="18" fill="#FAF6F8" />
                    <rect
                      x="50"
                      y="30"
                      width="140"
                      height="100"
                      rx="16"
                      fill="#FFFFFF"
                      stroke="#E2E8F0"
                      strokeWidth="2"
                    />
                    <path
                      d="M70 45 L170 45"
                      stroke="#6D5284"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M70 70 L150 70"
                      stroke="#CBD5E1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M70 90 L130 90"
                      stroke="#E2E8F0"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="155" cy="95" r="16" fill="#FAF6F8" stroke="#6D5284" strokeWidth="2" />
                    <path
                      d="M150 95 L154 99 L162 91"
                      stroke="#6D5284"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default AppraisalDashboard;
