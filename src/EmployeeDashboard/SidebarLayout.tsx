import { useState, useMemo, useRef } from "react";
import MobileBottomNav from "../components/FooterMobileResponsive/MobileFooter";
import { Info } from "lucide-react";
import {
  LayoutGrid,
  Calendar,
  User,
  Lock,
  Unlock,
  Eye,
  X,
  LogOut,
  Award,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../hooks";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../reducers/user.reducer";
import { UserType } from "../enums";
import ApiLoadingSpinner from "../components/ApiLoadingSpinner";
import Header from "../components/DesktopHeader/Header";
import Footer from "../components/Footer";
import "./SidebarLayout.css";

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
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);
  const { tab } = useParams<{ tab?: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);

  const derivedActiveTab = useMemo(() => {
    if (activeTab && activeTab !== "Dashboard") return activeTab;

    switch (tab) {
      case "my-timesheet": return "My Timesheet";
      case "timesheet-view": return "Timesheet History";
      case "my-profile": return "Account Settings";
      case "change-password": return "Change Password";
      case "leave-management": return "Request Management";
      case "appraisal": return "Appraisal";
      case "leave-balance": return "Leave Balance";
      case "about": return "About";
      default: return "Dashboard";
    }
  }, [tab, activeTab]);
  const isOpen = isHovered || isLocked;

  const navItemClass = (isActive: boolean, expanded = true) =>
    [
      "w-full flex items-center cursor-pointer transition-all duration-300 relative group rounded-xl",
      isActive
        ? expanded
          ? "bg-white/95 text-[#2B3674] font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
          : "xl:justify-center"
        : "text-white/80 hover:bg-white/10 hover:text-white",
      expanded ? "gap-3 px-3 py-2.5" : "xl:justify-center xl:px-0 py-2",
      !expanded ? "sidebar-collapsed-center" : "",
    ].join(" ");

  const navIconWrapClass = (isActive: boolean, expanded = true) =>
    [
      "shrink-0 relative z-10 flex items-center justify-center transition-all duration-300",
      isActive && !expanded
        ? "p-2.5 bg-white text-[#4318FF] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        : "",
    ].join(" ");

  const navIconClass = (isActive: boolean, expanded = true) =>
    `w-5 h-5 transition-all duration-300 ${isActive && expanded ? "text-[#4318FF]" : isActive ? "text-[#4318FF]" : "group-hover:scale-110"}`;

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
    { name: "Appraisal", icon: Award },
    { name: "Account Settings", icon: User },
    { name: "About", icon: Info },
  ];

  return (
    <div className="flex flex-col w-full h-screen bg-[#f8f9fa] font-sans text-[#2B3674] overflow-hidden relative">

      {/* Universal Sticky/Flex Top Header Header Component */}
      <Header onMobileMenuClick={() => setIsMobileOpen(true)} />

      {/* Main Container Wrapper */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden w-full">

        {/* Mobile Backdrop Overlay Element - onClick closing removed */}
        <div
          className={`sidebar-mobile-backdrop xl:hidden fixed inset-0 bg-[#111c44]/60 backdrop-blur-md z-[2000] transition-opacity duration-300 ease-in-out
            ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          `}
        />

        {/* Combined Sidebar Component */}
        <aside
          className={`app-sidebar ${isOpen ? "app-sidebar--open" : "app-sidebar--collapsed"} fixed top-0 left-0 h-full flex flex-col shrink-0 transition-all duration-300 ease-in-out text-white
            xl:sticky xl:top-0
            ${isMobileOpen
              ? "translate-x-0 w-72 z-[2001]"
              : "-translate-x-full xl:translate-x-0 z-30"
            }
            ${isOpen ? "xl:w-64" : "xl:w-20"}
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
          {/* Mobile & Zoomed Drawer Header View Container */}
          <div className="sidebar-drawer-header xl:hidden flex items-center p-6 mb-2 border-b border-white/10 relative w-full">
            <div className="flex items-center gap-3 pr-12">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
                {currentUser?.userType === UserType.ADMIN
                  ? "Admin"
                  : currentUser?.userType === UserType.MANAGER
                    ? "Manager"
                    : "Employee"}
              </span>
            </div>

            {/* Absolute positioning completely overrides any layout grid or column behavior from CSS */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors z-50"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Branding Profile Tag Element */}
          <div className="sidebar-desktop-profile hidden xl:flex h-14 items-center justify-between px-0 relative mb-0 mt-4">
            <div
              className={`flex items-center gap-3 transition-all duration-300 overflow-hidden h-full
                ${isOpen ? "w-full opacity-100 pl-6" : "w-full justify-center opacity-100 px-0"}
              `}
            >
              <div className="shrink-0 transition-transform duration-300 hover:scale-110 p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <User className="w-6 h-6 text-white" />
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

            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-300
                ${isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90 pointer-events-none"}
              `}
              title={isLocked ? "Unlock Sidebar" : "Pin Sidebar Open"}
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          </div>

          <div className="px-4 mb-2 mt-2">
            <div
              className={`h-px bg-white/20 transition-all duration-500 ${isOpen ? "w-full" : "w-8 mx-auto"
                }`}
            ></div>
          </div>

          {/* Navigation Links Area */}
          <nav
            className="flex-1 px-4 space-y-2 mt-0.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sidebarItems.map((item) => {
              const isActive =
                item.name === "About"
                  ? location.pathname.includes("/about")
                  : derivedActiveTab === item.name;
              return (
                <div key={item.name} className="relative group">
                  <button
                    onClick={() => {
                      if (item.name === "About") {
                        if (location.pathname.includes("/manager-dashboard")) {
                          navigate("/manager-dashboard/about");
                        } else if (location.pathname.includes("/appraisal")) {
                          navigate("/appraisal");
                        }
                        else if (location.pathname.includes("/admin-dashboard")) {
                          navigate("/admin-dashboard/about");
                        } else {
                          navigate("/employee-dashboard/about");
                        }
                      } else {
                        onTabChange?.(item.name);
                      }
                      setIsMobileOpen(false);
                    }}
                    className={navItemClass(isActive, isOpen || isMobileOpen)}
                  >
                    {isActive && (isOpen || isMobileOpen) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#4318FF] rounded-r-full" />
                    )}
                    <div className={navIconWrapClass(isActive, isOpen || isMobileOpen)}>
                      <item.icon className={navIconClass(isActive, isOpen || isMobileOpen)} />
                    </div>

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

                  {!isOpen && !isMobileOpen && (
                    <div className="sidebar-tooltip hidden xl:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111c44] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                      {item.name}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-r-[#111c44] border-l-transparent border-t-transparent border-b-transparent"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout Action Footer Component */}
          <div className="px-4 pb-6 mt-2 border-t border-white/10 pt-4">
            <div className="relative group">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group bg-white text-red-600 hover:bg-red-50
                  ${isOpen || isMobileOpen ? "gap-4 px-4" : "xl:justify-center xl:px-0 gap-0"}
                `}
              >
                <div className="shrink-0 relative z-10 transition-transform duration-300 text-red-600">
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
                <div className="sidebar-tooltip hidden xl:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111c44] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                  Logout
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-r-[#111c44] border-l-transparent border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Render Main Target Pane */}
        <main
          ref={mainContentRef}
          className="app-main-content flex-1 min-h-0 h-full relative flex flex-col bg-[#F4F7FE] overflow-y-auto overflow-x-hidden pb-16 xl:pb-0"
        >
          <div className="relative grow shrink-0 flex flex-col w-full">
            {children}
            <ApiLoadingSpinner contained contentAreaRef={mainContentRef} />
          </div>

          {/* Bottom Responsive Mobile Navigation */}
          <div className="app-mobile-bottom-nav xl:hidden">
            <MobileBottomNav
              activeTab={derivedActiveTab}
              onTabChange={onTabChange}
              isSidebarOpen={isMobileOpen}
            />
          </div>

          {/* Footers */}
          <div className="app-desktop-footer hidden xl:block">
            <Footer className="sidebar-footer" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
