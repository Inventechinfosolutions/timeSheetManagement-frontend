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

    useEffect(() => {
        console.log('EmployeeDashboard: Records loaded:', records.length, 'Last Date:', records[records.length-1]?.workingDate);
    }, [records]);

    // Sync View Date when scrolling to a specific date (e.g. from Dashboard Calendar)
    useEffect(() => {
        if (scrollToDate) {
            setViewDate(new Date(scrollToDate));
        }
    }, [scrollToDate]);

    // Handlers for MyTimesheet tab


    const renderContent = () => {
        if (activeTab === 'My Timesheet') {
            return (
                <MyTimesheet
                    now={viewDate}
                />
            );
        }

        if (activeTab === 'Timesheet View') {
            return (
                <div className="p-4 md:p-8 h-full overflow-y-auto">
                     <Calendar 
                        now={today}
                        currentDate={fullTimesheetDate}
                        onMonthChange={(date) => {
                            setFullTimesheetDate(date);
                            fetchAttendance(date);
                        }}
                        variant="large"
                    />
                </div>
            );
        }

        if (activeTab === 'My Profile') return <MyProfile />;

        // Dashboard View (TodayAttendance)
        return (
            <TodayAttendance
                setActiveTab={setActiveTab}
                setScrollToDate={setScrollToDate}
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
            <SidebarLayout 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                onLogout={handleLogout}
            >
                {renderContent()}
            </SidebarLayout>
        </div >
    );
};

export default EmployeeDashboard;
