import React from 'react';
import { Form, Input, Card } from 'antd';

interface StepProps {
  disabled?: boolean;
}

export const OverviewStep: React.FC<StepProps> = ({ disabled }) => {
  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
      title={
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
          <span>1. Quarter Overview</span>
        </div>
      }
    >
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Provide a summary of your performance, responsibilities, and overall status during this review period.
        Explain your core duties and how you think you managed them.
      </p>

      <Form.Item
        name="overview"
        label={<span className="font-medium text-slate-700">Quarterly Overview Summary</span>}
        labelCol={{ span: 24 }}
      // rules={[
      //   { required: true, message: 'Please provide your overview summary.' },
      //   // { min: 10, message: 'Overview must be at least 10 characters long.' },
      // ]}
      >
        <Input.TextArea
          rows={6}
          disabled={disabled}
          placeholder="Share a general overview of your performance, daily operations, and how your role evolved this quarter..."
          className="rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)] transition-all duration-200 p-3"
          styles={{
            textarea: {
              color: "#000",
            },
          }}
          showCount
          maxLength={1000}
        />
      </Form.Item>
    </Card>
  );
};
