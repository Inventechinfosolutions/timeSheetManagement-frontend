import { HiddenRatingBadge } from '../components/HiddenRatingBadge';
import { useRevealedRatings } from '../hooks/useRevealedRatings';
import { useEffect, useState } from 'react';
import { Form, Button, Spin, Modal } from 'antd';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, User, UserX, Star, HourglassIcon, ClipboardList, Clock } from 'lucide-react';

import { QuarterlyReviewStepper } from './desktop/QuarterlyReviewStepper';
import { OverviewStep } from './steps/desktop_steps/OverviewStep';
import { AchievementsAndChallengesStep } from './steps/desktop_steps/AchievementsAndChallengesStep';
import { LearningGoalsStep } from './steps/desktop_steps/LearningGoalsStep';
import { TeamContributionStep } from './steps/desktop_steps/TeamContributionStep';
import { CompanyEnvironmentStep } from './steps/desktop_steps/CompanyEnvironmentStep';
import { ReviewStep } from './steps/desktop_steps/ReviewStep';
import { ReviewStatus } from './enums/Appraisal.enums';
import { convertUrlSlugToQuarterName } from './utils/fyQuarter.utils';
import { getReviewDisplayStatus } from './utils/appraisalHelpers';

// Fixed import path: MobileQuarterlyReviewForm lives in the sibling `mobile` folder.
import MobileQuarterlyReviewForm from './MobileQuarterlyReviewForm/MobileQuarterlyReviewForm';
import './desktop/quarterlyReviewDesktop.css';

// ── Shared hook — all business logic lives here ───────────────────────────────
import {
  useQuarterlyReviewForm,
  TOTAL_FORM_STEPS,
  STEP_INDEX_OVERVIEW,
  STEP_INDEX_ACHIEVEMENTS,
  STEP_INDEX_LEARNING_GOALS,
  STEP_INDEX_TEAM_CONTRIBUTION,
  STEP_INDEX_COMPANY_ENVIRONMENT,
  STEP_INDEX_REVIEW,
} from './hooks/useQuarterlyReviewForm';

const MOBILE_VIEWPORT_BREAKPOINT_PX = 1024;

const RATING_CATEGORIES = [
  { key: 'productivity', label: 'Productivity & Output' },
  { key: 'quality', label: 'Quality of Work' },
  { key: 'ownership', label: 'Ownership & Accountability' },
  { key: 'communication', label: 'Communication Skills' },
  { key: 'collaboration', label: 'Team Collaboration' },
  { key: 'innovation', label: 'Innovation & Initiative' },
];

// --- Responsive detection hook -------------------------------------------
const useIsMobile = (breakpointPixelWidth: number = MOBILE_VIEWPORT_BREAKPOINT_PX): boolean => {
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < breakpointPixelWidth : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQueryList = window.matchMedia(`(max-width: ${breakpointPixelWidth - 1}px)`);
    const handleMediaQueryChange = () => setIsMobileViewport(mediaQueryList.matches);
    handleMediaQueryChange();

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleMediaQueryChange);
      return () => mediaQueryList.removeEventListener('change', handleMediaQueryChange);
    } else {
      mediaQueryList.addListener(handleMediaQueryChange);
      return () => mediaQueryList.removeListener(handleMediaQueryChange);
    }
  }, [breakpointPixelWidth]);

  return isMobileViewport;
};
// ---------------------------------------------------------------------------

