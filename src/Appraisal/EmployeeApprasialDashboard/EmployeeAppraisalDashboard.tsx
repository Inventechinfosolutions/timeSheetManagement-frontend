import { HiddenRatingBadge } from '../components/HiddenRatingBadge';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Table, Spin, message, Tooltip, Select, Modal } from 'antd';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Edit3, Eye, Calendar, Star, ClipboardList,
  BarChart3, Download, Trash2, FileCheck2, AlertTriangle,
  Clock, Key, Send, ShieldAlert, Award, ArrowRight,
} from 'lucide-react';
import { ReviewStatus, AppraisalReviewStatus, REVIEW_STATUS_FILTER_OPTIONS } from './enums/Appraisal.enums';
import { QuarterlyReview, StatusStyle } from './types/Appraisal.types';
import EmptyReviewImage from '../../assets/EmptyReviewImage.png';
import {
  formatQuarterRange,
  formatQuarterEndDate,
  getFinancialYear,
  isQuarterOver,
  convertQuarterNameToUrlSlug,
  quarterToSlug,
} from './utils/fyQuarter.utils';
import {
  getCurrentAcademicYear,
  getMasterFinancialYears,
  formatQuarterWithDateRange,
  computeQuarterDropdownOptions,
  QuarterDropdownOption,
} from '../../master/financialYear.master';
import type { AppDispatch, RootState } from '../../store';
import {
  getCurrentQuarter,
  getAllReviews,
  withdrawQuarterlyReview,
  downloadQuarterlyReviewPdf,
  requestReviewAccess,
  startEditQuarterlyReview,
  QuarterlyReviewSummary,
} from '../../reducers/quarterlyReview.reducer';
import MobileEmployeeAppraisalDashboard from './MobileEmployeeAppraisalDashboard/MobileEmployeeAppraisalDashboard';
import {
  StatusBadge,
  getReviewDisplayStatus,
  getDisplayAverageRating,
  getDeadlineCountdown,
  getAccessRequestCountdown,
  STATUS_STYLES,
  DEFAULT_STATUS_STYLE,
  RATING_LABEL_TO_SCORE,
  StatCard,
} from './utils/appraisalHelpers';

export {
  StatusBadge,
  getReviewDisplayStatus,
  getDisplayAverageRating,
  getDeadlineCountdown,
  getAccessRequestCountdown,
};

