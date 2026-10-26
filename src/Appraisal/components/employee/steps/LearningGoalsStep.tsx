import React from "react";
import { StepProps, ReviewFormData } from "../../../types/appraisal.types";
import { AlertCircle } from "lucide-react";
import "../AppraisalDashboard.css";

interface LearningGoalFieldConfig {
  key: keyof ReviewFormData;
  containerId: string;
  inputId: string;
  label: string;
  placeholder: string;
  required?: boolean;
  colSpan?: string;
}

const LEARNING_GOAL_CONFIGS: readonly LearningGoalFieldConfig[] = [
  {
    key: "skillsAcquired",
    containerId: "field-skillsAcquired",
    inputId: "input-skillsAcquired",
    label: "Skills Learned During This Period",
    placeholder: "Technical tools, frameworks, languages, or expertise acquired...",
    required: true,
  },
  {
    key: "certificationsOrCourses",
    containerId: "field-certificationsOrCourses",
    inputId: "input-certificationsOrCourses",
    label: "Training / Certifications Completed",
    placeholder: "Workshops, courses, or certifications completed...",
  },
  {
    key: "skillsToImprove",
    containerId: "field-skillsToImprove",
    inputId: "input-skillsToImprove",
    label: "Skills to Improve",
    placeholder: "Technical skills, leadership capabilities, or focus areas...",
    required: true,
  },
  {
    key: "supportOrTrainingRequired",
    containerId: "field-supportOrTrainingRequired",
    inputId: "input-supportOrTrainingRequired",
    label: "Support or Training Required",
    placeholder: "Mentorship, courses, licenses, or resources needed...",
  },
  {
    key: "nextQuarterLearningGoals",
    containerId: "field-nextQuarterLearningGoals",
    inputId: "input-nextQuarterLearningGoals",
    label: "Learning Goals for Next Quarter",
    placeholder: "2-3 specific, measurable learning goals for next quarter...",
    required: true,
    colSpan: "col-span-1 md:col-span-2",
  },
] as const;

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

      {/* 2-Column Responsive Grid Layout driven by structured config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {LEARNING_GOAL_CONFIGS.map((field) => {
          const val = (formData[field.key] as string) || "";
          const error = errors?.[field.key as string];

          return (
            <div
              key={field.key}
              id={field.containerId}
              className={`flex flex-col space-y-1.5 scroll-mt-24 ${field.colSpan || ""}`}
            >
              <label
                htmlFor={field.inputId}
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1"
              >
                <span>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </span>
              </label>
              <textarea
                id={field.inputId}
                rows={4}
                value={val}
                readOnly={readOnly}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`eval-textarea-field leading-relaxed text-sm flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm ${
                  error ? "eval-input-error" : ""
                }`}
              />
              {error && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningGoalsStep;
