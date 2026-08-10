import React, { useState, useEffect } from 'react';
import { Button, Table, Spin, message, Tooltip, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Plus, Edit3, Eye, Calendar, Star, ClipboardList,
  BarChart3, Download, Trash2, FileCheck2,
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
import { getCurrentQuarter, getAllReviews } from '../../reducers/quarterlyReview.reducer';
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
};

const DEFAULT_STATUS_STYLE = { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', indicatorColor: 'bg-slate-400' };

export const StatusBadge: React.FC<{
  status?: string | null;
  showStatusIndicator?: boolean;
}> = ({ status, showStatusIndicator = true }) => {
  if (!status) {
    return <span className="text-slate-400 text-sm">—</span>;
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
        <p className="text-xs text-darkgray-400 font-bold uppercase tracking-wider">{label}</p>
      </div>
      <div className="mt-2 min-h-[28px] flex items-center">{value}</div>
      <p className="text-xs text-slate-400 mt-1.5">{subtext}</p>
      {/* Bottom decorative wave */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[28px] pointer-events-none"
        viewBox="0 0 300 28"
        preserveAspectRatio="none"
      >
        <path
          d="
      M0 25
      C45 25, 65 24, 95 20
      C135 15, 165 23, 205 14
      C240 7, 265 10, 300 3
      L300 28
      L0 28
      Z
    "
          fill={
            accent === 'blue'
              ? '#EFF6FF'
              : accent === 'emerald'
                ? '#ECFDF5'
                : accent === 'indigo'
                  ? '#EEF2FF'
                  : '#FFFBEB'
          }
        />

        <path
          d="
      M0 25
      C45 25, 65 24, 95 20
      C135 15, 165 23, 205 14
      C240 7, 265 10, 300 3
    "
          fill="none"
          stroke={
            accent === 'blue'
              ? '#BFDBFE'
              : accent === 'emerald'
                ? '#A7F3D0'
                : accent === 'indigo'
                  ? '#C7D2FE'
                  : '#FDE68A'
          }
          strokeWidth="1"
        />
      </svg>
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

  // Switch to Mobile/Tablet component if viewport width is < 1024px
  if (isMobileOrTablet) {
    return (
      <MobileEmployeeAppraisalDashboard
        reviews={reviews}
        currentQuarter={currentQuarter}
        loading={loading}
        fyOptions={fyOptions}
        selectedFY={selectedFY}
        fyLoading={fyLoading}
        onFYChange={handleFYChange}
      />
    );
  }

  const currentReview = reviews.find((r) => r.quarter === currentQuarter);
  const currentStatus = currentReview?.status ?? 'Not Started';
  const hasCurrentQuarterReview = !!currentReview;
  const quarterRange = formatQuarterRange(currentQuarter);
  const quarterEndDate = formatQuarterEndDate(currentQuarter);
  const quarterOver = isQuarterOver(currentQuarter);

  const submissionSubtext = hasCurrentQuarterReview
    ? 'Your quarterly submission'
    : 'Not yet submitted';

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
      className="!flex !items-center !justify-center !gap-2 !h-9 !px-4 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm !shadow-sm !transition-all !duration-300 hover:!-translate-y-0.5 hover:!shadow-md"
    >
      Create
    </Button>
  ) : null;

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
      render: (r: string | null) =>
        r ? (
          <span className="font-semibold text-indigo-700">{r}</span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      title: 'Review Status',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: '14%',
      render: (s: string | null) => <StatusBadge status={s} showStatusIndicator={false} />,
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
          record.reviewStatus === ReviewStatus.COMPLETED || record.status === ReviewStatus.APPROVED;
        const isInReview = record.reviewStatus === ReviewStatus.IN_REVIEW;

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
                icon={<Download className="w-4 h-4" />}
                tooltip="Download"
                tone="indigo"
                onClick={() => { }}
              />
            )}
            {isInReview && !isCompleted && (
              <RowIconButton
                icon={<Trash2 className="w-4 h-4" />}
                tooltip="Withdraw"
                tone="withdraw"
                onClick={() => { }}
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
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
                <span className="text-[12px] font-bold text-slate-900 mb-1">
                  {getFinancialYear(currentQuarter)}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[15px] font-bold text-slate-900">
                    {currentQuarter?.split(' ')[0] || '—'}
                  </span>
                  {quarterRange && (
                    <span className="text-[15px] font-bold text-slate-900">
                      • {quarterRange}
                    </span>
                  )}
                </div>
              </div>

              <span className="inline-block w-fit bg-indigo-100 text-indigo-700 text-[11px] font-bold tracking-wider px-4 py-2 rounded-full uppercase shrink-0">
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
                  <span className="text-slate-800 font-bold text-lg">
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
                  <span className="text-slate-800 font-bold text-lg">
                    {currentReview?.reviewStatus ?? '—'}
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
                  <span className="text-slate-800 font-bold text-lg">
                    {currentReview?.finalRating ?? '—'}
                  </span>
                }
                subtext={
                  currentReview?.reviewedOn
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
                  <h2 className="font-bold text-slate-900 text-base">Quarterly Review History</h2>
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
                  min-width: 760px;
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
  );
};

export default EmployeeAppraisalDashboard;