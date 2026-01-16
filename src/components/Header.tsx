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

        <div className="flex items-center gap-4 ml-auto">
          <Link
            to="/about"
            className={`nav-link ${
              location.pathname === "/about" ? "active" : ""
            }`}
          >
            About
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 font-medium text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
