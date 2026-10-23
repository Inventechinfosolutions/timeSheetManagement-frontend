import React from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { AlertCircle } from "lucide-react";

export const LearningGoalsStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  readOnly = false,
}) => {
  const handleFieldChange = (field: keyof ReviewFormData, val: string) => {
    if (readOnly) return;
    onChange(field, val);
    if (clearError) {
      clearError(field as string);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-blue-100 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 4: Continuous Learning & Goals</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Capture skills developed, certifications completed, and future learning ambitions.
        </p>
      </div>

      {/* 2-Column Responsive Grid Layout without outer card borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Field 1: Skills Learned During This Period (Required) */}
        <div
          id="field-skillsAcquired"
          className="flex flex-col space-y-2 scroll-mt-24"
        >
          <label
            htmlFor="input-skillsAcquired"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            <span>
              Skills Learned During This Period <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-skillsAcquired"
            rows={4}
            value={formData.skillsAcquired || ""}
            readOnly={readOnly}
            onChange={(e) => handleFieldChange("skillsAcquired", e.target.value)}
            placeholder="Highlight new technical tools, frameworks, programming languages, or domain expertise acquired during this period..."
            className={`eval-textarea-field leading-relaxed text-sm flex-1 ${
              errors?.skillsAcquired ? "eval-input-error" : ""
            }`}
          />
          {errors?.skillsAcquired && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.skillsAcquired}</span>
            </p>
          )}
        </div>

        {/* Field 2: Training / Certifications Completed (Optional) */}
        <div
          id="field-certificationsOrCourses"
          className="flex flex-col space-y-2 scroll-mt-24"
        >
          <label
            htmlFor="input-certificationsOrCourses"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            <span>Training / Certifications Completed</span>
          </label>
          <textarea
            id="input-certificationsOrCourses"
            rows={4}
            value={formData.certificationsOrCourses || ""}
            readOnly={readOnly}
            onChange={(e) => handleFieldChange("certificationsOrCourses", e.target.value)}
            placeholder="List any internal/external workshops, courses, or certifications completed during this quarter..."
            className="eval-textarea-field leading-relaxed text-sm flex-1"
          />
        </div>

        {/* Field 3: Skills to Improve (Required) */}
        <div
          id="field-skillsToImprove"
          className="flex flex-col space-y-2 scroll-mt-24"
        >
          <label
            htmlFor="input-skillsToImprove"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            <span>
              Skills to Improve <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-skillsToImprove"
            rows={4}
            value={formData.skillsToImprove || ""}
            readOnly={readOnly}
            onChange={(e) => handleFieldChange("skillsToImprove", e.target.value)}
            placeholder="Identify technical capabilities, leadership skills, or domain areas you want to strengthen..."
            className={`eval-textarea-field leading-relaxed text-sm flex-1 ${
              errors?.skillsToImprove ? "eval-input-error" : ""
            }`}
          />
          {errors?.skillsToImprove && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.skillsToImprove}</span>
            </p>
          )}
        </div>

        {/* Field 4: Support or Training Required (Optional - in Row 2 Right) */}
        <div
          id="field-supportOrTrainingRequired"
          className="flex flex-col space-y-2 scroll-mt-24"
        >
          <label
            htmlFor="input-supportOrTrainingRequired"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            <span>Support or Training Required</span>
          </label>
          <textarea
            id="input-supportOrTrainingRequired"
            rows={4}
            value={formData.supportOrTrainingRequired || ""}
            readOnly={readOnly}
            onChange={(e) => handleFieldChange("supportOrTrainingRequired", e.target.value)}
            placeholder="Mention any mentorship, licenses, courses, or resources needed from your manager or the organization..."
            className="eval-textarea-field leading-relaxed text-sm flex-1"
          />
        </div>

        {/* Field 5: Learning Goals for Next Quarter (Required - in Last / Full-width) */}
        <div
          id="field-nextQuarterLearningGoals"
          className="flex flex-col space-y-2 scroll-mt-24 col-span-1 md:col-span-2"
        >
          <label
            htmlFor="input-nextQuarterLearningGoals"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
          >
            <span>
              Learning Goals for Next Quarter <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-nextQuarterLearningGoals"
            rows={4}
            value={formData.nextQuarterLearningGoals || ""}
            readOnly={readOnly}
            onChange={(e) => handleFieldChange("nextQuarterLearningGoals", e.target.value)}
            placeholder="Outline your specific learning milestones, certifications, or technologies targeted for next quarter..."
            className={`eval-textarea-field leading-relaxed text-sm flex-1 ${
              errors?.nextQuarterLearningGoals ? "eval-input-error" : ""
            }`}
          />
          {errors?.nextQuarterLearningGoals && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.nextQuarterLearningGoals}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningGoalsStep;
