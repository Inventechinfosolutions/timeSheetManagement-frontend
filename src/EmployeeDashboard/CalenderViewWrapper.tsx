import { useState, useEffect } from "react";
import CalendarView from "./CalendarView";
// import MobileResponsiveCalendarPage from "./MobileResponsiveCalendarPage"; // This import is now used
import MobileTimesheetHistory from "./MobileTimesheetHistory/MobileTimesheetHistory";
import { TimesheetEntry } from "../types";
import {
  DESKTOP_POINTER_QUERY,
  isDesktopPointerViewport,
} from "../utils/responsiveViewport";

interface AttendanceViewWrapperProps {
  now?: Date;
  currentDate?: Date;
  entries?: TimesheetEntry[];
  onMonthChange?: (date: Date) => void;
  onNavigateToDate?: (date: number) => void;
  employeeId?: string;
  variant?: "small" | "large" | "sidebar";
  viewOnly?: boolean;
  hideMonthNavigation?: boolean;
  hideBackButton?: boolean;
}

const AttendanceViewWrapper = (props: AttendanceViewWrapperProps) => {
  const [isMobile, setIsMobile] = useState(!isDesktopPointerViewport());

  useEffect(() => {
    const handleResize = () => setIsMobile(!isDesktopPointerViewport());
    const desktopPointerMedia = window.matchMedia(DESKTOP_POINTER_QUERY);
    window.addEventListener("resize", handleResize);
    desktopPointerMedia.addEventListener?.("change", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      desktopPointerMedia.removeEventListener?.("change", handleResize);
    };
  }, []);

  // For the 'large' variant (main calendar view), we want responsive switching.
  // For 'small' or 'sidebar' (mini-calendars), we usually want the Desktop version even on mobile-ish screens
  // unless explicitly requested otherwise.
  const isLargeView = !props.variant || props.variant === "large";

  if (isMobile && isLargeView) {
    return (
      // <MobileResponsiveCalendarPage
      //   employeeId={props.employeeId}
      //   entries={props.entries}
      //   currentDate={props.currentDate}
      //   hideMonthNavigation={props.hideMonthNavigation}
      //   onNavigateToDate={props.onNavigateToDate}
      // />
      <MobileTimesheetHistory
        employeeId={props.employeeId}
        entries={props.entries}
        currentDate={props.currentDate}
        onNavigateToDate={props.onNavigateToDate}
        hideMonthNavigation={props.hideMonthNavigation}
      />
    );
  }

  return <CalendarView {...props} />;
};

export default AttendanceViewWrapper;
