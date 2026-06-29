import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Calendar as CalendarIcon, Download, Loader2, X } from "lucide-react";
import { saveAs } from "file-saver";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { TimesheetEntry } from "../types";
import { AttendanceStatus, UserType } from "../enums";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import {
  downloadAttendancePdfReport,
  fetchMyTimesheet,
} from "../reducers/employeeAttendance.reducer";
import { generateMonthlyEntries, isEditableMonth } from "../utils/attendanceUtils";
import CalendarViewDesktop from "./CalendarView.desktop";
import CalendarViewMobile from "./CalendarView.mobile";
import {
  CALENDAR_DAYS_OF_WEEK,
  CalendarVariant,
  isRestrictedActivityHalf,
} from "./CalendarView.enums";
import "./CalendarView.css";

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
  hideBackButton?: boolean;
}

export interface CalendarViewRenderProps {
  now: Date;
  displayDate: Date;
  currentMonthName: string;
  daysOfWeek: string[];
  blanks: number[];
  monthDays: number[];
  entries: TimesheetEntry[];
  scrollable: boolean;
  isSmall: boolean;
  isSidebar: boolean;
  hideMonthNavigation: boolean;
  hideBackButton: boolean;
  canNavigateToNextMonth: boolean;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleDownload: () => void;
  handleBack: () => void;
  handleDayClick: (day: number, isBlocked: boolean) => void;
  checkIsHoliday: (year: number, month: number, day: number) => any;
  isDateBlocked: (date: Date) => boolean;
  getBlockedReason: (date: Date) => string | null;
}

