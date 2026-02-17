import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";

// Interface for the data structure
// (Ideally imported from reducer, but can keep here or import)

interface Props {
  employeeId?: string;
  currentMonth: Date;
}

const WorkTrendsGraph = ({ currentMonth }: Props) => {
  // Using selector to get data from Redux store, using separate loading state!
  const { trends, trendsLoading } = useAppSelector(
    (state: RootState) => state.attendance,
  );

  // No need to fetch trends here, as the parent (TodayAttendance) already dispatches it!
  // This avoids duplicate/conflicting requests.

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
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
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

              <Tooltip
                shared={false}
                cursor={{ fill: "rgba(0, 0, 0, 0.04)", radius: 10 }}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)",
                  padding: "4px 10px",
                }}
                itemStyle={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1B2559",
                }}
                labelStyle={{ display: "none" }}
                separator=": "
                formatter={(value: any, name: any) => [
                  Number(value).toFixed(1),
                  name,
                ]}
              />

              <Bar
                dataKey="totalLeaves"
                name="Taken Leaves"
                fill="#F43F5E"
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "#FB7185" }}
              >
                <LabelList
                  dataKey="totalLeaves"
                  position="top"
                  style={{ fill: "#A3AED0", fontSize: 10, fontWeight: 700 }}
                  offset={8}
                  formatter={(val: any) =>
                    val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                  }
                />
              </Bar>

              <Bar
                dataKey="workFromHome"
                name="Work From Home"
                fill="#06B6D4"
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "#22D3EE" }}
              >
                <LabelList
                  dataKey="workFromHome"
                  position="top"
                  style={{ fill: "#A3AED0", fontSize: 10, fontWeight: 700 }}
                  offset={8}
                  formatter={(val: any) =>
                    val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                  }
                />
              </Bar>
              <Bar
                dataKey="clientVisits"
                name="Client Visit"
                fill="#8B5CF6"
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "#A78BFA" }}
              >
                <LabelList
                  dataKey="clientVisits"
                  position="top"
                  style={{ fill: "#A3AED0", fontSize: 10, fontWeight: 700 }}
                  offset={8}
                  formatter={(val: any) =>
                    val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                  }
                />
              </Bar>
              <Bar
                dataKey="office"
                name="Office"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "#34D399" }}
              >
                <LabelList
                  dataKey="office"
                  position="top"
                  style={{ fill: "#A3AED0", fontSize: 10, fontWeight: 700 }}
                  offset={8}
                  formatter={(val: any) =>
                    val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                  }
                />
              </Bar>
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
