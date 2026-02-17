import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Calendar as CalendarIcon,
  AlertCircle,
  Loader2,
  ShieldBan,
} from "lucide-react";
import { saveAs } from "file-saver";
import { useAppSelector, useAppDispatch } from "../hooks";
import { RootState } from "../store";
import {
  generateMonthlyEntries,
  generateRangeEntries,
  isEditableMonth,
} from "../utils/attendanceUtils";
import { TimesheetEntry } from "../types";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import {
  fetchMonthlyAttendance,
  autoUpdateTimesheet,
  downloadAttendancePdfReport,
} from "../reducers/employeeAttendance.reducer";
import { fetchBlockers } from "../reducers/timesheetBlocker.reducer";
import { getLeaveHistory } from "../reducers/leaveRequest.reducer";
import { UserType } from "../reducers/user.reducer";

interface CalendarProps {
  now?: Date;
  onNavigateToDate?: (date: number) => void;
  variant?: "small" | "large" | "sidebar";
  currentDate?: Date;
  onMonthChange?: (date: Date) => void;
  entries?: TimesheetEntry[];
  employeeId?: string;
  scrollable?: boolean;
  viewOnly?: boolean;
  onBlockedClick?: () => void;
  hideMonthNavigation?: boolean;
}

const Calendar = ({
  now = new Date(),
  onNavigateToDate,
  variant = "large",
  currentDate,
  onMonthChange,
  entries: propEntries,
  employeeId: propEmployeeId,
  scrollable = true,
  viewOnly = false,
  onBlockedClick,
  hideMonthNavigation = false,
}: CalendarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
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
  const isManager =
    currentUser?.userType === UserType.MANAGER ||
    (currentUser?.role && currentUser.role.toUpperCase().includes("MANAGER"));
  const isMyRoute =
    location.pathname.includes("my-dashboard") ||
    location.pathname.includes("my-timesheet") ||
    location.pathname === "/employee-dashboard" ||
    location.pathname === "/employee-dashboard/";

  const currentEmployeeId =
    propEmployeeId ||
    (isMyRoute
      ? currentUser?.employeeId || currentUser?.loginId
      : entity?.employeeId || currentUser?.employeeId || currentUser?.loginId);

  // const holidaysFetched = useRef(false);
  const attendanceFetchedKey = useRef<string | null>(null);

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [internalDisplayDate, setInternalDisplayDate] = useState(now);
  const [downloadDateRange, setDownloadDateRange] = useState({
    from: "",
    to: "",
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const displayDate = currentDate || internalDisplayDate;

  // Calculate if next month navigation is allowed
  const canNavigateToNextMonth = useMemo(() => {
    // Both admins and employees can navigate to any future month
    return true;
  }, []);

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
    // Also fetch leave requests so we can reflect approved Leave/WFH/Client Visit
    // even if attendance records are not present (backend delay/lock rules).
    dispatch(
      getLeaveHistory({
        employeeId: currentEmployeeId,
        page: 1,
        limit: 500,
      }),
    );
  }, [dispatch, currentEmployeeId, displayDate, propEntries, isAdmin]);

  // Generate entries from Redux state ONLY if not provided via props
  // Overlay Approved leave/WFH/Client Visit from leave-requests onto timesheet entries.
  const entries = useMemo(() => {
    if (propEntries) {
      return propEntries;
    }

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

    if (currentEmployeeId && currentEmployeeId !== "Admin") {
      dispatch(
        autoUpdateTimesheet({
          employeeId: currentEmployeeId,
          month: (newDate.getMonth() + 1).toString().padStart(2, "0"),
          year: newDate.getFullYear().toString(),
          dryRun: true,
        }),
      );
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth() + 1,
      1,
    );
    // Both admins and employees can navigate to any future month
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      setInternalDisplayDate(newDate);
    }

    if (currentEmployeeId && currentEmployeeId !== "Admin") {
      dispatch(
        autoUpdateTimesheet({
          employeeId: currentEmployeeId,
          month: (newDate.getMonth() + 1).toString().padStart(2, "0"),
          year: newDate.getFullYear().toString(),
          dryRun: true,
        }),
      );
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

  const handleConfirmDownload = async () => {
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
      // Backend handles extraction from month/year
      const monthStr = downloadDateRange.from.split("-")[1];
      const yearStr = downloadDateRange.from.split("-")[0];
      const month = parseInt(monthStr);
      const year = parseInt(yearStr);

      const blob = await downloadAttendancePdfReport(
        month,
        year,
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

  const isDateBlocked = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // 1. Month Lock (Skip for Admin/Manager)
    if (!isAdmin && !isManager && !isEditableMonth(d)) return true;

    // 2. Manual Blockers
    const isManualBlocked = blockers.some((b) => {
      const start = new Date(b.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.blockedTo);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
    if (isManualBlocked) return true;

    // 3. Restricted Activity (Mixed Combinations / Leave / WFH)
    // If the record exists and has non-office activity, it's blocked for editing
    if (!isAdmin && !isManager) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = records.find((r) => {
        const rDate = new Date(r.workingDate);
        return rDate.toISOString().split("T")[0] === dateStr;
      });

      if (entry) {
        const h1 = (entry.firstHalf || "").toLowerCase();
        const h2 = (entry.secondHalf || "").toLowerCase();
        const isRestricted = (val: string) =>
          val && !val.includes("office") && val.trim() !== "";

        if (isRestricted(h1) || isRestricted(h2)) return true;
      }
    }

    return false;
  };

  const getBlocker = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return blockers.find((b) => {
      const start = new Date(b.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.blockedTo);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  const getBlockedReason = (date: Date) => {
    // 1. Month Lock
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (!isAdmin && !isManager && !isEditableMonth(d)) return "Month is Locked";

    // 2. Manual Blocker
    const blocker = getBlocker(date);
    if (blocker) return blocker.reason || "Admin Blocked";

    // 3. Restricted Activity
    if (!isAdmin && !isManager) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = records.find((r) => {
        const rDate = new Date(r.workingDate);
        return rDate.toISOString().split("T")[0] === dateStr;
      });

      if (entry) {
        const h1 = (entry.firstHalf || "").toLowerCase();
        const h2 = (entry.secondHalf || "").toLowerCase();
        const isRestricted = (val: string) =>
          val && !val.includes("office") && val.trim() !== "";

        if (isRestricted(h1) || isRestricted(h2))
          return "Restricted Activity (Leave/WFH)";
      }
    }

    return null;
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

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const firstDay = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1,
  ).getDay();
  const firstDayIndex = firstDay;
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0,
  ).getDate();

  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div
      className={`animate-in fade-in duration-500 flex flex-col ${
        scrollable ? "h-full flex-1 min-h-0" : ""
      } ${!isSmall && !isSidebar ? "p-4 md:p-6" : ""}`}
    >
      <div
        className={`bg-white shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 flex flex-col ${
          isSmall
            ? "p-3 rounded-xl"
            : isSidebar
              ? "p-4 rounded-xl"
              : `p-6 rounded-[20px] ${scrollable ? "flex-1 h-full overflow-hidden" : ""}`
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
                  className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 text-xs font-bold tracking-wide uppercase group"
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
                  className="md:hidden flex p-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  title="Download Monthly Report"
                >
                  <Download size={18} strokeWidth={2.5} />
                </button>
              )}

              {!hideMonthNavigation && (
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
                    disabled={!canNavigateToNextMonth}
                    className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                      isSidebar ? "p-1" : ""
                    } ${
                      !canNavigateToNextMonth
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-[#A3AED0] hover:text-[#4318FF] hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend - Moved to top for better UX on large view */}
        {!isSmall && !isSidebar && (
          <div className="flex items-center gap-x-6 gap-y-2 flex-wrap mb-4 overflow-x-auto pb-2 scrollbar-none">
            {[
              {
                label: "Full Day",
                color: "bg-emerald-50",
                border: "border-emerald-200",
                text: "text-emerald-700",
              },
              {
                label: "Half Day Leave",
                color: "bg-amber-50",
                border: "border-amber-200",
                text: "text-amber-700",
              },
              {
                label: "Absent",
                color: "bg-red-50",
                border: "border-red-200",
                text: "text-red-700",
              },
              {
                label: "Leave",
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
                label: "Pending Update",
                color: "bg-white",
                border: "border-gray-200",
                text: "text-gray-500",
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
                className="flex items-center gap-2 text-xs font-bold text-gray-600 whitespace-nowrap"
              >
                <div
                  className={`w-3 h-3 rounded-full ${item.color} border ${item.border}`}
                ></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div
          className={`flex flex-col relative ${scrollable ? "flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0" : ""}`}
        >
          {/* Weekday Header */}
          <div
            className={`grid grid-cols-7 sticky top-0 bg-white z-20 pb-2 border-b border-gray-50 ${
              isSmall ? "gap-0.5" : isSidebar ? "gap-1" : "gap-3"
            }`}
          >
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className={`text-center text-xs font-black text-gray-700 uppercase tracking-wide ${
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

              // Sunday should always show as Weekend, regardless of any data
              const dayOfWeek = cellDate.getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              // Saturday: Only show as Weekend if there's NO data (no workLocation, no meaningful status)
              const isSaturdayWithNoData =
                isSaturday &&
                entry &&
                !entry.workLocation &&
                (entry.status === "Weekend" ||
                  entry.status === "Pending" ||
                  entry.status === "Not Updated" ||
                  !entry.status);

              // Determine if the day is incomplete (has data but marked as Not Updated)
              const isIncomplete =
                entry &&
                !entry.isFuture &&
                !entry.isToday &&
                !entry.isWeekend &&
                !holiday &&
                !entry.totalHours &&
                entry.status !== "Leave" &&
                entry.status !== "Absent";

              // Detect split days (when firstHalf and secondHalf differ)
              const isSplitDay =
                !!(entry as any)?.firstHalf &&
                !!(entry as any)?.secondHalf &&
                (entry as any).firstHalf !== (entry as any).secondHalf;

              // Helper to get consistent styles matching MyTimesheet exactly
              const getStatusStyles = (
                statusStr: string | null | undefined,
                location?: string | null,
              ) => {
                const s = (statusStr || "").toLowerCase();
                const loc = (location || "").toLowerCase();

                // Handle combined statuses (e.g. "WFH (Half Day)") by checking includes
                const isHalfDay = s.includes("half day") || s === "half day";
                const isWFH =
                  s.includes("wfh") ||
                  s.includes("work from home") ||
                  loc === "wfh" ||
                  loc === "work from home";
                const isClientVisit =
                  s.includes("client visit") ||
                  s.includes("client place") ||
                  loc === "client visit" ||
                  loc === "client place";
                const isOffice = s === "office" || loc === "office";
                const isLeave = s === "leave" || s === "weekend";

                if (s === "blocked")
                  return {
                    bg: "bg-gray-200",
                    badge: "bg-gray-600 text-white",
                    border: "border-transparent",
                    text: "text-gray-600",
                  };
                if (s === "holiday")
                  return {
                    bg: "bg-[#DBEAFE]",
                    badge: "bg-[#1890FF]/70 text-white font-bold",
                    border: "border-[#1890FF]/20",
                    text: "text-[#1890FF]",
                  };

                // Priority: Specific types first
                if (isWFH)
                  return {
                    bg: "bg-[#DBEAFE]",
                    badge: "bg-[#4318FF]/70 text-white font-bold",
                    border: "border-[#4318FF]/20",
                    text: "text-[#4318FF]",
                  };
                if (isClientVisit)
                  return {
                    bg: "bg-[#DBEAFE]",
                    badge: "bg-[#4318FF]/70 text-white font-bold",
                    border: "border-[#4318FF]/20",
                    text: "text-[#4318FF]",
                  };

                // Fallbacks
                if (isLeave)
                  return {
                    bg: "bg-[#FEE2E2]",
                    badge: "bg-[#EE5D50]/70 text-white font-bold",
                    border: "border-[#EE5D50]/10",
                    text: "text-[#EE5D50]",
                  };
                if (isOffice || s === "full day")
                  return {
                    bg: "bg-[#E6FFFA]",
                    badge: "bg-[#01B574] text-white font-bold",
                    border: "border-[#01B574]/20",
                    text: "text-[#01B574]",
                  };
                if (isHalfDay)
                  return {
                    bg: "bg-[#FEF3C7]",
                    badge: "bg-[#FFB020]/80 text-white font-bold",
                    border: "border-[#FFB020]/20",
                    text: "text-[#FFB020]",
                  };
                if (s === "absent")
                  return {
                    bg: "bg-[#FECACA]",
                    badge: "bg-[#DC2626]/70 text-white font-bold",
                    border: "border-[#DC2626]/20",
                    text: "text-[#DC2626]",
                  };

                return {
                  bg: "bg-[#F8FAFC]",
                  badge: "bg-[#64748B]/90 text-white font-bold",
                  border: "border-gray-300",
                  text: "text-gray-600",
                };
              };

              const getShortStatus = (status: string) => {
                const s = (status || "").toLowerCase();
                if (s.includes("work from home")) return "WFH";
                return status;
              };

              const isWorkLoc = (s: string) => {
                const lower = (s || "").toLowerCase();
                return [
                  "wfh",
                  "work from home",
                  "client visit",
                  "client place",
                  "office",
                ].some((k) => lower.includes(k));
              };

              const useNeutralSplit =
                isSplitDay &&
                isWorkLoc((entry as any).firstHalf) &&
                isWorkLoc((entry as any).secondHalf);

              // Status Logic for Styling
              const baseHover =
                "hover:shadow-md hover:-translate-y-1 transition-all duration-300";
              let cellClass = `bg-white border-gray-200 ${baseHover}`;
              // let textClass = "text-[#2B3674]";
              let statusLabel = entry?.status || "-";

              if (isToday) {
                cellClass = `bg-white ring-2 ring-[#4318FF] shadow-lg shadow-blue-200 z-10 ${baseHover}`;
                // textClass = "text-[#4318FF]";
                if (statusLabel === "-") statusLabel = "";
              } else if (holiday) {
                // Master holidays take priority over everything (Leave, WFH, Client Visit, etc.)
                cellClass = `bg-blue-50 border-transparent hover:bg-blue-100 ${baseHover}`;
                // textClass = "text-blue-700 font-bold";
                statusLabel = holiday.name;
              } else if (
                isSunday ||
                (isSaturdayWithNoData && entry && !entry.workLocation)
              ) {
                // Sunday: Always Weekend. Saturday: Only Weekend if no data
                cellClass = `bg-red-50 border-transparent text-red-600 hover:bg-red-100 ${baseHover}`;
                // textClass = "text-red-600 font-bold";
                statusLabel = "WEEKEND";
              } else if (isSplitDay) {
                // Split Day: No border
                cellClass = `bg-white border-transparent ${baseHover}`;
              } else if (entry?.status === "Full Day") {
                cellClass = `bg-emerald-50 border-transparent hover:bg-emerald-100 ${baseHover}`;
                // textClass = "text-emerald-700 font-bold";
                if (!entry?.totalHours || Number(entry.totalHours) === 0) {
                  statusLabel = "";
                }
              } else if (entry?.status === "Half Day") {
                cellClass = `bg-amber-100 border-amber-300 hover:bg-amber-200 ${baseHover}`;
                // textClass = "text-amber-700 font-bold";
                if (!entry?.totalHours || Number(entry.totalHours) === 0) {
                  statusLabel = "";
                }
              } else if (entry?.status === "Leave") {
                // Leave status takes priority over workLocation (even if workLocation is Client Visit)
                cellClass = `bg-red-50 border-transparent hover:bg-red-100 ${baseHover}`;
                // textClass = "text-red-700 font-bold";
                statusLabel = "Leave";
              } else if (
                entry?.workLocation === "Client Visit" ||
                entry?.status === "Client Visit"
              ) {
                // Client Visit (only if status is NOT Leave)
                cellClass = `bg-blue-50 border-transparent hover:bg-blue-100 ${baseHover}`;
                statusLabel =
                  entry?.workLocation || entry?.status || "Client Visit";
              } else if (
                entry?.workLocation === "WFH" ||
                entry?.status === "WFH"
              ) {
                cellClass = `bg-blue-50 border-transparent hover:bg-blue-100 ${baseHover}`;
                statusLabel = entry?.workLocation || entry?.status || "WFH";
              } else if (isIncomplete) {
                cellClass = `bg-white border-gray-300 hover:bg-gray-50 ${baseHover}`;
                if (!entry?.totalHours || Number(entry.totalHours) === 0) {
                  statusLabel = "Not Updated";
                }
              } else if (entry?.status === "Absent") {
                cellClass = `bg-red-50 border-transparent hover:bg-red-100 ${baseHover}`;
                // textClass = "text-red-700 font-bold";
              } else if (entry?.isFuture) {
                cellClass = `bg-white border-gray-300 hover:bg-gray-50 ${baseHover}`;
                // textClass = "text-gray-300 font-bold";
                statusLabel = "UPCOMING";
              }

              // Apply blocked cursor style if blocked
              if (isBlocked) {
                cellClass += " cursor-not-allowed";
              }

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (isBlocked && (isAdmin || isManager) && onBlockedClick) {
                      onBlockedClick();
                      return;
                    }
                    const targetDate = new Date(
                      displayDate.getFullYear(),
                      displayDate.getMonth(),
                      day,
                    );
                    const timestamp = targetDate.getTime();

                    if (onNavigateToDate) {
                      onNavigateToDate(timestamp);
                    } else {
                      const y = targetDate.getFullYear();
                      const m = String(targetDate.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const d = String(targetDate.getDate()).padStart(2, "0");
                      const dateStr = `${y}-${m}-${d}`;
                      const isPrivilegedUser =
                        currentUser?.userType === UserType.ADMIN ||
                        currentUser?.userType === UserType.MANAGER ||
                        currentUser?.userType === UserType.TEAM_LEAD;

                      const isSelfView =
                        currentEmployeeId === currentUser?.employeeId;
                      const isViewAttendance =
                        location.pathname.includes("/view-attendance/");

                      // Disable navigation for Admin and Manager on dashboard or view-attendance pages
                      if (
                        isPrivilegedUser &&
                        (isSelfView || isViewAttendance) &&
                        (location.pathname.startsWith("/manager-dashboard") ||
                          location.pathname.startsWith("/admin-dashboard"))
                      ) {
                        return;
                      }

                      // Privileged user viewing someone else's calendar (View Mode)
                      if (
                        viewOnly &&
                        isPrivilegedUser &&
                        currentEmployeeId &&
                        currentEmployeeId !== currentUser?.employeeId
                      ) {
                        const basePath = location.pathname.startsWith(
                          "/manager-dashboard",
                        )
                          ? "/manager-dashboard"
                          : "/admin-dashboard";

                        navigate(
                          `${basePath}/timesheet/${currentEmployeeId}/${dateStr}`,
                          {
                            state: {
                              selectedDate: dateStr,
                              timestamp: Date.now(),
                            },
                          },
                        );
                      } else {
                        // Default: User viewing their own timesheet (Employee or Manager self-view)
                        const basePath = location.pathname.startsWith(
                          "/manager-dashboard",
                        )
                          ? "/manager-dashboard"
                          : location.pathname.startsWith("/admin-dashboard")
                            ? "/admin-dashboard"
                            : "/employee-dashboard";

                        navigate(`${basePath}/my-timesheet`, {
                          state: {
                            selectedDate: dateStr,
                            timestamp: Date.now(),
                          },
                        });
                      }
                    }
                  }}
                  className={`relative flex flex-col items-start justify-between p-2 rounded-2xl border transition-all duration-300 cursor-pointer min-h-[72px] group overflow-hidden ${cellClass}`}
                  title={isBlocked ? `Blocked by Admin: ${blockedReason}` : ""}
                >
                  {/* Background Layer for Split Days - Always Colored */}
                  {isSplitDay ? (
                    <div className="absolute inset-0 z-0 rounded-2xl flex flex-col sm:flex-row overflow-hidden">
                      {isWorkLoc((entry as any).firstHalf) &&
                      isWorkLoc((entry as any).secondHalf) ? (
                        <>
                          <div className="flex-1 bg-[#E6FFFA] border-b sm:border-b-0 sm:border-r border-[#01B574]/20" />
                          <div className="flex-1 bg-[#E6FFFA]" />
                        </>
                      ) : (
                        <>
                          <div
                            className={`flex-1 ${getStatusStyles((entry as any).firstHalf).bg}`}
                          />
                          <div
                            className={`flex-1 ${getStatusStyles((entry as any).secondHalf).bg}`}
                          />
                        </>
                      )}
                    </div>
                  ) : null}

                  <span
                    className={`text-sm font-bold text-black mb-3 flex items-center justify-center w-6 h-6 rounded-full z-10 transition-colors duration-300 ${
                      isToday
                        ? "bg-[#4318FF] text-white"
                        : "group-hover:bg-[#4318FF] group-hover:text-white"
                    } `}
                  >
                    {day}
                  </span>

                  {isBlocked && (
                    <div className="absolute top-2 right-2 z-10 transition-transform hover:scale-110">
                      <ShieldBan
                        size={14}
                        className="text-red-500 drop-shadow-sm"
                        strokeWidth={2.5}
                      />
                    </div>
                  )}

                  {/* Middle: Hours Display */}
                  <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                    {/* Split Day Badges - Show small badges when firstHalf and secondHalf differ */}
                    {isSplitDay && (
                      <div className="flex gap-1.5 w-full mb-1 px-1">
                        <div
                          className={`flex-1 py-1 rounded-md text-center text-[8px] font-bold uppercase shadow-sm ${getStatusStyles((entry as any).firstHalf).badge}`}
                        >
                          {getShortStatus((entry as any).firstHalf)}
                        </div>
                        <div
                          className={`flex-1 py-1 rounded-md text-center text-[8px] font-bold uppercase shadow-sm ${getStatusStyles((entry as any).secondHalf).badge}`}
                        >
                          {getShortStatus((entry as any).secondHalf)}
                        </div>
                      </div>
                    )}

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
                    className={`text-[10px] font-bold uppercase truncate w-full text-center px-1 py-1 rounded-md mt-1 backdrop-blur-sm z-10                         ${
                      holiday
                        ? "text-white bg-[#1890FF]/70"
                        : isSplitDay
                          ? isWorkLoc((entry as any).firstHalf) &&
                            isWorkLoc((entry as any).secondHalf)
                            ? "text-white bg-[#01B574]" // Green for Full Working split
                            : "text-white bg-[#FFB020]/80" // Orange for Half leave split
                          : entry?.status === "Full Day" && statusLabel
                            ? "text-white bg-[#01B574]"
                            : entry?.status === "Half Day" && statusLabel
                              ? "text-white bg-[#FFB020]/80"
                              : entry?.status === "Leave"
                                ? "text-white bg-red-400/70"
                                : entry?.workLocation === "Client Visit" ||
                                    entry?.status === "Client Visit" ||
                                    entry?.workLocation === "WFH" ||
                                    entry?.status === "WFH"
                                  ? "text-white bg-[#4318FF]/70"
                                  : isIncomplete && statusLabel
                                    ? "text-white bg-[#64748B]/90"
                                    : entry?.status === "Absent"
                                      ? "text-white bg-[#EE5D50]/70"
                                      : entry?.isWeekend
                                        ? "text-white bg-red-400/70"
                                        : "text-white bg-[#64748B]/90"
                    }
                    `}
                  >
                    {holiday
                      ? holiday.name
                      : isSplitDay
                        ? isWorkLoc((entry as any).firstHalf) &&
                          isWorkLoc((entry as any).secondHalf)
                          ? "FULL DAY"
                          : `${(isWorkLoc((entry as any).firstHalf) ? (entry as any).firstHalf : (entry as any).secondHalf)?.toUpperCase()} (HALF DAY)`
                        : (entry?.status as string) === "Leave"
                          ? "LEAVE"
                          : (entry?.status as string) === "Full Day"
                            ? `${(entry?.workLocation || "OFFICE")
                                .replace(/\(FULL DAY\)/i, "")
                                .trim()
                                .toUpperCase()} (FULL DAY)`
                            : entry?.workLocation &&
                                (entry?.status as string) !== "Leave" &&
                                (entry?.status as string) !== "Full Day"
                              ? entry.workLocation
                              : isIncomplete && !statusLabel
                                ? "Not Updated"
                                : statusLabel}
                  </div>

                  {isIncomplete && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center shadow-sm animate-pulse">
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
                className={`flex-1 px-4 py-3 text-xs font-bold text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 tracking-wide uppercase ${isDownloading ? "opacity-70 cursor-not-allowed" : ""}`}
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
