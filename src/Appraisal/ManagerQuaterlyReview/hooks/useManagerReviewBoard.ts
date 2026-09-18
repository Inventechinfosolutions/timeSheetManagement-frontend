/**
 * useManagerReviewBoard
 *
 * Single source of truth for ALL business logic shared between Desktop (QuarterlyReview)
 * and Mobile/Tablet (QuarterlyReviewmobile) Manager Review Boards.
 *
 * What lives here:
 *  - Submissions & stats state
 *  - Server-driven pagination state (page, pageSize, totalCount)
 *  - Filter state (year, quarter, status, role, employee, search)
 *  - Data fetching (fetchData, loadFreshReview, loadAccessRequests)
 *  - Evaluation form state (ratings, finalRating, strengths, improvements, remarks, fieldErrors)
 *  - Rating score computation & status mapping
 *  - Evaluation submit & modal handlers
 *  - Access requests approval / rejection
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import axios from 'axios';
import { useAppSelector } from '../../../hooks';
import { UserType } from '../../../enums';
import type { ReviewAccessRequest } from '../../../reducers/quarterlyReview.reducer';
import {
  ManagerReviewItem,
  ReviewStats,
  AppraisalStatus,
  ManagerReviewStatus,
  PerformanceRating,
  QuarterFilter,
  StatusTabFilter,
  RatingCategory,
  RATING_CATEGORY_ITEMS,
  MIN_FIELD_LENGTH,
  DEFAULT_RATING_VALUE,
  YEAR_FILTER_ALL,
  DEFAULT_YEAR,
  FormMode,
  AccessRequestStatus,
  AccessRequestAction,
  AssignmentListType,
  AssignedSubTab,
  ReviewStatus,
  FilterOption,
} from '../QuarterlyReview.types';

// ── Defined Constants (No Hard-Coded Values) ───────────────────────────────────

export const DEFAULT_BOARD_PAGE_SIZE = 10;
export const INITIAL_PAGE_NUMBER = 1;
export const TOTAL_RATING_CATEGORIES_COUNT = 6;

const SCORE_THRESHOLD_OUTSTANDING = 5.0;
const SCORE_THRESHOLD_EXCEEDS_EXPECTATIONS = 4.0;
const SCORE_THRESHOLD_MEETS_EXPECTATIONS = 3.0;
const SCORE_THRESHOLD_NEEDS_IMPROVEMENT = 2.0;
const SCORE_THRESHOLD_UNSATISFACTORY = 0.0;

const ROUTE_MANAGER_DASHBOARD_REVIEW = '/manager-dashboard/quarterly-review';
const ROUTE_ADMIN_DASHBOARD_REVIEW = '/admin-dashboard/quarterly-review';

const API_MANAGER_QUARTERLY_REVIEW_URL = '/api/manager-quarterly-review';
const API_MANAGER_STATS_URL = '/api/manager-quarterly-review/stats';
const API_MANAGER_FILTERS_URL = '/api/manager-quarterly-review/filters';
const API_MANAGER_EMPLOYEES_URL = '/api/manager-quarterly-review/employees';
const API_ASSIGNABLE_EMPLOYEES_URL = '/api/quarterly-review/assignable-employees';
const API_REVIEW_ACCESS_REQUESTS_URL = '/api/quarterly-review/access-requests';

export type RatingValuesMap = Record<string, number>;

export interface TeamEmployeeOption {
  employeeId: string;
  employeeName: string;
  designation?: string;
}

export interface UseManagerReviewBoardOptions {
  syncUrlParams?: boolean;
  initialPageSize?: number;
}

export const useManagerReviewBoard = (options: UseManagerReviewBoardOptions = {}) => {
  const { syncUrlParams = true, initialPageSize = DEFAULT_BOARD_PAGE_SIZE } = options;

  const { employeeId: employeeIdFromUrl, quarterPeriod: quarterPeriodFromUrl } = useParams<{
    employeeId?: string;
    quarterPeriod?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isManagerRoute = location.pathname.startsWith('/manager-dashboard');
  const { currentUser } = useAppSelector((state) => state.user);

  const isManagerUser =
    isManagerRoute ||
    currentUser?.userType === UserType.MANAGER ||
    Boolean(currentUser?.role && currentUser.role.toUpperCase().includes(UserType.MANAGER));

  const isAdminOrCEOUser =
    currentUser?.userType === UserType.ADMIN ||
    currentUser?.userType === UserType.CEO ||
    Boolean(
      currentUser?.role &&
      (currentUser.role.toUpperCase().includes(UserType.ADMIN) ||
        currentUser.role.toUpperCase().includes(UserType.CEO))
    );

  const baseRoute = isManagerRoute ? ROUTE_MANAGER_DASHBOARD_REVIEW : ROUTE_ADMIN_DASHBOARD_REVIEW;
  const employeeDropdownLabel = 'All Members';

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRole(FilterOption.ALL);
    setSelectedYear(YEAR_FILTER_ALL);
    setSelectedQuarterCard(QuarterFilter.ALL);
    setSelectedEmployee(FilterOption.ALL);
    setSelectedStatusTab(StatusTabFilter.ALL);
    setCurrentPage(INITIAL_PAGE_NUMBER);
  }, []);

  // ── URL Search Parameters ──────────────────────────────────────────────────
  const urlStatusParameter = searchParams.get('status') || searchParams.get('reviewStatus');
  const urlQuarterParameter = searchParams.get('quarter') || searchParams.get('q');
  const urlFinancialYearParameter =
    searchParams.get('financialYear') || searchParams.get('year') || searchParams.get('fy');
  const urlRoleParameter = searchParams.get('role');
  const urlEmployeeParameter = searchParams.get('employeeId') || searchParams.get('employee');
  const urlSearchText = searchParams.get('search') || '';

  const resolvedInitialStatusTab = useMemo((): StatusTabFilter => {
    if (!urlStatusParameter) return StatusTabFilter.ALL;
    const normalizedStatus = urlStatusParameter.trim().toLowerCase().replace(/[\s_-]/g, '');

    const assignedKey = StatusTabFilter.ASSIGNED.toLowerCase().replace(/[\s_-]/g, '');
    const awaitingReviewKey = StatusTabFilter.AWAITING_REVIEW.toLowerCase().replace(/[\s_-]/g, '');
    const underReviewKey = StatusTabFilter.UNDER_REVIEW.toLowerCase().replace(/[\s_-]/g, '');
    const reviewedKey = StatusTabFilter.REVIEWED.toLowerCase().replace(/[\s_-]/g, '');
    const submittedKey = ReviewStatus.SUBMITTED.toLowerCase().replace(/[\s_-]/g, '');

    if (normalizedStatus === assignedKey) {
      return StatusTabFilter.ASSIGNED;
    }
    if (
      normalizedStatus === awaitingReviewKey ||
      normalizedStatus === submittedKey
    ) {
      return StatusTabFilter.AWAITING_REVIEW;
    }
    if (normalizedStatus === underReviewKey) {
      return StatusTabFilter.UNDER_REVIEW;
    }
    if (normalizedStatus === reviewedKey) {
      return StatusTabFilter.REVIEWED;
    }
    return StatusTabFilter.ALL;
  }, [urlStatusParameter]);

  // ── Filter State ──────────────────────────────────────────────────────────
  const [selectedQuarterCard, setSelectedQuarterCard] = useState<string>(
    urlQuarterParameter &&
    [QuarterFilter.Q1, QuarterFilter.Q2, QuarterFilter.Q3, QuarterFilter.Q4].includes(urlQuarterParameter.toUpperCase() as QuarterFilter)
      ? urlQuarterParameter.toUpperCase()
      : QuarterFilter.ALL
  );
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>(resolvedInitialStatusTab);
  const [selectedRole, setSelectedRole] = useState<string>(FilterOption.ALL);
  const [selectedEmployee, setSelectedEmployee] = useState<string>(urlEmployeeParameter || FilterOption.ALL);
  const [searchQuery, setSearchQuery] = useState<string>(urlSearchText);
  const [selectedYear, setSelectedYear] = useState<string>(urlFinancialYearParameter || YEAR_FILTER_ALL);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() ||
      (selectedRole && selectedRole !== FilterOption.ALL) ||
      (selectedYear && selectedYear !== YEAR_FILTER_ALL) ||
      (selectedQuarterCard && selectedQuarterCard !== QuarterFilter.ALL) ||
      (selectedEmployee && selectedEmployee !== FilterOption.ALL) ||
      (selectedStatusTab && selectedStatusTab !== StatusTabFilter.ALL)
    );
  }, [searchQuery, selectedRole, selectedYear, selectedQuarterCard, selectedEmployee, selectedStatusTab]);

  // ── Data State ────────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState<ManagerReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalTeamMembers: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    inReview: 0,
    completed: 0,
    assignmentSummary: {},
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [quarterOptions, setQuarterOptions] = useState<string[]>([]);
  const [teamEmployees, setTeamEmployees] = useState<TeamEmployeeOption[]>([]);
  const [loadingTeamEmployees, setLoadingTeamEmployees] = useState<boolean>(false);

  // ── Server-Driven Pagination ──────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(INITIAL_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [totalCount, setTotalCount] = useState<number>(0);

  // ── Evaluation Modal State ────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentReview, setCurrentReview] = useState<ManagerReviewItem | null>(null);
  const [isViewOnly, setIsViewOnly] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ratings, setRatings] = useState<RatingValuesMap>({
    [RatingCategory.PRODUCTIVITY]: DEFAULT_RATING_VALUE,
    [RatingCategory.QUALITY]: DEFAULT_RATING_VALUE,
    [RatingCategory.OWNERSHIP]: DEFAULT_RATING_VALUE,
    [RatingCategory.COMMUNICATION]: DEFAULT_RATING_VALUE,
    [RatingCategory.COLLABORATION]: DEFAULT_RATING_VALUE,
    [RatingCategory.INNOVATION]: DEFAULT_RATING_VALUE,
  });
  const [finalRating, setFinalRating] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [improvements, setImprovements] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{
    strengths?: string;
    improvements?: string;
    remarks?: string;
    ratings?: string;
  }>({});

  const loadedEmployeeIdRef = useRef<string | null>(null);

  // ── Access Requests State ─────────────────────────────────────────────────
  const [accessRequests, setAccessRequests] = useState<ReviewAccessRequest[]>([]);
  const [accessRequestsLoading, setAccessRequestsLoading] = useState(false);
  const [actioningRequestId, setActioningRequestId] = useState<string | number | null>(null);

  // ── Assignment Summary Modal State ─────────────────────────────────────────
  const [assignmentListModalOpen, setAssignmentListModalOpen] = useState<boolean>(false);
  const [assignmentListType, setAssignmentListType] = useState<AssignmentListType>(AssignmentListType.ASSIGNED);
  const [assignmentListSearch, setAssignmentListSearch] = useState<string>('');
  const [assignedSubTab, setAssignedSubTab] = useState<AssignedSubTab>(AssignedSubTab.ALL);

  const openAssignmentListModal = useCallback((type: AssignmentListType) => {
    setAssignmentListType(type);
    setAssignmentListSearch('');
    setAssignedSubTab(AssignedSubTab.ALL);
    setAssignmentListModalOpen(true);
  }, []);

  // ── URL Synchronization ───────────────────────────────────────────────────
  useEffect(() => {
    if (!syncUrlParams) return;
    setSearchParams((previousSearchParams) => {
      const nextSearchParams = new URLSearchParams(previousSearchParams);
      if (selectedYear && selectedYear !== YEAR_FILTER_ALL) {
        nextSearchParams.set('year', selectedYear);
      } else {
        nextSearchParams.delete('year');
      }

      if (selectedQuarterCard && selectedQuarterCard !== QuarterFilter.ALL) {
        nextSearchParams.set('quarter', selectedQuarterCard);
      } else {
        nextSearchParams.delete('quarter');
      }

      if (selectedStatusTab && selectedStatusTab !== StatusTabFilter.ALL) {
        nextSearchParams.set('status', selectedStatusTab.toLowerCase());
      } else {
        nextSearchParams.delete('status');
      }

      if (selectedEmployee && selectedEmployee !== FilterOption.ALL) {
        nextSearchParams.set('employeeId', selectedEmployee);
      } else {
        nextSearchParams.delete('employeeId');
      }

      if (searchQuery.trim()) {
        nextSearchParams.set('search', searchQuery.trim());
      } else {
        nextSearchParams.delete('search');
      }

      return nextSearchParams;
    }, { replace: true });
  }, [selectedYear, selectedQuarterCard, selectedStatusTab, selectedEmployee, searchQuery, setSearchParams, syncUrlParams]);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(
    async (targetPageNumber: number = currentPage, targetPageSize: number = pageSize) => {
      try {
        setLoading(true);
        setAccessRequestsLoading(true);

        const requestParameters: Record<string, any> = {
          page: targetPageNumber,
          pageSize: targetPageSize,
        };
        if (selectedQuarterCard !== QuarterFilter.ALL) {
          requestParameters.quarterCard = selectedQuarterCard;
        }
        if (selectedYear !== YEAR_FILTER_ALL) {
          requestParameters.year = selectedYear;
        }
        if (selectedStatusTab !== StatusTabFilter.ALL) {
          requestParameters.status = selectedStatusTab;
        }
        if (!isManagerUser && selectedRole !== FilterOption.ALL) {
          requestParameters.role = selectedRole;
        }
        if (selectedEmployee && selectedEmployee !== FilterOption.ALL) {
          requestParameters.employeeId = selectedEmployee;
        }
        if (searchQuery.trim()) {
          requestParameters.search = searchQuery.trim();
        }

        const statsParameters: Record<string, any> = {};
        if (selectedQuarterCard !== QuarterFilter.ALL) {
          statsParameters.quarter = selectedQuarterCard;
        }
        if (selectedYear !== YEAR_FILTER_ALL) {
          statsParameters.financialYear = selectedYear;
        }

        const [submissionsResponse, statsResponse, accessResponse] = await Promise.all([
          axios.get(API_MANAGER_QUARTERLY_REVIEW_URL, { params: requestParameters }),
          axios.get(API_MANAGER_STATS_URL, { params: statsParameters }),
          axios.get(API_REVIEW_ACCESS_REQUESTS_URL, { params: { status: AccessRequestStatus.PENDING.toLowerCase() } }).catch(() => null),
        ]);

        if (submissionsResponse.data?.success) {
          setSubmissions(submissionsResponse.data.data || []);
          setTotalCount(submissionsResponse.data.total ?? 0);
        }
        if (statsResponse.data?.success) {
          setStats(statsResponse.data.data);
        }
        if (accessResponse?.data?.success && Array.isArray(accessResponse.data.data)) {
          setAccessRequests(accessResponse.data.data);
        }
      } catch (fetchError: any) {
        message.error(
          fetchError.response?.data?.message || 'Failed to fetch quarterly review submissions.'
        );
      } finally {
        setLoading(false);
        setAccessRequestsLoading(false);
      }
    },
    [
      currentPage,
      pageSize,
      selectedQuarterCard,
      selectedYear,
      selectedStatusTab,
      isManagerUser,
      selectedRole,
      selectedEmployee,
      searchQuery,
    ]
  );

  const loadAccessRequests = useCallback(async () => {
    try {
      setAccessRequestsLoading(true);
      const response = await axios.get(API_REVIEW_ACCESS_REQUESTS_URL, {
        params: { status: AccessRequestStatus.PENDING.toLowerCase() },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setAccessRequests(response.data.data);
      }
    } catch {
      // Non-blocking
    } finally {
      setAccessRequestsLoading(false);
    }
  }, []);

  const handleActionAccessRequest = useCallback(
    async (
      requestId: string | number,
      action: AccessRequestAction,
      comment: string = '',
      extensionHours: number = 48,
    ): Promise<boolean> => {
      const isReject = action === AccessRequestAction.REJECT;
      const isApprove = action === AccessRequestAction.APPROVE;

      const trimmedComment = comment.trim();
      if (isReject && !trimmedComment) {
        message.warning('Please enter a comment/reason before rejecting the access request.');
        return false;
      }

      if (actioningRequestId !== null) return false;

      try {
        setActioningRequestId(requestId);
        const response = await axios.post(
          `/api/quarterly-review/access-requests/${requestId}/action`,
          {
            action,
            remarks: trimmedComment,
            extensionHours,
          },
        );

        if (response.data?.success) {
          message.success(
            isApprove
              ? 'Access request approved. The review edit option has been reopened.'
              : 'Access request rejected.',
          );
          await loadAccessRequests();
          await fetchData(currentPage, pageSize);
          return true;
        } else {
          message.error(response.data?.message || 'Action failed.');
          return false;
        }
      } catch (err: any) {
        message.error(err.response?.data?.message || err.message || 'Action failed.');
        return false;
      } finally {
        setActioningRequestId(null);
      }
    },
    [actioningRequestId, loadAccessRequests, fetchData, currentPage, pageSize]
  );

  // Initial load
  useEffect(() => {
    fetchData(INITIAL_PAGE_NUMBER, pageSize);
    loadAccessRequests();
  }, []);

  // Re-fetch data on page 1 whenever any filter changes (debounced to avoid spamming on keystrokes)
  const isInitialFilterMountRef = useRef(true);
  useEffect(() => {
    if (isInitialFilterMountRef.current) {
      isInitialFilterMountRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setCurrentPage(INITIAL_PAGE_NUMBER);
      fetchData(INITIAL_PAGE_NUMBER, pageSize);
    }, 250);

    return () => clearTimeout(timer);
  }, [
    selectedYear,
    selectedQuarterCard,
    selectedStatusTab,
    selectedRole,
    selectedEmployee,
    searchQuery,
  ]);

  // Fetch filter dropdown options
  useEffect(() => {
    axios
      .get(API_MANAGER_FILTERS_URL)
      .then((response) => {
        if (response.data?.success) {
          setQuarterOptions(response.data.data?.quarters || []);
        }
      })
      .catch(() => { });

    setLoadingTeamEmployees(true);
    axios
      .get(API_MANAGER_EMPLOYEES_URL)
      .then((response) => {
        if (response.data?.success && Array.isArray(response.data.data)) {
          setTeamEmployees(response.data.data);
        }
      })
      .catch(() => {
        axios
          .get(API_ASSIGNABLE_EMPLOYEES_URL)
          .then((fallbackResponse) => {
            if (fallbackResponse.data?.success && Array.isArray(fallbackResponse.data.data)) {
              setTeamEmployees(fallbackResponse.data.data);
            }
          })
          .catch(() => { });
      })
      .finally(() => {
        setLoadingTeamEmployees(false);
      });
  }, []);

  // ── Rating Score Calculations ─────────────────────────────────────────────

  const averageRatingScore = useMemo(() => {
    const ratingValuesList = Object.values(ratings);
    if (ratingValuesList.length === 0) return 0;
    const accumulatedTotal = ratingValuesList.reduce(
      (runningTotal, currentRatingValue) => runningTotal + currentRatingValue,
      0
    );
    return (accumulatedTotal / ratingValuesList.length).toFixed(1);
  }, [ratings]);

  const getFinalRatingFromScore = useCallback((computedAverageScore: number): string => {
    if (computedAverageScore >= SCORE_THRESHOLD_OUTSTANDING) return PerformanceRating.OUTSTANDING;
    if (computedAverageScore >= SCORE_THRESHOLD_EXCEEDS_EXPECTATIONS) return PerformanceRating.EXCEEDS_EXPECTATIONS;
    if (computedAverageScore >= SCORE_THRESHOLD_MEETS_EXPECTATIONS) return PerformanceRating.MEETS_EXPECTATIONS;
    if (computedAverageScore >= SCORE_THRESHOLD_NEEDS_IMPROVEMENT) return PerformanceRating.NEEDS_IMPROVEMENT;
    if (computedAverageScore > SCORE_THRESHOLD_UNSATISFACTORY) return PerformanceRating.UNSATISFACTORY;
    return '';
  }, []);

  useEffect(() => {
    if (isViewOnly) return;
    const parsedAverage = parseFloat(averageRatingScore as unknown as string);
    if (!isNaN(parsedAverage)) {
      setFinalRating(getFinalRatingFromScore(parsedAverage));
    }
  }, [averageRatingScore, isViewOnly, getFinalRatingFromScore]);

  // ── Form Population ───────────────────────────────────────────────────────

  const applyReviewToForm = useCallback((reviewRecord: ManagerReviewItem) => {
    const resolvedRatings: RatingValuesMap = reviewRecord.ratings
      ? {
        [RatingCategory.PRODUCTIVITY]: reviewRecord.ratings.productivity || DEFAULT_RATING_VALUE,
        [RatingCategory.QUALITY]: reviewRecord.ratings.quality || DEFAULT_RATING_VALUE,
        [RatingCategory.OWNERSHIP]: reviewRecord.ratings.ownership || DEFAULT_RATING_VALUE,
        [RatingCategory.COMMUNICATION]: reviewRecord.ratings.communication || DEFAULT_RATING_VALUE,
        [RatingCategory.COLLABORATION]: reviewRecord.ratings.collaboration || DEFAULT_RATING_VALUE,
        [RatingCategory.INNOVATION]: reviewRecord.ratings.innovation || DEFAULT_RATING_VALUE,
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

    const ratingValuesList = Object.values(resolvedRatings);
    const calculatedAverage = ratingValuesList.length
      ? ratingValuesList.reduce((runningSum, ratingItem) => runningSum + ratingItem, 0) / ratingValuesList.length
      : 0;

    setFinalRating(
      calculatedAverage > 0
        ? getFinalRatingFromScore(calculatedAverage)
        : reviewRecord.finalRating
          ? getFinalRatingFromScore(reviewRecord.finalRating)
          : ''
    );

    setStrengths(reviewRecord.strengths || '');
    setImprovements(reviewRecord.improvements || '');
    setRemarks(reviewRecord.remarks || '');
  }, [getFinalRatingFromScore]);

  const formatQuarterHyphen = (quarterIdentifier?: string | null): string => {
    if (!quarterIdentifier) return '';
    return quarterIdentifier.trim().replace(/^([Qq][1-4])[\s_]+(FY\d{4}-\d{2})/i, '$1-$2');
  };

  const getRecordQuarterUrl = useCallback((reviewRecord: ManagerReviewItem): string => {
    const rawQ = reviewRecord.quarterCode || reviewRecord.quarter || reviewRecord.fullQuarter || '';
    const qMatch = String(rawQ).match(/Q[1-4]/i);
    const qCode = qMatch ? qMatch[0].toUpperCase() : '';

    let fy = '';
    const rawFy = reviewRecord.financialYear || reviewRecord.fullQuarter || reviewRecord.quarter || '';
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
    return formatQuarterHyphen(reviewRecord.fullQuarter || reviewRecord.quarter || '');
  }, []);

  const loadFreshReview = useCallback(
    async (employeeId: string, quarterIdentifier?: string, preferredViewOnly?: boolean) => {
      try {
        const formattedQuarterString = formatQuarterHyphen(quarterIdentifier);
        const reviewDetailsUrl = formattedQuarterString
          ? `${API_MANAGER_QUARTERLY_REVIEW_URL}/${employeeId}?quarter=${encodeURIComponent(formattedQuarterString)}`
          : `${API_MANAGER_QUARTERLY_REVIEW_URL}/${employeeId}`;
        const response = await axios.get(reviewDetailsUrl);
        if (response.data?.success && response.data?.data) {
          const freshReviewRecord: ManagerReviewItem = response.data.data;
          setCurrentReview(freshReviewRecord);
          applyReviewToForm(freshReviewRecord);

          const isUnderReviewStatus =
            freshReviewRecord.status === ManagerReviewStatus.UNDER_REVIEW ||
            freshReviewRecord.reviewStatus === ManagerReviewStatus.UNDER_REVIEW;
          const isEvaluatedStatus =
            !isUnderReviewStatus &&
            (freshReviewRecord.status === ManagerReviewStatus.REVIEWED ||
              freshReviewRecord.reviewStatus === ManagerReviewStatus.REVIEWED ||
              Boolean(freshReviewRecord.reviewedOn));

          const currentUrlParams = new URLSearchParams(location.search);
          const modeParam = currentUrlParams.get('mode');
          const isExplicitView =
            preferredViewOnly === true ||
            modeParam === FormMode.VIEW ||
            (modeParam !== FormMode.EDIT && location.state?.viewOnly === true);
          const isExplicitEdit =
            preferredViewOnly === false ||
            modeParam === FormMode.EDIT ||
            (modeParam !== FormMode.VIEW && location.state?.viewOnly === false);

          if (isExplicitEdit) {
            setIsViewOnly(false);
          } else if (isExplicitView) {
            setIsViewOnly(true);
          } else {
            setIsViewOnly(isEvaluatedStatus);
          }
        }
      } catch (loadError: any) {
        message.error(
          loadError.response?.data?.message || 'Failed to load the latest details for this review.'
        );
      }
    },
    [location.search, location.state, applyReviewToForm]
  );

  const handleOpenEvaluation = (reviewRecord: ManagerReviewItem, viewOnlyMode: boolean = false) => {
    setCurrentReview(reviewRecord);
    setIsViewOnly(viewOnlyMode);
    setFieldErrors({});
    applyReviewToForm(reviewRecord);
    setIsModalOpen(true);

    const formattedQuarterName = getRecordQuarterUrl(reviewRecord);
    const modeQueryString = `mode=${viewOnlyMode ? FormMode.VIEW : FormMode.EDIT}`;
    const uniqueUrlKey = `${reviewRecord.employeeId}_${formattedQuarterName}`;

    loadedEmployeeIdRef.current = uniqueUrlKey;
    loadFreshReview(reviewRecord.employeeId, formattedQuarterName, viewOnlyMode);
    const targetUrl = formattedQuarterName
      ? `${baseRoute}/${reviewRecord.employeeId}/${encodeURIComponent(formattedQuarterName)}?${modeQueryString}`
      : `${baseRoute}/${reviewRecord.employeeId}?${modeQueryString}`;
    navigate(targetUrl, {
      state: { viewOnly: viewOnlyMode, record: reviewRecord },
      replace: false,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentReview(null);
    loadedEmployeeIdRef.current = null;
    setCurrentPage(INITIAL_PAGE_NUMBER);
    navigate(baseRoute, { replace: false });
    fetchData(INITIAL_PAGE_NUMBER, pageSize);
  };

  // Synchronize route URL changes for modal opening
  useEffect(() => {
    if (!employeeIdFromUrl) {
      setIsModalOpen(false);
      setCurrentReview(null);
      loadedEmployeeIdRef.current = null;
      return;
    }

    const currentUrlParams = new URLSearchParams(location.search);
    const rawQuarter = quarterPeriodFromUrl || currentUrlParams.get('quarter') || undefined;
    const resolvedQuarter = formatQuarterHyphen(rawQuarter) || undefined;
    const modeParam = currentUrlParams.get('mode');
    const isExplicitView = modeParam === FormMode.VIEW || (modeParam !== FormMode.EDIT && location.state?.viewOnly === true);
    const isExplicitEdit = modeParam === FormMode.EDIT || (modeParam !== FormMode.VIEW && location.state?.viewOnly === false);
    const uniqueUrlKey = `${employeeIdFromUrl}_${resolvedQuarter || ''}`;

    if (loadedEmployeeIdRef.current === uniqueUrlKey && currentReview) return;
    loadedEmployeeIdRef.current = uniqueUrlKey;

    if (
      location.state?.record &&
      location.state.record.employeeId === employeeIdFromUrl
    ) {
      const activeStateRecord = location.state.record;
      setCurrentReview(activeStateRecord);
      const isUnderReview =
        activeStateRecord.status === ManagerReviewStatus.UNDER_REVIEW ||
        activeStateRecord.reviewStatus === ManagerReviewStatus.UNDER_REVIEW;
      const isEvaluated =
        !isUnderReview &&
        (activeStateRecord.status === ManagerReviewStatus.REVIEWED ||
          activeStateRecord.reviewStatus === ManagerReviewStatus.REVIEWED ||
          Boolean(activeStateRecord.reviewedOn));

      setIsViewOnly(isExplicitEdit ? false : (isExplicitView ? true : isEvaluated));
      setFieldErrors({});
      applyReviewToForm(activeStateRecord);
      setIsModalOpen(true);
      loadFreshReview(
        employeeIdFromUrl,
        resolvedQuarter || getRecordQuarterUrl(activeStateRecord),
        isExplicitView ? true : (isExplicitEdit ? false : undefined)
      );
      return;
    }

    const matchedSubmissionRecord = submissions.find(
      (submissionItem) =>
        submissionItem.employeeId === employeeIdFromUrl &&
        (!resolvedQuarter ||
          getRecordQuarterUrl(submissionItem) === resolvedQuarter ||
          formatQuarterHyphen(submissionItem.quarter) === resolvedQuarter ||
          formatQuarterHyphen(submissionItem.fullQuarter) === resolvedQuarter ||
          (submissionItem.quarterCode && resolvedQuarter.startsWith(submissionItem.quarterCode)) ||
          (submissionItem.quarter && resolvedQuarter.startsWith(submissionItem.quarter.trim().split(/\s+/)[0])))
    );

    if (matchedSubmissionRecord) {
      setCurrentReview(matchedSubmissionRecord);
      const isUnderReview =
        matchedSubmissionRecord.status === ManagerReviewStatus.UNDER_REVIEW ||
        matchedSubmissionRecord.reviewStatus === ManagerReviewStatus.UNDER_REVIEW;
      const isEvaluated =
        !isUnderReview &&
        (matchedSubmissionRecord.status === ManagerReviewStatus.REVIEWED ||
          matchedSubmissionRecord.reviewStatus === ManagerReviewStatus.REVIEWED ||
          Boolean(matchedSubmissionRecord.reviewedOn));

      setIsViewOnly(isExplicitEdit ? false : (isExplicitView ? true : isEvaluated));
      setFieldErrors({});
      applyReviewToForm(matchedSubmissionRecord);
      setIsModalOpen(true);
      loadFreshReview(
        employeeIdFromUrl,
        resolvedQuarter || getRecordQuarterUrl(matchedSubmissionRecord),
        isExplicitView ? true : (isExplicitEdit ? false : undefined)
      );
    } else {
      setIsViewOnly(isExplicitEdit ? false : true);
      setIsModalOpen(true);
      loadFreshReview(
        employeeIdFromUrl,
        resolvedQuarter,
        isExplicitView ? true : (isExplicitEdit ? false : undefined)
      );
    }
  }, [employeeIdFromUrl, quarterPeriodFromUrl, location.search, location.state, submissions, currentReview, getRecordQuarterUrl, loadFreshReview, applyReviewToForm]);

  // ── Validation & Submission ───────────────────────────────────────────────

  const validateTextFields = (): boolean => {
    const textErrors: {
      strengths?: string;
      improvements?: string;
      remarks?: string;
      ratings?: string;
    } = {};

    const missingRatings = RATING_CATEGORY_ITEMS.filter(
      (item) => !ratings[item.key] || ratings[item.key] <= 0
    );
    if (missingRatings.length > 0) {
      textErrors.ratings = 'Please provide ratings for all performance categories.';
    }

    if (strengths.trim().length < MIN_FIELD_LENGTH) {
      textErrors.strengths = `Please enter at least ${MIN_FIELD_LENGTH} character.`;
    }
    if (improvements.trim().length < MIN_FIELD_LENGTH) {
      textErrors.improvements = `Please enter at least ${MIN_FIELD_LENGTH} character.`;
    }
    if (remarks.trim().length < MIN_FIELD_LENGTH) {
      textErrors.remarks = `Please enter at least ${MIN_FIELD_LENGTH} character.`;
    }

    setFieldErrors(textErrors);
    return Object.keys(textErrors).length === 0;
  };

  const handleSubmitEvaluation = async (isEvaluationDraft: boolean) => {
    if (!currentReview) return;

    if (!isEvaluationDraft && !validateTextFields()) {
      message.error('Please provide all ratings and complete all feedback fields before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const submissionEndpoint = isEvaluationDraft
        ? `${API_MANAGER_QUARTERLY_REVIEW_URL}/${currentReview.id}/draft`
        : `${API_MANAGER_QUARTERLY_REVIEW_URL}/${currentReview.id}/review`;

      const evaluationPayload = {
        ratings,
        finalRating,
        strengths,
        improvements,
        remarks,
        reviewStatus: isEvaluationDraft
          ? ManagerReviewStatus.UNDER_REVIEW
          : ManagerReviewStatus.REVIEWED,
      };

      const response = await axios.post(submissionEndpoint, evaluationPayload);

      if (response.data?.success) {
        message.success(
          isEvaluationDraft
            ? 'Evaluation draft saved.'
            : 'Review evaluation submitted successfully!'
        );
        setIsModalOpen(false);
        setCurrentReview(null);
        loadedEmployeeIdRef.current = null;
        setCurrentPage(INITIAL_PAGE_NUMBER);
        navigate(baseRoute, { replace: false });
        fetchData(INITIAL_PAGE_NUMBER, pageSize);
      }
    } catch (submissionError: any) {
      message.error(
        submissionError.response?.data?.message || 'Failed to submit review evaluation.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // Role information
    isManager: isManagerUser,
    isAdminOrCEO: isAdminOrCEOUser,
    baseRoute,
    // Submissions and stats
    submissions,
    stats,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    fetchData,
    // Filter controls
    selectedQuarterCard,
    setSelectedQuarterCard,
    selectedStatusTab,
    setSelectedStatusTab,
    selectedRole,
    setSelectedRole,
    selectedEmployee,
    setSelectedEmployee,
    searchQuery,
    setSearchQuery,
    selectedYear,
    setSelectedYear,
    quarterOptions,
    teamEmployees,
    loadingTeamEmployees,
    employeeDropdownLabel,
    handleClearFilters,
    hasActiveFilters,
    // Evaluation modal state and fields
    isModalOpen,
    setIsModalOpen,
    currentReview,
    setCurrentReview,
    isViewOnly,
    setIsViewOnly,
    submitting,
    ratings,
    setRatings,
    finalRating,
    setFinalRating,
    strengths,
    setStrengths,
    improvements,
    setImprovements,
    remarks,
    setRemarks,
    fieldErrors,
    setFieldErrors,
    averageRatingScore,
    getFinalRatingFromScore,
    // Modal actions
    applyReviewToForm,
    handleOpenEvaluation,
    loadFreshReview,
    handleCloseModal,
    validateTextFields,
    handleSubmitEvaluation,
    // Access requests
    accessRequests,
    accessRequestsLoading,
    actioningRequestId,
    setActioningRequestId,
    loadAccessRequests,
    handleActionAccessRequest,
    // Assignment Summary modal state
    assignmentListModalOpen,
    setAssignmentListModalOpen,
    assignmentListType,
    setAssignmentListType,
    assignmentListSearch,
    setAssignmentListSearch,
    assignedSubTab,
    setAssignedSubTab,
    openAssignmentListModal,
    formatQuarterHyphen,
    getRecordQuarterUrl,
  };
};
