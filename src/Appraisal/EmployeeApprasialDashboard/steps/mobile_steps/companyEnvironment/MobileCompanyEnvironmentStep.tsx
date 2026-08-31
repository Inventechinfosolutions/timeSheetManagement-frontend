import React from 'react';
import { Card, Form, Input } from 'antd';
import './MobileCompanyEnvironmentStep.css';

interface StepProps {
    disabled?: boolean;
}

const EMOJIS = [
    {
        value: 1,
        label: 'Very Bad',
        icon: '😡',
        idle: 'mobile-ces-emoji--idle-rose',
        selected: 'mobile-ces-emoji--selected-rose',
    },
    {
        value: 2,
        label: 'Bad',
        icon: '🙁',
        idle: 'mobile-ces-emoji--idle-orange',
        selected: 'mobile-ces-emoji--selected-orange',
    },
    {
        value: 3,
        label: 'Neutral',
        icon: '😐',
        idle: 'mobile-ces-emoji--idle-slate',
        selected: 'mobile-ces-emoji--selected-slate',
    },
    {
        value: 4,
        label: 'Good',
        icon: '🙂',
        idle: 'mobile-ces-emoji--idle-emerald',
        selected: 'mobile-ces-emoji--selected-emerald',
    },
    {
        value: 5,
        label: 'Excellent',
        icon: '🤩',
        idle: 'mobile-ces-emoji--idle-violet',
        selected: 'mobile-ces-emoji--selected-violet',
    },
];

export const MobileCompanyEnvironmentStep: React.FC<StepProps> = ({ disabled }) => {
    return (
        <Card
            className="mobile-ces-card"
            styles={{
                body: {
                    padding: '10px',
                    textAlign: 'left',
                },
            }}
        >
            <div className="mobile-info-width">
                <h1 className="mobile-ces-card__title">5. Company Environment</h1>
                <p className="mobile-ces-card__subtitle">
                    Share your feedback on culture, work-life balance, and improvements.
                </p>

                <div className="mobile-ces-fields">
                    {/* Work Culture Feedback */}
                    <div className="mobile-ces-field-card">
                        <span className="mobile-ces-field-card__label">
                            <span className="mobile-ces-field-card__required">*</span>
                            Feedback on Work Culture
                        </span>
                        {/* <p className="mobile-ces-field-card__hint">
                            How would you rate team collaboration and support?
                        </p> */}
                        <Form.Item
                            name={['companyEnvironment', 'workCultureFeedback']}
                            className="mb-0"
                        // rules={[
                        //     { required: true, message: 'Please enter feedback on work culture' },
                        //     { min: 10, message: 'Feedback must be at least 10 characters long' },
                        // ]}
                        >
                            <Input.TextArea
                                rows={3}
                                disabled={disabled}
                                placeholder="Share your workplace experience and suggestions...."
                                className="mobile-ces-textarea"
                                showCount
                                maxLength={2000}
                                  styles={{
                                    textarea: {
                                        resize: 'none',
                                    },
                                }}
                            />
                        </Form.Item>
                    </div>

                    {/* Work-Life Balance */}
                    <div className="mobile-ces-field-card">
                        <span className="mobile-ces-field-card__label">
                            <span className="mobile-ces-field-card__required">*</span>
                            Work-Life Balance
                        </span>
                        {/* <p className="mobile-ces-field-card__hint">
                            How would you rate your work-life balance? Share any challenges or positives.
                        </p> */}
                        <Form.Item
                            name={['companyEnvironment', 'workLifeBalance']}
                            className="mb-0"
                        // rules={[
                        //     { required: true, message: 'Please enter feedback on work-life balance' },
                        //     { min: 10, message: 'Feedback must be at least 10 characters long' },
                        // ]}
                        >
                            <Input.TextArea
                                rows={3}
                                disabled={disabled}
                                placeholder="Share your work-life balance experience...."
                                className="mobile-ces-textarea"
                                showCount
                                maxLength={2000}
                                styles={{
                                    textarea: {
                                        resize: 'none',
                                    },
                                }}
                            />
                        </Form.Item>
                    </div>

                    {/* Suggestions for Improvement */}
                    <div className="mobile-ces-field-card">
                        <span className="mobile-ces-field-card__label">
                            <span className="mobile-ces-field-card__required">*</span>
                            Suggestions for Improvement
                        </span>
                        {/* <p className="mobile-ces-field-card__hint">
                            What constructive suggestions do you have to improve processes, facilities, or policies?
                        </p> */}
                        <Form.Item
                            name={['companyEnvironment', 'suggestions']}
                            className="mb-0"
                        // rules={[
                        //     { required: true, message: 'Please provide suggestions for improvement' },
                        //     { min: 10, message: 'Suggestions must be at least 10 characters long' },
                        // ]}
                        >
                            <Input.TextArea
                                rows={3}
                                disabled={disabled}
                                placeholder="Share your suggestions for improvement...."
                                className="mobile-ces-textarea"
                                showCount
                                maxLength={2000}
                                  styles={{
                                    textarea: {
                                        resize: 'none',
                                    },
                                }}
                            />
                        </Form.Item>
                    </div>

                    {/* Rate the Company Environment (Smiley Emojis Only) */}
                    <div>
                        <span className="mobile-ces-field-card__label mobile-ces-rating-label">
                            <span className="mobile-ces-field-card__required">*</span>
                            Rate the Company Environment
                        </span>

                        <Form.Item
                            name={['companyEnvironment', 'rating']}
                            className="mb-0"
                        // rules={[{ required: true, message: 'Please rate the company environment' }]}
                        >
                            <EmojiRating disabled={disabled} />
                        </Form.Item>
                    </div>
                </div>
            </div>
        </Card>
    );
};

/* Interactive Emoji Rating Component */
interface EmojiRatingProps {
    value?: number;
    onChange?: (val: number) => void;
    disabled?: boolean;
}

const EmojiRating: React.FC<EmojiRatingProps> = ({ value, onChange, disabled }) => {
    return (
        <div className="mobile-ces-emoji-row">
            {EMOJIS.map((emoji) => {
                const isSelected = value === emoji.value;
                return (
                    <button
                        key={emoji.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange?.(emoji.value)}
                        className={`mobile-ces-emoji ${isSelected ? `mobile-ces-emoji--selected ${emoji.selected}` : emoji.idle} ${disabled ? 'mobile-ces-emoji--disabled' : ''
                            }`}
                    >
                        <span className="mobile-ces-emoji__icon">{emoji.icon}</span>
                        <span className="mobile-ces-emoji__label">{emoji.label}</span>
                    </button>
                );
            })}
        </div>
    );
};