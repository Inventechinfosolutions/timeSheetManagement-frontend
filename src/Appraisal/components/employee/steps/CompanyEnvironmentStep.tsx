import React, { useState, useRef, useEffect } from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { Star, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { ENVIRONMENT_SCORES } from "../../../constants/appraisal.constants";
import {
  animateStarPop,
  animateStarHover,
  animateStarHoverLeave,
  animateShatteringStar,
} from "../../../animations/appraisalAnimations";
import "../AppraisalDashboard.css";

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Developing",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding",
};

const RATING_OPTIONS = [
  { id: 1, label: "Very Bad", emoji: "😡", enumVal: "VERY_BAD" },
  { id: 2, label: "Bad", emoji: "🙁", enumVal: "BAD" },
  { id: 3, label: "Neutral", emoji: "😐", enumVal: "NEUTRAL" },
  { id: 4, label: "Good", emoji: "😊", enumVal: "GOOD" },
  { id: 5, label: "Excellent", emoji: "🤩", enumVal: "EXCELLENT" },
] as const;

const EMOJI_MAP: Record<number, string> = {
  1: "😡",
  2: "🙁",
  3: "😐",
  4: "😊",
  5: "🤩",
};

export const renderAnimatedEmojiIcon = (id: number, isActive: boolean = true) => {
  switch (id) {
    case 1:
      // 😡 Very Bad (Angry face with steam puffs & rage shake)
      return (
        <svg
          viewBox="0 0 44 44"
          className={`w-8 h-8 sm:w-9 sm:h-9 transition-transform ${
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
          className={`w-8 h-8 sm:w-9 sm:h-9 transition-transform ${
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
          className={`w-8 h-8 sm:w-9 sm:h-9 transition-transform ${
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
          className={`w-8 h-8 sm:w-9 sm:h-9 transition-transform ${
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
          className={`w-8 h-8 sm:w-9 sm:h-9 transition-transform ${
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

export const renderEmojiIcon = (emoji: string) => (
  <span className="text-2xl sm:text-3xl leading-none select-none inline-block">
    {emoji}
  </span>
);


interface ShatteringStarItem {
  key: string;
  star: number;
  id: number;
}

// GSAP Break-Apart Shattering Star Effect with Electric Crack Flash and Shards
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
        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]" />
      </div>

      {/* Right Cracked Half */}
      <div
        className="absolute inset-0 flex items-center justify-center star-crack-right-el [clip-path:polygon(50%_0%,100%_0%,100%_100%,40%_100%,55%_62%,42%_35%)]"
      >
        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]" />
      </div>

      {/* Electric Crack Flash */}
      <div className="absolute inset-0 flex items-center justify-center star-crack-flash-el pointer-events-none">
        <div className="w-0.5 h-4 bg-gradient-to-b from-amber-100 via-white to-amber-200 rotate-12 rounded-full shadow-[0_0_8px_#FFFBEB]" />
      </div>

      {/* Glowing Fragments Scattering Outward */}
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
      className="relative p-1 rounded-lg cursor-pointer focus:outline-none select-none overflow-visible"
    >
      <Star
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${
          isFilled && !isShattering
            ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]"
            : "text-gray-300 fill-transparent hover:text-[#F59E0B]"
        }`}
      />
      {isShattering && <ShatteringStar />}
    </button>
  );
};

interface EnvironmentRatingCardProps {
  id: string;
  criterionKey: string;
  title: string;
  value: number;
  error?: string;
  animatingStar: number | null;
  shatteringStars: number[];
  onRate: (criterionKey: string, score: number) => void;
}

const EnvironmentRatingCard: React.FC<EnvironmentRatingCardProps> = ({
  id,
  criterionKey,
  title,
  value,
  error,
  animatingStar,
  shatteringStars,
  onRate,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const isSelected = value > 0;

  return (
    <div
      id={id}
      className={`p-3 sm:py-3.5 sm:px-4 rounded-2xl border-[1.5px] transition-all duration-300 bg-white flex flex-col justify-between gap-3 shadow-2xs ${
        error
          ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
          : "border-[#E2E8F0] hover:border-[#CBD5E1]"
      }`}
    >
      {/* Top: Check Icon, Full Title, and Qualitative Badge */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {isSelected && (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] leading-snug">
            {title} <span className="text-red-500">*</span>
          </span>
        </div>
        {isSelected && (
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 shrink-0 whitespace-nowrap">
            {RATING_LABELS[value]}
          </span>
        )}
      </div>

      {/* Bottom: 5 Animated Star Buttons & Score Pill */}
      <div className="flex items-center justify-between gap-2 w-full pt-0.5">
        <div
          className="flex items-center gap-0.5"
          onMouseLeave={() => setHoveredStar(0)}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const isDirectlyClicked = animatingStar === starIndex;
            const isShattering = shatteringStars.includes(starIndex);

            return (
              <CriterionStarButton
                key={starIndex}
                criterionKey={criterionKey}
                criterionTitle={title}
                starIndex={starIndex}
                currentRating={value}
                hovered={hoveredStar}
                isDirectlyClicked={isDirectlyClicked}
                isShattering={isShattering}
                onRate={onRate}
                onHover={(_, score) => setHoveredStar(score)}
              />
            );
          })}
        </div>

        {value > 0 ? (
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
            {value}.0
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">1–5</span>
        )}
      </div>

      {error && (
        <p className="w-full text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
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
  readOnly,
}) => {
  const [animatingStars, setAnimatingStars] = useState<Record<string, number | null>>({});
  const [shatteringStars, setShatteringStars] = useState<ShatteringStarItem[]>([]);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [animatingId, setAnimatingId] = useState<number | null>(null);

  const selectedRating =
    formData.rateCompanyEnvironment && ENVIRONMENT_SCORES[formData.rateCompanyEnvironment]
      ? ENVIRONMENT_SCORES[formData.rateCompanyEnvironment]
      : 0;

  const handleRateField = (field: keyof ReviewFormData, score: number) => {
    if (readOnly) return;
    const currentScore = (formData[field] as number) || 0;
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
      setAnimatingStars((prev) => ({ ...prev, [field as string]: score }));
      setTimeout(
        () => setAnimatingStars((prev) => ({ ...prev, [field as string]: null })),
        550
      );
    }

    if (unselectedStars.length > 0) {
      const now = Date.now();
      const newItems: ShatteringStarItem[] = unselectedStars.map((starNum, idx) => ({
        key: field as string,
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

    onChange(field, finalScore);
    if (clearError) {
      clearError(field as string);
    }
  };

  const handleEmojiSelect = (item: (typeof RATING_OPTIONS)[number]) => {
    if (readOnly) return;
    setAnimatingId(item.id);
    setTimeout(() => setAnimatingId(null), 400);
    onChange("rateCompanyEnvironment", item.enumVal);
    if (clearError) {
      clearError("rateCompanyEnvironment");
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
      <div className="border-b border-[#E2E8F0] pb-3">
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 5: Company &amp; Work Environment</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Rate your experience across key workplace culture, collaboration, and environment factors.
        </p>
      </div>

      {/* 1. Rating Fields: 3 Cards Side-by-Side in Responsive Grid */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-3">
          Environment &amp; Support Ratings (Rating 1–5) <span className="text-red-500">*</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Field 1: Work Environment Satisfaction */}
          <EnvironmentRatingCard
            id="field-companyEnvironmentRating"
            criterionKey="companyEnvironmentRating"
            title="Work Environment Satisfaction"
            value={formData.companyEnvironmentRating || 0}
            error={errors?.companyEnvironmentRating}
            animatingStar={animatingStars["companyEnvironmentRating"] ?? null}
            shatteringStars={shatteringStars
              .filter((s) => s.key === "companyEnvironmentRating")
              .map((s) => s.star)}
            onRate={(key, score) => handleRateField(key as keyof ReviewFormData, score)}
          />

          {/* Field 2: Availability of Tools & Resources */}
          <EnvironmentRatingCard
            id="field-toolingAndResourcesRating"
            criterionKey="toolingAndResourcesRating"
            title="Availability of Tools & Resources"
            value={formData.toolingAndResourcesRating || 0}
            error={errors?.toolingAndResourcesRating}
            animatingStar={animatingStars["toolingAndResourcesRating"] ?? null}
            shatteringStars={shatteringStars
              .filter((s) => s.key === "toolingAndResourcesRating")
              .map((s) => s.star)}
            onRate={(key, score) => handleRateField(key as keyof ReviewFormData, score)}
          />

          {/* Field 3: Manager Support */}
          <EnvironmentRatingCard
            id="field-managementSupportRating"
            criterionKey="managementSupportRating"
            title="Manager Support"
            value={formData.managementSupportRating || 0}
            error={errors?.managementSupportRating}
            animatingStar={animatingStars["managementSupportRating"] ?? null}
            shatteringStars={shatteringStars
              .filter((s) => s.key === "managementSupportRating")
              .map((s) => s.star)}
            onRate={(key, score) => handleRateField(key as keyof ReviewFormData, score)}
          />
        </div>
      </div>

      {/* 2. Qualitative Feedback Textareas: 2x2 Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Field: Feedback on Work Culture */}
        <div
          id="field-workCultureFeedback"
          className="flex flex-col space-y-1.5 scroll-mt-24"
        >
          <label
            htmlFor="input-workCultureFeedback"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>Feedback on Work Culture</span> <span className="text-red-500">*</span>
          </label>
          <textarea
            id="input-workCultureFeedback"
            rows={4}
            value={formData.workCultureFeedback ?? ""}
            disabled={readOnly}
            readOnly={readOnly}
            onChange={(e) => handleTextChange("workCultureFeedback", e.target.value)}
            placeholder="Share your thoughts on the workplace culture, core values, and overall atmosphere..."
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm ${
              readOnly ? "eval-textarea-readonly" : ""
            } ${errors?.workCultureFeedback ? "eval-input-error" : ""}`}
          />
          {errors?.workCultureFeedback && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.workCultureFeedback}</span>
            </p>
          )}
        </div>

        {/* Field: Work Life Balance */}
        <div
          id="field-workLifeBalance"
          className="flex flex-col space-y-1.5 scroll-mt-24"
        >
          <label
            htmlFor="input-workLifeBalance"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>Work Life Balance</span> <span className="text-red-500">*</span>
          </label>
          <textarea
            id="input-workLifeBalance"
            rows={4}
            value={formData.workLifeBalance ?? ""}
            disabled={readOnly}
            readOnly={readOnly}
            onChange={(e) => handleTextChange("workLifeBalance", e.target.value)}
            placeholder="Share how well your workload, schedule, and personal commitments are balanced..."
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm ${
              readOnly ? "eval-textarea-readonly" : ""
            } ${errors?.workLifeBalance ? "eval-input-error" : ""}`}
          />
          {errors?.workLifeBalance && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.workLifeBalance}</span>
            </p>
          )}
        </div>

        {/* Field: Challenges Affecting Productivity */}
        <div
          id="field-challengesAffectingProductivity"
          className="flex flex-col space-y-1.5 scroll-mt-24"
        >
          <label
            htmlFor="input-challengesAffectingProductivity"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>Challenges Affecting Productivity</span>
          </label>
          <textarea
            id="input-challengesAffectingProductivity"
            rows={4}
            value={formData.challengesAffectingProductivity ?? ""}
            disabled={readOnly}
            readOnly={readOnly}
            onChange={(e) =>
              handleTextChange("challengesAffectingProductivity", e.target.value)
            }
            placeholder="Describe any obstacles, bottlenecks, or challenges affecting your productivity..."
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm ${
              readOnly ? "eval-textarea-readonly" : ""
            } ${errors?.challengesAffectingProductivity ? "eval-input-error" : ""}`}
          />
          {errors?.challengesAffectingProductivity && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.challengesAffectingProductivity}</span>
            </p>
          )}
        </div>

        {/* Field: Suggestions for Improvement */}
        <div
          id="field-suggestionsForImprovement"
          className="flex flex-col space-y-1.5 scroll-mt-24"
        >
          <label
            htmlFor="input-suggestionsForImprovement"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
          >
            <span>Suggestions for Improvement</span> <span className="text-red-500">*</span>
          </label>
          <textarea
            id="input-suggestionsForImprovement"
            rows={4}
            value={formData.suggestionsForImprovement ?? ""}
            disabled={readOnly}
            readOnly={readOnly}
            onChange={(e) =>
              handleTextChange("suggestionsForImprovement", e.target.value)
            }
            placeholder="Suggest ideas for tools, processes, training, or workplace improvement..."
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm ${
              readOnly ? "eval-textarea-readonly" : ""
            } ${errors?.suggestionsForImprovement ? "eval-input-error" : ""}`}
          />
          {errors?.suggestionsForImprovement && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.suggestionsForImprovement}</span>
            </p>
          )}
        </div>
      </div>

      {/* 3. Rate the Company Environment (Interactive Animated Emojis) */}
      <div
        id="field-rateCompanyEnvironment"
        className={`p-2.5 sm:px-4 sm:py-2 rounded-xl border-[1.5px] transition-all duration-300 bg-white space-y-1 shadow-2xs scroll-mt-24 ${
          errors?.rateCompanyEnvironment
            ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
            : "border-[#E2E8F0] hover:border-[#CBD5E1]"
        }`}
      >
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
            Rate the Company Environment <span className="text-red-500">*</span>
          </label>
          {selectedRating > 0 ? (
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
          className="grid grid-cols-5 gap-2 pt-0.5 select-none"
          onMouseLeave={() => setHoveredRating(null)}
        >
          {RATING_OPTIONS.map((item) => {
            const isSelected = selectedRating === item.id;
            const isHovered = hoveredRating === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={readOnly}
                onClick={() => handleEmojiSelect(item)}
                onMouseEnter={() => setHoveredRating(item.id)}
                className={`group relative flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-lg border-2 transition-all duration-200 cursor-pointer focus:outline-none select-none ${
                  isSelected
                    ? "bg-white border-[#2563EB] shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20 scale-[1.02] z-10"
                    : isHovered
                    ? "bg-white border-blue-300 shadow-xs -translate-y-0.5"
                    : errors?.rateCompanyEnvironment
                    ? "bg-white/80 border-red-300 hover:border-red-400"
                    : "bg-white/60 border-[#E2E8F0] hover:border-[#CBD5E1]"
                } ${readOnly ? "cursor-default" : ""}`}
              >
                {/* Selected Checkmark Badge on Top Right */}
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}

                {/* Animated Sentiment Emoji Icon */}
                <div
                  className={`relative flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "scale-105 drop-shadow-md filter-none opacity-100"
                      : isHovered
                      ? "scale-105 filter grayscale-[15%] opacity-90"
                      : "filter grayscale-[80%] opacity-45 group-hover:filter-none group-hover:opacity-100"
                  } ${animatingId === item.id ? "emoji-btn-pop" : ""}`}
                >
                  {renderAnimatedEmojiIcon(item.id, isSelected || isHovered)}
                </div>

                {/* Label */}
                <span
                  className={`mt-0.5 text-[10px] sm:text-[11px] font-bold transition-all tracking-tight whitespace-nowrap text-center ${
                    isSelected
                      ? "text-[#2563EB] font-extrabold scale-105"
                      : "text-[#64748B] group-hover:text-[#0F172A]"
                  }`}
                >
                  {item.label}
                </span>

                {/* Selected Indicator Pill */}
                <div
                  className={`mt-0.5 h-0.5 rounded-full transition-all duration-300 ${
                    isSelected ? "w-5 bg-[#2563EB]" : "w-0 bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {errors?.rateCompanyEnvironment && (
          <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errors.rateCompanyEnvironment}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default CompanyEnvironmentStep;
