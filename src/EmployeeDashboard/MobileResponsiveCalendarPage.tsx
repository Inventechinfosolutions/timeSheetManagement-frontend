import { useState, useMemo, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Loader2,
  Calendar as CalendarIcon,
  AlertCircle,
  Lock,
  Briefcase,
  Home,
  Clock,
  CalendarCheck,
  Building2,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import {
  downloadAttendancePdfReport,
  fetchMyTimesheet,
} from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { TimesheetEntry } from "../types";
import { AttendanceStatus, UserType } from "../enums";
import {
  generateMonthlyEntries,

} from "../utils/attendanceUtils";
import { saveAs } from "file-saver";



interface MobileResponsiveCalendarPageProps {
  employeeId?: string;
  entries?: TimesheetEntry[];
  currentDate?: Date;
  hideMonthNavigation?: boolean;
  onNavigateToDate?: (timestamp: number) => void;
  onBlockedClick?: () => void;
}

const MobileResponsiveCalendarPage = ({
  employeeId: propEmployeeId,
  entries: propEntries,
  currentDate: propCurrentDate,
  hideMonthNavigation = false,
  onNavigateToDate,
  onBlockedClick,
}: MobileResponsiveCalendarPageProps) => {
  const dispatch = useAppDispatch();

  // Redux Data
  const { records } = useAppSelector((state: RootState) => state.attendance);
  const { entity } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state: RootState) => state.user);

  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const isManager =
    currentUser?.userType === UserType.MANAGER ||
    (currentUser?.role &&
      currentUser.role.toUpperCase().includes(UserType.MANAGER));

  // @ts-ignore
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] },
  );
  const { blockers } = useAppSelector(
    (state: RootState) => state.timesheetBlocker || { blockers: [] },
  );

  const location = useLocation();
  const isMyRoute =
    location.pathname.includes("my-dashboard") ||
    location.pathname.includes("my-timesheet") ||
    location.pathname.includes("timesheet-view") ||
    location.pathname === "/employee-dashboard" ||
    location.pathname === "/employee-dashboard/";

  const currentEmployeeId =
    propEmployeeId ||
    (isMyRoute
      ? currentUser?.employeeId || currentUser?.loginId
      : entity?.employeeId || currentUser?.employeeId || currentUser?.loginId);

  const attendanceFetchedKey = useRef<string | null>(null);

  // Local State
  const [currentDate, setCurrentDate] = useState(
    () => propCurrentDate || new Date(),
  );
  const now = new Date(); // Real "today"

  useEffect(() => {
    if (propCurrentDate) {
      setCurrentDate(propCurrentDate);
    }
  }, [propCurrentDate]);

  const navigate = useNavigate();

  // Internal navigation: navigate to my-timesheet with the clicked date.
  // If parent provides onNavigateToDate, delegate to it; otherwise handle internally.
  const handleDateClick = (day: number) => {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    const timestamp = targetDate.getTime();

    if (onNavigateToDate) {
      onNavigateToDate(timestamp);
      return;
    }

    const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
    let basePath = "/employee-dashboard";
    if (location.pathname.startsWith("/manager-dashboard")) {
      basePath = "/manager-dashboard";
    } else if (location.pathname.startsWith("/admin-dashboard")) {
      basePath = "/admin-dashboard";
    }

    navigate(`${basePath}/my-timesheet`, {
      state: {
        selectedDate: dateStr,
        timestamp: Date.now(),
      },
    });
  };

  // Download State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadDateRange, setDownloadDateRange] = useState({
    from: "",
    to: "",
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Fetch Data Logic (skip holidays when parent already provides entries)
  useEffect(() => {
    if (propEntries) return;
    dispatch(fetchHolidays());
  }, [dispatch, propEntries]);

  useEffect(() => {
    if (!currentEmployeeId || propEntries) return;

    const fetchKey = `${currentEmployeeId}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    if (attendanceFetchedKey.current === fetchKey) return;
    attendanceFetchedKey.current = fetchKey;

    dispatch(
      fetchMyTimesheet({
        employeeId: currentEmployeeId,
        month: (currentDate.getMonth() + 1).toString().padStart(2, "0"),
        year: currentDate.getFullYear().toString(),
      }),
    );
  }, [dispatch, currentEmployeeId, currentDate, propEntries]);

  // 2. Calendar Logic (Grid Generation)
  const { monthDays, blanks, daysOfWeek, currentMonthName, entries, totalTrackedHours } =
    useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDay = new Date(year, month, 1).getDay();
      const firstDayIndex = firstDay; // Sun=0 .. Sat=6
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const blanksArr = Array.from({ length: firstDayIndex }, (_, i) => i);
      const monthDaysArr = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      // Generate simplified entries
      const generatedEntries = generateMonthlyEntries(
        currentDate,
        now,
        records,
      );

      const finalEntries = propEntries || generatedEntries;
      const totalTrackedHours = finalEntries
        .filter((e) => typeof e.totalHours === "number" && e.totalHours > 0)
        .reduce((sum, e) => sum + (e.totalHours ?? 0), 0);

      return {
        monthDays: monthDaysArr,
        blanks: blanksArr,
        daysOfWeek: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
        currentMonthName: currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        entries: finalEntries,
        totalTrackedHours,
      };
    }, [currentDate, records, propEntries, now]);

  // Helper: Check Holiday for a given day of current month
  const checkIsHoliday = (day: number) => {
    if (!holidays || holidays.length === 0) return null;
    const dateStr = dayjs(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
    ).format("YYYY-MM-DD");
    return holidays.find(
      (h: any) => h.holidayDate === dateStr || h.date === dateStr,
    );
  };

  // Dynamic statistics for bottom 6 cards
  const monthlyStats = useMemo(() => {
    let office = 0;
    let wfh = 0;
    let halfDay = 0;
    let leave = 0;
    let holidayCount = 0;
    let clientVisit = 0;

    entries.forEach((e) => {
      // Check if this date has a declared holiday or marked as holiday
      const isHoliday =
        !!checkIsHoliday(e.date) || e.status === AttendanceStatus.HOLIDAY;

      if (isHoliday && (!e.totalHours || e.totalHours === 0)) {
        holidayCount++;
        return;
      }

      const s = (e.status || "").toLowerCase().trim();
      const loc = (e.workLocation || "").toLowerCase().trim();
      const h1 = (e.firstHalf || "").toLowerCase().trim();
      const h2 = (e.secondHalf || "").toLowerCase().trim();

      // Half day check (explicit status or split day)
      if (
        s === AttendanceStatus.HALF_DAY.toLowerCase() ||
        s.includes("half day") ||
        (h1 && h2 && h1 !== h2)
      ) {
        halfDay++;
        return;
      }

      // Leave / Absent check
      if (
        s === AttendanceStatus.LEAVE.toLowerCase() ||
        s === AttendanceStatus.ABSENT.toLowerCase() ||
        s.includes("leave")
      ) {
        leave++;
        return;
      }

      // WFH check
      if (
        s === AttendanceStatus.WFH.toLowerCase() ||
        s.includes("wfh") ||
        s.includes("work from home") ||
        loc.includes("wfh") ||
        loc.includes("work from home") ||
        h1.includes("wfh") ||
        h2.includes("wfh")
      ) {
        wfh++;
        return;
      }

      // Client Visit check
      if (
        s === AttendanceStatus.CLIENT_VISIT.toLowerCase() ||
        s.includes("client visit") ||
        s.includes("client place") ||
        loc.includes("client") ||
        h1.includes("client") ||
        h2.includes("client")
      ) {
        clientVisit++;
        return;
      }

      // Office / Full Day check
      if (
        s === AttendanceStatus.FULL_DAY.toLowerCase() ||
        s === AttendanceStatus.PRESENT.toLowerCase() ||
        loc.includes("office") ||
        h1.includes("office") ||
        h2.includes("office") ||
        (typeof e.totalHours === "number" && e.totalHours > 0)
      ) {
        office++;
        return;
      }
    });

    return {
      office,
      wfh,
      halfDay,
      leave,
      holiday: holidayCount,
      clientVisit,
    };
  }, [entries, holidays, currentDate]);

  // 3. Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleDownload = () => {
    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const end = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    const format = (d: Date) => {
      return dayjs(d).format("YYYY-MM-DD");
    };

    setDownloadDateRange({ from: format(start), to: format(end) });
    setIsDownloadModalOpen(true);
  };

  const handleConfirmDownload = async () => {
    if (!currentEmployeeId) return;

    try {
      setIsDownloading(true);
      const fromDateStr = downloadDateRange.from;
      const monthStr = fromDateStr.split("-")[1];
      const yearStr = fromDateStr.split("-")[0];

      const blob = await downloadAttendancePdfReport(
        parseInt(monthStr),
        parseInt(yearStr),
        currentEmployeeId,
        downloadDateRange.from,
        downloadDateRange.to,
      );

      saveAs(
        blob,
        `Attendance_${currentEmployeeId}_${downloadDateRange.from}_to_${downloadDateRange.to}.pdf`,
      );

      setIsDownloadModalOpen(false);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // 4. Helper: Check Holiday
  const getBlocker = (day: number) => {
    if (!blockers || blockers.length === 0) return null;
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    targetDate.setHours(0, 0, 0, 0);

    return blockers.find((b: any) => {
      const start = new Date(b.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.blockedTo);
      end.setHours(0, 0, 0, 0);
      return targetDate >= start && targetDate <= end;
    });
  };

  return (
    <div className="flex flex-col w-full min-h-full bg-[#E8F4FD]">
      {/* Header Section */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        {/* Attendance Snapshot Card */}
        <div className="flex items-center justify-between mb-3 bg-white rounded-2xl px-3.5 py-2.5 shadow-sm border border-blue-100/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1B2559] leading-tight">
                Attendance Snapshot
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Monthly Overview
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="p-2.5 bg-[#4318FF] text-white rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            title="Download Report"
          >
            <Download size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Month Navigator + Total Tracked Card */}
        {!hideMonthNavigation && (
          <div className="flex items-center justify-between bg-white border border-blue-100/60 rounded-2xl px-4 py-2.5 shadow-sm">
            {/* Left: Month Navigation */}
            <div className="flex items-center justify-between flex-1 pr-3">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-blue-50 rounded-lg text-[#1B2559] transition-colors"
              >
                <ChevronLeft size={18} strokeWidth={2.4} />
              </button>
              <span
                className="text-sm sm:text-base font-bold text-[#1B2559] text-center"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {currentMonthName}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={
                  currentDate.getFullYear() > now.getFullYear() ||
                  (currentDate.getFullYear() === now.getFullYear() &&
                    currentDate.getMonth() >= now.getMonth())
                }
                className={`p-1 rounded-lg text-[#1B2559] transition-colors ${currentDate.getFullYear() > now.getFullYear() ||
                    (currentDate.getFullYear() === now.getFullYear() &&
                      currentDate.getMonth() >= now.getMonth())
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-blue-50"
                  }`}
              >
                <ChevronRight size={18} strokeWidth={2.4} />
              </button>
            </div>

            {/* Vertical Divider */}
            <div className="h-7 w-[1px] bg-blue-200/70" />

            {/* Right: Total Tracked Hours */}
            <div className="flex flex-col items-start pl-3 shrink-0" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="text-[11px] font-medium text-slate-500 leading-tight">
                Total Tracked
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-bold text-[#2563EB] leading-none">
                  {totalTrackedHours > 0 ? totalTrackedHours.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs font-semibold text-[#2563EB] leading-none">
                  hrs
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="min-h-[40px]" />
          ))}

          {monthDays.map((day) => {
            const entry = entries.find((e) => e.date === day);
            const holiday = checkIsHoliday(day);
            const manualBlocker = getBlocker(day);

            // Block only on manually set blockers (admin-placed blocks)
            // Leave, Sunday, and Company Holidays show their own colors — not locked
            const isBlocked = !!manualBlocker;

            const isToday =
              day === now.getDate() &&
              currentDate.getMonth() === now.getMonth() &&
              currentDate.getFullYear() === now.getFullYear();

            // Past days (before today) that are weekdays and haven't been updated/saved
            const isPastMonth =
              currentDate.getFullYear() < now.getFullYear() ||
              (currentDate.getFullYear() === now.getFullYear() &&
                currentDate.getMonth() < now.getMonth());
            const isPastDayInCurrentMonth =
              currentDate.getFullYear() === now.getFullYear() &&
              currentDate.getMonth() === now.getMonth() &&
              day < now.getDate();
            const isPast = isPastMonth || isPastDayInCurrentMonth;

            const cellDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day,
            );
            const dayOfWeek = cellDate.getDay();
            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

            const isPendingUpdate =
              isPast &&
              !isBlocked &&
              !holiday &&
              !entry?.isWeekend &&
              !isWeekendDay &&
              (entry?.status === AttendanceStatus.NOT_UPDATED ||
                entry?.status === AttendanceStatus.PENDING);

            const isSplitDay =
              !isBlocked &&
              (entry?.status === AttendanceStatus.HALF_DAY ||
                (!!entry?.firstHalf &&
                  !!entry?.secondHalf &&
                  entry.firstHalf !== entry.secondHalf));

            const getSplitHalfBg = (val: string | null | undefined, isFirst: boolean) => {
              const s = (val || "").toLowerCase().trim();
              if (s.includes("leave") || s.includes("absent")) {
                return "bg-pink-200"; // absent / leave color
              }
              if (
                s.includes("office") ||
                s.includes("present") ||
                s.includes("full day") ||
                s.includes("work") ||
                s.includes("wfh") ||
                s.includes("client")
              ) {
                return "bg-green-100"; // full day green color
              }
              return isFirst ? "bg-green-100" : "bg-pink-200";
            };

            const firstHalfBg = isSplitDay
              ? getSplitHalfBg(entry?.firstHalf, true)
              : "";
            const secondHalfBg = isSplitDay
              ? getSplitHalfBg(entry?.secondHalf, false)
              : "";

            // Determine color class
            let colorClass = "bg-white text-gray-600 border border-gray-200"; // Default / Future / Pending

            if (isBlocked) {
              colorClass = isToday
                ? "bg-gray-200 border border-gray-400 text-gray-700 font-bold ring-2 ring-[#4318FF]"
                : "bg-gray-200 border border-gray-400 text-gray-700 font-bold";
            } else if (
              isToday &&
              !holiday &&
              !isWeekendDay &&
              (entry?.status === undefined ||
                entry?.status === AttendanceStatus.PENDING ||
                entry?.status === AttendanceStatus.NOT_UPDATED) &&
              (!entry?.totalHours || entry.totalHours === 0)
            ) {
              colorClass =
                "bg-white ring-2 ring-[#4318FF] text-[#4318FF] border-transparent font-extrabold shadow-md";
            } else if (isSplitDay) {
              colorClass =
                "border border-orange-500 text-orange-500 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry?.status === AttendanceStatus.FULL_DAY) {
              colorClass =
                "bg-green-100 border border-green-600 text-green-700 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (
              entry?.status === AttendanceStatus.HALF_DAY ||
              isPendingUpdate
            ) {
              colorClass =
                entry?.status === AttendanceStatus.HALF_DAY
                  ? "bg-orange-100 border border-orange-600 text-orange-500 font-bold" +
                    (isToday ? " ring-2 ring-[#4318FF]" : "")
                  : "bg-white text-gray-600 border border-gray-200";
            } else if (entry?.status === AttendanceStatus.LEAVE) {
              colorClass =
                "bg-pink-100 border border-pink-400 text-red-600 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry?.status === AttendanceStatus.ABSENT) {
              colorClass =
                "bg-pink-200 border border-pink-500 text-red-600 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry?.status === AttendanceStatus.WFH) {
              colorClass =
                "bg-indigo-100 border border-indigo-500 text-indigo-700 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry?.status === AttendanceStatus.CLIENT_VISIT) {
              colorClass =
                "bg-yellow-100 border border-yellow-500 text-yellow-800 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (holiday) {
              colorClass =
                "bg-sky-200 border border-sky-500 text-sky-800 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry?.isWeekend || isWeekendDay) {
              colorClass =
                "bg-pink-100 border border-pink-400 text-red-600 font-bold" +
                (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry?.isFuture || entry?.status === undefined) {
              colorClass = "bg-slate-50 border border-slate-200 text-slate-400 font-bold";
            }

            return (
              <div
                key={day}
                onClick={() => {
                  if (isBlocked && (isAdmin || isManager) && onBlockedClick) {
                    onBlockedClick();
                    return;
                  }
                  if (!isBlocked) {
                    handleDateClick(day);
                  }
                }}
                className={`
                    aspect-[4/5] sm:aspect-square
                    rounded-xl relative
                    flex flex-col items-center justify-center
                    shadow-sm
                    cursor-pointer transition-all active:scale-95
                    ${colorClass}
                 `}
              >
                {/* Background Layer for Split Days */}
                {isSplitDay && (
                  <div className="absolute inset-0 z-0 rounded-xl overflow-hidden flex flex-col pointer-events-none">
                    <div className={`flex-1 ${firstHalfBg}`} />
                    <div className={`flex-1 ${secondHalfBg}`} />
                  </div>
                )}

                {isPendingUpdate && (
                  <div className="absolute -top-1.5 -right-1.5 z-20 animate-bounce">
                    <div className="bg-white text-slate-400 rounded-full p-0.5 shadow-lg ring-2 ring-slate-100 border border-slate-200">
                      <AlertCircle size={12} strokeWidth={3} />
                    </div>
                  </div>
                )}
                <span className="text-sm sm:text-lg leading-none -translate-y-1.5 z-10">{day}</span>
                <div className="absolute bottom-1 sm:bottom-1.5 inset-x-0 flex items-center justify-center pointer-events-none z-10">
                  {entry?.totalHours != null && entry.totalHours > 0 && !isBlocked && (
                    <span
                      style={{ fontFamily: "'Inter', sans-serif", color: entry.totalHours >= 9 ? "#16a34a" : "#d97706" }}
                      className="text-[10px] font-bold leading-none"
                    >
                      {entry.totalHours % 1 === 0 ? `${entry.totalHours}h` : `${entry.totalHours.toFixed(1)}h`}
                    </span>
                  )}
                  {holiday && !isBlocked && (
                    <span
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="text-[9px] sm:text-[10px] font-bold leading-none uppercase tracking-tight text-sky-800"
                    >
                      Holiday
                    </span>
                  )}
                  {(entry?.status === AttendanceStatus.LEAVE || entry?.status === AttendanceStatus.ABSENT) && !isBlocked && (
                    <span
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="text-[9.5px] sm:text-[10px] font-bold leading-none uppercase tracking-tight text-red-700"
                    >
                      Leave
                    </span>
                  )}
                  {isBlocked && (
                    <div className="flex flex-col items-center justify-center leading-none px-0.5">
                      <Lock size={9} className="text-gray-600 mb-0.5 shrink-0" strokeWidth={2.4} />
                      <span className="text-[6.5px] sm:text-[7.5px] font-bold text-gray-600 leading-tight uppercase tracking-tighter text-center">
                        {manualBlocker
                          ? (isAdmin || isManager
                            ? "Unblock"
                            : `Contact ${manualBlocker.blockedBy || "Admin"}`)
                          : "On Leave"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 mb-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-2.5 sm:px-3.5 py-3">
            <div className="grid grid-cols-3 gap-x-1 sm:gap-x-2.5 gap-y-2.5 items-center">
              {[
                {
                  label: AttendanceStatus.FULL_DAY,
                  className: "bg-green-100 border border-green-600",
                },
                {
                  label: "Half Day Leave",
                  className: "border border-orange-500 overflow-hidden flex flex-col",
                  split: true,
                },
                {
                  label: AttendanceStatus.LEAVE,
                  className: "bg-pink-100 border border-pink-400",
                },
                {
                  label: AttendanceStatus.ABSENT,
                  className: "bg-pink-300 border border-pink-500",
                },
                {
                  label: AttendanceStatus.WFH,
                  className: "bg-indigo-100 border border-indigo-500",
                },
                {
                  label: AttendanceStatus.CLIENT_VISIT,
                  className: "bg-yellow-100 border border-yellow-500",
                },
                {
                  label: "Today",
                  className: "bg-white border-2 border-[#4318FF]",
                },
                {
                  label: AttendanceStatus.HOLIDAY,
                  className: "bg-sky-200 border border-sky-500",
                },
                {
                  label: "Weekend",
                  className: "bg-pink-100 border border-pink-400",
                },
                {
                  label: "Upcoming",
                  className: "bg-slate-50 border border-slate-200",
                },
                {
                  label: "Blocked",
                  className: "bg-gray-200 border border-gray-400",
                },
                {
                  label: AttendanceStatus.NOT_UPDATED,
                  className: "bg-white border border-gray-300",
                  icon: true,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center ${item.className}`}
                  >
                    {"split" in item && item.split ? (
                      <div className="w-full h-full flex flex-col">
                        <div className="flex-1 bg-green-100" />
                        <div className="flex-1 bg-pink-200" />
                      </div>
                    ) : item.icon ? (
                      <span className="text-[9px] font-black text-slate-500 leading-none">
                        !
                      </span>
                    ) : null}
                  </div>
                  <span
                    className="text-[9px] min-[360px]:text-[9.5px] sm:text-[10px] font-extrabold text-slate-700 uppercase tracking-tight whitespace-nowrap"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6 Summary Cards */}
        <div className="mt-3 mb-2">
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {[
              { label: "OFFICE", value: monthlyStats.office, icon: Briefcase },
              { label: "WFH", value: monthlyStats.wfh, icon: Home },
              { label: "HALF DAY", value: monthlyStats.halfDay, icon: Clock },
              { label: "LEAVE", value: monthlyStats.leave, icon: CalendarIcon },
              { label: "HOLIDAY", value: monthlyStats.holiday, icon: CalendarCheck },
              { label: "CLIENT VISIT", value: monthlyStats.clientVisit, icon: Building2 },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-[#2563EB] rounded-2xl py-2 px-0.5 flex flex-col items-center justify-between text-center shadow-md min-h-[68px] sm:min-h-[74px]"
                >
                  <Icon size={17} className="text-white shrink-0 mt-0.5" strokeWidth={2.4} />
                  <span
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    className="text-base sm:text-lg font-black text-white leading-none my-0.5"
                  >
                    {card.value}
                  </span>
                  <span
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-tight leading-tight text-center px-0.5"
                  >
                    {card.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-[#111c44]/40 backdrop-blur-sm animate-in fade-in duration-200">
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
                    onChange={(e) => {
                      const newFrom = e.target.value;
                      setDownloadDateRange((prev) => {
                        const next = { ...prev, from: newFrom };
                        if (prev.to && newFrom && prev.to < newFrom) {
                          next.to = newFrom;
                        }
                        return next;
                      });
                    }}
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
                    min={downloadDateRange.from}
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

              <button
                disabled={
                  isDownloading ||
                  !downloadDateRange.from ||
                  !downloadDateRange.to
                }
                onClick={handleConfirmDownload}
                className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 mt-2
                  ${isDownloading ||
                    !downloadDateRange.from ||
                    !downloadDateRange.to
                    ? "bg-gray-300 shadow-none cursor-not-allowed"
                    : "bg-[#4318FF] shadow-blue-500/30 hover:shadow-blue-500/50"
                  }
                `}
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileResponsiveCalendarPage;
