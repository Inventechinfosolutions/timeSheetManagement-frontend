import { EmployeeAttendance, AttendanceStatus, OfficeLocation } from '../reducers/employeeAttendance.reducer';
import { TimesheetEntry } from '../types';

/**
 * Converts backend EmployeeAttendance to frontend TimesheetEntry for UI display.
 * This ensures the components can still use the helper flags like isToday, isWeekend, etc.
 */
// Map Backend Status enum to Frontend UI strings
export const mapStatus = (
    status: AttendanceStatus | undefined, 
    loginTime: string | null, 
    logoutTime: string | null, 
    isFuture: boolean, 
    isToday: boolean, 
    isWeekend: boolean
): TimesheetEntry['status'] => {
    // 1. Trust DB Status for saved/past records
    // Source of Truth: If the DB has a finalized status, we must show it exactly as-is.
    // We only ignore PENDING for Today so we can show predicted status while typing.
    if (status && (status !== AttendanceStatus.PENDING || !isToday)) {
        switch (status) {
            case AttendanceStatus.FULL_DAY: return 'Full Day';
            case AttendanceStatus.HALF_DAY: return 'Half Day';
            case AttendanceStatus.LEAVE: return 'Leave';
            case AttendanceStatus.NOT_UPDATED: return 'Not Updated';
            default: break;
        }
    }

    // 2. Future or Weekend (with no data) defaults to Absent
    // If loginTime exists on a weekend, we proceed to calculate status
    if ((isFuture || isWeekend) && !loginTime) return 'Leave';

    // 3. Local Calculation for active Today edits or fallback
    if (loginTime && logoutTime && loginTime !== '--:--' && logoutTime !== '--:--') {
        const parseTime = (timeStr: string) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            else if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };

        try {
            const loginMins = loginTime.includes(' ') ? parseTime(loginTime) : (() => {
                const [h, m] = loginTime.split(':').map(Number);
                return h * 60 + m;
            })();
            const logoutMins = logoutTime.includes(' ') ? parseTime(logoutTime) : (() => {
                const [h, m] = logoutTime.split(':').map(Number);
                return h * 60 + m;
            })();

            const totalDecimal = (logoutMins - loginMins) / 60;
            if (totalDecimal >= 6) return 'Full Day';
            if (totalDecimal <= 6) return 'Half Day';
            return 'Leave';
        } catch (e) {
            // fall through
        }
    }

    // 4. Default Rules for Current/Passed Days with missing times
    if (isToday) {
        if (loginTime && !logoutTime) return 'Pending';
    } else if (!isFuture) {
        // Passed Days
        if (loginTime && !logoutTime) return 'Not Updated';
        if (!loginTime) return 'Leave';
    }

    return isToday ? 'Pending' : 'Leave';
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

    // Map Backend Location enum to Frontend UI strings
    const mapLocation = (loc?: OfficeLocation): TimesheetEntry['location'] => {
        if (!loc) return null;
        switch (loc) {
            case OfficeLocation.OFFICE: return 'Office';
            case OfficeLocation.WORK_FROM_HOME: return 'WFH';
            case OfficeLocation.CLIENT_PLACE: return 'Client Visit';
            default: return null;
        }
    };

    const loginTime = attendance?.loginTime || '';
    const logoutTime = attendance?.logoutTime || '';

    return {
        date: i,
        fullDate: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday,
        isWeekend,
        isFuture,
        location: mapLocation(attendance?.location),
        loginTime,
        logoutTime,
        status: mapStatus(attendance?.status, loginTime || null, logoutTime || null, isFuture, isToday, isWeekend),
        isEditing: false,
        isSaved: !!attendance?.id,
        isSavedLogout: !!attendance?.logoutTime
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
            const rDate = new Date(r.workingDate);
            const rDateStr = `${rDate.getFullYear()}-${(rDate.getMonth() + 1).toString().padStart(2, '0')}-${rDate.getDate().toString().padStart(2, '0')}`;
            return rDateStr === loopDateStr;
        });

        entries.push(mapAttendanceToEntry(currentLoopDate, now, actualRecord));
    }
    return entries;
};

/**
 * Calculates total working hours between login and logout times.
 */
export const calculateTotal = (login: string, logout: string) => {
    if (!login || !logout || login === '--:--' || logout === '--:--') return '--:--';
    
    const parseTime = (timeStr: string) => {
        const parts = timeStr.split(' ');
        const timePart = parts[0];
        const period = parts[1];
        
        let [hours, minutes] = timePart.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        
        if (period === 'PM' && hours !== 12) hours += 12;
        else if (period === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
    };

    try {
        const loginMins = login.includes(' ') ? parseTime(login) : (() => {
            const [h, m] = login.split(':').map(Number);
            return (isNaN(h) || isNaN(m)) ? null : h * 60 + m;
        })();
        
        const logoutMins = logout.includes(' ') ? parseTime(logout) : (() => {
            const [h, m] = logout.split(':').map(Number);
            return (isNaN(h) || isNaN(m)) ? null : h * 60 + m;
        })();

        if (loginMins === null || logoutMins === null) return '--:--';

        let diffMinutes = logoutMins - loginMins;
        if (diffMinutes < 0) return '--:--';
        
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (e) {
        return '--:--';
    }
};

/**
 * Formats 24h time to 12h format with AM/PM.
 */
export const formatTo12H = (time24: string) => {
    if (!time24 || time24 === '--:--' || time24.includes('--')) return '';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    
    let [hours, minutes] = time24.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};
