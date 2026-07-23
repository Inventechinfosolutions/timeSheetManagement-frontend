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
import type { WorkTrendsGraphViewProps } from "../EmployeeDashboard/WorkTrendsGraph";
import {
  WORK_TREND_BARS,
  WORK_TRENDS_EMPTY_TEXT,
} from "../EmployeeDashboard/WorkTrendsGraph.enums";
import "./style.tab.css";

const formatLabel = (val: any) =>
  val && Number(val) > 0 ? Number(val).toFixed(1) : "";

const WorkTrendsGraphTab = ({
  currentMonth,
  data,
  trendsLoading,
}: WorkTrendsGraphViewProps) => {
  if (trendsLoading) {
    return (
      <div className="work-trends-tab work-trends-tab--loading">
        <div className="work-trends-tab__spinner" />
        <div className="work-trends-tab__loading-text">
          Loading trends...
        </div>
      </div>
    );
  }

  return (
    <div className="work-trends-tab">
      <div className="work-trends-tab__header">
        <h4>Work Location Trend</h4>
        <div className="work-trends-tab__date">
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="work-trends-tab__chart-wrap">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 18,
                right: 16,
                left: 10,
                bottom: 18,
              }}
              barSize={52}
              barGap={10}
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
                height={35}
                tick={{
                  fill: "#A3AED0",
                  fontSize: 11,
                  fontWeight: 500,
                }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={36}
                tick={{
                  fill: "#A3AED0",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
              <Legend
                verticalAlign="top"
                height={44}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#2B3674",
                  paddingBottom: "14px",
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
                    offset={6}
                    formatter={formatLabel}
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="work-trends-tab__empty">
            <div>{WORK_TRENDS_EMPTY_TEXT.title}</div>
            <span>{WORK_TRENDS_EMPTY_TEXT.subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTrendsGraphTab;
