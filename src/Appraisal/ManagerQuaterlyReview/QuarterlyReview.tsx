import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Button, Input, Select, Spin, message } from "antd";
import {
  Search,
  Users,
  CheckCircle2,
  FileCheck,
  Eye,
  Edit3,
  Calendar,
  Star,
  ArrowLeft,
  Hourglass,
} from "lucide-react";
import axios from "axios";
import {
  ManagerReviewItem,
  ReviewStats,
  AppraisalStatus,
  ManagerReviewStatus,
  PerformanceRating,
  ActionType,
  QuarterFilter,
  StatusTabFilter,
  RatingCategory,
  MIN_FIELD_LENGTH,
  DEFAULT_RATING_VALUE,
  STATUS_TAB_ITEMS,
  YEAR_FILTER_ALL,
  DEFAULT_YEAR,
  toFiscalYearLabel,
  YEARS_BEFORE_CURRENT,
  YEARS_AFTER_CURRENT,
} from "./QuarterlyReview.types";
import QuarterlyViewPage from "./Quarterlyviewpage";

const { Option } = Select;

type RatingValues = Record<string, number>;

const DEFAULT_PAGE_SIZE = 10;

interface ManagerReviewBoardDesktopProps {
  onBack?: () => void;
}

/**
 * FONT CONTROL — single source of truth
 * ----------------------------------------------------------------
 * Everything below is scoped under the ".mqr-wrapper" class, applied
 * once on the page's outermost container (and, for the tab layout, on
 * a wrapping div around both the tab view and the evaluation modal).
 * Two things are controlled from exactly one place:
 *
 * 1) FONT FAMILY -> the `font-family` rule on ".mqr-wrapper, .mqr-wrapper *"
 * 2) FONT SIZE   -> the `--mqr-scale` CSS variable on ".mqr-wrapper"
 *
 * This page already uses a deliberate Tailwind type scale
 * (text-[10px] / text-xs / text-sm / text-base / text-2xl) to
 * distinguish the back-button label, badges, table cells, headings
 * and stat numbers from each other. Rather than flattening that
 * hierarchy, each size is re-expressed as `base-px * var(--mqr-scale)`,
 * so changing ONE number (--mqr-scale) scales every size on the page
 * up or down together, while preserving the relative hierarchy.
 * The custom table header's inline 11px is included too, so the
 * table stays in sync with the rest of the page.
 *
 * To resize everything:   change --mqr-scale (e.g. 1.1 = 10% bigger)
 * To change the typeface: edit the font-family stack below
 *
 * FONT FAMILY — enforcement notes:
 * `.mqr-wrapper *` alone is a low-specificity selector (0,1,0). AntD ships
 * its own compound selectors for table headers/cells and form controls —
 * e.g. `.ant-table-thead > tr > th` is (0,1,2), `.ant-select-selector` etc.
 * — which are MORE specific and would win regardless of source order even
 * though this rule declares Inter. So the base rule now carries `!important`,
 * and a second block explicitly re-asserts Inter on the AntD selectors most
 * likely to fight back (table, select, input, button, pagination), scoped
 * under `.mqr-wrapper` so it stays contained to this page.
 *
 * On top of that, AntD's Select dropdown (and similar overlay/popup pieces)
 * render into a **portal appended to document.body**, i.e. outside
 * `.mqr-wrapper` in the DOM — no `.mqr-wrapper ...` selector can ever reach
 * them. A small UNSCOPED block at the end handles just those portaled
 * nodes so dropdown option text also renders in Inter. (This one is
 * intentionally global since it has to be, so if there are other AntD
 * Selects elsewhere on the app outside this component, their dropdowns will
 * also pick up Inter — flag if that's undesired and we can scope it via a
 * `popupClassName` on each Select instead.)
 *
 * STAT CARDS — the 4 cards (Total Submissions, Pending Reviews, In
 * Review, Completed Reviews) fill the entire row (`flex-1` on the
 * cards' wrapping group, `flex-1` on each card). This group used to
 * share its row with a Q1-Q4 quick-filter button block on the right;
 * that block has been removed, so the group now stretches across the
 * full row width automatically. `min-w-[135px]` per card is a floor,
 * not a target, so cards never get uncomfortably narrow if the
 * viewport shrinks. Each card is a flat white surface with a neutral
 * slate border and a small flat-colored icon chip (blue / amber /
 * indigo / emerald) laid out beside the label + number — the earlier
 * gradient backgrounds, gradient icon badges, and animated hover
 * "light sweep" were dropped in favor of this calmer, more
 * professional look. Hover just nudges the border color and adds a
 * very soft shadow.
 *
 * FILTER TOOLBAR — the "Quarterly Reviews" section label now lives as
 * the top row INSIDE the white filter card itself (rather than as a
 * separate <h2> sitting above the card). Below that label row is the
 * status segmented control on the left, with search plus the
 * Financial Year and Quarter Selects grouped on the right — all
 * within the same card, separated by a thin divider from the label
 * row above it.
 */

