import { HiddenRatingBadge } from '../../components/HiddenRatingBadge';
import React from 'react';
import { Spin, Tooltip, Select } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Edit3,
    Eye,
    Clock,
    Star,
    ClipboardList,
    BarChart3,
    Download,
    Trash2,
    User,
    ChevronDown,
    FileCheck2,
    Award,
} from 'lucide-react';
import { ReviewStatus } from '../enums/Appraisal.enums';
import { QuarterlyReview } from '../types/Appraisal.types';
import EmptyReviewImage from '../../../assets/EmptyReviewImage.png';
import {
    formatQuarterRange,
    formatQuarterEndDate,
    getFinancialYear,
    isQuarterOver,
    quarterToSlug,
} from '../utils/fyQuarter.utils';
import { StatusBadge, getDisplayAverageRating } from '../EmployeeAppraisalDashboard';
import './MobileEmployeeAppraisalDashboard.css';

interface MobileEmployeeAppraisalDashboardProps {
    reviews: QuarterlyReview[];
    currentQuarter: string;
    loading: boolean;
    fyOptions: string[];
    selectedFY: string;
    selectedQuarter?: string;
    summaryData?: any;
    fyLoading: boolean;
    onFYChange: (financialYear: string) => void;
    onQuarterChange?: (quarter: string) => void;
    onWithdraw?: (record: QuarterlyReview) => void;
    onDownload?: (record: QuarterlyReview) => void;
}

/* ---------- Small building blocks ---------- */

const CircleIconButton: React.FC<{
    icon: React.ReactNode;
    onClick: () => void;
    tooltip: string;
    tone?: 'outline' | 'filled' | 'withdraw';
}> = ({ icon, onClick, tooltip, tone = 'outline' }) => (
    <Tooltip title={tooltip}>
        <button
            type="button"
            onClick={onClick}
            className={`mobile-circle-btn mobile-circle-btn-${tone}`}
        >
            {icon}
        </button>
    </Tooltip>
);

const InfoRow: React.FC<{
    icon: React.ReactNode;
    iconTone: 'emerald' | 'indigo' | 'amber';
    label: string;
    sublabel: string;
    value: React.ReactNode;
}> = ({ icon, iconTone, label, sublabel, value }) => (
    <div className="mobile-info-row">
        <span className={`mobile-info-icon-bg mobile-info-icon-${iconTone}`}>
            {icon}
        </span>

        <div className="mobile-info-row-content">
            <p className="mobile-info-row-label">{label}</p>
            <p className="mobile-info-row-sublabel">{sublabel}</p>
        </div>

        <div className="mobile-info-row-value">
            {value}
        </div>
    </div>
);

const StatCol: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div className="mobile-review-statcol">
        <p className="mobile-review-statcol-label">{label}</p>
        <div className="mobile-review-statcol-value">
            {children}
        </div>
    </div>
);

