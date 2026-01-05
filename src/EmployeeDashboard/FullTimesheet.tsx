import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimesheetEntry } from '../types';

interface FullTimesheetProps {
    entries: TimesheetEntry[];
    calculateTotal: (login: string, logout: string) => string;
    displayDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

const FullTimesheet = ({ entries, calculateTotal, displayDate, onPrevMonth, onNextMonth }: FullTimesheetProps) => {

    return (
        <div className="flex flex-col min-h-full bg-[#F4F7FE]">
            {/* Header */}
            <header className="bg-white/50 backdrop-blur-sm sticky top-0 z-20 px-8 py-3 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-bold text-[#2B3674]">Full Timesheet</h2>
                <div className="flex items-center gap-4 text-sm font-bold text-[#2B3674] bg-white px-4 py-1.5 rounded-lg shadow-sm border border-gray-100">
                    <button
                        onClick={onPrevMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#00A3C4]"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="min-w-[120px] text-center">
                        {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={onNextMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#00A3C4]"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            <div className="p-8">
                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                    {/* Table Header - Removed Action Column */}
                    <div className="grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-4 text-center items-center">
                        <div className="text-left pl-4">Date</div>
                        <div className="text-left">Day</div>
                        <div className="">Attendance</div>
                        <div className="">Login</div>
                        <div className="">Logout</div>
                        <div className="">Total</div>
                        <div className="">Status</div>
                    </div>

                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    {/* Table Rows - Full Height (no overflow-y-auto restricted height) */}
                    <div className="space-y-4 pb-2">
                        {entries.map((day) => {

                            // Weekend Row
                            if (day.isWeekend) {
                                return (
                                    <div key={day.date} className="grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl bg-red-50/50 text-gray-400">
                                        <div className="font-bold text-red-300 pl-2">{day.formattedDate}</div>
                                        <div className="text-red-300">{day.dayName}</div>
                                        <div className="col-span-5 text-center text-red-200 text-xs font-medium uppercase tracking-widest bg-red-50/50 py-2 rounded-lg border border-red-100/50">
                                            Weekend
                                        </div>
                                    </div>
                                );
                            }

                            // Past Incomplete Row
                            if (!day.isFuture && !day.isToday && (!day.loginTime || !day.logoutTime)) {
                                return (
                                    <div key={day.date} className="grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl bg-yellow-50/50 text-gray-400">
                                        <div className="font-bold text-yellow-500 pl-2">{day.formattedDate}</div>
                                        <div className="text-yellow-500">{day.dayName}</div>
                                        <div className="col-span-5 text-center text-yellow-500 text-xs font-medium uppercase tracking-widest bg-yellow-50/50 py-2 rounded-lg border border-yellow-100/50">
                                            Not Updated
                                        </div>
                                    </div>
                                );
                            }

                            // Future Row
                            if (day.isFuture) {
                                return (
                                    <div key={day.date} className="grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl text-gray-300 opacity-100 border border-gray-100">
                                        <div className="font-bold pl-2">{day.formattedDate}</div>
                                        <div className="">{day.dayName}</div>
                                        <div className="text-center">--</div>
                                        <div className="text-center">--:--</div>
                                        <div className="text-center">--:--</div>
                                        <div className="text-center">--:--</div>
                                        <div className="text-center">
                                            <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">Upcoming</span>
                                        </div>
                                    </div>
                                );
                            }

                            // Read-Only Data Row
                            // Highlight Current Day
                            const rowBg = day.isToday ? 'bg-[#F4F7FE] border border-dashed border-[#00A3C4]' : 'border border-gray-100 hover:bg-gray-50';
                            const dateColor = day.isToday ? 'text-[#00A3C4]' : 'text-[#2B3674]';

                            return (
                                <div key={day.date} className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all ${rowBg}`}>
                                    {/* Date & Day */}
                                    <div className={`font-bold pl-2 ${dateColor}`}>{day.formattedDate}</div>
                                    <div className={`${day.isToday ? 'font-bold text-[#00A3C4]' : 'text-[#2B3674]'}`}>{day.isToday ? 'Today' : day.dayName}</div>

                                    {/* Attendance Type (Read Only) */}
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="flex items-center gap-1.5 opacity-80">
                                            <div className={`w-2.5 h-2.5 rounded-full ${day.attendanceType === 'login' ? 'bg-[#00A3C4]' : 'border border-gray-300'}`}></div>
                                            <span className={`text-xs ${day.attendanceType === 'login' ? 'text-[#00A3C4] font-bold' : 'text-gray-400'}`}>In</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-80">
                                            <div className={`w-2.5 h-2.5 rounded-full ${day.attendanceType === 'logout' ? 'bg-[#0F6F8C]' : 'border border-gray-300'}`}></div>
                                            <span className={`text-xs ${day.attendanceType === 'logout' ? 'text-[#197c9a] font-bold' : 'text-gray-400'}`}>Out</span>
                                        </div>
                                    </div>

                                    {/* Login Time */}
                                    <div className="flex justify-center">
                                        <div className={`font-medium text-[#2B3674] flex items-center gap-2 ${!day.loginTime && 'opacity-30'}`}>
                                            {day.loginTime || '--:--'} <Clock size={12} className="text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Logout Time */}
                                    <div className="flex justify-center">
                                        <div className={`font-medium text-[#2B3674] flex items-center gap-2 ${!day.logoutTime && 'opacity-30'}`}>
                                            {day.logoutTime || '--:--'} <Clock size={12} className="text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Total Hours */}
                                    <div className="flex justify-center font-bold text-[#2B3674]">
                                        {calculateTotal(day.loginTime, day.logoutTime)}
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex justify-center w-full">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                            ${day.status === 'Present' ? 'bg-[#01B574] text-white shadow-[0_2px_10px_-2px_rgba(1,181,116,0.4)]' :
                                                day.status === 'Absent' ? 'bg-[#EE5D50] text-white shadow-[0_2px_10px_-2px_rgba(238,93,80,0.4)]' :
                                                    day.status === 'Half Day' ? 'bg-[#FFB547] text-white shadow-[0_2px_10px_-2px_rgba(255,181,71,0.4)]' : 'text-gray-400'
                                            }
                                        `}>
                                            {day.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullTimesheet;