const formatDeadlineDate = (deadlineAt?: string | null) => {
  if (!deadlineAt) return '';
  const deadline = new Date(deadlineAt);
  if (Number.isNaN(deadline.getTime())) return '';
  return deadline.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const RowIconButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  tone?: 'default' | 'indigo' | 'withdraw';
  disabled?: boolean;
}> = ({ icon, onClick, tooltip, tone = 'default', disabled = false }) => (
  <Tooltip title={tooltip}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tone === 'default'
        ? 'text-slate-600 hover:bg-slate-100'
        : tone === 'indigo'
          ? 'text-indigo-500 hover:bg-indigo-50'
          : tone === 'withdraw'
            ? 'text-red-500 hover:bg-red-50'
            : 'text-slate-500 hover:bg-slate-100'
        }`}
    >
      {icon}
    </button>
  </Tooltip>
);

// Hook for viewport detection (mobile, tablet, iPad vs Desktop)
const useIsMobileOrTablet = (breakpoint: number = 1024) => {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

const EmployeeAppraisalDashboard: React.FC = () => {
  const isMobileOrTablet = useIsMobileOrTablet();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  const isManager = location.pathname.startsWith('/manager-dashboard');
  const isAdmin = location.pathname.startsWith('/admin-dashboard');
  const basePath = isManager ? '/manager-dashboard' : isAdmin ? '/admin-dashboard' : '/employee-dashboard';
  const reviewPath = isManager || isAdmin ? `${basePath}/review` : `${basePath}/quarterly-review`;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initial filter values from URL query parameters
  const defaultFY = getCurrentAcademicYear();
  const urlFY = searchParams.get('financialYear') || searchParams.get('fy');
  const initialFY = urlFY !== null ? urlFY : defaultFY;
  const initialQuarter = searchParams.get('quarter') || searchParams.get('q') || '';
  const rawStatus = searchParams.get('reviewStatus') || searchParams.get('status');
  const initialReviewStatus = rawStatus && rawStatus !== 'ALL' ? rawStatus : undefined;

  const [reviews, setReviews] = useState<QuarterlyReview[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fyOptions, setFyOptions] = useState<string[]>(getMasterFinancialYears());
  const [selectedFY, setSelectedFY] = useState<string>(initialFY);
  const [selectedQuarter, setSelectedQuarter] = useState<string>(initialQuarter);
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string | undefined>(initialReviewStatus);
  const [quarterOptions, setQuarterOptions] = useState<QuarterDropdownOption[]>(() => computeQuarterDropdownOptions(initialFY));

  useEffect(() => {
    setQuarterOptions(computeQuarterDropdownOptions(selectedFY));
  }, [selectedFY]);

  const updateQueryParams = (updates: {
    financialYear?: string;
    quarter?: string;
    reviewStatus?: string;
  }) => {
    setSearchParams((prevParams) => {
      const nextParams = new URLSearchParams(prevParams);

      if (updates.financialYear !== undefined) {
        if (updates.financialYear) {
          nextParams.set('financialYear', updates.financialYear);
          nextParams.delete('fy');
        } else {
          nextParams.delete('financialYear');
          nextParams.delete('fy');
        }
      }

      if (updates.quarter !== undefined) {
        if (updates.quarter) {
          nextParams.set('quarter', updates.quarter);
          nextParams.delete('q');
        } else {
          nextParams.delete('quarter');
          nextParams.delete('q');
        }
      }

      if (updates.reviewStatus !== undefined) {
        if (updates.reviewStatus && updates.reviewStatus !== 'ALL') {
          nextParams.set('reviewStatus', updates.reviewStatus);
          nextParams.delete('status');
        } else {
          nextParams.delete('reviewStatus');
          nextParams.delete('status');
        }
      }

      return nextParams;
    }, { replace: true });
  };

  const handleReviewStatusChange = (value: string | undefined) => {
    setSelectedReviewStatus(value);
    updateQueryParams({ reviewStatus: value });
  };

  const filteredReviews = useMemo(() => {
    if (!selectedReviewStatus || selectedReviewStatus === 'ALL') {
      return reviews;
    }
    const targetStatus = selectedReviewStatus.trim().toLowerCase();
    return reviews.filter((reviewRecord) => {
      const displayStatus = getReviewDisplayStatus(reviewRecord);
      const subStatus = (
        reviewRecord.submissionStatus ||
        (reviewRecord.status === ReviewStatus.SUBMITTED || reviewRecord.status === ReviewStatus.COMPLETED || reviewRecord.status === ReviewStatus.APPROVED
          ? 'Submitted'
          : reviewRecord.status === ReviewStatus.DRAFT
            ? 'Draft'
            : 'Not Started')
      ).trim().toLowerCase();
      return (
        displayStatus.toLowerCase() === targetStatus ||
        subStatus === targetStatus
      );
    });
  }, [reviews, selectedReviewStatus]);
  const [summaryData, setSummaryData] = useState<QuarterlyReviewSummary | null>(null);
  const [fyLoading, setFyLoading] = useState(false);
  const [quarterFilterLoading, setQuarterFilterLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Request Access state
  const [requestAccessModalOpen, setRequestAccessModalOpen] = useState(false);
  const [selectedRecordForRequest, setSelectedRecordForRequest] = useState<QuarterlyReview | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const lastFetchedRef = useRef<{ fy?: string; q?: string } | null>(null);
  const isFetchingRef = useRef(false);

  const fetchDashboardData = async (fyFilter?: string, qFilter?: string) => {
    const fyVal = fyFilter !== undefined ? fyFilter : selectedFY;
    const qVal = qFilter !== undefined ? qFilter : selectedQuarter;

    // Deduplicate: avoid re-fetching identical parameters
    if (
      lastFetchedRef.current &&
      lastFetchedRef.current.fy === fyVal &&
      lastFetchedRef.current.q === qVal &&
      reviews.length > 0
    ) {
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      const isAllFY = !fyVal || fyVal === 'ALL';
      const isAllQuarter = !qVal || qVal === 'ALL';
      const filterPayload = {
        financialYear: !isAllFY ? fyVal.replace('FY ', 'FY') : undefined,
        quarter: !isAllQuarter ? qVal : undefined,
      };

      const [quarterResponse, reviewsResult] = await Promise.all([
        dispatch(getCurrentQuarter()).unwrap().catch(() => ''),
        dispatch(getAllReviews(filterPayload)).unwrap().catch(() => [] as any),
      ]);
      const resolvedQuarter = quarterResponse ?? '';
      setCurrentQuarter(resolvedQuarter);

      const safeReviews: QuarterlyReview[] = Array.isArray(reviewsResult)
        ? reviewsResult
        : (reviewsResult?.reviews || []);
      const summary = (reviewsResult as any)?.summary || null;
      setSummaryData(summary);

      const masterYears = getMasterFinancialYears();
      const uniqueFYs = Array.from(
        new Set([
          ...masterYears,
          ...safeReviews.map((reviewRecord) => reviewRecord.financialYear || getFinancialYear(reviewRecord.quarter)),
          ...(fyVal && fyVal !== 'ALL' ? [fyVal] : []),
        ].filter((financialYear) => financialYear && financialYear !== '—'))
      ).sort((financialYearA, financialYearB) => financialYearB.localeCompare(financialYearA));
      setFyOptions(uniqueFYs);

      setReviews(safeReviews);
      lastFetchedRef.current = { fy: fyVal, q: qVal };
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to load quarterly reviews.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchDashboardData(initialFY, initialQuarter);
  }, []);

  const handleFYChange = async (financialYear: string) => {
    setSelectedFY(financialYear);
    updateQueryParams({ financialYear });
    setFyLoading(true);
    try {
      const isAllFY = !financialYear || financialYear === 'ALL';
      const isAllQuarter = !selectedQuarter || selectedQuarter === 'ALL';
      const filterPayload = {
        financialYear: !isAllFY ? financialYear.replace('FY ', 'FY') : undefined,
        quarter: !isAllQuarter ? selectedQuarter : undefined,
      };
      const res: any = await dispatch(getAllReviews(filterPayload)).unwrap();
      const safeReviews = Array.isArray(res) ? res : (res?.reviews || []);
      setReviews(safeReviews);
      setSummaryData(res?.summary || null);
      lastFetchedRef.current = { fy: financialYear, q: selectedQuarter };
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to filter reviews.');
    } finally {
      setFyLoading(false);
    }
  };

  const handleQuarterChange = async (quarterVal: string) => {
    setSelectedQuarter(quarterVal);
    updateQueryParams({ quarter: quarterVal });
    setQuarterFilterLoading(true);
    try {
      const filterPayload = {
        financialYear: selectedFY ? selectedFY.replace('FY ', 'FY') : undefined,
        quarter: quarterVal || undefined,
      };
      const res: any = await dispatch(getAllReviews(filterPayload)).unwrap();
      const safeReviews = Array.isArray(res) ? res : (res?.reviews || []);
      setReviews(safeReviews);
      setSummaryData(res?.summary || null);
      lastFetchedRef.current = { fy: selectedFY, q: quarterVal };
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to filter reviews.');
    } finally {
      setQuarterFilterLoading(false);
    }
  };

  // Keep state in sync with URL search params (e.g. browser back/forward or external navigation)
  useEffect(() => {
    const urlFY = searchParams.get('financialYear') || searchParams.get('fy') || '';
    const urlQ = searchParams.get('quarter') || searchParams.get('q') || '';
    const rawSt = searchParams.get('reviewStatus') || searchParams.get('status');
    const urlStatus = rawSt && rawSt !== 'ALL' ? rawSt : undefined;

    let shouldFetch = false;
    if (urlFY && urlFY !== selectedFY) {
      setSelectedFY(urlFY);
      shouldFetch = true;
    }
    if (urlQ && urlQ !== selectedQuarter) {
      setSelectedQuarter(urlQ);
      shouldFetch = true;
    }
    if (urlStatus !== selectedReviewStatus) {
      setSelectedReviewStatus(urlStatus);
    }

    if (shouldFetch && !loading) {
      fetchDashboardData(urlFY, urlQ);
    }
  }, [location.search]);

  const [downloadingQuarter, setDownloadingQuarter] = useState<string | null>(null);

  const handleDownloadPdf = async (record: QuarterlyReview) => {
    try {
      setDownloadingQuarter(record.quarter);
      messageApi.loading({ content: 'Generating Quarterly Review PDF...', key: 'download-pdf', duration: 0 });
      await dispatch(downloadQuarterlyReviewPdf({ id: record.id, quarter: record.quarter })).unwrap();
      messageApi.success({ content: 'Quarterly review PDF downloaded successfully.', key: 'download-pdf' });
    } catch (err: any) {
      messageApi.error({ content: err || 'Failed to download review PDF.', key: 'download-pdf' });
    } finally {
      setDownloadingQuarter(null);
    }
  };

  const handleOpenRequestAccess = (record: QuarterlyReview) => {
    setSelectedRecordForRequest(record);
    setRequestReason('');
    setRequestAccessModalOpen(true);
  };

  const handleSubmitRequestAccess = async () => {
    if (!selectedRecordForRequest) return;
    if (!requestReason.trim()) {
      messageApi.error('Please enter a reason for requesting access.');
      return;
    }

    try {
      setRequestSubmitting(true);
      await dispatch(
        requestReviewAccess({
          assignmentId: selectedRecordForRequest.assignment?.id,
          quarter: selectedRecordForRequest.quarter,
          reason: requestReason.trim(),
        })
      ).unwrap();

      messageApi.success('Access request submitted successfully to Manager, Admin, and CEO.');
      setRequestAccessModalOpen(false);
      setSelectedRecordForRequest(null);
      fetchDashboardData();
    } catch (err: any) {
      messageApi.error(err || 'Failed to submit access request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Quarters whose deadline is within 24 hours and are not yet submitted/completed, sorted so the earliest deadline appears first
  const deadlineAlertQuarters = reviews
    .filter((r) => {
      const rawDeadline = r.deadlineAt || (r.assignment as any)?.deadlineAt;
      if (!rawDeadline) return false;
      const deadlineMs = new Date(rawDeadline).getTime();
      const nowMs = Date.now();
      const diffMs = deadlineMs - nowMs;
      // Allow a 60s tolerance for network latency / clock skew so exactly 24h is captured immediately
      const TWENTY_FOUR_H = 24 * 60 * 60 * 1000 + 60 * 1000;
      if (diffMs <= 0 || diffMs > TWENTY_FOUR_H) return false;
      const st = (r.status || r.submissionStatus || '').trim().toLowerCase();
      const isSubmitted = ['submitted', 'completed', 'auto submitted', 'auto_submitted', 'approved'].includes(st);
      return !isSubmitted;
    })
    .sort((a, b) => {
      const deadA = new Date(a.deadlineAt || (a.assignment as any)?.deadlineAt || 0).getTime();
      const deadB = new Date(b.deadlineAt || (b.assignment as any)?.deadlineAt || 0).getTime();
      return deadA - deadB;
    });

  /** Formats the remaining time until a deadline as a human-readable string */
  const formatDeadlineRemaining = (rawDeadline: string): string => {
    const diffMs = new Date(rawDeadline).getTime() - Date.now();
    if (diffMs <= 0) return 'Deadline passed';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m remaining` : `${hours}h remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Compute academic year rating: average of ALL-TIME evaluated quarter numericScore values from reviews
  const academicYearRating = (() => {
    const allEvaluated = reviews.filter(
      (r) => r.hasFinalRating && (r as any).numericScore !== null && (r as any).numericScore !== undefined
    );
    if (allEvaluated.length === 0) {
      // fallback: try finalRating string values
      const withFinalRating = reviews.filter((r) => r.finalRating && r.finalRating !== '—');
      if (withFinalRating.length === 0) return null;
      const parsed = withFinalRating
        .map((r) => parseFloat(String(r.finalRating)))
        .filter((v) => !isNaN(v));
      if (parsed.length === 0) return null;
      return (parsed.reduce((s, v) => s + v, 0) / parsed.length).toFixed(1);
    }
    const avg =
      allEvaluated.reduce((s, r) => s + (r as any).numericScore, 0) / allEvaluated.length;
    return avg.toFixed(1);
  })();

  const isAcademicRatingHidden = reviews.some((r) => r.isFinalRatingHidden && r.hasFinalRating);

  // Target Financial Year for the Current Year Rating card
  const targetYear = (selectedFY || summaryData?.targetFY || getFinancialYear(currentQuarter) || getCurrentAcademicYear()).trim();
  const normalizedTargetYear = targetYear.replace(/\s+/g, '').toUpperCase();

  // Current Year Rating: sum of evaluated quarter ratings in the current financial year (Q1 + Q2 + Q3 + Q4)
  // If user only has Q1 -> show Q1 rating. If Q1 & Q2 -> Q1 + Q2, etc.
  const { currentYearRatingScore, hasCurrentYearRating, isCurrentYearRatingHidden } = (() => {
    const currentFYReviews = reviews.filter((r) => {
      const recordFY = (r.financialYear || getFinancialYear(r.quarter)).replace(/\s+/g, '').toUpperCase();
      const recordQuarter = (r.quarter || '').replace(/\s+/g, '').toUpperCase();
      return recordFY.includes(normalizedTargetYear) || recordQuarter.includes(normalizedTargetYear);
    });

    const quarterScores: Record<string, { score: number; isHidden: boolean }> = {};
    for (const r of currentFYReviews) {
      const qKey = (r.quarterCode || (r.quarter ? r.quarter.trim().split(/\s+/)[0] : '')).toUpperCase();
      let score: number | null = null;
      if ((r as any).numericScore !== null && (r as any).numericScore !== undefined) {
        score = Number((r as any).numericScore);
      } else if (r.finalRating && r.finalRating !== '—') {
        const parsed = parseFloat(String(r.finalRating));
        if (!isNaN(parsed)) score = parsed;
      }

      if (score !== null && score > 0 && (r.hasFinalRating || (r.finalRating && r.finalRating !== '—'))) {
        quarterScores[qKey] = {
          score,
          isHidden: Boolean(r.isFinalRatingHidden),
        };
      }
    }

    const items = Object.values(quarterScores);
    if (items.length === 0) {
      if (summaryData?.hasYearRating && (summaryData?.yearRating || summaryData?.yearRatingScore)) {
        return {
          currentYearRatingScore: String(summaryData.yearRating || summaryData.yearRatingScore),
          hasCurrentYearRating: true,
          isCurrentYearRatingHidden: Boolean(summaryData.isYearRatingHidden),
        };
      }
      return { currentYearRatingScore: null, hasCurrentYearRating: false, isCurrentYearRatingHidden: false };
    }

    const total = items.reduce((sum, item) => sum + item.score, 0);
    const isHidden = items.some((item) => item.isHidden) || Boolean(summaryData?.isYearRatingHidden);
    return {
      currentYearRatingScore: total.toFixed(1),
      hasCurrentYearRating: true,
      isCurrentYearRatingHidden: isHidden,
    };
  })();

  const currentReview = reviews.find((reviewItem) => reviewItem.quarter === currentQuarter);
  const currentStatus = !currentReview
    ? ReviewStatus.NOT_STARTED
    : currentReview.status === ReviewStatus.DRAFT
      ? ReviewStatus.DRAFT
      : ReviewStatus.SUBMITTED;
  const hasCurrentQuarterReview = !!currentReview;
  const quarterRange = formatQuarterRange(currentQuarter);
  const quarterEndDate = formatQuarterEndDate(currentQuarter);
  const quarterOver = isQuarterOver(currentQuarter);

  const submissionSubtext = hasCurrentQuarterReview
    ? 'Your quarterly submission'
    : 'Waiting for authorized assignment';

  const formatDateDisplay = (dateVal?: string | null): string => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const columns = [
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 170,
      render: (quarterName: string, record: QuarterlyReview) => {
        const qCode = record.quarterCode || (quarterName?.split(' ')[0] ?? quarterName) || '';
        const display = formatQuarterWithDateRange(qCode, record.financialYear || record.quarter);
        return (
          <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">
            {display}
          </span>
        );
      },
    },
    {
      title: 'Financial Year',
      key: 'fy',
      width: 140,
      render: (_value: any, reviewRecord: QuarterlyReview) => (
        <span className="font-semibold text-slate-800 text-sm">{reviewRecord.financialYear || getFinancialYear(reviewRecord.quarter)}</span>
      ),
    },
    {
      title: 'Deadline',
      dataIndex: 'toDate',
      key: 'toDate',
      width: 130,
      render: (_value: any, record: QuarterlyReview) => (
        <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">
          {formatDateDisplay(record.toDate || record.endDate || record.deadlineAt || (record.assignment as any)?.deadlineAt)}
        </span>
      ),
    },
    {
      title: 'Assigned By',
      key: 'assignedBy',
      width: 180,
      render: (_value: any, record: QuarterlyReview) => {
        const displayEvaluator =
          record.assignedBy ||
          (record.assignment?.assignedByName
            ? `${record.assignment.assignedByName}${record.assignment.assignedByRole ? ` (${record.assignment.assignedByRole})` : ''}`
            : record.managerName || (isManager ? 'CEO & Admin' : 'Manager / Admin'));
        return (
          <Tooltip title={displayEvaluator}>
            <span className="text-slate-700 text-sm font-medium">{displayEvaluator}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (_value: any, record: QuarterlyReview) => {
        const displayStatus = getReviewDisplayStatus(record);
        return (
          <div className="flex flex-col items-start gap-0.5 whitespace-nowrap">
            <StatusBadge status={displayStatus} showStatusIndicator={true} />
          </div>
        );
      },
    },
    {
      title: 'Final Rating',
      dataIndex: 'finalRating',
      key: 'finalRating',
      width: 130,
      render: (_value: any, record: QuarterlyReview) => {
        const displayStatus = getReviewDisplayStatus(record);
        const isEvaluated = displayStatus === 'Reviewed';

        if (!isEvaluated) {
          return <span className="text-slate-400 text-sm font-medium">—</span>;
        }

        const avgRating = record.finalRating || record.quarterRating || getDisplayAverageRating(record);
        return (
          <HiddenRatingBadge
            reviewId={record.id}
            quarter={record.quarter}
            finalRating={avgRating}
            ratings={record.ratings}
            isFinalRatingHidden={(record as any).isFinalRatingHidden}
            hasFinalRating={true}
          />
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_value: any, record: QuarterlyReview) => {
        const statusLower = String(record.status || '').trim().toLowerCase();
        const subStatusLower = String(record.submissionStatus || '').trim().toLowerCase();
        const revStatusLower = String(record.reviewStatus || '').trim().toLowerCase();
        const displayStatus = getReviewDisplayStatus(record);

        const isCompleted =
          displayStatus === 'Reviewed' ||
          record.reviewStatus === ReviewStatus.COMPLETED ||
          record.reviewStatus === ReviewStatus.REVIEWED ||
          record.status === ReviewStatus.APPROVED ||
          record.status === ReviewStatus.COMPLETED ||
          statusLower === 'reviewed' ||
          statusLower === 'completed' ||
          statusLower === 'approved';

        const isSubmitted =
          !isCompleted &&
          (statusLower === 'submitted' ||
           statusLower === 'auto submitted' ||
           statusLower === 'auto_submitted' ||
           statusLower === 'awaiting review' ||
           statusLower === 'awaiting_review' ||
           subStatusLower === 'submitted' ||
           subStatusLower === 'auto submitted' ||
           revStatusLower === 'awaiting review' ||
           revStatusLower === 'awaiting_review' ||
           record.submissionType === 'AUTO' ||
           record.submissionType === 'MANUAL' ||
           record.autoSubmitted === 1 ||
           Boolean(record.submittedDate) ||
           displayStatus === 'Awaiting Review');

        const isNotSubmitted =
          !isSubmitted &&
          !isCompleted &&
          (record.status === ReviewStatus.NOT_STARTED ||
           record.status === ReviewStatus.DRAFT ||
           statusLower === 'initial' ||
           statusLower === 'draft' ||
           statusLower === 'assigned' ||
           record.submissionStatus === 'Not Started' ||
           record.submissionStatus === 'Draft');

        const hasAccessOpen = Boolean(
          (record as any).assignment?.isAccessOpen ||
          (record as any).accessGranted ||
          (record as any).isReopened === 1 ||
          (record.accessUntil && new Date(record.accessUntil) > new Date())
        );
        const isEditable = hasAccessOpen || isNotSubmitted;

        const accessRequestCountdown = getAccessRequestCountdown(
          record.submittedDate,
          record.accessRequestEligibleUntil ||
            (record as any).assignment?.accessRequestEligibleUntil,
          (record as any).updatedAt || (record as any).createdAt
        );

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* View Button */}
            <RowIconButton
              icon={<Eye className="w-4 h-4" />}
              tooltip="View Review"
              tone="indigo"
              onClick={() =>
                navigate(`${reviewPath}/${quarterToSlug(record.quarter)}?mode=view`)
              }
            />

            {/* Edit / Continue button */}
            {isEditable && (
              <RowIconButton
                icon={<Edit3 className="w-4 h-4" />}
                tooltip={
                  record.status === ReviewStatus.NOT_STARTED || record.submissionStatus === 'Not Started'
                    ? 'Start Review'
                    : 'Edit Review'
                }
                tone="indigo"
                onClick={() => {
                  navigate(`${reviewPath}/${quarterToSlug(record.quarter)}`);
                }}
              />
            )}

            {/* Download PDF button */}
            {isCompleted && (
              <RowIconButton
                icon={downloadingQuarter === record.quarter ? <Spin size="small" /> : <Download className="w-4 h-4" />}
                tooltip="Download PDF"
                tone="indigo"
                disabled={downloadingQuarter === record.quarter}
                onClick={() => handleDownloadPdf(record)}
              />
            )}

            {/* 24-Hour Request Access Button */}
            {isSubmitted && !hasAccessOpen && (
              (() => {
                const req = (record as any).accessRequest;
                const isPending = req?.status === 'PENDING';
                const isRejected = req?.status === 'REJECTED';
                const canRetry = req ? req.canReRequest && req.totalAttempts < 2 : true;

                if (isPending) {
                  return (
                    <Tooltip title={`Access Request Pending Approval (Attempt ${req.attemptNumber || 1} of 2)`}>
                      <button
                        type="button"
                        disabled
                        className="opacity-70 cursor-not-allowed !border-amber-300 !bg-amber-50 !text-amber-700 !rounded-lg !flex !items-center !justify-center p-1.5 border"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      </button>
                    </Tooltip>
                  );
                }

                if (isRejected && !canRetry) {
                  return (
                    <Tooltip title={`Access Request Rejected: "${req.rejectionReason || req.remarks || 'Rejected'}". Maximum limit reached.`}>
                      <button
                        type="button"
                        disabled
                        className="opacity-50 cursor-not-allowed !border-rose-200 !bg-rose-50 !text-rose-400 !rounded-lg !flex !items-center !justify-center p-1.5 border"
                      >
                        <Key className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </Tooltip>
                  );
                }

                if (accessRequestCountdown?.isEligible && canRetry) {
                  const retryTooltip = isRejected
                    ? `Previous request rejected: "${req.rejectionReason || req.remarks || 'Rejected'}". 1 re-request remaining (${accessRequestCountdown.text})`
                    : `Request Access (${accessRequestCountdown.text})`;

                  return (
                    <Tooltip title={retryTooltip}>
                      <button
                        type="button"
                        onClick={() => handleOpenRequestAccess(record)}
                        className="!border-amber-400 hover:!border-amber-500 !text-amber-700 hover:!text-amber-800 !font-semibold !rounded-lg !flex !items-center !justify-center p-1.5 border bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer shadow-sm"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    </Tooltip>
                  );
                }

                if (!accessRequestCountdown?.isEligible) {
                  return (
                    <Tooltip title="24-hour access request window has closed">
                      <button
                        type="button"
                        disabled
                        className="opacity-40 cursor-not-allowed !border-slate-200 !bg-slate-50 !text-slate-400 !rounded-lg !flex !items-center !justify-center p-1.5 border"
                      >
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </Tooltip>
                  );
                }

                return null;
              })()
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (isMobileOrTablet) {
    return (
      <>
        {contextHolder}
        <MobileEmployeeAppraisalDashboard
          reviews={filteredReviews}
          loading={loading}
          fyOptions={fyOptions}
          selectedFY={selectedFY}
          selectedQuarter={selectedQuarter}
          selectedReviewStatus={selectedReviewStatus}
          quarterOptions={quarterOptions}
          deadlineAlertQuarters={deadlineAlertQuarters}
          hasCurrentYearRating={hasCurrentYearRating}
          normalizedTargetYear={normalizedTargetYear}
          targetYear={targetYear}
          currentYearRatingScore={currentYearRatingScore}
          isCurrentYearRatingHidden={isCurrentYearRatingHidden}
          academicYearRating={academicYearRating}
          isAcademicRatingHidden={isAcademicRatingHidden}
          fyLoading={fyLoading}
          quarterFilterLoading={quarterFilterLoading}
          downloadingQuarter={downloadingQuarter}
          reviewPath={reviewPath}
          onFYChange={handleFYChange}
          onQuarterChange={handleQuarterChange}
          onReviewStatusChange={handleReviewStatusChange}
          onDownload={handleDownloadPdf}
          onOpenRequestAccess={handleOpenRequestAccess}
          onFillReview={(quarterToFill: string) => {
            navigate(`${reviewPath}/${quarterToSlug(quarterToFill)}`);
          }}
        />

        {/* Request Review Access Modal for Mobile */}
        <Modal
          open={requestAccessModalOpen}
          onCancel={() => {
            if (!requestSubmitting) {
              setRequestAccessModalOpen(false);
              setSelectedRecordForRequest(null);
            }
          }}
          footer={null}
          centered
          destroyOnClose
          width={460}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Request Review Access
                </h3>
                <p className="text-xs text-slate-500">
                  For {selectedRecordForRequest?.quarter}
                </p>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                After the deadline is completed (or after you submit), you have 24 hours to request access again. Your manager, admin, or CEO must approve it before the form reopens.
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for Request: <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={requestReason}
                onChange={(changeEvent) => setRequestReason(changeEvent.target.value)}
                placeholder="Enter your reason for requesting review access..."
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={requestSubmitting}
                onClick={() => {
                  setRequestAccessModalOpen(false);
                  setSelectedRecordForRequest(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestSubmitting || !requestReason.trim()}
                onClick={handleSubmitRequestAccess}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {requestSubmitting ? (
                  <>
                    <Spin size="small" className="text-white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Access Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="pb-8 mt-2 px-1">
        <>
          <style>{`
