export interface TimesheetEntry {
    date: number;
    fullDate: Date;
    dayName: string;
    formattedDate: string;
    isToday: boolean;
    isWeekend: boolean;
    isFuture: boolean;

    // Editable Fields
    location?: 'Office' | 'WFH' | 'Client Visit' | null;
    loginTime: string;
    logoutTime: string;
    status: 'Full Day' | 'Half Day' | 'WFH' | 'Client Visit' | 'Pending' | 'Leave' | 'Not Updated';
    attendanceType?: 'login' | 'logout' | null;
    isEditing: boolean;
    isSaved: boolean;
    isSavedLogout?: boolean;
}
