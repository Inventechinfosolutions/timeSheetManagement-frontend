import React, { useCallback, useMemo, useState } from 'react';
import { Card, Divider, Rate, Modal, Spin } from 'antd';
import {
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { User, Star, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../../store';
import {
    previewQuarterlyReviewFile,
} from '../../../../../reducers/quarterlyReview.reducer';
import './MobileReviewStep.css';

const getMimeTypeByFileName = (fileName: string): string => {
    const name = (fileName || '').toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    if (name.endsWith('.webp')) return 'image/webp';
    if (name.endsWith('.gif')) return 'image/gif';
    return 'application/octet-stream';
};

const isImageFile = (name: string) => /\.(png|jpg|jpeg|webp|gif)$/i.test(name);
const isPdfFile  = (name: string) => /\.pdf$/i.test(name);

const getReviewFileIcon = (fileName: string) => {
    const name = (fileName || '').toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].some((ext) => name.endsWith(ext) || name.includes(ext))) {
        return <PictureOutlined style={{ color: '#2563eb', fontSize: 16 }} />;
    }
    if (name.endsWith('.pdf') || name.includes('.pdf')) {
        return <FilePdfOutlined style={{ color: '#dc2626', fontSize: 16 }} />;
    }
    if (name.endsWith('.doc') || name.endsWith('.docx')) {
        return <FileWordOutlined style={{ color: '#2563eb', fontSize: 16 }} />;
    }
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
        return <FileExcelOutlined style={{ color: '#16a34a', fontSize: 16 }} />;
    }
    return <FileTextOutlined style={{ color: '#050796', fontSize: 16 }} />;
};

const getReviewFileExt = (fileName: string): string => {
    const name = (fileName || '').toLowerCase();
    if (name.endsWith('.pdf') || name.includes('.pdf')) return 'PDF';
    const parts = fileName.split('.');
    if (parts.length > 1) {
        const ext = parts.pop()?.toUpperCase();
        if (ext && ext.length <= 5) return ext;
    }
    return 'FILE';
};

/* -------------------------------------------------------
   Mobile Attachment Card (with preview)
------------------------------------------------------- */

interface AttachmentFile {
    key?: string;
    name: string;
    entityId?: number;
    refId?: number;
    refType?: string;
    entityType?: string;
}

