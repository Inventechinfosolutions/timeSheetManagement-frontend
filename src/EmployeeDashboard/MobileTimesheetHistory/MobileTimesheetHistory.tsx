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
    Lock,
    Calendar,
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
import { AttendanceStatus, UserType } from "../../enums";
import { generateMonthlyEntries } from "../../utils/attendanceUtils";
import { saveAs } from "file-saver";
import "./MobileTimesheetHistory.css";

interface MobileTimesheetHistoryProps {
    employeeId?: string;
    entries?: TimesheetEntry[];
    currentDate?: Date;
    hideMonthNavigation?: boolean;
    onNavigateToDate?: (timestamp: number) => void;
    onBlockedClick?: () => void;
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

const WorkLocation = {
    OFFICE: "office",
    WFH: "wfh",
    WORK_FROM_HOME: "work from home",
    CLIENT: "client",
    CLIENT_VISIT: "client visit",
    CLIENT_PLACE: "client place",
    WEEKEND: "weekend",
} as const;

const BLOCKED_STATUS_KEY = "blocked";

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

const STATUS_BACKGROUND_COLOR: Record<string, string> = {
    [WorkLocation.OFFICE]: "#E6FFFA",
    [AttendanceStatus.FULL_DAY.toLowerCase()]: "#E6FFFA",
    [WorkLocation.WFH]: "#d2dcfc",
    [WorkLocation.WORK_FROM_HOME]: "#d2dcfc",
    [WorkLocation.CLIENT]: "#f2fcbd",
    [WorkLocation.CLIENT_VISIT]: "#f2fcbd",
    [WorkLocation.CLIENT_PLACE]: "#f2fcbd",
    [AttendanceStatus.LEAVE.toLowerCase()]: "#FEE2E2",
    [WorkLocation.WEEKEND]: "#FEE2E2",
    [AttendanceStatus.HOLIDAY.toLowerCase()]: "#DBEAFE",
    [AttendanceStatus.ABSENT.toLowerCase()]: "#FECACA",
    [AttendanceStatus.HALF_DAY.toLowerCase()]: "#FEF3C7",
    default: "#F8FAFC",
};

const STATUS_CLASS_TEXT_COLOR: Record<string, string> = {
    [DAY_STATUS_CLASS.BLOCKED]: "#4b5563",
    [DAY_STATUS_CLASS.HOLIDAY]: "#1890FF",
    [DAY_STATUS_CLASS.LEAVE]: "#EE5D50",
    [DAY_STATUS_CLASS.WEEKEND]: "#EE5D50",
    [DAY_STATUS_CLASS.FULL_DAY]: "#01B574",
    [DAY_STATUS_CLASS.HALF_DAY]: "#FFB020",
    [DAY_STATUS_CLASS.ABSENT]: "#DC2626",
    [DAY_STATUS_CLASS.WFH]: "#4F46E5",
    [DAY_STATUS_CLASS.CLIENT]: "#4318FF",
    [DAY_STATUS_CLASS.DEFAULT]: "#141413ff",
};



const normalize = (value?: string | null) =>
    (value || "").toLowerCase().trim();

const isWfhLocation = (value?: string | null) => {
    const normalized = normalize(value);

    return (
        normalized === WorkLocation.WFH ||
        normalized === WorkLocation.WORK_FROM_HOME
    );
};

const isClientLocation = (value?: string | null) => {
    const normalized = normalize(value);

    return (
        normalized === WorkLocation.CLIENT ||
        normalized === WorkLocation.CLIENT_VISIT ||
        normalized === WorkLocation.CLIENT_PLACE
    );
};

const STATUS = {
    FULL_DAY: AttendanceStatus.FULL_DAY.toLowerCase(),
    HALF_DAY: AttendanceStatus.HALF_DAY.toLowerCase(),
    LEAVE: AttendanceStatus.LEAVE.toLowerCase(),
    ABSENT: AttendanceStatus.ABSENT.toLowerCase(),
    HOLIDAY: AttendanceStatus.HOLIDAY.toLowerCase(),
    WEEKEND: AttendanceStatus.WEEKEND.toLowerCase(),
    PENDING: AttendanceStatus.PENDING.toLowerCase(),
    NOT_UPDATED: AttendanceStatus.NOT_UPDATED.toLowerCase(),
};

const getStatusTextColor = (statusClass: string): string =>
    STATUS_CLASS_TEXT_COLOR[statusClass] || STATUS_CLASS_TEXT_COLOR[DAY_STATUS_CLASS.DEFAULT];

const getStatusBackgroundColor = (statusOrLocation: string): string =>
    STATUS_BACKGROUND_COLOR[(statusOrLocation || "").toLowerCase().trim()] || STATUS_BACKGROUND_COLOR.default;

const resolveStatusClassName = (
    status?: string | null,
    workLocation?: string | null
): string => {
    const normalizedStatus = normalize(status);
    const normalizedLocation = normalize(workLocation);

    if (normalizedStatus === BLOCKED_STATUS_KEY)
        return DAY_STATUS_CLASS.BLOCKED;

    if (normalizedStatus === STATUS.HOLIDAY)
        return DAY_STATUS_CLASS.HOLIDAY;

    if (normalizedStatus === STATUS.WEEKEND)
        return DAY_STATUS_CLASS.WEEKEND;

    if (normalizedStatus === STATUS.LEAVE)
        return DAY_STATUS_CLASS.LEAVE;

    if (normalizedStatus === STATUS.ABSENT)
        return DAY_STATUS_CLASS.ABSENT;

    if (
        normalizedStatus === STATUS.HALF_DAY ||
        normalizedStatus.includes(STATUS.HALF_DAY)
    )
        return DAY_STATUS_CLASS.HALF_DAY;

    if (
        normalizedStatus === STATUS.FULL_DAY ||
        normalizedLocation === WorkLocation.OFFICE
    )
        return DAY_STATUS_CLASS.FULL_DAY;

    if (
        isWfhLocation(normalizedStatus) ||
        isWfhLocation(normalizedLocation)
    )
        return DAY_STATUS_CLASS.WFH;

    if (
        isClientLocation(normalizedStatus) ||
        isClientLocation(normalizedLocation)
    )
        return DAY_STATUS_CLASS.CLIENT;

    return DAY_STATUS_CLASS.DEFAULT;
};

const resolveStatusLabel = (displayStatus: string): string => {
    const normalized = (displayStatus || "").toLowerCase().trim();
    if (normalized === BLOCKED_STATUS_KEY) return "BLOCKED";
    if (normalized === AttendanceStatus.FULL_DAY.toLowerCase()) return "FULL DAY";
    if (normalized.includes(AttendanceStatus.HALF_DAY.toLowerCase())) return "HALF DAY";
    if (normalized === AttendanceStatus.LEAVE.toLowerCase()) return "LEAVE";
    if (normalized === AttendanceStatus.ABSENT.toLowerCase()) return "ABSENT";
    if (normalized === AttendanceStatus.HOLIDAY.toLowerCase()) return "HOLIDAY";
    if (normalized === AttendanceStatus.WEEKEND.toLowerCase()) return "WEEKEND";
    if (normalized === WorkLocation.WFH || normalized === WorkLocation.WORK_FROM_HOME) return "WFH";
    if (normalized === WorkLocation.CLIENT || normalized === WorkLocation.CLIENT_VISIT) return "CLIENT VISIT";
    return AttendanceStatus.NOT_UPDATED.toUpperCase();
};

const resolveDisplayStatus = (
    day: NormalizedDay,
    holiday: HolidayEntry | null,
    manualBlocker: BlockerEntry | null,
): string => {
    const status = (day.status || "").trim();
    const dayOfWeek = day.fullDate.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isWeekendDay = isSunday || isSaturday;
    const hours = Number(day.totalHours || 0);

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

    // Non-weekend days: unchanged from existing behavior.
    if (hasRealStatus) return status;
    if (manualBlocker) return BLOCKED_STATUS_KEY;
    return AttendanceStatus.NOT_UPDATED;
};

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
    const isAdmin = currentUser?.userType === UserType.ADMIN;
    const isManager =
        currentUser?.userType === UserType.MANAGER ||
        (currentUser?.role && currentUser.role.toUpperCase().includes(UserType.MANAGER));
    const { holidays } = useAppSelector(
        (state: RootState) => state.masterHolidays || { holidays: [] }
    );
    const { blockers } = useAppSelector(
        (state: RootState) => state.timesheetBlocker || { blockers: [] }
    );

