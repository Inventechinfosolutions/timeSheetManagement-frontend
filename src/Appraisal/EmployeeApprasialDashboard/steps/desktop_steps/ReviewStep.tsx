import React, { useEffect, useMemo, useState } from 'react';
import { Card, Divider, Rate } from 'antd';
import { User, Star } from 'lucide-react';
import { MobileReviewStep } from '../mobile_steps/Review/MobileReviewStep';

interface ReviewItem {
    title?: string;
    details?: string;
}

interface ProjectItem {
    projectTitle?: string;
    achievement?: string;
    challenge?: string;
    title?: string;
    details?: string;
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

interface ReviewStepProps {
    values: {
        overview?: string;
        projects?: ProjectItem[] | string;
        achievements?: string | ReviewItem[];
        challenges?: string | ReviewItem[];
        learningGoals?: string | ReviewItem[];
        teamContribution?: TeamContributionItem[] | string;
        averageRating?: number | null;
        companyEnvironment?: CompanyEnvironment | string;
    };
    quarter: string;
    managerName?: string | null;
}

interface SummaryCardProps {
    title: string;
    value?: string | ReviewItem[];
    color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, color }) => {
    const renderContent = () => {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="italic text-slate-400">No response provided.</span>;
            }
            return (
                <div className="flex flex-col gap-3">
                    {value.map((item, idx) => (
                        <div
                            key={idx}
                            className="rounded-lg border border-slate-200 p-4 bg-slate-50"
                        >
                            <div className="font-semibold text-indigo-700 mb-2">
                                Goal {(idx + 1).toString().padStart(2, "0")}
                            </div>
                            <div className="hide-scrollbar text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                                {item.details}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return (
                        <div className="flex flex-col gap-3">
                            {parsed.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="rounded-lg border border-slate-200 p-4 bg-slate-50"
                                >
                                    <div className="font-semibold text-indigo-700 mb-2">
                                        Goal {(idx + 1).toString().padStart(2, "0")}
                                    </div>
                                    <div className="text-slate-600 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                                        {item.details}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }
            } catch {
                // Not a JSON string
            }
            return value.trim() ? (
                <div className="hide-scrollbar h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                    {value}
                </div>
            ) : (
                <span className="italic text-slate-400">No response provided.</span>
            );
        }
        return <span className="italic text-slate-400">No response provided.</span>;
    };

    return (
        <div className={`rounded-2xl border p-4 bg-white mb-4 ${color}`}>
            <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-slate-800 text-sm">{title}</span>
            </div>
            <div className="text-slate-600 text-sm leading-relaxed">
                {renderContent()}
            </div>
        </div>
    );
};

const ProjectSummaryCard: React.FC<{
    title: string;
    projects?: any;
    achievements?: any;
    challenges?: any;
    color: string;
}> = ({ title, projects, achievements, challenges, color }) => {
    const getProjectsList = (): ProjectItem[] => {
        let items: any[] = [];
        if (Array.isArray(projects)) items = projects;
        else if (typeof projects === 'string') {
            try { items = JSON.parse(projects); } catch { }
        }
        if (items.length > 0) return items;

        let achs: any[] = Array.isArray(achievements) ? achievements : [];
        let chs: any[] = Array.isArray(challenges) ? challenges : [];
        if (typeof achievements === 'string') { try { achs = JSON.parse(achievements); } catch { } }
        if (typeof challenges === 'string') { try { chs = JSON.parse(challenges); } catch { } }

        return achs.map(ach => ({
            projectTitle: ach.title || ach.projectTitle || '',
            achievement: ach.details || ach.achievement || '',
            challenge: chs.find(c => (c.title || c.projectTitle) === (ach.title || ach.projectTitle))?.details || '',
        }));
    };

    const projectList = getProjectsList();

    return (
        <div className={`rounded-2xl border p-4 bg-white mb-4 ${color}`}>
            <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-slate-800 text-sm">{title}</span>
            </div>
            {projectList.length === 0 ? (
                <span className="italic text-slate-400 text-sm">No response provided.</span>
            ) : (
                <div className="flex flex-col gap-4">
                    {projectList.map((item: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/60">
                            <div className="font-bold text-indigo-700 text-sm mb-3">
                                Project {(idx + 1).toString().padStart(2, '0')}: {item.projectTitle || item.title || 'Untitled'}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                                <div>
                                    <span className="font-semibold text-slate-700 block mb-1">Achievement:</span>
                                    <div className="hide-scrollbar text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                                        {item.achievement || item.details || '—'}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 block mb-1">Challenge:</span>
                                    <div className="hide-scrollbar text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                                        {item.challenge || '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TeamContributionSummaryCard: React.FC<{
    title: string;
    teamContribution?: any;
    averageRating?: number | null;
    color: string;
}> = ({ title, teamContribution, averageRating, color }) => {
    const list: TeamContributionItem[] = useMemo(() => {
        if (Array.isArray(teamContribution)) return teamContribution;
        if (typeof teamContribution === 'string') {
            try { return JSON.parse(teamContribution); } catch { }
        }
        return [];
    }, [teamContribution]);

    const avg = useMemo(() => {
        if (averageRating !== null && averageRating !== undefined) return Number(averageRating);
        if (list.length === 0) return 0;
        const valid = list.map(i => Number(i.rating) || 0).filter(r => r > 0);
        if (valid.length === 0) return 0;
        return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
    }, [averageRating, list]);

    return (
        <div className={`rounded-2xl border p-4 bg-white mb-4 ${color}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-800 text-sm">{title}</span>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1 text-xs font-bold text-amber-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Average: {avg > 0 ? avg.toFixed(1) : '0.0'} / 5.0</span>
                </div>
            </div>
            {list.length === 0 ? (
                <span className="italic text-slate-400 text-sm">No response provided.</span>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {list.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/60">
                            <span className="font-semibold text-slate-700 text-xs">{item.category}</span>
                            <Rate disabled value={item.rating} className="text-amber-400 text-sm" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CompanyEnvironmentSummaryCard: React.FC<{
    title: string;
    companyEnvironment?: any;
    color: string;
}> = ({ title, companyEnvironment, color }) => {
    const env: CompanyEnvironment = useMemo(() => {
        if (!companyEnvironment) return {};
        if (typeof companyEnvironment === 'object') return companyEnvironment;
        if (typeof companyEnvironment === 'string') {
            try { return JSON.parse(companyEnvironment); } catch { }
        }
        return {};
    }, [companyEnvironment]);

    return (
        <div className={`rounded-2xl border p-4 bg-white mb-4 ${color}`}>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-800 text-sm">{title}</span>
                {env.rating && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1">
                        Rating: {env.rating}/5
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
                <div>
                    <span className="font-semibold text-slate-700 block mb-1">Feedback on Work Culture:</span>
                    <div className="hide-scrollbar bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                        {env.workCultureFeedback || (
                            <span className="italic text-slate-400">No response provided.</span>
                        )}
                    </div>
                </div>
                <div>
                    <span className="font-semibold text-slate-700 block mb-1">Work-Life Balance:</span>
                    <div className="hide-scrollbar bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                        {env.workLifeBalance || (
                            <span className="italic text-slate-400">No response provided.</span>
                        )}
                    </div>
                </div>
                <div>
                    <span className="font-semibold text-slate-700 block mb-1">Suggestions for Improvement:</span>
                    <div className="hide-scrollbar bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                        {env.suggestions || (
                            <span className="italic text-slate-400">No response provided.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

export const ReviewStep: React.FC<ReviewStepProps> = ({ values, quarter, managerName }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
        const updateMatch = () => setIsMobile(mql.matches);

        updateMatch();
        mql.addEventListener('change', updateMatch);

        return () => mql.removeEventListener('change', updateMatch);
    }, []);

    if (isMobile) {
        return <MobileReviewStep values={values} quarter={quarter} managerName={managerName} />;
    }

    return (
        <>
            <style>{`
    .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .hide-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    .hide-scrollbar::-webkit-scrollbar-thumb {
        background: transparent;
        border-radius: 10px;
    }

    .hide-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }

    .hide-scrollbar:hover {
        scrollbar-width: thin;
    }

    .hide-scrollbar:hover::-webkit-scrollbar-thumb {
        background: #cbd5e1;
    }
`}</style>
            <Card
                className="shadow-md border border-slate-100 rounded-2xl bg-white/80 backdrop-blur-sm"
                title={
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                        <span>6. Review & Confirm</span>
                    </div>
                }
            >
                <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col gap-2">
                    <p className="text-indigo-700 text-sm font-medium mb-0">
                        You're reviewing your quarterly submission for <strong>{quarter}</strong>.
                        Please check all entries carefully before saving or submitting.
                    </p>
                    {managerName && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-100/50 rounded-lg px-2.5 py-1.5 mt-1 border border-indigo-100/80 w-fit">
                            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Assigned Manager: <strong className="text-indigo-900">{managerName}</strong></span>
                        </div>
                    )}
                </div>
                <SummaryCard
                    title="1. Quarter Overview"
                    value={values.overview}
                    color="border-emerald-100"
                />
                <ProjectSummaryCard
                    title="2. Achievements & Challenges"
                    projects={values.projects}
                    achievements={values.achievements}
                    challenges={values.challenges}
                    color="border-emerald-100"
                />
                <SummaryCard
                    title="3. Learning & Future Goals"
                    value={values.learningGoals}
                    color="border-emerald-100"
                />
                <TeamContributionSummaryCard
                    title="4. Team Contribution"
                    teamContribution={values.teamContribution}
                    averageRating={values.averageRating}
                    color="border-emerald-100"
                />
                <CompanyEnvironmentSummaryCard
                    title="5. Company Environment"
                    companyEnvironment={values.companyEnvironment}
                    color="border-emerald-100"
                />
                <Divider className="my-4" />
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
                    <strong className="text-slate-600">Note:</strong> Drafts stay editable until quarter end. Submitted reviews become read-only.
                </div>
            </Card>
        </>
    );
};