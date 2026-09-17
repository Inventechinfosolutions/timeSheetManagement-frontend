import React, { useState, useEffect, useCallback } from 'react';
import { Button, Table, Select, Tooltip } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Lock,
  RefreshCw,
  Star,
} from 'lucide-react';
import { RootState } from '../../store';
import { useRevealedRatings } from '../hooks/useRevealedRatings';
import { getMasterFinancialYears, getCurrentFinancialYearData, getCurrentAcademicYear } from '../../master/financialYear.master';
import { AuthenticateRatingModal } from '../components/AuthenticateRatingModal';
import { QuarterItem, FourQuartersResponse } from '../types/academicYearRating.types';

const resolveQuarterDateRangeText = (q: string, fyString?: string): string => {
  let startYear: number;
  let endYear: number;
  const match = (fyString || "").match(/(\d{4})/);
  if (match) {
    startYear = parseInt(match[1], 10);
    endYear = startYear + 1;
  } else {
    const currentFY = getCurrentFinancialYearData();
    startYear = currentFY.startYear;
    endYear = currentFY.endYear;
  }
  const norm = (q || '').toUpperCase().trim();
  if (norm.startsWith('Q1')) return `01 Apr ${startYear} - 30 Jun ${startYear}`;
  if (norm.startsWith('Q2')) return `01 Jul ${startYear} - 30 Sep ${startYear}`;
  if (norm.startsWith('Q3')) return `01 Oct ${startYear} - 31 Dec ${startYear}`;
  if (norm.startsWith('Q4')) return `01 Jan ${endYear} - 31 Mar ${endYear}`;
  return '';
};

