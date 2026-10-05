import React, { useState } from "react";
import { StepProps } from "../../../types/appraisal.types";

interface RatingOption {
  id: number;
  label: string;
}

const RATING_OPTIONS: RatingOption[] = [
  { id: 1, label: "Very Bad" },
  { id: 2, label: "Bad" },
  { id: 3, label: "Neutral" },
  { id: 4, label: "Good" },
  { id: 5, label: "Excellent" },
];

export const CompanyEnvironmentStep: React.FC<StepProps> = ({ formData, onChange }) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [animatingId, setAnimatingId] = useState<number | null>(null);

  const selectedRating = formData.companyEnvironmentRating ?? null;

  const handleSelect = (id: number) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 500);
    onChange("companyEnvironmentRating" as any, id);
    onChange("managementSupportRating", id);
  };

  const renderEmojiIcon = (id: number, isActive: boolean) => {
    switch (id) {
      case 1:
        // Very Bad
        return (
          <svg viewBox="0 0 36 36" className="w-9 h-9 sm:w-10 sm:h-10 transition-transform">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill={isActive ? "#FFE3E3" : "#F8F9FC"}
              stroke={isActive ? "#E03131" : "#94A3B8"}
              strokeWidth={isActive ? "2.5" : "1.8"}
            />
            {/* Furrowed angry eyebrows */}
            <path
              d="M10 11.5L15 14"
              stroke={isActive ? "#C92A2A" : "#94A3B8"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M26 11.5L21 14"
              stroke={isActive ? "#C92A2A" : "#94A3B8"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Eyes */}
            <circle cx="12.5" cy="17" r="1.9" fill={isActive ? "#C92A2A" : "#94A3B8"} />
            <circle cx="23.5" cy="17" r="1.9" fill={isActive ? "#C92A2A" : "#94A3B8"} />
            {/* Downturned mouth */}
            <path
              d="M11 26Q18 20.5 25 26"
              stroke={isActive ? "#C92A2A" : "#94A3B8"}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case 2:
        // Bad
        return (
          <svg viewBox="0 0 36 36" className="w-9 h-9 sm:w-10 sm:h-10 transition-transform">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill={isActive ? "#FFE8CC" : "#F8F9FC"}
              stroke={isActive ? "#F76707" : "#94A3B8"}
              strokeWidth={isActive ? "2.5" : "1.8"}
            />
            {/* Sad eyebrows */}
            <path
              d="M10 13.5L15 11.5"
              stroke={isActive ? "#D9480F" : "#94A3B8"}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M26 13.5L21 11.5"
              stroke={isActive ? "#D9480F" : "#94A3B8"}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Eyes */}
            <circle cx="12.5" cy="16.5" r="1.9" fill={isActive ? "#D9480F" : "#94A3B8"} />
            <circle cx="23.5" cy="16.5" r="1.9" fill={isActive ? "#D9480F" : "#94A3B8"} />
            {/* Downturned mouth */}
            <path
              d="M12 25Q18 21.5 24 25"
              stroke={isActive ? "#D9480F" : "#94A3B8"}
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case 3:
        // Neutral
        return (
          <svg viewBox="0 0 36 36" className="w-9 h-9 sm:w-10 sm:h-10 transition-transform">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill={isActive ? "#FFF3BF" : "#F8F9FC"}
              stroke={isActive ? "#F59F00" : "#94A3B8"}
              strokeWidth={isActive ? "2.5" : "1.8"}
            />
            {/* Eyes */}
            <circle cx="12.5" cy="16" r="1.9" fill={isActive ? "#E67700" : "#94A3B8"} />
            <circle cx="23.5" cy="16" r="1.9" fill={isActive ? "#E67700" : "#94A3B8"} />
            {/* Straight mouth */}
            <line
              x1="12"
              y1="23.5"
              x2="24"
              y2="23.5"
              stroke={isActive ? "#E67700" : "#94A3B8"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        );

      case 4:
        // Good
        return (
          <svg viewBox="0 0 36 36" className="w-9 h-9 sm:w-10 sm:h-10 transition-transform">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill={isActive ? "#D3F9D8" : "#F8F9FC"}
              stroke={isActive ? "#37B24D" : "#94A3B8"}
              strokeWidth={isActive ? "2.5" : "1.8"}
            />
            {/* Eyes */}
            <circle cx="12.5" cy="16" r="1.9" fill={isActive ? "#2B8A3E" : "#94A3B8"} />
            <circle cx="23.5" cy="16" r="1.9" fill={isActive ? "#2B8A3E" : "#94A3B8"} />
            {/* Gentle curved smile */}
            <path
              d="M11.5 21.5Q18 28.5 24.5 21.5"
              stroke={isActive ? "#2B8A3E" : "#94A3B8"}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case 5:
      default:
        // Excellent (matches exact screenshot: bright yellow face, magenta star eyes, open smile)
        return (
          <svg viewBox="0 0 36 36" className="w-9 h-9 sm:w-10 sm:h-10 transition-transform drop-shadow-xs">
            {/* Face */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill={isActive ? "#FFD233" : "#F8F9FC"}
              stroke={isActive ? "#0F172A" : "#94A3B8"}
              strokeWidth={isActive ? "2.5" : "1.8"}
            />
            {/* Star Eye Left */}
            <polygon
              points="12.5,10.5 13.8,13.2 16.7,13.5 14.5,15.5 15.2,18.3 12.5,16.8 9.8,18.3 10.5,15.5 8.3,13.5 11.2,13.2"
              fill={isActive ? "#FF2D75" : "#94A3B8"}
              stroke={isActive ? "#0F172A" : "none"}
              strokeWidth={isActive ? "0.8" : "0"}
              strokeLinejoin="round"
            />
            {/* Star Eye Right */}
            <polygon
              points="23.5,10.5 24.8,13.2 27.7,13.5 25.5,15.5 26.2,18.3 23.5,16.8 20.8,18.3 21.5,15.5 19.3,13.5 22.2,13.2"
              fill={isActive ? "#FF2D75" : "#94A3B8"}
              stroke={isActive ? "#0F172A" : "none"}
              strokeWidth={isActive ? "0.8" : "0"}
              strokeLinejoin="round"
            />
            {/* Big smiling laughing mouth */}
            <path
              d="M11 20.5C11 26.5 14.5 28.5 18 28.5C21.5 28.5 25 26.5 25 20.5C25 20.5 18 22.5 11 20.5Z"
              fill={isActive ? "#0F172A" : "#94A3B8"}
              stroke={isActive ? "#0F172A" : "none"}
              strokeWidth="0.8"
            />
            {/* Tongue */}
            {isActive && (
              <path
                d="M15 25C15 27.2 16.3 28.5 18 28.5C19.7 28.5 21 27.2 21 25C21 24.5 15 24.5 15 25Z"
                fill="#FF4D4F"
              />
            )}
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="border-b border-[#99F6E4]/40 pb-3">
        <h3 className="text-base sm:text-lg font-bold text-[#14B8A6]">
          Company Environment
        </h3>
      </div>

      <div className="space-y-5">
        {/* 1. Feedback on Work Culture */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-semibold text-[#0F172A]">
            Feedback on Work Culture <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.workCultureFeedback ?? ""}
            onChange={(e) => onChange("workCultureFeedback", e.target.value)}
            placeholder="The collaborative workspace is highly productive. The developer tools provided are excellent and help speed up development cycles."
            className="w-full px-4 py-3 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-2xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-xs leading-relaxed"
          />
        </div>

        {/* 2. Work Life Balance */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-semibold text-[#0F172A]">
            Work Life Balance <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.workLifeBalance ?? ""}
            onChange={(e) => onChange("workLifeBalance", e.target.value)}
            placeholder="I feel highly aligned with the company's vision of delivering fast, reliable employee portals."
            className="w-full px-4 py-3 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-2xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-xs leading-relaxed"
          />
        </div>

        {/* 3. Suggestions for Improvement */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-semibold text-[#0F172A]">
            Suggestions for Improvement <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.suggestionsForImprovement ?? ""}
            onChange={(e) => {
              onChange("suggestionsForImprovement", e.target.value);
              onChange("toolingAndResources", e.target.value);
            }}
            placeholder="I feel highly aligned with the company's vision of delivering fast, reliable employee portals."
            className="w-full px-4 py-3 bg-white border border-[#CCFBF1] hover:border-gray-300 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-2xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-xs leading-relaxed"
          />
        </div>

        {/* 4. Rate the Company Environment (Emoji Reaction Bar) */}
        <div className="pt-2 space-y-3">
          <label className="block text-xs sm:text-sm font-semibold text-[#0F172A]">
            Rate the Company Environment <span className="text-red-500">*</span>
          </label>

          <div
            className="flex items-center gap-4 sm:gap-6 pt-1 select-none"
            onMouseLeave={() => setHoveredRating(null)}
          >
            {RATING_OPTIONS.map((item) => {
              const isSelected = selectedRating === item.id;
              const isHovered = hoveredRating === item.id;
              const isActive = isSelected || isHovered;
              const isAnimating = animatingId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  onMouseEnter={() => setHoveredRating(item.id)}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer focus:outline-none transition-all ${
                    isAnimating ? "emoji-btn-pop" : "emoji-hover-effect"
                  } ${isSelected ? `emoji-active-${item.id}` : ""}`}
                >
                  <div className="relative flex items-center justify-center">
                    {renderEmojiIcon(item.id, isActive)}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs transition-colors tracking-tight ${
                      isSelected
                        ? "font-bold text-[#0F172A]"
                        : "font-medium text-[#94A3B8] hover:text-[#64748B]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyEnvironmentStep;
