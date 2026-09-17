import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Avatar,
  Button,
  Col,
  Divider,
  Input,
  Rate,
  Row,
  Spin,
} from 'antd';
import { ArrowLeft, Calendar, Clock, FileText, Save, Send } from 'lucide-react';
import {
  ManagerReviewItem,
  MIN_FIELD_LENGTH,
  PerformanceRating,
  RATING_CATEGORY_ITEMS,
} from './QuarterlyReviewmobile.types';
import CommonMultipleUploader from '../../EmployeeDashboard/CommonMultipleUploader';
import {
  uploadQuarterlyReviewFile,
  downloadQuarterlyReviewFile,
  previewQuarterlyReviewFile,
  deleteQuarterlyReviewFile,
  getQuarterlyReviewFiles,
} from '../../reducers/quarterlyReview.reducer';

const { TextArea } = Input;

type RatingValues = Record<string, number>;

interface FieldErrors {
  strengths?: string;
  improvements?: string;
  remarks?: string;
  ratings?: string;
}

interface QuarterlyViewPageMobileProps {
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
  loadingReview?: boolean;
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

const QVM_FONT_STYLES = `
  .qvm-wrapper, .qvm-wrapper * {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .qvm-wrapper {
    --qvm-scale: 1; /* <-- change this ONE value to resize all text in the modal */
  }

  .qvm-wrapper .text-\\[9px\\]  { font-size: calc(9px * var(--qvm-scale)) !important; }
  .qvm-wrapper .text-\\[10px\\] { font-size: calc(10px * var(--qvm-scale)) !important; }
  .qvm-wrapper .text-\\[11px\\] { font-size: calc(11px * var(--qvm-scale)) !important; }
  .qvm-wrapper .text-xs        { font-size: calc(12px * var(--qvm-scale)) !important; }
  .qvm-wrapper .text-sm        { font-size: calc(14px * var(--qvm-scale)) !important; }
  .qvm-wrapper .text-base      { font-size: calc(16px * var(--qvm-scale)) !important; }
  .qvm-wrapper .text-lg        { font-size: calc(18px * var(--qvm-scale)) !important; }
`;

const SUBMISSION_CARD_HOVER_CLASSES =
  'transition-all duration-200 ease-out cursor-default hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5';

const PERFORMANCE_RATING_LABELS: Record<string, string> = {
  [PerformanceRating.OUTSTANDING]: 'Outstanding (5.0)',
  [PerformanceRating.EXCEEDS_EXPECTATIONS]: 'Exceeds Expectations (4.0 - 4.9)',
  [PerformanceRating.MEETS_EXPECTATIONS]: 'Meets Expectations (3.0 - 3.9)',
  [PerformanceRating.NEEDS_IMPROVEMENT]: 'Needs Improvement (2.0 - 2.9)',
  [PerformanceRating.UNSATISFACTORY]: 'Unsatisfactory (1.0 - 1.9)',
};

const renderItemList = (data: Array<{ title?: string; details: string }> | string | undefined) => {
  if (!data) {
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
        <p className="text-slate-400 text-xs sm:text-sm italic">No details provided.</p>
      </div>
    );
  }

  if (typeof data === 'string') {
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
        <p className="text-slate-900 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{data}</p>
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className={`bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
          <p className="text-slate-400 text-xs sm:text-sm italic">No details provided.</p>
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {data.map((item, idx) => (
          <li
            key={idx}
            className={`bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}
          >
            {item.title && <h5 className="font-bold text-slate-900 text-xs mb-1">{item.title}</h5>}
            <p className="text-slate-900 text-xs sm:text-sm leading-relaxed">{item.details}</p>
          </li>
        ))}
      </ul>
    );
  }

  return null;
};

// Maps a numeric average score (0-5) to the matching PerformanceRating band.
const getPerformanceRatingFromScore = (score: number): PerformanceRating | '' => {
  if (score >= 5.0) return PerformanceRating.OUTSTANDING;
  if (score >= 4.0) return PerformanceRating.EXCEEDS_EXPECTATIONS;
  if (score >= 3.0) return PerformanceRating.MEETS_EXPECTATIONS;
  if (score >= 2.0) return PerformanceRating.NEEDS_IMPROVEMENT;
  if (score >= 1.0) return PerformanceRating.UNSATISFACTORY;
  return '';
};

const formatAssignmentDate = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '—';
  try {
    const parsedDate = new Date(dateVal);
    if (isNaN(parsedDate.getTime())) return String(dateVal);
    return parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateVal);
  }
};

