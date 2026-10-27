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
import "../AppraisalDashboard.css";
import { renderAnimatedEmojiIcon } from "./CompanyEnvironmentStep";

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

  // Step data presence checks (to display ONLY entered steps in View Mode)
  const hasStep1Data = Boolean(
    (formData.overallPerformanceSummary || "").trim() ||
    (formData.keyHighlights || "").trim() ||
    (formData.majorContributions || "").trim() ||
    (formData.areasForImprovement || "").trim() ||
    ((formData.overview || formData.roleSummary || "").trim() && !(formData.overview || formData.roleSummary || "").trim().startsWith("{"))
  );

  const hasStep2Data = Boolean(
    ((formData.projects || []).length > 0 &&
      formData.projects!.some(
        (p) =>
          Boolean(p.projectName?.trim()) ||
          Boolean(p.description?.trim()) ||
          Boolean(p.keyResponsibilities?.trim()) ||
          Boolean(p.challengesFaced?.trim()) ||
          Boolean(p.challenge?.trim()) ||
          Boolean(p.solutionsImplemented?.trim()) ||
          Boolean(p.keyAchievementsOutcomes?.trim()) ||
          Boolean(p.leadershipQualities?.trim()) ||
          Boolean(p.clientReviewFeedback?.trim()) ||
          (p.technologiesUsed && p.technologiesUsed.length > 0) ||
          (p.attachments && p.attachments.length > 0)
      )) ||
    Boolean(formData.projectName?.trim()) ||
    Boolean(formData.projectTitle?.trim()) ||
    Boolean(formData.projectDescription?.trim()) ||
    Boolean(formData.majorAchievements?.trim())
  );

  const hasStep3Data = Boolean(
    (formData.teamRatings && Object.values(formData.teamRatings).some((v) => typeof v === "number" && v > 0)) ||
    TEAM_CRITERIA.some((c) => Boolean((formData[c.descKey] as string)?.trim())) ||
    Boolean(formData.teamCollaborationSummary?.trim()) ||
    Boolean(formData.crossTeamContributions?.trim()) ||
    Boolean(formData.knowledgeSharingMentoring?.trim()) ||
    Boolean(formData.teamworkExamples?.trim())
  );

  const hasStep4Data = Boolean(
    Boolean(formData.skillsAcquired?.trim()) ||
    Boolean(formData.certificationsOrCourses?.trim()) ||
    Boolean(formData.skillsToImprove?.trim()) ||
    Boolean(formData.supportOrTrainingRequired?.trim()) ||
    Boolean(formData.nextQuarterLearningGoals?.trim()) ||
    Boolean(formData.learningGoals?.trim()) ||
    (formData.learningGoalItems || []).some((g) => g.trim().length > 0)
  );

  const hasStep5Data = Boolean(
    (formData.companyEnvironmentRating && formData.companyEnvironmentRating > 0) ||
    (formData.toolingAndResourcesRating && formData.toolingAndResourcesRating > 0) ||
    (formData.managementSupportRating && formData.managementSupportRating > 0) ||
    Boolean(formData.rateCompanyEnvironment) ||
    Boolean(formData.challengesAffectingProductivity?.trim()) ||
    Boolean(formData.suggestionsForImprovement?.trim()) ||
    Boolean(formData.workCultureFeedback?.trim()) ||
    Boolean(formData.workLifeBalance?.trim())
  );

  const hasStep6Data = Boolean(
    (formData.overallSelfRating && formData.overallSelfRating > 0) ||
    Boolean(formData.overallEmployeeComments?.trim()) ||
    Boolean(formData.careerGrowthInterests?.trim()) ||
    Boolean(formData.confirmationAccepted)
  );

  const hasAnyStepEntered =
    hasStep1Data ||
    hasStep2Data ||
    hasStep3Data ||
    hasStep4Data ||
    hasStep5Data ||
    hasStep6Data;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Step Header: hidden in view mode */}
      {!readOnly && (
        <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          <div id="review-assignment-details" className="eval-step-card eval-reveal-card is-revealed space-y-3.5 border border-[#E2E8F0] hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl bg-white transition-all duration-300">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold">
                ℹ
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Assignment & Instructions
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Assigned Quarter
                </label>
                <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                  {assignment.quarter} · {assignment.financialYear}
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Assigned Date
                </label>
                <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                  {assignment.assignedDate || "—"}
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Deadline
                </label>
                <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                  {assignment.deadline || "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Manager Instructions
              </label>
              <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px]">
                {assignment.description?.trim() || "No instructions provided."}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 1: ROLE & QUARTER OVERVIEW
           =================================================================== */}
        {(!readOnly || hasStep1Data) && (
          <div id="review-step-1" className="eval-step-card eval-reveal-card is-revealed space-y-3 border border-[#E2E8F0] hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl bg-white transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
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
            <div className="text-xs text-[#64748B] font-medium bg-white p-3 rounded-lg border border-[#CBD5E1]">
              Review Period: <strong className="text-[#0F172A] font-semibold">{reviewPeriodStart}</strong> to <strong className="text-[#0F172A] font-semibold">{reviewPeriodEnd}</strong>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Overall Performance Summary
                </label>
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                  {formData.overallPerformanceSummary || formData.overview || "—"}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Key Highlights
                </label>
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                  {formData.keyHighlights || "—"}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Major Contributions
                </label>
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                  {formData.majorContributions || "—"}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Areas for Improvement
                </label>
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                  {formData.areasForImprovement || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ===================================================================
            STEP 2: KEY ACHIEVEMENTS & PROJECTS
           =================================================================== */}
        {(!readOnly || hasStep2Data) && (
          <div id="review-step-2" className="eval-step-card eval-reveal-card is-revealed space-y-3.5 border border-[#E2E8F0] hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl bg-white transition-all duration-300">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
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
                  <h4 className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                    —
                  </h4>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Project Name
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                        —
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Project Role
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                        —
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Responsibility Type
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Project Description
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                        —
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Key Responsibilities
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Challenges Faced
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                        —
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Solutions Implemented
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Key Achievements / Outcomes
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                        —
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Technologies / Tools Used
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] font-normal min-h-[44px] flex items-center flex-1">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Leadership Qualities
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                        —
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Client Review & Feedback
                      </label>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                        —
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                      Attachments
                    </label>
                    <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] font-normal min-h-[44px] flex items-center">
                      —
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#64748B]">
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
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Project Name
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                              {project.projectName || "—"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Project Role
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                              {project.projectRole || "—"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Responsibility Type
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] min-h-[44px] flex items-center">
                              {project.responsibilityType || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Project Description
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                              {project.description || "—"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Key Responsibilities
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                              {project.keyResponsibilities || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Challenges Faced
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                              {project.challengesFaced || project.challenge || "—"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Solutions Implemented
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                              {project.solutionsImplemented || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Key Achievements / Outcomes
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                              {project.keyAchievementsOutcomes || "—"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Technologies / Tools Used
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg min-h-[44px] flex items-center flex-1">
                              {(project.technologiesUsed || []).length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
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
                                <div className="text-sm text-[#0F172A] font-normal">
                                  —
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Leadership Qualities
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                              {project.leadershipQualities || "—"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                              Client Review & Feedback
                            </label>
                            <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                              {project.clientReviewFeedback || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                            Attachments
                          </label>
                          <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg min-h-[44px] flex items-center">
                            {(project.attachments || []).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {project.attachments!.map((file) => (
                                  <AttachmentItem
                                    key={file.objectKey || file.fileName}
                                    file={file}
                                    readOnly
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-[#0F172A] font-normal">
                                —
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* ===================================================================
            STEP 3: TEAMWORK & COLLABORATION
           =================================================================== */}
        {(!readOnly || hasStep3Data) && (
          <div id="review-step-3" className="eval-step-card eval-reveal-card is-revealed space-y-3.5 border border-[#E2E8F0] hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl bg-white transition-all duration-300">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
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
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
              Teamwork &amp; Collaboration Dimensions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEAM_CRITERIA.map((criterion) => {
                const score = teamRatings[criterion.key as keyof typeof teamRatings] || 0;
                const desc = (formData[criterion.descKey] as string) || "";
                return (
                  <div
                    key={criterion.key}
                    className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg flex flex-col justify-between gap-3"
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
                      <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                        Description
                      </span>
                      <div className="p-3 bg-white border border-[#CBD5E1] rounded-lg text-xs font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px]">
                        {desc || "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Teamwork Details in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 items-stretch">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Team Collaboration Summary
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.teamCollaborationSummary || "—"}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Cross-Team Contributions
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.crossTeamContributions || "—"}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Knowledge Sharing / Mentoring
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.knowledgeSharingMentoring || "—"}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Teamwork Examples
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.teamworkExamples || "—"}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ===================================================================
            STEP 4: CONTINUOUS LEARNING & GOALS
           =================================================================== */}
        {(!readOnly || hasStep4Data) && (
          <div id="review-step-4" className="eval-step-card eval-reveal-card is-revealed space-y-3 border border-[#E2E8F0] hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl bg-white transition-all duration-300">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 eval-stagger-item eval-stagger-3 items-stretch">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Skills Learned During This Period
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.skillsAcquired || "—"}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Training / Certifications Completed
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.certificationsOrCourses || "—"}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Skills to Improve
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.skillsToImprove || "—"}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Support or Training Required
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.supportOrTrainingRequired || "—"}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Learning Goals for Next Quarter
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px]">
                {formData.nextQuarterLearningGoals || "—"}
              </div>
            </div>

            {!formData.skillsAcquired && !formData.skillsToImprove && (formData.learningGoalItems || []).length > 0 && (
              <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-[#E2E8F0]">
                <label className="text-[11px] font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                  Previous Learning Goals
                </label>
                {(formData.learningGoalItems || []).map((goal, index) => (
                  <div key={`${goal}-${index}`} className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] leading-relaxed font-normal shadow-2xs">
                    {goal}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* ===================================================================
            STEP 5: ENVIRONMENT
           =================================================================== */}
        {(!readOnly || hasStep5Data) && (
          <div id="review-step-5" className="eval-step-card eval-reveal-card is-revealed space-y-3.5 border border-[#E2E8F0] hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl bg-white transition-all duration-300">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
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

                if (envScore > 0) {
                  return (
                    <div className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/80 shadow-2xs flex items-center gap-2 shrink-0 eval-stagger-item eval-stagger-2">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                        {renderAnimatedEmojiIcon(envScore, true)}
                      </div>
                      <span className="text-xs font-bold text-[#2563EB]">
                        {envInfo?.label || "Rated"} ({envScore}/5)
                      </span>
                    </div>
                  );
                }

                const scores = [
                  formData.companyEnvironmentRating,
                  formData.toolingAndResourcesRating,
                  formData.managementSupportRating,
                ].filter((s): s is number => Boolean(s && s > 0));

                const avgScore =
                  scores.length > 0
                    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
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

          {/* Environment Dimensions Rating Preview (Exact Image 2 Style) */}
          <div className="eval-stagger-item eval-stagger-3 space-y-2">
            <label className="text-[11px] font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
              Environment &amp; Support Dimensions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {[
                {
                  title: "Work Environment Satisfaction",
                  score: formData.companyEnvironmentRating || 0,
                },
                {
                  title: "Availability of Tools & Resources",
                  score: formData.toolingAndResourcesRating || 0,
                },
                {
                  title: "Manager Support",
                  score: formData.managementSupportRating || 0,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-[#CBD5E1] rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                >
                  <span className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-snug">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 transition-colors duration-150 ${s <= item.score
                              ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]"
                              : "fill-transparent text-gray-300"
                            }`}
                        />
                      ))}
                    </div>
                    {item.score > 0 && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200">
                        {item.score}.0
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Fields 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 items-stretch">
            {/* Feedback on Work Culture */}
            <div className="eval-stagger-item eval-stagger-3 flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Feedback on Work Culture
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.workCultureFeedback || formData.feedbackOnWorkCulture || "—"}
              </div>
            </div>

            {/* Work Life Balance */}
            <div className="eval-stagger-item eval-stagger-3 flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Work Life Balance
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.workLifeBalance || "—"}
              </div>
            </div>

            {/* Challenges Affecting Productivity */}
            <div className="eval-stagger-item eval-stagger-4 flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Challenges Affecting Productivity
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.challengesAffectingProductivity || "—"}
              </div>
            </div>

            {/* Suggestions for Improvement */}
            <div className="eval-stagger-item eval-stagger-4 flex flex-col">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Suggestions for Improvement
              </label>
              <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[44px] flex-1">
                {formData.suggestionsForImprovement || formData.toolingAndResources || "—"}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ===================================================================
            STEP 6: FINAL EVALUATION & SUBMISSION
           =================================================================== */}
        {(!readOnly || hasStep6Data) && (
          <div id="review-step-6" className="eval-step-card eval-reveal-card is-revealed space-y-5 border border-[#E2E8F0] hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl bg-white transition-all duration-300">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Overall Employee Comments (Optional) */}
            {readOnly ? (
              <div className="flex flex-col">
                <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                  Overall Employee Comments
                </label>
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[75px] flex-1">
                  {formData.overallEmployeeComments?.trim() || "—"}
                </div>
              </div>
            ) : (
              <div id="field-overallEmployeeComments" className="flex flex-col space-y-1.5 scroll-mt-24">
                <label
                  htmlFor="input-overallEmployeeComments"
                  className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-0.5"
                >
                  <span>Overall Employee Comments</span>
                </label>
                <textarea
                  id="input-overallEmployeeComments"
                  rows={4}
                  value={formData.overallEmployeeComments ?? ""}
                  onChange={(e) => handleTextChange("overallEmployeeComments", e.target.value)}
                  placeholder="Add any additional comments (optional)..."
                  className="eval-textarea-field leading-relaxed text-sm font-normal"
                />
              </div>
            )}

            {/* Career Growth Interests (Optional) */}
            {readOnly ? (
              <div className="flex flex-col">
                <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                  Career Growth Interests
                </label>
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-sm font-normal text-[#0F172A] leading-relaxed whitespace-pre-line break-words min-h-[75px] flex-1">
                  {formData.careerGrowthInterests?.trim() || "—"}
                </div>
              </div>
            ) : (
              <div id="field-careerGrowthInterests" className="flex flex-col space-y-1.5 scroll-mt-24">
                <label
                  htmlFor="input-careerGrowthInterests"
                  className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-0.5"
                >
                  <span>Career Growth Interests</span>
                </label>
                <textarea
                  id="input-careerGrowthInterests"
                  rows={4}
                  value={formData.careerGrowthInterests ?? ""}
                  onChange={(e) => handleTextChange("careerGrowthInterests", e.target.value)}
                  placeholder="Detail your career growth ambitions (optional)..."
                  className="eval-textarea-field leading-relaxed text-sm font-normal"
                />
              </div>
            )}
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
        )}

        {readOnly && !hasAnyStepEntered && (
          <div className="p-8 text-center bg-white border border-[#CBD5E1] rounded-2xl shadow-xs">
            <p className="text-sm font-semibold text-[#64748B]">No evaluation responses entered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewStep;
