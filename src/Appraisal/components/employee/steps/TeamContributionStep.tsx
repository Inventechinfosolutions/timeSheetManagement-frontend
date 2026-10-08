import React, { useState, useRef, useEffect } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import {
  initDefaultStarAnimation,
  animateDefaultStarAbsorb,
  animateTransferIncrease,
  animateTransferDecrease,
  animateStarPop,
  animateStarHover,
  animateStarHoverLeave,
  animateShatteringStar,
} from "../../../animations/appraisalAnimations";

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

// GSAP Break-Apart Shattering Star Effect
const ShatteringStar: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      return animateShatteringStar(containerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-visible"
    >
      {/* Left Cracked Half */}
      <div
        className="absolute inset-0 flex items-center justify-center star-crack-left-el [clip-path:polygon(0%_0%,50%_0%,42%_35%,55%_62%,40%_100%,0%_100%)]"
      >
        <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]" />
      </div>

      {/* Right Cracked Half */}
      <div
        className="absolute inset-0 flex items-center justify-center star-crack-right-el [clip-path:polygon(50%_0%,100%_0%,100%_100%,40%_100%,55%_62%,42%_35%)]"
      >
        <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]" />
      </div>

      {/* Electric Crack Flash */}
      <div className="absolute inset-0 flex items-center justify-center star-crack-flash-el pointer-events-none">
        <div className="w-0.5 h-5 bg-gradient-to-b from-amber-100 via-white to-amber-200 rotate-12 rounded-full shadow-[0_0_8px_#FFFBEB]" />
      </div>

      {/* Glowing Fragments Scattering Outward */}
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
    </div>
  );
};

// GSAP Transfer Increase Effect (Star flying into default star)
const TransferIncreaseEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      return animateTransferIncrease(containerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-visible"
    >
      <Star className="w-5 h-5 fill-amber-300 text-amber-500 drop-shadow-[0_0_12px_rgba(251,191,36,1)]" />
      <span className="star-transfer-particle particle-1" />
      <span className="star-transfer-particle particle-2" />
    </div>
  );
};

// GSAP Transfer Decrease Effect (Star separating & breaking from default star)
const TransferDecreaseEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      return animateTransferDecrease(containerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-visible"
    >
      <div
        className="absolute inset-0 flex items-center justify-center star-crack-left-el [clip-path:polygon(0%_0%,50%_0%,42%_35%,55%_62%,40%_100%,0%_100%)]"
      >
        <Star className="w-5 h-5 fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center star-crack-right-el [clip-path:polygon(50%_0%,100%_0%,100%_100%,40%_100%,55%_62%,42%_35%)]"
      >
        <Star className="w-5 h-5 fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center star-crack-flash-el pointer-events-none">
        <div className="w-0.5 h-5 bg-gradient-to-b from-amber-100 via-white to-amber-200 rotate-12 rounded-full shadow-[0_0_8px_#FFFBEB]" />
      </div>
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
      <span className="star-shard star-shard-el" />
    </div>
  );
};

interface CriterionStarButtonProps {
  criterionKey: string;
  criterionTitle: string;
  starIndex: number;
  currentRating: number;
  hovered: number;
  isDirectlyClicked: boolean;
  isShattering: boolean;
  onRate: (criterionKey: string, score: number) => void;
  onHover: (criterionKey: string, score: number) => void;
}

