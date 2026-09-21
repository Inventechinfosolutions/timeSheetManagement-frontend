/**
 * useQuarterlyReviewForm
 *
 * Single source of truth for ALL business logic shared between the
 * Desktop (QuarterlyReviewForm) and Mobile/Tablet (MobileQuarterlyReviewForm)
 * quarterly review form.
 *
 * What lives here:
 *  - Data parsing utilities (parseJsonArray, parseProjectsArray, parseTeamContribution)
 *  - All local state (quarter, formData, currentStep, loading, saving, …)
 *  - Data-loading useEffect (getCurrentQuarter → getReviewByQuarter → getAllReviews)
 *  - Validation helpers (getStepRequiredValue, evaluateNextEnabled)
 *  - Form payload builder (getFormPayload)
 *  - All event handlers (silentSaveDraft, handleBack, handleNext, handleStepChange,
 *    handleSaveDraft, handleSubmitClick, handleConfirmedSubmit)
 *
 * What does NOT live here:
 *  - Any JSX / UI rendering
 *  - Desktop-only or Mobile-only layout decisions
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormInstance } from 'antd';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ReviewStatus, AppraisalReviewStatus, FormMode } from '../enums/Appraisal.enums';
import { UserType } from '../../../enums';
import { isQuarterOver, convertUrlSlugToQuarterName, quarterToSlug } from '../utils/fyQuarter.utils';
import type { RootState, AppDispatch } from '../../../store';
import {
  getCurrentQuarter,
  getReviewByQuarter,
  getReviewByIdAndStep,
  getAllReviews,
  saveOrSubmitReview,
  createQuarterlyReview,
  updateQuarterlyReview,
} from '../../../reducers/quarterlyReview.reducer';
import { DEFAULT_TEAM_CONTRIBUTION } from '../steps/desktop_steps/TeamContributionStep';
import { isReviewAccessOpen } from '../utils/appraisalHelpers';

// ── Defined Constants (No Hard-Coded Values) ───────────────────────────────────

export const TOTAL_FORM_STEPS = 6;
export const TOTAL_STEPS = TOTAL_FORM_STEPS; // Alias for backward compatibility

export const STEP_INDEX_OVERVIEW = 0;
export const STEP_INDEX_ACHIEVEMENTS = 1;
export const STEP_INDEX_LEARNING_GOALS = 2;
export const STEP_INDEX_TEAM_CONTRIBUTION = 3;
export const STEP_INDEX_COMPANY_ENVIRONMENT = 4;
export const STEP_INDEX_REVIEW = 5;

export const MINIMUM_RATING_VALUE = 1;
export const MAXIMUM_RATING_VALUE = 5;
export const MINIMUM_TEXT_LENGTH = 1;
export const RATING_DECIMAL_MULTIPLIER = 10;
export const DEFAULT_RATING_COUNT = 6;

export const DEFAULT_ACHIEVEMENT_TITLE = 'Achievement';
export const DEFAULT_CHALLENGE_TITLE = 'Challenge';
export const DEFAULT_LEARNING_GOAL_TITLE = 'Learning Goal';
export const DEFAULT_EVALUATOR_CEO_ADMIN = 'CEO & Admin';
export const DEFAULT_EVALUATOR_FALLBACK = 'Manager';

export const DASHBOARD_ROUTE_MANAGER = '/manager-dashboard';
export const DASHBOARD_ROUTE_ADMIN = '/admin-dashboard';
export const DASHBOARD_ROUTE_EMPLOYEE = '/employee-dashboard';
export const APPRAISAL_PAGE_SUBPATH = '/appraisal';

// ── Data Interfaces ──────────────────────────────────────────────────────────

export interface ReviewItem {
  title?: string;
  details: string;
}

export interface ProjectItem {
  projectTitle: string;
  achievement: string;
  challenge: string;
  attachment?: any;
}

export interface TeamContributionItem {
  category: string;
  rating: number;
}

export interface CompanyEnvironment {
  workCultureFeedback?: string;
  workLifeBalance?: string;
  suggestions?: string;
  rating?: number;
}

export interface FormData {
  overview: string;
  projects: ProjectItem[];
  learningGoals: ReviewItem[];
  teamContribution: TeamContributionItem[];
  averageRating?: number | null;
  companyEnvironment?: CompanyEnvironment;
}

export interface ManagerEvaluation {
  reviewStatus?: string | null;
  finalRating?: string | number | null;
  ratings?: Record<string, number> | null;
  strengths?: string | null;
  improvements?: string | null;
  remarks?: string | null;
  reviewedOn?: string | null;
  managerName?: string | null;
  averageRating?: string | number | null;
  isFinalRatingHidden?: boolean;
  is_final_rating_hidden?: boolean;
}

// ── Parsing utilities ────────────────────────────────────────────────────────

export const parseJsonArray = (rawValue: any, defaultTitle: string): ReviewItem[] => {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue;
  try {
    const parsedData = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (Array.isArray(parsedData)) return parsedData;
  } catch {
    // legacy plain-string data fallback
  }
  return typeof rawValue === 'string' ? [{ title: defaultTitle, details: rawValue }] : [];
};

export const parseProjectsArray = (
  rawProjectsValue: any,
  rawAchievementsValue?: any,
  rawChallengesValue?: any
): ProjectItem[] => {
  if (rawProjectsValue) {
    if (Array.isArray(rawProjectsValue)) return rawProjectsValue;
    try {
      const parsedData = typeof rawProjectsValue === 'string' ? JSON.parse(rawProjectsValue) : rawProjectsValue;
      if (Array.isArray(parsedData)) return parsedData;
    } catch { }
  }
  const achievementsList = parseJsonArray(rawAchievementsValue, DEFAULT_ACHIEVEMENT_TITLE);
  const challengesList = parseJsonArray(rawChallengesValue, DEFAULT_CHALLENGE_TITLE);
  if (achievementsList.length === 0 && challengesList.length === 0) return [];
  
  return achievementsList.map(achievementItem => {
    const projectTitle = achievementItem.title || '';
    const matchingChallenge = challengesList.find(
      challengeItem => challengeItem.title === projectTitle || challengeItem.title?.trim() === projectTitle.trim()
    );
    return {
      projectTitle,
      achievement: achievementItem.details || '',
      challenge: matchingChallenge?.details || '',
      attachment: null,
    };
  });
};

export const parseTeamContribution = (rawContributionValue: any): TeamContributionItem[] => {
  if (Array.isArray(rawContributionValue) && rawContributionValue.length > 0) return rawContributionValue;
  if (typeof rawContributionValue === 'string') {
    try {
      const parsedData = JSON.parse(rawContributionValue);
      if (Array.isArray(parsedData) && parsedData.length > 0) return parsedData;
    } catch { }
  }
  return DEFAULT_TEAM_CONTRIBUTION;
};

export const cleanReviewItems = (rawItemsList: any): ReviewItem[] => {
  if (!Array.isArray(rawItemsList)) return [];
  return rawItemsList
    .filter(reviewItem => reviewItem && typeof reviewItem === 'object')
    .map(reviewItem => ({
      ...(reviewItem.title ? { title: String(reviewItem.title) } : {}),
      details: String(reviewItem.details ?? ''),
    }));
};

export const parseCompanyEnvironmentSafe = (environmentValue: any): CompanyEnvironment | undefined => {
  if (!environmentValue) return undefined;
  if (typeof environmentValue === 'object') return environmentValue;
  try { return JSON.parse(environmentValue); } catch { return undefined; }
};

// ── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseQuarterlyReviewFormReturn {
  // state
  form: FormInstance;
  formKey: number;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  saving: boolean;
  autoSaving: boolean;
  isNextEnabled: boolean;
  quarter: string;
  reviewId: number | undefined;
  backendStatus: ReviewStatus | null;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  confirmModalOpen: boolean;
  setConfirmModalOpen: (open: boolean) => void;
  noManagerModalOpen: boolean;
  setNoManagerModalOpen: (open: boolean) => void;
  fetchingManager: boolean;
  managerName: string | null;
  managerEvaluation: ManagerEvaluation | null;
  isReadOnly: boolean;
  isManagerUser: boolean;
  rootRef: React.RefObject<HTMLDivElement>;
  quarterParam: string;
  // helpers
  getBasePath: () => string;
  evaluateNextEnabled: (stepNumber: number, allFormValues: any) => void;
  getFormPayload: (reviewStatus: ReviewStatus) => object;
  // handlers
  handleStepperEdit: (changedValues?: any, allValues?: any) => Promise<void>;
  silentSaveDraft: () => Promise<void>;
  handleBack: () => Promise<void>;
  handleNext: () => Promise<void>;
  handleStepChange: (targetStepNumber: number) => Promise<void>;
  handleSaveDraft: () => Promise<void>;
  handleSubmitClick: () => Promise<void>;
  handleConfirmedSubmit: () => Promise<void>;
}

// ── The Hook ─────────────────────────────────────────────────────────────────

export const useQuarterlyReviewForm = (
  quarterParamInput: string,
  form: FormInstance,
): UseQuarterlyReviewFormReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const employeeId = currentUser?.loginId ?? '';

  // ── UI State ──────────────────────────────────────────────────────────────
  const [formKey, setFormKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(STEP_INDEX_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [quarter, setQuarter] = useState<string>('');
  const [reviewId, setReviewId] = useState<number | undefined>(undefined);
  const reviewIdRef = useRef<number | undefined>(undefined);
  const initialPostDispatchedRef = useRef(false);
  const isPostingInitialRef = useRef(false);
  const [backendStatus, setBackendStatus] = useState<ReviewStatus | null>(null);
  const [isReopened, setIsReopened] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
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
  const [managerEvaluation, setManagerEvaluation] = useState<ManagerEvaluation | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  // ── Derived Values ────────────────────────────────────────────────────────

  const getBasePath = useCallback((): string => {
    if (location.pathname.startsWith(DASHBOARD_ROUTE_MANAGER)) return DASHBOARD_ROUTE_MANAGER;
    if (location.pathname.startsWith(DASHBOARD_ROUTE_ADMIN)) return DASHBOARD_ROUTE_ADMIN;
    return DASHBOARD_ROUTE_EMPLOYEE;
  }, [location.pathname]);

  const isManagerUser =
    currentUser?.userType === UserType.MANAGER ||
    location.pathname.startsWith(DASHBOARD_ROUTE_MANAGER);

  const quarterOver = quarter ? isQuarterOver(quarter) : false;
  const modeParam = new URLSearchParams(location.search).get('mode');

  const isReadOnly =
    modeParam === FormMode.VIEW ||
    (!isReopened && quarterOver && (backendStatus === ReviewStatus.SUBMITTED || backendStatus === ReviewStatus.AUTO_SUBMITTED)) ||
    (!isReopened && (backendStatus === ReviewStatus.SUBMITTED || backendStatus === ReviewStatus.AUTO_SUBMITTED) && modeParam !== FormMode.EDIT);

  // ── Data Loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    const initializeFormState = async () => {
      try {
        setLoading(true);

        let resolvedQuarterName = quarterParamInput ? convertUrlSlugToQuarterName(quarterParamInput) : '';
        if (!resolvedQuarterName) {
          const currentQuarterResponse = await dispatch(getCurrentQuarter()).unwrap();
          resolvedQuarterName = currentQuarterResponse;
        }
        setQuarter(resolvedQuarterName);

        let existingReviewRecord: any = null;
        try {
          existingReviewRecord = await dispatch(getReviewByQuarter(resolvedQuarterName)).unwrap();
        } catch (fetchError) {
          console.warn('[useQuarterlyReviewForm] getReviewByQuarter error', fetchError);
        }

        if (existingReviewRecord) {
          if (existingReviewRecord.id) {
            setReviewId(existingReviewRecord.id);
            reviewIdRef.current = existingReviewRecord.id;
            initialPostDispatchedRef.current = true;
          }
          setBackendStatus(existingReviewRecord.status);
          const accessOpen = isReviewAccessOpen(existingReviewRecord);
          setIsReopened(accessOpen);

          const parseJsonSafely = (jsonValue: any): any => {
            if (!jsonValue) return null;
            if (typeof jsonValue === 'object') return jsonValue;
            try { return JSON.parse(jsonValue); } catch { return null; }
          };

          const initialFormValues: FormData = {
            overview: existingReviewRecord.overview ?? '',
            projects: parseProjectsArray(
              existingReviewRecord.projects, 
              existingReviewRecord.achievements, 
              existingReviewRecord.challenges
            ),
            learningGoals: parseJsonArray(existingReviewRecord.learningGoals, DEFAULT_LEARNING_GOAL_TITLE),
            teamContribution: parseTeamContribution(existingReviewRecord.teamContribution),
            averageRating: existingReviewRecord.averageRating ?? null,
            companyEnvironment: parseCompanyEnvironmentSafe(existingReviewRecord.companyEnvironment),
          };
          setFormData(initialFormValues);
          setFormKey(previousKey => previousKey + 1);

          if (existingReviewRecord.managerName) {
            setManagerName(existingReviewRecord.managerName);
          }

          const isManagerReviewed =
            existingReviewRecord.reviewStatus === AppraisalReviewStatus.REVIEWED ||
            existingReviewRecord.reviewStatus === ReviewStatus.REVIEWED ||
            existingReviewRecord.status === ReviewStatus.REVIEWED;

          const parsedRatingsObject = parseJsonSafely(existingReviewRecord.ratings || existingReviewRecord.managerRatings);
          const evaluationData: ManagerEvaluation = {
            reviewStatus: existingReviewRecord.reviewStatus ?? (isManagerReviewed ? AppraisalReviewStatus.REVIEWED : null),
            finalRating: existingReviewRecord.finalRating ?? null,
            ratings: parsedRatingsObject && typeof parsedRatingsObject === 'object' ? parsedRatingsObject : null,
            strengths: existingReviewRecord.strengths ?? null,
            improvements: existingReviewRecord.improvements ?? null,
            remarks: existingReviewRecord.remarks ?? existingReviewRecord.managerFeedback ?? null,
            reviewedOn: existingReviewRecord.reviewedOn ?? null,
            managerName: existingReviewRecord.managerName ?? null,
          };

          if (
            isManagerReviewed &&
            (
              evaluationData.finalRating ||
              evaluationData.strengths ||
              evaluationData.improvements ||
              evaluationData.remarks ||
              evaluationData.ratings
            )
          ) {
            setManagerEvaluation(evaluationData);
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
    initializeFormState();
  }, [quarterParamInput, dispatch]);

  // ── Validation Helpers ────────────────────────────────────────────────────

  const getStepRequiredValue = useCallback(
    (stepNumber: number, allFormValues: any): boolean => {
      if (stepNumber === STEP_INDEX_OVERVIEW) {
        return (allFormValues.overview ?? '').trim().length >= MINIMUM_TEXT_LENGTH;
      }
      if (stepNumber === STEP_INDEX_ACHIEVEMENTS) {
        const projectsList = allFormValues.projects ?? [];
        return (
          projectsList.length > 0 &&
          projectsList.every(
            (projectItem: any) =>
              projectItem?.projectTitle?.trim() &&
              projectItem?.achievement?.trim().length >= MINIMUM_TEXT_LENGTH &&
              projectItem?.challenge?.trim().length >= MINIMUM_TEXT_LENGTH
          )
        );
      }
      if (stepNumber === STEP_INDEX_LEARNING_GOALS) {
        const goalsList = allFormValues.learningGoals ?? [];
        return (
          goalsList.length > 0 &&
          goalsList.every((goalItem: any) => goalItem?.details?.trim().length >= MINIMUM_TEXT_LENGTH)
        );
      }
      if (stepNumber === STEP_INDEX_TEAM_CONTRIBUTION) {
        const contributionsList = allFormValues.teamContribution ?? [];
        return (
          contributionsList.length > 0 &&
          contributionsList.every((contributionItem: any) => Number(contributionItem?.rating) > 0)
        );
      }
      if (stepNumber === STEP_INDEX_COMPANY_ENVIRONMENT) {
        const environmentData = allFormValues.companyEnvironment ?? {};
        const workCultureFeedback = (environmentData.workCultureFeedback ?? '').trim();
        const workLifeBalance = (environmentData.workLifeBalance ?? '').trim();
        const suggestions = (environmentData.suggestions ?? '').trim();
        const environmentRating = Number(environmentData.rating ?? 0);
        return (
          workCultureFeedback.length >= MINIMUM_TEXT_LENGTH &&
          workLifeBalance.length >= MINIMUM_TEXT_LENGTH &&
          suggestions.length >= MINIMUM_TEXT_LENGTH &&
          environmentRating >= MINIMUM_RATING_VALUE &&
          environmentRating <= MAXIMUM_RATING_VALUE
        );
      }
      return true;
    },
    []
  );

  const evaluateNextEnabled = useCallback(
    (stepNumber: number, allFormValues: any) => {
      if (stepNumber >= TOTAL_FORM_STEPS - 1) {
        setIsNextEnabled(true);
        return;
      }
      setIsNextEnabled(getStepRequiredValue(stepNumber, allFormValues));
    },
    [getStepRequiredValue]
  );

  // Sync form fields when data loads
  useEffect(() => {
    if (!loading) {
      form.setFieldsValue(formData);
      evaluateNextEnabled(currentStep, formData);
    }
  }, [loading, formKey, form, formData, currentStep, evaluateNextEnabled]);

  // ── Payload Builder ───────────────────────────────────────────────────────

  const getFormPayload = useCallback((targetReviewStatus: ReviewStatus, stepIndexOverride?: number) => {
    const formValues = form.getFieldsValue(true);
    const rawProjects = formValues.projects ?? formData.projects ?? [];
    const cleanProjects = Array.isArray(rawProjects)
      ? rawProjects.map((projectItem: any) => ({
        projectTitle: String(projectItem?.projectTitle ?? ''),
        achievement: String(projectItem?.achievement ?? ''),
        challenge: String(projectItem?.challenge ?? ''),
        attachment: projectItem?.attachment ?? null,
      }))
      : [];

    const rawContributions = formValues.teamContribution ?? formData.teamContribution ?? DEFAULT_TEAM_CONTRIBUTION;
    const cleanContributions = Array.isArray(rawContributions)
      ? rawContributions.map((contributionItem: any) => ({
        category: String(contributionItem?.category ?? ''),
        rating: Number(contributionItem?.rating) || 0,
      }))
      : [];

    const validRatingsList = cleanContributions
      .map((contributionItem: any) => contributionItem.rating)
      .filter((ratingScore: number) => ratingScore > 0);

    const averageScore = validRatingsList.length > 0
      ? Math.round(
          (validRatingsList.reduce(
            (accumulatedRatingTotal: number, currentRatingValue: number) => accumulatedRatingTotal + currentRatingValue,
            0
          ) / validRatingsList.length) * RATING_DECIMAL_MULTIPLIER
        ) / RATING_DECIMAL_MULTIPLIER
      : 0;

    const rawEnvironment = formValues.companyEnvironment ?? formData.companyEnvironment ?? {};
    const cleanEnvironment = {
      workCultureFeedback: String(rawEnvironment?.workCultureFeedback ?? ''),
      workLifeBalance: String(rawEnvironment?.workLifeBalance ?? ''),
      suggestions: String(rawEnvironment?.suggestions ?? ''),
      rating: Number(rawEnvironment?.rating ?? 0) || 0,
    };

    const stepNumber = (stepIndexOverride !== undefined ? stepIndexOverride : currentStep) + 1;

    return {
      quarter,
      status: targetReviewStatus,
      step: stepNumber,
      overview: formValues.overview ?? formData.overview ?? '',
      projects: cleanProjects,
      learningGoals: cleanReviewItems(formValues.learningGoals ?? formData.learningGoals),
      teamContribution: cleanContributions,
      averageRating: averageScore,
      companyEnvironment: cleanEnvironment,
    };
  }, [form, formData, currentStep, quarter]);

  // ── Scroll Helper ─────────────────────────────────────────────────────────

  const scrollToTop = () => {
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Sync reviewIdRef whenever reviewId state changes
  useEffect(() => {
    reviewIdRef.current = reviewId;
  }, [reviewId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /**
   * Called whenever user starts editing any field in the stepper.
   * If this is the initial time (review not yet created in DB / no reviewId),
   * ONLY POST is called to create the review record with status INITIAL.
   */
  const handleStepperEdit = useCallback(async (_changedValues?: any, _allValues?: any) => {
    if (isReadOnly) return;
    const currentReviewId = reviewIdRef.current || reviewId;
    if (currentReviewId || initialPostDispatchedRef.current || isPostingInitialRef.current) {
      return;
    }

    initialPostDispatchedRef.current = true;
    isPostingInitialRef.current = true;

    try {
      const initialPayload = getFormPayload(ReviewStatus.INITIAL, currentStep);
      // At initial edit time, ONLY POST should call with status as INITIAL
      const createResponse = await dispatch(createQuarterlyReview(initialPayload)).unwrap();
      if (createResponse?.id) {
        setReviewId(createResponse.id);
        reviewIdRef.current = createResponse.id;
      }
      if (createResponse?.status) {
        setBackendStatus(createResponse.status);
      }
    } catch (initialPostError) {
      console.warn('[handleStepperEdit] Initial POST creation failed:', initialPostError);
      initialPostDispatchedRef.current = false;
    } finally {
      isPostingInitialRef.current = false;
    }
  }, [isReadOnly, reviewId, currentStep, getFormPayload, dispatch]);

  const silentSaveDraft = useCallback(async (stepIndexToSave?: number) => {
    if (isReadOnly) return;
    try {
      setAutoSaving(true);
      const currentReviewId = reviewIdRef.current || reviewId;
      const stepIdx = stepIndexToSave !== undefined ? stepIndexToSave : currentStep;

      if (!currentReviewId && !initialPostDispatchedRef.current) {
        initialPostDispatchedRef.current = true;
        const initialPayload = getFormPayload(ReviewStatus.INITIAL, stepIdx);
        const saveResponse = await dispatch(createQuarterlyReview(initialPayload)).unwrap();
        if (saveResponse?.id) {
          setReviewId(saveResponse.id);
          reviewIdRef.current = saveResponse.id;
        }
        if (saveResponse?.status) setBackendStatus(saveResponse.status);
      } else if (currentReviewId) {
        const updatePayload = {
          ...getFormPayload(ReviewStatus.DRAFT, stepIdx),
          id: currentReviewId,
        };
        const updateResponse = await dispatch(updateQuarterlyReview(updatePayload)).unwrap();
        if (updateResponse?.id) {
          setReviewId(updateResponse.id);
          reviewIdRef.current = updateResponse.id;
        }
        if (updateResponse?.status) setBackendStatus(updateResponse.status);
      }
    } catch {
      // Non-blocking background draft save
    } finally {
      setAutoSaving(false);
    }
  }, [isReadOnly, reviewId, currentStep, dispatch, getFormPayload]);

  const handleBack = async () => {
    if (currentStep <= STEP_INDEX_OVERVIEW) return;

    // 1. Do not lose unsaved data from the current step: sync current form values into state
    const currentValues = form.getFieldsValue(true);
    setFormData(previousData => ({ ...previousData, ...currentValues }));

    const targetStepIndex = Math.max(currentStep - 1, STEP_INDEX_OVERVIEW);
    const previousStepQuery = targetStepIndex + 1; // 1-based index (e.g. ?step=1, ?step=2)
    const activeIdentifier = quarter ? quarterToSlug(quarter) : (reviewIdRef.current || reviewId);

    // 2. ONLY 1 API call: Call stepper GET API with the appropriate previous-step query parameter
    try {
      const fetchedReview = await dispatch(
        getReviewByIdAndStep({
          id: activeIdentifier,
          quarter,
          step: previousStepQuery,
        })
      ).unwrap();

      // 3. Load the saved data for that step
      if (fetchedReview) {
        if (fetchedReview.id) {
          setReviewId(fetchedReview.id);
          reviewIdRef.current = fetchedReview.id;
        }
        if (fetchedReview.status) {
          setBackendStatus(fetchedReview.status);
        }

        const parsedOverview = fetchedReview.overview ?? '';
        const parsedProjects = parseProjectsArray(
          fetchedReview.projects,
          fetchedReview.achievements,
          fetchedReview.challenges
        );
        const parsedGoals = parseJsonArray(fetchedReview.learningGoals, DEFAULT_LEARNING_GOAL_TITLE);
        const parsedContributions = parseTeamContribution(fetchedReview.teamContribution);
        const parsedEnv = parseCompanyEnvironmentSafe(fetchedReview.companyEnvironment);

        const stepFieldUpdates: any = {};
        if (targetStepIndex === STEP_INDEX_OVERVIEW) {
          stepFieldUpdates.overview = parsedOverview;
        } else if (targetStepIndex === STEP_INDEX_ACHIEVEMENTS) {
          stepFieldUpdates.projects = parsedProjects;
        } else if (targetStepIndex === STEP_INDEX_LEARNING_GOALS) {
          stepFieldUpdates.learningGoals = parsedGoals;
        } else if (targetStepIndex === STEP_INDEX_TEAM_CONTRIBUTION) {
          stepFieldUpdates.teamContribution = parsedContributions;
        } else if (targetStepIndex === STEP_INDEX_COMPANY_ENVIRONMENT) {
          stepFieldUpdates.companyEnvironment = parsedEnv;
        }

        form.setFieldsValue(stepFieldUpdates);
        setFormData(previousData => ({
          ...previousData,
          ...stepFieldUpdates,
        }));
      }
    } catch (fetchError) {
      console.warn('[handleBack] Error fetching saved review data for previous step:', fetchError);
    }

    setCurrentStep(targetStepIndex);
    requestAnimationFrame(() => scrollToTop());
  };

  const handleNext = async () => {
    if (currentStep === STEP_INDEX_ACHIEVEMENTS) {
      try {
        await form.validateFields();
      } catch {
        return;
      }
    }
    const nextStepIndex = Math.min(currentStep + 1, TOTAL_FORM_STEPS - 1);
    if (!isReadOnly) {
      await silentSaveDraft(nextStepIndex);
    }
    setCurrentStep(nextStepIndex);
    requestAnimationFrame(() => scrollToTop());
  };

  const handleStepChange = async (targetStepNumber: number) => {
    if (targetStepNumber > currentStep) {
      if (!isNextEnabled) return;
      if (currentStep === STEP_INDEX_ACHIEVEMENTS) {
        try {
          await form.validateFields();
        } catch {
          return;
        }
      }
      if (!isReadOnly) await silentSaveDraft(targetStepNumber);
      setCurrentStep(targetStepNumber);
      requestAnimationFrame(() => scrollToTop());
    } else {
      if (!isReadOnly) await silentSaveDraft(targetStepNumber);
      setCurrentStep(targetStepNumber);
      requestAnimationFrame(() => scrollToTop());
    }
  };

  /**
   * Save Draft handler:
   * Once clicked, performs PUT to update the draft in the database,
   * followed immediately by GET to fetch the updated review data.
   */
  const handleSaveDraft = async () => {
    if (saving || isReadOnly) return;
    try {
      setSaving(true);
      const currentReviewId = reviewIdRef.current || reviewId;

      if (!currentReviewId && !initialPostDispatchedRef.current) {
        // Fallback: If clicked before initial edit triggered POST
        initialPostDispatchedRef.current = true;
        const createPayload = getFormPayload(ReviewStatus.DRAFT, currentStep);
        const createResponse = await dispatch(createQuarterlyReview(createPayload)).unwrap();
        if (createResponse?.id) {
          setReviewId(createResponse.id);
          reviewIdRef.current = createResponse.id;
        }
        if (createResponse?.status) setBackendStatus(createResponse.status);

        // Then GET to sync with explicit step query
        if (quarter) {
          const activeIdentifier = quarterToSlug(quarter) || createResponse?.id;
          const refreshed = await dispatch(
            getReviewByIdAndStep({
              id: activeIdentifier,
              quarter,
              step: currentStep + 1,
            })
          ).unwrap();
          if (refreshed?.id) {
            setReviewId(refreshed.id);
            reviewIdRef.current = refreshed.id;
          }
          if (refreshed?.status) setBackendStatus(refreshed.status);
        }
      } else {
        // Record exists (initial POST completed or loaded): call PUT, then GET!
        const updatePayload = {
          ...getFormPayload(ReviewStatus.DRAFT, currentStep),
          ...(currentReviewId ? { id: currentReviewId } : {}),
        };
        const updateResponse = await dispatch(updateQuarterlyReview(updatePayload)).unwrap();
        if (updateResponse?.id) {
          setReviewId(updateResponse.id);
          reviewIdRef.current = updateResponse.id;
        }
        if (updateResponse?.status) setBackendStatus(updateResponse.status);

        // GET to sync latest state with explicit step query
        if (quarter) {
          const activeIdentifier = quarterToSlug(quarter) || currentReviewId;
          const refreshed = await dispatch(
            getReviewByIdAndStep({
              id: activeIdentifier,
              quarter,
              step: currentStep + 1,
            })
          ).unwrap();
          if (refreshed) {
            if (refreshed.id) {
              setReviewId(refreshed.id);
              reviewIdRef.current = refreshed.id;
            }
            if (refreshed.status) setBackendStatus(refreshed.status);
          }
        }
      }

      message.success('Draft saved successfully!');
      navigate(`${getBasePath()}${APPRAISAL_PAGE_SUBPATH}`);
    } catch (saveError: any) {
      message.error(saveError?.message ?? 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitClick = async () => {
    if (saving || isReadOnly) return;
    try {
      await form.validateFields();
    } catch {
      message.error('Please complete all required fields before submitting.');
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    if (saving || isReadOnly) return;
    try {
      setSaving(true);
      const currentReviewId = reviewIdRef.current || reviewId;
      const submissionPayload = {
        ...getFormPayload(ReviewStatus.SUBMITTED),
        ...(currentReviewId ? { id: currentReviewId } : {}),
        managerName: managerName || (isManagerUser ? DEFAULT_EVALUATOR_CEO_ADMIN : undefined),
      };

      const submitResponse = currentReviewId
        ? await dispatch(updateQuarterlyReview(submissionPayload)).unwrap()
        : await dispatch(createQuarterlyReview(submissionPayload)).unwrap();

      setConfirmModalOpen(false);
      if (submitResponse?.id) {
        setReviewId(submitResponse.id);
        reviewIdRef.current = submitResponse.id;
      }
      setBackendStatus(submitResponse?.status || ReviewStatus.SUBMITTED);
      message.success('Quarterly review submitted successfully!');
      navigate(`${getBasePath()}${APPRAISAL_PAGE_SUBPATH}`, { replace: true });
    } catch (submissionError: any) {
      setConfirmModalOpen(false);
      const errorMessageString = (
        typeof submissionError === 'string' ? submissionError : submissionError?.message
      ) || '';
      if (errorMessageString.includes('already been submitted')) {
        setBackendStatus(ReviewStatus.SUBMITTED);
        message.success('Quarterly review submitted successfully!');
        navigate(`${getBasePath()}${APPRAISAL_PAGE_SUBPATH}`, { replace: true });
      } else {
        message.error(errorMessageString || 'Failed to submit review.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    form,
    formKey,
    currentStep,
    setCurrentStep,
    loading,
    saving,
    autoSaving,
    isNextEnabled,
    quarter,
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
    quarterParam: quarterParamInput,
    getBasePath,
    evaluateNextEnabled,
    getFormPayload,
    handleStepperEdit,
    silentSaveDraft,
    handleBack,
    handleNext,
    handleStepChange,
    handleSaveDraft,
    handleSubmitClick,
    handleConfirmedSubmit,
  };
};
