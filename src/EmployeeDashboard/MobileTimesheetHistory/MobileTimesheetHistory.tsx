import { useState, useMemo, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Download,
    X,
    Loader2,
    Calendar as CalendarIcon,
    AlertCircle,
    // Lock,
    Briefcase,
    Home,
    Clock,
    CalendarX,
    CalendarDays,
    Building2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { RootState } from "../../store";
import {
    downloadAttendancePdfReport,
    fetchMyTimesheet,
} from "../../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../../reducers/masterHoliday.reducer";
import { TimesheetEntry, BlockerEntry, HolidayEntry } from "../../types";
import { AttendanceStatus, UserType, WorkLocationKeyword } from "../../enums";
import { generateMonthlyEntries } from "../../utils/attendanceUtils";
import { saveAs } from "file-saver";
import "./MobileTimesheetHistory.css";

interface MobileTimesheetHistoryProps {
    employeeId?: string;
    entries?: TimesheetEntry[];
    currentDate?: Date;
    hideMonthNavigation?: boolean;
    onNavigateToDate?: (timestamp: number) => void;
}

interface NormalizedDay {
    date: number;
    fullDate: Date;
    status: string | null;
    totalHours: number | null;
    workLocation: string | null;
    firstHalf: string;
    secondHalf: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** dayjs format token used everywhere a YYYY-MM-DD string is produced. */
const DATE_FORMAT = "YYYY-MM-DD";

/** BCP-47 locale tag used for date localisation (month/year label). */
const LOCALE = "en-US";

/**
 * Sentinel value used when a day falls inside a manual blocker date range
 * but has no other attendance status recorded.
 * Kept lowercase so it can be compared directly against normalize() output.
 */
const BLOCKED_STATUS = "blocked";

/**
 * Canonical weekend keyword used as a map key in STATUS_BACKGROUND_COLOR.
 * Reuses the lowercased AttendanceStatus so there is one source of truth.
 */
const WEEKEND_KEY = AttendanceStatus.WEEKEND.toLowerCase();

/** Application route path segments and base paths used for navigation. */
const ROUTE_PATHS = {
    MY_DASHBOARD: "my-dashboard",
    MY_TIMESHEET: "my-timesheet",
    TIMESHEET_VIEW: "timesheet-view",
    EMPLOYEE_DASHBOARD: "/employee-dashboard",
    MANAGER_DASHBOARD: "/manager-dashboard",
    ADMIN_DASHBOARD: "/admin-dashboard",
} as const;

/** Today's indicator colour — kept as a named constant to avoid magic hex values in JSX. */
const TODAY_TEXT_COLOR = "#4318FF";

/**
 * CSS class names applied to individual calendar day cells according to their
 * resolved status. Centralised here so changes only need to happen in one
 * place and can be referenced type-safely throughout the file.
 */
const DAY_STATUS_CLASS = {
    BLOCKED: "day-status-blocked",
    HOLIDAY: "day-status-holiday",
    WEEKEND: "day-status-weekend",
    LEAVE: "day-status-leave",
    FULL_DAY: "day-status-fullday",
    HALF_DAY: "day-status-halfday",
    ABSENT: "day-status-absent",
    WFH: "day-status-wfh",
    CLIENT: "day-status-client",
    DEFAULT: "day-status-default",
    TODAY: "day-status-today",
} as const;

/**
 * Background colours used for day cells and split-day blocks.
 * Keys are the WorkLocationKeyword enum values (already lowercase) or
 * lowercased AttendanceStatus display strings to stay consistent with
 * how statuses arrive from the API.
 *
 * Values are kept in lockstep with DAY_TONE_COLORS[*].bgHex in
 * MobileTimesheet.tsx so both views render identical colours for the
 * same status/location.
 */
const STATUS_BACKGROUND_COLOR: Record<string, string> = {
    [WorkLocationKeyword.OFFICE]: "#E6FFFA",
    [AttendanceStatus.FULL_DAY.toLowerCase()]: "#E6FFFA",
    [WorkLocationKeyword.WFH]: "#d2dcfcff",
    [WorkLocationKeyword.WORK_FROM_HOME]: "#d2dcfcff",
    [WorkLocationKeyword.CLIENT]: "#f2fcbd",
    [WorkLocationKeyword.CLIENT_VISIT]: "#f2fcbd",
    [WorkLocationKeyword.CLIENT_PLACE]: "#f2fcbd",
    [AttendanceStatus.LEAVE.toLowerCase()]: "#FECACA",
    [WEEKEND_KEY]: "#FEE2E2",
    [AttendanceStatus.HOLIDAY.toLowerCase()]: "#DBEAFE",
    [AttendanceStatus.ABSENT.toLowerCase()]: "#FECACA",
    [AttendanceStatus.HALF_DAY.toLowerCase()]: "#FEF3C7",
    default: "#F8FAFC",
};

/**
 * Text colours keyed by the DAY_STATUS_CLASS values so a single lookup
 * drives the colour of every element inside a day cell.
 *
 * Values are kept in lockstep with DAY_TONE_COLORS[*].textHex in
 * MobileTimesheet.tsx so both views render identical colours for the
 * same status/location.
 */
const STATUS_CLASS_TEXT_COLOR: Record<string, string> = {
    [DAY_STATUS_CLASS.BLOCKED]: "#4b5563",
    [DAY_STATUS_CLASS.HOLIDAY]: "#1890FF",
    [DAY_STATUS_CLASS.LEAVE]: "#DC2626",
    [DAY_STATUS_CLASS.WEEKEND]: "#EE5D50",
    [DAY_STATUS_CLASS.FULL_DAY]: "#01B574",
    [DAY_STATUS_CLASS.HALF_DAY]: "#FFB020",
    [DAY_STATUS_CLASS.ABSENT]: "#DC2626",
    [DAY_STATUS_CLASS.WFH]: "#4F46E5",
    [DAY_STATUS_CLASS.CLIENT]: "#4318FF",
    [DAY_STATUS_CLASS.DEFAULT]: "#64748B",
};

/**
 * Legend items defined as module-level data so they are created once, not
 * on every render, and so the JSX stays purely declarative.
 */
const LEGEND_ITEMS = [
    { label: AttendanceStatus.FULL_DAY, colorClass: "legend-colorClass-fullday" },
    { label: "Half Day Leave", colorClass: "legend-colorClass-halfday" },
    { label: AttendanceStatus.ABSENT, colorClass: "legend-colorClass-absent" },
    { label: AttendanceStatus.LEAVE, colorClass: "legend-colorClass-leave" },
    { label: AttendanceStatus.WFH, colorClass: "legend-colorClass-wfh" },
    { label: "Today", colorClass: "legend-colorClass-today" },
    { label: AttendanceStatus.CLIENT_VISIT, colorClass: "legend-colorClass-client" },
    { label: AttendanceStatus.NOT_UPDATED, colorClass: "legend-colorClass-default" },
    { label: AttendanceStatus.HOLIDAY, colorClass: "legend-colorClass-holiday" },
    { label: "Upcoming", colorClass: "legend-colorClass-default" },
    { label: "Blocked", colorClass: "legend-colorClass-blocked" },
] as const;

/** Weekday column header labels, Sunday-first to match JS Date.getDay(). */
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/** Lowercases and trims a string; returns "" for null/undefined input. */
const normalize = (value?: string | null): string =>
    (value ?? "").toLowerCase().trim();

/** Returns true if the normalised location string maps to Work-From-Home. */
const isWfhLocation = (value?: string | null): boolean => {
    const normalizedLocation = normalize(value);
    return normalizedLocation === WorkLocationKeyword.WFH || normalizedLocation === WorkLocationKeyword.WORK_FROM_HOME;
};

/** Returns true if the normalised location string maps to a client-site visit. */
const isClientLocation = (value?: string | null): boolean => {
    const normalizedLocation = normalize(value);
    return (
        normalizedLocation === WorkLocationKeyword.CLIENT ||
        normalizedLocation === WorkLocationKeyword.CLIENT_VISIT ||
        normalizedLocation === WorkLocationKeyword.CLIENT_PLACE
    );
};

/** Returns the text colour for a given status CSS class. */
const getStatusTextColor = (statusClass: string): string =>
    STATUS_CLASS_TEXT_COLOR[statusClass] ?? STATUS_CLASS_TEXT_COLOR[DAY_STATUS_CLASS.DEFAULT];

/** Returns the background colour for a given status or location string. */
const getStatusBackgroundColor = (statusOrLocation: string): string =>
    STATUS_BACKGROUND_COLOR[normalize(statusOrLocation)] ?? STATUS_BACKGROUND_COLOR.default;

/**
 * Collapses WFH aliases, client-site aliases and leave to a single canonical
 * WorkLocationKeyword value so that first/secondHalf comparisons work
 * regardless of which synonym the backend stored.
 * Returns an empty string when the location does not match any known category.
 */
const toCanonicalHalfDayLocation = (rawLocation: string): string => {
    if (rawLocation === WorkLocationKeyword.OFFICE) return WorkLocationKeyword.OFFICE;
    if (rawLocation === WorkLocationKeyword.WFH || rawLocation === WorkLocationKeyword.WORK_FROM_HOME)
        return WorkLocationKeyword.WFH;
    if (
        rawLocation === WorkLocationKeyword.CLIENT ||
        rawLocation === WorkLocationKeyword.CLIENT_VISIT ||
        rawLocation === WorkLocationKeyword.CLIENT_PLACE
    ) return WorkLocationKeyword.CLIENT;
    if (rawLocation === AttendanceStatus.LEAVE.toLowerCase()) return AttendanceStatus.LEAVE.toLowerCase();
    return "";
};

/**
 * Resolves the CSS class for a day cell based on the resolved display status
 * and, where relevant, the work location recorded for that day.
 */
const resolveStatusClassName = (
    status?: string | null,
    workLocation?: string | null,
): string => {
    const normalizedStatus = normalize(status);
    const normalizedLocation = normalize(workLocation);

    if (normalizedStatus === BLOCKED_STATUS) return DAY_STATUS_CLASS.BLOCKED;
    if (normalizedStatus === AttendanceStatus.HOLIDAY.toLowerCase()) return DAY_STATUS_CLASS.HOLIDAY;
    if (normalizedStatus === AttendanceStatus.WEEKEND.toLowerCase()) return DAY_STATUS_CLASS.WEEKEND;
    if (normalizedStatus === AttendanceStatus.LEAVE.toLowerCase()) return DAY_STATUS_CLASS.LEAVE;
    if (normalizedStatus === AttendanceStatus.ABSENT.toLowerCase()) return DAY_STATUS_CLASS.ABSENT;

    if (
        normalizedStatus === AttendanceStatus.HALF_DAY.toLowerCase() ||
        normalizedStatus.includes(AttendanceStatus.HALF_DAY.toLowerCase())
    ) return DAY_STATUS_CLASS.HALF_DAY;

    if (
        normalizedStatus === AttendanceStatus.FULL_DAY.toLowerCase() ||
        normalizedLocation === WorkLocationKeyword.OFFICE
    ) return DAY_STATUS_CLASS.FULL_DAY;

    if (isWfhLocation(normalizedStatus) || isWfhLocation(normalizedLocation))
        return DAY_STATUS_CLASS.WFH;

    if (isClientLocation(normalizedStatus) || isClientLocation(normalizedLocation))
        return DAY_STATUS_CLASS.CLIENT;

    return DAY_STATUS_CLASS.DEFAULT;
};

/**
 * Maps a resolved display status (or location string) to the short
 * uppercase label shown inside blocked day cells.
 */
const resolveStatusLabel = (displayStatus: string): string => {
    const normalizedStatus = normalize(displayStatus);

    if (normalizedStatus === BLOCKED_STATUS) return "BLOCKED";
    if (normalizedStatus === AttendanceStatus.FULL_DAY.toLowerCase()) return "FULL DAY";
    if (normalizedStatus.includes(AttendanceStatus.HALF_DAY.toLowerCase())) return "HALF DAY";
    if (normalizedStatus === AttendanceStatus.LEAVE.toLowerCase()) return "LEAVE";
    if (normalizedStatus === AttendanceStatus.ABSENT.toLowerCase()) return "ABSENT";
    if (normalizedStatus === AttendanceStatus.HOLIDAY.toLowerCase()) return "HOLIDAY";
    if (normalizedStatus === AttendanceStatus.WEEKEND.toLowerCase()) return "WEEKEND";
    if (isWfhLocation(normalizedStatus)) return "WFH";
    if (isClientLocation(normalizedStatus)) return "CLIENT VISIT";

    return AttendanceStatus.NOT_UPDATED.toUpperCase();
};

/**
 * Determines the human-readable status string to display for a given day,
 * taking into account holidays, manual blockers, weekend rules, and whether
 * the employee has logged any hours.
 */
const resolveDisplayStatus = (
    day: NormalizedDay,
    holiday: HolidayEntry | null,
    manualBlocker: BlockerEntry | null,
): string => {
    const status = (day.status ?? "").trim();
    const dayOfWeek = day.fullDate.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isWeekendDay = isSunday || isSaturday;
    const hours = Number(day.totalHours ?? 0);

    if (status === AttendanceStatus.ABSENT) return AttendanceStatus.ABSENT;
    if (holiday || status === AttendanceStatus.HOLIDAY) return AttendanceStatus.HOLIDAY;

    const hasRealStatus =
        !!status &&
        status !== AttendanceStatus.NOT_UPDATED &&
        status !== AttendanceStatus.PENDING &&
        status !== AttendanceStatus.WEEKEND;

    const hasWorkingHours =
        hours > 0 &&
        status !== AttendanceStatus.ABSENT &&
        status !== AttendanceStatus.LEAVE;

    if (isWeekendDay) {
        if (hasRealStatus) return status;
        if (hasWorkingHours) {
            const isNonWorkingFull =
                ((isSunday || !!holiday) && hours >= 1 && hours <= 9) ||
                (isSaturday && hours >= 4 && hours <= 9);
            return hours > 6 || isNonWorkingFull
                ? AttendanceStatus.FULL_DAY
                : AttendanceStatus.HALF_DAY;
        }
        return AttendanceStatus.WEEKEND;
    }

    if (hasRealStatus) return status;
    if (manualBlocker) return BLOCKED_STATUS;
    return AttendanceStatus.NOT_UPDATED;
};

/**
 * Resolves the two solid hex colours for a split-day cell background.
 * These are rendered as two exact-50%-height blocks (see JSX below) instead
 * of a CSS gradient — this matches MobileTimesheet.tsx exactly, since a
 * hard-stop gradient (`color 50%, color 50%`) can rasterize with an uneven
 * or blurry seam at small cell sizes/DPRs, whereas two real elements each
 * pinned to 50% height guarantee an always-even, crisp split.
 */
const getSplitDayHexPair = (
    firstHalf: string,
    secondHalf: string,
): { firstHex: string; secondHex: string } => {
    const firstKey = toCanonicalHalfDayLocation(normalize(firstHalf));
    const secondKey = toCanonicalHalfDayLocation(normalize(secondHalf));

    const resolveHex = (canonicalKey: string, rawValue: string): string => {
        if (canonicalKey === WorkLocationKeyword.OFFICE) return getStatusBackgroundColor(WorkLocationKeyword.OFFICE);
        if (canonicalKey === WorkLocationKeyword.WFH) return getStatusBackgroundColor(WorkLocationKeyword.WFH);
        if (canonicalKey === WorkLocationKeyword.CLIENT) return getStatusBackgroundColor(WorkLocationKeyword.CLIENT);
        if (canonicalKey === AttendanceStatus.LEAVE.toLowerCase()) return getStatusBackgroundColor(AttendanceStatus.LEAVE.toLowerCase());
        return getStatusBackgroundColor(rawValue);
    };

    return {
        firstHex: resolveHex(firstKey, firstHalf),
        secondHex: resolveHex(secondKey, secondHalf),
    };
};

/**
 * Returns true if the current month/year of `date` is before today's
 * month/year, OR if `day` is before today within the current month.
 */
const isPastDay = (day: number, currentDate: Date, today: Date): boolean => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    const isPastMonth =
        currentYear < todayYear ||
        (currentYear === todayYear && currentMonth < todayMonth);

    const isPastDayInCurrentMonth =
        currentYear === todayYear &&
        currentMonth === todayMonth &&
        day < today.getDate();

    return isPastMonth || isPastDayInCurrentMonth;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MobileTimesheetHistory = ({
    employeeId: propEmployeeId,
    entries: propEntries,
    currentDate: propCurrentDate,
    hideMonthNavigation = false,
    onNavigateToDate,
}: MobileTimesheetHistoryProps) => {
    const dispatch = useAppDispatch();
    const { records } = useAppSelector((state: RootState) => state.attendance);
    const { entity } = useAppSelector((state: RootState) => state.employeeDetails);
    const { currentUser } = useAppSelector((state: RootState) => state.user);
    const { holidays } = useAppSelector(
        (state: RootState) => state.masterHolidays ?? { holidays: [] }
    );
    const { blockers } = useAppSelector(
        (state: RootState) => state.timesheetBlocker ?? { blockers: [] }
    );

    const isAdmin = currentUser?.userType === UserType.ADMIN;
    const isManager =
        currentUser?.userType === UserType.MANAGER ||
        !!currentUser?.role?.toUpperCase().includes(UserType.MANAGER);

    const location = useLocation();
    const navigate = useNavigate();

    const isMyRoute =
        location.pathname.includes(ROUTE_PATHS.MY_DASHBOARD) ||
        location.pathname.includes(ROUTE_PATHS.MY_TIMESHEET) ||
        location.pathname.includes(ROUTE_PATHS.TIMESHEET_VIEW) ||
        location.pathname === ROUTE_PATHS.EMPLOYEE_DASHBOARD ||
        location.pathname === `${ROUTE_PATHS.EMPLOYEE_DASHBOARD}/`;

    const currentEmployeeId =
        propEmployeeId ||
        (isMyRoute
            ? currentUser?.employeeId || currentUser?.loginId
            : entity?.employeeId || currentUser?.employeeId || currentUser?.loginId);

    const attendanceFetchedKey = useRef<string | null>(null);
    const [currentDate, setCurrentDate] = useState(() => propCurrentDate || new Date());
    const today = new Date();

    useEffect(() => {
        if (propCurrentDate) setCurrentDate(propCurrentDate);
    }, [propCurrentDate]);

    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadDateRange, setDownloadDateRange] = useState({ from: "", to: "" });
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (propEntries) return;
        dispatch(fetchHolidays());
    }, [dispatch, propEntries]);

    useEffect(() => {
        if (!currentEmployeeId || propEntries) return;
        const fetchKey = `${currentEmployeeId}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
        if (attendanceFetchedKey.current === fetchKey) return;
        attendanceFetchedKey.current = fetchKey;
        dispatch(
            fetchMyTimesheet({
                employeeId: currentEmployeeId,
                month: (currentDate.getMonth() + 1).toString().padStart(2, "0"),
                year: currentDate.getFullYear().toString(),
            })
        );
    }, [dispatch, currentEmployeeId, currentDate, propEntries]);

    // -----------------------------------------------------------------------
    // Derived calendar data
    // -----------------------------------------------------------------------

    const { monthDays, blankCells, entries } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstWeekdayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const generatedEntries = generateMonthlyEntries(currentDate, today, records);
        return {
            monthDays: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            blankCells: Array.from({ length: firstWeekdayOfMonth }, (_, i) => i),
            entries: propEntries ?? generatedEntries,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate, records, propEntries]);

    const monthTotalHours = useMemo(
        () => entries.reduce((sum, entryRecord: any) => sum + (Number(entryRecord?.totalHours ?? entryRecord?.hours ?? 0) || 0), 0),
        [entries]
    );

    // -----------------------------------------------------------------------
    // Day-level lookup helpers — close over currentDate, holidays, blockers
    // -----------------------------------------------------------------------

    const findBlockerForDay = (day: number): BlockerEntry | null => {
        if (!blockers?.length) return null;
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        targetDate.setHours(0, 0, 0, 0);
        return (
            blockers.find((blocker: BlockerEntry) => {
                const start = new Date(blocker.blockedFrom);
                start.setHours(0, 0, 0, 0);
                const end = new Date(blocker.blockedTo);
                end.setHours(0, 0, 0, 0);
                return targetDate >= start && targetDate <= end;
            }) ?? null
        );
    };

    const findHolidayForDay = (day: number): HolidayEntry | null => {
        if (!holidays?.length) return null;
        const dateStr = dayjs(
            new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        ).format(DATE_FORMAT);
        return (
            holidays.find((holidayRecord: HolidayEntry) => holidayRecord.holidayDate === dateStr || holidayRecord.date === dateStr) ?? null
        );
    };

    const entryMap = useMemo(
        () => new Map(entries.map((item: any) => [item.date, item])),
        [entries]
    );

    // -----------------------------------------------------------------------
    // Per-day metadata (status class, colours, lock badge, etc.)
    // -----------------------------------------------------------------------

    const dayMetaList = useMemo(() => {
        return monthDays.map((day) => {
            const entry = entryMap.get(day);
            const holidayInfo = findHolidayForDay(day);
            const manualBlocker = findBlockerForDay(day);
            const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayOfWeek = fullDate.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;
            const isToday =
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

            const normalized: NormalizedDay = {
                date: day,
                fullDate,
                status: (entry as any)?.status ?? null,
                totalHours: (entry as any)?.totalHours ?? (entry as any)?.hours ?? null,
                workLocation: (entry as any)?.workLocation ?? null,
                firstHalf: ((entry as any)?.firstHalf ?? "").trim(),
                secondHalf: ((entry as any)?.secondHalf ?? "").trim(),
            };

            const displayStatus = resolveDisplayStatus(normalized, holidayInfo, manualBlocker);
            // const isDeptBlockedWeekendDay =
            //     isSunday || (isSaturday && displayStatus === AttendanceStatus.WEEKEND);
            const isBlocked =
                !!manualBlocker ||
                (!isAdmin &&
                    !isManager &&
                    (normalized.status === AttendanceStatus.LEAVE ||

                        !!holidayInfo));
            const statusLabel = resolveStatusLabel(displayStatus);

            const isDayInPast = isPastDay(day, currentDate, today);
            const isPendingUpdate =
                isDayInPast &&
                !isBlocked &&
                !holidayInfo &&
                !(entry as any)?.isWeekend &&
                (normalized.status === AttendanceStatus.NOT_UPDATED ||
                    normalized.status === AttendanceStatus.PENDING);

            // Split-day background: two solid hex blocks when firstHalf and secondHalf
            // map to different locations (e.g. Morning = Office, Afternoon = WFH).
            const totalHoursValue = Number(normalized.totalHours ?? 0);
            const isNonWorkingDay = isSunday || !!holidayInfo;
            const isSplitDay =
                !!normalized.firstHalf &&
                !!normalized.secondHalf &&
                !((isNonWorkingDay && totalHoursValue >= 1) || (isSaturday && totalHoursValue >= 4));

            const splitDayHexPair = isSplitDay
                ? getSplitDayHexPair(normalized.firstHalf, normalized.secondHalf)
                : null;

            const rawStatusClass = resolveStatusClassName(displayStatus, normalized.workLocation);
            const cellStatusClass = isToday ? DAY_STATUS_CLASS.TODAY : isSplitDay ? "" : rawStatusClass;
            const cellTextColor = isToday
                ? TODAY_TEXT_COLOR
                // Sundays always use the weekend text colour too, so it never
                // conflicts with the forced weekend background below.
                : isSunday
                    ? STATUS_CLASS_TEXT_COLOR[DAY_STATUS_CLASS.WEEKEND]
                    : getStatusTextColor(cellStatusClass || rawStatusClass);

            // Split-day cells paint their own two-tone background via the masked
            // layer rendered in JSX below (two solid h-1/2 blocks), so the cell
            // itself carries no background/border — a leftover border here would
            // show a thin line where the page background peeks through between
            // the border and the rounded mask.
            const cellStyle: React.CSSProperties = {
                color: cellTextColor,
                // Sundays always get the weekend background regardless of status.
                ...(isSunday
                    ? { background: getStatusBackgroundColor(WEEKEND_KEY), borderColor: "transparent" }
                    : {}),
                ...(isSaturday ? { borderColor: "transparent" } : {}),
                ...(isSplitDay && !isSunday ? { borderWidth: 0 } : {}),
            };
            // const showLockBadge = isBlocked && !isToday;

            return {
                day,
                fullDate,
                normalized,
                isBlocked,
                displayStatus,
                statusLabel,
                isPendingUpdate,
                rawStatusClass,
                cellStatusClass,
                cellTextColor,
                cellStyle,
                splitDayHexPair,
                isSplitDay,
                // showLockBadge,
                isToday,
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthDays, entries, holidays, blockers, currentDate, isAdmin, isManager]);

    // -----------------------------------------------------------------------
    // Monthly attendance summary counters
    // -----------------------------------------------------------------------

    const attendanceSummary = useMemo(() => {
        const summary = { present: 0, wfh: 0, halfDay: 0, leave: 0, holiday: 0, clientVisit: 0 };
        const leaveKey = AttendanceStatus.LEAVE.toLowerCase();

        dayMetaList.forEach(({ normalized, rawStatusClass, displayStatus }) => {
            if (rawStatusClass === DAY_STATUS_CLASS.HOLIDAY) {
                summary.holiday++;
                return;
            }
            if (rawStatusClass === DAY_STATUS_CLASS.LEAVE && displayStatus === AttendanceStatus.LEAVE) {
                summary.leave++;
                return;
            }

            const firstHalf = toCanonicalHalfDayLocation(normalize(normalized.firstHalf));
            const secondHalf = toCanonicalHalfDayLocation(normalize(normalized.secondHalf));

            if (firstHalf && secondHalf) {
                if (firstHalf === secondHalf) {
                    if (firstHalf === WorkLocationKeyword.OFFICE) summary.present++;
                    else if (firstHalf === WorkLocationKeyword.WFH) summary.wfh++;
                    else if (firstHalf === WorkLocationKeyword.CLIENT) summary.clientVisit++;
                    else if (firstHalf === leaveKey) summary.leave++;
                } else {
                    summary.halfDay++;
                }
                return;
            }

            if (rawStatusClass === DAY_STATUS_CLASS.FULL_DAY) summary.present++;
            else if (rawStatusClass === DAY_STATUS_CLASS.WFH) summary.wfh++;
            else if (rawStatusClass === DAY_STATUS_CLASS.CLIENT) summary.clientVisit++;
            else if (rawStatusClass === DAY_STATUS_CLASS.HALF_DAY) summary.halfDay++;
        });

        return summary;
    }, [dayMetaList]);

    // -----------------------------------------------------------------------
    // Event handlers
    // -----------------------------------------------------------------------

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isNextMonthDisabled =
        currentDate.getFullYear() > today.getFullYear() ||
        (currentDate.getFullYear() === today.getFullYear() &&
            currentDate.getMonth() >= today.getMonth());

    const handleDownload = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        setDownloadDateRange({
            from: dayjs(monthStart).format(DATE_FORMAT),
            to: dayjs(monthEnd).format(DATE_FORMAT),
        });
        setIsDownloadModalOpen(true);
    };

    const handleConfirmDownload = async () => {
        if (!currentEmployeeId) return;
        try {
            setIsDownloading(true);
            const [yearStr, monthStr] = downloadDateRange.from.split("-");
            const blob = await downloadAttendancePdfReport(
                parseInt(monthStr),
                parseInt(yearStr),
                currentEmployeeId,
                downloadDateRange.from,
                downloadDateRange.to,
            );
            saveAs(
                blob,
                `Attendance_${currentEmployeeId}_${downloadDateRange.from}_to_${downloadDateRange.to}.pdf`,
            );
            setIsDownloadModalOpen(false);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDayClick = (day: number) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const timestamp = targetDate.getTime();
        if (onNavigateToDate) {
            onNavigateToDate(timestamp);
            return;
        }
        const dateStr = dayjs(targetDate).format(DATE_FORMAT);
        const basePath = location.pathname.startsWith(ROUTE_PATHS.MANAGER_DASHBOARD)
            ? ROUTE_PATHS.MANAGER_DASHBOARD
            : location.pathname.startsWith(ROUTE_PATHS.ADMIN_DASHBOARD)
                ? ROUTE_PATHS.ADMIN_DASHBOARD
                : ROUTE_PATHS.EMPLOYEE_DASHBOARD;
        navigate(`${basePath}/${ROUTE_PATHS.MY_TIMESHEET}`, {
            state: { selectedDate: dateStr, timestamp: Date.now() },
        });
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="mobile-timesheet-shell">
            <div className="calendar-header">
                <div className="header-top flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 text-indigo-600  rounded-xl flex items-center justify-center">
                            <CalendarIcon size={18} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="header-title text-xl font-bold text-slate-800 tracking-tight">
                                Attendance Snapshot
                            </h1>
                            <p className="header-subtitle text-sm text-slate-400 font-medium">
                                Monthly Overview
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="download-btn flex items-center justify-center gap-1 px-2 h-[30px] rounded-lg bg-[#4318FF] text-white text-[8px] font-bold uppercase transition-all active:scale-95 whitespace-nowrap" >
                        <div className="download-btn-label flex flex-col leading-[1.1]">
                            <span>Download Report</span>
                        </div>

                        <Download
                            className="download-btn-icon flex-shrink-0 text-white"
                            strokeWidth={2.5}
                        />
                    </button>
                </div>
            </div>

            <div className="mobile-timesheet-body ">
                {!hideMonthNavigation && (
                    <div className="mobile-timesheet-toolbar">
                        <div className="mobile-timesheet-summary-row">
                            <div className="mobile-timesheet-nav-group">
                                <button onClick={handlePrevMonth} className="mobile-timesheet-nav-btn">
                                    <ChevronLeft size={14} strokeWidth={2.8} />
                                </button>
                                <p className="mobile-timesheet-month-label">
                                    {currentDate.toLocaleDateString(LOCALE, { month: "short", year: "numeric" })}
                                </p>
                                <button
                                    onClick={handleNextMonth}
                                    disabled={isNextMonthDisabled}
                                    className={`mobile-timesheet-nav-btn ${isNextMonthDisabled ? "is-disabled" : ""}`}
                                >
                                    <ChevronRight size={14} strokeWidth={2.8} />
                                </button>
                            </div>
                            <div className="mobile-timesheet-total mr-2">
                                <p className="mobile-timesheet-total-label">TOTAL TRACKED:</p>
                                <p className="mobile-timesheet-total-value">{monthTotalHours.toFixed(1)}</p>
                                <span className="mobile-timesheet-total-unit">hrs</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mobile-timesheet-content">
                    {/* Weekday header row */}
                    <div className="mobile-timesheet-weekday-row">
                        {WEEKDAY_LABELS.map((dayName) => (
                            <div key={dayName} className="mobile-timesheet-weekday-cell">
                                {dayName}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="mobile-timesheet-grid">
                        {blankCells.map((blankIndex) => (
                            <div key={`p-${blankIndex}`} className="mobile-timesheet-pad" />
                        ))}
                        {dayMetaList.map((meta) => {
                            const {
                                day,
                                fullDate,
                                normalized,
                                isBlocked,
                                statusLabel,
                                isPendingUpdate,
                                cellStatusClass,
                                cellTextColor,
                                cellStyle,
                                splitDayHexPair,
                                isSplitDay,
                                // showLockBadge,
                                isToday,
                            } = meta;

                            const hasHours =
                                normalized.totalHours !== null &&
                                normalized.totalHours !== undefined &&
                                Number(normalized.totalHours) > 0;

                            return (
                                <div
                                    key={day}
                                    id={`history-day-${fullDate.getTime()}`}
                                    className={`mobile-timesheet-day ${cellStatusClass} ${isToday ? "is-today" : ""} ${onNavigateToDate ? "is-clickable" : ""}`}
                                    style={cellStyle}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {isSplitDay && splitDayHexPair && !isToday && (
                                        <div className="split-day-bg" style={{ borderRadius: "inherit" }}>
                                            <div
                                                className="split-day-bg-half split-day-bg-top"
                                                style={{ background: splitDayHexPair.firstHex }}
                                            />
                                            <div
                                                className="split-day-bg-half split-day-bg-bottom"
                                                style={{ background: splitDayHexPair.secondHex }}
                                            />
                                        </div>
                                    )}

                                    {/* {showLockBadge && (
                                        <div className="day-lock-badge" style={{ color: cellTextColor }}>
                                            <Lock strokeWidth={2} />
                                        </div>
                                    )} */}
                                    {isPendingUpdate && (
                                        <div className="day-alert-badge">
                                            <AlertCircle strokeWidth={3} />
                                        </div>
                                    )}
                                    <span
                                        className="mobile-timesheet-day-number"
                                        style={{ color: cellTextColor, position: "relative", zIndex: 1 }}
                                    >
                                        {day}
                                    </span>
                                    {hasHours && (
                                        <span
                                            className="mobile-timesheet-day-hours"
                                            style={{ color: cellTextColor, position: "relative", zIndex: 1 }}
                                        >
                                            {Number(normalized.totalHours)}h
                                        </span>
                                    )}
                                    {isBlocked && (
                                        <div
                                            className="mobile-timesheet-day-status-label"
                                            style={{ position: "absolute", zIndex: 1 }}
                                        >
                                            <span style={{ color: cellTextColor }}>{statusLabel}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div className="mobile-timesheet-legend">
                        {LEGEND_ITEMS.map((item) => (
                            <div key={item.label} className="mobile-timesheet-legend-item">
                                <div className={`mobile-timesheet-legend-colorClass ${item.colorClass}`} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Attendance summary cards */}
                    <div className="attendance-summary-cards">
                        <div className="summary-card present">
                            <Briefcase size={18} />
                            <h3>{attendanceSummary.present}</h3>
                            <span style={{ fontSize: "9px" }}>Office</span>
                        </div>
                        <div className="summary-card wfh">
                            <Home size={18} />
                            <h3>{attendanceSummary.wfh}</h3>
                            <span style={{ fontSize: "9px" }}>WFH</span>
                        </div>
                        <div className="summary-card halfday">
                            <Clock size={18} />
                            <h3>{attendanceSummary.halfDay}</h3>
                            <span style={{ fontSize: "9px" }}>Half Day</span>
                        </div>
                        <div className="summary-card leave">
                            <CalendarX size={18} />
                            <h3>{attendanceSummary.leave}</h3>
                            <span style={{ fontSize: "9px" }}>Leave</span>
                        </div>
                        <div className="summary-card holiday">
                            <CalendarDays size={18} />
                            <h3>{attendanceSummary.holiday}</h3>
                            <span style={{ fontSize: "9px" }}>Holiday</span>
                        </div>
                        <div className="summary-card client">
                            <Building2 size={18} />
                            <h3>{attendanceSummary.clientVisit}</h3>
                            <span style={{
                                fontSize: "9px",
                                lineHeight: "10px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                whiteSpace: "normal",
                            }}>Client Visit</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Download modal */}
            {isDownloadModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <CalendarIcon className="w-5 h-5 text-[#4318FF]" />
                                Select Date Range
                            </h3>
                            <button onClick={() => setIsDownloadModalOpen(false)} className="close-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">From Date</label>
                                <div className="input-wrapper">
                                    <input
                                        type="date"
                                        value={downloadDateRange.from}
                                        onChange={(fromDateEvent) => {
                                            const newFrom = fromDateEvent.target.value;
                                            setDownloadDateRange((prev) => ({
                                                ...prev,
                                                from: newFrom,
                                                // Auto-correct: prevent "to" from being before "from"
                                                to: prev.to && newFrom && prev.to < newFrom ? newFrom : prev.to,
                                            }));
                                        }}
                                        className="date-input"
                                    />
                                    <CalendarIcon size={18} className="input-icon" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">To Date</label>
                                <div className="input-wrapper">
                                    <input
                                        type="date"
                                        value={downloadDateRange.to}
                                        min={downloadDateRange.from}
                                        onChange={(toDateEvent) =>
                                            setDownloadDateRange({ ...downloadDateRange, to: toDateEvent.target.value })
                                        }
                                        className="date-input"
                                    />
                                    <CalendarIcon size={18} className="input-icon" />
                                </div>
                            </div>
                            <button
                                disabled={isDownloading || !downloadDateRange.from || !downloadDateRange.to}
                                onClick={handleConfirmDownload}
                                className="submit-btn"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        <span>Download PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileTimesheetHistory;