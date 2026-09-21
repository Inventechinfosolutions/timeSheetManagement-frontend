import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarViewRenderProps } from "../EmployeeDashboard/CalendarView";
import { CALENDAR_SIMPLE_LEGEND_DOTS } from "../EmployeeDashboard/CalendarView.enums";
import { CalendarGrid } from "../EmployeeDashboard/CalendarView.desktop";
import "./style.tab.css";

const CalendarViewTab = (props: CalendarViewRenderProps) => {
  return (
    <div className={`calendar-view flex flex-col ${props.scrollable ? "h-full flex-1 min-h-0" : ""}`}>
      <div className="calendar-view__surface calendar-view__surface--tab">
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-3 mb-5">
          <div className="flex items-center gap-3 min-w-fit">
            <div className="p-2 rounded-lg bg-blue-50">
              <CalendarIcon className="w-5 h-5 text-[#4318FF]" />
            </div>
            <h3 className="text-lg font-bold text-[#2B3674] tracking-tight leading-tight">
              Attendance
            </h3>
          </div>

          {!props.hideMonthNavigation && (
            <div className="flex items-center gap-2 bg-transparent p-0">
              <button onClick={props.handlePrevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#4318FF] active:scale-90">
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
              <span className="text-base min-w-[100px] text-[#2B3674] text-center select-none">
                {props.currentMonthName}
              </span>
              <button onClick={props.handleNextMonth} disabled={!props.canNavigateToNextMonth} className={`p-1.5 rounded-lg transition-all active:scale-90 ${!props.canNavigateToNextMonth ? "text-gray-300 cursor-not-allowed" : "text-[#A3AED0] hover:text-[#4318FF] hover:bg-white hover:shadow-sm"}`}>
                <ChevronRight size={22} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        <CalendarGrid {...props} />

        <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-gray-50 flex-wrap">
          {CALENDAR_SIMPLE_LEGEND_DOTS.map((dotClass) => (
            <div key={dotClass} className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarViewTab;
