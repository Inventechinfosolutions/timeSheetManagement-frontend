import React, { useEffect, useState } from 'react';
import { Form, Input } from 'antd';
import { ClipboardList } from 'lucide-react';
import { MobileOverviewStep } from '../mobile_steps/overview/MobileOverviewStep';
import { ReviewStepCard } from '../../desktop/ReviewStepCard';

interface StepProps {
  disabled?: boolean;
}

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

export const OverviewStep: React.FC<StepProps> = ({ disabled }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateMatch = () => setIsMobile(mql.matches);

    updateMatch();
    mql.addEventListener('change', updateMatch);

    return () => mql.removeEventListener('change', updateMatch);
  }, []);

  if (isMobile) {
    return <MobileOverviewStep disabled={disabled} />;
  }

  return (
    <>
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
      <ReviewStepCard
        icon={ClipboardList}
        stepNumber={1}
        title="Quarter Overview"
        description={
          disabled
            ? undefined
            : 'Provide a summary of your performance, key responsibilities, and contributions during this review period.'
        }
      >
        <div className="qr-field-shell rounded-2xl p-5 relative">
          <Form.Item
            name="overview"
            label={
              <span className="relative z-[1] inline-flex items-center gap-2 font-semibold text-slate-800">
                <span className="text-rose-500">*</span>
                Performance Summary
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-white/50 border border-white/70 px-2 py-0.5 rounded-full">
                  Required
                </span>
              </span>
            }
            labelCol={{ span: 24 }}
          >
            <Input.TextArea
              rows={7}
              disabled={disabled}
              placeholder={disabled ? undefined : "Summarize your performance, key responsibilities, and contributions during this review period...."}
              className="relative z-[1] rounded-2xl transition-all duration-200 p-4 hide-scrollbar"
              style={{
                borderRadius: '16px',
                minHeight: '180px',
              }}
              styles={{
                textarea: {
                  color: "#0f172a",
                  resize: 'none',
                  borderRadius: '16px',
                },
              }}
              showCount
              maxLength={2000}
            />
          </Form.Item>
        </div>
      </ReviewStepCard>
    </>
  );
};
