import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppSelector, useAppDispatch } from '../hooks';
import { RootState } from '../store';
import { generateMonthlyEntries } from '../utils/attendanceUtils';
import { TimesheetEntry } from "../types";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";

interface CalendarProps {
    now?: Date;
    onNavigateToDate?: (date: number) => void;
    variant?: 'small' | 'large' | 'sidebar';
    currentDate?: Date;
    onMonthChange?: (date: Date) => void;
    entries?: TimesheetEntry[];
}

const Calendar = ({ 
    now = new Date(), 
    onNavigateToDate, 
    variant = 'large', 
    currentDate, 
    onMonthChange, 
    entries: propEntries 
}: CalendarProps) => {

    const dispatch = useAppDispatch();
    const { records } = useAppSelector((state: RootState) => state.attendance);
    // @ts-ignore - Assuming masterHolidays is in RootState but type might not be fully updated in IDE
    const { holidays } = useAppSelector((state: RootState) => state.masterHolidays || { holidays: [] });
    
    // Fetch holidays on mount
    useEffect(() => {
        dispatch(fetchHolidays());
    }, [dispatch]);

    // Local state for navigation (fallback if not controlled)
    const [internalDisplayDate, setInternalDisplayDate] = useState(now);

    const displayDate = currentDate || internalDisplayDate;

    // Generate entries from Redux state ONLY if not provided via props
    const entries = useMemo(() => {
        if (propEntries) return propEntries;

        const rawEntries = generateMonthlyEntries(displayDate, now, records);
        return rawEntries;
    }, [displayDate, now, records, propEntries]);

    const isSmall = variant === 'small';
    const isSidebar = variant === 'sidebar';

    const currentMonthName = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1);
        if (onMonthChange) {
            onMonthChange(newDate);
        } else {
            setInternalDisplayDate(newDate);
        }
    };

    const handleNextMonth = () => {
        const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1);
        if (onMonthChange) {
            onMonthChange(newDate);
        } else {
            setInternalDisplayDate(newDate);
        }
    };

    // Days of week headers
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    // We need to align the first day of the month
    const firstDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const checkIsHoliday = (year: number, month: number, day: number) => {
        if (!holidays || holidays.length === 0) return null;
        // Construct date string YYYY-MM-DD
        // Ensure month is 1-indexed and padded
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return holidays.find((h: any) => h.holidayDate === dateStr || h.date === dateStr);
    };

    const getStatusClasses = (day: number) => {
        const entry = entries.find(e => e.date === day);
        const cellDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
        
        // Check Master Holiday
        const holiday = checkIsHoliday(displayDate.getFullYear(), displayDate.getMonth(), day);

        // Status Based Styling
        const status = entry?.status;
        
        // Future Dates
        const checkNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const isFuture = cellDate > checkNow;
        
        // 1. If YOU WORKED (Status exists and is valid work), show WORK COLOR (Overrides Holiday)
        if (status === 'Full Day' || status === 'WFH' || status === 'Client Visit') {
             return 'bg-[#E9FBF5] text-[#01B574] border border-[#01B574]/20 shadow-sm';
        }
        
        if (status === 'Half Day') {
             return 'bg-[#FFF9E5] text-[#FFB020] border border-[#FFB020]';
        }

        // 2. If NO WORK, then check HOLIDAY
        if (holiday) {
             return 'bg-[#FDF2F2] text-[#ff4d4d] border border-[#ff4d4d]/20 relative overflow-hidden';
        }

        // Requirement: Next month (and future) weekends should be red, but ONLY if no explicit status is set
        if (isFuture && isWeekend && !status) {
            return 'bg-red-50 text-red-400 border border-red-100';
        }

        if (!entry) return 'border border-gray-100 text-gray-400';

        if (entry.isToday) return 'bg-[#F4F7FE] border border-dashed border-[#00A3C4] text-[#00A3C4] font-bold';

        // Not Updated Check
        const isNotUpdated = !entry.isFuture && !entry.isToday && !entry.isWeekend && 
                            (status === 'Not Updated' || (!entry.totalHours && status !== 'Leave'));
        
        if (isNotUpdated || status === 'Pending') {
             return 'bg-[#FFF9E5] text-[#FFB020] border border-[#FFB020] relative';
        }

        // Weekend or Leave - Check this LAST so explicit statuses above take priority
        if (status === 'Leave' || (entry.isWeekend && !isFuture)) {
             return 'bg-red-50 text-red-400 border border-red-100';
        }

        // Default neutral
        return 'border border-gray-100 text-gray-400';
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Main Calendar Card */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${isSmall ? 'p-3' : isSidebar ? 'p-4' : 'p-8'}`}>
                {/* Header Section */}
                {!isSmall && (
                    <div className={`flex items-center justify-between gap-2 ${isSidebar ? 'mb-4' : 'flex-col sm:flex-row mb-8 md:gap-4'}`}>
                        <h3 className={`${isSidebar ? 'text-base' : 'text-lg md:text-xl'} font-bold text-[#1B254B] text-center sm:text-left`}>
                            {isSidebar ? 'Attendance' : 'Monthly Attendance Snapshot'}
                        </h3>
                        <div className={`flex items-center gap-2 ${isSidebar ? 'bg-transparent p-0' : 'md:gap-6 bg-gray-50/50 p-1 rounded-xl border border-gray-100/50'}`}>
                            <button
                                onClick={handlePrevMonth}
                                className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674] ${isSidebar ? 'p-1' : ''}`}
                            >
                                <ChevronLeft size={isSidebar ? 16 : 20} />
                            </button>
                            <span className={`${isSidebar ? 'text-sm min-w-[100px]' : 'text-sm md:text-lg min-w-[120px] md:min-w-[140px]'} font-bold text-[#2B3674] text-center`}>
                                {currentMonthName}
                            </span>
                            <button
                                onClick={handleNextMonth}
                                className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674] ${isSidebar ? 'p-1' : ''}`}
                            >
                                <ChevronRight size={isSidebar ? 16 : 20} />
                            </button>
                        </div>
                    </div>
                )}

                {isSmall && (
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-bold text-[#1B254B]">{currentMonthName}</span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-[#F4F7FE] rounded-md transition-all text-[#A3AED0]"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-[#F4F7FE] rounded-md transition-all text-[#A3AED0]"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Calendar Grid Card */}
                <div className={`bg-white rounded-xl border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] ${isSmall ? 'p-1.5 mb-2' : isSidebar ? 'p-2 mb-4' : 'p-2 md:p-4 mb-6'}`}>
                    <div className={`grid grid-cols-7 ${isSmall ? 'gap-0.5' : isSidebar ? 'gap-1' : 'gap-1 md:gap-2'}`}>
                        {daysOfWeek.map(day => (
                            <div key={day} className={`text-center font-bold text-gray-400 ${isSmall ? 'text-[7px] mb-0.5' : isSidebar ? 'text-[9px] mb-1' : 'text-[10px] md:text-xs mb-2'}`}>{day}</div>
                        ))}

                        {/* Blanks for alignment */}
                        {blanks.map(blank => (
                            <div key={`blank-${blank}`} className={`${isSmall ? 'h-7 w-7' : isSidebar ? 'h-8 w-8' : 'w-[90%] md:w-[85%] lg:w-[80%] h-12 md:h-16 lg:h-20'} mx-auto`}></div>
                        ))}

                        {/* Days */}
                        {monthDays.map(day => {
                            // Find entry
                            const entry = entries.find(e => e.date === day);
                            const holiday = checkIsHoliday(displayDate.getFullYear(), displayDate.getMonth(), day);
                            
                            // Re-implementing logic safely without loginTime
                            const isNotUpdated = entry && !entry.isFuture && !entry.isToday && !entry.isWeekend && 
                                                (entry.status === 'Not Updated' || (!entry.totalHours && entry.status !== 'Leave'));
                            
                            const isIncomplete = entry && (isNotUpdated || entry.status === 'Pending') && !entry.isFuture && !entry.isWeekend;

                            return (
                                <div
                                    key={day}
                                    onClick={() => entry && onNavigateToDate?.(day)}
                                    className={`${isSmall ? 'w-7 h-7 text-[9px]' : isSidebar ? 'w-8 h-8 text-xs' : 'w-[90%] md:w-[85%] lg:w-[80%] h-12 md:h-16 lg:h-20 text-xs md:text-sm'} mx-auto rounded-lg flex items-center justify-center font-bold transition-all hover:scale-105 cursor-pointer relative group
                                    ${getStatusClasses(day)}`}
                                >
                                    <span className={holiday ? "mb-2 md:mb-3" : ""}>{day}</span>
                                    
                                    {/* Render Holiday Name */}
                                    {/* Render Holiday Name */}
                                    {holiday && !isSmall && !isSidebar && (
                                        <div className="absolute bottom-1 md:bottom-2 left-0 w-full text-center px-0.5">
                                            <p className="text-[7px] md:text-[9px] leading-tight truncate font-medium opacity-90">
                                                {holiday.name}
                                            </p>
                                        </div>
                                    )}

                                    {isIncomplete && (
                                        <div className={`absolute top-0.5 right-0.5 md:-top-1 md:-right-1 bg-[#FFB020] text-white flex items-center justify-center rounded-full border border-white md:border-2 
                                            ${isSmall ? 'w-1.5 h-1.5 text-[5px]' : 'w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-[7px] md:text-[9px] font-black'}`}>!</div>
                                    )}

                                    {/* Hover Status Badge - Only for large/standard view, usually */}
                                    {(!isSmall && !isSidebar && entry && (entry.status || entry.isWeekend) && (!holiday || (entry.totalHours || 0) > 0)) && (
                                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-10 
                                            opacity-0 group-hover:opacity-100 group-hover:translate-y-[-50%] transition-all duration-300 pointer-events-none
                                            px-2 py-1 rounded text-[10px] md:text-xs font-bold whitespace-nowrap shadow-lg hidden md:block
                                            ${(() => {
                                                const status = entry.status as any;
                                                const isActualMissing = !entry.isFuture && !entry.totalHours && status !== 'Leave' && status !== 'Holiday' && !entry.isWeekend;
                                                
                                                if (status === 'Not Updated' || isActualMissing || status === 'Pending') return 'bg-[#FFB020] text-white';
                                                
                                                if (status === 'Full Day' || status === 'WFH' || status === 'Client Visit') return 'bg-[#01B574] text-white';
                                                
                                                if (status === 'Half Day') return 'bg-[#FFB020] text-white';
                                                
                                                if (status === 'Leave' || status === 'Holiday' || entry.isWeekend) return 'bg-red-500 text-white';
                                                
                                                if (entry.isToday) return 'bg-[#00A3C4] text-white';
                                                return 'bg-gray-800 text-white';
                                            })()}`}>
                                            {(() => {
                                                const status = entry.status;
                                                const isActualMissing = !entry.isFuture && !entry.totalHours && status !== 'Leave' && (status as any) !== 'Holiday' && !entry.isWeekend;

                                                if (status === 'Not Updated' || isActualMissing || status === 'Pending') return 'Not Updated';
                                                if (entry.isWeekend && !status) return 'Weekly Off';
                                                return status || 'No Status';
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className={`flex items-center justify-center flex-wrap border-t border-gray-100 ${isSmall ? 'gap-x-2 gap-y-1 mt-2 pt-2' : isSidebar ? 'gap-2 mt-4 pt-4' : 'gap-x-4 md:gap-x-10 mt-6 md:mt-8 pt-4 md:pt-6'}`}>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : isSidebar ? 'gap-1 text-[9px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#E9FBF5] border border-[#01B574]/20 ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Done' : 'Full Day'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : isSidebar ? 'gap-1 text-[9px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#F4F7FE] border border-dashed border-[#00A3C4] ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> Today
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : isSidebar ? 'gap-1 text-[9px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#FFF9E5] border border-[#FFB020] ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Miss' : 'Half Day'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : isSidebar ? 'gap-1 text-[9px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-red-50 border border-red-100 ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Off' : isSidebar ? 'Leave' : 'Leave / Weekend'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;

