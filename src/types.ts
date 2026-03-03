import { AttendanceStatus, WorkLocation, EmploymentType, Gender } from './enums';

export interface TimesheetEntry {
    loginTime: any;
    logoutTime: any;
    isSavedLogout: boolean;
    date: number;
    fullDate: Date;
    dayName: string;
    formattedDate: string;
    isToday: boolean;
    isWeekend: boolean;
    isFuture: boolean;

    // Editable Fields
    status: AttendanceStatus | undefined;
    attendanceType?: 'login' | 'logout' | null;
    isEditing: boolean;
    isSaved: boolean;
    totalHours?: number | null;
    workLocation?: WorkLocation | string;
    sourceRequestId?: number; // Track auto-generated records
    firstHalf?: string | WorkLocation | null;
    secondHalf?: string | WorkLocation | null;
}
