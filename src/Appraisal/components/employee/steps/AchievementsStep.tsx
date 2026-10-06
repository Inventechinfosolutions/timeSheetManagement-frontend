import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle } from "lucide-react";

export const AchievementsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const projectTitle = formData.projectTitle ?? formData.majorAchievements ?? "";
  const projectDescription = formData.projectDescription ?? formData.kpisMet ?? "";
  const projectChallenge = formData.projectChallenge ?? formData.challengesOvercome ?? "";

  const titleError = errors?.projectTitle || errors?.majorAchievements;
  const descriptionError = errors?.projectDescription || errors?.kpisMet;
  const challengeError = errors?.projectChallenge || errors?.challengesOvercome;

  const handleTitleChange = (val: string) => {
    onChange("projectTitle" as any, val);
    onChange("majorAchievements", val);
    if (clearError) {
      clearError("projectTitle");
      clearError("majorAchievements");
    }
  };

  const handleDescriptionChange = (val: string) => {
    onChange("projectDescription" as any, val);
    onChange("kpisMet", val);
    if (clearError) {
      clearError("projectDescription");
      clearError("kpisMet");
    }
  };

  const handleChallengeChange = (val: string) => {
    onChange("projectChallenge" as any, val);
    onChange("challengesOvercome", val);
    if (clearError) {
      clearError("projectChallenge");
      clearError("challengesOvercome");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D7B6C7]/40 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 2: Key Achievements & Projects</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Detail your key project deliverables, project description, and challenges navigated.
        </p>
      </div>

      <div className="space-y-4">
        {/* Project Title Card */}
        <div
          id="field-projectTitle"
          className={`eval-step-card space-y-2 transition-all duration-200 ${
            titleError ? "eval-field-has-error" : ""
          }`}
        >
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
            <span>
              Project Title <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            id="input-projectTitle"
            type="text"
            value={projectTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Timesheet Workflow Modernization & Automation"
            className={`eval-input-field ${titleError ? "eval-input-error" : ""}`}
          />
          {titleError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{titleError}</span>
            </p>
          )}
        </div>

        {/* Side-by-Side Grid for Description and Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Description Card */}
          <div
            id="field-projectDescription"
            className={`eval-step-card space-y-2 flex flex-col justify-between transition-all duration-200 ${
              descriptionError ? "eval-field-has-error" : ""
            }`}
          >
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
                <span>
                  Project Description <span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                id="input-projectDescription"
                rows={4}
                value={projectDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Describe the project scope, your key responsibilities, deliverables, and measurable outcomes..."
                className={`eval-textarea-field mt-2 ${
                  descriptionError ? "eval-input-error" : ""
                }`}
              />
              {descriptionError && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{descriptionError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Challenge Card */}
          <div
            id="field-projectChallenge"
            className={`eval-step-card space-y-2 flex flex-col justify-between transition-all duration-200 ${
              challengeError ? "eval-field-has-error" : ""
            }`}
          >
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
                <span>
                  Challenge Overcome <span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                id="input-projectChallenge"
                rows={4}
                value={projectChallenge}
                onChange={(e) => handleChallengeChange(e.target.value)}
                placeholder="What technical or operational challenges did you encounter and how did you resolve them?..."
                className={`eval-textarea-field mt-2 ${
                  challengeError ? "eval-input-error" : ""
                }`}
              />
              {challengeError && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{challengeError}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsStep;
