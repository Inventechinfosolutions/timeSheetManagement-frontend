import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  Edit,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchMonthlyAttendance } from "../reducers/employeeAttendance.reducer";
import { getEntity, setCurrentUser } from "../reducers/employeeDetails.reducer";
import { generateMonthlyEntries } from "../utils/attendanceUtils";
import AttendanceViewWrapper from "./CalenderViewWrapper";
import AttendancePieChart from "./AttendancePieChart";
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
  }, [dispatch, entity, currentEmployeeId, currentUser]);

  // Fetch Master Data (Holidays & Weekends) whenever the calendar view changes (Month/Year)
  // Removed as per user request to reduce API calling for dashboard charts
  /*
  useEffect(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth() + 1;

    dispatch(fetchHolidaysByMonthAndYear({ month, year }));
  }, [dispatch, calendarDate]);
  */

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
      if (!currentEmployeeId) return;

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

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Middle Section: Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-linear-to-br from-[#81B4FF] to-[#3B82F6] rounded-[12px] p-6 border border-transparent shadow-sm flex flex-col items-start gap-3 h-full relative overflow-hidden group hover:shadow-md transition-all">
            <div className="p-3 rounded-xl bg-[#E6FFFA] text-[#10B981]">
              <Clock size={24} strokeWidth={2} />
            </div>
            <div className="w-full">
              <h4 className="text-sm font-bold text-white mb-3">
                Total Week Hours
              </h4>
              <div className="w-full border-t border-white/20 my-2"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white">
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
                </span>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">
                  Hours
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-linear-to-br from-[#81B4FF] to-[#3B82F6] rounded-[12px] p-6 border border-transparent shadow-sm flex flex-col items-start gap-3 h-full relative overflow-hidden group hover:shadow-md transition-all">
            <div className="p-3 rounded-xl bg-[#FEF3C7] text-[#F59E0B]">
              <CalendarIcon size={24} strokeWidth={2} />
            </div>
            <div className="w-full">
              <h4 className="text-sm font-bold text-white mb-3">
                Total Monthly Hours
              </h4>
              <div className="w-full border-t border-white/20 my-2"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white">
                  {(() => {
                    const workedDays = records.filter(
                      (e) => (e.totalHours || 0) > 0,
                    );
                    return workedDays
                      .reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
                      .toFixed(1);
                  })()}
                </span>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">
                  Hours
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-linear-to-br from-[#81B4FF] to-[#3B82F6] rounded-[12px] p-6 border border-transparent shadow-sm flex flex-col items-start gap-3 h-full relative overflow-hidden group hover:shadow-md transition-all">
            <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#E11D48]">
              <AlertTriangle size={24} strokeWidth={2} />
            </div>
            <div className="w-full">
              <h4 className="text-sm font-bold text-white mb-3">
                Pending Updates
              </h4>
              <div className="w-full border-t border-white/20 my-2"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white">
                  {
                    currentMonthEntries.filter(
                      (day) =>
                        day.status === "Not Updated" &&
                        !day.isToday &&
                        !day.isFuture,
                    ).length
                  }
                </span>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">
                  Days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="w-full md:w-1/2 mx-auto">
          <AttendancePieChart
            data={currentMonthEntries}
            currentMonth={calendarDate}
            onMonthChange={(date) => {
              setCalendarDate(date);
              fetchAttendanceData(date);
            }}
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => handleNavigate(now.getTime())}
            className="px-8 py-3 rounded-xl text-white font-bold bg-linear-to-r from-[#868CFF] to-[#4318FF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2 transform active:scale-95"
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
