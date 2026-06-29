import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { HeaderProps } from "./EmployeeDashboard.types";
import "./DashboardHeaderDesktop.css";

export default function DashboardHeaderDesktop({
  currentUser, entity, isMyRoute, displayEntry,
  calendarDate, setCalendarDate, UserType,
}: HeaderProps) {
  return (
    <div className="dashboard-header-desktop">
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
                  size={13}
                  className="dashboard-header-desktop__date-pill-icon"
                />
                <p className="dashboard-header-desktop__date-pill-text">
                  {displayEntry.fullDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            <div className="dashboard-header-desktop__month-nav">
              <button
                className="dashboard-header-desktop__month-btn"
                onClick={() => {
                  const p = new Date(calendarDate);
                  p.setMonth(p.getMonth() - 1);
                  setCalendarDate(p);
                }}
                aria-label="Previous month"
              >
                <ChevronLeft size={10} strokeWidth={2.5} />
              </button>

              <span className="dashboard-header-desktop__month-label">
                {calendarDate.toLocaleString("default", {
                  month: "short",
                  year: "numeric",
                })}
              </span>

              <button
                className="dashboard-header-desktop__month-btn"
                onClick={() => {
                  const n = new Date(calendarDate);
                  n.setMonth(n.getMonth() + 1);
                  setCalendarDate(n);
                }}
                aria-label="Next month"
              >
                <ChevronRight size={10} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}