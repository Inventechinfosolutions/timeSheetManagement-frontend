import React, { useState, useEffect } from 'react';
import { Button, Table, Spin, message, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Plus, Edit3, Eye, Calendar, Star, ClipboardList,
  ArrowLeft, BarChart3, Download, Trash2,
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

const StatusBadge: React.FC<{
  status?: string | null;
  showStatusIndicator?: boolean;
}> = ({ status, showStatusIndicator = true }) => {
  if (!status) {
    return <span className="text-slate-400 text-sm">—</span>;
  }

  const style = STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border max-w-full truncate ${style.bg} ${style.text} ${style.border}`}
    >
      {showStatusIndicator && (
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${style.indicatorColor}`}
        />
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

// Small stat card used in the top summary row (Due Date / Review Status / Final Rating).
const StatCard: React.FC<{
  icon: React.ReactNode;
  accent: 'emerald' | 'indigo' | 'amber';
  label: string;
  value: React.ReactNode;
  subtext: React.ReactNode;
}> = ({ icon, accent, label, value, subtext }) => {
  const accentMap = {
    emerald: { border: 'border-l-emerald-400', iconBg: 'bg-emerald-50' },
    indigo: { border: 'border-l-indigo-400', iconBg: 'bg-indigo-50' },
    amber: { border: 'border-l-amber-400', iconBg: 'bg-amber-50' },
  }[accent];

  return (
    <div className={`bg-white border border-slate-100 border-l-4 ${accentMap.border} rounded-2xl p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <div className={`${accentMap.iconBg} p-2 rounded-lg shrink-0`}>{icon}</div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-slate-800 font-bold text-lg mt-2 truncate">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
  );
};

// Row of key/value pairs used inside the mobile review card.
const CardField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
      {label}
    </span>
    <span className="text-sm text-slate-700 text-right min-w-0 truncate">{children}</span>
  </div>
);

// Mobile-only card representation of a single history row (replaces the table row on small screens).
const ReviewCard: React.FC<{
  record: QuarterlyReview;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onWithdraw: () => void;
}> = ({ record, onView, onEdit, onDownload, onWithdraw }) => {
  const isDraft = record.status === ReviewStatus.DRAFT;
  const isCompleted = record.reviewStatus === ReviewStatus.COMPLETED || record.status === ReviewStatus.APPROVED;
  const isInReview = record.reviewStatus === ReviewStatus.IN_REVIEW;

  return (
    <div className="border border-slate-100 rounded-xl p-3.5 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">
            {record.quarter?.split(' ')[0] ?? record.quarter}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{getFinancialYear(record.quarter)}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="mt-2 divide-y divide-slate-100">
        <CardField label="Submitted To">{record.managerName ?? '—'}</CardField>
        <CardField label="Review Status">
          <StatusBadge status={record.reviewStatus} showStatusIndicator={false} />
        </CardField>
        <CardField label="Final Rating">
          {record.finalRating ? (
            <span className="font-semibold text-indigo-700">{record.finalRating}</span>
          ) : (
            '—'
          )}
        </CardField>
        <CardField label="Reviewed On">
          {record.reviewedOn ? new Date(record.reviewedOn).toLocaleDateString('en-IN') : '—'}
        </CardField>
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100">
        <RowIconButton icon={<Eye className="w-4 h-4" />} tooltip="View" tone="indigo" onClick={onView} />
        {isDraft && (
          <RowIconButton icon={<Edit3 className="w-4 h-4" />} tooltip="Edit" tone="indigo" onClick={onEdit} />
        )}
        {isCompleted && (
          <RowIconButton icon={<Download className="w-4 h-4" />} tooltip="Download" tone="indigo" onClick={onDownload} />
        )}
        {isInReview && !isDraft && !isCompleted && (
          <RowIconButton icon={<Trash2 className="w-4 h-4" />} tooltip="Withdraw" tone="withdraw" onClick={onWithdraw} />
        )}
      </div>
    </div>
  );
};

//  Component 

const EmployeeAppraisalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [reviews, setReviews] = useState<QuarterlyReview[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [q, all] = await Promise.all([
          dispatch(getCurrentQuarter()).unwrap(),
          dispatch(getAllReviews()).unwrap(),
        ]);
        setCurrentQuarter(q ?? '');
        setReviews(all);
      } catch (err: any) {
        message.error(err?.message ?? 'Failed to load quarterly reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [dispatch]);

  const currentReview = reviews.find(r => r.quarter === currentQuarter);
  const currentStatus = currentReview?.status ?? 'Not Started';
  const quarterRange = formatQuarterRange(currentQuarter);
  const quarterEndDate = formatQuarterEndDate(currentQuarter);
  const quarterOver = isQuarterOver(currentQuarter);
  const actionButton =
    currentStatus === ReviewStatus.NOT_STARTED ? (
      <Button
        type="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={() => navigate(currentQuarter ? `/employee-dashboard/quarterly-review/${quarterToSlug(currentQuarter)}` : '/employee-dashboard/quarterly-review')}
        className="!flex !items-center !justify-center !gap-2 !h-9 !px-4 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm !shadow-sm !transition-colors !w-full sm:!w-fit"
      >
        Create
      </Button>
    ) : currentStatus === ReviewStatus.DRAFT ? (
      <Button
        type="primary"
        icon={<Edit3 className="w-4 h-4" />}
        onClick={() => navigate(`/employee-dashboard/quarterly-review/${quarterToSlug(currentQuarter)}`)}
        className="!flex !items-center !justify-center !gap-2 !h-9 !px-4 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm !shadow-sm !transition-colors !w-full sm:!w-fit"
      >
        Edit Draft
      </Button>
    ) : (
      <Button
        type="primary"
        icon={<Eye className="w-4 h-4" />}
        onClick={() => navigate(`/employee-dashboard/quarterly-review/${quarterToSlug(currentQuarter)}?mode=view`)}
        className="!flex !items-center !justify-center !gap-2 !h-9 !px-4 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm !shadow-sm !transition-colors !w-full sm:!w-fit"
      >
        View
      </Button>
    );
  //  History table columns 
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
      title: 'Submission Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (s: string) => <StatusBadge status={s} />,
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
      title: 'Review Status',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: '14%',
      render: (s: string | null) => <StatusBadge status={s} showStatusIndicator={false} />,
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
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, record: QuarterlyReview) => {
        const isDraft = record.status === ReviewStatus.DRAFT;
        const isCompleted = record.reviewStatus === ReviewStatus.COMPLETED || record.status === ReviewStatus.APPROVED;
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
            {isDraft && (
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
                onClick={() => {
                  // Hook up to actual export/download action for this review.
                }}
              />
            )}
            {isInReview && !isDraft && !isCompleted && (
              <RowIconButton
                icon={<Trash2 className="w-4 h-4" />}
                tooltip="Withdraw"
                tone="withdraw"
                onClick={() => {
                  // Hook up to actual withdraw/delete action for this review.
                }}
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
    <div className="w-full min-h-screen bg-slate-50 px-4 sm:px-6 py-4 flex flex-col">
      {/*  Top bar  */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4 shrink-0">
        <div>
          <button
            onClick={() => navigate('/employee-dashboard')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Quarterly Review</h1>
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">NEW</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Submit your quarterly achievements and view your performance review status.
          </p>
        </div>
      </div>

      {/*  Main content  */}
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm shrink-0">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-0 lg:items-stretch">
            <div className="lg:w-[440px] shrink-0 flex flex-col items-start">
              <span className="inline-block w-fit bg-indigo-100 text-indigo-700 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
                Current Quarter
              </span>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-3 w-full">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 p-1.5 rounded-lg shrink-0">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                      {currentQuarter || '—'}
                    </h2>
                  </div>
                  {quarterRange && (
                    <p className="text-slate-400 text-sm font-medium mt-0.5 ml-9">({quarterRange})</p>
                  )}
                </div>

                {/* Mobile: status box + action button share one line */}
                <div className="flex sm:hidden items-center justify-between gap-3 w-full">
                  <div className="border border-blue-200 rounded-xl px-3 py-2 flex flex-col justify-center items-center shrink-0">
                    <p className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-1.5 whitespace-nowrap">
                      Submission Status
                    </p>
                    <StatusBadge status={currentStatus} />
                  </div>
                  <div className="shrink-0">{actionButton}</div>
                </div>

                {/* Desktop/tablet: status box in its original spot */}
                <div className="hidden sm:flex border border-blue-200 rounded-xl px-3 py-2 flex-col justify-center items-center self-start sm:self-auto shrink-0">
                  <p className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-1.5 whitespace-nowrap">
                    Submission Status
                  </p>
                  <StatusBadge status={currentStatus} />
                </div>
              </div>
              <div className="hidden sm:block mt-5 mb-1 w-full">
                <div className="flex items-center justify-end gap-6 w-full">
                  {actionButton}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-slate-200 mx-6" />
            <div className="lg:hidden h-px bg-slate-200" />

            {/* Stat cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                accent="emerald"
                icon={<Calendar className="w-5 h-5 text-emerald-500" />}
                label="Due Date"
                value={currentStatus === ReviewStatus.NOT_STARTED || !currentQuarter ? '—' : quarterEndDate}
                subtext={quarterOver ? 'Quarter ended' : 'Draft editable until then'}
              />
              <StatCard
                accent="indigo"
                icon={<ClipboardList className="w-5 h-5 text-indigo-500" />}
                label="Review Status"
                value={currentReview?.reviewStatus ?? '—'}
                subtext="Manager evaluation"
              />
              <StatCard
                accent="amber"
                icon={<Star className="w-5 h-5 text-amber-400" />}
                label="Final Rating"
                value={currentReview?.finalRating ?? '—'}
                subtext={
                  currentReview?.reviewedOn
                    ? `Reviewed ${new Date(currentReview.reviewedOn).toLocaleDateString('en-IN')}`
                    : 'Not Available'
                }
              />
            </div>
          </div>
        </div>

        {/* Row 2: history — table on sm+, cards on mobile */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex-1 min-h-0">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <span className="bg-indigo-50 text-indigo-600 w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              <BarChart3 className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-bold text-slate-900 text-base">Quarterly Review History</h2>
          </div>

          {reviews.length > 0 ? (
            <>
              {/* Mobile card list */}
              <div className="sm:hidden flex flex-col gap-3 p-3.5">
                {reviews.map(record => (
                  <ReviewCard
                    key={record.quarter}
                    record={record}
                    onView={() =>
                      navigate(`/employee-dashboard/quarterly-review/${quarterToSlug(record.quarter)}?mode=view`)
                    }
                    onEdit={() =>
                      navigate(`/employee-dashboard/quarterly-review/${quarterToSlug(record.quarter)}`)
                    }
                    onDownload={() => {
                      // Hook up to actual export/download action for this review.
                    }}
                    onWithdraw={() => {
                      // Hook up to actual withdraw/delete action for this review.
                    }}
                  />
                ))}
              </div>

              {/* Desktop / tablet table */}
              <div className="hidden sm:block overflow-x-auto table-scroll-area">
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
            /* Hide scrollbars by default, reveal only on hover */
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
                  rowKey={r => r.quarter}
                  pagination={false}
                  size="middle"
                  tableLayout="fixed"
                  className="custom-table"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
              <div className="flex justify-center">
                <img
                  src={EmptyReviewImage}
                  alt="No quarterly reviews"
                  className="w-12px h-50 object-contain opacity-70"
                />
              </div>
              <p className="text-slate-500 font-semibold text-base">No quarterly reviews found.</p>
              <p className="text-slate-400 text-sm mt-1">Create your first quarterly review to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 mt-6 pb-2">
      </div>
    </div>
  );
};

export default EmployeeAppraisalDashboard;