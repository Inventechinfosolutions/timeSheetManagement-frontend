import React from 'react';
import {
    LayoutGrid,
    CalendarCheck,

    Clock,

    AlertTriangle,
    Save,

    Edit

} from 'lucide-react';
import { TimesheetEntry } from '../types';
import CalendarView from './Calendar'; // Aliased to avoid conflict with lucide-react Calendar icon

interface Props {
    setActiveTab: (tab: string) => void;
    todayEntry: TimesheetEntry | undefined;
    calculateTotal: (login: string, logout: string) => string;
    entries: TimesheetEntry[];
    calendarEntries?: TimesheetEntry[];
    now: Date;
    onNavigateToDate?: (date: number) => void;
    hideStatusBadges?: boolean;
    title?: string;
    displayDate?: Date;
    onMonthChange?: (date: Date) => void;
}

const TodayAttendance = ({ setActiveTab, todayEntry, calculateTotal, entries, calendarEntries, now, onNavigateToDate, hideStatusBadges, title = "Today's Attendance", displayDate, onMonthChange }: Props) => {

    if (!todayEntry) return <div>Loading...</div>;

    // Use calendarEntries for the Calendar view if provided, otherwise fallback to standard entries
    const entriesForCalendar = calendarEntries || entries;

    return (
        <>
            {/* ... Header and Status Cards (unchanged) ... */}
            <header className="bg-[#F4F7FE] md:bg-opacity-50 backdrop-blur-sm sticky top-0 z-10 px-8 py-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#2B3674]">{title}</h2>

                <div className="flex items-center gap-4">
                    <div className="bg-white px-5 py-1.5 rounded-full shadow-sm border border-gray-100">
                        <span className="text-sm font-medium text-gray-500">
                            {todayEntry.fullDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, ' /')}
                        </span>
                    </div>

                    {/* Status Badges */}
                    {!hideStatusBadges && (
                        <>
                            {todayEntry.status === 'Absent' ? (
                                <div className="px-4 py-1.5 bg-[#FFF5F5] text-[#F53636] rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide shadow-[0_0_12px_rgba(245,54,54,0.3)]">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Absent
                                </div>
                            ) : !todayEntry.loginTime ? (
                                <div className="px-4 py-1.5 bg-[#FFF9E5] text-[#FFB020] rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide shadow-[0_0_12px_rgba(255,176,32,0.3)]">
                                    <Clock className="w-3.5 h-3.5" /> Pending Login
                                </div>
                            ) : !todayEntry.logoutTime ? (
                                <div className="px-4 py-1.5 bg-[#FFF9E5] text-[#FFB020] rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide shadow-[0_0_12px_rgba(255,176,32,0.3)]">
                                    <Clock className="w-3.5 h-3.5" /> Pending Logout
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            </header>

            <div className="px-8 pb-8 space-y-6">

                {/* Status Cards */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Login Time */}
                        <div className="bg-[#E9FBF5] rounded-xl p-5 border-l-4 border-[#01B574] relative overflow-hidden group hover:shadow-md transition-all">
                            <p className="text-gray-500 text-sm font-medium mb-3">Login Time</p>
                            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                                <span className="text-xl font-bold text-[#2B3674]">{todayEntry.loginTime || '--:--'}</span>
                                <div className="w-7 h-7 rounded-full bg-[#E9FBF5] flex items-center justify-center text-[#01B574]">
                                    <Clock size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Logout Time */}
                        <div className="bg-[#FDF2F2] rounded-xl p-5 border-l-4 border-red-500 relative overflow-hidden group hover:shadow-md transition-all">
                            <p className="text-gray-500 text-sm font-medium mb-3">Logout Time</p>
                            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                                <span className="text-xl font-bold text-gray-400 tracking-wider">
                                    {todayEntry.logoutTime || '--:--'}
                                </span>
                                <div className="w-7 h-7 rounded-full bg-[#FDF2F2] flex items-center justify-center text-red-500">
                                    <Clock size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Total Hours */}
                        <div className="bg-[#F4F7FE] rounded-xl p-5 border-l-4 border-[#4318FF] relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-gray-500 text-sm font-medium">Total Working Hours</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-[#4318FF] tracking-wider">
                                    {calculateTotal(todayEntry.loginTime, todayEntry.logoutTime)}
                                </span>
                                <span className="text-sm font-medium text-gray-400">hours</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={() => setActiveTab('My Timesheet')}
                            className="px-6 py-2.5 bg-[#00A3C4] text-white rounded-xl font-bold hover:bg-[#0093b1] transition-colors flex items-center gap-2 shadow-lg shadow-teal-100"
                        >
                            <Save size={18} />
                            Mark Attendance
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Present Days */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] group-hover:scale-110 transition-transform">
                                <CalendarCheck size={24} />
                            </div>
                            <span className="px-3 py-1 bg-[#E6FFFA] text-[#01B574] rounded-full text-[10px] font-bold uppercase tracking-wider">This Month</span>
                        </div>
                        <div>
                            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                                {entries.filter(e => e.status === 'Present' || e.status === 'Half Day').length}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium">Total Days Present</p>
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] group-hover:scale-110 transition-transform">
                                <Clock size={24} />
                            </div>
                            <span className="px-3 py-1 bg-[#F4F7FE] text-[#4318FF] rounded-full text-[10px] font-bold uppercase tracking-wider">This Month</span>
                        </div>
                        <div>
                            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                                {Math.round(entries.reduce((acc, curr) => {
                                    if (!curr.loginTime || !curr.logoutTime) return acc;
                                    const [h1, m1] = curr.loginTime.split(':').map(Number);
                                    const [h2, m2] = curr.logoutTime.split(':').map(Number);
                                    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                    if (diff < 0) diff = 0;
                                    return acc + diff;
                                }, 0) / 60)}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium">Total Working Hours</p>
                        </div>
                    </div>

                    {/* Incomplete Days */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FFF9E5] flex items-center justify-center text-[#FFB020] group-hover:scale-110 transition-transform">
                                <AlertTriangle size={24} />
                            </div>
                            <span className="px-3 py-1 bg-[#FFF9E5] text-[#FFB020] rounded-full text-[10px] font-bold uppercase tracking-wider">Action Needed</span>
                        </div>
                        <div>
                            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                                {entries.filter(day => !day.isFuture && !day.isToday && !day.isWeekend && !day.loginTime && day.status !== 'Absent').length}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium">Incomplete Days</p>
                        </div>
                    </div>
                </div>

                {/* Monthly Snapshot (Imported) */}
                <CalendarView entries={entriesForCalendar} now={now} onNavigateToDate={onNavigateToDate} currentDate={displayDate} onMonthChange={onMonthChange} />
                {/* Bottom Actions */}
                <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                    <button
                        onClick={() => setActiveTab && setActiveTab('Timesheet View')}
                        className="px-6 py-3 bg-white border border-[#00A3C4] text-[#00A3C4] rounded-xl font-bold hover:bg-[#E6FFFA] transition-colors flex items-center gap-2"
                    >
                        <LayoutGrid size={18} /> View Full Timesheet
                    </button>
                    <button
                        onClick={() => setActiveTab && setActiveTab('My Timesheet')}
                        className="px-6 py-3 bg-[#00A3C4] text-white rounded-xl font-bold hover:bg-[#0093b1] transition-colors flex items-center gap-2 shadow-lg shadow-teal-100"
                    >
                        <Edit size={18} /> Edit Today's Entry
                    </button>
                </div>
            </div>
        </>
    );
};

export default TodayAttendance;