export const QuarterlyRatingsView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  const {
    activeRevealToken,
    maxRemainingSeconds,
    isRevealed,
    lockAllRatings,
    openAuthModal,
  } = useRevealedRatings();

  const [financialYearList, setFinancialYearList] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string>(() => {
    return searchParams.get('financialYear') || getCurrentAcademicYear();
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<FourQuartersResponse | null>(null);

  // Load FY list
  useEffect(() => {
    const list = getMasterFinancialYears();
    if (list && list.length > 0) {
      setFinancialYearList(list);
    } else {
      setFinancialYearList([getCurrentAcademicYear()]);
    }
  }, []);

  // Fetch 4 quarters data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (activeRevealToken) {
        headers['x-reveal-token'] = activeRevealToken;
      }
      const targetEmp = searchParams.get('employeeId') || currentUser?.loginId || '';
      const res = await axios.get('/api/quarterly-review/four-quarters-ratings', {
        headers,
        params: {
          financialYear: selectedFY,
          employeeId: targetEmp || undefined,
        },
      });

      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('[QuarterlyRatingsView] Failed to load ratings:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFY, activeRevealToken, searchParams, currentUser?.loginId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFYChange = (newFY: string) => {
    setSelectedFY(newFY);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('financialYear', newFY);
    setSearchParams(newParams);
  };

  const handleBack = () => {
    const isDashboardAdmin = location.pathname.startsWith('/admin-dashboard');
    const isDashboardManager = location.pathname.startsWith('/manager-dashboard');
    const prefix = isDashboardAdmin
      ? '/admin-dashboard'
      : isDashboardManager
        ? '/manager-dashboard'
        : '/employee-dashboard';
    navigate(`${prefix}/appraisal`);
  };

  const handleUnlockClick = (quarterCode?: string) => {
    openAuthModal({
      reviewId: `year-${selectedFY.replace(/\s+/g, '').toUpperCase()}`,
      quarter: selectedFY,
      employeeId: currentUser?.loginId,
      initialEmail: (currentUser as any)?.email || currentUser?.loginId,
      onSuccess: () => {
        fetchData();
      },
    });
  };

  // Only consider revealed if active token exists AND timer has remaining seconds
  const isAnyRevealed = (isRevealed() || Boolean(activeRevealToken)) && maxRemainingSeconds > 0;
  const remainingMins = Math.floor(maxRemainingSeconds / 60);
  const remainingSecs = maxRemainingSeconds % 60;
  const timerDisplay = `${remainingMins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;

  const renderQuarterCell = (quarterItem?: QuarterItem) => {
    if (!quarterItem) {
      return <span className="text-xs text-slate-400 font-medium">—</span>;
    }

    // 1. If quarter is upcoming or not evaluated yet
    if (!quarterItem.hasFinalRating && (!quarterItem.finalRating || quarterItem.finalRating === '—')) {
      return (
        <div className="flex flex-col items-center justify-center gap-1 py-1">
          <span className="text-xs font-medium text-slate-400 italic">
            Pending Evaluation
          </span>
          {quarterItem.dateRange && (
            <span className="text-[11px] text-slate-400">
              {quarterItem.dateRange}
            </span>
          )}
        </div>
      );
    }

    // 2. If revealed (active 2-minute timer and valid rating score)
    if (isAnyRevealed && quarterItem.numericScore !== null && !quarterItem.isFinalRatingHidden) {
      const scoreNum = Number(quarterItem.numericScore);
      const evaluator = quarterItem.evaluatorName || quarterItem.managerName;
      return (
        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-sm shadow-2xs">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{scoreNum.toFixed(1)}</span>
            <span className="text-[11px] text-emerald-600 font-medium">/ 5.0</span>
          </div>
          {evaluator && evaluator !== '—' && (
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]" title={`Evaluated by: ${evaluator}`}>
              By: {evaluator}
            </span>
          )}
        </div>
      );
    }

    // 3. If evaluated but locked / hidden (after 2 minutes expired or not yet verified)
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-1">
        <Tooltip title="Rating is hidden for confidentiality. Click to verify identity and reveal for 2 minutes.">
          <button
            type="button"
            onClick={() => handleUnlockClick(quarterItem.quarterCode)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold cursor-pointer transition-all shadow-2xs group"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span>Unlock Rating</span>
          </button>
        </Tooltip>
        {quarterItem.dateRange && (
          <span className="text-[11px] text-slate-400">
            {quarterItem.dateRange}
          </span>
        )}
      </div>
    );
  };

  // Render Total Rating column (Sum of all evaluated quarters: Q1 + Q2 + Q3 + Q4)
  const renderTotalRatingCell = (record: any) => {
    const quarters: QuarterItem[] = [record.q1, record.q2, record.q3, record.q4].filter(Boolean);
    const evaluatedQuarters = quarters.filter(
      (q) => q.hasFinalRating && q.numericScore !== null && Number(q.numericScore) > 0,
    );

    // If 0 quarters evaluated yet
    if (evaluatedQuarters.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-1 py-1">
          <span className="text-xs font-medium text-slate-400 italic">
            Pending Evaluation
          </span>
          <span className="text-[11px] text-slate-400">
            0 of 4 evaluated
          </span>
        </div>
      );
    }

    // If ratings are locked / confidentiality timer expired
    if (!isAnyRevealed || evaluatedQuarters.some((q) => q.isFinalRatingHidden)) {
      return (
        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
          <Tooltip title="Total rating is hidden for confidentiality. Click to verify identity and reveal for 2 minutes.">
            <button
              type="button"
              onClick={() => handleUnlockClick()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold cursor-pointer transition-all shadow-2xs group"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Unlock Total</span>
            </button>
          </Tooltip>
          <span className="text-[11px] text-slate-400">
            {evaluatedQuarters.length} of 4 evaluated
          </span>
        </div>
      );
    }

    // Revealed: Compute sum of all evaluated quarters (e.g. Q1 + Q2 if 2 quarters reviewed)
    const sum = evaluatedQuarters.reduce((acc, q) => acc + Number(q.numericScore), 0);
    const formulaParts = evaluatedQuarters.map((q) => `${q.quarterCode} (${Number(q.numericScore).toFixed(1)})`);
    const formulaText = evaluatedQuarters.map((q) => q.quarterCode).join(' + ');

    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-1">
        <Tooltip title={`Sum: ${formulaParts.join(' + ')} = ${sum.toFixed(1)}`}>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-900 border border-indigo-200 font-black text-sm shadow-2xs">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{sum.toFixed(1)}</span>
          </div>
        </Tooltip>
        <span className="text-[11px] text-indigo-700 font-semibold">
          {formulaText} ({evaluatedQuarters.length} {evaluatedQuarters.length === 1 ? 'Quarter' : 'Quarters'})
        </span>
      </div>
    );
  };

  // 4 Quarters + Total columns: Academic Year, Q1, Q2, Q3, Q4, Total Rating
  const columns = [
    {
      title: 'ACADEMIC YEAR',
      dataIndex: 'academicYear',
      key: 'academicYear',
      width: '22%',
      render: (fy: string) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-tight">{fy}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">
              {data?.evaluatedQuartersCount || 0} of 4 Quarters Evaluated
            </span>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800">Q1</span>
          <span className="text-[10px] font-normal text-slate-400">
            {resolveQuarterDateRangeText('Q1', selectedFY)}
          </span>
        </div>
      ),
      key: 'q1',
      align: 'center' as const,
      width: '15%',
      render: (_: any, record: any) => renderQuarterCell(record.q1),
    },
    {
      title: (
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800">Q2</span>
          <span className="text-[10px] font-normal text-slate-400">
            {resolveQuarterDateRangeText('Q2', selectedFY)}
          </span>
        </div>
      ),
      key: 'q2',
      align: 'center' as const,
      width: '15%',
      render: (_: any, record: any) => renderQuarterCell(record.q2),
    },
    {
      title: (
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800">Q3</span>
          <span className="text-[10px] font-normal text-slate-400">
            {resolveQuarterDateRangeText('Q3', selectedFY)}
          </span>
        </div>
      ),
      key: 'q3',
      align: 'center' as const,
      width: '15%',
      render: (_: any, record: any) => renderQuarterCell(record.q3),
    },
    {
      title: (
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800">Q4</span>
          <span className="text-[10px] font-normal text-slate-400">
            {resolveQuarterDateRangeText('Q4', selectedFY)}
          </span>
        </div>
      ),
      key: 'q4',
      align: 'center' as const,
      width: '15%',
      render: (_: any, record: any) => renderQuarterCell(record.q4),
    },
    {
      title: 'TOTAL RATING',
      key: 'totalRating',
      align: 'center' as const,
      width: '18%',
      render: (_: any, record: any) => renderTotalRatingCell(record),
    },
  ];

  const quartersMap = (data?.quarters || []).reduce<Record<string, QuarterItem>>((acc, q) => {
    acc[q.quarterCode] = q;
    return acc;
  }, {});

  const tableDataSource = [
    {
      key: selectedFY,
      academicYear: selectedFY,
      q1: quartersMap['Q1'],
      q2: quartersMap['Q2'],
      q3: quartersMap['Q3'],
      q4: quartersMap['Q4'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 flex flex-col gap-5">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-4">
          <Button
            type="default"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleBack}
            className="h-10 px-3.5 rounded-xl border-slate-200 hover:border-indigo-400 hover:text-indigo-600 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            Back to Appraisal
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Quarterly Ratings Overview
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Performance appraisal scores for all 4 quarters of {selectedFY}
            </p>
          </div>
        </div>

        {/* 2-Minute Countdown Timer & Lock Button */}
        {isAnyRevealed && maxRemainingSeconds > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>{timerDisplay} remaining</span>
            <button
              type="button"
              onClick={lockAllRatings}
              className="ml-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Lock
            </button>
          </div>
        )}
      </div>

      {/* 4 Quarters Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
        {/* Filter directly above the table */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              All 4 Quarters ({selectedFY})
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Review performance appraisal scores for Q1, Q2, Q3, and Q4
            </p>
          </div>

          {/* Academic Year Filter moved here above the table */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Academic Year:
            </span>
            <Select
              value={selectedFY}
              onChange={handleFYChange}
              className="w-40 h-10 font-bold text-xs"
              options={financialYearList.map((fy) => ({ label: fy, value: fy }))}
            />
            <Button
              icon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
              onClick={fetchData}
              loading={loading}
              className="h-10 w-10 p-0 rounded-xl border-slate-200 flex items-center justify-center shadow-2xs"
            />
          </div>
        </div>

        {/* Table styling with WorkSphere royal purple header */}
        <div className="p-3 overflow-x-auto">
          <style>{`
            .ratings-overview-table .ant-table-container {
              border-radius: 12px !important;
              overflow: hidden !important;
            }
            .ratings-overview-table .ant-table-thead > tr > th {
              background: #4318FF !important;
              color: #FFFFFF !important;
              font-size: 12px !important;
              font-weight: 700 !important;
              letter-spacing: 0.05em !important;
            }
            .ratings-overview-table .ant-table-tbody > tr > td {
              padding: 16px 14px !important;
              vertical-align: middle !important;
              border-bottom: 1px solid #F1F5F9 !important;
            }
          `}</style>
          <Table
            columns={columns}
            dataSource={tableDataSource}
            rowKey="key"
            loading={loading}
            pagination={false}
            className="ratings-overview-table w-full text-xs"
          />
        </div>
      </div>

      {/* Verification Modal for Identity Check */}
      <AuthenticateRatingModal />
    </div>
  );
};

export default QuarterlyRatingsView;
