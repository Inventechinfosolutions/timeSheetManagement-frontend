import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimesheetEntry } from "../types";
import { LOCATION_META, LocationKey, getDayLocations } from "./dashboardUtils";

interface Props {
  employeeId?: string;
  currentMonth: Date;
  entries: TimesheetEntry[];
}

const SERIES: LocationKey[] = ["clientVisit", "office", "leave", "wfh"];

const WorkTrendsGraph = ({ currentMonth, entries }: Props) => {
  const { data, totals } = useMemo(() => {
    const running: Record<LocationKey, number> = { office: 0, wfh: 0, clientVisit: 0, leave: 0 };
    const rows = entries
      .filter((e) => !e.isFuture)
      .map((entry) => {
        const parts = getDayLocations(entry);
        SERIES.forEach((key) => {
          running[key] += parts[key] || 0;
        });
        return {
          label: entry.fullDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          ...running,
        };
      });
    return { data: rows, totals: { ...running } };
  }, [entries]);

  const hasActivity = SERIES.some((key) => totals[key] > 0);
  const tickInterval = Math.max(0, Math.ceil(data.length / 5) - 1);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_-12px_rgba(67,24,255,0.15)] border border-gray-100/80 flex flex-col h-full min-h-[300px]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-[#1B2559] tracking-tight">
            Work Location Trend
          </h4>
          <p className="text-[11px] text-[#A3AED0] font-semibold mt-0.5">Cumulative days this month</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#F4F7FE] px-3 py-1 text-[11px] font-bold text-[#4318FF] ring-1 ring-[#4318FF]/10">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {SERIES.map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs font-semibold text-[#2B3674]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LOCATION_META[key].color }} />
            {LOCATION_META[key].label}
            <span className="text-[#A3AED0]">{totals[key].toFixed(1)}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 w-full min-h-[190px]">
        {hasActivity ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
              <defs>
                {SERIES.map((key) => (
                  <linearGradient key={key} id={`trend-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LOCATION_META[key].color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={LOCATION_META[key].color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E9EDF7" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
                tick={{ fill: "#A3AED0", fontSize: 11, fontWeight: 600 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals
                tick={{ fill: "#A3AED0", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ stroke: "#4318FF", strokeWidth: 1, strokeDasharray: "4 4" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #EEF2FF",
                  boxShadow: "0px 12px 24px -8px rgba(27,37,89,0.18)",
                  padding: "8px 12px",
                }}
                labelStyle={{ fontSize: 11, fontWeight: 700, color: "#A3AED0", marginBottom: 4 }}
                itemStyle={{ fontSize: 12, fontWeight: 700, padding: 0 }}
                formatter={(value: any, name: any) => [Number(value).toFixed(1), name]}
              />
              {SERIES.map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={LOCATION_META[key].label}
                  stroke={LOCATION_META[key].color}
                  strokeWidth={2.5}
                  fill={`url(#trend-${key})`}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60">
            <div className="text-sm font-medium text-gray-400">No activity recorded for this period</div>
            <div className="mt-1 text-xs text-gray-300">Try navigating to a different month</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTrendsGraph;
