import { useState } from 'react';
import Header from '../components/Header';
import SidebarLayout from './SidebarLayout';
import MyTimesheet from './MyTimesheet';
import FullTimesheet from './FullTimesheet';
import MyProfile from './MyProfile';
import TodayAttendance from './TodayAttendance';
import ChangePassword from './ChangePassword';

const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');

    const renderContent = () => {
        if (activeTab === 'My Timesheet') {
            return (
                <MyTimesheet />
            );
        }

        if (activeTab === 'Timesheet View') {
            return (
                <FullTimesheet />
            );
        }

        if (activeTab === 'My Profile') return <MyProfile />;
        if (activeTab === 'Change Password') return <ChangePassword />;

        // Dashboard View (TodayAttendance)
        return (
            <TodayAttendance />
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
