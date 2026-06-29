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
import "./WorkTrendsGraph.desktop.css";

const formatLabel = (val: any) =>
  val && Number(val) > 0 ? Number(val).toFixed(1) : "";

const WorkTrendsGraphDesktop = ({
  currentMonth,
  data,
  trendsLoading,
}: WorkTrendsGraphViewProps) => {

  if (trendsLoading) {
    return (
      <div className="work-trends-desktop__loading">
        <div className="work-trends-desktop__spinner" />
        <div className="work-trends-desktop__loading-text">
          Loading trends...
        </div>
      </div>
    );
  }

  return (
    <div className="work-trends-desktop">

      {/* Header */}
      <div className="work-trends-desktop__header">
        <h4 className="work-trends-desktop__title">Work Location Trend</h4>
        <div className="work-trends-desktop__date-badge">
          <span className="work-trends-desktop__date-text">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="work-trends-desktop__chart">
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
          <div className="work-trends-desktop__empty">
            <div className="work-trends-desktop__empty-title">
              {WORK_TRENDS_EMPTY_TEXT.title}
            </div>
            <div className="work-trends-desktop__empty-subtitle">
              {WORK_TRENDS_EMPTY_TEXT.subtitle}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default WorkTrendsGraphDesktop;