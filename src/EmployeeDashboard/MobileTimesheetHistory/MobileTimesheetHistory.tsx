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
    isToday: boolean;
}
const getStatusStyleClass = (
    statusStr: string | null | undefined,
    location?: string | null,
): string => {
    const s = (statusStr || "").toLowerCase().trim();
    const loc = (location || "").toLowerCase().trim();
    if (s === "blocked") return "day-status-blocked";
    if (s === "holiday") return "day-status-holiday";
    if (s === AttendanceStatus.WEEKEND.toLowerCase() || s === "weekend")
        return "day-status-weekend";
    if (s === AttendanceStatus.LEAVE.toLowerCase())
        return "day-status-leave";
    if (
        s === AttendanceStatus.FULL_DAY.toLowerCase() ||
        s === "full day" ||
        loc === "office" ||
        s === "office"
    )
        return "day-status-fullday";
    if (s.includes("half day")) return "day-status-halfday";
    if (s === AttendanceStatus.ABSENT.toLowerCase()) return "day-status-absent";
    if (s === "wfh" || loc === "wfh" || s === "work from home")
        return "day-status-wfh";
    if (
        s === "client visit" ||
        loc === "client visit" ||
        loc === "client place" ||
        s === "client"
    )
        return "day-status-client";
    return "day-status-default";
};
const getStatusLabel = (displayStatus: string): string => {
    const s = (displayStatus || "").toLowerCase().trim();
    if (s === "blocked") return "BLOCKED";
    if (s === AttendanceStatus.FULL_DAY.toLowerCase() || s === "full day")
        return "FULL DAY";
    if (s.includes("half day")) return "HALF DAY";
    if (s === AttendanceStatus.LEAVE.toLowerCase()) return "LEAVE";
    if (s === AttendanceStatus.ABSENT.toLowerCase()) return "ABSENT";
    if (s === AttendanceStatus.HOLIDAY.toLowerCase() || s === "holiday")
        return "HOLIDAY";
    if (s === AttendanceStatus.WEEKEND.toLowerCase() || s === "weekend")
        return "WEEKEND";
    if (s === "wfh" || s === "work from home") return "WFH";
    if (s === "client visit" || s === "client") return "CLIENT VISIT";
    return "NOT UPDATED";
};
const getDisplayStatus = (
    day: NormalizedDay,
    holiday: any,
    manualBlocker: any,
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
        // Weekend cells are driven by whether hours are currently present,
        // so the color updates the moment data is entered, edited,
        // resubmitted, approved, or cleared — never stuck on stale status.
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
    if (manualBlocker) return "blocked";
    return AttendanceStatus.NOT_UPDATED;
};
const STATUS_HEX: Record<string, string> = {
    office: "#E6FFFA",
    "full day": "#E6FFFA",
    wfh: "#d2dcfc",
    "work from home": "#d2dcfc",
    client: "#f2fcbd",
    "client visit": "#f2fcbd",
    "client place": "#f2fcbd",
    leave: "#FEE2E2",
    weekend: "#FEE2E2",
    holiday: "#DBEAFE",
    absent: "#FECACA",
    "half day": "#FEF3C7",
    default: "#F8FAFC",
};
const STATUS_TEXT_HEX: Record<string, string> = {
    "day-status-blocked": "#4b5563",
    "day-status-holiday": "#1890FF",
    "day-status-leave": "#EE5D50",
    "day-status-weekend": "#EE5D50",
    "day-status-fullday": "#01B574",
    "day-status-halfday": "#FFB020",
    "day-status-absent": "#DC2626",
    "day-status-wfh": "#4F46E5",
    "day-status-client": "#4318FF",
    "day-status-default": "#141413ff",
};
const getStatusTextColor = (statusClass: string): string =>
    STATUS_TEXT_HEX[statusClass] || STATUS_TEXT_HEX["day-status-default"];
const hexForStatus = (s: string): string =>
    STATUS_HEX[(s || "").toLowerCase().trim()] || STATUS_HEX.default;
