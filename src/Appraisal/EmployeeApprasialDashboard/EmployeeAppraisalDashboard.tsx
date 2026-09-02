import React, { useState, useEffect } from 'react';
import { Button, Table, Spin, message, Tooltip, Select, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Plus, Edit3, Eye, Calendar, Star, ClipboardList,
  BarChart3, Download, Trash2, FileCheck2, AlertTriangle,
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
import { getCurrentQuarter, getAllReviews, withdrawQuarterlyReview, downloadQuarterlyReviewPdf } from '../../reducers/quarterlyReview.reducer';
import MobileEmployeeAppraisalDashboard from './MobileEmployeeAppraisalDashboard/MobileEmployeeAppraisalDashboard';

const STATUS_STYLES: Record<string, StatusStyle> = {
  [ReviewStatus.NOT_STARTED]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    indicatorColor: 'bg-slate-400',
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
      const values = Object.values(parsed).map(Number).filter(v => !isNaN(v) && v > 0);
      if (values.length > 0) {
        return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
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
  const dispatch = useDispatch<AppDispatch>();

  const [reviews, setReviews] = useState<QuarterlyReview[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fyOptions, setFyOptions] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string>('');
  const [fyLoading, setFyLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [q, allUnfiltered] = await Promise.all([
          dispatch(getCurrentQuarter()).unwrap(),
          dispatch(getAllReviews(undefined)).unwrap(),
        ]);
        const resolvedQuarter = q ?? '';
        setCurrentQuarter(resolvedQuarter);

        const uniqueFYs = Array.from(
          new Set(allUnfiltered.map((r) => getFinancialYear(r.quarter)).filter((fy) => fy !== '—'))
        ).sort((a, b) => b.localeCompare(a));
        setFyOptions(uniqueFYs);

        setSelectedFY('');
        setReviews(allUnfiltered);
      } catch (err: any) {
        message.error(err?.message ?? 'Failed to load quarterly reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [dispatch]);

  const handleFYChange = async (fy: string) => {
    setSelectedFY(fy);
    setFyLoading(true);
    try {
      const fyParam = fy ? fy.replace('FY ', 'FY') : undefined;
      const filtered = await dispatch(getAllReviews(fyParam)).unwrap();
      setReviews(filtered);
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to filter reviews.');
    } finally {
      setFyLoading(false);
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
      const fyParam = selectedFY ? selectedFY.replace('FY ', 'FY') : undefined;
      const updated = await dispatch(getAllReviews(fyParam)).unwrap();
      setReviews(updated);

      const uniqueFYs = Array.from(
        new Set(updated.map((r) => getFinancialYear(r.quarter)).filter((fy) => fy !== '—'))
      ).sort((a, b) => b.localeCompare(a));
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
          fyLoading={fyLoading}
          onFYChange={handleFYChange}
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

  const currentReview = reviews.find((r) => r.quarter === currentQuarter);
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
    : 'Not yet submitted';

  // const [messageApi, contextHolder] = message.useMessage();
  const actionButton = (
    <Button
      type="primary"
      icon={
        <span className="!flex !items-center !justify-center">
          <Plus className="!w-4 !h-4" />
        </span>
      }
      onClick={() => {
        if (hasCurrentQuarterReview) {
          messageApi.info(
            "You have already created a review for the current quarter."
          );
          return;
        }

        navigate(
          currentQuarter
            ? `/employee-dashboard/quarterly-review/${quarterToSlug(currentQuarter)}`
            : "/employee-dashboard/quarterly-review"
        );
      }}
      aria-disabled={hasCurrentQuarterReview}
      className={`
      !flex !items-center !justify-center !gap-2
      !h-9 !px-4 !rounded-xl
      !font-semibold !text-sm
      !border-none
      !transition-all !duration-300

      ${hasCurrentQuarterReview
          ? "!bg-gray-300 !text-gray-500 !cursor-not-allowed !shadow-none"
          : "!bg-blue-600 hover:!bg-blue-700 !text-white !shadow-sm hover:!-translate-y-0.5 hover:!shadow-md"
        }
    `}
    >
      Create
    </Button>
  );
  const columns = [
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: '9%',
      render: (q: string) => (
        <span className="font-semibold text-black text-sm">{q?.split(' ')[0] ?? q}</span>
      ),
    },
    {
      title: 'Financial Year',
      key: 'fy',
      width: '13%',
      render: (_: any, r: QuarterlyReview) => (
        <span className="font-semibold text-black text-sm">{getFinancialYear(r.quarter)}</span>
      ),
    },
    {
      title: 'Submitted To',
      dataIndex: 'managerName',
      key: 'managerName',
      width: '14%',
      render: (m: string | null) =>
        m ? (
          <Tooltip title={m}>
            <span>{m}</span>
          </Tooltip>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      title: 'Reviewed On',
      dataIndex: 'reviewedOn',
      key: 'reviewedOn',
      width: '13%',
      render: (d: string | null) => (
        <span className="text-slate-500 text-sm">
          {d ? new Date(d).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
    },
    {
      title: 'Final Rating',
      dataIndex: 'finalRating',
      key: 'finalRating',
      width: '12%',
      render: (_: any, record: QuarterlyReview) => {
        const avg = getDisplayAverageRating(record);
        return avg ? (
          <span className="font-semibold text-indigo-700">{avg}</span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        );
      },
    },
    {
      title: 'Review Status',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: '14%',
      render: (s: string | null, record: QuarterlyReview) => {
        const isDraftOrNotStarted =
          record.status === ReviewStatus.DRAFT ||
          record.status === ReviewStatus.NOT_STARTED;

        if (isDraftOrNotStarted || !s) {
          return <span className="text-slate-400 text-sm">—</span>;
        }
        return <StatusBadge status={s} showStatusIndicator={false} />;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, record: QuarterlyReview) => {
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
          <div className="flex items-center gap-1">
            <RowIconButton
              icon={<Eye className="w-4 h-4" />}
              tooltip="View"
              tone="indigo"
              onClick={() =>
                navigate(`/employee-dashboard/quarterly-review/${quarterToSlug(record.quarter)}?mode=view`)
              }
            />
            {isEditable && (
              <RowIconButton
                icon={<Edit3 className="w-4 h-4" />}
                tooltip="Edit"
                tone="indigo"
                onClick={() =>
                  navigate(`/employee-dashboard/quarterly-review/${quarterToSlug(record.quarter)}`)
                }
              />
            )}
            {isCompleted && (
              <RowIconButton
                icon={downloadingQuarter === record.quarter ? <Spin size="small" /> : <Download className="w-4 h-4" />}
                tooltip="Download PDF"
                tone="indigo"
                disabled={downloadingQuarter === record.quarter}
                onClick={() => handleDownloadPdf(record)}
              />
            )}
            {canWithdraw && (
              <RowIconButton
                icon={<Trash2 className="w-4 h-4" />}
                tooltip="Withdraw"
                tone="withdraw"
                onClick={() => handleOpenWithdrawModal(record)}
              />
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
            {/* Top Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Quarterly Review
                </h1>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <p className="text-slate-500 text-sm">
                  Submit your quarterly achievements and view your performance review status.
                </p>

                <div className="shrink-0 ml-4">
                  {actionButton}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              {/* Current Quarter bar: FY / quarter range on the left, badge pinned to the right */}
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

              {/* Four uniform stat cards, in their own row */}
              <div className="grid grid-cols-4 gap-4 shrink-0">
                <StatCard
                  accent="blue"
                  icon={<FileCheck2 className="w-5 h-5 text-blue-500" />}
                  label="Submission Status"
                  value={<StatusBadge status={currentStatus} />}
                  subtext={submissionSubtext}
                  delay={0}
                />
                <StatCard
                  accent="emerald"
                  icon={<Calendar className="w-5 h-5 text-emerald-500" />}
                  label="Due Date"
                  value={
                    <span className="text-slate-800 font-medium text-base">
                      {currentStatus === ReviewStatus.NOT_STARTED || !currentQuarter ? '—' : quarterEndDate}
                    </span>
                  }
                  subtext={quarterOver ? 'Quarter ended' : 'Draft editable until then'}
                  delay={80}
                />
                <StatCard
                  accent="indigo"
                  icon={<ClipboardList className="w-5 h-5 text-indigo-500" />}
                  label="Review Status"
                  value={
                    <span className="text-slate-800 font-medium text-base">
                      {currentStatus === ReviewStatus.SUBMITTED && currentReview?.reviewStatus
                        ? currentReview.reviewStatus
                        : '—'}
                    </span>
                  }
                  subtext="Manager evaluation"
                  delay={160}
                />
                <StatCard
                  accent="amber"
                  icon={<Star className="w-5 h-5 text-amber-400" />}
                  label="Final Rating"
                  value={
                    <span className="text-slate-800 font-medium text-lg">
                      {getDisplayAverageRating(currentReview) ?? '—'}
                    </span>
                  }
                  subtext={
                    (currentReview?.reviewStatus === ReviewStatus.REVIEWED || currentReview?.reviewStatus === ReviewStatus.COMPLETED || currentReview?.status === ReviewStatus.COMPLETED || currentReview?.status === ReviewStatus.APPROVED) && currentReview?.reviewedOn
                      ? `Reviewed ${new Date(currentReview.reviewedOn).toLocaleDateString('en-IN')}`
                      : 'Not Available'
                  }
                  delay={240}
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
                      style={{ width: 180 }}
                      options={fyOptions.map((fy) => ({
                        label: fy,
                        value: fy,
                      }))}
                    />
                  )}
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
                      rowKey={(r) => r.quarter}
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
                    <p className="text-slate-500 font-semibold text-base">No quarterly reviews found.</p>
                    <p className="text-slate-400 text-sm mt-1">Create your first quarterly review to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      </div>

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