const QuarterlyReviewForm = () => {
  const navigate = useNavigate();
  const { date: quarterParamSlug } = useParams<{ tab?: string; date?: string }>();
  const [searchParams] = useSearchParams();
  const rawQuarterParameter = quarterParamSlug || searchParams.get('quarter') || '';
  const resolvedQuarterParam = convertUrlSlugToQuarterName(rawQuarterParameter);

  const { isRevealed, getRevealedData } = useRevealedRatings();
  const [form] = Form.useForm();

  // ── All business logic comes from the shared hook ─────────────────────────
  const {
    formKey,
    currentStep,
    setCurrentStep,
    loading,
    saving,
    autoSaving,
    isNextEnabled,
    quarter,
    quarterParam,
    reviewId,
    backendStatus,
    formData,
    setFormData,
    confirmModalOpen,
    setConfirmModalOpen,
    noManagerModalOpen,
    setNoManagerModalOpen,
    fetchingManager,
    managerName,
    managerEvaluation,
    isReadOnly,
    isManagerUser,
    rootRef,
    getBasePath,
    evaluateNextEnabled,
    handleStepperEdit,
    handleBack,
    handleNext,
    handleStepChange,
    handleSaveDraft,
    handleSubmitClick,
    handleConfirmedSubmit,
  } = useQuarterlyReviewForm(resolvedQuarterParam, form);
  // ─────────────────────────────────────────────────────────────────────────

  // Screen-size detection — used only to decide which UI tree to render.
  const isMobile = useIsMobile(MOBILE_VIEWPORT_BREAKPOINT_PX);

  const renderStepContent = () => {
    const disabled = isReadOnly;
    const formValues = { ...formData, ...form.getFieldsValue(true) };
    switch (currentStep) {
      case STEP_INDEX_OVERVIEW: return <OverviewStep disabled={disabled} />;
      case STEP_INDEX_ACHIEVEMENTS:
        return (
          <AchievementsAndChallengesStep
            disabled={disabled}
            reviewId={reviewId}
            onDataChange={() => {
              evaluateNextEnabled(currentStep, form.getFieldsValue(true));
              handleStepperEdit();
            }}
          />
        );
      case STEP_INDEX_LEARNING_GOALS: return <LearningGoalsStep disabled={disabled} />;
      case STEP_INDEX_TEAM_CONTRIBUTION: return <TeamContributionStep disabled={disabled} />;
      case STEP_INDEX_COMPANY_ENVIRONMENT: return <CompanyEnvironmentStep disabled={disabled} />;
      case STEP_INDEX_REVIEW: return <ReviewStep values={formValues} quarter={quarter} managerName={managerName} />;
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
        handleStepperEdit={handleStepperEdit}
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
    <div className="qr-form-page pb-8 mt-2 px-1">
      <style>{`
        .quarterly-review-form-wrapper .ant-input-disabled,
        .quarterly-review-form-wrapper .ant-input[disabled],
        .quarterly-review-form-wrapper textarea.ant-input-disabled,
        .quarterly-review-form-wrapper textarea.ant-input[disabled] {
          background-color: rgba(255, 255, 255, 0.62) !important;
          color: #0f172a !important;
          border-color: #93c5fd !important;
        }

        .quarterly-review-form-wrapper .ant-input,
        .quarterly-review-form-wrapper textarea.ant-input {
          border-radius: 16px !important;
        }
      `}</style>
      <div ref={rootRef} className="qr-form-inner w-full px-2.5 py-2 quarterly-review-form-wrapper">
        <button
          onClick={() => navigate(`${getBasePath()}/appraisal`)}
          className="hidden lg:inline-flex items-center gap-1.5 text-[#A3AED0] hover:text-[#3311CC] font-semibold text-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="qr-hero mb-4">
          <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white mb-0.5 leading-tight">
                  Quarterly Review
                </h1>
                <p className="text-sm text-blue-100 mb-0 truncate">
                  {quarter}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {autoSaving && (
                <span className="text-blue-100 text-xs animate-pulse">
                  Auto-saving...
                </span>
              )}

              {!isReadOnly ? (
                <Button
                  onClick={handleSaveDraft}
                  loading={saving}
                  icon={<Save className="w-4 h-4" />}
                  className="qr-hero-save h-9 px-4 rounded-xl font-semibold"
                >
                  Save Draft
                </Button>
              ) : (
                <span className="bg-white/15 text-white border border-white/30 rounded-full px-3 py-1.5 text-xs font-semibold">
                  ✓ {getReviewDisplayStatus({ status: backendStatus } as any)} — Read Only
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
                {/* Banner when no eval yet */}
                {!managerEvaluation && managerName && (
                  (backendStatus === ReviewStatus.SUBMITTED || backendStatus === ReviewStatus.IN_REVIEW) ? (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 leading-none mb-1 font-semibold uppercase tracking-wider">Submitted to Evaluators</p>
                        <p className="text-base font-semibold text-slate-800 mb-0">
                          {isManagerUser || managerName === 'CEO & Admin'
                            ? 'CEO & Admin'
                            : `Manager (${managerName}), Admin & CEO`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl px-5 py-4 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-amber-800 leading-none mb-1 font-semibold uppercase tracking-wider">Pending Submission</p>
                        <p className="text-sm font-semibold text-slate-800 mb-0">
                          {isManagerUser || managerName === 'CEO & Admin'
                            ? 'This review has not been submitted to Admin & CEO yet.'
                            : `This review has not been submitted to Manager (${managerName}), Admin & CEO yet.`}
                        </p>
                      </div>
                    </div>
                  )
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
                      const isRatingRevealed = isRevealed(reviewId, quarterParam);
                      const revealedRatingData = isRatingRevealed ? getRevealedData(reviewId, quarterParam) : null;
                      const effectiveRatings = revealedRatingData?.ratings ?? managerEvaluation.ratings;
                      const effectiveFinalRating = revealedRatingData?.finalRating ?? managerEvaluation.finalRating;
                      const isRatingHidden = !isRatingRevealed && Boolean((managerEvaluation as any)?.isFinalRatingHidden || (!effectiveFinalRating && !effectiveRatings));

                      if (isRatingHidden) {
                        return (
                          <div className="mt-4 bg-white/90 border border-indigo-100 rounded-xl p-4 flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</p>
                            <HiddenRatingBadge
                              reviewId={reviewId}
                              quarter={quarterParam}
                              isFinalRatingHidden={true}
                              hasFinalRating={true}
                              className="w-full justify-center py-2 text-sm"
                            />
                          </div>
                        );
                      }

                      const parsedNumericRating =
                        typeof effectiveFinalRating === 'number'
                          ? effectiveFinalRating
                          : (effectiveFinalRating && !isNaN(parseFloat(effectiveFinalRating)))
                            ? parseFloat(effectiveFinalRating)
                            : (managerEvaluation as any)?.averageRating != null && !isNaN(parseFloat(String((managerEvaluation as any).averageRating)))
                              ? parseFloat(String((managerEvaluation as any).averageRating))
                              : null;

                      const managerRatingValues = effectiveRatings
                        ? Object.values(effectiveRatings).map(Number).filter((ratingScore) => !isNaN(ratingScore))
                        : [];
                      const calculatedAvgScore = managerRatingValues.length > 0
                        ? (managerRatingValues.reduce((accumulatedTotal, currentRating) => accumulatedTotal + currentRating, 0) / Math.max(managerRatingValues.length, 6)).toFixed(1)
                        : null;

                      const managerAvgScore = parsedNumericRating !== null ? parsedNumericRating.toFixed(1) : calculatedAvgScore;

                      if (!managerAvgScore && !effectiveFinalRating) return null;

                      return (
                        <div className="mt-4 bg-white/90 border border-indigo-100 rounded-xl p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</p>
                            <p className="text-lg font-extrabold text-indigo-900 mt-0.5">
                              {managerAvgScore
                                ? `${managerAvgScore} / 5.0`
                                : typeof effectiveFinalRating === 'number'
                                  ? `${effectiveFinalRating.toFixed(1)} / 5.0`
                                  : effectiveFinalRating}
                            </p>
                            {effectiveFinalRating && isNaN(Number(effectiveFinalRating)) && (
                              <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                {effectiveFinalRating}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-amber-800 text-sm">
                              {managerAvgScore ||
                                (typeof effectiveFinalRating === 'number'
                                  ? effectiveFinalRating.toFixed(1)
                                  : effectiveFinalRating)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Category Ratings */}
                    {(getRevealedData(reviewId, quarterParam)?.ratings || managerEvaluation.ratings) && Object.keys(getRevealedData(reviewId, quarterParam)?.ratings || managerEvaluation.ratings).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Category Ratings</h4>
                        <div className="flex flex-col gap-2">
                          {RATING_CATEGORIES.map((categoryItem) => {
                            const activeCategoryRatings = getRevealedData(reviewId, quarterParam)?.ratings || managerEvaluation.ratings;
                            const scoreValue = activeCategoryRatings?.[categoryItem.key] || 0;
                            return (
                              <div key={categoryItem.key} className="bg-white/80 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-700">{categoryItem.label}</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((starRating) => (
                                    <Star key={starRating} className={`w-3.5 h-3.5 ${starRating <= scoreValue ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                  <span className="text-xs font-bold text-slate-600 ml-1">{scoreValue}/5</span>
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
              onValuesChange={(changedValues, allValues) => {
                setFormData(previousFormData => ({ ...previousFormData, ...allValues }));
                evaluateNextEnabled(currentStep, allValues);
                handleStepperEdit(changedValues, allValues);
              }}
            >
              {renderStepContent()}
            </Form>

            <div
              className={`qr-footer-bar relative rounded-2xl p-4 mb-4 mt-2 flex items-center ${currentStep === STEP_INDEX_OVERVIEW ? "justify-center" : "justify-between"
                }`}
            >
              <div className="qr-glass-shine" />
              {currentStep > STEP_INDEX_OVERVIEW && (
                <Button
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handleBack}
                  className="h-10 px-4 rounded-xl whitespace-nowrap flex-shrink-0 border-blue-200 text-blue-700 hover:!text-blue-800 hover:!border-blue-400 bg-white font-semibold hover:-translate-x-0.5"
                >
                  Previous
                </Button>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveDraft}
                  loading={saving}
                  icon={<Save className="w-4 h-4" />}
                  className="h-10 px-5 rounded-xl border-blue-500 text-blue-600 hover:!text-blue-700 hover:!border-blue-700 bg-white font-semibold hover:-translate-y-0.5"
                >
                  Save Draft
                </Button>

                {currentStep < TOTAL_FORM_STEPS - 1 ? (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    disabled={!isNextEnabled}
                    className="qr-next-btn h-10 px-6 rounded-xl text-white font-semibold flex items-center gap-2 border-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:translate-x-0.5"
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
              <span>
                {isManagerUser || managerName === 'CEO & Admin' ? (
                  <>Assigned Evaluators: <strong>CEO & Admin</strong></>
                ) : (
                  <>Assigned Evaluators: <strong>Manager ({managerName}), Admin & CEO</strong></>
                )}
              </span>
            </div>
          )}

          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
            <strong>Note:</strong> Once submitted, your review cannot be edited and will be sent to {isManagerUser || managerName === 'CEO & Admin' ? 'the CEO and Admin' : 'your Manager, Admin, and CEO'} for evaluation.
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