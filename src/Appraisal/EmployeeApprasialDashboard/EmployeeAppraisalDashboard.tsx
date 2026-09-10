import { HiddenRatingBadge } from '../components/HiddenRatingBadge';
import React, { useState, useEffect } from 'react';
import { Button, Table, Spin, message, Tooltip, Select, Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Edit3, Eye, Calendar, Star, ClipboardList,
  BarChart3, Download, Trash2, FileCheck2, AlertTriangle,
  Clock, Key, Send, ShieldAlert, Award,
} from 'lucide-react';
import { ReviewStatus } from './enums/Appraisal.enums';
import { QuarterlyReview, StatusStyle } from './types/Appraisal.types';
import EmptyReviewImage from '../../assets/EmptyReviewImage.png';
import {
  formatQuarterRange,
  formatQuarterEndDate,
  getFinancialYear,
  isQuarterOver,
  quarterToSlug, //quarter name into a URL-friendly string (slug).
} from './utils/fyQuarter.utils';
import type { AppDispatch } from '../../store';
import {
  getCurrentQuarter,
  getAllReviews,
  withdrawQuarterlyReview,
  downloadQuarterlyReviewPdf,
  fetchMyReviewAssignments,
  requestReviewAccess,
  ReviewAssignment,
  QuarterlyReviewSummary,
} from '../../reducers/quarterlyReview.reducer';
import MobileEmployeeAppraisalDashboard from './MobileEmployeeAppraisalDashboard/MobileEmployeeAppraisalDashboard';

const formatDeadlineDate = (deadlineAt?: string | null) => {
  if (!deadlineAt) return '';
  const deadline = new Date(deadlineAt);
  if (Number.isNaN(deadline.getTime())) return '';
  return deadline.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getDeadlineCountdown = (deadlineAt?: string | null) => {
  if (!deadlineAt) return null;
  const deadline = new Date(deadlineAt).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return { isExpired: true, text: 'Deadline completed — request access again' };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return { isExpired: false, text: `${days}d ${hours % 24}h remaining` };
  }
  return { isExpired: false, text: `${hours}h ${minutes}m remaining` };
};

// Helper to calculate 24-hour Request Access window
export const getAccessRequestCountdown = (submittedDate?: string | null, eligibleUntil?: string | null) => {
  const targetDate = eligibleUntil
    ? new Date(eligibleUntil).getTime()
    : submittedDate
      ? new Date(submittedDate).getTime() + 24 * 60 * 60 * 1000
      : null;

  if (!targetDate) return null;
  const now = Date.now();
  const diffMs = targetDate - now;

  if (diffMs <= 0) {
    return { isEligible: false, text: '24-hour request window closed' };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { isEligible: true, text: `${hours}h ${minutes}m left to request access` };
};

const STATUS_STYLES: Record<string, StatusStyle> = {
  'Not Started': {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    indicatorColor: 'bg-slate-400',
  },
  Draft: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicatorColor: 'bg-amber-400',
  },
  Submitted: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  [ReviewStatus.NOT_STARTED]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    indicatorColor: 'bg-slate-400',
  },
  ASSIGNED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    indicatorColor: 'bg-blue-500',
  },
  'Auto Submitted': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    indicatorColor: 'bg-purple-500',
  },
  AUTO_SUBMITTED: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    indicatorColor: 'bg-purple-500',
  },
  'Access Requested': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicatorColor: 'bg-amber-500',
  },
  [ReviewStatus.DRAFT]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicatorColor: 'bg-amber-400',
  },
  [ReviewStatus.SUBMITTED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  [ReviewStatus.APPROVED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  [ReviewStatus.IN_REVIEW]: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    indicatorColor: 'bg-indigo-500',
  },
  [ReviewStatus.COMPLETED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  Reviewed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  'Under Review': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    indicatorColor: 'bg-indigo-500',
  },
  Pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicatorColor: 'bg-amber-400',
  },
};

