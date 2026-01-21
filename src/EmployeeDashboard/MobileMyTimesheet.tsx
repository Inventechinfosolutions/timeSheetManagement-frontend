import React from "react";
import { ChevronLeft, ChevronRight, Save, Lock } from "lucide-react";

import { TimesheetEntry } from "../types";

interface MobileMyTimesheetProps {
  currentWeekEntries: { entry: TimesheetEntry; originalIndex: number }[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onHoursInput: (index: number, value: string) => void;
  onSave: () => void;
  monthTotalHours: number;
  currentMonthName: string;
  loading: boolean;
  isAdmin: boolean;
  readOnly: boolean;
  isDateBlocked: (date: Date) => boolean;
  isEditableMonth: (date: Date) => boolean;

  onBlockedClick?: () => void;
  localInputValues: Record<number, string>;
  onInputBlur: (index: number) => void;
}

const MobileMyTimesheet: React.FC<MobileMyTimesheetProps> = ({
  currentWeekEntries,
  onPrevWeek,
  onNextWeek,
  onHoursInput,
  onSave,
  monthTotalHours,
  currentMonthName,
  loading,
  isAdmin,
  readOnly,
  isDateBlocked,
  isEditableMonth,

  onBlockedClick,
  localInputValues,
  onInputBlur,
}) => {
  // Sort entries to match Mon-Sun order
  const sortedEntries = [...currentWeekEntries].sort((a, b) => {
    const dayA = a.entry.fullDate.getDay();
    const dayB = b.entry.fullDate.getDay();
    // Adjust Sunday from 0 to 7 to handle Mon-Sun sorting
    const adjustedA = dayA === 0 ? 7 : dayA;
    const adjustedB = dayB === 0 ? 7 : dayB;
    return adjustedA - adjustedB;
  });

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] p-4 relative overflow-y-auto custom-scrollbar">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#4318FF]"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2B3674]">
            {currentMonthName}
          </h2>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium text-gray-400">Total:</span>
            <span className="text-lg font-black text-[#4318FF]">
              {monthTotalHours.toFixed(1)} hrs
            </span>
          </div>
        </div>
        {(!readOnly || isAdmin) && (
          <button
            onClick={onSave}
            className="p-3 bg-[#4318FF] text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Save size={20} />
          </button>
        )}
      </div>

      {/* Weekly View Container */}
      <div className="flex-1 flex flex-col justify-center items-center gap-8">
        <div className="flex items-center justify-between w-full h-full">
          {/* Left Arrow */}
          <button
            onClick={onPrevWeek}
            className="p-2 bg-blue-100/50 text-[#4318FF] rounded-xl hover:bg-blue-100 transition-colors shrink-0 mr-4"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          {/* Grid of Days */}
          <div className="flex-1 grid grid-cols-3 gap-x-10 gap-y-14 justify-items-center px-2">
            {sortedEntries.map(({ entry, originalIndex }) => {
              const displayVal = entry.totalHours || 0;

              const inputValue =
                localInputValues[originalIndex] !== undefined
                  ? localInputValues[originalIndex]
                  : displayVal === 0
                    ? ""
                    : displayVal.toString();

              const isBlocked = isDateBlocked(entry.fullDate);
              const isEditable =
                !readOnly &&
                (isAdmin || isEditableMonth(entry.fullDate)) &&
                !isBlocked;

              // Styling logic:
              // 1. Red (#FF0000) for Leave/Weekend/Holiday
              // 2. Green (#01B574) for Present (hours > 0)
              // 3. Gray for Pending/Not Updated

              let bg = "bg-gray-100 border-gray-300 text-gray-500"; // Default: Pending (Darker Gray)

              if ((entry.totalHours || 0) > 0) {
                bg = "bg-[#01B574]/15 border-[#01B574]/80 text-[#01B574]"; // Green Group (Present) - Takes priority
              } else if (
                entry.isWeekend ||
                entry.status === "Leave" ||
                entry.status === "Holiday"
              ) {
                bg = "bg-[#FF0000]/15 border-[#FF0000]/80 text-[#FF0000]"; // Red Group (Darker)
              } else if (isBlocked) {
                bg = "bg-gray-200 border-gray-400 opacity-70";
              }

              // Special centering for Sunday
              const isSunday = entry.fullDate.getDay() === 0;

              return (
                <div
                  key={originalIndex}
                  className={`flex flex-col items-center gap-2 ${
                    isSunday ? "col-start-2" : ""
                  }`}
                >
                  <span className="text-sm font-bold text-[#2B3674]">
                    {entry.fullDate.toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                  <div
                    className={`relative w-20 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm border ${bg} ${
                      entry.isToday ? "ring-2 ring-[#4318FF]" : ""
                    }`}
                    onClick={() => {
                      if (isBlocked && isAdmin && onBlockedClick)
                        onBlockedClick();
                    }}
                  >
                    {/* Date Bubble */}
                    <div
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-10 
                      ${entry.isToday ? "bg-[#4318FF] text-white" : "bg-white text-[#2B3674] border border-gray-100"}`}
                    >
                      {entry.date}
                    </div>

                    <input
                      type="text"
                      disabled={!isEditable}
                      className="w-full h-full bg-transparent text-center text-xl font-bold focus:outline-none"
                      value={inputValue}
                      onChange={(e) =>
                        onHoursInput(originalIndex, e.target.value)
                      }
                      onBlur={() => onInputBlur(originalIndex)}
                      placeholder="0"
                    />
                    {isBlocked && (
                      <div className="absolute bottom-1 right-1">
                        <Lock size={8} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={onNextWeek}
            className="p-2 bg-blue-100/50 text-[#4318FF] rounded-xl hover:bg-blue-100 transition-colors shrink-0 ml-4"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Legend - Minimized for mobile */}
      <div className="mt-auto pt-4 flex flex-wrap justify-center gap-3">
        {[
          {
            label: "Holiday",
            color: "bg-[#FF0000]/15",
            border: "border-[#FF0000]/80",
          },
          {
            label: "Leave",
            color: "bg-[#FF0000]/15",
            border: "border-[#FF0000]/80",
          },
          {
            label: "Present",
            color: "bg-[#01B574]/15",
            border: "border-[#01B574]/80",
          },
          {
            label: "Today",
            color: "bg-gray-100",
            border: "border-[3px] border-[#4318FF]",
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-full border ${item.color || "bg-gray-100"} ${
                item.border || "border-gray-200"
              }`}
            ></div>
            <span className="text-[10px] font-black text-[#85aedb] uppercase tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileMyTimesheet;
