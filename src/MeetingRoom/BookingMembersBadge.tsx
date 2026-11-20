import React from "react";
import { Popover } from "antd";
import { Users, Mail } from "lucide-react";
import { BookingMember, BookingStatus } from "../types/meetingRoom.types";

export const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        OPEN
      </span>
    );
  }
  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        CANCELLED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      CLOSED
    </span>
  );
};

export const BookingMembersBadge: React.FC<{ members: BookingMember[] }> = ({ members }) => {
  if (!members || members.length === 0) {
    return <span className="text-xs text-slate-400 font-medium">No members</span>;
  }

  const content = (
    <div className="w-72 max-h-64 overflow-y-auto space-y-2 p-1 custom-scrollbar">
      <div className="text-xs font-bold text-[#1B2559] border-b border-slate-100 pb-1.5">
        Invited Members ({members.length})
      </div>
      {members.map((m, idx) => (
        <div
          key={`${m.employeeId}-${idx}`}
          className="flex items-start justify-between gap-2 py-1 border-b border-slate-50 last:border-b-0"
        >
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#2B3674] truncate">
              {m.fullName}{" "}
              <span className="text-[10px] font-semibold text-slate-400">({m.employeeId})</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
              <Mail size={10} className="shrink-0 text-[#4318FF]" />
              <span className="truncate">{m.email}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottom">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F7FE] hover:bg-indigo-50 text-[#4318FF] border border-indigo-100 text-xs font-bold transition cursor-pointer"
      >
        <Users size={13} />
        <span>
          {members.length} {members.length === 1 ? "Member" : "Members"}
        </span>
      </button>
    </Popover>
  );
};
