import { useState, useEffect, useMemo, useRef } from "react";
import {
  Settings,
  Users,
  Lock,
  AlarmClock,
  Unlock,
  Bell,
  Calendar,
  Eye,
  LayoutGrid,
  User,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  Award,
  StickyNote,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { logoutUser } from "../reducers/user.reducer";
import ApiLoadingSpinner from "../components/ApiLoadingSpinner";
import Header from "../components/DesktopHeader/Header";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/FooterMobileResponsive/MobileFooter";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { UserType } from "../enums";
import "../EmployeeDashboard/SidebarLayout.css";

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  title?: string;
  hideSidebar?: boolean;
}

const SidebarLayout = ({
  children,
  activeTab = "Dashboard",
  onTabChange,
  title = "Admin",
  hideSidebar = false,
}: SidebarLayoutProps) => {
  // State management
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { tab } = useParams<{ tab?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isCEO = currentUser?.userType === UserType.CEO;

  // Ref for the main scrollable content area
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Grouped Sidebar Items for Manager
  const managerSidebarGroups = useMemo(
    () => [
      {
        title: "My Workspace",
        items: [
          { name: "My Dashboard", icon: LayoutGrid },
          { name: "My Timesheet", icon: Calendar },
          { name: "My Timesheet History", icon: Eye },
          { name: "Request Management ", icon: Calendar },
          // { name : "Appraisal", icon: Award},
          { name: "Employee Notes", icon: StickyNote },
          { name: "Account Settings", icon: User },
        ],
      },
      {
        title: "Team Management",
        items: [
          { name: "Employee Dashboard", icon: LayoutGrid },
          { name: "Employee Directory", icon: Users },
          { name: "Employee Timesheet", icon: Calendar },
          { name: "Request Management", icon: Calendar },
          // { name: "Quarterly Review", icon: ClipboardList },
          { name: "Notification", icon: Bell },
        ],
      },
    ],
    [],
  );

  const adminSidebarItems = useMemo(
    () => [
      { name: "Admin Dashboard", icon: LayoutGrid },
      { name: "Employee Directory", icon: Users },
      { name: "Employee Timesheet", icon: Calendar },
      { name: "Request Management", icon: Calendar },
      // { name: "Quarterly Review", icon: ClipboardList },
      { name: "Manager Mapping", icon: Users },
      { name: "Notification", icon: Bell },
    ],
    [],
  );

  // Receptionist: hide Request Management and Quarterly Review from sidebar
  const visibleAdminSidebarItems = useMemo(
    () =>
      title === "Receptionist"
        ? adminSidebarItems.filter((item) => item.name !== "Request Management" && item.name !== "Quarterly Review")
        : adminSidebarItems,
    [title, adminSidebarItems],
  );

  const adminMobileNavItems = useMemo(
    () => [
      { name: "Admin Dashboard", icon: LayoutGrid, label: "Dashboard", fullLabel: "Dashboard" },
      { name: "Employee Directory", icon: Users, label: "Directory", fullLabel: "Directory" },
      { name: "Employee Timesheet", icon: Calendar, label: "Timesheet", fullLabel: "Timesheet" },
      { name: "Request Management", icon: Calendar, label: "Requests", fullLabel: "Requests" },
      { name: "Manager Mapping", icon: Users, label: "Mapping", fullLabel: "Mapping" },
      { name: "Notification", icon: Bell, label: "Alerts", fullLabel: "Notification" },
    ],
    [],
  );

  const managerMobileNavGroups = useMemo(
    () => [
      {
        title: "My Workspace",
        items: [
          { name: "My Dashboard", icon: LayoutGrid, label: "Dashboard", fullLabel: "Dashboard" },
          { name: "My Timesheet", icon: Calendar, label: "Timesheet", fullLabel: "Timesheet" },
          { name: "My Timesheet History", icon: Eye, label: "History", fullLabel: "History" },
          { name: "Request Management ", icon: Calendar, label: "Requests", fullLabel: "Requests" },
          { name: "Employee Notes", icon: StickyNote, label: "Notes", fullLabel: "Employee Notes" },
        ],
      },
      {
        title: "Team Management",
        items: [
          { name: "Employee Dashboard", icon: LayoutGrid, label: "Dashboard", fullLabel: "Dashboard" },
          { name: "Employee Directory", icon: Users, label: "Directory", fullLabel: "Directory" },
          { name: "Employee Timesheet", icon: Calendar, label: "Timesheet", fullLabel: "Timesheet" },
          { name: "Request Management", icon: Calendar, label: "Requests", fullLabel: "Requests" },
          { name: "Notification", icon: Bell, label: "Alerts", fullLabel: "Notification" },
        ],
      },
    ],
    [],
  );

  const mobileNavItems = useMemo(() => {
    if (title === "Receptionist") {
      return adminMobileNavItems.filter((i) => i.name !== "Request Management");
    }
    return adminMobileNavItems;
  }, [title, adminMobileNavItems]);

  // Maps sidebar item names -> URL tab slugs.
  // Used to navigate directly, independent of the onTabChange prop
  // (which some parent layouts don't wire up for every tab, e.g. Quarterly Review).
  const tabRouteMap: Record<string, string> = useMemo(
    () => ({
      "My Dashboard": "my-dashboard",
      "My Timesheet": "my-timesheet",
      "My Timesheet History": "my-timesheet-view",
      "Request Management ": "leave-management", // Manager > My Workspace (trailing space intentional)
      "Account Settings": "my-profile",
      "Employee Dashboard": "admin-dashboard",
      "Employee Directory": "employees",
      "Employee Timesheet": "timesheet-list",
      "Request Management": "work-management",
      "Quarterly Review": "quarterly-review",
      "Appraisal": "appraisal",
      Notification: "requests",
      "Admin Dashboard": "admin-dashboard",
      "Manager Mapping": "manager-mapping",
      "Employee Notes": "employee-notes",
    }),
    [],
  );

  const handleNavItemClick = (itemName: string) => {
    onTabChange?.(itemName);
    const route = tabRouteMap[itemName];
    if (route) {
      const basePath = title === "Manager" ? "manager-dashboard" : "admin-dashboard";
      navigate(`/${basePath}/${route}`);
    }
    setIsMobileOpen(false);
  };

  // Determine active tab. The URL always wins over the activeTab prop,
  // so the highlighted item always matches where the user actually navigated
  // (previously a stale activeTab prop from the parent layout could override this).
  const derivedActiveTab = useMemo(() => {
    switch (tab) {
      case "registration":
        return "User & Role Management";
      case "employees":
        return "Employee Directory";
      case "timesheet-list":
      case "working-details":
        return "Employee Timesheet";
      case "requests":
        return "Notification";
      case "manager-mapping":
        return "Manager Mapping";
      case "leave-balance":
        return "Leave Balance";
      case "leave-management":
        return "Request Management ";
      case "work-management":
        return "Request Management";
      case "quarterly-review":
        return "Quarterly Review";
      case "appraisal":
      case "review":
      case "quarterly-ratings":
      case "annual-ratings":
        return "Appraisal";
      case "my-dashboard":
        return "My Dashboard";
      case "my-timesheet":
        return "My Timesheet";
      case "my-timesheet-view":
        return "My Timesheet History";
      case "my-profile":
        return "Account Settings";
      case "employee-notes":
        return "Employee Notes";
      case "admin-dashboard":
        return title === "Manager" ? "Employee Dashboard" : "Admin Dashboard";
      default:
        break;
    }
    // No recognized :tab param in the URL (e.g. the index route) —
    // fall back to the explicit activeTab prop, then a sensible default.
    if (activeTab && activeTab !== "Dashboard") return activeTab;
    return title === "Manager" ? "My Dashboard" : "Admin Dashboard";
  }, [tab, activeTab, title]);

  // Track expanded groups (independent collapsible sections)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      if (title !== "Manager") return {};
      // Expand groups that contain the active tab by default
      const initial: Record<string, boolean> = {};
      managerSidebarGroups.forEach((group) => {
        if (group.items.some((item) => item.name === derivedActiveTab)) {
          initial[group.title] = true;
        }
      });
      // Always expand first group if none match
      if (
        Object.keys(initial).length === 0 &&
        managerSidebarGroups.length > 0
      ) {
        initial[managerSidebarGroups[0].title] = true;
      }
      return initial;
    },
  );

  // Automatically expand group containing active tab when active tab changes
  useEffect(() => {
    if (title === "Manager" && derivedActiveTab) {
      managerSidebarGroups.forEach((group) => {
        if (group.items.some((item) => item.name === derivedActiveTab)) {
          setExpandedGroups((prev) => ({
            ...prev,
            [group.title]: true,
          }));
        }
      });
    }
  }, [derivedActiveTab, title, managerSidebarGroups]);

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/landing", { state: { skipSplash: true } });
    });
  };

  // Scroll to top when tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [derivedActiveTab]);

  // Sidebar opens if it's either hovered OR locked
  const isOpen = isHovered || isLocked;

  // FIX: previously this whole block (backdrop + spacer + <aside>) was
  // gated behind `!hideSidebar`, so pages that pass hideSidebar={true}
  // (like the Quarterly Review mobile tab view) never mounted the mobile
  // drawer at all — tapping the hamburger set isMobileOpen to true, but
  // there was no <aside> in the DOM to slide in, so nothing happened and
  // "Back" had nothing to close either. The drawer + its backdrop now
  // render whenever isMobileOpen is true, regardless of hideSidebar; only
  // the desktop-only spacer stays tied to hideSidebar (that's the part
  // meant to be skipped for these self-contained tab pages).
  const shouldRenderSidebarShell = !hideSidebar || isMobileOpen;

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

  return (
    <div className="flex flex-col w-full h-screen bg-[#f8f9fa] font-sans text-[#2B3674] overflow-hidden relative">
      <Header onMobileMenuClick={() => setIsMobileOpen(true)} />
      <div className="flex flex-1 min-h-0 relative overflow-hidden w-full">
        {shouldRenderSidebarShell && (
          <>
            {/* Mobile / Drawer Backdrop */}
            <div
              className={`sidebar-mobile-backdrop fixed inset-0 bg-[#111c44]/60 backdrop-blur-md z-[2000] transition-all duration-300 ease-in-out
                ${hideSidebar ? "" : "xl:hidden"}
                ${isMobileOpen
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
                }
              `}
              onClick={() => setIsMobileOpen(false)}
            />

            <aside
              className={
                hideSidebar
                  ? `fixed top-0 left-0 h-full flex flex-col shrink-0 transition-all duration-300 ease-in-out z-[2001] text-white w-72
                     ${isMobileOpen ? "translate-x-0 visible" : "-translate-x-[calc(100%+20px)] invisible"}`
                  : `app-sidebar ${isOpen ? "app-sidebar--open" : "app-sidebar--collapsed"} fixed top-0 left-0 h-full flex flex-col shrink-0 transition-all duration-300 ease-in-out text-white w-72 xl:w-auto
                     xl:sticky xl:top-0
                     ${isMobileOpen
                    ? "translate-x-0 visible z-[2001]"
                    : "-translate-x-[calc(100%+20px)] max-xl:invisible xl:translate-x-0 z-30"
                  }
                     ${isOpen ? "xl:w-64" : "xl:w-20"}`
              }
              style={{
                background:
                  "linear-gradient(37deg, #3B82F6 4.06%, #2563EB 62.76%, #1E3A8A 121.45%)",
                boxShadow:
                  "0 4px 6px 0 rgba(0, 0, 0, 0.10), 0 10px 15px 0 rgba(0, 0, 0, 0.10)",
              }}
              onMouseEnter={() => !isLocked && !hideSidebar && setIsHovered(true)}
              onMouseLeave={() => !isLocked && !hideSidebar && setIsHovered(false)}
            >
              {/* Mobile Drawer Navigation Header */}
              <div
                className={`sidebar-drawer-header ${hideSidebar ? "" : "xl:hidden"} flex items-center p-6 mb-2 border-b border-white/10 relative w-full`}
              >
                <div className="flex items-center gap-3 pr-12">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
                    {title}
                  </span>
                </div>

                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors z-50"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Branding & Lock Toggle - Desktop persistent-rail */}
              <div
                className={`sidebar-desktop-profile ${hideSidebar ? "hidden" : "hidden xl:flex"} h-14 items-center justify-between px-0 relative mb-0 mt-4`}
              >
                {/* Logo Area */}
                <div
                  className={`flex items-center gap-3 transition-all duration-300 overflow-hidden h-full
                        ${isOpen
                      ? "w-full opacity-100 pl-6"
                      : "w-full justify-center opacity-100 px-0"
                    }
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
                      {isCEO ? "CEO" : title}
                    </span>
                    {!isCEO && (
                      <span className="text-[10px] font-medium text-blue-100 uppercase tracking-widest whitespace-nowrap">
                        Management
                      </span>
                    )}
                  </div>
                </div>

                {/* Lock Toggle */}
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
                className="flex-1 px-4 mt-0.5 overflow-y-auto no-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {title === "Manager"
                  ? managerSidebarGroups.map((group) => {
                    const isExpanded = expandedGroups[group.title];
                    const hasActiveItem = group.items.some(
                      (item) => item.name === derivedActiveTab,
                    );

                    return (
                      <div key={group.title} className="mb-2">
                        {/* Group Header */}
                        {isOpen && (
                          <button
                            onClick={() => toggleGroup(group.title)}
                            className={`w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 rounded-xl mb-1 border
                                              ${isExpanded
                                ? "text-white bg-white/15 border-white/20 shadow-sm"
                                : "text-white/70 hover:text-white hover:bg-white/10 border-white/10"
                              }
                                              ${hasActiveItem && !isExpanded
                                ? "text-white bg-white/10 border-white/15"
                                : ""
                              }
                                            `}
                          >
                            <span>{group.title}</span>
                            {isExpanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                        )}

                        {/* Group Items */}
                        <div
                          className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out
                                            ${isExpanded || !isOpen
                              ? "max-h-[500px] opacity-100"
                              : "max-h-0 opacity-0"
                            }
                                        `}
                        >
                          {group.items.map((item) => {
                            const isActive = derivedActiveTab === item.name;
                            const Icon = item.icon;
                            return (
                              <div key={item.name} className="relative group">
                                <button
                                  onClick={() => handleNavItemClick(item.name)}
                                  className={navItemClass(isActive, isOpen || isMobileOpen)}
                                >
                                  {isActive && (isOpen || isMobileOpen) && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#4318FF] rounded-r-full" />
                                  )}
                                  <div className={navIconWrapClass(isActive, isOpen || isMobileOpen)}>
                                    <Icon className={navIconClass(isActive, isOpen || isMobileOpen)} />
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

                                {/* Tooltip for collapsed mode */}
                                {!isOpen && !isMobileOpen && (
                                  <div className="sidebar-tooltip hidden xl:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111c44] text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                                    {item.name}
                                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-r-[#111c44] border-l-transparent border-t-transparent border-b-transparent"></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                  : visibleAdminSidebarItems.map((item) => {
                    const isActive = derivedActiveTab === item.name;
                    const Icon = item.icon!;
                    return (
                      <div key={item.name} className="relative group mb-1">
                        <button
                          onClick={() => handleNavItemClick(item.name)}
                          className={navItemClass(isActive, isOpen || isMobileOpen)}
                        >
                          {isActive && (isOpen || isMobileOpen) && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#4318FF] rounded-r-full" />
                          )}
                          <div className={navIconWrapClass(isActive, isOpen || isMobileOpen)}>
                            <Icon className={navIconClass(isActive, isOpen || isMobileOpen)} />
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

              {/* Logout Button */}
              <div className="px-4 pb-6 mt-2 border-t border-white/10 pt-4">
                <div className="relative group">
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden
        text-white hover:bg-white hover:text-red-600
        ${isOpen || isMobileOpen
                        ? "gap-4 px-4"
                        : "xl:justify-center xl:px-0 gap-0"
                      }
      `}
                  >
                    <div
                      className="
          shrink-0 relative z-10
          text-white
          transition-all duration-300
          group-hover:text-red-600
          group-hover:scale-110
        "
                    >
                      <LogOut className="w-5 h-5 transition-colors duration-300" />
                    </div>

                    <span
                      className={`text-md font-semibold whitespace-nowrap
          transition-all duration-300 relative z-10
          text-white group-hover:text-red-600
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
                    <div className="sidebar-tooltip hidden xl:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111c44] text-white text-md font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                      Logout
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-r-[#111c44] border-l-transparent border-t-transparent border-b-transparent"></div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </>
        )}

        <main
          ref={mainContentRef}
          className="app-main-content flex-1 min-h-0 h-full relative custom-scrollbar flex flex-col bg-[#F4F7FE] overflow-y-auto overflow-x-hidden pb-28 xl:pb-0"
        >
          <div className="relative grow shrink-0 flex flex-col w-full">
            {children}
            <ApiLoadingSpinner contained contentAreaRef={mainContentRef} />
          </div>

          {/* Bottom Responsive Mobile Navigation */}
          <div className="app-mobile-bottom-nav xl:hidden">
            <MobileBottomNav
              activeTab={derivedActiveTab}
              onTabChange={handleNavItemClick}
              isSidebarOpen={isMobileOpen}
              items={title === "Manager" ? undefined : mobileNavItems}
              groups={title === "Manager" ? managerMobileNavGroups : undefined}
            />
          </div>

          <Footer className="sidebar-footer" />
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;