const Calendar = ({
  now = new Date(),
  onNavigateToDate,
  variant = CalendarVariant.Large,
  currentDate,
  onMonthChange,
  entries: propEntries,
  employeeId: propEmployeeId,
  scrollable = true,
  viewOnly = false,
  onBlockedClick,
  hideMonthNavigation = false,
  hideBackButton = false,
}: CalendarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { records } = useAppSelector((state: RootState) => state.attendance);
  const { entity, entities } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state: RootState) => state.user);
  // @ts-ignore - Existing RootState typing does not include masterHolidays in some IDE states.
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] },
  );
  const { blockers } = useAppSelector(
    (state: RootState) => state.timesheetBlocker,
  );

  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const isManager =
    currentUser?.userType === UserType.MANAGER ||
    (currentUser?.role &&
      currentUser.role.toUpperCase().includes(UserType.MANAGER));
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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [internalDisplayDate, setInternalDisplayDate] = useState(now);
  const [downloadDateRange, setDownloadDateRange] = useState({ from: "", to: "" });
  const [isDownloading, setIsDownloading] = useState(false);
  const displayDate = currentDate || internalDisplayDate;

  const canNavigateToNextMonth = useMemo(() => true, []);

  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  useEffect(() => {
    if (!currentEmployeeId || (isAdmin && currentEmployeeId.toLowerCase() === "admin")) return;
    if (propEntries) return;

    const fetchKey = `${currentEmployeeId}-${displayDate.getMonth() + 1}-${displayDate.getFullYear()}`;
    if (attendanceFetchedKey.current === fetchKey) return;
    attendanceFetchedKey.current = fetchKey;

    dispatch(
      fetchMyTimesheet({
        employeeId: currentEmployeeId,
        month: (displayDate.getMonth() + 1).toString().padStart(2, "0"),
        year: displayDate.getFullYear().toString(),
      }),
    );
  }, [dispatch, currentEmployeeId, displayDate, propEntries, isAdmin]);

  const entries = useMemo(() => {
    if (propEntries) return propEntries;
    return generateMonthlyEntries(displayDate, now, records);
  }, [displayDate, now, records, propEntries]);

  const handlePrevMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1);
    if (onMonthChange) onMonthChange(newDate);
    else setInternalDisplayDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1);
    if (onMonthChange) onMonthChange(newDate);
    else setInternalDisplayDate(newDate);
  };

  const handleDownload = () => {
    const start = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
    const end = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);
    setDownloadDateRange({
      from: dayjs(start).format("YYYY-MM-DD"),
      to: dayjs(end).format("YYYY-MM-DD"),
    });
    setIsDownloadModalOpen(true);
  };

  const handleConfirmDownload = async () => {
    if (!currentEmployeeId) return;

    let downloadEntity = entity;
    if (currentEmployeeId && entity?.employeeId !== currentEmployeeId) {
      const found = entities?.find((e: any) => e.employeeId === currentEmployeeId);
      if (found) downloadEntity = found;
    }

    if (!downloadEntity) {
      console.warn("Could not find employee details for PDF");
    }

    try {
      setIsDownloading(true);
      const month = parseInt(downloadDateRange.from.split("-")[1]);
      const year = parseInt(downloadDateRange.from.split("-")[0]);
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

    if (!isAdmin && !isManager && !isEditableMonth(d)) return true;

    const isManualBlocked = blockers.some((blocker) => {
      const start = new Date(blocker.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(blocker.blockedTo);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
    if (isManualBlocked) return true;

    if (!isAdmin && !isManager) {
      const dateStr = dayjs(d).format("YYYY-MM-DD");
      const entry = records.find((record) => {
        const recordDate = new Date(record.workingDate);
        return dayjs(recordDate).format("YYYY-MM-DD") === dateStr;
      });

      if (entry) {
        const h1 = (entry.firstHalf || "").toLowerCase();
        const h2 = (entry.secondHalf || "").toLowerCase();
        const status = (entry.status || "").toLowerCase();
        if (status.includes("leave")) return true;
        if (isRestrictedActivityHalf(h1) || isRestrictedActivityHalf(h2)) return true;
      }
    }

    return false;
  };

  const getBlocker = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return blockers.find((blocker) => {
      const start = new Date(blocker.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(blocker.blockedTo);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  const getBlockedReason = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (!isAdmin && !isManager && !isEditableMonth(d)) return "Month is Locked";

    const blocker = getBlocker(date);
    if (blocker) return blocker.reason || "Admin Blocked";

    if (!isAdmin && !isManager) {
      const dateStr = dayjs(d).format("YYYY-MM-DD");
      const entry = records.find((record) => {
        const recordDate = new Date(record.workingDate);
        return dayjs(recordDate).format("YYYY-MM-DD") === dateStr;
      });

      if (entry) {
        const h1 = entry.firstHalf || "";
        const h2 = entry.secondHalf || "";
        if (isRestrictedActivityHalf(h1) || isRestrictedActivityHalf(h2)) {
          return "Restricted Activity (Leave/WFH)";
        }
      }
    }

    return null;
  };

  const checkIsHoliday = (year: number, month: number, day: number) => {
    if (!holidays || holidays.length === 0) return null;
    const dateStr = dayjs(new Date(year, month, day)).format("YYYY-MM-DD");
    return holidays.find((holiday: any) => holiday.holidayDate === dateStr || holiday.date === dateStr);
  };

  const handleBack = () => {
    const path = location.pathname;
    if (path.includes("/manager-dashboard")) {
      if (path.includes("/timesheet/") || path.includes("/working-details/")) {
        navigate("/manager-dashboard/timesheet-list");
      } else if (path.includes("/employee-details/") || path.includes("/view-attendance/")) {
        navigate("/manager-dashboard/employees");
      } else {
        navigate("/manager-dashboard/my-dashboard");
      }
    } else if (path.includes("/admin-dashboard")) {
      if (path.includes("/timesheet/") || path.includes("/working-details/")) {
        navigate("/admin-dashboard/timesheet-list");
      } else if (path.includes("/employee-details/") || path.includes("/view-attendance/")) {
        navigate("/admin-dashboard/employees");
      } else {
        navigate("/admin-dashboard");
      }
    } else {
      navigate("/employee-dashboard");
    }
  };

  const handleDayClick = (day: number, isBlocked: boolean) => {
    if (isBlocked && (isAdmin || isManager) && onBlockedClick) {
      onBlockedClick();
      return;
    }

    const targetDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    const timestamp = targetDate.getTime();

    if (onNavigateToDate) {
      onNavigateToDate(timestamp);
      return;
    }

    const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
    const isPrivilegedUser =
      currentUser?.userType === UserType.ADMIN ||
      currentUser?.userType === UserType.MANAGER ||
      currentUser?.userType === UserType.TEAMLEAD;
    const isSelfView = currentEmployeeId === currentUser?.employeeId;
    const isViewAttendance = location.pathname.includes("/view-attendance/");

    if (
      isPrivilegedUser &&
      (isSelfView || isViewAttendance) &&
      (location.pathname.startsWith("/manager-dashboard") ||
        location.pathname.startsWith("/admin-dashboard"))
    ) {
      return;
    }

    if (
      viewOnly &&
      isPrivilegedUser &&
      currentEmployeeId &&
      currentEmployeeId !== currentUser?.employeeId
    ) {
      const basePath = location.pathname.startsWith("/manager-dashboard")
        ? "/manager-dashboard"
        : "/admin-dashboard";
      navigate(`${basePath}/timesheet/${currentEmployeeId}/${dateStr}`, {
        state: { selectedDate: dateStr, timestamp: Date.now() },
      });
      return;
    }

    const basePath = location.pathname.startsWith("/manager-dashboard")
      ? "/manager-dashboard"
      : location.pathname.startsWith("/admin-dashboard")
        ? "/admin-dashboard"
        : "/employee-dashboard";

    navigate(`${basePath}/my-timesheet`, {
      state: { selectedDate: dateStr, timestamp: Date.now() },
    });
  };

  const isSmall = variant === CalendarVariant.Small;
  const isSidebar = variant === CalendarVariant.Sidebar;
  const currentMonthName = displayDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const firstDayIndex = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();

  const viewProps: CalendarViewRenderProps = {
    now,
    displayDate,
    currentMonthName,
    daysOfWeek: CALENDAR_DAYS_OF_WEEK,
    blanks: Array.from({ length: firstDayIndex }, (_, i) => i),
    monthDays: Array.from({ length: daysInMonth }, (_, i) => i + 1),
    entries,
    scrollable,
    isSmall,
    isSidebar,
    hideMonthNavigation,
    hideBackButton,
    canNavigateToNextMonth,
    handlePrevMonth,
    handleNextMonth,
    handleDownload,
    handleBack,
    handleDayClick,
    checkIsHoliday,
    isDateBlocked,
    getBlockedReason,
  };

  return (
    <>
      {isSmall || isSidebar ? (
        <CalendarViewMobile {...viewProps} />
      ) : (
        <CalendarViewDesktop {...viewProps} />
      )}

      {isDownloadModalOpen && (
        <div className="calendar-view__modal fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                    onChange={(event) => {
                      const newFrom = event.target.value;
                      setDownloadDateRange({
                        ...downloadDateRange,
                        from: newFrom,
                        to:
                          downloadDateRange.to && newFrom && downloadDateRange.to < newFrom
                            ? newFrom
                            : downloadDateRange.to,
                      });
                    }}
                    className="w-full pl-4 pr-12 py-3 bg-[#F4F7FE] border-transparent rounded-xl text-[#2B3674] font-bold focus:outline-none focus:ring-2 focus:ring-[#4318FF] transition-all cursor-pointer"
                  />
                  <CalendarIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none" />
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
                    onChange={(event) =>
                      setDownloadDateRange({
                        ...downloadDateRange,
                        to: event.target.value,
                      })
                    }
                    className="w-full pl-4 pr-12 py-3 bg-[#F4F7FE] border-transparent rounded-xl text-[#2B3674] font-bold focus:outline-none focus:ring-2 focus:ring-[#4318FF] transition-all cursor-pointer"
                  />
                  <CalendarIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none" />
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
                className={`flex-1 px-4 py-3 text-xs font-bold text-white bg-[#4318FF] rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 tracking-wide uppercase ${isDownloading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isDownloading ? "Fetching..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Calendar;
