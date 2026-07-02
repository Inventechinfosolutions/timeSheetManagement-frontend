import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import {
  LogOut,
  Bell,
  User,
  ChevronDown,
  ArrowLeft,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { logoutUser } from "../../reducers/user.reducer";
import { fetchLoggedInUserProfileImage } from "../../reducers/employeeDetails.reducer";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchNotificationDetails,
  clearSelectedNotification,
} from "../../reducers/notification.reducer";
import { useState, useRef, useEffect } from "react";
import {
  fetchUnreadNotifications,
  fetchEmployeeUpdates,
  markAsRead as markLeaveNotifRead,
  markEmployeeUpdateRead,
  markAllAsRead as markAllLeaveRequestsRead,
  markAllEmployeeUpdatesRead,
  LeaveNotification,
} from "../../reducers/leaveNotification.reducer";
import {
  LeaveRequestStatus,
  WorkLocation,
  LeaveRequestType,
  UserType,
} from "../../enums";
// import MobileHeader, {
//   isMobileHeaderViewport,
// } from "../HeaderMobileResposive/MobileHeader";
import "./Header.css";
import worksphereLogo from "../../assets/WorkSphere_Logo_white.svg";
import workspherelogo from "../../assets/worksphere_white.svg";
import MobileHeader, {
  isMobileHeaderViewport,
} from "../HeaderMobileResposive/MobileHeader";
interface HeaderProps {
  hideNotifications?: boolean;
  hideProfile?: boolean;
  onMobileMenuClick?: () => void;
}
const Header = ({
  hideNotifications = false,
  hideProfile = false,
  onMobileMenuClick,
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { entity, loggedInUserProfileImageUrl, loggedInUserImageStatus } =
    useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  // Permissions
  const isAdmin = currentUser?.userType === UserType.ADMIN;
  const isReceptionist = currentUser?.userType === UserType.RECEPTIONIST;
  const isManager = currentUser?.userType === UserType.MANAGER;
  const isApprover = isAdmin || isManager || isReceptionist;
  const isAdminOrReceptionist = isAdmin || isReceptionist;
  const {
    notifications,
    unreadCount: attendanceUnreadCount,
    selectedNotification,
    loading,
  } = useAppSelector((state) => state.notifications);
  const { unread: rawLeaveNotifications, employeeUpdates } = useAppSelector(
    (state) => state.leaveNotification,
  );
  // Filter out Cancelled requests from Approver notifications
  const leaveNotifications = rawLeaveNotifications.filter(
    (n) => n.status !== LeaveRequestStatus.CANCELLED,
  );
  // Total count for the bell bubble
  const unreadCount = isApprover
    ? leaveNotifications.length
    : attendanceUnreadCount + employeeUpdates.length;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const notificationRef = useRef<HTMLDivElement>(null);
  // Helper to format split-day request types
  const formatRequestTypeLabel = (notification: LeaveNotification) => {
    const { firstHalf, secondHalf, requestType } = notification;
    if (firstHalf && secondHalf) {
      if (firstHalf === secondHalf) {
        return firstHalf === LeaveRequestType.APPLY_LEAVE ||
          firstHalf === LeaveRequestType.LEAVE
          ? LeaveRequestType.LEAVE
          : firstHalf;
      }
      const f =
        firstHalf === LeaveRequestType.APPLY_LEAVE ||
        firstHalf === LeaveRequestType.LEAVE
          ? LeaveRequestType.LEAVE
          : firstHalf;
      const s =
        secondHalf === LeaveRequestType.APPLY_LEAVE ||
        secondHalf === LeaveRequestType.LEAVE
          ? LeaveRequestType.LEAVE
          : secondHalf;
      if (f === WorkLocation.OFFICE) return s;
      if (s === WorkLocation.OFFICE) return f;
      return `${f} + ${s}`;
    }
    return requestType === LeaveRequestType.APPLY_LEAVE
      ? LeaveRequestType.LEAVE
      : requestType;
  };
  // Fetch notifications on mount
  useEffect(() => {
    if (isApprover) {
      dispatch(fetchUnreadNotifications());
    }
    // Employee updates apply to anyone with an employee record (including Managers viewing their own)
    if (entity?.employeeId && currentUser) {
      if (!isAdmin) {
        dispatch(fetchNotifications(entity?.employeeId));
        dispatch(fetchEmployeeUpdates(entity?.employeeId));
      }
    }
  }, [dispatch, isApprover, isAdmin, entity?.employeeId]);
  const handleNotificationClick = (id: number) => {
    dispatch(fetchNotificationDetails(id));
    setViewMode("detail");
  };
  const handleBackToList = () => {
    setViewMode("list");
    dispatch(clearSelectedNotification());
  };
  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
    setViewMode("list");
    dispatch(clearSelectedNotification());
  };
  const handleCloseProfile = () => {
    setIsDropdownOpen(false);
  };
  const handleMarkAsRead = (
    id: number,
    type?: "leave" | "attendance" | "status_update",
  ) => {
    if (isApprover && type !== "status_update" && type !== "attendance") {
      dispatch(markLeaveNotifRead(id));
      setViewMode("list");
    } else {
      if (type === "status_update") {
        dispatch(markEmployeeUpdateRead(id));
      } else {
        dispatch(markNotificationRead(id));
      }
    }
  };
  const handleMarkAllAsRead = () => {
    if (isApprover) {
      dispatch(markAllLeaveRequestsRead());
    }
    // Also mark own notifications as read if not only an admin
    if (!isAdmin && entity?.employeeId) {
      dispatch(markAllNotificationsRead(entity.employeeId));
      dispatch(markAllEmployeeUpdatesRead(entity.employeeId));
    }
  };
  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false); // Close dropdown first
      await dispatch(logoutUser()).unwrap();
      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();
      // Navigate to landing page without splash
      navigate("/landing", { state: { skipSplash: true } });
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local state and navigate
      localStorage.clear();
      sessionStorage.clear();
      navigate("/landing", { state: { skipSplash: true } });
    }
  };
  const handleProfileClick = () => {
    if (currentUser?.userType === UserType.MANAGER) {
      navigate("/manager-dashboard/my-profile");
    } else if (isAdminOrReceptionist) {
      navigate("/admin-dashboard/my-profile");
    } else {
      navigate("/employee-dashboard/my-profile");
    }
    setIsDropdownOpen(false);
  };
  const handleLogoClick = () => {
    navigate(
      isAdminOrReceptionist ? "/admin-dashboard" : "/employee-dashboard",
    );
  };
  // Fetch profile image - ONLY for the logged-in user, not the viewed entity (if Admin)
  // Fetch profile image - ONLY for the logged-in user, not the viewed entity (if Admin)
  useEffect(() => {
    if (isAdmin || isReceptionist) return;
    // Only fetch if we don't have the image yet (e.g. initial load or after upload invalidation)
    // AND if we are not currently fetching or failed previously
    if (loggedInUserProfileImageUrl) return;
    // Use loginId (alphanumeric) as reliable fallback if employeeId is missing.
    // The backend endpoint /profile-image/:id/view expects the alphanumeric EmployeeID (e.g. "ITE123"), NOT the user UUID.
    const profileId =
      currentUser?.employeeId || currentUser?.loginId || currentUser?.id;
    const shouldFetch =
      !loggedInUserProfileImageUrl &&
      (loggedInUserImageStatus === "idle" ||
        loggedInUserImageStatus === undefined);
    if (profileId && shouldFetch) {
      dispatch(fetchLoggedInUserProfileImage(String(profileId)));
    }
  }, [
    dispatch,
    currentUser?.employeeId,
    currentUser?.loginId,
    currentUser?.id,
    isAdmin,
    isReceptionist,
    loggedInUserProfileImageUrl,
    loggedInUserImageStatus,
  ]);
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileHeaderViewport()) return;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        handleCloseNotifications();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header
      className="header"
      style={{
        background:
          "linear-gradient(37deg, #3B82F6 4.06%, #2563EB 62.76%, #1E3A8A 121.45%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="header-container relative">
        {/* Desktop Logo (Left side) */}
        <div
          className="header-desktop-logo p-[1px] bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-2xl shadow-[0_8px_30px_rgba(59,130,246,0.15)] cursor-pointer"
          onClick={handleLogoClick}
        >
          <div className="px-4 py-1 bg-white rounded-[12px]">
            <img
              src={workspherelogo}
              alt="WorkSphere Logo"
              className="header-desktop-logo-img w-auto object-contain"
            />
          </div>
        </div>
        <MobileHeader
          logoSrc={worksphereLogo}
          onLogoClick={handleLogoClick}
          onMenuClick={onMobileMenuClick}
        />
        <div className="header-actions flex items-center ml-auto">
          {/* Notification Bell */}
          {!hideNotifications && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsNotificationOpen((prev) =>
                    isMobileHeaderViewport() ? true : !prev,
                  );
                }}
                className={`notification-trigger relative p-2 rounded-xl transition-all group ${
                  isNotificationOpen
                    ? "bg-white text-[#4318FF]"
                    : "hover:bg-white/10 text-white"
                }`}
              >
                <Bell
                  size={18}
                  className={`group-hover:scale-110 transition-transform ${
                    isNotificationOpen ? "fill-current" : ""
                  }`}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm border border-white/20 px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {/* Modern Notification Popup */}
              {isNotificationOpen && (
                <div className="notification-popover bg-white rounded-3xl shadow-[0px_20px_60px_-10px_rgba(0,0,0,0.15)] ring-1 ring-gray-100 z-[10000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {viewMode === "list" ? (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                        <h3 className="text-lg font-bold text-[#1B2559]">
                          Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                          {/* Show "Mark all as read" for everyone except Receptionist, but handle scoped marks */}
                          {!isReceptionist && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs font-bold text-[#4318FF] hover:bg-blue-50 px-3 py-1 rounded-lg transition-all active:scale-95"
                            >
                              Mark all as read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleCloseNotifications}
                            className="panel-close-button p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                            aria-label="Close notifications"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      {/* Tabs */}
                      <div className="flex items-center gap-6 px-6 border-b border-gray-50">
                        <button className="py-3 text-sm font-bold text-[#1B2559] border-b-2 border-[#1B2559] relative">
                          {isApprover ? "Pending Approvals" : "Inbox"}
                          <span className="ml-2 bg-[#1B2559] text-white text-[10px] px-1.5 py-0.5 rounded-md">
                            {unreadCount}
                          </span>
                        </button>
                      </div>
                      {/* Notification List */}
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {isApprover ? (
                          leaveNotifications.length > 0 ? (
                            leaveNotifications.map((notif) => {
                              const getNotificationContent = (
                                notif: LeaveNotification,
                              ) => {
                                const formattedType =
                                  formatRequestTypeLabel(notif);
                                let title = `${formattedType} Request`;
                                let message = (
                                  <>
                                    <span className="font-bold text-[#2B3674]">
                                      {notif.employeeName}
                                    </span>{" "}
                                    applied for {formattedType}.
                                  </>
                                );
                                let iconColorClass =
                                  "bg-blue-100 text-[#4318FF]"; // Default

                                // Logic for Cancellations & Modifications
                                if (
                                  notif.status ===
                                  LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                                ) {
                                  title = `Cancellation Request`;
                                  message = (
                                    <>
                                      <span className="font-bold text-[#2B3674]">
                                        {notif.employeeName}
                                      </span>{" "}
                                      requested to{" "}
                                      <span className="font-bold text-red-600">
                                        Cancel
                                      </span>{" "}
                                      an approved{" "}
                                      <span className="font-bold">
                                        {formattedType}
                                      </span>
                                      .
                                    </>
                                  );
                                  iconColorClass = "bg-red-100 text-red-600";
                                } else if (
                                  notif.status ===
                                  LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
                                ) {
                                  title = `Modification Request`;
                                  message = (
                                    <>
                                      <span className="font-bold text-[#2B3674]">
                                        {notif.employeeName}
                                      </span>{" "}
                                      requested to{" "}
                                      <span className="font-bold text-orange-600">
                                        Modify
                                      </span>{" "}
                                      an approved{" "}
                                      <span className="font-bold">
                                        {formattedType}
                                      </span>
                                      .
                                    </>
                                  );
                                  iconColorClass =
                                    "bg-orange-100 text-orange-600";
                                } else if (
                                  notif.status === LeaveRequestStatus.CANCELLED
                                ) {
                                  title = `Request Cancelled`;
                                  message = (
                                    <>
                                      <span className="font-bold text-[#2B3674]">
                                        {notif.employeeName}
                                      </span>{" "}
                                      cancelled their pending{" "}
                                      <span className="font-bold">
                                        {formattedType}
                                      </span>{" "}
                                      request.
                                    </>
                                  );
                                  iconColorClass = "bg-red-50 text-red-500";
                                }
                                return { title, message, iconColorClass };
                              };
                              const { title, message, iconColorClass } =
                                getNotificationContent(notif);
                              return (
                                <div
                                  key={notif.id}
                                  onClick={() => {
                                    navigate(
                                      isAdminOrReceptionist
                                        ? "/admin-dashboard/requests"
                                        : "/manager-dashboard/requests",
                                    );
                                    setIsNotificationOpen(false);
                                  }}
                                  className={`flex gap-4 p-5 hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer relative bg-blue-50/30`}
                                >
                                  {/* Avatar */}
                                  <div className="relative shrink-0">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColorClass}`}
                                    >
                                      <Bell size={18} />
                                    </div>
                                  </div>
                                  {/* Content */}
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                      <p className="text-sm text-[#1B2559] leading-snug font-bold">
                                        {title}
                                      </p>
                                      {!isReceptionist && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notif.id);
                                          }}
                                          className="text-[10px] text-[#4318FF] hover:underline font-bold"
                                        >
                                          Dismiss
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-gray-500 font-medium">
                                        {message}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        {dayjs(notif.fromDate).format(
                                          "YYYY-MM-DD",
                                        )}{" "}
                                        to{" "}
                                        {dayjs(notif.toDate).format(
                                          "YYYY-MM-DD",
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <Bell size={24} className="text-gray-300" />
                              </div>
                              <p className="text-sm font-bold text-[#1B2559]">
                                No new requests
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                All leave applications have been reviewed.
                              </p>
                            </div>
                          )
                        ) : (
                          /* Employee View -- Mixed Notifications */
                          <>
                            {/* Status Updates Section */}
                            {employeeUpdates.length > 0 && (
                              <div className="border-b border-gray-100 pb-2 mb-2">
                                <h4 className="px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  Updates
                                </h4>
                                {employeeUpdates.map((update) => {
                                  const getEmployeeNotificationContent = (
                                    update: LeaveNotification,
                                  ) => {
                                    const formattedType =
                                      formatRequestTypeLabel(update);
                                    let title = `Request ${update.status}`;
                                    let message = (
                                      <>
                                        Your{" "}
                                        <span className="font-bold text-[#2B3674]">
                                          {formattedType}
                                        </span>{" "}
                                        request has been{" "}
                                        <span
                                          className={`font-bold ${update.status === LeaveRequestStatus.APPROVED ? "text-green-600" : "text-red-600"}`}
                                        >
                                          {update.status}
                                        </span>
                                        .
                                      </>
                                    );
                                    let icon = (
                                      <LogOut size={18} className="rotate-45" />
                                    ); // Default icon
                                    let iconBg = "bg-gray-500";

                                    // Case 1: Cancellation Approved
                                    if (
                                      update.status ===
                                      LeaveRequestStatus.CANCELLATION_APPROVED
                                    ) {
                                      title = "Cancellation Approved";
                                      message = (
                                        <>
                                          Your request to cancel{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {formattedType}
                                          </span>{" "}
                                          has been{" "}
                                          <span className="font-bold text-green-600">
                                            Approved
                                          </span>
                                          .
                                        </>
                                      );
                                      icon = <Check size={18} />;
                                      iconBg = "bg-green-500";
                                    }
                                    // Case 2: Cancellation Rejected
                                    else if (
                                      update.status ===
                                      LeaveRequestStatus.CANCELLATION_REJECTED
                                    ) {
                                      title = "Cancellation Rejected";
                                      message = (
                                        <>
                                          Your request to cancel{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {formattedType}
                                          </span>{" "}
                                          has been{" "}
                                          <span className="font-bold text-red-600">
                                            Rejected
                                          </span>
                                          .
                                        </>
                                      );
                                      icon = (
                                        <LogOut
                                          size={18}
                                          className="rotate-45"
                                        />
                                      );
                                      iconBg = "bg-red-500";
                                    }
                                    // Case 3: Standard Approval
                                    else if (
                                      update.status ===
                                      LeaveRequestStatus.APPROVED
                                    ) {
                                      title = "Request Approved";
                                      icon = <Check size={18} />;
                                      iconBg = "bg-green-500";
                                    }
                                    // Case 4: Standard Rejection
                                    else if (
                                      update.status ===
                                      LeaveRequestStatus.REJECTED
                                    ) {
                                      title = "Request Rejected";
                                      message = (
                                        <>
                                          Your request for{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {formattedType}
                                          </span>{" "}
                                          has been{" "}
                                          <span className="font-bold text-red-600">
                                            Rejected
                                          </span>
                                          .
                                        </>
                                      );
                                      icon = <X size={18} />;
                                      iconBg = "bg-red-500";
                                    }
                                    // Case 5: Request Modified
                                    else if (
                                      update.status ===
                                      LeaveRequestStatus.REQUEST_MODIFIED
                                    ) {
                                      const rawSource =
                                        update.requestModifiedFrom &&
                                        update.requestModifiedFrom.includes(":")
                                          ? update.requestModifiedFrom.split(
                                              ":",
                                            )[1]
                                          : update.requestModifiedFrom;
                                      const source =
                                        rawSource ===
                                        LeaveRequestType.APPLY_LEAVE
                                          ? LeaveRequestType.LEAVE
                                          : rawSource;
                                      title = "Request Modified";
                                      message = (
                                        <>
                                          Your{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {formattedType}
                                          </span>{" "}
                                          request has been{" "}
                                          <span className="font-bold text-orange-600">
                                            Modified
                                          </span>{" "}
                                          due to new request on same date{" "}
                                          {source}.
                                        </>
                                      );
                                      icon = <RotateCcw size={18} />;
                                      iconBg = "bg-orange-500";
                                    }
                                    // Case 6: Modification Approved
                                    else if (
                                      update.status ===
                                      LeaveRequestStatus.MODIFICATION_APPROVED
                                    ) {
                                      title = "Modification Approved";
                                      message = (
                                        <>
                                          Your request to modify{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {formattedType}
                                          </span>{" "}
                                          has been{" "}
                                          <span className="font-bold text-green-600">
                                            Approved
                                          </span>
                                          .
                                        </>
                                      );
                                      icon = <Check size={18} />;
                                      iconBg = "bg-green-500";
                                    }
                                    // Case 7: Modification Rejected or Cancelled
                                    else if (
                                      update.status ===
                                        LeaveRequestStatus.MODIFICATION_REJECTED ||
                                      update.status ===
                                        LeaveRequestStatus.MODIFICATION_CANCELLED
                                    ) {
                                      title = "Modification Rejected";
                                      message = (
                                        <>
                                          Your request to modify{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {formattedType}
                                          </span>{" "}
                                          has been{" "}
                                          <span className="font-bold text-red-600">
                                            Rejected
                                          </span>
                                          .
                                        </>
                                      );
                                      icon = <X size={18} />;
                                      iconBg = "bg-red-500";
                                    }
                                    return { title, message, icon, iconBg };
                                  };
                                  const { title, message, icon, iconBg } =
                                    getEmployeeNotificationContent(update);
                                  return (
                                    <div
                                      key={`update-${update.id}`}
                                      onClick={() => {
                                        navigate(
                                          "/employee-dashboard/leave-management",
                                        );
                                        setIsNotificationOpen(false);
                                      }}
                                      className="flex gap-4 p-5 hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer relative bg-green-50/30"
                                    >
                                      <div className="relative shrink-0">
                                        <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${iconBg}`}
                                        >
                                          {icon}
                                        </div>
                                      </div>
                                      <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                          <p className="text-sm text-[#1B2559] leading-snug font-bold">
                                            {title}
                                          </p>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMarkAsRead(
                                                update.id,
                                                "status_update",
                                              );
                                            }}
                                            className="text-[10px] text-[#4318FF] hover:underline font-bold"
                                          >
                                            Dismiss
                                          </button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-xs text-gray-500 font-medium">
                                            {message}
                                          </span>
                                          <span className="text-[10px] text-gray-400">
                                            {dayjs(update.fromDate).format(
                                              "YYYY-MM-DD",
                                            )}{" "}
                                            to{" "}
                                            {dayjs(update.toDate).format(
                                              "YYYY-MM-DD",
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {/* Regular Notifications */}
                            {notifications.length > 0
                              ? notifications.map((notif) => (
                                  <div
                                    key={notif.id}
                                    onClick={() =>
                                      handleNotificationClick(notif.id)
                                    }
                                    className={`flex gap-4 p-5 hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer relative ${
                                      !notif.isRead ? "bg-blue-50/30" : ""
                                    }`}
                                  >
                                    <div className="relative shrink-0">
                                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#4318FF]">
                                        <Bell size={18} />
                                      </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm text-[#1B2559] leading-snug">
                                          <span className="font-bold">
                                            {notif.title}
                                          </span>
                                        </p>
                                        {!notif.isRead && (
                                          <span className="w-2 h-2 bg-[#4318FF] rounded-full shrink-0 mt-1.5"></span>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500 font-medium line-clamp-2">
                                          {notif.message}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          {new Date(
                                            notif.createdAt,
                                          ).toLocaleDateString()}{" "}
                                          {new Date(
                                            notif.createdAt,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              : employeeUpdates.length === 0 && (
                                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                      <Bell
                                        size={24}
                                        className="text-gray-300"
                                      />
                                    </div>
                                    <p className="text-sm font-bold text-[#1B2559]">
                                      No new notifications
                                    </p>
                                  </div>
                                )}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Detail View */
                    <div className="flex flex-col h-[400px]">
                      {/* Back Header */}
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
                        <button
                          onClick={handleBackToList}
                          className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-[#1B2559]">
                          Message
                        </h3>
                        <button
                          type="button"
                          onClick={handleCloseNotifications}
                          className="panel-close-button ml-auto p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                          aria-label="Close notifications"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {loading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                          </div>
                        ) : selectedNotification ? (
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
                                <Bell size={24} />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-[#1B2559] leading-tight mb-2">
                                  {selectedNotification.title}
                                </h2>
                                <p className="text-xs font-bold text-gray-400">
                                  {new Date(
                                    selectedNotification.createdAt,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    selectedNotification.createdAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {selectedNotification.message}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500">
                            Notification not found
                          </div>
                        )}
                      </div>
                      {/* Footer Actions */}
                      {selectedNotification &&
                        !selectedNotification.isRead &&
                        !isReceptionist && (
                          <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                            <button
                              onClick={() =>
                                handleMarkAsRead(selectedNotification.id)
                              }
                              className="w-full py-3 rounded-xl bg-[#4318FF] text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Check size={18} />
                              Mark as Read
                            </button>
                          </div>
                        )}
                      {selectedNotification && selectedNotification.isRead && (
                        <div className="p-6 border-t border-gray-50 bg-gray-50/50 text-center">
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">
                            <Check size={14} /> Read
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Profile Dropdown */}
          {!hideProfile && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  handleCloseNotifications();
                  setIsDropdownOpen((prev) =>
                    isMobileHeaderViewport() ? true : !prev,
                  );
                }}
                className="profile-trigger flex items-center gap-1.5 px-1.5 py-1.5 hover:bg-white/10 rounded-xl transition-all"
              >
                <div className="w-8 h-8 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm uppercase">
                  {loggedInUserProfileImageUrl && !imageError ? (
                    <img
                      src={loggedInUserProfileImageUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setImageError(true)}
                    />
                  ) : // Grabs the first letter of the username, defaulting to '?' if name is missing
                  currentUser?.aliasLoginName ? (
                    currentUser.aliasLoginName.charAt(0)
                  ) : (
                    "?"
                  )}
                </div>
                {/* User info */}
                <div className="profile-user-info flex flex-col items-start min-w-[70px]">
                  <span className="text-sm font-bold text-white truncate max-w-[100px]">
                    {isAdmin
                      ? "Admin"
                      : isReceptionist
                        ? "Receptionist"
                        : currentUser?.aliasLoginName?.split(" ")[0] || "User"}
                  </span>
                  <span className="text-[11px] text-blue-100/80 truncate max-w-[100px]">
                    {isAdmin
                      ? "Administrator"
                      : isReceptionist
                        ? "View only"
                        : isManager
                          ? "Manager"
                          : "Employee"}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-blue-100 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="profile-menu bg-white rounded-xl shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isAdmin ? (
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-bold text-[#1B2559]">Admin</p>
                      <p className="text-xs text-[#667eea] font-medium">
                        Administrator
                      </p>
                    </div>
                  ) : isReceptionist ? (
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-bold text-[#1B2559]">
                        Receptionist
                      </p>
                      <p className="text-xs text-[#667eea] font-medium">
                        View only · Download &amp; Export allowed
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      {/* User Information */}
                      <div>
                        <p className="text-sm font-bold text-[#1B2559]">
                          {location.pathname.includes("/employee-dashboard") ||
                          location.pathname.includes(
                            "/manager-dashboard/leave-management",
                          ) ||
                          location.pathname.includes("/manager-dashboard/my") ||
                          location.pathname.includes(
                            "/admin-dashboard/my-profile",
                          ) ||
                          location.pathname === "/manager-dashboard" ||
                          location.pathname === "/admin-dashboard"
                            ? currentUser?.aliasLoginName || "User"
                            : entity?.fullName ||
                              entity?.name ||
                              currentUser?.aliasLoginName ||
                              "User"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {location.pathname.includes("/employee-dashboard") ||
                          location.pathname.includes(
                            "/manager-dashboard/leave-management",
                          ) ||
                          location.pathname.includes("/manager-dashboard/my") ||
                          location.pathname.includes(
                            "/admin-dashboard/my-profile",
                          ) ||
                          location.pathname === "/manager-dashboard" ||
                          location.pathname === "/admin-dashboard"
                            ? currentUser?.loginId || ""
                            : entity?.email || currentUser?.loginId || ""}
                        </p>
                      </div>
                      {/* Close Button (Gray "X" alignment) */}
                      <button
                        type="button"
                        onClick={handleCloseProfile}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close profile menu"
                      >
                        <X size={22} className="stroke-[2.5]" />
                      </button>
                    </div>
                  )}

                  {/* Account Settings - Only show for employees (not Admin/Receptionist in this block; Receptionist can use Change Password from sidebar) */}
                  {!isAdminOrReceptionist && (
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <User size={16} className="text-[#667eea]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1B2559]">
                          Account Settings
                        </p>
                        <p className="text-xs text-gray-400">
                          View your profile
                        </p>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100">
                        <LogOut size={16} className="text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-600">
                          Logout
                        </p>
                        <p className="text-xs text-gray-400">
                          Sign out of your account
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