const MQR_FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const MQR_FONT_STYLES = `
  /* Loads the actual Inter font file. Declaring 'Inter' in font-family
     below only tells the browser to use it IF it's available — it does
     NOT load it. Without this @import (or Inter being loaded elsewhere,
     e.g. index.html or an @fontsource/inter package), every rule below
     silently falls through to the next name in the stack (-apple-system /
     Segoe UI / Roboto / Arial), which is a system font, not Inter. */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .mqr-wrapper, .mqr-wrapper * {
    font-family: ${MQR_FONT_STACK} !important;
  }

  /* Explicit re-assertion for AntD's own compound selectors (table
     header/cell, select, input, button, pagination) which otherwise
     out-specificity the universal rule above. */
  .mqr-wrapper .ant-table,
  .mqr-wrapper .ant-table-thead > tr > th,
  .mqr-wrapper .ant-table-tbody > tr > td,
  .mqr-wrapper .ant-select,
  .mqr-wrapper .ant-select-selector,
  .mqr-wrapper .ant-select-selection-item,
  .mqr-wrapper .ant-input,
  .mqr-wrapper .ant-btn,
  .mqr-wrapper .ant-pagination {
    font-family: ${MQR_FONT_STACK} !important;
  }

  /* AntD's Select dropdown renders via a portal appended to
     document.body — outside .mqr-wrapper in the DOM — so it needs an
     unscoped rule to pick up Inter for the option list text. */
  .ant-select-dropdown,
  .ant-select-item,
  .ant-select-item-option-content {
    font-family: ${MQR_FONT_STACK} !important;
  }

  .mqr-wrapper {
    --mqr-scale: 1; /* <-- change this ONE value to resize all text on the page */
  }
 
  .mqr-wrapper .text-\\[10px\\] { font-size: calc(10px * var(--mqr-scale)) !important; }
  .mqr-wrapper .text-xs        { font-size: calc(12px * var(--mqr-scale)) !important; }
  .mqr-wrapper .text-sm        { font-size: calc(14px * var(--mqr-scale)) !important; }
  .mqr-wrapper .text-base      { font-size: calc(16px * var(--mqr-scale)) !important; }
  .mqr-wrapper .text-2xl       { font-size: calc(24px * var(--mqr-scale)) !important; }
  .mqr-wrapper .text-3xl       { font-size: calc(30px * var(--mqr-scale)) !important; }
 
  .mqr-wrapper .custom-table .ant-table-thead > tr > th {
    font-size: calc(11px * var(--mqr-scale)) !important;
  }
 
  .mqr-wrapper .mqr-stat-card {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .mqr-wrapper .mqr-stat-card:hover {
    border-color: #CBD5E1;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  }
 
`;

