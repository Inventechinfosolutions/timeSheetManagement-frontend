import { HiddenRatingBadge } from "../components/HiddenRatingBadge";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
  Briefcase,
  ClipboardList,
} from "lucide-react";
import axios from "axios";
import { Modal, Badge, Tooltip } from "antd";
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
  RATING_CATEGORY_ITEMS,
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
import {
  getMasterFinancialYearCodes,
  getCurrentFinancialYearData,
  computeQuarterDropdownOptions,
  formatQuarterWithDateRange,
  QuarterDropdownOption,
} from '../../master/financialYear.master';
import QuarterlyViewPage from "./Quarterlyviewpage";
import { useAppSelector } from "../../hooks";
import { UserType } from "../../enums";

const { Option } = Select;

type RatingValues = Record<string, number>;

const DEFAULT_PAGE_SIZE = 10;

const resolveQuarterDateRangeText = (q: string, fyString?: string): string => {
  let startYear: number;
  let endYear: number;
  const match = (fyString || "").match(/(\d{4})/);
  if (match) {
    startYear = parseInt(match[1], 10);
    endYear = startYear + 1;
  } else {
    const currentFY = getCurrentFinancialYearData();
    startYear = currentFY.startYear;
    endYear = currentFY.endYear;
  }
  const norm = (q || '').toUpperCase().trim();
  if (norm.startsWith('Q1')) return `01 Apr ${startYear} - 30 Jun ${startYear}`;
  if (norm.startsWith('Q2')) return `01 Jul ${startYear} - 30 Sep ${startYear}`;
  if (norm.startsWith('Q3')) return `01 Oct ${startYear} - 31 Dec ${startYear}`;
  if (norm.startsWith('Q4')) return `01 Jan ${endYear} - 31 Mar ${endYear}`;
  return '';
};

const getMinDeadlineDate = (startDateStr?: string | null): string => {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return '';
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
};

