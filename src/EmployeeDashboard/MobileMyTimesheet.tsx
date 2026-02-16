import React from "react";
import { ChevronLeft, ChevronRight, Save, Lock, Rocket } from "lucide-react";

import { TimesheetEntry } from "../types";
import { TimesheetBlocker } from "../reducers/timesheetBlocker.reducer";

interface MobileMyTimesheetProps {
  currentWeekEntries: { entry: TimesheetEntry; originalIndex: number }[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onHoursInput: (index: number, value: string) => void;
  onSave: () => void;
  onAutoUpdate?: () => void;
  autoUpdateCount?: number;
  monthTotalHours: number;
  currentMonthName: string;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isManagerView: boolean;
  readOnly: boolean;
  blockers: TimesheetBlocker[];
  isDateBlocked: (date: Date) => boolean;
  isEditableMonth: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;

  onBlockedClick?: () => void;
  localInputValues: Record<number, string>;
  onInputBlur: (index: number) => void;
  selectedDateId: number | null;
  isHighlighted: boolean;
  containerClassName?: string;
}

const MobileMyTimesheet: React.FC<MobileMyTimesheetProps> = ({
  currentWeekEntries,
  onPrevWeek,
  onNextWeek,
  onHoursInput,
  onSave,
  onAutoUpdate,
  autoUpdateCount = 0,
  monthTotalHours,
  currentMonthName,
  loading,
  isAdmin,
  isManager,
  isManagerView,
  readOnly,
  blockers,
  // isDateBlocked, // Removed unused prop to fix lint warning
  isEditableMonth,
  isHoliday,

  onBlockedClick,
  localInputValues,
  onInputBlur,
  selectedDateId,
  isHighlighted,
  containerClassName,
}) => {
  // Sort entries to match Sun-Sat order (0-6)
  const sortedEntries = [...currentWeekEntries].sort((a, b) => {
    return a.entry.fullDate.getDay() - b.entry.fullDate.getDay();
  });

  return (
    <div
      className={
        containerClassName ||
        "flex flex-col bg-[#F4F7FE] px-3 py-2 relative no-scrollbar"
      }
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#4318FF]"></div>
        </div>
      )}

