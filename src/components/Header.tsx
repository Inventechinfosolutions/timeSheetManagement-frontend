import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAppDispatch } from "../hooks";
import { logoutUser } from "../reducers/user.reducer";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/landing");
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          {/* <Link to="/" className="logo-link"> */}
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
          {/* </Link> */}
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

// <nav className="header-nav">

//   <Link
//     to="/landing"
//     className={`nav-link ${location.pathname === '/landing' ? 'active' : ''}`}
//   >
//     Login
//   </Link>

//   <Link
//     to="/about"
//     className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
//   >
//     About
//   </Link>

// </nav>