/**
 * Desktop-only board. No sm:/mobile responsive fallback classes — this
 * component assumes a wide viewport and should only be mounted when the
 * parent's screen-width check resolves to "desktop". The tab-view
 * equivalent lives in a separate file and should be mounted for narrower
 * widths that still fit a tablet-style layout.
 */
const ManagerReviewBoardDesktop: React.FC<ManagerReviewBoardDesktopProps> = ({
  onBack,
}) => {
  const { employeeId: employeeIdFromUrl } = useParams<{
    employeeId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isManagerRoute = location.pathname.startsWith("/manager-dashboard");
  const baseRoute = isManagerRoute
    ? "/manager-dashboard/quarterly-review"
    : "/admin-dashboard/quarterly-review";

  const [submissions, setSubmissions] = useState<ManagerReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalTeamMembers: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    inReview: 0,
    completed: 0,
  });
  const [, setQuarterOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuarter] = useState<string>(
    QuarterFilter.ALL,
  );
  const [selectedQuarterCard, setSelectedQuarterCard] = useState<string>(
    QuarterFilter.ALL,
  );
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>(
    StatusTabFilter.ALL,
  );
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(DEFAULT_YEAR);

  // Server-driven pagination state. `currentPage`/`pageSize` are sent to the
  // API on every fetch, and `totalCount` (from the API response) drives the
  // Table's pagination control — so each page change triggers a real
  // request that returns only that page's rows, instead of slicing a
  // client-side cache of the full list.
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentReview, setCurrentReview] = useState<ManagerReviewItem | null>(
    null,
  );
  const [isViewOnly, setIsViewOnly] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [ratings, setRatings] = useState<RatingValues>({
    [RatingCategory.PRODUCTIVITY]: DEFAULT_RATING_VALUE,
    [RatingCategory.QUALITY]: DEFAULT_RATING_VALUE,
    [RatingCategory.OWNERSHIP]: DEFAULT_RATING_VALUE,
    [RatingCategory.COMMUNICATION]: DEFAULT_RATING_VALUE,
    [RatingCategory.COLLABORATION]: DEFAULT_RATING_VALUE,
    [RatingCategory.INNOVATION]: DEFAULT_RATING_VALUE,
  });
  const [finalRating, setFinalRating] = useState<string>("");
  const [strengths, setStrengths] = useState<string>("");
  const [improvements, setImprovements] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{
    strengths?: string;
    improvements?: string;
    remarks?: string;
  }>({});

  /**
   * Fetch the current filters + requested page/pageSize from the API.
   * This is the single place responsible for pulling table data — every
   * pagination click, filter change, and post-submit refresh routes through
   * here with explicit page/size args so the server always returns exactly
   * the rows for that page.
   */
  const fetchData = async (
    page: number = currentPage,
    size: number = pageSize,
  ) => {
    try {
      setLoading(true);

      const params: Record<string, any> = { page, pageSize: size };
      if (selectedQuarter !== QuarterFilter.ALL)
        params.quarter = selectedQuarter;
      if (selectedQuarterCard !== QuarterFilter.ALL)
        params.quarterCard = selectedQuarterCard;
      if (selectedYear !== YEAR_FILTER_ALL) params.year = selectedYear;
      if (selectedStatusTab !== StatusTabFilter.ALL)
        params.status = selectedStatusTab;
      if (selectedRole !== "ALL") params.role = selectedRole;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [subsRes, statsRes] = await Promise.all([
        axios.get("/api/manager-quarterly-review", { params }),
        axios.get("/api/manager-quarterly-review/stats"),
      ]);

      if (subsRes.data?.success) {
        setSubmissions(subsRes.data.data || []);
        setTotalCount(subsRes.data.total ?? 0);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
        "Failed to fetch quarterly review submissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(1, DEFAULT_PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate the quarter dropdown once, independent of pagination, so
  // options don't disappear/shrink just because the current page doesn't
  // happen to contain every quarter.
  useEffect(() => {
    axios
      .get("/api/manager-quarterly-review/filters")
      .then((res) => {
        if (res.data?.success) {
          setQuarterOptions(res.data.data?.quarters || []);
        }
      })
      .catch(() => {
        // Non-critical — dropdown just falls back to empty options.
      });
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const averageRatingScore = useMemo(() => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    const sum = values.reduce((runningTotal, currentValue) => runningTotal + currentValue, 0);
    return (sum / values.length).toFixed(1);
  }, [ratings]);

  const getFinalRatingFromScore = (averageScore: number): string => {
    if (averageScore >= 5.0) return PerformanceRating.OUTSTANDING;
    if (averageScore >= 4.0) return PerformanceRating.EXCEEDS_EXPECTATIONS;
    if (averageScore >= 3.0) return PerformanceRating.MEETS_EXPECTATIONS;
    if (averageScore >= 2.0) return PerformanceRating.NEEDS_IMPROVEMENT;
    if (averageScore >= 1.0) return PerformanceRating.UNSATISFACTORY;
    return "";
  };

  useEffect(() => {
    if (isViewOnly) return;
    const computedAverage = parseFloat(averageRatingScore as unknown as string);
    if (!isNaN(computedAverage)) {
      setFinalRating(getFinalRatingFromScore(computedAverage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [averageRatingScore, isViewOnly]);

  const applyReviewToForm = (record: ManagerReviewItem) => {
    const resolvedRatings = record.ratings
      ? {
        [RatingCategory.PRODUCTIVITY]:
          record.ratings.productivity || DEFAULT_RATING_VALUE,
        [RatingCategory.QUALITY]:
          record.ratings.quality || DEFAULT_RATING_VALUE,
        [RatingCategory.OWNERSHIP]:
          record.ratings.ownership || DEFAULT_RATING_VALUE,
        [RatingCategory.COMMUNICATION]:
          record.ratings.communication || DEFAULT_RATING_VALUE,
        [RatingCategory.COLLABORATION]:
          record.ratings.collaboration || DEFAULT_RATING_VALUE,
        [RatingCategory.INNOVATION]:
          record.ratings.innovation || DEFAULT_RATING_VALUE,
      }
      : {
        [RatingCategory.PRODUCTIVITY]: DEFAULT_RATING_VALUE,
        [RatingCategory.QUALITY]: DEFAULT_RATING_VALUE,
        [RatingCategory.OWNERSHIP]: DEFAULT_RATING_VALUE,
        [RatingCategory.COMMUNICATION]: DEFAULT_RATING_VALUE,
        [RatingCategory.COLLABORATION]: DEFAULT_RATING_VALUE,
        [RatingCategory.INNOVATION]: DEFAULT_RATING_VALUE,
      };

    setRatings(resolvedRatings);

    const ratingValues = Object.values(resolvedRatings);
    const calculatedAverage = ratingValues.length
      ? ratingValues.reduce((runningSum, ratingItem) => runningSum + ratingItem, 0) / ratingValues.length
      : 0;
    setFinalRating(
      calculatedAverage > 0
        ? getFinalRatingFromScore(calculatedAverage)
        : record.finalRating
          ? getFinalRatingFromScore(record.finalRating)
          : "",
    );

    setStrengths(record.strengths || "");
    setImprovements(record.improvements || "");
    setRemarks(record.remarks || "");
  };

  const loadedEmployeeIdRef = useRef<string | null>(null);

  const handleOpenEvaluation = (
    record: ManagerReviewItem,
    viewOnly: boolean = false,
  ) => {
    setCurrentReview(record);
    setIsViewOnly(viewOnly);
    setFieldErrors({});
    applyReviewToForm(record);
    setIsModalOpen(true);
    loadFreshReview(record.employeeId);
    navigate(`${baseRoute}/${record.employeeId}`, {
      replace: false,
    });
  };

  const loadFreshReview = async (employeeId: string) => {
    try {
      const response = await axios.get(
        `/api/manager-quarterly-review/${employeeId}`,
      );
      if (response.data?.success && response.data?.data) {
        const freshRecord: ManagerReviewItem = response.data.data;
        setCurrentReview(freshRecord);
        applyReviewToForm(freshRecord);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
        `Failed to load the latest details for this review.`,
      );
    }
  };

  // Close the modal, clear the employeeId back out of the URL, reset the
  // "currently open" record so nothing stale lingers in memory, and refetch
  // page 1 of the Manager Quarterly Review list + stats — so Cancel/Back
  // always returns to a freshly-loaded first page rather than a stale
  // client-side snapshot.
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentReview(null);
    loadedEmployeeIdRef.current = null;
    setCurrentPage(1);
    navigate(baseRoute, { replace: false });
    fetchData(1, pageSize);
  };

  useEffect(() => {
    if (!employeeIdFromUrl || submissions.length === 0) return;
    if (loadedEmployeeIdRef.current === employeeIdFromUrl) return;

    const matchedSubmission = submissions.find(
      (submission) => submission.employeeId === employeeIdFromUrl,
    );
    if (matchedSubmission) {
      loadedEmployeeIdRef.current = employeeIdFromUrl;
      setCurrentReview(matchedSubmission);
      setIsViewOnly(matchedSubmission.actionType === ActionType.VIEW);
      setFieldErrors({});
      applyReviewToForm(matchedSubmission);
      setIsModalOpen(true);
      loadFreshReview(employeeIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFromUrl, submissions]);

  const validateTextFields = (): boolean => {
    const errors: {
      strengths?: string;
      improvements?: string;
      remarks?: string;
    } = {};

    if (strengths.trim().length < MIN_FIELD_LENGTH) {
      errors.strengths = `Please enter at least ${MIN_FIELD_LENGTH} characters.`;
    }
    if (improvements.trim().length < MIN_FIELD_LENGTH) {
      errors.improvements = `Please enter at least ${MIN_FIELD_LENGTH} characters.`;
    }
    if (remarks.trim().length < MIN_FIELD_LENGTH) {
      errors.remarks = `Please enter at least ${MIN_FIELD_LENGTH} characters.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEvaluation = async (isDraft: boolean) => {
    if (!currentReview) return;

    if (!isDraft && !validateTextFields()) {
      message.error(
        `Please complete all feedback fields with at least ${MIN_FIELD_LENGTH} characters before submitting.`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = isDraft
        ? `/api/manager-quarterly-review/${currentReview.id}/draft`
        : `/api/manager-quarterly-review/${currentReview.id}/review`;

      const payload = {
        ratings,
        finalRating,
        strengths,
        improvements,
        remarks,
        reviewStatus: isDraft
          ? ManagerReviewStatus.IN_REVIEW
          : ManagerReviewStatus.REVIEWED,
      };

      const response = await axios.post(endpoint, payload);

      if (response.data?.success) {
        message.success(
          isDraft
            ? "Evaluation draft saved."
            : "Review evaluation submitted successfully!",
        );
        setIsModalOpen(false);
        setCurrentReview(null);
        loadedEmployeeIdRef.current = null;
        setCurrentPage(1);
        navigate(baseRoute, { replace: false });
        fetchData(1, pageSize);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to submit review evaluation.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const getSubmissionYear = (item: ManagerReviewItem): string => {
    const fyMatch = (item.quarter || "").match(/FY(\d{4}-\d{2})/i);
    if (fyMatch) return fyMatch[1];
    if (item.lastModified) {
      return toFiscalYearLabel(new Date(item.lastModified).getFullYear());
    }
    return "";
  };

  const yearOptions = useMemo(() => {
    const currentCalendarYear = new Date().getFullYear();
    const rangeYears: string[] = [];
    for (
      let yearIndex = currentCalendarYear - YEARS_BEFORE_CURRENT;
      yearIndex <= currentCalendarYear + YEARS_AFTER_CURRENT;
      yearIndex++
    ) {
      rangeYears.push(toFiscalYearLabel(yearIndex));
    }

    const dataYears = submissions
      .map((submission) => getSubmissionYear(submission))
      .filter(Boolean);

    const years = Array.from(
      new Set([...rangeYears, DEFAULT_YEAR, ...dataYears]),
    ).sort((previousYear, nextYear) => parseInt(nextYear, 10) - parseInt(previousYear, 10));
    return years;
  }, [submissions]);

  // Any filter change invalidates the current result set — jump back to
  // page 1 and re-fetch from the server with the new filters applied.
  useEffect(() => {
    setCurrentPage(1);
    fetchData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedYear,
    selectedQuarter,
    selectedQuarterCard,
    selectedStatusTab,
    selectedRole,
    searchQuery,
  ]);

  const handleTableChange = (pageNumber: number, newPageSize: number) => {
    setCurrentPage(pageNumber);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
    fetchData(pageNumber, newPageSize);
  };

  const renderStatusBadge = (status: string | null) => {
    const currentStatus = status || AppraisalStatus.NOT_STARTED;
    if (
      [
        AppraisalStatus.REVIEWED,
        AppraisalStatus.APPROVED,
        AppraisalStatus.COMPLETED,
      ].includes(currentStatus as AppraisalStatus)
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {currentStatus}
        </span>
      );
    }
    if (currentStatus === AppraisalStatus.UNDER_REVIEW) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Under Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {currentStatus}
      </span>
    );
  };

  const tableTextClass = "text-slate-700 text-sm font-medium";

  const columns = [
    {
      title: "Employee Name",
      key: "employeeName",
      width: "16%",
      render: (_: any, record: ManagerReviewItem) => {
        const displayName = record.employeeName
          ? record.employeeName
            .split(" ")
            .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
            .join(" ")
          : "";

        const initials = displayName
          ? displayName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join("")
          : "";

        return (
          <div className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials || <Users className="w-3.5 h-3.5 text-indigo-500" />}
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <p className={`${tableTextClass} truncate`}>{displayName || "—"}</p>
                {record.employeeRole && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${record.employeeRole.toUpperCase() === "MANAGER"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                  >
                    {record.employeeRole}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },

    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      width: "10%",
      render: (employeeIdText: string) => (
        <span className={tableTextClass}>{employeeIdText || "—"}</span>
      ),
    },

    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: "13%",
      render: (designationText: string) => (
        <span className={tableTextClass}>
          {designationText ? designationText.charAt(0).toUpperCase() + designationText.slice(1) : "—"}
        </span>
      ),
    },

    {
      title: "Quarter",
      dataIndex: "quarter",
      key: "quarter",
      width: "10%",
      render: (quarterText: string) => (
        <span className={tableTextClass}>
          {quarterText ? quarterText.trim().split(/\s+/)[0] : "—"}
        </span>
      ),
    },

    {
      title: "Final Rating",
      dataIndex: "finalRating",
      key: "finalRating",
      width: "11%",
      render: (ratingScore: number | null) =>
        ratingScore != null ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {ratingScore}
          </span>
        ) : (
          <span className="text-slate-400 text-sm font-medium">—</span>
        ),
    },

    {
      title: "Last Modified",
      dataIndex: "lastModified",
      key: "lastModified",
      width: "12%",
      render: (modifiedDate: string | null) =>
        modifiedDate ? (
          <div className={`${tableTextClass} leading-tight`}>
            <div>
              {new Date(modifiedDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-sm font-medium">—</span>
        ),
    },

    {
      title: "Status",
      key: "status",
      width: "14%",
      render: (_: any, record: ManagerReviewItem) => (
        <div className="flex flex-col items-center gap-0.5">
          {renderStatusBadge(record.status)}
          {record.evaluatorName && (
            <span className="text-[10px] text-slate-500 font-medium">
              By: {record.evaluatorName}
            </span>
          )}
        </div>
      ),
    },

    {
      title: "Action",
      key: "action",
      width: "14%",
      render: (_: any, record: ManagerReviewItem) => {
        const isReviewed = record.actionType === ActionType.VIEW;

        return (
          <div className="inline-flex items-center gap-2 justify-center">
            {!isReviewed ? (
              <Button
                type="primary"
                size="small"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => handleOpenEvaluation(record, false)}
                className="!bg-indigo-600 hover:!bg-indigo-700 !text-white !font-semibold !rounded-lg !flex !items-center !gap-1"
              >
                {record.actionLabel || "Evaluate"}
              </Button>
            ) : (
              <Button
                size="small"
                icon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => handleOpenEvaluation(record, true)}
                className="!border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !gap-1"
              >
                View
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="mqr-wrapper w-full min-h-full bg-slate-50 px-6 pt-3 pb-10 flex flex-col gap-3">
      <style>{MQR_FONT_STYLES}</style>

      {/* Top row: just Back + Title/subtitle. */}
      <button
        onClick={handleBack}
        className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4318FF]/10 text-[#4318FF] hover:bg-[#4318FF] hover:text-white transition-all duration-300 w-fit"
      >
        <ArrowLeft
          size={13}
          className="group-hover:-translate-x-1 transition-transform duration-300"
        />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Back
        </span>
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-[#2B3674] tracking-tight">
          {isManagerRoute ? "Manager Quarterly Review" : "Quarterly Review"}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isManagerRoute
            ? "Review, evaluate, and provide ratings for quarterly appraisal submissions from your team members."
            : "Review, evaluate, and provide ratings for quarterly appraisal submissions across the organization."}
        </p>
      </div>

      {/* Stat cards fill the whole row now. The Q1-Q4 quick-filter buttons
          that used to sit to the right of this row have been removed —
          quarter filtering now happens via the dropdown in the filter card
          below (see the "Quarter" Select next to the FY Select).
          `flex-1` on the group below has nothing to share the row with
          anymore, so it stretches across the full width automatically. */}

      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-stretch gap-3 flex-1 min-w-[560px]">
          {/* Total Submissions */}
          <div className="mqr-stat-card rounded-xl border border-slate-200 bg-white p-4 flex-1 min-w-[135px] flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide leading-snug truncate">
                Total Submissions
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.totalSubmissions}
              </p>
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="mqr-stat-card rounded-xl border border-slate-200 bg-white p-4 flex-1 min-w-[135px] flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Hourglass className="w-5 h-5 text-amber-600" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide leading-snug truncate">
                Pending Reviews
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.pendingReviews}
              </p>
            </div>
          </div>

          {/* In Review */}
          <div className="mqr-stat-card rounded-xl border border-slate-200 bg-white p-4 flex-1 min-w-[135px] flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide leading-snug truncate">
                In Review
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.inReview}
              </p>
            </div>
          </div>

          {/* Completed Reviews */}
          <div className="mqr-stat-card rounded-xl border border-slate-200 bg-white p-4 flex-1 min-w-[135px] flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide leading-snug truncate">
                Completed Reviews
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter card for the reviews list. The "Quarterly Reviews" section
          label now lives as this card's own top row (previously a
          separate <h2> sitting above the card) — it's followed by a thin
          divider, then the status segmented-control on the left and the
          search box + Financial Year + Quarter selects grouped on the
          right, all inside the same white card. */}
      <div className="bg-white border border-slate-100 rounded-2xl px-3 pt-2 pb-3 shadow-sm flex flex-col gap-2">
        <h2 className="text-base font-extrabold text-[#2B3674] leading-tight">
          Quarterly Reviews
        </h2>

        <div className="h-px bg-slate-100" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status segmented control — the active tab renders as a white
              pill with a subtle shadow inside a light gray track, the
              "toolbar" pattern used in modern dashboard UIs, rather than
              separate solid-colored buttons competing for attention. */}
          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {STATUS_TAB_ITEMS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatusTab(tab.key)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedStatusTab === tab.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vertical divider between the status control and the filters;
              hidden once the row wraps on narrower widths. */}
          <div className="hidden md:block w-px h-8 bg-slate-200" />

          <div className="flex items-center gap-3 flex-1 min-w-[420px] justify-end">
            <Input
              placeholder="Search employee name or ID..."
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              value={searchQuery}
              onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
              className="!rounded-xl !max-w-md !flex-1"
              allowClear
            />

            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              className="!w-36 !rounded-xl !shrink-0"
            >
              <Option value="ALL">All Roles</Option>
              <Option value="MANAGER">Managers</Option>
              <Option value="EMPLOYEE">Employees</Option>
            </Select>

            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              className="!w-36 !rounded-xl !shrink-0"
              suffixIcon={<Calendar className="w-3.5 h-3.5 text-indigo-500" />}
              dropdownStyle={{ minWidth: 200 }}
            >
              <Option value={YEAR_FILTER_ALL}>All Years</Option>
              {yearOptions.map((yearOption) => (
                <Option key={yearOption} value={yearOption}>
                  {`FY ${yearOption}`}
                </Option>
              ))}
            </Select>

            <Select
              value={selectedQuarterCard}
              onChange={setSelectedQuarterCard}
              className="!w-32 !rounded-xl !shrink-0"
            >
              <Option value={QuarterFilter.ALL}>All Quarters</Option>
              <Option value={QuarterFilter.Q1}>Q1</Option>
              <Option value={QuarterFilter.Q2}>Q2</Option>
              <Option value={QuarterFilter.Q3}>Q3</Option>
              <Option value={QuarterFilter.Q4}>Q4</Option>
            </Select>
          </div>
        </div>
      </div>

      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #EEF2FF !important;
          color: #4338CA !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid #E0E7FF !important;
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          text-align: center !important;
          white-space: nowrap !important;
        }
        .custom-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          text-align: center !important;
        }
        .custom-table .ant-table-thead > tr > th:first-child,
        .custom-table .ant-table-tbody > tr > td:first-child {
          text-align: left !important;
        }
        .custom-table .ant-table-pagination {
          padding: 12px 24px !important;
          margin: 0 !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          transition: background-color 0.15s ease;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #F8FAFC !important;
        }
      `}</style>
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-4">
        {loading && submissions.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <Spin size="large" tip="Loading team quarterly reviews..." />
          </div>
        ) : submissions.length > 0 ? (
          <Table
            columns={columns}
            dataSource={submissions}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalCount,
              showSizeChanger: true,
              onChange: handleTableChange,
            }}
            className="custom-table"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <FileCheck className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              No submissions found
            </h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md">
              There are currently no employee quarterly review submissions
              matching your filters.
            </p>
          </div>
        )}
      </div>

      <QuarterlyViewPage
        open={isModalOpen}
        currentReview={currentReview}
        isViewOnly={isViewOnly}
        ratings={ratings}
        finalRating={finalRating}
        strengths={strengths}
        improvements={improvements}
        remarks={remarks}
        fieldErrors={fieldErrors}
        submitting={submitting}
        averageRatingScore={averageRatingScore}
        onClose={handleCloseModal}
        onSubmitEvaluation={handleSubmitEvaluation}
        setRatings={setRatings}
        setFinalRating={setFinalRating}
        setStrengths={setStrengths}
        setImprovements={setImprovements}
        setRemarks={setRemarks}
        setFieldErrors={setFieldErrors}
      />
    </div>
  );
};

export default ManagerReviewBoardDesktop;