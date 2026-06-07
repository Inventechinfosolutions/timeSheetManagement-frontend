import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { AttendanceStatus, WorkLocation } from "../enums";

interface Props {
  data: any[];
  currentMonth: Date;
}

const AttendancePieChart = ({ data, currentMonth }: Props) => {
  const chartData = useMemo(() => {
    // Group records by broad status categories for cleaner chart
    const counts = {
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.HALF_DAY]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.LEAVE]: 0,
      [AttendanceStatus.HOLIDAY]: 0,
      [AttendanceStatus.WEEKEND]: 0,
      [AttendanceStatus.NOT_UPDATED]: 0,
      [AttendanceStatus.PENDING]: 0,
    };

    data.forEach((record) => {
      // Basic normalization of status
      const status = record.status ? String(record.status).toUpperCase() : "";

      // Determine effective date (handle both raw record and TimesheetEntry structure)
      const recordDate = record.fullDate
        ? new Date(record.fullDate)
        : record.workingDate
          ? new Date(record.workingDate)
          : null;
      const isFuture = recordDate ? recordDate > new Date() : false;

      // Skip future dates to keep the chart focused on historical attendance
      if (isFuture) return;

      if (status === AttendanceStatus.HALF_DAY.toUpperCase()) {
        const h1 = (record.firstHalf || "").toUpperCase();
        const h2 = (record.secondHalf || "").toUpperCase();

        [h1, h2].forEach((half) => {
          if (half.includes(AttendanceStatus.LEAVE.toUpperCase())) {
            counts[AttendanceStatus.LEAVE] += 0.5;
          } else if (
            half.includes(WorkLocation.OFFICE.toUpperCase()) ||
            half.includes(WorkLocation.WFH.toUpperCase()) ||
            half.includes("CLIENT") ||
            half.includes("PRESENT") ||
            half.includes(AttendanceStatus.FULL_DAY.toUpperCase())
          ) {
            counts[AttendanceStatus.PRESENT] += 0.5;
          } else if (half.includes(AttendanceStatus.ABSENT.toUpperCase())) {
            counts[AttendanceStatus.ABSENT] += 0.5;
          } else {
            // Fallback for unidentified halves in a Half Day record
            counts[AttendanceStatus.NOT_UPDATED] += 0.5;
          }
        });
      } else if (
        status === AttendanceStatus.FULL_DAY.toUpperCase() ||
        status === AttendanceStatus.WFH.toUpperCase() ||
        status === AttendanceStatus.CLIENT_VISIT.toUpperCase()
      ) {
        counts[AttendanceStatus.PRESENT]++;
      } else if (status === AttendanceStatus.ABSENT.toUpperCase()) {
        counts[AttendanceStatus.ABSENT]++;
      } else if (status === AttendanceStatus.LEAVE.toUpperCase()) {
        counts[AttendanceStatus.LEAVE]++;
      } else if (status === AttendanceStatus.HOLIDAY.toUpperCase()) {
        counts[AttendanceStatus.HOLIDAY]++;
      } else if (status === AttendanceStatus.WEEKEND.toUpperCase() || record.isWeekend) {
        counts[AttendanceStatus.WEEKEND]++;
      } else {
        // Fallback for Not Updated, Pending, or any other past dates
        counts[AttendanceStatus.NOT_UPDATED]++;
      }
    });

    return [
      { name: AttendanceStatus.PRESENT, value: counts[AttendanceStatus.PRESENT], color: "#05CD99" }, // Emerald green
      { name: AttendanceStatus.ABSENT, value: counts[AttendanceStatus.ABSENT], color: "#EE5D50" }, // Coral red
      { name: AttendanceStatus.LEAVE, value: counts[AttendanceStatus.LEAVE], color: "#FF708B" }, // Pinkish coral
      { name: AttendanceStatus.HOLIDAY, value: counts[AttendanceStatus.HOLIDAY], color: "#4318FF" }, // Indigo
      { name: AttendanceStatus.WEEKEND, value: counts[AttendanceStatus.WEEKEND], color: "#00B8FF" }, // Sky blue
      { name: AttendanceStatus.NOT_UPDATED, value: counts[AttendanceStatus.NOT_UPDATED], color: "#FFB547" }, // Amber orange
    ]
      .map((item) => ({
        ...item,
        value: Number(item.value.toFixed(1)), // Ensure no floating point artifacts
      }))
      .filter((item) => item.value > 0);
  }, [data]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  const onPieClick = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 1}
          outerRadius={outerRadius + 2}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          {...({ cornerRadius: 6 } as any)}
        />
      </g>
    );
  };

  const renderHeader = () => (
    <div className="w-full flex flex-row items-center justify-between gap-2 mb-6">
      <div>
        <h4 className="text-base sm:text-lg font-bold text-[#1B2559] tracking-tight">
          Attendance Breakdown
        </h4>
        <p className="text-[11px] text-[#A3AED0] font-bold uppercase tracking-wider mt-0.5">Live Data</p>
      </div>

      <div className="flex items-center gap-1.5 bg-[#F4F7FE] px-3 py-1.5 rounded-xl border border-gray-50/50">
        <span className="text-xs font-bold text-[#4318FF]">
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
      <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full min-h-[400px]">
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
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full min-h-[400px]">
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
      
      {/* Side-by-Side Flex Container */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 w-full mt-2">
        
        {/* Left Side: Donut Chart */}
        <div className="h-[220px] w-full sm:w-[45%] relative flex items-center justify-center">
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
                    key={`cell-${index}`} 
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

        {/* Right Side: Vertical Legend Cards */}
        <div className="w-full sm:w-[50%] flex flex-col gap-2.5">
          {chartData.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
            const isHovered = activeIndex === index;
            
            // Helper to get translucent background colors from hex
            let bgColor = "rgba(0, 108, 241, 0.05)";
            if (item.color.startsWith("#")) {
              const r = parseInt(item.color.slice(1, 3), 16);
              const g = parseInt(item.color.slice(3, 5), 16);
              const b = parseInt(item.color.slice(5, 7), 16);
              bgColor = `rgba(${r}, ${g}, ${b}, ${isHovered ? "0.08" : "0.04"})`;
            }

            return (
              <div
                key={item.name}
                className="flex items-center justify-between py-2.5 px-4 rounded-xl cursor-pointer select-none transition-all duration-200"
                style={{ 
                  backgroundColor: bgColor,
                  border: isHovered ? `1px solid ${item.color}` : "1px solid transparent",
                  transform: isHovered ? "translateX(4px)" : "translateX(0px)"
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#1B2559] font-bold text-xs sm:text-sm">
                    {item.name}
                  </span>
                </div>
                <span className="text-[#1B2559] font-bold text-xs sm:text-sm">
                  {item.value}{" "}
                  <span className="text-[#A3AED0] font-semibold text-[11px] sm:text-xs ml-1">
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

export default AttendancePieChart;
