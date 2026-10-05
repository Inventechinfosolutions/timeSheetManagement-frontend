import React, { useState, useMemo } from "react";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import { AssignmentType, ManagerQuarterlyReviewRecord } from "../../types/appraisal.types";
import { initialMockQuarterlyReviewTableData } from "../../mockData/quarterlyReview.mock";
import CreateReviewAssignmentModal from "./CreateReviewAssignmentModal";
import AssignQuarterlyReviewModal from "./AssignQuarterlyReviewModal";
import { QuarterlyReviewTable } from "./QuarterlyReviewTable";
import EvaluationPanel, { EvaluationData } from "./EvaluationPanel";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SearchBox,
  Dropdown,
} from "../../../components/ui";
import "./ManagerQuarterlyReview.css";

export const ManagerQuarterlyReview: React.FC = () => {
  // Modal flow state (for visual presentation / prototyping)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<AssignmentType | null>(null);

  // Mock table data state (initialized with centralized mock records)
  const [assignments, setAssignments] = useState<ManagerQuarterlyReviewRecord[]>(
    initialMockQuarterlyReviewTableData
  );

  // Active record being evaluated/viewed in the Appraisal Review Evaluation Panel
  const [evaluatingRecord, setEvaluatingRecord] = useState<ManagerQuarterlyReviewRecord | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<"edit" | "view">("edit");

  const handleEvaluationSubmit = (recordId: string, evaluation: EvaluationData) => {
    setAssignments((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId || rec.name === evaluatingRecord?.name) {
          return {
            ...rec,
            status: "COMPLETED",
            finalRating: evaluation.averageScore.toFixed(1),
          };
        }
        return rec;
      })
    );

    setHighlightedRowId(recordId);
    setTimeout(() => {
      setHighlightedRowId(null);
    }, 2500);
    setEvaluatingRecord(null);
  };

  // Briefly highlighted row ID after an assignment completes
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Visual filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [financialYear, setFinancialYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [memberFilter, setMemberFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const hasActiveFilters = Boolean(
    searchTerm.trim() || financialYear || quarter || memberFilter || statusFilter
  );

  const handleOpenCreateModal = () => {
    setAssignmentType(null);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleContinueToAssign = (type: AssignmentType) => {
    setAssignmentType(type);
    setIsCreateModalOpen(false);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
  };

  // Mock assignment flow handler - prepends newly assigned employee to the table and highlights the row
  const handleAssignSuccess = (data: { quarter: string; employee: string }) => {
    const nextIndex = assignments.length + 1;
    const assignedId = data.employee.startsWith("EMP") ? data.employee : `EMP00${nextIndex}`;
    const newRecord: ManagerQuarterlyReviewRecord = {
      name:
        data.employee === "EMP001"
          ? "Ananya Sharma"
          : data.employee === "EMP002"
            ? "Rahul Kumar"
            : data.employee === "EMP003"
              ? "Priya N"
              : data.employee === "EMP004"
                ? "Arjun R"
                : data.employee === "EMP005"
                  ? "Sneha Gowda"
                  : "Deepak Verma",
      id: assignedId,
      role:
        data.employee === "EMP001"
          ? "Frontend Developer"
          : data.employee === "EMP002"
            ? "Backend Developer"
            : "Software Engineer",
      quarter: data.quarter || "Q1",
      financialYear: data.financialYear || "FY 2026-27",
      fromDate: data.fromDate || "01-04-2026",
      toDate: data.toDate || "30-06-2026",
      assignedOn: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
      assignedBy: "Manager",
      finalRating: "-",
      status: "NOT_STARTED",
    };

    // Prepend to assignments table
    setAssignments((prev) => [newRecord, ...prev.filter((r) => !(r.id === assignedId && r.quarter === newRecord.quarter))]);

    // Briefly highlight the exact row for about 1 second with a subtle background/glow
    setHighlightedRowId(assignedId);

    // After 1 second, smoothly return row to normal styling
    setTimeout(() => {
      setHighlightedRowId(null);
    }, 1150);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFinancialYear("");
    setQuarter("");
    setMemberFilter("");
    setStatusFilter("");
  };

  // Filtered assignments based on current filter selections
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.role.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (financialYear && financialYear !== "all") {
        if (!item.financialYear.toLowerCase().includes(financialYear.toLowerCase())) {
          return false;
        }
      }

      if (quarter && quarter !== "all") {
        if (item.quarter.toLowerCase() !== quarter.toLowerCase()) return false;
      }

      if (memberFilter && memberFilter !== "all") {
        if (item.id !== memberFilter && item.name !== memberFilter) return false;
      }

      if (statusFilter && statusFilter !== "all") {
        const itemStatusNorm = item.status.toLowerCase().replace(/_/g, " ");
        const filterNorm = statusFilter.toLowerCase().replace(/_/g, " ");
        if (itemStatusNorm !== filterNorm) return false;
      }

      return true;
    });
  }, [assignments, searchTerm, financialYear, quarter, memberFilter, statusFilter]);

  // Dynamic member filter options based on assignments
  const memberOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts = [{ value: "all", label: "All Members" }];
    assignments.forEach((a) => {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        opts.push({ value: a.id, label: `${a.name} (${a.id})` });
      }
    });
    return opts;
  }, [assignments]);

  if (evaluatingRecord) {
    return (
      <div className="w-full min-h-screen relative overflow-hidden font-sans px-2 sm:px-3 lg:px-4 pt-1 sm:pt-1.5 pb-8 manager-review-bg-container">
        {/* LUXURY BACKGROUND CANVAS */}
        <div className="manager-review-canvas" aria-hidden="true">
          <div className="manager-review-dot-grid" />
          <div className="manager-review-aurora-tr" />
          <div className="manager-review-aurora-tl" />
          <div className="manager-review-aurora-br" />
          <div className="manager-review-aurora-bl" />
          <div className="manager-review-wave-top" />
          <div className="manager-review-wave-bottom" />
        </div>
        <div className="relative z-10">
          <EvaluationPanel
            record={evaluatingRecord}
            mode={evaluationMode}
            onBack={() => setEvaluatingRecord(null)}
            onSubmitEvaluation={handleEvaluationSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden font-sans p-4 sm:p-6 lg:p-8 manager-review-bg-container">
      {/* LUXURY BACKGROUND CANVAS (All SVGs & animations managed and loaded via ManagerQuarterlyReview.css) */}
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
              <span className="manager-review-title-anim">Manager Quarterly Review</span>
            </h1>
            <p className="text-sm mt-1 font-normal w-fit">
              <span className="manager-review-subtitle-anim">
                Review, evaluate, and provide ratings for quarterly appraisal submissions from your team members.
              </span>
            </p>
          </div>
        </div>

        {/* Main Section Card */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <CardTitle className="text-lg sm:text-xl font-bold manager-review-card-title">
              Quarterly Reviews
            </CardTitle>

            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto font-bold manager-review-create-btn"
            >
              Create
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex items-center gap-2.5 lg:gap-3 mb-6 overflow-x-auto no-scrollbar flex-nowrap py-1.5 manager-review-filters-bar">
              <div className="w-52 lg:w-64 shrink-0 filter-item-stagger-1">
                <SearchBox
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                  placeholder="Search employee name or..."
                  variant="outlined"
                  inputSize="lg"
                  containerClassName="w-full rounded-2xl manager-review-search-box"
                  className="text-sm manager-review-search-input"
                  allowClear
                />
              </div>

              <Dropdown
                className="shrink-0 filter-item-stagger-2"
                placeholder="Financial Year"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Calendar size={16} className="filter-icon-fy" />}
                options={[
                  { value: "all", label: "All FY" },
                  { value: "FY 2026-27", label: "FY 2026-27" },
                  { value: "FY 2025-26", label: "FY 2025-26" },
                  { value: "FY 2024-25", label: "FY 2024-25" },
                ]}
                value={financialYear}
                onChange={setFinancialYear}
                maxLabelWidth="max-w-[110px]"
                buttonClassName="manager-review-filter-btn filter-btn-fy rounded-2xl px-3 py-2.5 text-sm font-medium min-w-[145px]"
              />

              <Dropdown
                className="shrink-0 filter-item-stagger-3"
                placeholder="Quarters"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Clock size={16} className="filter-icon-quarters" />}
                options={[
                  { value: "all", label: "All Quarters" },
                  { value: "Q1", label: "Quarter 1" },
                  { value: "Q2", label: "Quarter 2" },
                  { value: "Q3", label: "Quarter 3" },
                  { value: "Q4", label: "Quarter 4" },
                ]}
                value={quarter}
                onChange={setQuarter}
                maxLabelWidth="max-w-[95px]"
                buttonClassName="manager-review-filter-btn filter-btn-quarters rounded-2xl px-3 py-2.5 text-sm font-medium min-w-[125px]"
              />

              <Dropdown
                className="shrink-0 filter-item-stagger-4"
                placeholder="All Members"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Users size={16} className="filter-icon-members" />}
                options={memberOptions}
                value={memberFilter}
                onChange={setMemberFilter}
                maxLabelWidth="max-w-[105px]"
                buttonClassName="manager-review-filter-btn filter-btn-members rounded-2xl px-3 py-2.5 text-sm font-medium min-w-[135px]"
              />

              <Dropdown
                className="shrink-0 filter-item-stagger-5"
                placeholder="All Status"
                allowClear={true}
                defaultValue=""
                prefixIcon={<ClipboardList size={16} className="filter-icon-status" />}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "NOT_STARTED", label: "Not Started" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "UNDER_REVIEW", label: "Under Review" },
                  { value: "COMPLETED", label: "Completed" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                maxLabelWidth="max-w-[95px]"
                buttonClassName="manager-review-filter-btn filter-btn-status rounded-2xl px-3 py-2.5 text-sm font-medium min-w-[125px]"
              />

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<RotateCcw size={14} className="filter-clear-icon" />}
                  onClick={handleClearFilters}
                  className="manager-review-clear-btn shrink-0 whitespace-nowrap font-medium"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Table populated state vs Empty state */}
            {filteredAssignments.length > 0 ? (
              <QuarterlyReviewTable
                data={filteredAssignments}
                highlightedId={highlightedRowId}
                onEdit={(item) => {
                  setEvaluationMode("edit");
                  setEvaluatingRecord(item);
                }}
                onView={(item) => {
                  setEvaluationMode("view");
                  setEvaluatingRecord(item);
                }}
              />
            ) : (
              /* Empty State UI with Rich Colors and Animated SVG */
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center px-4">
                <div className="relative mb-5">
                  <div className="manager-review-empty-glow" />
                  <div className="manager-review-empty-illustration" />
                </div>

                <h3 className="text-xl font-bold text-[#0F172A]">
                  No submissions found
                </h3>
                <p className="text-sm text-[#64748B] max-w-sm mt-1.5 leading-relaxed font-normal">
                  There are currently no employee quarterly review submissions matching your filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals for Flow Visualization */}
        <CreateReviewAssignmentModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onContinue={handleContinueToAssign}
          initialType={null}
        />

        <AssignQuarterlyReviewModal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          assignmentType={assignmentType}
          onAssign={handleAssignSuccess}
        />
      </div>
    </div>
  );
};

export default ManagerQuarterlyReview;
