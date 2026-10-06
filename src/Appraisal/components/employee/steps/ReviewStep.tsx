import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { Star } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-[#D7B6C7]/40 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        <div className="eval-step-card space-y-3">
          <div className="flex items-center justify-between border-b border-[#D7B6C7]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#8D73A8] text-white flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 1: Role & Quarter Overview
              </h4>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1.5 uppercase tracking-wider">
              Overview
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.overview || formData.roleSummary || "No overview provided."}
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 2: KEY ACHIEVEMENTS & PROJECTS
           =================================================================== */}
        <div className="eval-step-card space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#D7B6C7]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#8D73A8] text-white flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 2: Key Achievements & Projects
              </h4>
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Project Title
            </label>
            <div className="p-3 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm font-bold text-[#0F172A]">
              {formData.projectTitle || formData.majorAchievements || "No title provided"}
            </div>
          </div>

          {/* Description and Challenge Side-by-Side Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Project Description */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Project Description
              </label>
              <div className="p-3.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium flex-1">
                {formData.projectDescription || formData.kpisMet || "No description provided."}
              </div>
            </div>

            {/* Challenge */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Challenge Overcome
              </label>
              <div className="p-3.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium flex-1">
                {formData.projectChallenge || formData.challengesOvercome || "No challenge specified."}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 3: TEAMWORK & COLLABORATION
           =================================================================== */}
        <div className="eval-step-card space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#D7B6C7]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#8D73A8] text-white flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 3: Teamwork & Collaboration
              </h4>
            </div>
            {avgTeamScore ? (
              <span className="text-xs font-bold text-[#8D73A8] px-2.5 py-0.5 rounded-full bg-[#8D73A8]/10 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                Avg Score: {avgTeamScore}/5.0
              </span>
            ) : null}
          </div>

          {/* 6 Dimensions Rating Display */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-2 uppercase tracking-wider">
              Evaluated Teamwork Dimensions
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TEAM_CRITERIA.map((criterion) => {
                const score = teamRatings[criterion.key as keyof typeof teamRatings] || 0;
                return (
                  <div
                    key={criterion.key}
                    className="p-2.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl flex items-center justify-between gap-2"
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
                              ? "fill-amber-400 text-amber-400"
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
        <div className="eval-step-card space-y-3">
          <div className="flex items-center justify-between border-b border-[#D7B6C7]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#8D73A8] text-white flex items-center justify-center text-[11px] font-bold">
                4
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 4: Continuous Learning & Goals
              </h4>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1.5 uppercase tracking-wider">
              Learning Goals
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.learningGoals ||
                formData.nextQuarterLearningGoals ||
                formData.skillsAcquired ||
                "No learning goals provided."}
            </div>
          </div>
        </div>

        {/* ===================================================================
            STEP 5: COMPANY ENVIRONMENT
           =================================================================== */}
        <div className="eval-step-card space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#D7B6C7]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#8D73A8] text-white flex items-center justify-center text-[11px] font-bold">
                5
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 5: Company Environment
              </h4>
            </div>
            {envRating > 0 && envRatingInfo ? (
              <span className="text-xs font-bold text-[#6D5284] px-3 py-1 rounded-full bg-[#6D5284]/10 flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  {renderAnimatedEmojiIcon(envRating, false)}
                </span>
                <span>{envRatingInfo.label} ({envRating}/5)</span>
              </span>
            ) : null}
          </div>

          {/* Feedback on Work Culture */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Feedback on Work Culture
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.workCultureFeedback || "No feedback on work culture provided."}
            </div>
          </div>

          {/* Work Life Balance */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Work Life Balance
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.workLifeBalance || "No work life balance feedback provided."}
            </div>
          </div>

          {/* Suggestions for Improvement */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Suggestions for Improvement
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.suggestionsForImprovement || formData.toolingAndResources || "No suggestions provided."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
