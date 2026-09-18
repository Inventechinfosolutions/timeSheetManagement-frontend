import { HiddenRatingBadge } from '../../components/HiddenRatingBadge';
import React from 'react';
import { Spin, Tooltip, Select, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  Edit3,
  Eye,
  Clock,
  Calendar,
  ClipboardList,
  BarChart3,
  Download,
  Key,
  User,
  ChevronDown,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  ReviewStatus,
  AppraisalReviewStatus,
  FormMode,
  AccessRequestStatus,
  SubmissionType,
  REVIEW_STATUS_FILTER_OPTIONS,
  QuarterFilter,
} from '../enums/Appraisal.enums';
import { QuarterlyReview } from '../types/Appraisal.types';
import EmptyReviewImage from '../../../assets/EmptyReviewImage.png';
import { getFinancialYear, quarterToSlug } from '../utils/fyQuarter.utils';
import { formatQuarterWithDateRange, QuarterDropdownOption } from '../../../master/financialYear.master';
import {
  StatusBadge,
  getDisplayAverageRating,
  getReviewDisplayStatus,
  getAccessRequestCountdown,
  formatDeadlineRemaining,
  StatCard,
} from '../utils/appraisalHelpers';
import './MobileEmployeeAppraisalDashboard.css';

export interface MobileEmployeeAppraisalDashboardProps {
  reviews: QuarterlyReview[];
  loading: boolean;
  fyOptions: string[];
  selectedFY: string;
  selectedQuarter?: string;
  selectedReviewStatus?: string;
  quarterOptions?: QuarterDropdownOption[];
  deadlineAlertQuarters: QuarterlyReview[];
  hasCurrentYearRating: boolean;
  normalizedTargetYear: string;
  targetYear: string;
  currentYearRatingScore: number | null;
  isCurrentYearRatingHidden?: boolean;
  academicYearRating: string | null;
  isAcademicRatingHidden?: boolean;
  fyLoading?: boolean;
  quarterFilterLoading?: boolean;
  downloadingQuarter?: string | null;
  reviewPath: string;
  onFYChange: (financialYear?: string) => void;
  onQuarterChange: (quarter?: string) => void;
  onReviewStatusChange: (status?: string) => void;
  onDownload?: (record: QuarterlyReview) => void;
  onOpenRequestAccess?: (record: QuarterlyReview) => void;
  onFillReview?: (quarter: string) => Promise<void>;
}

/* ---------- Reusable Button & Stat Components ---------- */

const CircleIconButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  tone?: 'outline' | 'filled';
  disabled?: boolean;
}> = ({ icon, onClick, tooltip, tone = 'outline', disabled = false }) => (
  <Tooltip title={tooltip}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mobile-circle-btn mobile-circle-btn-${tone} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
    </button>
  </Tooltip>
);

const StatColumn: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="mobile-review-statcol">
    <p className="mobile-review-statcol-label">{label}</p>
    <div className="mobile-review-statcol-value">{children}</div>
  </div>
);

