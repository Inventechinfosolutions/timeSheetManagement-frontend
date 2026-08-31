import React, { useEffect, useState } from 'react';
import { Card, Form, Input } from 'antd';
import { MobileCompanyEnvironmentStep } from '../mobile_steps/companyEnvironment/MobileCompanyEnvironmentStep';

interface StepProps {
  disabled?: boolean;
}

const EMOJIS = [
  {
    value: 1,
    label: 'Very Bad',
    icon: '😡',
    idle: 'border-rose-200 bg-rose-50/40 text-rose-500',
    selected: 'border-rose-500 bg-rose-100 text-rose-700',
  },
  {
    value: 2,
    label: 'Bad',
    icon: '🙁',
    idle: 'border-orange-200 bg-orange-50/40 text-orange-500',
    selected: 'border-orange-500 bg-orange-100 text-orange-700',
  },
  {
    value: 3,
    label: 'Neutral',
    icon: '😐',
    idle: 'border-slate-200 bg-slate-50/60 text-slate-500',
    selected: 'border-slate-500 bg-slate-200 text-slate-700',
  },
  {
    value: 4,
    label: 'Good',
    icon: '🙂',
    idle: 'border-emerald-200 bg-emerald-50/40 text-emerald-500',
    selected: 'border-emerald-500 bg-emerald-100 text-emerald-700',
  },
  {
    value: 5,
    label: 'Excellent',
    icon: '🤩',
    idle: 'border-violet-200 bg-violet-50/40 text-violet-500',
    selected: 'border-violet-500 bg-violet-100 text-violet-700',
  },
];

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

export const CompanyEnvironmentStep: React.FC<StepProps> = ({ disabled }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateMatch = () => setIsMobile(mql.matches);

    updateMatch();
    mql.addEventListener('change', updateMatch);

    return () => mql.removeEventListener('change', updateMatch);
  }, []);

  if (isMobile) {
    return <MobileCompanyEnvironmentStep disabled={disabled} />;
  }

  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
      styles={{
        body: {
          padding: '10px',
          textAlign: 'left',
        },
      }}
    >
      {/* Local keyframes for entrance + selection animations */}
      <style>{`
        @keyframes ces-fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ces-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.08); }
          100% { transform: scale(1.02); }
        }
        .ces-card-enter {
          animation: ces-fadeInUp 0.4s ease-out both;
        }
        .ces-emoji-selected {
          animation: ces-pop 0.3s ease-out;
        }
      `}</style>

      {/* Hide native textarea scrollbar */}
      <style>{`
        .hide-scrollbar textarea {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .hide-scrollbar textarea::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .hide-scrollbar textarea::-webkit-scrollbar-thumb {
          background: transparent;
        }

        .hide-scrollbar textarea::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      <h1 className="text-xl font-semibold mb-2">5. Company Environment</h1>
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Provide feedback on your experience with the company culture, work-life balance, and make suggestions for overall improvement.
      </p>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Work Culture Feedback */}
          <div
            className="ces-card-enter rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            style={{ animationDelay: '0ms' }}
          >
            <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-1">
              <span className="text-rose-500">*</span>
              Feedback on Work Culture
            </span>
            {/* <p className="text-slate-500 text-xs mb-2 leading-relaxed">
              How do you feel about the team collaboration, support, transparency, and environment?
            </p> */}
            <Form.Item
              name={['companyEnvironment', 'workCultureFeedback']}
              className="mb-0"
              rules={[
                { required: true, message: 'Please enter feedback on work culture' },
              ]}
            >
              <Input.TextArea
                rows={3}
                disabled={disabled}
                placeholder="Share your workplace experience and suggestions...."
                className="hide-scrollbar rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 p-3 text-slate-900"
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
          <div
            className="ces-card-enter rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            style={{ animationDelay: '80ms' }}
          >
            <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-1">
              <span className="text-rose-500">*</span>
              Work-Life Balance
            </span>
            {/* <p className="text-slate-500 text-xs mb-2 leading-relaxed">
              Are you able to maintain a healthy work-life balance? Share any challenges or positive experiences.
            </p> */}
            <Form.Item
              name={['companyEnvironment', 'workLifeBalance']}
              className="mb-0"
              rules={[
                { required: true, message: 'Please enter feedback on work-life balance' },
              ]}
            >
              <Input.TextArea
                rows={3}
                disabled={disabled}
                placeholder="Share your work-life balance experience...."
                className="hide-scrollbar rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 p-3 text-slate-900"
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
          <div
            className="ces-card-enter rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 md:col-span-2"
            style={{ animationDelay: '160ms' }}
          >
            <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-1">
              <span className="text-rose-500">*</span>
              Suggestions for Improvement
            </span>
            {/* <p className="text-slate-500 text-xs mb-2 leading-relaxed">
              What constructive suggestions do you have to improve processes, facilities, or policies?
            </p> */}
            <Form.Item
              name={['companyEnvironment', 'suggestions']}
              className="mb-0"
              rules={[
                { required: true, message: 'Please provide suggestions for improvement' },
              ]}
            >
              <Input.TextArea
                rows={3}
                disabled={disabled}
                placeholder="Share your suggestions for improvement...."
                className="hide-scrollbar rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 p-3 text-slate-900"
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
        </div>

        {/* Rate the Company Environment (Smiley Emojis Only) */}
        <div
          className="ces-card-enter"
          style={{ animationDelay: '240ms' }}
        >
          <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-3">
            <span className="text-rose-500">*</span>
            Rate the Company Environment
          </span>

          <Form.Item
            name={['companyEnvironment', 'rating']}
            className="mb-0"
            rules={[{ required: true, message: 'Please rate the company environment' }]}
          >
            <EmojiRating disabled={disabled} />
          </Form.Item>
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
    <div className="flex flex-wrap items-center gap-2.5">
      {EMOJIS.map((emoji, index) => {
        const isSelected = value === emoji.value;
        return (
          <button
            key={emoji.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(emoji.value)}
            className={`ces-card-enter flex items-center gap-2 py-1.5 px-3 rounded-full border transition-all duration-200 cursor-pointer ${isSelected ? `ces-emoji-selected font-bold shadow-sm ${emoji.selected}` : `hover:-translate-y-0.5 hover:shadow-sm ${emoji.idle}`
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{ animationDelay: `${300 + index * 60}ms` }}
          >
            <span className="text-lg leading-none">{emoji.icon}</span>
            <span className="text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap">{emoji.label}</span>
          </button>
        );
      })}
    </div>
  );
};