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
    location?: string;
    status: 'Full Day' | 'Half Day' | 'WFH' | 'Client Visit' | 'Pending' | 'Leave' | 'Not Updated';
    attendanceType?: 'login' | 'logout' | null;
    isEditing: boolean;
    isSaved: boolean;
    totalHours?: number;
}
