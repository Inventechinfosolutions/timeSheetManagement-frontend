import { useState, useEffect, useMemo, useRef } from "react";
import {
  Settings,
  Users,
  Lock,
  AlarmClock,
  Unlock,
  Menu,
  ClipboardList,
  Bell,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const SidebarLayout = ({
  children,
  activeTab = "Dashboard",
  onTabChange,
}: SidebarLayoutProps) => {
  // State management
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { tab } = useParams<{ tab?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Ref for the main scrollable content area
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Determine active tab from URL if not explicitly provided
  const derivedActiveTab = useMemo(() => {
    if (activeTab && activeTab !== "Dashboard") return activeTab;
    switch (tab) {
      case "registration":
        return "User & Role Management";
      case "employees":
        return "Employee Details";
      case "timesheet-list":
        return "Timesheet";
      // case "working-details":
      //   return "Working Details";
      case "requests":
        return "Notification";
      default:
        return "System Dashboard";
    }
  }, [tab, activeTab]);

  useEffect(() => {
    dispatch(getEntities({ search: "" }));
  }, [dispatch]);

  // Scroll to top when tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [derivedActiveTab]);

  // Sidebar opens if it's either hovered OR locked
  const isOpen = isHovered || isLocked;

  const sidebarItems = [
    { name: "System Dashboard", icon: Settings },
    { name: "Employee Details", icon: Users },
    { name: "Timesheet", icon: AlarmClock },
    // { name: "Working Details", icon: ClipboardList },
    { name: "Notification", icon: Bell }, // Notification item with Bell icon
  ];

  return (
    <div className="flex w-full h-screen bg-[#f8f9fa] font-sans text-[#2B3674] overflow-hidden relative">
      {/* Mobile Menu Trigger - Floating Pulse Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={`md:hidden fixed z-1001 left-4 top-[55px] w-11 h-11 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-[#4318FF] active:scale-90 transition-all duration-300
                    ${
                      isMobileOpen
                        ? "opacity-0 scale-90 pointer-events-none"
                        : "opacity-100 scale-100"
                    }
                `}
      >
        <div className="relative">
          <Menu size={22} strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4318FF] opacity-40"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4318FF]"></span>
          </span>
        </div>
      </button>

      {/* Premium Mobile Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-[#111c44]/60 backdrop-blur-md z-2000 transition-all duration-500 ease-in-out
                    ${
                      isMobileOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    }
                `}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Spacer to prevent layout shift when locked */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isOpen ? "w-64" : "w-20"
        } hidden md:block`}
      ></div>

      <aside
        className={`fixed top-0 md:absolute md:top-0 md:left-0 h-full md:h-full flex flex-col shrink-0 transition-all duration-300 ease-in-out z-2001 md:z-30 text-white
                    ${
                      isMobileOpen
                        ? "translate-x-0 w-72"
                        : "-translate-x-full md:translate-x-0"
                    }
                    ${isOpen ? "md:w-64" : "md:w-20"}
                `}
        style={{
          background:
            "linear-gradient(37deg, #3B82F6 4.06%, #2563EB 62.76%, #1E3A8A 121.45%)",
          boxShadow:
            "0 4px 6px 0 rgba(0, 0, 0, 0.10), 0 10px 15px 0 rgba(0, 0, 0, 0.10)",
        }}
        onMouseEnter={() => !isLocked && setIsHovered(true)}
        onMouseLeave={() => !isLocked && setIsHovered(false)}
      >
        {/* Mobile Drawer Navigation Header */}
        <div className="md:hidden flex items-center gap-3 p-6 mb-2 border-b border-white/10">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10">
            <AlarmClock className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Admin
          </span>
        </div>

        {/* Branding & Lock Toggle - Desktop Only */}
        <div className="hidden md:flex h-14 items-center justify-between px-0 relative mb-0">
          {/* Logo Area */}
          <div
            className={`flex items-center gap-3 transition-all duration-300 overflow-hidden h-full
                        ${
                          isOpen
                            ? "w-full opacity-100 pl-6"
                            : "w-full justify-center opacity-100 px-0"
                        }
                    `}
          >
            <div className="shrink-0 transition-transform duration-300 hover:scale-110 p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <AlarmClock className="w-6 h-6 text-white" />
            </div>
            <div
              className={`flex flex-col transition-all duration-300 origin-left
                            ${
                              isOpen
                                ? "opacity-100 scale-100 ml-0"
                                : "opacity-0 scale-90 w-0 ml-[-100px] overflow-hidden absolute"
                            }
                        `}
            >
              <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
                Admin
              </span>
              <span className="text-[10px] font-medium text-blue-100 uppercase tracking-widest whitespace-nowrap">
                Management
              </span>
            </div>
          </div>

          {/* Lock Toggle */}
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-300
                            ${
                              isOpen
                                ? "opacity-100 rotate-0"
                                : "opacity-0 rotate-90 pointer-events-none"
                            }
                        `}
            title={isLocked ? "Unlock Sidebar" : "Pin Sidebar Open"}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        </div>

        {/* Divider */}
        <div className="px-4 mb-1">
          <div
            className={`h-px bg-white/20 transition-all duration-500 ${
              isOpen ? "w-full" : "w-8 mx-auto"
            }`}
          ></div>
        </div>

        {/* Navigation Items */}
        <nav
          className="flex-1 px-4 space-y-2 mt-0.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sidebarItems.map((item) => {
            const isActive = derivedActiveTab === item.name;
            return (
              <div key={item.name} className="relative group">
                <button
                  onClick={() => {
                    onTabChange?.(item.name);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group
                                        ${
                                          isActive
                                            ? "bg-white shadow-lg text-[#4318FF] font-bold"
                                            : "text-blue-100 hover:bg-white/10 hover:text-white"
                                        }
                                        ${
                                          isOpen
                                            ? "gap-4 px-4"
                                            : "md:justify-center md:px-0 gap-0"
                                        }
                                    `}
                >
                  <div className="shrink-0 relative z-10 transition-transform duration-300">
                    <item.icon
                      className={`w-5 h-5 transition-colors duration-300 ${
                        isActive ? "text-[#4318FF]" : "group-hover:scale-110"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm whitespace-nowrap transition-all duration-300 relative z-10
                                        ${
                                          isOpen
                                            ? "opacity-100 translate-x-0 w-auto"
                                            : "opacity-0 -translate-x-4 w-0 overflow-hidden absolute"
                                        }
                                    `}
                  >
                    {item.name}
                  </span>
                </button>

                {/* Tooltip */}
                {!isOpen && (
                  <div className="hidden md:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111c44] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                    {item.name}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-r-[#111c44] border-l-transparent border-t-transparent border-b-transparent"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main 
        ref={mainContentRef}
        className="flex-1 min-h-0 h-full relative no-scrollbar flex flex-col bg-[#F4F7FE] overflow-auto"
      >
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
