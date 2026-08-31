import { useEffect, useState, useCallback, useRef } from 'react';
import { Form, Button, message, Spin, Modal } from 'antd';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Send, ArrowLeft, ArrowRight, ChevronLeft, ChevronDown, CheckCircle2, User, UserX, Star, Clock3, CalendarRange, Trophy } from 'lucide-react';

import { QuarterlyReviewStepper } from './desktop/QuarterlyReviewStepper';
import { OverviewStep } from './steps/desktop_steps/OverviewStep';
import { AchievementsAndChallengesStep } from './steps/desktop_steps/AchievementsAndChallengesStep';
import { LearningGoalsStep } from './steps/desktop_steps/LearningGoalsStep';
import { TeamContributionStep, DEFAULT_TEAM_CONTRIBUTION } from './steps/desktop_steps/TeamContributionStep';
import { CompanyEnvironmentStep } from './steps/desktop_steps/CompanyEnvironmentStep';
import { ReviewStep } from './steps/desktop_steps/ReviewStep';
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

// Fixed import path: MobileQuarterlyReviewForm lives in the sibling `mobile` folder.
import MobileQuarterlyReviewForm from './MobileQuarterlyReviewForm/MobileQuarterlyReviewForm';

interface ReviewItem {
  title?: string;
  details: string;
}

interface ProjectItem {
  projectTitle: string;
  achievement: string;
  challenge: string;
  attachment?: any;
}

interface TeamContributionItem {
  category: string;
  rating: number;
}

interface CompanyEnvironment {
  workCultureFeedback?: string;
  workLifeBalance?: string;
  suggestions?: string;
  rating?: number;
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

const parseProjectsArray = (val: any, achievementsRaw?: any, challengesRaw?: any): ProjectItem[] => {
  if (val) {
    if (Array.isArray(val)) return val;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      if (Array.isArray(parsed)) return parsed;
    } catch { }
  }
  const achs = parseJsonArray(achievementsRaw, 'Achievement');
  const chs = parseJsonArray(challengesRaw, 'Challenge');
  if (achs.length === 0 && chs.length === 0) return [];
  return achs.map(ach => {
    const title = ach.title || '';
    const matchingCh = chs.find(c => c.title === title || c.title?.trim() === title.trim());
    return {
      projectTitle: title,
      achievement: ach.details || '',
      challenge: matchingCh?.details || '',
      attachment: null,
    };
  });
};

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
const SECTION_HEADING_CLASS = 'text-base font-semibold text-slate-800';

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

      <div className="px-4 py-2.5 flex flex-col gap-1.5 border-b border-slate-100">
        {RATING_CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600">{cat.label}</span>
            <StarRow value={ratings[cat.key] ?? 0} />
          </div>
        ))}
      </div>

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

      <div className="px-4 py-2.5 flex flex-col gap-2.5">
        <ManagerFeedbackCard label="Performance Strengths" value={review.strengths} accent="emerald" />
        <ManagerFeedbackCard label="Areas for Improvement" value={review.improvements} accent="amber" />
        <ManagerFeedbackCard label="Manager Feedback & Remarks" value={review.remarks} accent="indigo" />
      </div>
    </div>
  );
};

const parseTeamContribution = (val: any): TeamContributionItem[] => {
  if (Array.isArray(val) && val.length > 0) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { }
  }
  return DEFAULT_TEAM_CONTRIBUTION;
};

const TOTAL_STEPS = 6;

