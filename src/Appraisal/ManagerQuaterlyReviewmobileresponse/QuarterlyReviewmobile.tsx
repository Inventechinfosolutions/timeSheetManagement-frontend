import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Spin, message, Avatar, Pagination } from "antd";
import {
  Search,
  Users,
  Clock,
  CheckCircle2,
  FileCheck,
  Eye,
  Edit3,
  Calendar,
  Star,
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
} from "./QuarterlyReviewmobile.types";
import QuarterlyViewPageMobile from "./Quarterlyviewpagemobile";
import "./QuarterlyReviewmobile.css";

const { Option } = Select;

type RatingValues = Record<string, number>;

// Number of submission cards shown per page on the mobile/tablet card
// list. The desktop <Table> below already paginates itself (pageSize:
// 10 via antd's built-in pagination prop) — this constant does the
// same job for the card list, which previously rendered every filtered
// submission in one long unpaginated scroll.
const CARD_PAGE_SIZE = 5;

const renderStatusBadge = (status: string | null) => {
  const s = status || AppraisalStatus.NOT_STARTED;
  if (
    [
      AppraisalStatus.REVIEWED,
      AppraisalStatus.APPROVED,
      AppraisalStatus.COMPLETED,
    ].includes(s as AppraisalStatus)
  ) {
    return (
      <span className="mobile-status-badge mobile-status-badge-success">
        <span className="mobile-status-dot" />
        {s}
      </span>
    );
  }
  if (s === AppraisalStatus.UNDER_REVIEW) {
    return (
      <span className="mobile-status-badge mobile-status-badge-purple">
        <span className="mobile-status-dot" />
        Under Review
      </span>
    );
  }
  return (
    <span className="mobile-status-badge mobile-status-badge-amber">
      <span className="mobile-status-dot" />
      {s}
    </span>
  );
};

const FinalRatingBadge: React.FC<{ rating: number | null }> = ({ rating }) =>
  rating != null ? (
    <span className="mobile-rating-badge">
      <Star className="mobile-rating-icon" />
      {rating}
    </span>
  ) : (
    <span className="mobile-rating-empty">—</span>
  );

const CardField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="mobile-card-field">
    <span className="mobile-card-field-label">{label}</span>
    <span className="mobile-card-field-value">{children}</span>
  </div>
);

const SubmissionCard: React.FC<{
  record: ManagerReviewItem;
  onEvaluate: () => void;
  onView: () => void;
}> = ({ record, onEvaluate, onView }) => {
  const isReviewed = record.actionType === ActionType.VIEW;

  return (
    <div className="mobile-submission-card">
      <div className="mobile-submission-head">
        <div className="mobile-submission-meta">
          <Avatar size="large" className="mobile-avatar">
            {record.employeeName
              ? record.employeeName.charAt(0).toUpperCase()
              : "E"}
          </Avatar>
          <div className="mobile-submission-copy">
            <p className="mobile-submission-title">{record.employeeName}</p>
            <p className="mobile-submission-subtitle">
              {record.designation || "—"}
            </p>
          </div>
        </div>
        {renderStatusBadge(record.status)}
      </div>

      <div className="mobile-card-body">
        <CardField label="Employee ID">
          <span className="mobile-card-field-strong">
            {record.employeeId}
          </span>
        </CardField>
        <CardField label="Quarter">
          <span className="mobile-card-field-strong">
            {record.quarter ? record.quarter.trim().split(/\s+/)[0] : "—"}
          </span>
        </CardField>
        <CardField label="Final Rating">
          <FinalRatingBadge rating={record.finalRating} />
        </CardField>
        <CardField label="Last Modified">
          {record.lastModified ? (
            <span>
              {new Date(record.lastModified).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ) : (
            "—"
          )}
        </CardField>
      </div>

      <div className="mobile-submission-actions">
        {!isReviewed ? (
          <Button
            type="primary"
            size="small"
            icon={<Edit3 className="mobile-icon" />}
            onClick={onEvaluate}
            className="mobile-button-primary"
          >
            {record.actionLabel || "Evaluate"}
          </Button>
        ) : (
          <Button
            type="default"
            size="small"
            icon={<Eye className="mobile-icon" />}
            onClick={onView}
            className="mobile-button-secondary"
          >
            {record.actionLabel || "View"}
          </Button>
        )}
      </div>
    </div>
  );
};

const ManagerReviewBoardMobile: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const { employeeId: employeeIdFromUrl } = useParams<{
    employeeId?: string;
  }>();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<ManagerReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalTeamMembers: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    inReview: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuarterCard, setSelectedQuarterCard] = useState<string>(
    QuarterFilter.ALL,
  );
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>(
    StatusTabFilter.ALL,
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(DEFAULT_YEAR);

  // Current page for the mobile/tablet card list's own pagination
  // (separate from the desktop <Table>'s built-in pagination state).
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentReview, setCurrentReview] = useState<ManagerReviewItem | null>(
    null,
  );
  const [isViewOnly, setIsViewOnly] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingReview, setLoadingReview] = useState<boolean>(false);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, statsRes] = await Promise.all([
        axios.get("/api/manager-quarterly-review"),
        axios.get("/api/manager-quarterly-review/stats"),
      ]);

      if (subsRes.data?.success) {
        setSubmissions(subsRes.data.data || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (err: any) {
      message.error(
        err.response?.data?.message ||
          "Failed to fetch quarterly review submissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const averageRatingScore = useMemo(() => {
    const values = Object.values(ratings) as number[];
    if (values.length === 0) return 0;
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    return (sum / values.length).toFixed(1);
  }, [ratings]);

  const getFinalRatingFromScore = (avg: number): string => {
    if (avg >= 5.0) return PerformanceRating.OUTSTANDING;
    if (avg >= 4.0) return PerformanceRating.EXCEEDS_EXPECTATIONS;
    if (avg >= 3.0) return PerformanceRating.MEETS_EXPECTATIONS;
    if (avg >= 2.0) return PerformanceRating.NEEDS_IMPROVEMENT;
    if (avg >= 1.0) return PerformanceRating.UNSATISFACTORY;
    return "";
  };

  useEffect(() => {
    if (isViewOnly) return;
    const avg = parseFloat(averageRatingScore as unknown as string);
    if (!isNaN(avg)) {
      setFinalRating(getFinalRatingFromScore(avg));
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
    const avg = ratingValues.length
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : 0;
    setFinalRating(
      avg > 0
        ? getFinalRatingFromScore(avg)
        : record.finalRating
          ? getFinalRatingFromScore(record.finalRating)
          : "",
    );

    setStrengths(record.strengths || "");
    setImprovements(record.improvements || "");
    setRemarks(record.remarks || "");
  };

  const loadedEmployeeIdRef = useRef<string | null>(null);

  const loadFreshReview = async (employeeId: string) => {
    try {
      setLoadingReview(true);
      const res = await axios.get(
        `/api/manager-quarterly-review/${employeeId}`,
      );
      if (res.data?.success && res.data?.data) {
        const freshRecord: ManagerReviewItem = res.data.data;
        setCurrentReview(freshRecord);
        applyReviewToForm(freshRecord);
      }
    } catch (err: any) {
      message.error(
        err.response?.data?.message ||
          `Failed to load the latest details for this review.`,
      );
    } finally {
      setLoadingReview(false);
    }
  };

  const handleOpenEvaluation = (
    record: ManagerReviewItem,
    viewOnly: boolean = false,
  ) => {
    setCurrentReview(record);
    setIsViewOnly(viewOnly);
    setFieldErrors({});
    applyReviewToForm(record);
    setIsModalOpen(true);
    loadedEmployeeIdRef.current = record.employeeId;
    navigate(`/manager-dashboard/quarterly-review/${record.employeeId}`, {
      replace: false,
    });
    loadFreshReview(record.employeeId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentReview(null);
    loadedEmployeeIdRef.current = null;
    navigate("/manager-dashboard/quarterly-review", { replace: false });
    fetchData();
  };

  useEffect(() => {
    if (!employeeIdFromUrl || submissions.length === 0) return;
    if (loadedEmployeeIdRef.current === employeeIdFromUrl) return;

    const match = submissions.find((s) => s.employeeId === employeeIdFromUrl);
    if (match) {
      loadedEmployeeIdRef.current = employeeIdFromUrl;
      setCurrentReview(match);
      setIsViewOnly(match.actionType === ActionType.VIEW);
      setFieldErrors({});
      applyReviewToForm(match);
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

      const res = await axios.post(endpoint, payload);

      if (res.data?.success) {
        message.success(
          isDraft
            ? "Evaluation draft saved."
            : "Manager review submitted successfully!",
        );
        setIsModalOpen(false);
        setCurrentReview(null);
        loadedEmployeeIdRef.current = null;
        navigate("/manager-dashboard/quarterly-review", { replace: false });
        fetchData();
      }
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Failed to submit review evaluation.",
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
      let y = currentCalendarYear - YEARS_BEFORE_CURRENT;
      y <= currentCalendarYear + YEARS_AFTER_CURRENT;
      y++
    ) {
      rangeYears.push(toFiscalYearLabel(y));
    }
    const dataYears = submissions
      .map((s) => getSubmissionYear(s))
      .filter(Boolean);
    const years = Array.from(
      new Set([...rangeYears, DEFAULT_YEAR, ...dataYears]),
    ).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return years;
  }, [submissions]);

  // Quarter filtering now runs entirely through this one "All Quarters"
  // select — choosing Q1/Q2/Q3/Q4 does a substring match against each
  // item's quarter label (e.g. "Q2 FY2026-27" contains "Q2"), the same
  // logic the old Q1–Q4 quick-filter cards used before they were removed.
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      if (selectedYear !== YEAR_FILTER_ALL) {
        const itemYear = getSubmissionYear(item);
        if (itemYear && itemYear !== selectedYear) return false;
      }
      if (selectedQuarterCard !== QuarterFilter.ALL) {
        const quarterLabel = (item.quarter || "").toUpperCase();
        if (!quarterLabel.includes(selectedQuarterCard)) {
          return false;
        }
      }
      if (selectedStatusTab !== StatusTabFilter.ALL) {
        // FIX: the status tabs (Pending / In Review / Completed) describe
        // the MANAGER's evaluation progress, which is tracked on
        // `reviewStatus` (Pending | In Review | Reviewed) — a separate
        // field from `status`, which is the employee-facing submission
        // status (Not Started | Under Review | Reviewed | Completed).
        // The previous logic filtered on `status`, so a submission that
        // was "Under Review" on the employee side but never actually
        // touched by the manager (reviewStatus: "Pending") never matched
        // any tab correctly. A missing/null reviewStatus is treated as
        // Pending, since that means the manager hasn't acted on it yet.
        const currentReviewStatus =
          item.reviewStatus || ManagerReviewStatus.PENDING;

        if (
          selectedStatusTab === StatusTabFilter.PENDING &&
          currentReviewStatus !== ManagerReviewStatus.PENDING
        ) {
          return false;
        }
        if (
          selectedStatusTab === StatusTabFilter.IN_REVIEW &&
          currentReviewStatus !== ManagerReviewStatus.IN_REVIEW
        ) {
          return false;
        }
        if (
          selectedStatusTab === StatusTabFilter.COMPLETED &&
          currentReviewStatus !== ManagerReviewStatus.REVIEWED
        ) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.employeeName?.toLowerCase().includes(q);
        const matchesId = item.employeeId?.toLowerCase().includes(q);
        const matchesDept = item.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept) return false;
      }
      return true;
    });
  }, [
    submissions,
    selectedYear,
    selectedQuarterCard,
    selectedStatusTab,
    searchQuery,
  ]);

  // Whenever the filtered result set changes (search, status tab,
  // quarter, or year), snap the card list's pagination back to page 1
  // — otherwise a user filtering down to fewer results could land on
  // a now out-of-range page and see an empty list.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedQuarterCard, selectedStatusTab, searchQuery]);

  // Slice of filteredSubmissions shown on the current card-list page.
  // The desktop <Table> further below still receives the FULL
  // filteredSubmissions array — it paginates itself independently via
  // its own `pagination` prop.
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * CARD_PAGE_SIZE;
    return filteredSubmissions.slice(start, start + CARD_PAGE_SIZE);
  }, [filteredSubmissions, currentPage]);

  const columns = [
    {
      title: "Employee Name",
      key: "employeeName",
      width: "16%",
      render: (_: any, r: ManagerReviewItem) => (
        <div className="mobile-table-name-cell">
          <Avatar size="large" className="mobile-avatar mobile-table-avatar">
            {r.employeeName ? r.employeeName.charAt(0).toUpperCase() : "E"}
          </Avatar>
          <p className="mobile-table-name">{r.employeeName}</p>
        </div>
      ),
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      width: "10%",
      render: (id: string) => <span className="mobile-table-text">{id}</span>,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: "14%",
      render: (d: string) => (
        <span className="mobile-table-text">{d || "—"}</span>
      ),
    },
    {
      title: "Quarter",
      dataIndex: "quarter",
      key: "quarter",
      width: "10%",
      render: (q: string) => (
        <span className="mobile-table-text">
          {q ? q.trim().split(/\s+/)[0] : "—"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: "14%",
      render: (_: any, r: ManagerReviewItem) => renderStatusBadge(r.status),
    },
    {
      title: "Final Rating",
      dataIndex: "finalRating",
      key: "finalRating",
      width: "14%",
      render: (rating: number | null) => <FinalRatingBadge rating={rating} />,
    },
    {
      title: "Last Modified",
      dataIndex: "lastModified",
      key: "lastModified",
      width: "14%",
      render: (d: string | null) =>
        d ? (
          <div className="mobile-table-last-modified">
            <div>
              {new Date(d).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        ) : (
          <span className="mobile-table-empty">—</span>
        ),
    },
    {
      title: "Action",
      key: "action",
      width: "14%",
      render: (_: any, record: ManagerReviewItem) => {
        const isReviewed = record.actionType === ActionType.VIEW;
        return (
          <div className="mobile-table-action-group">
            {!isReviewed ? (
              <Button
                type="primary"
                size="small"
                icon={<Edit3 className="mobile-icon" />}
                onClick={() => handleOpenEvaluation(record, false)}
                className="mobile-button-table mobile-button-primary"
              >
                {record.actionLabel || "Evaluate"}
              </Button>
            ) : (
              <Button
                type="default"
                size="small"
                icon={<Eye className="mobile-icon" />}
                onClick={() => handleOpenEvaluation(record, true)}
                className="mobile-button-table mobile-button-secondary"
              >
                {record.actionLabel || "View"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="quarterly-review-mobile-view mobile-page-shell">
      {/* Back Navigation Row + Header */}
      <div className="mobile-page-header-stack">
        {/* Top Header. The FY pill/select and the Q1-Q4 quick-filter
            cards that used to sit here have both been removed — Financial
            Year now lives inside the filter bar below (now the FIRST
            filter, ahead of "All Quarters"), and quarter filtering is
            handled entirely by the "All Quarters" select in that same
            filter bar. */}
        <div className="mobile-page-header-row">
          <div className="mobile-page-header-copy">
            <div className="mobile-title-col">
              <h1 className="mobile-page-title">
                Manager Quarterly Review
              </h1>
              <p className="mobile-page-subtitle">
                Review and rate your team's quarterly submissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards — 2 cols on mobile, 4 in a row from
          tablet width up (see .mobile-stat-grid). Label font size dropped
          further on phones (text-[9px]) and icon wrap padding tightened
          so "Total Submissions" / "Completed Reviews" fit on one line
          without truncating to "TOTAL SUBMISSIO..." */}
      <div className="mobile-stat-grid">
        <div className="mobile-stat-card">
          <div className="mobile-stat-icon-wrap indigo">
            <Users className="mobile-stat-icon" />
          </div>
          <div className="mobile-stat-content">
            <p className="mobile-stat-label">Total Submissions</p>
            <p className="mobile-stat-value">{stats.totalSubmissions}</p>
          </div>
        </div>

        <div className="mobile-stat-card amber">
          <div className="mobile-stat-icon-wrap amber">
            <Clock className="mobile-stat-icon" />
          </div>
          <div className="mobile-stat-content">
            <p className="mobile-stat-label">Pending Reviews</p>
            <p className="mobile-stat-value">{stats.pendingReviews}</p>
          </div>
        </div>

        <div className="mobile-stat-card blue">
          <div className="mobile-stat-icon-wrap blue">
            <Edit3 className="mobile-stat-icon" />
          </div>
          <div className="mobile-stat-content">
            <p className="mobile-stat-label">In Review</p>
            <p className="mobile-stat-value">{stats.inReview}</p>
          </div>
        </div>

        <div className="mobile-stat-card emerald">
          <div className="mobile-stat-icon-wrap emerald">
            <CheckCircle2 className="mobile-stat-icon" />
          </div>
          <div className="mobile-stat-content">
            <p className="mobile-stat-label">Completed Reviews</p>
            <p className="mobile-stat-value">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Section — stacks vertically on mobile, search/select go full width.
          Status tabs shrunk (text-[10px], tighter padding) so all four
          ("All Reviews" / "Pending" / "In Review" / "Completed") fit in view
          on a phone-width card without "Completed" getting scrolled off.

          ORDER (top to bottom): status tabs -> Financial Year select
          (now FIRST, with a calendar icon) -> search + "All Quarters"
          select (search/quarter toolbar now comes SECOND, right after
          FY). Quarter filtering (Q1–Q4) is substring-matched against
          each item's quarter label. */}
      <div className="mobile-filter-bar">
        {/* NEW: subheading above the status tabs, inside the filter card. */}
        <h2 className="mobile-filter-heading">Quarterly Reviews</h2>

        <div className="mobile-filter-tabs">
          {STATUS_TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatusTab(tab.key)}
              className={`mobile-filter-tab ${selectedStatusTab === tab.key ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters, in order: 1) Search  2) Financial Year (with calendar
            icon)  3) All Quarters. Each is its own full-width row. */}
        <div className="mobile-toolbar mobile-toolbar-stacked">
          <Input
            placeholder="Search employee name or ID..."
            prefix={<Search className="mobile-search-icon" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-input"
            allowClear
          />

          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            className="mobile-year-select-full"
            suffixIcon={<Calendar className="mobile-select-calendar-icon" />}
            dropdownStyle={{ minWidth: 160 }}
          >
            <Option value={YEAR_FILTER_ALL}>All FY Year</Option>
            {yearOptions.map((y) => (
              <Option key={y} value={y}>
                {`FY ${y}`}
              </Option>
            ))}
          </Select>

          <Select
            value={selectedQuarterCard}
            onChange={setSelectedQuarterCard}
            className="mobile-select"
          >
            <Option value={QuarterFilter.ALL}>All Quarters</Option>
            <Option value={QuarterFilter.Q1}>Q1</Option>
            <Option value={QuarterFilter.Q2}>Q2</Option>
            <Option value={QuarterFilter.Q3}>Q3</Option>
            <Option value={QuarterFilter.Q4}>Q4</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="mobile-loading-state">
          <div className="mobile-loading-state-inner">
            <Spin size="large" tip="Loading team quarterly reviews..." />
          </div>
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <>
          {/* Mobile card list — now shows only the current page's slice
              (paginatedSubmissions) instead of every filtered result, so
              the page no longer turns into one long continuous scroll. */}
          <div className="mobile-card-list">
            {paginatedSubmissions.map((record) => (
              <SubmissionCard
                key={record.id}
                record={record}
                onEvaluate={() => handleOpenEvaluation(record, false)}
                onView={() => handleOpenEvaluation(record, true)}
              />
            ))}
          </div>

          {/* Compact pagination for the mobile/tablet card list. Only
              rendered when there's more than one page, and hidden at
              desktop widths via .mobile-pagination's own media query
              (the <Table> below has its own built-in pagination there). */}
          {filteredSubmissions.length > CARD_PAGE_SIZE && (
            <div className="mobile-pagination">
              <Pagination
                current={currentPage}
                pageSize={CARD_PAGE_SIZE}
                total={filteredSubmissions.length}
                onChange={setCurrentPage}
                simple
              />
            </div>
          )}

          {/* Desktop / tablet table */}
          <div className="mobile-table-shell">
            <Table
              columns={columns}
              dataSource={filteredSubmissions}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true }}
              className="custom-table"
              scroll={{ x: 900 }}
            />
          </div>
        </>
      ) : (
        <div className="mobile-empty-state">
          <div className="mobile-empty-state-inner">
            <FileCheck className="mobile-empty-icon" />
            <h3 className="mobile-empty-title">No submissions found</h3>
            <p className="mobile-empty-copy">
              There are currently no employee quarterly review submissions
              matching your filters.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Evaluation Modal / Drawer Component (mobile-responsive viewpage) */}
      <QuarterlyViewPageMobile
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
        loadingReview={loadingReview}
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

export default ManagerReviewBoardMobile;