import React, { useEffect, useState } from 'react';
import { Form, Input, Card } from 'antd';
import { MobileOverviewStep } from '../mobile_steps/overview/MobileOverviewStep';

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
      <Card
        className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
        styles={{
          body: {
            padding: "10px",
            textAlign: 'justify',
          },
        }}
      >
        <h1 className='text-xl font-semibold mb-2'>1. Quarter Overview</h1>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Provide a summary of your performance, key responsibilities, and contributions during this review period.
        </p>

        <Form.Item
          name="overview"
          label={<span className="font-medium text-slate-700"><span className="text-rose-500">*</span>Performance Summary</span>}
          labelCol={{ span: 24 }}
        // rules={[
        //   { required: true, message: 'Please provide your overview summary.' },
        //   // { min: 10, message: 'Overview must be at least 10 characters long.' },
        // ]}
        >
          <Input.TextArea
            rows={6}
            disabled={disabled}
            placeholder="Summarize your performance, key responsibilities, and contributions during this review period...."
            className="rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)] transition-all duration-200 p-3 hide-scrollbar"
            styles={{
              textarea: {
                color: "#000",
                 resize: 'none',
              },
            }}
            showCount
            maxLength={2000}
          />
        </Form.Item>
      </Card>
    </>
  );
};