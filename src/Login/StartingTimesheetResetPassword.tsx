import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Lock,
  Check,
  X,
  ShieldCheck,
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
import inventLogo from "../assets/invent-logo.svg";

const TimesheetResetPassword: React.FC = () => {
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

  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    {
      label: "Uppercase & lowercase letters",
      met: /^(?=.*[a-z])(?=.*[A-Z])/.test(password),
    },
    {
      label: "Number & symbol (@$!%*?&#)",
      met: /^(?=.*\d)(?=.*[@$!%*?&#])/.test(password),
    },
    {
      label: "No common patterns (123, abc)",
      met: password.length >= 8 && !/^(password|123456|qwerty)/i.test(password),
    },
    {
      label: "Passwords match",
      met: passwordsMatch,
    },
  ];

  const isValidPassword = requirements.every((r) => r.met);

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

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#EFEBF5] relative overflow-hidden font-sans">
        <div className="absolute top-[-5%] left-[5%] w-48 h-48 bg-[#585CE5] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-center max-w-md w-full animate-in zoom-in-95 duration-500 relative z-10 border border-white/50">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100/50 shadow-sm">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-[#2D3748] mb-2 tracking-tight">
            Success!
          </h2>
          <p className="text-gray-500 font-medium mb-8">
            Your password has been securely updated.
          </p>
          <button
            onClick={() => navigate("/landing")}
            className="w-full bg-[#6C63FF] hover:bg-[#5a52d5] text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 mb-4"
          >
            Go to Login
          </button>
          {/* <p className="text-[#6C63FF] text-xs font-bold animate-pulse">
            Redirecting automatically...
          </p> */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#EFEBF5] relative overflow-y-auto overflow-x-hidden font-sans">
      {/* Background Shapes */}
      <div className="absolute top-[-5%] left-[5%] w-48 h-48 bg-[#585CE5] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-40"></div>

      {/* Main Single Card - Removed Right Side Visual */}
      <div className="w-full max-w-md bg-white rounded-[18px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative z-10 p-8 md:p-12">
        <div className="mb-8 text-center">
          <img
            src={inventLogo}
            alt="Invent Logo"
            className="h-14 mx-auto mb-6"
          />
          <h1 className="text-3xl font-black text-[#2D3748] mb-2 tracking-tight">
            {isForgotMode ? "New Password" : "Change Password"}
          </h1>
          <p className="text-gray-400 text-[13px] font-medium tracking-wide">
            {isForgotMode
              ? "Create a secure password to access your account."
              : "Update your credentials to keep your account safe."}
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-2 animate-in slide-in-from-top-2">
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-12 pr-12 py-4 bg-[#F0F2F5] border-2 border-transparent focus:border-[#6C63FF]/30 rounded-2xl text-[#4A5568] placeholder-gray-400 text-sm focus:bg-[#E8EAED] transition-all duration-200 font-semibold outline-none"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className="text-gray-400 h-5 w-5 group-focus-within:text-[#6C63FF] transition-colors" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-12 pr-12 py-4 bg-[#F0F2F5] border-2 border-transparent focus:border-[#6C63FF]/30 rounded-2xl text-[#4A5568] placeholder-gray-400 text-sm focus:bg-[#E8EAED] transition-all duration-200 font-semibold outline-none"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ShieldCheck className="text-gray-400 h-5 w-5 group-focus-within:text-[#6C63FF] transition-colors" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Requirements List */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Security Requirements
            </p>
            <div className="grid grid-cols-1 gap-2">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 text-xs font-semibold transition-all duration-300 ${
                    req.met ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                      req.met
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-200 bg-transparent"
                    }`}
                  >
                    {req.met && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className={req.met ? "opacity-100" : "opacity-70"}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-bold py-4 rounded-xl shadow-[0_10px_20px_-10px_rgba(108,99,255,0.5)] active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-widest uppercase flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-center w-full text-[10px] text-gray-400 font-semibold tracking-wide uppercase opacity-60 hover:opacity-100 transition-opacity">
        Secure • Fast • Reliable
      </footer>
    </div>
  );
};

export default TimesheetResetPassword;
