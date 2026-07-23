import { Edit } from "lucide-react";
import DashboardHeaderTab from "./DashboardHeader.tab";
import DashboardBanners from "../EmployeeDashboard/DashboardBanners";
import AttendanceStatsCards from "../EmployeeDashboard/AttendanceStatsCards";
import AttendancePieChart from "../EmployeeDashboard/AttendancePieChart";
import WorkTrendsGraph from "../EmployeeDashboard/WorkTrendsGraph";
import AttendanceViewWrapper from "../EmployeeDashboard/CalenderViewWrapper";
import { LOG_BUTTON_TEXT, ATTENDANCE_LIST_LABELS } from "../EmployeeDashboard/TodayAttendance.enums";
import type { MobileViewProps } from "../EmployeeDashboard/TodayAttendance.types";
import "./style.tab.css";

const TodayAttendanceTab = ({
  viewOnly, headerProps, showInternDataBanner, showConversionBanner,
  entity, calendarDate, setCalendarDate, leaveBalance, yearlyRecords,
  isIntern, joiningDate, conversionDate, trends, monthlyLeaveBalance,
  leaveLoading, currentMonthEntries, now, handleNavigate,
  fetchDashboardData, dashboardFetchedKey, currentEmployeeId,
}: MobileViewProps) => {
  return (
    <div className="today-attendance-tab">
      {!viewOnly && <DashboardHeaderTab {...headerProps} />}

      <div className="today-attendance-tab__content">
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

        <div className="today-attendance-tab__charts">
          <div className="today-attendance-tab__chart-item">
            <AttendancePieChart data={currentMonthEntries} currentMonth={calendarDate} />
          </div>
          <div className="today-attendance-tab__chart-item">
            <WorkTrendsGraph currentMonth={calendarDate} />
          </div>
        </div>

        {!viewOnly && (
          <div className="today-attendance-tab__log-btn-wrap">
            <button
              className="today-attendance-tab__log-btn"
              onClick={() => handleNavigate(now.getTime())}
            >
              <Edit size={18} />
              <span>{LOG_BUTTON_TEXT}</span>
            </button>
          </div>
        )}

        <div className="today-attendance-tab__list-card">
          <div className="today-attendance-tab__list-header">
            <div>
              <h3 className="today-attendance-tab__list-title">
                {ATTENDANCE_LIST_LABELS.title}
              </h3>
              <p className="today-attendance-tab__list-subtitle">
                {ATTENDANCE_LIST_LABELS.subtitle}
              </p>
            </div>
            <span className="today-attendance-tab__list-badge">
              {ATTENDANCE_LIST_LABELS.badge}
            </span>
          </div>
          <div className="today-attendance-tab__list-body">
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

export default TodayAttendanceTab;
