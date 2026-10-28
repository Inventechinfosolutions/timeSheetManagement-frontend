import React from "react";
import { Check, Info } from "lucide-react";
import { AssignButtonState } from "../../enums/appraisal.enums";

export interface AssignSubmitPerson {
  employeeId: string;
  employeeName: string;
}

export interface AssignSubmitSummary {
  people: AssignSubmitPerson[];
  financialYear: string;
  quarter: string;
  fromDate: string;
  toDate: string;
  description: string;
}

interface AssignSubmitPanelProps {
  summary: AssignSubmitSummary;
  status: AssignButtonState;
  error?: string;
}

export const AssignSubmitPanel: React.FC<AssignSubmitPanelProps> = ({ summary, status, error }) => {
  const submitted = status === AssignButtonState.ASSIGNED;
  const waiting = status === AssignButtonState.ANIMATING;

  return (
    <div className="relative space-y-3 min-h-[310px] max-h-[340px] flex flex-col justify-between">
      {/* Top subtle progress bar while waiting/animating */}
      {waiting && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-100 rounded-full overflow-hidden z-20">
          <div className="h-full bg-blue-600 rounded-full animate-[progressIndeterminate_1.2s_ease-in-out_infinite]" />
        </div>
      )}

      <div
        className={`rounded-xl border p-2.5 sm:p-3 text-left flex items-start gap-3 shadow-2xs shrink-0 transition-all duration-300 ${
          submitted
            ? "border-emerald-300 bg-emerald-50/80 shadow-emerald-500/10"
            : "border-blue-200/80 bg-[#F0F7FF]"
        }`}
      >
        <div
          className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
            submitted
              ? "bg-emerald-100 text-emerald-600 border-emerald-300 scale-105"
              : "bg-blue-100/90 text-[#2563EB] border-blue-200/50"
          }`}
        >
          {submitted ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={`text-xs font-bold transition-colors duration-300 ${
              submitted ? "text-emerald-900 font-extrabold" : "text-[#0F172A]"
            }`}
          >
            {submitted ? "Assigned" : waiting ? "Assigning reviews" : "Confirm assignment"}
          </p>
          <p
            className={`text-[11px] mt-0.5 leading-relaxed transition-colors duration-300 ${
              submitted ? "text-emerald-700 font-medium" : "text-[#64748B]"
            }`}
          >
            {submitted
              ? "Reviews assigned successfully. This window will close shortly."
              : waiting
                ? "Please wait. Nothing else is sent until this finishes."
                : "Check the employees, year, quarter, dates, and description, then confirm."}
          </p>
        </div>
      </div>

      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}

      {/* 2-Column Split: Employees on Left (Scrollable), Details on Right (Fixed Position) */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch min-h-0">
        {/* Left Column: Employees with Scrollbar */}
        <div
          className={`rounded-xl border bg-white p-3 shadow-xs flex flex-col min-h-0 h-full transition-all duration-300 ${
            submitted
              ? "border-emerald-300 ring-2 ring-emerald-500/15 shadow-emerald-500/10"
              : "border-blue-200/80"
          }`}
        >
          <div
            className={`flex items-center justify-between mb-1.5 pb-1 border-b shrink-0 transition-colors duration-300 ${
              submitted ? "border-emerald-100" : "border-blue-50"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
              Employees
              <span
                className={`ml-1.5 font-semibold text-xs transition-colors duration-300 ${
                  submitted ? "text-emerald-600 font-bold" : "text-blue-600"
                }`}
              >
                ({summary.people.length})
              </span>
            </p>
          </div>
          <ul className="flex-1 space-y-1.5 overflow-y-auto pr-1.5 custom-scrollbar min-h-0">
            {summary.people.map((person) => (
              <li
                key={person.employeeId}
                className={`rounded-xl border px-2.5 py-1.5 transition-all duration-300 ${
                  submitted
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-blue-100/80 bg-blue-50/40 hover:bg-blue-50/80 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] leading-tight">{person.employeeName}</p>
                    <p className="text-[11px] font-medium text-[#64748B] mt-0.5">{person.employeeId}</p>
                  </div>
                  {submitted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs animate-[badgePop_0.3s_cubic-bezier(0.34,1.4,0.64,1)]">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Assigned
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Other Assignment Details Fixed Position */}
        <div
          className={`rounded-xl border bg-white p-3 shadow-xs flex flex-col justify-between min-h-0 h-full transition-all duration-300 ${
            submitted
              ? "border-emerald-300 ring-2 ring-emerald-500/15 shadow-emerald-500/10"
              : "border-blue-200/80"
          }`}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    submitted ? "text-emerald-700" : "text-[#64748B]"
                  }`}
                >
                  Financial year
                </p>
                <p className="mt-0.5 font-bold text-[#0F172A] text-sm">{summary.financialYear}</p>
              </div>
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    submitted ? "text-emerald-700" : "text-[#64748B]"
                  }`}
                >
                  Quarter
                </p>
                <p className="mt-0.5 font-bold text-[#0F172A] text-sm">{summary.quarter}</p>
              </div>
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    submitted ? "text-emerald-700" : "text-[#64748B]"
                  }`}
                >
                  Assigned date
                </p>
                <p className="mt-0.5 font-mono font-bold text-[#0F172A] text-xs">{summary.fromDate}</p>
              </div>
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    submitted ? "text-emerald-700" : "text-[#64748B]"
                  }`}
                >
                  To date
                </p>
                <p className="mt-0.5 font-mono font-bold text-[#0F172A] text-xs">{summary.toDate}</p>
              </div>
            </div>

            <div
              className={`border-t pt-2 transition-colors duration-300 ${
                submitted ? "border-emerald-100" : "border-blue-50"
              }`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300 ${
                  submitted ? "text-emerald-700" : "text-[#64748B]"
                }`}
              >
                Description
              </p>
              <div
                className={`max-h-[85px] overflow-y-auto rounded-lg p-2 border custom-scrollbar transition-colors duration-300 ${
                  submitted
                    ? "bg-emerald-50/40 border-emerald-200/70"
                    : "bg-slate-50/90 border-slate-200/60"
                }`}
              >
                <p className="font-normal text-xs text-[#0F172A] whitespace-pre-wrap leading-relaxed">
                  {summary.description || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignSubmitPanel;
