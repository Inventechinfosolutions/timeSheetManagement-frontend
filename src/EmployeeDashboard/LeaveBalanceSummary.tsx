import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart3, Lightbulb } from "lucide-react";
import type { LeaveSummary } from "./AttendanceStatsCards";

interface Props {
  summary: LeaveSummary;
  /** @deprecated Navigation to leave balance page removed */
  onViewDetails?: () => void;
}

const LeaveBalanceSummary = ({ summary }: Props) => {
  const items = [
    { name: "Available", value: summary.available, color: "#7C3AED", tint: "#F3EEFF" },
    { name: "Used", value: summary.used, color: "#F59E0B", tint: "#FFF7E8" },
    { name: "LOP", value: summary.lop, color: "#F97316", tint: "#FFF1E8" },
  ];
  const chartItems = items.filter((i) => i.value > 0);
  const hasData = chartItems.length > 0;

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl border border-gray-100/80 bg-white shadow-[0_10px_30px_-12px_rgba(67,24,255,0.15)]">
      <div className="relative flex shrink-0 items-center gap-2 overflow-hidden bg-linear-to-r from-[#5B2EFF] to-[#9A4DFF] px-4 py-2.5 text-white">
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
        <BarChart3 size={18} className="shrink-0" />
        <h4 className="text-base font-bold leading-tight tracking-tight sm:text-lg">
          Leave Balance Summary
        </h4>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="relative flex flex-1 flex-col items-center justify-center rounded-2xl bg-linear-to-b from-[#F5F3FF] to-white px-3 py-4 ring-1 ring-[#E9E3FF]">
          <p className="mb-3 text-center text-sm font-semibold text-[#2B3674]">
            Available Leave Balance
          </p>
          <div className="relative h-[150px] w-[150px] shrink-0 sm:h-[170px] sm:w-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasData ? chartItems : [{ name: "Empty", value: 1, color: "#EDE9FE" }]}
                  dataKey="value"
                  innerRadius="70%"
                  outerRadius="100%"
                  paddingAngle={hasData && chartItems.length > 1 ? 3 : 0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  {...({ cornerRadius: 6 } as any)}
                >
                  {(hasData ? chartItems : [{ color: "#EDE9FE" }]).map((item, i) => (
                    <Cell key={i} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold leading-none tracking-tight text-[#1B2559]">
                {summary.available.toFixed(1)}
              </span>
              <span className="mt-1 text-xs font-medium text-[#707EAE]">Days</span>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#A3AED0]">
            This Month
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ring-1 ring-black/5"
              style={{ backgroundColor: item.tint }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#2B3674]">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="text-sm font-extrabold text-[#1B2559]">
                {item.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex w-full items-start gap-2.5 rounded-2xl bg-[#F5F3FF] px-3 py-2.5 text-left">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#7C3AED] shadow-sm">
            <Lightbulb size={14} />
          </span>
          <span className="flex-1 text-xs font-medium leading-snug text-[#475569]">
            You have{" "}
            <strong className="font-extrabold text-[#1B2559]">
              {summary.available.toFixed(1)} days
            </strong>{" "}
            leave balance this month.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceSummary;
