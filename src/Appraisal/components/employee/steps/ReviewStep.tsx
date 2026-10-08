import React, { useEffect, useRef } from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Star } from "lucide-react";
import { initScrollRevealCards } from "../../../animations/appraisalAnimations";
import { renderAnimatedEmojiIcon } from "./CompanyEnvironmentStep";

const TEAM_CRITERIA = [
  { key: "communication", title: "Communication" },
  { key: "ownership", title: "Ownership" },
  { key: "collaboration", title: "Collaboration" },
  { key: "problemSolving", title: "Problem Solving" },
  { key: "leadership", title: "Leadership" },
  { key: "adaptability", title: "Adaptability" },
];

const ENVIRONMENT_RATINGS: Record<number, { label: string; emoji: string }> = {
  1: { label: "Very Bad", emoji: "😡" },
  2: { label: "Bad", emoji: "🙁" },
  3: { label: "Neutral", emoji: "😐" },
  4: { label: "Good", emoji: "😊" },
  5: { label: "Excellent", emoji: "🤩" },
};

export const ReviewStep: React.FC<StepProps> = ({ formData }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const teamRatings = formData.teamRatings || {};
  const ratedTeamKeys = Object.keys(teamRatings).filter((k) => (teamRatings[k as keyof typeof teamRatings] || 0) > 0);
  const avgTeamScore = ratedTeamKeys.length > 0
    ? (
        ratedTeamKeys.reduce((acc, k) => acc + (teamRatings[k as keyof typeof teamRatings] || 0), 0) /
        ratedTeamKeys.length
      ).toFixed(1)
    : null;

  const envRating = formData.companyEnvironmentRating || formData.managementSupportRating || 0;
  const envRatingInfo = ENVIRONMENT_RATINGS[envRating];

  // GSAP Scroll-based reveal animation for review cards
  useEffect(() => {
    return initScrollRevealCards(containerRef.current);
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-blue-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            <span className="eval-title-anim">Step 6: Review & Final Submission</span>
            <span className="eval-title-accent-line" />
          </h3>
          <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
            Review all responses from previous steps. This summary is strictly uneditable.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ===================================================================
            STEP 1: ROLE & QUARTER OVERVIEW
           =================================================================== */}
        <div className="eval-step-card eval-reveal-card is-revealed space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                1
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 1: Role & Quarter Overview
              </h4>
            </div>
          </div>

          <div className="eval-stagger-item eval-stagger-3">
            <label className="text-xs font-bold text-[#64748B] block mb-1.5 uppercase tracking-wider">
              Overview
            </label>
            <div className="p-3.5 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.overview || formData.roleSummary || "No overview provided."}
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 2: KEY ACHIEVEMENTS & PROJECTS
           =================================================================== */}
        <div className="eval-step-card eval-reveal-card is-revealed space-y-3.5">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                2
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 2: Key Achievements & Projects
              </h4>
            </div>
          </div>

          {(formData.projects || []).length === 0 ? (
            <div className="p-3 bg-white/80 border border-blue-200/60 rounded-xl text-sm text-[#64748B]">
              No project added.
            </div>
          ) : (
            <div className="space-y-3.5">
              {(formData.projects || []).map((project, index) => (
                <div key={`${project.title}-${index}`} className="space-y-2 p-3 bg-blue-50/20 border border-blue-100 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                      Project {index + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Project Title
                      </label>
                      <div className="p-3 bg-white border border-blue-200/60 rounded-xl text-sm font-bold text-[#0F172A]">
                        {project.title || "—"}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Project Description
                      </label>
                      <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line">
                        {project.description || "—"}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Challenge Overcome
                      </label>
                      <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line">
                        {project.challenge || "—"}
                        {(project.attachments || []).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-blue-100/70 flex flex-wrap gap-1.5">
                            {(project.attachments || []).map((file) => (
                              <span
                                key={file.objectKey || file.fileName}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md"
                              >
                                📎 {file.fileName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================================
            STEP 3: TEAMWORK & COLLABORATION
           =================================================================== */}
        <div className="eval-step-card eval-reveal-card is-revealed space-y-3.5">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                3
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 3: Teamwork & Collaboration
              </h4>
            </div>
            {avgTeamScore ? (
              <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border border-blue-200/80 shadow-2xs flex items-center gap-1.5 shrink-0 eval-stagger-item eval-stagger-2">
                <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)] shrink-0" />
                <span className="text-[11px] font-semibold text-[#64748B]">Average:</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#0F172A]">{avgTeamScore}</span>
                <span className="text-[10px] font-bold text-[#94A3B8]">/ 5.0</span>
              </div>
            ) : null}
          </div>

          {/* 6 Dimensions Rating Display */}
          <div className="eval-stagger-item eval-stagger-3">
            <label className="text-xs font-bold text-[#64748B] block mb-2 uppercase tracking-wider">
              Evaluated Teamwork Dimensions
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TEAM_CRITERIA.map((criterion) => {
                const score = teamRatings[criterion.key as keyof typeof teamRatings] || 0;
                return (
                  <div
                    key={criterion.key}
                    className="p-2.5 bg-white/80 border border-blue-100/80 rounded-xl flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-[#0F172A] truncate">
                      {criterion.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= score
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "fill-transparent text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 4: CONTINUOUS LEARNING & GOALS
           =================================================================== */}
        <div className="eval-step-card eval-reveal-card is-revealed space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                4
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 4: Continuous Learning & Goals
              </h4>
            </div>
          </div>

          <div className="eval-stagger-item eval-stagger-3">
            <label className="text-xs font-bold text-[#64748B] block mb-1.5 uppercase tracking-wider">
              Learning Goals
            </label>
            {(formData.learningGoalItems || []).length === 0 ? (
              <div className="p-3.5 bg-white/80 border border-blue-200/60 rounded-xl text-sm text-[#64748B]">
                No learning goals provided.
              </div>
            ) : (
              <div className="space-y-3">
                {(formData.learningGoalItems || []).map((goal, index) => (
                  <div key={`${goal}-${index}`} className="space-y-1">
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                      Goal {index + 1}
                    </span>
                    <div className="p-3.5 bg-white/80 border border-blue-200/60 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
                      {goal}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            STEP 5: COMPANY ENVIRONMENT
           =================================================================== */}
        <div className="eval-step-card eval-reveal-card is-revealed space-y-3.5">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold eval-stagger-item eval-stagger-1">
                5
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider eval-stagger-item eval-stagger-2">
                Step 5: Company Environment
              </h4>
            </div>
            {envRating > 0 && envRatingInfo ? (
              <span className="text-xs font-bold text-[#2563EB] px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 flex items-center gap-2 eval-stagger-item eval-stagger-2">
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  {renderAnimatedEmojiIcon(envRating, false)}
                </span>
                <span>{envRatingInfo.label} ({envRating}/5)</span>
              </span>
            ) : null}
          </div>

          {/* Feedback on Work Culture */}
          <div className="eval-stagger-item eval-stagger-3">
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Feedback on Work Culture
            </label>
            <div className="p-3.5 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.workCultureFeedback || "No feedback on work culture provided."}
            </div>
          </div>

          {/* Work Life Balance */}
          <div className="eval-stagger-item eval-stagger-3">
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Work Life Balance
            </label>
            <div className="p-3.5 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.workLifeBalance || "No work life balance feedback provided."}
            </div>
          </div>

          {/* Suggestions for Improvement */}
          <div className="eval-stagger-item eval-stagger-4">
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Suggestions for Improvement
            </label>
            <div className="p-3.5 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.suggestionsForImprovement || formData.toolingAndResources || "No suggestions provided."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;

