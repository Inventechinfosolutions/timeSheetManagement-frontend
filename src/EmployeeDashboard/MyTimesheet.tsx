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
import { TimesheetEntry, UserType } from "../types";
import { useAppDispatch, useAppSelector } from "../hooks";
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

    if (
      currentStatus === AttendanceStatus.BLOCKED ||
      currentStatus === "Blocked"
    ) {
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
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-[#F4F7FE] p-2 md:px-4 md:pt-1 md:pb-0 relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A3C4]"></div>
        </div>
      )}
      {toast.show && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
          {toast.type === "success" ? (
            <Save
              size={16}
              className="text-[#00E676] drop-shadow-[0_0_8px_rgba(0,230,118,0.6)]"
            />
          ) : (
            <AlertCircle size={16} className="text-red-500" />
          )}
          <span
            className={`font-bold text-xs ${
              toast.type === "success" ? "text-[#00E676]" : "text-red-500"
            }`}
          >
            {toast.message}
          </span>
        </div>
      )}

      <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 overflow-hidden mt-1">
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[#F4F7FE] rounded-md transition-all text-[#A3AED0] hover:text-[#2B3674]"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-bold text-[#2B3674] min-w-[100px] text-center">
              {now.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
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

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold text-[#A3AED0] tracking-widest leading-none mb-0.5">
                Month Total
              </p>
              <p className="text-lg font-black text-[#00A3C4] leading-none">
                {monthTotalHours.toFixed(1)}{" "}
                <span className="text-[10px] font-bold text-[#A3AED0]">
                  hrs
                </span>
              </p>
            </div>
            {(!readOnly || isAdmin) && (
              <button
                onClick={onSaveAll}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-linear-to-r from-[#00E676] to-[#01B574] text-white rounded-full font-bold text-[11px] shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <Save size={14} /> Save
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5 border-b border-gray-50 pb-2">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-black text-[#A3AED0] tracking-widest"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
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

            const isRed = (day.isWeekend && !day.status) || !!holiday;
            const isSelected =
              selectedDateId &&
              new Date(selectedDateId).toDateString() ===
                day.fullDate.toDateString();
            const highlightClass =
              isSelected && isHighlighted
                ? "date-highlight ring-2 ring-offset-2 ring-[#00A3C4] shadow-lg scale-105"
                : "";

            const isBlocked =
              day.status === AttendanceStatus.BLOCKED ||
              day.status === "Blocked";
            const isEditable =
              (!readOnly || isAdmin) &&
              isEditableMonth(day.fullDate) &&
              !isBlocked;

            let bg = "bg-white";
            let badge = "bg-gray-100 text-gray-400";
            if (
              day.status === "Full Day" ||
              day.status === "WFH" ||
              day.status === "Client Visit"
            ) {
              bg = "bg-[#E9FBF5]/50";
              badge = "bg-[#E9FBF5] text-[#01B574]";
            } else if (
              isRed ||
              day.status === "Leave" ||
              day.status === "Holiday" ||
              day.status === "Weekend"
            ) {
              bg = "bg-[#FDF2F2]/50";
              badge = "bg-[#FDF2F2] text-[#ff4d4d]";
            } else if (
              day.status === "Half Day" ||
              day.status === "Pending" ||
              day.status === "Not Updated"
            ) {
              bg = "bg-[#FFF9E5]/50";
              badge = "bg-[#FFF9E5] text-[#FFB020]";
            } else if (day.isToday) bg = "bg-[#F4F7FE]";

            return (
              <div
                key={idx}
                className={`relative flex flex-col p-1.5 rounded-lg border transition-all h-20 group 
                            ${
                              day.isToday
                                ? "border-dashed border-[#00A3C4] shadow-md shadow-teal-100/30"
                                : "border-gray-100 shadow-sm hover:shadow-md"
                            } 
                            ${highlightClass} ${bg} ${
                  isBlocked ? "opacity-70" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm font-black ${
                      day.isToday ? "text-[#00A3C4]" : "text-[#2B3674]"
                    }`}
                  >
                    {day.date}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleBlock(idx)}
                      className={`p-1 rounded-full shadow-sm border transition-all ${
                        isBlocked
                          ? "bg-red-500 text-white border-red-600"
                          : "bg-white text-gray-300 hover:text-[#00A3C4]"
                      }`}
                    >
                      {isBlocked ? <Lock size={8} /> : <Unlock size={8} />}
                    </button>
                  )}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <input
                    type="text"
                    disabled={!isEditable}
                    className={`w-full max-w-[60px] h-7 text-center text-sm font-bold rounded-md border focus:outline-none focus:ring-2 focus:ring-[#00A3C4] ${
                      !isEditable
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                        : "bg-white text-[#2B3674] shadow-inner border-gray-100"
                    }`}
                    placeholder={isBlocked ? "Locked" : "0"}
                    value={inputValue}
                    onChange={(e) => handleHoursInput(idx, e.target.value)}
                    onBlur={() => handleInputBlur(idx)}
                  />
                </div>
                <div
                  className={`w-full py-0.5 rounded-md text-center text-[7.5px] font-black uppercase tracking-tight truncate ${badge}`}
                >
                  {day.status === "Holiday" || holiday
                    ? holiday?.holidayName || holiday?.name || "HOLIDAY"
                    : isBlocked
                    ? "ADMIN BLOCKED"
                    : day.status === "Weekend" || day.isWeekend
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
  );
};

export default MyTimesheet;
