import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Calendar,
  Clock,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import { AssignmentType, ManagerQuarterlyReviewRecord } from "../../types/appraisal.types";
import { useAppSelector } from "../../../hooks";
import {
  AppraisalApi,
  MasterFinancialYearOption,
  MasterQuarterRecord,
  toManagerReviewRecord,
} from "../../services/appraisal.api";
import {
  AppraisalFilterAll,
  QuaterlyEnum,
  QuarterlyReviewStatus,
} from "../../enums/appraisal.enums";
import CreateReviewAssignmentModal from "./CreateReviewAssignmentModal";
import AssignQuarterlyReviewModal from "./AssignQuarterlyReviewModal";
import { QuarterlyReviewTable } from "./QuarterlyReviewTable";
import EvaluationPanel, { EvaluationData } from "./EvaluationPanel";
import { QUARTERLY_REVIEW_TABLE_PAGE_SIZE } from "../../constants/appraisal.constants";
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
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const managerId = currentUser?.employeeId || currentUser?.loginId || "";
  // Modal flow state (for visual presentation / prototyping)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignFormKey, setAssignFormKey] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [masterYears, setMasterYears] = useState<MasterFinancialYearOption[]>([]);
  const [masterQuarters, setMasterQuarters] = useState<MasterQuarterRecord[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [quartersLoading, setQuartersLoading] = useState(false);
  const [assignmentType, setAssignmentType] = useState<AssignmentType | null>(null);

  const [assignments, setAssignments] = useState<ManagerQuarterlyReviewRecord[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableTotal, setTableTotal] = useState(0);

  // Active record being evaluated/viewed in the Appraisal Review Evaluation Panel
  const [evaluatingRecord, setEvaluatingRecord] = useState<ManagerQuarterlyReviewRecord | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<"edit" | "view">("edit");

  const scrollToTop = () => {
    // 1. Scroll main elements (the scrollable container in SidebarLayout)
    const mainElements = document.querySelectorAll("main");
    mainElements.forEach((m) => {
      m.scrollTop = 0;
      if (typeof m.scrollTo === "function") {
        m.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    });

    // 2. Scroll any large container with overflow-y-auto
    const overflowElements = document.querySelectorAll("[class*='overflow-y-auto']");
    overflowElements.forEach((el) => {
      if (el.scrollHeight > 600) {
        el.scrollTop = 0;
        if (typeof el.scrollTo === "function") {
          el.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }
    });

    // 3. Scroll window and documentElement
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const triggerScrollToTop = () => {
    scrollToTop();
    requestAnimationFrame(scrollToTop);
    setTimeout(scrollToTop, 20);
    setTimeout(scrollToTop, 60);
    setTimeout(scrollToTop, 150);
  };

  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  useEffect(() => {
    if (!evaluatingRecord) {
      triggerScrollToTop();
    }
  }, [evaluatingRecord]);

  const handleBackToDashboard = () => {
    triggerScrollToTop();
    setEvaluatingRecord(null);
    triggerScrollToTop();
  };

  const handleEditRecord = (item: ManagerQuarterlyReviewRecord) => {
    triggerScrollToTop();
    setEvaluationMode("edit");
    setEvaluatingRecord(item);
    triggerScrollToTop();
  };

  const handleViewRecord = (item: ManagerQuarterlyReviewRecord) => {
    triggerScrollToTop();
    setEvaluationMode("view");
    setEvaluatingRecord(item);
    triggerScrollToTop();
  };

  const handleEvaluationSubmit = (recordId: string, evaluation: EvaluationData) => {
    setAssignments((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId || rec.name === evaluatingRecord?.name) {
          return {
            ...rec,
            status: QuarterlyReviewStatus.COMPLETED,
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
    scrollToTop();
    setEvaluatingRecord(null);
    setTimeout(scrollToTop, 40);
  };

  // Briefly highlighted row ID after an assignment completes
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Visual filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [financialYear, setFinancialYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const hasActiveFilters = Boolean(
    searchTerm.trim() || financialYear || quarter || statusFilter
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
    setAssignFormKey((current) => current + 1);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignFormKey((current) => current + 1);
  };

  const handleAssignSuccess = () => {
    setReloadKey((current) => current + 1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFinancialYear("");
    setQuarter("");
    setStatusFilter("");
  };

  const yearsLoaded = useRef(false);
  const quartersLoaded = useRef(false);

  const loadFinancialYears = () => {
    if (yearsLoaded.current) return;
    yearsLoaded.current = true;
    setYearsLoading(true);
    void AppraisalApi.getMasterFinancialYears()
      .then(setMasterYears)
      .catch(() => {
        yearsLoaded.current = false;
        setMasterYears([]);
      })
      .finally(() => setYearsLoading(false));
  };

  const loadQuarters = () => {
    if (quartersLoaded.current) return;
    if (masterYears.some((year) => (year.quarters?.length ?? 0) > 0)) {
      quartersLoaded.current = true;
      return;
    }
    quartersLoaded.current = true;
    setQuartersLoading(true);
    void AppraisalApi.getMasterQuarters()
      .then(setMasterQuarters)
      .catch(() => {
        quartersLoaded.current = false;
        setMasterQuarters([]);
      })
      .finally(() => setQuartersLoading(false));
  };

  const tableFilters = `${debouncedSearch}|${financialYear}|${quarter}|${statusFilter}`;
  const [appliedTableFilters, setAppliedTableFilters] = useState(tableFilters);
  if (appliedTableFilters !== tableFilters) {
    setAppliedTableFilters(tableFilters);
    setTablePage(1);
  }

  useEffect(() => {
    if (!managerId) {
      setAssignments([]);
      setTableTotal(0);
      return;
    }
    const selectedYear =
      financialYear && financialYear !== AppraisalFilterAll.ALL ? financialYear : undefined;
    const selectedQuarter =
      quarter && quarter !== AppraisalFilterAll.ALL ? (quarter as QuaterlyEnum) : undefined;
    const selectedStatus =
      !statusFilter || statusFilter === AppraisalFilterAll.ALL
        ? undefined
        : statusFilter === QuarterlyReviewStatus.COMPLETED
          ? QuarterlyReviewStatus.REVIEWED
          : (statusFilter as QuarterlyReviewStatus);
    const query = {
      assignerId: managerId,
      page: tablePage,
      limit: QUARTERLY_REVIEW_TABLE_PAGE_SIZE,
      financialYear: selectedYear,
      quarter: selectedQuarter,
      status: selectedStatus,
    };
    const searchText = debouncedSearch.trim();
    const request = searchText
      ? AppraisalApi.searchReviews({ ...query, q: searchText })
      : AppraisalApi.getReviews(query);

    void request
      .then((result) => {
        setAssignments((result.data || []).map(toManagerReviewRecord));
        setTableTotal(result.total ?? 0);
      })
      .catch(() => {
        setAssignments([]);
        setTableTotal(0);
      });
  }, [managerId, debouncedSearch, financialYear, quarter, statusFilter, reloadKey, tablePage]);

  const financialYearOptions = masterYears.map((year) => ({
    value: year.financialYear,
    label: year.financialYear,
  }));

  const quarterOptions = (() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    masterYears.forEach((year) => {
      year.quarters?.forEach((item) => {
        if (!item.quarter || seen.has(item.quarter)) return;
        seen.add(item.quarter);
        options.push({ value: item.quarter, label: item.quarterName || item.quarter });
      });
    });
    masterQuarters.forEach((item) => {
      if (!item.quaterLabel || seen.has(item.quaterLabel)) return;
      seen.add(item.quaterLabel);
      options.push({ value: item.quaterLabel, label: item.quaterLabel });
    });
    return options;
  })();

  const statusOptions = [
    { value: AppraisalFilterAll.ALL, label: "Status" },
    { value: QuarterlyReviewStatus.NOT_STARTED, label: "Not Started" },
    { value: QuarterlyReviewStatus.IN_PROGRESS, label: "In Progress" },
    { value: QuarterlyReviewStatus.SUBMITTED, label: "Submitted" },
    { value: QuarterlyReviewStatus.UNDER_REVIEW, label: "Under Review" },
    { value: QuarterlyReviewStatus.COMPLETED, label: "Completed" },
  ];

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
            onBack={handleBackToDashboard}
            onSubmitEvaluation={handleEvaluationSubmit}
            onAssignmentSaved={(patch) => {
              setEvaluatingRecord((current) =>
                current
                  ? {
                      ...current,
                      fromDate: patch.assignedDate,
                      assignedOn: patch.assignedDate,
                      toDate: patch.deadline,
                      description: patch.description,
                    }
                  : current,
              );
              setAssignments((current) =>
                current.map((item) =>
                  item.reviewId === patch.reviewId
                    ? {
                        ...item,
                        fromDate: patch.assignedDate,
                        assignedOn: patch.assignedDate,
                        toDate: patch.deadline,
                        description: patch.description,
                      }
                    : item,
                ),
              );
            }}
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

          {/* Create Button at top of card with animated SVG icon */}
          <div className="flex w-full sm:w-auto gap-2">
          <Button
            variant="primary"
            size="lg"
            leftIcon={
              <span className="manager-create-icon-wrap" aria-hidden="true">
                <svg
                  className="manager-create-icon-svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9.5"
                    className="manager-create-svg-circle"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                    opacity="0.8"
                  />
                  <path
                    d="M12 7V17M7 12H17"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="manager-create-svg-plus"
                  />
                </svg>
              </span>
            }
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto font-bold manager-review-create-btn shrink-0"
          >
            Create
          </Button>
          </div>
        </div>

        {/* Main Section Card */}
        <Card className="w-full p-5 sm:p-7 manager-review-glass-card">
          <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
            <CardTitle className="text-lg sm:text-xl font-bold manager-review-card-title whitespace-nowrap shrink-0">
              Quarterly Reviews
            </CardTitle>

            {/* Filters beside title */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-nowrap py-1 manager-review-filters-bar flex-1 justify-start xl:justify-end">
              <div className="w-32 sm:w-36 md:w-40 xl:w-44 shrink-0 filter-item-stagger-1">
                <SearchBox
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                  onDebounce={setDebouncedSearch}
                  placeholder="Search..."
                  variant="outlined"
                  inputSize="md"
                  containerClassName="w-full rounded-xl manager-review-search-box"
                  className="text-xs manager-review-search-input"
                  allowClear
                />
              </div>

              <Dropdown
                className="shrink-0 filter-item-stagger-2"
                placeholder="Financial Year"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Calendar size={14} className="filter-icon-fy" />}
                options={financialYearOptions}
                value={financialYear}
                onChange={setFinancialYear}
                onOpen={loadFinancialYears}
                loading={yearsLoading}
                maxLabelWidth="max-w-[124px]"
                buttonClassName="manager-review-filter-btn filter-btn-fy rounded-xl px-2.5 py-1.5 text-xs font-medium min-w-[172px]"
              />

              <Dropdown
                className="shrink-0 filter-item-stagger-3"
                placeholder="Quarters"
                allowClear={true}
                defaultValue=""
                prefixIcon={<Clock size={14} className="filter-icon-quarters" />}
                options={quarterOptions}
                value={quarter}
                onChange={setQuarter}
                onOpen={loadQuarters}
                loading={quartersLoading && quarterOptions.length === 0}
                maxLabelWidth="max-w-[100px]"
                buttonClassName="manager-review-filter-btn filter-btn-quarters rounded-xl px-2.5 py-1.5 text-xs font-medium min-w-[150px]"
              />

              <Dropdown
                className="shrink-0 filter-item-stagger-5"
                placeholder="Status"
                allowClear={true}
                defaultValue=""
                prefixIcon={<ClipboardList size={14} className="filter-icon-status" />}
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                maxLabelWidth="max-w-[80px]"
                contentWidth
                buttonClassName="manager-review-filter-btn filter-btn-status rounded-xl px-2.5 py-1.5 text-xs font-medium min-w-[124px]"
              />

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="manager-review-clear-btn shrink-0 p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 border border-[#D3A29D]/60 bg-white/90 text-[#A36361] hover:text-[#8D4E4D] hover:bg-[#FAF2EE]/80 shadow-xs"
                  title="Clear all filters"
                >
                  <RotateCcw size={13} className="filter-clear-icon shrink-0" />
                  <span className="hidden 2xl:inline text-xs">Clear</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">

            {/* Table populated state vs Empty state */}
            {assignments.length > 0 ? (
              <QuarterlyReviewTable
                data={assignments}
                highlightedId={highlightedRowId}
                onEdit={handleEditRecord}
                onView={handleViewRecord}
                page={tablePage}
                totalCount={tableTotal}
                defaultPageSize={QUARTERLY_REVIEW_TABLE_PAGE_SIZE}
                onPageChange={setTablePage}
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

        <CreateReviewAssignmentModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onContinue={handleContinueToAssign}
          initialType={null}
        />

        <AssignQuarterlyReviewModal
          key={assignFormKey}
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
