import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Trophy, Target, AlertTriangle, Star } from "lucide-react";

export const AchievementsStep: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-[#1B2559]">Step 2: Key Achievements & Goals</h3>
        <p className="text-xs text-[#707EAE] mt-0.5">
          Detail your accomplishments, measurable goals achieved, and hurdles you navigated.
        </p>
      </div>

      <div className="space-y-5">
        {/* Major Achievements */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#05CD99]" />
            <span>Major Achievements <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.majorAchievements}
            onChange={(e) => onChange("majorAchievements", e.target.value)}
            placeholder="Describe your biggest accomplishments and high-impact deliverables..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* KPIs Met */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <Target className="w-3.5 h-3.5 text-[#4318FF]" />
            <span>KPIs & Measurable Targets Met <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.kpisMet}
            onChange={(e) => onChange("kpisMet", e.target.value)}
            placeholder="Quantify results where possible (e.g. delivery rate, performance metrics, bug fix velocity)..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Challenges Overcome */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FFB547]" />
            <span>Challenges Overcome <span className="text-red-500">*</span></span>
          </label>
          <textarea
            rows={3}
            value={formData.challengesOvercome}
            onChange={(e) => onChange("challengesOvercome", e.target.value)}
            placeholder="What roadblocks did you face and how did you resolve them?..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Self-Rating */}
        <div className="p-4 bg-[#F4F7FE] rounded-2xl border border-gray-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-2">
            Self-Rating on Achievements (1 to 5)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onChange("selfRatingAchievements", score)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formData.selfRatingAchievements === score
                    ? "bg-[#4318FF] text-white shadow-sm"
                    : "bg-white text-[#707EAE] hover:text-[#1B2559] border border-[#E0E5F2]"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${formData.selfRatingAchievements >= score ? "fill-current" : ""}`} />
                <span>{score}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsStep;
