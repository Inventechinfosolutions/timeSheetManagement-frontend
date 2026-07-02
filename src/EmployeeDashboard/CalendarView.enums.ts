import { AttendanceStatus } from "../enums";
import type { TimesheetEntry } from "../types";

export enum CalendarVariant {
  Small = "small",
  Large = "large",
  Sidebar = "sidebar",
}

export const CALENDAR_DAYS_OF_WEEK = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];

export const CALENDAR_LEGEND_ITEMS = [
  {
    label: AttendanceStatus.FULL_DAY,
    color: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    label: "Half Day Leave",
    color: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    label: AttendanceStatus.ABSENT,
    color: "bg-red-50",
    border: "border-red-200",
  },
  {
    label: AttendanceStatus.LEAVE,
    color: "bg-red-50",
    border: "border-red-200",
  },
  {
    label: "Today",
    color: "bg-[#4318FF]",
    border: "border-transparent",
  },
  {
    label: AttendanceStatus.HOLIDAY,
    color: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    label: AttendanceStatus.NOT_UPDATED,
    color: "bg-white",
    border: "border-gray-200",
  },
  {
    label: "Blocked",
    color: "bg-gray-100",
    border: "border-gray-200",
  },
];

export const CALENDAR_SIMPLE_LEGEND_DOTS = [
  "bg-[#05CD99]",
  "bg-[#FFB020]",
  "bg-[#EE5D50]",
];

export const isRemoteWorkHalf = (val: string | null | undefined): boolean => {
  const v = (val || "").toLowerCase();
  return (
    v.includes("work from home") ||
    v.includes("wfh") ||
    v.includes("client visit") ||
    v.includes("client place")
  );
};

export const isRestrictedActivityHalf = (
  val: string | null | undefined,
): boolean => {
  const v = (val || "").toLowerCase().trim();
  if (!v) return false;
  if (v.includes("office")) return false;
  if (v.includes("not updated")) return false;
  if (v.includes("upcoming")) return false;
  if (v.includes("holiday")) return false;
  if (v.includes("weekend")) return false;
  if (v.includes("absent")) return false;
  if (isRemoteWorkHalf(v)) return false;
  return true;
};

export const calendarEntryIsClientVisit = (
  entry: TimesheetEntry | undefined,
): boolean => {
  if (!entry) return false;
  if (entry.status === AttendanceStatus.CLIENT_VISIT) return true;
  const st = (entry.status || "").toLowerCase();
  const wl = (entry.workLocation || "").toLowerCase();
  if (st.includes("client visit") || st.includes("client place")) return true;
  if (wl.includes("client visit") || wl.includes("client place")) return true;
  return false;
};

export const calendarEntryIsWFH = (
  entry: TimesheetEntry | undefined,
): boolean => {
  if (!entry) return false;
  if (entry.status === AttendanceStatus.WFH) return true;
  const st = (entry.status || "").toLowerCase();
  if (st.includes("wfh") || st.includes("work from home")) return true;
  const wl = (entry.workLocation || "").toLowerCase();
  if (wl.includes("wfh") || wl.includes("work from home")) return true;
  const h1 = ((entry as any).firstHalf || "").toLowerCase();
  const h2 = ((entry as any).secondHalf || "").toLowerCase();
  return (
    h1.includes("wfh") ||
    h1.includes("work from home") ||
    h2.includes("wfh") ||
    h2.includes("work from home")
  );
};

export const getStatusStyles = (
  statusStr: string | null | undefined,
  location?: string | null,
) => {
  const s = (statusStr || "").toLowerCase();
  const loc = (location || "").toLowerCase();
  const isHalfDay = s.includes("half day") || s === "half day";
  const isWFH =
    s.includes("wfh") ||
    s.includes("work from home") ||
    loc === "wfh" ||
    loc === "work from home";
  const isClientVisit =
    s.includes("client visit") ||
    s.includes("client place") ||
    loc === "client visit" ||
    loc === "client place";
  const isOffice = s === "office" || loc === "office";
  const isLeave = s === "leave" || s === "weekend";

  if (s === "blocked")
    return {
      bg: "bg-gray-200",
      badge: "bg-gray-600 text-white",
      border: "border-transparent",
      text: "text-gray-600",
    };
  if (s === "holiday")
    return {
      bg: "bg-[#DBEAFE]",
      badge: "bg-[#1890FF]/70 text-white font-bold",
      border: "border-[#1890FF]/20",
      text: "text-[#1890FF]",
    };
  if (isWFH || isClientVisit)
    return {
      bg: "bg-[#DBEAFE]",
      badge: "bg-[#4318FF]/70 text-white font-bold",
      border: "border-[#4318FF]/20",
      text: "text-[#4318FF]",
    };
  if (isLeave)
    return {
      bg: "bg-[#FEE2E2]",
      badge: "bg-[#EE5D50]/70 text-white font-bold",
      border: "border-[#EE5D50]/10",
      text: "text-[#EE5D50]",
    };
  if (isOffice || s === "full day")
    return {
      bg: "bg-[#E6FFFA]",
      badge: "bg-[#01B574] text-white font-bold",
      border: "border-[#01B574]/20",
      text: "text-[#01B574]",
    };
  if (isHalfDay)
    return {
      bg: "bg-[#FEF3C7]",
      badge: "bg-[#FFB020]/80 text-white font-bold",
      border: "border-[#FFB020]/20",
      text: "text-[#FFB020]",
    };
  if (s === "absent")
    return {
      bg: "bg-[#FECACA]",
      badge: "bg-[#DC2626]/70 text-white font-bold",
      border: "border-[#DC2626]/20",
      text: "text-[#DC2626]",
    };

  return {
    bg: "bg-[#F8FAFC]",
    badge: "bg-[#64748B]/90 text-white font-bold",
    border: "border-gray-300",
    text: "text-gray-600",
  };
};

export const getShortStatus = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("work from home")) return "WFH";
  return status;
};

export const isWorkLoc = (status: string) => {
  const lower = (status || "").toLowerCase();
  return ["wfh", "work from home", "client visit", "client place", "office"].some(
    (key) => lower.includes(key),
  );
};
