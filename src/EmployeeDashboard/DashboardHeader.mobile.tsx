import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HeaderProps } from "./EmployeeDashboardTypes";

export default function DashboardHeaderMobile({
  currentUser,
  entity,
  isMyRoute,
  displayEntry,
  calendarDate,
  setCalendarDate,
  UserType,
}: HeaderProps) {
  return (
    <div className="block md:hidden px-3 pt-4 pb-2">
      <div className="w-full bg-white rounded-2xl p-4 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80">
        <div className="flex items-center justify-between gap-2">
          {/* Left */}
          <div className="flex flex-col">
            <h1 className="text-base font-medium text-[#2B3674]">
              {currentUser?.userType === UserType.MANAGER
                ? "Manager Dashboard"
                : "Employee Dashboard"}
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back,{" "}
              <span className="font-semibold text-[#4318FF]">
                {(isMyRoute
                  ? currentUser?.aliasLoginName || currentUser?.loginId
                  : null) ||
                  entity?.firstName ||
                  entity?.fullName ||
                  currentUser?.aliasLoginName ||
                  "Employee"}
              </span>
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {currentUser?.userType !== UserType.MANAGER && displayEntry && (
              <div className="bg-[#eef1fb] rounded-xl px-3 py-1.5 flex items-center gap-1">
                <CalendarIcon size={13} className="text-[#4318FF]" />
                <p className="text-xs font-medium text-[#4318FF] whitespace-nowrap">
                  {displayEntry.fullDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 bg-[#f4f6fd] rounded-lg px-2 py-1">
              <button
                onClick={() => {
                  const p = new Date(calendarDate);
                  p.setMonth(p.getMonth() - 1);
                  setCalendarDate(p);
                }}
                className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm"
              >
                <ChevronLeft
                  size={11}
                  strokeWidth={2.5}
                  className="text-[#4318FF]"
                />
              </button>

              <span className="text-[11px] font-medium text-[#4318FF] whitespace-nowrap">
                {calendarDate.toLocaleString("default", {
                  month: "short",
                  year: "numeric",
                })}
              </span>

              <button
                onClick={() => {
                  const n = new Date(calendarDate);
                  n.setMonth(n.getMonth() + 1);
                  setCalendarDate(n);
                }}
                className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm"
              >
                <ChevronRight
                  size={11}
                  strokeWidth={2.5}
                  className="text-[#4318FF]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}