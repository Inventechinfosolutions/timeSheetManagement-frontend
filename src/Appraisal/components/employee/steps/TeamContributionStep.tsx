import React, { useState, useRef, useEffect } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import {
  animateStarPop,
  animateStarHover,
  animateStarHoverLeave,
  animateShatteringStar,
} from "../../../animations/appraisalAnimations";
import "../AppraisalDashboard.css";

interface Criterion {
  key: string;
  title: string;
}

const CRITERIA: Criterion[] = [
  { key: "communication", title: "Communication & Coordination" },
  { key: "ownership", title: "Ownership" },
  { key: "collaboration", title: "Collaboration" },
  { key: "problemSolving", title: "Problem Solving" },
  { key: "leadership", title: "Leadership" },
  { key: "adaptability", title: "Adaptability" },
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
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-blue-100 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 3: Teamwork & Collaboration</span>{" "}
          <span className="text-red-500">*</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Rate your teamwork dimensions and detail your team collaboration, cross-team contributions, and knowledge sharing.
        </p>
      </div>

      {/* 1. TOP SECTION: Evaluated Teamwork Dimensions (6 Dimensions, Rating 1-5) */}
      <div className="space-y-3">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1">
          Teamwork & Collaboration Dimensions (Rating 1–5) <span className="text-red-500">*</span>
        </label>
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
                className={`p-3 sm:py-3 sm:px-3.5 rounded-2xl border-[1.5px] transition-all duration-300 bg-white flex flex-wrap items-center justify-between gap-2.5 shadow-2xs ${
                  criterionError
                    ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                  <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] leading-snug">
                    {criterion.title} <span className="text-red-500">*</span>
                  </span>
                  {isSelected && (
                    <span className="hidden sm:inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 ml-1">
                      {RATING_LABELS[currentRating]}
                    </span>
                  )}
                </div>

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

                  {currentRating > 0 && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
                      {currentRating}.0 / 5.0
                    </span>
                  )}
                </div>
                {criterionError && (
                  <p className="w-full text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{criterionError}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BOTTOM SECTION: 4 Plain Textareas driven by structured config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {TEAMWORK_FIELD_CONFIGS.map((field) => (
          <div key={field.key} id={field.containerId} className="flex flex-col space-y-2 scroll-mt-24">
            <label
              htmlFor={field.inputId}
              className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1"
            >
              {field.label}
            </label>
            <textarea
              id={field.inputId}
              rows={4}
              value={formData[field.key] || ""}
              disabled={readOnly}
              onChange={(e) => {
                onChange(field.key, e.target.value);
                if (clearError) clearError(field.key);
              }}
              placeholder={field.placeholder}
              className="eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamContributionStep;
