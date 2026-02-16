import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Modal } from "antd";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Rocket,
  ShieldBan,
} from "lucide-react";
import { TimesheetEntry } from "../types";
import { useAppDispatch, useAppSelector } from "../hooks";
import { UserType } from "../reducers/user.reducer";
import {
  updateAttendanceRecord,
  submitBulkAttendance,
  fetchMonthlyAttendance,
  createAttendanceRecord,
  autoUpdateTimesheet,
} from "../reducers/employeeAttendance.reducer";
import {
  getLeaveHistory,
  submitLeaveRequest
} from "../reducers/leaveRequest.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import {
  generateMonthlyEntries,
  isEditableMonth,
} from "../utils/attendanceUtils";
import { fetchBlockers } from "../reducers/timesheetBlocker.reducer";
import MobileMyTimesheet from "./MobileMyTimesheet";
import AutoUpdateModal from "./AutoUpdateModal";
import AutoUpdateSuccessModal from "./AutoUpdateSuccessModal";

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

  // @ts-ignore
  const { holidays } = useAppSelector(
    (state) => (state as any).masterHolidays || { holidays: [] },
  );

  const { blockers } = useAppSelector((state) => state.timesheetBlocker);

  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const isManager = !!(currentUser?.userType === UserType.MANAGER || 
                    (currentUser?.role && currentUser.role.toUpperCase().includes('MANAGER')));
  const isMyRoute = location.pathname.includes("my-dashboard") || 
                    location.pathname.includes("my-timesheet") || 
                    location.pathname === "/employee-dashboard" || 
                    location.pathname === "/employee-dashboard/";

  const currentEmployeeId =
    propEmployeeId ||
    (isMyRoute 
      ? (currentUser?.employeeId || currentUser?.loginId) 
      : (entity?.employeeId || currentUser?.employeeId || currentUser?.loginId));

  // Debug log for manager dashboard data issue
  useEffect(() => {
    if (isMyRoute) {
      console.log("My Route Debug (MyTimesheet):", {
        pathname: location.pathname,
        "currentUser.loginId": currentUser?.loginId,
        "currentUser.employeeId": currentUser?.employeeId,
        currentEmployeeId
      });
    }
  }, [location.pathname, currentUser, currentEmployeeId, isMyRoute]);


  const isAdminView = isAdmin && currentEmployeeId === "Admin";
  const isManagerView = !!(isManager && currentEmployeeId && currentEmployeeId === (currentUser?.employeeId || currentUser?.loginId));

  const effectiveReadOnly = readOnly || isAdminView;

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      );
    }
    return new Date(dateStr);
  };

  // 1. Calendar initial date state
  const [now, setNow] = useState<Date>(() => {
    if (propNow) return propNow;
    if (location.state?.selectedDate)
      return parseLocalDate(location.state.selectedDate);
    if (date) return parseLocalDate(date);
    return new Date();
  });

  // 2. Highlighting state
  const [selectedDateId, setSelectedDateId] = useState<number | null>(() => {
    if (propSelectedDateId) return propSelectedDateId;
    if (location.state?.selectedDate)
      return parseLocalDate(location.state.selectedDate).getTime();
    if (date) return parseLocalDate(date).getTime();
    return null;
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
  // Track manually edited entries to prevent baseEntries from overwriting user edits
  const [manuallyEditedIndices, setManuallyEditedIndices] = useState<
    Set<number>
  >(new Set());
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "success" });

  const [inputError, setInputError] = useState<{
    index: number;
    message: string;
  } | null>(null);
  
  
  const [showAutoUpdateModal, setShowAutoUpdateModal] = useState(false);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ count: number } | null>(null);
  const [autoUpdateCount, setAutoUpdateCount] = useState<number>(0);
  const [isCheckingAutoUpdate, setIsCheckingAutoUpdate] = useState(false);

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

  // Check for eligible auto-updates when month/employee changes (Current Month Only)
  // Ref to track the last checked employee/month/records-length combination
  const lastCheckRef = useRef<string>("");

  useEffect(() => {
    if (!currentEmployeeId || (isAdmin && currentEmployeeId === "Admin")) return;

    // Only check if it's the current month
    if (now.getMonth() === today.getMonth() && now.getFullYear() === today.getFullYear()) {
      
      // Create a unique key for the current state
      const checkKey = `${currentEmployeeId}-${now.getMonth()}-${now.getFullYear()}-${records.length}`;
      
      // Prevent duplicate checks if nothing material changed
      if (lastCheckRef.current === checkKey) return;
      lastCheckRef.current = checkKey;

      const checkAutoUpdate = async () => {
        setIsCheckingAutoUpdate(true);
        try {
          const result = await dispatch(autoUpdateTimesheet({
            employeeId: currentEmployeeId!,
            month: (now.getMonth() + 1).toString().padStart(2, "0"),
            year: now.getFullYear().toString(),
            dryRun: true // DRY RUN MODE
          })).unwrap();
          
          setAutoUpdateCount(result.count || 0);
        } catch (error) {
          console.warn("Auto-update check failed:", error);
          setAutoUpdateCount(0);
        } finally {
          setIsCheckingAutoUpdate(false);
        }
      };

      checkAutoUpdate();
    } else {
        // Reset if not current month to ensure it re-checks when returning
        setAutoUpdateCount(0);
        lastCheckRef.current = "";
    }
  }, [dispatch, currentEmployeeId, now, isAdmin, today, records.length]); // Use records.length instead of records to avoid deep equality issues
  
  // Fetch attendance and blockers when month/employee changes
  useEffect(() => {
    if (!currentEmployeeId || (isAdmin && currentEmployeeId === "Admin"))
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
    return generateMonthlyEntries(now, today, records);
  }, [now, today, records]);

  // Clear manually edited indices when month/year changes
  const monthYearKey = `${now.getMonth()}-${now.getFullYear()}`;
  const lastMonthYearKeyRef = useRef<string>("");
  useEffect(() => {
    if (lastMonthYearKeyRef.current !== monthYearKey) {
      lastMonthYearKeyRef.current = monthYearKey;
      setManuallyEditedIndices(new Set());
    }
  }, [monthYearKey]);

  useEffect(() => {
    // Preserve manually edited entries when baseEntries updates
    // Always respect backend status - don't override it
    setLocalEntries((prevEntries) => {
      // If no previous entries, just use baseEntries as-is from backend
      if (prevEntries.length === 0) {
        return baseEntries;
      }

      // If baseEntries length changed (month changed), reset manually edited indices
      if (baseEntries.length !== prevEntries.length) {
        setManuallyEditedIndices(new Set());
        return baseEntries;
      }

      // Preserve manually edited entries
      const editedIndices = manuallyEditedIndices;
      return baseEntries.map((baseEntry, index) => {
        if (editedIndices.has(index)) {
          // Keep the manually edited entry
          return prevEntries[index];
        }
        // For non-edited entries, use backend status as-is
        return baseEntry;
      });
    });
  }, [baseEntries, manuallyEditedIndices]);

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
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = records.find(r => {
        const rDate = new Date(r.workingDate);
        return rDate.toISOString().split('T')[0] === dateStr;
      });

      if (entry) {
        const h1 = (entry.firstHalf || '').toLowerCase();
        const h2 = (entry.secondHalf || '').toLowerCase();
        const isRestricted = (val: string) => val && !val.includes('office') && val.trim() !== '';
        
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
    d.setHours(0,0,0,0);
    if (!isAdmin && !isManager && !isEditableMonth(d)) return "Month is Locked";

    // 2. Manual Blocker
    const blocker = getBlocker(date);
    if (blocker) return blocker.reason || "Admin Blocked";

    // 3. Restricted Activity
    if (!isAdmin && !isManager) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const entry = records.find(r => {
            const rDate = new Date(r.workingDate);
            return rDate.toISOString().split('T')[0] === dateStr;
        });

        if (entry) {
            const h1 = (entry.firstHalf || '').toLowerCase();
            const h2 = (entry.secondHalf || '').toLowerCase();
            const isRestricted = (val: string) => val && !val.includes('office') && val.trim() !== '';
            
            if (isRestricted(h1) || isRestricted(h2)) return "Restricted Activity (Leave/WFH)";
        }
    }

    return null;
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
    // Clear manually edited indices when month changes
    setManuallyEditedIndices(new Set());
  };

  const handleNextMonth = () => {
    // Create new date with day 1 to avoid month rollover issues
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setNow(next);
    // Clear manually edited indices when month changes
    setManuallyEditedIndices(new Set());
  };

  const handleHoursInput = (entryIndex: number, val: string) => {
    if (effectiveReadOnly) return;
    if (isDateBlocked(localEntries[entryIndex].fullDate)) return;

    // Prevent typing if currently showing an error for this field
    if (inputError?.index === entryIndex) return;

    if (!/^\d*\.?\d*$/.test(val)) return;

    const num = parseFloat(val);

    // Validation: Cap hours for Half-Day Leave scenarios
    const entry = localEntries[entryIndex];
    const isHalfLeave = (entry.firstHalf as string)?.toLowerCase() === "leave" || (entry.secondHalf as string)?.toLowerCase() === "leave";
    
    // Restriction: Employees are capped at 4.5h for half-day leave dates.
    // Admin and Managers are NOT restricted.
    const maxHours = (!isAdmin && !isManager && isHalfLeave) ? 4.5 : 24;

    if (num > maxHours) {
      setInputError({ index: entryIndex, message: `Max: ${maxHours}h` });

      // Clear the invalid value immediately
      setLocalInputValues((prev) => ({ ...prev, [entryIndex]: "" }));

      // Clear error after 2 seconds
      setTimeout(() => {
        setInputError(null);
      }, 2000);

      return;
    }

    setLocalInputValues((prev) => ({ ...prev, [entryIndex]: val }));

    const hours = isNaN(num) ? 0 : num;

    let newStatus: string;

    if (hours > 0) {
      // When hours > 0, calculate based on hours
      newStatus = hours > 4.5 ? "Full Day" : "Half Day";
    } else {
      // When hours are 0, ALWAYS recalculate status - never preserve previous status (especially Leave)
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

    // Mark this entry as manually edited to prevent baseEntries from overwriting it
    setManuallyEditedIndices((prev) => new Set(prev).add(entryIndex));
  };

  const handleInputBlur = (entryIndex: number) => {
    setLocalInputValues((prev) => {
      const next = { ...prev };
      delete next[entryIndex];
      return next;
    });
  };

  const handleAutoUpdate = () => {
    if (effectiveReadOnly) return;

    let changed = false;
    const updatedEntries = [...localEntries];
    const newEditedIndices = new Set(manuallyEditedIndices);

    // We also need to clear local inputs for updated fields so they show the new value
    let newLocalInputValues = { ...localInputValues };

    updatedEntries.forEach((entry, idx) => {
      // 1. Check blocked
      if (isDateBlocked(entry.fullDate)) return;

      // 2. Skip exclusions: Leave, Half Day
      if (entry.status === "Leave" || entry.status === "Half Day") return;

      // 3. Skip Holidays
      if (isHoliday(entry.fullDate)) return;

      // 4. Skip Weekends (Sat/Sun)
      const day = entry.fullDate.getDay();
      if (day === 0 || day === 6) return; // 0=Sun, 6=Sat

      // 5. Update to 9 hours
      if (entry.totalHours !== 9) {
        updatedEntries[idx] = {
          ...entry,
          totalHours: 9,
          status: "Full Day",
        };
        newEditedIndices.add(idx);

        // Remove from localInputValues so it uses the new totalHours
        if (newLocalInputValues[idx] !== undefined) {
          delete newLocalInputValues[idx];
        }

        changed = true;
      }
    });

    if (changed) {
      setLocalEntries(updatedEntries);
      setManuallyEditedIndices(newEditedIndices);
      setLocalInputValues(newLocalInputValues);
      setToast({
        show: true,
        message: "Auto-filled working days to 9 hours",
        type: "success",
      });
    } else {
      setToast({
        show: true,
        message: "No eligible days to auto-fill",
        type: "info",
      });
    }
  };

  const onSaveAll = async () => {
    if (effectiveReadOnly) return;
    const payload: any[] = [];
    localEntries.forEach((entry, idx) => {
      if (isDateBlocked(entry.fullDate)) return;

      const currentTotal = Number(entry.totalHours || 0);
      const originalTotal = Number(baseEntries[idx]?.totalHours || 0);

      if (
        currentTotal !== originalTotal ||
        entry.status !== baseEntries[idx]?.status
      ) {
        const d = entry.fullDate;
        const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

        const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;

        // Check if it's a holiday
        const dateStrLocal = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const isHoliday = holidays?.find((h: any) => {
          const hDate = h.holidayDate || h.date;
          if (!hDate) return false;
          const normalizedHDate =
            typeof hDate === "string"
              ? hDate.split("T")[0]
              : new Date(hDate).toISOString().split("T")[0];
          return normalizedHDate === dateStrLocal;
        });

        let derivedStatus: string;

        // For Sunday: Always set status to "Weekend" regardless of hours
        if (dayOfWeek === 0) {
          derivedStatus = "Weekend";
        }
        // For holidays: Always set status to "Holiday" regardless of hours
        else if (isHoliday) {
          derivedStatus = "Holiday";
        }
        // For Saturday: Only set to "Weekend" if there's NO data (no hours AND no workLocation)
        // If Saturday has data (Client Visit, WFH, etc.), keep that data
        else if (dayOfWeek === 6 && currentTotal === 0 && !entry.workLocation) {
          derivedStatus = "Weekend";
        }
        // For other days: Calculate status based on hours
        // NEVER preserve Leave status - always calculate based on hours
        else {
          if (currentTotal > 4.5) {
            derivedStatus = "Full Day";
          } else if (currentTotal > 0) {
            derivedStatus = "Half Day";
          } else {
            // 0 hours on a weekday: Determine if Absent or Upcoming
            const todayZero = new Date();
            todayZero.setHours(0, 0, 0, 0);
            const entryDateZero = new Date(d);
            entryDateZero.setHours(0, 0, 0, 0);
            derivedStatus = entryDateZero <= todayZero ? "Absent" : "UPCOMING";
          }
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
          firstHalf: entry.firstHalf,
          secondHalf: entry.secondHalf,
        } as any);
      }
    });

    if (payload.length === 0) {
      setToast({ show: true, message: "No changes to save", type: "success" });
      return;
    }

    // Set status based on hours and day of week
    // NEVER allow Leave status when hours are 0 - always set to Absent/Weekend/Holiday
    payload.forEach((item) => {
      const itemDate = new Date(item.workingDate);
      const dayOfWeek = itemDate.getDay(); // 0 = Sunday, 6 = Saturday

      // Sunday: Always set status to "Weekend" (even if hours entered)
      if (dayOfWeek === 0) {
        item.status = "Weekend";
        return;
      }

      // Saturday: Only set to "Weekend" if there's NO data (no hours)
      if (
        dayOfWeek === 6 &&
        (!item.totalHours || Number(item.totalHours) === 0)
      ) {
        item.status = "Weekend";
      }
      // Other days: If hours is 0, ALWAYS set status to "Absent" (never Leave)
      else if (!item.totalHours || Number(item.totalHours) === 0) {
        item.status = "Absent";
      }
      // If status is "Leave" but hours > 0, recalculate based on hours
      else if (item.status === "Leave") {
        if (item.totalHours >= 4.5) {
          item.status = "Full Day";
        } else if (item.totalHours > 0) {
          item.status = "Half Day";
        }
      }
    });

    const handleActualSave = async (finalPayload: any[]) => {
      try {
        await dispatch(submitBulkAttendance(finalPayload)).unwrap();
        dispatch(
          fetchMonthlyAttendance({
            employeeId: currentEmployeeId,
            month: (now.getMonth() + 1).toString().padStart(2, "0"),
            year: now.getFullYear().toString(),
          }),
        );
        // Clear manually edited indices after successful save
        setManuallyEditedIndices(new Set());
        setToast({
          show: true,
          message: "Attendance Submitted Successfully",
          type: "success",
        });
      } catch (error: any) {
        console.warn("Bulk API failed, attempting sequential fallback...", error);
        let successCount = 0;
        for (const item of finalPayload) {
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
          // Clear manually edited indices after successful save
          setManuallyEditedIndices(new Set());
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

    const halfDayItems = payload.filter(
      (item) => Number(item.totalHours) > 0 && Number(item.totalHours) <= 4.5,
    );

    if (!isAdmin && !isManager) {
      if (halfDayItems.length > 0) {
        const datesString = halfDayItems
          .map((item) => new Date(item.workingDate).getDate())
          .sort((a, b) => a - b)
          .join(", ");

        Modal.confirm({
          title: null,
          icon: null,
          width: 550,
          wrapClassName: "attractive-half-day-modal",
          content: (
            <div style={{ padding: "10px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#fff7e6",
                    borderRadius: "50%",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #ffe7ba",
                  }}
                >
                  <AlertCircle size={28} color="#fa8c16" />
                </div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                  Attendance Half Day Rule
                </h2>
              </div>
              <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#434343" }}>
                Attendance entries of <strong>4.5 hours or less</strong> on{" "}
                <span style={{ color: "#fa8c16", fontWeight: 700 }}>
                  dates {datesString}
                </span>{" "}
                are automatically considered a <strong>Half Day</strong>.
              </p>
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  borderLeft: "4px solid #fa8c16",
                }}
              >
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    listStyleType: "disc",
                  }}
                >
                  <li style={{ marginBottom: "8px" }}>
                    <strong>First Half:</strong> Office
                  </li>
                  <li>
                    <strong>Second Half:</strong> Leave
                  </li>
                </ul>
              </div>
              <div
                style={{
                  backgroundColor: "#fff1f0",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px dashed #ffa39e",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    color: "#cf1322",
                    margin: 0,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Since you are an employee, this requires Manager Approval.
                  Confirming will create a formal Leave Request for you.
                </p>
              </div>
            </div>
          ),
          okText: "Confirm and Place Request",
          cancelText: "Cancel",
          okButtonProps: {
            size: "large",
            style: { borderRadius: "6px", fontWeight: 600 },
          },
          cancelButtonProps: { size: "large", style: { borderRadius: "6px" } },
          onOk: async () => {
            try {
              for (const item of halfDayItems) {
                await dispatch(
                  submitLeaveRequest({
                    employeeId: currentEmployeeId,
                    fromDate: item.workingDate,
                    toDate: item.workingDate,
                    requestType: "Half Day",
                    isHalfDay: true,
                    halfDayType: "Second Half",
                    title: "Half Day (Auto-generated)",
                    description: `Auto-generated from ${item.totalHours} hours timesheet entry`,
                    firstHalf: "Office",
                    secondHalf: "Leave",
                  } as any),
                ).unwrap();
              }

              const remainingPayload = payload.filter(
                (item) =>
                  !(Number(item.totalHours) > 0 && Number(item.totalHours) <= 4.5),
              );
              if (remainingPayload.length > 0) {
                await handleActualSave(remainingPayload);
              } else {
                dispatch(
                  fetchMonthlyAttendance({
                    employeeId: currentEmployeeId,
                    month: (now.getMonth() + 1).toString().padStart(2, "0"),
                    year: now.getFullYear().toString(),
                  }),
                );
                dispatch(getLeaveHistory({ employeeId: currentEmployeeId }));
                setToast({
                  show: true,
                  message: "Leave Request Submitted Successfully",
                  type: "success",
                });
              }
            } catch (err: any) {
              setToast({
                show: true,
                message: "Failed to submit leave requests",
                type: "error",
              });
            }
          },
        });
      } else {
        // Fallback for user if no half day items (shouldn't be reached in this if block logic, but for safety in new structure)
        await handleActualSave(payload);
      }
    } else {
      // Admin / Manager Logic
      if (payload.length > 0) {
        Modal.confirm({
          title: null,
          icon: null,
          width: 600,
          centered: true,
          content: (
            <div className="py-2">
              <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="bg-[#EEF2FF] p-3 rounded-2xl border border-[#4318FF]/20 shadow-sm">
                  <Rocket size={32} className="text-[#4318FF]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1B2559] leading-tight">Authorize Update</h3>
                  <p className="text-xs font-bold text-[#4318FF] uppercase tracking-widest mt-0.5">Administrator Override</p>
                </div>
              </div>
              
              <p className="text-[15px] text-[#434343] mb-5 leading-relaxed">
                Confirming the following <span className="font-black text-[#1B2559] underline decoration-[#4318FF]/30 underline-offset-4">{payload.length} {payload.length === 1 ? 'entry' : 'entries'}</span> for attendance synchronization:
              </p>
              
              <div className="max-h-[300px] overflow-y-auto mb-6 rounded-2xl border border-gray-100 bg-[#F4F7FE]/30 p-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#F4F7FE] z-10">
                    <tr>
                      <th className="p-3 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider">Date</th>
                      <th className="p-3 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider text-right">Updated Hours</th>
                      <th className="p-3 text-[10px] font-black text-[#A3AED0] uppercase tracking-wider text-right">New Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.map((item, idx) => {
                      const date = new Date(item.workingDate);
                      const isHalf = Number(item.totalHours) > 0 && Number(item.totalHours) <= 4.5;
                      return (
                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-white/50 transition-colors">
                          <td className="p-3 text-sm font-bold text-[#2B3674]">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="p-3 text-sm font-black text-[#4318FF] text-right">
                            {item.totalHours}h
                          </td>
                          <td className="p-3 text-right">
                             <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-tighter shadow-sm border ${
                               isHalf 
                                 ? "bg-amber-50 text-amber-600 border-amber-200" 
                                 : "bg-emerald-50 text-emerald-600 border-emerald-200"
                             }`}>
                                {isHalf ? "Half Day" : "Full Day"}
                             </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {halfDayItems.length > 0 && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-3 items-start shadow-sm mb-2">
                  <AlertCircle size={20} className="text-[#4318FF] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[13px] font-black text-[#1B2559] mb-1 leading-none uppercase tracking-wide">Sync Logic Enforcement</h4>
                    <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
                      All <span className="font-bold text-[#4318FF]">4.5h entries</span> will be formalized with an explicit <span className="font-bold underline decoration-indigo-200 underline-offset-2">Office (1st) / Leave (2nd)</span> split during synchronization.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ),
          okText: "Process All Updates",
          cancelText: "Cancel",
          okButtonProps: { 
            size: "large", 
            className: "bg-[#4318FF] hover:bg-[#320ec4] border-0 text-white font-bold px-8 rounded-xl h-11 shadow-lg shadow-indigo-500/30" 
          },
          cancelButtonProps: { 
            size: "large", 
            className: "rounded-xl h-11 font-bold text-gray-500 border-gray-200" 
          },
          onOk: async () => {
            await handleActualSave(payload);
          },
        });
      } else {
        await handleActualSave(payload);
      }

    }
  };

  // Calculations
  const monthTotalHours = localEntries.reduce(
    (acc, entry) => acc + Number(entry.totalHours || 0),
    0,
  );

  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getDay();
  const paddingDays = firstDayOfMonth;

  const handleAutoUpdateClick = () => {
    // Only allow for current month
    if (now.getMonth() !== today.getMonth() || now.getFullYear() !== today.getFullYear()) {
      setToast({ show: true, message: "Auto-update is only available for the current month.", type: "error" });
      return;
    }
    setShowAutoUpdateModal(true);
  };

  const confirmAutoUpdate = async () => {
    setIsAutoUpdating(true);
    try {
      const result = await dispatch(autoUpdateTimesheet({
        employeeId: currentEmployeeId!,
        month: (now.getMonth() + 1).toString().padStart(2, "0"),
        year: now.getFullYear().toString(),
      })).unwrap();

      // Close confirmation modal
      setShowAutoUpdateModal(false);

      // Always refetch so UI shows latest data immediately (don't rely on going back)
      await dispatch(
        fetchMonthlyAttendance({
          employeeId: currentEmployeeId!,
          month: (now.getMonth() + 1).toString().padStart(2, "0"),
          year: now.getFullYear().toString(),
        }),
      );

      if (result.count > 0) {
        setManuallyEditedIndices(new Set());
        lastCheckRef.current = "";
      }

      // Show success modal after data is refreshed so totals/calendar are already updated
      setUpdateResult(result);
      setShowSuccessModal(true);
    } catch (err: any) {
      setShowAutoUpdateModal(false);
      setToast({ show: true, message: err?.message || "Failed to auto-update timesheet.", type: "error" });
    } finally {
      setIsAutoUpdating(false);
    }
  };

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
        isManager={isManager}
        isManagerView={isManagerView}
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
        onAutoUpdate={
          now.getMonth() === today.getMonth() && 
          now.getFullYear() === today.getFullYear() 
             ? handleAutoUpdateClick 
             : undefined
        }
        autoUpdateCount={autoUpdateCount}
        blockers={blockers}
      />
    );
  }

  return (
    <div
      className={`flex flex-col ${containerClassName || "h-full max-h-full overflow-hidden bg-[#F4F7FE] py-2 px-1 md:px-6 md:pt-4 md:pb-0 relative"}`}
    >
      <AutoUpdateModal 
        isOpen={showAutoUpdateModal}
        onClose={() => setShowAutoUpdateModal(false)}
        onConfirm={confirmAutoUpdate}
        monthName={now.toLocaleDateString("en-US", { month: "long" })}
        year={now.getFullYear()}
        loading={isAutoUpdating}
      />
      <AutoUpdateSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        count={updateResult?.count || 0}
        monthName={now.toLocaleDateString("en-US", { month: "long" })}
        year={now.getFullYear()}
      />
      {false && (
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
                disabled={isAdminView || loading}
                className={`p-1.5 rounded-lg transition-all ${
                  isAdminView
                    ? "text-gray-200 cursor-not-allowed hidden"
                    : loading 
                      ? "text-gray-300 cursor-wait"
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
                disabled={isAdminView || loading}
                className={`p-1.5 rounded-lg transition-all ${
                  isAdminView
                    ? "text-gray-300 cursor-not-allowed hidden"
                    : loading
                      ? "text-gray-300 cursor-wait"
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
                {(Number(monthTotalHours) || 0).toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* {!effectiveReadOnly && (
              <button
                onClick={handleAutoUpdate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-[10px] hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100 uppercase tracking-wide"
                title="Auto-fill working days to 9 hours"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>Auto Fill</span>
              </button>
            )} */}
            <div className="flex flex-col sm:flex-row items-end sm:items-baseline gap-1 sm:gap-2">
              <p className="text-xs sm:text-sm uppercase font-bold text-gray-700 tracking-wider leading-none">
                TOTAL HOURS :
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-xl sm:text-2xl font-black text-[#4318FF] leading-none">
                  {Number(monthTotalHours).toFixed(1)}
                </p>
                <span className="text-[10px] font-bold text-gray-700">hrs</span>
              </div>
            </div>
            
            {/* Auto Update Button */}
            {(!effectiveReadOnly || (isAdmin && !isAdminView) || (isManager && !isManagerView)) && 
             now.getMonth() === today.getMonth() && 
             now.getFullYear() === today.getFullYear() && (
              <button
                onClick={handleAutoUpdateClick}
                disabled={autoUpdateCount === 0 || isCheckingAutoUpdate}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-xl font-bold text-[10px] transition-all active:scale-95 tracking-wide uppercase hover:-translate-y-0.5
                  ${autoUpdateCount > 0 && !isCheckingAutoUpdate 
                    ? "bg-gradient-to-r from-[#4318FF] to-[#868CFF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:to-[#4318FF]" 
                    : "bg-gray-300 cursor-not-allowed grayscale"}`}
                title={autoUpdateCount > 0 ? `Auto-fill ${autoUpdateCount} days` : "No eligible days to update"}
              >
                <Rocket size={14} className={autoUpdateCount > 0 ? "animate-pulse" : ""} />
                <span className="hidden sm:inline">
                  {isCheckingAutoUpdate ? "Checking..." : autoUpdateCount > 0 ? `Auto Update (${autoUpdateCount})` : "Auto Update"}
                </span>
              </button>
            )}

            {(!effectiveReadOnly || (isAdmin && !isAdminView)) && (
              <button
                onClick={onSaveAll}
                disabled={loading}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 bg-[#4318FF] text-white rounded-xl font-bold text-[10px] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 tracking-wide uppercase ${loading ? "opacity-70 cursor-wait" : ""}`}
              >
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
                        <span>Submiting...</span>
                    </>
                ) : (
                    <>
                        <Save size={14} />
                        <span>Submit</span>
                    </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-x-6 gap-y-2 flex-nowrap overflow-x-auto pb-4 scrollbar-none px-2 mb-2">
          {[
            {
              label: "Full Day",
              color: "bg-[#E6FFFA]",
              border: "border-[#01B574]",
            },
            {
              label: "Half Day Leave",
              color: "bg-[#FEF3C7]",
              border: "border-[#FFB020]",
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
              label: "WFH",
              color: "bg-[#DBEAFE]",
              border: "border-[#4318FF]/20",
            },
            {
              label: "Client Visit",
              color: "bg-[#DBEAFE]",
              border: "border-[#4318FF]/20",
            },
            {
              label: "Pending Update",
              color: "bg-[#F8FAFC]",
              border: "border-[#64748B]",
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
                ? "date-highlight ring-4 ring-[#4318FF]/20 z-10 scale-[1.02]"
                : "";

            const isBlocked = isDateBlocked(day.fullDate);
            const blockedReason = isBlocked
              ? getBlockedReason(day.fullDate)
              : "";

            // Disable editing for approved Leave days only
            // WFH and Client Visit days are editable (they are present, not leave)
            // Half Day is also editable (employees can update hours)

            // Check if date is in current month or next month
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextMonthYear =
              currentMonth === 11 ? currentYear + 1 : currentYear;

            const dayMonth = day.fullDate.getMonth();
            const dayYear = day.fullDate.getFullYear();
            const isCurrentOrNextMonth =
              (dayMonth === currentMonth && dayYear === currentYear) ||
              (dayMonth === nextMonth && dayYear === nextMonthYear);

            // Check if this record is blocked due to being auto-generated from a Half Day request

            // Logic for "isEditable"
            // - Admins and Managers can edit any date (including leave days, except blocked dates)
            // - Managers can override auto-generated Half Day locks
            // - Employees can edit current month and next month (but not leave days or locked Half Days)
            // - WFH, Client Visit, and Half Day are editable (they are present, not leave)
            // - Leave days are editable only for admins and managers
            const isEditable =
              (isAdmin ? !isAdminView : !readOnly) &&
              (isAdmin ||
                isCurrentOrNextMonth ||
                isEditableMonth(day.fullDate)) &&
              !isBlocked;

            // Helper to get consistent styles for any status string
            const getStatusStyles = (statusStr: string | null | undefined, location?: string | null) => {
              const s = (statusStr || "").toLowerCase();
              const loc = (location || "").toLowerCase();
              
              if (s === "blocked") return { bg: "bg-gray-200", badge: "bg-gray-600 text-white", border: "border-transparent", text: "text-gray-600" };
              if (s === "holiday") return { bg: "bg-[#DBEAFE]", badge: "bg-[#1890FF]/70 text-white font-bold", border: "border-[#1890FF]/20", text: "text-[#1890FF]" };
              if (s === "weekend" || s === "leave") return { bg: "bg-[#FEE2E2]", badge: "bg-[#EE5D50]/70 text-white font-bold", border: "border-[#EE5D50]/10", text: "text-[#EE5D50]" };
              if (s === "full day") return { bg: "bg-[#E6FFFA]", badge: "bg-[#01B574] text-white font-bold", border: "border-[#01B574]/20", text: "text-[#01B574]" };
              if (s === "full day") return { bg: "bg-[#E6FFFA]", badge: "bg-[#01B574] text-white font-bold", border: "border-[#01B574]/20", text: "text-[#01B574]" };
              if (s.includes("half day")) return { bg: "bg-[#FEF3C7]", badge: "bg-[#FFB020]/80 text-white font-bold", border: "border-[#FFB020]/20", text: "text-[#FFB020]" };
              if (s === "absent") return { bg: "bg-[#FECACA]", badge: "bg-[#DC2626]/70 text-white font-bold", border: "border-[#DC2626]/20", text: "text-[#DC2626]" };
              if (s === "wfh" || loc === "wfh" || s === "work from home") return { bg: "bg-[#DBEAFE]", badge: "bg-[#4318FF]/70 text-white font-bold", border: "border-[#4318FF]/20", text: "text-[#4318FF]" };
              if (s === "client visit" || loc === "client visit" || loc === "client place") return { bg: "bg-[#DBEAFE]", badge: "bg-[#4318FF]/70 text-white font-bold", border: "border-[#4318FF]/20", text: "text-[#4318FF]" };
              if (loc === "office" || s === "office") return { bg: "bg-[#E6FFFA]", badge: "bg-[#01B574] text-white font-bold", border: "border-[#01B574]/20", text: "text-[#01B574]" };
              
              return { bg: "bg-[#F8FAFC]", badge: "bg-[#64748B]/90 text-white font-bold", border: "border-gray-300", text: "text-gray-600" };
            };

            // Detect Split Day
            const isSplitDay = !!day.firstHalf && !!day.secondHalf && day.firstHalf !== day.secondHalf;

            const getShortStatus = (status: string | null | undefined) => {
              const s = (status || "").toLowerCase();
              if (s.includes("work from home")) return "WFH";
              return status || "";
            };

            const isWorkLoc = (s: string | null | undefined) => {
              const lower = (s || "").toLowerCase();
              return ["wfh", "work from home", "client visit", "client place", "office"].some(k => lower.includes(k));
            };


            // Sunday/Saturday Logic
            const dayOfWeek = day.fullDate.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;
            const isSaturdayWithNoData = isSaturday && !day.workLocation && (!day.status || ["Weekend", "Pending", "Not Updated"].includes(day.status));

            // Determine Overall Styles (for border and badge)
            let displayStatus = day.status as string;
            if (holiday || (day.status as any) === "Holiday") displayStatus = "Holiday";
            // Removed explicit Blocked override here to let original status show
            // else if (isBlocked) displayStatus = "Blocked";
            else if (isSunday || isSaturdayWithNoData) displayStatus = "Weekend";

            const overallStyles = getStatusStyles(displayStatus, day.workLocation);
            
            let bgClass = overallStyles.bg;
            let badgeClass = overallStyles.badge;
            let borderClass = isSplitDay ? "border-transparent" : overallStyles.border;
            const shadowClass = "shadow-[0px_2px_15px_rgba(0,0,0,0.02)]";

            if (day.isToday) {
              bgClass = "bg-white ring-2 ring-[#4318FF] shadow-lg shadow-blue-500/20 z-10";
              borderClass = "border-transparent";
            }

            const isError = inputError?.index === idx;

            return (
              <div
                key={idx}
                id={`day-${day.fullDate.getTime()}`}
                className={`relative flex flex-col justify-between p-1 md:p-1.5 rounded-xl md:rounded-2xl border transition-all duration-300 min-h-[100px] md:min-h-[120px] group overflow-hidden 
                            ${borderClass} ${shadowClass} ${highlightClass} ${day.isToday ? bgClass : "bg-white"} ${
                              isBlocked
                                ? (isAdmin || isManager)
                                  ? "cursor-pointer"
                                  : "cursor-not-allowed"
                                : "hover:-translate-y-1 hover:shadow-lg"
                            }`}
                onClick={() => {
                  if (isBlocked && (isAdmin || isManager) && onBlockedClick) {
                    onBlockedClick();
                  }
                }}
              >
                {/* Background Layer for Split Days or Single Color */}
                <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden flex flex-col sm:flex-row">
                  {isSplitDay ? (
                      isWorkLoc(day.firstHalf) && isWorkLoc(day.secondHalf) ? (
                         <>
                           <div className="flex-1 bg-[#E6FFFA] border-b sm:border-b-0 sm:border-r border-[#01B574]/20" />
                           <div className="flex-1 bg-[#E6FFFA]" />
                         </>
                       ) : (
                         <>
                           <div className={`flex-1 ${getStatusStyles(day.firstHalf).bg}`} />
                           <div className={`flex-1 ${getStatusStyles(day.secondHalf).bg}`} />
                         </>
                       )
                  ) : (
                    !day.isToday && <div className={`flex-1 w-full h-full ${bgClass}`} />
                  )}
                </div>

                {/* Top Row: Date & Lock */}
                <div className="flex justify-between items-start z-10 mb-2">
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
                  {/* Show lock if blocked by admin OR if the month is locked for non-admins */}
                  {(isBlocked || (!isAdmin && !isCurrentOrNextMonth && !isEditableMonth(day.fullDate))) && (
                    <div className="p-1 rounded-full bg-red-50 text-red-500 border border-red-100 transition-transform hover:scale-110">
                      <ShieldBan size={10} strokeWidth={2.5} />
                    </div>
                  )}
                </div>


                {/* Middle: Input Area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 z-10 py-1 min-h-[50px]">
                  {/* Split Day Indicators - Show when firstHalf and secondHalf differ */}
                  {isSplitDay && (
                    <div className="flex gap-1.5 w-full mb-1 z-10 px-1">
                      <div className={`flex-1 py-1 rounded-md text-center text-[8px] font-bold uppercase ${getStatusStyles(day.firstHalf).badge}`}>
                        {getShortStatus(day.firstHalf)}
                      </div>
                      <div className={`flex-1 py-1 rounded-md text-center text-[8px] font-bold uppercase ${getStatusStyles(day.secondHalf).badge}`}>
                        {getShortStatus(day.secondHalf)}
                      </div>
                    </div>
                  )}
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
                  className={`w-full py-1.5 rounded-lg text-center text-[10px] font-black uppercase tracking-wider truncate px-1 shadow-sm z-10 mt-auto ${badgeClass}`}
                >
                  {(holiday || day.status === "Holiday"
                      ? holiday?.holidayName || holiday?.name || "HOLIDAY"
                      : isSunday || (isSaturdayWithNoData && !day.workLocation)
                        ? "WEEKEND"
                        : day.status === "Leave"
                          ? "LEAVE"
                          : day.workLocation &&
                              (day.status as string) !== "Leave"
                            ? day.workLocation
                            : day.status === "Half Day" ||
                                day.status === "WFH" ||
                                day.status === "Client Visit"
                              ? day.status
                              : day.status === "Absent"
                                ? "ABSENT"
                                : day.status === "Not Updated"
                                  ? "Not Updated"
                                  : day.status || "UPCOMING").replace(/Work From Home/gi, "WFH")}
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
