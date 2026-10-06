import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle } from "lucide-react";

export const LearningGoalsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const learningGoalsVal =
    formData.learningGoals ??
    formData.nextQuarterLearningGoals ??
    formData.skillsAcquired ??
    "";

  const errorMessage =
    errors?.learningGoals ||
    errors?.nextQuarterLearningGoals ||
    errors?.skillsAcquired;

  const handleChange = (val: string) => {
    onChange("learningGoals" as any, val);
    onChange("nextQuarterLearningGoals", val);
    onChange("skillsAcquired", val);
    if (clearError) {
      clearError("learningGoals");
      clearError("nextQuarterLearningGoals");
      clearError("skillsAcquired");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D7B6C7]/40 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 4: Continuous Learning & Goals</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Document the technical skills acquired, certifications completed, and future learning ambitions.
        </p>
      </div>

      <div className="space-y-4">
        {/* Learning Goals Input Card */}
        <div
          id="field-learningGoals"
          className={`eval-step-card space-y-2.5 transition-all duration-200 ${
            errorMessage ? "eval-field-has-error" : ""
          }`}
        >
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
            <span>
              Learning Goals <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-learningGoals"
            rows={7}
            value={learningGoalsVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Highlight new technical frameworks learned, courses or certifications completed, and your core learning and career development goals for the upcoming quarter..."
            className={`eval-textarea-field leading-relaxed text-sm ${
              errorMessage ? "eval-input-error" : ""
            }`}
          />
          {errorMessage && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningGoalsStep;
