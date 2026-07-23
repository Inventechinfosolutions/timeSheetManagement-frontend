import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { HeaderProps } from "./EmployeeDashboard.types";
import "./DashboardHeaderDesktop.css";

export default function DashboardHeaderDesktop({
  currentUser,
  entity,
  isMyRoute,
  displayEntry,
  calendarDate,
  setCalendarDate,
  UserType,
}: HeaderProps) {
  return (
    <div className="dashboard-header-desktop">
      {/* Header Card */}
      <div className="dashboard-header-desktop__card">
        <div className="dashboard-header-desktop__row">
          {/* Left */}
          <div className="dashboard-header-desktop__left">
            <h1 className="dashboard-header-desktop__title">
              {currentUser?.userType === UserType.MANAGER
                ? "Manager Dashboard"
                : "Employee Dashboard"}
            </h1>

            <p className="dashboard-header-desktop__subtitle">
              Welcome back,{" "}
              <span className="dashboard-header-desktop__username">
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
          <div className="dashboard-header-desktop__right">
            {currentUser?.userType !== UserType.MANAGER && displayEntry && (
              <div className="dashboard-header-desktop__date-pill">
                <CalendarIcon
                  size={14}
                  className="dashboard-header-desktop__date-pill-icon"
                />

                <span className="dashboard-header-desktop__date-pill-text">
                  {displayEntry.fullDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="dashboard-header-desktop__month-nav-wrap">
        <div className="dashboard-header-desktop__month-nav">
          <button
            className="dashboard-header-desktop__month-btn"
            onClick={() => {
              const prev = new Date(calendarDate);
              prev.setMonth(prev.getMonth() - 1);
              setCalendarDate(prev);
            }}
          >
            <ChevronLeft size={13} />
          </button>

          <span className="dashboard-header-desktop__month-label">
            {calendarDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <button
            className="dashboard-header-desktop__month-btn"
            onClick={() => {
              const next = new Date(calendarDate);
              next.setMonth(next.getMonth() + 1);
              setCalendarDate(next);
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}