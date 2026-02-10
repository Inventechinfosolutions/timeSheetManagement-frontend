import { LayoutGrid, Calendar, Eye, User, Settings, Users, AlarmClock, Bell } from "lucide-react";

// SidebarLayout Types
export interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  title?: string;
}

// AdminEmployeeCalendarView Types
export interface AdminEmployeeCalendarViewProps {
  onBlockedClick?: () => void;
  onNavigateToDate?: (timestamp: number) => void;
}

// DailyStatusMobileCard Types
export interface DailyStatusEmployee {
  id: string;
  fullName?: string;
  name?: string;
  employeeId?: string;
  department: string;
  todayHours: number;
  status: string;
  avatar: string;
  deptColor: string;
}

export interface DailyStatusMobileCardProps {
  employees: DailyStatusEmployee[];
}

// EmpWorkingDetailsMobileCard Types
export interface WorkingDetailsEmployee {
  id: string;
  name: string;
  department: string;
}

export interface EmpWorkingDetailsMobileCardProps {
  employees: WorkingDetailsEmployee[];
  onViewDetails: (empId: string) => void;
  onViewTimesheet: (empId: string) => void;
}

// EmployeeListMobileCard Types
export interface ListEmployee {
  id: string;
  name: string;
  department: string;
  rawId: string;
  resetRequired: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoggedIn?: string | null;
  isAdmin: boolean;
}

export interface EmployeeListMobileCardProps {
  employees: ListEmployee[];
  onViewDetails: (empId: string) => void;
  onViewDashboard: (empId: string) => void;
  onResendActivation: (empId: string) => void;
  onToggleStatus: (empId: string) => void;
  isAdmin: boolean;
}

// EmployeeTimeSheetMobileCard Types
export interface TimeSheetEmployee {
  id: string;
  name: string;
  department: string;
  status: string;
}

export interface EmployeeTimeSheetMobileCardProps {
  employees: TimeSheetEmployee[];
  onViewTimesheet: (empId: string) => void;
  onViewWorkingDetails: (empId: string) => void;
}

// MobileView Types
export interface MobileViewEmployee {
  id: string;
  name: string;
  dept: string;
  login: string;
  logout: string;
  hours: string;
  status: string;
  avatar: string;
}

export interface MobileViewProps {
  employees: MobileViewEmployee[];
  onViewTimesheet: (empId: string) => void;
  onSelectEmployee: (empId: string) => void;
}
