import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { CheckCircle2, Star, MessageSquare } from "lucide-react";
import { Card } from "../../../../components/ui";

export const ReviewStep: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-[#1B2559]">Step 6: Review & Final Submission</h3>
        <p className="text-xs text-[#707EAE] mt-0.5">
          Review your appraisal responses before finalizing. Your manager will be notified upon submission.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 Review */}
        <Card className="p-4 rounded-2xl border border-[#E0E5F2] bg-white shadow-none">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B2559] uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#05CD99]" />
            <span>Role & Overview</span>
          </div>
          <p className="text-xs font-semibold text-[#1B2559] truncate">{formData.roleSummary || "Not filled"}</p>
          <p className="text-xs text-[#707EAE] mt-1 line-clamp-2">{formData.keyResponsibilities || "No responsibilities provided"}</p>
        </Card>

        {/* Step 2 Review */}
        <Card className="p-4 rounded-2xl border border-[#E0E5F2] bg-white shadow-none">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B2559] uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#05CD99]" />
            <span>Achievements (Rating: {formData.selfRatingAchievements}/5)</span>
          </div>
          <p className="text-xs font-semibold text-[#1B2559] line-clamp-2">{formData.majorAchievements || "Not filled"}</p>
          <p className="text-xs text-[#707EAE] mt-1 line-clamp-2">{formData.kpisMet || "No KPIs recorded"}</p>
        </Card>

        {/* Step 3 Review */}
        <Card className="p-4 rounded-2xl border border-[#E0E5F2] bg-white shadow-none">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B2559] uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#05CD99]" />
            <span>Team Collaboration</span>
          </div>
          <p className="text-xs text-[#707EAE] line-clamp-2">{formData.collaborationDetails || "Not filled"}</p>
        </Card>

        {/* Step 4 Review */}
        <Card className="p-4 rounded-2xl border border-[#E0E5F2] bg-white shadow-none">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B2559] uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#05CD99]" />
            <span>Skills & Growth</span>
          </div>
          <p className="text-xs text-[#707EAE] line-clamp-2">{formData.skillsAcquired || "Not filled"}</p>
        </Card>
      </div>

      {/* Overall Self Rating */}
      <div className="p-5 bg-[#F4F7FE] rounded-2xl border border-gray-100 space-y-3">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559]">
          <Star className="w-4 h-4 text-[#FFB547] fill-current" />
          <span>Overall Self Performance Rating (1 to 5)</span>
        </label>
        <div className="flex items-center gap-2.5">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => onChange("overallSelfRating", score)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                formData.overallSelfRating === score
                  ? "bg-[#4318FF] text-white shadow-md shadow-indigo-100"
                  : "bg-white text-[#707EAE] hover:text-[#1B2559] border border-[#E0E5F2]"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${formData.overallSelfRating >= score ? "fill-current" : ""}`} />
              <span>{score}.0</span>
            </button>
          ))}
        </div>
      </div>

      {/* Final Remarks */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B2559] mb-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#4318FF]" />
          <span>Final Comments or Note for Manager</span>
        </label>
        <textarea
          rows={3}
          value={formData.finalComments}
          onChange={(e) => onChange("finalComments", e.target.value)}
          placeholder="Any additional context, aspirations, or topics you would like to discuss in your 1-on-1 review meeting..."
          className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
        />
      </div>
    </div>
  );
};

export default ReviewStep;
