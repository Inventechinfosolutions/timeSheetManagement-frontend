import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ClipboardCheck, ChevronRight, CheckCircle2, Plane, Home, Briefcase, Clock3 } from "lucide-react";
import { PendingApprovals } from "../../types/adminDashboard.types";

dayjs.extend(relativeTime);

const TYPE_META: Record<string, { icon: typeof Plane; tint: string }> = {
  Leave: { icon: Plane, tint: "bg-red-50 text-[#EE5D50]" },
  "Work From Home": { icon: Home, tint: "bg-sky-50 text-sky-500" },
  "Client Visit": { icon: Briefcase, tint: "bg-violet-50 text-violet-500" },
  "Half Day": { icon: Clock3, tint: "bg-amber-50 text-amber-500" },
};

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-600",
  "Cancellation Requested": "bg-orange-50 text-orange-600",
  "Modification Requested": "bg-indigo-50 text-indigo-600",
};

const formatRange = (from: string, to: string) => {
  const start = dayjs(from);
  const end = dayjs(to);
  if (!end.isValid() || start.isSame(end, "day")) return start.format("D MMM");
  if (start.isSame(end, "month")) return `${start.format("D")} – ${end.format("D MMM")}`;
  return `${start.format("D MMM")} – ${end.format("D MMM")}`;
};

interface PendingApprovalsCardProps {
  data: PendingApprovals;
  /** Route prefix for the requests page, e.g. "/admin-dashboard". */
  basePath?: string;
  isTeam?: boolean;
}

const PendingApprovalsCard = ({ data, basePath = "/admin-dashboard", isTeam = false }: PendingApprovalsCardProps) => {
  const navigate = useNavigate();
  const goToRequests = () => navigate(`${basePath}/requests`);

  const statusPills = [
    { label: "New requests", value: data.byStatus.pending, className: "bg-amber-50 text-amber-700" },
    { label: "Cancellations", value: data.byStatus.cancellation, className: "bg-orange-50 text-orange-700" },
    { label: "Modifications", value: data.byStatus.modification, className: "bg-indigo-50 text-indigo-700" },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F4F7FE] text-[#4318FF]">
            <ClipboardCheck size={18} />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#2B3674] flex items-center gap-2">
              Pending Approvals
              {data.total > 0 && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#EE5D50] text-white">
                  {data.total}
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-400">
              {isTeam ? "Team requests waiting for your decision" : "Requests waiting for a decision"}
            </p>
          </div>
        </div>
        <button
          onClick={goToRequests}
          className="flex items-center gap-1 text-xs font-bold text-[#4318FF] hover:underline shrink-0"
        >
          View all <ChevronRight size={14} />
        </button>
      </div>

      {data.total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <CheckCircle2 size={36} className="text-[#01B574] mb-2" />
          <p className="text-sm font-bold text-[#2B3674]">All caught up</p>
          <p className="text-xs text-gray-400 mt-1">
            {isTeam ? "Your team has no pending requests." : "There are no requests waiting for approval."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {statusPills.map((pill) => (
              <span key={pill.label} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${pill.className}`}>
                {pill.value} {pill.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {Object.entries(data.byType).map(([type, count]) => {
              const meta = TYPE_META[type] ?? TYPE_META.Leave;
              const Icon = meta.icon;
              return (
                <div key={type} className="p-3 rounded-xl bg-[#F8F9FC]">
                  <span className={`inline-flex p-1.5 rounded-lg mb-2 ${meta.tint}`}>
                    <Icon size={14} />
                  </span>
                  <p className="text-xl font-black text-[#2B3674] leading-none">{count}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{type}</p>
                </div>
              );
            })}
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Latest requests</p>
          <div className="flex flex-col divide-y divide-gray-50">
            {data.recent.map((req) => (
              <button
                key={req.id}
                onClick={goToRequests}
                className="flex items-center gap-3 py-2.5 text-left hover:bg-[#F8F9FC] rounded-lg px-2 -mx-2 transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-linear-to-br from-[#4318FF] to-[#868CFF] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {(req.fullName || req.employeeId || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#2B3674] truncate">{req.fullName || req.employeeId}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {req.requestType} · {formatRange(req.fromDate, req.toDate)}
                    {req.duration > 0 && ` · ${req.duration} ${req.duration === 1 ? "day" : "days"}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_BADGE[req.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {req.status}
                  </span>
                  <span className="text-[10px] text-gray-400">{dayjs(req.createdAt).fromNow()}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PendingApprovalsCard;