interface ManagerReviewBoardDesktopProps {
  onBack?: () => void;
}

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

    .mqr-wrapper .ant-select-selection-placeholder {
      font-family: ${MQR_FONT_STACK} !important;
      color: #334155 !important;
      font-weight: 500 !important;
    }

    .mqr-wrapper .ant-select-clear {
      background: #ffffff !important;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }
    .mqr-wrapper .ant-select-clear:hover {
      opacity: 1;
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

const getRecordAverageScore = (record: any): number | null => {
  if (record?.finalRating != null && !isNaN(Number(record.finalRating))) {
    return Number(record.finalRating);
  }
  if (record?.averageRatingScore != null && !isNaN(Number(record.averageRatingScore))) {
    return Number(record.averageRatingScore);
  }
  if (record?.ratings && typeof record.ratings === 'object') {
    const vals = Object.values(record.ratings).filter(
      (v): v is number => typeof v === 'number' && !isNaN(v)
    );
    if (vals.length > 0) {
      const sum = vals.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        const totalCategories = Math.max(vals.length, 6);
        return parseFloat((sum / totalCategories).toFixed(1));
      }
    }
  }
  return null;
};

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
  const { employeeId: employeeIdFromUrl, quarterPeriod: quarterPeriodFromUrl } = useParams<{
    employeeId?: string;
    quarterPeriod?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isManagerRoute = location.pathname.startsWith("/manager-dashboard");
  const { currentUser } = useAppSelector((state) => state.user);
  const isManager =
    isManagerRoute ||
    currentUser?.userType === UserType.MANAGER ||
    Boolean(currentUser?.role && currentUser.role.toUpperCase().includes(UserType.MANAGER));
  const isAdminOrCEO =
    currentUser?.userType === UserType.ADMIN ||
    currentUser?.userType === UserType.CEO ||
    Boolean(
      currentUser?.role &&
      (currentUser.role.toUpperCase().includes(UserType.ADMIN) ||
        currentUser.role.toUpperCase().includes(UserType.CEO))
    );
  const employeeDropdownLabel = "All Members";
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
  const [searchParams, setSearchParams] = useSearchParams();

  const urlYear = searchParams.get('year') || searchParams.get('financialYear') || searchParams.get('fy');
  const urlQuarter = searchParams.get('quarter') || searchParams.get('q');
  const urlStatus = searchParams.get('status') || searchParams.get('reviewStatus');
  const urlEmployee = searchParams.get('employeeId') || searchParams.get('employee');
  const urlSearch = searchParams.get('search') || "";

  const resolvedInitialStatus = useMemo(() => {
    if (!urlStatus) return StatusTabFilter.ALL;
    const s = urlStatus.toUpperCase();
    if (s === "ASSIGNED") return StatusTabFilter.ASSIGNED;
    if (
      s === "AWAITING_REVIEW" ||
      s === "AWAITING REVIEW" ||
      s === "AWAITING-REVIEW" ||
      s === "PENDING" ||
      s === "SUBMITTED"
    ) {
      return StatusTabFilter.AWAITING_REVIEW;
    }
    if (s === "UNDER_REVIEW" || s === "UNDER REVIEW" || s === "IN_REVIEW" || s === "IN REVIEW") return StatusTabFilter.UNDER_REVIEW;
    if (s === "REVIEWED" || s === "COMPLETED" || s === "APPROVED") return StatusTabFilter.REVIEWED;
    return StatusTabFilter.ALL;
  }, [urlStatus]);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuarter] = useState<string>(
    QuarterFilter.ALL,
  );
  const [selectedQuarterCard, setSelectedQuarterCard] = useState<string>(
    urlQuarter && ["Q1", "Q2", "Q3", "Q4"].includes(urlQuarter.toUpperCase()) ? urlQuarter.toUpperCase() : QuarterFilter.ALL
  );
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>(resolvedInitialStatus);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<string>(urlEmployee || "ALL");
  const [teamEmployees, setTeamEmployees] = useState<
    Array<{ employeeId: string; employeeName: string; designation?: string }>
  >([]);
  const [loadingTeamEmployees, setLoadingTeamEmployees] = useState<boolean>(false);

  const employeeFilterOptions = useMemo(() => [
    { label: employeeDropdownLabel, value: "ALL" },
    ...teamEmployees.map((emp) => ({
      label: emp.employeeName && emp.employeeName !== emp.employeeId
        ? `${emp.employeeName} (${emp.employeeId})`
        : emp.employeeId,
      value: emp.employeeId,
    })),
  ], [teamEmployees, employeeDropdownLabel]);
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const [selectedYear, setSelectedYear] = useState<string>(urlYear || YEAR_FILTER_ALL);

  // Sync manager filters to URL query parameters
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (selectedYear && selectedYear !== YEAR_FILTER_ALL) next.set('year', selectedYear);
      else next.delete('year');

      if (selectedQuarterCard && selectedQuarterCard !== QuarterFilter.ALL) next.set('quarter', selectedQuarterCard);
      else next.delete('quarter');

      if (selectedStatusTab && selectedStatusTab !== StatusTabFilter.ALL) next.set('status', selectedStatusTab.toLowerCase());
      else next.delete('status');

      if (selectedEmployee && selectedEmployee !== 'ALL') next.set('employeeId', selectedEmployee);
      else next.delete('employeeId');

      if (searchQuery.trim()) next.set('search', searchQuery.trim());
      else next.delete('search');

      return next;
    }, { replace: true });
  }, [selectedYear, selectedQuarterCard, selectedStatusTab, selectedEmployee, searchQuery, setSearchParams]);

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
    requestedQuarters?: string[];
    hasPendingRequest?: boolean;
  }

  // Assign Review modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [modeSelectModalOpen, setModeSelectModalOpen] = useState(false);
  const [assignStartDate, setAssignStartDate] = useState("");
  const [assignEndDate, setAssignEndDate] = useState("");
  const [assignFinancialYear, setAssignFinancialYear] = useState("");
  const [assignQuarterLabel, setAssignQuarterLabel] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignQuarter, setAssignQuarter] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignEmployeeName, setAssignEmployeeName] = useState("");
  const [assignableEmployees, setAssignableEmployees] = useState<AssignableEmployee[]>([]);
  const [loadingAssignableEmployees, setLoadingAssignableEmployees] = useState(false);
  const [assignMode, setAssignMode] = useState<"individual" | "all">("individual");
  const [selectedAssignMode, setSelectedAssignMode] = useState<
    "individual" | "all" | null
  >(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeAssignedQuarters, setEmployeeAssignedQuarters] = useState<string[]>([]);
  const [assignQuarterOptions, setAssignQuarterOptions] = useState<QuarterDropdownOption[]>(() => computeQuarterDropdownOptions());
  const [filterQuarterOptions, setFilterQuarterOptions] = useState<QuarterDropdownOption[]>(() =>
    computeQuarterDropdownOptions(selectedYear !== YEAR_FILTER_ALL ? selectedYear : undefined)
  );

  useEffect(() => {
    setAssignQuarterOptions(
      computeQuarterDropdownOptions(assignFinancialYear || (selectedYear !== YEAR_FILTER_ALL ? selectedYear : undefined))
    );
  }, [assignFinancialYear, selectedYear]);

  useEffect(() => {
    setFilterQuarterOptions(
      computeQuarterDropdownOptions(selectedYear !== YEAR_FILTER_ALL ? selectedYear : undefined)
    );
  }, [selectedYear]);
  useEffect(() => {
    setSelectedAssignMode(null);
  }, [location.pathname]);
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



  // Access Requests panel state
  const [accessRequestsOpen, setAccessRequestsOpen] = useState(false);
  // Employee assignment list modal state (for clicking Assigned / Not Assigned)
  const [assignmentListModalOpen, setAssignmentListModalOpen] = useState(false);
  const [assignmentListType, setAssignmentListType] = useState<"assigned" | "not_assigned" | "single_quarter">("assigned");
  const [assignedSubTab, setAssignedSubTab] = useState<"all" | "single_quarter">("all");
  const [assignmentListSearch, setAssignmentListSearch] = useState("");
  const [accessRequests, setAccessRequests] = useState<ReviewAccessRequest[]>([]);
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<ReviewAccessRequest | null>(null);
  const [accessRequestsLoading, setAccessRequestsLoading] = useState(false);
  const [actioningRequestId, setActioningRequestId] = useState<string | number | null>(null);
  const [actionComments, setActionComments] = useState<Record<string | number, string>>({});

  // Helper to determine if a quarter is disabled/enabled for current selection in Assign modal
  // Helper to determine if a quarter is disabled/enabled for current selection in Assign modal
  const getQuarterOptionStatus = (qCode: string): {
    disabled: boolean;
    tag: string | null;
    tagClass: string;
  } => {
    // If individual mode and no employee is selected yet, keep enabled
    if (assignMode === "individual" && selectedEmployeeIds.length === 0) {
      return { disabled: false, tag: null, tagClass: "" };
    }

    const normQ = qCode.trim().toUpperCase(); // e.g. "Q1"

    const targetEmployeeIds =
      assignMode === "all"
        ? assignableEmployees.map((e) => String(e.employeeId))
        : selectedEmployeeIds.map(String);

    if (targetEmployeeIds.length === 0) {
      return { disabled: false, tag: null, tagClass: "" };
    }

    let anyAssignedWithoutRequest = false;
    let anyRequested = false;

    for (const empId of targetEmployeeIds) {
      const emp = assignableEmployees.find(
        (e) => String(e.employeeId).toLowerCase() === empId.toLowerCase()
      );

      // Collect all assigned quarters for this employee
      const assignedQs = [
        ...(emp?.assignedQuarters || []),
        ...submissions
          .filter((s) => String(s.employeeId).toLowerCase() === empId.toLowerCase())
          .map((s) => s.quarterCode || s.quarter || ""),
        ...employeeAssignedQuarters,
      ].filter(Boolean);

      // Collect pending access requests for this employee
      const requestedQs = [
        ...(emp?.requestedQuarters || []),
        ...accessRequests
          .filter(
            (r) =>
              String(r.employeeId).toLowerCase() === empId.toLowerCase() &&
              r.status === "PENDING"
          )
          .map((r) => r.quarter || ""),
      ].filter(Boolean);

      // Check if assigned for this quarter
      const isEmpAssigned = assignedQs.some((assigned) => {
        const aNorm = (assigned || "").trim().toUpperCase();
        return (
          aNorm === normQ ||
          aNorm.startsWith(normQ + " ") ||
          aNorm.startsWith(normQ + "-") ||
          aNorm.includes(` ${normQ} `) ||
          aNorm.endsWith(` ${normQ}`)
        );
      });

      if (isEmpAssigned) {
        // Check if employee has sent an access request for this quarter
        const hasEmpReq = requestedQs.some((reqQ) => {
          const rNorm = (reqQ || "").trim().toUpperCase();
          return (
            rNorm === normQ ||
            rNorm.startsWith(normQ + " ") ||
            rNorm.startsWith(normQ + "-") ||
            rNorm.includes(` ${normQ} `) ||
            rNorm.endsWith(` ${normQ}`)
          );
        });

        if (hasEmpReq) {
          anyRequested = true;
        } else {
          anyAssignedWithoutRequest = true;
        }
      }
    }

    if (anyAssignedWithoutRequest) {
      return {
        disabled: true,
        tag: "Already assigned",
        tagClass: "text-slate-400 font-normal",
      };
    }

    if (anyRequested) {
      return {
        disabled: false,
        tag: "Access Requested",
        tagClass: "text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold",
      };
    }

    return { disabled: false, tag: null, tagClass: "" };
  };

  // Clear assignQuarterLabel if the newly selected employee already has it assigned without request
  useEffect(() => {
    if (assignQuarterLabel) {
      const status = getQuarterOptionStatus(assignQuarterLabel);
      if (status.disabled) {
        setAssignQuarterLabel("");
      }
    }
  }, [selectedEmployeeIds, assignMode, assignFinancialYear, assignableEmployees, accessRequests, currentAssignedQuarters, submissions]);

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
    ratings?: string;
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
      setAccessRequestsLoading(true);

      const params: Record<string, any> = { page, pageSize: size };
      if (selectedQuarter !== QuarterFilter.ALL)
        params.quarter = selectedQuarter;
      if (selectedQuarterCard !== QuarterFilter.ALL)
        params.quarterCard = selectedQuarterCard;
      if (selectedYear !== YEAR_FILTER_ALL) params.year = selectedYear;
      if (selectedStatusTab !== StatusTabFilter.ALL)
        params.status = selectedStatusTab;
      if (!isManager && selectedRole !== "ALL") params.role = selectedRole;
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

      const [subsRes, statsRes, accessRes] = await Promise.all([
        axios.get("/api/manager-quarterly-review", { params }),
        axios.get("/api/manager-quarterly-review/stats", { params: statsParams }),
        axios.get("/api/quarterly-review/access-requests", { params: { status: "pending" } }).catch(() => null),
      ]);

      if (subsRes.data?.success) {
        setSubmissions(subsRes.data.data || []);
        setTotalCount(subsRes.data.total ?? 0);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (accessRes?.data?.success && Array.isArray(accessRes.data.data)) {
        setAccessRequests(accessRes.data.data);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
        "Failed to fetch quarterly review submissions.",
      );
    } finally {
      setLoading(false);
      setAccessRequestsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(1, DEFAULT_PAGE_SIZE);
    loadAccessRequests();
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
          .catch(() => { });
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
    if (averageScore > 0) return PerformanceRating.UNSATISFACTORY;
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

  const formatQuarterHyphen = (q?: string | null): string => {
    if (!q) return "";
    return q.trim().replace(/^([Qq][1-4])[\s_]+(FY\d{4}-\d{2})/i, "$1-$2");
  };

  const getRecordQuarterUrl = (record: ManagerReviewItem): string => {
    const rawQ = record.quarterCode || record.quarter || record.fullQuarter || "";
    const qMatch = String(rawQ).match(/Q[1-4]/i);
    const qCode = qMatch ? qMatch[0].toUpperCase() : "";

    let fy = "";
    const rawFy = record.financialYear || record.fullQuarter || record.quarter || "";
    const fyMatch = String(rawFy).match(/(?:FY\s*)?(\d{4}-\d{2})/i);
    if (fyMatch) {
      fy = `FY${fyMatch[1]}`;
    } else {
      const currentFy = getCurrentFinancialYearData();
      fy = `FY${currentFy.code}`;
    }

    if (qCode) {
      return `${qCode}-${fy}`;
    }
    return formatQuarterHyphen(record.fullQuarter || record.quarter || "");
  };

  const formatDateDisplay = (dateVal?: string | Date | null): string => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(dateVal);
    }
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
    const formattedQuarter = getRecordQuarterUrl(record);
    const modeParam = `mode=${viewOnly ? 'view' : 'edit'}`;
    const urlKey = `${record.employeeId}_${formattedQuarter}`;
    loadedEmployeeIdRef.current = urlKey;
    loadFreshReview(record.employeeId, formattedQuarter, viewOnly);
    const targetUrl = formattedQuarter
      ? `${baseRoute}/${record.employeeId}/${encodeURIComponent(formattedQuarter)}?${modeParam}`
      : `${baseRoute}/${record.employeeId}?${modeParam}`;
    navigate(targetUrl, {
      state: { viewOnly, record },
      replace: false,
    });
  };

  const loadFreshReview = async (employeeId: string, quarter?: string, preferredViewOnly?: boolean) => {
    try {
      const formattedQ = formatQuarterHyphen(quarter);
      const url = formattedQ
        ? `/api/manager-quarterly-review/${employeeId}?quarter=${encodeURIComponent(formattedQ)}`
        : `/api/manager-quarterly-review/${employeeId}`;
      const response = await axios.get(url);
      if (response.data?.success && response.data?.data) {
        const freshRecord: ManagerReviewItem = response.data.data;
        setCurrentReview(freshRecord);
        applyReviewToForm(freshRecord);
        const isFreshUnderReview =
          freshRecord.status === 'Under Review' ||
          freshRecord.status === 'In Review' ||
          freshRecord.reviewStatus === 'Under Review' ||
          freshRecord.reviewStatus === 'In Review';
        const isFreshEvaluated =
          !isFreshUnderReview &&
          (freshRecord.status === 'Reviewed' ||
            freshRecord.reviewStatus === 'Reviewed' ||
            Boolean(freshRecord.reviewedOn));

        const searchParams = new URLSearchParams(location.search);
        const modeParam = searchParams.get('mode');
        const isExplicitView =
          preferredViewOnly === true ||
          modeParam === 'view' ||
          (modeParam !== 'edit' && location.state?.viewOnly === true);
        const isExplicitEdit =
          preferredViewOnly === false ||
          modeParam === 'edit' ||
          (modeParam !== 'view' && location.state?.viewOnly === false);

        if (isExplicitEdit) {
          setIsViewOnly(false);
        } else if (isExplicitView) {
          setIsViewOnly(true);
        } else {
          setIsViewOnly(isFreshEvaluated);
        }
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
        `Failed to load the latest details for this review.`,
      );
    }
  };

  // Close the view/evaluation page, clear the employeeId back out of the URL, reset the
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
    if (!employeeIdFromUrl) {
      setIsModalOpen(false);
      setCurrentReview(null);
      loadedEmployeeIdRef.current = null;
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const rawQuarterFromUrl = quarterPeriodFromUrl || searchParams.get("quarter") || undefined;
    const quarterFromUrl = formatQuarterHyphen(rawQuarterFromUrl) || undefined;
    const modeFromUrl = searchParams.get("mode");
    const isExplicitView = modeFromUrl === 'view' || (modeFromUrl !== 'edit' && location.state?.viewOnly === true);
    const isExplicitEdit = modeFromUrl === 'edit' || (modeFromUrl !== 'view' && location.state?.viewOnly === false);
    const urlKey = `${employeeIdFromUrl}_${quarterFromUrl || ""}`;

    if (loadedEmployeeIdRef.current === urlKey && currentReview) return;
    loadedEmployeeIdRef.current = urlKey;

    if (
      location.state?.record &&
      location.state.record.employeeId === employeeIdFromUrl &&
      (!quarterFromUrl ||
        getRecordQuarterUrl(location.state.record) === quarterFromUrl ||
        formatQuarterHyphen(location.state.record.quarter) === quarterFromUrl ||
        formatQuarterHyphen(location.state.record.fullQuarter) === quarterFromUrl ||
        (location.state.record.quarterCode && quarterFromUrl.startsWith(location.state.record.quarterCode)) ||
        (location.state.record.quarter && quarterFromUrl.startsWith(location.state.record.quarter.trim().split(/\s+/)[0])))
    ) {
      const rec = location.state.record;
      setCurrentReview(rec);
      const isRecUnderReview =
        rec.status === 'Under Review' ||
        rec.status === 'In Review' ||
        rec.reviewStatus === 'Under Review' ||
        rec.reviewStatus === 'In Review';
      const isRecEvaluated =
        !isRecUnderReview &&
        (rec.status === 'Reviewed' ||
          rec.reviewStatus === 'Reviewed' ||
          Boolean(rec.reviewedOn));

      if (isExplicitEdit) {
        setIsViewOnly(false);
      } else if (isExplicitView) {
        setIsViewOnly(true);
      } else {
        setIsViewOnly(isRecEvaluated);
      }
      setFieldErrors({});
      applyReviewToForm(rec);
      setIsModalOpen(true);
      loadFreshReview(employeeIdFromUrl, quarterFromUrl || getRecordQuarterUrl(rec), isExplicitView ? true : (isExplicitEdit ? false : undefined));
      return;
    }

    const matchedSubmission = submissions.find(
      (submission) =>
        submission.employeeId === employeeIdFromUrl &&
        (!quarterFromUrl ||
          getRecordQuarterUrl(submission) === quarterFromUrl ||
          formatQuarterHyphen(submission.quarter) === quarterFromUrl ||
          formatQuarterHyphen(submission.fullQuarter) === quarterFromUrl ||
          (submission.quarterCode && quarterFromUrl.startsWith(submission.quarterCode)) ||
          (submission.quarter && quarterFromUrl.startsWith(submission.quarter.trim().split(/\s+/)[0]))),
    );
    if (matchedSubmission) {
      setCurrentReview(matchedSubmission);
      const isMatchedUnderReview =
        matchedSubmission.status === 'Under Review' ||
        matchedSubmission.status === 'In Review' ||
        matchedSubmission.reviewStatus === 'Under Review' ||
        matchedSubmission.reviewStatus === 'In Review';
      const isMatchedEvaluated =
        !isMatchedUnderReview &&
        (matchedSubmission.status === 'Reviewed' ||
          matchedSubmission.reviewStatus === 'Reviewed' ||
          Boolean(matchedSubmission.reviewedOn));

      if (isExplicitEdit) {
        setIsViewOnly(false);
      } else if (isExplicitView) {
        setIsViewOnly(true);
      } else {
        setIsViewOnly(isMatchedEvaluated);
      }
      setFieldErrors({});
      applyReviewToForm(matchedSubmission);
      setIsModalOpen(true);
      loadFreshReview(employeeIdFromUrl, quarterFromUrl || getRecordQuarterUrl(matchedSubmission), isExplicitView ? true : (isExplicitEdit ? false : undefined));
    } else {
      if (isExplicitEdit) {
        setIsViewOnly(false);
      } else if (isExplicitView) {
        setIsViewOnly(true);
      }
      setIsModalOpen(true);
      loadFreshReview(employeeIdFromUrl, quarterFromUrl, isExplicitView ? true : (isExplicitEdit ? false : undefined));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFromUrl, quarterPeriodFromUrl, location.search]);

  const validateTextFields = (): boolean => {
    const errors: {
      strengths?: string;
      improvements?: string;
      remarks?: string;
      ratings?: string;
    } = {};

    const missingRatings = RATING_CATEGORY_ITEMS.filter(
      (item) => !ratings[item.key] || ratings[item.key] <= 0
    );
    if (missingRatings.length > 0) {
      errors.ratings = "Please provide ratings for all performance categories.";
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
        `Please provide all ratings and complete all feedback fields before submitting.`,
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
          ? ManagerReviewStatus.UNDER_REVIEW
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
    if (month >= 3 && month <= 5) { currentQ = 1; fyStartYear = now.getFullYear(); }
    else if (month >= 6 && month <= 8) { currentQ = 2; fyStartYear = now.getFullYear(); }
    else if (month >= 9 && month <= 11) { currentQ = 3; fyStartYear = now.getFullYear(); }
    else { currentQ = 4; fyStartYear = now.getFullYear() - 1; }

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
        setAssignableEmployees(
          [...(res.data.data || [])].sort((a: any, b: any) =>
            (a.employeeName || "").localeCompare(b.employeeName || "", undefined, {
              sensitivity: "base",
            })
          )
        );
      }
    } catch (err: any) {
      console.warn("Failed to update assignable employees for quarter:", err);
    } finally {
      setLoadingAssignableEmployees(false);
    }
  };

  const openAssignModal = async (item?: ManagerReviewItem) => {
    setAssignModalOpen(true);
    setAssignQuarterLabel("");
    setAssignNotes("");
    setLoadingAssignableEmployees(true);
    loadAccessRequests();

    if (item) {
      const singleId = String(item.employeeId || item.id || "");
      setAssignEmployeeId(singleId);
      setAssignEmployeeName(item.employeeName || "");
      setSelectedEmployeeIds([singleId]);
      setAssignMode("individual");
      if (item.quarter) {
        const qCodeMatch = item.quarter.match(/Q[1-4]/i);
        if (qCodeMatch) {
          setEmployeeAssignedQuarters([qCodeMatch[0].toUpperCase(), item.quarter]);
        }
      }
    } else {
      setAssignEmployeeId("");
      setAssignEmployeeName("");
      setSelectedEmployeeIds([]);
      setAssignMode("individual");
      setEmployeeAssignedQuarters([]);
    }

    const initialQ = item?.quarter || assignQuarter || "";
    try {
      const res = await axios.get("/api/quarterly-review/assignable-employees", {
        params: initialQ ? { quarter: initialQ } : {},
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAssignableEmployees(
          [...(res.data.data || [])].sort((a: any, b: any) =>
            (a.employeeName || "").localeCompare(b.employeeName || "", undefined, {
              sensitivity: "base",
            })
          )
        );
      }
    } catch (err: any) {
      console.warn("Failed to fetch assignable employees:", err);
    } finally {
      setLoadingAssignableEmployees(false);
    }
  };

  const handleAssignReview = async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const effectiveStart = assignStartDate || todayStr;

    // Validate all mandatory fields
    if (!assignQuarterLabel) { message.error("Quarter is required."); return; }
    if (!assignEndDate) { message.error("Deadline is required."); return; }
    if (assignEndDate < tomorrowStr) {
      message.error("Deadline must be at least tomorrow. Current date cannot be selected.");
      return;
    }
    if (!assignNotes || !assignNotes.trim()) { message.error("Description is required."); return; }
    if (assignMode === "individual" && selectedEmployeeIds.length === 0) {
      message.error("Please select at least one employee.");
      return;
    }
    try {
      setAssignSubmitting(true);
      const payload: any = {
        mode: assignMode === "all" ? "ALL" : "INDIVIDUAL",
        quarter: assignQuarterLabel,
        financialYear: assignFinancialYear,
        startDate: effectiveStart,
        endDate: assignEndDate,
        description: assignNotes.trim(),
      };
      if (assignMode === "individual") { payload.employeeIds = selectedEmployeeIds; }
      const res = await axios.post("/api/manager-quarterly-review/assignments/create", payload);
      if (res.data?.success) {
        const created = res.data?.data?.created ?? 0;
        const skipped = res.data?.data?.skipped ?? 0;
        message.success(res.data?.message || `${created} assignment(s) created${skipped > 0 ? `, ${skipped} skipped` : ""}.`);
        setAssignModalOpen(false);
        setModeSelectModalOpen(false);
        fetchData(1, pageSize);
        loadAccessRequests();
        axios
          .get("/api/quarterly-review/assignable-employees")
          .then((empRes) => {
            if (empRes.data?.success && Array.isArray(empRes.data.data)) {
              setAssignableEmployees([...empRes.data.data]);
            }
          })
          .catch(() => { });
      } else {
        message.error(res.data?.message || "Failed to assign review.");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to assign review.");
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

  const openAccessRequestsPanel = (targetRequest?: ReviewAccessRequest | null) => {
    setSelectedAccessRequest(targetRequest || null);
    setAccessRequestsOpen(true);
    loadAccessRequests();
  };

  const handleAccessRequestAction = async (
    requestId: string | number,
    action: "approve" | "reject",
  ) => {
    const comment = (actionComments[requestId] || "").trim();
    if (action === "reject" && !comment) {
      message.warning("Please enter a comment/reason before rejecting the access request.");
      return;
    }

    try {
      setActioningRequestId(requestId);
      const upperAction = action === "approve" ? "APPROVE" : "REJECT";
      const res = await axios.post(
        `/api/quarterly-review/access-requests/${requestId}/action`,
        { action: upperAction, remarks: comment, extensionHours: 48 },
      );

      if (res.data?.success) {
        message.success(
          action === "approve"
            ? "Access request approved. The review edit option has been reopened."
            : "Access request rejected.",
        );
        setActionComments((prev) => {
          const updated = { ...prev };
          delete updated[requestId];
          return updated;
        });
        // Refresh the list and the main table
        await Promise.all([
          loadAccessRequests(),
          fetchData(currentPage, pageSize),
        ]);
        setSelectedAccessRequest(null);
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
    const masterYears = getMasterFinancialYearCodes();
    const dataYears = submissions
      .map((submission) => getSubmissionYear(submission))
      .filter(Boolean);

    const years = Array.from(
      new Set([...masterYears, DEFAULT_YEAR, ...dataYears]),
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

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() ||
      (selectedRole && selectedRole !== "ALL") ||
      (selectedYear && selectedYear !== YEAR_FILTER_ALL) ||
      (selectedQuarterCard && selectedQuarterCard !== QuarterFilter.ALL) ||
      (selectedEmployee && selectedEmployee !== "ALL") ||
      (selectedStatusTab && selectedStatusTab !== StatusTabFilter.ALL)
    );
  }, [searchQuery, selectedRole, selectedYear, selectedQuarterCard, selectedEmployee, selectedStatusTab]);

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
    const currentStatus = (status || AppraisalStatus.ASSIGNED).trim().toLowerCase();
    if (
      currentStatus === AppraisalStatus.REVIEWED.toLowerCase() ||
      currentStatus === "reviewed" ||
      currentStatus === "completed" ||
      currentStatus === "approved"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Reviewed
        </span>
      );
    }
    if (
      currentStatus === AppraisalStatus.UNDER_REVIEW.toLowerCase() ||
      currentStatus === "under review" ||
      currentStatus === "under_review" ||
      currentStatus === "in review" ||
      currentStatus === "in_review"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Under Review
        </span>
      );
    }
    if (
      currentStatus === AppraisalStatus.AWAITING_REVIEW.toLowerCase() ||
      currentStatus === "pending" ||
      currentStatus === "awaiting review" ||
      currentStatus === "awaiting_review" ||
      currentStatus === "submitted" ||
      currentStatus === "auto submitted" ||
      currentStatus === "auto_submitted"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Awaiting Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Assigned
      </span>
    );
  };

  const tableTextClass = "text-slate-700 text-sm font-medium whitespace-nowrap";

  const columns = [
    {
      title: "Employee Name",
      key: "employeeName",
      width: 150,
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
          <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials || <Users className="w-3.5 h-3.5 text-indigo-500" />}
            </div>
            <div className="flex flex-col text-left">
              <p className={`${tableTextClass} whitespace-nowrap`}>{displayName || "—"}</p>
            </div>
          </div>
        );
      },
    },

    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      width: 150,
      render: (employeeIdText: string) => (
        <span className={tableTextClass}>{employeeIdText || "—"}</span>
      ),
    },

    {
      title: "Role",
      dataIndex: "employeeRole",
      key: "employeeRole",
      width: 150,
      render: (_: any, record: ManagerReviewItem) => {
        const roleRaw = (record.employeeRole || (record as any).role || "").toString().trim().toUpperCase();
        if (!roleRaw) return <span className={tableTextClass}>—</span>;
        const isManager = roleRaw === "MANAGER";
        return (
          <span
            className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${isManager
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
          >
            {roleRaw}
          </span>
        );
      },
    },

    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: 150,
      render: (designationText: string | null) => (
        <span className={tableTextClass}>
          {designationText ? designationText.charAt(0).toUpperCase() + designationText.slice(1) : "—"}
        </span>
      ),
    },

    {
      title: "Quarter",
      dataIndex: "quarter",
      key: "quarter",
      width: 150,
      render: (quarterText: string | null, record: ManagerReviewItem) => {
        const display = formatQuarterWithDateRange(quarterText, record.financialYear);
        return (
          <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
            {display || "—"}
          </span>
        );
      },
    },

    {
      title: "Financial Year",
      dataIndex: "financialYear",
      key: "financialYear",
      width: 150,
      render: (yearText: string | null) => (
        <span className={tableTextClass}>
          {yearText || "—"}
        </span>
      ),
    },

    {
      title: "Deadline",
      dataIndex: "toDate",
      key: "toDate",
      width: 150,
      render: (_: any, record: ManagerReviewItem) => (
        <span className={tableTextClass}>
          {formatDateDisplay(record.toDate || record.endDate || record.deadlineAt)}
        </span>
      ),
    },

    {
      title: "Assigned By",
      key: "assignedBy",
      width: 170,
      render: (_: any, record: ManagerReviewItem) => {
        const displayAssignedBy =
          (record as any).assignedByName ||
          (record as any).assignedBy ||
          record.managerName ||
          "—";
        return (
          <Tooltip title={displayAssignedBy}>
            <span className={`${tableTextClass} truncate max-w-[150px] inline-block`}>
              {displayAssignedBy}
            </span>
          </Tooltip>
        );
      },
    },

    {
      title: "Final Rating",
      dataIndex: "finalRating",
      key: "finalRating",
      width: 150,
      render: (ratingScore: number | null, record: ManagerReviewItem) => {
        const effectiveScore = getRecordAverageScore(record) ?? ratingScore;
        return record.isFinalRatingHidden ? (
          <HiddenRatingBadge
            reviewId={record.id}
            quarter={record.quarter}
            finalRating={effectiveScore}
            isFinalRatingHidden={true}
            hasFinalRating={record.hasFinalRating || effectiveScore != null}
          />
        ) : effectiveScore != null ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100 whitespace-nowrap">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {effectiveScore}
          </span>
        ) : (
          <span className="text-slate-400 text-sm font-medium whitespace-nowrap">—</span>
        );
      },
    },

    {
      title: "Updated On",
      dataIndex: "lastModified",
      key: "lastModified",
      width: 150,
      render: (modifiedDate: string | null) =>
        modifiedDate ? (
          <div className={`${tableTextClass} leading-tight whitespace-nowrap`}>
            <div>
              {new Date(modifiedDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-sm font-medium whitespace-nowrap">—</span>
        ),
    },

    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_: any, record: ManagerReviewItem) => (
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          {renderStatusBadge(record.displayReviewStatus || record.reviewStatus || record.status)}
        </div>
      ),
    },

    {
      title: "Actions",
      key: "action",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: ManagerReviewItem) => {
        const isReviewed =
          record.status === AppraisalStatus.REVIEWED ||
          record.status === "Reviewed" ||
          record.status === "Completed" ||
          record.status === "Approved" ||
          record.reviewStatus === "Reviewed";

        const canEvaluate =
          isReviewed ||
          record.status === AppraisalStatus.AWAITING_REVIEW ||
          record.status === AppraisalStatus.UNDER_REVIEW ||
          record.status === "Awaiting Review" ||
          record.status === "Under Review";

        // Find pending access request for this row's employee and quarter
        const pendingRequest = accessRequests.find((r) => {
          if (String(r.employeeId).trim().toLowerCase() !== String(record.employeeId).trim().toLowerCase()) return false;
          if (r.status !== "PENDING") return false;
          const rQuarter = (r.quarter || "").toUpperCase().replace(/[\s\-_]/g, "");
          const recQuarter = (record.quarter || "").toUpperCase().replace(/[\s\-_]/g, "");
          const recFull = (record.fullQuarter || "").toUpperCase().replace(/[\s\-_]/g, "");
          const recCode = (record.quarterCode || "").toUpperCase().replace(/[\s\-_]/g, "");
          if (!rQuarter) return true;
          if (rQuarter === recQuarter || rQuarter === recFull) return true;
          if (recCode && (rQuarter.startsWith(recCode) || rQuarter.includes(recCode))) return true;
          if (recQuarter && (rQuarter.includes(recQuarter) || recQuarter.includes(rQuarter))) return true;
          return true;
        }) || (record as any).pendingAccessRequest || null;

        const showAccessRequestBtn = Boolean(pendingRequest || (record as any).hasPendingAccessRequest);

        return (
          <div className="inline-flex items-center gap-1.5 justify-center flex-nowrap whitespace-nowrap">
            {canEvaluate && (
              <Button
                type="text"
                size="small"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => handleOpenEvaluation(record, false)}
                title={isReviewed || record.status === "Under Review" || record.status === "In Review" ? "Edit Evaluation" : "Evaluate"}
                className="!border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !justify-center"
              />
            )}
            <Button
              size="small"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => handleOpenEvaluation(record, true)}
              title="View Review"
              className="!border-slate-300 hover:!border-indigo-400 !text-slate-700 hover:!text-indigo-600 !font-semibold !rounded-lg !flex !items-center !justify-center"
            />
            {showAccessRequestBtn && (
              <Button
                size="small"
                icon={<Key className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => openAccessRequestsPanel(pendingRequest || null)}
                title={
                  pendingRequest
                    ? `Access Request Pending: "${pendingRequest.requestReason || pendingRequest.reason || 'Reopen requested'}" - Click to review`
                    : 'Access Request Pending - Click to review'
                }
                className="!border-amber-300 hover:!border-amber-400 !bg-amber-50 hover:!bg-amber-100 !text-amber-700 !font-semibold !rounded-lg !flex !items-center !justify-center"
              />
            )}
          </div>
        );
      },
    },
  ];

  if (employeeIdFromUrl) {
    return (
      <div className="mqr-wrapper w-full min-h-full bg-slate-50 px-6 pt-3 pb-10 flex flex-col gap-3">
        <style>{MQR_FONT_STYLES}</style>
        <QuarterlyViewPage
          open={true}
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
  }

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
                  Awaiting Review
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
      <style>{`
          .custom-table .ant-table-container {
            border-top-left-radius: 0px !important;
            border-top-right-radius: 0px !important;
            overflow: hidden !important;
          }
          .custom-table .ant-table-thead > tr > th {
            background-color: #4318FF !important;
            color: #FFFFFF !important;
            font-weight: 700 !important;
            font-size: 12px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            border-bottom: none !important;
            padding-top: 14px !important;
            padding-bottom: 14px !important;
            text-align: center !important;
            white-space: nowrap !important;
            word-break: keep-all !important;
          }
          .custom-table .ant-table-thead > tr > th::before {
            display: none !important;
          }
          .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
          .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-right-first {
            background-color: #4318FF !important;
            color: #FFFFFF !important;
          }
          .custom-table table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
          }
          .custom-table .ant-table-header {
            margin-bottom: 0 !important;
          }
          .custom-table .ant-table-body {
            margin-top: 0 !important;
          }
          /* Completely collapse internal measure row to remove blank gap between thead and tbody */
          .custom-table .ant-table-tbody > tr.ant-table-measure-row {
            visibility: collapse !important;
            height: 0 !important;
            line-height: 0 !important;
            font-size: 0 !important;
          }
          .custom-table .ant-table-tbody > tr.ant-table-measure-row > td {
            padding: 0 !important;
            border: none !important;
            height: 0 !important;
            line-height: 0 !important;
            font-size: 0 !important;
          }
          .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
            text-align: center !important;
            padding: 12px 14px !important;
            font-size: 13px !important;
            border-bottom: 1px solid #F1F5F9 !important;
            transition: background-color 0.15s ease;
            white-space: nowrap !important;
            word-break: keep-all !important;
          }
          .custom-table .ant-table-thead > tr > th:first-child,
          .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row) > td:first-child {
            text-align: center !important;
            padding-left: 14px !important;
          }
          .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row) > td.ant-table-cell-fix-right,
          .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row) > td.ant-table-cell-fix-right-first {
            background-color: #FFFFFF !important;
            box-shadow: -4px 0 8px rgba(0, 0, 0, 0.06) !important;
          }
          .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td.ant-table-cell-fix-right,
          .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td.ant-table-cell-fix-right-first {
            background-color: #F8FAFC !important;
          }
          .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td {
            background-color: #F8FAFC !important;
          }
          /* Custom sleek scrollbar for table horizontal scrolling */
          .custom-table .ant-table-body::-webkit-scrollbar,
          .custom-table .ant-table-content::-webkit-scrollbar {
            height: 8px;
          }
          .custom-table .ant-table-body::-webkit-scrollbar-track,
          .custom-table .ant-table-content::-webkit-scrollbar-track {
            background: #F1F5F9;
            border-radius: 4px;
          }
          .custom-table .ant-table-body::-webkit-scrollbar-thumb,
          .custom-table .ant-table-content::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 4px;
          }
          .custom-table .ant-table-body::-webkit-scrollbar-thumb:hover,
          .custom-table .ant-table-content::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }
        `}</style>

      {/* Single Unified Card: Filter Toolbar + Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-4 relative z-20">
        {/* Filters and Header area */}
        <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#2B3674] leading-tight">
              Quarterly Reviews
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setModeSelectModalOpen(true);
                  setSelectedAssignMode(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span className="text-base leading-none">+</span>
                Create
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Row 1: Search employee, All Roles, Financial Year, Quarters - equal 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <div className="w-full">
              <Input
                placeholder="Search employee name or ID..."
                prefix={<Search className="w-4 h-4 text-slate-400" />}
                value={searchQuery}
                onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
                className="!rounded-xl w-full"
                allowClear
              />
            </div>

            {!isManager ? (
              <div className="w-full relative">
                <Select
                  value={selectedRole === "ALL" ? undefined : selectedRole}
                  placeholder="All Roles"
                  prefix={<Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />}
                  onChange={(val) => setSelectedRole(val || "ALL")}
                  allowClear
                  className="!rounded-xl w-full"
                  getPopupContainer={(trigger) => trigger.parentElement!}
                >
                  <Option value="ALL">All Roles</Option>
                  <Option value="MANAGER">Managers</Option>
                  <Option value="EMPLOYEE">Employees</Option>
                </Select>
              </div>
            ) : (
              <div className="w-full" />
            )}

            <div className="w-full relative">
              <Select
                value={selectedYear === YEAR_FILTER_ALL ? undefined : selectedYear}
                placeholder="Financial Year"
                prefix={<Calendar className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(val) => setSelectedYear(val || YEAR_FILTER_ALL)}
                allowClear
                className="!rounded-xl w-full"
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

            <div className="w-full relative">
              <Select
                value={selectedQuarterCard === QuarterFilter.ALL ? undefined : selectedQuarterCard}
                placeholder="Quarters"
                prefix={<Clock className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(val) => setSelectedQuarterCard(val || QuarterFilter.ALL)}
                allowClear
                className="!rounded-xl w-full"
                getPopupContainer={(trigger) => trigger.parentElement!}
                optionLabelProp="label"
              >
                <Option value={QuarterFilter.ALL} label="All Quarters">All Quarters</Option>
                {filterQuarterOptions.map((opt) => (
                  <Option key={opt.code} value={opt.code} label={`${opt.code}  ${opt.shortDateRange}`}>
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="font-semibold text-slate-800 text-sm">{opt.code}</span>
                      <span className="text-slate-500 text-xs font-normal">{opt.shortDateRange}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Row 2: All Members, All Status, Clear button - equal 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full items-center">
            {/* All Members */}
            <div className="w-full relative">
              <Select
                value={selectedEmployee === "ALL" ? undefined : selectedEmployee}
                placeholder={employeeDropdownLabel}
                prefix={<Users className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(val) => setSelectedEmployee(val || "ALL")}
                allowClear
                loading={loadingTeamEmployees}
                className="!rounded-xl w-full"
                showSearch
                filterOption={(input, option) =>
                  String(option?.label || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={employeeFilterOptions}
                dropdownStyle={{ minWidth: 260 }}
                getPopupContainer={(trigger) => trigger.parentElement!}
              />
            </div>

            {/* All Status */}
            <div className="w-full relative">
              <Select
                value={selectedStatusTab === StatusTabFilter.ALL ? undefined : selectedStatusTab}
                placeholder="All Status"
                prefix={<ClipboardList className="w-4 h-4 text-indigo-500 shrink-0" />}
                onChange={(val) => setSelectedStatusTab(val || StatusTabFilter.ALL)}
                allowClear
                className="!rounded-xl w-full"
                getPopupContainer={(trigger) => trigger.parentElement!}
              >
                {STATUS_FILTER_ITEMS.map((item) => (
                  <Option key={item.key} value={item.key}>
                    {item.label}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Spacer col 3 */}
            <div className="hidden lg:block w-full" />

            {/* Clear button on far right in col 4 */}
            <div className="w-full flex justify-end">
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={handleClearFilters}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${hasActiveFilters
                    ? "text-slate-600 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 cursor-pointer"
                    : "text-slate-400 bg-slate-100/50 border border-slate-200/50 cursor-not-allowed opacity-50 shadow-none"
                  }`}
                title={hasActiveFilters ? "Reset all filters" : "No active filters"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table seamlessly integrated into the same card */}
        {loading && submissions.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <Spin size="large" tip="Loading team quarterly reviews..." />
          </div>
        ) : submissions.length > 0 ? (
          <Table
            columns={columns}
            dataSource={submissions}
            rowKey="id"
            loading={loading || accessRequestsLoading}
            tableLayout="fixed"
            scroll={{ x: 1650 }}
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
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${assignmentListType === "not_assigned"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignedSubTab === "all"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignedSubTab === "single_quarter"
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
        open={modeSelectModalOpen}
        onCancel={() => {
          setModeSelectModalOpen(false);
          setSelectedAssignMode(null);
        }}
        footer={null}
        centered
        width={420}
        title={
          <div className="flex items-center gap-2.5 pb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Plus className="w-4 h-4 text-indigo-600" />
            </div>

            <div>
              <h3 className="font-extrabold text-[#2B3674] text-base leading-snug">
                Create Review Assignment
              </h3>

              <p className="text-xs text-slate-400 font-normal">
                Choose how you want to assign the quarterly review
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3 pt-2">

          {/* Individual Member(s) */}
          <button
            type="button"
            onClick={() => setSelectedAssignMode("individual")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedAssignMode === "individual"
              ? "border-indigo-500 bg-indigo-50/40"
              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              }`}
          >
            {/* Radio - LEFT */}
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAssignMode === "individual"
                ? "border-indigo-600"
                : "border-slate-300"
                }`}
            >
              {selectedAssignMode === "individual" && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              )}
            </span>

            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedAssignMode === "individual"
                ? "bg-indigo-100"
                : "bg-indigo-100"
                }`}
            >
              <Users className="w-5 h-5 text-indigo-600" />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">
                Individual Member(s)
              </p>

              <p className="text-xs text-slate-500 mt-0.5">
                Select specific employees from your team
              </p>
            </div>
          </button>


          {/* All Members */}
          <button
            type="button"
            onClick={() => setSelectedAssignMode("all")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedAssignMode === "all"
              ? "border-emerald-500 bg-emerald-50/40"
              : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
              }`}
          >
            {/* Radio - LEFT */}
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAssignMode === "all"
                ? "border-emerald-600"
                : "border-slate-300"
                }`}
            >
              {selectedAssignMode === "all" && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              )}
            </span>

            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">
                All Members
              </p>

              <p className="text-xs text-slate-500 mt-0.5">
                Assign to your entire team at once
              </p>
            </div>
          </button>


          {/* Continue */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!selectedAssignMode}
              onClick={() => {
                if (!selectedAssignMode) return;

                setAssignMode(selectedAssignMode);

                setSelectedEmployeeIds([]);
                setAssignQuarterLabel("");
                setAssignFinancialYear("");
                setAssignStartDate("");
                setAssignEndDate("");
                setAssignNotes("");

                setModeSelectModalOpen(false);
                setAssignModalOpen(true);

                // Load fresh assignable employees and pending access requests
                setLoadingAssignableEmployees(true);
                loadAccessRequests();

                const queryMode = selectedAssignMode === "all" ? "all-members" : "individual";
                axios
                  .get("/api/quarterly-review/assignable-employees", {
                    params: { mode: queryMode },
                  })
                  .then((res) => {
                    if (
                      res.data?.success &&
                      Array.isArray(res.data.data)
                    ) {
                      setAssignableEmployees(
                        [...res.data.data].sort((a: any, b: any) =>
                          (a.employeeName || "").localeCompare(
                            b.employeeName || "",
                            undefined,
                            { sensitivity: "base" }
                          )
                        )
                      );
                    }
                  })
                  .catch(() => { })
                  .finally(() =>
                    setLoadingAssignableEmployees(false)
                  );
              }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${selectedAssignMode
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
            >
              Continue
            </button>
          </div>

        </div>
      </Modal>

      <Modal
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedAssignMode(null);
        }}
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
        maskClosable={false}
      >
        <div className="flex flex-col gap-4 pt-3">
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
                showSearch
                optionLabelProp="label"
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
                filterOption={(input, option: any) => {
                  if (!input) return true;
                  const query = input.toLowerCase().trim();
                  if (option?.label && String(option.label).toLowerCase().includes(query)) {
                    return true;
                  }
                  if (option?.value && String(option.value).toLowerCase().includes(query)) {
                    return true;
                  }
                  const emp = assignableEmployees.find(
                    (e: any) => String(e.employeeId).toLowerCase() === String(option?.value).toLowerCase()
                  );
                  if (emp) {
                    const text = `${emp.employeeName || ""} ${emp.employeeId || ""} ${emp.designation || ""}`.toLowerCase();
                    return text.includes(query);
                  }
                  return false;
                }}
              >
                {[...assignableEmployees]
                  .sort((a: any, b: any) =>
                    (a.employeeName || "").localeCompare(b.employeeName || "", undefined, {
                      sensitivity: "base",
                    })
                  )
                  .map((emp: any) => {
                    const empSubmissions = submissions.filter(
                      (s) => String(s.employeeId).toLowerCase() === String(emp.employeeId).toLowerCase()
                    );
                    const allQuarters = [
                      ...(emp.assignedQuarters || []),
                      ...empSubmissions.map((s) => s.quarterCode || s.quarter || ""),
                    ].filter(Boolean);
                    const assignedList = allQuarters
                      .map((q: string) => q.match(/Q[1-4]/i)?.[0]?.toUpperCase() || q.split(" ")[0])
                      .filter((v: string, i: number, a: string[]) => Boolean(v) && a.indexOf(v) === i);
                    const hasAssigned = assignedList.length > 0;
                    const assignedTag = hasAssigned ? assignedList.join(", ") : "";
                    const displayName = emp.employeeName && emp.employeeName !== emp.employeeId
                      ? `${emp.employeeName} (${emp.employeeId})`
                      : emp.employeeId;
                    return (
                      <Option key={emp.employeeId} value={emp.employeeId} label={displayName}>
                        <span className="font-medium text-slate-800">
                          {emp.employeeName} ({emp.employeeId})
                        </span>
                        {emp.designation ? (
                          <span className="text-slate-500 font-normal"> - {emp.designation}</span>
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
                  Review access will be opened for all eligible members for the chosen quarter and selected dates.
                </p>
              </div>
            </div>
          )}

          {/* Quarter selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Quarter <span className="text-red-500">*</span>
            </label>
            <Select
              value={assignQuarterLabel || undefined}
              onChange={(val) => setAssignQuarterLabel(val)}
              placeholder="Select quarter"
              className="w-full"
              size="large"
              optionLabelProp="label"
            >
              {assignQuarterOptions.map((opt) => {
                const status = getQuarterOptionStatus(opt.code);
                const fullLabel = `${opt.code}  ${opt.shortDateRange}`;
                return (
                  <Option key={opt.code} value={opt.code} label={fullLabel} disabled={status.disabled}>
                    <div className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2">
                        <span className={status.disabled ? "text-slate-400 font-semibold text-sm" : "text-slate-800 font-semibold text-sm"}>
                          {opt.code}
                        </span>
                        <span className={status.disabled ? "text-slate-400 text-xs font-normal" : "text-slate-500 text-xs font-normal"}>
                          {opt.shortDateRange}
                        </span>
                      </div>
                      {status.tag && (
                        <span className={`text-[11px] ml-2 ${status.tagClass}`}>
                          {status.tag}
                        </span>
                      )}
                    </div>
                  </Option>
                );
              })}
            </Select>
          </div>

          {/* Deadline date picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              To (Deadline) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={assignEndDate}
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                })()}
                onChange={(e) => setAssignEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
            {assignEndDate && (() => {
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const diffDays = Math.round((new Date(assignEndDate).getTime() - new Date(todayStr).getTime()) / 86400000);
              const days = Math.max(1, diffDays);
              const hours = days * 24;
              return (
                <div className="pt-1">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-[11px] font-bold text-indigo-700">
                    Duration: {days} {days === 1 ? 'Day' : 'Days'} ({hours} Hours) from today
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Description (mandatory) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Add instructions, focus areas, or deadline remarks for the employee(s)..."
              rows={3}
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
        onCancel={() => {
          setAccessRequestsOpen(false);
          setSelectedAccessRequest(null);
        }}
        footer={null}
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Key className="w-4 h-4 text-amber-600" />
            </div>
            <span className="font-extrabold text-[#2B3674]">
              {selectedAccessRequest ? "Review Access Request" : "Pending Access Requests"}
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
        ) : (() => {
          // Build display list: fall back to selectedAccessRequest if array hasn't loaded yet
          const filteredList = selectedAccessRequest
            ? accessRequests.filter(r => String(r.id) === String(selectedAccessRequest.id))
            : accessRequests;
          const displayList = filteredList.length === 0 && selectedAccessRequest
            ? [selectedAccessRequest]
            : filteredList;
          return displayList;
        })().length === 0 ? (
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
            {selectedAccessRequest && accessRequests.length > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                <span>
                  Showing request for <strong>{selectedAccessRequest.employeeName || selectedAccessRequest.employeeId}</strong> ({selectedAccessRequest.quarter})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAccessRequest(null)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline text-xs"
                >
                  View all ({accessRequests.length})
                </button>
              </div>
            )}
            {(() => {
              const filteredList = selectedAccessRequest
                ? accessRequests.filter(r => String(r.id) === String(selectedAccessRequest.id))
                : accessRequests;
              return filteredList.length === 0 && selectedAccessRequest
                ? [selectedAccessRequest]
                : filteredList;
            })().map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {req.employeeName || `Employee #${req.employeeId}`}
                      </p>
                      {req.userRole && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {req.userRole === 'MANAGER' ? 'Manager' : 'Employee'}
                        </span>
                      )}
                      {((req as any).attemptNumber > 1 || (req as any).attempt_number > 1) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Attempt {(req as any).attemptNumber || (req as any).attempt_number} of 2 (Re-request)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Quarter:{" "}
                      <span className="font-semibold text-slate-700">
                        {req.quarter}
                      </span>
                    </p>
                    {(req.reason || req.requestReason || (req as any).description) && (
                      <p className="text-xs text-slate-700 mt-1 italic bg-white/70 p-2 rounded-lg border border-amber-100">
                        "{req.reason || req.requestReason || (req as any).description}"
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
                      className="!bg-emerald-600 hover:!bg-emerald-700 !font-semibold !rounded-lg shadow-sm"
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

                {/* Approver remarks / comment textarea */}
                <div className="pt-2 border-t border-amber-200/60">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Approver Remarks / Comment: <span className="text-slate-400 font-normal">(Required if rejecting, sent via email & notification)</span>
                  </label>
                  <Input.TextArea
                    rows={2}
                    placeholder="Enter reason for rejection or approval remarks..."
                    value={actionComments[req.id] || ""}
                    onChange={(e) =>
                      setActionComments((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }))
                    }
                    className="!text-xs !rounded-lg !border-slate-300 focus:!border-indigo-500 !bg-white"
                  />
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