.compact-filter {
  width: 180px !important;
}

.compact-filter .ant-select-selector {
  height: 36px !important;
  border-radius: 10px !important;
  background: #f8fafc !important;
  border: 1px solid #dbe3ef !important;
  box-shadow: none !important;
}

.compact-filter .ant-select-selection-item,
.compact-filter .ant-select-selection-placeholder {
  line-height: 34px !important;
  font-size: 13px;
}

.compact-filter .ant-select-arrow {
  color: #94a3b8;
}

@keyframes statCardFadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card-animate {
  opacity: 0;
  animation: statCardFadeInUp 0.5s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .stat-card-animate {
    animation: none;
    opacity: 1;
  }
}
`}</style>
          <div
            className="w-full min-h-screen bg-slate-50 px-4 py-4 flex flex-col"
          >
            {/* Top Header without Create Button (Assignment-driven) */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Quarterly Review
                </h1>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <p className="text-slate-500 text-sm">
                  Complete authorized quarterly review assignments and track your performance appraisals.
                </p>
              </div>
            </div>

            {/* Deadline Alert + Rating Cards */}
            {deadlineAlertQuarters.length > 0 ? (
              /* 2-col layout: Deadline Alert card + Current Year Rating card */
              <div className="mb-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-stretch">

                {/* Deadline Alert Card */}
                <div className="min-w-0 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 shadow-md flex flex-col gap-2 animate-pulse-border">
                  <style>{`
                    @keyframes pulseBorder {
                      0%, 100% { border-color: rgb(252 165 165); }
                      50% { border-color: rgb(239 68 68); }
                    }
                    .animate-pulse-border { animation: pulseBorder 2s ease-in-out infinite; }
                  `}</style>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-red-700 text-sm block truncate">
                        Deadline Alert
                      </span>
                      <span className="text-xs text-red-500">
                        {deadlineAlertQuarters.length} quarter{deadlineAlertQuarters.length > 1 ? 's' : ''} deadline within 24 hours
                      </span>
                    </div>
                  </div>

                  {/* Quarter pills list */}
                  <div className="flex flex-col gap-2">
                    {deadlineAlertQuarters.map((review) => {
                      const rawDeadline = review.deadlineAt || (review.assignment as any)?.deadlineAt;
                      const timeRemaining = rawDeadline ? formatDeadlineRemaining(rawDeadline) : '';
                      return (
                        <div
                          key={review.quarter}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border bg-white border-red-200 shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-sm font-semibold truncate text-slate-800">
                              {review.quarterCode || review.quarter?.split(' ')[0] || review.quarter}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {review.financialYear || getFinancialYear(review.quarter)}
                            </span>
                            {timeRemaining && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 whitespace-nowrap shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeRemaining}
                              </span>
                            )}
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            className="!bg-red-500 hover:!bg-red-600 !text-white !font-semibold !rounded-lg !h-7 !px-3 shrink-0"
                            onClick={() => {
                              navigate(`${reviewPath}/${quarterToSlug(review.quarter)}`);
                            }}
                          >
                            Fill
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Year Rating */}
                <StatCard
                  accent="emerald"
                  icon={<Award className="w-5 h-5 text-emerald-500" />}
                  label="Current Year Rating"
                  value={
                    hasCurrentYearRating ? (
                      <HiddenRatingBadge
                        reviewId={`year-${normalizedTargetYear}`}
                        quarter={targetYear}
                        finalRating={currentYearRatingScore}
                        label="Current Year Rating"
                        isFinalRatingHidden={isCurrentYearRatingHidden}
                        hasFinalRating={true}
                        size="lg"
                        initialEmail={(currentUser as any)?.email || currentUser?.loginId}
                        employeeId={currentUser?.loginId}
                        navigateOnSuccess={true}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">—</span>
                    )
                  }
                  subtext={hasCurrentYearRating ? `Overall rating for ${targetYear}` : 'Not Available'}
                  delay={160}
                />

              </div>
            ) : (
              /* Single rating card layout: only Current Year Rating */
              <div className="mb-4 grid grid-cols-1 md:max-w-md gap-4 items-stretch">

                {/* Current Year Rating */}
                <StatCard
                  accent="emerald"
                  icon={<Award className="w-5 h-5 text-emerald-500" />}
                  label="Current Year Rating"
                  value={
                    hasCurrentYearRating ? (
                      <HiddenRatingBadge
                        reviewId={`year-${normalizedTargetYear}`}
                        quarter={targetYear}
                        finalRating={currentYearRatingScore}
                        label="Current Year Rating"
                        isFinalRatingHidden={isCurrentYearRatingHidden}
                        hasFinalRating={true}
                        size="lg"
                        initialEmail={(currentUser as any)?.email || currentUser?.loginId}
                        employeeId={currentUser?.loginId}
                        navigateOnSuccess={true}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">—</span>
                    )
                  }
                  subtext={hasCurrentYearRating ? `Overall rating for ${targetYear}` : 'Not Available'}
                  delay={160}
                />

              </div>
            )}
            {/* Main Content */}
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              {/* Current Quarter bar */}
              {/* <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shrink-0 flex items-center justify-between gap-4">
                <div className="flex flex-col leading-none">
                  <span className="text-[12px] font-semibold text-slate-900 mb-1">
                    {getFinancialYear(currentQuarter)}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[15px] font-semibold text-slate-900">
                      {currentQuarter?.split(' ')[0] || '—'}
                    </span>
                    {quarterRange && (
                      <span className="text-[15px] font-semibold text-slate-900">
                        • {quarterRange}
                      </span>
                    )}
                  </div>
                </div>

                <span className="inline-block w-fit bg-indigo-100 text-indigo-700 text-[11px] font-semibold tracking-wider px-4 py-2 rounded-full uppercase shrink-0">
                  Current Quarter
                </span>
              </div> */}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                {/* 1. Review Status Card (Kept) */}
                {/* <StatCard
                  accent="indigo"
                  icon={<ClipboardList className="w-5 h-5 text-indigo-500" />}
                  label="Review Status"
                  value={
                    summaryData?.reviewStatus && summaryData.reviewStatus !== '—' ? (
                      <StatusBadge status={summaryData.reviewStatus} showStatusIndicator={false} />
                    ) : currentReview?.reviewStatus ? (
                      <StatusBadge status={currentReview.reviewStatus} showStatusIndicator={false} />
                    ) : (
                      <span className="text-slate-400 font-medium text-base">—</span>
                    )
                  }
                  subtext={isManager ? "CEO & Admin evaluation" : "Manager evaluation"}
                  delay={0}
                /> */}

                {/* 2. Quarter Rating Card */}
                {/* <StatCard
                  accent="amber"
                  icon={<Star className="w-5 h-5 text-amber-400" />}
                  label="Quarter Rating"
                  value={
                    summaryData?.hasQuarterRating ? (
                      <HiddenRatingBadge
                        reviewId={summaryData?.activeReview?.id || currentReview?.id}
                        quarter={summaryData?.targetQuarter || selectedQuarter || currentReview?.quarter}
                        finalRating={summaryData?.quarterRating || summaryData?.quarterRatingScore || currentReview?.quarterRating || currentReview?.finalRating || getDisplayAverageRating(currentReview)}
                        isFinalRatingHidden={summaryData?.isQuarterRatingHidden ?? (currentReview as any)?.isFinalRatingHidden}
                        hasFinalRating={true}
                        size="lg"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">—</span>
                    )
                  }
                  subtext={
                    summaryData?.hasQuarterRating
                      ? `Rating for ${selectedQuarter || (summaryData?.targetQuarter ? summaryData.targetQuarter.split(' ')[0] : currentQuarter?.split(' ')[0] || 'Quarter')}`
                      : 'Not Available'
                  }
                  delay={80}
                /> */}

                {/* 3. Year Rating Card */}
                {/* <StatCard
                  accent="emerald"
                  icon={<Award className="w-5 h-5 text-emerald-500" />}
                  label="Year Rating"
                  value={
                    summaryData?.hasYearRating ? (
                      <HiddenRatingBadge
                        reviewId={currentReview?.id ? `year-${summaryData?.targetFY || selectedFY || 'current'}` : undefined}
                        quarter={summaryData?.targetQuarter || currentQuarter}
                        finalRating={summaryData?.yearRating || summaryData?.yearRatingScore || currentReview?.yearRating}
                        isFinalRatingHidden={summaryData?.isYearRatingHidden}
                        hasFinalRating={true}
                        size="lg"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">—</span>
                    )
                  }
                  subtext={
                    summaryData?.hasYearRating
                      ? `Overall rating for ${summaryData?.targetFY || selectedFY || getFinancialYear(currentQuarter)}`
                      : 'Not Available'
                  }
                  delay={160}
                /> */}
              </div>

              {/* History Table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex-1 min-h-0">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-indigo-50 text-indigo-600 w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </span>
                    <h2 className="font-semibold text-slate-800 text-base">Quarterly Review History</h2>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {fyOptions.length > 0 && (
                      <Select
                        className="compact-filter"
                        value={selectedFY === 'ALL' ? undefined : (selectedFY || undefined)}
                        onChange={(val) => handleFYChange(val || 'ALL')}
                        loading={fyLoading}
                        placeholder="Financial Year"
                        allowClear
                        variant="outlined"
                        prefix={<Calendar className="w-4 h-4 text-indigo-500" />}
                        popupMatchSelectWidth
                        style={{ width: 160 }}
                        options={[
                          { label: 'All Years', value: 'ALL' },
                          ...fyOptions.map((financialYear) => ({
                            label: financialYear,
                            value: financialYear,
                          })),
                        ]}
                      />
                    )}

                    <Select
                      className="compact-filter"
                      value={selectedQuarter || undefined}
                      onChange={handleQuarterChange}
                      loading={quarterFilterLoading}
                      placeholder="Quarter"
                      allowClear
                      variant="outlined"
                      prefix={<Clock className="w-4 h-4 text-indigo-500" />}
                      popupMatchSelectWidth
                      style={{ width: 170 }}
                      options={quarterOptions.map((opt) => ({
                        label: opt.label,
                        value: opt.code,
                      }))}
                    />

                    {/* Status Filter */}
                    <Select
                      className="compact-filter"
                      value={selectedReviewStatus || undefined}
                      onChange={handleReviewStatusChange}
                      placeholder="Status"
                      allowClear
                      variant="outlined"
                      prefix={<ClipboardList className="w-4 h-4 text-indigo-500" />}
                      popupMatchSelectWidth
                      style={{ width: 160 }}
                      options={REVIEW_STATUS_FILTER_OPTIONS}
                    />
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="table-scroll-area">
                    <style>{`
                .custom-table .ant-table-container {
                  border-top-left-radius: 16px !important;
                  border-top-right-radius: 16px !important;
                  overflow: hidden !important;
                }
                .custom-table .ant-table-thead > tr > th {
                  background: #4318FF !important;
                  color: #FFFFFF !important;
                  font-size: 12px !important;
                  font-weight: 700 !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.05em !important;
                  padding: 13px 16px !important;
                  border-bottom: none !important;
                  white-space: nowrap !important;
                  line-height: 1.3 !important;
                  vertical-align: middle !important;
                }
                .custom-table .ant-table-thead > tr > th::before {
                  display: none !important;
                }
                .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
                .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-right-first {
                  background: #4318FF !important;
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
                  padding: 12px 16px !important;
                  font-size: 13px !important;
                  border-bottom: 1px solid #F1F5F9 !important;
                  background: #ffffff !important;
                  white-space: nowrap !important;
                  word-break: keep-all !important;
                }
                .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row):last-child > td {
                  border-bottom: none !important;
                }
                .custom-table .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td {
                  background: #F8FAFC !important;
                }
                .custom-table .ant-table-tbody > tr > td.ant-table-cell-fix-right,
                .custom-table .ant-table-tbody > tr > td.ant-table-cell-fix-right-first {
                  background-color: #FFFFFF !important;
                  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.06) !important;
                }
                .custom-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
                .custom-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right-first {
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
                    <Table
                      columns={columns}
                      dataSource={filteredReviews}
                      loading={fyLoading}
                      rowKey={(reviewItem) => reviewItem.quarter}
                      pagination={false}
                      size="middle"
                      scroll={{ x: 1350 }}
                      className="custom-table"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
                    <img
                      src={EmptyReviewImage}
                      alt="No quarterly reviews"
                      className="w-12px h-50 object-contain opacity-70"
                    />
                    <p className="text-slate-500 font-semibold text-base">No quarterly reviews assigned yet.</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Quarterly reviews will appear here once assigned by your Manager, Admin, or CEO.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      </div>

      {/* 24-Hour Request Access Modal */}
      <Modal
        open={requestAccessModalOpen}
        onCancel={() => {
          if (!requestSubmitting) {
            setRequestAccessModalOpen(false);
            setSelectedRecordForRequest(null);
          }
        }}
        footer={null}
        centered
        destroyOnClose
        width={460}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Request Review Access
              </h3>
              <p className="text-xs text-slate-500">
                For {selectedRecordForRequest?.quarter}
              </p>
            </div>
          </div>

          {selectedRecordForRequest?.accessRequest?.status === 'REJECTED' ? (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex flex-col gap-1 text-xs text-rose-800">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Final Re-request Attempt (Attempt 2 of 2)</span>
              </div>
              <p className="text-rose-700">
                Previous request was rejected with comment:
                <strong className="block italic mt-0.5 font-medium">"{selectedRecordForRequest.accessRequest.rejectionReason || selectedRecordForRequest.accessRequest.remarks || 'Rejected'}"</strong>
              </p>
              <p className="text-[11px] text-rose-600">You may request access only once after rejection. If rejected again, access cannot be requested further.</p>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                After the deadline is completed (or after you submit), you have 24 hours to request access again. Your manager, admin, or CEO must approve it before the form reopens.
              </span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Request: <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={requestReason}
              onChange={(changeEvent) => setRequestReason(changeEvent.target.value)}
              placeholder="Enter your reason for requesting review access..."
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={requestSubmitting}
              onClick={() => {
                setRequestAccessModalOpen(false);
                setSelectedRecordForRequest(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={requestSubmitting || !requestReason.trim()}
              onClick={handleSubmitRequestAccess}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {requestSubmitting ? (
                <>
                  <Spin size="small" className="text-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Access Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EmployeeAppraisalDashboard;