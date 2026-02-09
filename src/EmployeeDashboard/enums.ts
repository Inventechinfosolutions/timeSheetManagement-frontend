export enum AttendanceStatus {
  LEAVE = "Leave",
  ABSENT = "Absent",
  HALF_DAY = "Half Day",
  FULL_DAY = "Full Day",
  PENDING = "Pending",
  HOLIDAY = "Holiday",
  WEEKEND = "Weekend",
  WFH = "WFH",
  CLIENT_VISIT = "Client Visit",
  UPCOMING = "UPCOMING",
  NOT_UPDATED = "Not Updated",
}

export enum EmploymentType {
  FULL_TIME = "FULL_TIME",
  INTERN = "INTERN",
}

export enum UserRole {
  ADMIN = "Admin",
  MANAGER = "MANAGER",
}

export enum LeaveRequestType {
  APPLY_LEAVE = "Apply Leave",
  LEAVE = "Leave",
}

export enum LeaveRequestStatus {
  APPROVED = "Approved",
  PENDING = "Pending",
}

export const ENTITLEMENT = {
  FULL_TIMER: 18,
  INTERN: 12,
} as const;

export enum DashboardTab {
  MY_TIMESHEET = "My Timesheet",
  LEAVE_BALANCE = "Leave Balance",
}
