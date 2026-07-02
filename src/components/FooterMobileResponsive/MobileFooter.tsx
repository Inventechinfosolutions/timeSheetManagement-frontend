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
}

const MobileBottomNav = ({
  activeTab,
  onTabChange,
}: MobileBottomNavProps) => {
  const items = [
    {
      name: "Dashboard",
      icon: LayoutGrid,
      label: "Dashboard",
    },
    {
      name: "My Timesheet",
      icon: Calendar,
      label: "Timesheet",
    },
    {
      name: "Timesheet History",
      icon: Eye,
      label: "History",
    },
    {
      name: "Request Management",
      icon: ClipboardList,
      label: "Requests",
    },
    {
      name: "Account Settings",
      icon: User,
      label: "Profile",
    },
    {
      name: "About",
      icon: Info,
      label: "About",
    },
  ];

  return (
    /* FIXED: Changed md:hidden to min-[1400px]:hidden to keep it on all device views */
    <div className="min-[1400px]:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {/* Scaling heights for larger screens like iPad Pro / Nest Hub */}
      <div className="grid grid-cols-6 h-16 sm:h-18 lg:h-20">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <button
              key={item.name}
              onClick={() => onTabChange?.(item.name)}
              className="flex flex-col items-center justify-center gap-1 p-1"
            >
              {/* Dynamically scaling icon size for different phone/tablet form factors */}
              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 transition-colors ${
                  isActive ? "text-[#4318FF]" : "text-[#A3AED0]"
                }`}
              />

              {/* Dynamically scaling label text sizes */}
              <span
                className={`text-[9px] sm:text-[11px] lg:text-xs transition-all ${
                  isActive
                    ? "text-[#4318FF] font-semibold"
                    : "text-[#A3AED0]"
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