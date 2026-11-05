import React, { useEffect, useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import {
  AlertCircle,
  Calendar,
} from "lucide-react";
import { AppraisalApi } from "../../../reducers/appraisal.reducer";
import { formatAppraisalDisplayDate, getQuarterPeriod, isYearlyReview } from "../../../utils/appraisalHelpers";
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

  // Review Period State
  const [startDate, setStartDate] = useState<string>(formData.reviewPeriodStart || "");
  const [endDate, setEndDate] = useState<string>(formData.reviewPeriodEnd || "");
  const [periodLoading, setPeriodLoading] = useState<boolean>(false);

  // Compute fallback and fetch quarter dates
  useEffect(() => {
    let isMounted = true;
    const fromYearMatch = financialYear.match(/^(\d{4})/);
    const fromYear = fromYearMatch ? parseInt(fromYearMatch[1], 10) : new Date().getFullYear();
    const defaults = getQuarterPeriod(quarter, financialYear, assignment?.reviewPeriod);
    const defaultStart = defaults.start;
    const defaultEnd = defaults.end;

    if (!formData.reviewPeriodStart && defaultStart) {
      setStartDate(defaultStart);
      onChange("reviewPeriodStart", defaultStart);
    }
    if (!formData.reviewPeriodEnd && defaultEnd) {
      setEndDate(defaultEnd);
      onChange("reviewPeriodEnd", defaultEnd);
    }

    if (isYearlyReview(assignment)) {
      setPeriodLoading(false);
      return;
    }

    // Fetch master quarters from backend API
    setPeriodLoading(true);
    AppraisalApi.getMasterQuarters(fromYear)
      .then((quarters) => {
        if (!isMounted) return;
        const match = quarters.find((q) => q.quaterLabel === quarter);
        if (match?.startDate && match?.endDate) {
          const formattedStart = formatAppraisalDisplayDate(match.startDate);
          const formattedEnd = formatAppraisalDisplayDate(match.endDate);
          setStartDate(formattedStart);
          setEndDate(formattedEnd);
          onChange("reviewPeriodStart", formattedStart);
          onChange("reviewPeriodEnd", formattedEnd);
        }
      })
      .catch(() => {
        // Retain default dates if master quarter fetch fails
      })
      .finally(() => {
        if (isMounted) setPeriodLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [quarter, financialYear, assignment?.reviewPeriod]);

  // Unified field change handler
  const handleFieldChange = (key: string, val: string) => {
    onChange(key, val);
    if (clearError) {
      clearError(key);
    }
  };

  return (
    <div className="space-y-3">
      {/* Step Header */}
      <div>
        <h3 className="text-[1.24rem] font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 1: Role & Quarter Overview</span>
        </h3>
      </div>

      {/* Review Period: Compact, clean card bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl text-xs shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-bold text-[#0F172A]">
            Review Period ({quarter} • {financialYear || "FY"}):
          </span>
          <span className="text-[#334155] font-medium">
            <span className="text-[#334155]">Start Date:</span>{" "}
            <strong className="text-[#0F172A] font-semibold">{startDate || "—"}</strong>
            {"  "}—{"  "}
            <span className="text-[#334155]">End Date:</span>{" "}
            <strong className="text-[#0F172A] font-semibold">{endDate || "—"}</strong>
          </span>
        </div>
        {periodLoading && (
          <span className="text-[11px] text-blue-600 font-medium animate-pulse">
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
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] mb-0.5"
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