    const location = useLocation();
    const isMyRoute =
        location.pathname.includes("my-dashboard") ||
        location.pathname.includes("my-timesheet") ||
        location.pathname.includes("timesheet-view") ||
        location.pathname === "/employee-dashboard" ||
        location.pathname === "/employee-dashboard/";
    const currentEmployeeId =
        propEmployeeId ||
        (isMyRoute
            ? currentUser?.employeeId || currentUser?.loginId
            : entity?.employeeId || currentUser?.employeeId || currentUser?.loginId);

    const attendanceFetchedKey = useRef<string | null>(null);
    const [currentDate, setCurrentDate] = useState(() => propCurrentDate || new Date());
    const today = new Date();

    useEffect(() => {
        if (propCurrentDate) {
            setCurrentDate(propCurrentDate);
        }
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

    const { monthDays, blankCells, weekdayLabels, entries } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstWeekdayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const generatedEntries = generateMonthlyEntries(currentDate, today, records);
        return {
            monthDays: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            blankCells: Array.from({ length: firstWeekdayOfMonth }, (_, i) => i),
            weekdayLabels: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
            entries: propEntries || generatedEntries,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate, records, propEntries]);

    const monthTotalHours = useMemo(
        () => entries.reduce((sum, e: any) => sum + (Number(e?.totalHours ?? e?.hours ?? 0) || 0), 0),
        [entries]
    );

    const findBlockerForDay = (day: number): BlockerEntry | null => {
        if (!blockers || blockers.length === 0) return null;
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        targetDate.setHours(0, 0, 0, 0);
        return (
            blockers.find((b: BlockerEntry) => {
                const start = new Date(b.blockedFrom);
                start.setHours(0, 0, 0, 0);
                const end = new Date(b.blockedTo);
                end.setHours(0, 0, 0, 0);
                return targetDate >= start && targetDate <= end;
            }) || null
        );
    };

    const findHolidayForDay = (day: number): HolidayEntry | null => {
        if (!holidays || holidays.length === 0) return null;
        const dateStr = dayjs(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).format("YYYY-MM-DD");
        return holidays.find((h: HolidayEntry) => h.holidayDate === dateStr || h.date === dateStr) || null;
    };

    const entryMap = useMemo(
        () =>
            new Map(
                entries.map((item: any) => [item.date, item])
            ),
        [entries]
    );

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
                firstHalf: ((entry as any)?.firstHalf || "").trim(),
                secondHalf: ((entry as any)?.secondHalf || "").trim(),
            };

