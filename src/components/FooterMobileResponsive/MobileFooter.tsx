import {
  LayoutGrid,
  Calendar,
  Eye,
  ClipboardList,
  StickyNote,
  Award,
  ChevronDown,
  ChevronLeft,
  Briefcase,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

// import { Label } from "recharts";

export interface MobileNavItem {
  name: string;
  icon: any;
  label: string;
  fullLabel?: string;
}

export interface MobileNavGroup {
  title: string;
  items: MobileNavItem[];
}

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  isSidebarOpen?: boolean;
  items?: MobileNavItem[];
  groups?: MobileNavGroup[];
}

const defaultEmployeeItems: MobileNavItem[] = [
  { name: "Dashboard", icon: LayoutGrid, label: "Dashboard" },
  { name: "My Timesheet", icon: Calendar, label: "Timesheet" },
  { name: "Timesheet History", icon: Eye, label: "History" },
  {
    name: "Request Management",
    icon: ClipboardList,
    label: "Requests",
  },
  // { name: "Appraisal", icon: Award, label: "Appraisal" },
  {
    name: "Employee Notes",
    icon: StickyNote,
    label: "Notes",
    fullLabel: "Employee Notes",
  },
];

const MobileBottomNav = ({
  activeTab,
  onTabChange,
  isSidebarOpen = false,
  items,
  groups,
}: MobileBottomNavProps) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Active selected group: "My Workspace" | "Team Management" | null
  // When null, shows the 2 category dropdown buttons in the single line footer bar.
  // When set, shows [‹ Menu] + 5 items of that category in that exact same single line.
  const [activeGroupTitle, setActiveGroupTitle] = useState<string | null>(() => {
    if (groups && groups.length > 0) {
      const found = groups.find((g) => g.items.some((i) => i.name === activeTab));
      return found ? found.title : groups[0].title;
    }
    return null;
  });

  // Keep group synced if activeTab changes externally
  useEffect(() => {
    if (groups && groups.length > 0) {
      const found = groups.find((g) => g.items.some((i) => i.name === activeTab));
      if (found) {
        setActiveGroupTitle(found.title);
      }
    }
  }, [activeTab, groups]);

  // Detect mobile keyboard
  useEffect(() => {
    const visualViewport = window.visualViewport;

    if (!visualViewport) return;

    const handleViewportResize = () => {
      const keyboardHeight =
        window.innerHeight - visualViewport.height;

      setIsKeyboardOpen(keyboardHeight > 150);
    };

    handleViewportResize();

    visualViewport.addEventListener(
      "resize",
      handleViewportResize
    );

    return () => {
      visualViewport.removeEventListener(
        "resize",
        handleViewportResize
      );
    };
  }, []);

  const navItems = items && items.length > 0 ? items : defaultEmployeeItems;

  const gridColsClass =
    navItems.length === 6
      ? "grid-cols-6"
      : navItems.length === 5
      ? "grid-cols-5"
      : navItems.length === 4
      ? "grid-cols-4"
      : navItems.length === 7
      ? "grid-cols-7"
      : "grid-cols-6";

  const currentGroupItems =
    groups?.find((g) => g.title === activeGroupTitle)?.items || [];

  return (
    <div
      className={`xl:hidden fixed bottom-[38px] left-0 right-0 z-40
        bg-white border-t border-gray-200 pb-safe
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
        transition-all duration-300
        ${isSidebarOpen || isKeyboardOpen
          ? "translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
        }`}
    >
      {/* Multi-Group Manager Mode: Everything in ONE single line */}
      {groups && groups.length > 1 ? (
        activeGroupTitle ? (
          /* ONE LINE: Back to Menus Button + 5 Items for the Selected Group */
          <div className="flex h-16 sm:h-20 lg:h-22 items-center px-1.5 w-full">
            {/* Quick button to switch back to the 2 menu categories */}
            <button
              type="button"
              onClick={() => setActiveGroupTitle(null)}
              className="flex flex-col items-center justify-center p-1 px-2 h-full rounded-xl text-gray-500 hover:text-[#4318FF] active:bg-gray-100 transition-colors shrink-0 border-r border-gray-100 mr-1"
              title="Switch Menu (My Workspace / Team Management)"
            >
              <div className="flex items-center gap-0.5 text-[#4318FF]">
                <ChevronLeft size={18} />
              </div>
              <span className="text-[9px] font-bold text-gray-600 truncate max-w-[48px]">
                {activeGroupTitle === "My Workspace" ? "Work" : "Team"}
              </span>
            </button>

            {/* The 5 items of the active group in that same ONE line */}
            <div className="grid grid-cols-5 flex-1 h-full items-center">
              {currentGroupItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onTabChange?.(item.name)}
                    className="flex flex-col items-center justify-center gap-1 p-1 h-full rounded-xl active:bg-gray-50 transition-colors"
                    title={item.fullLabel || item.label}
                  >
                    <Icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 transition-colors ${
                        isActive ? "text-[#4318FF]" : "text-[#A3AED0]"
                      }`}
                    />
                    <span
                      className={`text-[9px] sm:text-xs lg:text-sm tracking-tight transition-all truncate w-full text-center ${
                        isActive ? "text-[#4318FF] font-bold" : "text-[#A3AED0]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ONE LINE: The 2 Dropdown Menus (My Workspace / Team Management) */
          <div className="grid grid-cols-2 divide-x divide-gray-200 h-16 sm:h-20 lg:h-22 items-center px-2">
            {groups.map((group) => {
              const hasActiveItem = group.items.some((i) => i.name === activeTab);
              const activeItem = group.items.find((i) => i.name === activeTab);

              return (
                <button
                  key={group.title}
                  type="button"
                  onClick={() => setActiveGroupTitle(group.title)}
                  className={`flex items-center justify-center gap-2.5 px-3 h-full rounded-xl transition-all duration-200 active:bg-gray-50 ${
                    hasActiveItem ? "bg-indigo-50/60 text-[#4318FF]" : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {group.title === "My Workspace" ? (
                    <Briefcase className={`w-5 h-5 shrink-0 ${hasActiveItem ? "text-[#4318FF]" : "text-gray-500"}`} />
                  ) : (
                    <Users className={`w-5 h-5 shrink-0 ${hasActiveItem ? "text-[#4318FF]" : "text-gray-500"}`} />
                  )}
                  <div className="flex flex-col items-start truncate">
                    <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                      {group.title}
                      <ChevronDown size={14} className={hasActiveItem ? "text-[#4318FF]" : "text-gray-400"} />
                    </span>
                    {hasActiveItem && (
                      <span className="text-[9px] text-[#4318FF]/80 font-semibold truncate max-w-[120px]">
                        Active: {activeItem?.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        /* Regular Single-Bar Grid Layout for Employee / Admin */
        <div className={`grid ${gridColsClass} h-16 sm:h-20 lg:h-22 items-center px-2`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => onTabChange?.(item.name)}
                className="flex flex-col items-center justify-center gap-1 p-1 h-full rounded-xl active:bg-gray-50 transition-colors"
                title={item.fullLabel || item.label}
              >
                <Icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 transition-colors ${
                    isActive ? "text-[#4318FF]" : "text-[#A3AED0]"
                  }`}
                />

                <span
                  className={`text-[9px] sm:text-xs lg:text-sm tracking-tight transition-all truncate w-full text-center ${
                    isActive ? "text-[#4318FF]" : "text-[#A3AED0]"
                  }`}
                >
                  {item.fullLabel ? (
                    <>
                      <span className="sm:hidden">{item.label}</span>
                      <span className="hidden sm:inline">{item.fullLabel}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileBottomNav;