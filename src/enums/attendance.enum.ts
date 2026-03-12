export enum AttendanceStatus {
    FULL_DAY = 'Full Day',
    HALF_DAY = 'Half Day',
    LEAVE = 'Leave',
    PENDING = 'Pending',
    NOT_UPDATED = 'Not Updated',
    WEEKEND = 'Weekend',
    HOLIDAY = 'Holiday',
    ABSENT = 'Absent',
    UPCOMING = 'UPCOMING',
    WFH = 'WFH',
    CLIENT_VISIT = 'Client Visit',
    PRESENT = 'Present',
}

export enum WorkLocation {
    WORK_FROM_HOME = 'Work From Home',
    WFH = 'WFH',
    CLIENT_VISIT = 'Client Visit',
    OFFICE = 'Office',
    PRESENT = 'Present',
}

export enum WorkLocationKeyword {
    WFH = 'wfh',
    WORK_FROM_HOME = 'work from home',
    CLIENT_VISIT = 'client visit',
    OFFICE = 'office',
    PRESENT = 'present',
}

export enum MonthStatus {
    PENDING = 'Pending',
    SUBMITTED = 'Submitted',
}

export enum HalfDayType {
    FIRST_HALF = 'First Half',
    SECOND_HALF = 'Second Half',
    FULL_DAY = 'Full Day',
    SPLIT_DAY = 'Split Day',
    HALF_DAY = 'Half Day',
}
