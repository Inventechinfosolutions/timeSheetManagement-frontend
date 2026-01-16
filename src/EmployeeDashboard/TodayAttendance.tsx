import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Clock, AlertTriangle, Edit } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchMonthlyAttendance } from "../reducers/employeeAttendance.reducer";
import {
  getEntities,
  setCurrentUser,
} from "../reducers/employeeDetails.reducer";
import { generateMonthlyEntries } from "../utils/attendanceUtils";
import Calendar from "./CalendarView";
import { RootState } from "../store";

interface Props {
  setActiveTab?: (tab: string) => void;
  setScrollToDate?: (date: number | null) => void;
  onNavigate?: (timestamp: number) => void;
}

const TodayAttendance = ({
  setActiveTab,
  setScrollToDate,
  onNavigate,
}: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { records, loading } = useAppSelector(
    (state: RootState) => state.attendance
  );
  const { entity } = useAppSelector(
    (state: RootState) => state.employeeDetails
  );
  const { currentUser } = useAppSelector((state: RootState) => state.user);
  const currentEmployeeId = entity?.employeeId;
  const detailsFetched = useRef(false);
  const attendanceFetchedKey = useRef<string | null>(null);

  const [now] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Fetch entity if missing name but we have an ID to search for
  useEffect(() => {
    if (!entity?.fullName && (currentEmployeeId || currentUser?.loginId)) {
      const searchTerm = currentEmployeeId || currentUser?.loginId;
      if (searchTerm) {
        if (detailsFetched.current) return;
        detailsFetched.current = true;

        dispatch(getEntities({ page: 1, limit: 1, search: searchTerm }))
          .unwrap()
          .then((response) => {
            const data = Array.isArray(response)
              ? response
              : response.data || [];
            // Prefer exact match on employeeId if searching by it
            const found =
              data.find(
                (u: any) =>
                  u.employeeId === searchTerm || u.email === searchTerm
              ) || data[0];

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
  }, [dispatch, entity, currentEmployeeId, currentUser]);

  // 1. Separate "Today's" Data - ALWAYS based on current real-time Month
  // This ensures "Today's Attendance" card never changes when navigating calendar
  const todayStatsEntry = useMemo(() => {
    // Generate entries for the ACTUAL current month (now)
    const entries = generateMonthlyEntries(now, now, records);
    return entries.find((e) => e.isToday) || null;
  }, [now, records]);

  // 2. Calendar / Stats Data - Based on SELECTED `calendarDate`
  // This drives the "This Month" stats and the Calendar grid
  const currentMonthEntries = useMemo(() => {
    return generateMonthlyEntries(calendarDate, now, records);
  }, [calendarDate, now, records]);

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
      if (!currentEmployeeId) return; // Guard to prevent calls with undefined ID

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
        })
      );
    },
    [dispatch, currentEmployeeId]
  );

  useEffect(() => {
    fetchAttendanceData(now);
  }, [fetchAttendanceData, now]);

  const handleDateNavigator = useCallback(
    (timestamp: number) => {
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
    [setScrollToDate, setActiveTab, navigate]
  );

  const handleNavigate = (timestamp: number) => {
    if (onNavigate) {
      onNavigate(timestamp);
    } else {
      handleDateNavigator(timestamp); // Using the new handleDateNavigator
    }
  };

  if (!todayStatsEntry && loading)
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-[#00A3C4]/20 border-t-[#00A3C4] rounded-full animate-spin"></div>
      </div>
    );

  // Initial fallback if loading not started yet
  if (!todayStatsEntry && !loading && records.length === 0)
    return (
      <div className="p-8 text-center text-gray-500">Initializing entry...</div>
    );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50/50">
      {/* Header - "Application Intake" Reference Style */}
      <div className="px-6 py-5 bg-white border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Top Row: Colorful Stats Cards (Reference Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Green (Full Days) */}
          <div
            onClick={() => handleNavigate(calendarDate.getTime())}
            className="rounded-xl p-6 relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-300 shadow-sm"
            style={{ backgroundColor: "#05CD99" }}
          >
            <div className="flex flex-col items-center justify-center text-center h-full text-white">
              <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
                Total Full Days
              </p>
              <h3 className="text-5xl font-black mb-1">
                {
                  currentMonthEntries.filter(
                    (e) =>
                      e.status === "Full Day" ||
                      e.status === "WFH" ||
                      e.status === "Client Visit"
                  ).length
                }
              </h3>
              <p className="text-xs font-medium opacity-80">Within SLA</p>
            </div>
          </div>

          {/* Card 2: Orange (Half Days) */}
          <div
            onClick={() => handleNavigate(calendarDate.getTime())}
            className="rounded-xl p-6 relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-300 shadow-sm"
            style={{ backgroundColor: "#FFB020" }}
          >
            <div className="flex flex-col items-center justify-center text-center h-full text-white">
              <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
                Total Half Days
              </p>
              <h3 className="text-5xl font-black mb-1">
                {records.filter((r) => r.status === "Half Day").length}
              </h3>
              <p className="text-xs font-medium opacity-80">
                Approaching Limit
              </p>
            </div>
          </div>

          {/* Card 3: Red (Absent) */}
          <div
            onClick={() => handleNavigate(calendarDate.getTime())}
            className="rounded-xl p-6 relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-300 shadow-sm"
            style={{ backgroundColor: "#EE5D50" }}
          >
            <div className="flex flex-col items-center justify-center text-center h-full text-white">
              <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
                Total Absent Days
              </p>
              <h3 className="text-5xl font-black mb-1">
                {records.filter((r) => r.status === "Leave").length}
              </h3>
              <p className="text-xs font-medium opacity-80">Action Required</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Info Cards (White) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Total Week Hours
              </h4>
              <p className="text-2xl font-bold text-[#1B2559] mt-1">
                {(() => {
                  const d = new Date(now);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  const weekStart = new Date(d.setDate(diff));
                  weekStart.setHours(0, 0, 0, 0);
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  weekEnd.setHours(23, 59, 59, 999);

                  const weekEntries = records.filter((r) => {
                    const rawDate = r.workingDate || (r as any).working_date;
                    if (!rawDate) return false;
                    const rDate = new Date(rawDate);
                    return rDate >= weekStart && rDate <= weekEnd;
                  });
                  return weekEntries
                    .reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
                    .toFixed(1);
                })()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Total Monthly Hours
              </h4>
              <p className="text-2xl font-bold text-[#1B2559] mt-1">
                {(() => {
                  const workedDays = records.filter(
                    (e) => (e.totalHours || 0) > 0
                  );
                  return workedDays
                    .reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
                    .toFixed(1);
                })()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Pending Updates
              </h4>
              <p className="text-2xl font-bold text-[#1B2559] mt-1">
                {
                  currentMonthEntries.filter(
                    (day) =>
                      day.status === "Not Updated" && day.fullDate < new Date()
                  ).length
                }{" "}
                <span className="text-xs text-gray-400 font-normal ml-1">
                  Days
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleNavigate(now.getTime())}
            className="px-8 py-3 rounded-xl text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center gap-2 transform active:scale-95"
            style={{
              background: "linear-gradient(90deg, #2563EB 0%, #1E40AF 100%)",
            }}
          >
            <Edit size={18} />
            <span>Update Today's Attendance</span>
          </button>
        </div>

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
            <Calendar
              now={now}
              currentDate={calendarDate}
              entries={currentMonthEntries}
              onMonthChange={(date) => {
                setCalendarDate(date);
                fetchAttendanceData(date);
              }}
              onNavigateToDate={(day) => {
                const targetDate = new Date(
                  calendarDate.getFullYear(),
                  calendarDate.getMonth(),
                  day
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
