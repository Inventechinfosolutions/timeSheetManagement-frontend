import { HiddenRatingBadge } from "../components/HiddenRatingBadge";
import { useRevealedRatings } from "../hooks/useRevealedRatings";
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Avatar,
  Button,
  Col,
  Divider,
  Input,
  Rate,
  Row,
  Spin,
  Tooltip,
} from 'antd';
import { Calendar, ChevronLeft, Clock, FileText, Save, Send } from 'lucide-react';
import {
  ManagerReviewItem,
  MAX_FIELD_LENGTH,
  MIN_FIELD_LENGTH,
  PerformanceRating,
  RATING_CATEGORY_ITEMS,
} from './QuarterlyReview.types';
import CommonMultipleUploader from '../../EmployeeDashboard/CommonMultipleUploader';
import {
  uploadQuarterlyReviewFile,
  downloadQuarterlyReviewFile,
  previewQuarterlyReviewFile,
  deleteQuarterlyReviewFile,
  getQuarterlyReviewFiles,
} from '../../reducers/quarterlyReview.reducer';

const { TextArea } = Input;

const PERFORMANCE_RATING_LABELS: Record<string, string> = {
  [PerformanceRating.OUTSTANDING]: 'Outstanding (5.0)',
  [PerformanceRating.EXCEEDS_EXPECTATIONS]: 'Exceeds Expectations (4.0 - 4.9)',
  [PerformanceRating.MEETS_EXPECTATIONS]: 'Meets Expectations (3.0 - 3.9)',
  [PerformanceRating.NEEDS_IMPROVEMENT]: 'Needs Improvement (2.0 - 2.9)',
  [PerformanceRating.UNSATISFACTORY]: 'Unsatisfactory (1.0 - 1.9)',
};

type RatingValues = Record<string, number>;

interface FieldErrors {
  strengths?: string;
  improvements?: string;
  remarks?: string;
  ratings?: string;
}

interface QuarterlyViewPageProps {
  open?: boolean;
  currentReview: ManagerReviewItem | null;
  isViewOnly: boolean;
  ratings: RatingValues;
  finalRating: string;
  strengths: string;
  improvements: string;
  remarks: string;
  fieldErrors: FieldErrors;
  submitting: boolean;
  averageRatingScore: string | number;
  onClose: () => void;
  onSubmitEvaluation: (isDraft: boolean) => void;
  setRatings: React.Dispatch<React.SetStateAction<RatingValues>>;
  setFinalRating: (value: string) => void;
  setStrengths: (value: string) => void;
  setImprovements: (value: string) => void;
  setRemarks: (value: string) => void;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
}

/**
 * FONT CONTROL — single source of truth
 * ----------------------------------------------------------------
 * Everything below is scoped under the ".qr-wrapper" class, which is
 * applied once to the Modal itself. Two things are controlled from
 * exactly one place:
 *
 * 1) FONT FAMILY  -> the `font-family` rule on ".qr-wrapper, .qr-wrapper *"
 * 2) FONT SIZE    -> the `--qr-scale` CSS variable on ".qr-wrapper"
 *
 * The file already uses a deliberate Tailwind type scale
 * (text-[10px] / text-xs / text-sm / text-base / text-lg) to
 * distinguish headings from labels from fine print. Rather than
 * flattening that hierarchy, each size is re-expressed as
 * `base-px * var(--qr-scale)`, so changing ONE number
 * (--qr-scale) scales every size in the modal up or down together,
 * while still preserving the relative hierarchy between them.
 *
 * To resize everything:   change --qr-scale (e.g. 1.1 = 10% bigger)
 * To change the typeface: edit the font-family stack below
 */
const QR_FONT_STYLES = `
  .qr-wrapper, .qr-wrapper * {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .qr-wrapper {
    --qr-scale: 1; /* <-- change this ONE value to resize all text in the modal */
  }

  .qr-wrapper .text-\\[10px\\] { font-size: calc(10px * var(--qr-scale)) !important; }
  .qr-wrapper .text-xs        { font-size: calc(12px * var(--qr-scale)) !important; }
  .qr-wrapper .text-sm        { font-size: calc(14px * var(--qr-scale)) !important; }
  .qr-wrapper .text-base      { font-size: calc(16px * var(--qr-scale)) !important; }
  .qr-wrapper .text-lg        { font-size: calc(18px * var(--qr-scale)) !important; }

  /* Prevent the "Employee Submission Details" column from being stretched
     to match the taller "Manager Evaluation & Rating" column. antd's Row
     applies align-items: stretch to its Col children by default, and that
     wins over a plain flex/height utility class — so it has to be overridden
     explicitly here, scoped to this modal's two-column row. */
  .qr-wrapper .qr-two-col-row {
    align-items: flex-start !important;
  }
  .qr-wrapper .qr-submission-col {
    align-self: flex-start !important;
    height: auto !important;
  }
`;

// Shared hover treatment for every "Employee Submission Details" card:
// Executive Summary, Key Achievements, Key Challenges, Learning & Growth
// Goals. Kept as one constant so all four stay visually identical.
const SUBMISSION_CARD_HOVER_CLASSES =
  'transition-all duration-200 ease-out cursor-default hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5';

const renderItemList = (data: Array<{ title?: string; details: string }> | string | undefined) => {
  if (!data) {
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
        <p className="text-slate-400 text-sm italic">No details provided.</p>
      </div>
    );
  }

  if (typeof data === 'string') {
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
        <p className="text-slate-900 text-sm leading-relaxed whitespace-pre-line">{data}</p>
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
          <p className="text-slate-400 text-sm italic">No details provided.</p>
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {data.map((item, idx) => (
          <li
            key={idx}
            className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}
          >
            {item.title && <h5 className="font-bold text-slate-900 text-xs mb-1">{item.title}</h5>}
            <p className="text-slate-900 text-sm leading-relaxed">{item.details}</p>
          </li>
        ))}
      </ul>
    );
  }

  return null;
};

// Maps a numeric average score (0-5) to the matching PerformanceRating band.
// Keep these thresholds in sync with the <Option> labels in the Select below.
const getPerformanceRatingFromScore = (score: number): PerformanceRating | '' => {
  if (score >= 5.0) return PerformanceRating.OUTSTANDING;
  if (score >= 4.0) return PerformanceRating.EXCEEDS_EXPECTATIONS;
  if (score >= 3.0) return PerformanceRating.MEETS_EXPECTATIONS;
  if (score >= 2.0) return PerformanceRating.NEEDS_IMPROVEMENT;
  if (score >= 1.0) return PerformanceRating.UNSATISFACTORY;
  return '';
};

// Renders the "x/1000" counter for a text field, turning amber near the cap
// and red once it's actually hit — same visual language as the existing
// "x/10 min" indicator, just for the upper bound instead of the lower one.
const renderMaxLengthCounter = (length: number) => {
  const atLimit = length >= MAX_FIELD_LENGTH;
  const nearLimit = !atLimit && length >= MAX_FIELD_LENGTH * 0.9;
  const colorClass = atLimit
    ? 'text-red-500'
    : nearLimit
      ? 'text-amber-500'
      : 'text-slate-700'; // was text-slate-400 — too light to read against the white card

  return (
    <span className={`text-[10px] font-medium ${colorClass}`}>
      {length}/{MAX_FIELD_LENGTH}
    </span>
  );
};

