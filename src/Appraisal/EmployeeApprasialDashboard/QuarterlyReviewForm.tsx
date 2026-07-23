import { useEffect, useState, useCallback, useRef } from 'react';
import { Form, Button, message, Spin, Modal } from 'antd';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Send, ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, User, UserX } from 'lucide-react';

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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Quarterly Performance Review
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {quarter}&nbsp;·&nbsp;{quarterRange}
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {autoSaving && (
              <span className="text-slate-400 text-xs animate-pulse mr-2">Auto-saving…</span>
            )}

            {/* Save Draft — header only */}
            {!isReadOnly && (
              <Button
                onClick={handleSaveDraft}
                loading={saving}
                className="h-10 px-5 rounded-xl border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 bg-white font-semibold"
              >
                Save Draft
              </Button>
            )}

            {/* Read-Only badge */}
            {isReadOnly && (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1.5 text-xs font-bold">
                ✓ {backendStatus === ReviewStatus.SUBMITTED ? 'Submitted' : 'Draft'} — Read Only
              </span>
            )}
          </div>
        </div>
      </div>

      {isReadOnly ? (
        <Form key={`ro-${formKey}`} form={form} layout="vertical" className="mb-8" initialValues={formData}>
          {managerName && (
            <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 shadow-sm max-w-3xl">
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
            <AchievementsStep disabled={true} />
            <ChallengesStep disabled={true} />
            <LearningGoalsStep disabled={true} />
          </div>
        </Form>
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