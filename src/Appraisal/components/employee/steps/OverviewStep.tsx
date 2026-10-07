import React from "react";
import { StepProps } from "../../../types/appraisal.types";
import { AlertCircle } from "lucide-react";

export const OverviewStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
}) => {
  const overviewVal = formData.overview ?? formData.roleSummary ?? "";
  const errorMessage = errors?.overview || errors?.roleSummary;

  const handleChange = (val: string) => {
    onChange("overview" as any, val);
    onChange("roleSummary", val);
    if (clearError) {
      clearError("overview");
      clearError("roleSummary");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-blue-100 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 1: Role & Quarter Overview</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Summarize your current role, primary responsibilities, and key highlights for this quarter.
        </p>
      </div>

      <div className="space-y-4">
        {/* Comprehensive Overview Input Card with Animated Interactive Styling */}
        <div
          id="field-overview"
          className={`eval-step-card space-y-2.5 transition-all duration-200 ${
            errorMessage ? "eval-field-has-error" : ""
          }`}
        >
          <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center justify-between">
            <span>
              Overview Summary <span className="text-red-500">*</span>
            </span>
          </label>
          <textarea
            id="input-overview"
            rows={7}
            value={overviewVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Summarize your role, core responsibilities, deliverables, and major quarter highlights..."
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

export default OverviewStep;
