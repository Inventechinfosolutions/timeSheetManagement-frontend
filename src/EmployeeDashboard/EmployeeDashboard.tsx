import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../components/Header';
import SidebarLayout from './SidebarLayout';
import MyTimesheet from './MyTimesheet';
import FullTimesheet from './FullTimesheet';
import MyProfile from './MyProfile';
import TodayAttendance from './TodayAttendance';
import ChangePassword from './ChangePassword';

import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchMonthlyAttendance, submitLogin, submitLogout, updateAttendanceRecord, AttendanceStatus } from '../reducers/employeeAttendance.reducer';
import { generateMonthlyEntries, mapStatus, calculateTotal, formatTo12H } from '../utils/attendanceUtils';
import { TimesheetEntry } from '../types';

const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [scrollToDate, setScrollToDate] = useState<number | null>(null);
    const [now] = useState(new Date());

    // Redux
    const dispatch = useAppDispatch();
    const { records } = useAppSelector(state => state.attendance);
    const { entity } = useAppSelector(state => state.employeeDetails);
    const currentEmployeeId = entity?.employeeId || 'EMP001';

    // View States
    const [fullTimesheetDate, setFullTimesheetDate] = useState(new Date());
    const [localEntries, setLocalEntries] = useState<TimesheetEntry[]>([]);

    // Base records mapping for current month (used by My Timesheet)
    const baseEntries = useMemo(() => {
        const entries = generateMonthlyEntries(now, now, records);
        return entries.map(e => {
            const loginClean = (e.loginTime?.includes('NaN') || e.loginTime === '00:00:00') ? '' : (e.loginTime || '');
            const logoutClean = (e.logoutTime?.includes('NaN') || e.logoutTime === '00:00:00') ? '' : (e.logoutTime || '');
            return {
                ...e,
                loginTime: loginClean,
                logoutTime: logoutClean,
                isSaved: e.isSaved && !!loginClean,
                isSavedLogout: e.isSavedLogout && !!logoutClean
            };
        });
    }, [now, records]);

    useEffect(() => {
        setLocalEntries(baseEntries);
    }, [baseEntries]);

    // Data Fetching
    const fetchAttendance = useCallback((date: Date) => {
        dispatch(fetchMonthlyAttendance({ 
            employeeId: currentEmployeeId, 
            month: (date.getMonth() + 1).toString(), 
            year: date.getFullYear().toString() 
        }));
    }, [dispatch, currentEmployeeId]);

    useEffect(() => {
        fetchAttendance(now);
    }, [fetchAttendance, now]);

    // Handlers for MyTimesheet tab
    const handleUpdateEntry = (index: number, field: keyof TimesheetEntry, value: any) => {
        const updated = [...localEntries];
        updated[index] = { ...updated[index], [field]: value };
        setLocalEntries(updated);
    };

    const handleSave = async (index: number) => {
        const entry = localEntries[index];
        const { loginTime, logoutTime, location } = entry;
        const d = entry.fullDate;
        const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

        const formattedLogin = formatTo12H(loginTime);
        const formattedLogout = formatTo12H(logoutTime);

        const locationMap: Record<string, string> = {
            'Office': 'Office',
            'WFH': 'Work from Home',
            'Client Visit': 'Client Place'
        };
        const backendLocation = locationMap[location || 'Office'] || 'Office';

        try {
            const existingRecord = records.find(r => {
                const rDate = typeof r.workingDate === 'string' ? r.workingDate.split('T')[0] : (r.workingDate as Date).toISOString().split('T')[0];
                return rDate === workingDate;
            });

            let recordId = existingRecord?.id;

            if (formattedLogout && logoutTime && logoutTime !== '--:--') {
                const result = await dispatch(submitLogout({ 
                    employeeId: currentEmployeeId, 
                    workingDate, 
                    logoutTime: formattedLogout 
                })).unwrap();
                if (result?.id) recordId = result.id;
            } 
            else if (formattedLogin && !existingRecord) {
                const result = await dispatch(submitLogin({ 
                    employeeId: currentEmployeeId, 
                    workingDate, 
                    loginTime: formattedLogin 
                })).unwrap();
                if (result?.id) recordId = result.id;
            }

            if (recordId) {
                const calculatedStatus = mapStatus(
                    existingRecord?.status as AttendanceStatus | undefined,
                    formattedLogin,
                    formattedLogout,
                    entry.isFuture,
                    entry.isToday,
                    entry.isWeekend
                );

                await dispatch(updateAttendanceRecord({
                    id: recordId,
                    data: {
                        location: backendLocation as any,
                        status: calculatedStatus as any,
                        ...(formattedLogin && { loginTime: formattedLogin }),
                        ...(formattedLogout && logoutTime && logoutTime !== '--:--' && { logoutTime: formattedLogout })
                    }
                })).unwrap();
            }

            fetchAttendance(now);
        } catch (error: any) {
            console.error("Failed to save attendance:", error);
        }
    };

    const renderContent = () => {
        if (activeTab === 'My Timesheet') {
            return (
                <MyTimesheet
                    entries={localEntries}
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
            // Re-fetch or at least generate entries for the selected month
            const fullEntries = generateMonthlyEntries(fullTimesheetDate, now, records);
            return (
                <FullTimesheet
                    entries={fullEntries}
                    calculateTotal={calculateTotal}
                    displayDate={fullTimesheetDate}
                    onPrevMonth={() => {
                        const newDate = new Date(fullTimesheetDate.getFullYear(), fullTimesheetDate.getMonth() - 1, 1);
                        setFullTimesheetDate(newDate);
                        fetchAttendance(newDate);
                    }}
                    onNextMonth={() => {
                        const newDate = new Date(fullTimesheetDate.getFullYear(), fullTimesheetDate.getMonth() + 1, 1);
                        setFullTimesheetDate(newDate);
                        fetchAttendance(newDate);
                    }}
                    scrollToDate={scrollToDate}
                    setScrollToDate={setScrollToDate}
                />
            );
        }

        if (activeTab === 'My Profile') return <MyProfile />;
        if (activeTab === 'Change Password') return <ChangePassword />;

        // Dashboard View (TodayAttendance)
        return (
            <TodayAttendance
                setActiveTab={setActiveTab}
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
