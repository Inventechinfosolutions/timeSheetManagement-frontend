import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarViewRenderProps } from "./CalendarView";
import { CALENDAR_SIMPLE_LEGEND_DOTS } from "./CalendarView.enums";
import { CalendarGrid } from "./CalendarView.desktop";

const CalendarViewMobile = (props: CalendarViewRenderProps) => {
  const compactSurfaceClass = props.isSmall
    ? "calendar-view__surface--compact calendar-view__surface--small"
    : "calendar-view__surface--compact";

  return (
    <div className={`calendar-view flex flex-col ${props.scrollable ? "h-full flex-1 min-h-0" : ""}`}>
      <div className={`calendar-view__surface ${compactSurfaceClass}`}>
        {!props.isSmall && (
          <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 mb-4">
            <div className="flex items-center gap-3 min-w-fit">
              <div className="p-2 rounded-lg bg-blue-50">
                <CalendarIcon className="w-4 h-4 text-[#4318FF]" />
              </div>
              <h3 className="text-base font-bold text-[#2B3674] tracking-tight leading-tight">
                Attendance
              </h3>
            </div>

            {!props.hideMonthNavigation && (
              <div className="flex items-center gap-1 bg-transparent p-0">
                <button onClick={props.handlePrevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#4318FF] active:scale-90">
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <span className="text-sm min-w-[90px] text-[#2B3674] text-center select-none">
                  {props.currentMonthName}
                </span>
                <button onClick={props.handleNextMonth} disabled={!props.canNavigateToNextMonth} className={`p-1 rounded-lg transition-all active:scale-90 ${!props.canNavigateToNextMonth ? "text-gray-300 cursor-not-allowed" : "text-[#A3AED0] hover:text-[#4318FF] hover:bg-white hover:shadow-sm"}`}>
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        )}

        <CalendarGrid {...props} compact />

        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-50 flex-wrap">
          {CALENDAR_SIMPLE_LEGEND_DOTS.map((dotClass) => (
            <div key={dotClass} className={`w-2 h-2 rounded-full ${dotClass}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarViewMobile;
