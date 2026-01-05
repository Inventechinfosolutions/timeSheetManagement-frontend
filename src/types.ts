export interface TimesheetEntry {
    date: number;
    fullDate: Date;
    dayName: string;
    formattedDate: string;
    isToday: boolean;
    isWeekend: boolean;
    isFuture: boolean;

    // Editable Fields
    attendanceType: 'login' | 'logout' | null;
    loginTime: string;
    logoutTime: string;
    status: 'Present' | 'Absent' | 'Half Day';
    isEditing: boolean;
    isSaved: boolean;
}