            const displayStatus = resolveDisplayStatus(normalized, holidayInfo, manualBlocker);
            const isDeptBlockedWeekendDay = isSunday || (isSaturday && displayStatus === AttendanceStatus.WEEKEND);
            const isBlocked =
                !!manualBlocker ||
                (!isAdmin &&
                    !isManager &&
                    (normalized.status === AttendanceStatus.LEAVE || isDeptBlockedWeekendDay || !!holidayInfo));
            const statusLabel = resolveStatusLabel(displayStatus);

            const isPastMonth =
                currentDate.getFullYear() < today.getFullYear() ||
                (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() < today.getMonth());
            const isPastDayInCurrentMonth =
                currentDate.getFullYear() === today.getFullYear() &&
                currentDate.getMonth() === today.getMonth() &&
                day < today.getDate();
            const isPastDay = isPastMonth || isPastDayInCurrentMonth;
            const isPendingUpdate =
                isPastDay &&
                !isBlocked &&
                !holidayInfo &&
                !(entry as any)?.isWeekend &&
                (normalized.status === AttendanceStatus.NOT_UPDATED || normalized.status === AttendanceStatus.PENDING);

            const totalHoursValue = Number(normalized.totalHours || 0);
            const isNonWorkingDay = isSunday || !!holidayInfo;
            const isSplitDay =
                !!normalized.firstHalf &&
                !!normalized.secondHalf &&
                !((isNonWorkingDay && totalHoursValue >= 1) || (isSaturday && totalHoursValue >= 4));

