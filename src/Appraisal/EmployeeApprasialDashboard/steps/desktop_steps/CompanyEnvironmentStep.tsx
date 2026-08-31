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

      <div className="flex flex-col gap-5 border border-slate-100 rounded-2xl py-3 px-2 bg-slate-50/50 relative">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Work Culture Feedback */}
  <div>
    <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-1">
      <span className="text-rose-500">*</span>
      Feedback on Work Culture
    </span>

    <Form.Item
      name={['companyEnvironment', 'workCultureFeedback']}
      className="mb-0"
      rules={[
        {
          required: true,
          message: 'Please enter feedback on work culture',
        },
      ]}
    >
      <Input.TextArea
        rows={3}
        disabled={disabled}
        placeholder="Share your workplace experience and suggestions...."
        className="hide-scrollbar rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 p-3 text-slate-900  hover:-translate-y-0.5"
        style={{
          borderRadius: '12px',
          backgroundColor: '#fff',
          borderColor: '#e2e8f0',
        }}
        showCount
        maxLength={2000}
        styles={{
          textarea: {
            resize: 'none',
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: '12px',
          },
        }}
      />
    </Form.Item>
  </div>

  {/* Work-Life Balance */}
  <div>
    <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-1">
      <span className="text-rose-500">*</span>
      Work-Life Balance
    </span>

    <Form.Item
      name={['companyEnvironment', 'workLifeBalance']}
      className="mb-0"
      rules={[
        {
          required: true,
          message: 'Please enter feedback on work-life balance',
        },
      ]}
    >
      <Input.TextArea
        rows={3}
        disabled={disabled}
        placeholder="Share your work-life balance experience...."
        className="hide-scrollbar rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 p-3 text-slate-900  hover:-translate-y-0.5"
        style={{
          borderRadius: '12px',
          backgroundColor: '#fff',
          borderColor: '#e2e8f0',
        }}
        showCount
        maxLength={2000}
        styles={{
          textarea: {
            resize: 'none',
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: '12px',
          },
        }}
      />
    </Form.Item>
  </div>

  {/* Suggestions for Improvement */}
  <div>
    <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-1 -mt-6">
      <span className="text-rose-500">*</span>
      Suggestions for Improvement
    </span>

    <Form.Item
      name={['companyEnvironment', 'suggestions']}
      className="mb-0"
      rules={[
        {
          required: true,
          message: 'Please provide suggestions for improvement',
        },
      ]}
    >
      <Input.TextArea
        rows={3}
        disabled={disabled}
        placeholder="Share your suggestions for improvement...."
        className="hide-scrollbar rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 p-3 text-slate-900  hover:-translate-y-0.5"
        style={{
          borderRadius: '12px',
          backgroundColor: '#fff',
          borderColor: '#e2e8f0',
        }}
        showCount
        maxLength={2000}
        styles={{
          textarea: {
            resize: 'none',
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: '12px',
          },
        }}
      />
    </Form.Item>
  </div>

  {/* Rate the Company Environment */}
  <div>
    <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mb-1 -mt-6">
      <span className="text-rose-500">*</span>
      Rate the Company Environment
    </span>

    <Form.Item
      name={['companyEnvironment', 'rating']}
      className="mb-0"
      rules={[
        {
          required: true,
          message: 'Please rate the company environment',
        },
      ]}
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

const EmojiRating: React.FC<EmojiRatingProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1.5">
        {EMOJIS.map((emoji) => {
          const isSelected = value === emoji.value;

          return (
            <button
              key={emoji.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(emoji.value)}
              className={`
                group flex flex-col items-center justify-center
                w-22 h-16 rounded-md border
                transition-all duration-200
                ${
                  isSelected
                    ? `${emoji.selectedBg} border-transparent shadow-lg scale-105 opacity-100 ring-2 ${emoji.ring} ring-offset-1 z-10 font-bold`
                    : `${emoji.bg} ${emoji.border} ${disabled ? 'opacity-40' : 'hover:scale-105 hover:shadow-sm'}`
                }
                ${disabled ? 'cursor-default' : 'cursor-pointer'}
              `}
              style={{
                borderRadius: '6px',
              }}
            >
              <span
                className={`
                  text-2xl leading-none transition-transform duration-200
                  ${isSelected ? 'scale-110 drop-shadow' : 'group-hover:scale-110'}
                `}
              >
                {emoji.icon}
              </span>

              <span
                className={`
                  mt-1 text-[12px] font-bold whitespace-nowrap
                  ${
                    isSelected
                      ? 'text-white'
                      : emoji.color
                  }
                `}
              >
                {emoji.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};