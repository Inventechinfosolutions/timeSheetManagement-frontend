import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Calendar as CalendarIcon,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { downloadPdf } from "../utils/downloadPdf";
import { useAppSelector, useAppDispatch } from "../hooks";
import { RootState } from "../store";
import {
  generateMonthlyEntries,
  generateRangeEntries,
} from "../utils/attendanceUtils";
import { TimesheetEntry } from "../types";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { fetchMonthlyAttendance } from "../reducers/employeeAttendance.reducer";
import { fetchBlockers } from "../reducers/timesheetBlocker.reducer";
import { UserType } from "../reducers/user.reducer";

interface CalendarProps {
  now?: Date;
  onNavigateToDate?: (date: number) => void;
  variant?: "small" | "large" | "sidebar";
  currentDate?: Date;
  onMonthChange?: (date: Date) => void;
  entries?: TimesheetEntry[];
  employeeId?: string;
}

const Calendar = ({
  now = new Date(),
  onNavigateToDate,
  variant = "large",
  currentDate,
  onMonthChange,
  entries: propEntries,
  employeeId: propEmployeeId,
}: CalendarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { records } = useAppSelector((state: RootState) => state.attendance);
    const { entity, entities } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state: RootState) => state.user);
  // @ts-ignore - Assuming masterHolidays is in RootState but type might not be fully updated in IDE
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] },
  );
  const { blockers } = useAppSelector(
    (state: RootState) => state.timesheetBlocker,
  );

  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const currentEmployeeId =
    propEmployeeId ||
    entity?.employeeId ||
    (!isAdmin ? currentUser?.employeeId : undefined);
  const holidaysFetched = useRef(false);
  const attendanceFetchedKey = useRef<string | null>(null);

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [internalDisplayDate, setInternalDisplayDate] = useState(now);
  const [downloadDateRange, setDownloadDateRange] = useState({
    from: "",
    to: "",
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const displayDate = currentDate || internalDisplayDate;

  // Fetch holidays on mount
  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  // Fetch attendance data and blockers when month/employee changes
  useEffect(() => {
    if (
      !currentEmployeeId ||
      (isAdmin && currentEmployeeId.toLowerCase() === "admin")
    )
      return;
    if (propEntries) return;

    const fetchKey = `${currentEmployeeId}-${
      displayDate.getMonth() + 1
    }-${displayDate.getFullYear()}`;

    if (attendanceFetchedKey.current === fetchKey) return;
    attendanceFetchedKey.current = fetchKey;

    dispatch(fetchBlockers(currentEmployeeId));
    dispatch(
      fetchMonthlyAttendance({
        employeeId: currentEmployeeId,
        month: (displayDate.getMonth() + 1).toString().padStart(2, "0"),
        year: displayDate.getFullYear().toString(),
      }),
    );
  }, [dispatch, currentEmployeeId, displayDate, propEntries, isAdmin]);

  // Generate entries from Redux state ONLY if not provided via props
  const entries = useMemo(() => {
    if (propEntries) return propEntries;
    return generateMonthlyEntries(displayDate, now, records);
  }, [displayDate, now, records, propEntries]);

  const handlePrevMonth = () => {
    const newDate = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() - 1,
      1,
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
      1,
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
      1,
    );
    const end = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() + 1,
      0,
    );

    const format = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split("T")[0];
    };

    setDownloadDateRange({ from: format(start), to: format(end) });
    setIsDownloadModalOpen(true);
  };

  const handleConfirmDownload = () => {
    if (!currentEmployeeId) return;

    // Resolve the correct employee object
    let downloadEntity = entity;
    if (currentEmployeeId && entity?.employeeId !== currentEmployeeId) {
      const found = entities?.find(
        (e: any) => e.employeeId === currentEmployeeId,
      );
      if (found) downloadEntity = found;
    }

    if (!downloadEntity) {
      console.warn("Could not find employee details for PDF");
    }

    try {
      setIsDownloading(true);
      const fromDateStr = downloadDateRange.from;
      const toDateStr = downloadDateRange.to;

      // 1. Use existing data from Redux state instead of making a new API call
      // Filter records that fall within the selected date range
      const filteredRecords = records.filter((record) => {
        const recordDate = new Date(record.workingDate)
          .toISOString()
          .split("T")[0];
        return recordDate >= fromDateStr && recordDate <= toDateStr;
      });

      // 2. Generate full range entries (including weekends/holidays/not-updated)
      const start = new Date(fromDateStr);
      const end = new Date(toDateStr);

      const rangeEntries = generateRangeEntries(
        start,
        end,
        now,
        filteredRecords,
      );

      const totalHours = rangeEntries.reduce(
        (sum, entry) => sum + (entry.totalHours || 0),
        0,
      );

      // 3. Generate PDF
      downloadPdf({
        employeeName: downloadEntity?.fullName || "Employee",
        employeeId: currentEmployeeId,
        designation: downloadEntity?.designation,
        department: downloadEntity?.department,
        month: `${fromDateStr} to ${toDateStr}`,
        entries: rangeEntries,
        totalHours: totalHours,
        holidays: holidays || [],
      });

      setIsDownloadModalOpen(false);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const isDateBlocked = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return blockers.some((b) => {
      const start = new Date(b.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.blockedTo);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  const getBlockedReason = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const blocker = blockers.find((b) => {
      const start = new Date(b.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.blockedTo);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
    return blocker?.reason || "Admin Blocked";
  };

  const checkIsHoliday = (year: number, month: number, day: number) => {
    if (!holidays || holidays.length === 0) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    return holidays.find(
      (h: any) => h.holidayDate === dateStr || h.date === dateStr,
    );
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
    1,
  ).getDay();
  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0,
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
                  className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 text-xs font-bold tracking-wide uppercase group"
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
                  className="md:hidden flex p-2.5 bg-gradient-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
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
                  disabled={
                    displayDate.getMonth() === new Date().getMonth() &&
                    displayDate.getFullYear() === new Date().getFullYear()
                  }
                  className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                    isSidebar ? "p-1" : ""
                  } ${
                    displayDate.getMonth() === new Date().getMonth() &&
                    displayDate.getFullYear() === new Date().getFullYear()
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#A3AED0] hover:text-[#4318FF] hover:bg-white hover:shadow-sm"
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
                color: "bg-emerald-50",
                border: "border-emerald-200",
                text: "text-emerald-700",
              },
              {
                label: "Half Day",
                color: "bg-amber-50",
                border: "border-amber-200",
                text: "text-amber-700",
              },
              {
                label: "Leave/Absent",
                color: "bg-red-50",
                border: "border-red-200",
                text: "text-red-700",
              },
              {
                label: "Today",
                color: "bg-[#4318FF]",
                border: "border-transparent",
                text: "text-white",
              },
              {
                label: "Holiday",
                color: "bg-blue-50",
                border: "border-blue-200",
                text: "text-blue-700",
              },
              {
                label: "Blocked",
                color: "bg-gray-100",
                border: "border-gray-200",
                text: "text-gray-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-xs font-bold text-gray-500 whitespace-nowrap"
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
              const cellDate = new Date(
                displayDate.getFullYear(),
                displayDate.getMonth(),
                day,
              );
              const holiday = checkIsHoliday(
                displayDate.getFullYear(),
                displayDate.getMonth(),
                day,
              );
              const isToday =
                day === now.getDate() &&
                displayDate.getMonth() === now.getMonth() &&
                displayDate.getFullYear() === now.getFullYear();

              const isBlocked = isDateBlocked(cellDate);
              const blockedReason = isBlocked ? getBlockedReason(cellDate) : "";

              // Determine if the day is incomplete (has data but marked as Not Updated)
              const isIncomplete =
                entry &&
                !entry.isFuture &&
                !entry.isToday &&
                !entry.isWeekend &&
                !holiday &&
                !entry.totalHours &&
                entry.status !== "Leave";

              // Status Logic for Styling
              const baseHover =
                "hover:shadow-md hover:-translate-y-1 transition-all duration-300";
              let cellClass = `bg-white border-gray-100 ${baseHover}`;
              let textClass = "text-[#2B3674]";
              let statusLabel = entry?.status || "-";

              if (isToday) {
                cellClass = `bg-white ring-2 ring-[#4318FF] shadow-lg shadow-blue-200 z-10 ${baseHover}`;
                textClass = "text-[#4318FF]";
                if (statusLabel === "-") statusLabel = "";
              } else if (isBlocked) {
                cellClass =
                  "bg-gray-200 opacity-90 grayscale border border-gray-200 shadow-inner cursor-not-allowed";
                textClass = "text-gray-500";
                statusLabel = "Blocked";
              } else if (
                entry?.status === "Full Day" ||
                entry?.status === "WFH" ||
                entry?.status === "Client Visit"
              ) {
                cellClass = `bg-emerald-50 border-transparent hover:bg-emerald-100 ${baseHover}`;
                textClass = "text-emerald-700 font-bold";
                if (!entry?.totalHours || Number(entry.totalHours) === 0) {
                  statusLabel = "";
                }
              } else if (
                entry?.status === "Half Day" ||
                isIncomplete // Using Amber for Incomplete
              ) {
                cellClass = `bg-amber-50 border-transparent hover:bg-amber-100 ${baseHover}`;
                textClass = "text-amber-700 font-bold";
                if (!entry?.totalHours || Number(entry.totalHours) === 0) {
                  statusLabel = isIncomplete ? "Not Updated" : "";
                }
              } else if (entry?.status === "Leave") {
                cellClass = `bg-red-50 border-transparent hover:bg-red-100 ${baseHover}`;
                textClass = "text-red-700 font-bold";
              } else if (holiday) {
                cellClass = `bg-blue-50 border-transparent hover:bg-blue-100 ${baseHover}`;
                textClass = "text-blue-700 font-bold";
                statusLabel = holiday.name;
              } else if (entry?.isWeekend) {
                cellClass = `bg-red-50 border-transparent text-red-600 hover:bg-red-100 ${baseHover}`;
                textClass = "text-red-600 font-bold";
                statusLabel = "WEEKEND";
              } else if (entry?.isFuture) {
                cellClass = `bg-white border-transparent hover:bg-gray-50 ${baseHover}`;
                textClass = "text-gray-300 font-bold";
                statusLabel = "UPCOMING";
              }

              return (
                <div
                  key={day}
                  onClick={() => {
                    console.log(
                      "Calendar: Day clicked:",
                      day,
                      "Month:",
                      displayDate.getMonth(),
                    );
                    if (onNavigateToDate) {
                      onNavigateToDate(day);
                    } else {
                      const targetDate = new Date(
                        displayDate.getFullYear(),
                        displayDate.getMonth(),
                        day,
                      );
                      const dateStr = targetDate.toISOString().split("T")[0];
                      const isParamView = window.location.pathname.includes(
                        "/admin-dashboard/working-details",
                      );

                      // Navigate based on view context
                      if (isParamView && currentEmployeeId) {
                        navigate(
                          `/admin-dashboard/timesheet/${currentEmployeeId}/${dateStr}`,
                        );
                      } else {
                        // Standard employee view
                        navigate("/employee-dashboard/my-timesheet", {
                          state: {
                            selectedDate: targetDate.toISOString(),
                            timestamp: targetDate.getTime(),
                          },
                        });
                      }
                    }
                  }}
                  className={`relative flex flex-col items-start justify-between p-2 rounded-2xl border transition-all duration-300 cursor-pointer min-h-[72px] group ${cellClass}`}
                  title={isBlocked ? `Blocked by Admin: ${blockedReason}` : ""}
                >
                  {/* Blocked Hover Overlay */}
                  {isBlocked && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-[#111c44]/40 backdrop-blur-[3px] rounded-2xl p-2 text-center overflow-hidden pointer-events-none">
                      <div className="bg-white/95 p-3 rounded-xl shadow-2xl flex flex-col items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 border border-white/20 w-[90%] mx-auto">
                        <div className="p-1.5 bg-red-100 rounded-lg">
                          <AlertCircle size={14} className="text-red-600" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-[#2B3674] leading-tight uppercase tracking-tight">
                            Timesheet Blocked
                          </p>
                          <p className="text-[10px] font-extrabold text-[#4318FF]">
                            {isAdmin ? "Unblock" : "Contact Admin"}
                          </p>
                        </div>
                        {blockedReason && (
                          <div className="mt-1 pt-1 border-t border-gray-100 w-full px-1">
                            <p
                              className="text-[8px] text-[#A3AED0] font-bold italic truncate overflow-hidden whitespace-nowrap"
                              title={blockedReason}
                            >
                              "{blockedReason}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <span
                    className={`text-sm font-bold text-black mb-1 flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday ? "bg-[#4318FF] text-white" : ""
                    } `}
                  >
                    {day}
                  </span>

                  {isBlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock size={12} className="text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col items-center justify-center w-full">
                    {!isBlocked && entry?.totalHours ? (
                      <div className="text-center">
                        <span
                          className={`text-2xl font-medium text-gray-800 leading-none`}
                        >
                          {entry.totalHours}
                        </span>
                        <span className="block text-[8px] font-bold text-black uppercase">
                          hrs
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`h-1 w-8 rounded-full ${
                          holiday
                            ? "bg-[#00A3C4]/20"
                            : isBlocked
                              ? "bg-gray-300"
                              : "bg-gray-100"
                        }`}
                      ></div>
                    )}
                  </div>

                  <div
                    className={`text-[10px] font-bold uppercase truncate w-full text-center px-1 py-1 rounded-md mt-1 backdrop-blur-sm
                         ${
                           isBlocked
                             ? "text-white bg-gray-600"
                             : holiday
                               ? "text-white bg-[#1890FF]/70"
                               : entry?.status === "Full Day" && statusLabel
                                 ? "text-white bg-[#01B574]"
                                 : (entry?.status === "Half Day" ||
                                       isIncomplete) &&
                                     statusLabel
                                   ? "text-white bg-[#FFB020]/80"
                                   : entry?.status === "Leave"
                                     ? "text-white bg-red-400/70"
                                     : entry?.isWeekend
                                       ? "text-white bg-red-400/70"
                                       : "text-white bg-gray-500"
                         }
                    `}
                  >
                    {isBlocked
                      ? "BLOCKED"
                      : holiday
                        ? holiday.name
                        : isIncomplete && !statusLabel
                          ? "Not Updated"
                          : statusLabel}
                  </div>

                  {isIncomplete && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                      <span className="text-white text-[10px] font-bold">
                        !
                      </span>
                    </div>
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
                <div className="relative group">
                  <input
                    type="date"
                    value={downloadDateRange.from}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setDownloadDateRange({
                        ...downloadDateRange,
                        from: e.target.value,
                      })
                    }
                    className="w-full pl-4 pr-12 py-3 bg-[#F4F7FE] border-transparent rounded-xl text-[#2B3674] font-bold focus:outline-none focus:ring-2 focus:ring-[#4318FF] transition-all cursor-pointer"
                  />
                  <CalendarIcon
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A3AED0] uppercase tracking-wide">
                  To Date
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    value={downloadDateRange.to}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setDownloadDateRange({
                        ...downloadDateRange,
                        to: e.target.value,
                      })
                    }
                    className="w-full pl-4 pr-12 py-3 bg-[#F4F7FE] border-transparent rounded-xl text-[#2B3674] font-bold focus:outline-none focus:ring-2 focus:ring-[#4318FF] transition-all cursor-pointer"
                  />
                  <CalendarIcon
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none"
                  />
                </div>
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
                disabled={isDownloading}
                className={`flex-1 px-4 py-3 text-xs font-bold text-white bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 tracking-wide uppercase ${isDownloading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isDownloading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {isDownloading ? "Fetching..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
