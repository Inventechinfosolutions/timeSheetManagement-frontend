import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export interface MonthNavigatorProps {
  month: number; // 1-12
  year: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  className?: string;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  month,
  year,
  onPrev,
  onNext,
  disabled = false,
  className = "",
}) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthLabel = monthNames[month - 1] || "";

  return (
    <div
      className={`flex items-center gap-1.5 bg-[#F4F7FE] px-3 py-1.5 rounded-xl border border-gray-200/80 select-none ${className}`}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled}
        className="p-1.5 rounded-lg hover:bg-white active:scale-95 transition-all text-[#2B3674] disabled:opacity-50 cursor-pointer"
        title="Previous Month"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-2 min-w-[140px] justify-center px-1">
        <Calendar size={14} className="text-[#4318FF]" />
        <span className="text-sm font-bold text-[#2B3674]">
          {monthLabel} {year}
        </span>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="p-1.5 rounded-lg hover:bg-white active:scale-95 transition-all text-[#2B3674] disabled:opacity-50 cursor-pointer"
        title="Next Month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default MonthNavigator;
