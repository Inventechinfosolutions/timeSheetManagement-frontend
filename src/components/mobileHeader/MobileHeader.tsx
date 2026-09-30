import React, { useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  ArrowLeft,
  Check,
  RotateCcw,
  X,
  Menu,
} from "lucide-react";
import { LeaveNotification } from "../../reducers/leaveNotification.reducer";
import { LeaveRequestStatus } from "../../enums";
import workspherelogo from "../../assets/logo_worksphere.png";
import "./MobileHeader.css";

export interface MobileHeaderProps {
  hideNotifications?: boolean;
  hideProfile?: boolean;
  isAdmin: boolean;
  isReceptionist: boolean;
  isManager: boolean;
  isApprover: boolean;
  isAdminOrReceptionist: boolean;
  unreadCount: number;
  leaveNotifications: LeaveNotification[];
  employeeUpdates: LeaveNotification[];
  notifications: any[];
  selectedNotification: any;
  loading: boolean;
  viewMode: "list" | "detail";
  setViewMode: (mode: "list" | "detail") => void;
  handleNotificationClick: (id: number) => void;
  handleBackToList: () => void;
  handleMarkAsRead: (
    id: number,
    type?: "leave" | "attendance" | "status_update",
  ) => void;
  handleMarkAllAsRead: () => void;
  handleLogout: () => void;
  handleProfileClick: () => void;
  formatRequestTypeLabel: (notification: LeaveNotification) => string;
  avatarLetter: string;
  loggedInUserProfileImageUrl?: string | null;
  imageError: boolean;
  setImageError: (val: boolean) => void;
  currentUser: any;
  entity: any;
  location: any;
  navigate: (path: string, options?: any) => void;
}

