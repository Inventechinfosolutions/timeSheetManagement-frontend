import { HiddenRatingBadge } from "../components/HiddenRatingBadge";
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
  Plus,
  Key,
  Clock,
  Send,
  ShieldCheck,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import axios from "axios";
import { Modal, Badge } from "antd";
import type { ReviewAccessRequest } from "../../reducers/quarterlyReview.reducer";
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
  STATUS_FILTER_ITEMS,
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
    assignmentSummary: {},
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
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
  const [teamEmployees, setTeamEmployees] = useState<
    Array<{ employeeId: string; employeeName: string; designation?: string }>
  >([]);
  const [loadingTeamEmployees, setLoadingTeamEmployees] = useState<boolean>(false);
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

  interface AssignableEmployee {
    employeeId: string;
    employeeName: string;
    designation?: string;
    department?: string;
    email?: string;
    isAssigned?: boolean;
    assignedQuarters?: string[];
  }

  // Assign Review modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignQuarter, setAssignQuarter] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignEmployeeName, setAssignEmployeeName] = useState("");
  const [assignableEmployees, setAssignableEmployees] = useState<AssignableEmployee[]>([]);
  const [loadingAssignableEmployees, setLoadingAssignableEmployees] = useState(false);
  const [assignMode, setAssignMode] = useState<"individual" | "all">("individual");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeAssignedQuarters, setEmployeeAssignedQuarters] = useState<string[]>([]);

  // Derived assigned quarters for currently selected employee(s)
  const currentAssignedQuarters = useMemo(() => {
    if (assignMode === "all") {
      if (!assignableEmployees || assignableEmployees.length === 0) return [];
      const firstEmpQs = assignableEmployees[0]?.assignedQuarters || [];
      return firstEmpQs.filter((q) =>
        assignableEmployees.every((emp) => emp.assignedQuarters?.includes(q))
      );
    }

    if (selectedEmployeeIds.length === 0) {
      return employeeAssignedQuarters || [];
    }

    const assignedSet = new Set<string>(employeeAssignedQuarters || []);
    selectedEmployeeIds.forEach((empId) => {
      const emp = assignableEmployees.find(
        (e) => String(e.employeeId) === String(empId)
      );
      if (emp?.assignedQuarters && Array.isArray(emp.assignedQuarters)) {
        emp.assignedQuarters.forEach((q) => assignedSet.add(q));
      }
    });
    return Array.from(assignedSet);
  }, [assignMode, selectedEmployeeIds, assignableEmployees, employeeAssignedQuarters]);

  // Clear assignQuarter if the newly selected employee already has it assigned
  useEffect(() => {
    if (
      assignQuarter &&
      currentAssignedQuarters.some((q) =>
        q.toUpperCase().startsWith(assignQuarter.toUpperCase().split(" ")[0])
      )
    ) {
      setAssignQuarter("");
    }
  }, [currentAssignedQuarters, assignQuarter]);

  // Access Requests panel state
  const [accessRequestsOpen, setAccessRequestsOpen] = useState(false);
  // Employee assignment list modal state (for clicking Assigned / Not Assigned)
  const [assignmentListModalOpen, setAssignmentListModalOpen] = useState(false);
  const [assignmentListType, setAssignmentListType] = useState<"assigned" | "not_assigned" | "single_quarter">("assigned");
  const [assignedSubTab, setAssignedSubTab] = useState<"all" | "single_quarter">("all");
  const [assignmentListSearch, setAssignmentListSearch] = useState("");
  const [accessRequests, setAccessRequests] = useState<ReviewAccessRequest[]>([]);
  const [accessRequestsLoading, setAccessRequestsLoading] = useState(false);
  const [actioningRequestId, setActioningRequestId] = useState<string | number | null>(null);

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
      if (selectedEmployee && selectedEmployee !== "ALL")
        params.employeeId = selectedEmployee;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const statsParams: Record<string, any> = {};
      if (selectedQuarterCard !== QuarterFilter.ALL) {
        statsParams.quarter = selectedQuarterCard;
      } else if (selectedQuarter !== QuarterFilter.ALL) {
        statsParams.quarter = selectedQuarter;
      }
      if (selectedYear !== YEAR_FILTER_ALL) {
        statsParams.financialYear = selectedYear;
      }

      const [subsRes, statsRes] = await Promise.all([
        axios.get("/api/manager-quarterly-review", { params }),
        axios.get("/api/manager-quarterly-review/stats", { params: statsParams }),
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

    // Fetch team employees for the employee filter dropdown
    setLoadingTeamEmployees(true);
    axios
      .get("/api/manager-quarterly-review/employees")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTeamEmployees(res.data.data);
        }
      })
      .catch(() => {
        axios
          .get("/api/quarterly-review/assignable-employees")
          .then((res) => {
            if (res.data?.success && Array.isArray(res.data.data)) {
              setTeamEmployees(res.data.data);
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        setLoadingTeamEmployees(false);
      });
  }, []);
 
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

  // ── Assign Review ───────────────────────────────────────────────────────
  // ─── Quarter availability helpers ────────────────────────────────────────────
  /**
   * Returns all 4 Indian-FY quarters for the CURRENT financial year.
   * - disabled: true  → quarter number is greater than the current quarter (future)
   * Indian FY: Q1=Apr–Jun, Q2=Jul–Sep, Q3=Oct–Dec, Q4=Jan–Mar
   */
  const getAvailableQuarters = (assignedQ: string[] = []): Array<{
    value: string;
    label: string;
    disabled: boolean;
    reason?: "upcoming" | "already_assigned";
  }> => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 0=Jan, 1=Feb, ..., 8=Sep

    let currentQ: number;
    let fyStartYear: number;
    if (month >= 3 && month <= 5)       { currentQ = 1; fyStartYear = now.getFullYear(); }
    else if (month >= 6 && month <= 8)  { currentQ = 2; fyStartYear = now.getFullYear(); }
    else if (month >= 9 && month <= 11) { currentQ = 3; fyStartYear = now.getFullYear(); }
    else                                { currentQ = 4; fyStartYear = now.getFullYear() - 1; }

    const fyEnd = String(fyStartYear + 1).slice(2);
    const fy = `FY${fyStartYear}-${fyEnd}`;

    const quarters = [
      { qNum: 1, prefix: "Q1", months: "Apr – Jun" },
      { qNum: 2, prefix: "Q2", months: "Jul – Sep" },
      { qNum: 3, prefix: "Q3", months: "Oct – Dec" },
      { qNum: 4, prefix: "Q4", months: "Jan – Mar" },
    ];

    return quarters.map((q) => {
      const val = `${q.prefix} ${fy}`;
      const isUpcoming = q.qNum > currentQ;
      const isAlreadyAssigned = assignedQ.some((assigned) => {
        const norm = (assigned || "").trim().toUpperCase();
        return norm.startsWith(q.prefix.toUpperCase() + " ") || norm === q.prefix.toUpperCase();
      });

      let disabled = false;
      let reason: "upcoming" | "already_assigned" | undefined;

      if (isUpcoming) {
        disabled = true;
        reason = "upcoming";
      } else if (isAlreadyAssigned) {
        disabled = true;
        reason = "already_assigned";
      }

      return {
        value: val,
        label: `${q.prefix} ${fy} (${q.months})`,
        disabled,
        reason,
      };
    });
  };

  const handleAssignQuarterChange = async (val: string) => {
    setAssignQuarter(val);
    if (!val) return;
    try {
      setLoadingAssignableEmployees(true);
      const res = await axios.get("/api/quarterly-review/assignable-employees", {
        params: { quarter: val },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAssignableEmployees(res.data.data);
      }
    } catch (err: any) {
      console.warn("Failed to update assignable employees for quarter:", err);
    } finally {
      setLoadingAssignableEmployees(false);
    }
  };

  const openAssignModal = async (item?: ManagerReviewItem) => {
    setAssignModalOpen(true);
    const initialQ = (selectedQuarter && selectedQuarter !== QuarterFilter.ALL) ? selectedQuarter : "";
    setAssignQuarter(initialQ);
    setAssignNotes("");
    setLoadingAssignableEmployees(true);

    if (item) {
      const singleId = String(item.employeeId || item.id || "");
      setAssignEmployeeId(singleId);
      setAssignEmployeeName(item.employeeName || "");
      setSelectedEmployeeIds([singleId]);
      setAssignMode("individual");
      // Fetch per-quarter assignment status for this employee (parallel)
      try {
        const singleId = String(item.employeeId || item.id || '');
        const availQs = getAvailableQuarters().filter(q => !q.disabled);
        const qResults = await Promise.allSettled(
          availQs.map(q =>
            axios.get('/api/quarterly-review/assignable-employees', { params: { quarter: q.value } })
          )
        );
        const assignedQs: string[] = [];
        qResults.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.data?.success) {
            const empList = result.value.data.data as any[];
            const match = empList.find((e: any) => String(e.employeeId) === singleId);
            if (match?.isAssigned) assignedQs.push(availQs[idx].value);
          }
        });
        setEmployeeAssignedQuarters(assignedQs);
      } catch (_qErr) {
        setEmployeeAssignedQuarters([]);
      }
    } else {
      setAssignEmployeeId("");
      setAssignEmployeeName("");
      setSelectedEmployeeIds([]);
      setAssignMode("individual");
      setEmployeeAssignedQuarters([]);
    }

    try {
      const res = await axios.get("/api/quarterly-review/assignable-employees", {
        params: initialQ ? { quarter: initialQ } : {},
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAssignableEmployees(res.data.data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch assignable employees:", err);
    } finally {
      setLoadingAssignableEmployees(false);
    }
  };

  const handleAssignReview = async () => {
    if (!assignQuarter) {
      message.error("Please select a quarter to assign.");
      return;
    }

    const available = getAvailableQuarters(currentAssignedQuarters);
    const chosen = available.find((q) => q.value === assignQuarter);
    if (chosen?.disabled) {
      if (chosen.reason === "already_assigned") {
        message.error(
          `${assignQuarter} has already been assigned to the selected employee(s). Access can only be renewed via an approved Access Request.`
        );
      } else {
        message.error(`${assignQuarter} is an upcoming quarter and cannot be assigned yet.`);
      }
      return;
    }
    if (assignMode === "individual" && selectedEmployeeIds.length === 0) {
      message.error("Please select at least one employee or choose 'All Members'.");
      return;
    }

    try {
      setAssignSubmitting(true);
      const payload: any = {
        quarter: assignQuarter,
        notes: assignNotes,
      };

      if (assignMode === "all") {
        payload.assignToAll = true;
      } else {
        payload.employeeIds = selectedEmployeeIds;
        if (selectedEmployeeIds.length === 1) {
          payload.employeeId = selectedEmployeeIds[0];
        }
      }

      const res = await axios.post("/api/quarterly-review/assign", payload);
      if (res.data?.success) {
        const count = res.data?.data?.assignedCount ?? (assignMode === "all" ? assignableEmployees.length : selectedEmployeeIds.length);
        message.success(
          res.data?.message || `Review for ${assignQuarter} assigned to ${count} member(s) successfully.`
        );
        setAssignModalOpen(false);
        fetchData(1, pageSize);
      } else {
        message.error(res.data?.message || "Failed to assign review.");
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to assign review.",
      );
    } finally {
      setAssignSubmitting(false);
    }
  };

  // ── Access Requests ─────────────────────────────────────────────────────
  const loadAccessRequests = async () => {
    try {
      setAccessRequestsLoading(true);
      const res = await axios.get("/api/quarterly-review/access-requests", {
        params: { status: "pending" },
      });
      if (res.data?.success) {
        setAccessRequests(res.data.data || []);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to load access requests.",
      );
    } finally {
      setAccessRequestsLoading(false);
    }
  };

  const openAccessRequestsPanel = () => {
    setAccessRequestsOpen(true);
    loadAccessRequests();
  };

  const handleAccessRequestAction = async (
    requestId: string | number,
    action: "approve" | "reject",
  ) => {
    try {
      setActioningRequestId(requestId);
      const res = await axios.patch(
        `/api/quarterly-review/access-requests/${requestId}/${action}`,
      );
      if (res.data?.success) {
        message.success(
          action === "approve"
            ? "Access request approved. The employee may now edit their submission."
            : "Access request rejected.",
        );
        // Refresh the list and the main table
        loadAccessRequests();
        fetchData(currentPage, pageSize);
      } else {
        message.error(res.data?.message || "Action failed.");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Action failed.");
    } finally {
      setActioningRequestId(null);
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedRole("ALL");
    setSelectedYear(YEAR_FILTER_ALL);
    setSelectedQuarterCard(QuarterFilter.ALL);
    setSelectedEmployee("ALL");
    setSelectedStatusTab(StatusTabFilter.ALL);
    setCurrentPage(1);
  };

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
    selectedEmployee,
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
    if (currentStatus === "Assigned") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Assigned
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
      render: (ratingScore: number | null, record: ManagerReviewItem) =>
        record.isFinalRatingHidden ? (
          <HiddenRatingBadge
            reviewId={record.id}
            quarter={record.quarter}
            finalRating={ratingScore}
            isFinalRatingHidden={true}
            hasFinalRating={record.hasFinalRating}
          />
        ) : ratingScore != null ? (
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
      width: "18%",
      render: (_: any, record: ManagerReviewItem) => {
        const isReviewed = record.actionType === ActionType.VIEW;
        const isAssignedOnly = (record.status === "Assigned" || record.status === "Draft") && record.reviewStatus !== "Draft";

        return (
          <div className="inline-flex flex-wrap items-center gap-1.5 justify-center">
            {isAssignedOnly ? (
              <Button
                size="small"
                icon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => handleOpenEvaluation(record, true)}
                className="!border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !gap-1"
              >
                View
              </Button>
            ) : !isReviewed ? (
              <Button
                type="primary"
                size="small"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => handleOpenEvaluation(record, false)}
                className="!bg-indigo-600 hover:!bg-indigo-700 !text-white !font-semibold !rounded-lg !flex !items-center !gap-1"
              >
                {record.reviewStatus === "Draft" ? "Edit Evaluation" : (record.actionLabel || "Evaluate")}
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
            {/* Assign a quarter review directly from a row */}
            <Button
              size="small"
              icon={<Send className="w-3 h-3" />}
              onClick={() => openAssignModal(record)}
              title="Assign a quarter review to this employee"
              className="!border-indigo-300 !text-indigo-600 hover:!bg-indigo-50 !font-semibold !rounded-lg !flex !items-center !gap-1"
            >
              Assign
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mqr-wrapper w-full min-h-full bg-slate-50 px-6 pt-3 pb-10 flex flex-col gap-3">
      <style>{MQR_FONT_STYLES}</style>

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

      {/* ── Employee Assignment — single Create button ── */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setAssignmentListType("not_assigned");
            setAssignmentListSearch("");
            setAssignmentListModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <span className="text-base leading-none">+</span>
          Create
        </button>
      </div>

      {/* ── Review Submissions Summary Cards - COMMENTED OUT ── */}
      {/*
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-stretch gap-3 flex-1 min-w-[560px]">
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
      */}

      {/* Filter card for the reviews list. The "Quarterly Reviews" section
          label now lives as this card's own top row (previously a
          separate <h2> sitting above the card) — it's followed by a thin
          divider, then the status segmented-control on the left and the
          search box + Financial Year + Quarter selects grouped on the
          right, all inside the same white card. */}
      <div className="bg-white border border-slate-100 rounded-2xl px-3 pt-2 pb-3 shadow-sm flex flex-col gap-2 relative z-20">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-[#2B3674] leading-tight">
            Quarterly Reviews
          </h2>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer shadow-xs"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        <div className="h-px bg-slate-100" />


        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search + Filter dropdowns — now on the LEFT */}
          <div className="flex items-center gap-3 flex-1 min-w-[420px]">
            <Input
              placeholder="Search employee name or ID..."
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              value={searchQuery}
              onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
              className="!rounded-xl !max-w-md !flex-1"
              allowClear
            />

            {/* Role dropdown wrapped in dedicated relative container */}
            <div className="relative shrink-0">
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                className="!w-36 !rounded-xl"
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                <Option value="ALL">All Roles</Option>
                <Option value="MANAGER">Managers</Option>
                <Option value="EMPLOYEE">Employees</Option>
              </Select>
            </div>

            {/* Year dropdown wrapped in dedicated relative container */}
            <div className="relative shrink-0">
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                className="!w-36 !rounded-xl"
                suffixIcon={<Calendar className="w-3.5 h-3.5 text-indigo-500" />}
                dropdownStyle={{ minWidth: 200 }}
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                <Option value={YEAR_FILTER_ALL}>All Years</Option>
                {yearOptions.map((yearOption) => (
                  <Option key={yearOption} value={yearOption}>
                    {`FY ${yearOption}`}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Quarter dropdown wrapped in dedicated relative container */}
            <div className="relative shrink-0">
              <Select
                value={selectedQuarterCard}
                onChange={setSelectedQuarterCard}
                className="!w-32 !rounded-xl"
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                <Option value={QuarterFilter.ALL}>Quarters</Option>
                <Option value={QuarterFilter.Q1}>Q1</Option>
                <Option value={QuarterFilter.Q2}>Q2</Option>
                <Option value={QuarterFilter.Q3}>Q3</Option>
                <Option value={QuarterFilter.Q4}>Q4</Option>
              </Select>
            </div>

            {/* Employee dropdown beside Quarters wrapped in dedicated relative container */}
            <div className="relative shrink-0">
              <Select
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                loading={loadingTeamEmployees}
                className="!w-52 !rounded-xl"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                dropdownStyle={{ minWidth: 260 }}
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                <Option value="ALL">All Employees</Option>
                {teamEmployees.map((emp) => (
                  <Option key={emp.employeeId} value={emp.employeeId}>
                    {emp.employeeName && emp.employeeName !== emp.employeeId
                      ? `${emp.employeeName} (${emp.employeeId})`
                      : emp.employeeId}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block w-px h-8 bg-slate-200" />

          {/* Status dropdown — RIGHT side wrapped in dedicated relative container */}
          <div className="relative shrink-0">
            <Select
              value={selectedStatusTab}
              onChange={(val) => setSelectedStatusTab(val)}
              className="!w-40 !rounded-xl"
              getPopupContainer={(trigger) => trigger.parentElement!}
            >
              {STATUS_FILTER_ITEMS.map((item) => (
                <Option key={item.key} value={item.key}>
                  {item.label}
                </Option>
              ))}
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

      {/* ── Assign Review Modal ────────────────────────────────────── */}
      {/* Modal for Assigned / Not Assigned Employee List */}
      <Modal
        open={assignmentListModalOpen}
        onCancel={() => setAssignmentListModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setAssignmentListModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={820}
        title={
          <div className="flex items-center gap-2.5 pb-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                assignmentListType === "not_assigned"
                  ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                  : "bg-violet-50 text-violet-600 border border-violet-200/60"
              }`}
            >
              {assignmentListType === "not_assigned" ? (
                <Hourglass className="w-5 h-5" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {assignmentListType === "not_assigned"
                  ? `Employees Not Assigned – ${stats.assignmentSummary?.quarter || selectedQuarterCard} ${stats.assignmentSummary?.financialYear || selectedYear}`
                  : `Assigned Employees – ${stats.assignmentSummary?.quarter || selectedQuarterCard} ${stats.assignmentSummary?.financialYear || selectedYear}`}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {assignmentListType === "not_assigned"
                  ? `Employees who have NOT been assigned a review for this quarter (${stats.assignmentSummary?.notAssignedCount ?? 0} members)`
                  : `Assigned employees (${stats.assignmentSummary?.assignedCount ?? 0}) and members with pending quarters (${stats.assignmentSummary?.singleQuarterCount ?? 0})`}
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3.5 pt-2">
          {assignmentListType !== "not_assigned" && (
            <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 w-fit">
              <button
                type="button"
                onClick={() => setAssignedSubTab("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  assignedSubTab === "all"
                    ? "bg-white text-violet-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>All Assigned Members</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-violet-100 text-violet-700 font-semibold">
                  {stats.assignmentSummary?.assignedCount ?? 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAssignedSubTab("single_quarter")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  assignedSubTab === "single_quarter"
                    ? "bg-white text-violet-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>1 Quarter Assigned (1 Pending)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-semibold">
                  {stats.assignmentSummary?.singleQuarterCount ?? 0}
                </span>
              </button>
            </div>
          )}

          <Input
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Search employee by name, ID, designation, department..."
            value={assignmentListSearch}
            onChange={(e) => setAssignmentListSearch(e.target.value)}
            allowClear
            className="!rounded-xl"
          />

          <Table
            dataSource={
              (assignmentListType === "not_assigned"
                ? (stats.assignmentSummary?.notAssignedEmployees || [])
                : assignedSubTab === "single_quarter"
                ? (stats.assignmentSummary?.singleQuarterEmployees || [])
                : (stats.assignmentSummary?.assignedEmployees || [])
              ).filter((emp: any) => {
                if (!assignmentListSearch.trim()) return true;
                const q = assignmentListSearch.toLowerCase();
                return (
                  emp.employeeName?.toLowerCase().includes(q) ||
                  emp.employeeId?.toLowerCase().includes(q) ||
                  emp.designation?.toLowerCase().includes(q) ||
                  emp.department?.toLowerCase().includes(q) ||
                  emp.assignedQuarter?.toLowerCase().includes(q) ||
                  emp.quarter?.toLowerCase().includes(q) ||
                  emp.pendingQuarter?.toLowerCase().includes(q) ||
                  emp.status?.toLowerCase().includes(q)
                );
              })
            }
            rowKey="employeeId"
            pagination={{ pageSize: 8, showSizeChanger: false }}
            size="middle"
            columns={
              assignmentListType === "not_assigned"
                ? [
                    {
                      title: "Employee Name",
                      dataIndex: "employeeName",
                      key: "employeeName",
                      render: (name: string, record: any) => (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {name ? name.slice(0, 2).toUpperCase() : "EM"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-snug">
                              {name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {record.department || "General"}
                            </p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Employee ID",
                      dataIndex: "employeeId",
                      key: "employeeId",
                      render: (id: string) => (
                        <span className="font-mono text-xs text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {id}
                        </span>
                      ),
                    },
                    {
                      title: "Designation",
                      dataIndex: "designation",
                      key: "designation",
                      render: (desig: string) => (
                        <span className="text-slate-600 text-xs font-medium">
                          {desig || "Team Member"}
                        </span>
                      ),
                    },
                    {
                      title: "Action",
                      key: "action",
                      render: (_: any, record: any) => (
                        <Button
                          size="small"
                          type="primary"
                          className="!bg-indigo-600 hover:!bg-indigo-700 !text-xs !font-semibold !rounded-lg"
                          onClick={() => {
                            setAssignmentListModalOpen(false);
                            openAssignModal({
                              id: record.employeeId,
                              employeeId: record.employeeId,
                              employeeName: record.employeeName,
                            } as any);
                          }}
                        >
                          + Assign Review
                        </Button>
                      ),
                    },
                  ]
                : assignedSubTab === "single_quarter"
                ? [
                    {
                      title: "Employee Name",
                      dataIndex: "employeeName",
                      key: "employeeName",
                      render: (name: string, record: any) => (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {name ? name.slice(0, 2).toUpperCase() : "EM"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-snug">
                              {name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {record.department || "General"}
                            </p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Employee ID",
                      dataIndex: "employeeId",
                      key: "employeeId",
                      render: (id: string) => (
                        <span className="font-mono text-xs text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {id}
                        </span>
                      ),
                    },
                    {
                      title: "Designation",
                      dataIndex: "designation",
                      key: "designation",
                      render: (desig: string) => (
                        <span className="text-slate-600 text-xs font-medium">
                          {desig || "Team Member"}
                        </span>
                      ),
                    },
                    {
                      title: "Assigned Quarter",
                      dataIndex: "assignedQuarter",
                      key: "assignedQuarter",
                      render: (q: string) => (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {q || "Assigned"}
                        </span>
                      ),
                    },
                    {
                      title: "Pending Quarter",
                      dataIndex: "pendingQuarter",
                      key: "pendingQuarter",
                      render: (q: string) => (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Hourglass className="w-3.5 h-3.5" />
                          {q ? q + " Pending" : "Pending"}
                        </span>
                      ),
                    },
                    {
                      title: "Action",
                      key: "action",
                      render: (_: any, record: any) => (
                        <Button
                          size="small"
                          type="primary"
                          className="!bg-indigo-600 hover:!bg-indigo-700 !text-xs !font-semibold !rounded-lg"
                          onClick={() => {
                            setAssignmentListModalOpen(false);
                            openAssignModal({
                              id: record.employeeId,
                              employeeId: record.employeeId,
                              employeeName: record.employeeName,
                            } as any);
                          }}
                        >
                          + Assign Review
                        </Button>
                      ),
                    },
                  ]
                : [
                    {
                      title: "Employee Name",
                      dataIndex: "employeeName",
                      key: "employeeName",
                      render: (name: string, record: any) => (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {name ? name.slice(0, 2).toUpperCase() : "EM"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-snug">
                              {name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {record.department || "General"}
                            </p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Employee ID",
                      dataIndex: "employeeId",
                      key: "employeeId",
                      render: (id: string) => (
                        <span className="font-mono text-xs text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {id}
                        </span>
                      ),
                    },
                    {
                      title: "Designation",
                      dataIndex: "designation",
                      key: "designation",
                      render: (desig: string) => (
                        <span className="text-slate-600 text-xs font-medium">
                          {desig || "Team Member"}
                        </span>
                      ),
                    },
                    {
                      title: "Assigned Quarter",
                      dataIndex: "assignedQuarter",
                      key: "assignedQuarter",
                      render: (_: string, record: any) => {
                        const qText =
                          record.assignedQuarters && record.assignedQuarters.length > 0
                            ? record.assignedQuarters.join(", ")
                            : record.assignedQuarter || record.quarter || "Assigned";
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {qText}
                          </span>
                        );
                      },
                    },
                    {
                      title: "Pending Quarter",
                      dataIndex: "pendingQuarter",
                      key: "pendingQuarter",
                      render: (q: string, record: any) => {
                        const pendingText =
                          record.pendingQuarters && record.pendingQuarters.length > 0
                            ? record.pendingQuarters.join(", ") + " Pending"
                            : q
                            ? q + " Pending"
                            : null;
                        return pendingText ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Hourglass className="w-3.5 h-3.5" />
                            {pendingText}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            None
                          </span>
                        );
                      },
                    },
                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      render: (st: string) => (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {st || "Assigned"}
                        </span>
                      ),
                    },
                    {
                      title: "Action",
                      key: "action",
                      render: (_: any, record: any) => {
                        const hasPending =
                          (record.pendingQuarters && record.pendingQuarters.length > 0) ||
                          Boolean(record.pendingQuarter);
                        if (!hasPending) {
                          return <span className="text-xs text-slate-400 font-medium">—</span>;
                        }
                        return (
                          <Button
                            size="small"
                            type="primary"
                            className="!bg-indigo-600 hover:!bg-indigo-700 !text-xs !font-semibold !rounded-lg"
                            onClick={() => {
                              setAssignmentListModalOpen(false);
                              openAssignModal({
                                id: record.employeeId,
                                employeeId: record.employeeId,
                                employeeName: record.employeeName,
                              } as any);
                            }}
                          >
                            + Assign Review
                          </Button>
                        );
                      },
                    },
                  ]
            }
          />
        </div>
      </Modal>

      <Modal
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
        title={
          <div className="flex items-center gap-2.5 pb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Send className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2B3674] text-base leading-snug">
                Assign Quarterly Review
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                {isManagerRoute
                  ? "Open review access for your reporting team members"
                  : "Open review access for employees across the organization"}
              </p>
            </div>
          </div>
        }
        destroyOnClose
        centered
        width={540}
      >
        <div className="flex flex-col gap-4 pt-3">
          {/* Target Audience Segmented Tabs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Assignment Target
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl gap-1 border border-slate-200/70">
              <button
                type="button"
                onClick={() => setAssignMode("individual")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  assignMode === "individual"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Select Members ({selectedEmployeeIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("all")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  assignMode === "all"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isManagerRoute ? "All Team Members" : "All Members"}
                </span>
              </button>
            </div>
          </div>

          {/* Mode 1: Individual / Multi-Select */}
          {assignMode === "individual" ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Select Employees
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedEmployeeIds(
                        assignableEmployees.map((e) => e.employeeId)
                      )
                    }
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Select All ({assignableEmployees.length})
                  </button>
                  {selectedEmployeeIds.length > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeIds([])}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              <Select
                mode="multiple"
                loading={loadingAssignableEmployees}
                value={selectedEmployeeIds}
                onChange={(vals) => setSelectedEmployeeIds(vals)}
                placeholder={
                  loadingAssignableEmployees
                    ? "Loading eligible employees..."
                    : isManagerRoute
                    ? "Select one or more team members..."
                    : "Select one or more employees..."
                }
                className="w-full"
                size="large"
                maxTagCount="responsive"
                filterOption={(input, option) => {
                  const label = String(option?.children ?? "");
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {assignableEmployees.map((emp: any) => {
                  const hasAssigned = emp.assignedQuarters && emp.assignedQuarters.length > 0;
                  const assignedTag = hasAssigned
                    ? emp.assignedQuarters
                        .map((q: string) => q.split(" ")[0])
                        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
                        .join(", ")
                    : "";
                  return (
                    <Option key={emp.employeeId} value={emp.employeeId}>
                      <span className="font-medium text-slate-800">
                        {emp.employeeName} ({emp.employeeId})
                      </span>
                      {emp.designation ? (
                        <span className="text-slate-500 font-normal"> — {emp.designation}</span>
                      ) : null}
                      {hasAssigned ? (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 4,
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            fontWeight: 500,
                          }}
                        >
                          {assignedTag} Assigned
                        </span>
                      ) : null}
                    </Option>
                  );
                })}
              </Select>

              {assignableEmployees.length === 0 && !loadingAssignableEmployees && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  {isManagerRoute
                    ? "No mapped team members found for your manager account. Please contact an Administrator to map employees."
                    : "No active employees found in the organization."}
                </p>
              )}
            </div>
          ) : (
            /* Mode 2: Bulk All Members Callout */
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-indigo-900">
                  {isManagerRoute
                    ? `Assign to all ${assignableEmployees.length} team members`
                    : `Assign to all ${assignableEmployees.length} employees in the organization`}
                </h4>
                <p className="text-[11px] text-indigo-700/90 mt-0.5 leading-relaxed">
                  Every eligible member will immediately receive access to complete their self-review for the chosen quarter with an active 72-hour window.
                </p>
              </div>
            </div>
          )}

          {/* Quarter selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Quarter to Assign
            </label>
            <Select
              value={assignQuarter || undefined}
              onChange={handleAssignQuarterChange}
              placeholder="Select a quarter (current or previous only)"
              className="w-full"
              size="large"
            >
              {getAvailableQuarters(currentAssignedQuarters).map((qOpt) => (
                <Option
                  key={qOpt.value}
                  value={qOpt.value}
                  disabled={qOpt.disabled}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={qOpt.disabled ? "text-slate-400 font-normal" : "text-slate-800 font-medium"}>
                      {qOpt.label}
                    </span>
                    {qOpt.disabled && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          color: qOpt.reason === "already_assigned" ? "#dc2626" : "#94a3b8",
                          fontStyle: "italic",
                        }}
                      >
                        {qOpt.reason === "already_assigned" ? "(Already Assigned)" : "(Upcoming)"}
                      </span>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
            <p className="text-[11px] text-slate-400">
              Only the <strong>current</strong> and <strong>previous</strong> quarters can be assigned. Quarters already assigned to the selected employee(s) are disabled (re-granting access requires an <strong>Access Request</strong>). Future quarters remain disabled until they begin.
            </p>
          </div>

          {/* Window info */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 text-xs">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              <strong>Access Window:</strong> Assigned members will have <strong>3 days (72 hours)</strong> from assignment to complete and submit.
            </span>
          </div>

          {/* Optional notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Instructions / Notes{" "}
              <span className="text-slate-400 normal-case font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Add any instructions, focus areas, or deadline remarks for the employee(s)…"
              rows={2}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
            <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={assignSubmitting}
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={handleAssignReview}
              className="!bg-indigo-600 hover:!bg-indigo-700 !font-semibold !rounded-lg"
            >
              {assignMode === "all"
                ? `Assign to All (${assignableEmployees.length})`
                : selectedEmployeeIds.length > 1
                ? `Assign to ${selectedEmployeeIds.length} Members`
                : "Assign Review"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Access Requests Modal ──────────────────────────────────── */}
      <Modal
        open={accessRequestsOpen}
        onCancel={() => setAccessRequestsOpen(false)}
        footer={null}
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Key className="w-4 h-4 text-amber-600" />
            </div>
            <span className="font-extrabold text-[#2B3674]">
              Pending Access Requests
            </span>
          </div>
        }
        destroyOnClose
        centered
        width={600}
      >
        {accessRequestsLoading ? (
          <div className="flex justify-center py-10">
            <Spin tip="Loading access requests…" />
          </div>
        ) : accessRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mb-3" />
            <p className="font-semibold text-slate-700">
              No pending access requests
            </p>
            <p className="text-slate-400 text-sm mt-1">
              All access requests have been actioned.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            {accessRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3"
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {req.employeeName || `Employee #${req.employeeId}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Quarter:{" "}
                    <span className="font-semibold text-slate-700">
                      {req.quarter}
                    </span>
                  </p>
                  {req.requestReason && (
                    <p className="text-xs text-slate-600 mt-1 italic">
                      "{req.requestReason}"
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      {req.requestedAt
                        ? new Date(req.requestedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="small"
                    type="primary"
                    loading={actioningRequestId === req.id}
                    icon={<Check className="w-3 h-3" />}
                    onClick={() =>
                      handleAccessRequestAction(req.id, "approve")
                    }
                    className="!bg-emerald-600 hover:!bg-emerald-700 !font-semibold !rounded-lg"
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    danger
                    loading={actioningRequestId === req.id}
                    icon={<X className="w-3 h-3" />}
                    onClick={() =>
                      handleAccessRequestAction(req.id, "reject")
                    }
                    className="!font-semibold !rounded-lg"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerReviewBoardDesktop;