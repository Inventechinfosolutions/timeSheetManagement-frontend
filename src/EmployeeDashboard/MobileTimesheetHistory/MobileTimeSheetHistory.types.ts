export interface TimesheetEntry {
  date: number;
  status: string;
  isWeekend?: boolean;
}

export interface BlockerEntry {
  blockedFrom: string;
  blockedTo: string;
  blockedBy?: string;
}

export interface HolidayEntry {
  holidayDate?: string;
  date?: string;
}