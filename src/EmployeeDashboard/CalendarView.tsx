import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { downloadPdf } from "../utils/downloadPdf";
import { useAppSelector, useAppDispatch } from "../hooks";
import { RootState } from "../store";
import { generateMonthlyEntries } from "../utils/attendanceUtils";
import { TimesheetEntry } from "../types";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { fetchMonthlyAttendance } from "../reducers/employeeAttendance.reducer";
import { UserType } from "../reducers/user.reducer";

interface CalendarProps {
  now?: Date;
  onNavigateToDate?: (date: number) => void;
  variant?: "small" | "large" | "sidebar";
  currentDate?: Date;
  onMonthChange?: (date: Date) => void;
  entries?: TimesheetEntry[];
}

const Calendar = ({
  now = new Date(),
  onNavigateToDate,
  variant = "large",
  currentDate,
  onMonthChange,
  entries: propEntries,
}: CalendarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { records } = useAppSelector((state: RootState) => state.attendance);
  const { entity } = useAppSelector(
    (state: RootState) => state.employeeDetails
  );
  // @ts-ignore - Assuming masterHolidays is in RootState but type might not be fully updated in IDE
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] }
  );
  const { currentUser } = useAppSelector((state: RootState) => state.user);

  const currentEmployeeId = entity?.employeeId;
  const holidaysFetched = useRef(false);
  const attendanceFetchedKey = useRef<string | null>(null);

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [internalDisplayDate, setInternalDisplayDate] = useState(now);
  const [downloadDateRange, setDownloadDateRange] = useState({
    from: "",
    to: "",
  });

  const displayDate = currentDate || internalDisplayDate;

  // Fetch holidays on mount
  useEffect(() => {
    if (holidaysFetched.current) return;
    holidaysFetched.current = true;
    dispatch(fetchHolidays());
  }, [dispatch]);

  // Fetch attendance data when month changes
  useEffect(() => {
    if (currentEmployeeId && !propEntries) {
      const fetchKey = `${currentEmployeeId}-${
        displayDate.getMonth() + 1
      }-${displayDate.getFullYear()}`;
      if (attendanceFetchedKey.current === fetchKey) return;
      attendanceFetchedKey.current = fetchKey;

      dispatch(
        fetchMonthlyAttendance({
          employeeId: currentEmployeeId,
          month: (displayDate.getMonth() + 1).toString().padStart(2, "0"),
          year: displayDate.getFullYear().toString(),
        })
      );
    }
  }, [dispatch, currentEmployeeId, displayDate, propEntries]);

  // Generate entries from Redux state ONLY if not provided via props
  const entries = useMemo(() => {
    if (propEntries) return propEntries;
    return generateMonthlyEntries(displayDate, now, records);
  }, [displayDate, now, records, propEntries]);

  const handlePrevMonth = () => {
    const newDate = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() - 1,
      1
    );
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      setInternalDisplayDate(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() + 1,
      1
    );
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      setInternalDisplayDate(newDate);
    }
  };

  const handleDownload = () => {
    const start = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      1
    );
    const end = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() + 1,
      0
    );

    const format = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split("T")[0];
    };

    setDownloadDateRange({ from: format(start), to: format(end) });
    setIsDownloadModalOpen(true);
  };

  const handleConfirmDownload = () => {
    if (!entity || !entries) return;

    const fromDate = new Date(downloadDateRange.from);
    const toDate = new Date(downloadDateRange.to);
    toDate.setHours(23, 59, 59, 999);

    const filteredEntries = entries.filter((e) => {
      const entryDate = new Date(e.fullDate);
      return entryDate >= fromDate && entryDate <= toDate;
    });

    const totalHours = filteredEntries.reduce(
      (sum, entry) => sum + (entry.totalHours || 0),
      0
    );

    downloadPdf({
      employeeName: entity.fullName || "Employee",
      employeeId: entity.employeeId,
      designation: entity.designation || "N/A",
      department: entity.department || "Engineering",
      month: `${downloadDateRange.from} to ${downloadDateRange.to}`,
      entries: filteredEntries,
      totalHours: totalHours,
    });

    setIsDownloadModalOpen(false);
  };

  const checkIsHoliday = (year: number, month: number, day: number) => {
    if (!holidays || holidays.length === 0) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return holidays.find(
      (h: any) => h.holidayDate === dateStr || h.date === dateStr
    );
  };

  const getStatusClasses = (day: number) => {
    const entry = entries.find((e) => e.date === day);
    const cellDate = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      day
    );
    const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
    const holiday = checkIsHoliday(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      day
    );
    const status = entry?.status;
    const isFuture =
      cellDate > new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (
      status === "Full Day" ||
      status === "WFH" ||
      status === "Client Visit"
    ) {
      return "bg-[#E9FBF5] text-[#01B574] border border-[#01B574]/20 shadow-sm";
    }
    if (status === "Half Day") {
      return "bg-[#FFF9E5] text-[#FFB020] border border-[#FFB020]";
    }
    if (holiday) {
      return "bg-[#FDF2F2] text-[#ff4d4d] border border-[#ff4d4d]/20 relative overflow-hidden";
    }
    if (isFuture && isWeekend && !status) {
      return "bg-red-50 text-red-400 border border-red-100";
    }
    if (status === "Leave" || (isWeekend && !status)) {
      return "bg-red-50 text-red-400 border border-red-100";
    }
    if (!entry) return "border border-gray-100 text-gray-400";
    return "border border-gray-100 text-gray-400";
  };

  const isSmall = variant === "small";
  const isSidebar = variant === "sidebar";

  const currentMonthName = displayDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const firstDay = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1
  ).getDay();
  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0
  ).getDate();

  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="animate-in fade-in duration-500">
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
          isSmall ? "p-3" : isSidebar ? "p-4" : "p-4 md:p-6 pb-4"
        }`}
      >
        {!isSmall && (
          <div
            className={`flex items-center justify-between gap-2 ${
              isSidebar ? "mb-4" : "flex-col sm:flex-row mb-1 md:mb-2 md:gap-4"
            }`}
          >
            <div className="flex items-center gap-3">
              <h3
                className={`${
                  isSidebar ? "text-base" : "text-lg md:text-xl"
                } font-bold text-[#1B254B] text-center sm:text-left`}
              >
                {isSidebar ? "Attendance" : "Monthly Attendance Snapshot"}
              </h3>
            </div>
            <div
              className={`flex items-center gap-2 ${
                isSidebar
                  ? "bg-transparent p-0"
                  : "md:gap-6 bg-gray-50/50 p-1 rounded-xl border border-gray-100/50"
              }`}
            >
              {!isSmall && !isSidebar && (
                <button
                  onClick={handleDownload}
                  className="p-2 text-[#2B3674] bg-[#F4F7FE] rounded-lg hover:bg-[#2B3674] hover:text-white transition-all duration-300 shadow-sm mr-2"
                  title="Download Monthly Report"
                >
                  <Download size={18} strokeWidth={2.5} />
                </button>
              )}
              <button
                onClick={handlePrevMonth}
                className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674] ${
                  isSidebar ? "p-1" : ""
                }`}
              >
                <ChevronLeft size={isSidebar ? 16 : 20} />
              </button>
              <span
                className={`${
                  isSidebar
                    ? "text-sm min-w-[100px]"
                    : "text-sm md:text-lg min-w-[120px] md:min-w-[140px]"
                } font-bold text-[#2B3674] text-center`}
              >
                {currentMonthName}
              </span>
              <button
                onClick={handleNextMonth}
                className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674] ${
                  isSidebar ? "p-1" : ""
                }`}
              >
                <ChevronRight size={isSidebar ? 16 : 20} />
              </button>
            </div>
          </div>
        )}

        <div
          className={`bg-white rounded-xl border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] ${
            isSmall ? "p-1.5 mb-2" : isSidebar ? "p-2 mb-4" : "p-2 md:p-3 mb-1"
          }`}
        >
          <div
            className={`grid grid-cols-7 ${
              isSmall
                ? "gap-0.5"
                : isSidebar
                ? "gap-1"
                : "gap-1 md:gap-x-px md:gap-y-2"
            }`}
          >
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className={`text-center font-bold text-gray-400 ${
                  isSmall
                    ? "text-[7px] mb-0.5"
                    : isSidebar
                    ? "text-[9px] mb-1"
                    : "text-[10px] md:text-xs mb-2"
                }`}
              >
                {day}
              </div>
            ))}

            {blanks.map((blank) => (
              <div
                key={`blank-${blank}`}
                className={`${
                  isSmall
                    ? "h-7 w-7"
                    : isSidebar
                    ? "h-8 w-8"
                    : "w-[90%] md:w-[75%] lg:w-[65%] h-12 md:h-14 lg:h-16"
                } mx-auto`}
              ></div>
            ))}

            {monthDays.map((day) => {
              const entry = entries.find((e) => e.date === day);
              const holiday = checkIsHoliday(
                displayDate.getFullYear(),
                displayDate.getMonth(),
                day
              );
              const isIncomplete =
                entry &&
                !entry.isFuture &&
                !entry.isToday &&
                !entry.isWeekend &&
                !holiday &&
                (entry.status === "Not Updated" ||
                  (!entry.totalHours && entry.status !== "Leave"));

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (onNavigateToDate) {
                      onNavigateToDate(day);
                    } else if (currentUser?.userType === UserType.EMPLOYEE) {
                      const targetDate = new Date(
                        displayDate.getFullYear(),
                        displayDate.getMonth(),
                        day
                      );
                      navigate("/employee-dashboard/my-timesheet", {
                        state: {
                          selectedDate: targetDate.toISOString(),
                          timestamp: targetDate.getTime(),
                        },
                      });
                    }
                  }}
                  className={`${
                    isSmall
                      ? "w-7 h-7 text-[9px]"
                      : isSidebar
                      ? "w-8 h-8 text-xs"
                      : "w-[90%] md:w-[75%] lg:w-[65%] h-12 md:h-14 lg:h-16 text-xs"
                  } mx-auto rounded-lg flex items-center justify-center font-bold transition-all hover:scale-105 cursor-pointer relative group ${getStatusClasses(
                    day
                  )}`}
                >
                  <span className={holiday ? "mb-2 md:mb-3" : ""}>{day}</span>

                  {holiday && !isSmall && !isSidebar && (
                    <div className="absolute bottom-1 md:bottom-2 left-0 w-full text-center px-0.5">
                      <p className="text-[7px] md:text-[9px] leading-tight truncate font-medium opacity-90">
                        {holiday.name}
                      </p>
                    </div>
                  )}

                  {isIncomplete && (
                    <div
                      className={`absolute top-0.5 right-0.5 md:-top-1 md:-right-1 bg-[#FFB020] text-white flex items-center justify-center rounded-full border border-white md:border-2 ${
                        isSmall
                          ? "w-1.5 h-1.5 text-[5px]"
                          : "w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-[7px] md:text-[9px] font-black"
                      }`}
                    >
                      !
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`flex items-center justify-center flex-wrap border-t border-gray-100 ${
            isSmall
              ? "gap-x-2 gap-y-1 mt-1 pt-1"
              : isSidebar
              ? "gap-2 mt-4 pt-4"
              : "gap-x-4 md:gap-x-10 mt-6 md:mt-8 pt-4 md:pt-6"
          }`}
        >
          <div
            className={`flex items-center text-gray-400 font-medium ${
              isSmall
                ? "gap-1 text-[8px]"
                : isSidebar
                ? "gap-1 text-[9px]"
                : "gap-1.5 md:gap-2 text-[10px] md:text-xs"
            }`}
          >
            <div
              className={`rounded bg-[#E9FBF5] border border-[#01B574]/20 ${
                isSmall ? "w-1.5 h-1.5" : "w-2.5 h-2.5 md:w-3 md:h-3"
              }`}
            ></div>{" "}
            {isSmall ? "Done" : "Full Day"}
          </div>
          <div
            className={`flex items-center text-gray-400 font-medium ${
              isSmall
                ? "gap-1 text-[8px]"
                : isSidebar
                ? "gap-1 text-[9px]"
                : "gap-1.5 md:gap-2 text-[10px] md:text-xs"
            }`}
          >
            <div
              className={`rounded bg-[#F4F7FE] border border-dashed border-[#00A3C4] ${
                isSmall ? "w-1.5 h-1.5" : "w-2.5 h-2.5 md:w-3 md:h-3"
              }`}
            ></div>{" "}
            Today
          </div>
          <div
            className={`flex items-center text-gray-400 font-medium ${
              isSmall
                ? "gap-1 text-[8px]"
                : isSidebar
                ? "gap-1 text-[9px]"
                : "gap-1.5 md:gap-2 text-[10px] md:text-xs"
            }`}
          >
            <div
              className={`rounded bg-[#FFF9E5] border border-[#FFB020] ${
                isSmall ? "w-1.5 h-1.5" : "w-2.5 h-2.5 md:w-3 md:h-3"
              }`}
            ></div>{" "}
            {isSmall ? "Miss" : "Half Day"}
          </div>
          <div
            className={`flex items-center text-gray-400 font-medium ${
              isSmall
                ? "gap-1 text-[8px]"
                : isSidebar
                ? "gap-1 text-[9px]"
                : "gap-1.5 md:gap-2 text-[10px] md:text-xs"
            }`}
          >
            <div
              className={`rounded bg-red-50 border border-red-100 ${
                isSmall ? "w-1.5 h-1.5" : "w-2.5 h-2.5 md:w-3 md:h-3"
              }`}
            ></div>{" "}
            {isSmall ? "Off" : isSidebar ? "Leave" : "Leave / Weekend"}
          </div>
        </div>
      </div>

      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
              <h3 className="text-lg font-bold text-[#2B3674] flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#00A3C4]" />
                Select Date Range
              </h3>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  From Date
                </label>
                <input
                  type="date"
                  value={downloadDateRange.from}
                  onChange={(e) =>
                    setDownloadDateRange({
                      ...downloadDateRange,
                      from: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  To Date
                </label>
                <input
                  type="date"
                  value={downloadDateRange.to}
                  onChange={(e) =>
                    setDownloadDateRange({
                      ...downloadDateRange,
                      to: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 flex gap-3">
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#2B3674] hover:bg-[#1B254B] rounded-xl transition-all shadow-lg hover:shadow-[#2B3674]/20 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
