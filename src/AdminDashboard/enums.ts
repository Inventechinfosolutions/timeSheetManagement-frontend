export enum UserRole {
  Admin = "Admin",
  Manager = "Manager",
}

export enum SortOption {
  HoursDesc = "hours_desc",
  HoursAsc = "hours_asc",
  NameAsc = "name_asc",
  NameDesc = "name_desc",
  DateDesc = "date_desc",
  DateAsc = "date_asc",
}

export enum Department {
  HR = "HR",
  IT = "IT",
  Sales = "Sales",
  Marketing = "Marketing",
  Finance = "Finance",
  Engineering = "Engineering",
  Design = "Design",
  Admin = "Admin",
  All = "All",
}

export enum ExportStep {
  Employees = "employees",
  Range = "range",
}

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}

export enum RequestStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Cancelled = "Cancelled",
  Completed = "Completed",
  Submitted = "Submitted",
}

export enum RequestType {
  ApplyLeave = "Apply Leave",
  Leave = "Leave",
  WorkFromHome = "Work From Home",
  ClientVisit = "Client Visit",
  HalfDay = "Half Day",
  Permission = "Permission",
}

export enum EmployeeStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}

export enum EmploymentType {
  FullTimer = "FULL_TIMER",
  Intern = "INTERN",
}

export enum AttendanceStatus {
  FullDay = "Full Day",
  HalfDay = "Half Day",
  Leave = "Leave",
  Absent = "Absent",
  Pending = "Pending",
  NotUpdated = "Not Updated",
  Blocked = "Blocked",
  Holiday = "Holiday",
  Weekend = "Weekend",
  Present = "Present",
}
