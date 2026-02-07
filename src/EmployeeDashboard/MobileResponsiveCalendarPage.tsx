import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Loader2,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { fetchMonthlyAttendance } from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { fetchBlockers } from "../reducers/timesheetBlocker.reducer";
import {
  generateMonthlyEntries,
  generateRangeEntries,
} from "../utils/attendanceUtils";
import { downloadPdf } from "../utils/downloadPdf";
import { UserType } from "../reducers/user.reducer";

interface MobileResponsiveCalendarPageProps {
  employeeId?: string;
  onNavigateToDate?: (timestamp: number) => void;
  onBlockedClick?: () => void;
}

const MobileResponsiveCalendarPage = ({
  employeeId: propEmployeeId,
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
      currentUser.role.toUpperCase().includes("MANAGER"));

  // @ts-ignore
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] },
  );
  const { blockers } = useAppSelector(
    (state: RootState) => state.timesheetBlocker || { blockers: [] },
  );

  const currentEmployeeId =
    propEmployeeId || entity?.employeeId || currentUser?.employeeId;
  const attendanceFetchedKey = useRef<string | null>(null);

  // Local State
  const [currentDate, setCurrentDate] = useState(new Date());
  const now = new Date(); // Real "today"

  // Download State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadDateRange, setDownloadDateRange] = useState({
    from: "",
    to: "",
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Fetch Data Logic
  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  useEffect(() => {
    if (!currentEmployeeId) return;

    const fetchKey = `${currentEmployeeId}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    if (attendanceFetchedKey.current === fetchKey) return;
    attendanceFetchedKey.current = fetchKey;

    dispatch(fetchBlockers(currentEmployeeId));
    dispatch(
      fetchMonthlyAttendance({
        employeeId: currentEmployeeId,
        month: (currentDate.getMonth() + 1).toString().padStart(2, "0"),
        year: currentDate.getFullYear().toString(),
      }),
    );
  }, [dispatch, currentEmployeeId, currentDate]);

  // 2. Calendar Logic (Grid Generation)
  const { monthDays, blanks, daysOfWeek, currentMonthName, entries } =
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

      return {
        monthDays: monthDaysArr,
        blanks: blanksArr,
        daysOfWeek: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
        currentMonthName: currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        entries: generatedEntries,
      };
    }, [currentDate, records]);

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
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split("T")[0];
    };

    setDownloadDateRange({ from: format(start), to: format(end) });
    setIsDownloadModalOpen(true);
  };

  const handleConfirmDownload = () => {
    if (!currentEmployeeId) return;

    try {
      setIsDownloading(true);
      const fromDateStr = downloadDateRange.from;
      const toDateStr = downloadDateRange.to;

      const filteredRecords = records.filter((record) => {
        const recordDate = new Date(record.workingDate)
          .toISOString()
          .split("T")[0];
        return recordDate >= fromDateStr && recordDate <= toDateStr;
      });

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

      downloadPdf({
        employeeName:
          entity?.fullName || currentUser?.aliasLoginName || "Employee",
        employeeId: currentEmployeeId,
        designation: entity?.designation,
        department: entity?.department,
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

  const checkIsBlocked = (day: number) => {
    return !!getBlocker(day);
  };

  const checkIsHoliday = (day: number) => {
    if (!holidays || holidays.length === 0) return null;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.find(
      (h: any) => h.holidayDate === dateStr || h.date === dateStr,
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header with Blue Gradient */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-100 via-blue-50 to-white border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[#1B2559]">
              Monthly Attendance Snapshot
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Monthly overview
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="p-2.5 bg-gradient-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
            title="Download Report"
          >
            <Download size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-2 bg-white/50 p-1 rounded-lg backdrop-blur-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white rounded-md text-[#2B3674]"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-[#2B3674] min-w-[100px] text-center">
            {currentMonthName}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={
              currentDate.getFullYear() > now.getFullYear() ||
              (currentDate.getFullYear() === now.getFullYear() &&
                currentDate.getMonth() >= now.getMonth())
            }
            className={`p-1 rounded-md text-[#2B3674] ${
              currentDate.getFullYear() > now.getFullYear() ||
              (currentDate.getFullYear() === now.getFullYear() &&
                currentDate.getMonth() >= now.getMonth())
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white"
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="p-3">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold text-gray-400"
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
            const isBlocked = checkIsBlocked(day);
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

            const isPendingUpdate =
              isPast &&
              !isBlocked &&
              !holiday &&
              !entry?.isWeekend &&
              (entry?.status === "Not Updated" || entry?.status === "Pending");

            // Determine color class
            let colorClass = "bg-white text-gray-600 border border-gray-200"; // Default / Future / Pending

            if (isToday) {
              colorClass =
                "bg-white ring-2 ring-[#4318FF] text-[#4318FF] border-transparent font-extrabold shadow-md";
            } else if (isBlocked) {
              colorClass =
                "bg-gray-200 border border-gray-400 text-gray-500 font-bold";
            } else if (
              entry?.status === "Full Day"
            ) {
              colorClass =
                "bg-green-100 border border-green-600 text-black font-bold";
            } else if (entry?.status === "Half Day" || isPendingUpdate) {
               // Both Half Day and Pending Update (visual only) can be Orange
               // BUT User wants Not Updated white/grey and Half Day Orange.
               // Re-read: "make hald day color orange same as not updated and nake not updated color same as upcong"
               // So Half Day = bg-orange-100 (matching old not updated)
               // And Not Updated = bg-white (matching current/upcoming)
               colorClass = entry?.status === "Half Day" 
                 ? "bg-orange-100 border border-orange-600 text-black font-bold" 
                 : "bg-white text-gray-600 border border-gray-200";
            } else if (entry?.status === "Leave") {
              colorClass =
                "bg-red-200 border border-red-600 text-black font-bold";
            } else if (holiday) {
              colorClass =
                "bg-blue-100 border border-blue-500 text-black font-bold";
            } else if (entry?.isWeekend) {
              colorClass =
                "bg-pink-100 border border-pink-400 text-black font-bold";
            }

            return (
              <div
                key={day}
                onClick={() => {
                  if (isBlocked && (isAdmin || isManager) && onBlockedClick) {
                    onBlockedClick();
                    return;
                  }
                  onNavigateToDate?.(day);
                }}
                className={`
                    aspect-[4/5] sm:aspect-square
                    rounded-xl relative
                    flex flex-col items-center justify-center
                    shadow-sm
                    ${(onNavigateToDate || (isBlocked && (isAdmin || isManager) && onBlockedClick)) ? "cursor-pointer transition-all active:scale-95" : ""}
                    ${colorClass}
                 `}
              >
                {isPendingUpdate && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 animate-bounce">
                    <div className="bg-white text-slate-400 rounded-full p-0.5 shadow-lg ring-2 ring-slate-100 border border-slate-200">
                      <AlertCircle size={12} strokeWidth={3} />
                    </div>
                  </div>
                )}
                <span className="text-sm sm:text-lg">{day}</span>
                {isBlocked && (
                  <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-1 text-center pointer-events-none">
                     <Lock size={12} className="text-white mb-0.5" />
                     <span className="text-[6px] font-black text-white leading-none uppercase tracking-tighter">
                       {(isAdmin || isManager) ? "Unblock" : `Contact ${getBlocker(day)?.blockedBy || "Admin"}`}
                     </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 mb-2">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {[
              {
                label: "Full Day",
                className: "bg-green-100 border border-green-600",
              },
              {
                label: "Half Day",
                className: "bg-orange-100 border border-orange-600",
              },
              { label: "Leave", className: "bg-red-200 border border-red-600" },
              {
                label: "Today",
                className: "bg-white border-2 border-[#4318FF]",
              },
              {
                label: "Holiday",
                className: "bg-blue-100 border border-blue-500",
              },
              {
                label: "Blocked",
                className: "bg-gray-200 border border-gray-400",
              },
              {
                label: "Pending Update",
                className: "bg-white border border-gray-300",
                icon: true,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div
                  className={`w-3 h-3 rounded-full flex items-center justify-center ${item.className}`}
                >
                  {item.icon && (
                    <span className="text-[10px] font-black text-slate-400 leading-none">
                      !
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {item.label}
                </span>
              </div>
            ))}
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

              <button
                disabled={
                  isDownloading ||
                  !downloadDateRange.from ||
                  !downloadDateRange.to
                }
                onClick={handleConfirmDownload}
                className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 mt-2
                  ${
                    isDownloading ||
                    !downloadDateRange.from ||
                    !downloadDateRange.to
                      ? "bg-gray-300 shadow-none cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4318FF] to-[#868CFF] shadow-blue-500/30 hover:shadow-blue-500/50"
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
