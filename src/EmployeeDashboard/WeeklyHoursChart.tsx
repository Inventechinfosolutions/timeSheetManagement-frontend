import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  data: any[];
  currentDate: Date;
}

const WeeklyHoursChart = ({ data, currentDate }: Props) => {
  const chartData = useMemo(() => {
    // Determine current week range
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Generate array for last 7 days or current week (Mon-Sun)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      weekDays.push(dayDate);
    }

    return weekDays.map((day) => {
      const dateStr = day.toISOString().split("T")[0]; // YYYY-MM-DD
      const record = data.find((r) => {
        const rDate = r.workingDate || (r as any).working_date;
        if (!rDate) return false;
        return new Date(rDate).toISOString().split("T")[0] === dateStr;
      });

      return {
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        hours: record ? record.totalHours || 0 : 0,
        fullDate: dateStr,
      };
    });
  }, [data, currentDate]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full">
      <h3 className="text-lg font-bold text-[#1B2559] mb-4">
        Weekly Work Hours
      </h3>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 0,
            }}
            barSize={20}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "#F1F5F9" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.hours >= 9
                      ? "#4ADE80"
                      : entry.hours >= 5
                        ? "#FDBA74"
                        : "#94A3B8"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyHoursChart;
