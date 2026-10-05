import React from "react";
import { StepProps } from "../../../types/appraisal.types";


export const OverviewStep: React.FC<StepProps> = ({ formData, onChange }) => {
  const overviewVal = formData.overview ?? formData.roleSummary ?? "";

  const handleChange = (val: string) => {
    onChange("overview" as any, val);
    onChange("roleSummary", val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">Step 1: Role & Quarter Overview</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Summarize your current role, primary responsibilities, and key highlights for this quarter.
        </p>
      </div>

      <div className="space-y-4">
        {/* Single Comprehensive Overview Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
            Overview <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={7}
            value={overviewVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Summarize your role, core responsibilities, deliverables, and major quarter highlights..."
            className="w-full px-4 py-3 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-2xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-xs leading-relaxed"
          />
          <p className="text-xs text-[#94A3B8] mt-1.5">
            Provide a clear summary covering your day-to-day role responsibilities, key milestones reached, and major projects delivered this quarter.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewStep;
