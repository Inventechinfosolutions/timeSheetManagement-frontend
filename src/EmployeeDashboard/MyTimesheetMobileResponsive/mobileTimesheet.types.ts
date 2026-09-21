import { Dispatch, SetStateAction } from "react";
import { TimesheetEntry } from "../../types";

export interface MobileTimesheetBlocker {
  blockedFrom: string | Date;
  blockedTo: string | Date;
  reason?: string;
}

export interface MobileHoliday {
  holidayDate?: string | Date;
  date?: string | Date;
  holidayName?: string;
  name?: string;
}

export interface MobileTimesheetInputModalState {
  open: boolean;
  index: number | null;
  value: string;
  entry: (TimesheetEntry & {
    isBlockedHalfDay?: boolean;
    isBlockedHalfLeave?: boolean;
  }) | null;
}

export interface MobileTimesheetProps {
  now: Date;
  loading: boolean;
  localEntries: TimesheetEntry[];
  paddingDays: number;
  monthTotalHours: number;
  holidays?: MobileHoliday[];
  selectedDateId: number | null;
  isHighlighted: boolean;
  effectiveReadOnly: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAdminView: boolean;
  isManagerView: boolean;
  isViewedMonthEligible: boolean;
  containerClassName?: string;
  showAutoUpdateModal: boolean;
  showSuccessModal: boolean;
  isAutoUpdating: boolean;
  updateResult: { count: number } | null;
  setShowAutoUpdateModal: Dispatch<SetStateAction<boolean>>;
  setShowSuccessModal: Dispatch<SetStateAction<boolean>>;
  confirmAutoUpdate: () => void | Promise<void>;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleAutoUpdateClick: () => void;
  handleHoursInput: (entryIndex: number, value: string) => void;
  onSaveAll: () => void | Promise<void>;
  isDateBlocked: (date: Date) => boolean;
  onBlockedClick?: () => void;
}

export interface MobileTimesheetPreview {
  bg: string;
  text: string;
  label: string;
}
