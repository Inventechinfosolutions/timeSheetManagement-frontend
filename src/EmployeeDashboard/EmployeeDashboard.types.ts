export interface DashboardProps {
  setActiveTab?: (tab: string) => void;
  setScrollToDate?: (date: number | null) => void;
  onNavigate?: (timestamp: number) => void;
  viewOnly?: boolean;
}

export interface HeaderProps {
  currentUser: any;
  entity: any;
  isMyRoute: boolean;
  displayEntry: any;
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  UserType: any;
}

export interface BannerProps {
  showInternDataBanner: boolean;
  showConversionBanner: boolean;
  entity: any;
}