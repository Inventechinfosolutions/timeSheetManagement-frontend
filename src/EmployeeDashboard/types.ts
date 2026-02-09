import { AttendanceStatus } from "./enums";

export interface AttendanceRecord {
  workingDate: string;
  status: AttendanceStatus | string;
  totalHours?: number;
}

export interface AttendanceStatsCardsProps {
  year: number;
  month: number;
  leaveBalance: any;
  attendanceRecords: AttendanceRecord[];
  isIntern: boolean;
  joiningDate?: string | Date;
}

export interface MyTimesheetProps {
  now?: Date;
  employeeId?: string;
  readOnly?: boolean;
  selectedDateId?: number | null;
  onBlockedClick?: () => void;
  containerClassName?: string;
}

export interface TodayAttendanceProps {
  setActiveTab?: (tab: string) => void;
  setScrollToDate?: (date: number | null) => void;
  onNavigate?: (timestamp: number) => void;
  viewOnly?: boolean;
}

export interface LeaveRequest {
  id?: number;
  employeeId?: string;
  requestType: string;
  status: string;
  fromDate: string;
  toDate?: string;
  reason?: string;
}
