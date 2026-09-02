import { useEffect, useState, useCallback, useRef } from 'react';
import { Form, Button, message, Spin, Modal } from 'antd';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Send, ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, User, UserX, Star, HourglassIcon, MessageSquare, TrendingUp, ThumbsUp } from 'lucide-react';

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

const RATING_CATEGORIES = [
  { key: 'productivity', label: 'Productivity & Output' },
  { key: 'quality', label: 'Quality of Work' },
  { key: 'ownership', label: 'Ownership & Accountability' },
  { key: 'communication', label: 'Communication Skills' },
  { key: 'collaboration', label: 'Team Collaboration' },
  { key: 'innovation', label: 'Innovation & Initiative' },
];

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

// --- Responsive detection hook -------------------------------------------
// Detects screens narrower than `breakpoint` (default 1024px) and updates
// reactively on resize/orientation change via matchMedia. Purely presentational —
// does not touch any business logic, API calls, or Redux state below.
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
      // Safari < 14 fallback
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [breakpoint]);

  return isMobile;
};
// ---------------------------------------------------------------------------

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
  const [managerEvaluation, setManagerEvaluation] = useState<{
    reviewStatus?: string | null;
    finalRating?: string | number | null;
    ratings?: Record<string, number> | null;
    strengths?: string | null;
    improvements?: string | null;
    remarks?: string | null;
    reviewedOn?: string | null;
    managerName?: string | null;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Screen-size detection — used only to decide which UI tree to render.
  const isMobile = useIsMobile(1024);

  const quarterOver = quarter ? isQuarterOver(quarter) : false;
  const isReadOnly =
    (quarterOver && backendStatus === ReviewStatus.SUBMITTED) ||
    searchParams.get('mode') === ReviewStatus.VIEW;

  useEffect(() => {
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
          const parseJsonSafely = (val: any): any => {
            if (!val) return null;
            if (typeof val === 'object') return val;
            try { return JSON.parse(val); } catch { return null; }
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

          const isManagerReviewed =
            existing.reviewStatus === ReviewStatus.REVIEWED ||
            existing.reviewStatus === ReviewStatus.COMPLETED ||
            existing.status === ReviewStatus.REVIEWED ||
            existing.status === ReviewStatus.APPROVED ||
            existing.status === ReviewStatus.COMPLETED;

          const parsedRatings = parseJsonSafely(existing.ratings || existing.managerRatings);
          const evalData = {
            reviewStatus: existing.reviewStatus ?? (isManagerReviewed ? 'Reviewed' : null),
            finalRating: existing.finalRating ?? null,
            ratings: parsedRatings && typeof parsedRatings === 'object' ? parsedRatings : null,
            strengths: existing.strengths ?? null,
            improvements: existing.improvements ?? null,
            remarks: existing.remarks ?? existing.managerFeedback ?? null,
            reviewedOn: existing.reviewedOn ?? null,
            managerName: existing.managerName ?? null,
          };

          if (
            isManagerReviewed &&
            (evalData.finalRating || evalData.strengths || evalData.improvements || evalData.remarks || evalData.ratings)
          ) {
            setManagerEvaluation(evalData);
          } else {
            setManagerEvaluation(null);
          }
        }
      } catch {
        message.error('Failed to load review data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [quarterParam]);

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Loading Review..." />
      </div>
    );
  }

  // --- Mobile branch ---------------------------------------------------
  // Rendered when the viewport is under 1024px (mobile & tablet).
  if (isMobile) {
    return (
      <MobileQuarterlyReviewForm
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        form={form}
        formData={formData}
        setFormData={setFormData}
        formKey={formKey}
        loading={loading}
        saving={saving}
        autoSaving={autoSaving}
        isNextEnabled={isNextEnabled}
        quarter={quarter}
        reviewId={reviewId}
        backendStatus={backendStatus}
        managerName={managerName}
        managerEvaluation={managerEvaluation}
        isReadOnly={isReadOnly}
        confirmModalOpen={confirmModalOpen}
        setConfirmModalOpen={setConfirmModalOpen}
        noManagerModalOpen={noManagerModalOpen}
        setNoManagerModalOpen={setNoManagerModalOpen}
        fetchingManager={fetchingManager}
        handleBack={handleBack}
        handleNext={handleNext}
        handleStepChange={handleStepChange}
        handleSaveDraft={handleSaveDraft}
        handleSubmitClick={handleSubmitClick}
        handleConfirmedSubmit={handleConfirmedSubmit}
        evaluateNextEnabled={evaluateNextEnabled}
      />
    );
  }
  // ----------------------------------------------------------------------

  // const quarterRange = formatQuarterRange(quarter);

  return (
    <div className="pb-8 mt-2 px-1">
      <style>{`
        .quarterly-review-form-wrapper .ant-input-disabled,
        .quarterly-review-form-wrapper .ant-input[disabled],
        .quarterly-review-form-wrapper textarea.ant-input-disabled,
        .quarterly-review-form-wrapper textarea.ant-input[disabled] {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }

        .quarterly-review-form-wrapper .ant-input,
        .quarterly-review-form-wrapper textarea.ant-input {
          border-radius: 12px !important;
        }
      `}</style>
      <div ref={rootRef} className="w-full px-2.5 py-2 quarterly-review-form-wrapper">
        <button
          onClick={() => navigate('/employee-dashboard/appraisal')}
          className="hidden lg:inline-flex items-center gap-1.5 text-[#A3AED0] hover:text-[#3311CC] font-semibold text-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-4">
            {/* Left */}
            <div className="flex items-center gap-2 text-nowrap">
              <h1 className="text-xl font-semibold text-slate-900">
                Quarterly Review
              </h1>

              <span className="text-slate-400">—</span>

              <p className="text-sm text-darygray-500">
                {quarter}
                {/* · {quarterRange} */}
              </p>
            </div>

            {/* Right */}
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
                  className="h-9 px-4 rounded-md border border-slate-300 bg-white font-medium"
                >
                  Save Draft
                </Button>
              ) : (
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1.5 text-xs font-semibold">
                  ✓ {backendStatus === ReviewStatus.SUBMITTED ? "Submitted" : "Draft"} — Read Only
                </span>
              )}
            </div>
          </div>
        </div>

        {isReadOnly ? (
          <Form key={`ro-${formKey}`} form={form} layout="vertical" className="mb-8" initialValues={formData}>
            {/* Two-column layout: Employee Review (left) | Manager Review (right) */}
            <div className="flex gap-5 items-start">

              {/* ── LEFT COLUMN: Employee Review Steps ── */}
              <div className="flex-1 min-w-0 flex flex-col gap-5">
                {/* "Submitted to Manager" banner when no eval yet */}
                {!managerEvaluation && managerName && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 leading-none mb-1 font-semibold uppercase tracking-wider">Submitted to Manager</p>
                      <p className="text-base font-semibold text-slate-800 mb-0">{managerName}</p>
                    </div>
                  </div>
                )}
                <OverviewStep disabled={true} />
                <AchievementsAndChallengesStep disabled={true} reviewId={reviewId} />
                <LearningGoalsStep disabled={true} />
                <TeamContributionStep disabled={true} />
                <CompanyEnvironmentStep disabled={true} />
              </div>

              {/* ── RIGHT COLUMN: Manager Evaluation ── */}
              <div className="w-[380px] shrink-0 sticky top-4 flex flex-col gap-4">
                {managerEvaluation ? (
                  <div className="bg-gradient-to-br from-indigo-900/5 via-indigo-50/40 to-purple-50/30 border border-indigo-200/80 rounded-2xl p-5 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-indigo-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                          <HourglassIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">Manager Evaluation</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">{managerEvaluation.managerName || managerName || 'Manager'}</span>
                            {managerEvaluation.reviewedOn && (
                              <> &bull; {new Date(managerEvaluation.reviewedOn).toLocaleDateString('en-IN')}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {managerEvaluation.reviewStatus || 'Reviewed'}
                      </span>
                    </div>

                    {/* Overall Rating */}
                    {(() => {
                      const managerRatingValues = managerEvaluation.ratings
                        ? Object.values(managerEvaluation.ratings).map(Number).filter(v => !isNaN(v) && v > 0)
                        : [];
                      const managerAvgScore = managerRatingValues.length > 0
                        ? (managerRatingValues.reduce((a, b) => a + b, 0) / managerRatingValues.length).toFixed(1)
                        : null;

                      if (!managerAvgScore && !managerEvaluation.finalRating) return null;

                      return (
                        <div className="mt-4 bg-white/90 border border-indigo-100 rounded-xl p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</p>
                            <p className="text-lg font-extrabold text-indigo-900 mt-0.5">
                              {managerAvgScore
                                ? `${managerAvgScore} / 5.0`
                                : typeof managerEvaluation.finalRating === 'number'
                                  ? `${managerEvaluation.finalRating.toFixed(1)} / 5.0`
                                  : managerEvaluation.finalRating}
                            </p>
                            {managerEvaluation.finalRating && managerAvgScore && (
                              <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                {managerEvaluation.finalRating}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-amber-800 text-sm">
                              {managerAvgScore ||
                                (typeof managerEvaluation.finalRating === 'number'
                                  ? managerEvaluation.finalRating.toFixed(1)
                                  : managerEvaluation.finalRating)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Category Ratings */}
                    {managerEvaluation.ratings && Object.keys(managerEvaluation.ratings).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Category Ratings</h4>
                        <div className="flex flex-col gap-2">
                          {RATING_CATEGORIES.map((cat) => {
                            const val = managerEvaluation.ratings?.[cat.key] || 0;
                            return (
                              <div key={cat.key} className="bg-white/80 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-700">{cat.label}</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3.5 h-3.5 ${star <= val ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                  <span className="text-xs font-bold text-slate-600 ml-1">{val}/5</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Feedback Cards */}
                    <div className="mt-4 flex flex-col gap-3">
                      {managerEvaluation.strengths && (
                        <div className="bg-white/90 border border-emerald-100 rounded-xl p-3.5">
                          <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide mb-1.5">
                            1. Key Strengths
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{managerEvaluation.strengths}</p>
                        </div>
                      )}

                      {managerEvaluation.improvements && (
                        <div className="bg-white/90 border border-amber-100 rounded-xl p-3.5">
                          <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide mb-1.5">
                            2. Areas for Improvement
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{managerEvaluation.improvements}</p>
                        </div>
                      )}

                      {managerEvaluation.remarks && (
                        <div className="bg-white/90 border border-indigo-100 rounded-xl p-3.5">
                          <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide mb-1.5">
                            3. Manager Remarks
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{managerEvaluation.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Pending evaluation placeholder */
                  <div className="bg-white border border-slate-200 border-lined rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <HourglassIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Awaiting Manager Evaluation</p>
                      <p className="text-xs text-slate-400 mt-1">Your manager hasn't reviewed this submission yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Form>
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
                  className="h-10 px-3 rounded-xl whitespace-nowrap flex-shrink-0 hover:-translate-x-0.5"
                >
                  Previous
                </Button>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveDraft}
                  loading={saving}
                  icon={<Save className="w-4 h-4" />}
                  className="h-10 px-5 rounded-xl border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 bg-white font-semibold  hover:-translate-y-0.5"
                >
                  Save Draft
                </Button>

                {currentStep < TOTAL_STEPS - 1 ? (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    disabled={!isNextEnabled}
                    className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center gap-2 border-0 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:translate-x-0.5"
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
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
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
            <div className="flex items-center gap-2 text-rose-600 font-semibold text-lg">
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