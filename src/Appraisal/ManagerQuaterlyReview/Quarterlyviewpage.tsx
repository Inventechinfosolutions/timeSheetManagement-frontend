import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Col,
  Divider,
  Input,
  Modal,
  Rate,
  Row,
} from 'antd';
import { Save, Send, } from 'lucide-react';
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

// Display labels for the read-only "Final Performance Rating" field.
// This used to be rendered via a disabled antd <Select>, but antd's
// built-in disabled-state color kept fighting our override (and the
// Tailwind !text-slate-700 utility on top of it), so the text never
// landed on a clean, consistent black. Since this field is always
// disabled/read-only, a plain text display sidesteps that entirely.
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
}

interface QuarterlyViewPageProps {
  open: boolean;
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
const getPerformanceRatingFromScore = (score: number): PerformanceRating => {
  if (score >= 5.0) return PerformanceRating.OUTSTANDING;
  if (score >= 4.0) return PerformanceRating.EXCEEDS_EXPECTATIONS;
  if (score >= 3.0) return PerformanceRating.MEETS_EXPECTATIONS;
  if (score >= 2.0) return PerformanceRating.NEEDS_IMPROVEMENT;
  return PerformanceRating.UNSATISFACTORY;
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
  const [fileCounts, setFileCounts] = useState<{ [key: number]: number }>({});

  // Auto-sync the Final Performance Rating dropdown whenever the manager
  // changes any star rating (which changes averageRatingScore).
  // Skipped in view-only mode so a saved/submitted review never mutates.
  useEffect(() => {
    if (isViewOnly) return;

    const numericAvg =
      typeof averageRatingScore === 'string'
        ? parseFloat(averageRatingScore)
        : averageRatingScore;

    if (numericAvg === undefined || numericAvg === null || Number.isNaN(numericAvg) || numericAvg <= 0) {
      return;
    }

    const computedRating = getPerformanceRatingFromScore(numericAvg);

    if (computedRating !== finalRating) {
      setFinalRating(computedRating);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [averageRatingScore, isViewOnly]);

  return (
    <>
      {/* Single scoped stylesheet: font-family + font-size for the whole modal */}
      <style>{QR_FONT_STYLES}</style>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="font-extrabold text-slate-900 text-lg">
              {isViewOnly ? 'View Evaluation - ' : 'Evaluate Quarterly Review - '}
              {currentReview?.employeeName} ({currentReview?.quarter})
            </span>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={1200}
        footer={null}
        destroyOnClose
        centered
        className="!top-4 qr-wrapper"
      >
        {currentReview && (
          <div className="py-2 flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden pr-1">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar size={48} className="bg-indigo-600 font-bold">
                  {currentReview.employeeName.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{currentReview.employeeName}</h4>
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
              </div>
            </div>

            <Row gutter={[20, 20]} align="top" className="qr-two-col-row">
              <Col xs={24} lg={12} className="qr-submission-col">
                <div className="flex flex-col gap-5">

                  {/* ── Section header ── */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-black">Employee Submission Details</span>
                    <div className="flex-1 h-px bg-indigo-100" />
                  </div>

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
                      <span className="text-lg font-black text-indigo-700">{averageRatingScore} / 5.0</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-3">
                    {RATING_CATEGORY_ITEMS.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 min-w-0 truncate">
                          {item.label}
                        </span>
                        <Rate
                          disabled={isViewOnly}
                          value={ratings[item.key] || 0}
                          onChange={(val) =>
                            setRatings((prev) => ({ ...prev, [item.key]: val }))
                          }
                          className="!text-amber-400 text-sm shrink-0"
                        />
                      </div>
                    ))}
                  </div>

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
                      {PERFORMANCE_RATING_LABELS[finalRating] || finalRating || '—'}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs uppercase mb-1.5 block">
                      Performance Strengths
                    </label>
                    <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isViewOnly}
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
                      {!isViewOnly && renderMaxLengthCounter(strengths.length)}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs uppercase mb-1.5 block">
                      Areas for Improvement
                    </label>
                    <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isViewOnly}
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
                      {!isViewOnly && renderMaxLengthCounter(improvements.length)}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs uppercase mb-1.5 block">
                      Manager Feedback & Remarks
                    </label>
                    <div className={`bg-white border border-slate-200 rounded-xl p-3 ${SUBMISSION_CARD_HOVER_CLASSES}`}>
                      <TextArea
                        disabled={isViewOnly}
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
                      {!isViewOnly && renderMaxLengthCounter(remarks.length)}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">

              {!isViewOnly && (
                <>
                  <Button
                    type="default"
                    icon={<Save className="w-4 h-4" />}
                    loading={submitting}
                    onClick={() => onSubmitEvaluation(true)}
                    className="!rounded-xl !border-indigo-200 !text-indigo-600 hover:!bg-indigo-50 !font-semibold"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="primary"
                    icon={<Send className="w-4 h-4" />}
                    loading={submitting}
                    onClick={() => onSubmitEvaluation(false)}
                    className="!rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !font-semibold"
                  >
                    Submit Final Review
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default QuarterlyViewPage;