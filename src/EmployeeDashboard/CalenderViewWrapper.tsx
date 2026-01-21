import { useState, useEffect } from "react";
import CalendarView from "./CalendarView";
import MobileResponsiveCalendarPage from "./MobileResponsiveCalendarPage"; // This import is now used

import { TimesheetEntry } from "../types";

interface AttendanceViewWrapperProps {
  now?: Date;
  currentDate?: Date;
  entries?: TimesheetEntry[];
  onMonthChange?: (date: Date) => void;
  onNavigateToDate?: (date: number) => void;
  employeeId?: string;
  variant?: "small" | "large" | "sidebar";
}

const AttendanceViewWrapper = (props: AttendanceViewWrapperProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // For the 'large' variant (main calendar view), we want responsive switching.
  // For 'small' or 'sidebar' (mini-calendars), we usually want the Desktop version even on mobile-ish screens
  // unless explicitly requested otherwise.
  const isLargeView = !props.variant || props.variant === "large";

  if (isMobile && isLargeView) {
    return <MobileResponsiveCalendarPage />;
  }

  return <CalendarView {...props} />;
};

export default AttendanceViewWrapper;
