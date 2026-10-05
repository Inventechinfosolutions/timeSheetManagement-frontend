import React from "react";
import { StepProps } from "../../../types/appraisal.types";


export const AchievementsStep: React.FC<StepProps> = ({ formData, onChange }) => {
  const projectTitle = formData.projectTitle ?? formData.majorAchievements ?? "";
  const projectDescription = formData.projectDescription ?? formData.kpisMet ?? "";
  const projectChallenge = formData.projectChallenge ?? formData.challengesOvercome ?? "";

  const handleTitleChange = (val: string) => {
    onChange("projectTitle" as any, val);
    onChange("majorAchievements", val);
  };

  const handleDescriptionChange = (val: string) => {
    onChange("projectDescription" as any, val);
    onChange("kpisMet", val);
  };

  const handleChallengeChange = (val: string) => {
    onChange("projectChallenge" as any, val);
    onChange("challengesOvercome", val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#99F6E4]/40 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">Step 2: Key Achievements & Projects</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Detail your key project deliverables, project description, and challenges navigated.
        </p>
      </div>

      <div className="space-y-5">
        {/* Project Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Timesheet Workflow Modernization & Automation"
            className="w-full px-3.5 py-2.5 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition-all shadow-xs"
          />
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={projectDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Describe the project scope, your key responsibilities, deliverables, and measurable outcomes..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-xs"
          />
        </div>

        {/* Challenge */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
            Challenge <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={projectChallenge}
            onChange={(e) => handleChallengeChange(e.target.value)}
            placeholder="What technical or operational challenges did you encounter and how did you resolve them?..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default AchievementsStep;
