import { PieChart as PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { AttendancePieChartViewProps } from "../EmployeeDashboard/AttendancePieChart";
import "./style.tab.css";

const getLegendBackground = (color: string, isHovered: boolean) => {
  if (!color.startsWith("#")) return "rgba(0, 108, 241, 0.05)";

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${isHovered ? "0.08" : "0.04"})`;
};

const AttendancePieChartTab = ({
  chartData,
  currentMonth,
  activeIndex,
  total,
  onPieClick,
  setActiveIndex,
  renderActiveShape,
}: AttendancePieChartViewProps) => {
  const renderHeader = () => (
    <div className="attendance-pie-tab__header">
      <div>
        <h4 className="attendance-pie-tab__title">Attendance Breakdown</h4>
        <p className="attendance-pie-tab__subtitle">Live Data</p>
      </div>

      <div className="attendance-pie-tab__date">
        {currentMonth.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className="attendance-pie-tab">
        {renderHeader()}
        <div className="attendance-pie-tab__empty">
          <div className="attendance-pie-tab__empty-icon">
            <PieChartIcon size={24} />
          </div>
          <span>No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-pie-tab">
      {renderHeader()}

      <div className="attendance-pie-tab__content">
        <div className="attendance-pie-tab__chart">
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
                    key={`tab-cell-${index}`}
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
                <tspan x="50%" dy="-8" className="attendance-pie-tab__center-label">
                  {activeIndex !== null && chartData[activeIndex]
                    ? chartData[activeIndex].name
                    : "Total Days"}
                </tspan>
                <tspan x="50%" dy="22" className="attendance-pie-tab__center-value">
                  {activeIndex !== null && chartData[activeIndex]
                    ? chartData[activeIndex].value
                    : total}
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="attendance-pie-tab__legend">
          {chartData.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
            const isHovered = activeIndex === index;

            return (
              <div
                key={item.name}
                className="attendance-pie-tab__legend-item"
                style={{
                  backgroundColor: getLegendBackground(item.color, isHovered),
                  borderColor: isHovered ? item.color : "transparent",
                  transform: isHovered ? "translateX(4px)" : "translateX(0px)",
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="attendance-pie-tab__legend-name">
                  <span style={{ backgroundColor: item.color }} />
                  <strong>{item.name}</strong>
                </div>
                <strong className="attendance-pie-tab__legend-value">
                  {item.value}
                  <span>({percentage}%)</span>
                </strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendancePieChartTab;
