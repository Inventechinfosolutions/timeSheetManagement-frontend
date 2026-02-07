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
    // location, loginTime, logoutTime removed as per DB schema changes
    status: 'Full Day' | 'Half Day' | 'WFH' | 'Client Visit' | 'Pending' | 'Leave' | 'Absent' | 'Not Updated' | 'Holiday' | 'Weekend' |'Blocked' | undefined;
    attendanceType?: 'login' | 'logout' | null;
    isEditing: boolean;
    isSaved: boolean;
    totalHours?: number;
    workLocation?: string;
    sourceRequestId?: number; // Track auto-generated records
}
   