import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Bell, User, ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { logoutUser } from "../reducers/user.reducer";
import { fetchProfileImage } from "../reducers/employeeDetails.reducer";
import { useState, useRef, useEffect } from "react";
import defaultAvatar from "../assets/default-avatar.jpg";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { entity, profileImageUrl } = useAppSelector(
    (state) => state.employeeDetails,
  );
  const { currentUser } = useAppSelector((state) => state.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = currentUser?.userType === "ADMIN";

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
    navigate("/employee-dashboard/my-profile");
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
    // If the user is an admin, we don't want the header to change based on the viewed entity.
    // In this system, admins show "A" by default. If we eventually want an admin image,
    // we should fetch it based on currentUser.id, not entity.id.
    if (isAdmin) return;

    const profileId = entity?.employeeId || entity?.id;
    if (profileId) {
      dispatch(fetchProfileImage(String(profileId)));
    }
  }, [dispatch, entity?.employeeId, entity?.id, isAdmin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
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
      <div className="header-container">
        <div className="header-logo">
          <div className="relative overflow-hidden rounded-xl bg-white/10 p-1.5 shadow-lg ring-1 ring-white/20 w-[208px] backdrop-blur-md">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>

            <div className="relative flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md shadow-inner ring-1 ring-white/30">
                <div className="h-6 w-6 bg-white rounded-md flex items-center justify-center">
                  <span className="text-[5px] font-bold text-[#0093E9]">
                    InvenTech
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold leading-none text-white tracking-wide drop-shadow-sm mb-0.5">
                  InvenTech
                </span>
                <span className="text-[6px] font-medium tracking-widest text-blue-50/90 whitespace-nowrap leading-none">
                  INFO SOLUTIONS PVT. LTD.
                </span>
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/about"
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 
            ${
              location.pathname === "/about"
                ? "bg-white text-[#4318FF] shadow-lg"
                : "text-white hover:bg-white/10"
            }`}
        >
          About
        </Link>

        <div className="flex items-center gap-3 ml-auto">
          {/* Notification Bell */}
          {!isAdmin && (
            <button className="relative p-2 hover:bg-white/10 rounded-xl transition-all group">
              <Bell
                size={20}
                className="text-white group-hover:scale-110 transition-transform"
              />
              <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] border border-white/20"></span>
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm shadow-inner ring-1 ring-white/30 overflow-hidden">
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
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-bold text-white transition-colors">
                    {isAdmin
                      ? "Admin"
                      : entity?.firstName ||
                        entity?.fullName?.split(" ")[0] ||
                        "User"}
                  </span>
                  <span className="text-xs text-blue-100/80">
                    {isAdmin
                      ? "Administrator"
                      : entity?.employeeId || "Employee"}
                  </span>
                </div>
                <ChevronDown
                  size={16}
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
                      <p className="text-xs text-gray-400">View your profile</p>
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
        </div>
      </div>
    </header>
  );
};

export default Header;
