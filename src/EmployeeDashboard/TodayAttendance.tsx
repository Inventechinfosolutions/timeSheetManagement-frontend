import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutGrid,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  LogOut,
  LogIn,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchMonthlyAttendance } from "../reducers/employeeAttendance.reducer";
import {
  generateMonthlyEntries,
  calculateTotal
} from "../utils/attendanceUtils";
// import CalendarView from "./Calendar";
import { RootState } from "../store";
import CalendarView from "./CalendarView";

const TodayAttendance = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { records, loading } = useAppSelector(
    (state: RootState) => state.attendance
  );
  const { entity } = useAppSelector(
    (state: RootState) => state.employeeDetails
  );
  const currentEmployeeId = entity?.employeeId || "EMP001";

  const [now] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Summary entries for the current month
  const currentMonthEntries = useMemo(() => {
    const entries = generateMonthlyEntries(calendarDate, now, records);
    return entries.map((e) => {
      const loginClean =
        e.loginTime?.includes("NaN") || e.loginTime === "00:00:00"
          ? ""
          : e.loginTime || "";
      const logoutClean =
        e.logoutTime?.includes("NaN") || e.logoutTime === "00:00:00"
          ? ""
          : e.logoutTime || "";
      return {
        ...e,
        loginTime: loginClean,
        logoutTime: logoutClean,
        isSaved: e.isSaved && !!loginClean,
        isSavedLogout: e.isSavedLogout && !!logoutClean,
      };
    });
  }, [calendarDate, now, records]);

  // Find today's entry specifically
  const todayEntry = useMemo(() => {
    const entry =
      currentMonthEntries.find((e) => e.isToday) || currentMonthEntries[0];
    return entry;
  }, [currentMonthEntries]);

  const fetchAttendanceData = useCallback(
    (date: Date) => {
      dispatch(
        fetchMonthlyAttendance({
          employeeId: currentEmployeeId,
          month: (date.getMonth() + 1).toString(),
          year: date.getFullYear().toString(),
        })
      );
    },
    [dispatch, currentEmployeeId]
  );

  useEffect(() => {
    fetchAttendanceData(now);
  }, [fetchAttendanceData, now]);

  const handleNavigate = (_date: number) => {
    navigate("/employee-dashboard/my-timesheet");
  };

  if (!todayEntry && loading)
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-[#00A3C4]/20 border-t-[#00A3C4] rounded-full animate-spin"></div>
      </div>
    );

  if (!todayEntry)
    return (
      <div className="p-8 text-center text-gray-500">Initializing entry...</div>
    );

  return (
    <>
      <header className="bg-[#F4F7FE] md:bg-opacity-50 backdrop-blur-sm sticky top-0 md:relative z-10 px-4 md:px-8 py-5 md:py-5 flex flex-col md:flex-row items-center md:items-center justify-between gap-4 border-b border-gray-100/50 md:border-none">
        <h2 className="text-xl md:text-2xl font-bold text-[#2B3674] tracking-tight text-center md:text-left">
          Today's Attendance
        </h2>

        <div className="flex flex-row flex-wrap items-center gap-3">
          <div className="bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-full shadow-sm border border-gray-100 shrink-0">
            <span className="text-[12px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
              {todayEntry.fullDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {todayEntry.status === "Leave" ? (
              <div className="px-3 md:px-4 py-1.5 md:py-2 bg-[#FFF5F5] text-[#F53636] rounded-xl md:rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 uppercase tracking-wide shadow-sm">
                <AlertTriangle className="w-3 md:w-3.5 h-3 md:h-3.5" /> Leave
              </div>
            ) : todayEntry.status === "Pending" ? (
              <div className="px-3 md:px-4 py-1.5 md:py-2 bg-[#FFF9E5] text-[#FFB020] rounded-xl md:rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 uppercase tracking-wide shadow-sm">
                <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" />{" "}
                {!todayEntry.loginTime || todayEntry.loginTime === "--:--"
                  ? "Login Pending"
                  : "In Progress"}
              </div>
            ) : (
              <div className="px-3 md:px-4 py-1.5 md:py-2 bg-[#E6FFFA] text-[#01B574] rounded-xl md:rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 uppercase tracking-wide shadow-sm">
                <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5" />{" "}
                {todayEntry.status.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 pb-8 space-y-6">
        {/* Status Cards */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Login Time */}
            <div className="bg-[#E9FBF5] rounded-xl p-5 border-l-4 border-[#01B574] relative overflow-hidden group hover:shadow-md transition-all">
              <p className="text-gray-500 text-sm font-medium mb-3">
                Login Time
              </p>
              <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                <span
                  className={`text-xl font-bold ${
                    todayEntry.loginTime ? "text-[#2B3674]" : "text-gray-400"
                  }`}
                >
                  {todayEntry.loginTime || "--:--"}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    todayEntry.isSaved
                      ? "bg-[#E9FBF5] text-[#01B574]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {todayEntry.isSaved ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
              </div>
            </div>

            {/* Logout Time */}
            <div
              className={`rounded-xl p-5 border-l-4 transition-all relative overflow-hidden group hover:shadow-md bg-[#FDF2F2] border-red-500`}
            >
              <p className="text-gray-500 text-sm font-medium mb-3">
                Logout Time
              </p>
              <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                <span
                  className={`text-xl font-bold tracking-wider ${
                    todayEntry.logoutTime ? "text-[#2B3674]" : "text-gray-400"
                  }`}
                >
                  {todayEntry.logoutTime || "--:--"}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-[#FDF2F2] text-red-500`}
                >
                  {todayEntry.isSavedLogout ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
              </div>
            </div>

            {/* Total Hours */}
            <div className="bg-[#F4F7FE] rounded-xl p-5 border-l-4 border-[#4318FF] relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <p className="text-gray-500 text-sm font-medium">
                  Average working hours
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#4318FF] tracking-wider">
                  {calculateTotal(
                    todayEntry.loginTime || "",
                    todayEntry.logoutTime || ""
                  )}
                </span>
                <span className="text-sm font-medium text-gray-400">hours</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {!todayEntry.loginTime ? (
              <button
                onClick={() => navigate("/employee-dashboard/my-timesheet")}
                className="px-6 py-2.5 bg-[#01B574] text-white rounded-xl font-bold hover:bg-[#009e65] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 min-w-[170px]"
              >
                <LogIn size={18} />
                <span>Clock In Now</span>
              </button>
            ) : !todayEntry.logoutTime ? (
              <button
                onClick={() => navigate("/employee-dashboard/my-timesheet")}
                className="px-6 py-2.5 bg-[#EE5D50] text-white rounded-xl font-bold hover:bg-[#e04c3e] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100 min-w-[170px]"
              >
                <LogOut size={18} />
                <span>Clock Out Now</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[#01B574] font-bold bg-[#E9FBF5] px-4 py-2.5 rounded-xl border border-[#01B574]/20 w-fit">
                <CheckCircle2 size={18} />
                Day Completed
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] group-hover:scale-110 transition-transform">
                <CalendarCheck size={24} />
              </div>
              <span className="px-3 py-1 bg-[#E6FFFA] text-[#01B574] rounded-full text-[10px] font-bold uppercase tracking-wider">
                This Month
              </span>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                {
                  currentMonthEntries.filter((e) =>
                    ["Full Day", "Half Day", "WFH", "Client Visit"].includes(
                      e.status
                    )
                  ).length
                }
              </h4>
              <p className="text-gray-500 text-sm font-medium">
                Total Full Days
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <span className="px-3 py-1 bg-[#F4F7FE] text-[#4318FF] rounded-full text-[10px] font-bold uppercase tracking-wider">
                This Month
              </span>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                {todayEntry.loginTime && todayEntry.logoutTime
                  ? calculateTotal(todayEntry.loginTime, todayEntry.logoutTime)
                  : "0.0"}
              </h4>
              <p className="text-gray-500 text-sm font-medium">
                Average working hours
              </p>
            </div>
          </div>

          <div
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group"
            onClick={() => navigate("/employee-dashboard/my-timesheet")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF9E5] flex items-center justify-center text-[#FFB020] group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <span className="px-3 py-1 bg-[#FFF9E5] text-[#FFB020] rounded-full text-[10px] font-bold uppercase tracking-wider">
                Action Needed
              </span>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                {
                  currentMonthEntries.filter(
                    (day) => day.status === "Not Updated"
                  ).length
                }
              </h4>
              <p className="text-gray-500 text-sm font-medium">
                Incomplete Days
              </p>
            </div>
          </div>
        </div>

        <CalendarView
          entries={currentMonthEntries}
          now={now}
          currentDate={calendarDate}
          onMonthChange={(date) => {
            setCalendarDate(date);
            fetchAttendanceData(date);
          }}
          onNavigateToDate={handleNavigate}
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 pb-8">
          <button
            onClick={() => navigate("/employee-dashboard/timesheet-view")}
            className="w-full sm:w-auto px-6 py-3 bg-white border border-[#00A3C4] text-[#00A3C4] rounded-xl font-bold hover:bg-[#E6FFFA] transition-colors flex items-center justify-center gap-2"
          >
            <LayoutGrid size={18} /> View Full Timesheet
          </button>
          <button
            onClick={() => navigate("/employee-dashboard/my-timesheet")}
            className="w-full sm:w-auto px-6 py-3 bg-[#00A3C4] text-white rounded-xl font-bold hover:bg-[#0093b1] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-100"
          >
            <Edit size={18} /> Detailed Records
          </button>
        </div>
      </div>
    </>
  );
};

export default TodayAttendance;
