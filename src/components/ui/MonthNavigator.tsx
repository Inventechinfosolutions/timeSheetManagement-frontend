import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface MonthNavigatorProps {
  month: number; // 1-12
  year: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  className?: string;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  month,
  year,
  onPrev,
  onNext,
  disabled = false,
  prevDisabled = false,
  nextDisabled = false,
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

  const arrowClass =
    "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-black/10 bg-white text-[#2B3674] shadow-[0px_1px_2px_rgba(27,37,89,0.08)] hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-black/10 bg-[#F4F7FE] px-1.5 py-1 shadow-[0px_1px_2px_rgba(27,37,89,0.08)] select-none ${className}`}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled || prevDisabled}
        className={arrowClass}
        title="Previous Month"
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>

      <span className="inline-flex h-7 min-w-[132px] items-center justify-center rounded-[6px] border border-black/10 bg-white px-3 text-center text-sm font-bold text-[#2B3674] shadow-[0px_1px_2px_rgba(27,37,89,0.08)]">
        {monthLabel} {year}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled || nextDisabled}
        className={arrowClass}
        title="Next Month"
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default MonthNavigator;
