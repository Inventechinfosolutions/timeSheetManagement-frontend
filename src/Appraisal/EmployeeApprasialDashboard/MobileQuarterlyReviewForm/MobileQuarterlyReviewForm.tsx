import React, { useRef } from 'react';
import { Form, Button, Spin, Modal } from 'antd';
import type { FormInstance } from 'antd';
import { Save, Send, ArrowLeft, ArrowRight, CheckCircle2, User, UserX, Star, HourglassIcon, Clock } from 'lucide-react';

import { QuarterlyReviewStepperMobile } from '../mobile/QuarterlyReviewStepperMobile';
import { OverviewStep } from '../steps/desktop_steps/OverviewStep';
import { AchievementsAndChallengesStep } from '../steps/desktop_steps/AchievementsAndChallengesStep';
import { LearningGoalsStep } from '../steps/desktop_steps/LearningGoalsStep';
import { TeamContributionStep } from '../steps/desktop_steps/TeamContributionStep';
import { CompanyEnvironmentStep } from '../steps/desktop_steps/CompanyEnvironmentStep';
import { ReviewStep } from '../steps/desktop_steps/ReviewStep';
import { ReviewStatus } from '../enums/Appraisal.enums';
import { getReviewDisplayStatus } from '../utils/appraisalHelpers';
import { HiddenRatingBadge } from '../../components/HiddenRatingBadge';
import {
  FormData,
  ManagerEvaluation,
  TOTAL_FORM_STEPS,
  STEP_INDEX_OVERVIEW,
  STEP_INDEX_ACHIEVEMENTS,
  STEP_INDEX_LEARNING_GOALS,
  STEP_INDEX_TEAM_CONTRIBUTION,
  STEP_INDEX_COMPANY_ENVIRONMENT,
  STEP_INDEX_REVIEW,
  DEFAULT_EVALUATOR_CEO_ADMIN,
} from '../hooks/useQuarterlyReviewForm';

import './MobileQuarterlyReviewForm.css';
import '../desktop/quarterlyReviewDesktop.css';

const MINIMUM_RATING_CATEGORY_COUNT = 6;
const STAR_RATING_SCALE: readonly number[] = [1, 2, 3, 4, 5];

const RATING_CATEGORIES = [
  { key: 'productivity', label: 'Productivity & Output' },
  { key: 'quality', label: 'Quality of Work' },
  { key: 'ownership', label: 'Ownership & Accountability' },
  { key: 'communication', label: 'Communication Skills' },
  { key: 'collaboration', label: 'Team Collaboration' },
  { key: 'innovation', label: 'Innovation & Initiative' },
];

export interface MobileQuarterlyReviewFormProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  form: FormInstance;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formKey: number;
  loading: boolean;
  saving: boolean;
  autoSaving: boolean;
  isNextEnabled: boolean;
  quarter: string;
  reviewId: number | undefined;
  backendStatus: ReviewStatus | null;
  managerName: string | null;
  managerEvaluation: ManagerEvaluation | null;
  isReadOnly: boolean;
  isManagerUser?: boolean;
  confirmModalOpen: boolean;
  setConfirmModalOpen: (open: boolean) => void;
  noManagerModalOpen: boolean;
  setNoManagerModalOpen: (open: boolean) => void;
  fetchingManager: boolean;
  handleBack: () => Promise<void>;
  handleNext: () => Promise<void>;
  handleStepChange: (targetStepNumber: number) => Promise<void>;
  handleStepperEdit?: (changedValues?: any, allValues?: any) => Promise<void>;
  handleSaveDraft: () => Promise<void>;
  handleSubmitClick: () => Promise<void>;
  handleConfirmedSubmit: () => Promise<void>;
  evaluateNextEnabled: (stepNumber: number, allFormValues: any) => void;
}

