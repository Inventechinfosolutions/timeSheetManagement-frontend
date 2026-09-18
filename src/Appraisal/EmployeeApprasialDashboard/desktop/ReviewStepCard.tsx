import React from 'react';
import { Card } from 'antd';
import type { LucideIcon } from 'lucide-react';
import './quarterlyReviewDesktop.css';

interface ReviewStepCardProps {
  icon: LucideIcon;
  stepNumber: number;
  title: string;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
}

export const ReviewStepCard: React.FC<ReviewStepCardProps> = ({
  icon: Icon,
  stepNumber,
  title,
  description,
  extra,
  children,
}) => {
  return (
    <Card className="qr-step-card" styles={{ body: { padding: 0 } }}>
      <div className="qr-glass-shine" />
      <div className="relative z-[1] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#9ec2ff] via-[#5b8cff] to-[#3d6bff] text-white flex items-center justify-center shrink-0 shadow-[0_10px_18px_rgba(61,107,255,0.38)]">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 mb-1">
                Step {stepNumber} of 6
              </p>
              <h1 className="text-lg font-bold text-slate-900 mb-1 leading-tight">
                {stepNumber}. {title}
              </h1>
              {description ? (
                <p className="text-slate-500 text-sm mb-0 leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {extra}
        </div>
        {children}
      </div>
    </Card>
  );
};
