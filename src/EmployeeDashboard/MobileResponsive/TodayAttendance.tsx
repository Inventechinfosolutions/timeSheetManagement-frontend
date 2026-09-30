import React from "react";
import dayjs from "dayjs";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react";
import { UserType } from "../../enums";
import AttendanceStatsCards from "../AttendanceStatsCards";
import AttendancePieChart from "../AttendancePieChart";
import WorkTrendsGraph from "../WorkTrendsGraph";
import AttendanceViewWrapper from "../CalenderViewWrapper";
import "./TodayAttendance.css";

export interface MobileTodayAttendanceProps {
  viewOnly?: boolean;
  currentUser: any;
  currentEmployeeId?: string;
  entity: any;
  isMyRoute: boolean;
  displayEntry: any;
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  now: Date;
  showInternDataBanner: boolean;
  showConversionBanner: boolean;
  handleNavigate: (timestamp: number) => void;
  leaveBalance: any;
  monthlyLeaveBalance: any;
  leaveLoading: boolean;
  yearlyRecords: any;
  trends: any;
  isIntern: boolean;
  currentMonthEntries: any;
  fetchDashboardData: (date: Date) => void;
  dashboardFetchedKey: React.MutableRefObject<string | null>;
}

const MobileTodayAttendance = ({
  viewOnly = false,
  currentUser,
  currentEmployeeId,
  entity,
  isMyRoute,
  displayEntry,
  calendarDate,
  setCalendarDate,
  now,
  showInternDataBanner,
  showConversionBanner,
  handleNavigate,
  leaveBalance,
  monthlyLeaveBalance,
  leaveLoading,
  yearlyRecords,
  trends,
  isIntern,
  currentMonthEntries,
  fetchDashboardData,
  dashboardFetchedKey,
}: MobileTodayAttendanceProps) => {
  const dashboardTitle =
    currentUser?.userType === UserType.MANAGER
      ? "Manager Dashboard"
      : "Employee Dashboard";

  const displayName =
    (isMyRoute ? currentUser?.aliasLoginName || currentUser?.loginId : null) ||
    entity?.firstName ||
    entity?.fullName ||
    currentUser?.aliasLoginName ||
    "Employee";

  // const formattedTodayDate = displayEntry?.fullDate
  //   ? (displayEntry.fullDate instanceof Date
  //       ? displayEntry.fullDate
  //       : new Date(displayEntry.fullDate)
  //     ).toLocaleDateString("en-US", {
  //       weekday: "long",
  //       month: "long",
  //       day: "numeric",
  //     })
  //   : "";

  const formattedMonthYear = calendarDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    const prev = new Date(calendarDate);
    prev.setMonth(prev.getMonth() - 1);
    setCalendarDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(calendarDate);
    next.setMonth(next.getMonth() + 1);
    setCalendarDate(next);
  };

  return (
    <div className="mobile-today-attendance-container">
      <h1 className="mobile-attendance-title">{dashboardTitle}</h1>

      {/* Top Header Card */}
      {!viewOnly && (
        <div className="mobile-attendance-header-card">
          {/* Decorative subtle SVG background art */}
          <div className="mobile-card-svg-bg" aria-hidden="true">
            <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="cardSvgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.18" />
                  <stop offset="50%" stopColor="#FB7185" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="160" cy="15" r="55" fill="url(#cardSvgGrad)" />
              <path d="M50,0 C100,35 130,70 200,45 L200,0 Z" fill="url(#cardSvgGrad)" />
            </svg>
          </div>

          {/* Title & Welcome */}
          <div className="mobile-attendance-welcome">
            <p className="mobile-attendance-subtitle">
              Hi,{" "}
              <span className="mobile-attendance-username">
                {displayName}
              </span>{" "}
              <span className="mobile-wave-hand">👋</span>
            </p>

            {/* Month Selector - BELOW GREETING */}
            <div className="mobile-attendance-month-row">
              <div className="mobile-attendance-month-pill">

                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="mobile-attendance-month-btn"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                </button>

                <span className="mobile-attendance-month-text">
                  {formattedMonthYear}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="mobile-attendance-month-btn"
                  aria-label="Next month"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>

              </div>
            </div>
          </div>

          {/* Animated Date Calendar - TOP RIGHT */}
          <div className="mobile-date-calendar">
            <div className="calendar-rings">
              <span></span>
              <span></span>
            </div>

            <div className="calendar-top">
              {dayjs(now).format("MMM")}
            </div>

            <div className="calendar-page">
              <span className="calendar-day">
                {dayjs(now).format("DD")}
              </span>

              <span className="calendar-weekday">
                {dayjs(now).format("ddd")}
              </span>

              <span className="calendar-year">
                {dayjs(now).format("YYYY")}
              </span>
            </div>
          </div>

          {/* Intern / Conversion Banners if present */}
          {showInternDataBanner && (
            <div className="mobile-banner-badge mobile-banner-intern">
              <span className="font-extrabold uppercase tracking-wider text-blue-600">
                Intern Period
              </span>
              <p className="font-medium text-blue-900 leading-snug">
                Showing Internship details of{" "}
                <strong>{entity?.fullName || "Employee"}</strong>. Completed on{" "}
                <strong>
                  {entity?.conversionDate
                    ? dayjs(entity.conversionDate).format("MMM D, YYYY")
                    : "N/A"}
                </strong>
                .
              </p>
            </div>
          )}

          {showConversionBanner && (
            <div className="mobile-banner-badge mobile-banner-conversion">
              <span className="font-extrabold uppercase tracking-wider text-green-600 animate-pulse">
                Congratulations!
              </span>
              <p className="font-medium text-green-900 leading-snug">
                🎉 Congratulations,{" "}
                <strong>{entity?.fullName || "Employee"}</strong>, on your
                transition to a Full-Time role!
              </p>
            </div>
          )}

          {/* Month Selector Navigation */}
          {/* <div className="mobile-attendance-month-row">
            <div className="mobile-attendance-month-pill">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="mobile-attendance-month-btn"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              <span className="mobile-attendance-month-text">
                {formattedMonthYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="mobile-attendance-month-btn"
                aria-label="Next month"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div> */}
        </div>
      )}

      {/* Content Section: Cards, Charts, Calendar */}
      <div className="space-y-4 mt-4">
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
        <div className="grid grid-cols-1 gap-4 w-full">
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

        {/* Log Today's Hours Button */}
        {!viewOnly && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={() => handleNavigate(now.getTime())}
              className="mobile-log-hours-btn"
            >
              <Edit size={16} />
              <span>Log Today's Hours</span>
            </button>
          </div>
        )}

        {/* Bottom Section: Calendar/List */}
        <div className="bg-white rounded-2xl shadow-[0px_8px_24px_rgba(112,144,176,0.08)] border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2B3674]">
                Attendance List
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Monthly attendance records
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 bg-[#F4F7FE] rounded-full text-[#4318FF] font-bold border border-[#4318FF]/15">
              All Statuses
            </span>
          </div>
          <div className="p-2 sm:p-4">
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

export default MobileTodayAttendance;
