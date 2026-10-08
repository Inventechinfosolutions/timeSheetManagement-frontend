import React, { useState, useRef, useEffect } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Check, CheckCircle2, AlertCircle } from "lucide-react";
import { animateEmojiClickPop } from "../../../animations/appraisalAnimations";
import "../AppraisalDashboard.css";

interface RatingOption {
  id: number;
  label: string;
  emoji: string;
}

const RATING_OPTIONS: RatingOption[] = [
  { id: 1, label: "Very Bad", emoji: "😡" },
  { id: 2, label: "Bad", emoji: "🙁" },
  { id: 3, label: "Neutral", emoji: "😐" },
  { id: 4, label: "Good", emoji: "😊" },
  { id: 5, label: "Excellent", emoji: "🤩" },
];

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

export const CompanyEnvironmentStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [animatingId, setAnimatingId] = useState<number | null>(null);
  const emojiBtnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (animatingId && emojiBtnRefs.current[animatingId]) {
      animateEmojiClickPop(emojiBtnRefs.current[animatingId]);
    }
  }, [animatingId]);

  const selectedRating = formData.companyEnvironmentRating ?? null;

  const workCultureError = errors?.workCultureFeedback;
  const workLifeBalanceError = errors?.workLifeBalance;
  const suggestionsError = errors?.suggestionsForImprovement || errors?.toolingAndResources;
  const ratingError = errors?.companyEnvironmentRating || errors?.managementSupportRating;

  const handleSelect = (id: number) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 400);
    onChange("companyEnvironmentRating" as any, id);
    onChange("managementSupportRating", id);
    if (clearError) {
      clearError("companyEnvironmentRating");
      clearError("managementSupportRating");
    }
  };

  const handleWorkCultureChange = (val: string) => {
    onChange("workCultureFeedback", val);
    if (clearError) {
      clearError("workCultureFeedback");
    }
  };

  const handleWorkLifeBalanceChange = (val: string) => {
    onChange("workLifeBalance", val);
    if (clearError) {
      clearError("workLifeBalance");
    }
  };

  const handleSuggestionsChange = (val: string) => {
    onChange("suggestionsForImprovement", val);
    onChange("toolingAndResources", val);
    if (clearError) {
      clearError("suggestionsForImprovement");
      clearError("toolingAndResources");
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-blue-100 pb-3">
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 5: Company & Work Environment</span>{" "}
          <span className="text-red-500">*</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Rate your experience across key workplace culture, collaboration, and environment factors.
        </p>
      </div>

      {/* 2x2 Side-by-Side Grid for the 4 Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Feedback on Work Culture */}
        <div
          id="field-workCultureFeedback"
          className={`eval-step-card space-y-2 flex flex-col justify-between transition-all duration-200 ${
            workCultureError ? "eval-field-has-error" : ""
          }`}
        >
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
              <span>
                Feedback on Work Culture <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              id="input-workCultureFeedback"
              rows={3}
              value={formData.workCultureFeedback ?? ""}
              onChange={(e) => handleWorkCultureChange(e.target.value)}
              placeholder="Share your thoughts on company culture, peer collaboration, communication, and work atmosphere..."
              className={`eval-textarea-field mt-2 ${
                workCultureError ? "eval-input-error" : ""
              }`}
            />
            {workCultureError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{workCultureError}</span>
              </p>
            )}
          </div>
        </div>

        {/* 2. Work Life Balance */}
        <div
          id="field-workLifeBalance"
          className={`eval-step-card space-y-2 flex flex-col justify-between transition-all duration-200 ${
            workLifeBalanceError ? "eval-field-has-error" : ""
          }`}
        >
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
              <span>
                Work Life Balance <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              id="input-workLifeBalance"
              rows={3}
              value={formData.workLifeBalance ?? ""}
              onChange={(e) => handleWorkLifeBalanceChange(e.target.value)}
              placeholder="Describe your workload management, personal time boundaries, flexibility, and overall well-being..."
              className={`eval-textarea-field mt-2 ${
                workLifeBalanceError ? "eval-input-error" : ""
              }`}
            />
            {workLifeBalanceError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{workLifeBalanceError}</span>
              </p>
            )}
          </div>
        </div>

        {/* 3. Suggestions for Improvement */}
        <div
          id="field-suggestionsForImprovement"
          className={`eval-step-card space-y-2 flex flex-col justify-between transition-all duration-200 ${
            suggestionsError ? "eval-field-has-error" : ""
          }`}
        >
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
              <span>
                Suggestions for Improvement <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              id="input-suggestionsForImprovement"
              rows={3}
              value={formData.suggestionsForImprovement ?? ""}
              onChange={(e) => handleSuggestionsChange(e.target.value)}
              placeholder="Suggest specific ideas or improvements regarding development tooling, workflows, or company processes..."
              className={`eval-textarea-field mt-2 ${
                suggestionsError ? "eval-input-error" : ""
              }`}
            />
            {suggestionsError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{suggestionsError}</span>
              </p>
            )}
          </div>
        </div>

        {/* 4. Rate the Company Environment (Interactive Animated Emojis) */}
        <div
          id="field-companyEnvironmentRating"
          className={`eval-step-card space-y-2 flex flex-col justify-between transition-all duration-200 ${
            ratingError ? "eval-field-has-error" : ""
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                Rate the Company Environment <span className="text-red-500">*</span>
              </label>
              {selectedRating ? (
                <span className="text-[11px] font-bold text-[#2563EB] flex items-center gap-1 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  Selected: {RATING_OPTIONS.find((r) => r.id === selectedRating)?.label} ({selectedRating}/5)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-[#64748B]">
                  Select 1 to 5
                </span>
              )}
            </div>

            <div
              className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 select-none"
              onMouseLeave={() => setHoveredRating(null)}
            >
              {RATING_OPTIONS.map((item) => {
                const isSelected = selectedRating === item.id;
                const isHovered = hoveredRating === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    onMouseEnter={() => setHoveredRating(item.id)}
                    className={`group relative flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 rounded-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none select-none ${
                      isSelected
                        ? "bg-white border-[#2563EB] shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20 scale-[1.03] z-10"
                        : isHovered
                        ? "bg-white border-blue-300 shadow-xs -translate-y-0.5"
                        : ratingError
                        ? "bg-white/80 border-red-300 hover:border-red-400"
                        : "bg-white/60 border-[#E2E8F0] hover:border-[#CBD5E1]"
                    }`}
                  >
                    {/* Selected Checkmark Badge on Top Right */}
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}

                    {/* Animated Sentiment Emoji Icon with Grayscale Contrast Filter */}
                    <div
                      ref={(el) => {
                        emojiBtnRefs.current[item.id] = el;
                      }}
                      className={`relative flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? "scale-110 drop-shadow-md filter-none opacity-100"
                          : isHovered
                          ? "scale-105 filter grayscale-[15%] opacity-90"
                          : "filter grayscale-[80%] opacity-45 group-hover:filter-none group-hover:opacity-100"
                      }`}
                    >
                      {renderEmojiIcon(item.emoji)}
                    </div>

                    {/* Label */}
                    <span
                      className={`mt-1.5 text-[10px] sm:text-[11px] font-bold transition-all tracking-tight whitespace-nowrap text-center ${
                        isSelected
                          ? "text-[#2563EB] font-extrabold scale-105"
                          : "text-[#64748B] group-hover:text-[#0F172A]"
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Selected Indicator Pill */}
                    <div
                      className={`mt-1 h-0.5 rounded-full transition-all duration-300 ${
                        isSelected ? "w-6 bg-[#2563EB]" : "w-0 bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {ratingError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{ratingError}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyEnvironmentStep;
