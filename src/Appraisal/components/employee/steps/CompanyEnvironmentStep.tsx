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

const EMOJI_MOTION: Record<number, string> = {
  1: "env-emoji-shake",
  2: "env-emoji-droop",
  3: "env-emoji-breathe",
  4: "env-emoji-bounce",
  5: "env-emoji-spark",
};

/** Native system emoji — looks like real modern emoji (Segoe / Apple / Noto). */
export const renderAnimatedEmojiIcon = (id: number, isActive: boolean = true) => {
  const emoji = EMOJI_MAP[id] ?? EMOJI_MAP[5];
  const motion = EMOJI_MOTION[id] ?? EMOJI_MOTION[5];

  return (
    <span
      className={`env-emoji-face inline-flex items-center justify-center leading-none select-none transition-all duration-200 ${
        isActive ? `${motion} env-emoji-active` : ""
      }`}
      role="img"
      aria-label={RATING_OPTIONS.find((r) => r.id === id)?.label ?? "rating"}
    >
      {emoji}
    </span>
  );
};

export const renderEmojiIcon = (emoji: string) => (
  <span className="env-emoji-face inline-flex items-center justify-center leading-none select-none">
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
  const fillRatio = Math.max(0, Math.min(1, displayRating - (starIndex - 1)));
  const isFull = fillRatio >= 1;
  const isPartial = fillRatio > 0 && fillRatio < 1;

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
      <span className="relative inline-flex w-4 h-4 sm:w-5 sm:h-5">
        <Star className="absolute inset-0 w-full h-full text-gray-300 fill-transparent" />
        {(isFull || isPartial) && !isShattering && (
          <Star
            className="absolute inset-0 w-full h-full fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]"
            style={
              isPartial
                ? { clipPath: `inset(0 ${Math.round((1 - fillRatio) * 100)}% 0 0)` }
                : undefined
            }
          />
        )}
      </span>
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
  readOnly?: boolean;
  animatingStar: number | null;
  shatteringStars: number[];
  onRate: (criterionKey: string, score: number) => void;
  onScoreSet: (criterionKey: string, score: number) => void;
}