const MobileAttachmentCard: React.FC<{ file: AttachmentFile }> = ({ file }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading]         = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage]   = useState('');
    const [previewDocUrl, setPreviewDocUrl] = useState('');
    const [previewType, setPreviewType] = useState<'image' | 'doc'>('image');

    const isServer = Boolean(file.entityId && Number(file.entityId) > 0 && file.key);

    const handlePreview = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading || !isServer) return;
        setLoading(true);
        try {
            const response = await dispatch(
                previewQuarterlyReviewFile({
                    entityId: file.entityId,
                    refId: file.refId,
                    refType: file.refType,
                    entityType: file.entityType,
                    key: file.key,
                })
            ).unwrap();
            const mimeType = getMimeTypeByFileName(file.name);
            const blob = new Blob([response.data], { type: mimeType });
            const url  = window.URL.createObjectURL(blob);

            if (isPdfFile(file.name)) {
                window.open(url, '_blank');
            } else if (isImageFile(file.name)) {
                setPreviewImage(url);
                setPreviewType('image');
                setPreviewOpen(true);
            } else {
                setPreviewDocUrl(url);
                setPreviewType('doc');
                setPreviewOpen(true);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [dispatch, file, loading, isServer]);

    return (
        <>
            <div className="mobile-review-file-card" title={file.name}>
                {/* Left: icon-box + text */}
                <div className="mobile-review-file-card__left">
                    <div className="mobile-review-file-card__icon-box">
                        {getReviewFileIcon(file.name || '')}
                    </div>
                    <div className="mobile-review-file-card__text">
                        <div className="mobile-review-file-card__name">{file.name || 'File'}</div>
                        <div className="mobile-review-file-card__ext">{getReviewFileExt(file.name || '')}</div>
                    </div>
                </div>

                {/* Right: eye button */}
                {isServer && (
                    <button
                        className="mobile-review-file-card__eye-btn"
                        onClick={handlePreview}
                        title="Preview file"
                    >
                        {loading
                            ? <Spin size="small" />
                            : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            )
                        }
                    </button>
                )}
            </div>

            {/* Image preview modal */}
            <Modal
                open={previewOpen && previewType === 'image'}
                footer={null}
                onCancel={() => { setPreviewOpen(false); setPreviewImage(''); }}
                centered
                width="92vw"
                title={file.name}
                closeIcon={<X className="w-4 h-4" />}
            >
                <img
                    src={previewImage}
                    alt={file.name}
                    style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain' }}
                />
            </Modal>

            {/* Doc preview modal */}
            <Modal
                open={previewOpen && previewType === 'doc'}
                footer={null}
                onCancel={() => { setPreviewOpen(false); setPreviewDocUrl(''); }}
                centered
                width="92vw"
                title={file.name}
                closeIcon={<X className="w-4 h-4" />}
                styles={{ body: { padding: 0, height: '70vh' } }}
            >
                <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewDocUrl)}&embedded=true`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={file.name}
                />
            </Modal>
        </>
    );
};


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

/* -------------------------------------------------------
   Company Environment Emoji Rating
------------------------------------------------------- */

const COMPANY_ENVIRONMENT_EMOJIS = [
    {
        value: 1,
        label: 'Very Bad',
        icon: '😡',
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        selectedBg: 'bg-rose-500',
        ring: 'ring-rose-400',
    },
    {
        value: 2,
        label: 'Bad',
        icon: '🙁',
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        selectedBg: 'bg-orange-500',
        ring: 'ring-orange-400',
    },
    {
        value: 3,
        label: 'Neutral',
        icon: '😐',
        color: 'text-slate-500',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        selectedBg: 'bg-slate-500',
        ring: 'ring-slate-400',
    },
    {
        value: 4,
        label: 'Good',
        icon: '🙂',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        selectedBg: 'bg-emerald-500',
        ring: 'ring-emerald-400',
    },
    {
        value: 5,
        label: 'Excellent',
        icon: '🤩',
        color: 'text-violet-500',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        selectedBg: 'bg-violet-500',
        ring: 'ring-violet-400',
    },
];

/* -------------------------------------------------------
   Mobile Summary Card
------------------------------------------------------- */

const MobileSummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
}) => {
    const renderContent = () => {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return (
                    <span className="mobile-review-empty">
                        No response provided.
                    </span>
                );
            }

            return (
                <div className="mobile-review-goal-list">
                    {value.map((item, idx) => (
                        <div
                            key={idx}
                            className="mobile-review-goal-item"
                        >
                            <div className="mobile-review-goal-item__title">
                                Goal{' '}
                                {(idx + 1)
                                    .toString()
                                    .padStart(2, '0')}
                            </div>

                            <p className="mobile-review-goal-item__text">
                                {item.details}
                            </p>
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
                            {parsed.map(
                                (item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="mobile-review-goal-item"
                                    >
                                        <div className="mobile-review-goal-item__title">
                                            Goal{' '}
                                            {(idx + 1)
                                                .toString()
                                                .padStart(2, '0')}
                                        </div>

                                        <p className="mobile-review-goal-item__text">
                                            {item.details ||
                                                item.title}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    );
                }
            } catch {
                // Not a JSON string
            }

            return value.trim() ? (
                <p className="mobile-review-plain-text">
                    {value}
                </p>
            ) : (
                <span className="mobile-review-empty">
                    No response provided.
                </span>
            );
        }

        return (
            <span className="mobile-review-empty">
                No response provided.
            </span>
        );
    };

    return (
        <div className="mobile-review-card">
            <div className="mobile-review-card__header">
                <span className="mobile-review-card__title">
                    {title}
                </span>
            </div>

            <div className="mobile-review-card__body">
                {renderContent()}
            </div>
        </div>
    );
};

/* -------------------------------------------------------
   Mobile Project Summary Card
------------------------------------------------------- */

const MobileProjectSummaryCard: React.FC<{
    title: string;
    projects?: any;
    achievements?: any;
    challenges?: any;
}> = ({
    title,
    projects,
    achievements,
    challenges,
}) => {
        const getProjectsList = (): ProjectItem[] => {
            let items: any[] = [];

            if (Array.isArray(projects)) {
                items = projects;
            } else if (typeof projects === 'string') {
                try {
                    items = JSON.parse(projects);
                } catch {
                    // Invalid JSON
                }
            }

            if (items.length > 0) {
                return items;
            }

            let achs: any[] = Array.isArray(achievements)
                ? achievements
                : [];

            let chs: any[] = Array.isArray(challenges)
                ? challenges
                : [];

            if (typeof achievements === 'string') {
                try {
                    achs = JSON.parse(achievements);
                } catch {
                    // Invalid JSON
                }
            }

            if (typeof challenges === 'string') {
                try {
                    chs = JSON.parse(challenges);
                } catch {
                    // Invalid JSON
                }
            }

            return achs.map((ach) => ({
                projectTitle:
                    ach.title ||
                    ach.projectTitle ||
                    '',

                achievement:
                    ach.details ||
                    ach.achievement ||
                    '',

                challenge:
                    chs.find(
                        (c) =>
                            (c.title || c.projectTitle) ===
                            (ach.title || ach.projectTitle)
                    )?.details || '',
            }));
        };

        const projectList = getProjectsList();

        return (
            <div className="mobile-review-card">
                <div className="mobile-review-card__header">
                    <span className="mobile-review-card__title">
                        {title}
                    </span>
                </div>

                {projectList.length === 0 ? (
                    <span className="mobile-review-empty">
                        No response provided.
                    </span>
                ) : (
                    <div className="mobile-review-project-list">
                        {projectList.map(
                            (item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="mobile-review-project-item"
                                >
                                    <div className="mobile-review-project-item__title">
                                        Project{' '}
                                        {(idx + 1)
                                            .toString()
                                            .padStart(2, '0')}
                                        :{' '}
                                        {item.projectTitle ||
                                            item.title ||
                                            'Untitled'}
                                    </div>

                                    <div className="mobile-review-project-item__fields">
                                        <div>
                                            <span className="mobile-review-project-item__label">
                                                Achievement:
                                            </span>

                                            <p className="mobile-review-project-item__text">
                                                {item.achievement ||
                                                    item.details ||
                                                    '—'}
                                            </p>
                                        </div>

                                        <div>
                                            <span className="mobile-review-project-item__label">
                                                Challenge:
                                            </span>

                                            <p className="mobile-review-project-item__text">
                                                {item.challenge ||
                                                    '—'}
                                            </p>
                                        </div>

                                        {/* Attachments */}
                                        {Array.isArray(item.attachment) && item.attachment.length > 0 && (
                                            <div>
                                                <span className="mobile-review-project-item__label">
                                                    Attachments:
                                                </span>
                                                <div className="mobile-review-attachment-stack">
                                                    {item.attachment.map((file: any, fileIdx: number) => (
                                                        <MobileAttachmentCard
                                                            key={fileIdx}
                                                            file={file}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        );
    };

/* -------------------------------------------------------
   Mobile Team Contribution Summary Card
------------------------------------------------------- */

const MobileTeamContributionSummaryCard: React.FC<{
    title: string;
    teamContribution?: any;
    averageRating?: number | null;
}> = ({
    title,
    teamContribution,
    averageRating,
}) => {
        const list: TeamContributionItem[] = useMemo(() => {
            if (Array.isArray(teamContribution)) {
                return teamContribution;
            }

            if (typeof teamContribution === 'string') {
                try {
                    return JSON.parse(teamContribution);
                } catch {
                    // Invalid JSON
                }
            }

            return [];
        }, [teamContribution]);

        const avg = useMemo(() => {
            if (
                averageRating !== null &&
                averageRating !== undefined
            ) {
                return Number(averageRating);
            }

            if (list.length === 0) {
                return 0;
            }

            const valid = list
                .map((i) => Number(i.rating) || 0)
                .filter((r) => r > 0);

            if (valid.length === 0) {
                return 0;
            }

            return (
                Math.round(
                    (valid.reduce((a, b) => a + b, 0) /
                        valid.length) *
                    10
                ) / 10
            );
        }, [averageRating, list]);

        return (
            <div className="mobile-review-card">
                <div className="mobile-review-card__header mobile-review-card__header--split">
                    <span className="mobile-review-card__title">
                        {title}
                    </span>

                    <div className="mobile-review-avg-badge">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />

                        <span>
                            Average:{' '}
                            {avg > 0
                                ? avg.toFixed(1)
                                : '0.0'}{' '}
                            / 5.0
                        </span>
                    </div>
                </div>

                {list.length === 0 ? (
                    <span className="mobile-review-empty">
                        No response provided.
                    </span>
                ) : (
                    <div className="mobile-review-tc-list">
                        {list.map((item, idx) => (
                            <div
                                key={idx}
                                className="mobile-review-tc-item"
                            >
                                <span className="mobile-review-tc-item__label">
                                    {item.category}
                                </span>

                                <Rate
                                    disabled
                                    value={item.rating}
                                    className="mobile-review-tc-item__rate"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

/* -------------------------------------------------------
   Mobile Company Environment Summary Card
------------------------------------------------------- */

const MobileCompanyEnvironmentSummaryCard: React.FC<{
    title: string;
    companyEnvironment?: any;
}> = ({
    title,
    companyEnvironment,
}) => {
        const env: CompanyEnvironment = useMemo(() => {
            if (!companyEnvironment) {
                return {};
            }

            if (typeof companyEnvironment === 'object') {
                return companyEnvironment;
            }

            if (typeof companyEnvironment === 'string') {
                try {
                    return JSON.parse(companyEnvironment);
                } catch {
                    // Invalid JSON
                }
            }

            return {};
        }, [companyEnvironment]);

        /*
         * Find the emoji selected by the user.
         * The stored rating value is expected to be 1-5.
         */
        const selectedEmoji = COMPANY_ENVIRONMENT_EMOJIS.find(
            (item) => item.value === Number(env.rating)
        );

        return (
            <div className="mobile-review-card">
                {/* Header - Rating removed from here */}
                <div className="mobile-review-card__header mobile-review-card__header--bordered">
                    <span className="mobile-review-card__title">
                        {title}
                    </span>
                </div>

                <div className="mobile-review-env-fields">

                    {/* Work Culture */}
                    <div>
                        <span className="mobile-review-env-fields__label">
                            Feedback on Work Culture:
                        </span>

                        <p className="mobile-review-env-fields__text">
                            {env.workCultureFeedback || (
                                <span className="mobile-review-empty">
                                    No response provided.
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Work-Life Balance */}
                    <div>
                        <span className="mobile-review-env-fields__label">
                            Work-Life Balance:
                        </span>

                        <p className="mobile-review-env-fields__text">
                            {env.workLifeBalance || (
                                <span className="mobile-review-empty">
                                    No response provided.
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Suggestions */}
                    <div>
                        <span className="mobile-review-env-fields__label">
                            Suggestions for Improvement:
                        </span>

                        <p className="mobile-review-env-fields__text">
                            {env.suggestions || (
                                <span className="mobile-review-empty">
                                    No response provided.
                                </span>
                            )}
                        </p>

                        {/* Rate the Company Environment - 5 emoji row matching Step 5 */}
                        {env.rating && (
                            <div className="mobile-review-env-rating mt-3 pt-3 border-t border-slate-100">
                                <span className="mobile-review-env-rating__label">
                                    Rate the Company Environment:
                                </span>

                                <div className="mobile-review-emoji-row">
                                    {COMPANY_ENVIRONMENT_EMOJIS.map((emoji) => {
                                        const isSelected = Number(env.rating) === emoji.value;

                                        return (
                                            <div
                                                key={emoji.value}
                                                className={`mobile-review-emoji-card ${
                                                    isSelected
                                                        ? `${emoji.selectedBg} border-transparent shadow-md scale-105 opacity-100 ring-2 ${emoji.ring} ring-offset-1 z-10 font-bold`
                                                        : `${emoji.bg} ${emoji.border} opacity-40`
                                                }`}
                                            >
                                                <span
                                                    className={`
                                                        text-2xl leading-none transition-transform duration-200
                                                        ${isSelected ? 'scale-110 drop-shadow' : ''}
                                                    `}
                                                >
                                                    {emoji.icon}
                                                </span>

                                                <span
                                                    className={`
                                                        mt-1 text-[11px] font-bold whitespace-nowrap
                                                        ${
                                                            isSelected
                                                                ? 'text-white'
                                                                : emoji.color
                                                        }
                                                    `}
                                                >
                                                    {emoji.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

/* -------------------------------------------------------
   Mobile Review Step
------------------------------------------------------- */

export const MobileReviewStep: React.FC<ReviewStepProps> = ({
    values,
    quarter,
    managerName,
}) => {
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
                        You're reviewing your quarterly
                        submission for{' '}
                        <strong>{quarter}</strong>.
                        Please check all entries carefully
                        before saving or submitting.
                    </p>

                    {managerName && (
                        <div className="mobile-review-manager-badge">
                            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />

                            <span>
                                Assigned Manager:{' '}
                                <strong>
                                    {managerName}
                                </strong>
                            </span>
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
                    teamContribution={
                        values.teamContribution
                    }
                    averageRating={
                        values.averageRating
                    }
                />

                <MobileCompanyEnvironmentSummaryCard
                    title="5. Company Environment"
                    companyEnvironment={
                        values.companyEnvironment
                    }
                />

                <Divider className="mobile-review-divider" />

                <div className="mobile-review-note">
                    <strong>Note:</strong> Drafts stay editable
                    until quarter end. Submitted reviews become
                    read-only.
                </div>
            </div>
        </Card>
    );
};