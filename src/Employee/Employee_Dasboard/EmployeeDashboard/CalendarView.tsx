import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppSelector } from '../../../hooks';
import { RootState } from '../../../store';
import { generateMonthlyEntries } from '../../../utils/attendanceUtils';
import { TimesheetEntry } from "../../../types";

interface CalendarProps {
    now?: Date;
    onNavigateToDate?: (date: number) => void;
    variant?: 'small' | 'large';
    currentDate?: Date;
    onMonthChange?: (date: Date) => void;
    entries?: TimesheetEntry[];
}

const Calendar = ({ now = new Date(), onNavigateToDate, variant = 'large', currentDate, onMonthChange, entries: propEntries }: CalendarProps) => {
    


    const { records } = useAppSelector((state: RootState) => state.attendance);
    
    // Local state for navigation (fallback if not controlled)
    const [internalDisplayDate, setInternalDisplayDate] = useState(now);

    const displayDate = currentDate || internalDisplayDate;

    // Generate entries from Redux state ONLY if not provided via props
    const entries = useMemo(() => {
        if (propEntries) return propEntries;

        const rawEntries = generateMonthlyEntries(displayDate, now, records);
        // Apply same cleaning as TodayAttendance to ensure consistency
        return rawEntries;
    }, [displayDate, now, records, propEntries]);

    const isSmall = variant === 'small';

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

    const getStatusClasses = (day: number) => {
        const entry = entries.find(e => e.date === day);
        const cellDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        
        // Future Dates (Gray) - UNLESS data exists (Show SQL data if present)
        const checkNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (cellDate > checkNow) {
             // If entry has valid data (Full/Half Day), let it fall through to standard styling
             const hasData = entry && (entry.status === 'Full Day' || entry.status === 'Half Day');
             
             if (!hasData) {
                const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                if(isWeekend) return 'bg-red-50 text-red-400 border border-red-100'; // Upcoming Weekends
                return 'border border-gray-200 text-gray-400';
             }
        }

        if (!entry) return 'border border-gray-100 text-gray-400';

        // 1. Today (Priority)
        if (entry.isToday) return 'bg-[#F4F7FE] border border-dashed border-[#00A3C4] text-[#00A3C4] font-bold';

        // 2. Status Based Styling (Direct from DB/Redux)
        switch (entry.status) {
            case 'Full Day':
            case 'WFH':
            case 'Client Visit':
                return 'bg-[#E9FBF5] text-[#01B574] border border-[#01B574]/20 shadow-sm'; // Green
            
            case 'Half Day':
                return 'bg-[#FFF9E5] text-[#FFB020] border border-[#FFB020]'; // Light Yellow (was Light Orange)

            case 'Leave':
                return 'bg-red-100 text-red-600 border border-red-200 font-medium'; // Red

            case 'Not Updated':
                return 'bg-orange-50 text-orange-600 border border-orange-200 relative font-bold'; // Light Orange (was Yellow)
            
            case 'Pending':
                 return 'bg-orange-50 text-orange-600 border border-orange-200 relative';

            default:
                // Default / Fallback (e.g. Weekends)
                if (entry.isWeekend) return 'bg-red-50 text-red-400 border border-red-100';
                return 'border border-gray-100 text-gray-400';
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Main Calendar Card */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${isSmall ? 'p-3' : 'p-8'}`}>
                {/* Header Section */}
                {!isSmall && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                        <h3 className="text-lg md:text-xl font-bold text-[#1B254B] text-center sm:text-left">Monthly Attendance Snapshot</h3>
                        <div className="flex items-center gap-4 md:gap-6 bg-gray-50/50 p-1 rounded-xl border border-gray-100/50">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674]"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm md:text-lg font-bold text-[#2B3674] min-w-[120px] md:min-w-[140px] text-center">{currentMonthName}</span>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674]"
                            >
                                <ChevronRight size={20} />
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
                <div className={`bg-white rounded-xl border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] ${isSmall ? 'p-1.5 mb-2' : 'p-2 md:p-4 mb-6'}`}>
                    <div className={`grid grid-cols-7 ${isSmall ? 'gap-0.5' : 'gap-1 md:gap-2'}`}>
                        {daysOfWeek.map(day => (
                            <div key={day} className={`text-center font-bold text-gray-400 ${isSmall ? 'text-[7px] mb-0.5' : 'text-[10px] md:text-xs mb-2'}`}>{day}</div>
                        ))}

                        {/* Blanks for alignment */}
                        {blanks.map(blank => (
                            <div key={`blank-${blank}`} className={`${isSmall ? 'h-7 w-7' : 'w-[90%] md:w-[85%] lg:w-[80%] h-12 md:h-16 lg:h-20'} mx-auto`}></div>
                        ))}

                        {/* Days */}
                        {monthDays.map(day => {
                            // Find entry
                            const entry = entries.find(e => e.date === day);
                            // Show "!" Badge only for specific statuses that need attention
                            const showBadge = entry && (entry.status === 'Not Updated');

                            return (
                                <div
                                    key={day}
                                    onClick={() => {
                                        if (entry) {
                                            const clickedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
                                            onNavigateToDate?.(clickedDate.getTime());
                                        }
                                    }}
                                    className={`${isSmall ? 'w-7 h-7 text-[9px]' : 'w-[90%] md:w-[85%] lg:w-[80%] h-12 md:h-16 lg:h-20 text-xs md:text-sm'} mx-auto rounded-lg flex items-center justify-center font-bold transition-all hover:scale-105 cursor-pointer relative group
                                    ${getStatusClasses(day)}`}
                                >
                                    {day}
                                    {showBadge && (
                                        <div className={`absolute top-0.5 right-0.5 md:-top-1 md:-right-1 bg-[#FFB020] text-white flex items-center justify-center rounded-full border border-white md:border-2 
                                            ${isSmall ? 'w-1.5 h-1.5 text-[5px]' : 'w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-[7px] md:text-[9px] font-black'}`}>!</div>
                                    )}

                                    {/* Hover Status Badge */}
                                    {entry && (
                                        // Show badge if not future OR if future but has valid status
                                        !entry.isFuture || (entry.status === 'Full Day' || entry.status === 'Half Day')
                                    ) && (
                                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-10 
                                            opacity-0 group-hover:opacity-100 group-hover:translate-y-[-50%] transition-all duration-300 pointer-events-none
                                            px-2 py-1 rounded text-[10px] md:text-xs font-bold whitespace-nowrap shadow-lg
                                            ${(() => {
                                                if (entry.status === 'Not Updated') return 'bg-orange-500 text-white';
                                                if (entry.status === 'Full Day' || entry.status === 'WFH' || entry.status === 'Client Visit') return 'bg-[#01B574] text-white';
                                                if (entry.status === 'Half Day') return 'bg-[#FFB020] text-white';
                                                if (entry.status === 'Leave' || entry.isWeekend) return 'bg-red-500 text-white';
                                                if (entry.isToday) return 'bg-[#00A3C4] text-white';
                                                return 'bg-gray-800 text-white';
                                            })()}`}>
                                            {
                                                entry.status === 'Not Updated' ? 'Not Updated' : 
                                                (entry.isWeekend && entry.status === 'Leave') ? 'Weekend' : 
                                                entry.status
                                            }
                                            {/* Arrow - Matching Color */}
                                            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 
                                                ${(() => {
                                                    if (entry.status === 'Not Updated') return 'border-b-orange-500';
                                                    if (entry.status === 'Full Day' || entry.status === 'WFH' || entry.status === 'Client Visit') return 'border-b-[#01B574]';
                                                    if (entry.status === 'Half Day') return 'border-b-[#FFB020]';
                                                    if (entry.status === 'Leave' || entry.isWeekend) return 'border-b-red-500';
                                                    if (entry.isToday) return 'border-b-[#00A3C4]';
                                                    return 'border-b-gray-800';
                                                })()}`}></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className={`flex items-center justify-center flex-wrap border-t border-gray-100 ${isSmall ? 'gap-x-2 gap-y-1 mt-2 pt-2' : 'gap-x-4 md:gap-x-10 mt-6 md:mt-8 pt-4 md:pt-6'}`}>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#E9FBF5] border border-[#01B574]/20 ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Done' : 'Full Day'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#F4F7FE] border border-dashed border-[#00A3C4] ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> Today
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-orange-50 border border-orange-200 ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Half' : 'Half Day'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-red-50 border border-red-100 ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Off' : 'Leave / Off'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#FFF9E5] border border-[#FFB020] ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Inc' : 'Not Updated'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
