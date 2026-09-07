import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppSelector } from "../../hooks";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Checkbox,
  Input,
  Modal,
  Select,
  Spin,
  message,
} from "antd";
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
} from "./QuarterlyReview.types";
import QuarterlyViewPage from "./Quarterlyviewpage";
import { QuarterDateItem } from "./QuarterDateConfigModal";

const { Option } = Select;

type RatingValues = Record<string, number>;

const DEFAULT_PAGE_SIZE = 10;
const REVIEW_GRACE_PERIOD_DAYS = 10;

// Table layout constants. Columns now use fixed pixel widths instead of
// percentages so the Employee Name column can be sized generously enough
// to show full names without truncation, independent of every other
// column's width. TABLE_SCROLL_X is the sum of all column widths below —
// keep it in sync whenever a column width changes, since AntD's `scroll.x`
// determines the table's total horizontal width and must match (or exceed)
// the sum of the fixed column widths for the layout to render correctly.
const COLUMN_WIDTHS = {
  employeeName: 200,
  employeeId: 100,
  designation: 150,
  quarter: 90,
  finalRating: 130,
  lastModified: 130,
  startDate: 130,
  endDate: 130,
  status: 150,
  notify: 130,
  action: 160,
};
const TABLE_SCROLL_X = Object.values(COLUMN_WIDTHS).reduce((a, b) => a + b, 0);

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
 * The "Send Review Notification" Modal is ALSO a document.body portal, for
 * the same reason as the Select dropdown above. Rather than going fully
 * unscoped for it too, it carries its own `mqr-notification-modal`
 * className (set on <Modal className="mqr-notification-modal">), which
 * AntD applies directly to the real .ant-modal node even though it's
 * portaled — so Inter + a bit of polish is scoped to `.mqr-notification-modal`
 * instead of leaking Inter onto every modal in the app.
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

  /* The "Send Review Notification" Modal is also a document.body portal,
     outside .mqr-wrapper — same situation as the Select dropdown above.
     It already carries a "mqr-notification-modal" className (set via
     Modal className="mqr-notification-modal"), which DOES land on the
     real .ant-modal node, so we scope Inter + a bit of polish to just
     this modal instead of going fully unscoped. */
  .mqr-notification-modal,
  .mqr-notification-modal * {
    font-family: ${MQR_FONT_STACK} !important;
  }

  .mqr-notification-modal .ant-modal-content {
    border-radius: 16px !important;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    /* Caps the whole modal so it always fits the viewport — this is what
       stops the outer .ant-modal-wrap from ALSO becoming scrollable
       (previously two nested scrollbars: one for this wrap, one for the
       inner employee list further down). */
    max-height: 82vh;
  }

  .mqr-notification-modal .ant-modal-header {
    border-bottom: 1px solid #E2E8F0 !important;
    padding: 14px 20px 10px !important;
    flex: 0 0 auto;
  }

  .mqr-notification-modal .ant-modal-title {
    font-weight: 800 !important;
    font-size: 16px !important;
    color: #2B3674 !important;
    letter-spacing: -0.01em;
  }

  .mqr-notification-modal .ant-modal-body {
    padding: 14px 20px !important;
    /* Body itself never scrolls — flex-shrinks to fit, and only the
       .mqr-employee-list child (flex-1 + min-height:0 in the JSX) grows
       and scrolls internally. */
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .mqr-notification-modal .ant-modal-footer {
    border-top: 1px solid #E2E8F0 !important;
    padding: 10px 20px !important;
    flex: 0 0 auto;
  }

  .mqr-notification-modal .ant-modal-footer .ant-btn {
    border-radius: 8px !important;
    font-weight: 600 !important;
    height: auto !important;
    padding: 6px 16px !important;
  }

  /* Custom, thinner scrollbar for the employee list so scrolling feels
     smoother than the default chunky OS scrollbar — Firefox via
     scrollbar-width/-color, WebKit/Chromium via the ::-webkit- rules. */
  .mqr-notification-modal .mqr-employee-list {
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #C7D2FE #F1F5F9;
  }

  .mqr-notification-modal .mqr-employee-list::-webkit-scrollbar {
    width: 8px;
  }

  .mqr-notification-modal .mqr-employee-list::-webkit-scrollbar-track {
    background: #F8FAFC;
  }

  .mqr-notification-modal .mqr-employee-list::-webkit-scrollbar-thumb {
    background-color: #C7D2FE;
    border-radius: 8px;
  }

  .mqr-notification-modal .mqr-employee-list::-webkit-scrollbar-thumb:hover {
    background-color: #A5B4FC;
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

  const [submissions, setSubmissions] = useState<ManagerReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalTeamMembers: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    inReview: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuarter] = useState<string>(QuarterFilter.ALL);
  const [selectedQuarterCard, setSelectedQuarterCard] = useState<string>("");
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>(
    StatusTabFilter.ALL,
  );
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
  // Which quarter the manager is giving THIS review for. Picked inside the
  // evaluation modal (QuarterlyViewPage), independent of any quarter tag
  // already on the employee's submission — a manager can give a Q1, Q2,
  // Q3, or Q4 review for an employee regardless of the configured quarter
  // date ranges (all four are always selectable).
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
  const [quarterDateConfigs, setQuarterDateConfigs] = useState<
    QuarterDateItem[]
  >([]);
  // Logged-in manager's employee ID — used to fetch all mapped employees
  const currentUser = useAppSelector((state: any) => state.user.currentUser);
  const managerEmployeeId = currentUser?.employeeId || currentUser?.loginId;

  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedNotificationEmployeeIds, setSelectedNotificationEmployeeIds] =
    useState<string[]>([]);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  // Holds ALL employees mapped to this manager (from manager-mapping, not quarterly review).
  // This ensures all 80 members appear even if they haven't submitted a review yet.
  const [allNotificationEmployees, setAllNotificationEmployees] = useState<
    any[]
  >([]);
  const [loadingNotificationEmployees, setLoadingNotificationEmployees] =
    useState(false);
  const [notificationQuarterFilter, setNotificationQuarterFilter] =
    useState<string>(QuarterFilter.ALL);
  const [notificationDate, setNotificationDate] = useState<string>("");

  // Which row's per-row Send/Resend button (in the main table's Notify
  // column) is currently mid-request — scopes the button's loading/disabled
  // state to just that row instead of the whole table. Keyed by employeeId,
  // same key used everywhere else in this file to identify a row.
  const [sendingRowNotification, setSendingRowNotification] = useState<
    string | null
  >(null);

  const fetchQuarterConfigs = async (year: string) => {
    if (!year || year === YEAR_FILTER_ALL) return;
    const defaultConfigs: QuarterDateItem[] = (
      [
        QuarterFilter.Q1,
        QuarterFilter.Q2,
        QuarterFilter.Q3,
        QuarterFilter.Q4,
      ] as const
    ).map((quarter) => ({
      quarter,
      ...getDefaultQuarterDates(quarter, year),
    }));

    setQuarterDateConfigs(defaultConfigs);
  };

  useEffect(() => {
    fetchQuarterConfigs(selectedYear);
  }, [selectedYear]);

  /**
   * Fetch the current filters + requested page/pageSize from the API.
   * This is the single place responsible for pulling table data — every
   * pagination click, filter change, and post-submit refresh routes through
   */

  async function fetchAllMappedEmployees(): Promise<any[]> {
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
        const items =
          res.data?.items ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(items) && items.length > 0) {
          return items.map((m: any) => ({
            employeeId: m.employeeId,
            employeeName: m.employeeName || m.employeeId,
            designation: m.designation || "Employee",
            department: m.department || "—",
            quarter: m.quarter || null,
            notificationDate:
              m.notificationDate || m.notificationSentAt || m.sentAt || null,
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
      const data =
        response.data?.data ||
        (Array.isArray(response.data) ? response.data : []);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Ignore secondary fallback error
    }

    return [];
  }

  /**
   * Fetch the current filters + requested page/pageSize from the API.
   * Merges all mapped team members so every employee under the manager displays.
   */
  const fetchData = async (
    page: number = currentPage,
    size: number = pageSize,
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
        overrideQuarterCard !== undefined
          ? overrideQuarterCard
          : selectedQuarterCard;
      const searchToUse =
        overrideSearch !== undefined ? overrideSearch : searchQuery;

      const params: Record<string, any> = { page: 1, pageSize: 9999 };
      if (selectedQuarter !== QuarterFilter.ALL)
        params.quarter = selectedQuarter;
      if (quarterCardToUse && quarterCardToUse !== QuarterFilter.ALL)
        params.quarterCard = quarterCardToUse;
      if (yearToUse !== YEAR_FILTER_ALL) params.year = yearToUse;
      if (statusToUse !== StatusTabFilter.ALL) params.status = statusToUse;
      if (searchToUse.trim()) params.search = searchToUse.trim();

      const [subsRes, statsRes, mappedEmployees] = await Promise.all([
        axios
          .get("/api/manager-quarterly-review", { params })
          .catch(() => ({ data: { success: false, data: [] } })),
        axios
          .get("/api/manager-quarterly-review/stats")
          .catch(() => ({ data: { success: false, data: null } })),
        fetchAllMappedEmployees(),
      ]);

      let existingSubmissions: ManagerReviewItem[] = [];
      if (subsRes.data?.success && Array.isArray(subsRes.data.data)) {
        existingSubmissions = subsRes.data.data;
      }

      // Merge all mapped employees so all team members appear in the table
      const combinedSubmissions: ManagerReviewItem[] = [...existingSubmissions];

      for (const emp of mappedEmployees) {
        const exists = combinedSubmissions.some(
          (s) => s.employeeId === emp.employeeId,
        );
        if (!exists) {
          const rawQuarter = emp.quarter;
          const defaultQuarter = rawQuarter
            ? rawQuarter.trim().split(/\s+/)[0]
            : quarterCardToUse && quarterCardToUse !== QuarterFilter.ALL
              ? quarterCardToUse
              : quarterDateConfigs[0]?.quarter || "Q1";

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
            return (
              !s.reviewStatus ||
              s.reviewStatus === ManagerReviewStatus.PENDING ||
              s.status === "Under Review"
            );
          }
          if (statusToUse === StatusTabFilter.IN_REVIEW) {
            return s.reviewStatus === ManagerReviewStatus.IN_REVIEW;
          }
          if (statusToUse === StatusTabFilter.COMPLETED) {
            return (
              s.reviewStatus === ManagerReviewStatus.REVIEWED ||
              s.status === "Reviewed"
            );
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

      const startIndex = (page - 1) * size;
      const paginatedRows = filtered.slice(startIndex, startIndex + size);

      setSubmissions(paginatedRows);
      setTotalCount(filtered.length);

      if (statsRes.data?.success && statsRes.data.data) {
        setStats({
          ...statsRes.data.data,
          totalTeamMembers: Math.max(
            combinedSubmissions.length,
            statsRes.data.data.totalTeamMembers || 0,
          ),
          totalSubmissions: Math.max(
            combinedSubmissions.length,
            statsRes.data.data.totalSubmissions || 0,
          ),
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
    fetchData(
      1,
      pageSize,
      statusKey,
      selectedYear,
      selectedQuarterCard,
      searchQuery,
    );
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentPage(1);
    fetchData(
      1,
      pageSize,
      selectedStatusTab,
      year,
      selectedQuarterCard,
      searchQuery,
    );
  };

  const handleQuarterChange = (quarter: string) => {
    setSelectedQuarterCard(quarter);
    setCurrentPage(1);
    fetchData(
      1,
      pageSize,
      selectedStatusTab,
      selectedYear,
      quarter,
      searchQuery,
    );
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchData(
      1,
      pageSize,
      selectedStatusTab,
      selectedYear,
      selectedQuarterCard,
      query,
    );
  };

  // Holds search query inside notification modal (useful when manager has 80+ employees)
  const [modalSearchText, setModalSearchText] = useState<string>("");

  // All employees who have NOT yet completed a review are selectable for notification
  const selectableNotificationEmployees = useMemo(() => {
    return allNotificationEmployees.filter((emp: any) => {
      const submission = submissions.find(
        (s) => s.employeeId === emp.employeeId,
      );
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
    setNotificationQuarterFilter(QuarterFilter.ALL);
    setNotificationDate(new Date().toISOString());

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
          const items =
            res.data?.items ||
            res.data?.data ||
            (Array.isArray(res.data) ? res.data : []);
          if (Array.isArray(items) && items.length > 0) {
            candidates = items.map((m: any) => ({
              employeeId: m.employeeId,
              employeeName: m.employeeName || m.employeeId,
              designation: m.designation || "Employee",
              department: m.department || "—",
              quarter: null,
              notificationDate:
                m.notificationDate || m.notificationSentAt || m.sentAt || null,
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
          const data =
            response.data?.data ||
            (Array.isArray(response.data) ? response.data : []);
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
          const submissionData: any = sub;
          candidates.push({
            employeeId: sub.employeeId,
            employeeName: sub.employeeName || sub.employeeId,
            designation: sub.designation || "Employee",
            department: sub.department || "—",
            quarter: sub.quarter || null,
            notificationDate:
              submissionData.notificationDate ||
              submissionData.notificationSentAt ||
              null,
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
      const sentAt = new Date().toISOString();
      await axios.post("/api/manager-quarterly-review/notifications", {
        employeeIds: selectedNotificationEmployeeIds,
        startDate: sentAt,
        notificationDate: sentAt,
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

  // Sends (or resends) a review notification to a single employee directly
  // from the main table row's Notify column — reuses the same bulk
  // notifications endpoint with a one-item employeeIds array, then
  // refetches the current page so the row's notificationDate (and the
  // Send/Resend label) reflects the new state.
  const sendSingleNotification = async (record: ManagerReviewItem) => {
    try {
      setSendingRowNotification(record.employeeId);
      const sentAt = new Date().toISOString();
      await axios.post("/api/manager-quarterly-review/notifications", {
        employeeIds: [record.employeeId],
        startDate: sentAt,
        notificationDate: sentAt,
      });
      const alreadyNotified = Boolean(
        (record as any).notificationDate ||
        (record as any).notificationSentAt ||
        (record as any).sentAt ||
        (record as any).isNotified ||
        (record as any).notificationSent ||
        record.reviewStatus === ManagerReviewStatus.IN_REVIEW,
      );
      message.success(
        alreadyNotified
          ? "Reminder notification resent to employee."
          : "Review notification sent to employee.",
      );
      fetchData(currentPage, pageSize);
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Failed to send review notification.",
      );
    } finally {
      setSendingRowNotification(null);
    }
  };

  const filteredNotificationEmployees = useMemo(() => {
    return allNotificationEmployees.filter((emp: any) => {
      const rawQuarter =
        emp.quarter ||
        submissions.find((s) => s.employeeId === emp.employeeId)?.quarter;
      const quarterCode = rawQuarter ? rawQuarter.trim().split(/\s+/)[0] : "";
      const matchesQuarter =
        notificationQuarterFilter === QuarterFilter.ALL ||
        quarterCode === notificationQuarterFilter;
      const query = modalSearchText.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [
          emp.employeeName,
          emp.employeeId,
          emp.designation,
          emp.department,
        ].some((value) => (value || "").toLowerCase().includes(query));
      return matchesQuarter && matchesSearch;
    });
  }, [
    allNotificationEmployees,
    modalSearchText,
    notificationQuarterFilter,
    submissions,
  ]);

  // Initial load
  useEffect(() => {
    fetchData(1, DEFAULT_PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const sum = values.reduce((a, b) => a + b, 0);
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
    loadFreshReview(record.employeeId);
    navigate(`/manager-dashboard/quarterly-review/${record.employeeId}`, {
      replace: false,
    });
  };

  const loadFreshReview = async (employeeId: string) => {
    try {
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
    reviewQuarterChangedRef.current = false;
    setReviewQuarter("");
    setCurrentPage(1);
    navigate("/manager-dashboard/quarterly-review", { replace: false });
    fetchData(1, pageSize);
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
        selectedYear,
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
        setCurrentPage(1);
        navigate("/manager-dashboard/quarterly-review", { replace: false });
        fetchData(1, pageSize);
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

    // Note: `submissions` now only holds the current page's rows (server-side
    // pagination), so this only merges in years from the static range plus
    // whatever happens to be on the current page. If you need every year
    // actually present across the full team, add a `/filters` response field
    // for years the same way quarters are fetched below.
    const dataYears = submissions
      .map((s) => getSubmissionYear(s))
      .filter(Boolean);

    const years = Array.from(
      new Set([...rangeYears, DEFAULT_YEAR, ...dataYears]),
    ).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
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
    searchQuery,
  ]);

  const handleTableChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
    fetchData(page, size);
  };

  const isReviewExpired = (record: ManagerReviewItem): boolean => {
    if (record.reviewStatus === ManagerReviewStatus.REVIEWED) return false;

    const quarterCode = getManagerQuarter(record);
    if (!quarterCode) return isPendingReviewExpired(record);
    const quarterConfig = quarterDateConfigs.find(
      (config) => config.quarter === quarterCode,
    );
    if (!quarterConfig?.endDate) return false;

    return dayjs().isAfter(
      dayjs(quarterConfig.endDate)
        .add(REVIEW_GRACE_PERIOD_DAYS, "day")
        .endOf("day"),
    );
  };

  const renderStatusBadge = (record: ManagerReviewItem) => {
    if (isReviewExpired(record)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Review Expired
        </span>
      );
    }

    const reviewStatus = record.reviewStatus;

    // Manager completed the review
    if (reviewStatus === ManagerReviewStatus.REVIEWED) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Reviewed
        </span>
      );
    }

    // Manager opened and saved a draft — actively in progress
    if (reviewStatus === ManagerReviewStatus.IN_REVIEW) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {s}
        </span>
      );
    }

    // Manager hasn't touched this record yet — show "Under Review"
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Under Review
      </span>
    );
  };

  const tableTextClass = "text-slate-700 text-sm font-medium";

  const getManagerQuarter = (record: ManagerReviewItem): string =>
    (record.quarter || "").trim().split(/\s+/)[0];

  const isPendingReviewExpired = (record: ManagerReviewItem): boolean => {
    if (record.reviewStatus === ManagerReviewStatus.REVIEWED) return false;

    const currentQuarter = quarterDateConfigs
      .filter(
        (config) => !dayjs().isBefore(dayjs(config.startDate).startOf("day")),
      )
      .sort(
        (a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf(),
      )[0];
    return Boolean(
      currentQuarter &&
      dayjs().isAfter(
        dayjs(currentQuarter.endDate)
          .add(REVIEW_GRACE_PERIOD_DAYS, "day")
          .endOf("day"),
      ),
    );
  };

  // Looks up the configured Start/End date for a review record's quarter
  // from `quarterDateConfigs`, direct record fields, or standard defaults.
  const getQuarterDatesForRecord = (
    record: ManagerReviewItem,
  ): { startDate: string | null; endDate: string | null } => {
    if (record.startDate && record.endDate) {
      return { startDate: record.startDate, endDate: record.endDate };
    }

    const quarterCode = getManagerQuarter(record);
    if (!quarterCode) return { startDate: null, endDate: null };

    const cfg = quarterDateConfigs.find((c) => c.quarter === quarterCode);
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

  const columns = [
    {
      title: "Employee Name",
      key: "employeeName",
      // Fixed width (not a %) and generous enough to show most full names
      // on one line without truncation. See COLUMN_WIDTHS at the top of
      // this file — keep TABLE_SCROLL_X in sync if this changes.
      width: COLUMN_WIDTHS.employeeName,
      render: (_: any, r: ManagerReviewItem) => {
        const displayName = r.employeeName
          ? r.employeeName
              .split(" ")
              .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
              .join(" ")
          : "";

        const initials = displayName
          ? displayName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w.charAt(0).toUpperCase())
              .join("")
          : "";

        return (
          <div className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials || <Users className="w-3.5 h-3.5 text-indigo-500" />}
            </div>
            {/* Was `truncate` (forces single-line + ellipsis), which is what
                clipped longer names. Now wraps onto a second line instead
                of cutting text off, now that the column has real width. */}
            <p
              className={`${tableTextClass} whitespace-normal break-words text-left`}
            >
              {displayName || "—"}
            </p>
          </div>
        );
      },
    },

    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      width: COLUMN_WIDTHS.employeeId,
      render: (id: string) => (
        <span className={tableTextClass}>{id || "—"}</span>
      ),
    },

    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: COLUMN_WIDTHS.designation,
      render: (d: string) => (
        <span className={tableTextClass}>
          {d ? d.charAt(0).toUpperCase() + d.slice(1) : "—"}
        </span>
      ),
    },

    {
      title: "Quarter",
      dataIndex: "quarter",
      key: "quarter",
      width: COLUMN_WIDTHS.quarter,
      render: (_q: string, r: ManagerReviewItem) => (
        <span className={tableTextClass}>{getManagerQuarter(r) || "—"}</span>
      ),
    },

    {
      title: "Final Rating",
      dataIndex: "finalRating",
      key: "finalRating",
      width: COLUMN_WIDTHS.finalRating,
      render: (rating: number | null) =>
        rating != null ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {rating}
          </span>
        ) : (
          <span className="text-slate-400 text-sm font-medium">—</span>
        ),
    },

    {
      title: "Last Modified",
      dataIndex: "lastModified",
      key: "lastModified",
      width: COLUMN_WIDTHS.lastModified,
      render: (lastModified: string | null) => (
        <span className={tableTextClass}>
          {lastModified ? dayjs(lastModified).format("DD MMM YYYY") : "—"}
        </span>
      ),
    },

    {
      title: "Start Date",
      key: "startDate",
      width: COLUMN_WIDTHS.startDate,
      render: (_: any, r: ManagerReviewItem) => {
        const { startDate } = getQuarterDatesForRecord(r);
        return (
          <span className={tableTextClass}>{formatConfigDate(startDate)}</span>
        );
      },
    },

    {
      title: "End Date",
      key: "endDate",
      width: COLUMN_WIDTHS.endDate,
      render: (_: any, r: ManagerReviewItem) => {
        const { endDate } = getQuarterDatesForRecord(r);
        return (
          <span className={tableTextClass}>{formatConfigDate(endDate)}</span>
        );
      },
    },

    {
      title: "Status",
      key: "status",
      width: COLUMN_WIDTHS.status,
      render: (_: any, r: ManagerReviewItem) =>
        renderStatusBadge(
          isPendingReviewExpired(r) ? { ...r, status: "Review Expired" } : r,
        ),
    },

    {
      // Send/Resend notification for this row. A completed review has
      // nothing left to notify about, so it just shows a dash instead of
      // a button. Otherwise the button reads "Resend" once a notification
      // has already gone out for this employee or when the review is in-progress,
      // and "Send" the first time. Uses the same bulk notifications
      // endpoint as the "Send Appraisal Notification" modal, scoped to
      // this one employeeId.
      title: "Notify",
      key: "notify",
      width: COLUMN_WIDTHS.notify,
      render: (_: any, record: ManagerReviewItem) => {
        if (record.reviewStatus === ManagerReviewStatus.REVIEWED) {
          return <span className="text-slate-300 text-sm">—</span>;
        }

        const alreadyNotified = Boolean(
          (record as any).notificationDate ||
          (record as any).notificationSentAt ||
          (record as any).sentAt ||
          (record as any).isNotified ||
          (record as any).notificationSent ||
          record.reviewStatus === ManagerReviewStatus.IN_REVIEW,
        );
        const isSending = sendingRowNotification === record.employeeId;

        return (
          <Button
            type={alreadyNotified ? "default" : "primary"}
            size="small"
            icon={<Bell className="w-3.5 h-3.5" />}
            loading={isSending}
            onClick={() => sendSingleNotification(record)}
            className={
              alreadyNotified
                ? "!border-indigo-200 !text-indigo-600 hover:!bg-indigo-50 !font-semibold !rounded-lg !flex !items-center !gap-1"
                : "!bg-indigo-600 hover:!bg-indigo-700 !text-white !font-semibold !rounded-lg !flex !items-center !gap-1"
            }
          >
            {alreadyNotified ? "Resend" : "Send"}
          </Button>
        );
      },
    },

    {
      title: "Action",
      key: "action",
      width: COLUMN_WIDTHS.action,
      fixed: "right" as const,
      render: (_: any, record: ManagerReviewItem) => {
        const isReviewed = record.actionType === ActionType.VIEW;

        return (
          <div className="inline-flex items-center gap-2">
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
                type="default"
                size="small"
                icon={<Eye className="w-3.5 h-3.5 text-indigo-600" />}
                onClick={() => handleOpenEvaluation(record, true)}
                className="!border-indigo-200 !text-indigo-600 hover:!bg-indigo-50 !font-semibold !rounded-lg !flex !items-center !gap-1"
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

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3674] tracking-tight">
            Manager Quarterly Review
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Review, evaluate, and provide ratings for quarterly appraisal
            submissions from your team members.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Bell className="w-4 h-4" />}
          onClick={openNotificationModal}
          className="!bg-indigo-600 hover:!bg-indigo-700 !text-white !font-bold !rounded-xl !px-4 !py-2 !h-auto flex items-center gap-2 shadow-sm"
        >
          Send Appraisal Notification
        </Button>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-extrabold text-[#2B3674] leading-tight">
            Quarterly Reviews
          </h2>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          {/* Status segmented control — expanding up to the center line */}
          <div className="flex-1 w-full md:w-auto flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {STATUS_TAB_ITEMS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleStatusTabChange(tab.key)}
                className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedStatusTab === tab.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vertical divider between status tabs and search controls */}
          <div className="hidden lg:block w-px h-8 bg-slate-200 shrink-0" />

          {/* Right controls — Search input expands up to the center line */}
          <div className="flex-1 w-full md:w-auto flex items-center gap-3 justify-end">
            <Input
              placeholder="Search employee name or ID..."
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="!rounded-xl flex-1"
              allowClear
            />

            <Select
              value={selectedYear}
              onChange={handleYearChange}
              className="!rounded-xl !shrink-0"
              style={{ width: 170 }}
              suffixIcon={<Calendar className="w-3.5 h-3.5 text-indigo-500" />}
              dropdownStyle={{ minWidth: 170 }}
            >
              <Option value={YEAR_FILTER_ALL}>All Years</Option>
              {yearOptions.map((y) => (
                <Option key={y} value={y}>
                  {`FY ${y}`}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Quarter selector — card-style buttons for all quarters and Q1-Q4. */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() =>
            handleQuarterChange(
              selectedQuarterCard === QuarterFilter.ALL
                ? ""
                : QuarterFilter.ALL,
            )
          }
          className={`flex-1 min-w-[150px] flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selectedQuarterCard === QuarterFilter.ALL
              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.03]"
              : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:shadow-md"
          }`}
        >
          <span
            className={`text-lg font-extrabold tracking-tight ${
              selectedQuarterCard === QuarterFilter.ALL
                ? "text-white"
                : "text-indigo-600"
            }`}
          >
            All Quarters
          </span>
          <span
            className={`text-[10px] font-medium leading-tight text-center ${
              selectedQuarterCard === QuarterFilter.ALL
                ? "text-indigo-100"
                : "text-slate-400"
            }`}
          >
            View all employees
          </span>
        </button>

        {(
          [
            QuarterFilter.Q1,
            QuarterFilter.Q2,
            QuarterFilter.Q3,
            QuarterFilter.Q4,
          ] as const
        ).map((q) => {
          const cfg = quarterDateConfigs.find((c) => c.quarter === q);
          const dateRange = cfg
            ? `${dayjs(cfg.startDate).format("DD MMM")} – ${dayjs(cfg.endDate).format("DD MMM YYYY")}`
            : "";
          const isActive = selectedQuarterCard === q;
          return (
            <button
              key={q}
              type="button"
              onClick={() => handleQuarterChange(isActive ? "" : q)}
              className={`flex-1 min-w-[150px] flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.03]"
                  : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:shadow-md"
              }`}
            >
              <span
                className={`text-lg font-extrabold tracking-tight ${isActive ? "text-white" : "text-indigo-600"}`}
              >
                {q}
              </span>
              {dateRange && (
                <span
                  className={`text-[10px] font-medium leading-tight text-center ${
                    isActive ? "text-indigo-100" : "text-slate-400"
                  }`}
                >
                  {dateRange}
                </span>
              )}
            </button>
          );
        })}
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
            scroll={{ x: TABLE_SCROLL_X }}
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
        reviewQuarter={reviewQuarter}
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
        className="mqr-notification-modal"
        open={notificationModalOpen}
        onCancel={() => {
          setNotificationModalOpen(false);
          setAllNotificationEmployees([]);
          setSelectedNotificationEmployeeIds([]);
          setModalSearchText("");
          setNotificationQuarterFilter(QuarterFilter.ALL);
          setNotificationDate("");
        }}
        onOk={sendReviewNotifications}
        okText="Send Notification"
        confirmLoading={sendingNotifications}
        okButtonProps={{
          className:
            "!bg-indigo-600 hover:!bg-indigo-700 !border-indigo-600 !font-semibold !rounded-lg",
        }}
        cancelButtonProps={{
          className: "!rounded-lg !font-medium",
        }}
        width={1100}
        style={{ top: 24 }}
      >
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {/* Fixed 28px first column (was `auto`) so this header row lines
              up exactly with the data rows below, which have a real
              Checkbox component in that slot — `auto` sized the empty
              header <span/> differently than the rendered checkbox,
              throwing the columns out of alignment. */}
          <div className="grid grid-cols-[28px_1.4fr_1fr_1.2fr_0.8fr_1fr] gap-3 px-3 py-1.5 rounded-lg bg-indigo-50/70 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
            <span />
            <span>Employee Name</span>
            <span>Employee ID</span>
            <span>Designation</span>
            <span>Quarter</span>
            <span>Start Date</span>
          </div>

          <div className="flex items-center justify-between gap-3 py-0.5">
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
                selectedNotificationEmployeeIds.length <
                  selectableNotificationEmployees.length
              }
              onChange={(event) =>
                setSelectedNotificationEmployeeIds(
                  event.target.checked
                    ? selectableNotificationEmployees.map(
                        (emp: any) => emp.employeeId,
                      )
                    : [],
                )
              }
            >
              Select all employees requiring a review
              {!loadingNotificationEmployees &&
                allNotificationEmployees.length > 0 && (
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    ({selectableNotificationEmployees.length} requiring review /{" "}
                    {allNotificationEmployees.length} total members)
                  </span>
                )}
            </Checkbox>

            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={notificationQuarterFilter}
                onChange={setNotificationQuarterFilter}
                size="small"
                className="w-24"
                aria-label="Filter notifications by quarter"
              >
                <Option value={QuarterFilter.ALL}>All</Option>
                <Option value={QuarterFilter.Q1}>Q1</Option>
                <Option value={QuarterFilter.Q2}>Q2</Option>
                <Option value={QuarterFilter.Q3}>Q3</Option>
                <Option value={QuarterFilter.Q4}>Q4</Option>
              </Select>
              {allNotificationEmployees.length > 5 && (
                <Input
                  prefix={<Search size={14} className="text-slate-400 mr-1" />}
                  placeholder="Search name or ID..."
                  size="small"
                  value={modalSearchText}
                  onChange={(e) => setModalSearchText(e.target.value)}
                  allowClear
                  className="rounded-lg w-64"
                />
              )}
            </div>
          </div>

          <div className="mqr-employee-list flex-1 min-h-[140px] overflow-y-auto border border-slate-200 rounded-lg">
            {loadingNotificationEmployees ? (
              <div className="flex justify-center items-center p-8">
                <Spin tip="Loading all employees..." />
              </div>
            ) : allNotificationEmployees.length === 0 ? (
              <p className="p-4 text-slate-500">No employees found.</p>
            ) : (
              filteredNotificationEmployees.map((emp: any) => {
                const submission = submissions.find(
                  (s) => s.employeeId === emp.employeeId,
                );
                const rawQuarter = emp.quarter || submission?.quarter;
                const quarterCode = rawQuarter
                  ? rawQuarter.trim().split(/\s+/)[0]
                  : selectedQuarterCard &&
                      selectedQuarterCard !== QuarterFilter.ALL
                    ? selectedQuarterCard
                    : quarterDateConfigs[0]?.quarter || "—";
                const startDateStr =
                  emp.notificationDate || notificationDate
                    ? dayjs(emp.notificationDate || notificationDate).format(
                        "DD MMM YYYY",
                      )
                    : "—";
                const isReviewed = Boolean(
                  emp.isCompleted ||
                  emp.reviewStatus === ManagerReviewStatus.REVIEWED ||
                  submission?.reviewStatus === ManagerReviewStatus.REVIEWED,
                );

                return (
                  <div
                    key={emp.employeeId}
                    className="grid grid-cols-[28px_1.4fr_1fr_1.2fr_0.8fr_1fr] items-center gap-3 py-2 px-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <Checkbox
                      disabled={isReviewed}
                      checked={selectedNotificationEmployeeIds.includes(
                        emp.employeeId,
                      )}
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
                    <span className="text-slate-600">
                      {emp.designation || submission?.designation || "Employee"}
                    </span>
                    <span className="text-slate-600">{quarterCode || "—"}</span>
                    <span className="text-slate-500">{startDateStr}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerReviewBoardDesktop;
