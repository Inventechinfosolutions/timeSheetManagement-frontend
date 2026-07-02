import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";           // ✅
import { AttendanceStatus, UserType } from "../enums";              // ✅
import { fetchEmployeeDashboard } from "../reducers/employeeAttendance.reducer";  // ✅
import { getEntity, setCurrentUser } from "../reducers/employeeDetails.reducer";  // ✅
import { generateMonthlyEntries } from "../utils/attendanceUtils";  // ✅
import { RootState } from "../store";                               // ✅
import TodayAttendanceDesktop from "./TodayAttendance.desktop";     // ✅
import TodayAttendanceMobile from "../EmployeeDashboardMobileResponsive/TodayAttendance.mobile";       // ✅
import type { TodayAttendanceProps } from "./TodayAttendance.types"; // ✅
import "./employeeDashboard.css";                                   // ✅


const TodayAttendance = ({
  setActiveTab, setScrollToDate, onNavigate, viewOnly = false,
}: TodayAttendanceProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { employeeId: urlEmployeeId } = useParams<{ employeeId: string }>();
  const { records, loading, yearlyRecords, trends } = useAppSelector((state: RootState) => state.attendance);
  const { entity } = useAppSelector((state: RootState) => state.employeeDetails);
  const { currentUser } = useAppSelector((state: RootState) => state.user);
  const { holidays } = useAppSelector((state: RootState) => state.masterHolidays);
  const { leaveBalance, monthlyLeaveBalance, loading: leaveLoading } = useAppSelector((state: RootState) => state.leaveRequest);

  const isMyRoute =
    location.pathname.includes("my-dashboard") ||
    location.pathname.includes("my-timesheet") ||
    location.pathname === "/employee-dashboard" ||
    location.pathname === "/employee-dashboard/";

  const currentEmployeeId = isMyRoute
    ? currentUser?.employeeId || currentUser?.loginId
    : urlEmployeeId || entity?.employeeId || currentUser?.employeeId || currentUser?.loginId;

  const detailsFetched = useRef(false);
  const dashboardFetchedKey = useRef<string | null>(null);
  const prevEmployeeId = useRef<string | undefined>();
  const [now] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchDashboardData = useCallback((date: Date) => {
    if (!currentEmployeeId || currentEmployeeId === "Admin") return;
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    const fetchKey = `${currentEmployeeId}-${month}-${year}`;
    if (dashboardFetchedKey.current === fetchKey) return;
    dashboardFetchedKey.current = fetchKey;
    dispatch(fetchEmployeeDashboard({ employeeId: currentEmployeeId, month, year }));
  }, [dispatch, currentEmployeeId]);

  useEffect(() => {
    if (viewOnly) return;
    const needsFetch = !entity?.fullName ||
      (entity?.employeeId !== currentEmployeeId && String(entity?.id) !== String(currentEmployeeId));
    if (needsFetch && (currentEmployeeId || currentUser?.loginId)) {
      const searchTerm = currentEmployeeId || currentUser?.loginId;
      if (searchTerm) {
        if (entity?.employeeId && entity?.employeeId !== currentEmployeeId) detailsFetched.current = false;
        if (detailsFetched.current) return;
        detailsFetched.current = true;
        dispatch(getEntity(searchTerm)).unwrap()
          .then((found) => { if (found) dispatch(setCurrentUser(found)); })
          .catch((err) => { detailsFetched.current = false; console.error("Failed:", err); });
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

  const isIntern = useMemo(() => {
    const designation = (entity?.designation ?? entity?.designation_name ?? "").toString().toLowerCase();
    const employmentType = (entity?.employmentType ?? "").toString().toUpperCase();
    return designation.includes("intern") || employmentType === "INTERN";
  }, [entity?.designation, entity?.designation_name, entity?.employmentType]);

  const showInternDataBanner = useMemo(() => {
    if (!entity?.internId || !entity?.conversionDate) return false;
    const convDate = dayjs(entity.conversionDate);
    if (!convDate.isValid()) return false;
    const sel = dayjs(calendarDate);
    if (sel.year() < convDate.year()) return true;
    if (sel.year() === convDate.year() && sel.month() + 1 < convDate.month() + 1) return true;
    return false;
  }, [entity, calendarDate]);

  const showConversionBanner = useMemo(() => {
    if (!entity?.conversionDate) return false;
    const convDate = dayjs(entity.conversionDate);
    if (!convDate.isValid()) return false;
    const sel = dayjs(calendarDate);
    return sel.year() === convDate.year() && sel.month() + 1 === convDate.month() + 1;
  }, [entity, calendarDate]);

  const todayStatsEntry = useMemo(() => {
    const entries = generateMonthlyEntries(now, now, records);
    return entries.find((e) => e.isToday) || null;
  }, [now, records]);

  const currentMonthEntries = useMemo(() => {
    const entries = generateMonthlyEntries(calendarDate, now, records);
    return entries.map((day) => {
      const dateStr = dayjs(day.fullDate).format("YYYY-MM-DD");
      const isMasterHoliday = holidays.find((h) => {
        const hDate = h.date || (h as any).holidayDate;
        return hDate ? dayjs(hDate).format("YYYY-MM-DD") === dateStr : false;
      });
      if (isMasterHoliday &&
        day.status !== AttendanceStatus.FULL_DAY && day.status !== AttendanceStatus.HALF_DAY &&
        day.status !== AttendanceStatus.WFH && day.status !== AttendanceStatus.CLIENT_VISIT) {
        return { ...day, status: AttendanceStatus.HOLIDAY };
      }
      return day;
    });
  }, [calendarDate, now, records, holidays]);

  const displayEntry = todayStatsEntry ||
    ({ fullDate: now, status: AttendanceStatus.PENDING, isSaved: false, isToday: true } as any);

  const handleDateNavigator = useCallback((timestamp: number) => {
    if (setScrollToDate) setScrollToDate(timestamp);
    const targetDate = new Date(timestamp);
    const isPrivilegedUser = currentUser?.userType === UserType.ADMIN ||
      currentUser?.userType === UserType.MANAGER || currentUser?.userType === UserType.TEAMLEAD;
    const isSelfView = !currentEmployeeId || currentEmployeeId === currentUser?.employeeId;
    const isViewAttendance = location.pathname.includes("/view-attendance/");

    if (isPrivilegedUser && (isSelfView || isViewAttendance) &&
      (location.pathname.startsWith("/manager-dashboard") || location.pathname.startsWith("/admin-dashboard"))) return;

    if (viewOnly && isPrivilegedUser && currentEmployeeId && currentEmployeeId !== currentUser?.employeeId) {
      const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
      const basePath = location.pathname.startsWith("/manager-dashboard") ? "/manager-dashboard" : "/admin-dashboard";
      navigate(`${basePath}/timesheet/${currentEmployeeId}/${dateStr}`, {
        state: { selectedDate: dateStr, timestamp: Date.now() },
      });
      return;
    }

    if (viewOnly) return;

    let basePath = "/employee-dashboard";
    if (location.pathname.startsWith("/manager-dashboard")) basePath = "/manager-dashboard";
    else if (location.pathname.startsWith("/admin-dashboard")) basePath = "/admin-dashboard";

    const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
    if (setActiveTab) setActiveTab("My Timesheet");
    else navigate(`${basePath}/my-timesheet`, { state: { selectedDate: dateStr, timestamp: Date.now() } });
  }, [viewOnly, setScrollToDate, setActiveTab, navigate, location.pathname, currentUser, currentEmployeeId]);

  const handleNavigate = (timestamp: number) => {
    if (onNavigate) onNavigate(timestamp);
    else handleDateNavigator(timestamp);
  };

  if (records.length === 0 && loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-[#00A3C4]/20 border-t-[#00A3C4] rounded-full animate-spin" />
      </div>
    );
  }

  const headerProps = {
    currentUser, entity, isMyRoute, displayEntry,
    calendarDate, setCalendarDate, UserType,
  };

  const viewProps = {
    viewOnly, headerProps, showInternDataBanner, showConversionBanner,
    entity, calendarDate, setCalendarDate,
    leaveBalance, yearlyRecords, isIntern,
    joiningDate: entity?.joiningDate || (currentUser as any)?.joiningDate,
    conversionDate: entity?.conversionDate || (currentUser as any)?.conversionDate,
    trends, monthlyLeaveBalance, leaveLoading,
    currentMonthEntries, now, handleNavigate,
    fetchDashboardData, dashboardFetchedKey, currentEmployeeId,
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#F4F7FE]">
      <TodayAttendanceDesktop {...viewProps} />
      <TodayAttendanceMobile {...viewProps} />
    </div>
  );
};

export default TodayAttendance;