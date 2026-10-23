import React, { useEffect, useRef, useState } from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { Star, Edit3, AlertCircle, CheckCircle2 } from "lucide-react";
import { initScrollRevealCards } from "../../../animations/appraisalAnimations";
import { renderAnimatedEmojiIcon } from "./CompanyEnvironmentStep";
import AttachmentItem from "../../common/AttachmentItem";

const TEAM_CRITERIA = [
  { key: "communication", title: "Communication" },
  { key: "ownership", title: "Ownership" },
  { key: "collaboration", title: "Collaboration" },
  { key: "problemSolving", title: "Problem Solving" },
  { key: "leadership", title: "Leadership" },
  { key: "adaptability", title: "Adaptability" },
];

const SELF_RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Needs Improvement (1/5)",
  2: "Developing (2/5)",
  3: "Meets Expectations (3/5)",
  4: "Exceeds Expectations (4/5)",
  5: "Outstanding (5/5)",
};

export const ReviewStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  onEditStep,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const teamRatings = formData.teamRatings || {};

  // GSAP Scroll-based reveal animation for review cards
  useEffect(() => {
    return initScrollRevealCards(containerRef.current);
  }, []);

  const handleRatingClick = (score: number) => {
    if (onChange) {
      onChange("overallSelfRating", score);
    }
    if (clearError) {
      clearError("overallSelfRating");
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
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onChange) {
      onChange("confirmationAccepted", checked);
    }
    if (clearError) {
      clearError("confirmationAccepted");
    }
  };

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
            Review all responses from previous steps. You can use Edit on any section to make changes before final submission.
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
            {(formData.reviewPeriodStart || formData.reviewPeriodEnd) && (
              <div className="text-xs text-[#64748B] font-medium bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/70">
                Review Period: <strong className="text-[#0F172A]">{formData.reviewPeriodStart || "—"}</strong> to <strong className="text-[#0F172A]">{formData.reviewPeriodEnd || "—"}</strong>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Overall Performance Summary
              </label>
              <div className="p-3 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
                {formData.overallPerformanceSummary || formData.overview || "No summary provided."}
              </div>
            </div>

            {Boolean(formData.keyHighlights) && (
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Key Highlights
                </label>
                <div className="p-3 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
                  {formData.keyHighlights}
                </div>
              </div>
            )}

            {Boolean(formData.majorContributions) && (
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Major Contributions
                </label>
                <div className="p-3 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
                  {formData.majorContributions}
                </div>
              </div>
            )}

            {Boolean(formData.areasForImprovement) && (
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                  Areas for Improvement
                </label>
                <div className="p-3 bg-white/80 border border-blue-100/80 rounded-xl text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-medium">
                  {formData.areasForImprovement}
                </div>
              </div>
            )}
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
            <div className="p-3 bg-white/80 border border-blue-200/60 rounded-xl text-sm text-[#64748B]">
              No project added.
            </div>
          ) : (
            <div className="space-y-3.5">
              {(formData.projects || []).map((project, index) => (
                <div key={`${project.projectName}-${index}`} className="space-y-2 p-3 bg-blue-50/20 border border-blue-100 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                      Project {index + 1}
                    </span>
                    {project.isDraft && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-300 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Project Name
                      </label>
                      <div className="p-3 bg-white border border-blue-200/60 rounded-xl text-sm font-bold text-[#0F172A]">
                        {project.projectName || "—"}
                      </div>
                      {(project.projectRole || project.responsibilityType) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {project.projectRole && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 rounded-md">
                              {project.projectRole}
                            </span>
                          )}
                          {project.responsibilityType && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md">
                              {project.responsibilityType}
                            </span>
                          )}
                        </div>
                      )}
                      {(project.attachments || []).length > 0 && (
                        <div className="mt-2 space-y-1">
                          <label className="text-[11px] font-extrabold text-[#64748B] block uppercase tracking-wider">
                            Attachments
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {(project.attachments || []).map((file) => (
                              <AttachmentItem
                                key={file.objectKey || file.fileName}
                                file={file}
                                readOnly
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Project Description
                      </label>
                      <div className="eval-description-box text-sm whitespace-pre-line">
                        {project.description || "—"}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                        Challenges Faced
                      </label>
                      <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line">
                        {project.challengesFaced || project.challenge || "—"}
                      </div>
                    </div>
                  </div>
                  {(Boolean(project.leadershipQualities) || Boolean(project.clientReviewFeedback)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {Boolean(project.leadershipQualities) && (
                        <div>
                          <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                            Leadership Qualities
                          </label>
                          <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line">
                            {project.leadershipQualities}
                          </div>
                        </div>
                      )}
                      {Boolean(project.clientReviewFeedback) && (
                        <div>
                          <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                            Client Review & Feedback
                          </label>
                          <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line">
                            {project.clientReviewFeedback}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================================
            STEP 3: TEAMWORK & COLLABORATION
           ================================================================== */}
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
            {teamRatings.communication ? (
              <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border border-blue-200/80 shadow-2xs flex items-center gap-1.5 shrink-0 eval-stagger-item eval-stagger-2">
                <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)] shrink-0" />
                <span className="text-[11px] font-semibold text-[#64748B]">Rating:</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#0F172A]">{teamRatings.communication}.0</span>
                <span className="text-[10px] font-bold text-[#94A3B8]">/ 5.0</span>
              </div>
            ) : null}
          </div>

          {/* Communication & Coordination Rating */}
          <div className="eval-stagger-item eval-stagger-3">
            <label className="text-xs font-bold text-[#64748B] block mb-2 uppercase tracking-wider">
              Communication & Coordination
            </label>
            <div className="p-3 bg-white/80 border border-blue-100/80 rounded-xl flex items-center justify-between gap-2 max-w-md">
              <span className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                Communication & Coordination
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= (teamRatings.communication || 0)
                        ? "fill-[#F59E0B] text-[#F59E0B]"
                        : "fill-transparent text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 4 Teamwork Details in 2 columns */}
          {(formData.teamCollaborationSummary ||
            formData.crossTeamContributions ||
            formData.knowledgeSharingMentoring ||
            formData.teamworkExamples) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {formData.teamCollaborationSummary && (
                <div>
                  <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                    Team Collaboration Summary
                  </label>
                  <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed">
                    {formData.teamCollaborationSummary}
                  </div>
                </div>
              )}
              {formData.crossTeamContributions && (
                <div>
                  <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                    Cross-Team Contributions
                  </label>
                  <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed">
                    {formData.crossTeamContributions}
                  </div>
                </div>
              )}
              {formData.knowledgeSharingMentoring && (
                <div>
                  <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                    Knowledge Sharing / Mentoring
                  </label>
                  <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed">
                    {formData.knowledgeSharingMentoring}
                  </div>
                </div>
              )}
              {formData.teamworkExamples && (
                <div>
                  <label className="text-[11px] font-extrabold text-[#64748B] block mb-1 uppercase tracking-wider">
                    Teamwork Examples
                  </label>
                  <div className="p-3.5 bg-white border border-blue-200/60 rounded-xl text-sm text-[#0F172A] whitespace-pre-line leading-relaxed">
                    {formData.teamworkExamples}
                  </div>
                </div>
              )}
            </div>
          )}
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
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Skills Learned During This Period
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium min-h-[80px]">
                {formData.skillsAcquired || "—"}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Training / Certifications Completed
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium min-h-[80px]">
                {formData.certificationsOrCourses || "—"}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Skills to Improve
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium min-h-[80px]">
                {formData.skillsToImprove || "—"}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Support or Training Required
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium min-h-[80px]">
                {formData.supportOrTrainingRequired || "—"}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Learning Goals for Next Quarter
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium min-h-[70px]">
                {formData.nextQuarterLearningGoals || "—"}
              </div>
            </div>

            {!formData.skillsAcquired && !formData.skillsToImprove && (formData.learningGoalItems || []).length > 0 && (
              <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-blue-100">
                <label className="text-xs font-bold text-[#64748B] block uppercase tracking-wider">
                  Previous Learning Goals
                </label>
                {(formData.learningGoalItems || []).map((goal, index) => (
                  <div key={`${goal}-${index}`} className="eval-description-box text-sm">
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
        <div className="eval-step-card eval-reveal-card is-revealed space-y-3.5">
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
              {formData.companyEnvironmentRating ? (
                <span className="text-xs font-bold text-[#2563EB] px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 flex items-center gap-2 eval-stagger-item eval-stagger-2">
                  <span className="w-5 h-5 flex items-center justify-center shrink-0">
                    {renderAnimatedEmojiIcon(formData.companyEnvironmentRating, false)}
                  </span>
                  <span>Satisfaction: {formData.companyEnvironmentRating}/5</span>
                </span>
              ) : null}
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

          {/* 3 Rating Cards in 3-column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 eval-stagger-item eval-stagger-3">
            {/* 1. Work Environment Satisfaction */}
            <div className="p-3 bg-white/80 border border-blue-200/60 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Work Environment Satisfaction
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= (formData.companyEnvironmentRating || 0)
                          ? "fill-[#F59E0B] text-[#D97706]"
                          : "fill-transparent text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#0F172A]">
                  {formData.companyEnvironmentRating ? `${formData.companyEnvironmentRating}/5` : "—"}
                </span>
              </div>
            </div>

            {/* 2. Availability of Tools & Resources */}
            <div className="p-3 bg-white/80 border border-blue-200/60 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Availability of Tools &amp; Resources
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= (formData.toolingAndResourcesRating || 0)
                          ? "fill-[#F59E0B] text-[#D97706]"
                          : "fill-transparent text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#0F172A]">
                  {formData.toolingAndResourcesRating ? `${formData.toolingAndResourcesRating}/5` : "—"}
                </span>
              </div>
            </div>

            {/* 3. Manager Support */}
            <div className="p-3 bg-white/80 border border-blue-200/60 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Manager Support
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= (formData.managementSupportRating || 0)
                          ? "fill-[#F59E0B] text-[#D97706]"
                          : "fill-transparent text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#0F172A]">
                  {formData.managementSupportRating ? `${formData.managementSupportRating}/5` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Qualitative Text Areas Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Challenges Affecting Productivity */}
            <div className="eval-stagger-item eval-stagger-3">
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Challenges Affecting Productivity
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium min-h-[75px]">
                {formData.challengesAffectingProductivity || formData.workLifeBalance || "None reported"}
              </div>
            </div>

            {/* Suggestions for Improvement */}
            <div className="eval-stagger-item eval-stagger-4">
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Suggestions for Improvement
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium min-h-[75px]">
                {formData.suggestionsForImprovement || formData.toolingAndResources || "No suggestions provided"}
              </div>
            </div>
          </div>

          {/* Legacy Feedback on Work Culture fallback if present */}
          {Boolean(formData.workCultureFeedback) && (
            <div className="eval-stagger-item eval-stagger-4 pt-2 border-t border-blue-100">
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                Additional Culture Feedback
              </label>
              <div className="eval-description-box text-sm leading-relaxed whitespace-pre-line font-medium">
                {formData.workCultureFeedback}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            STEP 6: FINAL EVALUATION & SUBMISSION
           =================================================================== */}
        <div className="eval-step-card eval-reveal-card is-revealed space-y-5 border-blue-300 shadow-sm bg-gradient-to-b from-white via-white to-blue-50/20">
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

          {/* 1. Overall Self-Rating (1-5, Required) */}
          <div
            id="field-overallSelfRating"
            className={`p-4 rounded-2xl border transition-all duration-200 scroll-mt-24 ${
              errors?.overallSelfRating
                ? "border-red-400 bg-red-50/25 ring-2 ring-red-100"
                : formData.overallSelfRating > 0
                ? "border-blue-400/80 bg-blue-50/15"
                : "border-blue-200/70 bg-white"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider">
                <span>
                  Overall Self-Rating <span className="text-red-500">*</span>
                </span>
              </label>
              <span className="text-xs font-semibold text-[#64748B]">
                {SELF_RATING_DESCRIPTIONS[hoveredRating || formData.overallSelfRating || 0] || "Select your rating (1 to 5)"}
              </span>
            </div>

            <div
              className="flex items-center gap-2 py-1"
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const displayScore = hoveredRating || formData.overallSelfRating || 0;
                const isFilled = star <= displayScore;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    className="p-1.5 rounded-xl hover:bg-amber-50 focus:outline-none transition-transform duration-150 hover:scale-115 active:scale-95 cursor-pointer"
                    title={`${star} Star - ${SELF_RATING_DESCRIPTIONS[star]}`}
                    aria-label={`Rate ${star} of 5 stars`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors duration-150 ${
                        isFilled
                          ? "fill-[#F59E0B] text-[#D97706] drop-shadow-[0_1px_3px_rgba(245,158,11,0.4)]"
                          : "fill-transparent text-slate-300 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {errors?.overallSelfRating && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errors.overallSelfRating}</span>
              </p>
            )}
          </div>

          {/* 2 & 3: Overall Employee Comments and Career Growth Interests (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Overall Employee Comments (Optional) */}
            <div id="field-overallEmployeeComments" className="flex flex-col space-y-2 scroll-mt-24">
              <label
                htmlFor="input-overallEmployeeComments"
                className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider"
              >
                <span>Overall Employee Comments</span>
              </label>
              <textarea
                id="input-overallEmployeeComments"
                rows={4}
                value={formData.overallEmployeeComments ?? formData.finalComments ?? ""}
                onChange={(e) => handleTextChange("overallEmployeeComments", e.target.value)}
                placeholder="Share any overall thoughts, reflections, or highlights regarding your performance this quarter..."
                className="eval-textarea-field leading-relaxed text-sm flex-1"
              />
            </div>

            {/* Career Growth Interests (Optional) */}
            <div id="field-careerGrowthInterests" className="flex flex-col space-y-2 scroll-mt-24">
              <label
                htmlFor="input-careerGrowthInterests"
                className="text-xs font-bold text-[#64748B] block mb-1 uppercase tracking-wider"
              >
                <span>Career Growth Interests</span>
              </label>
              <textarea
                id="input-careerGrowthInterests"
                rows={4}
                value={formData.careerGrowthInterests ?? ""}
                onChange={(e) => handleTextChange("careerGrowthInterests", e.target.value)}
                placeholder="Describe your career aspirations, future roles, leadership opportunities, or areas of interest for growth..."
                className="eval-textarea-field leading-relaxed text-sm flex-1"
              />
            </div>
          </div>

          {/* 4. Confirmation Checkbox (Required) */}
          <div
            id="field-confirmationAccepted"
            className={`p-4 rounded-2xl border transition-all duration-200 scroll-mt-24 ${
              errors?.confirmationAccepted
                ? "border-red-400 bg-red-50/20 ring-2 ring-red-100"
                : formData.confirmationAccepted
                ? "border-emerald-300 bg-emerald-50/25"
                : "border-blue-200/80 bg-white"
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(formData.confirmationAccepted)}
                onChange={(e) => handleCheckboxChange(e.target.checked)}
                className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer accent-[#2563EB]"
              />
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-snug block">
                  I confirm that all responses provided in this review are accurate and ready for submission. <span className="text-red-500">*</span>
                </span>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Once submitted, this review will be forwarded to your reporting manager for evaluation and scoring.
                </p>
              </div>
            </label>
            {errors?.confirmationAccepted && (
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