const EnvironmentRatingCard: React.FC<EnvironmentRatingCardProps> = ({
  id,
  criterionKey,
  title,
  value,
  error,
  readOnly,
  animatingStar,
  shatteringStars,
  onRate,
  onScoreSet,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const formatEnvDraft = (score: number) => {
    if (score <= 0) return "";
    const n = Number(Number(score).toFixed(1));
    return Number.isInteger(n) ? String(n) : String(n);
  };
  const [draft, setDraft] = useState(formatEnvDraft(value));
  const isSelected = value > 0;

  useEffect(() => {
    setDraft(formatEnvDraft(value));
  }, [value]);

  const handleInputChange = (text: string) => {
    if (readOnly) return;
    if (text === "") {
      setDraft("");
      onScoreSet(criterionKey, 0);
      return;
    }
    if (!/^\d{0,1}(\.\d{0,1})?$/.test(text)) return;
    if (text === ".") return;
    const parsed = parseFloat(text);
    if (!Number.isNaN(parsed) && parsed > 5) return;

    setDraft(text);
    if (text.endsWith(".")) return;
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 5) {
      onScoreSet(criterionKey, parsed);
    }
  };

  const handleInputBlur = () => {
    if (readOnly) return;
    const raw = draft.trim();
    if (!raw || raw === ".") {
      onScoreSet(criterionKey, 0);
      setDraft("");
      return;
    }
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 5) {
      setDraft(value > 0 ? String(value) : "");
      return;
    }
    const normalized = Number(Number(parsed).toFixed(1));
    onScoreSet(criterionKey, normalized);
    setDraft(Number.isInteger(normalized) ? String(normalized) : String(normalized));
  };

  return (
    <div
      id={id}
      className={`p-3 sm:py-3.5 sm:px-4 rounded-xl border-[1.5px] transition-all duration-300 bg-white flex flex-col justify-between gap-3 shadow-2xs ${
        error
          ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
          : isSelected
          ? "border-[#4318FF]/30 hover:border-[#4318FF]/50"
          : "border-[#E0E5F2] hover:border-[#4318FF]/25"
      }`}
    >
      {/* Top: Check Icon, Full Title, and Qualitative Badge */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {isSelected && (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4318FF] shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-[13px] font-bold text-[#2B3674] leading-snug">
            {title} <span className="text-red-500">*</span>
          </span>
        </div>
        {isSelected && (
          <span className="text-[11px] font-semibold text-[#4318FF] bg-[#F4F7FE] px-2 py-0.5 rounded-full border border-[#4318FF]/20 shrink-0 whitespace-nowrap">
            {RATING_LABELS[Math.round(value)] ||
              RATING_LABELS[Math.max(1, Math.min(5, Math.round(value)))]}
          </span>
        )}
      </div>

      {/* Bottom: stars + typeable 1–5 score */}
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
                hovered={readOnly ? 0 : hoveredStar}
                isDirectlyClicked={isDirectlyClicked}
                isShattering={isShattering}
                onRate={readOnly ? () => {} : onRate}
                onHover={readOnly ? () => {} : (_, score) => setHoveredStar(score)}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <input
            type="text"
            inputMode="decimal"
            disabled={readOnly}
            readOnly={readOnly}
            maxLength={3}
            value={!readOnly && hoveredStar > 0 ? String(hoveredStar) : draft}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onFocus={readOnly ? undefined : (e) => e.target.select()}
            title={readOnly ? "View only" : "Type rating 1–5 (decimals OK) or click stars"}
            aria-label={`Enter rating for ${title}`}
            className={`w-14 h-7 text-center text-xs font-extrabold text-[#4318FF] bg-[#F4F7FE] border-[1.5px] border-[#4318FF]/20 rounded-lg outline-none transition-all ${
              readOnly
                ? "opacity-70 cursor-default"
                : "hover:bg-[#EEF0FF] hover:border-[#4318FF]/40 focus:bg-white focus:border-[#4318FF] focus:ring-0 cursor-text"
            }`}
          />
          <span className="text-[10px] font-bold text-[#A3AED0] whitespace-nowrap">/ 5</span>
        </div>
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

  const applyRateField = (field: keyof ReviewFormData, score: number) => {
    if (readOnly) return;
    const clamped = Math.max(0, Math.min(5, score));
    const normalized = clamped <= 0 ? 0 : Number(Number(clamped).toFixed(1));
    onChange(field, normalized);
    if (normalized > 0 && clearError) clearError(field as string);
  };

  const handleRateField = (field: keyof ReviewFormData, score: number) => {
    if (readOnly) return;
    const currentScore = (formData[field] as number) || 0;
    let finalScore = score;
    const unselectedStars: number[] = [];

    if (currentScore === score) {
      finalScore = score - 1;
      unselectedStars.push(score);
    } else if (score < currentScore) {
      for (let s = score + 1; s <= Math.ceil(currentScore); s++) {
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

    applyRateField(field, finalScore);
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
    <div className="space-y-3">
      {/* Step Header */}
      <div>
        <h3 className="text-[1.24rem] font-bold">
          <span className="eval-title-anim">Step 5: Company &amp; Work Environment</span>
        </h3>
      </div>

      {/* 1. Rating Fields: 3 Cards Side-by-Side in Responsive Grid */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#2B3674] mb-3">
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
            readOnly={readOnly}
            animatingStar={animatingStars["companyEnvironmentRating"] ?? null}
            shatteringStars={shatteringStars
              .filter((s) => s.key === "companyEnvironmentRating")
              .map((s) => s.star)}
            onRate={(key, score) => handleRateField(key as keyof ReviewFormData, score)}
            onScoreSet={(key, score) => applyRateField(key as keyof ReviewFormData, score)}
          />

          {/* Field 2: Availability of Tools & Resources */}
          <EnvironmentRatingCard
            id="field-toolingAndResourcesRating"
            criterionKey="toolingAndResourcesRating"
            title="Availability of Tools & Resources"
            value={formData.toolingAndResourcesRating || 0}
            error={errors?.toolingAndResourcesRating}
            readOnly={readOnly}
            animatingStar={animatingStars["toolingAndResourcesRating"] ?? null}
            shatteringStars={shatteringStars
              .filter((s) => s.key === "toolingAndResourcesRating")
              .map((s) => s.star)}
            onRate={(key, score) => handleRateField(key as keyof ReviewFormData, score)}
            onScoreSet={(key, score) => applyRateField(key as keyof ReviewFormData, score)}
          />

          {/* Field 3: Manager Support */}
          <EnvironmentRatingCard
            id="field-managementSupportRating"
            criterionKey="managementSupportRating"
            title="Manager Support"
            value={formData.managementSupportRating || 0}
            error={errors?.managementSupportRating}
            readOnly={readOnly}
            animatingStar={animatingStars["managementSupportRating"] ?? null}
            shatteringStars={shatteringStars
              .filter((s) => s.key === "managementSupportRating")
              .map((s) => s.star)}
            onRate={(key, score) => handleRateField(key as keyof ReviewFormData, score)}
            onScoreSet={(key, score) => applyRateField(key as keyof ReviewFormData, score)}
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
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#2B3674] mb-1"
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
            placeholder=""
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-[#A3AED0] eval-placeholder-sm ${
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
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#2B3674] mb-1"
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
            placeholder=""
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-[#A3AED0] eval-placeholder-sm ${
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
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#2B3674] mb-1"
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
            placeholder=""
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-[#A3AED0] eval-placeholder-sm ${
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
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#2B3674] mb-1"
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
            placeholder=""
            className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-[#A3AED0] eval-placeholder-sm ${
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
            : "border-[#E0E5F2] hover:border-[#4318FF]/25"
        }`}
      >
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#2B3674]">
            Rate the Company Environment <span className="text-red-500">*</span>
          </label>
          {selectedRating > 0 ? (
            <span className="text-[11px] font-bold text-[#4318FF] flex items-center gap-1 animate-in fade-in duration-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4318FF]" />
              Selected: {RATING_OPTIONS.find((r) => r.id === selectedRating)?.label} ({selectedRating}/5)
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#A3AED0]">
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
                className={`group relative flex flex-col items-center justify-center gap-0.5 py-2 sm:py-2.5 px-1 rounded-xl border-[1.5px] transition-all duration-200 cursor-pointer focus:outline-none select-none ${
                  isSelected
                    ? "bg-[#F4F7FE] border-[#4318FF] shadow-sm shadow-[#4318FF]/15 z-10"
                    : isHovered
                    ? "bg-white border-[#868CFF] -translate-y-0.5"
                    : errors?.rateCompanyEnvironment
                    ? "bg-white/80 border-red-300 hover:border-red-400"
                    : "bg-white border-[#E0E5F2] hover:border-[#4318FF]/30"
                } ${readOnly ? "cursor-default" : ""}`}
              >
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full bg-[#4318FF] text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}

                <div
                  className={`relative flex items-center justify-center min-h-[2.25rem] sm:min-h-[2.5rem] transition-all duration-200 ${
                    isSelected || isHovered
                      ? "opacity-100 scale-105"
                      : "opacity-40 scale-95 group-hover:opacity-100 group-hover:scale-100"
                  } ${animatingId === item.id ? "emoji-btn-pop" : ""}`}
                >
                  {renderAnimatedEmojiIcon(item.id, isSelected || isHovered)}
                </div>

                <span
                  className={`text-[10px] sm:text-[11px] font-bold transition-all tracking-tight whitespace-nowrap text-center ${
                    isSelected
                      ? "text-[#4318FF] font-extrabold"
                      : "text-[#707EAE] group-hover:text-[#2B3674]"
                  }`}
                >
                  {item.label}
                </span>

                <div
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    isSelected ? "w-5 bg-[#4318FF]" : "w-0 bg-transparent"
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