            let splitBackgroundStyle: React.CSSProperties = {};
            if (isSplitDay) {
                const firstHalfLocation = normalize(normalized.firstHalf);
                const secondHalfLocation = normalize(normalized.secondHalf);
                const isOffice = (halfDayLocation: string) => halfDayLocation === WorkLocation.OFFICE;
                const isWfh = (halfDayLocation: string) =>
                    halfDayLocation === WorkLocation.WFH || halfDayLocation === WorkLocation.WORK_FROM_HOME;
                const isClient = (halfDayLocation: string) =>
                    halfDayLocation === WorkLocation.CLIENT ||
                    halfDayLocation === WorkLocation.CLIENT_VISIT ||
                    halfDayLocation === WorkLocation.CLIENT_PLACE;
                const isWeekendLocation = (halfDayLocation: string) => halfDayLocation === WorkLocation.WEEKEND;

                if (isOffice(firstHalfLocation) && isOffice(secondHalfLocation)) {
                    splitBackgroundStyle = { background: getStatusBackgroundColor(WorkLocation.OFFICE) };
                } else if (isWfh(firstHalfLocation) && isWfh(secondHalfLocation)) {
                    splitBackgroundStyle = { background: getStatusBackgroundColor(WorkLocation.WFH) };
                } else if (isClient(firstHalfLocation) && isClient(secondHalfLocation)) {
                    splitBackgroundStyle = { background: getStatusBackgroundColor(WorkLocation.CLIENT) };
                } else if (isWeekendLocation(firstHalfLocation) && isWeekendLocation(secondHalfLocation)) {
                    splitBackgroundStyle = { background: getStatusBackgroundColor(WorkLocation.WEEKEND) };
                } else {
                    const firstColor = getStatusBackgroundColor(firstHalfLocation);
                    const secondColor = getStatusBackgroundColor(secondHalfLocation);
                    splitBackgroundStyle = {
                        background: `linear-gradient(to bottom, ${firstColor} 50%, ${secondColor} 50%)`,
                    };
                }
            }

