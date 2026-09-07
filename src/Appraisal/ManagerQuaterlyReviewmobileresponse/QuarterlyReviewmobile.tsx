import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppSelector } from "../../hooks";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, Checkbox, Input, Modal, Select, Spin, message, Avatar, Pagination } from "antd";
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
  Bell,
} from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
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
  getDefaultQuarterDates,
  getFormattedQuarterPayload,
} from "./QuarterlyReviewmobile.types";
import QuarterlyViewPageMobile from "./Quarterlyviewpagemobile";
import { QuarterDateItem } from "../ManagerQuaterlyReview/QuarterDateConfigModal";
import "./QuarterlyReviewmobile.css";

const { Option } = Select;

type RatingValues = Record<string, number>;

// Number of submission cards shown per page on the mobile/tablet card
// list. The desktop <Table> below already paginates itself (pageSize:
// 10 via antd's built-in pagination prop) — this constant does the
// same job for the card list, which previously rendered every filtered
// submission in one long unpaginated scroll.
const CARD_PAGE_SIZE = 5;
const REVIEW_GRACE_PERIOD_DAYS = 10;

const getManagerQuarter = (record: ManagerReviewItem): string =>
  (record.quarter || "").trim().split(/\s+/)[0];

const isPendingReviewExpired = (
  record: ManagerReviewItem,
  configs: QuarterDateItem[],
): boolean => {
  if (record.reviewStatus === ManagerReviewStatus.REVIEWED) return false;
  const currentQuarter = configs
    .filter((config) => !dayjs().isBefore(dayjs(config.startDate).startOf("day")))
    .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf())[0];
  return Boolean(
    currentQuarter &&
      dayjs().isAfter(dayjs(currentQuarter.endDate).add(REVIEW_GRACE_PERIOD_DAYS, "day").endOf("day")),
  );
};

const isReviewExpired = (
  record: ManagerReviewItem,
  quarterDateConfigs: QuarterDateItem[],
): boolean => {
  if (record.reviewStatus === ManagerReviewStatus.REVIEWED) return false;

  const quarterCode = getManagerQuarter(record);
  if (!quarterCode) return isPendingReviewExpired(record, quarterDateConfigs);
  const quarterConfig = quarterDateConfigs.find(
    (config) => config.quarter === quarterCode,
  );
  if (!quarterConfig?.endDate) return false;

  return dayjs().isAfter(
    dayjs(quarterConfig.endDate).add(REVIEW_GRACE_PERIOD_DAYS, "day").endOf("day"),
  );
};

const renderStatusBadge = (
  record: ManagerReviewItem,
  quarterDateConfigs: QuarterDateItem[],
) => {
  if (isReviewExpired(record, quarterDateConfigs)) {
    return (
      <span className="mobile-status-badge mobile-status-badge-expired">
        <span className="mobile-status-dot" />
        Review Expired
      </span>
    );
  }

  const reviewStatus = record.reviewStatus;

  // Manager completed the review
  if (reviewStatus === ManagerReviewStatus.REVIEWED) {
    return (
      <span className="mobile-status-badge mobile-status-badge-success">
        <span className="mobile-status-dot text-emerald-500" />
        Reviewed
      </span>
    );
  }

  // Manager opened and saved a draft — actively in progress
  if (reviewStatus === ManagerReviewStatus.IN_REVIEW) {
    return (
      <span className="mobile-status-badge mobile-status-badge-purple">
        <span className="mobile-status-dot" />
        In Review
      </span>
    );
  }

  // Also handle appraisal-level completed statuses
  const status = record.status;
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
        <span className="mobile-status-dot text-emerald-500" />
        {s}
      </span>
    );
  }

  // Manager hasn't touched this record yet — show "Under Review"
  return (
    <span className="mobile-status-badge mobile-status-badge-amber">
      <span className="mobile-status-dot" />
      Under Review
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

const getQuarterDatesForCode = (
  record: ManagerReviewItem,
  configs: QuarterDateItem[],
  selectedYear?: string,
): { startDate: string | null; endDate: string | null } => {
  if (record.startDate && record.endDate) {
    return { startDate: record.startDate, endDate: record.endDate };
  }
  const quarterCode = getManagerQuarter(record);
  if (!quarterCode) return { startDate: null, endDate: null };

  const cfg = (configs || []).find((c) => c.quarter === quarterCode);
  if (cfg && cfg.startDate && cfg.endDate) {
    return {
      startDate: cfg.startDate,
      endDate: cfg.endDate,
    };
  }

  let yearStr = selectedYear;
  if (!yearStr || yearStr === YEAR_FILTER_ALL) {
    if (record.lastModified) {
      yearStr = String(new Date(record.lastModified).getFullYear());
    } else {
      yearStr = String(new Date().getFullYear());
    }
  }

  return getDefaultQuarterDates(quarterCode, yearStr);
};

const formatConfigDate = (d: string | null) =>
  d ? dayjs(d).format("DD MMM YYYY") : "—";

const SubmissionCard: React.FC<{
  record: ManagerReviewItem;
  quarterDateConfigs: QuarterDateItem[];
  selectedYear?: string;
  onEvaluate: () => void;
  onView: () => void;
}> = ({ record, quarterDateConfigs, selectedYear, onEvaluate, onView }) => {
  const isReviewed = record.actionType === ActionType.VIEW;
  const { startDate, endDate } = getQuarterDatesForCode(
    record,
    quarterDateConfigs,
    selectedYear,
  );

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
        {renderStatusBadge(record, quarterDateConfigs)}
      </div>

      <div className="mobile-card-body">
        <CardField label="Employee ID">
          <span className="mobile-card-field-strong">
            {record.employeeId}
          </span>
        </CardField>
        <CardField label="Quarter">
          <span className="mobile-card-field-strong">
            {getManagerQuarter(record) || "—"}
          </span>
        </CardField>
        <CardField label="Final Rating">
          <FinalRatingBadge rating={record.finalRating} />
        </CardField>
        <CardField label="Start Date">{formatConfigDate(startDate)}</CardField>
        <CardField label="End Date">{formatConfigDate(endDate)}</CardField>
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

const ManagerReviewBoardMobile: React.FC<{ onBack?: () => void }> = () => {
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
  const [reviewQuarter, setReviewQuarter] = useState<string>("");
  const reviewQuarterChangedRef = useRef(false);
  const [strengths, setStrengths] = useState<string>("");
  const [improvements, setImprovements] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{
    quarter?: string;
    strengths?: string;
    improvements?: string;
    remarks?: string;
  }>({});

  // Quarter Date Range Configuration state
  const [quarterDateConfigs, setQuarterDateConfigs] = useState<QuarterDateItem[]>([]);
  // Logged-in manager's employee ID — used to fetch all mapped employees
  const currentUser = useAppSelector((state: any) => state.user.currentUser);
  const managerEmployeeId = currentUser?.employeeId || currentUser?.loginId;

  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedNotificationEmployeeIds, setSelectedNotificationEmployeeIds] = useState<string[]>([]);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [allNotificationEmployees, setAllNotificationEmployees] = useState<any[]>([]);
  const [loadingNotificationEmployees, setLoadingNotificationEmployees] = useState(false);
  const [modalSearchText, setModalSearchText] = useState<string>("");

  const fetchQuarterConfigs = async (year: string) => {
    if (!year || year === YEAR_FILTER_ALL) return;
    const fallbackConfigs: QuarterDateItem[] = (
      [QuarterFilter.Q1, QuarterFilter.Q2, QuarterFilter.Q3, QuarterFilter.Q4] as const
    ).map((quarter) => ({
      quarter,
      ...getDefaultQuarterDates(quarter, year),
    }));

    try {
      const res = await axios
        .get("/api/manager-quarterly-review/quarter-configs", {
          params: { year },
        })
        .catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setQuarterDateConfigs(res.data.data);
      } else {
        setQuarterDateConfigs(fallbackConfigs);
      }
    } catch {
      // The endpoint may be unavailable in older deployments; keep the
      // quarter cards useful with the standard fiscal-year ranges.
      setQuarterDateConfigs(fallbackConfigs);
    }
  };

  useEffect(() => {
    fetchQuarterConfigs(selectedYear);
  }, [selectedYear]);

  const fetchAllMappedEmployees = async (): Promise<any[]> => {
    const managerKeys = Array.from(
      new Set(
        [
          currentUser?.aliasLoginName,
          currentUser?.name,
          currentUser?.fullName,
          currentUser?.employeeId,
          currentUser?.loginId,
          managerEmployeeId,
        ].filter(Boolean),
      ),
    );

    for (const key of managerKeys) {
      try {
        const res = await axios.get("/api/manager-mapping/all", {
          params: {
            managerName: key,
            status: "ACTIVE",
            limit: 9999,
          },
        });
        const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(items) && items.length > 0) {
          return items.map((m: any) => ({
            employeeId: m.employeeId,
            employeeName: m.employeeName || m.employeeId,
            designation: m.designation || "Employee",
            department: m.department || "—",
            quarter: m.quarter || null,
            notificationDate: m.notificationDate || m.notificationSentAt || m.sentAt || null,
            reviewStatus: m.reviewStatus || null,
            isCompleted: false,
          }));
        }
      } catch {
        // try next identifier
      }
    }

    try {
      const response = await axios.get(
        "/api/manager-quarterly-review/notification-candidates",
      );
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Ignore secondary fallback error
    }

    return [];
  };

  const fetchData = async (
    overrideStatus?: string,
    overrideYear?: string,
    overrideQuarterCard?: string,
    overrideSearch?: string,
  ) => {
    try {
      setLoading(true);
      const statusToUse =
        overrideStatus !== undefined ? overrideStatus : selectedStatusTab;
      const yearToUse =
        overrideYear !== undefined ? overrideYear : selectedYear;
      const quarterCardToUse =
        overrideQuarterCard !== undefined ? overrideQuarterCard : selectedQuarterCard;
      const searchToUse =
        overrideSearch !== undefined ? overrideSearch : searchQuery;

      const params: Record<string, any> = { page: 1, pageSize: 9999 };
      if (quarterCardToUse && quarterCardToUse !== QuarterFilter.ALL) {
        params.quarterCard = quarterCardToUse;
      }
      if (yearToUse !== YEAR_FILTER_ALL) {
        params.year = yearToUse;
      }
      if (statusToUse !== StatusTabFilter.ALL) {
        params.status = statusToUse;
      }
      if (searchToUse.trim()) {
        params.search = searchToUse.trim();
      }

      const [subsRes, statsRes, mappedEmployees] = await Promise.all([
        axios.get("/api/manager-quarterly-review", { params }).catch(() => ({ data: { success: false, data: [] } })),
        axios.get("/api/manager-quarterly-review/stats").catch(() => ({ data: { success: false, data: null } })),
        fetchAllMappedEmployees(),
      ]);

      let existingSubmissions: ManagerReviewItem[] = [];
      if (subsRes.data?.success && Array.isArray(subsRes.data.data)) {
        existingSubmissions = subsRes.data.data;
      }

      const combinedSubmissions: ManagerReviewItem[] = [...existingSubmissions];

      for (const emp of mappedEmployees) {
        const exists = combinedSubmissions.some(
          (s) => s.employeeId === emp.employeeId,
        );
        if (!exists) {
          const rawQuarter = emp.quarter;
          const defaultQuarter = rawQuarter
            ? rawQuarter.trim().split(/\s+/)[0]
            : (quarterCardToUse && quarterCardToUse !== QuarterFilter.ALL
                ? quarterCardToUse
                : (quarterDateConfigs[0]?.quarter || "Q1"));

          combinedSubmissions.push({
            id: emp.id || emp.employeeId,
            employeeId: emp.employeeId,
            employeeName: emp.employeeName || emp.employeeId,
            department: emp.department || "—",
            designation: emp.designation || "Employee",
            quarter: defaultQuarter,
            status: "Under Review",
            reviewStatus: null,
            overview: "",
            achievements: "",
            challenges: "",
            learningGoals: "",
            submittedDate: null,
            reviewedOn: null,
            lastModified: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
            finalRating: null,
            actionType: "evaluate",
            actionLabel: "Evaluate Now",
            notificationDate: emp.notificationDate || null,
          } as any);
        }
      }

      let filtered = combinedSubmissions;

      if (quarterCardToUse && quarterCardToUse !== QuarterFilter.ALL) {
        filtered = filtered.filter((s) => {
          const qCode = (s.quarter || "").trim().split(/\s+/)[0];
          return qCode === quarterCardToUse;
        });
      }

      if (statusToUse && statusToUse !== StatusTabFilter.ALL) {
        filtered = filtered.filter((s) => {
          if (statusToUse === StatusTabFilter.PENDING) {
            return !s.reviewStatus || s.reviewStatus === ManagerReviewStatus.PENDING || s.status === "Under Review";
          }
          if (statusToUse === StatusTabFilter.IN_REVIEW) {
            return s.reviewStatus === ManagerReviewStatus.IN_REVIEW;
          }
          if (statusToUse === StatusTabFilter.COMPLETED) {
            return s.reviewStatus === ManagerReviewStatus.REVIEWED || s.status === "Reviewed";
          }
          return true;
        });
      }

      if (searchToUse.trim()) {
        const q = searchToUse.trim().toLowerCase();
        filtered = filtered.filter(
          (s) =>
            (s.employeeName || "").toLowerCase().includes(q) ||
            (s.employeeId || "").toLowerCase().includes(q) ||
            (s.designation || "").toLowerCase().includes(q) ||
            (s.department || "").toLowerCase().includes(q),
        );
      }

      setSubmissions(filtered);

      if (statsRes.data?.success && statsRes.data.data) {
        setStats({
          ...statsRes.data.data,
          totalTeamMembers: Math.max(combinedSubmissions.length, statsRes.data.data.totalTeamMembers || 0),
          totalSubmissions: Math.max(combinedSubmissions.length, statsRes.data.data.totalSubmissions || 0),
        });
      } else {
        setStats((prev) => ({
          ...prev,
          totalTeamMembers: combinedSubmissions.length,
          totalSubmissions: combinedSubmissions.length,
        }));
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

  const handleStatusTabChange = (statusKey: string) => {
    setSelectedStatusTab(statusKey);
    setCurrentPage(1);
    fetchData(statusKey, selectedYear, selectedQuarterCard, searchQuery);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentPage(1);
    fetchData(selectedStatusTab, year, selectedQuarterCard, searchQuery);
  };

  const handleQuarterChange = (quarter: string) => {
    setSelectedQuarterCard(quarter);
    setCurrentPage(1);
    fetchData(selectedStatusTab, selectedYear, quarter, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchData(selectedStatusTab, selectedYear, selectedQuarterCard, query);
  };

  // All employees who have NOT yet completed a review are selectable for notification
  const selectableNotificationEmployees = useMemo(() => {
    return allNotificationEmployees.filter((emp: any) => {
      const submission = submissions.find((s) => s.employeeId === emp.employeeId);
      const isReviewed =
        emp.isCompleted ||
        emp.reviewStatus === ManagerReviewStatus.REVIEWED ||
        submission?.reviewStatus === ManagerReviewStatus.REVIEWED;
      return !isReviewed;
    });
  }, [allNotificationEmployees, submissions]);

  const openNotificationModal = async () => {
    setNotificationModalOpen(true);
    setLoadingNotificationEmployees(true);
    setModalSearchText("");

    try {
      let candidates: any[] = [];

      // 1. Primary: query /api/manager-mapping/all trying all possible manager identifiers
      const managerKeys = Array.from(
        new Set(
          [
            currentUser?.aliasLoginName,
            currentUser?.name,
            currentUser?.fullName,
            currentUser?.employeeId,
            currentUser?.loginId,
            managerEmployeeId,
          ].filter(Boolean),
        ),
      );

      for (const key of managerKeys) {
        try {
          const res = await axios.get("/api/manager-mapping/all", {
            params: {
              managerName: key,
              status: "ACTIVE",
              limit: 9999,
            },
          });
          const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
          if (Array.isArray(items) && items.length > 0) {
            candidates = items.map((m: any) => ({
              employeeId: m.employeeId,
              employeeName: m.employeeName || m.employeeId,
              designation: m.designation || "Employee",
              department: m.department || "—",
              quarter: null,
              reviewStatus: null,
              isCompleted: false,
            }));
            break;
          }
        } catch {
          // try next identifier
        }
      }

      // 2. Secondary fallback if manager-mapping returns empty: try dedicated notification-candidates endpoint
      if (candidates.length === 0) {
        try {
          const response = await axios.get(
            "/api/manager-quarterly-review/notification-candidates",
          );
          const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
          if (Array.isArray(data) && data.length > 0) {
            candidates = data;
          }
        } catch {
          // Ignore secondary fallback error
        }
      }

      // 3. Additional safety: merge any employees from submissions who might be missing from mapping
      for (const sub of submissions) {
        if (!candidates.some((c: any) => c.employeeId === sub.employeeId)) {
          candidates.push({
            employeeId: sub.employeeId,
            employeeName: sub.employeeName || sub.employeeId,
            designation: sub.designation || "Employee",
            department: sub.department || "—",
            quarter: sub.quarter || null,
            reviewStatus: sub.reviewStatus || null,
            isCompleted: sub.reviewStatus === ManagerReviewStatus.REVIEWED,
          });
        }
      }

      setAllNotificationEmployees(candidates);

      // Pre-select all employees requiring a review
      const selectable = candidates.filter((emp: any) => {
        const sub = submissions.find((s) => s.employeeId === emp.employeeId);
        return !(
          emp.isCompleted ||
          emp.reviewStatus === ManagerReviewStatus.REVIEWED ||
          sub?.reviewStatus === ManagerReviewStatus.REVIEWED
        );
      });

      setSelectedNotificationEmployeeIds(
        (selectable.length > 0 ? selectable : candidates).map(
          (emp: any) => emp.employeeId,
        ),
      );
    } catch {
      message.error("Failed to load the full employee list for notifications.");
    } finally {
      setLoadingNotificationEmployees(false);
    }
  };

  const sendReviewNotifications = async () => {
    if (selectedNotificationEmployeeIds.length === 0) {
      message.warning("Select at least one employee.");
      return;
    }

    try {
      setSendingNotifications(true);
      await axios.post("/api/manager-quarterly-review/notifications", {
        employeeIds: selectedNotificationEmployeeIds,
      });
      message.success("Review notifications sent successfully.");
      setNotificationModalOpen(false);
      setSelectedNotificationEmployeeIds([]);
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Failed to send review notifications.",
      );
    } finally {
      setSendingNotifications(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Seed the quarter picker from whatever quarter is already on the
    // record (e.g. re-opening a saved draft keeps the manager's earlier
    // choice). Left blank when the record has never had a quarter set,
    // so the manager must explicitly pick one for a brand-new review.
    if (!reviewQuarterChangedRef.current) {
      const recordQuarter = record.quarter
        ? record.quarter.trim().split(/\s+/)[0]
        : "";
      setReviewQuarter(recordQuarter);
    }

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
    reviewQuarterChangedRef.current = false;
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
    reviewQuarterChangedRef.current = false;
    setReviewQuarter("");
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
      reviewQuarterChangedRef.current = false;
      setFieldErrors({});
      applyReviewToForm(match);
      setIsModalOpen(true);
      loadFreshReview(employeeIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFromUrl, submissions]);

  const validateTextFields = (): boolean => {
    const errors: {
      quarter?: string;
      strengths?: string;
      improvements?: string;
      remarks?: string;
    } = {};

    if (!reviewQuarter) {
      errors.quarter = "Please select a quarter.";
    }
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

    if (!reviewQuarter) {
      const quarterError = "Please select a quarter.";
      setFieldErrors((previous) => ({ ...previous, quarter: quarterError }));
      message.error(quarterError);
      return;
    }

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

      const formattedQuarter = getFormattedQuarterPayload(
        reviewQuarter,
        currentReview.quarter,
        selectedYear
      );

      const payload = {
        quarter: formattedQuarter,
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
        reviewQuarterChangedRef.current = false;
        setReviewQuarter("");
        navigate("/manager-dashboard/quarterly-review", { replace: false });
        fetchData();
      }
    } catch (err: any) {
      console.error("Submit evaluation failed:", err.response?.data || err);
      const serverMessage = err.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage)
        ? serverMessage.join(" | ")
        : serverMessage || "Failed to submit review evaluation.";
      message.error(errorMsg);
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

  // Whenever the filtered result set changes, snap pagination back to page 1
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
      width: "14%",
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
      width: "8%",
      render: (id: string) => <span className="mobile-table-text">{id}</span>,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: "12%",
      render: (d: string) => (
        <span className="mobile-table-text">{d || "—"}</span>
      ),
    },
    {
      title: "Quarter",
      dataIndex: "quarter",
      key: "quarter",
      width: "8%",
      render: (_q: string, r: ManagerReviewItem) => (
        <span className="mobile-table-text">
          {getManagerQuarter(r) || "—"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: "12%",
      render: (_: any, r: ManagerReviewItem) =>
        renderStatusBadge(r, quarterDateConfigs),
    },
    {
      title: "Final Rating",
      dataIndex: "finalRating",
      key: "finalRating",
      width: "12%",
      render: (rating: number | null) => <FinalRatingBadge rating={rating} />,
    },
    {
      title: "Last Modified",
      dataIndex: "lastModified",
      key: "lastModified",
      width: "10%",
      render: (lastModified: string | null) => (
        <span className="mobile-table-text">
          {lastModified ? dayjs(lastModified).format("DD MMM YYYY") : "—"}
        </span>
      ),
    },
    {
      title: "Start Date",
      key: "startDate",
      width: "9%",
      render: (_: any, r: ManagerReviewItem) => {
        const { startDate } = getQuarterDatesForCode(
          r,
          quarterDateConfigs,
        );
        return (
          <span className="mobile-table-text">
            {formatConfigDate(startDate)}
          </span>
        );
      },
    },
    {
      title: "End Date",
      key: "endDate",
      width: "9%",
      render: (_: any, r: ManagerReviewItem) => {
        const { endDate } = getQuarterDatesForCode(
          r,
          quarterDateConfigs,
        );
        return (
          <span className="mobile-table-text">
            {formatConfigDate(endDate)}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: "12%",
      fixed: "right" as const,
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
        <div className="mobile-page-header-row flex items-center justify-between">
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
          <Button
            type="primary"
            size="small"
            icon={<Bell className="w-3.5 h-3.5" />}
            onClick={openNotificationModal}
            className="!bg-indigo-600 hover:!bg-indigo-700 !text-white !font-bold !rounded-lg shrink-0"
          >
            Send Notification
          </Button>
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
        <div className="flex items-center justify-between flex-wrap gap-1">
          <h2 className="mobile-filter-heading">Quarterly Reviews</h2>
        </div>

        <div className="mobile-filter-tabs">
          {STATUS_TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusTabChange(tab.key)}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="mobile-input"
            allowClear
          />

          <Select
            value={selectedYear}
            onChange={handleYearChange}
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

        </div>
      </div>

      {/* Quarter selector — card-style buttons for All Quarters and Q1-Q4. */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleQuarterChange(QuarterFilter.ALL)}
          className={`flex-1 min-w-[58px] flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selectedQuarterCard === QuarterFilter.ALL
              ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
              : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400"
          }`}
        >
          <span className={`text-base font-extrabold ${
            selectedQuarterCard === QuarterFilter.ALL ? "text-white" : "text-indigo-600"
          }`}>
            All
          </span>
          <span className={`text-[9px] font-medium leading-tight text-center ${
            selectedQuarterCard === QuarterFilter.ALL ? "text-indigo-100" : "text-slate-400"
          }`}>
            Quarters
          </span>
        </button>

        {([QuarterFilter.Q1, QuarterFilter.Q2, QuarterFilter.Q3, QuarterFilter.Q4] as const).map((q) => {
          const cfg = quarterDateConfigs.find((c) => c.quarter === q);
          const dateRange = cfg
            ? `${dayjs(cfg.startDate).format("DD MMM")} – ${dayjs(cfg.endDate).format("DD MMM")}`
            : "";
          const isActive = selectedQuarterCard === q;
          return (
            <button
              key={q}
              type="button"
              onClick={() => handleQuarterChange(isActive ? QuarterFilter.ALL : q)}
              className={`flex-1 min-w-[58px] flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                  : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400"
              }`}
            >
              <span className={`text-base font-extrabold ${isActive ? "text-white" : "text-indigo-600"}`}>{q}</span>
              {dateRange && (
                <span className={`text-[9px] font-medium leading-tight text-center ${
                  isActive ? "text-indigo-100" : "text-slate-400"
                }`}>{dateRange}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="mobile-loading-state">
          <div className="mobile-loading-state-inner">
            <Spin size="large" tip="Loading team quarterly reviews..." />
          </div>
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <>
          {/* Mobile card list — shows only the current page's slice */}
          <div className="mobile-card-list">
            {paginatedSubmissions.map((record) => (
              <SubmissionCard
                key={record.id}
                record={record}
                quarterDateConfigs={quarterDateConfigs}
                onEvaluate={() => handleOpenEvaluation(record, false)}
                onView={() => handleOpenEvaluation(record, true)}
              />
            ))}
          </div>

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
              scroll={{ x: 1000 }}
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
        reviewQuarter={reviewQuarter}
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
        setReviewQuarter={(quarter) => {
          reviewQuarterChangedRef.current = true;
          setReviewQuarter(quarter);
        }}
        setStrengths={setStrengths}
        setImprovements={setImprovements}
        setRemarks={setRemarks}
        setFieldErrors={setFieldErrors}
      />

      <Modal
        title="Send Review Notification"
        open={notificationModalOpen}
        onCancel={() => {
          setNotificationModalOpen(false);
          setAllNotificationEmployees([]);
          setSelectedNotificationEmployeeIds([]);
          setModalSearchText("");
        }}
        onOk={sendReviewNotifications}
        okText="Send Notification"
        confirmLoading={sendingNotifications}
        width="95%"
        style={{ top: 24 }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
            <Checkbox
              disabled={loadingNotificationEmployees}
              checked={
                !loadingNotificationEmployees &&
                selectableNotificationEmployees.length > 0 &&
                selectableNotificationEmployees.every((emp: any) =>
                  selectedNotificationEmployeeIds.includes(emp.employeeId),
                )
              }
              indeterminate={
                !loadingNotificationEmployees &&
                selectedNotificationEmployeeIds.length > 0 &&
                selectedNotificationEmployeeIds.length < selectableNotificationEmployees.length
              }
              onChange={(event) =>
                setSelectedNotificationEmployeeIds(
                  event.target.checked
                    ? selectableNotificationEmployees.map((emp: any) => emp.employeeId)
                    : [],
                )
              }
            >
              Select all employees requiring a review
              {!loadingNotificationEmployees && allNotificationEmployees.length > 0 && (
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  ({selectableNotificationEmployees.length} requiring review / {allNotificationEmployees.length} total members)
                </span>
              )}
            </Checkbox>

            {allNotificationEmployees.length > 3 && (
              <div className="w-full sm:w-64">
                <Input
                  prefix={<Search size={14} className="text-slate-400 mr-1" />}
                  placeholder="Search name or ID..."
                  size="small"
                  value={modalSearchText}
                  onChange={(e) => setModalSearchText(e.target.value)}
                  allowClear
                  className="rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[auto_1.4fr_1fr_1.2fr_0.8fr_1fr_1fr] gap-3 px-3 py-2 text-xs font-bold uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <span />
                <span>Employee Name</span>
                <span>Employee ID</span>
                <span>Designation</span>
                <span>Quarter</span>
                <span>Start Date</span>
                <span>End Date</span>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {loadingNotificationEmployees ? (
                  <div className="flex justify-center items-center p-8">
                    <Spin tip="Loading all employees..." />
                  </div>
                ) : allNotificationEmployees.length === 0 ? (
                  <p className="p-4 text-slate-500">No employees found.</p>
                ) : (
                  allNotificationEmployees
                    .filter((emp: any) => {
                      if (!modalSearchText.trim()) return true;
                      const q = modalSearchText.toLowerCase();
                      return (
                        (emp.employeeName || "").toLowerCase().includes(q) ||
                        (emp.employeeId || "").toLowerCase().includes(q) ||
                        (emp.designation || "").toLowerCase().includes(q) ||
                        (emp.department || "").toLowerCase().includes(q)
                      );
                    })
                    .map((emp: any) => {
                      const submission = submissions.find((s) => s.employeeId === emp.employeeId);
                      const rawQuarter = emp.quarter || submission?.quarter;
                      const quarterCode = rawQuarter
                        ? rawQuarter.trim().split(/\s+/)[0]
                        : (selectedQuarterCard !== QuarterFilter.ALL
                            ? selectedQuarterCard
                            : (quarterDateConfigs[0]?.quarter || "—"));
                      const quarterConfig = (quarterCode && quarterCode !== "—")
                        ? quarterDateConfigs.find((c) => c.quarter === quarterCode)
                        : undefined;
                      const startDateStr = quarterConfig?.startDate
                        ? dayjs(quarterConfig.startDate).format("DD MMM YYYY")
                        : "—";
                      const endDateStr = quarterConfig?.endDate
                        ? dayjs(quarterConfig.endDate).format("DD MMM YYYY")
                        : "—";
                      const isReviewed = Boolean(
                        emp.isCompleted ||
                        emp.reviewStatus === ManagerReviewStatus.REVIEWED ||
                        submission?.reviewStatus === ManagerReviewStatus.REVIEWED,
                      );

                      return (
                        <div
                          key={emp.employeeId}
                          className="grid grid-cols-[auto_1.4fr_1fr_1.2fr_0.8fr_1fr_1fr] items-center gap-3 p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors text-xs"
                        >
                          <Checkbox
                            disabled={isReviewed}
                            checked={selectedNotificationEmployeeIds.includes(emp.employeeId)}
                            onChange={(event) =>
                              setSelectedNotificationEmployeeIds((current) =>
                                event.target.checked
                                  ? [...current, emp.employeeId]
                                  : current.filter((id) => id !== emp.employeeId),
                              )
                            }
                          />
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                            {emp.employeeName}
                            {isReviewed && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                                Reviewed
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500">ID: {emp.employeeId}</span>
                          <span className="text-slate-600">{emp.designation || submission?.designation || "Employee"}</span>
                          <span className="text-slate-600">{quarterCode || "—"}</span>
                          <span className="text-slate-500">{startDateStr}</span>
                          <span className="text-slate-500">{endDateStr}</span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ManagerReviewBoardMobile;