const MobileHeader = ({
  hideNotifications = false,
  hideProfile = false,
  isAdmin,
  isReceptionist,
  isManager,
  isApprover,
  isAdminOrReceptionist,
  unreadCount,
  leaveNotifications,
  employeeUpdates,
  notifications,
  selectedNotification,
  loading,
  viewMode,
  setViewMode,
  handleNotificationClick,
  handleBackToList,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleLogout,
  handleProfileClick,
  formatRequestTypeLabel,
  avatarLetter,
  loggedInUserProfileImageUrl,
  imageError,
  setImageError,
  currentUser,
  entity,
  location,
  navigate,
}: MobileHeaderProps) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Helper for approver notification content
  const getApproverNotificationContent = (notif: LeaveNotification) => {
    const formattedType = formatRequestTypeLabel(notif);
    let title = `${formattedType} Request`;
    let message = (
      <>
        <span className="font-bold text-[#2B3674]">{notif.employeeName}</span>{" "}
        applied for {formattedType}.
      </>
    );
    let iconColorClass = "bg-blue-100 text-[#4318FF]";

    if (notif.status === LeaveRequestStatus.REQUESTING_FOR_CANCELLATION) {
      title = "Cancellation Request";
      message = (
        <>
          <span className="font-bold text-[#2B3674]">{notif.employeeName}</span>{" "}
          requested to{" "}
          <span className="font-bold text-red-600">Cancel</span> an approved{" "}
          <span className="font-bold">{formattedType}</span>.
        </>
      );
      iconColorClass = "bg-red-100 text-red-600";
    } else if (notif.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION) {
      title = "Modification Request";
      message = (
        <>
          <span className="font-bold text-[#2B3674]">{notif.employeeName}</span>{" "}
          requested to{" "}
          <span className="font-bold text-orange-600">Modify</span> an approved{" "}
          <span className="font-bold">{formattedType}</span>.
        </>
      );
      iconColorClass = "bg-orange-100 text-orange-600";
    } else if (notif.status === LeaveRequestStatus.CANCELLED) {
      title = "Request Cancelled";
      message = (
        <>
          <span className="font-bold text-[#2B3674]">{notif.employeeName}</span>{" "}
          cancelled their pending{" "}
          <span className="font-bold">{formattedType}</span> request.
        </>
      );
      iconColorClass = "bg-red-50 text-red-500";
    }

    return { title, message, iconColorClass };
  };

  // Helper for employee update content
  const getEmployeeNotificationContent = (update: LeaveNotification) => {
    const formattedType = formatRequestTypeLabel(update);
    let title = `Request ${update.status}`;
    let message = (
      <>
        Your <span className="font-bold text-[#2B3674]">{formattedType}</span>{" "}
        request has been{" "}
        <span
          className={`font-bold ${update.status === LeaveRequestStatus.APPROVED ? "text-green-600" : "text-red-600"}`}
        >
          {update.status}
        </span>
        .
      </>
    );
    let icon = <LogOut size={16} className="rotate-45" />;
    let iconBg = "bg-gray-500";

    if (update.status === LeaveRequestStatus.CANCELLATION_APPROVED) {
      title = "Cancellation Approved";
      message = (
        <>
          Your request to cancel{" "}
          <span className="font-bold text-[#2B3674]">{formattedType}</span> has
          been <span className="font-bold text-green-600">Approved</span>.
        </>
      );
      icon = <Check size={16} />;
      iconBg = "bg-green-500";
    } else if (update.status === LeaveRequestStatus.CANCELLATION_REJECTED) {
      title = "Cancellation Rejected";
      message = (
        <>
          Your request to cancel{" "}
          <span className="font-bold text-[#2B3674]">{formattedType}</span> has
          been <span className="font-bold text-red-600">Rejected</span>.
        </>
      );
      icon = <LogOut size={16} className="rotate-45" />;
      iconBg = "bg-red-500";
    } else if (update.status === LeaveRequestStatus.APPROVED) {
      title = "Request Approved";
      icon = <Check size={16} />;
      iconBg = "bg-green-500";
    } else if (update.status === LeaveRequestStatus.REJECTED) {
      title = "Request Rejected";
      message = (
        <>
          Your request for{" "}
          <span className="font-bold text-[#2B3674]">{formattedType}</span> has
          been <span className="font-bold text-red-600">Rejected</span>.
        </>
      );
      icon = <X size={16} />;
      iconBg = "bg-red-500";
    } else if (update.status === LeaveRequestStatus.REQUEST_MODIFIED) {
      const rawSource =
        update.requestModifiedFrom && update.requestModifiedFrom.includes(":")
          ? update.requestModifiedFrom.split(":")[1]
          : update.requestModifiedFrom;
      const source =
        rawSource === "APPLY_LEAVE" ? "LEAVE" : rawSource;
      title = "Request Modified";
      message = (
        <>
          Your <span className="font-bold text-[#2B3674]">{formattedType}</span>{" "}
          request has been{" "}
          <span className="font-bold text-orange-600">Modified</span> due to
          new request on same date {source}.
        </>
      );
      icon = <RotateCcw size={16} />;
      iconBg = "bg-orange-500";
    } else if (update.status === LeaveRequestStatus.MODIFICATION_APPROVED) {
      title = "Modification Approved";
      message = (
        <>
          Your request to modify{" "}
          <span className="font-bold text-[#2B3674]">{formattedType}</span> has
          been <span className="font-bold text-green-600">Approved</span>.
        </>
      );
      icon = <Check size={16} />;
      iconBg = "bg-green-500";
    } else if (
      update.status === LeaveRequestStatus.MODIFICATION_REJECTED ||
      update.status === LeaveRequestStatus.MODIFICATION_CANCELLED
    ) {
      title = "Modification Rejected";
      message = (
        <>
          Your request to modify{" "}
          <span className="font-bold text-[#2B3674]">{formattedType}</span> has
          been <span className="font-bold text-red-600">Rejected</span>.
        </>
      );
      icon = <X size={16} />;
      iconBg = "bg-red-500";
    }

    return { title, message, icon, iconBg };
  };

  return (
    <>
      <header className="mobile-header">
        {/* Organic Background Waves & Gradients */}
        <div className="mobile-header-bg-art">
          <svg
            className="mobile-header-waves-svg"
            viewBox="0 0 400 58"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mhGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="50%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
              <linearGradient id="mhWaveLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.15)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
              </linearGradient>
            </defs>

            {/* Main wave background path - clean organic curve */}
            <path
              d="M0,0 L400,0 L400,53 C330,47 250,48 180,52 C110,56 50,57 0,57 Z"
              fill="url(#mhGradMain)"
            />

            {/* Ambient upper diagonal wave swoop */}
            <path
              d="M0,12 C90,4 180,26 340,8 C370,4 390,6 400,10 L400,0 L0,0 Z"
              fill="url(#mhWaveLight)"
            />

            {/* Floating delicate SVG accent rings for uniqueness */}
            <circle cx="28" cy="8" r="14" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <circle cx="365" cy="42" r="18" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="mobile-header-container">
          {/* Left: Hamburger Menu Button */}
          <button
            type="button"
            aria-label="Open Navigation Menu"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
            }}
            className="mobile-header-menu-btn"
          >
            <Menu size={21} strokeWidth={2.4} className="text-white" />
          </button>

          {/* Center: Logo */}
          <div
            className="mobile-header-logo cursor-pointer active:scale-95 transition-transform"
            onClick={() =>
              navigate(
                isAdminOrReceptionist
                  ? "/admin-dashboard"
                  : "/employee-dashboard",
              )
            }
          >
            <div className="flex items-center">
              <img
                src={workspherelogo}
                alt="WorkSphere Logo"
                className="h-[32px] sm:h-[34px] w-auto object-contain"
              />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="mobile-header-right-group">
            {/* Notification Bell */}
            {!hideNotifications && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsProfileOpen(false);
                  }}
                  className={`mobile-header-bell-btn ${
                    isNotificationOpen ? "active" : ""
                  }`}
                >
                  <Bell
                    size={19}
                    className={`text-white ${
                      isNotificationOpen ? "fill-current" : ""
                    }`}
                  />
                  {unreadCount > 0 && (
                    <span className="mobile-header-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Divider between Bell and Profile */}
            {!hideNotifications && !hideProfile && (
              <div className="mobile-header-divider" />
            )}

            {/* Profile Avatar Button */}
            {!hideProfile && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="User Profile"
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotificationOpen(false);
                  }}
                  className="mobile-header-profile-btn"
                >
                  <div className="mobile-header-avatar-circle">
                    {loggedInUserProfileImageUrl && !imageError ? (
                      <img
                        src={loggedInUserProfileImageUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <span>{avatarLetter}</span>
                    )}
                  </div>
                  <ChevronDown
                    size={15}
                    strokeWidth={2.6}
                    className={`text-white transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      
      {/* MOBILE NOTIFICATION DROPDOWN (LIKE DESKTOP)                    */}
      {isNotificationOpen && (
        <>
          {/* Backdrop to close dropdown on tap outside */}
          <div
            className="mobile-dropdown-backdrop"
            onClick={() => {
              setIsNotificationOpen(false);
              setViewMode("list");
            }}
          />

          <div className="mobile-notification-dropdown">
            {viewMode === "list" ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-[#1B2559]">
                    Notifications
                  </h3>
                  <div className="flex items-center gap-2">
                    {!isReceptionist && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-bold text-[#4318FF] hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      onClick={() => setIsNotificationOpen(false)}
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 px-5 border-b border-gray-100 bg-gray-50/40">
                  <div className="py-2.5 text-xs font-bold text-[#1B2559] border-b-2 border-[#1B2559] relative">
                    {isApprover ? "Pending Approvals" : "Inbox"}
                    <span className="ml-2 bg-[#1B2559] text-white text-[10px] px-1.5 py-0.5 rounded-md">
                      {unreadCount}
                    </span>
                  </div>
                </div>

                {/* Notification List */}
                <div className="mobile-scroll-container max-h-[380px]">
                  {isApprover ? (
                    leaveNotifications.length > 0 ? (
                      leaveNotifications.map((notif) => {
                        const { title, message, iconColorClass } =
                          getApproverNotificationContent(notif);

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
                            className="flex gap-3.5 p-4 hover:bg-gray-50/80 active:bg-blue-50/40 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer relative bg-blue-50/30"
                          >
                            <div className="relative shrink-0">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColorClass}`}
                              >
                                <Bell size={16} />
                              </div>
                            </div>

                            <div className="flex-1 space-y-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <p className="text-xs text-[#1B2559] leading-snug font-bold truncate">
                                  {title}
                                </p>
                                {!isReceptionist && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notif.id);
                                    }}
                                    className="text-[10px] text-[#4318FF] hover:underline font-bold shrink-0"
                                  >
                                    Dismiss
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-500 font-medium leading-snug">
                                  {message}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {dayjs(notif.fromDate).format("YYYY-MM-DD")}{" "}
                                  to {dayjs(notif.toDate).format("YYYY-MM-DD")}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2.5">
                          <Bell size={20} className="text-gray-300" />
                        </div>
                        <p className="text-xs font-bold text-[#1B2559]">
                          No new requests
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          All leave applications have been reviewed.
                        </p>
                      </div>
                    )
                  ) : (
                    /* Employee View */
                    <>
                      {/* Status Updates */}
                      {employeeUpdates.length > 0 && (
                        <div className="border-b border-gray-100 pb-1 mb-1 bg-gray-50/50">
                          <h4 className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Updates
                          </h4>
                          {employeeUpdates.map((update) => {
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
                                className="flex gap-3.5 p-4 hover:bg-gray-50 active:bg-green-50/40 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer relative bg-green-50/30"
                              >
                                <div className="relative shrink-0">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${iconBg}`}
                                  >
                                    {icon}
                                  </div>
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex justify-between items-start gap-1">
                                    <p className="text-xs text-[#1B2559] leading-snug font-bold truncate">
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
                                      className="text-[10px] text-[#4318FF] hover:underline font-bold shrink-0"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-500 font-medium leading-snug">
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
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif.id)}
                            className={`flex gap-3.5 p-4 hover:bg-gray-50 active:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer relative ${
                              !notif.isRead ? "bg-blue-50/30" : ""
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#4318FF]">
                                <Bell size={16} />
                              </div>
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <p className="text-xs text-[#1B2559] leading-snug font-bold truncate">
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 bg-[#4318FF] rounded-full shrink-0 mt-1"></span>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-500 font-medium line-clamp-2 leading-snug">
                                  {notif.message}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(
                                    notif.createdAt,
                                  ).toLocaleDateString()}{" "}
                                  {new Date(notif.createdAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        employeeUpdates.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2.5">
                              <Bell size={20} className="text-gray-300" />
                            </div>
                            <p className="text-xs font-bold text-[#1B2559]">
                              No new notifications
                            </p>
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Detail View in Dropdown */
              <div className="flex flex-col h-[380px]">
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100">
                  <button
                    onClick={handleBackToList}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 active:scale-90 transition-transform"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h3 className="text-base font-bold text-[#1B2559]">Message</h3>
                  <button
                    onClick={() => {
                      setIsNotificationOpen(false);
                      setViewMode("list");
                    }}
                    className="ml-auto w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="flex-1 p-5 mobile-scroll-container">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-7 h-7 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  ) : selectedNotification ? (
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#1B2559] leading-tight mb-1">
                            {selectedNotification.title}
                          </h2>
                          <p className="text-[10px] font-bold text-gray-400">
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

                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                          {selectedNotification.message}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-10 text-xs">
                      Notification not found
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {selectedNotification &&
                  !selectedNotification.isRead &&
                  !isReceptionist && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                      <button
                        onClick={() =>
                          handleMarkAsRead(selectedNotification.id)
                        }
                        className="w-full py-2.5 rounded-xl bg-[#4318FF] text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        Mark as Read
                      </button>
                    </div>
                  )}
                {selectedNotification && selectedNotification.isRead && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold uppercase tracking-wide">
                      <Check size={13} /> Read
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* MOBILE PROFILE DROPDOWN (EXACTLY LIKE DESKTOP)                 */}
      {/* ============================================================== */}
      {isProfileOpen && (
        <>
          {/* Backdrop to close dropdown on tap outside */}
          <div
            className="mobile-dropdown-backdrop"
            onClick={() => setIsProfileOpen(false)}
          />

          <div className="mobile-profile-dropdown">
            {isAdmin ? (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <p className="text-sm font-bold text-[#1B2559]">Admin</p>
                  <p className="text-xs text-[#667eea] font-medium">
                    Administrator
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close Profile Menu"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-90 transition-transform shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ) : isReceptionist ? (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <p className="text-sm font-bold text-[#1B2559]">Receptionist</p>
                  <p className="text-xs text-[#667eea] font-medium">
                    View only · Download &amp; Export allowed
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close Profile Menu"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-90 transition-transform shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-sm font-bold text-[#1B2559] truncate">
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
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
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
                <button
                  type="button"
                  aria-label="Close Profile Menu"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-90 transition-transform shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* About */}
            <Link
              to="/about"
              onClick={() => setIsProfileOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <span className="text-orange-500 font-bold text-sm">i</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1B2559]">About</p>
                <p className="text-xs text-gray-400">Learn more about WorkSphere</p>
              </div>
            </Link>

            {/* Account Settings */}
            {!isAdminOrReceptionist && (
              <button
                onClick={() => {
                  handleProfileClick();
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <User size={16} className="text-[#667eea]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1B2559]">
                    Account Settings
                  </p>
                  <p className="text-xs text-gray-400">View your profile</p>
                </div>
              </button>
            )}

            {/* Logout */}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 shrink-0">
                  <LogOut size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-600">Logout</p>
                  <p className="text-xs text-gray-400">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileHeader;
