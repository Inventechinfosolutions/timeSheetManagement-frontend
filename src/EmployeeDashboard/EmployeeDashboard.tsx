import { useState, useEffect } from 'react';
import Header from '../components/Header';
import SidebarLayout from './SidebarLayout';
import MyTimesheet from './MyTimesheet';
import FullTimesheet from './FullTimesheet';
import MyProfile from './MyProfile';
import TodayAttendance from './TodayAttendance';
import ChangePassword from './ChangePassword';

import { TimesheetEntry } from '../types';

const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);

    // Calendar Widget State
    const [calendarEntries, setCalendarEntries] = useState<TimesheetEntry[]>([]);
    const [calendarDate, setCalendarDate] = useState(new Date());

    // Full Timesheet View State
    const [fullTimesheetEntries, setFullTimesheetEntries] = useState<TimesheetEntry[]>([]);
    const [fullTimesheetDate, setFullTimesheetDate] = useState(new Date());

    const [now] = useState(new Date());
    const [scrollToDate, setScrollToDate] = useState<number | null>(null);

    // Helpers for Calendar Widget Navigation
    // We pass setCalendarDate directly to TodayAttendance

    // Helper to generate a single entry
    const generateEntryForDate = (date: Date, now: Date) => {
        const i = date.getDate();
        const isToday = i === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

        // Future calculation: STRICTLY based on date comparison
        const checkNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const isFuture = checkDate > checkNow;

        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        let loginTime = '';
        let logoutTime = '';
        let status: TimesheetEntry['status'] = 'Absent';
        let attendanceType: TimesheetEntry['attendanceType'] = 'login';

        // Fill past weekdays
        if (!isFuture && !isWeekend && i !== 1) {
            if (isToday) {
                // Today defaults
                loginTime = ''; // Start empty
                attendanceType = null;
                status = 'Present';
            } else {
                // Past
                loginTime = '09:00';
                logoutTime = '18:00';
                status = 'Present';
                attendanceType = 'logout';
            }
        }

        // Explicit defaults for Today
        if (isToday && !isWeekend) {
            loginTime = '';
            attendanceType = null;
            status = 'Present';
        }

        return {
            date: i,
            fullDate: date,
            dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
            formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isToday,
            isWeekend,
            isFuture,
            attendanceType,
            loginTime,
            logoutTime,
            status,
            isEditing: false,
            isSaved: false
        } as TimesheetEntry;
    };

    // 1. Generate Main Entries (Always Current Month/Now) - For MyTimesheet & Stats
    useEffect(() => {
        const generateCurrentMonthData = () => {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const data: TimesheetEntry[] = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(now.getFullYear(), now.getMonth(), i);
                data.push(generateEntryForDate(date, now));
            }
            return data;
        };
        setEntries(generateCurrentMonthData());
    }, [now]); // Only runs on mount/now change

    // 2. Generate Calendar Entries (Dependent on calendarDate) - For Calendar Widget
    useEffect(() => {
        const generateCalendarData = () => {
            const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
            const data: TimesheetEntry[] = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i);
                data.push(generateEntryForDate(date, now));
            }
            return data;
        };
        setCalendarEntries(generateCalendarData());
    }, [calendarDate, now]);

    // 3. Generate Full Timesheet Entries (Dependent on fullTimesheetDate)
    useEffect(() => {
        const generateFullTimesheetData = () => {
            const daysInMonth = new Date(fullTimesheetDate.getFullYear(), fullTimesheetDate.getMonth() + 1, 0).getDate();
            const data: TimesheetEntry[] = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(fullTimesheetDate.getFullYear(), fullTimesheetDate.getMonth(), i);
                data.push(generateEntryForDate(date, now));
            }
            return data;
        };
        setFullTimesheetEntries(generateFullTimesheetData());
    }, [fullTimesheetDate, now]);


    const calculateTotal = (login: string, logout: string) => {
        if (!login || !logout) return '--:--';
        const [h1, m1] = login.split(':').map(Number);
        const [h2, m2] = logout.split(':').map(Number);

        let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diffMinutes < 0) return '--:--';

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const handleUpdateEntry = (index: number, field: keyof TimesheetEntry, value: any) => {
        // Only updates main entries (MyTimesheet)
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const handleSave = (index: number) => {
        const newEntries = [...entries];
        const entry = newEntries[index];

        if (!entry.isSaved) {
            entry.isSaved = true;
            entry.isEditing = false;
        } else {
            entry.isEditing = !entry.isEditing;
        }
        setEntries(newEntries);
    };

    // Ensure todayEntry is always valid
    const todayEntry = entries.find(e => e.isToday) || generateEntryForDate(now, now);

    const handleNavigateToDate = (date: number) => {
        setScrollToDate(date);
        setActiveTab('My Timesheet');
    };

    const renderContent = () => {
        if (activeTab === 'My Timesheet') {
            return (
                <MyTimesheet
                    entries={entries} // Always current month
                    handleUpdateEntry={handleUpdateEntry}
                    handleSave={handleSave}
                    calculateTotal={calculateTotal}
                    now={now}
                    scrollToDate={scrollToDate}
                    setScrollToDate={setScrollToDate}
                />
            );
        }

        if (activeTab === 'Timesheet View') {
            return (
                <FullTimesheet
                    entries={fullTimesheetEntries}
                    calculateTotal={calculateTotal}
                    displayDate={fullTimesheetDate}
                    onPrevMonth={() => setFullTimesheetDate(new Date(fullTimesheetDate.getFullYear(), fullTimesheetDate.getMonth() - 1, 1))}
                    onNextMonth={() => setFullTimesheetDate(new Date(fullTimesheetDate.getFullYear(), fullTimesheetDate.getMonth() + 1, 1))}
                />
            );
        }

        if (activeTab === 'My Profile') {
            return <MyProfile />;
        }

        if (activeTab === 'Change Password') {
            return <ChangePassword />;
        }

        // Pass todayEntry (Actual Today) and logic to TodayAttendance
        return (
            <TodayAttendance
                setActiveTab={setActiveTab}
                todayEntry={todayEntry}
                calculateTotal={calculateTotal}
                entries={entries} // Stats use Current Month
                calendarEntries={calendarEntries} // Widget uses Calendar Month
                now={now}
                onNavigateToDate={handleNavigateToDate}
                displayDate={calendarDate}
                onMonthChange={setCalendarDate}
            />
        );
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <SidebarLayout activeTab={activeTab} onTabChange={setActiveTab}>
                {renderContent()}
            </SidebarLayout>
        </div >
    );
};

export default EmployeeDashboard;
