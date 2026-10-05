import React from "react";
import { StepProps } from "../../../types/appraisal.types";


export const LearningGoalsStep: React.FC<StepProps> = ({ formData, onChange }) => {
  const learningGoalsVal =
    formData.learningGoals ??
    formData.nextQuarterLearningGoals ??
    formData.skillsAcquired ??
    "";

  const handleChange = (val: string) => {
    onChange("learningGoals" as any, val);
    onChange("nextQuarterLearningGoals", val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#99F6E4]/40 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">Step 4: Continuous Learning & Goals</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Document the technical skills acquired, certifications completed, and future learning ambitions.
        </p>
      </div>

      <div className="space-y-4">
        {/* Single Comprehensive Learning Goals Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
            Learning Goals <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={7}
            value={learningGoalsVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Highlight new technical frameworks learned, courses or certifications completed, and your core learning and career development goals for the upcoming quarter..."
            className="w-full px-4 py-3 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-2xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-xs leading-relaxed"
          />
          <p className="text-xs text-[#94A3B8] mt-1.5">
            Outline any tools, design patterns, or technical areas you strengthened this quarter, along with key learning objectives you plan to pursue next.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningGoalsStep;