const MobileTimesheetHistory = ({
    employeeId: propEmployeeId,
    entries: propEntries,
    currentDate: propCurrentDate,
    hideMonthNavigation = false,
    onNavigateToDate,
    onBlockedClick,
}: MobileTimesheetHistoryProps) => {
    const dispatch = useAppDispatch();
    const { records } = useAppSelector((state: RootState) => state.attendance);
    const { entity } = useAppSelector((state: RootState) => state.employeeDetails);
    const { currentUser } = useAppSelector((state: RootState) => state.user);
    const isAdmin = currentUser?.userType === UserType.ADMIN;
    const isManager =
        currentUser?.userType === UserType.MANAGER ||
        (currentUser?.role &&
            currentUser.role.toUpperCase().includes(UserType.MANAGER));
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
    const now = new Date();
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
    const { monthDays, blanks, daysOfWeek, entries } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const blanksArr = Array.from({ length: firstDay }, (_, i) => i);
        const monthDaysArr = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const generatedEntries = generateMonthlyEntries(currentDate, now, records);
        return {
            monthDays: monthDaysArr,
            blanks: blanksArr,
            daysOfWeek: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
            entries: propEntries || generatedEntries,
        };
    }, [currentDate, records, propEntries, now]);
    const monthTotalHours = useMemo(() => {
        return entries.reduce((sum, e: any) => sum + (Number(e?.totalHours ?? e?.hours ?? 0) || 0), 0);
    }, [entries]);
    const getBlocker = (day: number): any => {
        if (!blockers || blockers.length === 0) return null;
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        targetDate.setHours(0, 0, 0, 0);
        return blockers.find((b: any) => {
            const start = new Date(b.blockedFrom);
            start.setHours(0, 0, 0, 0);
            const end = new Date(b.blockedTo);
            end.setHours(0, 0, 0, 0);
            return targetDate >= start && targetDate <= end;
        }) || null;
    };
    const checkIsHoliday = (day: number): any => {
        if (!holidays || holidays.length === 0) return null;
        const dateStr = dayjs(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).format("YYYY-MM-DD");
        return holidays.find(
            (h: any) => h.holidayDate === dateStr || h.date === dateStr
        ) || null;
    };
    const dayMetaList = useMemo(() => {
        return monthDays.map((day) => {
            const entry = entries.find((e: any) => e.date === day);
            const holidayInfo = checkIsHoliday(day);
            const manualBlocker = getBlocker(day);
            const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayOfWeek = fullDate.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;
            const isToday =
                day === now.getDate() &&
                currentDate.getMonth() === now.getMonth() &&
                currentDate.getFullYear() === now.getFullYear();
            const normalized: NormalizedDay = {
                date: day,
                fullDate,
                status: (entry as any)?.status ?? null,
                totalHours: (entry as any)?.totalHours ?? (entry as any)?.hours ?? null,
                workLocation: (entry as any)?.workLocation ?? null,
                firstHalf: ((entry as any)?.firstHalf || "").trim(),
                secondHalf: ((entry as any)?.secondHalf || "").trim(),
                isToday,
            };
            const displayStatus = getDisplayStatus(normalized, holidayInfo, manualBlocker);
            const isDeptBlocked = isSunday || (isSaturday && displayStatus === AttendanceStatus.WEEKEND);
            const isBlocked =
                !!manualBlocker ||
                (!isAdmin &&
                    !isManager &&
                    (normalized.status === AttendanceStatus.LEAVE || isDeptBlocked || !!holidayInfo));
            const statusLabel = getStatusLabel(displayStatus);
            const isPastMonth =
                currentDate.getFullYear() < now.getFullYear() ||
                (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() < now.getMonth());
            const isPastDayInCurrentMonth =
                currentDate.getFullYear() === now.getFullYear() &&
                currentDate.getMonth() === now.getMonth() &&
                day < now.getDate();
            const isPast = isPastMonth || isPastDayInCurrentMonth;
            const isPendingUpdate =
                isPast &&
                !isBlocked &&
                !holidayInfo &&
                !(entry as any)?.isWeekend &&
                (normalized.status === AttendanceStatus.NOT_UPDATED || normalized.status === AttendanceStatus.PENDING);
            const hoursVal = Number(normalized.totalHours || 0);
            const isNonWorkingDay = isSunday || !!holidayInfo;
            const isSplitDay =
                !!normalized.firstHalf &&
                !!normalized.secondHalf &&
                !((isNonWorkingDay && hoursVal >= 1) || (isSaturday && hoursVal >= 4));
            let splitBgStyle: React.CSSProperties = {};
            if (isSplitDay) {
                const nf = normalized.firstHalf.toLowerCase();
                const ns = normalized.secondHalf.toLowerCase();
                const checkOffice = (s: string) => s === "office";
                const checkWfh = (s: string) => s === "wfh" || s === "work from home";
                const checkClient = (s: string) => s === "client" || s === "client visit" || s === "client place";
                const checkWeekend = (s: string) => s === "weekend";
                if (checkOffice(nf) && checkOffice(ns)) {
                    splitBgStyle = { background: hexForStatus("office") };
                } else if (checkWfh(nf) && checkWfh(ns)) {
                    splitBgStyle = { background: hexForStatus("wfh") };
                } else if (checkClient(nf) && checkClient(ns)) {
                    splitBgStyle = { background: hexForStatus("client") };
                } else if (checkWeekend(nf) && checkWeekend(ns)) {
                    splitBgStyle = { background: hexForStatus("weekend") };
                } else {
                    const firstColor = hexForStatus(nf);
                    const secondColor = hexForStatus(ns);
                    splitBgStyle = {
                        background: `linear-gradient(to bottom, ${firstColor} 50%, ${secondColor} 50%)`,
                    };
                }
            }
            const rawStatusClass = getStatusStyleClass(displayStatus, normalized.workLocation);
            const cellStatusClass = isToday
                ? "day-status-today"
                : isSplitDay
                    ? ""
                    : rawStatusClass;
            const cellTextColor = isToday ? "#4318FF" : getStatusTextColor(cellStatusClass || rawStatusClass);
            const isSundayCell = fullDate.getDay() === 0;
            const cellStyle: React.CSSProperties = {
                ...splitBgStyle,
                color: cellTextColor,
                ...(isSundayCell ? { background: hexForStatus("weekend") } : {}),
            };
            const showLockBadge = isBlocked && !isToday;
            return {
                day,
                fullDate,
                normalized,
                holidayInfo,
                manualBlocker,
                isBlocked,
                displayStatus,
                statusLabel,
                isPendingUpdate,
                isSplitDay,
                splitBgStyle,
                rawStatusClass,
                cellStatusClass,
                cellTextColor,
                cellStyle,
                showLockBadge,
                isToday,
            };
        });
    }, [monthDays, entries, holidays, blockers, currentDate, isAdmin, isManager, now]);

    useEffect(() => {
        dayMetaList.forEach((d) => {
            console.log(
                d.day,
                d.normalized.status,
                d.normalized.firstHalf,
                d.normalized.secondHalf,
                d.normalized.workLocation
            );
        });
    }, [dayMetaList]);
    const attendanceSummary = useMemo(() => {
        const summary = {
            present: 0,
            wfh: 0,
            halfDay: 0,
            leave: 0,
            holiday: 0,
            clientVisit: 0,
        };
        dayMetaList.forEach(({ normalized, rawStatusClass, displayStatus }) => {
            const firstHalf = (normalized.firstHalf || "").toLowerCase().trim();
            const secondHalf = (normalized.secondHalf || "").toLowerCase().trim();
            if (rawStatusClass === "day-status-holiday") {
                summary.holiday++;
                return;
            }
            if (
                rawStatusClass === "day-status-leave" &&
                displayStatus === AttendanceStatus.LEAVE
            ) {
                summary.leave++;
                return;
            }
            const normalizeStatus = (status: string) => {
                switch (status) {
                    case "office":
                        return "office";

                    case "wfh":
                    case "work from home":
                        return "wfh";

                    case "client":
                    case "client visit":
                    case "client place":
                        return "client";

                    case "leave":
                        return "leave";

                    default:
                        return "";
                }
            };
            const first = normalizeStatus(firstHalf);
            const second = normalizeStatus(secondHalf);
            if (first && second) {
                if (first === second) {
                    switch (first) {
                        case "office":
                            summary.present++;
                            break;

                        case "wfh":
                            summary.wfh++;
                            break;

                        case "client":
                            summary.clientVisit++;
                            break;

                        case "leave":
                            summary.leave++;
                            break;
                    }
                } else {
                    summary.halfDay++;
                }
                return;
            }
            switch (rawStatusClass) {
                case "day-status-fullday":
                    summary.present++;
                    break;

                case "day-status-wfh":
                    summary.wfh++;
                    break;

                case "day-status-client":
                    summary.clientVisit++;
                    break;

                case "day-status-halfday":
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
    const isNextDisabled =
        currentDate.getFullYear() > now.getFullYear() ||
        (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() >= now.getMonth());
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
                                    disabled={isNextDisabled}
                                    className={`mobile-timesheet-nav-btn ${isNextDisabled ? "is-disabled" : ""}`}
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
                        {daysOfWeek.map((dayName) => (
                            <div key={dayName} className="mobile-timesheet-weekday-cell">
                                {dayName}
                            </div>
                        ))}
                    </div>
                    <div className="mobile-timesheet-grid">
                        {blanks.map((b) => (
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
                                    <span
                                        className="mobile-timesheet-day-number"
                                        style={{ color: cellTextColor }}
                                    >
                                        {day}
                                    </span>
                                    {normalized.totalHours !== null &&
                                        normalized.totalHours !== undefined &&
                                        Number(normalized.totalHours) > 0 &&
                                        !isBlocked && (
                                            <span
                                                className="mobile-timesheet-day-hours"
                                                style={{ color: cellTextColor }}
                                            >
                                                {Number(normalized.totalHours)}h
                                            </span>
                                        )}
                                    {isBlocked && (
                                        <div className="mobile-timesheet-day-status-label">
                                            <span style={{ color: cellTextColor }}>{statusLabel}</span>
                                        </div>
                                    )}
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
                            { label: AttendanceStatus.FULL_DAY, dot: "legend-dot-fullday" },
                            { label: "Half Day Leave", dot: "legend-dot-halfday" },
                            { label: AttendanceStatus.ABSENT, dot: "legend-dot-absent" },
                            { label: AttendanceStatus.LEAVE, dot: "legend-dot-leave" },
                            { label: "WFH", dot: "legend-dot-wfh" },
                            { label: "Client Visit", dot: "legend-dot-client" },
                            { label: AttendanceStatus.NOT_UPDATED, dot: "legend-dot-default" },
                            { label: "Today", dot: "legend-dot-today" },
                            { label: AttendanceStatus.HOLIDAY, dot: "legend-dot-holiday" },
                            { label: "Upcoming", dot: "legend-dot-default" },
                            { label: "Blocked", dot: "legend-dot-blocked" },
                        ].map((item) => (
                            <div key={item.label} className="mobile-timesheet-legend-item">
                                <div className={`mobile-timesheet-legend-dot ${item.dot}`} />
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