import { useState } from 'react';
import SidebarLayout from './SidebarLayout';
import Calendar from '../EmployeeDashboard/Calendar';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Search,
    Filter,
    Download,
    Eye,
} from 'lucide-react';
import Registration from './EmpRegistration';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('System Dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmpId, setSelectedEmpId] = useState('');

    // Mock employee data
    const employees = [
        { id: 'EMP001', name: 'John Anderson', dept: 'Engineering', login: '09:12 AM', logout: '06:30 PM', hours: '9h 18m', status: 'Present', avatar: 'https://i.pravatar.cc/150?u=EMP001' },
        { id: 'EMP002', name: 'Sarah Mitchell', dept: 'Sales', login: '08:45 AM', logout: '05:15 PM', hours: '8h 30m', status: 'Present', avatar: 'https://i.pravatar.cc/150?u=EMP002' },
        { id: 'EMP003', name: 'Michael Chen', dept: 'Engineering', login: '09:30 AM', logout: 'Not logged out', hours: '--', status: 'Incomplete', avatar: 'https://i.pravatar.cc/150?u=EMP003' },
        { id: 'EMP004', name: 'Emily Roberts', dept: 'Marketing', login: '08:55 AM', logout: '05:45 PM', hours: '8h 50m', status: 'Present', avatar: 'https://i.pravatar.cc/150?u=EMP004' },
        { id: 'EMP005', name: 'David Wilson', dept: 'HR', login: '--', logout: '--', hours: '--', status: 'Absent', avatar: 'https://i.pravatar.cc/150?u=EMP005' },
        { id: 'EMP006', name: 'Lisa Thompson', dept: 'Sales', login: '09:05 AM', logout: '06:00 PM', hours: '8h 55m', status: 'Present', avatar: 'https://i.pravatar.cc/150?u=EMP006' },
        { id: 'EMP007', name: 'James Brown', dept: 'Engineering', login: '08:30 AM', logout: '05:30 PM', hours: '9h 00m', status: 'Present', avatar: 'https://i.pravatar.cc/150?u=EMP007' },
        { id: 'EMP008', name: 'Maria Garcia', dept: 'Marketing', login: '--', logout: '--', hours: '--', status: 'Absent', avatar: 'https://i.pravatar.cc/150?u=EMP008' },
    ];

    // Generate mock entries for the calendar based on employee status
    const getMockEntries = (empId: string) => {
        const emp = employees.find(e => e.id === empId);

        return Array.from({ length: 31 }, (_, i): any => {
            const day = i + 1;
            const isWeekend = [0, 6].includes(new Date(2026, 0, day).getDay());
            const isToday = day === 5; // Fixed today for mock
            const isFuture = day > 5;

            // If an employee is found, show their data. Otherwise, show clean baseline.
            const status = emp
                ? (isWeekend ? 'Weekend' : (emp.status === 'Present' || day % 4 !== 0 ? 'Present' : 'Absent'))
                : (isWeekend ? 'Weekend' : 'Future');

            return {
                date: day,
                status,
                loginTime: emp && emp.login !== '--' ? emp.login : null,
                logoutTime: emp && emp.logout !== '--' && emp.logout !== 'Not logged out' ? emp.logout : null,
                isWeekend,
                isToday,
                isFuture: emp ? isFuture : true // Treat as future if no emp to hide details
            };
        });
    };

    const renderSummaryCards = () => {
        const totalEmployees = employees.length;
        const presentCount = employees.filter(e => e.status === 'Present').length;
        const absentCount = employees.filter(e => e.status === 'Absent').length;
        const presentPercentage = ((presentCount / totalEmployees) * 100).toFixed(1);
        const absentPercentage = ((absentCount / totalEmployees) * 100).toFixed(1);

        // Calculate average hours
        const workingHours = employees
            .filter(e => e.status === 'Present' && e.hours !== '--')
            .map(e => {
                const parts = e.hours.split(' ');
                const h = parseInt(parts[0]) || 0;
                const m = parseInt(parts[1]) || 0;
                return h + (m / 60);
            });
        const avgHours = workingHours.length > 0
            ? (workingHours.reduce((a, b) => a + b, 0) / workingHours.length).toFixed(1)
            : '0.0';

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Total Employees */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] mb-4 group-hover:scale-110 transition-transform">
                        <Users size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">{totalEmployees}</h3>
                        <p className="text-sm font-medium text-[#A3AED0]">Total Employees</p>
                    </div>
                </div>

                {/* Present Today */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
                    <div className="w-12 h-12 rounded-2xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] mb-4 group-hover:scale-110 transition-transform">
                        <UserCheck size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">{presentCount}</h3>
                        <p className="text-sm font-medium text-[#A3AED0] mb-1">Present Today</p>
                        <span className="text-xs font-bold text-[#01B574]">{presentPercentage}%</span>
                    </div>
                </div>

                {/* Absent Today */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] flex items-center justify-center text-[#EE5D50] mb-4 group-hover:scale-110 transition-transform">
                        <UserX size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">{absentCount}</h3>
                        <p className="text-sm font-medium text-[#A3AED0] mb-1">Absent Today</p>
                        <span className="text-xs font-bold text-[#EE5D50]">{absentPercentage}%</span>
                    </div>
                </div>

                {/* Avg Working Hours */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F7FA] flex items-center justify-center text-[#00A3C4] mb-4 group-hover:scale-110 transition-transform">
                        <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[32px] font-bold text-[#1B254B] leading-tight">{avgHours}</h3>
                        <p className="text-sm font-medium text-[#A3AED0] mb-1">Avg Working Hours</p>
                        <span className="text-xs font-bold text-[#00A3C4]">Today</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderAttendanceOverview = () => (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <h2 className="text-xl font-bold text-[#1B254B]">Attendance Overview</h2>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by ID or Name..."
                            className="pl-10 pr-4 py-2 bg-[#F4F7FE] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#4318FF] transition-all w-56"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-[#F4F7FE] px-4 py-2 rounded-xl text-sm font-medium text-[#1B254B] cursor-pointer whitespace-nowrap">
                        <Filter size={16} className="text-[#A3AED0]" />
                        <span>All Departments</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#00A3C4] text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-100/50 hover:bg-[#0093b1] transition-all">
                    <Eye size={16} />
                    View All Attendance
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 border border-[#00A3C4] text-[#00A3C4] rounded-xl text-sm font-bold hover:bg-[#E6FFFA] transition-all">
                    <Users size={16} />
                    View Employee List
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-[#1B254B] rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                    <Download size={16} />
                    Download Report
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs font-bold text-[#A3AED0] uppercase tracking-wider text-center border-b border-gray-50">
                            <th className="pb-4 text-left">Employee ID</th>
                            <th className="pb-4 text-left">Employee Name</th>
                            <th className="pb-4">Department</th>
                            <th className="pb-4">Login Time</th>
                            <th className="pb-4">Logout Time</th>
                            <th className="pb-4">Total Hours</th>
                            <th className="pb-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {employees.map((emp) => (
                            <tr
                                key={emp.id}
                                onClick={() => setSelectedEmpId(emp.id)}
                                className={`group transition-all cursor-pointer ${selectedEmpId === emp.id ? 'bg-[#F4F7FE]' : 'hover:bg-[#F4F7FE]/30'}`}
                            >
                                <td className="py-4 text-sm font-bold text-[#1B254B] border-l-4 border-transparent group-hover:border-[#4318FF] transition-all">
                                    <div className="pl-4">{emp.id}</div>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={emp.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                        <span className="text-sm font-bold text-[#2B3674]">{emp.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 text-sm text-[#A3AED0] text-center">{emp.dept}</td>
                                <td className="py-4 text-sm font-medium text-[#2B3674] text-center font-mono">{emp.login}</td>
                                <td className="py-4 text-center">
                                    {emp.logout === 'Not logged out' ? (
                                        <span className="text-xs font-bold text-[#FFB547] leading-tight flex flex-col items-center">
                                            Not logged <span>out</span>
                                        </span>
                                    ) : (
                                        <span className="text-sm font-medium text-[#2B3674] font-mono">{emp.logout}</span>
                                    )}
                                </td>
                                <td className="py-4 text-sm font-bold text-[#1B254B] text-center">{emp.hours}</td>
                                <td className="py-4 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${emp.status === 'Present' ? 'bg-[#E6FFFA] text-[#01B574]' :
                                            emp.status === 'Incomplete' ? 'bg-[#FFF9E5] text-[#FFB547]' :
                                                'bg-[#FFF5F5] text-[#EE5D50]'}
                                    `}>
                                        {emp.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderContent = () => {
        if (activeTab === 'User & Role Management') {
            return (
                <div className="flex-1 overflow-auto">
                    <Registration />
                </div>
            );
        }

        return (
            <>
                {/* Sticky Header */}
                <header className="bg-[#F4F7FE] md:bg-opacity-50 backdrop-blur-sm sticky top-0 z-20 px-4 py-4 flex items-center justify-between border-b border-gray-100/50">
                    <h2 className="text-2xl font-bold text-[#2B3674]">Super Admin</h2>

                    <div className="bg-white px-5 py-1.5 rounded-full shadow-sm border border-gray-100">
                        <span className="text-sm font-medium text-gray-500">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, ' /')}
                        </span>
                    </div>
                </header>

                <div className="p-4 space-y-4">
                    {renderSummaryCards()}
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                        {renderAttendanceOverview()}
                        <div className="w-[260px] sticky top-24">
                            <Calendar entries={getMockEntries(selectedEmpId)} now={new Date(2026, 0, 5)} variant="small" />
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#F4F7FE]">
            <SidebarLayout activeTab={activeTab} onTabChange={setActiveTab}>
                {renderContent()}
            </SidebarLayout>
        </div >
    );
};

export default AdminDashboard;
