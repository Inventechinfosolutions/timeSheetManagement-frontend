export enum EmploymentType {
    FULL_TIMER = 'FULL_TIMER',
    INTERN = 'INTERN',
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

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
    status: 'Full Day' | 'Half Day' | 'WFH' | 'Client Visit' | 'Pending' | 'Leave' | 'Absent' | 'Not Updated' | 'Holiday' | 'Weekend' |'Blocked' | undefined;
    attendanceType?: 'login' | 'logout' | null;
    isEditing: boolean;
    isSaved: boolean;
    totalHours?: number | null;
    workLocation?: string;
    sourceRequestId?: number; // Track auto-generated records
    firstHalf?: string | null;
    secondHalf?: string | null;
}
