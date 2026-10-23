import React, { useState, useRef, useEffect } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import {
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
  { key: "communication", title: "Communication & Coordination" },
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

  const criterion = CRITERIA[0];
  const currentRating = ratings[criterion.key as keyof typeof ratings] || 0;
  const hovered = hoveredStars[criterion.key] || 0;
  const isSelected = currentRating > 0;
  const criterionError = errors?.[criterion.key];

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
          Detail your team collaboration, cross-team contributions, knowledge sharing, and rate your communication.
        </p>
      </div>

      {/* Side-by-Side 2-Column Grid for the 4 Teamwork Text Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Collaboration Summary */}
        <div id="field-teamCollaborationSummary" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-team-collab-summary"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            Team Collaboration Summary
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-team-collab-summary")?.focus()}
          >
            <textarea
              id="input-team-collab-summary"
              rows={4}
              value={formData.teamCollaborationSummary || ""}
              onChange={(e) => {
                onChange("teamCollaborationSummary", e.target.value);
                if (clearError) clearError("teamCollaborationSummary");
              }}
              placeholder="Summarize your overall collaboration within your core team and cross-functional teams..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
            />
          </div>
        </div>

        {/* Cross-Team Contributions */}
        <div id="field-crossTeamContributions" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-cross-team-contributions"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            Cross-Team Contributions
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-cross-team-contributions")?.focus()}
          >
            <textarea
              id="input-cross-team-contributions"
              rows={4}
              value={formData.crossTeamContributions || ""}
              onChange={(e) => {
                onChange("crossTeamContributions", e.target.value);
                if (clearError) clearError("crossTeamContributions");
              }}
              placeholder="Highlight cross-functional initiatives, dependencies resolved, or collaboration across departments..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
            />
          </div>
        </div>

        {/* Knowledge Sharing / Mentoring */}
        <div id="field-knowledgeSharingMentoring" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-knowledge-sharing"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            Knowledge Sharing / Mentoring
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-knowledge-sharing")?.focus()}
          >
            <textarea
              id="input-knowledge-sharing"
              rows={4}
              value={formData.knowledgeSharingMentoring || ""}
              onChange={(e) => {
                onChange("knowledgeSharingMentoring", e.target.value);
                if (clearError) clearError("knowledgeSharingMentoring");
              }}
              placeholder="Describe any mentoring given or received, documentation authored, or knowledge sharing sessions held..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
            />
          </div>
        </div>

        {/* Teamwork Examples */}
        <div id="field-teamworkExamples" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-teamwork-examples"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            Teamwork Examples
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-teamwork-examples")?.focus()}
          >
            <textarea
              id="input-teamwork-examples"
              rows={4}
              value={formData.teamworkExamples || ""}
              onChange={(e) => {
                onChange("teamworkExamples", e.target.value);
                if (clearError) clearError("teamworkExamples");
              }}
              placeholder="Provide specific examples demonstrating teamwork, assisting peers under deadlines, or collective problem-solving..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1"
            />
          </div>
        </div>
      </div>

      {/* Communication & Coordination (Rating 1–5): Placed below the 4 teamwork cards */}
      <div className="space-y-1.5 flex flex-col">
        <label
          htmlFor="field-criterion-communication"
          className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
        >
          Communication & Coordination (Rating 1–5) <span className="text-red-500">*</span>
        </label>
        <div
          id="field-criterion-communication"
          className={`eval-step-card !py-3 !px-4 flex flex-wrap items-center justify-between gap-3 transition-all duration-300 ${
            criterionError
              ? "eval-field-has-error"
              : isSelected
              ? "!border-blue-500/60 shadow-sm"
              : "!border-blue-200/60"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />}
            <span className="text-xs sm:text-sm font-semibold text-[#0F172A] truncate">
              Rate your communication and coordination with teammates & stakeholders
            </span>
            {isSelected && (
              <span className="hidden sm:inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 ml-2">
                {RATING_LABELS[currentRating]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Star Rating Buttons */}
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
              <span className="text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs whitespace-nowrap">
                {currentRating}.0 / 5.0
              </span>
            )}
          </div>
        </div>

        {criterionError && (
          <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{criterionError}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamContributionStep;
