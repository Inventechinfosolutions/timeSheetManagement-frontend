import { useEffect, useState, useCallback, useRef } from 'react';
import { Form, Button, message, Spin, Modal } from 'antd';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Send, ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, User, UserX, Star, Award, MessageSquare, TrendingUp, ThumbsUp } from 'lucide-react';

import { QuarterlyReviewStepperMobile } from '../mobile/QuarterlyReviewStepperMobile';
import { OverviewStep } from '../steps/desktop_steps/OverviewStep';
import { AchievementsAndChallengesStep } from '../steps/desktop_steps/AchievementsAndChallengesStep';
import { LearningGoalsStep } from '../steps/desktop_steps/LearningGoalsStep';
import { TeamContributionStep, DEFAULT_TEAM_CONTRIBUTION } from '../steps/desktop_steps/TeamContributionStep';
import { CompanyEnvironmentStep } from '../steps/desktop_steps/CompanyEnvironmentStep';
import { ReviewStep } from '../steps/desktop_steps/ReviewStep';
import { ReviewStatus } from '../enums/Appraisal.enums';
import {
    isQuarterOver,
    formatQuarterRange,
    slugToQuarter,
} from '../utils/fyQuarter.utils';
import type { RootState, AppDispatch } from '../../../store';
import {
    getCurrentQuarter,
    getReviewByQuarter,
    getAllReviews,
    saveOrSubmitReview,
} from '../../../reducers/quarterlyReview.reducer';
import { getManagerMappingByEmployeeId } from '../../../reducers/managerMapping.reducer';

import './MobileQuarterlyReviewForm.css';

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

export interface MobileQuarterlyReviewFormProps {
    currentStep?: number;
    setCurrentStep?: React.Dispatch<React.SetStateAction<number>>;
    form?: any;
    formData?: {
        overview: string;
        projects: ProjectItem[];
        learningGoals: ReviewItem[];
        teamContribution: TeamContributionItem[];
        averageRating?: number | null;
        companyEnvironment?: CompanyEnvironment;
    };
    setFormData?: React.Dispatch<React.SetStateAction<any>>;
    formKey?: number;
    loading?: boolean;
    saving?: boolean;
    autoSaving?: boolean;
    isNextEnabled?: boolean;
    quarter?: string;
    reviewId?: number | undefined;
    backendStatus?: ReviewStatus | null;
    managerName?: string | null;
    managerEvaluation?: {
        reviewStatus?: string | null;
        finalRating?: string | number | null;
        ratings?: Record<string, number> | null;
        strengths?: string | null;
        improvements?: string | null;
        remarks?: string | null;
        reviewedOn?: string | null;
        managerName?: string | null;
    } | null;
    isReadOnly?: boolean;
    confirmModalOpen?: boolean;
    setConfirmModalOpen?: (open: boolean) => void;
    noManagerModalOpen?: boolean;
    setNoManagerModalOpen?: (open: boolean) => void;
    fetchingManager?: boolean;
    handleBack?: () => Promise<void>;
    handleNext?: () => Promise<void>;
    handleStepChange?: (targetStep: number) => Promise<void>;
    handleSaveDraft?: () => Promise<void>;
    handleSubmitClick?: () => Promise<void>;
    handleConfirmedSubmit?: () => Promise<void>;
    evaluateNextEnabled?: (step: number, allValues: any) => void;
}

