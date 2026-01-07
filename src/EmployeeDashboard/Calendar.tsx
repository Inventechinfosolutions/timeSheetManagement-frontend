import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimesheetEntry } from "../types";

interface CalendarProps {
    entries: TimesheetEntry[];
    now: Date;
    onNavigateToDate?: (date: number) => void;
    variant?: 'small' | 'large';
}

const Calendar = ({ entries, now, onNavigateToDate, variant = 'large', currentDate, onMonthChange }: CalendarProps & { currentDate?: Date; onMonthChange?: (date: Date) => void }) => {
    // Local state for navigation (fallback if not controlled)
    const [internalDisplayDate, setInternalDisplayDate] = React.useState(now);

    const displayDate = currentDate || internalDisplayDate;

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
        // Find entry for the day
        const entry = entries.find(e => e.date === day);

        // Construct the specific date for this cell to check weekend/future status reliably
        const cellDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

        // Future check: simple comparison (ignoring time)
        const checkNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const isFuture = cellDate > checkNow;

        // Requirement: Next month (and future) weekends should be red
        if (isFuture && isWeekend) {
            return 'bg-red-50 text-red-400 border border-red-100';
        }

        if (!entry) return 'border border-gray-100 text-gray-400';

        if (entry.isToday) return 'bg-[#F4F7FE] border border-dashed border-[#00A3C4] text-[#00A3C4] font-bold';
        if (entry.isWeekend) return 'bg-red-50 text-red-400 border border-red-100';

        // Neutral style for future non-weekend days
        if (entry.isFuture) return 'border border-gray-200 text-gray-400';

        // Not Updated (Past Workday with missing logs) - Priority over Absent status
        const isNotUpdated = !entry.isFuture && !entry.isToday && !entry.isWeekend && (!entry.loginTime || !entry.logoutTime);
        if (isNotUpdated || entry.status === 'Half Day' || entry.status === 'Pending') return 'bg-[#FFF9E5] text-[#FFB020] border border-[#FFB020] relative';

        // Status Based Styling (Past days only)
        if (entry.status === 'Present' || entry.status === 'WFH' || entry.status === 'Client Visit') return 'bg-[#E9FBF5] text-[#01B574] border border-[#01B574]/20 shadow-sm';
        if (entry.status === 'Absent') return 'bg-red-50 text-red-400 border border-red-100';

        return 'border border-gray-100 text-gray-400';

        return 'border border-gray-100 text-gray-400';
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
                            // Find entry regardless of month (assuming parent handles data fetching)
                            const entry = entries.find(e => e.date === day);
                            const isNotUpdated = entry && !entry.isFuture && !entry.isToday && !entry.isWeekend && (!entry.loginTime || !entry.logoutTime);
                            const isIncomplete = entry && (isNotUpdated || entry.status === 'Half Day' || entry.status === 'Pending') && !entry.isFuture && !entry.isWeekend;

                            return (
                                <div
                                    key={day}
                                    onClick={() => entry && onNavigateToDate?.(day)}
                                    className={`${isSmall ? 'w-7 h-7 text-[9px]' : 'w-[90%] md:w-[85%] lg:w-[80%] h-12 md:h-16 lg:h-20 text-xs md:text-sm'} mx-auto rounded-lg flex items-center justify-center font-bold transition-all hover:scale-105 cursor-pointer relative
                                    ${getStatusClasses(day)}`}
                                >
                                    {day}
                                    {isIncomplete && (
                                        <div className={`absolute top-0.5 right-0.5 md:-top-1 md:-right-1 bg-[#FFB020] text-white flex items-center justify-center rounded-full border border-white md:border-2 
                                            ${isSmall ? 'w-1.5 h-1.5 text-[5px]' : 'w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-[7px] md:text-[9px] font-black'}`}>!</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className={`flex items-center justify-center flex-wrap border-t border-gray-100 ${isSmall ? 'gap-x-2 gap-y-1 mt-2 pt-2' : 'gap-x-4 md:gap-x-10 mt-6 md:mt-8 pt-4 md:pt-6'}`}>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#E9FBF5] border border-[#01B574]/20 ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Done' : 'Completed'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#F4F7FE] border border-dashed border-[#00A3C4] ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> Today
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-[#FFF9E5] border border-[#FFB020] ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Miss' : 'Half Day'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-1.5 md:gap-2 text-[10px] md:text-xs'}`}>
                        <div className={`rounded bg-red-50 border border-red-100 ${isSmall ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 md:w-3 md:h-3'}`}></div> {isSmall ? 'Off' : 'Weekend'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
