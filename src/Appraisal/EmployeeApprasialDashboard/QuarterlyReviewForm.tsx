import { useEffect, useState, useCallback, useRef } from 'react';
import { Form, Button, message, Spin, Modal } from 'antd';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Send, ArrowLeft, ArrowRight, ChevronLeft, ChevronDown, CheckCircle2, User, UserX, Star, Clock3, CalendarRange, Trophy } from 'lucide-react';

import { QuarterlyReviewStepper } from './desktop/QuarterlyReviewStepper';
import { QuarterlyReviewStepperMobile } from './mobile/QuarterlyReviewStepperMobile';
import { OverviewStep } from './steps/OverviewStep';
import { AchievementsStep } from './steps/AchievementsStep';
import { ChallengesStep } from './steps/ChallengesStep';
import { LearningGoalsStep } from './steps/LearningGoalsStep';
import { ReviewStep } from './steps/ReviewStep';
import { ReviewStatus } from './enums/Appraisal.enums';
import {
  isQuarterOver,
  formatQuarterRange,
  slugToQuarter,
} from './utils/fyQuarter.utils';
import type { RootState, AppDispatch } from '../../store';
import {
  getCurrentQuarter,
  getReviewByQuarter,
  getAllReviews,
  saveOrSubmitReview,
} from '../../reducers/quarterlyReview.reducer';
import { getManagerMappingByEmployeeId } from '../../reducers/managerMapping.reducer';

interface ReviewItem {
  title?: string;
  details: string;
}

const parseJsonArray = (val: any, defaultTitle: string): ReviewItem[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // legacy plain-string data
  }
  return typeof val === 'string' ? [{ title: defaultTitle, details: val }] : [];
};

const TOTAL_STEPS = 5;

//  Manager Evaluation panel (right column of the read-only view) 
// NOTE: field names here (`ratings.productivity`, `finalRating`, `strengths`,
// `improvements`, `remarks`) are assumed to mirror the `ManagerReviewItem`
// shape used in the manager-side quarterly review board. If your
// `getReviewByQuarter` response uses different keys, adjust the
// `ManagerReviewRatings` / `ManagerReviewData` types and the `init()` mapping
// below — the panel itself doesn't need to change.
interface ManagerReviewRatings {
  productivity?: number;
  quality?: number;
  ownership?: number;
  communication?: number;
  collaboration?: number;
  innovation?: number;
}

interface ManagerReviewData {
  ratings?: ManagerReviewRatings;
  finalRating?: string;
  strengths?: string;
  improvements?: string;
  remarks?: string;
  reviewedAt?: string | null;
}

const RATING_CATEGORIES: { key: keyof ManagerReviewRatings; label: string }[] = [
  { key: 'productivity', label: 'Productivity & Output' },
  { key: 'quality', label: 'Quality of Work' },
  { key: 'ownership', label: 'Ownership & Accountability' },
  { key: 'communication', label: 'Communication Skills' },
  { key: 'collaboration', label: 'Team Collaboration' },
  { key: 'innovation', label: 'Innovation & Initiative' },
];