const DEFAULT_STATUS_STYLE = { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', indicatorColor: 'bg-slate-400' };

const RATING_LABEL_TO_SCORE: Record<string, string> = {
  'Outstanding': '5.0',
  'Exceeds Expectations': '4.0',
  'Meets Expectations': '3.0',
  'Needs Improvement': '2.0',
  'Unsatisfactory': '1.0',
};

export const getDisplayAverageRating = (record?: QuarterlyReview | null): string | null => {
  if (!record) return null;

  // The final rating must only be displayed after the manager has submitted/completed the review
  const isManagerReviewed =
    record.reviewStatus === ReviewStatus.REVIEWED ||
    record.reviewStatus === ReviewStatus.COMPLETED ||
    record.status === ReviewStatus.COMPLETED ||
    record.status === ReviewStatus.APPROVED ||
    record.status === ReviewStatus.REVIEWED;

  if (!isManagerReviewed) {
    return null;
  }

  // 1. If manager category ratings exist, compute the exact average score
  const ratings = record.ratings;
  if (ratings) {
    let parsed: any = ratings;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { }
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const ratingValues = Object.values(parsed).map(Number).filter((rating) => !isNaN(rating) && rating > 0);
      if (ratingValues.length > 0) {
        return (ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length).toFixed(1);
      }
    }
  }

  // 2. If finalRating is a number or numeric string (e.g. "4.0", 4.5)
  if (record.finalRating != null && record.finalRating !== '') {
    const rawStr = String(record.finalRating).trim();
    const num = parseFloat(rawStr);
    if (!isNaN(num)) {
      return num.toFixed(1);
    }
    // 3. If finalRating is a label (e.g. "Unsatisfactory", "Exceeds Expectations")
    if (RATING_LABEL_TO_SCORE[rawStr]) {
      return RATING_LABEL_TO_SCORE[rawStr];
    }
  }

  return null;
};

export const StatusBadge: React.FC<{
  status?: string | null;
  showStatusIndicator?: boolean;
}> = ({ status, showStatusIndicator = true }) => {
  if (!status) {
    return <span className="text-slate-400 text-base">—</span>;
  }

  const style = STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${style.bg} ${style.text} ${style.border}`}
    >
      {showStatusIndicator && (
        <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${style.indicatorColor}`} />
      )}
      {status}
    </span>
  );
};

