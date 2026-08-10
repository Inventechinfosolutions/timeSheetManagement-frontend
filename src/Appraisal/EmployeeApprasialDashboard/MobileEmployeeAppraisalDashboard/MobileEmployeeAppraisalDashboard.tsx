import React from 'react';
import { Button, Spin, Tooltip, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit3, Eye, Clock, Star, ClipboardList,
    BarChart3, Download, Trash2, User, ChevronDown,
    FileCheck2,
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
import { StatusBadge } from '../EmployeeAppraisalDashboard';
import './MobileEmployeeAppraisalDashboard.css';

interface MobileEmployeeAppraisalDashboardProps {
    reviews: QuarterlyReview[];
    currentQuarter: string;
    loading: boolean;
    fyOptions: string[];
    selectedFY: string;
    fyLoading: boolean;
    onFYChange: (fy: string) => void;
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
        <span className={`mobile-info-icon-bg mobile-info-icon-${iconTone}`}>{icon}</span>
        <div className="mobile-info-row-content">
            <p className="mobile-info-row-label">{label}</p>
            <p className="mobile-info-row-sublabel">{sublabel}</p>
        </div>
        <div className="mobile-info-row-value">{value}</div>
    </div>
);

const StatCol: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="mobile-review-statcol">
        <p className="mobile-review-statcol-label">{label}</p>
        <div className="mobile-review-statcol-value">{children}</div>
    </div>
);

const ReviewCard: React.FC<{
    record: QuarterlyReview;
    currentQuarter: string;
    onView: () => void;
    onEdit: () => void;
    onDownload: () => void;
    onWithdraw: () => void;
}> = ({ record, currentQuarter, onView, onEdit, onDownload, onWithdraw }) => {
    const isEditable =
        record.quarter === currentQuarter &&
        record.status === ReviewStatus.DRAFT;
    const isCompleted =
        record.reviewStatus === ReviewStatus.COMPLETED || record.status === ReviewStatus.APPROVED;
    const isInReview = record.reviewStatus === ReviewStatus.IN_REVIEW;

    return (
        <div className="mobile-review-card">
            <div className="mobile-review-card-top">
                <div className="mobile-review-card-heading">
                    <p className="mobile-review-quarter-line">
                        {record.quarter?.split(' ')[0] ?? record.quarter}
                        <span className="mobile-review-fy-inline"> · {getFinancialYear(record.quarter)}</span>
                    </p>
                    <p className="mobile-review-manager-line">
                        <User className="mobile-review-manager-icon" />
                        Submitted to {record.managerName ?? '—'}
                    </p>
                </div>

                <div className="mobile-review-card-actions">
                    <CircleIconButton icon={<Eye className="w-4 h-4" />} tooltip="View" tone="outline" onClick={onView} />
                    {isEditable && (
                        <CircleIconButton icon={<Edit3 className="w-4 h-4" />} tooltip="Edit" tone="outline" onClick={onEdit} />
                    )}
                    {isCompleted && (
                        <CircleIconButton
                            icon={<Download className="w-4 h-4" />}
                            tooltip="Download"
                            tone="filled"
                            onClick={onDownload}
                        />
                    )}
                    {isInReview && !isEditable && !isCompleted && (
                        <CircleIconButton
                            icon={<Trash2 className="w-4 h-4" />}
                            tooltip="Withdraw"
                            tone="withdraw"
                            onClick={onWithdraw}
                        />
                    )}
                </div>
            </div>

            <div className="mobile-review-statrow">
                <StatCol label="Reviewed On">
                    {record.reviewedOn ? new Date(record.reviewedOn).toLocaleDateString('en-IN') : '—'}
                </StatCol>
                <StatCol label="Final Rating">
                    {record.finalRating ? (
                        <span style={{ fontWeight: 600, color: '#4338ca' }}>{record.finalRating}</span>
                    ) : (
                        '—'
                    )}
                </StatCol>
                <StatCol label="Status">
                    {record.status ? (
                        <StatusBadge status={record.status} showStatusIndicator={false} />
                    ) : (
                        '—'
                    )}
                </StatCol>
            </div>
        </div>
    );
};

/* ---------- Main component ---------- */