const QuarterlyViewPageMobile: React.FC<QuarterlyViewPageMobileProps> = ({
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
  loadingReview: _loadingReview,
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
  const [fileCounts, setFileCounts] = useState<{ [key: number]: number }>({});
  const location = useLocation();

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

  const isReadOnly = effectiveViewOnly || isAlreadyEvaluated || !isReviewSubmitted;
  const showActionButtons = !effectiveViewOnly && !isAlreadyEvaluated;

  const areAllRatingsFilled = RATING_CATEGORY_ITEMS.every(
    (item) => typeof ratings[item.key] === 'number' && ratings[item.key] > 0
  );

  const areAllFieldsFilled =
    areAllRatingsFilled &&
    strengths.trim().length >= MIN_FIELD_LENGTH &&
    improvements.trim().length >= MIN_FIELD_LENGTH &&
    remarks.trim().length >= MIN_FIELD_LENGTH;

  const isSubmitDisabled = !isReviewSubmitted || submitting || !areAllFieldsFilled;

  // Auto-sync the Final Performance Rating dropdown whenever the manager
  // changes any star rating (which changes averageRatingScore).
  // Skipped in read-only mode so a saved/submitted review never mutates.
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
      <style>{QVM_FONT_STYLES}</style>

      <div className="qvm-wrapper w-full max-w-full flex flex-col gap-4">
        {/* Mobile Page Header Bar */}
        <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              type="default"
              size="small"
              icon={<ArrowLeft className="w-3.5 h-3.5 text-slate-700" />}
              onClick={onClose}
              className="!inline-flex !items-center !gap-1 !px-2.5 !py-1 !h-auto !rounded-lg !border-slate-300 !text-slate-700 hover:!text-indigo-600 !font-semibold shrink-0"
            >
              Back
            </Button>
            <div className="min-w-0 truncate">
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                {effectiveViewOnly || isAlreadyEvaluated ? 'View Evaluation' : 'Evaluate'}
                {currentReview?.employeeName && (
                  <span className="text-indigo-600 font-bold ml-1.5 truncate">
                    {currentReview.employeeName}
                  </span>
                )}
              </h1>
              {currentReview?.quarter && (
                <p className="text-[11px] text-slate-500 truncate">
                  {currentReview.quarter}
                </p>
              )}
            </div>
          </div>

          {!isViewOnly && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="default"
                size="small"
                icon={<Save className="w-3.5 h-3.5" />}
                loading={submitting}
                onClick={() => onSubmitEvaluation(true)}
                className="!rounded-lg !border-indigo-200 !text-indigo-600 hover:!bg-indigo-50 !font-semibold text-xs"
              >
                Draft
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<Send className="w-3.5 h-3.5" />}
                loading={submitting}
                onClick={() => onSubmitEvaluation(false)}
                className="!rounded-lg !bg-indigo-600 hover:!bg-indigo-700 !font-semibold text-xs"
              >
                Submit
              </Button>
            </div>
          )}
        </div>

        {!currentReview ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Spin size="default" />
            <p className="text-slate-500 text-xs font-medium mt-3">Loading evaluation details...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* ── Assignment Details Banner ── */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center shrink-0 text-purple-600">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</p>
                </div>

                <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/60 px-2.5 py-1 rounded-lg">
                  <div className="w-5 h-5 rounded bg-amber-100/80 flex items-center justify-center shrink-0 text-amber-700">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700/80 leading-none mb-0.5">Deadline</p>
                    <p className="text-xs font-semibold text-slate-800 leading-none">
                      {formatAssignmentDate(currentReview.toDate || currentReview.deadlineAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="overflow-y-auto custom-scrollbar pr-1"
                style={{ maxHeight: 'calc(50 * 1.625em)' }}
              >
                <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap break-words">
                  {currentReview.notes || currentReview.description || currentReview.assignmentNotes || 'No instructions or remarks provided.'}
                </p>
              </div>
            </div>

            {/* Employee Header info bar - Stacked layout for mobile */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size={40} className="bg-indigo-600 font-bold shrink-0">
                  {currentReview.employeeName.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      {currentReview.employeeName}
                    </h4>
                    {currentReview.employeeRole && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          currentReview.employeeRole.toUpperCase() === "MANAGER"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {currentReview.employeeRole}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    ID: <span className="font-semibold text-slate-700">{currentReview.employeeId}</span> &bull; {currentReview.department} &bull; {currentReview.designation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-indigo-100">
                <div>
                  <p className="text-slate-500 font-normal text-[10px] sm:text-sm">Quarter</p>
                  <p className="text-black font-semibold text-xs sm:text-sm">{currentReview.quarter}</p>
                </div>
                <Divider type="vertical" className="h-6 sm:h-8" />
                <div>
                  <p className="text-slate-400 font-normal text-[10px] sm:text-xs">Submitted On</p>
                  <p className="text-slate-800 text-xs sm:text-sm">
                    {currentReview.submittedDate
                      ? new Date(currentReview.submittedDate).toLocaleDateString('en-IN')
                      : '—'}
                  </p>
                </div>
                {currentReview.evaluatorName && (
                  <>
                    <Divider type="vertical" className="h-6 sm:h-8" />
                    <div>
                      <p className="text-slate-400 font-normal text-[10px] sm:text-xs">Evaluated By</p>
                      <p className="text-slate-800 text-xs sm:text-sm font-semibold">
                        {currentReview.evaluatorName} {currentReview.evaluatorRole ? `(${currentReview.evaluatorRole})` : ''}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Single/Double column layout: Submission Details & Evaluation */}
            <Row gutter={[16, 16]}>
              {/* Employee Submission Details */}
              <Col xs={24} lg={12}>
                <div className="flex flex-col gap-3.5 sm:gap-4">
                  {/* ── Section header ── */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-black">
                      {isTargetManager ? 'Manager Submission Details' : 'Employee Submission Details'}
                    </span>
                    <div className="flex-1 h-px bg-indigo-100" />
                  </div>

                  {!isReviewSubmitted ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-2.5 shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                        Review Not Submitted Yet
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm leading-relaxed mb-3">
                        {isTargetManager
                          ? 'This review has not been submitted to the Admin & CEO yet. Submission details will appear here once submitted.'
                          : 'This review has not been submitted to the Manager, Admin & CEO yet. Submission details will appear here once submitted.'}
                      </p>
                      <div className="w-full max-w-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col gap-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Review Status:</span>
                          <span className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full text-[10px]">
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
                            <span className="font-semibold text-slate-700 truncate max-w-[130px]">
                              {currentReview.managerName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>

                  {/* ── 1. Quarter Overview ── */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2 shadow-sm">
                    <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                      1. Quarter Overview
                    </h5>
                    {currentReview.overview ? (
                      <p className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {currentReview.overview}
                      </p>
                    ) : (
                      <p className="text-slate-400 text-xs sm:text-sm italic">No overview provided.</p>
                    )}
                  </div>

                  {/* ── 2. Accomplishments & Challenges ── */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-sm">
                    <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                      2. Accomplishments &amp; Challenges
                    </h5>
                    {(() => {
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
                                  <div>
                                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Achievement</span>
                                    <p className="text-slate-800 text-xs sm:text-sm leading-relaxed mt-0.5 whitespace-pre-line">
                                      {proj.achievement || <span className="text-slate-400 italic">Not provided</span>}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Challenge</span>
                                    <p className="text-slate-800 text-xs sm:text-sm leading-relaxed mt-0.5 whitespace-pre-line">
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
                        return <p className="text-slate-400 text-xs sm:text-sm italic">No data provided.</p>;
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
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2 shadow-sm">
                    <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
                      3. Learning &amp; Goals
                    </h5>
                    {renderItemList(currentReview.learningGoals)}
                  </div>

                  {/* ── 4. Team Contribution ── */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-sm">
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
                      <p className="text-slate-400 text-xs sm:text-sm italic">No team contribution data provided.</p>
                    )}
                  </div>

                  {/* ── 5. Company Environment ── */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-sm">
  <div className="flex items-center justify-between">
    <h5 className="text-xs font-medium text-black uppercase tracking-widest mb-0.5">
      5. Company Environment
    </h5>
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
          <div
            key={key}
            className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {label}
            </span>

            <p className="text-slate-800 text-xs sm:text-sm leading-relaxed mt-1 whitespace-pre-line">
              {val}
            </p>
          </div>
        );
      })}

      {/* Rating - placed after Suggestions card */}
      {currentReview.companyEnvironment?.rating != null && (() => {
        const EMOJIS = [
          { value: 1, label: 'Very Bad', icon: '😡' },
          { value: 2, label: 'Bad', icon: '🙁' },
          { value: 3, label: 'Neutral', icon: '😐' },
          { value: 4, label: 'Good', icon: '🙂' },
          { value: 5, label: 'Excellent', icon: '🤩' },
        ];

        const emoji = EMOJIS.find(
          e => e.value === currentReview.companyEnvironment?.rating
        );

        return emoji ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl">
              <span className="text-lg leading-none">
                {emoji.icon}
              </span>

              <span className="text-[10px] font-bold text-indigo-700">
                {emoji.label}
              </span>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  ) : (
    <p className="text-slate-400 text-xs sm:text-sm italic">
      No company environment feedback provided.
    </p>
  )}
</div>
                    </>
                  )}
                </div>
              </Col>

              {/* Manager Evaluation */}
              <Col xs={24} lg={12}>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3.5 sm:gap-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                      Evaluation & Rating
                    </h4>
                    <div className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Avg Score</span>
                      <span className="text-base sm:text-lg font-black text-indigo-700">{averageRatingScore} / 5.0</span>
                    </div>
                  </div>

                  <div className={`space-y-3 bg-white border ${fieldErrors.ratings ? 'border-red-300' : 'border-slate-200'} rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
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
                          className="!text-amber-400 text-xs sm:text-sm shrink-0"
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
                        built-in disabled-state color kept fading it out.
                        A plain div sidesteps that fight entirely. */}
                    <div
                      className={`bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 ${SUBMISSION_CARD_HOVER_CLASSES}`}
                    >
                      {PERFORMANCE_RATING_LABELS[finalRating] || finalRating || '—'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1">
                        <span>Performance Strengths</span>
                        <span className="text-red-500 font-bold normal-case">*</span>
                      </label>
                      {!isReadOnly && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {strengths.trim().length}/{MIN_FIELD_LENGTH} min
                        </span>
                      )}
                    </div>
                    <div className={`bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isReadOnly}
                        autoSize={{ minRows: 2 }}
                        placeholder="Highlight key strengths and standout contributions..."
                        value={strengths}
                        onChange={(changeEvent) => {
                          setStrengths(changeEvent.target.value);
                          if (fieldErrors.strengths && changeEvent.target.value.trim().length >= MIN_FIELD_LENGTH) {
                            setFieldErrors((previousErrors) => ({ ...previousErrors, strengths: undefined }));
                          }
                        }}
                        status={fieldErrors.strengths ? 'error' : undefined}
                        className="!border-none !shadow-none !p-0 !bg-transparent !resize-none text-xs sm:text-sm !text-slate-900"
                      />
                    </div>
                    {fieldErrors.strengths && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.strengths}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1">
                        <span>Areas for Improvement</span>
                        <span className="text-red-500 font-bold normal-case">*</span>
                      </label>
                      {!isReadOnly && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {improvements.trim().length}/{MIN_FIELD_LENGTH} min
                        </span>
                      )}
                    </div>
                    <div className={`bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isReadOnly}
                        autoSize={{ minRows: 2 }}
                        placeholder="Specify areas for growth and skill development..."
                        value={improvements}
                        onChange={(changeEvent) => {
                          setImprovements(changeEvent.target.value);
                          if (fieldErrors.improvements && changeEvent.target.value.trim().length >= MIN_FIELD_LENGTH) {
                            setFieldErrors((previousErrors) => ({ ...previousErrors, improvements: undefined }));
                          }
                        }}
                        status={fieldErrors.improvements ? 'error' : undefined}
                        className="!border-none !shadow-none !p-0 !bg-transparent !resize-none text-xs sm:text-sm !text-slate-900"
                      />
                    </div>
                    {fieldErrors.improvements && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.improvements}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1">
                        <span>Manager Feedback & Remarks</span>
                        <span className="text-red-500 font-bold normal-case">*</span>
                      </label>
                      {!isReadOnly && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {remarks.trim().length}/{MIN_FIELD_LENGTH} min
                        </span>
                      )}
                    </div>
                    <div className={`bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isReadOnly}
                        autoSize={{ minRows: 2 }}
                        placeholder="Overall feedback and recommendations..."
                        value={remarks}
                        onChange={(changeEvent) => {
                          setRemarks(changeEvent.target.value);
                          if (fieldErrors.remarks && changeEvent.target.value.trim().length >= MIN_FIELD_LENGTH) {
                            setFieldErrors((previousErrors) => ({ ...previousErrors, remarks: undefined }));
                          }
                        }}
                        status={fieldErrors.remarks ? 'error' : undefined}
                        className="!border-none !shadow-none !p-0 !bg-transparent !resize-none text-xs sm:text-sm !text-slate-900"
                      />
                    </div>
                    {fieldErrors.remarks && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.remarks}</p>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            {/* Mobile Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-slate-200 bg-white p-3.5 rounded-2xl border shadow-sm">
              <Button
                type="default"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={onClose}
                className="!rounded-xl !border-slate-300 !text-slate-700 hover:!text-indigo-600 !font-semibold"
              >
                Back to Reviews
              </Button>

              {showActionButtons && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="default"
                    icon={<Save className="w-4 h-4" />}
                    loading={submitting}
                    disabled={!isReviewSubmitted || submitting}
                    onClick={() => onSubmitEvaluation(true)}
                    className="!rounded-xl !border-indigo-200 !text-indigo-600 hover:!bg-indigo-50 !font-semibold flex-1 sm:flex-none disabled:!opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="primary"
                    icon={<Send className="w-4 h-4" />}
                    loading={submitting}
                    disabled={isSubmitDisabled}
                    onClick={() => onSubmitEvaluation(false)}
                    className="!rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !font-semibold flex-1 sm:flex-none disabled:!opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Final
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuarterlyViewPageMobile;