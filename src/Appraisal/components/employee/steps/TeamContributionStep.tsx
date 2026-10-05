import React, { useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Star, CheckCircle2 } from "lucide-react";
import { Card } from "../../../../components/ui";

interface Criterion {
  key: string;
  title: string;
}

const CRITERIA: Criterion[] = [
  { key: "crossCollaboration", title: "Cross-Department Collaboration" },
  { key: "communication", title: "Communication & Transparency" },
  { key: "mentorship", title: "Mentorship & Knowledge Sharing" },
  { key: "peerSupport", title: "Peer Support & Team Spirit" },
  { key: "reliability", title: "Reliability & Accountability" },
  { key: "initiative", title: "Adaptability & Initiative" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Needs Focus",
  2: "Developing",
  3: "Proficient",
  4: "Very Strong",
  5: "Exceptional",
};

export const TeamContributionStep: React.FC<StepProps> = ({ formData, onChange }) => {
  // Star rating is NOT default - starts undefined / 0 so user must choose
  const ratings = formData.teamRatings || {};
  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});
  const [animatingStar, setAnimatingStar] = useState<{ key: string; star: number } | null>(null);

  const handleRate = (criterionKey: string, score: number) => {
    setAnimatingStar({ key: criterionKey, star: score });
    setTimeout(() => setAnimatingStar(null), 550);

    const updated = {
      ...ratings,
      [criterionKey]: score,
    };
    onChange("teamRatings" as any, updated);

    // Sync human-readable summary
    const filledCount = Object.keys(updated).length;
    const avgScore = (Object.values(updated).reduce((a, b) => a + (b || 0), 0) / (filledCount || 1)).toFixed(1);
    const summaryText = `Teamwork evaluation: ${filledCount}/6 criteria rated (Avg score: ${avgScore}/5.0). ${
      formData.collaborationDetails && !formData.collaborationDetails.startsWith("Teamwork evaluation:")
        ? formData.collaborationDetails
        : ""
    }`.trim();
    onChange("collaborationDetails", summaryText);
  };

  const ratedCount = Object.values(ratings).filter((v) => (v || 0) > 0).length;
  const overallAvg = ratedCount > 0
    ? (Object.values(ratings).reduce((acc, curr) => acc + (curr || 0), 0) / ratedCount).toFixed(1)
    : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header with Progress Counter */}
      <div className="border-b border-[#99F6E4]/40 pb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
            Step 3: Teamwork & Collaboration <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-[#64748B]">Rate your teamwork performance across all 6 dimensions (all required).</p>
        </div>

        <div className="px-3 py-1 rounded-xl bg-white/80 border border-[#99F6E4]/60 shadow-xs flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#64748B] font-medium">Rated:</span>
          <span className="text-xs font-bold text-[#14B8A6]">{ratedCount}/6</span>
          {overallAvg && (
            <span className="ml-1 pl-2 border-l border-gray-200 text-xs font-extrabold text-[#05CD99] flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              {overallAvg}
            </span>
          )}
        </div>
      </div>

      {/* 6 Compact Criteria Rows in 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {CRITERIA.map((criterion) => {
          const currentRating = ratings[criterion.key as keyof typeof ratings] || 0;
          const hovered = hoveredStars[criterion.key] || 0;
          const activeDisplayScore = hovered || currentRating;
          const isSelected = currentRating > 0;

          return (
            <Card
              key={criterion.key}
              className={`py-2.5 px-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 ${
                isSelected
                  ? "bg-white/95 border-[#05CD99]/40 shadow-xs"
                  : "bg-white/80 border-[#99F6E4]/50 hover:bg-white hover:border-[#14B8A6]/40 shadow-xs"
              }`}
            >
              {/* Criterion Title */}
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#05CD99] shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-semibold text-[#0F172A] truncate">
                  {criterion.title}
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
                    const isFilled = (hovered || currentRating) >= starIndex;
                    const isDirectlyClicked =
                      animatingStar?.key === criterion.key &&
                      animatingStar?.star === starIndex;

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
                        className={`p-1 sm:p-1.5 rounded-lg transition-transform cursor-pointer focus:outline-none select-none star-jelly-hover ${
                          isDirectlyClicked ? "star-spin-pop" : isFilled ? "star-active-glow" : ""
                        }`}
                      >
                        <Star
                          className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
                            isFilled
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.75)]"
                              : "text-gray-300 fill-transparent hover:text-amber-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TeamContributionStep;
