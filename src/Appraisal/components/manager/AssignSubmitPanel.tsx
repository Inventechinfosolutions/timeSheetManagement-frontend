import React from "react";
import { Check, Info } from "lucide-react";
import { WorksphereLogoLoader } from "../../../components/ApiLoadingSpinner";
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
    <div className="relative space-y-3 h-[340px] flex flex-col justify-between">
      {waiting ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[3px]">
          <WorksphereLogoLoader />
        </div>
      ) : null}

      {/* Note Banner */}
      <div className="rounded-xl border border-blue-200/80 bg-[#F0F7FF] p-2.5 sm:p-3 text-left flex items-start gap-3 shadow-2xs shrink-0">
        <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-100/90 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-200/50">
          {submitted ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#0F172A]">
            {submitted ? "Assigned" : waiting ? "Assigning reviews" : "Confirm assignment"}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
            {submitted
              ? "Submitted. This window will close when that finishes."
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
        <div className="rounded-xl border border-blue-200/80 bg-white p-3 shadow-xs flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-blue-50 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
              Employees
              <span className="ml-1.5 text-blue-600 font-semibold text-xs">
                ({summary.people.length})
              </span>
            </p>
          </div>
          <ul className="flex-1 space-y-1.5 overflow-y-auto pr-1.5 custom-scrollbar min-h-0">
            {summary.people.map((person) => (
              <li
                key={person.employeeId}
                className="rounded-xl border border-blue-100/80 bg-blue-50/40 px-2.5 py-1.5 transition-all hover:bg-blue-50/80 hover:border-blue-200"
              >
                <p className="text-sm font-bold text-[#0F172A] leading-tight">{person.employeeName}</p>
                <p className="text-[11px] font-medium text-[#64748B] mt-0.5">{person.employeeId}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Other Assignment Details Fixed Position */}
        <div className="rounded-xl border border-blue-200/80 bg-white p-3 shadow-xs flex flex-col justify-between min-h-0 h-full">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Financial year</p>
                <p className="mt-0.5 font-bold text-[#0F172A] text-sm">{summary.financialYear}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Quarter</p>
                <p className="mt-0.5 font-bold text-[#0F172A] text-sm">{summary.quarter}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Assigned date</p>
                <p className="mt-0.5 font-mono font-bold text-[#0F172A] text-xs">{summary.fromDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">To date</p>
                <p className="mt-0.5 font-mono font-bold text-[#0F172A] text-xs">{summary.toDate}</p>
              </div>
            </div>

            <div className="border-t border-blue-50 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Description</p>
              <div className="max-h-[85px] overflow-y-auto rounded-lg bg-slate-50/90 p-2 border border-slate-200/60 custom-scrollbar">
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