// Small circular icon-button used in the history table's Action column.
const RowIconButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  tone?: 'default' | 'indigo' | 'withdraw';
}> = ({ icon, onClick, disabled, tooltip, tone = 'default' }) => (
  <Tooltip title={tooltip}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0
        ${disabled
          ? 'text-slate-300 cursor-not-allowed'
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

// Stat card used in the top summary row (Submission Status / Due Date / Review Status / Final Rating).
// Every card shares one visual language: a tinted circular icon avatar, an
// uppercase label, a bold value, and a muted subtext line underneath.
const StatCard: React.FC<{
  icon: React.ReactNode;
  accent: 'blue' | 'emerald' | 'indigo' | 'amber';
  label: string;
  value: React.ReactNode;
  subtext: React.ReactNode;
  delay?: number;
}> = ({ icon, accent, label, value, subtext, delay = 0 }) => {
  const accentMap = {
    blue: { iconBg: 'bg-blue-50' },
    emerald: { iconBg: 'bg-emerald-50' },
    indigo: { iconBg: 'bg-indigo-50' },
    amber: { iconBg: 'bg-amber-50' },
  }[accent];

  return (
    <div
      className="relative overflow-hidden stat-card-animate group bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm
transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={`${accentMap.iconBg} w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
        <p className="text-xs text-darkgray-400 font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <div className="mt-2 min-h-[28px] flex items-center">{value}</div>
      <p className="text-xs text-slate-400 mt-1.5">{subtext}</p>
    </div>
  );
};

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

  const isManager = location.pathname.startsWith('/manager-dashboard');
  const isAdmin = location.pathname.startsWith('/admin-dashboard');
  const basePath = isManager ? '/manager-dashboard' : isAdmin ? '/admin-dashboard' : '/employee-dashboard';
  const reviewPath = isManager || isAdmin ? `${basePath}/review` : `${basePath}/quarterly-review`;

  const [reviews, setReviews] = useState<QuarterlyReview[]>([]);
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fyOptions, setFyOptions] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [summaryData, setSummaryData] = useState<QuarterlyReviewSummary | null>(null);
  const [fyLoading, setFyLoading] = useState(false);
  const [quarterFilterLoading, setQuarterFilterLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Request Access state
  const [requestAccessModalOpen, setRequestAccessModalOpen] = useState(false);
  const [selectedRecordForRequest, setSelectedRecordForRequest] = useState<QuarterlyReview | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const fetchDashboardData = async (fyFilter?: string, qFilter?: string) => {
    try {
      setLoading(true);
      const fyVal = fyFilter !== undefined ? fyFilter : selectedFY;
      const qVal = qFilter !== undefined ? qFilter : selectedQuarter;
      const filterPayload = {
        financialYear: fyVal ? fyVal.replace('FY ', 'FY') : undefined,
        quarter: qVal || undefined,
      };

      const [quarterResponse, reviewsResult, myAssignments] = await Promise.all([
        dispatch(getCurrentQuarter()).unwrap().catch(() => ''),
        dispatch(getAllReviews(filterPayload)).unwrap().catch(() => [] as any),
        dispatch(fetchMyReviewAssignments()).unwrap().catch(() => [] as ReviewAssignment[]),
      ]);
      const resolvedQuarter = quarterResponse ?? '';
      setCurrentQuarter(resolvedQuarter);

      const safeReviews: QuarterlyReview[] = Array.isArray(reviewsResult)
        ? reviewsResult
        : (reviewsResult?.reviews || []);
      const summary = (reviewsResult as any)?.summary || null;
      setSummaryData(summary);

      const safeAssignments = Array.isArray(myAssignments) ? myAssignments : [];
      setAssignments(safeAssignments);

      const uniqueFYs = Array.from(
        new Set(safeReviews.map((reviewRecord) => reviewRecord.financialYear || getFinancialYear(reviewRecord.quarter)).filter((financialYear) => financialYear && financialYear !== '—'))
      ).sort((financialYearA, financialYearB) => financialYearB.localeCompare(financialYearA));
      if (uniqueFYs.length > 0) {
        setFyOptions((prev) => Array.from(new Set([...prev, ...uniqueFYs])));
      }

      setReviews(safeReviews);
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to load quarterly reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dispatch]);

  const handleFYChange = async (financialYear: string) => {
    setSelectedFY(financialYear);
    setFyLoading(true);
    try {
      const filterPayload = {
        financialYear: financialYear ? financialYear.replace('FY ', 'FY') : undefined,
        quarter: selectedQuarter || undefined,
      };
      const res: any = await dispatch(getAllReviews(filterPayload)).unwrap();
      const safeReviews = Array.isArray(res) ? res : (res?.reviews || []);
      setReviews(safeReviews);
      setSummaryData(res?.summary || null);
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to filter reviews.');
    } finally {
      setFyLoading(false);
    }
  };

  const handleQuarterChange = async (quarterVal: string) => {
    setSelectedQuarter(quarterVal);
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
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to filter reviews.');
    } finally {
      setQuarterFilterLoading(false);
    }
  };

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedReviewForWithdraw, setSelectedReviewForWithdraw] = useState<QuarterlyReview | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [downloadingQuarter, setDownloadingQuarter] = useState<string | null>(null);

  const handleOpenWithdrawModal = (record: QuarterlyReview) => {
    setSelectedReviewForWithdraw(record);
    setWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedReviewForWithdraw) return;
    try {
      setWithdrawLoading(true);
      const idOrQuarter = selectedReviewForWithdraw.id ?? selectedReviewForWithdraw.quarter;
      const res = await dispatch(withdrawQuarterlyReview(idOrQuarter)).unwrap();
      messageApi.success(res?.message || 'Quarterly review withdrawn successfully.');
      setWithdrawModalOpen(false);
      setSelectedReviewForWithdraw(null);

      // Refresh reviews list
      const financialYearParam = selectedFY ? selectedFY.replace('FY ', 'FY') : undefined;
      const updated = await dispatch(getAllReviews(financialYearParam)).unwrap();
      setReviews(updated);

      const uniqueFYs = Array.from(
        new Set(updated.map((reviewRecord) => getFinancialYear(reviewRecord.quarter)).filter((financialYear) => financialYear !== '—'))
      ).sort((financialYearA, financialYearB) => financialYearB.localeCompare(financialYearA));
      setFyOptions(uniqueFYs);
    } catch (err: any) {
      messageApi.error(err || 'Failed to withdraw quarterly review.');
    } finally {
      setWithdrawLoading(false);
    }
  };

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
    setRequestReason('I was unable to complete my quarterly review. Please provide me access again.');
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

  // Switch to Mobile/Tablet component if viewport width is < 1024px
  if (isMobileOrTablet) {
    return (
      <>
        {contextHolder}
        <MobileEmployeeAppraisalDashboard
          reviews={reviews}
          currentQuarter={currentQuarter}
          loading={loading}
          fyOptions={fyOptions}
          selectedFY={selectedFY}
          selectedQuarter={selectedQuarter}
          summaryData={summaryData}
          fyLoading={fyLoading}
          onFYChange={handleFYChange}
          onQuarterChange={handleQuarterChange}
          onWithdraw={handleOpenWithdrawModal}
          onDownload={handleDownloadPdf}
        />
        <Modal
          open={withdrawModalOpen}
          onCancel={() => {
            if (!withdrawLoading) {
              setWithdrawModalOpen(false);
              setSelectedReviewForWithdraw(null);
            }
          }}
          footer={null}
          centered
          destroyOnClose
          width={420}
        >
          <div className="p-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Withdraw Quarterly Review?
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Are you sure you want to withdraw your quarterly review for{' '}
              <span className="font-semibold text-slate-800">
                {selectedReviewForWithdraw?.quarter}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={withdrawLoading}
                onClick={() => {
                  setWithdrawModalOpen(false);
                  setSelectedReviewForWithdraw(null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawLoading}
                onClick={handleConfirmWithdraw}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-60 flex items-center gap-2"
              >
                {withdrawLoading ? (
                  <>
                    <Spin size="small" className="text-white" />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Withdraw Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Find active assignment
  const activeAssignment = assignments.find(
    (assignmentItem) => assignmentItem.isAccessOpen && (assignmentItem.status === 'ASSIGNED' || assignmentItem.status === 'IN_PROGRESS' || assignmentItem.status === 'DRAFT')
  );

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

  const columns = [
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: '9%',
      render: (quarterName: string, record: QuarterlyReview) => (
        <span className="font-semibold text-slate-900 text-sm">{record.quarterCode || (quarterName?.split(' ')[0] ?? quarterName)}</span>
      ),
    },
    {
      title: 'Financial Year',
      key: 'fy',
      width: '13%',
      render: (_value: any, reviewRecord: QuarterlyReview) => (
        <span className="font-semibold text-slate-800 text-sm">{reviewRecord.financialYear || getFinancialYear(reviewRecord.quarter)}</span>
      ),
    },
    {
      title: 'Assigned By',
      key: 'assignedBy',
      width: '18%',
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
      title: 'Submission Status',
      key: 'submissionStatus',
      width: '14%',
      render: (_value: any, record: QuarterlyReview) => {
        const status =
          record.submissionStatus ||
          (record.status === ReviewStatus.SUBMITTED || record.status === ReviewStatus.COMPLETED || record.status === ReviewStatus.APPROVED
            ? 'Submitted'
            : record.status === ReviewStatus.DRAFT
              ? 'Draft'
              : 'Not Started');
        return <StatusBadge status={status} showStatusIndicator={true} />;
      },
    },
    {
      title: 'Deadline',
      key: 'deadline',
      width: '13%',
      render: (_value: any, record: QuarterlyReview) => {
        const isSubmitted =
          record.submissionStatus === 'Submitted' ||
          record.status === ReviewStatus.SUBMITTED ||
          record.status === ReviewStatus.COMPLETED ||
          record.status === ReviewStatus.APPROVED;

        if (isSubmitted || record.deadline === '-') {
          return <span className="text-slate-400 text-sm font-medium">-</span>;
        }

        const displayDeadline = record.deadline || record.displayDeadline;
        if (displayDeadline && displayDeadline !== '-') {
          return (
            <span className="text-slate-700 text-sm font-medium">
              {displayDeadline}
            </span>
          );
        }

        return <span className="text-slate-400 text-sm">-</span>;
      },
    },
    {
      title: 'Review Status',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: '13%',
      render: (statusValue: string | null, record: QuarterlyReview) => {
        const isDraftOrNotStarted =
          record.submissionStatus === 'Draft' ||
          record.submissionStatus === 'Not Started' ||
          record.status === ReviewStatus.DRAFT ||
          record.status === ReviewStatus.NOT_STARTED;

        if (isDraftOrNotStarted || !statusValue) {
          return <span className="text-slate-400 text-sm">—</span>;
        }
        return <StatusBadge status={statusValue} showStatusIndicator={false} />;
      },
    },
    {
      title: 'Final Rating',
      dataIndex: 'finalRating',
      key: 'finalRating',
      width: '12%',
      render: (_value: any, record: QuarterlyReview) => {
        const isEvaluated = Boolean(
          (record as any).hasFinalRating ||
          record.reviewStatus === ReviewStatus.REVIEWED ||
          record.reviewStatus === ReviewStatus.COMPLETED ||
          record.status === ReviewStatus.COMPLETED ||
          record.status === ReviewStatus.APPROVED ||
          record.finalRating
        );

        if (!isEvaluated) {
          return <span className="text-slate-400 text-sm font-medium">—</span>;
        }

        const avgRating = record.finalRating || record.quarterRating || getDisplayAverageRating(record);
        return (
          <HiddenRatingBadge
            reviewId={record.id}
            quarter={record.quarter}
            finalRating={avgRating}
            isFinalRatingHidden={(record as any).isFinalRatingHidden}
            hasFinalRating={true}
          />
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: '16%',
      render: (_value: any, record: QuarterlyReview) => {
        const isSubmitted =
          record.status === ReviewStatus.SUBMITTED ||
          record.status === ReviewStatus.COMPLETED ||
          record.submissionType === 'AUTO';
        const isCompleted =
          record.reviewStatus === ReviewStatus.COMPLETED ||
          record.reviewStatus === ReviewStatus.REVIEWED ||
          record.status === ReviewStatus.APPROVED ||
          record.status === ReviewStatus.COMPLETED;
        const isNotSubmitted =
          record.status === ReviewStatus.NOT_STARTED ||
          record.status === ReviewStatus.DRAFT ||
          record.submissionStatus === 'Not Started' ||
          record.submissionStatus === 'Draft';
        const hasAccessOpen = Boolean((record as any).assignment?.isAccessOpen || (record as any).accessGranted);
        const isEditable = (!isSubmitted && !isCompleted && isNotSubmitted) || hasAccessOpen;

        const accessRequestCountdown = getAccessRequestCountdown(
          record.submittedDate,
          record.accessRequestEligibleUntil
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
                onClick={async () => {
                  if (record.status === ReviewStatus.NOT_STARTED || record.submissionStatus === 'Not Started') {
                    try {
                      await dispatch(startEditQuarterlyReview(record.quarter)).unwrap();
                    } catch (startEditError) {
                      console.warn('Could not mark review as draft', startEditError);
                    }
                  }
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
            {isSubmitted && accessRequestCountdown?.isEligible && (
              <Tooltip title={accessRequestCountdown.text}>
                <button
                  type="button"
                  onClick={() => handleOpenRequestAccess(record)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors flex items-center gap-1 shrink-0"
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Request Access</span>
                </button>
              </Tooltip>
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

            {/* Active Assignment Alert / Card (if any pending assignment exists) */}
            {activeAssignment && (
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Assigned Review: {activeAssignment.quarter}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                        Assigned by {activeAssignment.assignedByName || activeAssignment.assignedByRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Complete by {formatDeadlineDate(activeAssignment.deadlineAt) || 'the assigned deadline'}: {getDeadlineCountdown(activeAssignment.deadlineAt)?.text}
                    </p>
                  </div>
                </div>

                <Button
                  type="primary"
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white !font-semibold !rounded-xl !h-9 !px-4"
                  onClick={async () => {
                    try {
                      await dispatch(startEditQuarterlyReview(activeAssignment.quarter)).unwrap();
                    } catch (startEditError) {
                      console.warn('Could not mark review as draft', startEditError);
                    }
                    navigate(`${reviewPath}/${quarterToSlug(activeAssignment.quarter)}`);
                  }}
                >
                  Fill Review
                </Button>
              </div>
            )}

            {/* Main Content */}
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              {/* Current Quarter bar */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shrink-0 flex items-center justify-between gap-4">
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
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                {/* 1. Review Status Card (Kept) */}
                <StatCard
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
                />

                {/* 2. Quarter Rating Card */}
                <StatCard
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
                />

                {/* 3. Year Rating Card */}
                <StatCard
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
                />
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
                        value={selectedFY || undefined}
                        onChange={handleFYChange}
                        loading={fyLoading}
                        placeholder="Financial Year"
                        allowClear
                        variant="outlined"
                        prefix={<Calendar className="w-4 h-4 text-indigo-500" />}
                        popupMatchSelectWidth
                        style={{ width: 160 }}
                        options={fyOptions.map((financialYear) => ({
                          label: financialYear,
                          value: financialYear,
                        }))}
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
                      style={{ width: 120 }}
                      options={[
                        { label: 'Q1', value: 'Q1' },
                        { label: 'Q2', value: 'Q2' },
                        { label: 'Q3', value: 'Q3' },
                        { label: 'Q4', value: 'Q4' },
                      ]}
                    />
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="overflow-x-auto table-scroll-area">
                    <style>{`
                .custom-table .ant-table {
                  background: transparent;
                  table-layout: fixed;
                  width: 100%;
                }
                .custom-table .ant-table-thead > tr > th {
                  background: #EEF2FF;
                  color: #6366F1;
                  font-size: 11px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.03em;
                  padding: 9px 16px;
                  border-bottom: none;
                  white-space: nowrap;
                  line-height: 1.3;
                  vertical-align: middle;
                }
                .custom-table .ant-table-thead > tr > th::before {
                  display: none;
                }
                .custom-table .ant-table-tbody > tr > td {
                  padding: 10px 16px;
                  font-size: 13px;
                  border-bottom: 1px solid #F1F5F9;
                  background: #ffffff;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .custom-table .ant-table-tbody > tr:last-child > td {
                  border-bottom: none;
                }
                .custom-table .ant-table-tbody > tr:hover > td {
                  background: #F8FAFC !important;
                }
                .table-scroll-area {
                  scrollbar-width: thin;
                  scrollbar-color: transparent transparent;
                }
                .table-scroll-area:hover {
                  scrollbar-color: #CBD5E1 transparent;
                }
                .table-scroll-area::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                .table-scroll-area::-webkit-scrollbar-thumb {
                  background-color: transparent;
                  border-radius: 4px;
                }
                .table-scroll-area:hover::-webkit-scrollbar-thumb {
                  background-color: #CBD5E1;
                }
                .table-scroll-area::-webkit-scrollbar-track {
                  background: transparent;
                }
              `}</style>
                    <Table
                      columns={columns}
                      dataSource={reviews}
                      loading={fyLoading}
                      rowKey={(reviewItem) => reviewItem.quarter}
                      pagination={false}
                      size="middle"
                      tableLayout="fixed"
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

          <div className="mb-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              After the deadline is completed (or after you submit), you have 24 hours to request access again. Your manager, admin, or CEO must approve it before the form reopens.
            </span>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Request:
            </label>
            <textarea
              rows={3}
              value={requestReason}
              onChange={(changeEvent) => setRequestReason(changeEvent.target.value)}
              placeholder="E.g., I was unable to complete my quarterly review. Please provide me access again."
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
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

      {/* Withdraw Confirmation Modal */}
      <Modal
        open={withdrawModalOpen}
        onCancel={() => {
          if (!withdrawLoading) {
            setWithdrawModalOpen(false);
            setSelectedReviewForWithdraw(null);
          }
        }}
        footer={null}
        centered
        destroyOnClose
        width={420}
      >
        <div className="p-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Withdraw Quarterly Review?
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Are you sure you want to withdraw your quarterly review for{' '}
            <span className="font-semibold text-slate-800">
              {selectedReviewForWithdraw?.quarter}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={withdrawLoading}
              onClick={() => {
                setWithdrawModalOpen(false);
                setSelectedReviewForWithdraw(null);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={withdrawLoading}
              onClick={handleConfirmWithdraw}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {withdrawLoading ? (
                <>
                  <Spin size="small" className="text-white" />
                  <span>Withdrawing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Withdraw Review</span>
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