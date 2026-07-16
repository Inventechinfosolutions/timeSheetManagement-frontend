import {
  LayoutGrid,
  Calendar,
  Eye,
  ClipboardList,
  User,
  Info,
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  isSidebarOpen?: boolean;
}

const MobileBottomNav = ({
  activeTab,
  onTabChange,
  isSidebarOpen = false,
}: MobileBottomNavProps) => {
  const items = [
    { name: "Dashboard", icon: LayoutGrid, label: "Dashboard" },
    { name: "My Timesheet", icon: Calendar, label: "Timesheet" },
    { name: "Timesheet History", icon: Eye, label: "History" },
    { name: "Request Management", icon: ClipboardList, label: "Requests" },
    { name: "Account Settings", icon: User, label: "Profile" },
    { name: "About", icon: Info, label: "About" },
  ];

  return (
    /* FIXED: Changed to xl:hidden (hides on screens >= 1280px, e.g., laptops/desktops)
      Added pb-safe to handle iOS notch/home indicator spacing gracefully.
    */
    <div
      className={`xl:hidden fixed bottom-0 left-0 right-0 z-[9999]
        bg-white border-t border-gray-200 pb-safe
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
        transition-all duration-300
        ${isSidebarOpen
          ? "translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
        }`}
    >
      {/* Grid Layout adjustments:
        - Clean grid layout that balances across small phones up to large tablets (iPad Pro).
      */}
      <div className="grid grid-cols-6 h-16 sm:h-20 lg:h-22 items-center px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <button
              key={item.name}
              onClick={() => onTabChange?.(item.name)}
              className="flex flex-col items-center justify-center gap-1 p-1 h-full rounded-xl active:bg-gray-50 transition-colors"
            >
              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 transition-colors ${isActive ? "text-[#4318FF]" : "text-[#A3AED0]"
                  }`}
              />

              <span
                className={`text-[9px] sm:text-xs lg:text-sm tracking-tight transition-all truncate w-full text-center ${isActive ? "text-[#4318FF]" : "text-[#A3AED0]"
                  }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;