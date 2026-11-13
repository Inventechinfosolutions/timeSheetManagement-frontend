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
    <div className="relative space-y-3 min-h-[310px] flex flex-col">
      {/* Top subtle progress bar while waiting/animating */}
      {waiting && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-[#EEF0FF] rounded-full overflow-hidden z-20">
          <div className="h-full bg-[#4318FF] rounded-full animate-[progressIndeterminate_1.2s_ease-in-out_infinite]" />
        </div>
      )}

      <div
        className={`rounded-xl border p-2.5 sm:p-3 text-left flex items-start gap-3 shrink-0 transition-all duration-300 ${
          submitted
            ? "border-emerald-300 bg-emerald-50/80 shadow-emerald-500/10"
            : "border-[#4318FF]/20 bg-[#F4F7FE] shadow-[0_4px_14px_rgba(67,24,255,0.14)]"
        }`}
      >
        <div
          className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
            submitted
              ? "bg-emerald-100 text-emerald-600 border-emerald-300 scale-105"
              : "bg-[#EEF0FF] text-[#4318FF] border-[#4318FF]/20 shadow-[0_3px_10px_rgba(67,24,255,0.18)]"
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
              submitted ? "text-emerald-900 font-extrabold" : "text-[#2B3674]"
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

      {/* Top grid: Employees | FY/Quarter/Dates — equal card heights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
        <div
          className={`h-full rounded-xl border bg-white p-3 shadow-xs flex flex-col transition-all duration-300 ${
            submitted
              ? "border-emerald-300 ring-2 ring-emerald-500/15 shadow-emerald-500/10"
              : "border-[#4318FF]/20"
          }`}
        >
          <div
            className={`flex items-center justify-between mb-1.5 pb-1 border-b shrink-0 transition-colors duration-300 ${
              submitted ? "border-emerald-100" : "border-[#EEF0FF]"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#2B3674]">
              Employees
              <span
                className={`ml-1.5 font-semibold text-xs transition-colors duration-300 ${
                  submitted ? "text-emerald-600 font-bold" : "text-[#4318FF]"
                }`}
              >
                ({summary.people.length})
              </span>
            </p>
          </div>
          <ul className="flex-1 min-h-0 space-y-1.5 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
            {summary.people.map((person) => (
              <li
                key={person.employeeId}
                className={`rounded-xl border px-2.5 py-1.5 transition-all duration-300 ${
                  submitted
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-[#4318FF]/15 bg-[#F4F7FE]/60 hover:bg-[#EEF0FF] hover:border-[#4318FF]/30"
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

        <div
          className={`h-full rounded-xl border bg-white p-3 shadow-xs flex flex-col transition-all duration-300 ${
            submitted
              ? "border-emerald-300 ring-2 ring-emerald-500/15 shadow-emerald-500/10"
              : "border-[#4318FF]/20"
          }`}
        >
          <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-2.5 text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2 flex flex-col justify-center">
              <p
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  submitted ? "text-emerald-700" : "text-[#64748B]"
                }`}
              >
                Financial year
              </p>
              <p className="mt-0.5 font-bold text-[#0F172A] text-base break-words">{summary.financialYear}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2 flex flex-col justify-center">
              <p
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  submitted ? "text-emerald-700" : "text-[#64748B]"
                }`}
              >
                Quarter
              </p>
              <p className="mt-0.5 font-bold text-[#0F172A] text-base break-words">{summary.quarter}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2 flex flex-col justify-center">
              <p
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  submitted ? "text-emerald-700" : "text-[#64748B]"
                }`}
              >
                Assigned date
              </p>
              <p className="mt-0.5 font-bold text-[#0F172A] text-base">{summary.fromDate}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2 flex flex-col justify-center">
              <p
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  submitted ? "text-emerald-700" : "text-[#64748B]"
                }`}
              >
                TO Date (DEADLINE)
              </p>
              <p className="mt-0.5 font-bold text-[#0F172A] text-base">{summary.toDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width description — uses full modal width so long text wraps shorter */}
      <div
        className={`rounded-xl border bg-white p-3 shadow-xs transition-all duration-300 ${
          submitted
            ? "border-emerald-300 ring-2 ring-emerald-500/15 shadow-emerald-500/10"
            : "border-[#4318FF]/20"
        }`}
      >
        <p
          className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 transition-colors duration-300 ${
            submitted ? "text-emerald-700" : "text-[#2B3674]"
          }`}
        >
          Description
        </p>
        <div
          className={`rounded-lg p-2.5 border transition-colors duration-300 ${
            submitted
              ? "bg-emerald-50/40 border-emerald-200/70"
              : "bg-slate-50/90 border-slate-200/60"
          }`}
        >
          <p className="font-normal text-xs text-[#0F172A] whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
            {summary.description || "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignSubmitPanel;
