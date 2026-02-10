

export interface TodayAttendanceProps {
  setActiveTab?: (tab: string) => void;
  setScrollToDate?: (date: number | null) => void;
  onNavigate?: (timestamp: number) => void;
  viewOnly?: boolean;
}

export interface TimesheetProps {
  now?: Date;
  employeeId?: string;
  readOnly?: boolean;
  selectedDateId?: number | null;
  onBlockedClick?: () => void;
  containerClassName?: string;
}

export interface AttendanceStatsCardsProps {
  year: number;
  month: number;
  leaveBalance: any;
  attendanceRecords: any[];
  isIntern: boolean;
  joiningDate?: string | Date;
}

export interface AttendancePieChartProps {
  data: any[];
  currentMonth: Date;
}

export interface WorkTrendsGraphProps {
  employeeId?: string;
  currentMonth: Date;
}
