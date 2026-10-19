import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Briefcase, CheckCircle2, ChevronRight, Clock3, Home, ListChecks, Plane, Search, X } from "lucide-react";
import { PendingRequestItem } from "../../types/adminDashboard.types";

dayjs.extend(relativeTime);

type StatusFilter = "ALL" | "Pending" | "Cancellation Requested" | "Modification Requested";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "Pending", label: "New" },
  { key: "Cancellation Requested", label: "Cancellation" },
  { key: "Modification Requested", label: "Modification" },
];

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-600",
  "Cancellation Requested": "bg-orange-50 text-orange-600",
  "Modification Requested": "bg-indigo-50 text-indigo-600",
};

const typeMeta = (requestType: string) => {
  const type = requestType.toLowerCase();
  if (type.includes("+") || type.includes("half day")) return { icon: Clock3, color: "#FFB547" };
  if (type.includes("work from home") || type === "wfh") return { icon: Home, color: "#39B8FF" };
  if (type.includes("client visit")) return { icon: Briefcase, color: "#7551FF" };
  return { icon: Plane, color: "#EE5D50" };
};

const formatRange = (from: string, to: string) => {
  const start = dayjs(from);
  const end = dayjs(to);
  if (!end.isValid() || start.isSame(end, "day")) return start.format("D MMM YYYY");
  if (start.isSame(end, "month")) return `${start.format("D")} – ${end.format("D MMM YYYY")}`;
  if (start.isSame(end, "year")) return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;
  return `${start.format("D MMM YYYY")} – ${end.format("D MMM YYYY")}`;
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

interface PendingApprovalsTableProps {
  items: PendingRequestItem[];
  /** Route prefix for the requests page, e.g. "/manager-dashboard". */
  basePath: string;
}

const PendingApprovalsTable = ({ items, basePath }: PendingApprovalsTableProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const goToRequests = () => navigate(`${basePath}/requests`);

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const item of items) byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    return byStatus;
  }, [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "ALL" && item.status !== filter) return false;
      if (!q) return true;
      return [item.fullName, item.employeeId, item.requestType, item.department]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, filter, query]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F4F7FE] text-[#4318FF]">
            <ListChecks size={18} />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#2B3674] flex items-center gap-2">
              Requests Awaiting Your Approval
              {items.length > 0 && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#EE5D50] text-white">
                  {items.length}
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-400">Every open request from your team, newest first</p>
          </div>
        </div>
        <button
          onClick={goToRequests}
          className="flex items-center gap-1 text-xs font-bold text-[#4318FF] hover:underline shrink-0"
        >
          Open Request Management <ChevronRight size={14} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 rounded-2xl bg-[#F8F9FC]">
          <CheckCircle2 size={32} className="text-[#01B574] mb-2" />
          <p className="text-sm font-bold text-[#2B3674]">Nothing to approve</p>
          <p className="text-xs text-gray-400 mt-1">New requests from your team will appear here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(({ key, label }) => {
                const count = key === "ALL" ? items.length : counts[key] || 0;
                const active = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      active ? "bg-[#4318FF] text-white shadow-sm" : "bg-[#F4F7FE] text-[#2B3674] hover:bg-[#E9EDF7]"
                    }`}
                  >
                    {label}
                    <span className={`ml-1.5 ${active ? "text-white/80" : "text-gray-400"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, ID or type…"
                className="w-full pl-8 pr-8 py-2 text-xs font-semibold text-[#2B3674] bg-[#F8F9FC] border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-[#4318FF]/30 placeholder:text-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="max-h-[420px] overflow-auto custom-scrollbar">
              <table className="w-full min-w-[760px] text-left">
                <thead className="sticky top-0 z-10 bg-[#F8F9FC]">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-3 text-center w-14">Sl No</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Request</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3 text-center">Days</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                        No requests match this filter.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item, index) => {
                      const meta = typeMeta(item.requestType);
                      const Icon = meta.icon;
                      const name = item.fullName || item.employeeId;
                      return (
                        <tr key={item.id} className="hover:bg-[#F8F9FC] transition-colors">
                          <td className="px-4 py-3 text-center text-xs font-semibold text-[#475569]">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-9 h-9 rounded-full bg-linear-to-br from-[#4318FF] to-[#868CFF] text-white flex items-center justify-center text-xs font-black shrink-0">
                                {initialsOf(name)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#2B3674] truncate">{name}</p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {[item.employeeId, item.designation || item.department].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap"
                              style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
                            >
                              <Icon size={12} /> {item.requestType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-[#2B3674] whitespace-nowrap">
                            {formatRange(item.fromDate, item.toDate)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-black text-[#2B3674]">
                            {item.duration > 0 ? item.duration : "–"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${STATUS_BADGE[item.status] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap" title={dayjs(item.createdAt).format("D MMM YYYY, h:mm A")}>
                            {dayjs(item.createdAt).fromNow()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={goToRequests}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4318FF] text-white text-xs font-bold shadow-sm hover:bg-[#3311CC] transition-colors"
                            >
                              Review <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PendingApprovalsTable;
