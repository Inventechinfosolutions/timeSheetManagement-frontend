import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import {
  resetPasswordEmployee,
  clearResetPasswordState,
} from "../reducers/public.reducer";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  ArrowLeft,
  User,
} from "lucide-react";
import worksphereLogo from "../assets/worksphere_white.svg";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loginId = searchParams.get("loginId");

  const { resetPasswordLoading, resetPasswordError, resetPasswordResponse } =
    useSelector((state: RootState) => state.public);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearResetPasswordState());
    };
  }, [dispatch]);

  // Handle success
  useEffect(() => {
    if (resetPasswordResponse?.success) {
      setTimeout(() => {
        navigate("/landing");
      }, 3000);
    }
  }, [resetPasswordResponse, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // if (!token) {
    //   setLocalError('Invalid or missing reset token.');
    //   return;
    // }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    console.log("Submitting reset password", {
      loginId,
      password: newPassword,
    });
    try {
      await dispatch(
        resetPasswordEmployee({ loginId, password: newPassword }),
      ).unwrap();
      navigate("/landing");
    } catch (err: any) {
      console.error("Failed to reset password", err);
      setLocalError(
        err?.message ||
          err ||
          "Failed to reset password. Please try again or request a new link.",
      );
    }
  };

  if (resetPasswordResponse?.success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#1c9cc0] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2"></div>
        </div>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Password Reset!
          </h2>
          <p className="text-blue-100 mb-8 opacity-90 leading-relaxed">
            Your password has been successfully updated. <br />
            Redirecting you to login page...
          </p>
          <button
            onClick={() => navigate("/landing")}
            className="w-full bg-white text-[#1c9cc0] font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-50 transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-start justify-center py-8 px-4 bg-[#1c9cc0] relative overflow-y-auto" style={{scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.3) transparent'}}>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <button
          onClick={() => navigate("/landing")}
          className="absolute left-6 top-6 text-[#1c9cc0] hover:text-[#178ba8] transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft size={16} /> BACK
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img
              src={worksphereLogo}
              alt="WorkSphere Logo"
              className="h-10 object-contain" style={{filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(400%) hue-rotate(160deg)'}}
            />
          </div>
          <h1 className="text-2xl font-bold text-[#2B3674] mb-2">Reset Password</h1>
          <p className="text-gray-500 text-sm">
            {loginId
              ? `Set a new password for ${loginId}`
              : "Create a new secure password"}
          </p>
        </div>

        {(localError || resetPasswordError) && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            <span>{localError || resetPasswordError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#1c9cc0] uppercase tracking-widest ml-1">
              Login ID
            </label>
            <div className="relative group">
              <input
                type="text"
                value={loginId || ""}
                readOnly
                disabled
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-semibold cursor-not-allowed opacity-80"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#1c9cc0] uppercase tracking-widest ml-1">
              New Password
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-3.5 bg-white border border-gray-200 focus:border-[#1c9cc0] focus:ring-2 focus:ring-[#1c9cc0]/10 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 outline-none transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c9cc0]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#1c9cc0] uppercase tracking-widest ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-10 py-3.5 bg-white border border-gray-200 focus:border-[#1c9cc0] focus:ring-2 focus:ring-[#1c9cc0]/10 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 outline-none transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={resetPasswordLoading}
            className="w-full bg-[#1c9cc0] hover:bg-[#178ba8] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1c9cc0]/30 flex items-center justify-center gap-2 mt-6 transition-colors"
          >
            {resetPasswordLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "RESET PASSWORD"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
