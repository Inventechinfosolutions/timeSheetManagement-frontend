import React, { useState } from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import "../AppraisalDashboard.css";

const EMOJI_MAP: Record<number, string> = {
  1: "😡",
  2: "🙁",
  3: "😐",
  4: "😊",
  5: "🤩",
};

export const renderAnimatedEmojiIcon = (id: number, _isActive: boolean = true) => (
  <span className="text-lg leading-none select-none inline-block">
    {EMOJI_MAP[id] || "😊"}
  </span>
);

export const renderEmojiIcon = (emoji: string) => (
  <span className="text-2xl sm:text-3xl leading-none select-none inline-block">
    {emoji}
  </span>
);

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Poor (1/5)",
  2: "Fair (2/5)",
  3: "Good (3/5)",
  4: "Very Good (4/5)",
  5: "Excellent (5/5)",
};

interface RatingCardProps {
  id: string;
  fieldKey: keyof ReviewFormData;
  title: string;
  value: number;
  error?: string;
  onRate: (score: number) => void;
}

const EnvironmentRatingCard: React.FC<RatingCardProps> = ({
  id,
  title,
  value,
  error,
  onRate,
}) => {
  const [hoveredScore, setHoveredScore] = useState<number>(0);
  const displayScore = hoveredScore || value || 0;

  return (
    <div
      id={id}
      className={`bg-white border rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 scroll-mt-24 shadow-2xs ${
        error
          ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
          : value > 0
          ? "border-blue-400/80 bg-blue-50/15"
          : "border-blue-200/70 hover:border-blue-300"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5 min-h-[30px]">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] leading-tight">
            <span>
              {title} <span className="text-red-500">*</span>
            </span>
          </label>
          {value > 0 && (
            <span className="shrink-0 text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in duration-150">
              <CheckCircle2 className="w-3 h-3 text-[#2563EB]" />
              <span>{value}/5</span>
            </span>
          )}
        </div>

        {/* 5-Star Interactive Rating */}
        <div
          className="flex items-center gap-1 py-0.5"
          onMouseLeave={() => setHoveredScore(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= displayScore;
            return (
              <button
                key={star}
                type="button"
                onClick={() => onRate(star)}
                onMouseEnter={() => setHoveredScore(star)}
                className="p-0.5 rounded hover:bg-amber-50 focus:outline-none transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                title={`${star} Star - ${RATING_DESCRIPTIONS[star]}`}
                aria-label={`${title} ${star} of 5`}
              >
                <Star
                  className={`w-5 h-5 transition-colors duration-150 ${
                    isFilled
                      ? "fill-[#F59E0B] text-[#D97706] drop-shadow-[0_1px_2px_rgba(245,158,11,0.35)]"
                      : "fill-transparent text-slate-300 hover:text-amber-300"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Score Description Pill */}
        <div className="mt-1 text-[11px] font-semibold text-[#64748B] min-h-[16px]">
          {displayScore > 0 ? (
            <span className="text-[#0F172A] font-bold">
              {RATING_DESCRIPTIONS[displayScore]}
            </span>
          ) : (
            <span className="text-slate-400">Select rating (1 to 5)</span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export const CompanyEnvironmentStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const handleRateField = (field: keyof ReviewFormData, score: number) => {
    onChange(field, score);
    if (clearError) {
      clearError(field as string);
    }
  };

  const handleTextChange = (field: keyof ReviewFormData, val: string) => {
    onChange(field, val);
    if (clearError) {
      clearError(field as string);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-blue-100 pb-3">
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 5: Environment</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Understand whether you have the tools, support, and working conditions needed to perform effectively.
        </p>
      </div>

      {/* 1. Rating Fields: 3 Cards Side-by-Side in Responsive Grid */}
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#64748B] mb-3">
          Environment &amp; Support Ratings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Field 1: Work Environment Satisfaction */}
          <EnvironmentRatingCard
            id="field-companyEnvironmentRating"
            fieldKey="companyEnvironmentRating"
            title="Work Environment Satisfaction"
            value={formData.companyEnvironmentRating || 0}
            error={errors?.companyEnvironmentRating}
            onRate={(score) => handleRateField("companyEnvironmentRating", score)}
          />

          {/* Field 2: Availability of Tools & Resources */}
          <EnvironmentRatingCard
            id="field-toolingAndResourcesRating"
            fieldKey="toolingAndResourcesRating"
            title="Availability of Tools & Resources"
            value={formData.toolingAndResourcesRating || 0}
            error={errors?.toolingAndResourcesRating}
            onRate={(score) => handleRateField("toolingAndResourcesRating", score)}
          />

          {/* Field 3: Manager Support */}
          <EnvironmentRatingCard
            id="field-managementSupportRating"
            fieldKey="managementSupportRating"
            title="Manager Support"
            value={formData.managementSupportRating || 0}
            error={errors?.managementSupportRating}
            onRate={(score) => handleRateField("managementSupportRating", score)}
          />
        </div>
      </div>

      {/* 2. Qualitative Feedback Textareas: Side-by-Side without outer card borders */}
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#64748B] mb-3">
          Productivity &amp; Suggestions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Field 4: Challenges Affecting Productivity (Optional) */}
          <div
            id="field-challengesAffectingProductivity"
            className="flex flex-col space-y-2 scroll-mt-24"
          >
            <label
              htmlFor="input-challengesAffectingProductivity"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
            >
              <span>Challenges Affecting Productivity</span>
            </label>
            <textarea
              id="input-challengesAffectingProductivity"
              rows={4}
              value={formData.challengesAffectingProductivity ?? ""}
              onChange={(e) =>
                handleTextChange("challengesAffectingProductivity", e.target.value)
              }
              placeholder="Describe any obstacles, bottlenecks, or challenges affecting your productivity..."
              className="eval-textarea-field leading-relaxed text-sm flex-1"
            />
          </div>

          {/* Field 5: Suggestions for Improvement (Optional) */}
          <div
            id="field-suggestionsForImprovement"
            className="flex flex-col space-y-2 scroll-mt-24"
          >
            <label
              htmlFor="input-suggestionsForImprovement"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
            >
              <span>Suggestions for Improvement</span>
            </label>
            <textarea
              id="input-suggestionsForImprovement"
              rows={4}
              value={formData.suggestionsForImprovement ?? ""}
              onChange={(e) =>
                handleTextChange("suggestionsForImprovement", e.target.value)
              }
              placeholder="Suggest ideas for tools, processes, training, or workplace improvement..."
              className="eval-textarea-field leading-relaxed text-sm flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyEnvironmentStep;
