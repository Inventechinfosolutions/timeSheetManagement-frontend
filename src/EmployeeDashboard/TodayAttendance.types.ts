export interface TodayAttendanceProps {
  setActiveTab?: (tab: string) => void;
  setScrollToDate?: (date: number | null) => void;
  onNavigate?: (timestamp: number) => void;
  viewOnly?: boolean;
}

export interface DesktopViewProps {
  viewOnly: boolean;
  headerProps: any;
  showInternDataBanner: boolean;
  showConversionBanner: boolean;
  entity: any;
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  leaveBalance: any;
  yearlyRecords: any[];
  isIntern: boolean;
  joiningDate?: string | Date;
  conversionDate?: string | Date;
  trends: any[];
  monthlyLeaveBalance: any;
  leaveLoading: boolean;
  currentMonthEntries: any[];
  now: Date;
  handleNavigate: (timestamp: number) => void;
  fetchDashboardData: (date: Date) => void;
  dashboardFetchedKey: React.MutableRefObject<string | null>;
  currentEmployeeId?: string;
}

export interface MobileViewProps extends DesktopViewProps {}