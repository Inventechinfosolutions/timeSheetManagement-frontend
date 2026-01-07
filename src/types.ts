export interface TimesheetEntry {
    date: number;
    fullDate: Date;
    dayName: string;
    formattedDate: string;
    isToday: boolean;
    isWeekend: boolean;
    isFuture: boolean;

    // Editable Fields
    location: 'Office' | 'WFH' | 'Client Visit' | null;
    loginTime: string;
    logoutTime: string;
    status: 'Present' | 'Absent' | 'Half Day' | 'WFH' | 'Pending' | 'Client Visit';
    isEditing: boolean;
    isSaved: boolean;
}
