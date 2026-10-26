import React, { useEffect, useRef, useState } from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { Star, Edit3, AlertCircle, CheckCircle2, ChevronDown, Calendar, FileText } from "lucide-react";
import { getQuarterPeriod } from "../../../utils/appraisalHelpers";
import { ENVIRONMENT_SCORES } from "../../../constants/appraisal.constants";
import {
  initScrollRevealCards,
  animateStarPop,
  animateStarHover,
  animateStarHoverLeave,
  animateShatteringStar,
} from "../../../animations/appraisalAnimations";
import AttachmentItem from "../../common/AttachmentItem";
import { renderAnimatedEmojiIcon } from "./CompanyEnvironmentStep";

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

const RATING_OPTIONS = [
  { id: 1, label: "Very Bad", emoji: "😡", enumVal: "VERY_BAD" },
  { id: 2, label: "Bad", emoji: "🙁", enumVal: "BAD" },
  { id: 3, label: "Neutral", emoji: "😐", enumVal: "NEUTRAL" },
  { id: 4, label: "Good", emoji: "😊", enumVal: "GOOD" },
  { id: 5, label: "Excellent", emoji: "🤩", enumVal: "EXCELLENT" },
] as const;

const TEAM_CRITERIA: { key: string; title: string; descKey: keyof ReviewFormData }[] = [
  { key: "communication", title: "Communication & Coordination", descKey: "communicationDescription" },
  { key: "ownership", title: "Ownership", descKey: "ownershipDescription" },
  { key: "collaboration", title: "Collaboration", descKey: "collaborationDescription" },
  { key: "problemSolving", title: "Problem Solving", descKey: "problemSolvingDescription" },
  { key: "leadership", title: "Leadership", descKey: "leadershipDescription" },
  { key: "adaptability", title: "Adaptability", descKey: "adaptabilityDescription" },
];

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
      <div className="absolute inset-0 flex items-center justify-center star-crack-left-el [clip-path:polygon(0%_0%,50%_0%,42%_35%,55%_62%,40%_100%,0%_100%)]">
        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center star-crack-right-el [clip-path:polygon(50%_0%,100%_0%,100%_100%,40%_100%,55%_62%,42%_35%)]">
        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center star-crack-flash-el pointer-events-none">
        <div className="w-0.5 h-4 bg-gradient-to-b from-amber-100 via-white to-amber-200 rotate-12 rounded-full shadow-[0_0_8px_#FFFBEB]" />
      </div>
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
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${isFilled && !isShattering
            ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]"
            : "text-gray-300 fill-transparent hover:text-[#F59E0B]"
          }`}
      />
      {isShattering && <ShatteringStar />}
    </button>
  );
};

export const ReviewStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  onEditStep,
  readOnly,
  assignment,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [animatingStar, setAnimatingStar] = useState<number | null>(null);
  const [shatteringStars, setShatteringStars] = useState<number[]>([]);

  const fallbackPeriod = getQuarterPeriod(assignment?.quarter, assignment?.financialYear);
  const reviewPeriodStart = formData.reviewPeriodStart || fallbackPeriod.start || "—";
  const reviewPeriodEnd = formData.reviewPeriodEnd || fallbackPeriod.end || "—";

  const teamRatings = formData.teamRatings || {};

  // Project Accordion state for Step 2 in Review: closed by default
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});

  const toggleProjectExpand = (index: number) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // GSAP Scroll-based reveal animation for review cards
  useEffect(() => {
    return initScrollRevealCards(containerRef.current);
  }, []);

  const handleRatingClick = (score: number) => {
    const currentScore = formData.overallSelfRating || 0;
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
      setAnimatingStar(score);
      setTimeout(() => setAnimatingStar(null), 550);
    }

    if (unselectedStars.length > 0) {
      setShatteringStars(unselectedStars);
      setTimeout(() => setShatteringStars([]), 480);
    }

    if (onChange) {
      onChange("overallSelfRating", finalScore);
    }
    if (clearError) {
      clearError("overallSelfRating");
    }
    const el = document.getElementById("field-overallSelfRating");
    if (el) {
      el.style.borderColor = "";
      el.style.boxShadow = "";
    }
  };

  const handleTextChange = (field: keyof ReviewFormData, val: string) => {
    if (onChange) {
      onChange(field, val);
      if (field === "overallEmployeeComments") {
        onChange("finalComments", val);
      }
    }
    if (clearError) {
      clearError(field as string);
    }
    const el = document.getElementById(`field-${field}`);
    if (el) {
      el.style.borderColor = "";
      el.style.boxShadow = "";
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onChange) {
      onChange("confirmationAccepted", checked);
    }
    if (clearError) {
      clearError("confirmationAccepted");
    }
    const el = document.getElementById("field-confirmationAccepted");
    if (el) {
      el.style.borderColor = "";
      el.style.boxShadow = "";
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Step Header: hidden in view mode */}
      {!readOnly && (
        <div className="border-b border-blue-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              <span className="eval-title-anim">Step 6: Review & Final Submission</span>
              <span className="eval-title-accent-line" />
            </h3>
            <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
              Review all responses from previous steps. You can use Edit on any section to make changes before final submission.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* ===================================================================
            ASSIGNMENT & MANAGER INSTRUCTIONS (View Mode / Review)
           =================================================================== */}
        {assignment && (
          <div id="review-assignment-details" className="eval-step-card eval-reveal-card eval-review-card-noborder is-revealed space-y-3.5 !border-none shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 border-b border-blue-100 pb-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold">
                ℹ
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Assignment & Instructions
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Assigned Quarter
                </label>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] shadow-2xs">
                  {assignment.quarter} · {assignment.financialYear}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Assigned Date
                </label>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] shadow-2xs">
                  {assignment.assignedDate || "—"}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Deadline
                </label>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] shadow-2xs">
                  {assignment.deadline || "—"}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Manager Instructions
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[50px] shadow-2xs">
                {assignment.description?.trim() || "No instructions provided."}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 1: ROLE & QUARTER OVERVIEW
           =================================================================== */}
        <div id="review-step-1" className="eval-step-card eval-reveal-card eval-review-card-noborder is-revealed space-y-3 !border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                1
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 1: Role & Quarter Overview
              </h4>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-2xs active:scale-95"
                title="Edit Step 1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="eval-stagger-item eval-stagger-3 space-y-3">
            <div className="text-xs text-[#64748B] font-medium bg-white p-2.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
              Review Period: <strong className="text-[#0F172A]">{reviewPeriodStart}</strong> to <strong className="text-[#0F172A]">{reviewPeriodEnd}</strong>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Overall Performance Summary
                </label>
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                  {formData.overallPerformanceSummary || formData.overview || "—"}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Key Highlights
                </label>
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                  {formData.keyHighlights || "—"}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Major Contributions
                </label>
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                  {formData.majorContributions || "—"}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Areas for Improvement
                </label>
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                  {formData.areasForImprovement || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 2: KEY ACHIEVEMENTS & PROJECTS
           =================================================================== */}
        <div id="review-step-2" className="eval-step-card eval-reveal-card eval-review-card-noborder is-revealed space-y-3.5 !border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                2
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 2: Key Achievements & Projects
              </h4>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(2)}
                className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-2xs active:scale-95"
                title="Edit Step 2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {(formData.projects || []).length === 0 ? (
            readOnly ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/60 border-b border-slate-100">
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                    Project 1
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    —
                  </h4>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Project Name
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] shadow-2xs">
                        —
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Project Role
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] shadow-2xs">
                        —
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Responsibility Type
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] shadow-2xs">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Project Description
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Key Responsibilities
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Challenges Faced
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Solutions Implemented
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Key Achievements / Outcomes
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Technologies / Tools Used
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Leadership Qualities
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Client Review & Feedback
                      </label>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                        —
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                      Attachments
                    </label>
                    <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium shadow-2xs">
                      —
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#64748B]">
                No project added.
              </div>
            )
          ) : (
            <div className="space-y-3">
              {(formData.projects || []).map((project, index) => {
                const isExpanded = readOnly ? (expandedProjects[index] !== false) : Boolean(expandedProjects[index]);
                return (
                  <div
                    key={`${project.projectName}-${index}`}
                    className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    {/* Collapsed/Expanded Accordion Header */}
                    <div
                      onClick={() => toggleProjectExpand(index)}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white hover:bg-slate-50/60 cursor-pointer select-none group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                          Project {index + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] leading-snug group-hover:text-[#2563EB] transition-colors">
                          {project.projectName || "—"}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {project.isDraft && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-300 rounded-md shadow-2xs mr-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Draft
                          </span>
                        )}

                        {/* Accordion Chevron */}
                        <div className="p-0.5 rounded-md text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-180 text-[#2563EB]" : ""
                              }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Accordion Content (Inner Details) */}
                    {isExpanded && (
                      <div className="p-4 pt-2 space-y-3 border-t border-slate-100 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Project Name
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] shadow-2xs">
                              {project.projectName || "—"}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Project Role
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] shadow-2xs">
                              {project.projectRole || "—"}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Responsibility Type
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] shadow-2xs">
                              {project.responsibilityType || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Project Description
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium min-h-[75px] shadow-2xs">
                              {project.description || "—"}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Key Responsibilities
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium min-h-[75px] shadow-2xs">
                              {project.keyResponsibilities || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Challenges Faced
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium min-h-[75px] shadow-2xs">
                              {project.challengesFaced || project.challenge || "—"}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Solutions Implemented
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium min-h-[75px] shadow-2xs">
                              {project.solutionsImplemented || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Key Achievements / Outcomes
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium min-h-[75px] shadow-2xs">
                              {project.keyAchievementsOutcomes || "—"}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Technologies / Tools Used
                            </label>
                            {(project.technologiesUsed || []).length > 0 ? (
                              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex flex-wrap gap-1.5 min-h-[75px] items-center shadow-2xs">
                                {project.technologiesUsed!.map((tech, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium min-h-[75px] shadow-2xs">
                                —
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Leadership Qualities
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium min-h-[75px] shadow-2xs">
                              {project.leadershipQualities || "—"}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                              Client Review & Feedback
                            </label>
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium min-h-[75px] shadow-2xs">
                              {project.clientReviewFeedback || "—"}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                            Attachments
                          </label>
                          {(project.attachments || []).length > 0 ? (
                            <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex flex-wrap gap-2 shadow-2xs">
                              {project.attachments!.map((file) => (
                                <AttachmentItem
                                  key={file.objectKey || file.fileName}
                                  file={file}
                                  readOnly
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium shadow-2xs">
                              —
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================================================================
            STEP 3: TEAMWORK & COLLABORATION
           ================================================================== */}
        <div id="review-step-3" className="eval-step-card eval-reveal-card eval-review-card-noborder is-revealed space-y-3.5 !border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                3
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 3: Teamwork & Collaboration
              </h4>
            </div>
            {(() => {
              const ratedCriteria = TEAM_CRITERIA.filter(
                (c) => (teamRatings[c.key as keyof typeof teamRatings] || 0) > 0
              );
              const avgScore =
                ratedCriteria.length > 0
                  ? (
                    ratedCriteria.reduce(
                      (sum, c) =>
                        sum + (teamRatings[c.key as keyof typeof teamRatings] || 0),
                      0
                    ) / ratedCriteria.length
                  ).toFixed(1)
                  : teamRatings.communication
                    ? `${teamRatings.communication}.0`
                    : null;

              return avgScore ? (
                <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border border-blue-200/80 shadow-2xs flex items-center gap-1.5 shrink-0 eval-stagger-item eval-stagger-2">
                  <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)] shrink-0" />
                  <span className="text-[11px] font-semibold text-[#64748B]">Average:</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0F172A]">
                    {avgScore}
                  </span>
                  <span className="text-[10px] font-bold text-[#94A3B8]">/ 5.0</span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Teamwork Dimensions Rating Preview (6 Dimensions) */}
          <div className="eval-stagger-item eval-stagger-3 space-y-2">
            <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
              Teamwork &amp; Collaboration Dimensions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEAM_CRITERIA.map((criterion) => {
                const score = teamRatings[criterion.key as keyof typeof teamRatings] || 0;
                const desc = (formData[criterion.descKey] as string) || "";
                return (
                  <div
                    key={criterion.key}
                    className="p-4 bg-white border border-[#CBD5E1] rounded-2xl flex flex-col justify-between gap-3 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-snug">
                        {criterion.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 transition-colors duration-150 ${s <= score
                                  ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]"
                                  : "fill-transparent text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        {score > 0 && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200">
                            {score}.0
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                        Description
                      </span>
                      <p className="text-xs text-[#334155] whitespace-pre-line leading-relaxed font-medium bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 min-h-[48px]">
                        {desc || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Teamwork Details in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Team Collaboration Summary
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium shadow-2xs">
                {formData.teamCollaborationSummary || "—"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Cross-Team Contributions
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium shadow-2xs">
                {formData.crossTeamContributions || "—"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Knowledge Sharing / Mentoring
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium shadow-2xs">
                {formData.knowledgeSharingMentoring || "—"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Teamwork Examples
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed font-medium shadow-2xs">
                {formData.teamworkExamples || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 4: CONTINUOUS LEARNING & GOALS
           =================================================================== */}
        <div id="review-step-4" className="eval-step-card eval-reveal-card eval-review-card-noborder is-revealed space-y-3 !border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                4
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 4: Continuous Learning & Goals
              </h4>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(4)}
                className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-2xs active:scale-95"
                title="Edit Step 4"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 eval-stagger-item eval-stagger-3">
            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Skills Learned During This Period
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[80px] shadow-2xs">
                {formData.skillsAcquired || "—"}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Training / Certifications Completed
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[80px] shadow-2xs">
                {formData.certificationsOrCourses || "—"}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Skills to Improve
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[80px] shadow-2xs">
                {formData.skillsToImprove || "—"}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Support or Training Required
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[80px] shadow-2xs">
                {formData.supportOrTrainingRequired || "—"}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Learning Goals for Next Quarter
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[70px] shadow-2xs">
                {formData.nextQuarterLearningGoals || "—"}
              </div>
            </div>

            {!formData.skillsAcquired && !formData.skillsToImprove && (formData.learningGoalItems || []).length > 0 && (
              <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-blue-100">
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Previous Learning Goals
                </label>
                {(formData.learningGoalItems || []).map((goal, index) => (
                  <div key={`${goal}-${index}`} className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed font-medium shadow-2xs">
                    {goal}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            STEP 5: ENVIRONMENT
           =================================================================== */}
        <div id="review-step-5" className="eval-step-card eval-reveal-card eval-review-card-noborder is-revealed space-y-3.5 !border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                5
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 5: Environment
              </h4>
            </div>
            <div className="flex items-center gap-2.5">
              {(() => {
                const envScore =
                  formData.rateCompanyEnvironment && ENVIRONMENT_SCORES[formData.rateCompanyEnvironment]
                    ? ENVIRONMENT_SCORES[formData.rateCompanyEnvironment]
                    : 0;
                const envInfo = RATING_OPTIONS.find((r) => r.id === envScore);

                return envScore > 0 ? (
                  <div className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/80 shadow-2xs flex items-center gap-2 shrink-0 eval-stagger-item eval-stagger-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                      {renderAnimatedEmojiIcon(envScore, true)}
                    </div>
                    <span className="text-xs font-bold text-[#2563EB]">
                      {envInfo?.label || "Rated"} ({envScore}/5)
                    </span>
                  </div>
                ) : null;
              })()}
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(5)}
                  className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-2xs active:scale-95"
                  title="Edit Step 5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Environment Ratings (Star Ratings) */}
          {(() => {
            const envCriteria = [
              {
                title: "Work Environment Satisfaction",
                value: formData.companyEnvironmentRating || 0,
              },
              {
                title: "Availability of Tools & Resources",
                value: formData.toolingAndResourcesRating || 0,
              },
              {
                title: "Manager Support",
                value: formData.managementSupportRating || 0,
              },
            ];
            const hasAnyRating = envCriteria.some((c) => c.value > 0);
            if (!hasAnyRating) return null;

            return (
              <div className="eval-stagger-item eval-stagger-3 space-y-2">
                <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Environment Ratings
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {envCriteria.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-[#CBD5E1] rounded-2xl flex flex-col justify-between gap-2 shadow-2xs"
                    >
                      <span className="text-xs font-semibold text-[#0F172A] leading-snug">
                        {item.title}
                      </span>
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= item.value
                                  ? "fill-[#F59E0B] text-[#F59E0B]"
                                  : "fill-transparent text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {item.value > 0 ? (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200">
                            {item.value}.0
                          </span>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}



          {/* Qualitative Text Areas Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Feedback on Work Culture */}
            <div className="eval-stagger-item eval-stagger-3">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Feedback on Work Culture
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                {formData.workCultureFeedback || formData.feedbackOnWorkCulture || "—"}
              </div>
            </div>

            {/* Work Life Balance */}
            <div className="eval-stagger-item eval-stagger-3">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Work Life Balance
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                {formData.workLifeBalance || "—"}
              </div>
            </div>

            {/* Challenges Affecting Productivity */}
            <div className="eval-stagger-item eval-stagger-4">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Challenges Affecting Productivity
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                {formData.challengesAffectingProductivity || "—"}
              </div>
            </div>

            {/* Suggestions for Improvement */}
            <div className="eval-stagger-item eval-stagger-4">
              <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                Suggestions for Improvement
              </label>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[75px] shadow-2xs">
                {formData.suggestionsForImprovement || formData.toolingAndResources || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 6: FINAL EVALUATION & SUBMISSION
           =================================================================== */}
        <div id="review-step-6" className="eval-step-card eval-reveal-card eval-review-card-noborder is-revealed space-y-5 !border-none shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-b from-white via-white to-blue-50/20">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                6
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 6: Final Review &amp; Confirmation
              </h4>
            </div>
            {formData.overallSelfRating > 0 && (
              <span className="text-xs font-bold text-[#2563EB] px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 flex items-center gap-1.5 eval-stagger-item eval-stagger-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Self-Rating: {formData.overallSelfRating}/5</span>
              </span>
            )}
          </div>

          {/* 1. Overall Self-Rating (Exact Image 2 Single-Row Pill Style) */}
          <div
            id="field-overallSelfRating"
            className={`p-3 sm:py-2.5 sm:px-3.5 rounded-2xl border-[1.5px] bg-white flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300 scroll-mt-24 ${(!formData.overallSelfRating || formData.overallSelfRating <= 0) && errors?.overallSelfRating
                ? "eval-field-has-error"
                : "border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
          >
            {/* Left: Checkmark, Title, and Qualitative Badge */}
            <div className="flex items-center gap-2 min-w-0">
              {formData.overallSelfRating > 0 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              )}
              <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] truncate">
                Overall Self-Rating <span className="text-red-500">*</span>
              </span>
              {formData.overallSelfRating > 0 && (
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 ml-1 shrink-0">
                  {RATING_LABELS[formData.overallSelfRating]}
                </span>
              )}
            </div>

            {/* Right: 5 Animated Star Buttons & 5.0 / 5.0 Score Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="flex items-center gap-0.5"
                onMouseLeave={readOnly ? undefined : () => setHoveredRating(0)}
              >
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isDirectlyClicked = animatingStar === starIndex;
                  const isShattering = shatteringStars.includes(starIndex);

                  return (
                    <CriterionStarButton
                      key={starIndex}
                      criterionKey="overallSelfRating"
                      criterionTitle="Overall Self-Rating"
                      starIndex={starIndex}
                      currentRating={formData.overallSelfRating}
                      hovered={readOnly ? 0 : hoveredRating}
                      isDirectlyClicked={isDirectlyClicked}
                      isShattering={isShattering}
                      onRate={readOnly ? () => { } : (_, score) => handleRatingClick(score)}
                      onHover={readOnly ? () => { } : (_, score) => setHoveredRating(score)}
                    />
                  );
                })}
              </div>

              {formData.overallSelfRating > 0 ? (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
                  {formData.overallSelfRating}.0 / 5.0
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400">Not rated</span>
              )}
            </div>

            {!readOnly && (!formData.overallSelfRating || formData.overallSelfRating <= 0) && errors?.overallSelfRating && (
              <p className="w-full text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errors.overallSelfRating}</span>
              </p>
            )}
          </div>

          {/* 2 & 3: Overall Employee Comments and Career Growth Interests (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Overall Employee Comments (Optional) */}
            <div id="field-overallEmployeeComments" className="flex flex-col space-y-1.5 scroll-mt-24">
              <label
                htmlFor="input-overallEmployeeComments"
                className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider"
              >
                <span>Overall Employee Comments</span>
              </label>
              {readOnly ? (
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[90px] shadow-2xs">
                  {formData.overallEmployeeComments?.trim() || formData.finalComments?.trim() || "—"}
                </div>
              ) : (
                <textarea
                  id="input-overallEmployeeComments"
                  rows={4}
                  value={formData.overallEmployeeComments ?? formData.finalComments ?? ""}
                  onChange={(e) => handleTextChange("overallEmployeeComments", e.target.value)}
                  placeholder="—"
                  className="w-full p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed font-medium flex-1 focus:outline-none focus:border-[#2563EB] focus:ring-0 transition-all resize-none shadow-2xs"
                />
              )}
            </div>

            {/* Career Growth Interests (Optional) */}
            <div id="field-careerGrowthInterests" className="flex flex-col space-y-1.5 scroll-mt-24">
              <label
                htmlFor="input-careerGrowthInterests"
                className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider"
              >
                <span>Career Growth Interests</span>
              </label>
              {readOnly ? (
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium min-h-[90px] shadow-2xs">
                  {formData.careerGrowthInterests?.trim() || "—"}
                </div>
              ) : (
                <textarea
                  id="input-careerGrowthInterests"
                  rows={4}
                  value={formData.careerGrowthInterests ?? ""}
                  onChange={(e) => handleTextChange("careerGrowthInterests", e.target.value)}
                  placeholder="—"
                  className="w-full p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] leading-relaxed font-medium flex-1 focus:outline-none focus:border-[#2563EB] focus:ring-0 transition-all resize-none shadow-2xs"
                />
              )}
            </div>
          </div>

          {/* 4. Confirmation Checkbox (Required) */}
          <div
            id="field-confirmationAccepted"
            className={`p-4 rounded-2xl border transition-all duration-200 scroll-mt-24 ${!readOnly && !formData.confirmationAccepted && errors?.confirmationAccepted
                ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
                : formData.confirmationAccepted
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-[#E2E8F0] bg-white shadow-2xs"
              }`}
          >
            <label className={`flex items-start gap-3 select-none ${readOnly ? "cursor-default" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                disabled={readOnly}
                checked={Boolean(formData.confirmationAccepted)}
                onChange={(e) => handleCheckboxChange(e.target.checked)}
                className={`mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 accent-[#2563EB] ${readOnly ? "cursor-default opacity-80" : "cursor-pointer"}`}
              />
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-snug block">
                  I confirm that all responses provided in this review are accurate and ready for submission. {!readOnly && <span className="text-red-500">*</span>}
                </span>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {formData.confirmationAccepted
                    ? "Confirmed and verified by employee upon submission."
                    : readOnly
                      ? "Draft review — pending final employee submission and confirmation."
                      : "Once submitted, this review will be forwarded to your reporting manager for evaluation and scoring."}
                </p>
              </div>
            </label>
            {!readOnly && !formData.confirmationAccepted && errors?.confirmationAccepted && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errors.confirmationAccepted}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
