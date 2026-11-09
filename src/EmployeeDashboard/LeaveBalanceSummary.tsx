import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart3, Lightbulb, ChevronRight } from "lucide-react";
import type { LeaveSummary } from "./AttendanceStatsCards";

interface Props {
  summary: LeaveSummary;
  onViewDetails?: () => void;
}

const LeaveBalanceSummary = ({ summary, onViewDetails }: Props) => {
  const items = [
    { name: "Available", value: summary.available, color: "#7C3AED" },
    { name: "Used", value: summary.used, color: "#F59E0B" },
    { name: "LOP", value: summary.lop, color: "#F97316" },
  ];
  const chartItems = items.filter((i) => i.value > 0);
  const hasData = chartItems.length > 0;

  return (
    <div className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-3xl border border-gray-100/80 bg-white shadow-[0_10px_30px_-12px_rgba(67,24,255,0.15)]">
      <div className="relative flex items-center gap-2 overflow-hidden bg-linear-to-r from-[#5B2EFF] to-[#9A4DFF] px-5 py-3.5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <BarChart3 size={18} />
        <h4 className="text-base font-bold tracking-tight">Leave Balance Summary</h4>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-[130px] w-[130px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasData ? chartItems : [{ name: "Empty", value: 1, color: "#EEF2FF" }]}
                  dataKey="value"
                  innerRadius="72%"
                  outerRadius="100%"
                  paddingAngle={hasData && chartItems.length > 1 ? 4 : 0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  {...({ cornerRadius: 6 } as any)}
                >
                  {(hasData ? chartItems : [{ color: "#EEF2FF" }]).map((item, i) => (
                    <Cell key={i} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold leading-none text-[#1B2559]">
                {summary.available.toFixed(1)}
              </span>
              <span className="mt-1 text-[11px] font-semibold text-[#A3AED0]">Days</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 font-semibold text-[#2B3674]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-extrabold text-[#1B2559]">{item.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          disabled={!onViewDetails}
          className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F3FF] px-3.5 py-3 text-left transition-colors enabled:hover:bg-[#EDE9FE] disabled:cursor-default"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#7C3AED] shadow-sm">
            <Lightbulb size={16} />
          </span>
          <span className="flex-1 text-xs font-medium leading-snug text-[#475569]">
            You have <strong className="font-extrabold text-[#1B2559]">{summary.available.toFixed(1)} days</strong>{" "}
            leave balance this month.
          </span>
          {onViewDetails && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-white">
              <ChevronRight size={14} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default LeaveBalanceSummary;
