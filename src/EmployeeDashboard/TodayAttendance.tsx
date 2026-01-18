import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid,
    Clock,
    AlertTriangle,
    Edit,
    Calendar as CalendarIcon
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
    fetchMonthlyAttendance
} from '../reducers/employeeAttendance.reducer';
import { 
    getEntity,
    setCurrentUser
} from '../reducers/employeeDetails.reducer';
import { 
    generateMonthlyEntries
} from '../utils/attendanceUtils';
import Calendar from './CalendarView';
import { RootState } from '../store';

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

    // Fetch entity if missing name but we have an ID to fetch
    useEffect(() => {
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
                    .catch(err => {
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
          {/* Card 1: Total Full Days - Green */}
          <div
            onClick={() => handleNavigate(calendarDate.getTime())}
            className="group relative h-44 rounded-[30px] p-2 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/40"
            style={{
              background: "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
            }}
          >
            {/* Top Label */}
            <div className="h-[25%] flex items-center justify-center">
                <h3 className="text-white text-base font-medium tracking-wide">Total Full Days</h3>
            </div>

            {/* Glass Panel */}
            <div className="h-[75%] bg-white/20 backdrop-blur-md rounded-[24px] border border-white/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                 {/* Glossy shine reflection */}
                 <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-6xl font-bold text-white drop-shadow-md mb-2 relative z-10">
                {
                  currentMonthEntries.filter(
                    (e) =>
                      e.status === "Full Day" ||
                      e.status === "WFH" ||
                      e.status === "Client Visit"
                  ).length
                }
                </h2>
                <p className="text-white/90 text-sm font-medium tracking-wide relative z-10">Within SLA</p>
            </div>
          </div>

          {/* Card 2: Total Half Days - Orange */}
          <div
            onClick={() => handleNavigate(calendarDate.getTime())}
            className="group relative h-44 rounded-[30px] p-2 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/40"
            style={{
              background: "linear-gradient(135deg, #FDBA74 0%, #EA580C 100%)",
            }}
          >
            {/* Top Label */}
            <div className="h-[25%] flex items-center justify-center">
                <h3 className="text-white text-base font-medium tracking-wide">Total Half Days</h3>
            </div>

             {/* Glass Panel */}
            <div className="h-[75%] bg-white/20 backdrop-blur-md rounded-[24px] border border-white/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                {/* Glossy shine reflection */}
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-6xl font-bold text-white drop-shadow-md mb-2 relative z-10">
                {records.filter((r) => r.status === "Half Day").length}
                </h2>
                <p className="text-white/90 text-sm font-medium tracking-wide relative z-10">Approaching Limit</p>
            </div>
          </div>

          {/* Card 3: Total Absent Days - Red */}
          <div
            onClick={() => handleNavigate(calendarDate.getTime())}
            className="group relative h-44 rounded-[30px] p-2 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/40"
            style={{
              background: "linear-gradient(135deg, #F87171 0%, #DC2626 100%)",
            }}
          >
             {/* Top Label */}
             <div className="h-[25%] flex items-center justify-center">
                <h3 className="text-white text-base font-medium tracking-wide">Total Absent Days</h3>
            </div>

             {/* Glass Panel */}
            <div className="h-[75%] bg-white/20 backdrop-blur-md rounded-[24px] border border-white/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                 {/* Glossy shine reflection */}
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-6xl font-bold text-white drop-shadow-md mb-2 relative z-10">
                {records.filter((r) => r.status === "Leave").length}
                </h2>
                <p className="text-white/90 text-sm font-medium tracking-wide relative z-10">Action Required</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Info Cards (White) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-row items-center gap-5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
              <Clock size={24} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Total Week Hours
              </h4>
              <p className="text-3xl font-black text-gray-800 tracking-tight">
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

          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-row items-center gap-5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-xl bg-purple-50/80 flex items-center justify-center text-purple-600 shadow-sm">
              <CalendarIcon size={24} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Total Monthly Hours
              </h4>
              <p className="text-3xl font-black text-gray-800 tracking-tight">
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

          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-row items-center gap-5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-xl bg-orange-50/80 flex items-center justify-center text-orange-500 shadow-sm">
              <AlertTriangle size={24} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Pending Updates
              </h4>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-gray-800 tracking-tight">
                    {
                    currentMonthEntries.filter(
                        (day) =>
                        day.status === "Not Updated" && day.fullDate < new Date()
                    ).length
                    }
                </p>
                <span className="text-sm text-gray-400 font-bold">
                  Days
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => handleNavigate(now.getTime())}
            className="px-8 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-[#868CFF] to-[#4318FF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2 transform active:scale-95"
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
