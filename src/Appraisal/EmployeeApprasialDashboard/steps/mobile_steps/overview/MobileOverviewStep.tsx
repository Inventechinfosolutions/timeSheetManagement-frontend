import React from 'react';
import { Form, Input, Card } from 'antd';
import './MobileOverviewStep.css';

interface StepProps {
  disabled?: boolean;
}

export const MobileOverviewStep: React.FC<StepProps> = ({ disabled }) => {
  return (
    <Card className="mobile-overview-card">
      <div className="mobile-info-width">
      <h1 className="mobile-overview-card__title">1. Quarter Overview</h1>
      <p className="mobile-overview-card__subtitle">
        Summarize your performance and key responsibilities this review period.
      </p>

      <Form.Item
        name="overview"
        label={
          <span className="mobile-overview-card__label">
            <span className="mobile-overview-card__required">*</span>Quarterly Overview Summary
          </span>
        }
        labelCol={{ span: 24 }}
      // rules={[
      //   { required: true, message: 'Please provide your overview summary.' },
      //   // { min: 10, message: 'Overview must be at least 10 characters long.' },
      // ]}
      >
        <Input.TextArea
          rows={6}
          disabled={disabled}
          placeholder="Summarize your performance, responsibilities, and key contributions...."
          className="mobile-overview-card__textarea mobile-overview-card__scrollbar-hide"
          styles={{
            textarea: {
              color: '#000',
              resize: 'none',
            },
          }}
          showCount
          maxLength={2000}
        />
      </Form.Item>
      </div>
    </Card>
  );
};