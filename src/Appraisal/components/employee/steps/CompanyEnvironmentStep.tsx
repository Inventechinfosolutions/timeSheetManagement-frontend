import React, { useState, useRef, useEffect } from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
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

interface EnvironmentFieldConfig {
  key: "challengesAffectingProductivity" | "suggestionsForImprovement";
  containerId: string;
  inputId: string;
  label: string;
  placeholder: string;
}

const ENVIRONMENT_FIELD_CONFIGS: readonly EnvironmentFieldConfig[] = [
  {
    key: "challengesAffectingProductivity",
    containerId: "field-challengesAffectingProductivity",
    inputId: "input-challengesAffectingProductivity",
    label: "Challenges Affecting Productivity",
    placeholder: "Obstacles, bottlenecks, or challenges affecting productivity...",
  },
  {
    key: "suggestionsForImprovement",
    containerId: "field-suggestionsForImprovement",
    inputId: "input-suggestionsForImprovement",
    label: "Suggestions for Improvement",
    placeholder: "Ideas for tools, processes, training, or improvements...",
  },
] as const;

export const CompanyEnvironmentStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  readOnly,
}) => {
  const [animatingStars, setAnimatingStars] = useState<Record<string, number | null>>({});
  const [shatteringStars, setShatteringStars] = useState<ShatteringStarItem[]>([]);

  const handleRateField = (field: keyof ReviewFormData, score: number) => {
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
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-3">
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

      {/* 2. Qualitative Feedback Textareas: Side-by-Side plain textareas driven by structured config */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ENVIRONMENT_FIELD_CONFIGS.map((field) => (
            <div
              key={field.key}
              id={field.containerId}
              className="flex flex-col space-y-1.5 scroll-mt-24"
            >
              <label
                htmlFor={field.inputId}
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1"
              >
                <span>{field.label}</span>
              </label>
              <textarea
                id={field.inputId}
                rows={4}
                value={formData[field.key] ?? ""}
                disabled={readOnly}
                onChange={(e) => handleTextChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyEnvironmentStep;
