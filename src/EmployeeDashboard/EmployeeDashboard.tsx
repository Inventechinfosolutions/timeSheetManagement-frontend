import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SidebarLayout from './SidebarLayout';
import MyTimesheet from './MyTimesheet';
import Calendar from './CalendarView'; // Replaced FullTimesheet
import MyProfile from './MyProfile';
import TodayAttendance from './TodayAttendance';
//import ChangePassword from './ChangePassword';

import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchMonthlyAttendance } from '../reducers/employeeAttendance.reducer';
import { reset as resetDetails } from '../reducers/employeeDetails.reducer';
import { resetAttendanceState } from '../reducers/employeeAttendance.reducer';

const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [scrollToDate, setScrollToDate] = useState<number | null>(null);
    const [today] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const navigate = useNavigate();

    // Redux
    const dispatch = useAppDispatch();
    const { records } = useAppSelector(state => state.attendance);
    const { entity } = useAppSelector(state => state.employeeDetails);
    const currentEmployeeId = entity?.employeeId;

    // View States
    const [fullTimesheetDate, setFullTimesheetDate] = useState(new Date());





    // Auth Guard: Redirect if no entity/employeeId
    useEffect(() => {
        if (!entity?.employeeId) {
            navigate('/landing');
        }
    }, [entity, navigate]);

    // Data Fetching
    const fetchAttendance = useCallback((date: Date) => {
        dispatch(fetchMonthlyAttendance({ 
            employeeId: currentEmployeeId, 
            month: (date.getMonth() + 1).toString().padStart(2, '0'),
            year: date.getFullYear().toString() 
        }));
    }, [dispatch, currentEmployeeId]);

    useEffect(() => {
        fetchAttendance(viewDate);
    }, [fetchAttendance, viewDate]);

    // Sync View Date when scrolling to a specific date (e.g. from Dashboard Calendar)
    useEffect(() => {
        if (scrollToDate) {
            setViewDate(new Date(scrollToDate));
        }
    }, [scrollToDate]);

    // Handlers for MyTimesheet tab
    const handleDateNavigator = useCallback((timestamp: number) => {
        setScrollToDate(timestamp);
        setViewDate(new Date(timestamp));
        setActiveTab('My Timesheet');
    }, []);

    const renderContent = () => {
        if (activeTab === 'My Timesheet') {
            return (
                <MyTimesheet
                    now={viewDate}
                    selectedDateId={scrollToDate}
                />
            );
        }

        if (activeTab === 'Timesheet View') {
            return (
                <div className="px-4 md:px-8 pb-0 pt-2 md:pt-4 h-full">
                     <Calendar 
                        now={today}
                        currentDate={fullTimesheetDate}
                        onMonthChange={(date) => {
                            setFullTimesheetDate(date);
                            fetchAttendance(date);
                        }}
                        onNavigateToDate={(day) => {
                            const targetDate = new Date(fullTimesheetDate.getFullYear(), fullTimesheetDate.getMonth(), day);
                            handleDateNavigator(targetDate.getTime());
                        }}
                        variant="large"
                    />
                </div>
            );
        }

        if (activeTab === 'My Profile') {
            return <MyProfile />;
        }

        // Dashboard View (TodayAttendance)
        return (
            <TodayAttendance
                setActiveTab={setActiveTab}
                setScrollToDate={setScrollToDate}
                onNavigate={(timestamp) => handleDateNavigator(timestamp)}
            />
        );
    };

    const handleLogout = () => {
        dispatch(resetDetails());
        dispatch(resetAttendanceState());
        navigate('/landing');
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <div className="flex-1 overflow-hidden">
                <SidebarLayout 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    onLogout={handleLogout}
                >
                    {renderContent()}
                </SidebarLayout>
            </div>
        </div >
    );
};

export default EmployeeDashboard;
