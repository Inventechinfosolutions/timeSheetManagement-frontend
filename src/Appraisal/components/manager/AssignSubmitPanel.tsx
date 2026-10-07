import React from "react";
import { Check } from "lucide-react";
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
    <div className="space-y-3.5">
      <div className="flex flex-col items-center gap-1 py-2 text-center">
        {submitted ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-md shadow-blue-500/25">
            <Check className="h-5 w-5 stroke-[3]" />
          </span>
        ) : waiting ? (
          <div className="h-16 overflow-hidden">
            <div className="origin-top scale-75">
              <WorksphereLogoLoader />
            </div>
          </div>
        ) : null}
        <p className="text-sm font-bold text-[#0F172A]">
          {submitted ? "Assigned" : waiting ? "Assigning reviews" : "Confirm assignment"}
        </p>
        <p className="text-xs text-[#94A3B8]">
          {submitted
            ? "Submitted. This window will close when that finishes."
            : waiting
              ? "Please wait. Nothing else is sent until this finishes."
              : "Check the employees, year, quarter, dates, and description, then confirm."}
        </p>
      </div>
      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}

      <div className="rounded-xl border border-blue-200/80 bg-white px-3.5 py-3 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">Employees</p>
        <ul className="mt-1.5 max-h-[19rem] space-y-1.5 overflow-y-auto pr-1">
          {summary.people.map((person) => (
            <li
              key={person.employeeId}
              className="rounded-xl border border-blue-100 bg-blue-50/30 px-3 py-2"
            >
              <p className="text-sm font-medium leading-5 text-[#0F172A]">{person.employeeName}</p>
              <p className="text-[11px] leading-4 text-[#64748B]">{person.employeeId}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-blue-100 pt-3 text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Financial year</p>
            <p className="mt-0.5 font-medium text-[#0F172A]">{summary.financialYear}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Quarter</p>
            <p className="mt-0.5 font-medium text-[#0F172A]">{summary.quarter}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Assigned date</p>
            <p className="mt-0.5 font-mono font-medium text-[#0F172A]">{summary.fromDate}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">To date</p>
            <p className="mt-0.5 font-mono font-medium text-[#0F172A]">{summary.toDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Description</p>
            <p className="mt-0.5 font-medium text-[#0F172A] whitespace-pre-wrap">{summary.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignSubmitPanel;
