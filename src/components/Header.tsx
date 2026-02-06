import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { useAppDispatch, useAppSelector } from "../hooks";
import { logoutUser } from "../reducers/user.reducer";
import { fetchProfileImage } from "../reducers/employeeDetails.reducer";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchNotificationDetails,
  clearSelectedNotification,
} from "../reducers/notification.reducer";
import { useState, useRef, useEffect } from "react";
import {
  fetchUnreadNotifications,
  fetchEmployeeUpdates,
  markAsRead as markLeaveNotifRead,
  markEmployeeUpdateRead,
  markAllAsRead as markAllLeaveRequestsRead,
  markAllEmployeeUpdatesRead,
  LeaveNotification,
} from "../reducers/leaveNotification.reducer";
import "./Header.css";
import InventLogo from "../assets/invent-logo.svg";

interface HeaderProps {
  hideNotifications?: boolean;
  hideProfile?: boolean;
}

const Header = ({
  hideNotifications = false,
  hideProfile = false,
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { entity, profileImageUrl } = useAppSelector(
    (state) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state) => state.user);
  // Check if user is admin
  const isAdmin = currentUser?.userType === "ADMIN";

  const {
    notifications,
    unreadCount: attendanceUnreadCount,
    selectedNotification,
    loading,
  } = useAppSelector((state) => state.notifications);
  const { unread: rawLeaveNotifications, employeeUpdates } = useAppSelector(
    (state) => state.leaveNotification,
  );

  // Filter out Cancelled requests from Admin notifications
  const leaveNotifications = rawLeaveNotifications.filter(
    (n) => n.status !== "Cancelled",
  );

  const unreadCount = isAdmin
    ? leaveNotifications.length
    : attendanceUnreadCount + employeeUpdates.length;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUnreadNotifications());
    } else if (entity?.employeeId) {
      dispatch(fetchNotifications(entity?.employeeId));
      dispatch(fetchEmployeeUpdates(entity?.employeeId));
    }
  }, [dispatch, isAdmin, entity?.employeeId]);

  const handleNotificationClick = (id: number) => {
    dispatch(fetchNotificationDetails(id));
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    dispatch(clearSelectedNotification());
  };

  const handleMarkAsRead = (
    id: number,
    type?: "leave" | "attendance" | "status_update",
  ) => {
    if (isAdmin) {
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
    const notificationId = isAdmin
      ? currentUser?.employeeId
      : entity?.employeeId;
    if (notificationId) {
      // 1. Mark Generic Notifications as Read
      dispatch(markAllNotificationsRead(notificationId));

      // 2. Mark Leave Notifications as Read
      if (isAdmin) {
        dispatch(markAllLeaveRequestsRead());
      } else {
        dispatch(markAllEmployeeUpdatesRead(notificationId));
      }
    }
  };

  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false); // Close dropdown first
      await dispatch(logoutUser()).unwrap();
      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();
      // Navigate to landing page
      navigate("/landing");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local state and navigate
      localStorage.clear();
      sessionStorage.clear();
      navigate("/landing");
    }
  };

  const handleProfileClick = () => {
    if (currentUser?.userType === "MANAGER") {
      navigate("/manager-dashboard/my-profile");
    } else if (currentUser?.userType === "ADMIN") {
      navigate("/admin-dashboard/my-profile");
    } else {
      navigate("/employee-dashboard/my-profile");
    }
    setIsDropdownOpen(false);
  };

  // Get first letter of name for avatar fallback
  const avatarLetter = isAdmin
    ? "A"
    : entity?.fullName?.charAt(0)?.toUpperCase() ||
      entity?.name?.charAt(0)?.toUpperCase() ||
      "U";

  // Fetch profile image - ONLY for the logged-in user, not the viewed entity (if Admin)
  useEffect(() => {
    if (isAdmin) return;
    const profileId = entity?.employeeId || entity?.id;
    if (profileId) {
      dispatch(fetchProfileImage(String(profileId)));
    }
  }, [dispatch, entity?.employeeId, entity?.id, isAdmin]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
        setIsNotificationOpen(false);
        // Reset view mode when closing
        if (!isNotificationOpen) {
          // Only reset if it was open
          setViewMode("list");
          dispatch(clearSelectedNotification());
        }
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
        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/20 cursor-pointer">
          <img
            src={InventLogo}
            alt="InvenTech Logo"
            className="h-8 w-auto object-contain brightness-0 invert"
            onClick={() =>
              navigate(isAdmin ? "/admin-dashboard" : "/employee-dashboard")
            }
          />
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 ml-auto">
          <Link
            to="/about"
            className={`px-3 py-1.5 rounded-xl font-bold text-sm md:text-[15px] transition-all duration-200 
                ${
                  location.pathname === "/about"
                    ? "bg-white text-[#4318FF] shadow-lg"
                    : "text-white hover:bg-white/10"
                }`}
          >
            About
          </Link>

          {/* Notification Bell */}
          {!hideNotifications && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative p-2 rounded-xl transition-all group ${
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
                <div className="fixed md:absolute left-[16px] right-[16px] md:left-auto md:right-0 top-[110px] md:top-auto md:mt-3 md:w-[400px] bg-white rounded-3xl shadow-[0px_20px_60px_-10px_rgba(0,0,0,0.15)] ring-1 ring-gray-100 z-[10000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top md:origin-top-right">
                  {viewMode === "list" ? (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                        <h3 className="text-lg font-bold text-[#1B2559]">
                          Notifications
                        </h3>
                        {!isAdmin && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-bold text-[#4318FF] hover:bg-blue-50 px-3 py-1 rounded-lg transition-all active:scale-95"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* Tabs */}
                      <div className="flex items-center gap-6 px-6 border-b border-gray-50">
                        <button className="py-3 text-sm font-bold text-[#1B2559] border-b-2 border-[#1B2559] relative">
                          Inbox
                          <span className="ml-2 bg-[#1B2559] text-white text-[10px] px-1.5 py-0.5 rounded-md">
                            {unreadCount}
                          </span>
                        </button>
                      </div>

                      {/* Notification List */}
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {isAdmin ? (
                          leaveNotifications.length > 0 ? (
                              leaveNotifications.map((notif) => {
                                const getNotificationContent = (
                                  notif: LeaveNotification,
                                ) => {
                                  let title = `${notif.requestType} Request`;
                                  let message = (
                                    <>
                                      <span className="font-bold text-[#2B3674]">
                                        {notif.employeeName}
                                      </span>{" "}
                                      applied for {notif.requestType}.
                                    </>
                                  );
                                  let iconColorClass =
                                    "bg-blue-100 text-[#4318FF]"; // Default

                                  // Logic for Cancellations
                                  if (
                                    notif.status ===
                                    "Requesting for Cancellation"
                                  ) {
                                    title = `Cancellation Request`;
                                    message = (
                                      <>
                                        <span className="font-bold text-[#2B3674]">
                                          {notif.employeeName}
                                        </span>{" "}
                                        requested to cancel an approved{" "}
                                        <span className="font-bold">
                                          {notif.requestType}
                                        </span>
                                        .
                                      </>
                                    );
                                    iconColorClass =
                                      "bg-orange-100 text-orange-600";
                                  } else if (notif.status === "Cancelled") {
                                    title = `Request Cancelled`;
                                    message = (
                                      <>
                                        <span className="font-bold text-[#2B3674]">
                                          {notif.employeeName}
                                        </span>{" "}
                                        cancelled their pending{" "}
                                        <span className="font-bold">
                                          {notif.requestType}
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
                                      navigate("/admin-dashboard/requests");
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
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notif.id);
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
                                          {String(notif.fromDate).split("T")[0]}{" "}
                                          to{" "}
                                          {String(notif.toDate).split("T")[0]}
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
                                    let title = `Request ${update.status}`;
                                    let message = (
                                      <>
                                        Your{" "}
                                        <span className="font-bold text-[#2B3674]">
                                          {update.requestType}
                                        </span>{" "}
                                        request has been{" "}
                                        <span
                                          className={`font-bold ${update.status === "Approved" ? "text-green-600" : "text-red-600"}`}
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
                                      "Cancellation Approved"
                                    ) {
                                      title = "Cancellation Approved";
                                      message = (
                                        <>
                                          Your request to cancel{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {update.requestType}
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
                                      update.status === "Cancellation Rejected"
                                    ) {
                                      title = "Cancellation Rejected";
                                      message = (
                                        <>
                                          Your request to cancel{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {update.requestType}
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
                                    else if (update.status === "Approved") {
                                      title = "Request Approved";
                                      icon = <Check size={18} />;
                                      iconBg = "bg-green-500";
                                    }
                                    // Case 4: Standard Rejection
                                    else if (update.status === "Rejected") {
                                      title = "Request Rejected";
                                      message = (
                                        <>
                                          Your request for{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {update.requestType}
                                          </span>{" "}
                                          has been{" "}
                                          <span className="font-bold text-red-600">
                                            Rejected
                                          </span>
                                          .
                                        </>
                                      );
                                      icon = (
                                        <X
                                          size={18}
                                        />
                                      );
                                      iconBg = "bg-red-500";
                                    }
                                    // Case 5: Request Modified
                                    else if (update.status === "Request Modified") {
                                      const source = update.requestModifiedFrom === "Apply Leave" ? "Leave" : update.requestModifiedFrom;
                                      title = "Request Modified";
                                      message = (
                                        <>
                                          Your{" "}
                                          <span className="font-bold text-[#2B3674]">
                                            {update.requestType}
                                          </span>{" "}
                                          request has been{" "}
                                          <span className="font-bold text-orange-600">
                                            Modified
                                          </span>{" "}
                                          due to new request on same date {source}.
                                        </>
                                      );
                                      icon = <RotateCcw size={18} />;
                                      iconBg = "bg-orange-500";
                                    }
                                    // Case 4: Cancellation Rejected (If we can detect it, usually status is just Rejected)
                                    // If we rely on title or just generic rejection, generic is fine for now.

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
                                            {String(update.fromDate).split(
                                              "T",
                                            )[0]}{" "}
                                            to{" "}
                                            {String(update.toDate).split(
                                              "T",
                                            )[0]}
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
                      {selectedNotification && !selectedNotification.isRead && (
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
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 md:gap-2 pl-2 pr-2 md:px-3 py-1.5 hover:bg-white/10 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm shadow-inner ring-1 ring-white/30 overflow-hidden">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{avatarLetter}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-start translate-y-[1px]">
                    <span className="text-[12px] md:text-sm font-bold text-white transition-colors leading-none">
                      {isAdmin
                        ? "Admin"
                        : entity?.firstName ||
                          entity?.fullName?.split(" ")[0] ||
                          "User"}
                    </span>
                    <span className="text-[9.5px] md:text-[11px] text-blue-100/80 leading-none mt-1">
                      {isAdmin
                        ? "Administrator"
                        : entity?.employeeId || "Employee"}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-blue-100 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isAdmin ? (
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-bold text-[#1B2559]">Admin</p>
                      <p className="text-xs text-[#667eea] font-medium">
                        Administrator
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-[#1B2559]">
                        {entity?.fullName || entity?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {entity?.email || ""}
                      </p>
                    </div>
                  )}

                  {/* My Profile - Only show for employees */}
                  {!isAdmin && (
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <User size={16} className="text-[#667eea]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1B2559]">
                          My Profile
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
