import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { HeaderProps } from "./EmployeeDashboardTypes";

export default function DashboardHeaderDesktop({
  currentUser, entity, isMyRoute, displayEntry,
  calendarDate, setCalendarDate, UserType,
}: HeaderProps) {
  return (
    <div className="hidden md:block px-4 md:px-8 pt-4 md:pt-6 pb-1 md:pb-2">
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base md:text-lg font-medium text-[#2B3674]">
              {currentUser?.userType === UserType.MANAGER ? "Manager Dashboard" : "Employee Dashboard"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back,{" "}
              <span className="font-semibold text-[#4318FF]">
                {(isMyRoute ? currentUser?.aliasLoginName || currentUser?.loginId : null) ||
                  entity?.firstName || entity?.fullName || currentUser?.aliasLoginName || "Employee"}
              </span>
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {currentUser?.userType !== UserType.MANAGER && displayEntry && (
              <div className="bg-[#eef1fb] rounded-xl px-3 py-2 text-center w-full">
                <div className="flex items-center justify-center gap-1">
                  <CalendarIcon size={13} className="text-[#4318FF]" />
                  <p className="text-xs font-medium text-[#4318FF] leading-snug whitespace-nowrap">
                    {displayEntry.fullDate.toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between bg-[#f4f6fd] rounded-lg px-2 py-1 gap-2 w-full">
              <button
                onClick={() => { const p = new Date(calendarDate); p.setMonth(p.getMonth() - 1); setCalendarDate(p); }}
                className="w-4 h-4 bg-white rounded-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                aria-label="Previous month"
              >
                <ChevronLeft size={10} strokeWidth={2.5} className="text-[#4318FF]" />
              </button>
              <span className="text-[10px] font-medium text-[#4318FF] whitespace-nowrap">
                {calendarDate.toLocaleString("default", { month: "short", year: "numeric" })}
              </span>
              <button
                onClick={() => { const n = new Date(calendarDate); n.setMonth(n.getMonth() + 1); setCalendarDate(n); }}
                className="w-4 h-4 bg-white rounded-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                aria-label="Next month"
              >
                <ChevronRight size={10} strokeWidth={2.5} className="text-[#4318FF]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}