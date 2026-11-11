import { useMemo, useState } from "react";
import { CalendarCheck, MapPin, ArrowRight, Filter } from "lucide-react";
import { TimesheetEntry } from "../types";
import { Dropdown } from "../components/ui";
import { formatHours, getPrimaryLocationLabel, getStatusBadge } from "./dashboardUtils";

interface Props {
  entries: TimesheetEntry[];
  onRowClick?: (timestamp: number) => void;
  onViewAll?: () => void;
  limit?: number;
}

const STATUS_OPTIONS = [
  "All Status",
  "Present",
  "WFH",
  "Client Visit",
  "Half Day",
  "Leave",
  "Absent",
  "Not Updated",
  "Weekend",
  "Holiday",
].map((s) => ({ value: s, label: s }));

const RecentAttendanceList = ({ entries, onRowClick, onViewAll, limit = 6 }: Props) => {
  const [statusFilter, setStatusFilter] = useState("All Status");

  const rows = useMemo(() => {
    return entries
      .filter((e) => !e.isFuture)
      .slice()
      .sort((a, b) => b.fullDate.getTime() - a.fullDate.getTime())
      .filter((e) => statusFilter === "All Status" || getStatusBadge(e).label === statusFilter)
      .slice(0, limit);
  }, [entries, statusFilter, limit]);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100/80 bg-white p-5 shadow-[0_10px_30px_-12px_rgba(67,24,255,0.15)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F7FE] text-[#4318FF]">
            <CalendarCheck size={18} />
          </span>
          <div>
            <h4 className="text-base font-bold tracking-tight text-[#1B2559]">Recent Attendance</h4>
            <p className="text-[11px] font-semibold text-[#A3AED0]">Latest {limit} days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            defaultValue="All Status"
            prefixIcon={<Filter size={13} />}
            allowClear
            showTooltip={false}
            className="shrink-0"
            maxLabelWidth="max-w-[110px]"
            menuClassName="w-full"
          />
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1 rounded-full bg-[#4318FF] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#4318FF]/30 transition-all hover:bg-[#3B15E0] active:scale-95"
            >
              View All <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="-mx-1 flex-1 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-[#A3AED0]">
              <th className="rounded-l-xl bg-[#F8FAFF] px-3 py-2.5">Date</th>
              <th className="bg-[#F8FAFF] px-3 py-2.5">Day</th>
              <th className="bg-[#F8FAFF] px-3 py-2.5">Status</th>
              <th className="bg-[#F8FAFF] px-3 py-2.5">Working Hours</th>
              <th className="rounded-r-xl bg-[#F8FAFF] px-3 py-2.5">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm font-medium text-gray-400">
                  No records for this filter
                </td>
              </tr>
            ) : (
              rows.map((entry) => {
                const badge = getStatusBadge(entry);
                const location = getPrimaryLocationLabel(entry);
                return (
                  <tr
                    key={entry.fullDate.getTime()}
                    onClick={() => onRowClick?.(entry.fullDate.getTime())}
                    className={`border-b border-gray-50 text-sm last:border-0 ${onRowClick ? "cursor-pointer hover:bg-[#F8FAFF]" : ""} ${entry.isToday ? "bg-[#F5F3FF]/60" : ""}`}
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-[#1B2559]">
                      {entry.fullDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                      {entry.isToday && (
                        <span className="ml-2 rounded-full bg-[#4318FF] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                          Today
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#707EAE]">
                      {entry.fullDate.toLocaleDateString("en-US", { weekday: "short" })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${badge.className}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-[#2B3674]">{formatHours(entry.totalHours)}</td>
                    <td className="px-3 py-2.5 font-medium text-[#707EAE]">
                      {location === "-" ? (
                        "-"
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} className="text-[#4318FF]" />
                          {location}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentAttendanceList;