const MobileEmployeeAppraisalDashboard: React.FC<MobileEmployeeAppraisalDashboardProps> = ({
    reviews,
    currentQuarter,
    loading,
    fyOptions,
    selectedFY,
    fyLoading,
    onFYChange,
}) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="mobile-spinner-container">
                <Spin size="large" tip="Loading..." />
            </div>
        );
    }

    const currentReview = reviews.find((r) => r.quarter === currentQuarter);
    const currentStatus = currentReview?.status ?? 'Not Started';
    const hasCurrentQuarterReview = !!currentReview;
    const quarterRange = formatQuarterRange(currentQuarter);
    const quarterEndDate = formatQuarterEndDate(currentQuarter);
    const quarterOver = isQuarterOver(currentQuarter);

    const actionButton = !hasCurrentQuarterReview ? (
        <Button
            type="primary"
            icon={
                <span className="!flex !items-center !justify-center">
                    <Plus className="!w-4 !h-4" />
                </span>
            }
            onClick={() =>
                navigate(
                    currentQuarter
                        ? `/employee-dashboard/quarterly-review/${quarterToSlug(currentQuarter)}`
                        : "/employee-dashboard/quarterly-review"
                )
            }
            className="!flex !items-center !justify-center !gap-2 !h-9 !px-4 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm"
        >
            Create
        </Button>
    ) : null;

    return (

        <div className="mobile-dashboard-container">
            {/* Top Header */}
            <div className="mobile-top-header">
                <h1 className="mobile-title">Quarterly Review</h1>
                <p className="mobile-subtitle">
                    Submit your quarterly achievements and view your performance review status.
                </p>
            </div>

            {/* Current Quarter Header Card — FY / quarter range / Current Quarter badge only */}
            <div className="mobile-quarter-header-card">
                {/* FY + "Current Quarter" badge sit on the same row; the Q-range sits below */}
                <div className="mobile-quarter-card-top">
                    <div className="mobile-quarter-fy-row">
                        <p className="mobile-quarter-fy-text">{getFinancialYear(currentQuarter)}</p>
                        <span className="mobile-badge-tag">Current Quarter</span>
                    </div>
                    <h2 className="mobile-quarter-title">
                        {currentQuarter?.split(' ')[0] || '—'}
                        {quarterRange && (
                            <span className="mobile-quarter-range-inline"> • {quarterRange}</span>
                        )}
                    </h2>
                </div>
            </div>

            {/* Current Quarter Stats Card — submission status / due date / review status / final rating */}
            <div className="mobile-quarter-card">
                <div className="mobile-submission-row">
                    <div className="mobile-submission-label-group">
                        <span className="mobile-submission-icon-bg">
                            <FileCheck2 className="mobile-submission-icon" />
                        </span>
                        <span className="mobile-submission-label">Submission Status</span>
                    </div>
                    <StatusBadge status={currentStatus} />
                </div>

                <div className="mobile-info-rows">
                    <InfoRow
                        icon={<Clock style={{ width: 18, height: 18, color: '#10b981' }} />}
                        iconTone="emerald"
                        label="Due date"
                        sublabel={quarterOver ? 'Quarter ended' : 'Draft editable until then'}
                        value={currentStatus === ReviewStatus.NOT_STARTED || !currentQuarter ? '—' : quarterEndDate}
                    />
                    <InfoRow
                        icon={<ClipboardList style={{ width: 18, height: 18, color: '#6366f1' }} />}
                        iconTone="indigo"
                        label="Review status"
                        sublabel="Manager evaluation"
                        value={currentReview?.reviewStatus ?? '—'}
                    />
                    <InfoRow
                        icon={<Star style={{ width: 18, height: 18, color: '#fbbf24' }} />}
                        iconTone="amber"
                        label="Final rating"
                        sublabel={currentReview?.reviewedOn ? `Reviewed ${new Date(currentReview.reviewedOn).toLocaleDateString('en-IN')}` : 'Not available yet'}
                        value={currentReview?.finalRating ?? '—'}
                    />
                </div>

                {actionButton}
            </div>

            {/* History Section */}
            <div className="mobile-history-container">
                <div className="mobile-history-header">
                    <div className="mobile-history-title-group">
                        <span className="mobile-history-icon-bg">
                            <BarChart3 style={{ width: 14, height: 14 }} />
                        </span>
                        <h2 className="mobile-history-title">Review History</h2>
                    </div>
                </div>

                {fyOptions.length > 0 && (
                    <div className="mobile-filter-wrapper">
                        <Select
                            className="mobile-filter-select"
                            allowClear
                            value={selectedFY || undefined}
                            onChange={onFYChange}
                            loading={fyLoading}
                            placeholder="Financial Year"
                            variant="outlined"
                            suffixIcon={<ChevronDown className="w-4 h-4 text-slate-400" />}
                            popupMatchSelectWidth
                            options={fyOptions.map((fy) => ({
                                label: fy,
                                value: fy,
                            }))}
                        />
                    </div>
                )}

                {reviews.length > 0 ? (
                    <div className="mobile-card-list">
                        {fyLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
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
                                            `/employee-dashboard/quarterly-review/${quarterToSlug(record.quarter)}?mode=view`
                                        )
                                    }
                                    onEdit={() =>
                                        navigate(`/employee-dashboard/quarterly-review/${quarterToSlug(record.quarter)}`)
                                    }
                                    onDownload={() => { }}
                                    onWithdraw={() => { }}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="mobile-empty-state">
                        <img src={EmptyReviewImage} alt="No quarterly reviews" className="mobile-empty-img" />
                        <p className="mobile-empty-title">No quarterly reviews found.</p>
                        <p className="mobile-empty-subtext">
                            Create your first quarterly review to get started.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default MobileEmployeeAppraisalDashboard;