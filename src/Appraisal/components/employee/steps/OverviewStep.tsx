import React, { useEffect, useState } from "react";
import { StepProps } from "../../../types/appraisal.types";
import {
  AlertCircle,
  Calendar,
} from "lucide-react";
import { AppraisalApi } from "../../../reducers/appraisal.reducer";
import { formatAppraisalDisplayDate } from "../../../utils/appraisalHelpers";

export const OverviewStep: React.FC<StepProps> = ({
  formData,
  onChange,
  errors,
  clearError,
  assignment,
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

  // Overall Performance Summary handlers
  const overallVal = formData.overallPerformanceSummary || "";
  const overallError = errors?.overallPerformanceSummary;

  const handleOverallChange = (val: string) => {
    onChange("overallPerformanceSummary", val);
    if (clearError) {
      clearError("overallPerformanceSummary");
    }
  };

  const handleKeyHighlightsChange = (val: string) => {
    onChange("keyHighlights", val);
    if (clearError) clearError("keyHighlights");
  };

  const handleMajorContributionsChange = (val: string) => {
    onChange("majorContributions", val);
    if (clearError) clearError("majorContributions");
  };

  const handleAreasForImprovementChange = (val: string) => {
    onChange("areasForImprovement", val);
    if (clearError) clearError("areasForImprovement");
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

      {/* Form Fields: Side by side 2-column grid with eval-step-card hover animation and titles outside */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall Performance Summary */}
        <div id="field-overallPerformanceSummary" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-overall-summary"
            className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1 flex items-center justify-between"
          >
            <span>
              Overall Performance Summary <span className="text-red-500">*</span>
            </span>
          </label>
          <div
            className={`eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1 ${
              overallError ? "eval-field-has-error" : ""
            }`}
            onClick={() => document.getElementById("input-overall-summary")?.focus()}
          >
            <textarea
              id="input-overall-summary"
              rows={4}
              value={overallVal}
              onChange={(e) => handleOverallChange(e.target.value)}
              placeholder="Summarize your overall performance, main deliverables, and core responsibilities for this quarter..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1 font-medium"
            />
          </div>
          {overallError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{overallError}</span>
            </p>
          )}
        </div>

        {/* Key Highlights */}
        <div id="field-keyHighlights" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-key-highlights"
            className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1"
          >
            Key Highlights
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-key-highlights")?.focus()}
          >
            <textarea
              id="input-key-highlights"
              rows={4}
              value={formData.keyHighlights || ""}
              onChange={(e) => handleKeyHighlightsChange(e.target.value)}
              placeholder="Highlight major milestones achieved, process improvements, or notable wins..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1 font-medium"
            />
          </div>
        </div>

        {/* Major Contributions */}
        <div id="field-majorContributions" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-major-contributions"
            className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1"
          >
            Major Contributions
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-major-contributions")?.focus()}
          >
            <textarea
              id="input-major-contributions"
              rows={4}
              value={formData.majorContributions || ""}
              onChange={(e) => handleMajorContributionsChange(e.target.value)}
              placeholder="Detail your impactful contributions to specific projects, team members, or company initiatives..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1 font-medium"
            />
          </div>
        </div>

        {/* Areas for Improvement */}
        <div id="field-areasForImprovement" className="space-y-1.5 flex flex-col">
          <label
            htmlFor="input-areas-for-improvement"
            className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1"
          >
            Areas for Improvement
          </label>
          <div
            className="eval-step-card !p-3.5 flex flex-col justify-between transition-all duration-200 cursor-text flex-1"
            onClick={() => document.getElementById("input-areas-for-improvement")?.focus()}
          >
            <textarea
              id="input-areas-for-improvement"
              rows={4}
              value={formData.areasForImprovement || ""}
              onChange={(e) => handleAreasForImprovementChange(e.target.value)}
              placeholder="Mention skills to develop, challenges encountered, or areas where you plan to improve next quarter..."
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-[#0F172A] leading-relaxed resize-none eval-custom-scrollbar flex-1 font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewStep;