const formatAssignmentDate = (dateVal?: string | Date | null): string => {
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

const QuarterlyViewPage: React.FC<QuarterlyViewPageProps> = ({
  open,
  currentReview,
  isViewOnly,
  ratings,
  finalRating,
  strengths,
  improvements,
  remarks,
  fieldErrors,
  submitting,
  averageRatingScore,
  onClose,
  onSubmitEvaluation,
  setRatings,
  setFinalRating,
  setStrengths,
  setImprovements,
  setRemarks,
  setFieldErrors,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getBasePath = () => {
    if (location.pathname.startsWith('/manager-dashboard')) return '/manager-dashboard';
    if (location.pathname.startsWith('/admin-dashboard')) return '/admin-dashboard';
    return '/employee-dashboard';
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(`${getBasePath()}/quarterly-review`);
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get('mode');
  const effectiveViewOnly =
    modeParam === 'view'
      ? true
      : modeParam === 'edit'
        ? false
        : Boolean(isViewOnly || location.state?.viewOnly);

  const isTargetManager =
    currentReview?.employeeRole?.toUpperCase() === 'MANAGER' ||
    currentReview?.designation?.toLowerCase().includes('manager');

  const unsubmittedStatuses = ['assigned', 'not started', 'not_started', 'draft', 'in progress', 'in_progress'];
  const statusLower = (currentReview?.status || '').trim().toLowerCase();
  const reviewStatusLower = (currentReview?.reviewStatus || '').trim().toLowerCase();

  const isReviewSubmitted = Boolean(
    currentReview?.submittedDate ||
    (statusLower && !unsubmittedStatuses.includes(statusLower)) ||
    (reviewStatusLower && !unsubmittedStatuses.includes(reviewStatusLower))
  );

  const isAlreadyEvaluated = Boolean(
    (currentReview?.status?.toLowerCase() === 'reviewed' ||
      currentReview?.status?.toLowerCase() === 'approved' ||
      currentReview?.status?.toLowerCase() === 'completed' ||
      currentReview?.reviewStatus?.toLowerCase() === 'reviewed' ||
      currentReview?.reviewStatus?.toLowerCase() === 'approved' ||
      currentReview?.reviewStatus?.toLowerCase() === 'completed') &&
    !['in review', 'under review', 'draft', 'pending', 'assigned'].includes(
      (currentReview?.status || '').toLowerCase()
    ) &&
    !['in review', 'under review', 'draft', 'pending', 'assigned'].includes(
      (currentReview?.reviewStatus || '').toLowerCase()
    )
  );

  const isReadOnly = effectiveViewOnly || !isReviewSubmitted;
  const showActionButtons = !effectiveViewOnly;

  const { isRevealed, getRevealedData } = useRevealedRatings();
  const [fileCounts, setFileCounts] = useState<{ [key: number]: number }>({});

  const areAllRatingsFilled = RATING_CATEGORY_ITEMS.every(
    (item) => typeof ratings[item.key] === 'number' && ratings[item.key] > 0
  );

  const areAllFieldsFilled =
    areAllRatingsFilled &&
    strengths.trim().length >= MIN_FIELD_LENGTH &&
    improvements.trim().length >= MIN_FIELD_LENGTH &&
    remarks.trim().length >= MIN_FIELD_LENGTH;

  const isSubmitDisabled = !isReviewSubmitted || submitting || !areAllFieldsFilled;

   useEffect(() => {
    if (isReadOnly) return;

    const numericAvg =
      typeof averageRatingScore === 'string'
        ? parseFloat(averageRatingScore)
        : averageRatingScore;

    if (numericAvg === undefined || numericAvg === null || Number.isNaN(numericAvg)) {
      return;
    }

    const computedRating = getPerformanceRatingFromScore(numericAvg);

    if (computedRating !== finalRating) {
      setFinalRating(computedRating);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [averageRatingScore, isReadOnly]);

  return (
    <>
      {/* Single scoped stylesheet: font-family + font-size */}
      <style>{QR_FONT_STYLES}</style>

      <div className="qr-wrapper w-full max-w-[1400px] mx-auto flex flex-col gap-4">
        {/* Back Button */}
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="hidden lg:inline-flex items-center gap-1.5 text-[#A3AED0] hover:text-[#3311CC] font-semibold text-sm transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Content below back button without card wrapper */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                {effectiveViewOnly ? 'View Evaluation' : (isAlreadyEvaluated ? 'Edit Evaluation' : 'Evaluate Quarterly Review')}
              </h1>
              {currentReview?.employeeName && (
                <>
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="text-indigo-600 font-bold text-base sm:text-lg">
                    {currentReview.employeeName}
                  </span>
                </>
              )}
              {currentReview?.quarter && (
                <span className="text-slate-500 font-medium text-xs sm:text-sm">
                  ({currentReview.quarter})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {effectiveViewOnly
                ? 'Review employee submission details and manager evaluation ratings'
                : (isAlreadyEvaluated
                  ? 'Update quarterly submission evaluation ratings, assess performance criteria, and edit feedback'
                  : 'Evaluate quarterly submission, assess performance criteria, and provide ratings')}
            </p>
          </div>
        </div>

        {!currentReview ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Spin size="large" />
            <p className="text-slate-500 text-sm font-medium mt-4">Loading evaluation details...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* ── Assignment Details Banner (Description full card, Deadline on top right) ── */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm transition-all hover:border-indigo-200">
              {/* Header: Description on left, Deadline on top right */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center shrink-0 text-purple-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Description
                    </p>
                  </div>
                </div>

                {/* Deadline moved to top right side of the card */}
                <div className="flex items-center gap-2.5 bg-amber-50/80 border border-amber-200/70 px-3.5 py-1.5 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-amber-100/80 flex items-center justify-center shrink-0 text-amber-700">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/90 leading-none mb-1">
                      Deadline
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-none">
                      {formatAssignmentDate(currentReview.toDate || currentReview.deadlineAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description Body with scrolling for    above 50 lines */}
              <div
                className="overflow-y-auto custom-scrollbar pr-2"
                style={{ maxHeight: 'calc(50 * 1.625em)' }}
              >
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap break-words">
                  {currentReview.notes || currentReview.description || currentReview.assignmentNotes || 'No instructions or remarks provided.'}
                </p>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar size={48} className="bg-indigo-600 font-bold">
                  {currentReview.employeeName.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{currentReview.employeeName}</h4>
                    {currentReview.employeeRole && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${currentReview.employeeRole.toUpperCase() === "MANAGER"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                      >
                        {currentReview.employeeRole}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ID: <span className="font-semibold text-slate-700">{currentReview.employeeId}</span> &bull; {currentReview.department} &bull; {currentReview.designation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <p className="text-slate-400 font-normal text-xs">Quarter</p>
                  <p className="text-black font-semibold text-sm">{currentReview.quarter}</p>
                </div>
                <Divider type="vertical" className="h-8" />
                <div>
                  <p className="text-slate-400 font-normal">Submitted On</p>
                  <p className="text-slate-800">
                    {currentReview.submittedDate
                      ? new Date(currentReview.submittedDate).toLocaleDateString('en-IN')
                      : '—'}
                  </p>
                </div>
                {currentReview.evaluatorName && (
                  <>
                    <Divider type="vertical" className="h-8" />
                    <div>
                      <p className="text-slate-400 font-normal">Evaluated By</p>
                      <p className="text-slate-800 font-semibold">
                        {currentReview.evaluatorName} {currentReview.evaluatorRole ? `(${currentReview.evaluatorRole})` : ''}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Row gutter={[20, 20]} align="top" className="qr-two-col-row">
              <Col xs={24} lg={12} className="qr-submission-col">
                <div className="flex flex-col gap-5">

                  {/* ── Section header ── */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-black">
                      {isTargetManager ? 'Manager Submission Details' : 'Employee Submission Details'}
                    </span>
                    <div className="flex-1 h-px bg-indigo-100" />
                  </div>

                  {!isReviewSubmitted ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-3 shadow-sm">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Review Not Submitted Yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                        {isTargetManager
                          ? 'This review has not been submitted to the Admin & CEO yet. Submission details will appear here once submitted.'
                          : 'This review has not been submitted to the Manager, Admin & CEO yet. Submission details will appear here once submitted.'}
                      </p>
                      <div className="w-full max-w-xs bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Review Status:</span>
                          <span className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full text-[11px]">
                            {currentReview.status || currentReview.reviewStatus || 'Assigned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Deadline:</span>
                          <span className="font-semibold text-slate-700">
                            {formatAssignmentDate(currentReview.toDate || currentReview.deadlineAt)}
                          </span>
                        </div>
                        {currentReview.managerName && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Assigned By:</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                              {currentReview.managerName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>

                      {/* ── 1. Quarter Overview ── */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                        <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                          1. Quarter Overview
                        </h5>
                        {currentReview.overview ? (
                          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                            {currentReview.overview}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-sm italic">No overview provided.</p>
                        )}
                      </div>

                      {/* ── 2. Accomplishments & Challenges ── */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                        <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                          2. Accomplishments &amp; Challenges
                        </h5>
                        {(() => {
                          // Use structured projects if available, otherwise fall back to old achievements/challenges
                          const projects = Array.isArray(currentReview.projects) && currentReview.projects.length > 0
                            ? currentReview.projects
                            : null;

                          if (projects) {
                            return (
                              <div className="flex flex-col gap-3">
                                {projects.map((proj, idx) => (
                                  <div key={idx} className={`border border-slate-200 rounded-xl overflow-hidden ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                                    {/* Project name banner */}
                                    <div className="bg-indigo-50 border-b border-indigo-100 px-3 py-2 flex items-center gap-2">
                                      <span className="text-xs font-medium text-black">
                                        {idx + 1}. Project Title:
                                      </span>

                                      <span className="text-xs font-semibold text-slate-700 truncate">
                                        {proj.projectTitle || `Project ${idx + 1}`}
                                      </span>
                                    </div>
                                    <div className="p-3 flex flex-col gap-2.5">
                                      {/* Achievement */}
                                      <div>
                                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Achievement</span>
                                        <p className="text-slate-800 text-sm leading-relaxed mt-0.5 whitespace-pre-line">
                                          {proj.achievement || <span className="text-slate-400 italic">Not provided</span>}
                                        </p>
                                      </div>
                                      {/* Challenge */}
                                      <div>
                                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Challenge</span>
                                        <p className="text-slate-800 text-sm leading-relaxed mt-0.5 whitespace-pre-line">
                                          {proj.challenge || <span className="text-slate-400 italic">Not provided</span>}
                                        </p>
                                      </div>
                                      {/* Attachments */}
                                      <div>
                                        {(fileCounts[idx] !== undefined && fileCounts[idx] > 0) && (
                                          <span className="text-xs font-medium text-slate-600 uppercase tracking-wider block mb-1">
                                            Attachments
                                          </span>
                                        )}
                                        <CommonMultipleUploader
                                          variant="chip"
                                          entityType="QUARTERLY_REVIEW"
                                          entityId={currentReview.id || 0}
                                          refId={idx + 1}
                                          refType="QUARTERLY_REVIEW_DOCUMENT"
                                          uploadFile={uploadQuarterlyReviewFile}
                                          downloadFile={downloadQuarterlyReviewFile}
                                          previewFile={previewQuarterlyReviewFile}
                                          deleteFile={deleteQuarterlyReviewFile}
                                          getFiles={getQuarterlyReviewFiles}
                                          disabled={true}
                                          maxFiles={3}
                                          allowedTypes={["images", "pdf", "docs"]}
                                          hideUploadButton={true}
                                          hideEmptyState={true}
                                          fetchOnMount={Boolean(currentReview.id && currentReview.id > 0)}
                                          onFilesChange={(files) => {
                                            const count = files ? files.length : 0;
                                            setFileCounts((prev) => {
                                              if (prev[idx] === count) return prev;
                                              return { ...prev, [idx]: count };
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          // Fallback: legacy achievements/challenges arrays
                          const achs = Array.isArray(currentReview.achievements)
                            ? currentReview.achievements
                            : typeof currentReview.achievements === 'string' && currentReview.achievements
                              ? [{ details: currentReview.achievements }]
                              : [];
                          const chs = Array.isArray(currentReview.challenges)
                            ? currentReview.challenges
                            : typeof currentReview.challenges === 'string' && currentReview.challenges
                              ? [{ details: currentReview.challenges }]
                              : [];

                          if (achs.length === 0 && chs.length === 0) {
                            return <p className="text-slate-400 text-sm italic">No data provided.</p>;
                          }

                          return (
                            <div className="flex flex-col gap-3">
                              {achs.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Achievements</span>
                                  {renderItemList(achs)}
                                </div>
                              )}
                              {chs.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Challenges</span>
                                  {renderItemList(chs)}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ── 3. Learning & Goals ── */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                        <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                          3. Learning &amp; Goals
                        </h5>
                        {renderItemList(currentReview.learningGoals)}
                      </div>

                      {/* ── 4. Team Contribution ── */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                        <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                          4. Team Contribution
                        </h5>
                        {Array.isArray(currentReview.teamContribution) && currentReview.teamContribution.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {currentReview.teamContribution.map((item, idx) => {
                              const stars = Math.round(Number(item.rating) || 0);
                              return (
                                <div key={idx} className={`flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                                  <span className="text-xs font-medium text-slate-700 capitalize">
                                    {item.category.replace(/_/g, ' ')}
                                  </span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={`w-3.5 h-3.5 ${star <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    ))}
                                    <span className="ml-1.5 text-[10px] font-bold text-slate-500">{stars}/5</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm italic">No team contribution data provided.</p>
                        )}
                      </div>

                      {/* ── 5. Company Environment ── */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                            5. Company Environment
                          </h5>
                          {currentReview.companyEnvironment?.rating != null && (() => {
                            const EMOJIS = [
                              { value: 1, label: 'Very Bad', icon: '😡' },
                              { value: 2, label: 'Bad', icon: '🙁' },
                              { value: 3, label: 'Neutral', icon: '😐' },
                              { value: 4, label: 'Good', icon: '🙂' },
                              { value: 5, label: 'Excellent', icon: '🤩' },
                            ];
                            const emoji = EMOJIS.find(e => e.value === currentReview.companyEnvironment?.rating);
                            return emoji ? (
                              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl">
                                <span className="text-lg leading-none">{emoji.icon}</span>
                                <span className="text-[10px] font-bold text-indigo-700">{emoji.label}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>

                        {currentReview.companyEnvironment ? (
                          <div className="flex flex-col gap-2.5">
                            {[
                              { label: 'Work Culture Feedback', key: 'workCultureFeedback' as const },
                              { label: 'Work-Life Balance', key: 'workLifeBalance' as const },
                              { label: 'Suggestions', key: 'suggestions' as const },
                            ].map(({ label, key }) => {
                              const val = currentReview.companyEnvironment?.[key];
                              if (!val) return null;
                              return (
                                <div key={key} className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                                  <p className="text-slate-800 text-sm leading-relaxed mt-1 whitespace-pre-line">{val}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm italic">No company environment feedback provided.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                      Manager Evaluation & Rating
                    </h4>
                    <div className="bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Score</span>
                      {(() => {
                        const isRev = isRevealed(currentReview?.id, currentReview?.quarter);
                        const revData = isRev ? getRevealedData(currentReview?.id, currentReview?.quarter) : null;
                        const isHidden = !isRev && Boolean(currentReview?.isFinalRatingHidden);
                        if (isHidden) {
                          return (
                            <HiddenRatingBadge
                              reviewId={currentReview?.id}
                              quarter={currentReview?.quarter}
                              isFinalRatingHidden={true}
                              hasFinalRating={true}
                            />
                          );
                        }
                        const effectiveAvg = revData?.finalRating ?? averageRatingScore;
                        return <span className="text-lg font-black text-indigo-700">{effectiveAvg} / 5.0</span>;
                      })()}
                    </div>
                  </div>

                  <div className={`space-y-3 bg-white border ${fieldErrors.ratings ? 'border-red-300' : 'border-slate-200'} rounded-xl p-3`}>
                    {RATING_CATEGORY_ITEMS.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 min-w-0 truncate flex items-center gap-1">
                          <span>{item.label}</span>
                          <span className="text-red-500 font-bold">*</span>
                        </span>
                        <Rate
                          disabled={isReadOnly}
                          value={ratings[item.key] || 0}
                          onChange={(val) => {
                            setRatings((prev) => ({ ...prev, [item.key]: val }));
                            if (fieldErrors.ratings) {
                              setFieldErrors((prev) => ({ ...prev, ratings: undefined }));
                            }
                          }}
                          className="!text-amber-400 text-sm shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                  {fieldErrors.ratings && (
                    <p className="text-red-500 text-xs mt-0.5">{fieldErrors.ratings}</p>
                  )}

                  <Divider className="!my-2" />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800 text-xs uppercase">
                        Final Performance Rating
                      </label>
                    </div>
                    {/* Rendered as plain text instead of a disabled antd
                        <Select> — this field is always read-only (the
                        Select below was hard-coded `disabled`), and antd's
                        built-in disabled-state color kept overriding our
                        black-text fix, making it look faded/illegible.
                        A plain div sidesteps that fight entirely. */}
                    <div
                      className={`bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 ${SUBMISSION_CARD_HOVER_CLASSES}`}
                    >
                      {(() => {
                        const isRev = isRevealed(currentReview?.id, currentReview?.quarter);
                        const revData = isRev ? getRevealedData(currentReview?.id, currentReview?.quarter) : null;
                        const effectiveFR = revData?.finalRating ?? finalRating;
                        const isHidden = !isRev && Boolean(currentReview?.isFinalRatingHidden);
                        if (isHidden) {
                          return (
                            <HiddenRatingBadge
                              reviewId={currentReview?.id}
                              quarter={currentReview?.quarter}
                              isFinalRatingHidden={true}
                              hasFinalRating={true}
                            />
                          );
                        }
                        return PERFORMANCE_RATING_LABELS[effectiveFR] || effectiveFR || '—';
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs uppercase mb-1.5 flex items-center gap-1">
                      <span>Performance Strengths</span>
                      <span className="text-red-500 font-bold normal-case">*</span>
                    </label>
                    <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isReadOnly}
                        autoSize={{ minRows: 2 }}
                        maxLength={MAX_FIELD_LENGTH}
                        placeholder="Highlight key strengths and standout contributions..."
                        value={strengths}
                        onChange={(e) => {
                          setStrengths(e.target.value);
                          if (fieldErrors.strengths && e.target.value.trim().length >= MIN_FIELD_LENGTH) {
                            setFieldErrors((prev) => ({ ...prev, strengths: undefined }));
                          }
                        }}
                        status={fieldErrors.strengths ? 'error' : undefined}
                        className="!border-none !shadow-none !p-0 !bg-transparent !resize-none !text-slate-900 !text-sm !leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {fieldErrors.strengths ? (
                        <p className="text-red-500 text-xs">{fieldErrors.strengths}</p>
                      ) : (
                        <span />
                      )}
                      {!isReadOnly && renderMaxLengthCounter(strengths.length)}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs uppercase mb-1.5 flex items-center gap-1">
                      <span>Areas for Improvement</span>
                      <span className="text-red-500 font-bold normal-case">*</span>
                    </label>
                    <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isReadOnly}
                        autoSize={{ minRows: 2 }}
                        maxLength={MAX_FIELD_LENGTH}
                        placeholder="Specify areas for growth and skill development..."
                        value={improvements}
                        onChange={(e) => {
                          setImprovements(e.target.value);
                          if (fieldErrors.improvements && e.target.value.trim().length >= MIN_FIELD_LENGTH) {
                            setFieldErrors((prev) => ({ ...prev, improvements: undefined }));
                          }
                        }}
                        status={fieldErrors.improvements ? 'error' : undefined}
                        className="!border-none !shadow-none !p-0 !bg-transparent !resize-none !text-slate-900 !text-sm !leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {fieldErrors.improvements ? (
                        <p className="text-red-500 text-xs">{fieldErrors.improvements}</p>
                      ) : (
                        <span />
                      )}
                      {!isReadOnly && renderMaxLengthCounter(improvements.length)}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs uppercase mb-1.5 flex items-center gap-1">
                      <span>Manager Feedback & Remarks</span>
                      <span className="text-red-500 font-bold normal-case">*</span>
                    </label>
                    <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isReadOnly}
                        autoSize={{ minRows: 2 }}
                        maxLength={MAX_FIELD_LENGTH}
                        placeholder="Overall feedback and recommendations..."
                        value={remarks}
                        onChange={(e) => {
                          setRemarks(e.target.value);
                          if (fieldErrors.remarks && e.target.value.trim().length >= MIN_FIELD_LENGTH) {
                            setFieldErrors((prev) => ({ ...prev, remarks: undefined }));
                          }
                        }}
                        status={fieldErrors.remarks ? 'error' : undefined}
                        className="!border-none !shadow-none !p-0 !bg-transparent !resize-none !text-slate-900 !text-sm !leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {fieldErrors.remarks ? (
                        <p className="text-red-500 text-xs">{fieldErrors.remarks}</p>
                      ) : (
                        <span />
                      )}
                      {!isReadOnly && renderMaxLengthCounter(remarks.length)}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Action Bar (Bottom) */}
            {showActionButtons && (
              <div className="flex flex-wrap items-center justify-end gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Tooltip
                    title={
                      !isReviewSubmitted
                        ? (isTargetManager
                          ? 'Evaluation cannot be saved until the manager submits their review'
                          : 'Evaluation cannot be saved until the employee submits their review')
                        : undefined
                    }
                  >
                    <span>
                      <Button
                        type="default"
                        icon={<Save className="w-4 h-4" />}
                        loading={submitting}
                        disabled={!isReviewSubmitted || submitting}
                        onClick={() => onSubmitEvaluation(true)}
                        className="!rounded-xl !font-semibold disabled:!border-slate-200 disabled:!text-slate-400 disabled:!bg-slate-100 disabled:cursor-not-allowed !border-indigo-200 !text-indigo-600 hover:!bg-indigo-50"
                      >
                        Save Draft
                      </Button>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={
                      !isReviewSubmitted
                        ? (isTargetManager
                          ? 'Evaluation cannot be submitted until the manager submits their review'
                          : 'Evaluation cannot be submitted until the employee submits their review')
                        : !areAllFieldsFilled
                          ? (!areAllRatingsFilled && (strengths.trim().length < MIN_FIELD_LENGTH || improvements.trim().length < MIN_FIELD_LENGTH || remarks.trim().length < MIN_FIELD_LENGTH)
                              ? 'Please provide all ratings and fill all feedback fields to submit'
                              : !areAllRatingsFilled
                                ? 'Please provide ratings for all performance categories to submit'
                                : 'Please fill all feedback fields to submit')
                          : undefined
                    }
                  >
                    <span>
                      <Button
                        type="primary"
                        icon={<Send className="w-4 h-4" />}
                        loading={submitting}
                        disabled={isSubmitDisabled}
                        onClick={() => onSubmitEvaluation(false)}
                        className="!rounded-xl !font-semibold disabled:!bg-slate-200 disabled:!text-slate-400 disabled:!border-slate-200 disabled:cursor-not-allowed !bg-indigo-600 hover:!bg-indigo-700 !text-white"
                      >
                        {isAlreadyEvaluated ? 'Update Evaluation' : 'Submit Final Review'}
                      </Button>
                    </span>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default QuarterlyViewPage;