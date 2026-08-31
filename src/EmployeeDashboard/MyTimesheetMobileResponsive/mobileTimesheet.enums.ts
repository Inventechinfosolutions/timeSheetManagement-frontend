export enum MobileTimesheetModalMode {
  HOURS = "hours",
  BLOCKED_HALF_DAY = "blocked-half-day",
  BLOCKED_LEAVE = "blocked-leave",
  BLOCKED_APPROVED_DUTY = "blocked-approved-duty",
}

export enum MobileTimesheetDayTone {
  DEFAULT = "default",
  TODAY = "today",
  WEEKEND = "weekend",
  SATURDAY = "saturday",
  ABSENT_OR_LEAVE = "absent-or-leave",
  HALF_DAY = "half-day",
  HOLIDAY = "holiday",
  PRESENT = "present",
  CLIENT_VISIT = "client-visit",
  WFH = "wfh",
}

export enum MobileTimesheetLabel {
  ENTER_HOURS = "Enter hours",
  NO_HOURS = "No hours",
  WEEK_OFF = "Week Off",
  FULL_DAY_WEEKEND = "Full Day (Weekend)",
  FULL_DAY_SAT = "Full Day (Sat)",
  QUICK_SELECT = "Quick Select",
  LOG_HOURS = "Log Hours",
  OK = "OK",
}

export enum MobileTimesheetMessage {
  HOURS_ASSIGNED_LEAVE = "Hours are already assigned for this leave status and cannot be edited.",
  HOURS_ASSIGNED_CLIENT = "Hours are already assigned for this client visit status and cannot be edited.",
  HOURS_ASSIGNED_WFH = "Hours are already assigned for this work from home status and cannot be edited.",
  MAX_HOURS_PREFIX = "Maximum ",
  MAX_HOURS_SUFFIX = " hours allowed",
  FULL_DAY_PREFIX = "Full Day - ",
  HALF_DAY_PREFIX = "Half Day - ",
  HOURS_ASSIGNED_GENERIC_PREFIX = "Hours are already assigned for this ",
  HOURS_ASSIGNED_GENERIC_SUFFIX = " attendance and cannot be edited.",
  HOURS_ASSIGNED_STATUS_SUFFIX = " status and cannot be edited.",
  HOURS_ASSIGNED_HALF_DAY = "Hours are already assigned for this half day where the 1st half is",
  ENTER_HOURS_PLACEHOLDER = "Enter hours (0 - ",
}