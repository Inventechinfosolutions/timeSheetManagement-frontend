import React, { useState, useEffect } from 'react';
import { Button, Table, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Plus, Edit3, Eye, Calendar, Star, ClipboardList,
  ChevronRight, ArrowLeft, BarChart3,
} from 'lucide-react';
import { ReviewStatus } from './enums/Appraisal.enums';
import { QuarterlyReview } from './types/Appraisal.types';
import {
  formatQuarterRange,
  formatQuarterEndDate,
  getFinancialYear,
  isQuarterOver,
} from './utils/fyQuarter.utils';
import type { AppDispatch } from '../../store';
import { getCurrentQuarter, getAllReviews } from '../../reducers/quarterlyReview.reducer';

// ─── Helpers ────────────────────────────────────────────────────────────────────

const submissionStatusTag = (status?: string) => {
  if (!status || status === 'Not Started') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
        Not Started
      </span>
    );
  }
  if (status === ReviewStatus.DRAFT) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      Submitted
    </span>
  );
};

const reviewStatusTag = (status?: string | null) => {
  if (!status) return <span className="text-slate-400 text-sm">—</span>;
  const colorMap: Record<string, string> = {
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Review': 'bg-blue-50 text-blue-700 border-blue-200',
    'Not Started': 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const cls = colorMap[status] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
};

// A small trailing chevron used purely as a visual affordance on the stat
// cards — it intentionally has no onClick so we don't introduce new
// navigation behavior that isn't backed by a real route.
const StatChevron: React.FC<{ tint: string }> = ({ tint }) => (
  <span
    className={`ml-auto shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tint}`}
    aria-hidden="true"
  >
    <ChevronRight className="w-4 h-4" />
  </span>
);

// ─── Component ───────────────────────────────────────────────────────────────

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

  // ─── History table columns ────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      render: (q: string) => (
        <span className="font-semibold text-black text-sm">{q?.split(' ')[0] ?? q}</span>
      ),
    },
    {
      title: 'Financial Year',
      key: 'fy',
      render: (_: any, r: QuarterlyReview) => (
        <span className="font-semibold text-black text-sm">{getFinancialYear(r.quarter)}</span>
      ),
    },
    {
      title: 'Submission Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => submissionStatusTag(s),
    },
    {
      title: 'Submitted To',
      dataIndex: 'managerName',
      key: 'managerName',
      render: (m: string | null) => m || <span className="text-slate-400 text-sm">—</span>,
    },
    {
      title: 'Review Status',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (s: string | null) => reviewStatusTag(s),
    },
    {
      title: 'Final Rating',
      dataIndex: 'finalRating',
      key: 'finalRating',
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
      render: (d: string | null) => (
        <span className="text-slate-500 text-sm">
          {d ? new Date(d).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: QuarterlyReview) => {
        const submitted = record.status === ReviewStatus.SUBMITTED;
        return (
          <div className="flex items-center gap-2">
            <Button
              type="text"
              size="small"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/employee-dashboard/quarterly-review?quarter=${encodeURIComponent(record.quarter)}&mode=view`)}
              className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-xs"
            >
              View
            </Button>
            <Button
              type="text"
              size="small"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              disabled={submitted}
              onClick={() => navigate(`/employee-dashboard/quarterly-review?quarter=${encodeURIComponent(record.quarter)}`)}
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs disabled:text-slate-300"
            >
              Edit
            </Button>
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
    <div className="w-full px-6 py-6 pb-12">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/employee-dashboard')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quarterly Review</h1>
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">NEW</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Submit your quarterly achievements and view your performance review status.
          </p>
        </div>
      </div>

      {/* ── Main content grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current-quarter card */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
            Current Quarter
          </span>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-3">
            {currentQuarter || '—'}
          </h2>
          {quarterRange && (
            <p className="text-slate-400 text-sm font-medium mt-0.5">({quarterRange})</p>
          )}

          <p className="text-slate-500 text-sm mt-4 leading-relaxed max-w-xl">
            Share your achievements, challenges and goals.
            Help your manager understand your contributions better.
          </p>

          <div className="border-t border-slate-100 mt-5 pt-5 flex flex-wrap items-center gap-3">
            {currentStatus === 'Not Started' ? (
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('/employee-dashboard/quarterly-review')}
                className="!flex !items-center !gap-2 !h-11 !px-5 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm !shadow-sm !transition-colors"
              >
                Create Quarterly Review
              </Button>
            ) : currentStatus === ReviewStatus.DRAFT ? (
              <Button
                type="primary"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => navigate(`/employee-dashboard/quarterly-review?quarter=${encodeURIComponent(currentQuarter)}`)}
                className="!flex !items-center !gap-2 !h-11 !px-5 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm !shadow-sm !transition-colors"
              >
                Edit Draft
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<Eye className="w-4 h-4" />}
                onClick={() => navigate(`/employee-dashboard/quarterly-review?quarter=${encodeURIComponent(currentQuarter)}&mode=view`)}
                className="!flex !items-center !gap-2 !h-11 !px-5 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !border-none !font-semibold !text-sm !shadow-sm !transition-colors"
              >
                View Submitted
              </Button>
            )}

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl h-11 px-5 shadow-sm">
              <span className="text-slate-700 font-semibold text-sm">Submission Status</span>
              {submissionStatusTag(currentStatus)}
            </div>
          </div>
        </div>

        {/* Stat cards column */}
        <div className="flex flex-col gap-4">
          {/* Due Date */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl shrink-0">
              <Calendar className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Due Date</p>
              <p className="text-slate-800 font-bold text-sm mt-0.5">
                {currentStatus === 'Not Started' || !currentQuarter ? '—' : quarterEndDate}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {quarterOver ? 'Quarter ended' : 'Draft editable until then'}
              </p>
            </div>
          </div>

          {/* Review Status */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl shrink-0">
              <ClipboardList className="w-6 h-6 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Review Status</p>
              <p className="text-slate-800 font-bold text-sm mt-0.5">
                {currentReview?.reviewStatus ?? '—'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Manager evaluation</p>
            </div>
          </div>

          {/* Final Rating */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="bg-rose-50 p-3 rounded-xl shrink-0">
              <Star className="w-6 h-6 text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Final Rating</p>
              <p className="text-slate-800 font-bold text-sm mt-0.5">
                {currentReview?.finalRating ?? '—'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentReview?.reviewedOn
                  ? `Reviewed ${new Date(currentReview.reviewedOn).toLocaleDateString('en-IN')}`
                  : 'Not Available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── History table ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <span className="bg-indigo-50 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </span>
          <h2 className="font-bold text-slate-900 text-base">Quarterly Review History</h2>
        </div>

        {reviews.length > 0 ? (
          <Table
            columns={columns}
            dataSource={reviews}
            rowKey={r => r.quarter}
            pagination={false}
            size="middle"
            className="custom-table"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-4 opacity-30">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="10" width="70" height="80" rx="8" fill="#e2e8f0" />
                <rect x="25" y="30" width="50" height="6" rx="3" fill="#94a3b8" />
                <rect x="25" y="44" width="40" height="6" rx="3" fill="#94a3b8" />
                <rect x="25" y="58" width="30" height="6" rx="3" fill="#94a3b8" />
                <circle cx="50" cy="72" r="14" fill="#cbd5e1" />
                <path d="M44 72l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-slate-500 font-semibold text-base">No quarterly reviews found.</p>
            <p className="text-slate-400 text-sm mt-1">Create your first quarterly review to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAppraisalDashboard;
