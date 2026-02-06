import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  Edit,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  Ban,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { UserType } from "../reducers/user.reducer";
import {
  fetchMonthlyAttendance,
  fetchDashboardStats,
} from "../reducers/employeeAttendance.reducer";
import { getEntity, setCurrentUser } from "../reducers/employeeDetails.reducer";
import { fetchEmployeeUpdates, fetchUnreadNotifications } from "../reducers/leaveNotification.reducer";
import { fetchNotifications } from "../reducers/notification.reducer";
import {
  getAllLeaveRequests,
  getLeaveBalance,
  getLeaveStats,
} from "../reducers/leaveRequest.reducer";
import { generateMonthlyEntries } from "../utils/attendanceUtils";
import AttendanceViewWrapper from "./CalenderViewWrapper";
import AttendancePieChart from "./AttendancePieChart";
import WorkTrendsGraph from "./WorkTrendsGraph";
import { RootState } from "../store";

interface Props {
  setActiveTab?: (tab: string) => void;
  setScrollToDate?: (date: number | null) => void;
  onNavigate?: (timestamp: number) => void;
  viewOnly?: boolean;
}

const ENTITLEMENT = {
  FULL_TIMER: 18,
  INTERN: 12,
} as const;

const TodayAttendance = ({
  setActiveTab,
  setScrollToDate,
  onNavigate,
  viewOnly = false,
}: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { records, loading, stats } = useAppSelector(
    (state: RootState) => state.attendance,
  );
  const { entity } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state: RootState) => state.user);
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays,
  );

  // Leave Balance State
  const {
    entities: leaveEntities,
    leaveBalance,
    loading: leaveLoading,
  } = useAppSelector((state: RootState) => state.leaveRequest);

  const currentEmployeeId = entity?.employeeId;
  const detailsFetched = useRef(false);
  const attendanceFetchedKey = useRef<string | null>(null);

  const [now] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const selectedYear = calendarDate.getFullYear();

  // Fetch entity if missing name but we have an ID to fetch
  useEffect(() => {
    if (viewOnly) return;
    if (!entity?.fullName && (currentEmployeeId || currentUser?.loginId)) {
      const searchTerm = currentEmployeeId || currentUser?.loginId;
      if (searchTerm) {
        if (detailsFetched.current) return;
        detailsFetched.current = true;

        dispatch(getEntity(searchTerm))
          .unwrap()
          .then((found) => {
            if (found) {
              dispatch(setCurrentUser(found));
            }
          })
          .catch((err) => {
            detailsFetched.current = false; // Reset on failure so it can retry
            console.error("Failed to fetch employee details:", err);
          });
      }
    }
  }, [dispatch, entity, currentEmployeeId, currentUser, viewOnly]);

  // Refresh updates whenever dashboard is accessed
  useEffect(() => {
    if (currentEmployeeId && currentEmployeeId !== "Admin") {
      dispatch(fetchEmployeeUpdates(currentEmployeeId));
      dispatch(fetchNotifications(currentEmployeeId));
      dispatch(fetchUnreadNotifications());
      dispatch(fetchDashboardStats({ employeeId: currentEmployeeId }));
      dispatch(
        fetchDashboardStats({
          employeeId: currentEmployeeId,
          month: (calendarDate.getMonth() + 1).toString().padStart(2, "0"),
          year: calendarDate.getFullYear().toString(),
        }),
      );

      // Leave Balance Refresh
      dispatch(
        getLeaveBalance({ employeeId: currentEmployeeId, year: selectedYear }),
      );
      dispatch(
        getLeaveStats({
          employeeId: currentEmployeeId,
          year: String(selectedYear),
        }),
      );
      dispatch(
        getAllLeaveRequests({
          employeeId: currentEmployeeId,
          year: String(selectedYear),
          limit: 500,
        }),
      );
    }
  }, [dispatch, currentEmployeeId, calendarDate]);

  // Leave Balance Logic
  const isIntern = useMemo(() => {
    const designation = (entity?.designation ?? entity?.designation_name ?? "")
      .toString()
      .toLowerCase();
    return designation.includes("intern");
  }, [entity?.designation, entity?.designation_name]);

  const {
    paidUsed,
    lopUsed,
    approvedUsed,
    paidUsedYTD,
    lopUsedYTD,
    paidUsedBefore,
  } = useMemo(() => {
    if (!Array.isArray(leaveEntities))
      return {
        paidUsed: 0,
        lopUsed: 0,
        approvedUsed: 0,
        paidUsedYTD: 0,
        lopUsedYTD: 0,
        paidUsedBefore: 0,
      };

    const selYear = calendarDate.getFullYear();
    const selMonth = calendarDate.getMonth() + 1;
    const currentYearMonth = `${selYear}-${selMonth.toString().padStart(2, "0")}`;

    const approvedLeavesAll = leaveEntities.filter(
      (e: any) =>
        (e.requestType === "Apply Leave" || e.requestType === "Leave") &&
        e.status === "Approved",
    );

    // Leaves in the selected YEAR but in months BEFORE the selected month
    const approvedLeavesBefore = approvedLeavesAll.filter((e: any) => {
      if (!e.fromDate) return false;
      const [y, m] = e.fromDate.split("-").map(Number);
      return y === selYear && m < selMonth;
    });

    const approvedLeavesMonthly = approvedLeavesAll.filter(
      (e: any) => e.fromDate && e.fromDate.substring(0, 7) === currentYearMonth,
    );

    if (!isIntern) {
      return {
        paidUsed: approvedLeavesMonthly.length,
        lopUsed: 0,
        approvedUsed: approvedLeavesMonthly.length,
        paidUsedYTD: approvedLeavesAll.length,
        lopUsedYTD: 0,
        paidUsedBefore: approvedLeavesBefore.length,
      };
    }

    // Intern Monthly
    const monthlyLeaves: Record<string, number> = {};
    approvedLeavesMonthly.forEach((e: any) => {
      if (e.fromDate) {
        const m = e.fromDate.substring(0, 7);
        monthlyLeaves[m] = (monthlyLeaves[m] || 0) + 1;
      }
    });

    let paidM = 0;
    let lopM = 0;
    Object.values(monthlyLeaves).forEach((count) => {
      paidM += 1;
      lopM += count - 1;
    });

    // Intern YTD
    const monthlyLeavesYTD: Record<string, number> = {};
    approvedLeavesAll.forEach((e: any) => {
      if (e.fromDate) {
        const m = e.fromDate.substring(0, 7);
        monthlyLeavesYTD[m] = (monthlyLeavesYTD[m] || 0) + 1;
      }
    });

    let paidYTD = 0;
    let lopYTD = 0;
    Object.values(monthlyLeavesYTD).forEach((count) => {
      paidYTD += 1;
      lopYTD += count - 1;
    });

    // Intern Before Selected Month
    const monthlyLeavesBefore: Record<string, number> = {};
    approvedLeavesBefore.forEach((e: any) => {
      if (e.fromDate) {
        const m = e.fromDate.substring(0, 7);
        monthlyLeavesBefore[m] = (monthlyLeavesBefore[m] || 0) + 1;
      }
    });

    let paidB = 0;
    Object.values(monthlyLeavesBefore).forEach(() => {
      paidB += 1;
    });

    return {
      paidUsed: paidM,
      lopUsed: lopM,
      approvedUsed: approvedLeavesMonthly.length,
      paidUsedYTD: paidYTD,
      lopUsedYTD: lopYTD,
      paidUsedBefore: paidB,
    };
  }, [leaveEntities, isIntern, calendarDate]);

  const entitlement = useMemo(() => {
    if (leaveBalance && String(leaveBalance.year) === String(selectedYear)) {
      return leaveBalance.entitlement;
    }
    return isIntern ? ENTITLEMENT.INTERN : ENTITLEMENT.FULL_TIMER;
  }, [leaveBalance, selectedYear, isIntern]);

  const dynamicCarryOver = useMemo(() => {
    const backendCarryOver = !isIntern ? leaveBalance?.carryOver || 0 : 0;
    const selMonth = calendarDate.getMonth() + 1;
    const monthlyAccrual = isIntern ? 1 : 1.5;
    const totalAccruedSoFar = (selMonth - 1) * monthlyAccrual;
    return Math.max(0, backendCarryOver + totalAccruedSoFar - paidUsedBefore);
  }, [leaveBalance, isIntern, calendarDate, paidUsedBefore]);

  const pendingCount = useMemo(() => {
    if (!Array.isArray(leaveEntities)) return 0;
    const currentYearMonth = `${calendarDate.getFullYear()}-${(calendarDate.getMonth() + 1).toString().padStart(2, "0")}`;
    return leaveEntities.filter(
      (e: any) =>
        (e.requestType === "Apply Leave" || e.requestType === "Leave") &&
        (e.status === "Pending" || e.status === "pending") &&
        e.fromDate &&
        e.fromDate.substring(0, 7) === currentYearMonth,
    ).length;
  }, [calendarDate, leaveEntities]);

  const balance = useMemo(() => {
    const carryOver = !isIntern ? leaveBalance?.carryOver || 0 : 0;
    if (leaveBalance && String(leaveBalance.year) === String(selectedYear)) {
      return leaveBalance.balance + carryOver;
    }
    return Math.max(0, entitlement + carryOver - paidUsedYTD);
  }, [leaveBalance, selectedYear, entitlement, paidUsedYTD, isIntern]);

  const balanceMonthly = useMemo(() => {
    const monthlyEntitlement = isIntern ? 1 : 1.5;
    return Math.max(0, monthlyEntitlement - paidUsed);
  }, [isIntern, paidUsed]);

  // 1. Separate "Today's" Data - ALWAYS based on current real-time Month
  const todayStatsEntry = useMemo(() => {
    // Generate entries for the ACTUAL current month (now)
    const entries = generateMonthlyEntries(now, now, records);
    return entries.find((e) => e.isToday) || null;
  }, [now, records]);

  // 2. Calendar / Stats Data - Based on SELECTED `calendarDate`
  const currentMonthEntries = useMemo(() => {
    const entries = generateMonthlyEntries(calendarDate, now, records);

    // Merge Master Holidays to align with MyTimesheet logic
    return entries.map((day) => {
      const dateStr = `${day.fullDate.getFullYear()}-${String(
        day.fullDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(day.fullDate.getDate()).padStart(2, "0")}`;
      const isMasterHoliday = holidays.find((h) => {
        const hDate = h.date || (h as any).holidayDate;
        if (!hDate) return false;
        return (
          (typeof hDate === "string"
            ? hDate.split("T")[0]
            : new Date(hDate).toISOString().split("T")[0]) === dateStr
        );
      });

      if (isMasterHoliday) {
        if (
          day.status !== "Full Day" &&
          day.status !== "Half Day" &&
          day.status !== "WFH" &&
          day.status !== "Client Visit"
        ) {
          return { ...day, status: "Holiday" };
        }
      }
      return day;
    });
  }, [calendarDate, now, records, holidays]);

  const displayEntry =
    todayStatsEntry ||
    ({
      fullDate: now,
      status: "Pending",
      isSaved: false,
      isToday: true,
    } as any);

  const fetchAttendanceData = useCallback(
    (date: Date) => {
      if (!currentEmployeeId || currentEmployeeId === "Admin") return;

      const fetchKey = `${currentEmployeeId}-${
        date.getMonth() + 1
      }-${date.getFullYear()}`;
      if (attendanceFetchedKey.current === fetchKey) return;
      attendanceFetchedKey.current = fetchKey;

      dispatch(
        fetchMonthlyAttendance({
          employeeId: currentEmployeeId,
          month: (date.getMonth() + 1).toString().padStart(2, "0"),
          year: date.getFullYear().toString(),
        }),
      );
    },
    [dispatch, currentEmployeeId],
  );

  useEffect(() => {
    fetchAttendanceData(now);
  }, [fetchAttendanceData, now]);

  const handleDateNavigator = useCallback(
    (timestamp: number) => {
      if (setScrollToDate) setScrollToDate(timestamp);

      const targetDate = new Date(timestamp);
      const isPrivilegedUser = 
        currentUser?.userType === UserType.ADMIN || 
        currentUser?.userType === UserType.MANAGER || 
        currentUser?.userType === UserType.TEAM_LEAD;

      // Handle Privileged User viewing someone else (ONLY when explicitly in view-only mode)
      if (viewOnly && isPrivilegedUser && currentEmployeeId && currentEmployeeId !== currentUser?.employeeId) {
        const dateStr = targetDate.toISOString().split("T")[0];
        const basePath = location.pathname.startsWith("/manager-dashboard") 
          ? "/manager-dashboard" 
          : "/admin-dashboard";
          
        navigate(`${basePath}/timesheet/${currentEmployeeId}/${dateStr}`, {
          state: {
            selectedDate: targetDate.toISOString(),
            timestamp: targetDate.getTime(),
          }
        });
        return;
      }

      // If viewOnly is true and not a privileged user viewing someone else, we stop here
      if (viewOnly) return;
      
      // Dynamic base path detection for self-view
      let basePath = "/employee-dashboard";
      if (location.pathname.startsWith("/manager-dashboard")) {
        basePath = "/manager-dashboard";
      } else if (location.pathname.startsWith("/admin-dashboard")) {
        basePath = "/admin-dashboard";
      }
      
      const navTarget = `${basePath}/my-timesheet`;
      const state = {
        selectedDate: targetDate.toISOString(),
        timestamp: targetDate.getTime(),
      };

      if (setActiveTab) {
        setActiveTab("My Timesheet");
      } else {
        navigate(navTarget, { state });
      }
    },
    [viewOnly, setScrollToDate, setActiveTab, navigate, location.pathname, currentUser, currentEmployeeId],
  );

  const handleNavigate = (timestamp: number) => {
    if (onNavigate) {
      onNavigate(timestamp);
    } else {
      handleDateNavigator(timestamp);
    }
  };

  if (!todayStatsEntry && loading)
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-[#00A3C4]/20 border-t-[#00A3C4] rounded-full animate-spin"></div>
      </div>
    );

  if (!todayStatsEntry && !loading && records.length === 0)
    return (
      <div className="p-8 text-center text-gray-500">Initializing entry...</div>
    );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50/50">
      {/* Header */}
      {!viewOnly && (
        <div className="px-6 py-5 bg-linear-to-r from-blue-100 via-blue-50 to-white border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2559]">
              Employee Dashboard
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Welcome back,{" "}
              {entity?.firstName ||
                entity?.fullName ||
                currentUser?.aliasLoginName ||
                "Employee"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#F4F7FE] rounded-lg text-sm font-bold text-[#2B3674]">
              {displayEntry.fullDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Month Selector Section */}
        <div className="flex justify-center md:justify-end mb-2">
          <div className="inline-flex items-center bg-white rounded-full px-6 py-2 shadow-sm border border-gray-100/50 gap-6">
            <button
              onClick={() => {
                const prev = new Date(calendarDate);
                prev.setMonth(prev.getMonth() - 1);
                setCalendarDate(prev);
              }}
              className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-[#4318FF] hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            <span className="text-[#1B2559] font-bold min-w-[140px] text-center text-sm md:text-base selection:bg-none tracking-tight">
              {calendarDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>

            <button
              onClick={() => {
                const next = new Date(calendarDate);
                next.setMonth(next.getMonth() + 1);
                setCalendarDate(next);
              }}
              className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-[#4318FF] hover:scale-110 active:scale-95"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Top Section: Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Card 1 - Total Monthly Hours */}
          <div className="bg-linear-to-br from-[#36B9CC] to-[#258391] rounded-[20px] p-4 shadow-lg shadow-cyan-500/20 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-inner z-10">
              <CalendarIcon size={20} strokeWidth={2.5} />
            </div>
            <div className="w-full z-10">
              <div className="text-white/90 font-bold text-[10px] uppercase tracking-wider mb-1">
                Monthly Hours
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {stats?.totalMonthlyHours?.toFixed(1) || "0.0"}
                </span>
                <span className="text-[9px] font-bold text-white/70 uppercase mt-1">
                  In {now.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 - Entitlement */}
          <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-[#4318FF] transition-colors group-hover:bg-blue-100">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div className="w-full">
              <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
                Entitlement
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
                  {entitlement}
                </span>
                <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
                  Annual Pack
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 - Carry Over (Full-timers only) */}
          {!isIntern && (
            <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-[#7551FF] transition-colors group-hover:bg-indigo-100">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <div className="w-full">
                <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
                  Carry Over
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
                    {dynamicCarryOver.toFixed(1)}
                  </span>
                  <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
                    Rolled Over
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card 4 - Leaves Taken */}
          <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-50 text-[#05CD99] transition-colors group-hover:bg-green-100">
              <CheckCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="w-full">
              <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
                Leaves Taken
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
                  {isIntern ? paidUsed : approvedUsed}
                </span>
                <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
                  Approved
                </span>
              </div>
            </div>
          </div>

          {/* Card 4 - LOP */}
          <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-[#EE5D50] transition-colors group-hover:bg-red-100">
              <Ban size={20} strokeWidth={2.5} />
            </div>
            <div className="w-full">
              <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
                LOP
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
                  {lopUsed}
                </span>
                <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
                  Loss of Pay
                </span>
              </div>
            </div>
          </div>

          {/* Card 5 - Pending */}
          <div className="bg-white rounded-[20px] p-4 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 text-[#FFB547] transition-colors group-hover:bg-amber-100">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <div className="w-full">
              <div className="text-[#A3AED0] font-bold text-[10px] uppercase tracking-wider mb-1">
                Pending
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-[#1B2559] tracking-tight">
                  {pendingCount}
                </span>
                <span className="text-[9px] font-bold text-[#A3AED0] uppercase mt-1">
                  Awaiting Approval
                </span>
              </div>
            </div>
          </div>

          {/* Card 6 - Balance */}
          <div className="bg-linear-to-br from-[#4318FF] to-[#3B15E0] rounded-[20px] p-4 shadow-lg shadow-blue-500/30 flex flex-col items-start gap-3 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-inner z-10">
              <ClipboardList size={20} strokeWidth={2.5} />
            </div>
            <div className="w-full z-10">
              <div className="text-white/90 font-bold text-[10px] uppercase tracking-wider mb-1">
                Balance
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white tracking-tight">
                    {balance}
                  </span>
                  <span className="text-[10px] font-bold text-white/60 uppercase">
                    Annual
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-bold text-white/90">
                    {balanceMonthly.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-medium text-white/60">
                    This Month
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="w-full">
            <AttendancePieChart
              data={currentMonthEntries}
              currentMonth={calendarDate}
              onMonthChange={(date) => {
                setCalendarDate(date);
                fetchAttendanceData(date);
              }}
            />
          </div>
          <div className="w-full">
            <WorkTrendsGraph 
              employeeId={currentEmployeeId} 
              currentMonth={calendarDate}
            />
          </div>
        </div>

        {!viewOnly && (
          <div className="flex justify-center">
            <button
              onClick={() => handleNavigate(now.getTime())}
              className="px-8 py-3 rounded-xl text-white font-bold bg-linear-to-r from-[#868CFF] to-[#4318FF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Edit size={18} />
              <span>Update Today's Attendance</span>
            </button>
          </div>
        )}

        {/* Bottom Section: Calendar/List */}
        <div className="bg-white rounded-xl shadow-[0px_10px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#1B2559]">
              Attendance List
            </h3>
            <div className="flex gap-2">
              <div className="text-xs px-3 py-1 bg-gray-50 rounded-full text-gray-500 border border-gray-100">
                All Statuses
              </div>
            </div>
          </div>
          <div className="p-4">
            <AttendanceViewWrapper
              now={now}
              currentDate={calendarDate}
              entries={currentMonthEntries as any}
              onMonthChange={(date) => {
                setCalendarDate(date);
                fetchAttendanceData(date);
              }}
              onNavigateToDate={(day) => {
                const targetDate = new Date(
                  calendarDate.getFullYear(),
                  calendarDate.getMonth(),
                  day,
                );
                handleNavigate(targetDate.getTime());
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayAttendance;
