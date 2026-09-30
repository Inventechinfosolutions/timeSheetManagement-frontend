import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Building2, Wrench, ThumbsUp, Star } from "lucide-react";

export const CompanyEnvironmentStep: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-[#1B2559]">Step 5: Work Environment & Support</h3>
        <p className="text-xs text-[#707EAE] mt-0.5">
          Share your feedback on team dynamics, workspace culture, tools, and manager support.
        </p>
      </div>

      <div className="space-y-5">
        {/* Culture Feedback */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Workplace Culture & Environment Feedback <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.workCultureFeedback}
            onChange={(e) => onChange("workCultureFeedback", e.target.value)}
            placeholder="What aspects of our work culture support your productivity? Any areas for improvement?..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Tooling & Resources */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Wrench className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Tools, Hardware, & Infrastructure</span>
          </label>
          <textarea
            rows={3}
            value={formData.toolingAndResources}
            onChange={(e) => onChange("toolingAndResources", e.target.value)}
            placeholder="Do you have all the tools and infrastructure needed to perform at your best?..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Management Support Rating */}
        <div className="p-4 bg-[#F4F7FE] rounded-2xl border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-2">
            <ThumbsUp className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>Manager & Leadership Support Rating (1 to 5)</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onChange("managementSupportRating", score)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formData.managementSupportRating === score
                    ? "bg-[#4318FF] text-white shadow-sm"
                    : "bg-white text-[#707EAE] hover:text-[#1B2559] border border-[#E0E5F2]"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${formData.managementSupportRating >= score ? "fill-current" : ""}`} />
                <span>{score}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyEnvironmentStep;
