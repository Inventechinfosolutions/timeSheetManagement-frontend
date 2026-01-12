import { EmployeeAttendance, AttendanceStatus } from '../reducers/employeeAttendance.reducer';
import { TimesheetEntry } from '../types';

/**
 * Checks if a given date falls within the current editable week (Mon-Fri).
 * Returns true if the date is in the current week (Mon-Fri) and today is not past Friday 11:59 PM.
 * Returns false if the date is in a past week or if the date itself is a weekend.
 */
export const isEditableWeek = (date: Date | string): boolean => {
    const today = new Date();
    const checkDate = new Date(date);
    
    // Normalize Check Date
    checkDate.setHours(0,0,0,0);

    // 1. Block Weekends Always
    const day = checkDate.getDay();
    if (day === 0 || day === 6) return false;

    // 2. Define Current Week Range (Mon-Fri)
    const todayDay = today.getDay(); // 0=Sun, 1=Mon...
    
    const currentMon = new Date(today);
    // If today is Sun(0), go back 6 days. If Mon(1), go back 0. If Sat(6), go back 5.
    const diffToMon = todayDay === 0 ? -6 : 1 - todayDay;
    currentMon.setDate(today.getDate() + diffToMon);
    currentMon.setHours(0,0,0,0);

    const currentFri = new Date(currentMon);
    currentFri.setDate(currentMon.getDate() + 4);
    currentFri.setHours(23,59,59,999);


    return checkDate >= currentMon && checkDate <= currentFri;
};

/**
 * Checks if a given date falls within the editable month window.
 * Matches Backend Logic:
 * 1. Current Month or Future -> ALWAYS Editable
 * 2. Previous Month -> Editable ONLY if Today is 1st of month AND Time < 6 PM
 * 3. Any other past month -> LOCKED
 */
export const isEditableMonth = (date: Date | string): boolean => {
    const today = new Date();
    const workDate = new Date(date);
    
    // Normalize to compare months
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    
    const workYear = workDate.getFullYear();
    const workMonth = workDate.getMonth();
    
    // Calculate month difference
    const monthDiff = (todayYear - workYear) * 12 + (todayMonth - workMonth);
    
    // 1. Current Month or Future -> ALWAYS Editable
    if (monthDiff <= 0) {
        return true;
    }
    
    // 2. Previous Month -> Editable ONLY if Today is 1st of month AND Time < 6 PM
    if (monthDiff === 1) {
        if (today.getDate() === 1 && today.getHours() < 18) {
            return true;
        }
    }
    
    // 3. Any other past month -> LOCKED
    return false;
};

/**
 * Converts backend EmployeeAttendance to frontend TimesheetEntry for UI display.
 * This ensures the components can still use the helper flags like isToday, isWeekend, etc.
 */
// Map Backend Status enum to Frontend UI strings
export const mapStatus = (
    status: AttendanceStatus | undefined, 
    isFuture: boolean, 
    isToday: boolean, 
    isWeekend: boolean,
    totalHours?: number
): TimesheetEntry['status'] => {
    // 1. Trust DB Status for finalized records
    // Source of Truth: If the DB says something, we show it.
    if (status) {
        // Fix: If backend says "Leave" but there are valid totalHours, override it.
        // This handles case where backend converts "No Login Time" -> "Leave" despite hours existing.
        if (status === AttendanceStatus.LEAVE && totalHours && totalHours > 0) {
             return totalHours >= 6 ? 'Full Day' : 'Half Day';
        }

        if (status === AttendanceStatus.LEAVE) return 'Leave'; // Explicit backend LEAVE
        
        // Use DB status unless it's just PENDING for Today (we want to show live predictions if user is typing)
        if (status !== AttendanceStatus.PENDING || !isToday) {
            switch (status) {
                case AttendanceStatus.FULL_DAY: return 'Full Day';
                case AttendanceStatus.HALF_DAY: return 'Half Day';
                case AttendanceStatus.NOT_UPDATED: return 'Not Updated';
                case AttendanceStatus.PENDING: return 'Pending';
                default: break;
            }
        }
    }

    // 2. Future or Weekend (with no data) defaults to No Status (undefined)
    if (isFuture) return undefined;
    if (isWeekend) return undefined;

    return isToday ? 'Pending' : 'Not Updated';
};

/**
 * Converts backend EmployeeAttendance to frontend TimesheetEntry for UI display.
 * This ensures the components can still use the helper flags like isToday, isWeekend, etc.
 */
export const mapAttendanceToEntry = (
    date: Date, 
    now: Date, 
    attendance?: EmployeeAttendance
): TimesheetEntry => {
    const i = date.getDate();
    const isToday = i === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    const checkNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const isFuture = checkDate > checkNow;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // Handle potential snake_case from backend
    const totalHours = attendance?.totalHours ?? (attendance as any)?.total_hours;

    return {
        date: i,
        fullDate: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday,
        isWeekend,
        isFuture,
        totalHours, // Ensure this is passed to the UI
        status: mapStatus(attendance?.status, isFuture, isToday, isWeekend, totalHours),
        isEditing: false,
        isSaved: !!attendance?.id,
    } as TimesheetEntry;
};

/**
 * Generates a full month of TimesheetEntry objects, merging in actual attendance records where they exist.
 */
export const generateMonthlyEntries = (date: Date, now: Date, records: EmployeeAttendance[]): TimesheetEntry[] => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const entries: TimesheetEntry[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const currentLoopDate = new Date(date.getFullYear(), date.getMonth(), i);
        
        // Find record for this specific day using YYYY-MM-DD comparison
        const loopDateStr = `${currentLoopDate.getFullYear()}-${(currentLoopDate.getMonth() + 1).toString().padStart(2, '0')}-${currentLoopDate.getDate().toString().padStart(2, '0')}`;
        
        const actualRecord = records.find(r => {
            // Handle camelCase vs snake_case
            const rawDate = r.workingDate || (r as any).working_date;
            if (!rawDate) return false;

            let rYear, rMonth, rDay;
            
            if (typeof rawDate === 'string') {
                // Check if it's ISO string or Date only
                if (rawDate.includes('T')) {
                     const d = new Date(rawDate);
                     rYear = d.getFullYear();
                     rMonth = d.getMonth() + 1;
                     rDay = d.getDate();
                } else {
                     // Assume YYYY-MM-DD
                     const parts = rawDate.split('-');
                     rYear = parseInt(parts[0]);
                     rMonth = parseInt(parts[1]);
                     rDay = parseInt(parts[2]);
                }
            } else {
                const d = new Date(rawDate);
                rYear = d.getFullYear();
                rMonth = d.getMonth() + 1;
                rDay = d.getDate();
            }

            const rDateStr = `${rYear}-${rMonth.toString().padStart(2, '0')}-${rDay.toString().padStart(2, '0')}`;
            return rDateStr === loopDateStr;
        });

        entries.push(mapAttendanceToEntry(currentLoopDate, now, actualRecord));
    }
    return entries;
};


