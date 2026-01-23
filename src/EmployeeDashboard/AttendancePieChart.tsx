import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Sector
} from "recharts";
import { ChevronLeft, ChevronRight, PieChart as PieChartIcon } from "lucide-react";

interface Props {
  data: any[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const AttendancePieChart = ({ 
  data, 
  currentMonth,
  onMonthChange 
}: Props) => {
  const chartData = useMemo(() => {
    // Group records by broad status categories for cleaner chart
    const counts = {
      Present: 0,
      "Half Day": 0,
      "Absent/Leave": 0,
      Holiday: 0,
      Weekend: 0,
      "Not Updated": 0,
      Pending: 0,
    };

    data.forEach((record) => {
      // Basic normalization of status
      const status = record.status ? String(record.status).toUpperCase() : "";
      
      // Determine effective date (handle both raw record and TimesheetEntry structure)
      const recordDate = record.fullDate ? new Date(record.fullDate) : (record.workingDate ? new Date(record.workingDate) : null);
      const isFuture = recordDate ? recordDate > new Date() : false;

      // Skip future dates to keep the chart focused on historical attendance
      if (isFuture) return;

      if (
        status === "FULL DAY" ||
        status === "HALF DAY" ||
        status === "WFH" ||
        status === "CLIENT VISIT"
      ) {
        counts["Present"]++;
      } else if (status === "LEAVE" || status === "ABSENT") {
        counts["Absent/Leave"]++;
      } else if (status === "HOLIDAY") {
        counts["Holiday"]++;
      } else if (status === "WEEKEND" || record.isWeekend) {
        counts["Weekend"]++;
      } else {
        // Fallback for Not Updated, Pending, or any other past dates
        counts["Not Updated"]++;
      }
    });

    return [
      { name: "Present", value: counts["Present"], color: "#10B981" },
      { name: "Leave", value: counts["Absent/Leave"], color: "#E11D48" },
      { name: "Holiday", value: counts["Holiday"], color: "#2563EB" },
      { name: "Weekend", value: counts["Weekend"], color: "#38BDF8" },
      { name: "Not Updated", value: counts["Not Updated"], color: "#F97316" },
    ].filter((item) => item.value > 0);
  }, [data]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieClick = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle, 
      fill, payload, value 
    } = props;

    return (
      <g>
        {/* Shadow filter for the label box */}
        <defs>
          <filter id="activeShapeShadow" x="-20%" y="-20%" width="140%" height="140%">
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
          style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}
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
          style={{ filter: 'url(#activeShapeShadow)' }}
        />

        {/* Label text */}
        <text
          x={cx}
          y={cy}
          dy={5}
          textAnchor="middle"
          fill="#1B2559"
          style={{ 
            fontSize: '13px', 
            fontWeight: '700',
            fontFamily: 'inherit'
          }}
        >
          {payload.name} : {value}
        </text>
      </g>
    );
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
    setActiveIndex(null); // Reset selection on month change
  };

  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return (
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  }, [currentMonth]);

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
    setActiveIndex(null); // Reset selection on month change
  };

  const formattedMonth = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const renderHeader = () => (
    <div className="w-full flex items-center justify-between mb-4">
      <h4 className="text-lg font-bold text-[#1B2559]">Attendance Distribution</h4>
      
      <div className="flex items-center gap-2 bg-[#F4F7FE] px-2 py-1 rounded-lg">
         <button 
           onClick={handlePrevMonth}
           className="text-[#A3AED0] hover:text-[#4318FF] transition-colors p-0.5"
         >
           <ChevronLeft size={16} strokeWidth={2.5} />
         </button>
         <h3 className="text-sm font-bold text-[#1B2559] min-w-[100px] text-center select-none">
           {formattedMonth}
         </h3>
         <button 
           onClick={handleNextMonth}
           disabled={isCurrentMonth}
           className={`transition-colors p-0.5 ${
             isCurrentMonth 
               ? "text-gray-300 cursor-not-allowed" 
               : "text-[#A3AED0] hover:text-[#4318FF]"
           }`}
         >
           <ChevronRight size={16} strokeWidth={2.5} />
         </button>
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
              <linearGradient id="gradLeave" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#F43F5E" />
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
              onClick={onPieClick}
              stroke="none"
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {chartData.map((entry, index) => {
                let fillUrl = "url(#gradWeekend)";
                if (entry.name === "Present") fillUrl = "url(#gradPresent)";
                else if (entry.name === "Leave") fillUrl = "url(#gradLeave)";
                else if (entry.name === "Holiday") fillUrl = "url(#gradHoliday)";
                else if (entry.name === "Not Updated") fillUrl = "url(#gradNotUpdated)";
                
                return (
                  <Cell key={`cell-${index}`} fill={fillUrl} stroke="none" />
                );
              })}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              height={60} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendancePieChart;
