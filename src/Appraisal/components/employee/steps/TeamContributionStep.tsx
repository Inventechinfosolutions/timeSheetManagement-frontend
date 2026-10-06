import React, { useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";

interface Criterion {
  key: string;
  title: string;
}

const CRITERIA: Criterion[] = [
  { key: "communication", title: "Communication" },
  { key: "ownership", title: "Ownership" },
  { key: "collaboration", title: "Collaboration" },
  { key: "problemSolving", title: "Problem Solving" },
  { key: "leadership", title: "Leadership" },
  { key: "adaptability", title: "Adaptability" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Needs Focus",
  2: "Developing",
  3: "Proficient",
  4: "Very Strong",
  5: "Exceptional",
};

interface ShatteringStarItem {
  key: string;
  star: number;
  id: number;
}

export const TeamContributionStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const ratings = formData.teamRatings || {};
  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});
  const [animatingStar, setAnimatingStar] = useState<{ key: string; star: number } | null>(null);
  const [shatteringStars, setShatteringStars] = useState<ShatteringStarItem[]>([]);

  const handleRate = (criterionKey: string, score: number) => {
    const currentScore = (ratings as Record<string, number>)[criterionKey] || 0;
    let finalScore = score;
    const unselectedStars: number[] = [];

    if (currentScore === score) {
      // Clicking the currently selected star unselects it (drops down by 1)
      finalScore = score - 1;
      unselectedStars.push(score);
    } else if (score < currentScore) {
      // Lowering rating: stars between score + 1 and currentScore break apart
      for (let s = score + 1; s <= currentScore; s++) {
        unselectedStars.push(s);
      }
      finalScore = score;
    } else {
      // Increasing rating: animate the newly selected star
      finalScore = score;
      setAnimatingStar({ key: criterionKey, star: score });
      setTimeout(() => setAnimatingStar(null), 550);
    }

    // Trigger smooth break-apart animation for all unselected stars
    if (unselectedStars.length > 0) {
      const now = Date.now();
      const newItems: ShatteringStarItem[] = unselectedStars.map((starNum, idx) => ({
        key: criterionKey,
        star: starNum,
        id: now + idx + starNum * 10,
      }));

      setShatteringStars((prev) => [...prev, ...newItems]);

      setTimeout(() => {
        setShatteringStars((prev) =>
          prev.filter((item) => !newItems.some((ni) => ni.id === item.id))
        );
      }, 480);
    }

    const updated = {
      ...ratings,
      [criterionKey]: finalScore,
    };
    onChange("teamRatings" as any, updated);
    if (clearError) {
      clearError(criterionKey);
    }

    // Sync human-readable summary
    const filledCount = Object.keys(updated).filter((k) => (((updated as Record<string, number>)[k] || 0) > 0)).length;
    const avgScore = (Object.values(updated).reduce((a: number, b) => a + ((b as number) || 0), 0) / (filledCount || 1)).toFixed(1);
    const summaryText = `Teamwork evaluation: ${filledCount}/6 criteria rated (Avg score: ${avgScore}/5.0). ${formData.collaborationDetails && !formData.collaborationDetails.startsWith("Teamwork evaluation:")
        ? formData.collaborationDetails
        : ""
      }`.trim();
    onChange("collaborationDetails", summaryText);
  };

  const ratedCount = Object.values(ratings).filter((v) => ((v as number) || 0) > 0).length;
  const overallAvgNum =
    ratedCount > 0
      ? Object.values(ratings).reduce((acc: number, curr) => acc + ((curr as number) || 0), 0) / ratedCount
      : 0;
  const overallAvg = ratedCount > 0 ? overallAvgNum.toFixed(1) : null;

  const prevAvgScoreRef = React.useRef(overallAvgNum);
  const isFirstRender = React.useRef(true);
  const [transferAnim, setTransferAnim] = useState<"increase" | "decrease" | null>(null);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevAvgScoreRef.current = overallAvgNum;
      return;
    }

    const prev = prevAvgScoreRef.current;
    if (overallAvgNum > prev) {
      // Numbers increased: star transfers TO the default star for 2 sec
      setTransferAnim("increase");
      prevAvgScoreRef.current = overallAvgNum;
      const timer = setTimeout(() => {
        setTransferAnim(null);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (overallAvgNum < prev) {
      // Numbers decreased: star breaks & removes FROM the default star for 2 sec
      setTransferAnim("decrease");
      prevAvgScoreRef.current = overallAvgNum;
      const timer = setTimeout(() => {
        setTransferAnim(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [overallAvgNum]);

  return (
    <div className="space-y-4">
      {/* Header with Progress Counter */}
      <div className="border-b border-[#D7B6C7]/40 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
            <span className="eval-title-anim">Step 3: Teamwork & Collaboration</span>{" "}
            <span className="text-red-500">*</span>
            <span className="eval-title-accent-line" />
          </h3>
          <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
            Rate your teamwork performance across all 6 dimensions (all required).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-purple-50/80 border shadow-xs flex items-center gap-2.5 shrink-0 eval-subtitle-anim transition-all duration-300 relative overflow-visible ${ratedCount === 6
                ? "border-emerald-300/80 shadow-emerald-100"
                : "border-[#D7B6C7]/60"
              }`}
          >
            {/* The Default Star: Receives transfer on increase, or emits breaking star on decrease (2 sec) */}
            <div className="relative w-5 h-5 flex items-center justify-center shrink-0 overflow-visible">
              <svg
                viewBox="0 0 32 32"
                className={`w-5 h-5 overflow-visible anim-avg-star-float ${
                  transferAnim === "increase" ? "anim-default-star-absorb" : ""
                }`}
              >
                <defs>
                  <linearGradient id="avgStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="45%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                  <radialGradient id="avgGlowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Pulsing Aura Behind Star */}
                <circle cx="16" cy="16" r="13" fill="url(#avgGlowGrad)" className="anim-avg-star-aura" />

                {/* Main Star Body */}
                <polygon
                  points="16,2 20.3,11.2 30.5,12.5 23,19.6 24.9,29.8 16,24.8 7.1,29.8 9,19.6 1.5,12.5 11.7,11.2"
                  fill="url(#avgStarGrad)"
                  stroke="#D97706"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  className="anim-avg-star-pulse"
                />

                {/* Twinkling Star Sparkle Top-Right */}
                <g className="anim-avg-sparkle-1">
                  <polygon
                    points="27,3 28,6 31,7 28,8 27,11 26,8 23,7 26,6"
                    fill="#FEF08A"
                    stroke="#F59E0B"
                    strokeWidth="0.5"
                  />
                </g>

                {/* Twinkling Star Sparkle Bottom-Left */}
                <g className="anim-avg-sparkle-2">
                  <polygon
                    points="5,23 6,25 8,26 6,27 5,29 4,27 2,26 4,25"
                    fill="#FFFFFF"
                    stroke="#FBBF24"
                    strokeWidth="0.4"
                  />
                </g>
              </svg>

              {/* 1. Rating INCREASE: Star transfers TO the default star for 2 seconds */}
              {transferAnim === "increase" && (
                <div className="absolute inset-0 flex items-center justify-center anim-transfer-to-default">
                  <Star className="w-5 h-5 fill-amber-300 text-amber-500 drop-shadow-[0_0_12px_rgba(251,191,36,1)]" />
                  <span className="star-transfer-particle particle-1" />
                  <span className="star-transfer-particle particle-2" />
                </div>
              )}

              {/* 2. Rating DECREASE: Star separates & breaks FROM the default star for 2 seconds */}
              {transferAnim === "decrease" && (
                <div className="absolute inset-0 flex items-center justify-center anim-break-from-default">
                  {/* Left Cracked Half */}
                  <div className="absolute inset-0 flex items-center justify-center anim-star-crack-left">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                  </div>

                  {/* Right Cracked Half */}
                  <div className="absolute inset-0 flex items-center justify-center anim-star-crack-right">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                  </div>

                  {/* Electric Crack Flash Line */}
                  <svg
                    viewBox="0 0 24 24"
                    className="absolute w-5 h-5 anim-star-crack-flash"
                  >
                    <path
                      d="M12 3 L10.5 8 L13.5 12 L10 16 L12.5 21"
                      stroke="#FFFBEB"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>

                  {/* Glowing Star Shards Scattering */}
                  <span className="star-shard star-shard-1" />
                  <span className="star-shard star-shard-2" />
                  <span className="star-shard star-shard-3" />
                  <span className="star-shard star-shard-4" />
                  <span className="star-shard star-shard-5" />
                  <span className="star-shard star-shard-6" />
                  <span className="star-shard star-shard-7" />
                </div>
              )}
            </div>

            {/* Average Rating Text */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#64748B] tracking-tight">
                Average:
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#0F172A] tracking-tight">
                {overallAvg ? `${overallAvg}` : "0.0"}
              </span>
              <span className="text-[10px] font-bold text-[#94A3B8]">
                / 5.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Compact Criteria Rows in 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CRITERIA.map((criterion) => {
          const currentRating = ratings[criterion.key as keyof typeof ratings] || 0;
          const hovered = hoveredStars[criterion.key] || 0;
          const isSelected = currentRating > 0;
          const criterionError = errors?.[criterion.key];

          return (
            <div
              key={criterion.key}
              id={`field-criterion-${criterion.key}`}
              className={`eval-step-card !py-3 !px-4 flex flex-col justify-between transition-all duration-300 ${criterionError
                  ? "eval-field-has-error"
                  : isSelected
                    ? "!border-[#8D73A8]/50 shadow-sm"
                    : "!border-[#D7B6C7]/50"
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Criterion Title */}
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-[#0F172A] truncate">
                    {criterion.title} <span className="text-red-500">*</span>
                  </span>
                </div>

                {/* Star Rating & Score */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="flex items-center gap-0.5"
                    onMouseLeave={() =>
                      setHoveredStars((prev) => ({ ...prev, [criterion.key]: 0 }))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      const displayRating = Math.max(currentRating, hovered);
                      const isFilled = starIndex <= displayRating;
                      const isDirectlyClicked =
                        animatingStar?.key === criterion.key &&
                        animatingStar?.star === starIndex;
                      const isShattering = shatteringStars.some(
                        (s) => s.key === criterion.key && s.star === starIndex
                      );

                      return (
                        <button
                          key={starIndex}
                          type="button"
                          onClick={() => handleRate(criterion.key, starIndex)}
                          onMouseEnter={() =>
                            setHoveredStars((prev) => ({
                              ...prev,
                              [criterion.key]: starIndex,
                            }))
                          }
                          title={`${criterion.title}: ${starIndex} of 5 (${RATING_LABELS[starIndex]})`}
                          className={`relative p-1 sm:p-1.5 rounded-lg transition-transform cursor-pointer focus:outline-none select-none star-jelly-hover overflow-visible ${isDirectlyClicked
                              ? "star-spin-pop"
                              : isFilled && !isShattering
                                ? "star-active-glow"
                                : ""
                            }`}
                        >
                          {/* Base Star: Smooth transition into unselected gray state */}
                          <Star
                            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ease-out ${isFilled && !isShattering
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.75)]"
                                : "text-gray-300 fill-transparent hover:text-amber-300"
                              }`}
                          />

                          {/* Break-Apart Animation: Cracks, shatters, and scatters glowing particles */}
                          {isShattering && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-visible">
                              {/* Left Cracked Half */}
                              <div className="absolute inset-0 flex items-center justify-center anim-star-crack-left">
                                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                              </div>

                              {/* Right Cracked Half */}
                              <div className="absolute inset-0 flex items-center justify-center anim-star-crack-right">
                                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                              </div>

                              {/* Electric Crack Flash Line */}
                              <svg
                                viewBox="0 0 24 24"
                                className="absolute w-5 h-5 sm:w-6 sm:h-6 anim-star-crack-flash"
                              >
                                <path
                                  d="M12 3 L10.5 8 L13.5 12 L10 16 L12.5 21"
                                  stroke="#FFFBEB"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  fill="none"
                                />
                              </svg>

                              {/* Glowing Fragments / Particles Scattering Outward */}
                              <span className="star-shard star-shard-1" />
                              <span className="star-shard star-shard-2" />
                              <span className="star-shard star-shard-3" />
                              <span className="star-shard star-shard-4" />
                              <span className="star-shard star-shard-5" />
                              <span className="star-shard star-shard-6" />
                              <span className="star-shard star-shard-7" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Inline Error Message */}
              {criterionError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-2 pt-1.5 border-t border-red-200/70 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>{criterionError}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamContributionStep;
