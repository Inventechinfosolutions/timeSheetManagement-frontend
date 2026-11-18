import React, { useState, useRef, useEffect } from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { Star, AlertCircle } from "lucide-react";
import {
  animateStarPop,
  animateStarHover,
  animateStarHoverLeave,
  animateShatteringStar,
} from "../../../animations/appraisalAnimations";
import "../AppraisalDashboard.css";

interface Criterion {
  key: string;
  descKey: keyof ReviewFormData;
  title: string;
}

const CRITERIA: Criterion[] = [
  { key: "communication", descKey: "communicationDescription", title: "Communication & Coordination" },
  { key: "ownership", descKey: "ownershipDescription", title: "Ownership" },
  { key: "collaboration", descKey: "collaborationDescription", title: "Collaboration" },
  { key: "problemSolving", descKey: "problemSolvingDescription", title: "Problem Solving" },
  { key: "leadership", descKey: "leadershipDescription", title: "Leadership" },
  { key: "adaptability", descKey: "adaptabilityDescription", title: "Adaptability" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Developing",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding",
};

interface TeamworkFieldConfig {
  key: "teamCollaborationSummary" | "crossTeamContributions" | "knowledgeSharingMentoring" | "teamworkExamples";
  containerId: string;
  inputId: string;
  label: string;
  placeholder: string;
}

const TEAMWORK_FIELD_CONFIGS: readonly TeamworkFieldConfig[] = [
  {
    key: "teamCollaborationSummary",
    containerId: "field-teamCollaborationSummary",
    inputId: "input-team-collab-summary",
    label: "Team Collaboration Summary",
    placeholder: "Collaboration within core and cross-functional teams...",
  },
  {
    key: "crossTeamContributions",
    containerId: "field-crossTeamContributions",
    inputId: "input-cross-team-contributions",
    label: "Cross-Team Contributions",
    placeholder: "Cross-functional initiatives, dependencies, and contributions...",
  },
  {
    key: "knowledgeSharingMentoring",
    containerId: "field-knowledgeSharingMentoring",
    inputId: "input-knowledge-sharing",
    label: "Knowledge Sharing / Mentoring",
    placeholder: "Mentoring given or received, documentation, and sharing sessions...",
  },
  {
    key: "teamworkExamples",
    containerId: "field-teamworkExamples",
    inputId: "input-teamwork-examples",
    label: "Teamwork Examples",
    placeholder: "Examples of teamwork, peer assistance, or collective problem-solving...",
  },
] as const;

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

export const TeamContributionStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  readOnly,
}) => {
  const ratings = formData.teamRatings || {};
  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});
  const [animatingStar, setAnimatingStar] = useState<{ key: string; star: number } | null>(null);
  const [shatteringStars, setShatteringStars] = useState<ShatteringStarItem[]>([]);
  const formatDraft = (score: number) => {
    if (score <= 0) return "";
    const n = Number(Number(score).toFixed(1));
    return Number.isInteger(n) ? String(n) : String(n);
  };

  const [ratingDrafts, setRatingDrafts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    CRITERIA.forEach((c) => {
      const v = (ratings as Record<string, number>)[c.key] || 0;
      init[c.key] = formatDraft(v);
    });
    return init;
  });

  const applyCriterionRating = (
    criterionKey: string,
    score: number,
    syncDraft = true,
  ) => {
    const clamped = Math.max(0, Math.min(5, score));
    const normalized = clamped <= 0 ? 0 : Number(Number(clamped).toFixed(1));
    onChange("teamRatings" as any, {
      ...ratings,
      [criterionKey]: normalized,
    });
    if (normalized > 0 && clearError) clearError(criterionKey);
    if (syncDraft) {
      setRatingDrafts((prev) => ({
        ...prev,
        [criterionKey]: formatDraft(normalized),
      }));
    }
  };

  const handleRate = (criterionKey: string, score: number) => {
    const currentScore = (ratings as Record<string, number>)[criterionKey] || 0;
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

    applyCriterionRating(criterionKey, finalScore);
  };

  const handleCriterionInputChange = (criterionKey: string, text: string) => {
    if (readOnly) return;
    if (text === "") {
      setRatingDrafts((prev) => ({ ...prev, [criterionKey]: "" }));
      applyCriterionRating(criterionKey, 0, false);
      return;
    }
    if (!/^\d{0,1}(\.\d{0,1})?$/.test(text)) return;
    if (text === ".") return;
    const parsed = parseFloat(text);
    if (!Number.isNaN(parsed) && parsed > 5) return;

    setRatingDrafts((prev) => ({ ...prev, [criterionKey]: text }));
    if (text.endsWith(".")) return;
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 5) {
      applyCriterionRating(criterionKey, parsed, false);
    }
  };

  const handleCriterionInputBlur = (criterionKey: string) => {
    if (readOnly) return;
    const raw = (ratingDrafts[criterionKey] || "").trim();
    if (!raw || raw === ".") {
      applyCriterionRating(criterionKey, 0);
      return;
    }
    const parsed = parseFloat(raw);
    const current = (ratings as Record<string, number>)[criterionKey] || 0;
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 5) {
      setRatingDrafts((prev) => ({
        ...prev,
        [criterionKey]: formatDraft(current),
      }));
      return;
    }
    applyCriterionRating(criterionKey, parsed);
  };

  return (
    <div className="space-y-3">
      {/* Step Header */}
      <div>
        <h3 className="text-[1.24rem] font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 3: Teamwork & Collaboration</span>{" "}
          <span className="text-red-500">*</span>
        </h3>
      </div>

      {/* 1. TOP SECTION: Evaluated Teamwork Dimensions (6 Dimensions, Rating 1-5) */}
      <div className="space-y-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1">
          Teamwork & Collaboration Dimensions (Rating 1–5) <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {CRITERIA.map((criterion) => {
            const currentRating = ratings[criterion.key as keyof typeof ratings] || 0;
            const hovered = hoveredStars[criterion.key] || 0;
            const isSelected = currentRating > 0;
            const criterionError = errors?.[criterion.key];
            const descError = errors?.[criterion.descKey];

            return (
              <div
                key={criterion.key}
                id={`field-criterion-${criterion.key}`}
                className={`p-4 rounded-2xl border transition-all duration-300 bg-white flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm ${
                  criterionError || descError
                    ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
                    : isSelected
                    ? "border-blue-200/90 hover:border-blue-300"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Top Row: Title & Star Ratings (No icon, no score badge) */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] leading-snug">
                      {criterion.title}
                    </span>
                    <span className="text-red-500 font-bold text-xs">*</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
                            hovered={readOnly ? 0 : hovered}
                            isDirectlyClicked={isDirectlyClicked}
                            isShattering={isShattering}
                            onRate={readOnly ? () => {} : handleRate}
                            onHover={
                              readOnly
                                ? () => {}
                                : (key, score) =>
                                    setHoveredStars((prev) => ({
                                      ...prev,
                                      [key]: score,
                                    }))
                            }
                          />
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      disabled={readOnly}
                      readOnly={readOnly}
                      maxLength={3}
                      value={
                        !readOnly && hovered > 0
                          ? String(hovered)
                          : ratingDrafts[criterion.key] ?? ""
                      }
                      onChange={(e) =>
                        handleCriterionInputChange(criterion.key, e.target.value)
                      }
                      onBlur={() => handleCriterionInputBlur(criterion.key)}
                      onFocus={readOnly ? undefined : (e) => e.target.select()}
                      title={
                        readOnly
                          ? "View only"
                          : "Type rating 1–5 (decimals OK) or click stars"
                      }
                      aria-label={`Enter rating for ${criterion.title}`}
                      className={`w-14 h-7 text-center text-xs font-extrabold text-[#1D4ED8] bg-[#EFF6FF] border-[1.5px] border-[#BFDBFE] rounded-lg outline-none transition-all ${
                        readOnly
                          ? "opacity-70 cursor-default"
                          : "hover:bg-[#DBEAFE] hover:border-[#93C5FD] focus:bg-white focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/30 cursor-text"
                      }`}
                    />
                    <span className="text-[10px] font-bold text-[#475569] whitespace-nowrap">
                      / 5
                    </span>
                  </div>
                </div>

                {criterionError && (
                  <p className="w-full text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{criterionError}</span>
                  </p>
                )}

                {/* Description Textarea Field */}
                <div id={`field-desc-${criterion.key}`} className="space-y-1.5 pt-1 border-t border-slate-100">
                  <label
                    htmlFor={`input-desc-${criterion.key}`}
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A]"
                  >
                    {criterion.title} Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`input-desc-${criterion.key}`}
                    rows={2}
                    value={(formData[criterion.descKey] as string) || ""}
                    readOnly={readOnly}
                    onChange={(e) => onChange(criterion.descKey, e.target.value)}
                    className={`eval-textarea-field leading-relaxed text-sm font-normal ${
                      descError ? "eval-input-error" : ""
                    } ${readOnly ? "eval-textarea-readonly" : ""}`}
                  />
                  {descError && (
                    <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                      <span>{descError}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BOTTOM SECTION: 4 Plain Textareas driven by structured config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 items-start">
        {TEAMWORK_FIELD_CONFIGS.map((field) => (
          <div key={field.key} id={field.containerId} className="flex flex-col space-y-2 scroll-mt-24">
            <label
              htmlFor={field.inputId}
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-1"
            >
              {field.label}
            </label>
            <textarea
              id={field.inputId}
              rows={4}
              value={formData[field.key] || ""}
              readOnly={readOnly}
              onChange={(e) => {
                onChange(field.key, e.target.value);
                if (clearError) clearError(field.key);
              }}
              className={`eval-textarea-field leading-relaxed text-sm font-normal ${readOnly ? "eval-textarea-readonly" : ""}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamContributionStep;
