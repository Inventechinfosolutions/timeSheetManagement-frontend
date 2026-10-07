import React, { useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Check, CheckCircle2, AlertCircle } from "lucide-react";
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

export const renderAnimatedEmojiIcon = (id: number, isActive: boolean = true) => {
    switch (id) {
      case 1:
        // 😡 Very Bad (Angry face with steam puffs & rage shake)
        return (
          <svg
            viewBox="0 0 44 44"
            className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform ${
              isActive ? "anim-angry-head" : ""
            }`}
          >
            <defs>
              <linearGradient id="angryFaceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
            {/* Steam Puffs billowing from ears */}
            <g className={isActive ? "anim-steam-puff-l" : ""}>
              <circle cx="8" cy="14" r="3.5" fill="#E2E8F0" opacity={isActive ? "0.9" : "0"} />
              <circle cx="6" cy="11" r="2.5" fill="#CBD5E1" opacity={isActive ? "0.75" : "0"} />
            </g>
            <g className={isActive ? "anim-steam-puff-r" : ""}>
              <circle cx="36" cy="14" r="3.5" fill="#E2E8F0" opacity={isActive ? "0.9" : "0"} />
              <circle cx="38" cy="11" r="2.5" fill="#CBD5E1" opacity={isActive ? "0.75" : "0"} />
            </g>
            {/* Face Base */}
            <circle
              cx="22"
              cy="22"
              r="16"
              fill="url(#angryFaceGrad)"
              stroke="#B91C1C"
              strokeWidth="1.5"
            />
            {/* Forehead Anger Mark / Vein */}
            {isActive && (
              <path
                d="M26 8L28 11M28 8L26 11M24.5 9.5L29.5 9.5"
                stroke="#FEF08A"
                strokeWidth="1.6"
                strokeLinecap="round"
                className="anim-anger-vein"
              />
            )}
            {/* Angled Angry Eyebrows */}
            <path d="M12 14L19 17" stroke="#7F1D1D" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M32 14L25 17" stroke="#7F1D1D" strokeWidth="2.6" strokeLinecap="round" />
            {/* Glaring Eyes */}
            <circle cx="16" cy="20" r="2.4" fill="#FFFFFF" />
            <circle cx="16.5" cy="20.5" r="1.4" fill="#7F1D1D" />
            <circle cx="28" cy="20" r="2.4" fill="#FFFFFF" />
            <circle cx="27.5" cy="20.5" r="1.4" fill="#7F1D1D" />
            {/* Downturned Trembling Mouth */}
            <path
              d="M15 30C17 26.5 27 26.5 29 30"
              stroke="#7F1D1D"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case 2:
        // 🙁 Bad (Sad face with falling tear drop)
        return (
          <svg
            viewBox="0 0 44 44"
            className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform ${
              isActive ? "anim-sad-head" : ""
            }`}
          >
            <defs>
              <linearGradient id="sadFaceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
              <linearGradient id="tearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            {/* Face Base */}
            <circle
              cx="22"
              cy="22"
              r="16"
              fill="url(#sadFaceGrad)"
              stroke="#EA580C"
              strokeWidth="1.5"
            />
            {/* Sad Arched Eyebrows */}
            <path
              d="M12 17C14 14.5 18 15.5 19 17"
              stroke="#9A3412"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M32 17C30 14.5 26 15.5 25 17"
              stroke="#9A3412"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Watery Sad Eyes */}
            <ellipse cx="16" cy="21" rx="2.4" ry="2.8" fill="#7C2D12" />
            <circle cx="15.2" cy="19.8" r="1" fill="#FFFFFF" />
            <ellipse cx="28" cy="21" rx="2.4" ry="2.8" fill="#7C2D12" />
            <circle cx="27.2" cy="19.8" r="1" fill="#FFFFFF" />
            {/* Falling Tear Drop */}
            <g className={isActive ? "anim-tear-drop" : ""}>
              <path
                d="M28 25C28 25 31 28.5 31 30.5C31 32.2 29.7 33.5 28 33.5C26.3 33.5 25 32.2 25 30.5C25 28.5 28 25 28 25Z"
                fill="url(#tearGrad)"
                opacity={isActive ? "1" : "0"}
              />
            </g>
            {/* Downturned Sad Mouth */}
            <path
              d="M15 31C18 28 26 28 29 31"
              stroke="#7C2D12"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case 3:
        // 😐 Neutral (Straight face with eyelid blinking & breathing float)
        return (
          <svg
            viewBox="0 0 44 44"
            className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform ${
              isActive ? "anim-neutral-head" : ""
            }`}
          >
            <defs>
              <linearGradient id="neutralFaceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#EAB308" />
              </linearGradient>
            </defs>
            {/* Face Base */}
            <circle
              cx="22"
              cy="22"
              r="16"
              fill="url(#neutralFaceGrad)"
              stroke="#CA8A04"
              strokeWidth="1.5"
            />
            {/* Flat Eyebrows */}
            <line x1="13" y1="15" x2="19" y2="15" stroke="#854D0E" strokeWidth="2" strokeLinecap="round" />
            <line x1="25" y1="15" x2="31" y2="15" stroke="#854D0E" strokeWidth="2" strokeLinecap="round" />
            {/* Eyes with Animated Eyelid Blink */}
            <g className={isActive ? "anim-eye-blink" : ""}>
              <circle cx="16" cy="20.5" r="2.5" fill="#713F12" />
              <circle cx="15.3" cy="19.8" r="0.8" fill="#FFFFFF" />
              <circle cx="28" cy="20.5" r="2.5" fill="#713F12" />
              <circle cx="27.3" cy="19.8" r="0.8" fill="#FFFFFF" />
            </g>
            {/* Flat Straight Mouth */}
            <line x1="15" y1="29" x2="29" y2="29" stroke="#713F12" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        );

      case 4:
        // 😊 Good (Happy smiling face with blushing cheeks & sparkle star)
        return (
          <svg
            viewBox="0 0 44 44"
            className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform ${
              isActive ? "anim-happy-head" : ""
            }`}
          >
            <defs>
              <linearGradient id="goodFaceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
            </defs>
            {/* Cheerful Twinkling Sparkle Star */}
            <g className={isActive ? "anim-sparkle" : ""}>
              <path
                d="M36 8L37.5 12L41.5 13.5L37.5 15L36 19L34.5 15L30.5 13.5L34.5 12Z"
                fill="#F59E0B"
                opacity={isActive ? "1" : "0"}
              />
            </g>
            {/* Face Base */}
            <circle
              cx="22"
              cy="22"
              r="16"
              fill="url(#goodFaceGrad)"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            {/* Rosy Pulsing Blushing Cheeks */}
            <ellipse
              cx="12"
              cy="24"
              rx="3.5"
              ry="2"
              fill="#F472B6"
              opacity={isActive ? "0.85" : "0.5"}
              className={isActive ? "anim-blush" : ""}
            />
            <ellipse
              cx="32"
              cy="24"
              rx="3.5"
              ry="2"
              fill="#F472B6"
              opacity={isActive ? "0.85" : "0.5"}
              className={isActive ? "anim-blush" : ""}
            />
            {/* Happy Curved Smiling Eyes (^^) */}
            <path
              d="M13 19C14 16 18 16 19 19"
              stroke="#78350F"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M25 19C26 16 30 16 31 19"
              stroke="#78350F"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Broad Joyful Smiling Mouth with Tongue */}
            <path
              d="M15 25C15 31 22 34 22 34C22 34 29 31 29 25Z"
              fill="#78350F"
            />
            <path
              d="M18 30C19 32 21 33 22 33C23 33 25 32 26 30Z"
              fill="#FB7185"
            />
          </svg>
        );

      case 5:
      default:
        // 🤩 Excellent (Star-struck face with spinning star eyes & twinkling particles)
        return (
          <svg
            viewBox="0 0 44 44"
            className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform ${
              isActive ? "anim-excellent-head" : ""
            }`}
          >
            <defs>
              <linearGradient id="excellentFaceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            {/* Twinkling Star Particle Left */}
            <g className={isActive ? "anim-star-twinkle-1" : ""}>
              <path
                d="M6 10L7.5 13L10.5 14.5L7.5 16L6 19L4.5 16L1.5 14.5L4.5 13Z"
                fill="#FBBF24"
                opacity={isActive ? "1" : "0"}
              />
            </g>
            {/* Twinkling Star Particle Right */}
            <g className={isActive ? "anim-star-twinkle-2" : ""}>
              <path
                d="M38 9L39.2 11.5L42 12.5L39.2 13.5L38 16L36.8 13.5L34 12.5L36.8 11.5Z"
                fill="#EC4899"
                opacity={isActive ? "1" : "0"}
              />
            </g>
            {/* Face Base */}
            <circle
              cx="22"
              cy="22"
              r="16"
              fill="url(#excellentFaceGrad)"
              stroke="#B45309"
              strokeWidth="1.5"
            />
            {/* Left Spinning Pulsing Star Eye */}
            <g className={isActive ? "anim-star-eye-l" : ""}>
              <polygon
                points="16,13 17.5,17 21.5,17.5 18.2,20.2 19.2,24 16,21.8 12.8,24 13.8,20.2 10.5,17.5 14.5,17"
                fill="#EC4899"
                stroke="#BE185D"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
            </g>
            {/* Right Spinning Pulsing Star Eye */}
            <g className={isActive ? "anim-star-eye-r" : ""}>
              <polygon
                points="28,13 29.5,17 33.5,17.5 30.2,20.2 31.2,24 28,21.8 24.8,24 25.8,20.2 22.5,17.5 26.5,17"
                fill="#EC4899"
                stroke="#BE185D"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
            </g>
            {/* Ecstatic Laughing Open Mouth with Teeth and Tongue */}
            <path
              d="M14 26C14 33 22 36 22 36C22 36 30 33 30 26Z"
              fill="#78350F"
            />
            {/* Teeth */}
            <path
              d="M16 26H28C28 27.5 26 28.5 22 28.5C18 28.5 16 27.5 16 26Z"
              fill="#FFFFFF"
            />
            {/* Tongue */}
            <path
              d="M17 31C18.5 34 22 35 22 35C22 35 25.5 34 27 31Z"
              fill="#EF4444"
            />
          </svg>
        );
    }
};

export const CompanyEnvironmentStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [animatingId, setAnimatingId] = useState<number | null>(null);

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
                const isAnimating = animatingId === item.id;

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
                      className={`relative flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? "scale-110 drop-shadow-md filter-none opacity-100"
                          : isHovered
                          ? "scale-105 filter grayscale-[15%] opacity-90"
                          : "filter grayscale-[80%] opacity-45 group-hover:filter-none group-hover:opacity-100"
                      } ${isAnimating ? "emoji-btn-pop" : ""}`}
                    >
                      {renderAnimatedEmojiIcon(item.id, isSelected || isHovered)}
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
