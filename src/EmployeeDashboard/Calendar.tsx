import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimesheetEntry } from '../types';

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
        if (entry.status === 'Present' && !entry.isFuture) return 'bg-white text-[#2B3674] border border-[#E0E5F2] shadow-sm';
        if ((entry.status === 'Absent' || entry.status === 'Half Day') && !entry.isFuture) return 'bg-[#FFF9E5] text-[#FFB020] border border-[#FFB020] relative';

        return 'border border-gray-100 text-gray-400';
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Main Calendar Card */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${isSmall ? 'p-3' : 'p-8'}`}>
                {/* Header Section */}
                {!isSmall && (
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-[#1B254B]">Monthly Attendance Snapshot</h3>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-[#F4F7FE] rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674]"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-lg font-bold text-[#2B3674] min-w-[140px] text-center">{currentMonthName}</span>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-[#F4F7FE] rounded-lg transition-all text-[#A3AED0] hover:text-[#2B3674]"
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
                <div className={`bg-white rounded-xl border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] ${isSmall ? 'p-1.5 mb-2' : 'p-4 mb-6'}`}>
                    <div className={`grid grid-cols-7 ${isSmall ? 'gap-0.5' : 'gap-2'}`}>
                        {daysOfWeek.map(day => (
                            <div key={day} className={`text-center font-bold text-gray-400 ${isSmall ? 'text-[7px] mb-0.5' : 'text-xs mb-2'}`}>{day}</div>
                        ))}

                        {/* Blanks for alignment */}
                        {blanks.map(blank => (
                            <div key={`blank-${blank}`} className={`${isSmall ? 'h-7 w-7' : 'h-16 w-16'} mx-auto`}></div>
                        ))}

                        {/* Days */}
                        {monthDays.map(day => {
                            // Find entry regardless of month (assuming parent handles data fetching)
                            const entry = entries.find(e => e.date === day);
                            const isIncomplete = entry && (entry.status === 'Absent' || entry.status === 'Half Day') && !entry.isFuture && !entry.isWeekend;

                            return (
                                <div
                                    key={day}
                                    onClick={() => entry && onNavigateToDate?.(day)}
                                    className={`${isSmall ? 'w-7 h-7 text-[9px]' : 'w-16 h-16 text-sm'} mx-auto rounded-lg flex items-center justify-center font-bold transition-transform hover:scale-105 cursor-pointer 
                                    ${getStatusClasses(day)}`}
                                >
                                    {day}
                                    {isIncomplete && (
                                        <div className={`absolute -top-1 -right-1 bg-[#FFB020] text-white flex items-center justify-center rounded-full border-2 border-white 
                                            ${isSmall ? 'w-1.5 h-1.5 text-[5px]' : 'w-3.5 h-3.5 text-[9px] font-black'}`}>!</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className={`flex items-center justify-center border-t border-gray-100 ${isSmall ? 'flex-wrap gap-x-2 gap-y-1 mt-2 pt-2' : 'gap-x-10 mt-8 pt-6'}`}>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-2 text-xs'}`}>
                        <div className={`rounded bg-white border border-[#E0E5F2] ${isSmall ? 'w-1.5 h-1.5' : 'w-3 h-3'}`}></div> {isSmall ? 'Done' : 'Completed'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-2 text-xs'}`}>
                        <div className={`rounded bg-[#F4F7FE] border border-dashed border-[#00A3C4] ${isSmall ? 'w-1.5 h-1.5' : 'w-3 h-3'}`}></div> Today
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-2 text-xs'}`}>
                        <div className={`rounded bg-[#FFF9E5] border border-[#FFB020] ${isSmall ? 'w-1.5 h-1.5' : 'w-3 h-3'}`}></div> {isSmall ? 'Miss' : 'Incomplete'}
                    </div>
                    <div className={`flex items-center text-gray-400 font-medium ${isSmall ? 'gap-1 text-[8px]' : 'gap-2 text-xs'}`}>
                        <div className={`rounded bg-red-50 border border-red-100 ${isSmall ? 'w-1.5 h-1.5' : 'w-3 h-3'}`}></div> {isSmall ? 'End' : 'Weekend'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
