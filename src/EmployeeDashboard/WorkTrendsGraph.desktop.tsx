import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkTrendsGraphViewProps } from "./WorkTrendsGraph";
import { WORK_TREND_BARS, WORK_TRENDS_EMPTY_TEXT } from "./WorkTrendsGraph.enums";

const formatLabel = (val: any) =>
  val && Number(val) > 0 ? Number(val).toFixed(1) : "";

const WorkTrendsGraphDesktop = ({
  currentMonth,
  data,
  trendsLoading,
}: WorkTrendsGraphViewProps) => {
  if (trendsLoading) {
    return (
      <div className="hidden sm:flex bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex-col h-full min-h-[400px] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4318FF]/20 border-t-[#4318FF] rounded-full animate-spin" />
        <div className="text-gray-400 text-sm mt-3 font-medium">
          Loading trends...
        </div>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-[#1B2559]">
          Work Location Trend
        </h4>
        <div className="flex items-center gap-1.5 bg-[#eef1fb] px-3 py-1.5 rounded-xl">
          <span className="text-sm font-bold text-[#4318FF]">
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
              margin={{ top: 10, right: 30, left: -10, bottom: 20 }}
              barSize={40}
              barGap={4}
              barCategoryGap="30%"
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
                iconSize={7}
                wrapperStyle={{
                  fontSize: "10px",
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

              {WORK_TREND_BARS.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.fill}
                  radius={[6, 6, 0, 0]}
                  activeBar={{ fill: bar.activeFill }}
                >
                  <LabelList
                    dataKey={bar.dataKey}
                    position="top"
                    style={{ fill: "#A3AED0", fontSize: 10, fontWeight: 700 }}
                    offset={8}
                    formatter={formatLabel}
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex bg-gray-50 flex-col items-center justify-center h-full rounded-xl border-dashed border-2 border-gray-200">
            <div className="text-gray-400 font-medium text-sm">
              {WORK_TRENDS_EMPTY_TEXT.title}
            </div>
            <div className="text-gray-300 text-xs mt-1">
              {WORK_TRENDS_EMPTY_TEXT.subtitle}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTrendsGraphDesktop;