const MobileQuarterlyReviewForm: React.FC<MobileQuarterlyReviewFormProps> = ({
  currentStep,
  form,
  formData,
  setFormData,
  formKey,
  loading,
  saving,
  autoSaving,
  isNextEnabled,
  quarter,
  reviewId,
  backendStatus,
  managerName,
  managerEvaluation,
  isReadOnly,
  isManagerUser = false,
  confirmModalOpen,
  setConfirmModalOpen,
  noManagerModalOpen,
  setNoManagerModalOpen,
  fetchingManager,
  handleBack,
  handleNext,
  handleStepChange,
  handleStepperEdit,
  handleSaveDraft,
  handleSubmitClick,
  handleConfirmedSubmit,
  evaluateNextEnabled,
}) => {
  const containerRootRef = useRef<HTMLDivElement>(null);

  const renderStepContent = () => {
    const isFieldsDisabled = isReadOnly;
    const combinedFormValues = { ...formData, ...form.getFieldsValue(true) };
    switch (currentStep) {
      case STEP_INDEX_OVERVIEW:
        return <OverviewStep disabled={isFieldsDisabled} />;
      case STEP_INDEX_ACHIEVEMENTS:
        return (
          <AchievementsAndChallengesStep
            disabled={isFieldsDisabled}
            reviewId={reviewId}
            onDataChange={() => {
              evaluateNextEnabled(currentStep, form.getFieldsValue(true));
              handleStepperEdit?.();
            }}
          />
        );
      case STEP_INDEX_LEARNING_GOALS:
        return <LearningGoalsStep disabled={isFieldsDisabled} />;
      case STEP_INDEX_TEAM_CONTRIBUTION:
        return <TeamContributionStep disabled={isFieldsDisabled} />;
      case STEP_INDEX_COMPANY_ENVIRONMENT:
        return <CompanyEnvironmentStep disabled={isFieldsDisabled} />;
      case STEP_INDEX_REVIEW:
        return <ReviewStep values={combinedFormValues} quarter={quarter} managerName={managerName} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Loading Review..." />
      </div>
    );
  }

  return (
    <div className="block lg:hidden">
      <div ref={containerRootRef} className="mobile-qr-container">
        <div className="mb-2">
          <div className="flex justify-between items-center gap-3">
            <div>
              <h1 className="mobile-qr-header-title">
                Quarterly Review
              </h1>
              <p className="mobile-qr-header-subtitle">
                {quarter}&nbsp;
              </p>
            </div>

            <div className="mobile-qr-header-actions">
              {autoSaving && (
                <span className="mobile-qr-autosaving-text">Saving…</span>
              )}

              {!isReadOnly && (
                <Button
                  onClick={handleSaveDraft}
                  loading={saving}
                  icon={<Save className="w-3.5 h-3.5" />}
                  className="h-8 px-3 rounded-lg border-blue-600 text-blue-600 hover:text-blue-700 text-xs font-semibold"
                >
                  Save Draft
                </Button>
              )}

              {isReadOnly && (
                <span className="mobile-qr-readonly-badge">
                  ✓ {getReviewDisplayStatus({ status: backendStatus } as any)}
                </span>
              )}
            </div>
          </div>
        </div>

        {isReadOnly ? (
          <Form key={`ro-${formKey}`} form={form} layout="vertical" className="mb-6" initialValues={formData}>
            {/* Two-column layout on tablet/iPad (md), stacked on mobile */}
            <div className="flex flex-col md:flex-row gap-5 items-start">

              {/* ── LEFT COLUMN: Employee Review Steps ── */}
              <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">
                {/* Banner when no eval yet */}
                {!managerEvaluation && managerName && (
                  (backendStatus === ReviewStatus.SUBMITTED || backendStatus === ReviewStatus.IN_REVIEW) ? (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 leading-none mb-1 font-semibold uppercase tracking-wider">
                          Submitted to Evaluators
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mb-0">
                          {isManagerUser || managerName === DEFAULT_EVALUATOR_CEO_ADMIN
                            ? DEFAULT_EVALUATOR_CEO_ADMIN
                            : `Manager (${managerName}), Admin & CEO`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-amber-800 leading-none mb-1 font-semibold uppercase tracking-wider">
                          Pending Submission
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mb-0">
                          {isManagerUser || managerName === DEFAULT_EVALUATOR_CEO_ADMIN
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
              <div className="w-full md:w-[320px] lg:w-[380px] shrink-0 md:sticky md:top-4 flex flex-col gap-4">
                {managerEvaluation ? (
                  <div className="bg-gradient-to-br from-indigo-900/5 via-indigo-50/40 to-purple-50/30 border border-indigo-200/80 rounded-2xl p-4 md:p-5 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-indigo-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                          <HourglassIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">
                            Manager Evaluation
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">
                              {managerEvaluation.managerName || managerName || 'Manager'}
                            </span>
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
                      const isRatingHidden =
                        managerEvaluation.isFinalRatingHidden ??
                        managerEvaluation.is_final_rating_hidden ??
                        false;

                      if (isRatingHidden) {
                        return (
                          <div className="mt-3.5 bg-white/90 border border-indigo-100 rounded-xl p-3.5 flex flex-col items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</p>
                            <HiddenRatingBadge
                              reviewId={reviewId}
                              quarter={quarter}
                              isFinalRatingHidden={true}
                              hasFinalRating={true}
                              className="w-full justify-center py-2 text-sm"
                            />
                          </div>
                        );
                      }

                      const parsedNumericRating =
                        typeof managerEvaluation.finalRating === 'number'
                          ? managerEvaluation.finalRating
                          : (managerEvaluation.finalRating && !isNaN(parseFloat(String(managerEvaluation.finalRating))))
                          ? parseFloat(String(managerEvaluation.finalRating))
                          : managerEvaluation.averageRating != null && !isNaN(parseFloat(String(managerEvaluation.averageRating)))
                          ? parseFloat(String(managerEvaluation.averageRating))
                          : null;

                      const managerRatingValues = managerEvaluation.ratings
                        ? Object.values(managerEvaluation.ratings).map(Number).filter((ratingScore) => !isNaN(ratingScore))
                        : [];
                      const calculatedAvgScore = managerRatingValues.length > 0
                        ? (
                            managerRatingValues.reduce(
                              (accumulatedTotal, currentRating) => accumulatedTotal + currentRating,
                              0
                            ) / Math.max(managerRatingValues.length, MINIMUM_RATING_CATEGORY_COUNT)
                          ).toFixed(1)
                        : null;

                      const managerAvgScore = parsedNumericRating !== null ? parsedNumericRating.toFixed(1) : calculatedAvgScore;

                      if (!managerAvgScore && !managerEvaluation.finalRating) return null;

                      return (
                        <div className="mt-3.5 bg-white/90 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</p>
                            <p className="text-lg font-extrabold text-indigo-900 mt-0.5">
                              {managerAvgScore
                                ? `${managerAvgScore} / 5.0`
                                : typeof managerEvaluation.finalRating === 'number'
                                  ? `${managerEvaluation.finalRating.toFixed(1)} / 5.0`
                                  : managerEvaluation.finalRating}
                            </p>
                            {managerEvaluation.finalRating && isNaN(Number(managerEvaluation.finalRating)) && (
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
                      <div className="mt-3.5">
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                          Category Ratings
                        </h4>
                        <div className="flex flex-col gap-2">
                          {RATING_CATEGORIES.map((categoryItem) => {
                            const categoryScoreValue = managerEvaluation.ratings?.[categoryItem.key] || 0;
                            return (
                              <div key={categoryItem.key} className="bg-white/80 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-700">{categoryItem.label}</span>
                                <div className="flex items-center gap-0.5">
                                  {STAR_RATING_SCALE.map((starRating) => (
                                    <Star
                                      key={starRating}
                                      className={`w-3.5 h-3.5 ${
                                        starRating <= categoryScoreValue
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs font-bold text-slate-600 ml-1">{categoryScoreValue}/5</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Feedback Cards */}
                    <div className="mt-3.5 flex flex-col gap-3">
                      {managerEvaluation.strengths && (
                        <div className="bg-white/90 border border-emerald-100 rounded-xl p-3.5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide">
                            <span>1. Key Strengths</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {managerEvaluation.strengths}
                          </p>
                        </div>
                      )}

                      {managerEvaluation.improvements && (
                        <div className="bg-white/90 border border-amber-100 rounded-xl p-3.5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide">
                            <span>2. Areas for Improvement</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {managerEvaluation.improvements}
                          </p>
                        </div>
                      )}

                      {managerEvaluation.remarks && (
                        <div className="bg-white/90 border border-indigo-100 rounded-xl p-3.5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide">
                            <span>3. Manager Remarks</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {managerEvaluation.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Pending evaluation placeholder */
                  <div className="bg-white border border-slate-200 border-lined rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 text-center min-h-[160px]">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <HourglassIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600">Awaiting Manager Evaluation</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Your manager hasn't reviewed this submission yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Form>
        ) : (
          <>
            <QuarterlyReviewStepperMobile currentStep={currentStep} onChangeStep={handleStepChange} />

            <Form
              key={`edit-${formKey}`}
              form={form}
              layout="vertical"
              className="mb-4"
              preserve={true}
              initialValues={formData}
              onValuesChange={(changedValues, allFormValues) => {
                setFormData(previousFormData => ({ ...previousFormData, ...allFormValues }));
                evaluateNextEnabled(currentStep, allFormValues);
                handleStepperEdit?.(changedValues, allFormValues);
              }}
            >
              {renderStepContent()}
            </Form>

            <div
              className={`qr-footer-bar relative rounded-2xl p-3 sm:p-4 mb-4 mt-2 flex items-center ${
                currentStep === STEP_INDEX_OVERVIEW ? 'justify-end' : 'justify-between'
              }`}
            >
              <div className="qr-glass-shine" />
              {currentStep > STEP_INDEX_OVERVIEW && (
                <Button
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handleBack}
                  className="h-10 px-3.5 sm:px-4 rounded-xl whitespace-nowrap flex-shrink-0 border-blue-200 text-blue-700 hover:!text-blue-800 hover:!border-blue-400 bg-white font-semibold hover:-translate-x-0.5 text-xs sm:text-sm flex items-center gap-1.5"
                >
                  Previous
                </Button>
              )}

              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={handleSaveDraft}
                  loading={saving}
                  icon={<Save className="w-4 h-4" />}
                  className="h-10 px-3.5 sm:px-5 rounded-xl border-blue-500 text-blue-600 hover:!text-blue-700 hover:!border-blue-700 bg-white font-semibold hover:-translate-y-0.5 text-xs sm:text-sm flex items-center gap-1.5"
                >
                  Save Draft
                </Button>

                {currentStep < TOTAL_FORM_STEPS - 1 ? (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    disabled={!isNextEnabled}
                    className="qr-next-btn h-10 px-4 sm:px-6 rounded-xl text-white font-semibold flex items-center gap-2 border-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:translate-x-0.5 text-xs sm:text-sm"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleSubmitClick}
                    loading={saving || fetchingManager}
                    icon={<Send className="w-4 h-4" />}
                    className="h-10 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold flex items-center gap-2 border-0 shadow-md shadow-emerald-500/20 cursor-pointer text-xs sm:text-sm"
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
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Confirm Final Submission
            </div>
          }
          open={confirmModalOpen}
          onOk={handleConfirmedSubmit}
          onCancel={() => setConfirmModalOpen(false)}
          okText="Yes, Submit Review"
          confirmLoading={saving}
          okButtonProps={{
            className: 'bg-emerald-500 hover:bg-emerald-600 font-semibold rounded-xl h-9 px-4 text-xs',
          }}
          cancelButtonProps={{
            style: { display: 'none' },
          }}
        >
          <p className="text-slate-600 text-xs mt-2 leading-relaxed">
            Are you sure you want to submit your quarterly performance review for <strong>{quarter}</strong>?
          </p>

          {managerName && (
            <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-800">
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                {isManagerUser || managerName === DEFAULT_EVALUATOR_CEO_ADMIN ? (
                  <>Assigned Evaluators: <strong>CEO & Admin</strong></>
                ) : (
                  <>Assigned Evaluators: <strong>Manager ({managerName}), Admin & CEO</strong></>
                )}
              </span>
            </div>
          )}

          <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
            <strong>Note:</strong> Once submitted, your review cannot be edited and will be sent to {isManagerUser || managerName === DEFAULT_EVALUATOR_CEO_ADMIN ? 'the CEO and Admin' : 'your Manager, Admin, and CEO'} for evaluation.
          </div>
        </Modal>

        {/* No Manager Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
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
              className="bg-slate-700 hover:bg-slate-800 font-semibold rounded-xl h-9 px-4 text-xs"
            >
              I Understand
            </Button>,
          ]}
        >
          <p className="text-slate-600 text-xs mt-2 leading-relaxed">
            You currently do not have an active manager assigned in the system.
          </p>
          <p className="text-slate-600 text-xs leading-relaxed">
            Please contact your HR Administrator or Manager to set up your manager mapping before submitting your quarterly appraisal.
          </p>
        </Modal>
      </div>
    </div>
  );
};

export default MobileQuarterlyReviewForm;