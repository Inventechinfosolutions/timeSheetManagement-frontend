import { PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { AttendancePieChartViewProps } from "./AttendancePieChart";
import "./AttendancePieChart.desktop.css";

const getLegendBackground = (color: string, isHovered: boolean) => {
  if (!color.startsWith("#")) return "rgba(0, 108, 241, 0.05)";
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${isHovered ? "0.08" : "0.04"})`;
};

const AttendancePieChartDesktop = ({
  chartData,
  currentMonth,
  activeIndex,
  total,
  onPieClick,
  setActiveIndex,
  renderActiveShape,
}: AttendancePieChartViewProps) => {

  const renderHeader = () => (
    <div className="pie-chart-desktop__header">
      <div>
        <h4 className="pie-chart-desktop__title">Attendance Breakdown</h4>
        <p className="pie-chart-desktop__subtitle">Live Data</p>
      </div>
      <div className="pie-chart-desktop__date-badge">
        <span className="pie-chart-desktop__date-text">
          {currentMonth.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className="pie-chart-desktop">
        {renderHeader()}
        <div className="pie-chart-desktop__empty">
          <div className="pie-chart-desktop__empty-icon">
            <PieChartIcon size={24} color="#d1d5db" />
          </div>
          <span className="pie-chart-desktop__empty-text">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pie-chart-desktop">
      {renderHeader()}

      <div className="pie-chart-desktop__body">
        {/* Chart */}
        <div className="pie-chart-desktop__chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                {...({
                  activeIndex: activeIndex ?? undefined,
                  activeShape: renderActiveShape,
                } as any)}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="85%"
                paddingAngle={4}
                {...({ cornerRadius: 6 } as any)}
                dataKey="value"
                onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={onPieClick}
                stroke="none"
                style={{ cursor: "pointer", outline: "none" }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`desktop-cell-${index}`}
                    fill={entry.color}
                    stroke="none"
                    style={{ outline: "none" }}
                  />
                ))}
              </Pie>

              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ outline: "none" }}
              >
                <tspan
                  x="50%"
                  dy="-8"
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    fill: "#A3AED0",
                    fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {activeIndex !== null && chartData[activeIndex]
                    ? chartData[activeIndex].name
                    : "Total Days"}
                </tspan>
                <tspan
                  x="50%"
                  dy="22"
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    fill: "#006CF1",
                    fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
                  }}
                >
                  {activeIndex !== null && chartData[activeIndex]
                    ? chartData[activeIndex].value
                    : total}
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="pie-chart-desktop__legend">
          {chartData.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
            const isHovered = activeIndex === index;

            return (
              <div
                key={item.name}
                className="pie-chart-desktop__legend-item"
                style={{
                  backgroundColor: getLegendBackground(item.color, isHovered),
                  border: isHovered
                    ? `1px solid ${item.color}`
                    : "1px solid transparent",
                  transform: isHovered ? "translateX(4px)" : "translateX(0px)",
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="pie-chart-desktop__legend-left">
                  <span
                    className="pie-chart-desktop__legend-dot"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="pie-chart-desktop__legend-name">
                    {item.name}
                  </span>
                </div>
                <span className="pie-chart-desktop__legend-value">
                  {item.value}
                  <span className="pie-chart-desktop__legend-pct">
                    ({percentage}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendancePieChartDesktop;