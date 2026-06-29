import { PieChart as PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { AttendancePieChartViewProps } from "./AttendancePieChart";

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
    <div className="w-full flex flex-row items-center justify-between gap-2 mb-4">
      <div>
        <h4 className="text-lg font-bold text-[#1B2559] tracking-tight">
          Attendance Breakdown
        </h4>
        <p className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-wider mt-0.5">
          Live Data
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-[#eef1fb] px-3 py-1.5 rounded-xl shrink-0">
        <span className="text-[11px] font-bold text-[#4318FF] whitespace-nowrap">
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
      <div className="hidden sm:flex bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex-col h-full min-h-[400px]">
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
            <PieChartIcon size={24} className="text-gray-300" />
          </div>
          <span className="text-sm font-medium">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex-col h-full min-h-[400px]">
      <style>{`
        .recharts-pie-sector:focus,
        .recharts-sector:focus,
        .recharts-pie-sector:active,
        .recharts-sector:active,
        .recharts-pie-sector path:focus,
        .recharts-pie-sector path:active,
        path:focus,
        path:active,
        g:focus,
        g:active,
        svg:focus,
        svg:active {
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
      {renderHeader()}

      <div className="flex-1 flex flex-row items-center justify-between gap-6 w-full mt-2">
        <div className="h-[220px] w-[45%] relative flex items-center justify-center">
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

        <div className="w-[50%] flex flex-col gap-2.5">
          {chartData.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
            const isHovered = activeIndex === index;

            return (
              <div
                key={item.name}
                className="flex items-center justify-between py-2.5 px-4 rounded-xl cursor-pointer select-none transition-all duration-200"
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
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#1B2559] font-bold text-sm">
                    {item.name}
                  </span>
                </div>
                <span className="text-[#1B2559] font-bold text-sm">
                  {item.value}{" "}
                  <span className="text-[#A3AED0] font-semibold text-xs ml-1">
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
