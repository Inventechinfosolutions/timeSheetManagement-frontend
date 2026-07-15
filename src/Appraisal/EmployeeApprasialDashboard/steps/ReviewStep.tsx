import React from 'react';
import { Card, Divider } from 'antd';
import { FileText, Award, AlertCircle, Compass, CheckCircle, User } from 'lucide-react';
interface ReviewItem {
    title: string;
    details: string;
}
interface ReviewStepProps {
    values: {
        overview?: string;
        achievements?: string | ReviewItem[];
        challenges?: string | ReviewItem[];
        learningGoals?: string | ReviewItem[];
    };
    quarter: string;
    managerName?: string | null;
}
interface SummaryCardProps {
    icon: React.ReactNode;
    title: string;
    value?: string | ReviewItem[];
    color: string;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ icon, title, value, color }) => {
    const renderContent = () => {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="italic text-slate-400">No response provided.</span>;
            }
            return (
                <div className="flex flex-col gap-3">
                    {value.map((item, idx) => (
                        <div key={idx} className="border-l-2 border-slate-200 pl-3 py-0.5">
                            <div className="font-semibold text-slate-750 text-sm">{item.title}</div>
                            <div className="text-slate-600 text-sm whitespace-pre-wrap mt-1 leading-relaxed">
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
                                <div key={idx} className="border-l-2 border-slate-200 pl-3 py-0.5">
                                    <div className="font-semibold text-slate-750 text-sm">{item.title}</div>
                                    <div className="text-slate-600 text-sm whitespace-pre-wrap mt-1 leading-relaxed">
                                        {item.details}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }
            } catch (e) {
                // Not a JSON string
            }
            return value.trim() ? (
                <p className="whitespace-pre-wrap mb-0">{value}</p>
            ) : (
                <span className="italic text-slate-400">No response provided.</span>
            );
        }
        return <span className="italic text-slate-400">No response provided.</span>;
    };
    return (
        <div className={`rounded-2xl border p-4 bg-white mb-4 ${color}`}>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="font-semibold text-slate-800 text-sm">{title}</span>
            </div>
            <div className="text-slate-600 text-sm leading-relaxed">
                {renderContent()}
            </div>
        </div>
    );
};
export const ReviewStep: React.FC<ReviewStepProps> = ({ values, quarter, managerName }) => {
    return (
        <Card
            className="shadow-md border border-slate-100 rounded-2xl bg-white/80 backdrop-blur-sm"
            title={
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span>5. Review & Confirm</span>
                </div>
            }
        >
            <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col gap-2">
                <p className="text-indigo-700 text-sm font-medium mb-0">
                    📋 You're reviewing your quarterly submission for <strong>{quarter}</strong>.
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
                icon={<FileText className="w-4 h-4 text-indigo-500" />}
                title="1. Quarter Overview"
                value={values.overview}
                color="border-indigo-100"
            />
            <SummaryCard
                icon={<Award className="w-4 h-4 text-emerald-500" />}
                title="2. Key Achievements"
                value={values.achievements}
                color="border-emerald-100"
            />
            <SummaryCard
                icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
                title="3. Challenges Faced & Blockers"
                value={values.challenges}
                color="border-amber-100"
            />
            <SummaryCard
                icon={<Compass className="w-4 h-4 text-indigo-500" />}
                title="4. Learning & Future Goals"
                value={values.learningGoals}
                color="border-indigo-100"
            />
            <Divider className="my-4" />
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
                <strong>Note:</strong> Saving as draft keeps the review editable until the quarter ends.
                Once submitted, the review is locked and sent to your manager for evaluation.
            </div>
        </Card>
    );
};