            const rawStatusClass = resolveStatusClassName(displayStatus, normalized.workLocation);
            const cellStatusClass = isToday ? DAY_STATUS_CLASS.TODAY : isSplitDay ? "" : rawStatusClass;
            const cellTextColor = isToday ? "#4318FF" : getStatusTextColor(cellStatusClass || rawStatusClass);
            const isSundayCell = dayOfWeek === 0;
            const cellStyle: React.CSSProperties = {
                ...splitBackgroundStyle,
                color: cellTextColor,
                ...(isSundayCell ? { background: getStatusBackgroundColor(WorkLocation.WEEKEND) } : {}),
            };
            const showLockBadge = isBlocked && !isToday;

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
                showLockBadge,
                isToday,
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthDays, entries, holidays, blockers, currentDate, isAdmin, isManager]);

    const attendanceSummary = useMemo(() => {
        const summary = {
            present: 0,
            wfh: 0,
            halfDay: 0,
            leave: 0,
            holiday: 0,
            clientVisit: 0,
        };

        const normalizeHalfDayLocation = (location: string) => {
            switch (location) {
                case WorkLocation.OFFICE:
                    return WorkLocation.OFFICE;
                case WorkLocation.WFH:
                case WorkLocation.WORK_FROM_HOME:
                    return WorkLocation.WFH;
                case WorkLocation.CLIENT:
                case WorkLocation.CLIENT_VISIT:
                case WorkLocation.CLIENT_PLACE:
                    return WorkLocation.CLIENT;
                case AttendanceStatus.LEAVE.toLowerCase():
                    return AttendanceStatus.LEAVE.toLowerCase();
                default:
                    return "";
            }
        };

        dayMetaList.forEach(({ normalized, rawStatusClass, displayStatus }) => {
            if (rawStatusClass === DAY_STATUS_CLASS.HOLIDAY) {
                summary.holiday++;
                return;
            }
            if (rawStatusClass === DAY_STATUS_CLASS.LEAVE && displayStatus === AttendanceStatus.LEAVE) {
                summary.leave++;
                return;
            }

            const firstHalf = normalizeHalfDayLocation(
                normalize(normalized.firstHalf)
            );

            const secondHalf = normalizeHalfDayLocation(
                normalize(normalized.secondHalf)
            );
            if (firstHalf && secondHalf) {
                if (firstHalf === secondHalf) {
                    switch (firstHalf) {
                        case WorkLocation.OFFICE:
                            summary.present++;
                            break;
                        case WorkLocation.WFH:
                            summary.wfh++;
                            break;
                        case WorkLocation.CLIENT:
                            summary.clientVisit++;
                            break;
                        case AttendanceStatus.LEAVE.toLowerCase():
                            summary.leave++;
                            break;
                    }
                } else {
                    summary.halfDay++;
                }
                return;
            }

            switch (rawStatusClass) {
                case DAY_STATUS_CLASS.FULL_DAY:
                    summary.present++;
                    break;
                case DAY_STATUS_CLASS.WFH:
                    summary.wfh++;
                    break;
                case DAY_STATUS_CLASS.CLIENT:
                    summary.clientVisit++;
                    break;
                case DAY_STATUS_CLASS.HALF_DAY:
                    summary.halfDay++;
                    break;
            }
        });

        return summary;
    }, [dayMetaList]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isNextMonthDisabled =
        currentDate.getFullYear() > today.getFullYear() ||
        (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() >= today.getMonth());

    const handleDownload = () => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const format = (d: Date) => dayjs(d).format("YYYY-MM-DD");
        setDownloadDateRange({ from: format(start), to: format(end) });
        setIsDownloadModalOpen(true);
    };

    const handleConfirmDownload = async () => {
        if (!currentEmployeeId) return;
        try {
            setIsDownloading(true);
            const fromDateStr = downloadDateRange.from;
            const monthStr = fromDateStr.split("-")[1];
            const yearStr = fromDateStr.split("-")[0];
            const blob = await downloadAttendancePdfReport(
                parseInt(monthStr),
                parseInt(yearStr),
                currentEmployeeId,
                downloadDateRange.from,
                downloadDateRange.to
            );
            saveAs(blob, `Attendance_${currentEmployeeId}_${downloadDateRange.from}_to_${downloadDateRange.to}.pdf`);
            setIsDownloadModalOpen(false);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const navigate = useNavigate();
    const handleDayClick = (day: number) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const timestamp = targetDate.getTime();
        if (onNavigateToDate) {
            onNavigateToDate(timestamp);
            return;
        }
        const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
        const basePath = location.pathname.startsWith("/manager-dashboard")
            ? "/manager-dashboard"
            : location.pathname.startsWith("/admin-dashboard")
                ? "/admin-dashboard"
                : "/employee-dashboard";
        navigate(`${basePath}/my-timesheet`, {
            state: {
                selectedDate: dateStr,
                timestamp: Date.now(),
            },
        });
    };

    return (
        <div className="mobile-timesheet-shell">
            <div className="calendar-header flex flex-col gap-5">
                <div className="header-top flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl flex items-center justify-center">
                            <Calendar size={24} strokeWidth={2} />
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
                        className="download-btn bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg shadow-indigo-100 transition-all duration-200"
                        title="Download Report"
                    >
                        <Download size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
            <div className="mobile-timesheet-body">
                {!hideMonthNavigation && (
                    <div className="mobile-timesheet-toolbar">
                        <div className="mobile-timesheet-summary-row">
                            <div className="mobile-timesheet-nav-group">
                                <button onClick={handlePrevMonth} className="mobile-timesheet-nav-btn">
                                    <ChevronLeft size={14} strokeWidth={2.8} />
                                </button>
                                <p className="mobile-timesheet-month-label">
                                    {currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </p>
                                <button
                                    onClick={handleNextMonth}
                                    disabled={isNextMonthDisabled}
                                    className={`mobile-timesheet-nav-btn ${isNextMonthDisabled ? "is-disabled" : ""}`}
                                >
                                    <ChevronRight size={14} strokeWidth={2.8} />
                                </button>
                            </div>
                            <div className="mobile-timesheet-total">
                                <p className="mobile-timesheet-total-label">TOTAL TRACKED:</p>
                                <p className="mobile-timesheet-total-value">{monthTotalHours.toFixed(1)}</p>
                                <span className="mobile-timesheet-total-unit">hrs</span>
                            </div>
                            <div className="mobile-timesheet-actions" />
                        </div>
                    </div>
                )}
                <div className="mobile-timesheet-content">
                    <div className="mobile-timesheet-weekday-row">
                        {weekdayLabels.map((dayName) => (
                            <div key={dayName} className="mobile-timesheet-weekday-cell">
                                {dayName}
                            </div>
                        ))}
                    </div>
                    <div className="mobile-timesheet-grid">
                        {blankCells.map((b) => (
                            <div key={`p-${b}`} className="mobile-timesheet-pad" />
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
                                showLockBadge,
                                isToday,
                            } = meta;
                            return (
                                <div
                                    key={day}
                                    id={`history-day-${fullDate.getTime()}`}
                                    className={`mobile-timesheet-day ${cellStatusClass} ${isToday ? "is-today" : ""} ${onNavigateToDate ? "is-clickable" : ""}`}
                                    style={cellStyle}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {showLockBadge && (
                                        <div className="day-lock-badge" style={{ color: cellTextColor }}>
                                            <Lock size={9} strokeWidth={2.8} />
                                        </div>
                                    )}
                                    {isPendingUpdate && (
                                        <div className="day-alert-badge">
                                            <AlertCircle size={10} strokeWidth={3} />
                                        </div>
                                    )}
                                    <span className="mobile-timesheet-day-number" style={{ color: cellTextColor }}>
                                        {day}
                                    </span>
                                    {normalized.totalHours !== null &&
                                        normalized.totalHours !== undefined &&
                                        Number(normalized.totalHours) > 0 &&
                                        !isBlocked && (
                                            <span className="mobile-timesheet-day-hours" style={{ color: cellTextColor }}>
                                                {Number(normalized.totalHours)}h
                                            </span>
                                        )}
                                    {isBlocked && (
                                        <div className="mobile-timesheet-day-status-label">
                                            <span style={{ color: cellTextColor }}>{statusLabel}</span>
                                        </div>
                                    )}
                                    {/* <div className="mobile-timesheet-day-status-label">
                                        <span style={{ color: cellTextColor }}>
                                            {statusLabel}
                                        </span>
                                    </div> */}
                                </div>
                            );
                        })}
                    </div>
                    <div className="attendance-summary-cards">
                        <div className="summary-card present">
                            <Briefcase size={18} />
                            <h3>{attendanceSummary.present}</h3>
                            <span>Office</span>
                        </div>
                        <div className="summary-card wfh">
                            <Home size={18} />
                            <h3>{attendanceSummary.wfh}</h3>
                            <span>WFH</span>
                        </div>
                        <div className="summary-card halfday">
                            <Clock size={18} />
                            <h3>{attendanceSummary.halfDay}</h3>
                            <span>Half Day</span>
                        </div>
                        <div className="summary-card leave">
                            <CalendarX size={18} />
                            <h3>{attendanceSummary.leave}</h3>
                            <span>Leave</span>
                        </div>
                        <div className="summary-card holiday">
                            <CalendarDays size={18} />
                            <h3>{attendanceSummary.holiday}</h3>
                            <span>Holiday</span>
                        </div>
                        <div className="summary-card client">
                            <Building2 size={18} />
                            <h3>{attendanceSummary.clientVisit}</h3>
                            <span>Client Visit</span>
                        </div>
                    </div>
                    <div className="mobile-timesheet-legend">
                        {[
                            { label: AttendanceStatus.FULL_DAY, colorClass: "legend-colorClass-fullday" },
                            { label: "Half Day Leave", colorClass: "legend-colorClass-halfday" },
                            { label: AttendanceStatus.ABSENT, colorClass: "legend-colorClass-absent" },
                            { label: AttendanceStatus.LEAVE, colorClass: "legend-colorClass-leave" },
                            { label: "WFH", colorClass: "legend-colorClass-wfh" },
                            { label: "Client Visit", colorClass: "legend-colorClass-client" },
                            { label: AttendanceStatus.NOT_UPDATED, colorClass: "legend-colorClass-default" },
                            { label: "Today", colorClass: "legend-colorClass-today" },
                            { label: AttendanceStatus.HOLIDAY, colorClass: "legend-colorClass-holiday" },
                            { label: "Upcoming", colorClass: "legend-colorClass-default" },
                            { label: "Blocked", colorClass: "legend-colorClass-blocked" },
                        ].map((item) => (
                            <div key={item.label} className="mobile-timesheet-legend-item">
                                <div className={`mobile-timesheet-legend-colorClass ${item.colorClass}`} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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
                                        onChange={(e) => {
                                            const newFrom = e.target.value;
                                            setDownloadDateRange((prev) => {
                                                const next = { ...prev, from: newFrom };
                                                if (prev.to && newFrom && prev.to < newFrom) {
                                                    next.to = newFrom;
                                                }
                                                return next;
                                            });
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
                                        onChange={(e) => setDownloadDateRange({ ...downloadDateRange, to: e.target.value })}
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