const ReviewCard: React.FC<{
    record: QuarterlyReview;
    currentQuarter: string;
    onView: () => void;
    onEdit: () => void;
    onDownload: () => void;
    onWithdraw: () => void;
}> = ({
    record,
    currentQuarter,
    onView,
    onEdit,
    onDownload,
    onWithdraw,
}) => {
        const isEditable =
            record.quarter === currentQuarter &&
            record.status === ReviewStatus.DRAFT;

        const isCompleted =
            record.reviewStatus === ReviewStatus.COMPLETED ||
            record.reviewStatus === ReviewStatus.REVIEWED ||
            record.status === ReviewStatus.APPROVED ||
            record.status === ReviewStatus.COMPLETED;

        const canWithdraw =
            !isCompleted &&
            record.status !== ReviewStatus.DRAFT &&
            record.status !== ReviewStatus.NOT_STARTED;

        return (
            <div className="mobile-review-card">
                <div className="mobile-review-card-top">
                    <div className="mobile-review-card-heading">
                        <p className="mobile-review-quarter-line">
                            {record.quarter?.split(' ')[0] ?? record.quarter}

                            <span className="mobile-review-fy-inline">
                                {' '}
                                · {getFinancialYear(record.quarter)}
                            </span>
                        </p>

                        <p className="mobile-review-manager-line">
                            <User className="mobile-review-manager-icon" />
                            Submitted to {record.managerName || (typeof window !== 'undefined' && window.location.pathname.startsWith('/manager-dashboard') ? 'CEO & Admin' : '—')}
                        </p>
                    </div>

                    <div className="mobile-review-card-actions">
                        <CircleIconButton
                            icon={<Eye className="w-4 h-4" />}
                            tooltip="View"
                            tone="outline"
                            onClick={onView}
                        />

                        {isEditable && (
                            <CircleIconButton
                                icon={<Edit3 className="w-4 h-4" />}
                                tooltip="Edit"
                                tone="outline"
                                onClick={onEdit}
                            />
                        )}

                        {isCompleted && (
                            <CircleIconButton
                                icon={<Download className="w-4 h-4" />}
                                tooltip="Download"
                                tone="outline"
                                onClick={onDownload}
                            />
                        )}

                        {canWithdraw && (
                            <CircleIconButton
                                icon={<Trash2 className="w-4 h-4" />}
                                tooltip="Withdraw"
                                tone="outline"
                                onClick={onWithdraw}
                            />
                        )}
                    </div>
                </div>

                <div className="mobile-review-statrow">
                    <StatCol label="Reviewed On">
                        {record.reviewedOn
                            ? new Date(record.reviewedOn).toLocaleDateString('en-IN')
                            : '—'}
                    </StatCol>

                    <StatCol label="Final Rating">
                        {(() => {
                            const isEvaluated = Boolean(
                                (record as any).hasFinalRating ||
                                record.reviewStatus === ReviewStatus.REVIEWED ||
                                record.reviewStatus === ReviewStatus.COMPLETED ||
                                record.status === ReviewStatus.COMPLETED ||
                                record.status === ReviewStatus.APPROVED ||
                                record.finalRating
                            );
                            if (!isEvaluated) {
                                return '—';
                            }
                            return (
                                <HiddenRatingBadge
                                    reviewId={record.id}
                                    quarter={record.quarter}
                                    finalRating={getDisplayAverageRating(record) || record.finalRating}
                                    isFinalRatingHidden={(record as any).isFinalRatingHidden}
                                    hasFinalRating={true}
                                />
                            );
                        })()}
                    </StatCol>

                    <StatCol label="Review Status">
                        {(() => {
                            const isDraftOrNotStarted =
                                record.status === ReviewStatus.DRAFT ||
                                record.status === ReviewStatus.NOT_STARTED;

                            return !isDraftOrNotStarted && record.reviewStatus ? (
                                <StatusBadge
                                    status={record.reviewStatus}
                                    showStatusIndicator={false}
                                />
                            ) : (
                                '—'
                            );
                        })()}
                    </StatCol>
                </div>
            </div>
        );
    };

/* ---------- Main component ---------- */

const MobileEmployeeAppraisalDashboard: React.FC<
    MobileEmployeeAppraisalDashboardProps
> = ({
    reviews,
    currentQuarter,
    loading,
    fyOptions,
    selectedFY,
    selectedQuarter,
    summaryData,
    fyLoading,
    onFYChange,
    onQuarterChange,
    onWithdraw,
    onDownload,
}) => {
        const navigate = useNavigate();
        const location = useLocation();

        const isManager = location.pathname.startsWith('/manager-dashboard');
        const isAdmin = location.pathname.startsWith('/admin-dashboard');
        const basePath = isManager ? '/manager-dashboard' : isAdmin ? '/admin-dashboard' : '/employee-dashboard';
        const reviewPath = isManager || isAdmin ? `${basePath}/review` : `${basePath}/quarterly-review`;

        if (loading) {
            return (
                <div className="mobile-spinner-container">
                    <Spin size="large" tip="Loading..." />
                </div>
            );
        }

        const currentReview = reviews.find(
            (reviewItem) => reviewItem.quarter === currentQuarter
        );

        const currentStatus = !currentReview
            ? ReviewStatus.NOT_STARTED
            : currentReview.status === ReviewStatus.DRAFT
                ? ReviewStatus.DRAFT
                : ReviewStatus.SUBMITTED;

        const quarterRange =
            formatQuarterRange(currentQuarter);

        const quarterEndDate =
            formatQuarterEndDate(currentQuarter);

        const quarterOver =
            isQuarterOver(currentQuarter);

        return (
            <>
                <div className="mobile-dashboard-container">

                    {/* Top Header */}
                    <div className="mobile-top-header">
                        <div className="mobile-top-header-row">
                            <div>
                                <h1 className="mobile-title">
                                    Quarterly Review
                                </h1>

                                <p className="mobile-subtitle">
                                    Complete assigned quarterly reviews and view your performance appraisal status.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Current Quarter Header Card */}
                    <div className="mobile-quarter-header-card">

                        <div className="mobile-quarter-card-top">

                            <div className="mobile-quarter-fy-row">
                                <p className="mobile-quarter-fy-text">
                                    {getFinancialYear(currentQuarter)}
                                </p>

                                <span className="mobile-badge-tag">
                                    Current Quarter
                                </span>
                            </div>

                            <h2 className="mobile-quarter-title">
                                {currentQuarter?.split(' ')[0] || '—'}

                                {quarterRange && (
                                    <span className="mobile-quarter-range-inline">
                                        {' '}
                                        • {quarterRange}
                                    </span>
                                )}
                            </h2>

                        </div>
                    </div>

                    {/* Current Quarter Summary Stats Card */}
                    <div className="mobile-quarter-card">
                        <div className="mobile-info-rows">

                            <InfoRow
                                icon={
                                    <ClipboardList
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: '#6366f1',
                                        }}
                                    />
                                }
                                iconTone="indigo"
                                label="Review status"
                                sublabel={isManager ? "CEO & Admin evaluation" : "Manager evaluation"}
                                value={
                                    summaryData?.reviewStatus && summaryData.reviewStatus !== '—'
                                        ? summaryData.reviewStatus
                                        : currentReview?.reviewStatus || '—'
                                }
                            />

                            <InfoRow
                                icon={
                                    <Star
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: '#fbbf24',
                                        }}
                                    />
                                }
                                iconTone="amber"
                                label="Quarter rating"
                                sublabel={
                                    summaryData?.hasQuarterRating
                                        ? `Rating for ${selectedQuarter || (summaryData?.targetQuarter ? summaryData.targetQuarter.split(' ')[0] : currentQuarter?.split(' ')[0] || 'Quarter')}`
                                        : 'Not available yet'
                                }
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
                                        '—'
                                    )
                                }
                            />

                            <InfoRow
                                icon={
                                    <Award
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: '#10b981',
                                        }}
                                    />
                                }
                                iconTone="emerald"
                                label="Year rating"
                                sublabel={
                                    summaryData?.hasYearRating
                                        ? `Overall rating for ${summaryData?.targetFY || selectedFY || getFinancialYear(currentQuarter)}`
                                        : 'Not available yet'
                                }
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
                                        '—'
                                    )
                                }
                            />

                        </div>
                    </div>

                    {/* History Section */}
                    <div className="mobile-history-container">

                        <div className="mobile-history-header">

                            <div className="mobile-history-title-group">

                                <span className="mobile-history-icon-bg">
                                    <BarChart3
                                        style={{
                                            width: 14,
                                            height: 14,
                                        }}
                                    />
                                </span>

                                <h2 className="mobile-history-title">
                                    Review History
                                </h2>

                            </div>

                        </div>

                        {/* Financial Year and Quarter Filters */}
                        <div className="mobile-filter-wrapper" style={{ display: 'flex', gap: '8px' }}>

                            {fyOptions.length > 0 && (
                                <Select
                                    className="mobile-filter-select"
                                    allowClear
                                    value={
                                        selectedFY || undefined
                                    }
                                    onChange={onFYChange}
                                    loading={fyLoading}
                                    placeholder="Financial Year"
                                    variant="outlined"
                                    suffixIcon={
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    }
                                    popupMatchSelectWidth
                                    options={fyOptions.map((financialYear) => ({
                                        label: financialYear,
                                        value: financialYear,
                                    }))}
                                />
                            )}

                            <Select
                                className="mobile-filter-select"
                                allowClear
                                value={
                                    selectedQuarter || undefined
                                }
                                onChange={onQuarterChange}
                                placeholder="Quarter"
                                variant="outlined"
                                suffixIcon={
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                }
                                popupMatchSelectWidth
                                options={[
                                    { label: 'Q1', value: 'Q1' },
                                    { label: 'Q2', value: 'Q2' },
                                    { label: 'Q3', value: 'Q3' },
                                    { label: 'Q4', value: 'Q4' },
                                ]}
                            />

                        </div>

                        {/* Review History */}
                        {reviews.length > 0 ? (

                            <div className="mobile-card-list">

                                {fyLoading ? (

                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            padding: '32px 0',
                                        }}
                                    >
                                        <Spin size="small" />
                                    </div>

                                ) : (

                                    reviews.map((record) => (
                                        <ReviewCard
                                            key={record.quarter}
                                            record={record}
                                            currentQuarter={currentQuarter}

                                            onView={() =>
                                                navigate(
                                                    `${reviewPath}/${quarterToSlug(
                                                        record.quarter
                                                    )}?mode=view`
                                                )
                                            }

                                            onEdit={() =>
                                                navigate(
                                                    `${reviewPath}/${quarterToSlug(
                                                        record.quarter
                                                    )}`
                                                )
                                            }

                                            onDownload={() => onDownload && onDownload(record)}

                                            onWithdraw={() => onWithdraw && onWithdraw(record)}
                                        />
                                    ))

                                )}

                            </div>

                        ) : (

                            <div className="mobile-empty-state">

                                <img
                                    src={EmptyReviewImage}
                                    alt="No quarterly reviews"
                                    className="mobile-empty-img"
                                />

                                <p className="mobile-empty-title">
                                    No quarterly reviews found.
                                </p>

                                <p className="mobile-empty-subtext">
                                    Create your first quarterly review to get started.
                                </p>

                            </div>

                        )}

                    </div>
                </div>
            </>
        );
    };

export default MobileEmployeeAppraisalDashboard;