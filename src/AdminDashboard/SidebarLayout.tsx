import { useState, useEffect } from "react";
import {
  Settings,
  Users,
  Lock,
  LogOut,
  AlarmClock,
  Unlock,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  // onLogout?: () => void;
}

const SidebarLayout = ({
  children,
  activeTab = "Dashboard",
  onTabChange,
}: // onLogout,
SidebarLayoutProps) => {
  // State management
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const { entities } = useSelector((state: RootState) => state.employeeDetails);

  useEffect(() => {
    // Fetch employee list on mount
    dispatch(getEntities({ page: 1, limit: 100, search: "" }));
  }, [dispatch]);

  // Sidebar opens if it's either hovered OR locked (Desktop)
  const isDesktopOpen = isHovered || isLocked;

  const sidebarItems = [
    { name: "System Dashboard", icon: Settings },
    { name: "Employee Details", icon: Users },
    { name: "User & Role Management", icon: Users },
    
  ];

  // const handleLogout = () => {
  //   if (onLogout) {
  //     onLogout();
  //   } else {
  //     navigate("/landing");
  //   }
  // };

  return (
    <div className="flex flex-1 bg-[#F4F7FE] font-sans text-[#2B3674] overflow-hidden relative min-h-screen">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-24 left-4 z-[1050] p-2.5 rounded-xl bg-white text-[#2B3674] shadow-lg border border-gray-100/50 hover:bg-gray-50 active:scale-95 transition-all"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#1B254B]/20 backdrop-blur-sm z-[1050] md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Spacer for Desktop Layout Shift */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isLocked ? "w-60" : "w-20"
        } hidden md:block`}
      ></div>

      <aside
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100 flex flex-col shrink-0 transition-all duration-300 ease-out shadow-2xl z-[1051]
                    md:absolute md:z-30
                    ${/* Mobile: Slide in/out */ ""}
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
                    ${/* Desktop: Always visible (reset translate) */ ""}
                    md:translate-x-0
                    ${/* Width control */ ""}
                    w-64 md:w-auto
                    ${isDesktopOpen ? "md:w-60" : "md:w-20"}
                `}
        onMouseEnter={() => !isLocked && setIsHovered(true)}
        onMouseLeave={() => !isLocked && setIsHovered(false)}
      >
        {/* Branding & Lock Toggle */}
        <div className="h-20 md:h-16 flex items-center justify-between px-0 relative">
          {/* Logo / Title Area */}
          <div
            className={`flex items-center gap-2 transition-all duration-300 overflow-hidden pl-5 h-full items-center
                        ${
                          isDesktopOpen
                            ? "w-full opacity-100"
                            : "md:w-full md:justify-center md:opacity-100 md:px-0"
                        }
                    `}
          >
            <div className="shrink-0 transition-transform duration-300 hover:scale-110">
              <AlarmClock className="w-8 h-8 text-[#00A3C4]" />
            </div>

            <span
              className={`text-xl font-bold text-[#2B3674] tracking-tight whitespace-nowrap transition-all duration-300 origin-left
                            ${
                              isDesktopOpen
                                ? "opacity-100 scale-100 ml-0"
                                : "md:opacity-0 md:scale-90 md:w-0 md:ml-[-100px] md:overflow-hidden md:absolute"
                            }
                        `}
            >
              Timesheet Pro
            </span>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Desktop Lock/Unlock Button */}
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`hidden md:block absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-[#00A3C4] hover:bg-blue-50 transition-all duration-500
                            ${
                              isDesktopOpen
                                ? "opacity-100 rotate-0"
                                : "opacity-0 rotate-90 pointer-events-none"
                            }
                        `}
            title={isLocked ? "Unlock Sidebar" : "Pin Sidebar Open"}
          >
            {isLocked ? (
              <Lock size={18} className="text-[#00A3C4]" />
            ) : (
              <Unlock size={18} />
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="px-4 mb-2">
          <div
            className={`h-px bg-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-500 ${
              isDesktopOpen ? "w-full" : "md:w-8 md:mx-auto"
            }`}
          ></div>
        </div>

        {/* Navigation Items */}
        <nav
          className="flex-1 px-3 space-y-1 mt-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.name;

            return (
              <div key={item.name} className="relative group">
                <button
                  onClick={() => {
                    onTabChange?.(item.name);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-3 md:p-2 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group
                                        ${
                                          isActive
                                            ? "bg-[#E6FFFA] text-[#00A3C4]"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                        }
                                        ${!isDesktopOpen && "md:justify-center"}
                                    `}
                >
                  {/* Active Indicator Line (Left) */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00A3C4] rounded-r-md transition-all duration-300
                                          ${
                                            isActive
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }
                                      `}
                  ></div>

                  {/* Icon */}
                  <div className="shrink-0 relative z-10 transition-transform duration-300">
                    <item.icon
                      className={`w-5 h-5 transition-colors duration-300 ${
                        isActive
                          ? "text-[#00A3C4]"
                          : "group-hover:text-[#2B3674]"
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`font-medium text-sm whitespace-nowrap transition-all duration-300 relative z-10
                                          ${
                                            isDesktopOpen
                                              ? "opacity-100 translate-x-0 w-auto"
                                              : "md:opacity-0 md:-translate-x-4 md:w-0 md:overflow-hidden md:absolute"
                                          }
                                          ${isActive ? "font-semibold" : ""}
                                      `}
                  >
                    {item.name}
                  </span>
                </button>

                {/* Tooltip for collapsed state (Desktop only) */}
                {!isDesktopOpen && (
                  <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[#2B3674] text-white text-xs font-bold rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 translate-x-2 group-hover:translate-x-0">
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
        {/* <div className="p-3 mt-auto shrink-0 mb-2 border-t border-gray-100/50 pt-2">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-3 md:p-2 rounded-xl cursor-pointer transition-all duration-300 group hover:bg-red-50 text-red-500
                            ${!isDesktopOpen && "md:justify-center"}
                        `}
          >
            <div className="shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
              <LogOut className="w-6 h-6" />
            </div>
            <span
              className={`font-medium text-sm whitespace-nowrap transition-all duration-300
                            ${
                              isDesktopOpen
                                ? "opacity-100 translate-x-0 w-auto"
                                : "md:opacity-0 md:-translate-x-4 md:w-0 md:absolute"
                            }
                        `}
            >
              Logout
            </span>
          </button>
        </div> */}
      </aside>

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden h-full [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
