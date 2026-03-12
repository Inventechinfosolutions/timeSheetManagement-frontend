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
      { name: AttendanceStatus.PRESENT, value: counts[AttendanceStatus.PRESENT], color: "#10B981" },
      { name: AttendanceStatus.ABSENT, value: counts[AttendanceStatus.ABSENT], color: "#E11D48" },
      { name: AttendanceStatus.LEAVE, value: counts[AttendanceStatus.LEAVE], color: "#EE5D50" },
      { name: AttendanceStatus.HOLIDAY, value: counts[AttendanceStatus.HOLIDAY], color: "#2563EB" },
      { name: AttendanceStatus.WEEKEND, value: counts[AttendanceStatus.WEEKEND], color: "#38BDF8" },
      { name: AttendanceStatus.NOT_UPDATED, value: counts[AttendanceStatus.NOT_UPDATED], color: "#F97316" },
    ]
      .map((item) => ({
        ...item,
        value: Number(item.value.toFixed(1)), // Ensure no floating point artifacts
      }))
      .filter((item) => item.value > 0);
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
        Attendance Distribution (Live Data)
      </h4>

      <div className="flex items-center gap-2">
        <span className="text-s font-bold text-[#1B2559]">
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
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center min-h-[400px]">
      {renderHeader()}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="gradPresent" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
              <linearGradient id="gradHalfDay" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
              <linearGradient id="gradAbsent" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>
              <linearGradient id="gradLeave" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EE5D50" />
                <stop offset="100%" stopColor="#F87171" />
              </linearGradient>
              <linearGradient id="gradHoliday" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="gradWeekend" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A5F3FC" />
                <stop offset="100%" stopColor="#0EA5E9" />
              </linearGradient>
              <linearGradient id="gradNotUpdated" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
              <linearGradient id="gradPending" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
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
                if (entry.name === AttendanceStatus.PRESENT) fillUrl = "url(#gradPresent)";
                else if (entry.name === AttendanceStatus.ABSENT) fillUrl = "url(#gradAbsent)";
                else if (entry.name === AttendanceStatus.LEAVE) fillUrl = "url(#gradLeave)";
                else if (entry.name === AttendanceStatus.HOLIDAY)
                  fillUrl = "url(#gradHoliday)";
                else if (entry.name === AttendanceStatus.NOT_UPDATED)
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
