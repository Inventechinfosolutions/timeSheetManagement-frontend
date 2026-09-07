import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="mobile-submission-title">{record.employeeName}</p>
              {record.employeeRole && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    record.employeeRole.toUpperCase() === "MANAGER"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {record.employeeRole}
                </span>
              )}
            </div>
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
        {record.evaluatorName && (
          <CardField label="Evaluated By">
            <span className="text-slate-800 text-xs font-semibold">
              {record.evaluatorName} {record.evaluatorRole ? `(${record.evaluatorRole})` : ''}
            </span>
          </CardField>
        )}
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
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuarterCard, setSelectedQuarterCard] = useState<string>(
    QuarterFilter.ALL,
  );
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>(
    StatusTabFilter.ALL,
  );
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
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
      const params: Record<string, any> = {};
      if (selectedRole !== "ALL") {
        params.role = selectedRole;
      }
      const [subsRes, statsRes] = await Promise.all([
        axios.get("/api/manager-quarterly-review", { params }),
        axios.get("/api/manager-quarterly-review/stats"),
      ]);

      if (subsRes.data?.success) {
        setSubmissions(subsRes.data.data || []);
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
    navigate(`${baseRoute}/${record.employeeId}`, {
      replace: false,
    });
    loadFreshReview(record.employeeId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentReview(null);
    loadedEmployeeIdRef.current = null;
    navigate(baseRoute, { replace: false });
    fetchData();
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
        navigate(baseRoute, { replace: false });
        fetchData();
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

  // Quarter filtering now runs entirely through this one "All Quarters"
  // select — choosing Q1/Q2/Q3/Q4 does a substring match against each
  // item's quarter label (e.g. "Q2 FY2026-27" contains "Q2"), the same
  // logic the old Q1–Q4 quick-filter cards used before they were removed.
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      if (selectedRole !== "ALL") {
        const itemRole = (item.employeeRole || "EMPLOYEE").toUpperCase();
        if (itemRole !== selectedRole) return false;
      }
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
        const searchQueryLower = searchQuery.toLowerCase();
        const matchesName = item.employeeName?.toLowerCase().includes(searchQueryLower);
        const matchesId = item.employeeId?.toLowerCase().includes(searchQueryLower);
        const matchesDept = item.department?.toLowerCase().includes(searchQueryLower);
        if (!matchesName && !matchesId && !matchesDept) return false;
      }
      return true;
    });
  }, [
    submissions,
    selectedYear,
    selectedQuarterCard,
    selectedStatusTab,
    selectedRole,
    searchQuery,
  ]);

  // Whenever the filtered result set changes (search, status tab,
  // quarter, or year), snap the card list's pagination back to page 1
  // — otherwise a user filtering down to fewer results could land on
  // a now out-of-range page and see an empty list.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedQuarterCard, selectedStatusTab, selectedRole, searchQuery]);

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
      render: (_: any, record: ManagerReviewItem) => (
        <div className="mobile-table-name-cell">
          <Avatar size="large" className="mobile-avatar mobile-table-avatar">
            {record.employeeName ? record.employeeName.charAt(0).toUpperCase() : "E"}
          </Avatar>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="mobile-table-name">{record.employeeName}</p>
              {record.employeeRole && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    record.employeeRole.toUpperCase() === "MANAGER"
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
      ),
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      width: "10%",
      render: (employeeIdString: string) => <span className="mobile-table-text">{employeeIdString}</span>,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: "14%",
      render: (designationString: string) => (
        <span className="mobile-table-text">{designationString || "—"}</span>
      ),
    },
    {
      title: "Quarter",
      dataIndex: "quarter",
      key: "quarter",
      width: "10%",
      render: (quarterString: string) => (
        <span className="mobile-table-text">
          {quarterString ? quarterString.trim().split(/\s+/)[0] : "—"}
        </span>
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
      title: "Final Rating",
      dataIndex: "finalRating",
      key: "finalRating",
      width: "14%",
      render: (ratingValue: number | null) => <FinalRatingBadge rating={ratingValue} />,
    },
    {
      title: "Last Modified",
      dataIndex: "lastModified",
      key: "lastModified",
      width: "14%",
      render: (modifiedDateString: string | null) =>
        modifiedDateString ? (
          <div className="mobile-table-last-modified">
            <div>
              {new Date(modifiedDateString).toLocaleDateString("en-GB", {
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
                {isManagerRoute ? "Manager Quarterly Review" : "Quarterly Review"}
              </h1>
              <p className="mobile-page-subtitle">
                {isManagerRoute
                  ? "Review and rate your team's quarterly submissions."
                  : "Review and rate quarterly appraisal submissions across the organization."}
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
            onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
            className="mobile-input"
            allowClear
          />

          <Select
            value={selectedRole}
            onChange={setSelectedRole}
            className="mobile-select"
          >
            <Option value="ALL">All Roles</Option>
            <Option value="MANAGER">Managers</Option>
            <Option value="EMPLOYEE">Employees</Option>
          </Select>

          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            className="mobile-year-select-full"
            suffixIcon={<Calendar className="mobile-select-calendar-icon" />}
            dropdownStyle={{ minWidth: 160 }}
          >
            <Option value={YEAR_FILTER_ALL}>All FY Year</Option>
            {yearOptions.map((yearOption) => (
              <Option key={yearOption} value={yearOption}>
                {`FY ${yearOption}`}
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