const useIsMobile = (breakpoint: number = 1024): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [breakpoint]);

  return isMobile;
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

  // Local UI state 
  const [formKey, setFormKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [quarter, setQuarter] = useState<string>('');
  const [reviewId, setReviewId] = useState<number | undefined>(undefined);
  const [backendStatus, setBackendStatus] = useState<ReviewStatus | null>(null);
  const [formData, setFormData] = useState<{
    overview: string;
    projects: ProjectItem[];
    learningGoals: ReviewItem[];
    teamContribution: TeamContributionItem[];
    averageRating?: number | null;
    companyEnvironment?: CompanyEnvironment;
  }>({
    overview: '',
    projects: [],
    learningGoals: [],
    teamContribution: DEFAULT_TEAM_CONTRIBUTION,
    averageRating: null,
    companyEnvironment: undefined,
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [noManagerModalOpen, setNoManagerModalOpen] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [fetchingManager, setFetchingManager] = useState(false);
  // Manager's evaluation/rating for this submission (read-only view, right column).
  const [managerReview, setManagerReview] = useState<ManagerReviewData | null>(null);
  // Root element reference for handling scroll-to-top on step changes.
  const rootRef = useRef<HTMLDivElement>(null);

  // Screen-size detection — used only to decide which UI tree to render.
  const isMobile = useIsMobile(1024);

  const quarterOver = quarter ? isQuarterOver(quarter) : false;
  const isReadOnly =
    (quarterOver && backendStatus === ReviewStatus.SUBMITTED) ||
    searchParams.get('mode') === ReviewStatus.VIEW;

  useEffect(() => {
    // MobileQuarterlyReviewForm is self-contained and fetches its own data.
    // Skip the desktop init entirely on mobile to avoid duplicate API calls.
    if (isMobile) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);

        let resolvedQuarter = quarterParam ?? '';
        if (!resolvedQuarter) {
          const res = await dispatch(getCurrentQuarter()).unwrap();
          resolvedQuarter = res;
        }
        setQuarter(resolvedQuarter);

        let existing: any = null;
        try {
          existing = await dispatch(getReviewByQuarter(resolvedQuarter)).unwrap();
        } catch (fetchErr) {
          console.warn('[QRForm] getReviewByQuarter failed, trying fallback', fetchErr);
        }

        if (!existing) {
          try {
            const allReviews = await dispatch(getAllReviews()).unwrap();
            existing = allReviews.find(
              (r: any) =>
                r.quarter === resolvedQuarter ||
                r.quarter?.trim() === resolvedQuarter?.trim()
            ) ?? null;
          } catch (allErr) {
            console.warn('[QRForm] getAllReviews fallback failed', allErr);
          }
        }

        if (existing) {
          if (existing.id) setReviewId(existing.id);
          setBackendStatus(existing.status);
          const parseCompanyEnvironment = (val: any): CompanyEnvironment | undefined => {
            if (!val) return undefined;
            if (typeof val === 'object') return val;
            try { return JSON.parse(val); } catch { return undefined; }
          };
          const initialVals = {
            overview: existing.overview ?? '',
            projects: parseProjectsArray(existing.projects, existing.achievements, existing.challenges),
            learningGoals: parseJsonArray(existing.learningGoals, 'Learning Goal'),
            teamContribution: parseTeamContribution(existing.teamContribution),
            averageRating: existing.averageRating ?? null,
            companyEnvironment: parseCompanyEnvironment(existing.companyEnvironment),
          };
          setFormData(initialVals);
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
  }, [quarterParam, isMobile]);

  const getStepRequiredValue = useCallback(
    (step: number, allValues: any): boolean => {
      if (step === 0) {
        return (allValues.overview ?? '').trim().length >= 1;
      }

      if (step === 1) {
        const list = allValues.projects ?? [];
        return (
          list.length > 0 &&
          list.every(
            (item: any) =>
              item?.projectTitle?.trim() &&
              item?.achievement?.trim().length >= 1 &&
              item?.challenge?.trim().length >= 1
          )
        );
      }

      if (step === 2) {
        const list = allValues.learningGoals ?? [];
        return (
          list.length > 0 &&
          list.every(
            (item: any) => item?.details?.trim().length >= 1
          )
        );
      }

      if (step === 3) {
        const list = allValues.teamContribution ?? [];
        return (
          list.length > 0 &&
          list.every(
            (item: any) => Number(item?.rating) > 0
          )
        );
      }

      if (step === 4) {
        const env = allValues.companyEnvironment ?? {};
        const wc = (env.workCultureFeedback ?? '').trim();
        const wl = (env.workLifeBalance ?? '').trim();
        const sg = (env.suggestions ?? '').trim();
        const rt = Number(env.rating ?? 0);
        return wc.length >= 1 && wl.length >= 1 && sg.length >= 1 && rt >= 1 && rt <= 5;
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

  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    evaluateNextEnabled(currentStep, watchedValues || {});
  }, [currentStep, watchedValues, evaluateNextEnabled]);

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
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const getFormPayload = (status: ReviewStatus) => {
    const formValues = form.getFieldsValue(true);
    const rawProjects = formValues.projects ?? formData.projects ?? [];
    const cleanProjects = Array.isArray(rawProjects)
      ? rawProjects.map((item: any) => ({
        projectTitle: String(item?.projectTitle ?? ''),
        achievement: String(item?.achievement ?? ''),
        challenge: String(item?.challenge ?? ''),
        attachment: item?.attachment ?? null,
      }))
      : [];

    const tcList = formValues.teamContribution ?? formData.teamContribution ?? DEFAULT_TEAM_CONTRIBUTION;
    const cleanTc = Array.isArray(tcList)
      ? tcList.map((item: any) => ({
        category: String(item?.category ?? ''),
        rating: Number(item?.rating) || 0,
      }))
      : [];

    const validRatings = cleanTc.map(t => t.rating).filter(r => r > 0);
    const avgRating = validRatings.length > 0
      ? Math.round((validRatings.reduce((a, b) => a + b, 0) / validRatings.length) * 10) / 10
      : 0;

    const rawEnv = formValues.companyEnvironment ?? formData.companyEnvironment ?? {};
    const cleanEnv = {
      workCultureFeedback: String(rawEnv?.workCultureFeedback ?? ''),
      workLifeBalance: String(rawEnv?.workLifeBalance ?? ''),
      suggestions: String(rawEnv?.suggestions ?? ''),
      rating: Number(rawEnv?.rating ?? 0) || 0,
    };

    return {
      quarter,
      status,
      overview: formValues.overview ?? formData.overview ?? '',
      projects: cleanProjects,
      learningGoals: cleanReviewItems(formValues.learningGoals ?? formData.learningGoals),
      teamContribution: cleanTc,
      averageRating: avgRating,
      companyEnvironment: cleanEnv,
    };
  };

  const silentSaveDraft = useCallback(async () => {
    if (isReadOnly) return;
    try {
      setAutoSaving(true);
      const payload = getFormPayload(ReviewStatus.DRAFT);
      const result = await dispatch(saveOrSubmitReview(payload)).unwrap();
      if (result?.id) setReviewId(result.id);
      setBackendStatus(result.status);
    } catch {
      // Non-blocking draft save
    } finally {
      setAutoSaving(false);
    }
  }, [form, quarter, isReadOnly, formData, dispatch]);

  const handleBack = async () => {
    if (!isReadOnly) {
      await silentSaveDraft();
    }
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, 0);
      requestAnimationFrame(() => scrollToTop());
      return next;
    });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      try {
        await form.validateFields();
      } catch {
        return;
      }
    }

    if (!isReadOnly) {
      await silentSaveDraft();
    }

    setCurrentStep(prev => {
      const next = Math.min(prev + 1, TOTAL_STEPS - 1);
      requestAnimationFrame(() => scrollToTop());
      return next;
    });
  };

  const handleStepChange = async (targetStep: number) => {
    if (targetStep > currentStep) {
      if (!isNextEnabled) return;
      if (currentStep === 1) {
        try {
          await form.validateFields();
        } catch {
          return;
        }
      }
      if (!isReadOnly) await silentSaveDraft();
      setCurrentStep(targetStep);
      requestAnimationFrame(() => scrollToTop());
    } else {
      if (!isReadOnly) await silentSaveDraft();
      setCurrentStep(targetStep);
      requestAnimationFrame(() => scrollToTop());
    }
  };

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

  const handleSubmitClick = async () => {
    try {
      await form.validateFields();
    } catch {
      message.error('Please complete all required fields before submitting.');
      return;
    }

    if (!employeeId) {
      message.error('Unable to identify your employee ID. Please re-login and try again.');
      return;
    }

    try {
      setFetchingManager(true);
      const result = await dispatch(getManagerMappingByEmployeeId(employeeId)).unwrap();
      const fetchedManagerName: string | undefined = result?.managerName;

      if (!fetchedManagerName) {
        setNoManagerModalOpen(true);
        return;
      }

      setManagerName(fetchedManagerName);
      setConfirmModalOpen(true);
    } catch {
      setNoManagerModalOpen(true);
    } finally {
      setFetchingManager(false);
    }
  };

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

  const renderStepContent = () => {
    const disabled = isReadOnly;
    const formValues = { ...formData, ...form.getFieldsValue(true) };
    switch (currentStep) {
      case 0: return <OverviewStep disabled={disabled} />;
      case 1:
        return (
          <AchievementsAndChallengesStep
            disabled={disabled}
            reviewId={reviewId}
            onDataChange={() => evaluateNextEnabled(currentStep, form.getFieldsValue(true))}
          />
        );
      case 2: return <LearningGoalsStep disabled={disabled} />;
      case 3: return <TeamContributionStep disabled={disabled} />;
      case 4: return <CompanyEnvironmentStep disabled={disabled} />;
      case 5: return <ReviewStep values={formValues} quarter={quarter} managerName={managerName} />;
      default: return null;
    }
  };

  // --- Mobile branch ---------------------------------------------------
  // Rendered when the viewport is under 1024px. MobileQuarterlyReviewForm is
  // a fully self-contained component (its own data fetching, validation,
  // save/submit flow, and modals), so none of the desktop logic above is
  // reused or altered — it simply isn't rendered on mobile.
  if (isMobile) {
    return <MobileQuarterlyReviewForm />;
  }
  // ----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Loading Review..." />
      </div>
    );
  }

  const quarterRange = formatQuarterRange(quarter);

  return (
    <div className="pb-8 mt-2 px-1">
      <div ref={rootRef} className="w-full px-2.5 py-2">
        <button
          onClick={() => navigate('/employee-dashboard/appraisal')}
          className="hidden lg:inline-flex items-center gap-1.5 text-[#A3AED0] hover:text-[#3311CC] font-bold text-sm transition-colors cursor-pointer"
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
              {quarterRange && <span className="text-slate-400 text-xs">{quarterRange}</span>}
            </div>
          </div>

          {/* Top-right actions */}
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

            <div className="flex items-center gap-3 shrink-0">
              {autoSaving && (
                <span className="text-slate-400 text-xs animate-pulse">
                  Auto-saving...
                </span>
              )}

              {!isReadOnly ? (
                <Button
                  onClick={handleSaveDraft}
                  loading={saving}
                  icon={<Save className="w-4 h-4" />}
                  className="h-10 px-5 rounded-xl border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 bg-white font-semibold"
                >
                  Save Draft
                </Button>
              ) : (
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-3.5 py-1.5 text-xs font-semibold">
                  ✓ {backendStatus === ReviewStatus.SUBMITTED ? "Submitted" : "Draft"} — Read Only
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isReadOnly ? (
        // Split layout: employee's submitted answers on the left, manager's evaluation on the right
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 items-start mb-8">
          {/* Left column — employee submission */}
          <Form key={`ro-${formKey}`} form={form} layout="vertical" initialValues={formData}>
            {managerName && (
              <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 leading-none mb-1 font-semibold uppercase tracking-wider">Submitted to Manager</p>
                  <p className="text-base font-bold text-slate-800 mb-0">{managerName}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-6">
              <OverviewStep disabled={true} />
              <AchievementsAndChallengesStep disabled={true} reviewId={reviewId} />
              <LearningGoalsStep disabled={true} />
              <TeamContributionStep disabled={true} />
              <CompanyEnvironmentStep disabled={true} />
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
          <QuarterlyReviewStepper currentStep={currentStep} onChangeStep={handleStepChange} />

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

          <div
            className={`bg-white border border-slate-100 rounded-2xl p-4 mb-4 mt-2 shadow-sm flex items-center ${currentStep === 0 ? "justify-center" : "justify-between"
              }`}
          >
            {currentStep > 0 && (
              <Button
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={handleBack}
                className="h-10 px-3 rounded-xl whitespace-nowrap flex-shrink-0"
              >
                Previous
              </Button>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveDraft}
                loading={saving}
                icon={<Save className="w-4 h-4" />}
                className="h-10 px-5 rounded-xl border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 bg-white font-semibold"
              >
                Save Draft
              </Button>

              {currentStep < TOTAL_STEPS - 1 ? (
                <Button
                  type="primary"
                  onClick={handleNext}
                  disabled={!isNextEnabled}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center gap-2 border-0 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleSubmitClick}
                  loading={saving || fetchingManager}
                  icon={<Send className="w-4 h-4" />}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold flex items-center gap-2 border-0 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Submit Final Review
                </Button>
              )}
            </div>
          </div>
        </>
      )}

        {/* Confirmation Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Confirm Final Submission
            </div>
          }
          open={confirmModalOpen}
          onOk={handleConfirmedSubmit}
          onCancel={() => setConfirmModalOpen(false)}
          okText="Yes, Submit Review"
          // cancelText="Review Again"
          confirmLoading={saving}
          okButtonProps={{
            className: "bg-emerald-500 hover:bg-emerald-600 font-semibold rounded-xl h-10 px-5",
          }}
          cancelButtonProps={{
             style: { display: "none" },
          }}
        >
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            Are you sure you want to submit your quarterly performance review for <strong>{quarter}</strong>?
          </p>

          {managerName && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Assigned Manager: <strong>{managerName}</strong></span>
            </div>
          )}

          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
            <strong>Note:</strong> Once submitted, your review cannot be edited and will be sent to your manager for evaluation.
          </div>
        </Modal>

        {/* No Manager Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
              <UserX className="w-5 h-5 text-rose-500" />
              No Assigned Manager Found
            </div>
          }
          open={noManagerModalOpen}
          onCancel={() => setNoManagerModalOpen(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => setNoManagerModalOpen(false)}
              className="bg-slate-700 hover:bg-slate-800 font-semibold rounded-xl h-10 px-5"
            >
              Got it
            </Button>,
          ]}
        >
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            You currently do not have an active manager assigned in the system.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Please contact your HR Administrator or Manager to set up your manager mapping before submitting your quarterly appraisal.
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
            <strong>Tip:</strong> You can click <strong>Save Draft</strong> at the top right to save your progress in the meantime.
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default QuarterlyReviewForm;