import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { TimesheetEntry } from "../types";
import { useAppDispatch, useAppSelector } from "../hooks";
import { UserType } from "../reducers/user.reducer";
import {
  updateAttendanceRecord,
  submitBulkAttendance,
  AttendanceStatus,
  fetchMonthlyAttendance,
  createAttendanceRecord,
} from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import {
  generateMonthlyEntries,
  isEditableMonth,
} from "../utils/attendanceUtils";

interface TimesheetProps {
  now?: Date;
  employeeId?: string;
  readOnly?: boolean;
  selectedDateId?: number | null;
}

const MyTimesheet = ({
  now: propNow,
  employeeId: propEmployeeId,
  readOnly = false,
  selectedDateId: propSelectedDateId,
}: TimesheetProps) => {
  const location = useLocation();
  const navState = location.state as {
    selectedDate?: string;
    timestamp?: number;
  } | null;
  const dispatch = useAppDispatch();

  const { records, loading } = useAppSelector((state) => state.attendance);
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  // @ts-ignore
  const { holidays } = useAppSelector(
    (state) => (state as any).masterHolidays || { holidays: [] }
  );

  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const currentEmployeeId = propEmployeeId || entity?.employeeId;

  // 1. viewMonth/now state
  const [now, setNow] = useState<Date>(() => {
    if (propNow) return propNow;
    if (navState?.selectedDate) return new Date(navState.selectedDate);
    return new Date();
  });

  // 2. Highlighting state
  const [selectedDateId, setSelectedDateId] = useState<number | null>(() => {
    return propSelectedDateId || navState?.timestamp || null;
  });
  const [isHighlighted, setIsHighlighted] = useState(false);

  // 3. View/Input state
  const [localEntries, setLocalEntries] = useState<TimesheetEntry[]>([]);
  const [localInputValues, setLocalInputValues] = useState<
    Record<number, string>
  >({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "success" });

  const holidaysFetched = useRef(false);
  const lastAttendanceKey = useRef<string | null>(null);
  const today = useMemo(() => new Date(), []);

  // Fetch holidays on mount
  useEffect(() => {
    if (holidaysFetched.current) return;
    holidaysFetched.current = true;
    dispatch(fetchHolidays());
  }, [dispatch]);

  // Fetch attendance when month/employee changes
  useEffect(() => {
    if (!currentEmployeeId) return;
    const fetchKey = `${currentEmployeeId}-${
      now.getMonth() + 1
    }-${now.getFullYear()}`;
    if (lastAttendanceKey.current === fetchKey) return;
    lastAttendanceKey.current = fetchKey;

    dispatch(
      fetchMonthlyAttendance({
        employeeId: currentEmployeeId,
        month: (now.getMonth() + 1).toString().padStart(2, "0"),
        year: now.getFullYear().toString(),
      })
    );
  }, [dispatch, currentEmployeeId, now]);

  // Sync state with props/nav
  useEffect(() => {
    if (propNow) {
      const hasMonthChanged =
        propNow.getMonth() !== now.getMonth() ||
        propNow.getFullYear() !== now.getFullYear();
      if (hasMonthChanged) setNow(propNow);
    } else if (navState?.selectedDate) {
      const navDate = new Date(navState.selectedDate);
      const hasMonthChanged =
        navDate.getMonth() !== now.getMonth() ||
        navDate.getFullYear() !== now.getFullYear();
      if (hasMonthChanged) setNow(navDate);
    }
  }, [propNow, navState?.selectedDate]);

  useEffect(() => {
    const targetId = propSelectedDateId || navState?.timestamp;
    if (targetId && targetId !== selectedDateId) {
      setSelectedDateId(targetId);
    }
  }, [propSelectedDateId, navState?.timestamp]);

  // Highlight Timer
  useEffect(() => {
    if (selectedDateId) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
        setSelectedDateId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedDateId]);

  // Toast Timer
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(
        () => setToast((prev) => ({ ...prev, show: false })),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Transform records to local state
  const baseEntries = useMemo(() => {
    return generateMonthlyEntries(now, today, records);
  }, [now, today, records]);

  useEffect(() => {
    setLocalEntries(baseEntries);
  }, [baseEntries]);

  // Handlers
  const handlePrevMonth = () => {
    const prev = new Date(now);
    prev.setMonth(prev.getMonth() - 1);
    setNow(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    if (isAdmin || next <= new Date()) setNow(next);
  };

  const canGoNextMonth = () => {
    if (isAdmin) return true;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentRealMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return nextMonth <= currentRealMonth;
  };

  const handleHoursInput = (entryIndex: number, val: string) => {
    if (!/^\d*\.?\d*$/.test(val)) return;
    setLocalInputValues((prev) => ({ ...prev, [entryIndex]: val }));

    const num = parseFloat(val);
    const hours = isNaN(num) ? 0 : num;

    let newStatus = localEntries[entryIndex].status;

    if (hours > 0) {
      newStatus =
        hours > 6 ? AttendanceStatus.FULL_DAY : AttendanceStatus.HALF_DAY;
    } else {
      const entryDate = new Date(localEntries[entryIndex].fullDate);
      const dateStrLocal = `${entryDate.getFullYear()}-${String(
        entryDate.getMonth() + 1
      ).padStart(2, "0")}-${String(entryDate.getDate()).padStart(2, "0")}`;

      const holiday = holidays?.find((h: any) => {
        const hDate = h.holidayDate || h.date;
        if (!hDate) return false;
        const normalizedHDate =
          typeof hDate === "string"
            ? hDate.split("T")[0]
            : new Date(hDate).toISOString().split("T")[0];
        return normalizedHDate === dateStrLocal;
      });

      const dayNum = entryDate.getDay();
      if (holiday) newStatus = "Holiday" as any;
      else if (dayNum === 0 || dayNum === 6) newStatus = "Weekend" as any;
      else newStatus = AttendanceStatus.PENDING;
    }

    const updated = [...localEntries];
    updated[entryIndex] = {
      ...updated[entryIndex],
      totalHours: hours,
      status: newStatus,
    };
    setLocalEntries(updated);
  };

  const handleInputBlur = (entryIndex: number) => {
    setLocalInputValues((prev) => {
      const next = { ...prev };
      delete next[entryIndex];
      return next;
    });
  };

  const handleToggleBlock = (entryIndex: number) => {
    if (!isAdmin) return;
    const updated = [...localEntries];
    const currentStatus = updated[entryIndex].status;

    if (currentStatus === AttendanceStatus.BLOCKED) {
      const hours = updated[entryIndex].totalHours || 0;
      updated[entryIndex].status =
        hours > 6
          ? AttendanceStatus.FULL_DAY
          : hours > 0
          ? AttendanceStatus.HALF_DAY
          : AttendanceStatus.PENDING;
    } else {
      updated[entryIndex].status = AttendanceStatus.BLOCKED;
    }
    setLocalEntries(updated);
    setTimeout(() => onSaveAll(), 100);
  };

  const onSaveAll = async () => {
    const payload: any[] = [];
    localEntries.forEach((entry, idx) => {
      const currentTotal = entry.totalHours || 0;
      const originalTotal = baseEntries[idx]?.totalHours || 0;
      const currentStatus = entry.status;
      const originalStatus = baseEntries[idx]?.status;

      if (currentTotal !== originalTotal || currentStatus !== originalStatus) {
        const d = entry.fullDate;
        const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        let derivedStatus = entry.status || AttendanceStatus.PENDING;

        if (
          derivedStatus === AttendanceStatus.PENDING ||
          derivedStatus === "Not Updated"
        ) {
          if (currentTotal > 6) derivedStatus = AttendanceStatus.FULL_DAY;
          else if (currentTotal > 0) derivedStatus = AttendanceStatus.HALF_DAY;
        }

        const existingRecord = records.find((r) => {
          const rDate =
            typeof r.workingDate === "string"
              ? r.workingDate.split("T")[0]
              : (r.workingDate as Date).toISOString().split("T")[0];
          return rDate === workingDate;
        });
        payload.push({
          id: existingRecord?.id,
          employeeId: currentEmployeeId,
          workingDate,
          totalHours: currentTotal,
          status: derivedStatus,
        });
      }
    });

    if (payload.length === 0) {
      setToast({ show: true, message: "No changes to save", type: "success" });
      return;
    }

    try {
      await dispatch(submitBulkAttendance(payload)).unwrap();
      dispatch(
        fetchMonthlyAttendance({
          employeeId: currentEmployeeId,
          month: (now.getMonth() + 1).toString().padStart(2, "0"),
          year: now.getFullYear().toString(),
        })
      );
      setToast({
        show: true,
        message: "Data Saved Successfully",
        type: "success",
      });
    } catch (error: any) {
      console.warn("Bulk API failed, attempting sequential fallback...", error);
      let successCount = 0;
      for (const item of payload) {
        try {
          if (item.id) {
            await dispatch(
              updateAttendanceRecord({
                id: item.id,
                data: { totalHours: item.totalHours, status: item.status },
              })
            ).unwrap();
          } else {
            await dispatch(
              createAttendanceRecord({
                employeeId: item.employeeId,
                workingDate: item.workingDate,
                totalHours: item.totalHours,
                status: item.status,
              })
            ).unwrap();
          }
          successCount++;
        } catch (innerError) {
          console.error("Failed to save record:", item, innerError);
        }
      }
      if (successCount > 0) {
        dispatch(
          fetchMonthlyAttendance({
            employeeId: currentEmployeeId,
            month: (now.getMonth() + 1).toString().padStart(2, "0"),
            year: now.getFullYear().toString(),
          })
        );
        setToast({ show: true, message: "Data Saved", type: "success" });
      } else {
        setToast({
          show: true,
          message: "Failed to save records.",
          type: "error",
        });
      }
    }
  };

  // Calculations for Grid
  const monthTotalHours = localEntries.reduce(
    (acc, entry) => acc + (entry.totalHours || 0),
    0
  );
  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getDay();
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-[#F4F7FE] p-2 md:px-6 md:pt-4 md:pb-0 relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#4318FF]"></div>
        </div>
      )}
      {toast.show && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 px-4 py-2 bg-white rounded-full shadow-2xl border border-gray-100">
          {toast.type === "success" ? (
            <div className="p-1 bg-green-100 rounded-full">
              <Save size={14} className="text-green-600" />
            </div>
          ) : (
            <div className="p-1 bg-red-100 rounded-full">
              <AlertCircle size={14} className="text-red-600" />
            </div>
          )}
          <span
            className={`font-bold text-sm ${
              toast.type === "success" ? "text-green-700" : "text-red-600"
            }`}
          >
            {toast.message}
          </span>
        </div>
      )}

      {/* Main Card Container */}
      <div className="flex-1 bg-white rounded-[20px] p-4 shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 overflow-hidden mt-1 flex flex-col">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#F4F7FE] rounded-xl p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#4318FF]"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <p className="text-sm font-bold text-[#2B3674] min-w-[120px] text-center px-2">
                {now.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={handleNextMonth}
                disabled={!canGoNextMonth()}
                className={`p-1.5 rounded-lg transition-all ${
                  !canGoNextMonth()
                    ? "text-gray-300 cursor-not-allowed"
                    : "hover:bg-white hover:shadow-sm text-[#A3AED0] hover:text-[#4318FF]"
                }`}
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest leading-none mb-1">
                Total Hours
              </p>
              <div className="flex items-baseline justify-end gap-1">
                <p className="text-2xl font-black text-[#4318FF] leading-none">
                  {monthTotalHours.toFixed(1)}
                </p>
                <span className="text-xs font-bold text-[#A3AED0]">hrs</span>
              </div>
            </div>
            {(!readOnly || isAdmin) && (
              <button
                onClick={onSaveAll}
                className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-0.5 active:scale-95 tracking-wide uppercase"
              >
                <Save size={16} /> Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-3 mb-2 px-2 border-b border-gray-50 pb-3">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-black text-[#A3AED0] tracking-[0.2em] uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3 overflow-y-auto max-h-full pr-1 pb-4 px-2 scroll-smooth flex-1 custom-scrollbar">
          {Array.from({ length: paddingDays }).map((_, idx) => (
            <div
              key={`p-${idx}`}
              className="min-h-[90px] rounded-2xl bg-gray-50/30 border border-dashed border-gray-100"
            ></div>
          ))}
          {localEntries.map((day, idx) => {
            const displayVal = day.totalHours || 0;
            const inputValue =
              localInputValues[idx] !== undefined
                ? localInputValues[idx]
                : displayVal === 0
                ? ""
                : displayVal.toString();
            const dateStr = `${day.fullDate.getFullYear()}-${String(
              day.fullDate.getMonth() + 1
            ).padStart(2, "0")}-${String(day.fullDate.getDate()).padStart(
              2,
              "0"
            )}`;

            const holiday = holidays?.find((h: any) => {
              const hDate = h.holidayDate || h.date;
              if (!hDate) return false;
              const normalizedHDate =
                typeof hDate === "string"
                  ? hDate.split("T")[0]
                  : new Date(hDate).toISOString().split("T")[0];
              return normalizedHDate === dateStr;
            });

            const isRed = day.isWeekend && !day.status; // Only weekends without status are red, not holidays
            const isSelected =
              selectedDateId &&
              new Date(selectedDateId).toDateString() ===
                day.fullDate.toDateString();
            const highlightClass =
              isSelected && isHighlighted
                ? "date-highlight ring-4 ring-[#4318FF]/20 z-10 scale-[1.02]"
                : "";

            const isBlocked = day.status === AttendanceStatus.BLOCKED;
            const isEditable =
              (!readOnly || isAdmin) &&
              isEditableMonth(day.fullDate) &&
              !isBlocked;

            let bg = "bg-white hover:border-[#4318FF]/20";
            let badge = "bg-gray-50 text-gray-400";
            let border = "border-transparent";
            let shadow = "shadow-[0px_2px_15px_rgba(0,0,0,0.02)]";

            if (
              (day.status === "Full Day" || day.status === "WFH") &&
              displayVal !== 0 &&
              displayVal !== ""
            ) {
              bg = "bg-[#E6FDF4]/60";
              badge = "bg-[#05CD99] text-white font-bold";
              border = "border-[#05CD99]/20";
            } else if (day.status === "Client Visit") {
              bg = "bg-[#F4F7FE]";
              badge = "bg-[#4318FF] text-white font-bold";
              border = "border-[#4318FF]/20";
            } else if (holiday || day.status === "Holiday") {
              // Government holidays from database or status - Light Blue
              bg = "bg-[#E6F7FF]/60";
              badge = "bg-[#1890FF] text-white font-bold";
              border = "border-[#1890FF]/20";
            } else if (
              isRed ||
              day.status === "Leave" ||
              day.status === "Weekend"
            ) {
              // Leave and Weekend - Red
              bg = "bg-[#FFF5F5]/60";
              badge = "bg-[#EE5D50] text-white font-bold";
              border = "border-[#EE5D50]/10";
            } else if (
              day.status === "Half Day" &&
              displayVal !== 0 &&
              displayVal !== ""
            ) {
              bg = "bg-[#FFFBEB]/60";
              badge = "bg-[#FFB020] text-white font-bold";
              border = "border-[#FFB020]/20";
            } else if (
              day.status === "Pending" &&
              displayVal !== 0 &&
              displayVal !== ""
            ) {
              bg = "bg-[#FFFBEB]/60";
              badge = "bg-[#FFB020] text-white font-bold";
              border = "border-[#FFB020]/20";
            } else if (day.isToday) {
              bg = "bg-white";
              border = "border-[#4318FF]";
              shadow = "shadow-[0px_4px_20px_rgba(67,24,255,0.15)]";
            }

            return (
              <div
                key={idx}
                className={`relative flex flex-col justify-between p-1.5 rounded-2xl border transition-all duration-300 min-h-[120px] group 
                            ${border} ${shadow} ${highlightClass} ${bg} ${
                  isBlocked
                    ? "opacity-60 grayscale"
                    : "hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                {/* Top Row: Date & Lock */}
                <div className="flex justify-between items-start z-10 mb-1">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-colors
                      ${
                        day.isToday
                          ? "bg-[#4318FF] text-white shadow-lg shadow-blue-500/30"
                          : "bg-white/50 text-[#2B3674] group-hover:bg-[#4318FF] group-hover:text-white"
                      }
                  `}
                  >
                    {day.date}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleBlock(idx)}
                      className={`p-1 rounded-full shadow-sm border transition-all ${
                        isBlocked
                          ? "bg-red-50 text-red-500 border-red-100"
                          : "bg-white/80 text-gray-300 hover:text-[#4318FF] border-gray-100 hover:border-blue-200"
                      }`}
                    >
                      {isBlocked ? (
                        <Lock size={8} strokeWidth={3} />
                      ) : (
                        <Unlock size={8} strokeWidth={3} />
                      )}
                    </button>
                  )}
                </div>

                {/* Middle: Input Area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 z-10 py-1 min-h-[50px]">
                  <div className="relative group/input w-full flex justify-center">
                    <input
                      type="text"
                      disabled={!isEditable}
                      className={`w-full h-8 text-center text-xl font-bold bg-transparent transition-all focus:outline-none focus:ring-0
                        ${
                          !isEditable
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#2B3674] group-hover:scale-110 focus:scale-110"
                        }`}
                      placeholder={isBlocked ? "-" : "0"}
                      value={inputValue}
                      onChange={(e) => handleHoursInput(idx, e.target.value)}
                      onBlur={() => handleInputBlur(idx)}
                    />
                    {isEditable && (
                      <div className="absolute bottom-0.5 w-6 h-0.5 bg-[#4318FF]/20 rounded-full group-hover/input:bg-[#4318FF] transition-colors"></div>
                    )}
                  </div>
                  <span className="text-[9px] text-[#A3AED0] font-semibold uppercase tracking-wider">
                    hours
                  </span>
                </div>

                {/* Bottom: Status Badge */}
                <div
                  className={`w-full py-1.5 rounded-lg text-center text-[8px] font-black uppercase tracking-wider truncate px-1 shadow-sm z-10 mt-auto ${badge}`}
                >
                  {day.status === "Holiday" || holiday
                    ? holiday?.holidayName || holiday?.name || "HOLIDAY"
                    : isBlocked
                    ? "BLOCKED"
                    : day.status === "Weekend" || day.isWeekend
                    ? "WEEKEND"
                    : ((displayVal === 0 || !displayVal) &&
                        (day.status === "Half Day" ||
                          day.status === "Full Day")) ||
                      (day.isToday && !day.status)
                    ? ""
                    : day.status === "Not Updated"
                    ? ""
                    : day.status || "UPCOMING"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyTimesheet;
