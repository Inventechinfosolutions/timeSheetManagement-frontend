import { AttendanceStatus } from "../enums";
import { TimesheetEntry } from "../types";

export type LocationKey = "office" | "wfh" | "clientVisit" | "leave";

export const LOCATION_META: Record<LocationKey, { label: string; color: string }> = {
  clientVisit: { label: "Client Visit", color: "#7C3AED" },
  office: { label: "Office", color: "#2563EB" },
  leave: { label: "Taken Leave", color: "#F97316" },
  wfh: { label: "WFH", color: "#10B981" },
};

const classifyText = (value?: string | null): LocationKey | null => {
  const v = String(value || "").toLowerCase();
  if (!v) return null;
  if (v.includes("leave")) return "leave";
  if (v.includes("client")) return "clientVisit";
  if (v.includes("wfh") || v.includes("work from home")) return "wfh";
  if (v.includes("office") || v.includes("present") || v.includes("full day")) return "office";
  return null;
};

/** Splits a day into location shares (halves count as 0.5). */
export const getDayLocations = (entry: TimesheetEntry): Partial<Record<LocationKey, number>> => {
  const result: Partial<Record<LocationKey, number>> = {};
  const add = (key: LocationKey | null, amount: number) => {
    if (key) result[key] = (result[key] || 0) + amount;
  };

  const h1 = classifyText(entry.firstHalf as string);
  const h2 = classifyText(entry.secondHalf as string);
  if (h1 || h2) {
    add(h1, 0.5);
    add(h2, 0.5);
    return result;
  }

  switch (entry.status) {
    case AttendanceStatus.LEAVE:
      add("leave", 1);
      break;
    case AttendanceStatus.WFH:
      add("wfh", 1);
      break;
    case AttendanceStatus.CLIENT_VISIT:
      add("clientVisit", 1);
      break;
    case AttendanceStatus.FULL_DAY:
    case AttendanceStatus.PRESENT:
      add(classifyText(entry.workLocation as string) || "office", 1);
      break;
    case AttendanceStatus.HALF_DAY:
      add(classifyText(entry.workLocation as string) || "office", 0.5);
      break;
  }
  return result;
};

export const getPrimaryLocationLabel = (entry: TimesheetEntry): string => {
  const parts = getDayLocations(entry);
  const keys = (Object.keys(parts) as LocationKey[]).filter((k) => k !== "leave");
  if (keys.length === 0) return "-";
  return keys.map((k) => LOCATION_META[k].label).join(" / ");
};

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  [AttendanceStatus.FULL_DAY]: { label: "Present", className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  [AttendanceStatus.PRESENT]: { label: "Present", className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  [AttendanceStatus.WFH]: { label: "WFH", className: "bg-teal-50 text-teal-600 ring-teal-100" },
  [AttendanceStatus.CLIENT_VISIT]: { label: "Client Visit", className: "bg-violet-50 text-violet-600 ring-violet-100" },
  [AttendanceStatus.HALF_DAY]: { label: "Half Day", className: "bg-amber-50 text-amber-600 ring-amber-100" },
  [AttendanceStatus.LEAVE]: { label: "Leave", className: "bg-rose-50 text-rose-600 ring-rose-100" },
  [AttendanceStatus.ABSENT]: { label: "Absent", className: "bg-orange-50 text-orange-600 ring-orange-100" },
  [AttendanceStatus.HOLIDAY]: { label: "Holiday", className: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
  [AttendanceStatus.WEEKEND]: { label: "Weekend", className: "bg-sky-50 text-sky-600 ring-sky-100" },
  [AttendanceStatus.NOT_UPDATED]: { label: "Not Updated", className: "bg-yellow-50 text-yellow-700 ring-yellow-100" },
  [AttendanceStatus.PENDING]: { label: "Pending", className: "bg-slate-50 text-slate-500 ring-slate-200" },
  [AttendanceStatus.LOCKED]: { label: "Locked", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export const getStatusBadge = (entry: TimesheetEntry) => {
  if (!entry.status && entry.isWeekend) return STATUS_BADGE[AttendanceStatus.WEEKEND];
  if (!entry.status) return { label: "-", className: "bg-slate-50 text-slate-400 ring-slate-100" };
  return (
    STATUS_BADGE[entry.status] || {
      label: String(entry.status),
      className: "bg-slate-50 text-slate-500 ring-slate-200",
    }
  );
};

export const formatHours = (hours?: number | null) => {
  const h = Number(hours || 0);
  if (!h) return "-";
  const whole = Math.floor(h);
  const minutes = Math.round((h - whole) * 60);
  return minutes ? `${whole}h ${minutes}m` : `${whole}h`;
};
