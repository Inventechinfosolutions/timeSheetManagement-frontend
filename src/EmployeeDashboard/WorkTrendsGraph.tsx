import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchWorkTrends } from "../reducers/employeeAttendance.reducer";
import { RootState } from "../store";

// Interface for the data structure
// (Ideally imported from reducer, but can keep here or import)

interface Props {
  employeeId?: string;
  currentMonth: Date;
}

const WorkTrendsGraph = ({ employeeId, currentMonth }: Props) => {
  const dispatch = useAppDispatch();
  // Using selector to get data from Redux store, using separate loading state!
  const { trends, trendsLoading } = useAppSelector(
    (state: RootState) => state.attendance,
  );
  const [hoveredData, setHoveredData] = useState<{ name: string; value: number } | null>(null);

  useEffect(() => {
    if (employeeId && employeeId !== "Admin") {
      // Calculate first and last day of the selected month
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const startDateStr = start.toISOString().split("T")[0];
      const dateStr = end.toISOString().split("T")[0];

      // Dispatch the thunk to fetch data via Redux
      dispatch(
        fetchWorkTrends({
          employeeId,
          endDate: dateStr,
          startDate: startDateStr,
        }),
      );
    }
  }, [dispatch, employeeId, currentMonth]);

  // Use local variable for data to avoid refactoring render code too much,
  // or just use 'trends' directly in JSX.
  const data = trends || [];

  if (trendsLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full min-h-[400px] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4318FF]/20 border-t-[#4318FF] rounded-full animate-spin"></div>
        <div className="text-gray-400 text-sm mt-3 font-medium">
          Loading trends...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-[#1B2559]">Work Trend</h4>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
              barSize={60}
              barGap={12}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                horizontal={true}
                stroke="#E0E5F2"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A3AED0", fontSize: 11, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A3AED0", fontSize: 12, fontWeight: 500 }}
              />

              <Legend
                verticalAlign="top"
                height={40}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B3674",
                  paddingBottom: "16px",
                }}
              />

              {/* Fixed Center Pill Label like Donut Chart */}
              {hoveredData && (
                <g>
                  <rect
                    x="40%"
                    y="45%"
                    width="120"
                    height="40"
                    rx="20"
                    fill="white"
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.1))" }}
                  />
                  <text
                    x="40%"
                    y="45%"
                    dx="60"
                    dy="25"
                    textAnchor="middle"
                    fill="#1B2559"
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      fontFamily: "inherit",
                    }}
                  >
                    {hoveredData.name} : {hoveredData.value}
                  </text>
                </g>
              )}

              <Bar
                dataKey="totalLeaves"
                name="Taken Leaves"
                fill="#F43F5E"
                radius={[8, 8, 0, 0]}
                activeBar={{ fill: '#FB7185' }}
                onMouseEnter={(data: any) => setHoveredData({ name: "Taken Leaves", value: data.totalLeaves })}
                onMouseLeave={() => setHoveredData(null)}
              />
              <Bar
                dataKey="halfDays"
                name="Half Day"
                fill="#F59E0B"
                radius={[8, 8, 0, 0]}
                activeBar={{ fill: '#FBBF24' }}
                onMouseEnter={(data: any) => setHoveredData({ name: "Half Day", value: data.halfDays })}
                onMouseLeave={() => setHoveredData(null)}
              />
              <Bar
                dataKey="workFromHome"
                name="Work From Home"
                fill="#06B6D4"
                radius={[8, 8, 0, 0]}
                activeBar={{ fill: '#22D3EE' }}
                onMouseEnter={(data: any) => setHoveredData({ name: "Work From Home", value: data.workFromHome })}
                onMouseLeave={() => setHoveredData(null)}
              />
              <Bar
                dataKey="clientVisits"
                name="Client Visit"
                fill="#8B5CF6"
                radius={[8, 8, 0, 0]}
                activeBar={{ fill: '#A78BFA' }}
                onMouseEnter={(data: any) => setHoveredData({ name: "Client Visit", value: data.clientVisits })}
                onMouseLeave={() => setHoveredData(null)}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex bg-gray-50 flex-col items-center justify-center h-full rounded-xl border-dashed border-2 border-gray-200">
            <div className="text-gray-400 font-medium text-sm">
              No activity recorded for this period
            </div>
            <div className="text-gray-300 text-xs mt-1">
              Try navigating to a different month
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTrendsGraph;
