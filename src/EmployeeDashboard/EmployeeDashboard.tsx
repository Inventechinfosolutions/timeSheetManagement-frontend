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
    const [displayDate, setDisplayDate] = useState(new Date());
    const [now] = useState(new Date());
    const [scrollToDate, setScrollToDate] = useState<number | null>(null);

    const handlePrevMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
    };

    useEffect(() => {
        // Generate Mock Data using the logic from MyTimesheet
        const generateMonthData = () => {
            const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
            const data: TimesheetEntry[] = [];

            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(displayDate.getFullYear(), displayDate.getMonth(), i);
                const isToday = i === now.getDate() && displayDate.getMonth() === now.getMonth() && displayDate.getFullYear() === now.getFullYear();
                const isFuture = (displayDate.getFullYear() > now.getFullYear()) ||
                    (displayDate.getFullYear() === now.getFullYear() && displayDate.getMonth() > now.getMonth()) ||
                    (displayDate.getFullYear() === now.getFullYear() && displayDate.getMonth() === now.getMonth() && i > now.getDate());

                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                let loginTime = '';
                let logoutTime = '';
                let status: TimesheetEntry['status'] = 'Absent';
                let attendanceType: TimesheetEntry['attendanceType'] = 'login';

                // Fill past weekdays
                if (!isFuture && !isWeekend && i !== 1) {
                    if (i === now.getDate()) {
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

                data.push({
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
                });
            }
            return data;
        };

        setEntries(generateMonthData());
    }, [displayDate, now]);

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

    const todayEntry = entries.find(e => e.isToday);

    const handleNavigateToDate = (date: number) => {
        setScrollToDate(date);
        setActiveTab('My Timesheet');
    };

    const renderContent = () => {
        if (activeTab === 'My Timesheet') {
            return (
                <MyTimesheet
                    entries={entries}
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
                    entries={entries}
                    calculateTotal={calculateTotal}
                    displayDate={displayDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                />
            );
        }

        if (activeTab === 'My Profile') {
            return <MyProfile />;
        }

        if (activeTab === 'Change Password') {
            return <ChangePassword />;
        }

        // Pass todayEntry and logic to TodayAttendance
        return (
            <TodayAttendance
                setActiveTab={setActiveTab}
                todayEntry={todayEntry}
                calculateTotal={calculateTotal}
                entries={entries}
                now={now}
                onNavigateToDate={handleNavigateToDate}
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
