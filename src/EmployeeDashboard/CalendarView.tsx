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

    // Full Day / WFH / Client Visit - Green
    if (
      status === "Full Day" ||
      status === "WFH" ||
      status === "Client Visit"
    ) {
      return "bg-[#E6FDF4]/60 text-[#05CD99] border border-[#05CD99]/20 shadow-sm";
    }

    // Half Day - Orange
    if (status === "Half Day") {
      return "bg-[#FFFBEB]/60 text-[#FFB020] border border-[#FFB020]/20";
    }

    // Government Holiday - Light Blue
    if (holiday) {
      return "bg-[#E6F7FF]/60 text-[#1890FF] border border-[#1890FF]/20 relative overflow-hidden";
    }

    // Leave or Weekend - Red
    if (
      status === "Leave" ||
      (isWeekend && !status) ||
      (isFuture && isWeekend && !status)
    ) {
      return "bg-[#FFF5F5]/60 text-[#EE5D50] border border-[#EE5D50]/10";
    }

    // Default - Pending/No entry
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
    <div
      className={`animate-in fade-in duration-500 h-full flex flex-col ${
        !isSmall && !isSidebar ? "p-4 md:p-6" : ""
      }`}
    >
      <div
        className={`bg-white shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 flex flex-col ${
          isSmall
            ? "p-3 rounded-xl"
            : isSidebar
            ? "p-4 rounded-xl"
            : "p-6 rounded-[20px] flex-1 h-full overflow-hidden"
        }`}
      >
        {!isSmall && (
          <div
            className={`flex flex-wrap items-center justify-between gap-y-4 gap-x-2 ${
              isSidebar ? "mb-4" : "mb-6"
            }`}
          >
            <div className="flex items-center gap-3 min-w-fit">
              <div
                className={`p-2 rounded-lg ${
                  isSidebar ? "bg-blue-50" : "bg-[#4318FF]/10"
                }`}
              >
                <CalendarIcon
                  className={`${
                    isSidebar ? "w-4 h-4" : "w-6 h-6"
                  } text-[#4318FF]`}
                />
              </div>
              <h3
                className={`${
                  isSidebar ? "text-base" : "text-xl md:text-2xl"
                } font-bold text-[#2B3674] tracking-tight leading-tight`}
              >
                {isSidebar ? "Attendance" : "Monthly Attendance Snapshot"}
              </h3>
            </div>

            <div className="flex items-center gap-2 md:gap-3 ml-auto sm:ml-0">
              {!isSmall && !isSidebar && (
                <button
                  onClick={handleDownload}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#2B3674] rounded-xl hover:bg-[#4318FF] hover:border-[#4318FF] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-blue-500/30 text-sm font-bold active:scale-95 group"
                  title="Download Monthly Report"
                >
                  <Download
                    size={16}
                    strokeWidth={2.5}
                    className="group-hover:animate-bounce"
                  />
                  <span>Download Report</span>
                </button>
              )}
              {!isSmall && !isSidebar && (
                <button
                  onClick={handleDownload}
                  className="md:hidden flex p-2 bg-white border border-gray-200 text-[#2B3674] rounded-xl hover:bg-[#4318FF] hover:border-[#4318FF] hover:text-white transition-all shadow-sm"
                  title="Download Monthly Report"
                >
                  <Download size={18} strokeWidth={2.5} />
                </button>
              )}

              <div
                className={`flex items-center gap-1 ${
                  isSidebar
                    ? "bg-transparent p-0"
                    : "bg-[#F4F7FE] p-1 rounded-xl border border-transparent hover:border-gray-200 transition-colors"
                }`}
              >
                <button
                  onClick={handlePrevMonth}
                  className={`p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#4318FF] active:scale-90 ${
                    isSidebar ? "p-1" : ""
                  }`}
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <span
                  className={`${
                    isSidebar
                      ? "text-sm min-w-[90px]"
                      : "text-sm font-extrabold min-w-[120px] md:min-w-[140px]"
                  } text-[#2B3674] text-center select-none`}
                >
                  {currentMonthName}
                </span>
                <button
                  onClick={handleNextMonth}
                  className={`p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#4318FF] active:scale-90 ${
                    isSidebar ? "p-1" : ""
                  }`}
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legend - Moved to top for better UX on large view */}
        {!isSmall && !isSidebar && (
          <div className="flex items-center gap-x-6 gap-y-2 flex-wrap mb-4 overflow-x-auto pb-2 scrollbar-none">
            {[
              {
                label: "Full Day/WFH",
                color: "bg-[#E9FBF5]",
                border: "border-[#05CD99]",
              },
              {
                label: "Half Day",
                color: "bg-[#FFF9E5]",
                border: "border-[#FFB020]",
              },
              {
                label: "Leave/Absent",
                color: "bg-[#FDF2F2]",
                border: "border-[#EE5D50]",
              },
              {
                label: "Today",
                color: "bg-[#4318FF]",
                border: "border-transparent",
                text: "text-white",
              },
              {
                label: "Holiday",
                color: "bg-[#E6F7FF]",
                border: "border-[#00A3C4]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 whitespace-nowrap"
              >
                <div
                  className={`w-3 h-3 rounded-full ${item.color} border ${item.border}`}
                ></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col relative">
          {/* Weekday Header */}
          <div
            className={`grid grid-cols-7 sticky top-0 bg-white z-20 pb-2 border-b border-gray-50 ${
              isSmall ? "gap-0.5" : isSidebar ? "gap-1" : "gap-3"
            }`}
          >
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className={`text-center font-black text-[#A3AED0] uppercase tracking-widest ${
                  isSmall
                    ? "text-[7px] mb-0.5"
                    : isSidebar
                    ? "text-[9px] mb-1"
                    : "text-[10px] py-2"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            className={`grid grid-cols-7 pb-2 mt-2 flex-1 ${
              isSmall ? "gap-1" : isSidebar ? "gap-1.5" : "gap-3"
            }`}
          >
            {blanks.map((blank) => (
              <div
                key={`blank-${blank}`}
                className=" rounded-2xl bg-gray-50/20 border border-dashed border-gray-100 min-h-[40px] md:min-h-[80px]"
              ></div>
            ))}

            {monthDays.map((day) => {
              const entry = entries.find((e) => e.date === day);
              const holiday = checkIsHoliday(
                displayDate.getFullYear(),
                displayDate.getMonth(),
                day
              );
              const isToday =
                day === now.getDate() &&
                displayDate.getMonth() === now.getMonth() &&
                displayDate.getFullYear() === now.getFullYear();

              const isIncomplete =
                entry &&
                !entry.isFuture &&
                !entry.isToday &&
                !entry.isWeekend &&
                !holiday &&
                (entry.status === "Not Updated" ||
                  (!entry.totalHours && entry.status !== "Leave"));

              // Status Logic for Styling
              let cellClass =
                "bg-white hover:shadow-md hover:-translate-y-1 border-gray-100";
              let textClass = "text-[#2B3674]";
              let statusLabel = entry?.status || "-";

              if (isToday) {
                cellClass =
                  "bg-white ring-2 ring-[#4318FF] shadow-lg shadow-blue-200 z-10";
                textClass = "text-[#4318FF]";
                if (statusLabel === "-") statusLabel = "";
              } else if (
                entry?.status === "Full Day" ||
                entry?.status === "WFH" ||
                entry?.status === "Client Visit"
              ) {
                cellClass =
                  "bg-[#E6FDF4]/50 border-transparent hover:bg-[#E6FDF4]";
                textClass = "text-[#05CD99]";
                 if (!entry?.totalHours || Number(entry.totalHours) === 0) {
                  statusLabel = "";
                }
              } else if (entry?.status === "Half Day") {
                cellClass =
                  "bg-[#FFFBEB]/50 border-transparent hover:bg-[#FFFBEB]";
                textClass = "text-[#FFB547]";
                if (!entry?.totalHours || Number(entry.totalHours) === 0) {
                  statusLabel = "";
                }
              } else if (
                entry?.status === "Leave" ||
                (isIncomplete && !entry?.isFuture)
              ) {
                cellClass =
                  "bg-[#FFF5F5]/50 border-transparent hover:bg-[#FFF5F5]";
                textClass = "text-[#EE5D50]";
              } else if (holiday) {
                cellClass =
                  "bg-[#F0F9FF]/50 border-transparent hover:bg-[#F0F9FF]";
                textClass = "text-[#1890FF]";
                statusLabel = holiday.name;
              } else if (entry?.isWeekend) {
                cellClass = "bg-gray-50/50 border-transparent";
                textClass = "text-gray-400";
                statusLabel = "Weekend";
              }

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (onNavigateToDate) {
                      onNavigateToDate(day);
                    } else {
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
                  className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all duration-300 cursor-pointer min-h-[90px] group ${cellClass}`}
                >
                  <span
                    className={`text-sm font-bold ${textClass} mb-1 flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday ? "bg-[#4318FF] text-white" : ""
                    } `}
                  >
                    {day}
                  </span>

                  <div className="flex-1 flex flex-col items-center justify-center w-full">
                    {entry?.totalHours ? (
                      <div className="text-center">
                        <span
                          className={`text-lg font-black ${textClass} leading-none`}
                        >
                          {entry.totalHours}
                        </span>
                        <span className="block text-[8px] font-bold text-gray-400 uppercase">
                          hrs
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`h-1 w-8 rounded-full ${
                          holiday ? "bg-[#00A3C4]/20" : "bg-gray-100"
                        }`}
                      ></div>
                    )}
                  </div>

                  <div
                    className={`text-[8px] font-bold uppercase truncate w-full text-center px-1 py-1 rounded-md mt-1
                         ${
                           holiday
                             ? "text-white bg-[#1890FF]"
                             : entry?.status === "Full Day" && statusLabel
                             ? "text-white bg-[#05CD99]"
                             : entry?.status === "Half Day" && statusLabel
                             ? "text-white bg-[#FFB020]"
                             : entry?.status === "Leave"
                             ? "text-white bg-[#EE5D50]"
                             : "text-gray-300"
                         }
                    `}
                  >
                    {holiday ? holiday.name : statusLabel}
                  </div>

                  {isIncomplete && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-[#FFB020] rounded-full animate-pulse shadow-sm"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Simple Legend for sidebar/small view */}
        {(isSmall || isSidebar) && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-50 flex-wrap">
            {/* Simplified legend dots */}
            <div className="w-2 h-2 rounded-full bg-[#05CD99]"></div>
            <div className="w-2 h-2 rounded-full bg-[#FFB020]"></div>
            <div className="w-2 h-2 rounded-full bg-[#EE5D50]"></div>
          </div>
        )}
      </div>

      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111c44]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <h3 className="text-lg font-bold text-[#2B3674] flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#4318FF]" />
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
                <label className="text-xs font-bold text-[#A3AED0] uppercase tracking-wide">
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
                  className="w-full px-4 py-3 bg-[#F4F7FE] border-transparent rounded-xl text-[#2B3674] font-bold focus:outline-none focus:ring-2 focus:ring-[#4318FF] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A3AED0] uppercase tracking-wide">
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
                  className="w-full px-4 py-3 bg-[#F4F7FE] border-transparent rounded-xl text-[#2B3674] font-bold focus:outline-none focus:ring-2 focus:ring-[#4318FF] transition-all"
                />
              </div>
            </div>

            <div className="p-5 flex gap-3">
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-[#A3AED0] hover:text-[#2B3674] bg-transparent hover:bg-[#F4F7FE] rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-linear-to-r from-[#868CFF] to-[#4318FF] rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-transform active:scale-95"
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
