export const ENTITLEMENT = {
  FULL_TIMER: 18,
  INTERN: 12,
} as const;

export enum LeaveType {
  Leave = "Leave",
  WorkFromHome = "Work From Home",
  ClientVisit = "Client Visit",
  HalfDay = "Half Day",
  ApplyLeave = "Apply Leave",
}

export enum AttendanceChartColor {
  PresentStart = "#10B981",
  PresentEnd = "#34D399",
  HalfDayStart = "#F59E0B",
  HalfDayEnd = "#FBBF24",
  AbsentStart = "#E11D48",
  AbsentEnd = "#F43F5E",
  LeaveStart = "#EE5D50",
  LeaveEnd = "#F87171",
  HolidayStart = "#2563EB",
  HolidayEnd = "#3B82F6",
  WeekendStart = "#A5F3FC",
  WeekendEnd = "#0EA5E9",
  NotUpdatedStart = "#FB923C",
  NotUpdatedEnd = "#F97316",
  PendingStart = "#94A3B8",
  PendingEnd = "#64748B",
}

export enum AttendanceLabels {
  Present = "Present",
  Absent = "Absent",
  Leave = "Leave",
  Holiday = "Holiday",
  Weekend = "Weekend",
  NotUpdated = "Not Updated",
  HalfDay = "Half Day", // Adding this
  Pending = "Pending", // Adding this
}
