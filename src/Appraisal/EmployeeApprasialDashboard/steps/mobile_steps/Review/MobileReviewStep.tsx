import React, { useMemo } from 'react';
import { Card, Divider, Rate } from 'antd';
import { User, Star } from 'lucide-react';
import './MobileReviewStep.css';

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
}

const MobileSummaryCard: React.FC<SummaryCardProps> = ({ title, value }) => {
    const renderContent = () => {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="mobile-review-empty">No response provided.</span>;
            }
            return (
                <div className="mobile-review-goal-list">
                    {value.map((item, idx) => (
                        <div key={idx} className="mobile-review-goal-item">
                            <div className="mobile-review-goal-item__title">
                                Goal {(idx + 1).toString().padStart(2, "0")}
                            </div>
                            <p className="mobile-review-goal-item__text">{item.details}</p>
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
                        <div className="mobile-review-goal-list">
                            {parsed.map((item: any, idx: number) => (
                                <div key={idx} className="mobile-review-goal-item">
                                    <div className="mobile-review-goal-item__title">
                                        Goal {(idx + 1).toString().padStart(2, "0")}
                                    </div>
                                    <p className="mobile-review-goal-item__text">
                                        {item.details || item.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    );
                }
            } catch {
                // Not a JSON string
            }
            return value.trim() ? (
                <p className="mobile-review-plain-text">{value}</p>
            ) : (
                <span className="mobile-review-empty">No response provided.</span>
            );
        }
        return <span className="mobile-review-empty">No response provided.</span>;
    };

    return (
        <div className="mobile-review-card">
            <div className="mobile-review-card__header">
                <span className="mobile-review-card__title">{title}</span>
            </div>
            <div className="mobile-review-card__body">
                {renderContent()}
            </div>
        </div>
    );
};

const MobileProjectSummaryCard: React.FC<{
    title: string;
    projects?: any;
    achievements?: any;
    challenges?: any;
}> = ({ title, projects, achievements, challenges }) => {
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
        <div className="mobile-review-card">
            <div className="mobile-review-card__header">
                <span className="mobile-review-card__title">{title}</span>
            </div>
            {projectList.length === 0 ? (
                <span className="mobile-review-empty">No response provided.</span>
            ) : (
                <div className="mobile-review-project-list">
                    {projectList.map((item: any, idx: number) => (
                        <div key={idx} className="mobile-review-project-item">
                            <div className="mobile-review-project-item__title">
                                Project {(idx + 1).toString().padStart(2, '0')}: {item.projectTitle || item.title || 'Untitled'}
                            </div>
                            <div className="mobile-review-project-item__fields">
                                <div>
                                    <span className="mobile-review-project-item__label">Achievement:</span>
                                    <p className="mobile-review-project-item__text">{item.achievement || item.details || '—'}</p>
                                </div>
                                <div>
                                    <span className="mobile-review-project-item__label">Challenge:</span>
                                    <p className="mobile-review-project-item__text">{item.challenge || '—'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MobileTeamContributionSummaryCard: React.FC<{
    title: string;
    teamContribution?: any;
    averageRating?: number | null;
}> = ({ title, teamContribution, averageRating }) => {
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
        <div className="mobile-review-card">
            <div className="mobile-review-card__header mobile-review-card__header--split">
                <span className="mobile-review-card__title">{title}</span>
                <div className="mobile-review-avg-badge">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Average: {avg > 0 ? avg.toFixed(1) : '0.0'} / 5.0</span>
                </div>
            </div>
            {list.length === 0 ? (
                <span className="mobile-review-empty">No response provided.</span>
            ) : (
                <div className="mobile-review-tc-list">
                    {list.map((item, idx) => (
                        <div key={idx} className="mobile-review-tc-item">
                            <span className="mobile-review-tc-item__label">{item.category}</span>
                            <Rate disabled value={item.rating} className="mobile-review-tc-item__rate" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MobileCompanyEnvironmentSummaryCard: React.FC<{
    title: string;
    companyEnvironment?: any;
}> = ({ title, companyEnvironment }) => {
    const env: CompanyEnvironment = useMemo(() => {
        if (!companyEnvironment) return {};
        if (typeof companyEnvironment === 'object') return companyEnvironment;
        if (typeof companyEnvironment === 'string') {
            try { return JSON.parse(companyEnvironment); } catch { }
        }
        return {};
    }, [companyEnvironment]);

    return (
        <div className="mobile-review-card">
            <div className="mobile-review-card__header mobile-review-card__header--split mobile-review-card__header--bordered">
                <span className="mobile-review-card__title">{title}</span>
                {env.rating && (
                    <div className="mobile-review-rating-badge">
                        Rating: {env.rating}/5
                    </div>
                )}
            </div>

            <div className="mobile-review-env-fields">
                <div>
                    <span className="mobile-review-env-fields__label">Feedback on Work Culture:</span>
                    <p className="mobile-review-env-fields__text">
                        {env.workCultureFeedback || <span className="mobile-review-empty">No response provided.</span>}
                    </p>
                </div>
                <div>
                    <span className="mobile-review-env-fields__label">Work-Life Balance:</span>
                    <p className="mobile-review-env-fields__text">
                        {env.workLifeBalance || <span className="mobile-review-empty">No response provided.</span>}
                    </p>
                </div>
                <div>
                    <span className="mobile-review-env-fields__label">Suggestions for Improvement:</span>
                    <p className="mobile-review-env-fields__text">
                        {env.suggestions || <span className="mobile-review-empty">No response provided.</span>}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const MobileReviewStep: React.FC<ReviewStepProps> = ({ values, quarter, managerName }) => {
    return (
        <Card
            className="mobile-review-outer-card"
            title={
                <div className="mobile-review-outer-card__title">
                    <span>6. Review & Confirm</span>
                </div>
            }
        >
               <div className="mobile-info-width">
            <div className="mobile-review-intro">
                <p className="mobile-review-intro__text">
                    You're reviewing your quarterly submission for <strong>{quarter}</strong>.
                    Please check all entries carefully before saving or submitting.
                </p>
                {managerName && (
                    <div className="mobile-review-manager-badge">
                        <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Assigned Manager: <strong>{managerName}</strong></span>
                    </div>
                )}
            </div>
            <MobileSummaryCard
                title="1. Quarter Overview"
                value={values.overview}
            />
            <MobileProjectSummaryCard
                title="2. Achievements & Challenges"
                projects={values.projects}
                achievements={values.achievements}
                challenges={values.challenges}
            />
            <MobileSummaryCard
                title="3. Learning & Future Goals"
                value={values.learningGoals}
            />
            <MobileTeamContributionSummaryCard
                title="4. Team Contribution"
                teamContribution={values.teamContribution}
                averageRating={values.averageRating}
            />
            <MobileCompanyEnvironmentSummaryCard
                title="5. Company Environment"
                companyEnvironment={values.companyEnvironment}
            />
            <Divider className="mobile-review-divider" />
            <div className="mobile-review-note">
                <strong>Note:</strong> Drafts stay editable until quarter end. Submitted reviews become read-only.
            </div>
            </div>
        </Card>
    );
};