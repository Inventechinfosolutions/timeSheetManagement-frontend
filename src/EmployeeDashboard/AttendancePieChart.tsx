import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  data: any[];
}

const AttendancePieChart = ({ data }: Props) => {
  const chartData = useMemo(() => {
    // Group records by broad status categories for cleaner chart
    const counts = {
      Present: 0,
      "Half Day": 0,
      "Absent/Leave": 0,
      "Holiday/Weekend": 0,
      Pending: 0,
    };

    data.forEach((record) => {
      const status = record.status;
      if (
        status === "Full Day" ||
        status === "WFH" ||
        status === "Client Visit"
      ) {
        counts["Present"]++;
      } else if (status === "Half Day") {
        counts["Half Day"]++;
      } else if (status === "Leave" || status === "Absent") {
        counts["Absent/Leave"]++;
      } else if (status === "Holiday" || status === "Weekend") {
        counts["Holiday/Weekend"]++;
      } else {
        counts["Pending"]++;
      }
    });

    return [
      { name: "Present", value: counts["Present"], color: "#4ADE80" },
      { name: "Half Day", value: counts["Half Day"], color: "#FDBA74" },
      { name: "Absent/Leave", value: counts["Absent/Leave"], color: "#F87171" },
      {
        name: "Holiday/Weekend",
        value: counts["Holiday/Weekend"],
        color: "#CBD5E1",
      },
      // Filter out 0 values so they don't clutter legend
    ].filter((item) => item.value > 0);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full">
      <h3 className="text-lg font-bold text-[#1B2559] mb-4">
        Attendance Distribution
      </h3>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendancePieChart;
