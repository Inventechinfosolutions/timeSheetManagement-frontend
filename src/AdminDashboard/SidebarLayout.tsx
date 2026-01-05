import { useState } from 'react';
import {
    Settings,
    Users,
    Lock,
    LogOut,
    AlarmClock,
    Unlock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarLayoutProps {
    children: React.ReactNode;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onLogout?: () => void;
}

const SidebarLayout = ({ children, activeTab = 'Dashboard', onTabChange, onLogout }: SidebarLayoutProps) => {
    // State management
    const [isHovered, setIsHovered] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const navigate = useNavigate();

    // Sidebar opens if it's either hovered OR locked
    const isOpen = isHovered || isLocked;

    const sidebarItems = [
        { name: 'System Dashboard', icon: Settings },
        { name: 'User & Role Management', icon: Users },
    ];

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            navigate('/landing');
        }
    };

    return (
        <div className="flex flex-1 bg-[#F4F7FE] font-sans text-[#2B3674] overflow-hidden relative">

            {/* Spacer to prevent layout shift when locked. 
                When unlocked, it stays small (w-20). When locked, it takes full space (w-72). 
            */}
            <div className={`shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-60' : 'w-20'} hidden md:block`}></div>

            <aside
                className={`fixed md:absolute top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100 flex flex-col shrink-0 transition-all duration-300 ease-in-out shadow-2xl z-30
                    ${isOpen ? 'w-60' : 'w-20'}
                `}
                onMouseEnter={() => !isLocked && setIsHovered(true)}
                onMouseLeave={() => !isLocked && setIsHovered(false)}
            >
                {/* Branding & Lock Toggle */}
                <div className="h-16 flex items-center justify-between px-0 relative">
                    {/* Logo / Title Area */}
                    {/* If closed, center logo. If open, left align with text. */}
                    <div className={`flex items-center gap-2 transition-all duration-300 overflow-hidden h-full
                        ${isOpen ? 'w-full opacity-100 pl-5' : 'w-full justify-center opacity-100 px-0'}
                    `}>
                        <div className="shrink-0 transition-transform duration-300 hover:scale-110">
                            <AlarmClock className="w-8 h-8 text-[#00A3C4]" />
                        </div>

                        <span className={`text-xl font-bold text-[#2B3674] tracking-tight whitespace-nowrap transition-all duration-300 origin-left
                            ${isOpen ? 'opacity-100 scale-100 ml-0' : 'opacity-0 scale-90 w-0 ml-[-100px] overflow-hidden absolute'}
                        `}>
                            Timesheet Pro
                        </span>
                    </div>

                    {/* Lock/Unlock Button - Visible only when sidebar is "Open" (expanded via hover or lock) */}
                    <button
                        onClick={() => setIsLocked(!isLocked)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-[#00A3C4] hover:bg-blue-50 transition-all duration-500
                            ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90 pointer-events-none'}
                        `}
                        title={isLocked ? "Unlock Sidebar" : "Pin Sidebar Open"}
                    >
                        {isLocked ? <Lock size={18} className="text-[#00A3C4]" /> : <Unlock size={18} />}
                    </button>
                </div>

                {/* Divider */}
                <div className="px-4 mb-2">
                    <div className={`h-px bg-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-500 ${isOpen ? 'w-full' : 'w-8 mx-auto'}`}></div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 space-y-1 mt-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {sidebarItems.map((item) => {
                        const isActive = activeTab === item.name;
                        return (
                            <div key={item.name} className="relative group">
                                <button
                                    onClick={() => onTabChange?.(item.name)}
                                    className={`w-full flex items-center gap-4 p-2 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group
                                        ${isActive
                                            ? 'bg-[#E6FFFA] text-[#00A3C4]'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        }
                                        ${!isOpen && 'justify-center'}
                                    `}
                                >
                                    {/* Active Indicator Line (Left) */}
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00A3C4] rounded-r-md transition-all duration-300
                                        ${isActive ? 'opacity-100' : 'opacity-0'}
                                    `}></div>

                                    {/* Icon */}
                                    <div className="shrink-0 relative z-10 transition-transform duration-300">
                                        <item.icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-[#00A3C4]' : 'group-hover:text-[#2B3674]'}`} />
                                    </div>

                                    {/* Label */}
                                    <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 relative z-10
                                        ${isOpen ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 overflow-hidden absolute'}
                                        ${isActive ? 'font-semibold' : ''}
                                    `}>
                                        {item.name}
                                    </span>
                                </button>

                                {/* Tooltip for collapsed state */}
                                {!isOpen && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[#2B3674] text-white text-xs font-bold rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 translate-x-2 group-hover:translate-x-0">
                                        {item.name}
                                        {/* Small arrow */}
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-td border-r-4 border-r-[#2B3674] border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-3 mt-auto shrink-0 mb-2 border-t border-gray-100/50 pt-2">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-4 p-2 rounded-xl cursor-pointer transition-all duration-300 group hover:bg-red-50 text-red-500
                            ${!isOpen && 'justify-center'}
                        `}
                    >
                        <div className="shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
                            <LogOut className="w-6 h-6" />
                        </div>
                        <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300
                            ${isOpen ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 absolute'}
                        `}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto overflow-x-hidden h-full [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {children}
            </main>
        </div>
    );
};

export default SidebarLayout;
