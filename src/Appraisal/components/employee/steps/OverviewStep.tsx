import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { FileText, Briefcase, Award } from "lucide-react";

export const OverviewStep: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-[#1B2559]">Step 1: Role & Quarter Overview</h3>
        <p className="text-xs text-[#707EAE] mt-0.5">
          Summarize your current role, primary responsibilities, and key highlights for this quarter.
        </p>
      </div>

      <div className="space-y-5">
        {/* Role Summary */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Role Summary <span className="text-red-500">*</span></span>
          </label>
          <input
            type="text"
            value={formData.roleSummary}
            onChange={(e) => onChange("roleSummary", e.target.value)}
            placeholder="e.g. Senior Frontend Developer leading user-facing feature development"
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none transition-all"
          />
        </div>

        {/* Key Responsibilities */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <FileText className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Key Responsibilities <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.keyResponsibilities}
            onChange={(e) => onChange("keyResponsibilities", e.target.value)}
            placeholder="Outline your primary day-to-day responsibilities and core accountabilities..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Quarter Highlights */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Award className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Quarter Highlights & Major Projects <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.quarterHighlights}
            onChange={(e) => onChange("quarterHighlights", e.target.value)}
            placeholder="Key milestones reached, releases delivered, or notable wins this quarter..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default OverviewStep;
