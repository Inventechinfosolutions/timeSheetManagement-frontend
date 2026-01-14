import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid,
    Clock,
    AlertTriangle,
    Edit
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
    fetchMonthlyAttendance
} from '../reducers/employeeAttendance.reducer';
import { 
    getEntities,
    setCurrentUser
} from '../reducers/employeeDetails.reducer';
import { 
    generateMonthlyEntries
} from '../utils/attendanceUtils';
import Calendar from './CalendarView';
import { RootState } from '../store';

interface Props {
    setActiveTab?: (tab: string) => void;
    setScrollToDate?: (date: number | null) => void;
}

const TodayAttendance = ({ setActiveTab, setScrollToDate }: Props) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { records, loading } = useAppSelector((state: RootState) => state.attendance);
    const { entity } = useAppSelector((state: RootState) => state.employeeDetails);
    const { currentUser } = useAppSelector((state: RootState) => state.user);
    const currentEmployeeId = entity?.employeeId;

    const [now] = useState(() => new Date());
    const [calendarDate, setCalendarDate] = useState(new Date());

    // Fetch entity if missing name but we have an ID to search for
    useEffect(() => {
        if ((!entity?.firstName || !entity?.fullName) && (currentEmployeeId || currentUser?.loginId)) {
            const searchTerm = currentEmployeeId || currentUser?.loginId;
            if (searchTerm) {
                dispatch(getEntities({ page: 1, limit: 1, search: searchTerm }))
                    .unwrap()
                    .then((response) => {
                         const data = Array.isArray(response) ? response : (response.data || []);
                         // Prefer exact match on employeeId if searching by it
                         const found = data.find((u: any) => 
                            u.employeeId === searchTerm || u.email === searchTerm
                         ) || data[0];
                         
                         if (found) {
                             dispatch(setCurrentUser(found));
                         }
                    })
                    .catch(err => console.error("Failed to fetch employee details:", err));
            }
        }
    }, [dispatch, entity, currentEmployeeId, currentUser]);

    // 1. Separate "Today's" Data - ALWAYS based on current real-time Month
    // This ensures "Today's Attendance" card never changes when navigating calendar
    const todayStatsEntry = useMemo(() => {
        // Generate entries for the ACTUAL current month (now)
        const entries = generateMonthlyEntries(now, now, records);
        return entries.find(e => e.isToday) || null;
    }, [now, records]);

    // 2. Calendar / Stats Data - Based on SELECTED `calendarDate`
    // This drives the "This Month" stats and the Calendar grid
    const currentMonthEntries = useMemo(() => {
        return generateMonthlyEntries(calendarDate, now, records);
    }, [calendarDate, now, records]);

    const displayEntry = todayStatsEntry || {
        fullDate: now,
        status: 'Pending',
        isSaved: false,
        isToday: true
    } as any;

    const fetchAttendanceData = useCallback((date: Date) => {
        if (!currentEmployeeId) return; // Guard to prevent calls with undefined ID

        dispatch(fetchMonthlyAttendance({ 
            employeeId: currentEmployeeId, 
            month: (date.getMonth() + 1).toString().padStart(2, '0'),
            year: date.getFullYear().toString() 
        }));
    }, [dispatch, currentEmployeeId]);

    useEffect(() => {
        fetchAttendanceData(now);
    }, [fetchAttendanceData, now]);

    const handleNavigate = (date: number) => {
        if (setScrollToDate) setScrollToDate(date);
        if (setActiveTab) {
            setActiveTab('My Timesheet');
        } else {
            navigate('/employee-dashboard/my-timesheet');
        }
    };

    if (!todayStatsEntry && loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-[#00A3C4]/20 border-t-[#00A3C4] rounded-full animate-spin"></div>
        </div>
    );

    // Initial fallback if loading not started yet
    if (!todayStatsEntry && !loading && records.length === 0) return <div className="p-8 text-center text-gray-500">Initializing entry...</div>;

    return (
        <>
            <header className="bg-[#F4F7FE] md:bg-opacity-50 backdrop-blur-sm sticky top-0 md:relative z-10 px-4 md:px-8 py-5 md:py-5 flex flex-col md:flex-row items-center md:items-center justify-between gap-4 border-b border-gray-100/50 md:border-none">
                <div className="shrink-0">
                    <span className="text-lg md:text-xl font-bold text-[#2B3674]">
                        Welcome, {entity?.firstName || entity?.fullName || currentUser?.aliasLoginName || 'Employee'}
                    </span>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-3">
                    <div className="bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-full shadow-sm border border-gray-100 shrink-0">
                            <span className="text-[12px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                            {displayEntry.fullDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </header>

            <div 
                className="px-4 md:px-8 pb-8 space-y-6 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Status Cards - Preserving Old 3-Column Design with New Logic */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Card 1: Total Full Days (Requested: "make this as total full day") */}
                        <div className="bg-[#E9FBF5] rounded-xl p-5 border-l-4 border-[#01B574] relative overflow-hidden group hover:shadow-md transition-all">
                            <p className="text-gray-500 text-sm font-medium mb-3">Total Full Days</p>
                            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                                <span className={`text-xl font-bold text-[#2B3674]`}>
                                    {currentMonthEntries.filter(e => e.status === 'Full Day' || e.status === 'WFH' || e.status === 'Client Visit').length}
                                </span>
                            </div>
                        </div>

                        {/* Card 2: Total Half Days (Requested: "make this yellow and text as ttal half day") */}
                        <div className={`rounded-xl p-5 border-l-4 transition-all relative overflow-hidden group hover:shadow-md bg-[#FFF9E5] border-[#FFB020]`}>
                            <p className="text-gray-500 text-sm font-medium mb-3">Total Half Days</p>
                            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                                <span className={`text-xl font-bold text-[#2B3674]`}>
                                    {records.filter(r => r.status === 'Half Day').length}
                                </span>
                            </div>
                        </div>

                        {/* Card 3: Total Absent Days (Requested: "total absent days", Red) */}
                        <div className="bg-[#FDF2F2] rounded-xl p-5 border-l-4 border-[#ff4d4d] relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-gray-500 text-sm font-medium">Total Absent Days</p>
                            </div>
                            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                                <span className="text-xl font-bold text-[#2B3674]">
                                     {records.filter(r => r.status === 'Leave').length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-start">
                        <button
                             onClick={() => setActiveTab ? setActiveTab('My Timesheet') : navigate('/employee-dashboard/my-timesheet')}
                            className="px-6 py-2.5 bg-[#01B574] text-white rounded-xl font-bold hover:bg-[#009e65] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 min-w-[200px]"
                        >
                            <Edit size={18} />
                            <span>Update Attendance</span>
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] group-hover:scale-110 transition-transform">
                                <Clock size={24} />
                            </div>
                            <span className="px-3 py-1 bg-[#E6FFFA] text-[#01B574] rounded-full text-[10px] font-bold uppercase tracking-wider">This Week</span>
                        </div>
                        <div>
                            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                                {(() => {
                                     // Calculate entries for THIS WEEK
                                     const d = new Date(now);
                                     const day = d.getDay();
                                     const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday Start
                                     const weekStart = new Date(d.setDate(diff));
                                     weekStart.setHours(0,0,0,0);
                                     
                                     const weekEnd = new Date(weekStart);
                                     weekEnd.setDate(weekStart.getDate() + 6);
                                     weekEnd.setHours(23,59,59,999);

                                     const weekEntries = records.filter(r => {
                                         // Support string (YYYY-MM-DD or ISO) or Date
                                         const rawDate = r.workingDate || (r as any).working_date;
                                         if (!rawDate) return false;
                                         
                                         const rDate = new Date(rawDate);
                                         return rDate >= weekStart && rDate <= weekEnd;
                                     });

                                     // Return Total Hours Sum
                                     const total = weekEntries.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
                                     return total.toFixed(1); // One decimal place for neatness
                                })()}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium">Total Week Hours</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] group-hover:scale-110 transition-transform">
                                <Clock size={24} />
                            </div>
                            <span className="px-3 py-1 bg-[#F4F7FE] text-[#4318FF] rounded-full text-[10px] font-bold uppercase tracking-wider">This Month</span>
                        </div>
                        <div>
                            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                                {(() => {
                                    // Calculate Total Hours for THIS MONTH
                                    // Note: `records` contains data for `calendarDate` month, NOT necessarily current month if user navigated.
                                    // But user asked for "This Month" stats presumably for the viewing month or actual current month?
                                    // Component fetches data based on `calendarDate` in `fetchAttendanceData`.
                                    // If we want Strictly Current Month, we need to fetch it separately or filter safely.
                                    // Current implementation fetches based on `calendarDate`. So lets stick to that for "Monthly Snapshot".
                                    
                                    const workedDays = records.filter(e => (e.totalHours || 0) > 0);
                                    const totalHours = workedDays.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
                                    
                                    return totalHours.toFixed(1);
                                })()}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium">Total Monthly Hours</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => setActiveTab ? setActiveTab('My Timesheet') : navigate('/employee-dashboard/my-timesheet')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FFF9E5] flex items-center justify-center text-[#FFB020] group-hover:scale-110 transition-transform">
                                <AlertTriangle size={24} />
                            </div>
                            <span className="px-3 py-1 bg-[#FFF9E5] text-[#FFB020] rounded-full text-[10px] font-bold uppercase tracking-wider">Action Needed</span>
                        </div>
                        <div>
                            <h4 className="text-4xl font-bold text-[#2B3674] mb-1">
                                {currentMonthEntries.filter(day => day.status === 'Not Updated' && day.fullDate < new Date()).length}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium">Incomplete Days</p>
                        </div>
                    </div>
                </div>


                <Calendar 
                    now={now} 
                    currentDate={calendarDate}
                    entries={currentMonthEntries}
                    onMonthChange={(date) => {
                        setCalendarDate(date);
                        fetchAttendanceData(date);
                    }}
                    onNavigateToDate={handleNavigate} 
                />
                

            </div>
        </>
    );
};

export default TodayAttendance;
