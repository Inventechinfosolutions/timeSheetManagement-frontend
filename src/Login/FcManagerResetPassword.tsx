import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Home,
  Bell,
  Mail,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import {
  resetPasswordEmployee,
  clearResetPasswordState,
} from "../reducers/public.reducer";
import {
  changePassword,
  clearPasswordChangeSuccess,
  clearError as clearUserError,
  logoutUser,
} from "../reducers/user.reducer";
import { AppDispatch, RootState } from "../store";
import inventechLogo from "../assets/inventech-logo.jpg";

const FcManagerResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  // Check for token to determine mode: Public (Forgot Password) vs Authenticated (Force Reset)
  const token = searchParams.get("token");
  const isForgotMode = !!token;

  // State from Public Slice
  const { resetPasswordLoading, resetPasswordError, resetPasswordResponse } =
    useSelector((state: RootState) => state.public);

  // State from User Slice
  const {
    loading: userLoading,
    error: userError,
    passwordChangeSuccess,
    currentUser,
  } = useSelector((state: RootState) => state.user);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (resetPasswordResponse?.success || passwordChangeSuccess) {
      setSuccess(true);

      // Ensure local state reflects that reset is no longer required
      if (passwordChangeSuccess) {
        dispatch(logoutUser());
      }

      const timer = setTimeout(() => {
        navigate("/landing");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resetPasswordResponse, passwordChangeSuccess, navigate, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearResetPasswordState());
      dispatch(clearPasswordChangeSuccess());
      dispatch(clearUserError());
    };
  }, [dispatch]);

  const requirements = [
    { label: "At least 8 characters or more.", met: password.length >= 8 },
    {
      label: "Include uppercase and lowercase letters, numbers, and symbols.",
      met: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(password),
    },
    {
      label:
        "Avoid using familiar names, common words, or predictable phrases.",
      met: password.length >= 8 && !/^(password|123456|qwerty)/i.test(password),
    },
    { label: "Max 20 character can be used.", met: password.length <= 20 },
  ];

  const isValidPassword = requirements.every((r) => r.met);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (isForgotMode && !token) {
      setLocalError("Invalid or missing token.");
      return;
    }

    if (!isValidPassword || !passwordsMatch) {
      setLocalError(
        "Please ensure all requirements are met and passwords match.",
      );
      return;
    }

    // Authenticated Force Reset Check
    if (!isForgotMode) {
      if (!currentUser) {
        setLocalError("Session expired. Please login again.");
        return;
      }
    }

    if (isForgotMode) {
      dispatch(
        resetPasswordEmployee({
          token: token!,
          newPassword: password,
        }),
      );
    } else {
      dispatch(
        changePassword({
          newPassword: password,
          confirmNewPassword: confirmPassword,
        }),
      );
    }
  };

  const isLoading = isForgotMode ? resetPasswordLoading : userLoading;
  const errorMessage =
    localError || (isForgotMode ? resetPasswordError : userError);

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              {/* <span className="font-bold text-[#2B3674]">FM000088</span> */}
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            <span className="text-xs font-semibold text-gray-500">
              Time Sheet Management
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-4 hidden lg:block"></div>

          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500 hidden lg:block">
            <LayoutGrid size={20} />
          </button>

          <div className="hidden lg:block">
            <img
              src={inventechLogo}
              alt="Keonics"
              className="h-10 ml-4 mix-blend-multiply"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500 relative transition-all">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500 transition-all">
            <Mail size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col py-6">
          <div className="px-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 text-[#00a3c4] rounded-xl cursor-default group transition-all">
              <Home
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-bold text-sm">Home</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-[#F4F7FE] overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-lg">
            {success ? (
              <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] p-12 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-sm">
                  <CheckCircle className="w-14 h-14 text-green-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-[#2B3674] mb-4">
                  Success!
                </h2>
                <p className="text-gray-500 font-medium mb-6">
                  Password details updated successfully.
                </p>
                <button
                  onClick={() => navigate("/landing")}
                  className="bg-[#0095ff] hover:bg-[#0081dd] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 mb-4"
                >
                  Go to Landing Page
                </button>
                <p className="text-blue-400 text-xs font-semibold animate-pulse">
                  Redirecting in a few seconds...
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-gray-100 p-10 md:p-14 relative overflow-hidden group">
                {/* Form Title */}
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-extrabold text-[#2B3674] mb-3 tracking-tight group-hover:scale-[1.01] transition-transform">
                    {isForgotMode ? "Set Password" : "Change Password"}
                  </h2>
                  <p className="text-[#A3AED0] font-medium text-lg max-w-xs mx-auto">
                    {isForgotMode
                      ? "Create a secure password to complete your account setup."
                      : "Please update your password to continue."}
                  </p>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-600 font-semibold text-sm animate-in slide-in-from-left-4 duration-300">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2B3674] ml-1 flex items-center gap-1">
                      <span className="text-red-500">*</span> New Password
                    </label>
                    <div className="relative group/field">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Password"
                        className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#01B574] focus:ring-0 transition-all outline-none text-[#2B3674] font-medium pr-14 group-hover/field:border-gray-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2B3674] transition-colors p-2"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2B3674] ml-1 flex items-center gap-1">
                      <span className="text-red-500">*</span> Confirm Password
                    </label>
                    <div className="relative group/field">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#01B574] focus:ring-0 transition-all outline-none text-[#2B3674] font-medium pr-14 group-hover/field:border-gray-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2B3674] transition-colors p-2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-100 text-[#A3AED0] hover:bg-[#00a3c4] hover:text-white font-black text-sm tracking-widest py-5 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase overflow-hidden relative group/btn"
                  >
                    <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isForgotMode
                          ? "Setting Password..."
                          : "Updating Password..."}
                      </>
                    ) : isForgotMode ? (
                      "SET PASSWORD"
                    ) : (
                      "UPDATE PASSWORD"
                    )}
                  </button>

                  <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                    <p className="text-sm font-bold text-[#2B3674] mb-3">
                      Note:
                    </p>
                    <ul className="space-y-2.5">
                      {requirements.map((req, index) => (
                        <li
                          key={index}
                          className={`text-[12px] font-bold flex items-start gap-2 transition-all ${
                            password
                              ? req.met
                                ? "text-green-600"
                                : "text-red-500"
                              : "text-gray-400"
                          }`}
                        >
                          <span className="mt-0.5 opacity-80">
                            {index + 1}.
                          </span>
                          <span className="leading-tight">{req.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Sticky Footer */}
      <footer className="h-14 bg-white border-t border-gray-100 flex items-center justify-center px-6 text-[11px] font-bold text-gray-400 gap-2">
        Copyright © -
        <img
          src={inventechLogo}
          alt="Keonics"
          className="h-4 grayscale opacity-50"
        />
        Karnataka State Electronics Development Corporation Limited | Designed
        and Developed by <span>Inventech Info Solutions</span>
      </footer>
    </div>
  );
};

export default FcManagerResetPassword;
