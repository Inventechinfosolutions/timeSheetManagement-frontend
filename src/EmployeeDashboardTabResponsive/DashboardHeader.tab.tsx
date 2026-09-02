import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HeaderProps } from "../EmployeeDashboard/EmployeeDashboard.types";
import "./style.tab.css";

export default function DashboardHeaderTab({
  currentUser,
  entity,
  isMyRoute,
  displayEntry,
  calendarDate,
  setCalendarDate,
  UserType,
}: HeaderProps) {
  return (
    <div className="dashboard-header-tab">
      <div className="dashboard-header-tab__card">
        <div className="dashboard-header-tab__row">
          {/* Left */}
          <div className="dashboard-header-tab__left">
            <h1 className="dashboard-header-tab__title">
              {currentUser?.userType === UserType.MANAGER
                ? "Manager Dashboard"
                : "Employee Dashboard "}
            </h1>
            <p className="dashboard-header-tab__subtitle">
              Welcome back,{" "}
              <span className="dashboard-header-tab__username">
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

          {/* Right */}
          <div className="dashboard-header-tab__right">
            {currentUser?.userType !== UserType.MANAGER && displayEntry && (
              <div className="dashboard-header-tab__date-pill">
                <CalendarIcon
                  size={15}
                  className="dashboard-header-tab__date-pill-icon"
                />
                <p className="dashboard-header-tab__date-pill-text">
                  {displayEntry.fullDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            <div className="dashboard-header-tab__month-nav">
              <button
                className="dashboard-header-tab__month-btn"
                onClick={() => {
                  const p = new Date(calendarDate);
                  p.setMonth(p.getMonth() - 1);
                  setCalendarDate(p);
                }}
                aria-label="Previous month"
              >
                <ChevronLeft size={13} strokeWidth={2.5} />
              </button>

              <span className="dashboard-header-tab__month-label">
                {calendarDate.toLocaleString("default", {
                  month: "short",
                  year: "numeric",
                })}
              </span>

              <button
                className="dashboard-header-tab__month-btn"
                onClick={() => {
                  const n = new Date(calendarDate);
                  n.setMonth(n.getMonth() + 1);
                  setCalendarDate(n);
                }}
                aria-label="Next month"
              >
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
