import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
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
  fetchMonthlyAttendance,
  createAttendanceRecord,
} from "../reducers/employeeAttendance.reducer";
import { getLeaveHistory } from "../reducers/leaveRequest.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import {
  generateMonthlyEntries,
  isEditableMonth,
} from "../utils/attendanceUtils";
import { fetchBlockers } from "../reducers/timesheetBlocker.reducer";
import MobileMyTimesheet from "./MobileMyTimesheet";

interface TimesheetProps {
  now?: Date;
  employeeId?: string;
  readOnly?: boolean;
  selectedDateId?: number | null;
  onBlockedClick?: () => void;
  containerClassName?: string;
}

const MyTimesheet = ({
  now: propNow,
  employeeId: propEmployeeId,
  readOnly = false,
  selectedDateId: propSelectedDateId,
  onBlockedClick,
  containerClassName,
}: TimesheetProps) => {
  const { date } = useParams<{ date?: string }>();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { records, loading } = useAppSelector((state) => state.attendance);
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  const { entities: leaveEntities = [] } = useAppSelector(
    (state) => (state as any).leaveRequest || {},
  );
  // @ts-ignore
  const { holidays } = useAppSelector(
    (state) => (state as any).masterHolidays || { holidays: [] },
  );
  const { blockers } = useAppSelector((state) => state.timesheetBlocker);

  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const currentEmployeeId =
    propEmployeeId ||
    entity?.employeeId ||
    (!isAdmin ? currentUser?.employeeId : undefined);

  const isAdminView = isAdmin && currentEmployeeId === "Admin";
  const effectiveReadOnly = readOnly || isAdminView;

  // 1. viewMonth/now state
  const [now, setNow] = useState<Date>(() => {
    if (propNow) return propNow;
    if (location.state?.selectedDate)
      return new Date(location.state.selectedDate);
    if (date) return new Date(date);
    return new Date();
  });

  // 2. Highlighting state
  const [selectedDateId, setSelectedDateId] = useState<number | null>(() => {
    if (location.state?.selectedDate)
      return new Date(location.state.selectedDate).getTime();
    if (date) return new Date(date).getTime();
    return propSelectedDateId || null;
  });
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [lastHighlightTrigger, setLastHighlightTrigger] = useState<
    number | null
  >(location.state?.timestamp || null);

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

  const [inputError, setInputError] = useState<{
    index: number;
    message: string;
  } | null>(null);

  const today = useMemo(() => new Date(), []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [shouldSetLastWeek, setShouldSetLastWeek] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const weeks = useMemo(() => {
    const w: { entry: TimesheetEntry; originalIndex: number }[][] = [];
    let currentWeek: { entry: TimesheetEntry; originalIndex: number }[] = [];

    localEntries.forEach((entry, idx) => {
      currentWeek.push({ entry, originalIndex: idx });
      // Break on Saturday (getDay() === 6)
      if (entry.fullDate.getDay() === 6) {
        if (currentWeek.length > 0) {
          w.push(currentWeek);
          currentWeek = [];
        }
      }
    });
    // Push remaining days if any (shouldn't happen with padding but safer)
    if (currentWeek.length > 0) w.push(currentWeek);
    return w;
  }, [localEntries]);

  const lastMonthRef = useRef<string>("");

  // Update currentWeekIndex when month changes or a date is selected from calendar
  useEffect(() => {
    const currentMonthKey = `${now.getMonth()}-${now.getFullYear()}`;
    const hasMonthChanged = lastMonthRef.current !== currentMonthKey;

    // Only proceed if month changed OR a specific date was explicitly selected/highlighted
    if (!hasMonthChanged && !selectedDateId) return;

    if (hasMonthChanged) {
      lastMonthRef.current = currentMonthKey;
      if (shouldSetLastWeek) {
        setCurrentWeekIndex(weeks.length - 1);
        setShouldSetLastWeek(false);
        return;
      }
    }

    // 2. Week selection logic (Triggered by month change OR selectedDateId change)
    const targetDate = selectedDateId
      ? new Date(selectedDateId)
      : now.getMonth() === today.getMonth() &&
          now.getFullYear() === today.getFullYear()
        ? today
        : null;

    if (targetDate && localEntries.length > 0) {
      const targetDay = targetDate.getDate();
      let weekIdx = 0;
      let found = false;
      for (let i = 0; i < localEntries.length; i++) {
        if (localEntries[i].date === targetDay) {
          setCurrentWeekIndex(weekIdx);
          found = true;
          break;
        }
        if (localEntries[i].fullDate.getDay() === 6) weekIdx++;
      }
      if (!found) setCurrentWeekIndex(0);
    }
  }, [now, selectedDateId, shouldSetLastWeek, weeks.length]);

  const handleNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    } else {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      if (next <= new Date()) {
        setNow(next);
        setCurrentWeekIndex(0);
      }
    }
  };

  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    } else {
      const prev = new Date(now);
      prev.setMonth(prev.getMonth() - 1);
      setNow(prev);
      setShouldSetLastWeek(true);
    }
  };
  const lastAttendanceKey = useRef<string | null>(null);

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
      setIsHighlighted(true);
    }
  }, [propSelectedDateId]);

  // Handle navigation highlight trigger
  useEffect(() => {
    if (selectedDateId) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 5000); // 5 seconds as requested
      return () => clearTimeout(timer);
    }
  }, [selectedDateId]);

  // Handle navigation state updates
  useEffect(() => {
    if (location.state?.selectedDate) {
      const targetDate = new Date(location.state.selectedDate);
      setNow(targetDate);
      setSelectedDateId(targetDate.getTime());

      // If timestamp is different, it's a new click/navigation event
      if (
        location.state.timestamp &&
        location.state.timestamp !== lastHighlightTrigger
      ) {
        setLastHighlightTrigger(location.state.timestamp);
        setIsHighlighted(false);
        // Minimal delay to ensure React picks up the state change for animation reset
        setTimeout(() => setIsHighlighted(true), 50);
      }
    }
  }, [location.state, lastHighlightTrigger]);

  // Fetch holidays on mount
  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  // Fetch attendance and blockers when month/employee changes
  useEffect(() => {
    if (
      !currentEmployeeId ||
      (isAdmin && currentEmployeeId === "Admin")
    )
      return;

    const fetchKey = `${currentEmployeeId}-${
      now.getMonth() + 1
    }-${now.getFullYear()}`;

    if (lastAttendanceKey.current === fetchKey) return;
    lastAttendanceKey.current = fetchKey;

    dispatch(fetchBlockers(currentEmployeeId));
    dispatch(
      fetchMonthlyAttendance({
        employeeId: currentEmployeeId,
        month: (now.getMonth() + 1).toString().padStart(2, "0"),
        year: now.getFullYear().toString(),
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
  }, [dispatch, currentEmployeeId, now, isAdmin]);

  // Transform records to local state
  const baseEntries = useMemo(() => {
    const entries = generateMonthlyEntries(now, today, records);

    // Overlay Approved leave/WFH/Client Visit from leave-requests onto timesheet entries.
    // This ensures the UI reflects applied requests even if attendance records are missing.
    if (!currentEmployeeId || !Array.isArray(leaveEntities) || leaveEntities.length === 0) {
      return entries;
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toYmd = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;

    const overlayByDate = new Map<
      string,
      { status?: TimesheetEntry["status"]; workLocation?: string }
    >();

    leaveEntities
      .filter((r: any) => r && r.employeeId === currentEmployeeId && r.status === "Approved")
      .forEach((r: any) => {
        const from = new Date(r.fromDate);
        const to = new Date(r.toDate);
        // Clamp to current month view
        const start = from < monthStart ? monthStart : from;
        const end = to > monthEnd ? monthEnd : to;
        const cur = new Date(start);
        cur.setHours(0, 0, 0, 0);
        const endNorm = new Date(end);
        endNorm.setHours(0, 0, 0, 0);

        while (cur <= endNorm) {
          const key = toYmd(cur);
          if (r.requestType === "Apply Leave" || r.requestType === "Leave") {
            overlayByDate.set(key, { status: "Leave" });
          } else if (r.requestType === "Work From Home") {
            overlayByDate.set(key, { workLocation: "WFH" });
          } else if (r.requestType === "Client Visit") {
            overlayByDate.set(key, { workLocation: "Client Visit" });
          }
          cur.setDate(cur.getDate() + 1);
        }
      });

    if (overlayByDate.size === 0) return entries;

    return entries.map((e) => {
      const key = toYmd(e.fullDate as Date);
      const overlay = overlayByDate.get(key);
      
      // Sunday should always be Weekend, regardless of any overlay data
      const dayOfWeek = (e.fullDate as Date).getDay();
      if (dayOfWeek === 0) {
        return {
          ...e,
          status: "Weekend" as TimesheetEntry["status"],
          workLocation: undefined, // Clear workLocation for Sunday
        };
      }
      
      // Check if this date is a master holiday - holidays take priority over leave/WFH/Client Visit
      const isHoliday = holidays?.find((h: any) => {
        const hDate = h.holidayDate || h.date;
        if (!hDate) return false;
        const normalizedHDate =
          typeof hDate === "string"
            ? hDate.split("T")[0]
            : new Date(hDate).toISOString().split("T")[0];
        return normalizedHDate === key;
      });
      
      // If it's a master holiday, don't apply overlay - keep holiday status
      if (isHoliday) {
        return {
          ...e,
          status: "Holiday" as TimesheetEntry["status"],
          workLocation: undefined, // Clear workLocation for holidays
        };
      }
      
      if (!overlay) return e;
      
      // Priority: Attendance record's workLocation takes precedence over leave request overlay
      // Only apply overlay workLocation if the entry doesn't already have one from attendance records
      return {
        ...e,
        status: overlay.status ?? e.status,
        // Only use overlay workLocation if entry doesn't already have workLocation from attendance
        workLocation: e.workLocation ?? overlay.workLocation,
      };
    });
  }, [now, today, records, leaveEntities, currentEmployeeId]);

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
      }, 5000); // 5 seconds highlight
      return () => clearTimeout(timer);
    }
  }, [selectedDateId]);

  // Toast Timer
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(
        () => setToast((prev) => ({ ...prev, show: false })),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

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

  const isHoliday = (date: Date) => {
    const d = new Date(date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;

    return holidays?.some((h: any) => {
      const hDate = h.holidayDate || h.date;
      if (!hDate) return false;
      const normalizedHDate =
        typeof hDate === "string"
          ? hDate.split("T")[0]
          : new Date(hDate).toISOString().split("T")[0];
      return normalizedHDate === dateStr;
    });
  };

  // Handlers
  const handlePrevMonth = () => {
    // Create new date with day 1 to avoid month rollover issues
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setNow(prev);
  };

  const handleNextMonth = () => {
    // Create new date with day 1 to avoid month rollover issues
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setNow(next);
  };

  const handleHoursInput = (entryIndex: number, val: string) => {
    if (effectiveReadOnly) return;
    if (isDateBlocked(localEntries[entryIndex].fullDate)) return;

    // Prevent typing if currently showing an error for this field
    if (inputError?.index === entryIndex) return;

    if (!/^\d*\.?\d*$/.test(val)) return;

    const num = parseFloat(val);

    // Validation: Max 24 hours
    if (num > 24) {
      setInputError({ index: entryIndex, message: "Max hours: 24" });

      // Clear the invalid value immediately so when error disappears it is empty/reset
      setLocalInputValues((prev) => ({ ...prev, [entryIndex]: "" }));

      // Clear error after 2 seconds
      setTimeout(() => {
        setInputError(null);
      }, 2000);

      return;
    }

    setLocalInputValues((prev) => ({ ...prev, [entryIndex]: val }));

    const hours = isNaN(num) ? 0 : num;

    let newStatus: string = localEntries[entryIndex].status || "Not Updated";

    if (hours > 0) {
      newStatus = hours >= 6 ? "Full Day" : "Half Day";
    } else {
      const entryDate = new Date(localEntries[entryIndex].fullDate);
      const dateStrLocal = `${entryDate.getFullYear()}-${String(
        entryDate.getMonth() + 1,
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
        // 0 hours on a weekday: Determine if Absent or Upcoming
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);

        const entryDateZero = new Date(entryDate);
        entryDateZero.setHours(0, 0, 0, 0);

        if (entryDateZero <= todayZero) {
          newStatus = "Absent";
        } else {
          newStatus = "UPCOMING";
        }
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
    if (effectiveReadOnly) return;
    const payload: any[] = [];
    localEntries.forEach((entry, idx) => {
      if (isDateBlocked(entry.fullDate)) return;

      const currentTotal = entry.totalHours || 0;
      const originalTotal = baseEntries[idx]?.totalHours || 0;

      if (
        currentTotal !== originalTotal ||
        entry.status !== baseEntries[idx]?.status
      ) {
        const d = entry.fullDate;
        const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

        const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        let derivedStatus = entry.status || "Pending";

        // For Sunday: Always set status to "Weekend" regardless of hours
        if (dayOfWeek === 0) {
          derivedStatus = "Weekend";
        } 
        // For Saturday: Only set to "Weekend" if there's NO data (no hours AND no workLocation)
        // If Saturday has data (Client Visit, WFH, etc.), keep that data
        else if (dayOfWeek === 6 && currentTotal === 0 && !entry.workLocation) {
          derivedStatus = "Weekend";
        }
        // For other days: Calculate status based on hours
        else if (derivedStatus === "Pending" || derivedStatus === "Not Updated") {
          if (currentTotal >= 6) derivedStatus = "Full Day";
          else if (currentTotal > 0) derivedStatus = "Half Day";
          else if (currentTotal === 0) derivedStatus = "Absent";
        }

        const existingRecord = records.find((r) => {
          const rDate =
            typeof r.workingDate === "string"
              ? r.workingDate.split("T")[0]
              : (r.workingDate as Date).toISOString().split("T")[0];
          return rDate === workingDate;
        });

        // Preserve workLocation if it exists (Client Visit or WFH)
        const workLocation = entry.workLocation || (existingRecord as any)?.workLocation;

        payload.push({
          id: existingRecord?.id,
          employeeId: currentEmployeeId,
          workingDate,
          totalHours: currentTotal,
          status: derivedStatus,
          workLocation: workLocation, // Preserve Client Visit or WFH (backend accepts this field)
        } as any);
      }
    });

    if (payload.length === 0) {
      setToast({ show: true, message: "No changes to save", type: "success" });
      return;
    }

    // Set status based on hours and day of week
    // BUT preserve workLocation (Client Visit or WFH) - don't override to Absent if workLocation exists
    payload.forEach((item) => {
      const itemDate = new Date(item.workingDate);
      const dayOfWeek = itemDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Sunday: Always set status to "Weekend" (even if hours entered or workLocation exists)
      if (dayOfWeek === 0) {
        item.status = "Weekend";
        item.workLocation = undefined; // Clear workLocation for Sunday
        return;
      }
      
      // If workLocation exists (Client Visit or WFH), don't override status to Absent/Weekend
      // These are present statuses, not leave/absent
      // Saturday with data should show the data, not Weekend
      if (item.workLocation) {
        // Don't override status for Client Visit/WFH days (including Saturday)
        return;
      }
      
      // Saturday: Only set to "Weekend" if there's NO data (no hours, no workLocation)
      if (dayOfWeek === 6 && (!item.totalHours || Number(item.totalHours) === 0)) {
        item.status = "Weekend";
      }
      // Other days: If hours is 0, set status to "Absent" (only if no workLocation)
      else if (!item.totalHours || Number(item.totalHours) === 0) {
        item.status = "Absent";
      }
    });

    try {
      await dispatch(submitBulkAttendance(payload)).unwrap();
      dispatch(
        fetchMonthlyAttendance({
          employeeId: currentEmployeeId,
          month: (now.getMonth() + 1).toString().padStart(2, "0"),
          year: now.getFullYear().toString(),
        }),
      );
      setToast({
        show: true,
        message: "Attendance Submitted Successfully",
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
              }),
            ).unwrap();
          } else {
            await dispatch(
              createAttendanceRecord({
                employeeId: item.employeeId,
                workingDate: item.workingDate,
                totalHours: item.totalHours,
                status: item.status,
              }),
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
          }),
        );
        setToast({ show: true, message: "Data Saved", type: "success" });
      } else {
        setToast({
          show: true,
          message: error?.response?.data?.message || "Failed to save records.",
          type: "error",
        });
      }
    }
  };

  // Calculations
  const monthTotalHours = localEntries.reduce(
    (acc, entry) => acc + (entry.totalHours || 0),
    0,
  );

  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getDay();
  const paddingDays = firstDayOfMonth;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to selected date
  useEffect(() => {
    if (selectedDateId && !isMobile && localEntries.length > 0) {
      // Small timeout to ensure DOM is rendered
      setTimeout(() => {
        const element = document.getElementById(`day-${selectedDateId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [selectedDateId, isMobile, localEntries]);

  if (isMobile) {
    return (
      <MobileMyTimesheet
        currentWeekEntries={weeks[currentWeekIndex] || []}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onHoursInput={handleHoursInput}
        onSave={onSaveAll}
        monthTotalHours={monthTotalHours}
        currentMonthName={now.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
        loading={loading}
        isAdmin={isAdmin}
        readOnly={effectiveReadOnly}
        isDateBlocked={isDateBlocked}
        isEditableMonth={isEditableMonth}
        isHoliday={isHoliday}
        onBlockedClick={onBlockedClick}
        localInputValues={localInputValues}
        onInputBlur={handleInputBlur}
        selectedDateId={selectedDateId}
        isHighlighted={isHighlighted}
        containerClassName={containerClassName}
      />
    );
  }

  return (
    <div
      className={`flex flex-col ${containerClassName || "h-full max-h-full overflow-hidden bg-[#F4F7FE] py-2 px-1 md:px-6 md:pt-4 md:pb-0 relative"}`}
    >
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

      <div className="flex-1 bg-white rounded-[20px] p-4 shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 overflow-hidden mt-1 flex flex-col">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-4 gap-4 sm:gap-0 px-2">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                disabled={isAdminView}
                className={`p-1.5 rounded-lg transition-all ${
                  isAdminView
                    ? "text-gray-200 cursor-not-allowed hidden"
                    : "hover:bg-gray-50 text-gray-400 hover:text-[#4318FF]"
                }`}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <p className="text-base sm:text-lg font-bold text-[#2B3674] min-w-[140px] text-center">
                {now.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={handleNextMonth}
                disabled={isAdminView}
                className={`p-1.5 rounded-lg transition-all ${
                  isAdminView
                    ? "text-gray-300 cursor-not-allowed hidden"
                    : "hover:bg-gray-50 text-gray-400 hover:text-[#4318FF]"
                }`}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Total Hours Mobile (Show when sm:hidden) */}
            <div className="sm:hidden text-right">
              <p className="text-[8px] uppercase font-black text-gray-400 tracking-wider leading-none mb-0.5">
                Total
              </p>
              <p className="text-lg font-black text-[#4318FF] leading-none">
                {monthTotalHours.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex flex-col sm:flex-row items-end sm:items-baseline gap-1 sm:gap-2">
              <p className="text-xs sm:text-sm uppercase font-bold text-gray-700 tracking-wider leading-none">
                TOTAL HOURS :
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-xl sm:text-2xl font-black text-[#4318FF] leading-none">
                  {monthTotalHours.toFixed(1)}
                </p>
                <span className="text-[10px] font-bold text-gray-700">hrs</span>
              </div>
            </div>
            {(!effectiveReadOnly || (isAdmin && !isAdminView)) && (
              <button
                onClick={onSaveAll}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#4318FF] text-white rounded-xl font-bold text-[10px] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 tracking-wide uppercase"
              >
                <Save size={14} />
                <span>Submit</span>
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-x-6 gap-y-2 flex-nowrap overflow-x-auto pb-4 scrollbar-none px-2 mb-2">
          {[
            {
              label: "Present",
              color: "bg-[#E6FFFA]",
              border: "border-[#01B574]",
            },
            {
              label: "Absent",
              color: "bg-[#FECACA]",
              border: "border-[#DC2626]",
            },
            {
              label: "Leave",
              color: "bg-[#FEE2E2]",
              border: "border-[#EE5D50]",
            },
            {
              label: "Not Updated",
              color: "bg-[#FEF3C7]",
              border: "border-[#FFB020]",
            },
            {
              label: "Today",
              color: "bg-[#4318FF]",
              border: "border-transparent",
            },
            {
              label: "Holiday",
              color: "bg-[#E6F7FF]",
              border: "border-[#00A3C4]",
            },
            {
              label: "Pending",
              color: "bg-[#F8FAFC]",
              border: "border-[#64748B]",
            },
            {
              label: "Upcoming",
              color: "bg-[#F8FAFC]",
              border: "border-[#64748B]",
            },
            {
              label: "Blocked",
              color: "bg-gray-100",
              border: "border-gray-300",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-[10px] font-bold text-gray-600 whitespace-nowrap uppercase tracking-wider"
            >
              <div
                className={`w-3 h-3 rounded-full ${item.color} border ${item.border}`}
              ></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-4 mb-2 px-2 border-b border-gray-50 pb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-black text-gray-700 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div 
          ref={scrollContainerRef}
          className="grid grid-cols-7 gap-2 md:gap-3 overflow-y-auto max-h-full pr-1 pb-2 px-2 scroll-smooth flex-1 custom-scrollbar"
        >
          {Array.from({ length: paddingDays }).map((_, idx) => (
            <div
              key={`p-${idx}`}
              className="min-h-[60px] md:min-h-[90px] rounded-2xl bg-gray-50/30 border border-dashed border-gray-100"
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
              day.fullDate.getMonth() + 1,
            ).padStart(2, "0")}-${String(day.fullDate.getDate()).padStart(
              2,
              "0",
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

            // Logic from old code: Red if weekend w/o status OR if it is a holiday
            const isSelected =
              selectedDateId &&
              new Date(selectedDateId).toDateString() ===
                day.fullDate.toDateString();
            const highlightClass =
              isSelected && isHighlighted
                ? "ring-4 ring-[#4318FF]/20 z-10 scale-[1.02]"
                : "";

            const isBlocked = isDateBlocked(day.fullDate);
            const blockedReason = isBlocked
              ? getBlockedReason(day.fullDate)
              : "";

            // Disable editing for approved Leave days only
            // WFH and Client Visit days are editable (they are present, not leave)
            const isLeaveDay = day.status === "Leave";

            // Check if date is in current month or next month
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
            
            const dayMonth = day.fullDate.getMonth();
            const dayYear = day.fullDate.getFullYear();
            const isCurrentOrNextMonth = 
              (dayMonth === currentMonth && dayYear === currentYear) ||
              (dayMonth === nextMonth && dayYear === nextMonthYear);

            // Logic for "isEditable"
            // - Admins can edit any date (except blocked/leave days)
            // - Employees can edit current month and next month
            // - WFH and Client Visit days are editable (they are present, not leave)
            // - Leave days are never editable
            const isEditable =
              (isAdmin ? !isAdminView : !readOnly) &&
              (isAdmin || isCurrentOrNextMonth || isEditableMonth(day.fullDate)) &&
              !isBlocked &&
              !isLeaveDay;

            // Updated Styling Logic
            let bg = "bg-white hover:border-[#4318FF]/20";
            let badge = "bg-gray-50 text-gray-500";
            let border = "border-transparent";
            let shadow = "shadow-[0px_2px_15px_rgba(0,0,0,0.02)]";

            // Sunday should always show as Weekend, regardless of any data
            const dayOfWeek = day.fullDate.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;
            
            // Saturday: Only show as Weekend if there's NO data (no workLocation, no meaningful status)
            const isSaturdayWithNoData = isSaturday && !day.workLocation && 
              (day.status === "Weekend" || day.status === "Pending" || day.status === "Not Updated" || !day.status);

            if (isBlocked) {
              // Administrative Block
              bg = "bg-gray-200 opacity-90 grayscale";
              badge = "bg-gray-600 text-white";
            } else if (isSunday || (isSaturdayWithNoData && !day.workLocation)) {
              // Sunday: Always Weekend. Saturday: Only Weekend if no data
              bg = "bg-[#FEE2E2]";
              badge = "bg-[#EE5D50]/70 text-white font-bold";
              border = "border-[#EE5D50]/10";
            } else if (holiday || (day.status as any) === "Holiday") {
              // Master holidays take priority over everything (Leave, WFH, Client Visit, etc.)
              bg = "bg-[#DBEAFE]";
              badge = "bg-[#1890FF]/70 text-white font-bold";
              border = "border-[#1890FF]/20";
            } else if (
              (day.status === "Full Day" ||
                day.status === "Half Day") &&
              displayVal !== 0
            ) {
              bg = "bg-[#E6FFFA]";
              badge = "bg-[#01B574] text-white font-bold";
              border = "border-[#01B574]/20";
            } else if (day.status === "Leave") {
              // Leave status takes priority over workLocation (even if workLocation is Client Visit)
              bg = "bg-[#FEE2E2]";
              badge = "bg-[#EE5D50]/70 text-white font-bold";
              border = "border-[#EE5D50]/10";
            } else if (day.workLocation === "Client Visit" || day.status === "Client Visit") {
               // Client Visit - Blue Style (only if status is NOT Leave)
               // User said "same color apply" (as WFH?). WFH in screenshot looked Greyish/Blue.
               // Let's use the explicit Client Visit blue we have, which is definitely NOT Red.
              bg = "bg-[#DBEAFE]";
              badge = "bg-[#4318FF]/70 text-white font-bold";
              border = "border-[#4318FF]/20";
            } else if (day.workLocation === "WFH" || day.status === "WFH") {
               // WFH Style - Match Client Visit (Blue) as requested
               bg = "bg-[#DBEAFE]";
               badge = "bg-[#4318FF]/70 text-white font-bold";
               border = "border-[#4318FF]/20"; 
            } else if (day.status === "Absent") {
              bg = "bg-[#FECACA]";
              badge = "bg-[#DC2626]/70 text-white font-bold";
              border = "border-[#DC2626]/20";
            } else if (day.status === "Not Updated") {
              bg = "bg-[#FEF3C7]";
              badge = "bg-[#FFB020]/80 text-white font-bold";
              border = "border-[#FFB020]/20";
            } else if (day.status === "Pending" || !day.status) {
              // Pending or Upcoming (no status)
              bg = "bg-[#F8FAFC]";
              badge = "bg-[#64748B]/90 text-white font-bold";
              border = "border-[#E2E8F0]";
            }
            if (day.isToday) {
              bg =
                "bg-white ring-2 ring-[#4318FF] shadow-lg shadow-blue-500/20 z-10";
            }

            const isError = inputError?.index === idx;

            return (
              <div
                key={idx}
                id={`day-${day.fullDate.getTime()}`}
                className={`relative flex flex-col justify-between p-1 md:p-1.5 rounded-xl md:rounded-2xl border transition-all duration-300 min-h-[100px] md:min-h-[120px] group 
                            ${border} ${shadow} ${highlightClass} ${bg} ${
                              isBlocked
                                ? isAdmin
                                  ? "cursor-pointer"
                                  : "cursor-not-allowed"
                                : "hover:-translate-y-1 hover:shadow-lg"
                            }`}
                onClick={() => {
                  if (isBlocked && isAdmin && onBlockedClick) {
                    onBlockedClick();
                  }
                }}
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
                  {isBlocked && !isAdmin && (
                    <div className="p-1 rounded-full bg-red-50 text-red-500 border border-red-100">
                      <Lock size={8} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Middle: Input Area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 z-10 py-1 min-h-[50px]">
                  <div className="relative group/input w-full flex justify-center">
                    <input
                      type="text"
                      disabled={!isEditable || isError}
                      className={`w-full h-10 text-center font-medium bg-transparent transition-all focus:outline-none focus:ring-0
                        ${
                          !isEditable
                            ? "text-gray-400 cursor-not-allowed"
                            : isError
                              ? "text-red-500 text-[10px] font-bold animate-pulse"
                              : "text-gray-800 text-3xl group-hover:scale-105 focus:scale-105"
                        }`}
                      placeholder={
                        day.status === "Weekend" ||
                        (day.status as any) === "WEEKEND" ||
                        holiday
                          ? "-"
                          : "0"
                      }
                      value={isError ? inputError.message : inputValue}
                      onChange={(e) => handleHoursInput(idx, e.target.value)}
                      onBlur={() => handleInputBlur(idx)}
                    />
                    {isEditable && !isError && (
                      <div className="absolute bottom-0 w-12 h-0.5 bg-black/20 rounded-full group-hover/input:bg-black transition-colors"></div>
                    )}
                  </div>
                  <span className="text-[9px] text-black font-semibold uppercase tracking-wider">
                    hours
                  </span>
                </div>

                {/* Bottom: Status Badge */}
                <div
                  className={`w-full py-1.5 rounded-lg text-center text-[10px] font-black uppercase tracking-wider truncate px-1 shadow-sm z-10 mt-auto ${badge}`}
                >
                  {isBlocked
                    ? "BLOCKED"
                    : holiday || day.status === "Holiday"
                      ? holiday?.holidayName || holiday?.name || "HOLIDAY"
                      : isSunday || (isSaturdayWithNoData && !day.workLocation)
                        ? "WEEKEND"
                        : day.status === "Leave"
                          ? "LEAVE"
                          : day.workLocation && (day.status as string) !== "Leave"
                            ? day.workLocation
                            : day.status === "Full Day" ||
                              day.status === "Half Day" ||
                              day.status === "WFH" ||
                              day.status === "Client Visit"
                            ? day.status
                            : day.status === "Absent"
                              ? "ABSENT"
                              : day.status === "Not Updated"
                                ? "Not Updated"
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