const MobileQuarterlyReviewForm: React.FC<MobileQuarterlyReviewFormProps> = (props) => {
    const isControlled = props.currentStep !== undefined;

    const navigate = useNavigate();
    const { date: quarterParamSlug } = useParams<{ tab?: string; date?: string }>();
    const [searchParams] = useSearchParams();
    const rawQuarterParam = quarterParamSlug || searchParams.get('quarter') || '';
    const quarterParam = slugToQuarter(rawQuarterParam);

    const dispatch = useDispatch<AppDispatch>();
    const [internalForm] = Form.useForm();
    const form = props.form || internalForm;

    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const employeeId = currentUser?.loginId ?? '';

    const [internalFormKey, setInternalFormKey] = useState(0);
    const formKey = props.formKey !== undefined ? props.formKey : internalFormKey;

    const [internalCurrentStep, setInternalCurrentStep] = useState(0);
    const currentStep = props.currentStep !== undefined ? props.currentStep : internalCurrentStep;
    const setCurrentStep = props.setCurrentStep || setInternalCurrentStep;

    const [internalLoading, setInternalLoading] = useState(true);
    const loading = props.loading !== undefined ? props.loading : internalLoading;

    const [internalSaving, setInternalSaving] = useState(false);
    const saving = props.saving !== undefined ? props.saving : internalSaving;

    const [internalAutoSaving, setInternalAutoSaving] = useState(false);
    const autoSaving = props.autoSaving !== undefined ? props.autoSaving : internalAutoSaving;

    const [internalIsNextEnabled, setInternalIsNextEnabled] = useState(false);
    const isNextEnabled = props.isNextEnabled !== undefined ? props.isNextEnabled : internalIsNextEnabled;

    const [internalQuarter, setInternalQuarter] = useState<string>('');
    const quarter = props.quarter !== undefined ? props.quarter : internalQuarter;

    const [internalReviewId, setInternalReviewId] = useState<number | undefined>(undefined);
    const reviewId = props.reviewId !== undefined ? props.reviewId : internalReviewId;

    const [internalBackendStatus, setInternalBackendStatus] = useState<ReviewStatus | null>(null);
    const backendStatus = props.backendStatus !== undefined ? props.backendStatus : internalBackendStatus;

    const [internalManagerName, setInternalManagerName] = useState<string | null>(null);
    const managerName = props.managerName !== undefined ? props.managerName : internalManagerName;

    const [internalManagerEvaluation, setInternalManagerEvaluation] = useState<any>(null);
    const managerEvaluation = props.managerEvaluation !== undefined ? props.managerEvaluation : internalManagerEvaluation;

    const [internalFormData, setInternalFormData] = useState<{
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
    const formData = props.formData !== undefined ? props.formData : internalFormData;
    const setFormData = props.setFormData || setInternalFormData;

    const [internalConfirmModalOpen, setInternalConfirmModalOpen] = useState(false);
    const confirmModalOpen = props.confirmModalOpen !== undefined ? props.confirmModalOpen : internalConfirmModalOpen;
    const setConfirmModalOpen = props.setConfirmModalOpen || setInternalConfirmModalOpen;

    const [internalNoManagerModalOpen, setInternalNoManagerModalOpen] = useState(false);
    const noManagerModalOpen = props.noManagerModalOpen !== undefined ? props.noManagerModalOpen : internalNoManagerModalOpen;
    const setNoManagerModalOpen = props.setNoManagerModalOpen || setInternalNoManagerModalOpen;

    const [internalFetchingManager, setInternalFetchingManager] = useState(false);
    const fetchingManager = props.fetchingManager !== undefined ? props.fetchingManager : internalFetchingManager;

    const rootRef = useRef<HTMLDivElement>(null);

    const quarterOver = quarter ? isQuarterOver(quarter) : false;
    const isReadOnly = props.isReadOnly !== undefined
        ? props.isReadOnly
        : ((quarterOver && backendStatus === ReviewStatus.SUBMITTED) || searchParams.get('mode') === ReviewStatus.VIEW);

    useEffect(() => {
        if (isControlled) return;
        const init = async () => {
            try {
                setInternalLoading(true);

                let resolvedQuarter = quarterParam ?? '';
                if (!resolvedQuarter) {
                    const res = await dispatch(getCurrentQuarter()).unwrap();
                    resolvedQuarter = res;
                }
                setInternalQuarter(resolvedQuarter);

                let existing: any = null;
                try {
                    existing = await dispatch(getReviewByQuarter(resolvedQuarter)).unwrap();
                } catch (fetchErr) {
                    console.warn('[MobileQRForm] getReviewByQuarter failed, trying fallback', fetchErr);
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
                        console.warn('[MobileQRForm] getAllReviews fallback failed', allErr);
                    }
                }

                if (existing) {
                    if (existing.id) setInternalReviewId(existing.id);
                    setInternalBackendStatus(existing.status);
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
                    setInternalFormData(initialVals);
                    setInternalFormKey(k => k + 1);
                    if (existing.managerName) {
                        setInternalManagerName(existing.managerName);
                    }

                    const isManagerReviewed =
                        existing.reviewStatus === ReviewStatus.REVIEWED ||
                        existing.reviewStatus === ReviewStatus.COMPLETED ||
                        existing.status === ReviewStatus.REVIEWED ||
                        existing.status === ReviewStatus.APPROVED ||
                        existing.status === ReviewStatus.COMPLETED;

                    const parseJsonSafely = (val: any): any => {
                        if (!val) return null;
                        if (typeof val === 'object') return val;
                        try { return JSON.parse(val); } catch { return null; }
                    };

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
                        setInternalManagerEvaluation(evalData);
                    } else {
                        setInternalManagerEvaluation(null);
                    }
                }
            } catch {
                message.error('Failed to load review data.');
            } finally {
                setInternalLoading(false);
            }
        };
        init();
    }, [quarterParam, isControlled]);

    const internalGetStepRequiredValue = useCallback(
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

    const internalEvaluateNextEnabled = useCallback(
        (step: number, allValues: any) => {
            if (step >= TOTAL_STEPS - 1) {
                setInternalIsNextEnabled(true);
                return;
            }
            setInternalIsNextEnabled(internalGetStepRequiredValue(step, allValues));
        },
        [internalGetStepRequiredValue]
    );

    const evaluateNextEnabled = props.evaluateNextEnabled || internalEvaluateNextEnabled;

    useEffect(() => {
        if (isControlled) return;
        if (!loading) {
            form.setFieldsValue(formData);
            evaluateNextEnabled(currentStep, formData);
        }
    }, [loading, formKey, isControlled]);

    const watchedValues = Form.useWatch([], form);

    useEffect(() => {
        if (isControlled) return;
        evaluateNextEnabled(currentStep, watchedValues || {});
    }, [currentStep, watchedValues, evaluateNextEnabled, isControlled]);

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

    const internalSilentSaveDraft = useCallback(async () => {
        if (isReadOnly) return;
        try {
            setInternalAutoSaving(true);
            const payload = getFormPayload(ReviewStatus.DRAFT);
            const result = await dispatch(saveOrSubmitReview(payload)).unwrap();
            if (result?.id) setInternalReviewId(result.id);
            setInternalBackendStatus(result.status);
        } catch {
            // Non-blocking draft save
        } finally {
            setInternalAutoSaving(false);
        }
    }, [form, quarter, isReadOnly, formData, dispatch]);

    const internalHandleBack = async () => {
        if (!isReadOnly) {
            await internalSilentSaveDraft();
        }
        setCurrentStep((prev: number) => {
            const next = Math.max(prev - 1, 0);
            requestAnimationFrame(() => scrollToTop());
            return next;
        });
    };

    const internalHandleNext = async () => {
        if (currentStep === 1) {
            try {
                await form.validateFields();
            } catch {
                return;
            }
        }

        if (!isReadOnly) {
            await internalSilentSaveDraft();
        }

        setCurrentStep((prev: number) => {
            const next = Math.min(prev + 1, TOTAL_STEPS - 1);
            requestAnimationFrame(() => scrollToTop());
            return next;
        });
    };

    const internalHandleStepChange = async (targetStep: number) => {
        if (targetStep > currentStep) {
            if (!isNextEnabled) return;
            if (currentStep === 1) {
                try {
                    await form.validateFields();
                } catch {
                    return;
                }
            }
            if (!isReadOnly) await internalSilentSaveDraft();
            setCurrentStep(targetStep);
            requestAnimationFrame(() => scrollToTop());
        } else {
            if (!isReadOnly) await internalSilentSaveDraft();
            setCurrentStep(targetStep);
            requestAnimationFrame(() => scrollToTop());
        }
    };

    const internalHandleSaveDraft = async () => {
        try {
            setInternalSaving(true);
            const payload = getFormPayload(ReviewStatus.DRAFT);
            const result = await dispatch(saveOrSubmitReview(payload)).unwrap();
            if (result?.id) setInternalReviewId(result.id);
            setInternalBackendStatus(result.status);
            message.success('Draft saved successfully!');
            navigate('/employee-dashboard/appraisal');
        } catch (err: any) {
            message.error(err?.message ?? 'Failed to save draft.');
        } finally {
            setInternalSaving(false);
        }
    };

    const internalHandleSubmitClick = async () => {
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
            setInternalFetchingManager(true);
            const result = await dispatch(getManagerMappingByEmployeeId(employeeId)).unwrap();
            const fetchedManagerName: string | undefined = result?.managerName;

            if (!fetchedManagerName) {
                setInternalNoManagerModalOpen(true);
                return;
            }

            setInternalManagerName(fetchedManagerName);
            setInternalConfirmModalOpen(true);
        } catch {
            setInternalNoManagerModalOpen(true);
        } finally {
            setInternalFetchingManager(false);
        }
    };

    const internalHandleConfirmedSubmit = async () => {
        try {
            setInternalSaving(true);
            const payload = getFormPayload(ReviewStatus.SUBMITTED);
            const result = await dispatch(saveOrSubmitReview(payload)).unwrap();
            if (result?.id) setInternalReviewId(result.id);
            setInternalBackendStatus(result.status);
            setInternalConfirmModalOpen(false);
            message.success('Quarterly review submitted successfully!');
            navigate('/employee-dashboard/appraisal');
        } catch (err: any) {
            message.error(err?.message ?? 'Failed to submit review.');
        } finally {
            setInternalSaving(false);
        }
    };

    const handleBack = props.handleBack || internalHandleBack;
    const handleNext = props.handleNext || internalHandleNext;
    const handleStepChange = props.handleStepChange || internalHandleStepChange;
    const handleSaveDraft = props.handleSaveDraft || internalHandleSaveDraft;
    const handleSubmitClick = props.handleSubmitClick || internalHandleSubmitClick;
    const handleConfirmedSubmit = props.handleConfirmedSubmit || internalHandleConfirmedSubmit;

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

    // const quarterRange = formatQuarterRange(quarter);

    return (
        <div className="block lg:hidden">
            <div ref={rootRef} className="mobile-qr-container">
                {/* <button
                    onClick={() => navigate('/employee-dashboard/appraisal')}
                    className="mobile-qr-back-btn"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button> */}

                <div className="mb-2">
                    <div className="flex justify-between items-center gap-3">
                        <div>
                            <h1 className="mobile-qr-header-title">
                                Quarterly Review
                            </h1>
                            <p className="mobile-qr-header-subtitle">
                                {quarter}&nbsp;
                                {/* ·&nbsp;{quarterRange} */}
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
                                    ✓ {backendStatus === ReviewStatus.SUBMITTED ? "Submitted" : "Draft"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isReadOnly ? (
                    <Form key={`ro-${formKey}`} form={form} layout="vertical" className="mb-6" initialValues={formData}>
                        {managerEvaluation && (
                            <div className="mb-4 bg-gradient-to-br from-indigo-900/5 via-indigo-50/40 to-purple-50/30 border border-indigo-200/80 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-2 pb-3 border-b border-indigo-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm leading-tight">
                                                Manager Evaluation
                                            </h3>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {managerEvaluation.managerName || managerName || 'Manager'}
                                                {managerEvaluation.reviewedOn && (
                                                    <> &bull; {new Date(managerEvaluation.reviewedOn).toLocaleDateString('en-IN')}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        {managerEvaluation.reviewStatus || 'Reviewed'}
                                    </span>
                                </div>

                                {(() => {
                                    const managerRatingValues = managerEvaluation.ratings
                                        ? Object.values(managerEvaluation.ratings).map(Number).filter(v => !isNaN(v) && v > 0)
                                        : [];
                                    const managerAvgScore = managerRatingValues.length > 0
                                        ? (managerRatingValues.reduce((a, b) => a + b, 0) / managerRatingValues.length).toFixed(1)
                                        : null;

                                    if (!managerAvgScore && !managerEvaluation.finalRating) return null;

                                    return (
                                        <div className="mt-3 bg-white/90 border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-2">
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Overall Rating</p>
                                                <p className="text-sm font-extrabold text-indigo-900 mt-0.5">
                                                    {managerAvgScore
                                                        ? `${managerAvgScore} / 5.0`
                                                        : typeof managerEvaluation.finalRating === ReviewStatus.NUMBER
                                                            ? `${managerEvaluation.finalRating} / 5.0`
                                                            : managerEvaluation.finalRating}
                                                </p>
                                                {managerEvaluation.finalRating && managerAvgScore && (
                                                    <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                                                        {managerEvaluation.finalRating}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                <span className="font-bold text-amber-800 text-xs">
                                                    {managerAvgScore ||
                                                        (typeof managerEvaluation.finalRating === ReviewStatus.NUMBER
                                                            ? managerEvaluation.finalRating.toFixed(1)
                                                            : managerEvaluation.finalRating)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {managerEvaluation.ratings && Object.keys(managerEvaluation.ratings).length > 0 && (
                                    <div className="mt-3">
                                        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Category Ratings
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {RATING_CATEGORIES.map((cat) => {
                                                const val = managerEvaluation.ratings?.[cat.key] || 0;
                                                return (
                                                    <div key={cat.key} className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between gap-2">
                                                        <span className="text-xs font-medium text-slate-700">{cat.label}</span>
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={`w-3 h-3 ${star <= val
                                                                            ? 'text-amber-400 fill-amber-400'
                                                                            : 'text-slate-200'
                                                                        }`}
                                                                />
                                                            ))}
                                                            <span className="text-xs font-bold text-slate-700 ml-1">{val}/5</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 flex flex-col gap-2">
                                    {managerEvaluation.strengths && (
                                        <div className="bg-white/90 border border-emerald-100 rounded-xl p-3 flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide">
                                                <span>1. Key Strengths</span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                {managerEvaluation.strengths}
                                            </p>
                                        </div>
                                    )}

                                    {managerEvaluation.improvements && (
                                        <div className="bg-white/90 border border-amber-100 rounded-xl p-3 flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide">
                                                <span>2. Areas for Improvement</span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                {managerEvaluation.improvements}
                                            </p>
                                        </div>
                                    )}

                                    {managerEvaluation.remarks && (
                                        <div className="bg-white/90 border border-indigo-100 rounded-xl p-3 flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-black font-semibold text-[12px] uppercase tracking-wide">
                                                <span>3. Manager Feedback & Remarks</span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                {managerEvaluation.remarks}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!managerEvaluation && managerName && (
                            <div className="mobile-qr-readonly-manager-banner">
                                <div className="mobile-qr-manager-icon-wrapper">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="mobile-qr-manager-label">Submitted to Manager</p>
                                    <p className="mobile-qr-manager-name">{managerName}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-4">
                            <OverviewStep disabled={true} />
                            <AchievementsAndChallengesStep disabled={true} reviewId={reviewId} />
                            <LearningGoalsStep disabled={true} />
                            <TeamContributionStep disabled={true} />
                            <CompanyEnvironmentStep disabled={true} />
                        </div>
                    </Form>
                ) : (
                    <>
                        <QuarterlyReviewStepperMobile currentStep={currentStep} onChangeStep={handleStepChange} />

                        <Form
                            key={`edit-${formKey}`}
                            form={form}
                            layout="vertical"
                            className="mb-6"
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
                            className={`mobile-qr-footer-nav ${currentStep === 0 ? 'mobile-qr-footer-nav-center' : ''
                                }`}
                        >
                            {currentStep > 0 && (
                                <Button
                                    onClick={handleBack}
                                    className="h-9 px-3 rounded-xl text-xs whitespace-nowrap"
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                                        <span className="hidden md:inline">Previous</span>
                                    </span>
                                </Button>
                            )}

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleSaveDraft}
                                    loading={saving}
                                    className="h-9 px-3 rounded-xl border-blue-600 text-blue-600 hover:text-blue-700 text-xs font-semibold"
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Save className="w-3.5 h-3.5 shrink-0" />
                                        <span>Save Draft</span>
                                    </span>
                                </Button>

                                {currentStep < TOTAL_STEPS - 1 ? (
                                    <Button
                                        type="primary"
                                        onClick={handleNext}
                                        disabled={!isNextEnabled}
                                        className="h-9 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs border-0"
                                    >
                                        <span className="flex items-center justify-center gap-1.5">
                                            {currentStep === 0 && <span>Next</span>}
                                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                        </span>
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        onClick={handleSubmitClick}
                                        loading={saving || fetchingManager}
                                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs border-0"
                                    >
                                        <span className="flex items-center justify-center gap-1.5">
                                            <Send className="w-3.5 h-3.5 shrink-0" />
                                            <span>Submit</span>
                                        </span>
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
                    // cancelText="Review Again"
                    confirmLoading={saving}
                    okButtonProps={{
                        className: "bg-emerald-500 hover:bg-emerald-600 font-semibold rounded-xl h-9 px-4 text-xs",
                    }}
                    cancelButtonProps={{
                        style: { display: "none" },
                    }}
                >
                    <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                        Are you sure you want to submit your quarterly performance review for <strong>{quarter}</strong>?
                    </p>

                    {managerName && (
                        <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Assigned Manager: <strong>{managerName}</strong></span>
                        </div>
                    )}

                    <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
                        <strong>Note:</strong> Once submitted, your review cannot be edited and will be sent to your manager for evaluation.
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