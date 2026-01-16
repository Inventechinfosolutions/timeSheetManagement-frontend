import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Lock,
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
import { fetchBlockers } from "../reducers/timesheetBlocker.reducer";

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
  const { date } = useParams<{ date?: string }>();
  const dispatch = useAppDispatch();

  const { records, loading } = useAppSelector((state) => state.attendance);
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  // @ts-ignore
  const { holidays } = useAppSelector(
    (state) => (state as any).masterHolidays || { holidays: [] }
  );
  const { blockers } = useAppSelector((state) => state.timesheetBlocker);

  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const currentEmployeeId = propEmployeeId || entity?.employeeId || currentUser?.employeeId;

  // 1. viewMonth/now state
  const [now, setNow] = useState<Date>(() => {
    if (propNow) return propNow;
    if (date) return new Date(date);
    return new Date();
  });

  // 2. Highlighting state
  const [selectedDateId, setSelectedDateId] = useState<number | null>(() => {
    if (date) return new Date(date).getTime();
    return propSelectedDateId || null;
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

  // Sync state with props when they change (critical for Admin View)
  useEffect(() => {
    if (propNow) {
      const hasMonthChanged =
        propNow.getMonth() !== now.getMonth() ||
        propNow.getFullYear() !== now.getFullYear();
      if (hasMonthChanged) setNow(propNow);
    }
  }, [propNow]);

  useEffect(() => {
    if (propSelectedDateId && propSelectedDateId !== selectedDateId) {
      setSelectedDateId(propSelectedDateId);
    }
  }, [propSelectedDateId]);

  // Fetch holidays and blockers on mount
  useEffect(() => {
    if (holidaysFetched.current) return;
    holidaysFetched.current = true;
    dispatch(fetchHolidays());
    if (currentEmployeeId) {
      dispatch(fetchBlockers(currentEmployeeId));
    }
  }, [dispatch, currentEmployeeId]);

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

  // Transform records to local state
  const baseEntries = useMemo(() => {
    return generateMonthlyEntries(now, today, records);
  }, [now, today, records]);

  useEffect(() => {
    setLocalEntries(baseEntries);
  }, [baseEntries]);

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

  const isDateBlocked = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return blockers.some(b => {
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
    const blocker = blockers.find(b => {
      const start = new Date(b.blockedFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.blockedTo);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
    return blocker?.reason || "Admin Blocked";
  };

  // Handlers
  const handlePrevMonth = () => {
    const prev = new Date(now);
    prev.setMonth(prev.getMonth() - 1);
    setNow(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    if (next <= new Date()) setNow(next);
  };

  const canGoNextMonth = () => {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentRealMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return nextMonth <= currentRealMonth;
  };

  const handleHoursInput = (entryIndex: number, val: string) => {
    if (readOnly) return;
    if (isDateBlocked(localEntries[entryIndex].fullDate)) return;
    if (!/^\d*\.?\d*$/.test(val)) return;
    setLocalInputValues((prev) => ({ ...prev, [entryIndex]: val }));

    const num = parseFloat(val);
    const hours = isNaN(num) ? 0 : num;

    let newStatus: string = localEntries[entryIndex].status || "Not Updated";

    if (hours > 0) {
      newStatus = hours > 6 ? "Full Day" : "Half Day";
    } else {
      const entryDate = new Date(localEntries[entryIndex].fullDate);
      const dateStrLocal = `${entryDate.getFullYear()}-${String(
        entryDate.getMonth() + 1
      ).padStart(2, "0")}-${String(entryDate.getDate()).padStart(2, "0")}`;

      const isHoliday = holidays?.find((h: any) => {
        const hDate = h.holidayDate || h.date;
        if (!hDate) return false;
        const normalizedHDate =
          typeof hDate === "string"
            ? hDate.split("T")[0]
            : new Date(hDate).toISOString().split("T")[0];
        return normalizedHDate === dateStrLocal;
      });

      const dayNum = entryDate.getDay();

      if (isHoliday) {
        newStatus = "Holiday";
      } else if (dayNum === 0 || dayNum === 6) {
        newStatus = "Weekend";
      } else {
        newStatus = "Not Updated";
      }
    }

    const updated = [...localEntries];
    updated[entryIndex] = {
      ...updated[entryIndex],
      totalHours: hours,
      status: newStatus as any,
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

  const onSaveAll = async () => {
    if (readOnly) return;
    const payload: any[] = [];
    localEntries.forEach((entry, idx) => {
      if (isDateBlocked(entry.fullDate)) return;

      const currentTotal = entry.totalHours || 0;
      const originalTotal = baseEntries[idx]?.totalHours || 0;

      if (currentTotal !== originalTotal) {
        const d = entry.fullDate;
        const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        let derivedStatus = entry.status || "Pending";

        if (derivedStatus === "Pending" || derivedStatus === "Not Updated") {
          if (currentTotal > 6) derivedStatus = "Full Day";
          else if (currentTotal > 0) derivedStatus = "Half Day";
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
      setToast({ show: true, message: "Data Saved Successfully", type: "success" });
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
        setToast({ show: true, message: (error?.response?.data?.message || "Failed to save records."), type: "error" });
      }
    }
  };

  // Calculations
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
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-[#F4F7FE] p-2 md:px-4 md:pt-1 md:pb-0 relative">
      {toast.show && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 px-4 py-2 bg-white rounded-full shadow-2xl border border-gray-100">
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-4 duration-300 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-100">
          {toast.type === "success" ? (
            <Save size={16} className="text-[#00E676]" />
          ) : (
            <AlertCircle size={16} className="text-red-500" />
          )}
          <span
            className={`font-bold text-[10px] ${
              toast.type === "success" ? "text-[#00E676]" : "text-red-500"
            }`}
          >
            {toast.message}
          </span>
        </div>
      )}

      {/* Calendar Card */}
      <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 overflow-hidden mt-1 flex flex-col">
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[#F4F7FE] rounded-md transition-all text-[#A3AED0] hover:text-[#2B3674]"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-bold text-[#2B3674] min-w-[100px] text-center">
              {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <button
              onClick={handleNextMonth}
              disabled={!canGoNextMonth()}
              className={`p-1 rounded-md transition-all ${
                !canGoNextMonth()
                  ? "text-gray-200 cursor-not-allowed"
                  : "hover:bg-[#F4F7FE] text-[#A3AED0] hover:text-[#2B3674]"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold text-[#A3AED0] tracking-widest leading-none mb-0.5">
                Month Total
              </p>
              <p className="text-lg font-black text-[#00A3C4] leading-none">
                {monthTotalHours.toFixed(1)}{" "}
                <span className="text-[10px] font-bold text-[#A3AED0]">hrs</span>
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={onSaveAll}
                className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-0.5 active:scale-95 tracking-wide uppercase"
              >
                <Save size={16} /> Save Changes
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-[8px] font-black text-[#A3AED0] tracking-widest"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-7 gap-1.5 pb-2">
            {Array.from({ length: paddingDays }).map((_, idx) => (
              <div
                key={`p-${idx}`}
                className="h-20 rounded-lg bg-gray-50/20 border border-dashed border-gray-100"
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
              ).padStart(2, "0")}-${String(day.fullDate.getDate()).padStart(2, "0")}`;
              
              const holiday = holidays?.find((h: any) => {
                const hDate = h.holidayDate || h.date;
                if (!hDate) return false;
                const normalizedHDate =
                  typeof hDate === "string"
                    ? hDate.split("T")[0]
                    : new Date(hDate).toISOString().split("T")[0];
                return normalizedHDate === dateStr;
              });

              const isBlocked = isDateBlocked(day.fullDate);
              const blockedReason = isBlocked ? getBlockedReason(day.fullDate) : "";

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
              const isRed = (day.isWeekend && !day.status) || !!holiday;
              const isSelected =
                selectedDateId &&
                new Date(selectedDateId).toDateString() === day.fullDate.toDateString();
              const highlightClass = isSelected && isHighlighted ? "date-highlight" : "";

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
              let bg = "bg-white";
              let badge = "bg-gray-100 text-gray-400";
              
              if (isBlocked) {
                bg = "bg-gray-100/60 shadow-inner";
                badge = "bg-gray-200 text-gray-500";
              } else if (
                day.status === "Full Day" ||
                day.status === "WFH" ||
                day.status === "Client Visit"
              ) {
                bg = "bg-[#E9FBF5]/50";
                badge = "bg-[#E9FBF5] text-[#01B574]";
              } else if (
                day.status === "Half Day"
              ) {
                bg = "bg-[#FFF9E5]/50";
                badge = "bg-[#FFF9E5] text-[#FFB020]";
              } else if (
                isRed ||
                day.status === "Leave" ||
                day.status === "Holiday" ||
                day.status === "Weekend"
              ) {
                bg = "bg-[#FDF2F2]/50";
                badge = "bg-[#FDF2F2] text-[#ff4d4d]";
              } else if (
                day.status === "Pending" ||
                day.status === "Not Updated"
              ) {
                bg = "bg-[#FFF9E5]/50";
                badge = "bg-[#FFF9E5] text-[#FFB020]";
              } else if (day.isToday) {
                bg = "bg-[#F4F7FE]";
              }

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col p-1.5 rounded-lg border transition-all h-20 group 
                            ${
                              day.isToday
                                ? "border-dashed border-[#00A3C4] shadow-md shadow-teal-100/30"
                                : "border-gray-100 shadow-sm hover:shadow-md"
                            } 
                            ${
                              isSelected && isHighlighted
                                ? "ring-2 ring-offset-1 ring-[#00A3C4] border-[#00A3C4] shadow-lg scale-105 z-10 " +
                                  highlightClass
                                : ""
                            }
                            ${bg}`}
                   title={isBlocked ? `Timesheet locked by admin: ${blockedReason}` : ""}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-sm font-black ${
                        day.isToday ? "text-[#00A3C4]" : "text-[#2B3674]"
                      } ${isBlocked ? "opacity-50" : ""}`}
                    >
                      {day.date}
                    </span>
                    {day.isToday && !isBlocked && (
                      <span className="px-1 py-0.5 bg-[#00A3C4] text-white text-[6px] font-black rounded uppercase">
                        Today
                      </span>
                    )}
                    {isBlocked && (
                      <Lock size={12} className="text-[#A3AED0]" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <input
                      type="text"
                      disabled={readOnly || !isEditableMonth(day.fullDate) || isBlocked}
                      className={`w-full max-w-[60px] h-7 text-center text-sm font-bold rounded-md border focus:outline-none focus:ring-2 focus:ring-[#00A3C4] ${
                        readOnly || !isEditableMonth(day.fullDate) || isBlocked
                          ? "bg-gray-100/50 text-gray-400 cursor-not-allowed border-gray-100"
                          : "bg-white text-[#2B3674] shadow-inner"
                      }`}
                      placeholder="0"
                      value={inputValue}
                      onChange={(e) => handleHoursInput(idx, e.target.value)}
                      onBlur={() => handleInputBlur(idx)}
                    />
                  </div>
                  <div
                    className={`w-full py-0.5 rounded-md text-center text-[7.5px] font-black uppercase tracking-tight truncate ${badge}`}
                  >
                    {isBlocked 
                      ? "BLOCKED"
                      : day.status === "Full Day" || day.status === "Half Day" || day.status === "WFH" || day.status === "Client Visit"
                      ? day.status
                      : (day.status === "Holiday" || holiday)
                      ? holiday?.holidayName || holiday?.name || "HOLIDAY"
                      : (day.status === "Weekend" || day.isWeekend)
                      ? "WEEKEND"
                      : day.status === "Not Updated"
                      ? "Pending"
                      : day.status || "UPCOMING"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTimesheet;