const StarRow = ({ value = 0, max = 5 }: { value?: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.round(value)
            ? 'fill-amber-400 text-amber-400'
            : 'fill-slate-200 text-slate-200'
        }`}
      />
    ))}
  </div>
);

// Shared heading style for every section/sub-section title in this panel
// (and, to match, the step headings in OverviewStep / AchievementsStep /
// ChallengesStep / LearningGoalsStep — apply this same className there:
// "text-base font-semibold text-slate-800")
const SECTION_HEADING_CLASS = 'text-base font-semibold text-slate-800';

// Collapsible, icon-led feedback card for a manager's free-text field
// (Strengths / Improvements / Remarks). Each field gets its own bordered
// card with a header row (icon + title + expand/collapse chevron) and a
// capped-height, scrollable body so a long (up to 1000-char) piece of
// feedback scrolls internally instead of growing the card without bound.
// Color accent presets for the left border + icon of each feedback card,
// so each field (Strengths / Improvements / Remarks) reads as its own
// distinct category at a glance — mirrors the colored left-border accent
// on the reference "Due Date" card.
const FEEDBACK_ACCENTS = {
  emerald: { border: 'border-l-emerald-400', icon: 'text-emerald-500' },
  amber: { border: 'border-l-amber-400', icon: 'text-amber-500' },
  indigo: { border: 'border-l-indigo-400', icon: 'text-indigo-500' },
} as const;

const ManagerFeedbackCard = ({
  label,
  value,
  accent = 'indigo',
}: {
  label: string;
  value?: string;
  accent?: keyof typeof FEEDBACK_ACCENTS;
}) => {
  const [open, setOpen] = useState(false);
  const { border } = FEEDBACK_ACCENTS[accent];

  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${border} rounded-xl overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        title={open ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-slate-50 transition-colors"
      >
        <span className={SECTION_HEADING_CLASS}>{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="text-sm text-slate-600 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {value?.trim() ? value : <span className="text-slate-400">—</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// Small encouragement footer shown under a completed manager evaluation —
// mirrors the illustrated "keep it up" panel from the reference design,
// built from existing icon primitives rather than a raster illustration.
const EncouragementCard = () => (
  <div className="bg-gradient-to-b from-indigo-50/60 to-white border border-indigo-100 rounded-2xl px-5 py-6 flex flex-col items-center text-center gap-2">
    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-1">
      <Trophy className="w-7 h-7 text-indigo-500" />
    </div>
    <p className="text-sm font-bold text-slate-800">Keep up the great work!</p>
    <p className="text-xs text-slate-500 max-w-[220px]">
      Your dedication and performance make a real difference.
    </p>
  </div>
);

const ManagerEvaluationPanel = ({ review }: { review: ManagerReviewData | null }) => {
  const ratings = review?.ratings ?? {};
  const ratingValues = RATING_CATEGORIES.map((c) => ratings[c.key] ?? 0);
  const hasAnyRating = ratingValues.some((v) => v > 0);
  const avgScore = hasAnyRating
    ? (ratingValues.reduce((a, b) => a + b, 0) / RATING_CATEGORIES.length).toFixed(1)
    : '0.0';

  if (!review || (!hasAnyRating && !review.finalRating && !review.strengths)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <Clock3 className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">Manager review pending</p>
          <p className="text-xs text-slate-500 mt-1">
            Your manager hasn't evaluated this submission yet. Ratings and
            feedback will show up here once they do.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header — px-5 py-4.5 matches the left-column card header height
          (p-5, single-line title) so both cards' top edges/content align
          on the same baseline instead of the right card sitting lower. */}
      <div className="flex items-center justify-between gap-3 px-5 py-[18px] border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <h3 className={`${SECTION_HEADING_CLASS} tracking-tight whitespace-nowrap`}>
          Manager Evaluation & Rating
        </h3>
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg px-2.5 py-1 text-right shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 leading-none">
            Avg Score
          </p>
          <p className="text-sm font-extrabold text-indigo-600 leading-tight">
            {avgScore} / 5.0
          </p>
        </div>
      </div>

      {/* Category ratings */}
      <div className="px-4 py-2.5 flex flex-col gap-1.5 border-b border-slate-100">
        {RATING_CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600">{cat.label}</span>
            <StarRow value={ratings[cat.key] ?? 0} />
          </div>
        ))}
      </div>

      {/* Final rating */}
      <div className="px-4 py-2.5 border-b border-slate-100">
        <p className={`${SECTION_HEADING_CLASS} mb-1`}>
          Final Performance Rating
        </p>
        {review.finalRating ? (
          <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-bold">
            {review.finalRating}
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>

      {/* Text feedback — each field is its own collapsible card */}
      <div className="px-4 py-2.5 flex flex-col gap-2.5">
        <ManagerFeedbackCard label="Performance Strengths" value={review.strengths} accent="emerald" />
        <ManagerFeedbackCard label="Areas for Improvement" value={review.improvements} accent="amber" />
        <ManagerFeedbackCard label="Manager Feedback & Remarks" value={review.remarks} accent="indigo" />
      </div>
    </div>
  );
};

const QuarterlyReviewForm = () => {
  const navigate = useNavigate();
  const { date: quarterParamSlug } = useParams<{ tab?: string; date?: string }>();
  const [searchParams] = useSearchParams();
  const rawQuarterParam = quarterParamSlug || searchParams.get('quarter') || '';
  const quarterParam = slugToQuarter(rawQuarterParam);

  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const employeeId = currentUser?.loginId ?? '';

  //  Local UI state 
  const [formKey, setFormKey] = useState(0); // bump to re-mount Form with fresh initialValues
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [quarter, setQuarter] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<ReviewStatus | null>(null);
  const [formData, setFormData] = useState<{
    overview: string;
    achievements: ReviewItem[];
    challenges: ReviewItem[];
    learningGoals: ReviewItem[];
  }>({
    overview: '',
    achievements: [],
    challenges: [],
    learningGoals: [],
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [noManagerModalOpen, setNoManagerModalOpen] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [fetchingManager, setFetchingManager] = useState(false);
  // Manager's evaluation/rating for this submission (read-only view, right column).
  const [managerReview, setManagerReview] = useState<ManagerReviewData | null>(null);
  // Root element reference for handling scroll-to-top on step changes.
  const rootRef = useRef<HTMLDivElement>(null);


  const quarterOver = quarter ? isQuarterOver(quarter) : false;
  const isReadOnly =
    (quarterOver && backendStatus === ReviewStatus.SUBMITTED) ||
    searchParams.get('mode') === ReviewStatus.VIEW;

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // 1. Resolve the quarter (from URL param or from backend)
        let resolvedQuarter = quarterParam ?? '';
        if (!resolvedQuarter) {
          const res = await dispatch(getCurrentQuarter()).unwrap();
          resolvedQuarter = res;
        }
        setQuarter(resolvedQuarter);

        // 2. Load existing review for that quarter (try direct fetch first, fall back to getAllReviews)
        let existing: any = null;
        try {
          existing = await dispatch(getReviewByQuarter(resolvedQuarter)).unwrap();
          console.log('[QRForm] getReviewByQuarter result:', existing);
        } catch (fetchErr) {
          console.warn('[QRForm] getReviewByQuarter failed, will try getAllReviews fallback', fetchErr);
        }

        // Fallback: if direct fetch returned null, search in the full list
        if (!existing) {
          try {
            const allReviews = await dispatch(getAllReviews()).unwrap();
            console.log('[QRForm] getAllReviews result:', allReviews);
            existing = allReviews.find(
              (r: any) =>
                r.quarter === resolvedQuarter ||
                r.quarter?.trim() === resolvedQuarter?.trim()
            ) ?? null;
            console.log('[QRForm] Fallback matched review:', existing);
          } catch (allErr) {
            console.warn('[QRForm] getAllReviews fallback also failed', allErr);
          }
        }

        if (existing) {
          setBackendStatus(existing.status);
          const initialVals = {
            overview: existing.overview ?? '',
            achievements: parseJsonArray(existing.achievements, 'Achievement'),
            challenges: parseJsonArray(existing.challenges, 'Challenge / Blocker'),
            learningGoals: parseJsonArray(existing.learningGoals, 'Learning Goal'),
          };
          console.log('[QRForm] Setting form data:', initialVals);
          setFormData(initialVals);
          // Bump key so the Form re-mounts with these as initialValues
          setFormKey(k => k + 1);
          if (existing.managerName) {
            setManagerName(existing.managerName);
          }

          // Manager evaluation data — see the ManagerReviewData note above
          // if these field names don't match your API response.
          const hasManagerData =
            existing.ratings ||
            existing.finalRating ||
            existing.strengths ||
            existing.improvements ||
            existing.remarks;
          if (hasManagerData) {
            setManagerReview({
              ratings: existing.ratings ?? {},
              finalRating: existing.finalRating ?? '',
              strengths: existing.strengths ?? '',
              improvements: existing.improvements ?? '',
              remarks: existing.remarks ?? '',
              reviewedAt: existing.reviewedAt ?? null,
            });
          } else {
            setManagerReview(null);
          }
        }
      } catch {
        message.error('Failed to load review data.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quarterParam]);

  //  Compute whether Next is enabled for the current step 
  // Returns the "required" field value for the active step so we can check ≥10 chars.
  const getStepRequiredValue = useCallback(
    (step: number, allValues: any): boolean => {
      if (step === 0) {
        return (allValues.overview ?? '').trim().length >= 10;
      }

      if (step === 1) {
        const list = allValues.achievements ?? [];

        return (
          list.length > 0 &&
          list.every(
            (item: any) =>
              item?.title?.trim() &&
              item?.details?.trim().length >= 10
          )
        );
      }

      if (step === 2) {
        const list = allValues.challenges ?? [];

        return (
          list.length > 0 &&
          list.every(
            (item: any) =>
              item?.title?.trim() &&
              item?.details?.trim().length >= 10
          )
        );
      }

      if (step === 3) {
        const list = allValues.learningGoals ?? [];

        return (
          list.length > 0 &&
          list.every(
            (item: any) =>
              item?.details?.trim().length >= 10
          )
        );
      }
      return true;
    },
    []
  );

  const evaluateNextEnabled = useCallback(
    (step: number, allValues: any) => {
      if (step >= TOTAL_STEPS - 1) {
        setIsNextEnabled(true);
        return;
      }
      setIsNextEnabled(getStepRequiredValue(step, allValues));
    },
    [getStepRequiredValue]
  );

  useEffect(() => {
    if (!loading) {
      form.setFieldsValue(formData);
      evaluateNextEnabled(currentStep, formData);
    }
  }, [loading, formKey]);

  // Re-evaluate whenever step, formData, or form values change
  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    evaluateNextEnabled(currentStep, watchedValues || {});
  }, [currentStep, watchedValues, evaluateNextEnabled]);

  // Helper to ensure clean array of items without AntD Form.List metadata
  const cleanReviewItems = (raw: any): ReviewItem[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        ...(item.title ? { title: String(item.title) } : {}),
        details: String(item.details ?? ''),
      }));
  };

  const scrollToTop = () => {
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  };

  const getFormPayload = (status: ReviewStatus) => {
    const formValues = form.getFieldsValue(true);
    const overviewVal = formValues.overview ?? formData.overview ?? '';
    const achievementsVal = formValues.achievements ?? formData.achievements;
    const challengesVal = formValues.challenges ?? formData.challenges;
    const learningGoalsVal = formValues.learningGoals ?? formData.learningGoals;

    return {
      quarter,
      status,
      overview: overviewVal,
      achievements: cleanReviewItems(achievementsVal),
      challenges: cleanReviewItems(challengesVal),
      learningGoals: cleanReviewItems(learningGoalsVal),
    };
  };

  //  Silent draft save (on every Next) 
  const silentSaveDraft = useCallback(async () => {
    if (isReadOnly) return;
    try {
      setAutoSaving(true);
      const payload = getFormPayload(ReviewStatus.DRAFT);
      const result = await dispatch(saveOrSubmitReview(payload)).unwrap();
      setBackendStatus(result.status);
    } catch {
      // Non-blocking — don't interrupt the user flow
    } finally {
      setAutoSaving(false);
    }
  }, [form, quarter, isReadOnly, formData, dispatch]);

  // const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const handleBack = () => {
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, 0);

      requestAnimationFrame(() => {
        scrollToTop();
      });

      return next;
    });
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      try {
        const challengesList = form.getFieldValue('challenges') || [];
        const fieldsToValidate = challengesList.map((_: any, idx: number) => [
          'challenges',
          idx,
          'title',
        ]);

        if (fieldsToValidate.length > 0) {
          await form.validateFields(fieldsToValidate);
        }
      } catch {
        return;
      }
    }

    if (!isReadOnly) {
      await silentSaveDraft();
    }

    setCurrentStep(prev => {
      const next = Math.min(prev + 1, TOTAL_STEPS - 1);

      requestAnimationFrame(() => {
        scrollToTop();
      });

      return next;
    });
  };

  const handleStepChange = async (targetStep: number) => {
    if (targetStep > currentStep) {
      if (!isNextEnabled) return;
      if (currentStep === 2) {
        try {
          const challengesList = form.getFieldValue('challenges') || [];
          const fieldsToValidate = challengesList.map((_: any, idx: number) => ['challenges', idx, 'title']);
          if (fieldsToValidate.length > 0) {
            await form.validateFields(fieldsToValidate);
          }
        } catch {
          return;
        }
      }
      if (!isReadOnly) await silentSaveDraft();
      setCurrentStep(targetStep);

      requestAnimationFrame(() => {
        scrollToTop();
      });
    } else {
      setCurrentStep(targetStep);

      requestAnimationFrame(() => {
        scrollToTop();
      });
    }
  };

  //  Explicit "Save Draft" 
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const payload = getFormPayload(ReviewStatus.DRAFT);
      const result = await dispatch(saveOrSubmitReview(payload)).unwrap();
      setBackendStatus(result.status);
      message.success('Draft saved successfully!');
      navigate('/employee-dashboard/appraisal');
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  //  "Submit Review" click — validate then fetch manager via Redux 
  const handleSubmitClick = async () => {
    // Step 1: validate all fields
    try {
      await form.validateFields();
    } catch {
      message.error('Please complete all required fields before submitting.');
      return;
    }

    // Step 2: guard employee identity
    if (!employeeId) {
      message.error('Unable to identify your employee ID. Please re-login and try again.');
      return;
    }

    // Step 3: fetch assigned manager from backend via existing Redux thunk
    try {
      setFetchingManager(true);
      const result = await dispatch(getManagerMappingByEmployeeId(employeeId)).unwrap();
      const fetchedManagerName: string | undefined = result?.managerName;

      if (!fetchedManagerName) {
        showNoManagerError();
        return;
      }

      setManagerName(fetchedManagerName);
      setConfirmModalOpen(true);
    } catch {
      // Thunk rejected means no mapping exists or network error
      showNoManagerError();
    } finally {
      setFetchingManager(false);
    }
  };
  const showNoManagerError = () => {
    setNoManagerModalOpen(true);
  };

  //  Confirmed submit — call backend via Redux 
  const handleConfirmedSubmit = async () => {
    try {
      setSaving(true);
      const payload = getFormPayload(ReviewStatus.SUBMITTED);
      const result = await dispatch(saveOrSubmitReview(payload)).unwrap();
      setBackendStatus(result.status);
      setConfirmModalOpen(false);
      message.success('Quarterly review submitted successfully!');
      navigate('/employee-dashboard/appraisal');
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to submit review.');
    } finally {
      setSaving(false);
    }
  };


  //  Step content 
  const renderStepContent = () => {
    const disabled = isReadOnly;
    const formValues = { ...formData, ...form.getFieldsValue(true) };
    switch (currentStep) {
      case 0: return <OverviewStep disabled={disabled} />;
      case 1: return <AchievementsStep disabled={disabled} />;
      case 2:
        return (
          <ChallengesStep
            disabled={disabled}
            achievements={form.getFieldValue("achievements") || []}
            onDataChange={() => {
              evaluateNextEnabled(currentStep, form.getFieldsValue(true));
            }}
          />
        );
      case 3: return <LearningGoalsStep disabled={disabled} />;
      case 4: return <ReviewStep values={formValues} quarter={quarter} managerName={managerName} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Loading Review..." />
      </div>
    );
  }

  const quarterRange = formatQuarterRange(quarter);

  return (
    <div ref={rootRef} className="w-full px-6 py-6 pb-12">
      {/* Back link */}
      <button
        onClick={() => navigate('/employee-dashboard/appraisal')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm ring-1 ring-slate-100 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 mb-1">
              Performance Review
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Quarterly Performance Review
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 rounded-lg px-2.5 py-1 text-xs font-semibold">
                <CalendarRange className="w-3.5 h-3.5" />
                {quarter}
              </span>
              <span className="text-slate-400 text-xs">{quarterRange}</span>
            </div>
          </div>

          {/* Top-right: Submitted-to-Manager card (read-only mode) / Save Draft button (edit mode). */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            {isReadOnly && managerName && (
              <div className="w-full sm:w-72 flex items-center gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-4 py-3">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Submitted to Manager</p>
                  <p className="text-base font-bold text-slate-800">{managerName}</p>
                </div>
              </div>
            )}

            {!isReadOnly && (
              <div className="w-full sm:w-48 flex gap-3 items-center justify-end">
                {autoSaving && (
                  <span className="text-slate-400 text-xs animate-pulse mr-2">Auto-saving…</span>
                )}

                {/* Save Draft — header only */}
                <Button
                  onClick={handleSaveDraft}
                  loading={saving}
                  className="w-full h-10 px-5 rounded-xl border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 bg-white font-semibold"
                >
                  Save Draft
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isReadOnly ? (
        // Split layout: employee's submitted answers on the left,
        // manager's evaluation & rating on the right. Stacks to a single
        // column below the `lg` breakpoint.
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 items-start mb-8">
          {/* Left column — employee submission */}
          <Form key={`ro-${formKey}`} form={form} layout="vertical" initialValues={formData}>
            <div className="flex flex-col gap-4">
              <OverviewStep disabled={true} />
              <AchievementsStep disabled={true} />
              <ChallengesStep disabled={true} />
              <LearningGoalsStep disabled={true} />
            </div>
          </Form>

          {/* Right column — manager evaluation */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <ManagerEvaluationPanel review={managerReview} />
            {managerReview && (managerReview.strengths || managerReview.finalRating) && (
              <EncouragementCard />
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Stepper */}
          <div className="hidden md:block">
            <QuarterlyReviewStepper currentStep={currentStep} onChangeStep={handleStepChange} />
          </div>

          {/* Mobile Stepper */}
          <div className="md:hidden">
            <QuarterlyReviewStepperMobile currentStep={currentStep} onChangeStep={handleStepChange} />
          </div>

          {/* Form */}
          <Form
            key={`edit-${formKey}`}
            form={form}
            layout="vertical"
            className="mb-8"
            preserve={true}
            initialValues={formData}
            onValuesChange={(_, allValues) => {
              setFormData(prev => ({ ...prev, ...allValues }));
              evaluateNextEnabled(currentStep, allValues);
            }}
          >
            {renderStepContent()}
          </Form>

          {/* Footer navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            {/* Previous */}
            {currentStep > 0 && (
              <Button
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-xl border-slate-200 text-slate-600 h-10 px-5"
              >
                Previous
              </Button>
            )}

            {/* Right-side actions */}
            <div className={`flex gap-3 flex-wrap justify-center ${currentStep === 0 ? 'sm:ml-auto' : ''}`}>
              {/* Save Draft */}
              <Button
                icon={<Save className="w-4 h-4" />}
                loading={saving}
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 rounded-xl border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 h-10 px-5"
              >
                Save Draft
              </Button>

              {/* Next (steps 1–4) / Submit Review (last step only) */}
              {currentStep < TOTAL_STEPS - 1 ? (
                <Button
                  type="primary"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNext}
                  disabled={!isNextEnabled}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-white h-10 px-6 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-none"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<Send className="w-4 h-4" />}
                  loading={fetchingManager || saving}
                  onClick={handleSubmitClick}
                  className="flex items-center gap-1.5 border-none rounded-xl text-white h-10 px-6 bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                >
                  Submit Review
                </Button>
              )}
            </div>
          </div>
        </>
      )}
      {/* No Manager Assigned Modal */}
      <Modal
        open={noManagerModalOpen}
        onCancel={() => setNoManagerModalOpen(false)}
        footer={null}
        centered
        width={480}
        styles={{ body: { padding: '0' } }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center shrink-0">
              <UserX className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-xl font-bold text-slate-800 mb-2">No Manager Assigned</h2>
              <div className="w-10 h-1 bg-orange-400 rounded-full mb-3" />
              <p className="text-slate-500 text-sm leading-relaxed">
                You do not have an assigned manager. Please contact the HR team to
                assign a manager before submitting your quarterly review.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => setNoManagerModalOpen(false)}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 border-none font-semibold flex items-center gap-2"
            >
              Understood
            </Button>
          </div>
        </div>
      </Modal>

      {/*  Submission Confirmation Modal  */}
      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={null}
        centered
        width={480}
        closable={!saving}
        maskClosable={!saving}
        styles={{ body: { padding: '0' } }}
      >
        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Submit Quarterly Review?</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Once submitted, your review will be sent for evaluation. You will not be able to
              edit it afterwards.
            </p>
          </div>

          {/* Manager info */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 leading-none mb-0.5">Review will be sent to</p>
              <p className="text-sm font-semibold text-slate-800">{managerName}</p>
            </div>
          </div>

          {/* Quarter info */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-6 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Period:</span>{' '}
            {quarter}&nbsp;·&nbsp;{quarterRange}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              block
              onClick={() => setConfirmModalOpen(false)}
              disabled={saving}
              className="h-10 rounded-xl border-slate-300 text-slate-600 font-medium"
            >
              Cancel
            </Button>
            <Button
              block
              type="primary"
              loading={saving}
              icon={<Send className="w-4 h-4" />}
              onClick={handleConfirmedSubmit}
              className="h-10 rounded-xl border-none bg-emerald-600 hover:bg-emerald-700 font-semibold flex items-center justify-center gap-1.5"
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuarterlyReviewForm;