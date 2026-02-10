import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Sector,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

import { AttendancePieChartProps } from "./types";
import { AttendanceLabels, AttendanceChartColor } from "./enums";

const AttendancePieChart = ({
  data,
  currentMonth,
}: AttendancePieChartProps) => {
  const chartData = useMemo(() => {
    // Group records by broad status categories for cleaner chart
    const counts = {
      [AttendanceLabels.Present]: 0,
      [AttendanceLabels.HalfDay]: 0,
      [AttendanceLabels.Absent]: 0,
      [AttendanceLabels.Leave]: 0,
      [AttendanceLabels.Holiday]: 0,
      [AttendanceLabels.Weekend]: 0,
      [AttendanceLabels.NotUpdated]: 0,
      [AttendanceLabels.Pending]: 0,
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

      if (
        status === "FULL DAY" ||
        status === "HALF DAY" ||
        status === "WFH" ||
        status === "CLIENT VISIT"
      ) {
        counts[AttendanceLabels.Present]++;
      } else if (status === "ABSENT") {
        counts[AttendanceLabels.Absent]++;
      } else if (status === "LEAVE") {
        counts[AttendanceLabels.Leave]++;
      } else if (status === "HOLIDAY") {
        counts[AttendanceLabels.Holiday]++;
      } else if (status === "WEEKEND" || record.isWeekend) {
        counts[AttendanceLabels.Weekend]++;
      } else {
        // Fallback for Not Updated, Pending, or any other past dates
        counts[AttendanceLabels.NotUpdated]++;
      }
    });

    return [
      {
        name: AttendanceLabels.Present,
        value: counts[AttendanceLabels.Present],
        color: AttendanceChartColor.PresentStart,
      },
      {
        name: AttendanceLabels.Absent,
        value: counts[AttendanceLabels.Absent],
        color: AttendanceChartColor.AbsentStart,
      },
      {
        name: AttendanceLabels.Leave,
        value: counts[AttendanceLabels.Leave],
        color: AttendanceChartColor.LeaveStart,
      },
      {
        name: AttendanceLabels.Holiday,
        value: counts[AttendanceLabels.Holiday],
        color: AttendanceChartColor.HolidayStart,
      },
      {
        name: AttendanceLabels.Weekend,
        value: counts[AttendanceLabels.Weekend],
        color: AttendanceChartColor.WeekendStart,
      },
      {
        name: AttendanceLabels.NotUpdated,
        value: counts[AttendanceLabels.NotUpdated],
        color: AttendanceChartColor.NotUpdatedStart,
      },
    ].filter((item) => item.value > 0);
  }, [data]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
      payload,
      value,
    } = props;

    return (
      <g>
        {/* Shadow filter for the label box */}
        <defs>
          <filter
            id="activeShapeShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Highlighted sector with larger radius */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))" }}
        />

        {/* Label background box */}
        <rect
          x={cx - 55}
          y={cy - 20}
          width={110}
          height={40}
          rx={12}
          fill="white"
          stroke="#f1f5f9"
          strokeWidth={1}
          style={{ filter: "url(#activeShapeShadow)" }}
        />

        {/* Label text */}
        <text
          x={cx}
          y={cy}
          dy={5}
          textAnchor="middle"
          fill="#1B2559"
          style={{
            fontSize: "13px",
            fontWeight: "700",
            fontFamily: "inherit",
          }}
        >
          {payload.name} : {value}
        </text>
      </g>
    );
  };

  const renderHeader = () => (
    <div className="w-full flex items-center justify-between mb-6">
      <h4 className="text-lg font-bold text-[#1B2559]">
        Attendance Distribution
      </h4>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-400">
          {currentMonth.toLocaleDateString("en-US", {
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
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center min-h-[400px]">
      {renderHeader()}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="gradPresent" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={AttendanceChartColor.PresentStart}
                />
                <stop
                  offset="100%"
                  stopColor={AttendanceChartColor.PresentEnd}
                />
              </linearGradient>
              <linearGradient id="gradHalfDay" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={AttendanceChartColor.HalfDayStart}
                />
                <stop
                  offset="100%"
                  stopColor={AttendanceChartColor.HalfDayEnd}
                />
              </linearGradient>
              <linearGradient id="gradAbsent" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={AttendanceChartColor.AbsentStart}
                />
                <stop
                  offset="100%"
                  stopColor={AttendanceChartColor.AbsentEnd}
                />
              </linearGradient>
              <linearGradient id="gradLeave" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={AttendanceChartColor.LeaveStart} />
                <stop offset="100%" stopColor={AttendanceChartColor.LeaveEnd} />
              </linearGradient>
              <linearGradient id="gradHoliday" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={AttendanceChartColor.HolidayStart}
                />
                <stop
                  offset="100%"
                  stopColor={AttendanceChartColor.HolidayEnd}
                />
              </linearGradient>
              <linearGradient id="gradWeekend" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={AttendanceChartColor.WeekendStart}
                />
                <stop
                  offset="100%"
                  stopColor={AttendanceChartColor.WeekendEnd}
                />
              </linearGradient>
              <linearGradient id="gradNotUpdated" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={AttendanceChartColor.NotUpdatedStart}
                />
                <stop
                  offset="100%"
                  stopColor={AttendanceChartColor.NotUpdatedEnd}
                />
              </linearGradient>
              <linearGradient id="gradPending" x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={AttendanceChartColor.PendingStart}
                />
                <stop
                  offset="100%"
                  stopColor={AttendanceChartColor.PendingEnd}
                />
              </linearGradient>
            </defs>
            <Pie
              {...({
                activeIndex: activeIndex ?? undefined,
                activeShape: renderActiveShape,
              } as any)}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={5}
              dataKey="value"
              onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={onPieClick}
              stroke="none"
              style={{ cursor: "pointer", outline: "none" }}
            >
              {chartData.map((entry, index) => {
                let fillUrl = "url(#gradWeekend)";
                if (entry.name === AttendanceLabels.Present)
                  fillUrl = "url(#gradPresent)";
                else if (entry.name === AttendanceLabels.Absent)
                  fillUrl = "url(#gradAbsent)";
                else if (entry.name === AttendanceLabels.Leave)
                  fillUrl = "url(#gradLeave)";
                else if (entry.name === AttendanceLabels.Holiday)
                  fillUrl = "url(#gradHoliday)";
                else if (entry.name === AttendanceLabels.NotUpdated)
                  fillUrl = "url(#gradNotUpdated)";

                return (
                  <Cell key={`cell-${index}`} fill={fillUrl} stroke="none" />
                );
              })}
            </Pie>

            <Legend
              verticalAlign="bottom"
              height={60}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendancePieChart;
