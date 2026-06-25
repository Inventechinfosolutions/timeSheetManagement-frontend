import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  TrendingUp,
  Clock,
  Briefcase,
  AlertCircle,
  MapPin,
  Laptop,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { AttendanceStatus, UserType } from "../enums";
import { fetchEmployeeDashboard } from "../reducers/employeeAttendance.reducer";
import { getEntity, setCurrentUser } from "../reducers/employeeDetails.reducer";
import { generateMonthlyEntries } from "../utils/attendanceUtils";
import AttendanceViewWrapper from "./CalenderViewWrapper";
import AttendancePieChart from "./AttendancePieChart";
import WorkTrendsGraph from "./WorkTrendsGraph";
import AttendanceStatsCards from "./AttendanceStatsCards";
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
  const location = useLocation();
  const { employeeId: urlEmployeeId } = useParams<{ employeeId: string }>();
  const { records, loading, yearlyRecords, trends } = useAppSelector(
    (state: RootState) => state.attendance,
  );
  const { entity } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state: RootState) => state.user);
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays,
  );

  const {
    leaveBalance,
    monthlyLeaveBalance,
    loading: leaveLoading,
  } = useAppSelector((state: RootState) => state.leaveRequest);

  const isMyRoute =
    location.pathname.includes("my-dashboard") ||
    location.pathname.includes("my-timesheet") ||
    location.pathname === "/employee-dashboard" ||
    location.pathname === "/employee-dashboard/";

  const currentEmployeeId = isMyRoute
    ? currentUser?.employeeId || currentUser?.loginId
    : urlEmployeeId ||
      entity?.employeeId ||
      currentUser?.employeeId ||
      currentUser?.loginId;

  const detailsFetched = useRef(false);
  const dashboardFetchedKey = useRef<string | null>(null);
  const prevEmployeeId = useRef<string | undefined>();

  const [now] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchDashboardData = useCallback(
    (date: Date) => {
      if (!currentEmployeeId || currentEmployeeId === "Admin") return;

      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear().toString();
      const fetchKey = `${currentEmployeeId}-${month}-${year}`;

      if (dashboardFetchedKey.current === fetchKey) return;
      dashboardFetchedKey.current = fetchKey;

      dispatch(
        fetchEmployeeDashboard({
          employeeId: currentEmployeeId,
          month,
          year,
        }),
      );
    },
    [dispatch, currentEmployeeId],
  );

  useEffect(() => {
    if (viewOnly) return;

    const needsFetch =
      !entity?.fullName ||
      (entity?.employeeId !== currentEmployeeId &&
        String(entity?.id) !== String(currentEmployeeId));

    if (needsFetch && (currentEmployeeId || currentUser?.loginId)) {
      const searchTerm = currentEmployeeId || currentUser?.loginId;
      if (searchTerm) {
        // If employee changed, reset the fetched flag
        if (entity?.employeeId && entity?.employeeId !== currentEmployeeId) {
          detailsFetched.current = false;
        }

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

  useEffect(() => {
    if (currentEmployeeId && currentEmployeeId !== "Admin") {
      if (prevEmployeeId.current !== currentEmployeeId) {
        dashboardFetchedKey.current = null;
        prevEmployeeId.current = currentEmployeeId;
      }
      fetchDashboardData(calendarDate);
    }
  }, [currentEmployeeId, calendarDate, fetchDashboardData]);

  // Leave Balance Logic
  const isIntern = useMemo(() => {
    const designation = (entity?.designation ?? entity?.designation_name ?? "")
      .toString()
      .toLowerCase();
    const employmentType = (entity?.employmentType ?? "")
      .toString()
      .toUpperCase();
    return designation.includes("intern") || employmentType === "INTERN";
  }, [entity?.designation, entity?.designation_name, entity?.employmentType]);

  const showInternDataBanner = useMemo(() => {
    if (!entity?.internId || !entity?.conversionDate) return false;

    const convDate = dayjs(entity.conversionDate);
    if (!convDate.isValid()) return false;

    const selectedDate = dayjs(calendarDate);
    const convYear = convDate.year();
    const convMonth = convDate.month() + 1;
    const selectedYear = selectedDate.year();
    const selectedMonth = selectedDate.month() + 1;

    if (selectedYear < convYear) return true;
    if (selectedYear === convYear && selectedMonth < convMonth) return true;

    return false;
  }, [entity, calendarDate]);

  const showConversionBanner = useMemo(() => {
    if (!entity?.conversionDate) return false;

    const convDate = dayjs(entity.conversionDate);
    if (!convDate.isValid()) return false;

    const selectedDate = dayjs(calendarDate);
    const convYear = convDate.year();
    const convMonth = convDate.month() + 1;
    const selectedYear = selectedDate.year();
    const selectedMonth = selectedDate.month() + 1;

    return selectedYear === convYear && selectedMonth === convMonth;
  }, [entity, calendarDate]);

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
      const dateStr = dayjs(day.fullDate).format("YYYY-MM-DD");
      const isMasterHoliday = holidays.find((h) => {
        const hDate = h.date || (h as any).holidayDate;
        if (!hDate) return false;
        return dayjs(hDate).format("YYYY-MM-DD") === dateStr;
      });

      if (isMasterHoliday) {
        if (
          day.status !== AttendanceStatus.FULL_DAY &&
          day.status !== AttendanceStatus.HALF_DAY &&
          day.status !== AttendanceStatus.WFH &&
          day.status !== AttendanceStatus.CLIENT_VISIT
        ) {
          return { ...day, status: AttendanceStatus.HOLIDAY };
        }
      }
      return day;
    });
  }, [calendarDate, now, records, holidays]);

  const displayEntry =
    todayStatsEntry ||
    ({
      fullDate: now,
      status: AttendanceStatus.PENDING,
      isSaved: false,
      isToday: true,
    } as any);

  const handleDateNavigator = useCallback(
    (timestamp: number) => {
      if (setScrollToDate) setScrollToDate(timestamp);

      const targetDate = new Date(timestamp);
      const isPrivilegedUser =
        currentUser?.userType === UserType.ADMIN ||
        currentUser?.userType === UserType.MANAGER ||
        currentUser?.userType === UserType.TEAMLEAD;

      const isSelfView =
        !currentEmployeeId || currentEmployeeId === currentUser?.employeeId;
      const isViewAttendance = location.pathname.includes("/view-attendance/");

      // Disable navigation for Admin and Manager on dashboard or view-attendance pages
      if (
        isPrivilegedUser &&
        (isSelfView || isViewAttendance) &&
        (location.pathname.startsWith("/manager-dashboard") ||
          location.pathname.startsWith("/admin-dashboard"))
      ) {
        return;
      }

      // Handle Privileged User viewing someone else (fallback if not blocked above)
      if (
        viewOnly &&
        isPrivilegedUser &&
        currentEmployeeId &&
        currentEmployeeId !== currentUser?.employeeId
      ) {
        const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
        const basePath = location.pathname.startsWith("/manager-dashboard")
          ? "/manager-dashboard"
          : "/admin-dashboard";

        navigate(`${basePath}/timesheet/${currentEmployeeId}/${dateStr}`, {
          state: {
            selectedDate: dateStr,
            timestamp: Date.now(), // Use unique timestamp for highlight trigger
          },
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
      const dateStr = dayjs(targetDate).format("YYYY-MM-DD");

      const state = {
        selectedDate: dateStr,
        timestamp: Date.now(), // Use unique timestamp for highlight trigger
      };

      if (setActiveTab) {
        setActiveTab("My Timesheet");
      } else {
        navigate(navTarget, { state });
      }
    },
    [
      viewOnly,
      setScrollToDate,
      setActiveTab,
      navigate,
      location.pathname,
      currentUser,
      currentEmployeeId,
    ],
  );

  const handleNavigate = (timestamp: number) => {
    if (onNavigate) {
      onNavigate(timestamp);
    } else {
      handleDateNavigator(timestamp);
    }
  };

  // Only block rendering while actively loading with no data (genuine first fetch).
  // Do NOT block if loading is done — even if records are empty (e.g. future month).
  if (records.length === 0 && loading)
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-[#00A3C4]/20 border-t-[#00A3C4] rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#F4F7FE]">
      {/* Header */}
      {!viewOnly && (
        <div className="px-4 md:px-8 pt-4 md:pt-6 pb-1 md:pb-2">
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80">
            {/* Top Row: Title + Date Chip */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-base md:text-lg font-medium text-[#2B3674]">
                  {currentUser?.userType === UserType.MANAGER
                    ? "Manager Dashboard"
                    : "Employee Dashboard"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back,{" "}
                  <span className="font-semibold text-[#4318FF]">
                    {(isMyRoute
                      ? currentUser?.aliasLoginName || currentUser?.loginId
                      : null) ||
                      entity?.firstName ||
                      entity?.fullName ||
                      currentUser?.aliasLoginName ||
                      "Employee"}
                  </span>
                </p>
              </div>

              {/* Right column: Date Chip + Month Navigator */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {currentUser?.userType !== UserType.MANAGER && displayEntry && (
                  <div className="bg-[#eef1fb] rounded-xl px-3 py-2 text-center w-full">
                    <div className="flex items-center justify-center gap-1">
                      <CalendarIcon size={13} className="text-[#4318FF]" />
                      <p className="text-xs font-medium text-[#4318FF] leading-snug whitespace-nowrap">
                        {displayEntry.fullDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Month Navigator — sits below Wed Jun 24 */}
                <div className="flex items-center justify-between bg-[#f4f6fd] rounded-lg px-2 py-1 gap-2 w-full">
                  <button
                    onClick={() => {
                      const prev = new Date(calendarDate);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarDate(prev);
                    }}
                    className="w-4 h-4 bg-white rounded-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                    aria-label="Previous month"
                  >
                    <ChevronLeft
                      size={10}
                      strokeWidth={2.5}
                      className="text-[#4318FF]"
                    />
                  </button>

                  <span className="text-[10px] font-medium text-[#4318FF] whitespace-nowrap">
                    {calendarDate.toLocaleString("default", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <button
                    onClick={() => {
                      const next = new Date(calendarDate);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarDate(next);
                    }}
                    className="w-4 h-4 bg-white rounded-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                    aria-label="Next month"
                  >
                    <ChevronRight
                      size={10}
                      strokeWidth={2.5}
                      className="text-[#4318FF]"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-6 space-y-5 custom-scrollbar">
        {/* Month Selector Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          {/* Historical Intern / Congratulations Alert Badge */}
          <div className="flex-1 min-w-[200px] flex items-center justify-start">
            {showInternDataBanner && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/70 border border-blue-200/50 backdrop-blur-md rounded-full text-blue-800 shadow-xs transition-all duration-300 mr-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  Intern Period
                </span>
                <span className="h-3.5 w-px bg-blue-200"></span>
                <p className="text-sm font-semibold text-blue-900/90 leading-tight">
                  Showing Internship details of{" "}
                  <strong className="font-bold">
                    {entity?.fullName || "Employee"}
                  </strong>
                  . Internship successfully completed on{" "}
                  <strong className="font-bold">
                    {entity?.conversionDate
                      ? dayjs(entity.conversionDate).format("MMM D, YYYY")
                      : "N/A"}
                  </strong>
                  .
                </p>
              </div>
            )}

            {showConversionBanner && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-50/70 border border-green-200/50 backdrop-blur-md rounded-full text-green-800 shadow-xs transition-all duration-300 whitespace-nowrap mr-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-green-600 animate-pulse">
                  Congratulations!
                </span>
                <span className="h-3.5 w-px bg-green-200"></span>
                <p className="text-sm font-semibold text-green-900/90 leading-tight whitespace-nowrap">
                  🎉 Congratulations,{" "}
                  <strong className="font-bold">
                    {entity?.fullName || "Employee"}
                  </strong>
                  , on your transition to a Full-Time role!
                </p>
              </div>
            )}
          </div>

          {/* <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm border border-gray-100/50 gap-2 self-end">
            <button
              onClick={() => {
                const prev = new Date(calendarDate);
                prev.setMonth(prev.getMonth() - 1);
                setCalendarDate(prev);
              }}
              className="p-1 hover:bg-gray-50 rounded-full transition-colors text-[#4318FF] hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => {
                const next = new Date(calendarDate);
                next.setMonth(next.getMonth() + 1);
                setCalendarDate(next);
              }}
              className="p-1 hover:bg-gray-50 rounded-full transition-colors text-[#4318FF] hover:scale-110 active:scale-95"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div> */}
        </div>

        {/* Top Section: Dashboard Cards */}
        <AttendanceStatsCards
          year={calendarDate.getFullYear()}
          month={calendarDate.getMonth() + 1}
          leaveBalance={leaveBalance}
          attendanceRecords={yearlyRecords}
          isIntern={isIntern}
          joiningDate={entity?.joiningDate || (currentUser as any)?.joiningDate}
          conversionDate={
            entity?.conversionDate || (currentUser as any)?.conversionDate
          }
          trends={trends}
          monthlyLeaveBalance={monthlyLeaveBalance}
          loading={leaveLoading}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="w-full">
            <AttendancePieChart
              data={currentMonthEntries}
              currentMonth={calendarDate}
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
              className="w-full md:w-auto px-8 py-3 rounded-xl text-white font-bold bg-[#4318FF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Edit size={18} />
              <span>Log Today's Hours</span>
            </button>
          </div>
        )}

        {/* Bottom Section: Calendar/List */}
        <div className="bg-white rounded-2xl shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 overflow-hidden">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#2B3674]">
                Attendance List
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Monthly attendance records
              </p>
            </div>
            <span className="text-xs px-3 py-1.5 bg-[#F4F7FE] rounded-full text-[#4318FF] font-bold border border-[#4318FF]/15 shrink-0 whitespace-nowrap">
              All Statuses
            </span>
          </div>
          <div className="p-3 md:p-4">
            <AttendanceViewWrapper
              now={now}
              currentDate={calendarDate}
              entries={currentMonthEntries as any}
              onMonthChange={(date) => {
                setCalendarDate(date);
                dashboardFetchedKey.current = null;
                fetchDashboardData(date);
              }}
              onNavigateToDate={(timestamp) => {
                handleNavigate(timestamp);
              }}
              hideMonthNavigation={true}
              hideBackButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayAttendance;
