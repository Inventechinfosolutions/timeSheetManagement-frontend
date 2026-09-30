import { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutGrid,
  Calendar,
  User,
  Lock,
  AlarmClock,
  Unlock,
  Eye,
  LogOut,
  FileText,
  X
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../hooks";
import { useParams, useNavigate } from "react-router-dom";
import { logoutUser } from "../reducers/user.reducer";
import { UserType } from "../enums";
import ApiLoadingSpinner from "../components/ApiLoadingSpinner";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/mobileHeader/MobileBottomNav";

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
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
  const mainContentRef = useRef<HTMLElement>(null);
  const { tab } = useParams<{ tab?: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Get employee details from Redux
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);

  // Determine active tab from URL if not explicitly provided
  const derivedActiveTab = useMemo(() => {
    if (activeTab && activeTab !== "Dashboard") return activeTab;
    switch (tab) {
      case "my-timesheet":
        return "My Timesheet";
      case "timesheet-view":
        return "Timesheet History";
      case "my-profile":
        return "Account Settings";
      case "change-password":
        return "Change Password";
      case "leave-management":
        return "Request Management";
      case "leave-balance":
        return "Leave Balance";
      case "notes":
      case "employee-notes":
        return "Employee Notes";
      default:
        return "Dashboard";
    }
  }, [tab, activeTab]);

  // Sidebar opens if it's either hovered OR locked
  const isOpen = isHovered || isLocked;

  const navItemClass = (isActive: boolean, expanded = true) =>
    [
      "w-full flex items-center cursor-pointer transition-all duration-300 relative group rounded-xl",
      isActive
        ? expanded
          ? "bg-white text-[#E11D48] md:bg-white/95 md:text-[#2B3674] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          : "md:justify-center"
        : "text-white/85 hover:bg-white/10 hover:text-white md:text-white/80",
      expanded ? "gap-3 px-3 py-2.5" : "md:justify-center md:px-0 py-2",
    ].join(" ");

  const navIconWrapClass = (isActive: boolean, expanded = true) =>
    [
      "shrink-0 relative z-10 flex items-center justify-center transition-all duration-300",
      isActive && !expanded
        ? "p-2.5 bg-white text-[#E11D48] md:text-[#4318FF] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        : "",
    ].join(" ");

  const navIconClass = (isActive: boolean) =>
    `w-5 h-5 transition-all duration-300 ${isActive
      ? "text-[#E11D48] md:text-[#4318FF]"
      : "text-white/85 group-hover:scale-110"
    }`;

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/landing", { state: { skipSplash: true } });
    });
  };

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutGrid },
    { name: "My Timesheet", icon: Calendar },
    { name: "Timesheet History", icon: Eye },
    { name: "Request Management", icon: Calendar },
    { name: "Employee Notes", icon: FileText },
    { name: "Account Settings", icon: User },
    //{ name: 'Change Password', icon: Lock },
  ];

  // Listen for open-mobile-sidebar event dispatched from MobileHeader
  useEffect(() => {
    const handleOpen = () => setIsMobileOpen(true);
    window.addEventListener("open-mobile-sidebar", handleOpen);
    return () => window.removeEventListener("open-mobile-sidebar", handleOpen);
  }, []);

  return (
    <div className="flex flex-col w-full h-screen bg-[#F4F7FE] md:bg-[#f8f9fa] font-sans text-[#2B3674] overflow-hidden relative">
      <Header />
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Premium Mobile Backdrop */}
        <div
          className={`md:hidden fixed inset-0 bg-[#111c44]/60 backdrop-blur-md z-2000 transition-all duration-500 ease-in-out
                    ${isMobileOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
            }
                `}
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Spacer to prevent layout shift when locked.
                When unlocked, it stays small (w-20). When locked, it takes full space (w-64).
            */}
        <div
          className={`shrink-0 transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-20"
            } hidden md:block`}
        ></div>

        <aside
          className={`fixed top-0 md:absolute md:top-0 md:left-0 h-full md:h-full flex flex-col shrink-0 transition-all duration-300 ease-in-out z-2001 md:z-30 text-white
              bg-[linear-gradient(180deg,#E11D48_0%,#F43F5E_40%,#FB7185_75%,#F472B6_100%)]
              md:bg-[linear-gradient(37deg,#3B82F6_4.06%,#2563EB_62.76%,#1E3A8A_121.45%)]
            ${isMobileOpen
              ? "translate-x-0 w-72"
              : "-translate-x-full md:translate-x-0"
            }
            ${isOpen ? "md:w-64" : "md:w-20"}
          `}
          style={{
            boxShadow:
              "0 4px 6px 0 rgba(0, 0, 0, 0.10), 0 10px 15px 0 rgba(0, 0, 0, 0.10)",
          }}
          onMouseEnter={() => !isLocked && setIsHovered(true)}
          onMouseLeave={() => !isLocked && setIsHovered(false)}
        >
          {/* Mobile Drawer Decorative SVG Background Pattern */}
          <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden z-0">
            <svg
              className="w-full h-full opacity-70"
              viewBox="0 0 288 640"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="sbWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
                  <stop offset="50%" stopColor="rgba(255, 255, 255, 0.12)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                </linearGradient>
              </defs>

              {/* Top ambient wave swoop */}
              <path
                d="M0,0 L288,0 L288,95 C220,130 140,80 0,115 Z"
                fill="url(#sbWaveGrad)"
              />

              {/* Decorative floating rings */}
              <circle cx="230" cy="180" r="50" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
              <circle cx="230" cy="180" r="28" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" strokeDasharray="4 4" />
              
              <circle cx="30" cy="380" r="70" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
              <circle cx="260" cy="480" r="45" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />

              {/* Bottom organic curve */}
              <path
                d="M0,540 C80,510 180,580 288,520 L288,640 L0,640 Z"
                fill="url(#sbWaveGrad)"
              />
            </svg>
          </div>

          {/* Mobile Drawer Navigation Header */}
          <div className="md:hidden flex items-center justify-between p-6 mb-2 border-b border-white/20 relative z-10">

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                <User className="w-6 h-6 text-white" />
              </div>

              <span className="text-xl font-bold text-white tracking-tight">
                {currentUser?.userType === UserType.ADMIN
                  ? "Admin"
                  : currentUser?.userType === UserType.MANAGER
                    ? "Manager"
                    : "Employee"}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-lg text-white hover:bg-white/20 active:scale-90 transition-all duration-200"
              aria-label="Close menu"
            >
              <X size={22} strokeWidth={2} />
            </button>

          </div>

          {/* Branding & Lock Toggle - Desktop Only */}
          <div className="hidden md:flex h-14 items-center justify-between px-0 relative mb-0">
            {/* Logo / Title Area */}
            <div
              className={`flex items-center gap-3 transition-all duration-300 overflow-hidden h-full
                        ${isOpen
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
                            ${isOpen
                    ? "opacity-100 scale-100 ml-0"
                    : "opacity-0 scale-90 w-0 ml-[-100px] overflow-hidden absolute"
                  }
                        `}
              >
                <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
                  {entity?.employeeId || "EMP001"}
                </span>
                <span className="text-[10px] font-medium text-blue-100 uppercase tracking-widest whitespace-nowrap">
                  {currentUser?.userType === UserType.ADMIN
                    ? "Admin"
                    : currentUser?.userType === UserType.MANAGER
                      ? "Manager"
                      : "Employee"}
                </span>
              </div>
            </div>

            {/* Lock/Unlock Button */}
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-300
                            ${isOpen
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
              className={`h-px bg-white/20 transition-all duration-500 ${isOpen ? "w-full" : "w-8 mx-auto"
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
                    className={navItemClass(isActive, isOpen || isMobileOpen)}
                  >
                    {isActive && (isOpen || isMobileOpen) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#E11D48] md:bg-[#4318FF] rounded-r-full" />
                    )}
                    {/* Icon */}
                    <div className={navIconWrapClass(isActive, isOpen || isMobileOpen)}>
                      <item.icon className={navIconClass(isActive)} />
                    </div>

                    {/* Label */}
                    <span
                      className={`text-sm whitespace-nowrap transition-all duration-300 relative z-10
                                        ${isOpen || isMobileOpen
                          ? "opacity-100 translate-x-0 w-auto"
                          : "opacity-0 -translate-x-4 w-0 overflow-hidden absolute"
                        }
                                    `}
                    >
                      {item.name}
                    </span>
                  </button>

                  {/* Tooltip */}
                  {!isOpen && !isMobileOpen && (
                    <div className="hidden md:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111c44] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                      {item.name}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-r-[#111c44] border-l-transparent border-t-transparent border-b-transparent"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 pb-6 mt-2 border-t border-white/20 md:border-white/10 pt-4 relative z-10 shrink-0">
            <div className="relative group">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group
                    bg-transparent text-white
                    hover:bg-white hover:text-red-600
                    active:bg-white active:text-red-600
                    ${isOpen || isMobileOpen
                    ? "gap-4 px-4"
                    : "md:justify-center md:px-0 gap-0"
                  }
  `}
              >
                <div className="shrink-0 relative z-10 transition-transform duration-300 ">
                  <LogOut className="w-5 h-5 transition-colors duration-300 group-hover:scale-110" />
                </div>
                <span
                  className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 relative z-10
                        ${isOpen || isMobileOpen
                      ? "opacity-100 translate-x-0 w-auto"
                      : "opacity-0 -translate-x-4 w-0 overflow-hidden absolute"
                    }
                    `}
                >
                  Logout
                </span>
              </button>

              {!isOpen && !isMobileOpen && (
                <div className="hidden md:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111c44] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                  Logout
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-r-[#111c44] border-l-transparent border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main
          ref={mainContentRef}
          className="flex-1 min-h-0 h-full relative custom-scrollbar flex flex-col bg-[#F4F7FE] overflow-y-auto overflow-x-hidden"
        >
          <div className="relative grow shrink-0 flex flex-col pb-28 md:pb-0">
            {children}
            <ApiLoadingSpinner contained contentAreaRef={mainContentRef} />
          </div>

          {/* Mobile Bottom Navigation Bar (Floating above fixed footer) */}
          <div className="md:hidden fixed bottom-[31px] left-0 right-0 z-999 flex flex-col pointer-events-none">
            <div className="pointer-events-auto">
              <MobileBottomNav
                activeTab={derivedActiveTab}
                onTabChange={(tabName) => {
                  onTabChange?.(tabName);
                  setIsMobileOpen(false);
                }}
              />
            </div>
          </div>

          <Footer className="sidebar-footer" />
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
