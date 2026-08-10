import { useEffect, useState, useCallback, useRef } from 'react';
import { Form, Button, message, Spin, Modal } from 'antd';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Send, ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, User, UserX } from 'lucide-react';

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

const MobileQuarterlyReviewForm = () => {
    const navigate = useNavigate();
    const { date: quarterParamSlug } = useParams<{ tab?: string; date?: string }>();
    const [searchParams] = useSearchParams();
    const rawQuarterParam = quarterParamSlug || searchParams.get('quarter') || '';
    const quarterParam = slugToQuarter(rawQuarterParam);

    const dispatch = useDispatch<AppDispatch>();
    const [form] = Form.useForm();
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const employeeId = currentUser?.loginId ?? '';

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
    const rootRef = useRef<HTMLDivElement>(null);

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
            if (result?.id) setReviewId(result.id);
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
            if (result?.id) setReviewId(result.id);
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
                        {managerName && (
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
                            className={`mobile-qr-footer-nav ${currentStep === 0 ? "mobile-qr-footer-nav-center" : ""
                                }`}
                        >
                            {currentStep > 0 && (
                                <Button
                                    icon={<ArrowLeft className="w-3.5 h-3.5" />}
                                    onClick={handleBack}
                                    className="h-9 px-3 rounded-xl text-xs whitespace-nowrap"
                                >

                                </Button>
                            )}

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleSaveDraft}
                                    loading={saving}
                                    icon={<Save className="w-3.5 h-3.5" />}
                                    className="h-9 px-3 rounded-xl border-blue-600 text-blue-600 hover:text-blue-700 text-xs font-semibold"
                                >
                                    Save Draft
                                </Button>

                                {currentStep < TOTAL_STEPS - 1 ? (
                                    <Button
                                        type="primary"
                                        onClick={handleNext}
                                        disabled={!isNextEnabled}
                                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 border-0"
                                    >
                                        {currentStep === 0 ? (
                                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                                Next
                                                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                                            </span>
                                        ) : (
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        onClick={handleSubmitClick}
                                        loading={saving || fetchingManager}
                                        icon={<Send className="w-3.5 h-3.5" />}
                                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs flex items-center gap-1.5 border-0"
                                    >
                                        Submit
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