const ReviewCard: React.FC<{
  record: QuarterlyReview;
  reviewPath: string;
  downloadingQuarter?: string | null;
  onView: () => void;
  onEdit: () => void;
  onDownload?: () => void;
  onOpenRequestAccess?: () => void;
}> = ({
  record,
  downloadingQuarter,
  onView,
  onEdit,
  onDownload,
  onOpenRequestAccess,
}) => {
    const statusLower = String(record.status || '').trim().toLowerCase();
    const subStatusLower = String(record.submissionStatus || '').trim().toLowerCase();
    const revStatusLower = String(record.reviewStatus || '').trim().toLowerCase();
    const displayStatus = getReviewDisplayStatus(record);

    const isCompleted =
      displayStatus === AppraisalReviewStatus.REVIEWED ||
      record.reviewStatus === AppraisalReviewStatus.REVIEWED ||
      record.reviewStatus === ReviewStatus.REVIEWED ||
      record.status === ReviewStatus.REVIEWED ||
      statusLower === ReviewStatus.REVIEWED.toLowerCase();

    const isSubmitted =
      !isCompleted &&
      (statusLower === ReviewStatus.SUBMITTED.toLowerCase() ||
        statusLower === ReviewStatus.AUTO_SUBMITTED.toLowerCase() ||
        statusLower === AppraisalReviewStatus.AWAITING_REVIEW.toLowerCase() ||
        subStatusLower === ReviewStatus.SUBMITTED.toLowerCase() ||
        subStatusLower === ReviewStatus.AUTO_SUBMITTED.toLowerCase() ||
        revStatusLower === AppraisalReviewStatus.AWAITING_REVIEW.toLowerCase() ||
        record.submissionType === SubmissionType.AUTO ||
        record.submissionType === SubmissionType.MANUAL ||
        record.autoSubmitted === 1 ||
        Boolean(record.submittedDate) ||
        displayStatus === AppraisalReviewStatus.AWAITING_REVIEW);

    const isNotSubmitted =
      !isSubmitted &&
      !isCompleted &&
      (record.status === ReviewStatus.NOT_STARTED ||
        record.status === ReviewStatus.DRAFT ||
        record.status === ReviewStatus.INITIAL ||
        statusLower === ReviewStatus.INITIAL.toLowerCase() ||
        statusLower === ReviewStatus.DRAFT.toLowerCase() ||
        statusLower === AppraisalReviewStatus.ASSIGNED.toLowerCase() ||
        record.submissionStatus === ReviewStatus.NOT_STARTED ||
        record.submissionStatus === ReviewStatus.DRAFT);

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

    const isEvaluated = displayStatus === AppraisalReviewStatus.REVIEWED;
    const evaluatedAverageRating = isEvaluated
      ? record.finalRating || record.quarterRating || getDisplayAverageRating(record)
      : null;

    return (
      <div className="mobile-review-card">
        <div className="mobile-review-card-top">
          <div className="mobile-review-card-heading">
            <p className="mobile-review-quarter-line">
              {formatQuarterWithDateRange(record.quarterCode || record.quarter, record.financialYear)}
              <span className="mobile-review-fy-inline">
                {' '}
                · {record.financialYear || getFinancialYear(record.quarter)}
              </span>
            </p>

            <p className="mobile-review-manager-line">
              <User className="mobile-review-manager-icon" />
              Submitted to {record.managerName || (typeof window !== 'undefined' && window.location.pathname.startsWith('/manager-dashboard') ? 'CEO & Admin' : '—')}
            </p>
          </div>

          <div className="mobile-review-card-actions">
            {/* View Button */}
            <CircleIconButton
              icon={<Eye className="w-4 h-4" />}
              tooltip="View Review"
              tone="outline"
              onClick={onView}
            />

            {/* Edit / Start Review Button */}
            {isEditable && (
              <CircleIconButton
                icon={<Edit3 className="w-4 h-4" />}
                tooltip={
                  record.status === ReviewStatus.NOT_STARTED || record.submissionStatus === ReviewStatus.NOT_STARTED
                    ? 'Start Review'
                    : 'Edit Review'
                }
                tone="filled"
                onClick={onEdit}
              />
            )}

            {/* Download PDF Button */}
            {isCompleted && onDownload && (
              <CircleIconButton
                icon={downloadingQuarter === record.quarter ? <Spin size="small" /> : <Download className="w-4 h-4" />}
                tooltip="Download PDF"
                tone="outline"
                disabled={downloadingQuarter === record.quarter}
                onClick={onDownload}
              />
            )}

            {/* 24-Hour Request Access Button */}
            {isSubmitted && !hasAccessOpen && onOpenRequestAccess && (
              (() => {
                const req = (record as any).accessRequest;
                const isPending = req?.status === AccessRequestStatus.PENDING;
                const isRejected = req?.status === AccessRequestStatus.REJECTED;
                const canRetry = req ? req.canReRequest && req.totalAttempts < 2 : true;

                if (isPending) {
                  return (
                    <Tooltip title={`Access Request Pending Approval (Attempt ${req.attemptNumber || 1} of 2)`}>
                      <button
                        type="button"
                        disabled
                        className="mobile-circle-btn mobile-circle-btn-outline !border-amber-300 !bg-amber-50 text-amber-600 opacity-70 cursor-not-allowed"
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
                        className="mobile-circle-btn mobile-circle-btn-outline !border-rose-200 !bg-rose-50 text-rose-400 opacity-50 cursor-not-allowed"
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
                        onClick={onOpenRequestAccess}
                        className="mobile-circle-btn mobile-circle-btn-outline !border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors shadow-sm cursor-pointer"
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
                        className="mobile-circle-btn mobile-circle-btn-outline !border-slate-200 !bg-slate-50 text-slate-400 opacity-40 cursor-not-allowed"
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
        </div>

        <div className="mobile-review-statrow">
          <StatColumn label="Reviewed On">
            {record.reviewedOn ? new Date(record.reviewedOn).toLocaleDateString('en-IN') : '—'}
          </StatColumn>

          <StatColumn label="Final Rating">
            {isEvaluated && evaluatedAverageRating !== null ? (
              <HiddenRatingBadge
                reviewId={record.id}
                quarter={record.quarter}
                finalRating={evaluatedAverageRating}
                ratings={record.ratings}
                isFinalRatingHidden={(record as any).isFinalRatingHidden}
                hasFinalRating={true}
              />
            ) : (
              '—'
            )}
          </StatColumn>

          <StatColumn label="Status">
            <div className="flex flex-col items-start gap-0.5">
              <StatusBadge status={displayStatus} showStatusIndicator={false} />
            </div>
          </StatColumn>
        </div>
      </div>
    );
  };

/* ---------- Main Component ---------- */

const MobileEmployeeAppraisalDashboard: React.FC<MobileEmployeeAppraisalDashboardProps> = ({
  reviews,
  loading,
  fyOptions,
  selectedFY,
  selectedQuarter,
  selectedReviewStatus,
  quarterOptions,
  deadlineAlertQuarters,
  hasCurrentYearRating,
  normalizedTargetYear,
  targetYear,
  currentYearRatingScore,
  isCurrentYearRatingHidden,
  academicYearRating,
  isAcademicRatingHidden,
  fyLoading = false,
  quarterFilterLoading = false,
  downloadingQuarter = null,
  reviewPath,
  onFYChange,
  onQuarterChange,
  onReviewStatusChange,
  onDownload,
  onOpenRequestAccess,
  onFillReview,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="mobile-spinner-container">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <div className="mobile-dashboard-container">
      {/* Top Header (Matches Desktop) */}
      <div className="mobile-top-header">
        <div className="mobile-top-header-row">
          <div>
            <h1 className="mobile-title">Quarterly Review</h1>
            <p className="mobile-subtitle">
              Complete authorized quarterly review assignments and track your performance appraisals.
            </p>
          </div>
        </div>
      </div>

      {/* Deadline Alert Card (When any assigned review deadline is within 24 hours) */}
      {deadlineAlertQuarters.length > 0 && (
        <div className="min-w-0 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 shadow-md flex flex-col gap-2.5">
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

          <div className="flex flex-col gap-2">
            {deadlineAlertQuarters.map((reviewRecord) => {
              const rawDeadline = reviewRecord.deadlineAt || (reviewRecord.assignment as any)?.deadlineAt;
              const remainingTimeText = rawDeadline ? formatDeadlineRemaining(rawDeadline) : '';
              return (
                <div
                  key={reviewRecord.quarter}
                  className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border bg-white border-red-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-sm font-semibold truncate text-slate-800">
                      {formatQuarterWithDateRange(reviewRecord.quarterCode || reviewRecord.quarter, reviewRecord.financialYear)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {reviewRecord.financialYear || getFinancialYear(reviewRecord.quarter)}
                    </span>
                    {remainingTimeText && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 whitespace-nowrap shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {remainingTimeText}
                      </span>
                    )}
                  </div>

                  <Button
                    type="primary"
                    size="small"
                    className="!bg-red-500 hover:!bg-red-600 !text-white !font-semibold !rounded-lg !h-7 !px-3 shrink-0"
                    onClick={() => {
                      if (onFillReview) {
                        onFillReview(reviewRecord.quarter);
                      } else {
                        navigate(`${reviewPath}/${quarterToSlug(reviewRecord.quarter)}`);
                      }
                    }}
                  >
                    Fill
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Rating Card: Only Current Year Rating */}
      <div className="grid grid-cols-1 gap-3.5">
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
                navigateOnSuccess={true}
              />
            ) : (
              <span className="text-2xl font-bold text-slate-400">—</span>
            )
          }
          subtext={hasCurrentYearRating ? `Overall rating for ${targetYear}` : 'Not Available'}
          delay={80}
        />
      </div>

      {/* Quarterly Review History Section (Matches Desktop) */}
      <div className="mobile-history-container">
        <div className="mobile-history-header">
          <div className="mobile-history-title-group">
            <span className="mobile-history-icon-bg">
              <BarChart3 style={{ width: 14, height: 14 }} />
            </span>
            <h2 className="mobile-history-title">Quarterly Review History</h2>
          </div>
        </div>

        {/* Filter Controls (Financial Year, Quarter, Status) */}
        <div className="mobile-filter-wrapper flex gap-2 flex-wrap">
          {fyOptions.length > 0 && (
            <Select
              className="mobile-filter-select flex-1 min-w-[130px]"
              allowClear
              value={selectedFY === QuarterFilter.ALL ? undefined : (selectedFY || undefined)}
              onChange={(val) => onFYChange(val || QuarterFilter.ALL)}
              loading={fyLoading}
              placeholder="Financial Year"
              variant="outlined"
              prefix={<Calendar className="w-4 h-4 text-indigo-500 shrink-0" />}
              popupMatchSelectWidth
              options={[
                { label: 'All Years', value: QuarterFilter.ALL },
                ...fyOptions.map((financialYearOption) => ({
                  label: financialYearOption,
                  value: financialYearOption,
                })),
              ]}
            />
          )}

          <Select
            className="mobile-filter-select flex-1 min-w-[100px]"
            allowClear
            value={selectedQuarter || undefined}
            onChange={onQuarterChange}
            loading={quarterFilterLoading}
            placeholder="Quarter"
            variant="outlined"
            prefix={<Clock className="w-4 h-4 text-indigo-500 shrink-0" />}
            popupMatchSelectWidth
            options={(quarterOptions || []).map((opt) => ({
              label: opt.label,
              value: opt.code,
            }))}
          />

          <Select
            className="mobile-filter-select flex-1 min-w-[130px]"
            allowClear
            value={selectedReviewStatus || undefined}
            onChange={onReviewStatusChange}
            placeholder="Status"
            variant="outlined"
            prefix={<ClipboardList className="w-4 h-4 text-indigo-500 shrink-0" />}
            popupMatchSelectWidth
            options={REVIEW_STATUS_FILTER_OPTIONS}
          />
        </div>

        {/* Review Cards List */}
        {reviews.length > 0 ? (
          <div className="mobile-card-list">
            {fyLoading ? (
              <div className="flex justify-center py-8">
                <Spin size="small" />
              </div>
            ) : (
              reviews.map((reviewRecord) => (
                <ReviewCard
                  key={reviewRecord.quarter}
                  record={reviewRecord}
                  reviewPath={reviewPath}
                  downloadingQuarter={downloadingQuarter}
                  onView={() =>
                    navigate(`${reviewPath}/${quarterToSlug(reviewRecord.quarter)}?mode=${FormMode.VIEW}`)
                  }
                  onEdit={async () => {
                    if (onFillReview) {
                      await onFillReview(reviewRecord.quarter);
                    } else {
                      navigate(`${reviewPath}/${quarterToSlug(reviewRecord.quarter)}`);
                    }
                  }}
                  onDownload={onDownload ? () => onDownload(reviewRecord) : undefined}
                  onOpenRequestAccess={onOpenRequestAccess ? () => onOpenRequestAccess(reviewRecord) : undefined}
                />
              ))
            )}
          </div>
        ) : (
          <div className="mobile-empty-state">
            <img
              src={EmptyReviewImage}
              alt="No quarterly reviews found"
              className="mobile-empty-img"
            />
            <p className="mobile-empty-title">No Reviews Found</p>
            <p className="mobile-empty-subtext">
              You haven't submitted any quarterly reviews yet. Complete your first assigned review to see your history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileEmployeeAppraisalDashboard;