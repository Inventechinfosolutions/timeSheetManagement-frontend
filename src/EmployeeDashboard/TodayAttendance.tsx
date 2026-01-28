import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  Edit,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  fetchMonthlyAttendance,
  fetchDashboardStats,
} from "../reducers/employeeAttendance.reducer";
import { getEntity, setCurrentUser } from "../reducers/employeeDetails.reducer";
import { fetchEmployeeUpdates } from "../reducers/leaveNotification.reducer";
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

const TodayAttendance = ({
  setActiveTab,
  setScrollToDate,
  onNavigate,
  viewOnly = false,
}: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
  const currentEmployeeId = entity?.employeeId;
  const detailsFetched = useRef(false);
  const attendanceFetchedKey = useRef<string | null>(null);

  const [now] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());

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
      dispatch(fetchDashboardStats(currentEmployeeId));
    }
  }, [dispatch, currentEmployeeId]);

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
      if (viewOnly) return;
      if (setScrollToDate) setScrollToDate(timestamp);

      const targetDate = new Date(timestamp);
      const navTarget = "/employee-dashboard/my-timesheet";
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
    [setScrollToDate, setActiveTab, navigate],
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
        {/* Middle Section: Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          {/* Card 1 - Total Week Hours (Royal Blue Theme) */}
          <div className="bg-linear-to-br from-[#4E73DF] to-[#224ABE] rounded-[20px] p-6 shadow-lg shadow-blue-500/30 flex flex-col items-start gap-4 h-full relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Glassy Circle Decoration */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>

            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-inner z-10">
              <Clock size={28} strokeWidth={2.5} />
            </div>

            <div className="w-full z-10 mt-1">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-1">
                Total Week Hours
              </div>
              <div className="w-full border-t border-white/50 my-2"></div>
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {stats?.totalWeekHours?.toFixed(1) || "0.0"}
                </span>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mt-1">
                  Hours recorded
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          {/* Card 2 - Total Monthly Hours (Cyan Theme) */}
          <div className="bg-linear-to-br from-[#36B9CC] to-[#258391] rounded-[20px] p-6 shadow-lg shadow-cyan-500/30 flex flex-col items-start gap-4 h-full relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Glassy Circle Decoration */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>

            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-inner z-10">
              <CalendarIcon size={28} strokeWidth={2.5} />
            </div>

            <div className="w-full z-10 mt-1">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-1">
                Total Monthly Hours
              </div>
              <div className="w-full border-t border-white/50 my-2"></div>
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {stats?.totalMonthlyHours?.toFixed(1) || "0.0"}
                </span>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mt-1">
                  Hours recorded
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          {/* Card 3 - Pending Updates (Amber Theme) */}
          <div className="bg-linear-to-br from-[#F6C23E] to-[#DDA20A] rounded-[20px] p-6 shadow-lg shadow-amber-500/30 flex flex-col items-start gap-4 h-full relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Glassy Circle Decoration */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>

            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-inner z-10">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </div>

            <div className="w-full z-10 mt-1">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-1">
                Pending Updates
              </div>
              <div className="w-full border-t border-white/50 my-2"></div>
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {stats?.pendingUpdates || 0}
                </span>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mt-1">
                  Actions Required
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
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
            <WorkTrendsGraph employeeId={currentEmployeeId} />
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