const CriterionStarButton: React.FC<CriterionStarButtonProps> = ({
  criterionKey,
  criterionTitle,
  starIndex,
  currentRating,
  hovered,
  isDirectlyClicked,
  isShattering,
  onRate,
  onHover,
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const displayRating = Math.max(currentRating, hovered);
  const isFilled = starIndex <= displayRating;

  useEffect(() => {
    if (isDirectlyClicked && btnRef.current) {
      animateStarPop(btnRef.current);
    }
  }, [isDirectlyClicked]);

  const handleMouseEnter = () => {
    onHover(criterionKey, starIndex);
    if (btnRef.current) {
      animateStarHover(btnRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (btnRef.current) {
      animateStarHoverLeave(btnRef.current);
    }
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => onRate(criterionKey, starIndex)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${criterionTitle}: ${starIndex} of 5 (${RATING_LABELS[starIndex]})`}
      className="relative p-1 sm:p-1.5 rounded-lg cursor-pointer focus:outline-none select-none overflow-visible"
    >
      <Star
        className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200 ${
          isFilled && !isShattering
            ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]"
            : "text-gray-300 fill-transparent hover:text-[#F59E0B]"
        }`}
      />
      {isShattering && <ShatteringStar />}
    </button>
  );
};

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

  // Default Star GSAP Animation References
  const defaultStarRef = useRef<HTMLDivElement | null>(null);
  const defaultStarAuraRef = useRef<HTMLDivElement | null>(null);
  const defaultStarBodyRef = useRef<HTMLDivElement | null>(null);
  const sparkle1Ref = useRef<HTMLSpanElement | null>(null);
  const sparkle2Ref = useRef<HTMLSpanElement | null>(null);

  // Default Star continuous living animations (GSAP)
  useEffect(() => {
    return initDefaultStarAnimation({
      container: defaultStarRef.current,
      aura: defaultStarAuraRef.current,
      body: defaultStarBodyRef.current,
      sparkle1: sparkle1Ref.current,
      sparkle2: sparkle2Ref.current,
    });
  }, []);

  const handleRate = (criterionKey: string, score: number) => {
    const currentScore = (ratings as Record<string, number>)[criterionKey] || 0;
    let finalScore = score;
    const unselectedStars: number[] = [];

    if (currentScore === score) {
      finalScore = score - 1;
      unselectedStars.push(score);
    } else if (score < currentScore) {
      for (let s = score + 1; s <= currentScore; s++) {
        unselectedStars.push(s);
      }
      finalScore = score;
    } else {
      finalScore = score;
      setAnimatingStar({ key: criterionKey, star: score });
      setTimeout(() => setAnimatingStar(null), 550);
    }

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
      setTransferAnim("increase");
      prevAvgScoreRef.current = overallAvgNum;

      // Animate absorption pulse on default star with GSAP
      animateDefaultStarAbsorb(defaultStarRef.current);

      const timer = setTimeout(() => {
        setTransferAnim(null);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (overallAvgNum < prev) {
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
      <div className="border-b border-blue-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            className={`px-3 py-1.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border shadow-xs flex items-center gap-2.5 shrink-0 eval-subtitle-anim transition-all duration-300 relative overflow-visible ${ratedCount === 6
                ? "border-blue-500 shadow-blue-500/20"
                : "border-blue-200/80"
              }`}
          >
            {/* The Default Star: Receives transfer on increase, or emits breaking star on decrease (2 sec) */}
            <div className="relative w-5 h-5 flex items-center justify-center shrink-0 overflow-visible">
              <div
                ref={defaultStarRef}
                className="relative w-5 h-5 flex items-center justify-center shrink-0 overflow-visible"
              >
                {/* Pulsing Aura Behind Star (GSAP Animated) */}
                <div
                  ref={defaultStarAuraRef}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300/40 via-amber-400/20 to-blue-500/20 blur-[2px]"
                />

                {/* Main Star Body (GSAP Animated) */}
                <div ref={defaultStarBodyRef} className="relative z-10 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]" />
                </div>

                {/* Twinkling Star Sparkle Top-Right (GSAP Animated) */}
                <span
                  ref={sparkle1Ref}
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_4px_#FFF2D6]"
                />

                {/* Twinkling Star Sparkle Bottom-Left (GSAP Animated) */}
                <span
                  ref={sparkle2Ref}
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_3px_#FFFFFF]"
                />
              </div>

              {/* 1. Rating INCREASE: Star transfers TO the default star for 2 seconds (GSAP) */}
              {transferAnim === "increase" && <TransferIncreaseEffect />}

              {/* 2. Rating DECREASE: Star separates & breaks FROM the default star for 2 seconds (GSAP) */}
              {transferAnim === "decrease" && <TransferDecreaseEffect />}
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
                    ? "!border-blue-500/60 shadow-sm"
                    : "!border-blue-200/60"
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Criterion Title */}
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
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
                      const isDirectlyClicked =
                        animatingStar?.key === criterion.key &&
                        animatingStar?.star === starIndex;
                      const isShattering = shatteringStars.some(
                        (s) => s.key === criterion.key && s.star === starIndex
                      );

                      return (
                        <CriterionStarButton
                          key={starIndex}
                          criterionKey={criterion.key}
                          criterionTitle={criterion.title}
                          starIndex={starIndex}
                          currentRating={currentRating}
                          hovered={hovered}
                          isDirectlyClicked={isDirectlyClicked}
                          isShattering={isShattering}
                          onRate={handleRate}
                          onHover={(key, score) =>
                            setHoveredStars((prev) => ({
                              ...prev,
                              [key]: score,
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Inline Error Message */}
              {criterionError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-2 pt-1.5 border-t border-red-200/70">
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
