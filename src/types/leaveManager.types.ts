export type LeaveCalculationType = 'AUTO' | 'MANUAL';

export interface LeaveDepartment {
  id: number;
  departmentName: string;
  departmentCode: string;
  leaveCalculationType: LeaveCalculationType;
  employeeCount: number;
  manualEntriesCount: number;
}

export interface LeaveManagerEmployee {
  employeeId: string;
  fullName: string;
  designation: string;
  employmentType: string | null;
  /** Intern this month (1.0 leave/month) vs full timer (1.5 leave/month). */
  isIntern: boolean;
  joiningDate: string | null;
  /** Leaves accrued this year up to the current month. */
  accrued: number;
  /** Admin-entered total leaves taken; null if not entered yet. */
  totalLeavesTaken: number | null;
  /** Approved leave requested after the entry date. */
  usedAfterEntry: number;
  asOfDate: string | null;
  available: number;
}

export interface LeaveManagerEmployeesResponse {
  department: string;
  leaveCalculationType: LeaveCalculationType;
  year: number;
  accruedUptoMonth: number;
  employees: LeaveManagerEmployee[];
}

export interface SaveLeaveEntriesPayload {
  year: number;
  entries: { employeeId: string; totalLeavesTaken: number }[];
}

export interface LeaveManagerState {
  departments: LeaveDepartment[];
  departmentsLoading: boolean;
  employees: LeaveManagerEmployeesResponse | null;
  employeesLoading: boolean;
  saving: boolean;
  error: string | null;
}