      {/* Header - Card Style */}
      <div className="bg-white rounded-[20px] px-5 py-3 shadow-sm border border-gray-50 flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-black text-[#2B3674]">
            {currentMonthName}
          </h2>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">
              Total:
            </span>
            <span className="text-xl font-black text-[#4318FF]">
              {(Number(monthTotalHours) || 0).toFixed(1)}{" "}
              <span className="text-[10px]">hrs</span>
            </span>
          </div>
        </div>
      {(!readOnly || isAdmin || (isManager && !isManagerView)) && (
          <div className="flex gap-2">
             {onAutoUpdate && (
              <button
                onClick={onAutoUpdate}
                disabled={autoUpdateCount === 0}
                className={`flex items-center justify-center p-3 bg-white text-[#4318FF] border border-[#4318FF]/20 rounded-2xl shadow-sm active:scale-95 transition-all ${autoUpdateCount === 0 ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
                title={autoUpdateCount > 0 ? `Auto Fill ${autoUpdateCount} days` : "No eligible days"}
              >
                <div className="relative">
                  <Rocket size={18} strokeWidth={2.5} className={autoUpdateCount > 0 ? "animate-pulse" : ""} />
                  {autoUpdateCount > 0 && (
                    <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {autoUpdateCount}
                    </span>
                  )}
                </div>
              </button>
            )}
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-3 bg-linear-to-br from-[#4318FF] to-[#5D38FF] text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Save size={18} strokeWidth={2.5} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Save
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Weekly View Container */}
      <div className="flex-1 flex flex-col justify-center items-center gap-4 md:gap-8">
        <div className="flex items-center justify-between w-full h-full">
          {/* Left Arrow */}
          <button
            onClick={onPrevWeek}
            className="p-2 bg-blue-100/50 text-[#4318FF] rounded-xl hover:bg-blue-100 transition-colors shrink-0 mr-1 sm:mr-4"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Grid of Days */}
          <div className="flex-1 grid grid-cols-3 gap-x-1 sm:gap-x-6 gap-y-6 sm:gap-y-12 justify-items-center px-0.5">
            {sortedEntries.map(({ entry, originalIndex }) => {
              const displayVal = entry.totalHours || 0;

              const inputValue =
                localInputValues[originalIndex] !== undefined
                  ? localInputValues[originalIndex]
                  : displayVal === 0
                    ? ""
                    : displayVal.toString();

              const blocker = blockers.find((b) => {
                const d = new Date(entry.fullDate);
                d.setHours(0, 0, 0, 0);
                const start = new Date(b.blockedFrom);
                start.setHours(0, 0, 0, 0);
                const end = new Date(b.blockedTo);
                end.setHours(0, 0, 0, 0);
                return d >= start && d <= end;
              });

              const isBlocked = !!blocker;
              
              const isEditable =
                (isAdmin || !readOnly) &&
                (isAdmin || isEditableMonth(entry.fullDate)) &&
                !isBlocked;

              // Styling logic (Matching MobileResponsiveCalendarPage)
              let bg = "bg-white text-gray-600 border-gray-200"; // Default
              const isHolidayDate = isHoliday(entry.fullDate);

              if (entry.isToday) {
                bg =
                  "bg-white ring-2 ring-[#4318FF] text-[#4318FF] border-transparent font-extrabold shadow-md";
              } else if (isBlocked) {
                bg =
                  "bg-gray-200 border border-gray-400 text-gray-500 font-bold";
              } else if (
                (entry.status || "").toLowerCase().includes("wfh") || 
                (entry.status || "").toLowerCase().includes("work from home") ||
                (entry.status || "").toLowerCase().includes("full day")
              ) {
                bg =
                  "bg-green-100 border border-green-500 text-black font-bold";
              } else if (entry.status === "Half Day") {
                bg =
                  "bg-orange-100 border border-orange-600 text-black font-bold";
              } else if (entry.status === "Leave") {
                bg = "bg-red-200 border border-red-600 text-black font-bold";
              } else if (isHolidayDate || entry.status === "Holiday") {
                bg = "bg-blue-100 border border-blue-500 text-black font-bold";
              } else if (entry.isWeekend) {
                bg = "bg-pink-100 border border-pink-400 text-black font-bold";
              } else if (
                entry.status === "Not Updated" ||
                entry.status === "Pending"
              ) {
                bg = "bg-white border border-gray-300 text-gray-600 font-bold";
              }

              // Highlighting logic from navigation
              const isDateHighlighted =
                selectedDateId &&
                new Date(selectedDateId).toDateString() ===
                  entry.fullDate.toDateString() &&
                isHighlighted;

              // Special centering for Saturday (last day in Sun-Sat week)
              const isSaturday = entry.fullDate.getDay() === 6;

              return (
                <div
                  key={originalIndex}
                  className={`flex flex-col items-center gap-2 ${
                    isSaturday ? "col-start-2" : ""
                  } ${isDateHighlighted ? "z-50" : ""}`}
                >
                  <span
                    className={`text-sm font-bold ${
                      isDateHighlighted
                        ? "text-[#4318FF] scale-110 transition-transform"
                        : "text-[#2B3674]"
                    }`}
                  >
                    {entry.fullDate.toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                  <div
                    className={`relative w-[64px] h-[48px] sm:w-20 sm:h-14 rounded-xl flex items-center justify-center transition-all shadow-sm border ${bg} 
                      ${entry.isToday ? "ring-2 ring-[#4318FF] shadow-md" : ""}
                      ${
                        isDateHighlighted
                          ? "date-highlight ring-4 ring-[#4318FF] ring-offset-2 scale-110 shadow-xl"
                          : ""
                      }
                    `}
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

                    {/* Lock Icon for Admin Blockers or Month-end Locks */}
                    {(isBlocked || (!isAdmin && !isEditableMonth(entry.fullDate))) && (
                        <div className="absolute -top-1 -left-1 p-1 rounded-full bg-red-50 text-red-500 border border-red-100 z-10">
                            <Lock size={8} strokeWidth={3} />
                        </div>
                    )}

                    <input
                      type="text"
                      disabled={!isEditable}
                      className="w-full h-full bg-transparent text-center text-xl font-bold focus:outline-none placeholder:text-gray-300"
                      value={inputValue}
                      onChange={(e) =>
                        onHoursInput(originalIndex, e.target.value)
                      }
                      onBlur={() => onInputBlur(originalIndex)}
                      placeholder="0"
                    />
                    {isBlocked && (
                      <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-1 text-center pointer-events-none">
                         <Lock size={12} className="text-white mb-0.5" />
                         <span className="text-[7px] font-black text-white leading-none uppercase tracking-tighter">
                           Contact {blocker?.blockedBy || "Admin"}
                         </span>
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
            className="p-2 bg-blue-100/50 text-[#4318FF] rounded-xl hover:bg-blue-100 transition-colors shrink-0 ml-1 sm:ml-4"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="pt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 mb-2">
        {[
          { label: "Present", className: "bg-green-100 border-green-600" },
          { label: "WFH", className: "bg-blue-100 border-blue-600" },
          { label: "Client Visit", className: "bg-blue-100 border-blue-600" },
          { label: "Half Day Leave", className: "bg-orange-100 border-orange-600" },
          { label: "Leave", className: "bg-red-200 border-red-600" },
          { label: "Not Updated", className: "bg-white border-gray-300" },
          { label: "Holiday", className: "bg-blue-100 border-blue-500" },
          { label: "Today", className: "bg-white border-2 border-[#4318FF]" },
          { label: "Blocked", className: "bg-gray-200 border-gray-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-full border ${item.className}`}
            ></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileMyTimesheet;
