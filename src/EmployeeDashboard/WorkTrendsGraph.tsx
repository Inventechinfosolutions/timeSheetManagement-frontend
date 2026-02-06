import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
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
}

const WorkTrendsGraph = ({ employeeId }: Props) => {
  const dispatch = useAppDispatch();
  // Using selector to get data from Redux store, using separate loading state!
  const { trends, trendsLoading } = useAppSelector(
    (state: RootState) => state.attendance,
  );
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    if (employeeId && employeeId !== "Admin") {
      // Format endDate as YYYY-MM-DD
      const dateStr = endDate.toISOString().split("T")[0];

      // Calculate start date (5 months prior)
      const start = new Date(endDate);
      start.setMonth(start.getMonth() - 5);
      const startDateStr = start.toISOString().split("T")[0];

      // Dispatch the thunk to fetch data via Redux
      dispatch(
        fetchWorkTrends({
          employeeId,
          endDate: dateStr,
          startDate: startDateStr,
        }),
      );
    }
  }, [dispatch, employeeId, endDate]);

  // Use local variable for data to avoid refactoring render code too much,
  // or just use 'trends' directly in JSX.
  const data = trends || [];
  // Note: 'loading' here is global. If that's an issue, we could handle it differently,
  // but for now this standardizes it.

  const handlePrev = () => {
    const newDate = new Date(endDate);
    newDate.setMonth(newDate.getMonth() - 5);
    setEndDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(endDate);
    const today = new Date();
    // Don't go past today + epsilon
    if (
      newDate.getMonth() === today.getMonth() &&
      newDate.getFullYear() === today.getFullYear()
    )
      return;

    newDate.setMonth(newDate.getMonth() + 5);
    // Cap at today
    if (newDate > today) {
      setEndDate(today);
    } else {
      setEndDate(newDate);
    }
  };

  const isCurrentTime =
    endDate.getMonth() === new Date().getMonth() &&
    endDate.getFullYear() === new Date().getFullYear();

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
            {(() => {
              const start = new Date(endDate);
              start.setMonth(start.getMonth() - 5);
              return `${start.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`;
            })()}
          </span>
          <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-white hover:shadow-2xs rounded-md transition-all text-gray-500 hover:text-[#4318FF]"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleNext}
              disabled={isCurrentTime}
              className={`p-1 rounded-md transition-all ${isCurrentTime ? "text-gray-300 cursor-not-allowed" : "hover:bg-white hover:shadow-2xs text-gray-500 hover:text-[#4318FF]"}`}
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWFH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A3C4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00A3C4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4318FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4318FF" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tick={{ fill: "#A3AED0", fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A3AED0", fontSize: 12, fontWeight: 500 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "14px",
                  border: "none",
                  boxShadow: "0px 15px 30px -5px rgba(0,0,0,0.1)",
                  padding: "16px",
                }}
                cursor={{
                  stroke: "#B0BBD5",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                itemStyle={{
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "4px 0",
                }}
                labelStyle={{
                  color: "#1B2559",
                  fontWeight: "800",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              />

              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B3674",
                  paddingBottom: "10px",
                }}
              />

              <Area
                type="monotone"
                dataKey="totalLeaves"
                name="Taken Leaves"
                stroke="#E11D48"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorLeaves)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#E11D48" }}
              />
              <Area
                type="monotone"
                dataKey="workFromHome"
                name="Work From Home"
                stroke="#00A3C4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorWFH)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#00A3C4" }}
              />
              <Area
                type="monotone"
                dataKey="clientVisits"
                name="Client Visit"
                stroke="#4318FF"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorClient)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#4318FF" }}
              />
            </AreaChart>
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
