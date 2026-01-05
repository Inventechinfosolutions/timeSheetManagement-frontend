import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimesheetEntry } from '../types';

interface CalendarProps {
    entries: TimesheetEntry[];
    now: Date;
    onNavigateToDate?: (date: number) => void;
}

const Calendar = ({ entries, now, onNavigateToDate }: CalendarProps) => {
    // Local state for navigation
    const [displayDate, setDisplayDate] = React.useState(now);

    const currentMonthName = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
    };

    // Days of week headers
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    // We need to align the first day of the month
    // Note: getDay() returns 0 for Sunday. We want Monday to be first (index 0).
    const firstDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
    // Convert Sunday (0) to 6, and shift others by -1 to make Mon=0
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();

    // Create array for the grid
    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const isCurrentMonth = displayDate.getMonth() === now.getMonth() && displayDate.getFullYear() === now.getFullYear();

    const getStatusClasses = (day: number) => {
        // Only show status for the actual current month
        if (!isCurrentMonth) return 'border border-gray-100 text-gray-400';

        const entry = entries.find(e => e.date === day);
        if (!entry) return 'border border-gray-100 text-gray-400';

        // Current Day Styling (Matches MyTimesheet 'Today' row)
        if (entry.isToday) return 'bg-[#F4F7FE] border border-dashed border-[#00A3C4] text-[#00A3C4] font-bold';

        // Matching logic from previous TodayAttendance snapshot
        if (entry.isWeekend) return 'bg-red-50 text-red-400 border border-red-100';
        if (entry.status === 'Present' && !entry.isFuture) return 'bg-white text-[#2B3674] border border-[#E0E5F2] shadow-sm';
        if ((entry.status === 'Absent' || entry.status === 'Half Day') && !entry.isFuture) return 'bg-[#FFF9E5] text-[#FFB020] border border-[#FFB020] relative';

        // Future or fallback
        return 'border border-gray-100 text-gray-400';
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Main Calendar Card */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
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

                {/* Calendar Grid Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-1.5 mb-2">
                    <div className="grid grid-cols-7 gap-0.5">
                        {daysOfWeek.map(day => (
                            <div key={day} className="text-center text-[7px] font-bold text-gray-400 mb-0.5">{day}</div>
                        ))}

                        {/* Blanks for alignment */}
                        {blanks.map(blank => (
                            <div key={`blank-${blank}`} className="h-7 w-7 mx-auto"></div>
                        ))}

                        {/* Days */}
                        {monthDays.map(day => {
                            // Only look up entry if we are in the current month
                            const entry = isCurrentMonth ? entries.find(e => e.date === day) : null;
                            const isIncomplete = entry && (entry.status === 'Absent' || entry.status === 'Half Day') && !entry.isFuture && !entry.isWeekend;

                            return (
                                <div
                                    key={day}
                                    onClick={() => isCurrentMonth && onNavigateToDate?.(day)}
                                    className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center text-[9px] font-bold transition-transform hover:scale-105 cursor-pointer 
                                    ${getStatusClasses(day)}`}
                                >
                                    {day}
                                    {isIncomplete && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#FFB020] text-white text-[5px] flex items-center justify-center rounded-full border-2 border-white">!</div>}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-2 border-t border-gray-100 pt-2">
                    <div className="flex items-center gap-1 text-[8px] font-medium text-gray-400">
                        <div className="w-1.5 h-1.5 rounded bg-white border border-[#E0E5F2]"></div> Done
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-medium text-gray-400">
                        <div className="w-1.5 h-1.5 rounded bg-[#F4F7FE] border border-dashed border-[#00A3C4]"></div> Today
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-medium text-gray-400">
                        <div className="w-1.5 h-1.5 rounded bg-[#FFF9E5] border border-[#FFB020]"></div> Miss
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-medium text-gray-400">
                        <div className="w-1.5 h-1.5 rounded bg-red-50 border border-red-100"></div> End
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
