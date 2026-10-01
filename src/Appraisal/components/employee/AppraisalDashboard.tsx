import React from "react";
import {
  Award,
  BarChart3,
  Calendar,
  Clock,
  ClipboardList,
  Edit3,
  RotateCcw,
} from "lucide-react";
import { QuarterlyReviewAssignment } from "../../types/appraisal.types";
import { useEmployeeAppraisal } from "../../hooks/useEmployeeAppraisal";
import QuarterlyReviewStepper from "./QuarterlyReviewStepper";
import {
  Card,
  CardTitle,
  CardContent,
  Button,
  Dropdown,
  Table,
  TableColumn,
} from "../../../components/ui";
import "./AppraisalDashboard.css";

const renderStatusBadge = (status: string) => {
  switch (status) {
    case "submitted":
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Submitted
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          In Progress
        </span>
      );
    case "assigned":
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-[#1B2559] border border-gray-200">
          Assigned
        </span>
      );
  }
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
            onBack={closeAssignment}
            onSubmitSuccess={() => submitReview(activeAssignment.id)}
          />
        </div>
      </div>
    );
  }

  // Table columns definition
  const columns: TableColumn<QuarterlyReviewAssignment>[] = [
    {
      key: "quarter",
      title: "QUARTER",
      dataIndex: "quarter",
      render: (val) => (
        <span className="font-bold text-sm bg-[#EEF2FF] text-[#4318FF] px-2.5 py-1 rounded-lg">
          {val}
        </span>
      ),
    },
    {
      key: "financialYear",
      title: "FINANCIAL YEAR",
      dataIndex: "financialYear",
      render: (val) => <span className="font-semibold text-[#1B2559] text-sm">{val}</span>,
    },
    {
      key: "assignedBy",
      title: "ASSIGNED BY",
      dataIndex: "assignedBy",
      render: (val) => (
        <span className="text-sm text-[#707EAE] font-medium">{val}</span>
      ),
    },
    {
      key: "deadline",
      title: "DEADLINE",
      dataIndex: "deadline",
      render: (val) => (
        <div className="flex items-center gap-1.5 text-sm text-[#1B2559] font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#4318FF]" />
          <span>{val}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "STATUS",
      dataIndex: "status",
      render: (val) => renderStatusBadge(val),
    },
    {
      key: "action",
      title: "ACTION",
      align: "center",
      render: (_, record) => (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          onClick={() => openAssignment(record)}
          className="font-bold shadow-xs hover:shadow-md cursor-pointer"
        >
          Edit
        </Button>
      ),
    },
  ];

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
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        </div>

        {/* CURRENT YEAR RATING CARD */}
        <div className="mb-6">
          <Card className="rounded-3xl p-5 manager-review-glass-card max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#E6F9F0] text-[#05CD99] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h2 className="text-[11px] font-bold text-[#1B2559] uppercase tracking-wider">
                CURRENT YEAR RATING
              </h2>
            </div>

            <div className="pl-1">
              <span className="text-2xl font-black text-[#1B2559] tracking-tight">—</span>
              <p className="text-xs text-[#A3AED0] mt-1 font-medium">Not Available</p>
            </div>
          </Card>
        </div>

        {/* MAIN SECTION: QUARTERLY REVIEW HISTORY */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card">
          {/* Card Header & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] flex items-center justify-center shrink-0">
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
              buttonClassName="bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-2xl px-3 py-2 text-sm font-medium text-[#707EAE] min-w-[140px] shadow-none"
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
              buttonClassName="bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-2xl px-3 py-2 text-sm font-medium text-[#707EAE] min-w-[120px] shadow-none"
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
              buttonClassName="bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-2xl px-3 py-2 text-sm font-medium text-[#707EAE] min-w-[120px] shadow-none"
            />

            {/* Clear Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw size={14} className="text-[#A3AED0]" />}
                onClick={handleClearFilters}
                className="text-[#A3AED0] hover:text-[#707EAE] font-medium !shadow-none shrink-0 whitespace-nowrap"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {assignments.length > 0 ? (
            /* STATE 2: Populated Table with MOCK DATA */
            <div className="space-y-4">
              <div className="hidden sm:block">
                <Table
                  columns={columns}
                  data={assignments}
                  headerTheme="light"
                  className="rounded-2xl border border-gray-100 overflow-hidden"
                />
              </div>

              {/* Mobile Card Layout for Table Rows */}
              <div className="sm:hidden space-y-3">
                {assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className="p-4 rounded-2xl border border-[#E0E5F2] bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm bg-[#EEF2FF] text-[#4318FF] px-2.5 py-0.5 rounded-lg">
                          {assignment.quarter}
                        </span>
                        <span className="text-xs font-semibold text-[#1B2559]">
                          {assignment.financialYear}
                        </span>
                      </div>
                      {renderStatusBadge(assignment.status)}
                    </div>

                    <div className="text-xs text-[#707EAE] space-y-1">
                      <p>Assigned by: <span className="text-[#1B2559] font-medium">{assignment.assignedBy}</span></p>
                      <p>Deadline: <span className="text-[#1B2559] font-medium">{assignment.deadline}</span></p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => openAssignment(assignment)}
                      className="w-full font-bold shadow-xs"
                    >
                      Edit Review
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* STATE 1: Empty state matching reference image illustration */
            <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center px-4">
              {/* Clean illustration vector matching reference */}
              <div className="w-64 sm:w-72 max-w-full mb-6">
                <svg
                  viewBox="0 0 320 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto"
                >
                  {/* Background soft circles */}
                  <circle cx="160" cy="110" r="75" fill="#FFFBEB" opacity="0.6" />
                  <circle cx="110" cy="140" r="25" fill="#FEF3C7" opacity="0.5" />
                  <circle cx="215" cy="145" r="28" fill="#FEF3C7" opacity="0.5" />

                  {/* Clipboard Document */}
                  <rect x="135" y="45" width="90" height="120" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />
                  {/* Clipboard Clip */}
                  <rect x="160" y="38" width="40" height="14" rx="4" fill="#FBBF24" />
                  <rect x="170" y="34" width="20" height="8" rx="2" fill="#D97706" />

                  {/* Checklist lines on clipboard with check circles */}
                  <circle cx="152" cy="70" r="5" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
                  <path d="M150 70l1.5 1.5 3-3" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="163" y="68" width="45" height="4" rx="2" fill="#E2E8F0" />

                  <circle cx="152" cy="90" r="5" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
                  <path d="M150 90l1.5 1.5 3-3" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="163" y="88" width="40" height="4" rx="2" fill="#E2E8F0" />

                  <circle cx="152" cy="110" r="5" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
                  <path d="M150 110l1.5 1.5 3-3" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="163" y="108" width="48" height="4" rx="2" fill="#E2E8F0" />

                  {/* Star Rating Badge on top left */}
                  <rect x="100" y="60" width="42" height="16" rx="4" fill="#FDE68A" />
                  <text x="104" y="72" fontSize="9" fill="#D97706">★★★★★</text>

                  {/* Person with giant pencil on right */}
                  <circle cx="195" cy="80" r="6" fill="#1E293B" />
                  <path d="M190 92c0-5 10-5 10 0v20h-10v-20z" fill="#1E293B" />
                  {/* Big Pencil */}
                  <path d="M180 85l20 35-4 2-20-35 4-2z" fill="#F59E0B" />
                  <polygon points="176,82 181,84 179,88" fill="#1E293B" />

                  {/* Sitting Person with Laptop on left block */}
                  <rect x="115" y="115" width="22" height="22" rx="4" fill="#FDE68A" />
                  <circle cx="126" cy="100" r="5" fill="#1E293B" />
                  <path d="M121 108c0-3 10-3 10 0v8h-10v-8z" fill="#0284C7" />
                  <path d="M120 116l10-2" stroke="#1E293B" strokeWidth="1.5" />

                  {/* Evaluation Box on right */}
                  <rect x="210" y="115" width="22" height="22" rx="4" fill="#FDE68A" />
                  <path d="M217 122l8 8m0-8l-8 8" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-[#1B2559]">
                No quarterly reviews assigned yet.
              </h3>
              <p className="text-sm text-[#A3AED0] max-w-md mt-1 leading-relaxed">
                When your manager or administrator assigns a quarterly review, it will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AppraisalDashboard;
