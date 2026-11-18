import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { MonthNavigator } from "../components/ui";
import { useAppDispatch, useAppSelector } from "../hooks";
import { AttendanceStatus, UserType } from "../enums";
import { isAdminAccess } from "../utils/roleAccess";
import { fetchEmployeeDashboard } from "../reducers/employeeAttendance.reducer";
import { getEntity, setCurrentUser } from "../reducers/employeeDetails.reducer";
import { generateMonthlyEntries } from "../utils/attendanceUtils";
import AttendancePieChart from "./AttendancePieChart";
import WorkTrendsGraph from "./WorkTrendsGraph";
import AttendanceStatsCards, { LeaveSummary } from "./AttendanceStatsCards";
import DashboardHero from "./DashboardHero";
import LeaveBalanceSummary from "./LeaveBalanceSummary";
import RecentAttendanceList from "./RecentAttendanceList";
import QuickActions, { QuickAction } from "./QuickActions";
import OnTrackCard from "./OnTrackCard";
import { Plane, Clock, StickyNote, UserRound } from "lucide-react";
import AppraisalDashboardCard, {
  AppraisalDashPhase,
  resolveAppraisalPhase,
} from "./AppraisalDashboardCard";
import { AppraisalApi } from "../Appraisal/reducers/appraisal.reducer";
import {
  formatAppraisalDisplayDate,
  toPerformanceAssignment,
} from "../Appraisal/utils/appraisalHelpers";
import { RootState } from "../store";

