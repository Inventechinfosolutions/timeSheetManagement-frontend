import { Edit } from "lucide-react";
import DashboardHeaderDesktop from "./DashboardHeader.desktop";
import DashboardBanners from "./DashboardBanners";
import AttendanceStatsCards from "./AttendanceStatsCards";
import AttendancePieChart from "./AttendancePieChart";
import WorkTrendsGraph from "./WorkTrendsGraph";
import AttendanceViewWrapper from "./CalenderViewWrapper";
import { LOG_BUTTON_TEXT, ATTENDANCE_LIST_LABELS } from "./TodayAttendance.enums";
import type { DesktopViewProps } from "./TodayAttendance.types";
import "./TodayAttendance.desktop.css";
import "./TodayAttendance.mobile.css";

const TodayAttendanceDesktop = ({
  viewOnly, headerProps, showInternDataBanner, showConversionBanner,
  entity, calendarDate, setCalendarDate, leaveBalance, yearlyRecords,
  isIntern, joiningDate, conversionDate, trends, monthlyLeaveBalance,
  leaveLoading, currentMonthEntries, now, handleNavigate,
  fetchDashboardData, dashboardFetchedKey, currentEmployeeId,
}: DesktopViewProps) => {
  return (
    <div className="today-attendance-desktop">
      {!viewOnly && <DashboardHeaderDesktop {...headerProps} />}

      <div className="today-attendance-desktop__content">
        <DashboardBanners
          showInternDataBanner={showInternDataBanner}
          showConversionBanner={showConversionBanner}
          entity={entity}
        />

        <AttendanceStatsCards
          year={calendarDate.getFullYear()}
          month={calendarDate.getMonth() + 1}
          leaveBalance={leaveBalance}
          attendanceRecords={yearlyRecords}
          isIntern={isIntern}
          joiningDate={joiningDate}
          conversionDate={conversionDate}
          trends={trends}
          monthlyLeaveBalance={monthlyLeaveBalance}
          loading={leaveLoading}
        />

        <div className="today-attendance-desktop__charts">
          <div className="today-attendance-desktop__chart-item">
            <AttendancePieChart data={currentMonthEntries} currentMonth={calendarDate} />
          </div>
          <div className="today-attendance-desktop__chart-item">
            <WorkTrendsGraph employeeId={currentEmployeeId} currentMonth={calendarDate} />
          </div>
        </div>

        {!viewOnly && (
          <div className="today-attendance-desktop__log-btn-wrap">
            <button
              className="today-attendance-desktop__log-btn"
              onClick={() => handleNavigate(now.getTime())}
            >
              <Edit size={18} />
              <span>{LOG_BUTTON_TEXT}</span>
            </button>
          </div>
        )}

        <div className="today-attendance-desktop__list-card">
          <div className="today-attendance-desktop__list-header">
            <div>
              <h3 className="today-attendance-desktop__list-title">
                {ATTENDANCE_LIST_LABELS.title}
              </h3>
              <p className="today-attendance-desktop__list-subtitle">
                {ATTENDANCE_LIST_LABELS.subtitle}
              </p>
            </div>
            <span className="today-attendance-desktop__list-badge">
              {ATTENDANCE_LIST_LABELS.badge}
            </span>
          </div>
          <div className="today-attendance-desktop__list-body">
            <AttendanceViewWrapper
              now={now}
              currentDate={calendarDate}
              entries={currentMonthEntries as any}
              onMonthChange={(date) => {
                setCalendarDate(date);
                dashboardFetchedKey.current = null;
                fetchDashboardData(date);
              }}
              onNavigateToDate={(timestamp) => handleNavigate(timestamp)}
              hideMonthNavigation={true}
              hideBackButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayAttendanceDesktop;