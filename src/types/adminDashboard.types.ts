export type TodayCategory =
  | "office"
  | "wfh"
  | "clientVisit"
  | "onLeave"
  | "halfDay"
  | "notUpdated";

export type DashboardEventType = "BIRTHDAY" | "ANNIVERSARY" | "HOLIDAY";

export interface DashboardEmployeeBrief {
  employeeId: string;
  fullName: string;
  department: string | null;
  designation: string | null;
}

export interface TodaySnapshot {
  date: string;
  isWorkingDay: boolean;
  isWeekend: boolean;
  holidayName: string | null;
  counts: Record<TodayCategory, number>;
  employees: Record<TodayCategory, DashboardEmployeeBrief[]>;
}

export interface PendingRequestItem {
  id: number;
  employeeId: string;
  fullName: string | null;
  department: string | null;
  designation?: string | null;
  requestType: string;
  fromDate: string;
  toDate: string;
  duration: number;
  status: string;
  createdAt: string;
}

export interface PendingApprovals {
  total: number;
  byStatus: { pending: number; cancellation: number; modification: number };
  byType: Record<string, number>;
  recent: PendingRequestItem[];
  /** Every actionable request, newest first. */
  items: PendingRequestItem[];
}

export interface DashboardEvent {
  type: DashboardEventType;
  date: string;
  daysAway: number;
  title: string;
  employeeId?: string;
  fullName?: string;
  department?: string | null;
  designation?: string | null;
  years?: number;
}

/** "admin" = whole organisation, "manager" = employees mapped to the logged-in manager. */
export type DashboardScope = "admin" | "manager";

export interface AdminDashboardSummary {
  generatedAt: string;
  totalEmployees: number;
  today: TodaySnapshot;
  pendingApprovals: PendingApprovals;
  events: { windowDays: number; items: DashboardEvent[] };
}

export interface AdminDashboardState {
  /** Scope the current `summary` / `attendance` belong to. */
  scope: DashboardScope | null;
  summary: AdminDashboardSummary | null;
  loading: boolean;
  error: string | null;
  attendance: TodaySnapshot | null;
  attendanceLoading: boolean;
  attendanceError: string | null;
}
