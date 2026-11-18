import React, { useEffect, useState } from "react";
import { ReviewFormData, StepProps } from "../../../types/appraisal.types";
import {
  AlertCircle,
  Calendar,
} from "lucide-react";
import { resolveAssignedQuarterPeriod } from "../../../utils/appraisalHelpers";
import "../AppraisalDashboard.css";

interface OverviewFieldConfig {
  key: "overallPerformanceSummary" | "keyHighlights" | "majorContributions" | "areasForImprovement";
  containerId: string;
  inputId: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

const OVERVIEW_FIELD_CONFIGS: readonly OverviewFieldConfig[] = [
  {
    key: "overallPerformanceSummary",
    containerId: "field-overallPerformanceSummary",
    inputId: "input-overall-summary",
    label: "Overall Performance Summary",
    placeholder: "Key deliverables, core responsibilities, and performance summary...",
    required: true,
  },
  {
    key: "keyHighlights",
    containerId: "field-keyHighlights",
    inputId: "input-key-highlights",
    label: "Key Highlights",
    placeholder: "Major milestones, improvements, and key wins...",
  },
  {
    key: "majorContributions",
    containerId: "field-majorContributions",
    inputId: "input-major-contributions",
    label: "Major Contributions",
    placeholder: "Key contributions to projects, teams, or initiatives...",
  },
  {
    key: "areasForImprovement",
    containerId: "field-areasForImprovement",
    inputId: "input-areas-for-improvement",
    label: "Areas for Improvement",
    placeholder: "Skills to develop, challenges, or improvement areas...",
  },
] as const;

export const OverviewStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  assignment,
  readOnly,
}) => {
  const quarter = assignment?.quarter || "Q1";
  const financialYear = assignment?.financialYear || "";

  // Review Period = assigned quarter master start/end (not overview-step saved fields)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [periodLoading, setPeriodLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setPeriodLoading(true);
    void resolveAssignedQuarterPeriod({
      quarter,
      financialYear,
      reviewPeriod: assignment?.reviewPeriod,
    }).then((period) => {
      if (cancelled) return;
      setStartDate(period.start);
      setEndDate(period.end);
      if (period.start) onChange("reviewPeriodStart", period.start);
      if (period.end) onChange("reviewPeriodEnd", period.end);
      setPeriodLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [quarter, financialYear, assignment?.reviewPeriod]);

  // Unified field change handler
  const handleFieldChange = (key: keyof ReviewFormData, val: string) => {
    onChange(key, val);
    if (clearError) {
      clearError(String(key));
    }
  };

  return (
    <div className="space-y-3">
      {/* Step Header */}
      <div>
        <h3 className="text-[1.24rem] font-bold">
          <span className="eval-title-anim">Step 1: Role & Quarter Overview</span>
        </h3>
      </div>

      {/* Review Period: Compact, clean card bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#F4F7FE] rounded-xl border border-[#E0E5F2] text-xs transition-all">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4318FF] shrink-0" />
          <span className="font-bold text-[#2B3674]">
            Review Period ({quarter} • {financialYear || "FY"}):
          </span>
          <span className="text-[#707EAE] font-medium">
            <span className="text-[#707EAE]">Start Date:</span>{" "}
            <strong className="text-[#2B3674] font-semibold">{startDate || "—"}</strong>
            {"  "}—{"  "}
            <span className="text-[#707EAE]">End Date:</span>{" "}
            <strong className="text-[#2B3674] font-semibold">{endDate || "—"}</strong>
          </span>
        </div>
        {periodLoading && (
          <span className="text-[11px] text-[#4318FF] font-medium animate-pulse">
            Fetching dates...
          </span>
        )}
      </div>

      {/* Form Fields: Side by side 2-column grid with external labels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 items-start">
        {OVERVIEW_FIELD_CONFIGS.map((field) => {
          const value = formData[field.key] || "";
          const error = errors?.[field.key];

          return (
            <div
              key={field.key}
              id={field.containerId}
              className="flex flex-col space-y-1.5 scroll-mt-24"
            >
              <label
                htmlFor={field.inputId}
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#2B3674] mb-0.5"
              >
                <span>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </span>
              </label>
              <textarea
                id={field.inputId}
                rows={4}
                value={value}
                readOnly={readOnly}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className={`eval-textarea-field eval-overview-field-noborder leading-relaxed text-sm font-normal ${
                  error ? "eval-input-error" : ""
                } ${readOnly ? "eval-textarea-readonly" : ""}`}
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

export default OverviewStep;
