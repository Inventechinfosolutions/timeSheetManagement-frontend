import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Divider, Rate, Modal, Spin } from 'antd';
import { User, Star, Paperclip, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../store';
import {
    previewQuarterlyReviewFile,
} from '../../../../reducers/quarterlyReview.reducer';
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

/* -------------------------------------------------------
   Attachment File Item (with preview)
------------------------------------------------------- */

interface AttachmentFile {
    key: string;
    name: string;
    entityId?: number;
    refId?: number;
    refType?: string;
    entityType?: string;
}

const getMimeTypeByFileName = (fileName: string): string => {
    const name = (fileName || '').toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    if (name.endsWith('.webp')) return 'image/webp';
    if (name.endsWith('.gif')) return 'image/gif';
    return 'application/octet-stream';
};

const isImageFile = (name: string) =>
    /\.(png|jpg|jpeg|webp|gif)$/i.test(name);

const isPdfFile = (name: string) => /\.pdf$/i.test(name);

/* File type icon + color */
const FileTypeIcon: React.FC<{ name: string }> = ({ name }) => {
    const n = (name || '').toLowerCase();
    if (isPdfFile(n)) {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#FEE2E2" />
                <path d="M7 7h6l4 4v8a1 1 0 01-1 1H7a1 1 0 01-1-1V8a1 1 0 011-1z" fill="#EF4444" opacity=".8" />
                <path d="M13 7l4 4h-4V7z" fill="#DC2626" />
                <text x="5" y="19" fontSize="5" fontWeight="bold" fill="#fff" fontFamily="sans-serif">PDF</text>
            </svg>
        );
    }
    if (isImageFile(n)) {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#DBEAFE" />
                <rect x="5" y="6" width="14" height="12" rx="1.5" fill="#3B82F6" opacity=".7" />
                <circle cx="9" cy="10" r="1.5" fill="#fff" />
                <path d="M5 16l4-4 3 3 2-2 3 3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
        );
    }
    /* Word / Excel / txt */
    const isExcel = /\.(xlsx|xls|csv)$/i.test(n);
    if (isExcel) {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#D1FAE5" />
                <path d="M7 7h6l4 4v8a1 1 0 01-1 1H7a1 1 0 01-1-1V8a1 1 0 011-1z" fill="#10B981" opacity=".8" />
                <path d="M13 7l4 4h-4V7z" fill="#059669" />
                <text x="5.5" y="18.5" fontSize="4.5" fontWeight="bold" fill="#fff" fontFamily="sans-serif">XLS</text>
            </svg>
        );
    }
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#E0E7FF" />
            <path d="M7 7h6l4 4v8a1 1 0 01-1 1H7a1 1 0 01-1-1V8a1 1 0 011-1z" fill="#6366F1" opacity=".8" />
            <path d="M13 7l4 4h-4V7z" fill="#4F46E5" />
            <text x="5.5" y="18.5" fontSize="4.5" fontWeight="bold" fill="#fff" fontFamily="sans-serif">DOC</text>
        </svg>
    );
};

const getDesktopFileExt = (fileName: string): string => {
    const name = (fileName || '').toLowerCase();
    if (name.endsWith('.pdf') || name.includes('.pdf')) return 'PDF';
    const parts = fileName.split('.');
    if (parts.length > 1) {
        const ext = parts.pop()?.toUpperCase();
        if (ext && ext.length <= 5) return ext;
    }
    return 'FILE';
};

const ReviewAttachmentChip: React.FC<{ file: AttachmentFile }> = ({ file }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewDocUrl, setPreviewDocUrl] = useState('');
    const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'doc'>('image');

    const handlePreview = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading) return;
        const isServer = Boolean(
            file.entityId && Number(file.entityId) > 0 && file.key
        );
        if (!isServer) return;

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
            const url = window.URL.createObjectURL(blob);

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
    }, [dispatch, file, loading]);

    const isServer = Boolean(file.entityId && Number(file.entityId) > 0 && file.key);

    return (
        <>
            {/* File card — matches Achievement page StyledFileCard */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '5px 12px',
                    flex: '0 0 250px',
                    width: '250px',
                    minWidth: '250px',
                    maxWidth: '250px',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    height: '44px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
                title={file.name}
            >
                {/* Left: icon-box + text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    {/* Icon box */}
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <FileTypeIcon name={file.name} />
                    </div>

                    {/* Text */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {file.name}
                        </div>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 400,
                            color: '#64748b',
                            marginTop: '1px',
                            whiteSpace: 'nowrap',
                        }}>
                            {getDesktopFileExt(file.name)}
                        </div>
                    </div>
                </div>

                {/* Right: eye button */}
                {isServer && (
                    <button
                        onClick={handlePreview}
                        title="Preview file"
                        style={{
                            flexShrink: 0,
                            background: 'none',
                            border: 'none',
                            padding: '0',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            color: '#3b82f6',
                            transition: 'background 0.2s ease',
                            marginLeft: 'auto',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                        {loading
                            ? <Spin size="small" />
                            : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
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
                width={800}
                title={file.name}
                closeIcon={<X className="w-4 h-4" />}
            >
                <img
                    src={previewImage}
                    alt={file.name}
                    style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
            </Modal>

            {/* Doc preview modal */}
            <Modal
                open={previewOpen && previewType === 'doc'}
                footer={null}
                onCancel={() => { setPreviewOpen(false); setPreviewDocUrl(''); }}
                centered
                width={900}
                title={file.name}
                closeIcon={<X className="w-4 h-4" />}
                styles={{ body: { padding: 0, height: '75vh' } }}
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
   Summary Card
------------------------------------------------------- */

const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    color,
}) => {
    const renderContent = () => {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return (
                    <span className="italic text-slate-400">
                        No response provided.
                    </span>
                );
            }

            return (
                <div className="flex flex-col gap-3">
                    {value.map((item, idx) => (
                        <div
                            key={idx}
                            className="rounded-lg border border-slate-200 p-4 bg-white"
                        >
                            <div className="font-semibold text-indigo-700 mb-2">
                                Goal {(idx + 1).toString().padStart(2, '0')}
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
                                    className="rounded-lg border border-slate-200 p-4 bg-white"
                                >
                                    <div className="font-semibold text-indigo-700 mb-2">
                                        Goal {(idx + 1)
                                            .toString()
                                            .padStart(2, '0')}
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
                <div className="hide-scrollbar bg-white text-slate-600 p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                    {value}
                </div>
            ) : (
                <span className="italic text-slate-400">
                    No response provided.
                </span>
            );
        }

        return (
            <span className="italic text-slate-400">
                No response provided.
            </span>
        );
    };

    return (
        <div
            className={`rounded-2xl border p-4 mb-4 bg-slate-50/60 ${color}`}
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-slate-800 text-sm">
                    {title}
                </span>
            </div>

            <div className="text-slate-600 text-sm leading-relaxed">
                {renderContent()}
            </div>
        </div>
    );
};

/* -------------------------------------------------------
   Project Summary Card
------------------------------------------------------- */

const ProjectSummaryCard: React.FC<{
    title: string;
    projects?: any;
    achievements?: any;
    challenges?: any;
    color: string;
}> = ({
    title,
    projects,
    achievements,
    challenges,
    color,
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
            <div
                className={`rounded-2xl border p-4 bg-slate-50/60 mb-4 ${color}`}
            >
                <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-slate-800 text-sm">
                        {title}
                    </span>
                </div>

                {projectList.length === 0 ? (
                    <span className="italic text-slate-400 text-sm">
                        No response provided.
                    </span>
                ) : (
                    <div className="flex flex-col gap-4">
                        {projectList.map((item: any, idx: number) => (
                            <div
                                key={idx}
                                className="rounded-xl border border-slate-200/80 p-4 bg-white"
                            >
                                <div className="font-bold text-indigo-700 text-sm mb-3">
                                    Project{' '}
                                    {(idx + 1)
                                        .toString()
                                        .padStart(2, '0')}
                                    :{' '}
                                    {item.projectTitle ||
                                        item.title ||
                                        'Untitled'}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                                    <div>
                                        <span className="font-semibold text-slate-700 block mb-1">
                                            Achievement:
                                        </span>

                                        <div className="hide-scrollbar text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                                            {item.achievement ||
                                                item.details ||
                                                '—'}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="font-semibold text-slate-700 block mb-1">
                                            Challenge:
                                        </span>

                                        <div className="hide-scrollbar text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                                            {item.challenge || '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments */}
                                {Array.isArray(item.attachment) && item.attachment.length > 0 && (
                                    <div className="mt-3">
                                        <span className="font-semibold text-slate-700 text-xs block mb-2">
                                            Attachments:
                                        </span>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            flexWrap: 'nowrap',
                                            alignItems: 'center',
                                            gap: '8px',
                                            width: '100%',
                                            overflowX: 'auto',
                                            paddingBottom: '2px',
                                            boxSizing: 'border-box',
                                            scrollbarWidth: 'none',
                                        }}>
                                            {item.attachment.map((file: any, fileIdx: number) => (
                                                <ReviewAttachmentChip
                                                    key={fileIdx}
                                                    file={file}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

/* -------------------------------------------------------
   Team Contribution Summary Card
------------------------------------------------------- */

const TeamContributionSummaryCard: React.FC<{
    title: string;
    teamContribution?: any;
    averageRating?: number | null;
    color: string;
}> = ({
    title,
    teamContribution,
    averageRating,
    color,
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
            <div
                className={`rounded-2xl border p-4 bg-slate-50/60 mb-4 ${color}`}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-800 text-sm">
                        {title}
                    </span>

                    <div className="rounded-md tcs-badge-pop flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 shrink-0 self-start sm:self-center transition-colors duration-300">
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
                    <span className="italic text-slate-400 text-sm">
                        No response provided.
                    </span>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {list.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white"
                            >
                                <span className="font-semibold text-slate-700 text-xs">
                                    {item.category}
                                </span>

                                <Rate
                                    disabled
                                    value={item.rating}
                                    className="text-amber-400 text-sm"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

/* -------------------------------------------------------
   Company Environment Summary Card
------------------------------------------------------- */

const CompanyEnvironmentSummaryCard: React.FC<{
    title: string;
    companyEnvironment?: any;
    color: string;
}> = ({
    title,
    companyEnvironment,
    color,
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
         * The backend stores the selected value as 1-5.
         */
        const selectedEmoji = COMPANY_ENVIRONMENT_EMOJIS.find(
            (item) => item.value === Number(env.rating)
        );

        return (
            <div
                className={`rounded-2xl border p-4 bg-slate-50/60 mb-4 ${color}`}
            >
                {/* Header */}
                <div className="flex items-center mb-3 border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-800 text-sm">
                        {title}
                    </span>
                </div>

                <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">

                    {/* Work Culture */}
                    <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                            Feedback on Work Culture:
                        </span>

                        <div className="hide-scrollbar bg-white p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                            {env.workCultureFeedback || (
                                <span className="italic text-slate-400">
                                    No response provided.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Work-Life Balance */}
                    <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                            Work-Life Balance:
                        </span>

                        <div className="hide-scrollbar bg-white p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                            {env.workLifeBalance || (
                                <span className="italic text-slate-400">
                                    No response provided.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                            Suggestions for Improvement:
                        </span>

                        <div className="hide-scrollbar bg-white p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2">
                            {env.suggestions || (
                                <span className="italic text-slate-400">
                                    No response provided.
                                </span>
                            )}
                        </div>

                        {/* Rate the Company Environment - 5 emoji row with selected highlighted */}
                        {env.rating && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                                    Rate the Company Environment:
                                </span>

                                <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
                                    {COMPANY_ENVIRONMENT_EMOJIS.map((emoji) => {
                                        const isSelected = Number(env.rating) === emoji.value;

                                        return (
                                            <div
                                                key={emoji.value}
                                                className={`
                                                    flex flex-col items-center justify-center
                                                    flex-1 h-16 rounded-md border
                                                    transition-all duration-200
                                                    ${isSelected
                                                        ? `${emoji.selectedBg} border-transparent shadow-md scale-105 opacity-100 ring-2 ${emoji.ring} ring-offset-1 z-10 font-bold`
                                                        : `${emoji.bg} ${emoji.border} opacity-40`
                                                    }
                                                `}
                                                style={{
                                                    borderRadius: '6px',
                                                }}
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
                                                        ${isSelected
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
   Mobile Breakpoint
------------------------------------------------------- */

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

/* -------------------------------------------------------
   Review Step
------------------------------------------------------- */

export const ReviewStep: React.FC<ReviewStepProps> = ({
    values,
    quarter,
    managerName,
}) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(
            MOBILE_BREAKPOINT_QUERY
        );

        const updateMatch = () =>
            setIsMobile(mql.matches);

        updateMatch();

        mql.addEventListener(
            'change',
            updateMatch
        );

        return () =>
            mql.removeEventListener(
                'change',
                updateMatch
            );
    }, []);

    /* ---------------------------------------------------
       Mobile
    --------------------------------------------------- */

    if (isMobile) {
        return (
            <MobileReviewStep
                values={values}
                quarter={quarter}
                managerName={managerName}
            />
        );
    }

    /* ---------------------------------------------------
       Desktop
    --------------------------------------------------- */

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
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
                        <span>6. Review & Confirm</span>
                    </div>
                }
            >
                {/* Review Information */}
                <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col gap-2">
                    <p className="text-indigo-700 text-sm font-medium mb-0">
                        You're reviewing your quarterly submission for{' '}
                        <strong>{quarter}</strong>.
                        Please check all entries carefully before
                        saving or submitting.
                    </p>

                    {managerName && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-100/50 rounded-lg px-2.5 py-1.5 mt-1 border border-indigo-100/80 w-fit">
                            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />

                            <span>
                                Assigned Manager:{' '}
                                <strong className="text-indigo-900">
                                    {managerName}
                                </strong>
                            </span>
                        </div>
                    )}
                </div>

                {/* 1. Overview */}
                <SummaryCard
                    title="1. Quarter Overview"
                    value={values.overview}
                    color="border-slate-100"
                />

                {/* 2. Achievements & Challenges */}
                <ProjectSummaryCard
                    title="2. Achievements & Challenges"
                    projects={values.projects}
                    achievements={values.achievements}
                    challenges={values.challenges}
                    color="border-slate-100"
                />

                {/* 3. Learning & Future Goals */}
                <SummaryCard
                    title="3. Learning & Future Goals"
                    value={values.learningGoals}
                    color="border-slate-100"
                />

                {/* 4. Team Contribution */}
                <TeamContributionSummaryCard
                    title="4. Team Contribution"
                    teamContribution={
                        values.teamContribution
                    }
                    averageRating={
                        values.averageRating
                    }
                    color="border-slate-100"
                />

                {/* 5. Company Environment */}
                <CompanyEnvironmentSummaryCard
                    title="5. Company Environment"
                    companyEnvironment={
                        values.companyEnvironment
                    }
                    color="border-slate-100"
                />

                <Divider className="my-4" />

                {/* Note */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
                    <strong className="text-slate-600">
                        Note:
                    </strong>{' '}
                    Drafts stay editable until quarter end.
                    Submitted reviews become read-only.
                </div>
            </Card>
        </>
    );
};