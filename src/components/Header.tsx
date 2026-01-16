import { Link, useNavigate } from "react-router-dom";
import { LogOut, Bell, User, ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { logoutUser } from "../reducers/user.reducer";
import { fetchProfileImage } from "../reducers/employeeDetails.reducer";
import { useState, useRef, useEffect } from "react";
import defaultAvatar from "../assets/default-avatar.jpg";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(defaultAvatar);
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
  const avatarLetter =
    entity?.fullName?.charAt(0)?.toUpperCase() ||
    entity?.name?.charAt(0)?.toUpperCase() ||
    "U";

  // Fetch profile image
  useEffect(() => {
    if (entity?.id) {
      dispatch(fetchProfileImage(entity.id))
        .unwrap()
        .then((blobUrl) => {
          setProfileImage(blobUrl);
        })
        .catch(() => {
          setProfileImage(defaultAvatar);
        });
    }
  }, [dispatch, entity?.id]);

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
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-[#0093E9] to-[#80D0C7] p-1.5 shadow-lg ring-1 ring-white/20 w-[208px]">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>

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
          className={`nav-link ${
            location.pathname === "/about" ? "active" : ""
          }`}
        >
          About
        </Link>

        <div className="flex items-center gap-3 ml-auto">
          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-50 rounded-xl transition-all group">
            <Bell
              size={20}
              className="text-gray-600 group-hover:text-[#667eea]"
            />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold text-sm shadow-md">
                  <span>{avatarLetter}</span>
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-bold text-[#1B2559] group-hover:text-[#667eea] transition-colors">
                    {entity?.firstName ||
                      entity?.fullName?.split(" ")[0] ||
                      "User"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {entity?.employeeId || "Employee"}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0px_20px_50px_0px_#111c440d] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-[#1B2559]">
                    {entity?.fullName || entity?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {entity?.email || ""}
                  </p>
                </div>

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
