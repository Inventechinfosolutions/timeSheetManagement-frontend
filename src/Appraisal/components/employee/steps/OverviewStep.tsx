import React, { useEffect, useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import {
  AlertCircle,
  Calendar,
} from "lucide-react";
import { AppraisalApi } from "../../../reducers/appraisal.reducer";
import { formatAppraisalDisplayDate } from "../../../utils/appraisalHelpers";

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
    const toYear = fromYear + 1;

    // Standard Indian FY quarter date fallbacks
    let defaultStart = "";
    let defaultEnd = "";
    if (quarter === "Q1") {
      defaultStart = `01-04-${fromYear}`;
      defaultEnd = `30-06-${fromYear}`;
    } else if (quarter === "Q2") {
      defaultStart = `01-07-${fromYear}`;
      defaultEnd = `30-09-${fromYear}`;
    } else if (quarter === "Q3") {
      defaultStart = `01-10-${fromYear}`;
      defaultEnd = `31-12-${fromYear}`;
    } else if (quarter === "Q4") {
      defaultStart = `01-01-${toYear}`;
      defaultEnd = `31-03-${toYear}`;
    }

    if (!formData.reviewPeriodStart && defaultStart) {
      setStartDate(defaultStart);
      onChange("reviewPeriodStart", defaultStart);
    }
    if (!formData.reviewPeriodEnd && defaultEnd) {
      setEndDate(defaultEnd);
      onChange("reviewPeriodEnd", defaultEnd);
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
  }, [quarter, financialYear]);

  // Unified field change handler
  const handleFieldChange = (key: string, val: string) => {
    onChange(key, val);
    if (clearError) {
      clearError(key);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-blue-100 pb-4">
        <h3 className="text-lg font-bold text-[#0F172A]">
          <span className="eval-title-anim">Step 1: Role & Quarter Overview</span>
          <span className="eval-title-accent-line" />
        </h3>
        <p className="text-xs text-[#64748B] mt-1 eval-subtitle-anim">
          Review your quarter timeline and detail your performance, accomplishments, and focus areas.
        </p>
      </div>

      {/* Review Period: Compact, clean single-line bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-bold text-[#0F172A]">
            Review Period ({quarter} • {financialYear || "FY"}):
          </span>
          <span className="text-[#334155] font-medium">
            <span className="text-[#64748B]">Start Date:</span>{" "}
            <strong className="text-[#0F172A] font-semibold">{startDate || "—"}</strong>
            {"  "}—{"  "}
            <span className="text-[#64748B]">End Date:</span>{" "}
            <strong className="text-[#0F172A] font-semibold">{endDate || "—"}</strong>
          </span>
        </div>
        {periodLoading && (
          <span className="text-[11px] text-blue-600 font-medium animate-pulse">
            Fetching dates...
          </span>
        )}
      </div>

      {/* Manager Instructions Banner if provided */}
      {assignment?.description?.trim() && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs space-y-1 shadow-2xs">
          <span className="font-bold text-[#0F172A] uppercase tracking-wider block text-[11px]">
            Manager Instructions:
          </span>
          <p className="text-[#334155] whitespace-pre-line font-medium leading-relaxed">
            {assignment.description.trim()}
          </p>
        </div>
      )}

      {/* Form Fields: Side by side 2-column grid with eval-step-card hover animation and titles outside */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OVERVIEW_FIELD_CONFIGS.map((field) => {
          const value = formData[field.key] || "";
          const error = errors?.[field.key];

          return (
            <div key={field.key} id={field.containerId} className="space-y-1.5 flex flex-col">
              <label
                htmlFor={field.inputId}
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1 flex items-center justify-between"
              >
                <span>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </span>
              </label>
              <div
                className={`eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1 ${
                  error ? "eval-field-has-error" : ""
                }`}
                onClick={() => document.getElementById(field.inputId)?.focus()}
              >
                <textarea
                  id={field.inputId}
                  rows={4}
                  value={value}
                  disabled={readOnly}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1 font-medium placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 eval-placeholder-sm"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
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