type LatestAppraisalSummary = {
  phase: AppraisalDashPhase;
  quarter?: string;
  financialYear?: string;
  deadline?: string;
};

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
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary>({ available: 0, used: 0, lop: 0 });
  const [latestAppraisal, setLatestAppraisal] = useState<LatestAppraisalSummary | null>(null);

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
    if (viewOnly || !currentEmployeeId || currentEmployeeId === "Admin") {
      setLatestAppraisal(null);
      return;
    }
    let cancelled = false;
    const employeeId = String(currentEmployeeId);
    // Performance list = same status as Appraisal History. Dashboard = fallback if not started yet.
    void Promise.all([
      AppraisalApi.getEmployeeDashboard(employeeId),
      AppraisalApi.getEmployeeReviews(employeeId, { limit: 50, page: 1 }).catch(() => ({
        data: [] as Awaited<ReturnType<typeof AppraisalApi.getEmployeeReviews>>["data"],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 50,
          totalPages: 0,
          currentPage: 1,
        },
      })),
    ])
      .then(([dashboard, reviewsResult]) => {
        if (cancelled) return;

        const performanceRows = [...(reviewsResult.data || [])].sort((a, b) => {
          const aTime = new Date(a.assignedDate || a.deadlineDate || 0).getTime();
          const bTime = new Date(b.assignedDate || b.deadlineDate || 0).getTime();
          if (bTime !== aTime) return bTime - aTime;
          return Number(b.id || 0) - Number(a.id || 0);
        });

        if (performanceRows.length > 0) {
          const latestPerf = toPerformanceAssignment(performanceRows[0]);
          setLatestAppraisal({
            phase: resolveAppraisalPhase(latestPerf.status),
            quarter: String(latestPerf.quarter || ""),
            financialYear: latestPerf.financialYear || "",
            deadline: latestPerf.deadline || "",
          });
          return;
        }

        const dashRows = [...(dashboard.reviews || [])].sort((a, b) => {
          const aTime = new Date(a.assignedDate || a.dueDate || 0).getTime();
          const bTime = new Date(b.assignedDate || b.dueDate || 0).getTime();
          if (bTime !== aTime) return bTime - aTime;
          return Number(b.id || 0) - Number(a.id || 0);
        });
        const latestDash = dashRows[0];
        if (!latestDash) {
          setLatestAppraisal(null);
          return;
        }
        setLatestAppraisal({
          phase: resolveAppraisalPhase(latestDash.submissionStatus),
          quarter: String(latestDash.quarter || ""),
          financialYear: latestDash.financialYear || "",
          deadline: formatAppraisalDisplayDate(latestDash.dueDate),
        });
      })
      .catch(() => {
        if (!cancelled) setLatestAppraisal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [viewOnly, currentEmployeeId]);

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
        isAdminAccess(currentUser) ||
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

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : location.pathname.startsWith("/admin-dashboard")
      ? "/admin-dashboard"
      : "/employee-dashboard";

  const goToTab = useCallback(
    (tab: string, state?: Record<string, unknown>) => navigate(`${basePath}/${tab}`, { state }),
    [navigate, basePath],
  );

  const logTodayHours = useCallback(() => {
    goToTab("my-timesheet", {
      selectedDate: dayjs(now).format("YYYY-MM-DD"),
      timestamp: Date.now(),
    });
  }, [goToTab, now]);

  const openLeaveBalance = useCallback(() => goToTab("leave-balance"), [goToTab]);

  const handleSummary = useCallback((summary: LeaveSummary) => {
    setLeaveSummary((prev) =>
      prev.available === summary.available && prev.used === summary.used && prev.lop === summary.lop
        ? prev
        : summary,
    );
  }, []);

  const pendingDays = useMemo(
    () =>
      currentMonthEntries.filter(
        (e) => !e.isFuture && !e.isToday && e.status === AttendanceStatus.NOT_UPDATED,
      ).length,
    [currentMonthEntries],
  );

  const quickActions: QuickAction[] = [
    { label: "Apply Leave", icon: <Plane size={18} />, color: "#7C3AED", tint: "#F3EEFF", onClick: () => goToTab("leave-management") },
    { label: "Log Hours", icon: <Clock size={18} />, color: "#2563EB", tint: "#EAF2FF", onClick: logTodayHours },
    { label: "Notes", icon: <StickyNote size={18} />, color: "#10B981", tint: "#E8FBF3", onClick: () => goToTab("notes") },
    { label: "My Profile", icon: <UserRound size={18} />, color: "#F97316", tint: "#FFF1E8", onClick: () => goToTab("my-profile") },
  ];

  const monthNavigator = (
    <MonthNavigator
      month={calendarDate.getMonth() + 1}
      year={calendarDate.getFullYear()}
      onPrev={() => {
        const prev = new Date(calendarDate);
        prev.setMonth(prev.getMonth() - 1);
        setCalendarDate(prev);
      }}
      onNext={() => {
        const next = new Date(calendarDate);
        next.setMonth(next.getMonth() + 1);
        setCalendarDate(next);
      }}
    />
  );

  const displayName =
    (isMyRoute ? currentUser?.aliasLoginName || currentUser?.loginId : null) ||
    entity?.firstName ||
    entity?.fullName ||
    currentUser?.aliasLoginName ||
    "Employee";

  // Only block rendering while actively loading with no data (genuine first fetch).
  // Do NOT block if loading is done — even if records are empty (e.g. future month).
  if (records.length === 0 && loading) {
    return <div className="flex-1 w-full min-h-[400px]" />;
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-linear-to-b from-[#EEF0FF] via-[#F4F7FE] to-[#F4F7FE]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pt-4 md:pt-6 pb-6 space-y-5 custom-scrollbar">
        {!viewOnly && (
          <DashboardHero
            name={displayName}
            title={currentUser?.userType === UserType.MANAGER ? "Manager Dashboard" : "Employee Dashboard"}
            today={displayEntry.fullDate}
            onLogHours={logTodayHours}
            rightSlot={monthNavigator}
          />
        )}

        {(viewOnly || showInternDataBanner || showConversionBanner) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Historical Intern / Congratulations Alert Badge */}
          <div className="flex-1 min-w-[200px] flex items-center justify-start">
            {showInternDataBanner && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/70 border border-blue-200/50 backdrop-blur-md rounded-full text-blue-800 shadow-xs transition-all duration-300 mr-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Intern Period</span>
                <span className="h-3.5 w-px bg-blue-200"></span>
                <p className="text-sm font-semibold text-blue-900/90 leading-tight">
                  Showing Internship details of <strong className="font-bold">{entity?.fullName || "Employee"}</strong>. Internship successfully completed on <strong className="font-bold">{entity?.conversionDate ? dayjs(entity.conversionDate).format("MMM D, YYYY") : "N/A"}</strong>.
                </p>
              </div>
            )}

            {showConversionBanner && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-50/70 border border-green-200/50 backdrop-blur-md rounded-full text-green-800 shadow-xs transition-all duration-300 whitespace-nowrap mr-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-green-600 animate-pulse">Congratulations!</span>
                <span className="h-3.5 w-px bg-green-200"></span>
                <p className="text-sm font-semibold text-green-900/90 leading-tight whitespace-nowrap">
                  🎉 Congratulations, <strong className="font-bold">{entity?.fullName || "Employee"}</strong>, on your transition to a Full-Time role!
                </p>
              </div>
            )}
          </div>

          {viewOnly && monthNavigator}
        </div>
        )}

        {/* Top Section: Dashboard Cards */}
        <AttendanceStatsCards
          year={calendarDate.getFullYear()}
          month={calendarDate.getMonth() + 1}
          leaveBalance={leaveBalance}
          attendanceRecords={yearlyRecords}
          isIntern={isIntern}
          joiningDate={entity?.joiningDate || (currentUser as any)?.joiningDate}
          conversionDate={entity?.conversionDate || (currentUser as any)?.conversionDate}
          trends={trends}
          monthlyLeaveBalance={monthlyLeaveBalance}
          loading={leaveLoading}
          onViewDetails={viewOnly ? undefined : openLeaveBalance}
          onSummary={handleSummary}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 w-full">
          <div className="xl:col-span-4">
            <AttendancePieChart
              data={currentMonthEntries}
              currentMonth={calendarDate}
            />
          </div>
          <div className="xl:col-span-5">
            <WorkTrendsGraph
              employeeId={currentEmployeeId}
              currentMonth={calendarDate}
              entries={currentMonthEntries as any}
            />
          </div>
          <div className="lg:col-span-2 xl:col-span-3">
            <LeaveBalanceSummary
              summary={leaveSummary}
              onViewDetails={viewOnly ? undefined : openLeaveBalance}
            />
          </div>
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 w-full items-stretch">
          <div className={viewOnly ? "lg:col-span-2 xl:col-span-12" : "lg:col-span-2 xl:col-span-7"}>
            <RecentAttendanceList
              entries={currentMonthEntries as any}
              onRowClick={handleNavigate}
              onViewAll={viewOnly ? undefined : () => goToTab("my-timesheet")}
            />
          </div>
          {!viewOnly && (
            <div className="xl:col-span-5 h-full min-h-[260px]">
              {latestAppraisal ? (
                <AppraisalDashboardCard
                  phase={latestAppraisal.phase}
                  quarter={latestAppraisal.quarter}
                  financialYear={latestAppraisal.financialYear}
                  deadline={latestAppraisal.deadline}
                  onOpen={() => goToTab("appraisal")}
                />
              ) : (
                <OnTrackCard pendingDays={pendingDays} onFix={logTodayHours} />
              )}
            </div>
          )}
        </div>

        {!viewOnly && (
          <QuickActions actions={quickActions} landscape />
        )}
      </div>
    </div>
  );
};

export default TodayAttendance;
