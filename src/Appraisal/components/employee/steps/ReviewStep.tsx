import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { CheckCircle2, Star, Lock } from "lucide-react";
import { Card } from "../../../../components/ui";

const TEAM_CRITERIA = [
  { key: "crossCollaboration", title: "Cross-Department Collaboration" },
  { key: "communication", title: "Communication & Transparency" },
  { key: "mentorship", title: "Mentorship & Knowledge Sharing" },
  { key: "peerSupport", title: "Peer Support & Team Spirit" },
  { key: "reliability", title: "Reliability & Accountability" },
  { key: "initiative", title: "Adaptability & Initiative" },
];

const ENVIRONMENT_RATINGS: Record<number, { label: string; emoji: string }> = {
  1: { label: "Very Bad", emoji: "😠" },
  2: { label: "Bad", emoji: "🙁" },
  3: { label: "Neutral", emoji: "😐" },
  4: { label: "Good", emoji: "🙂" },
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="border-b border-[#99F6E4]/40 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">Step 6: Review & Final Submission</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Review all responses from previous steps. This summary is strictly uneditable.
          </p>
        </div>
        <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Uneditable Summary</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* ===================================================================
            STEP 1: ROLE & QUARTER OVERVIEW
           =================================================================== */}
        <Card className="p-5 rounded-2xl border border-[#99F6E4]/50 bg-white/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 1: Role & Quarter Overview
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-[#05CD99] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1.5 uppercase tracking-wider">
              Overview
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.overview || formData.roleSummary || "No overview provided."}
            </div>
          </div>
        </Card>

        {/* ===================================================================
            STEP 2: KEY ACHIEVEMENTS & PROJECTS
           =================================================================== */}
        <Card className="p-5 rounded-2xl border border-[#99F6E4]/50 bg-white/90 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 2: Key Achievements & Projects
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-[#05CD99] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          </div>

          {/* Project Title */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Project Title
            </label>
            <div className="p-3 bg-gray-50/70 border border-[#CCFBF1] rounded-xl text-sm font-bold text-[#0F172A]">
              {formData.projectTitle || formData.majorAchievements || "No title provided"}
            </div>
          </div>

          {/* Project Description */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Project Description
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.projectDescription || formData.kpisMet || "No description provided."}
            </div>
          </div>

          {/* Challenge */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Challenge
            </label>
            <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.projectChallenge || formData.challengesOvercome || "No challenge specified."}
            </div>
          </div>
        </Card>

        {/* ===================================================================
            STEP 3: TEAMWORK & COLLABORATION
           =================================================================== */}
        <Card className="p-5 rounded-2xl border border-[#99F6E4]/50 bg-white/90 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 3: Teamwork & Collaboration
              </h4>
            </div>
            {avgTeamScore ? (
              <span className="text-xs font-bold text-[#05CD99] px-2.5 py-0.5 rounded-full bg-[#05CD99]/10 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                Avg Score: {avgTeamScore}/5.0
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#05CD99] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>

          {/* 6 Dimensions Rating Display */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-2 uppercase tracking-wider">
              Evaluated Teamwork Dimensions ({ratedTeamKeys.length}/6)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TEAM_CRITERIA.map((criterion) => {
                const score = teamRatings[criterion.key as keyof typeof teamRatings] || 0;
                return (
                  <div
                    key={criterion.key}
                    className="p-2.5 bg-gray-50/70 border border-[#CCFBF1] rounded-xl flex items-center justify-between gap-2"
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
        </Card>

        {/* ===================================================================
            STEP 4: CONTINUOUS LEARNING & GOALS
           =================================================================== */}
        <Card className="p-5 rounded-2xl border border-[#99F6E4]/50 bg-white/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-[11px] font-bold">
                4
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 4: Continuous Learning & Goals
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-[#05CD99] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1.5 uppercase tracking-wider">
              Learning Goals
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.learningGoals ||
                formData.nextQuarterLearningGoals ||
                formData.skillsAcquired ||
                "No learning goals provided."}
            </div>
          </div>
        </Card>

        {/* ===================================================================
            STEP 5: COMPANY ENVIRONMENT
           =================================================================== */}
        <Card className="p-5 rounded-2xl border border-[#99F6E4]/50 bg-white/90 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#99F6E4]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#05CD99] text-white flex items-center justify-center text-[11px] font-bold">
                5
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Step 5: Company Environment
              </h4>
            </div>
            {envRating > 0 && envRatingInfo ? (
              <span className="text-xs font-bold text-[#14B8A6] px-3 py-1 rounded-full bg-[#14B8A6]/10 flex items-center gap-1.5">
                <span className="text-sm">{envRatingInfo.emoji}</span>
                <span>{envRatingInfo.label} ({envRating}/5)</span>
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#05CD99] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>

          {/* Feedback on Work Culture */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Feedback on Work Culture
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.workCultureFeedback || "No feedback on work culture provided."}
            </div>
          </div>

          {/* Work Life Balance */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Work Life Balance
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.workLifeBalance || "No work life balance feedback provided."}
            </div>
          </div>

          {/* Suggestions for Improvement */}
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
              Suggestions for Improvement
            </label>
            <div className="p-3.5 bg-gray-50/70 border border-[#CCFBF1] rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
              {formData.suggestionsForImprovement || formData.toolingAndResources || "No suggestions provided."}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReviewStep;
