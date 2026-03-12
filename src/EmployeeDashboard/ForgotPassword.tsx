import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, User } from "lucide-react";
import { message } from "antd";
import { unwrapResult } from "@reduxjs/toolkit";
import inventLogo from "../assets/invent-logo.svg";
import { useAppSelector, useAppDispatch } from "../hooks";
import {
  forgotPasswordOtp,
  clearAllPublicState,
  clearOtpState,
} from "../reducers/public.reducer";
import { getEntity } from "../reducers/employeeDetails.reducer";

type ResetStep = "ID" | "EMAIL" | "SUCCESS";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Cleanup on mount and unmount
  useEffect(() => {
    dispatch(clearOtpState());
    return () => {
      dispatch(clearOtpState());
    };
  }, [dispatch]);

  // Redux State
  // const { entity } = useAppSelector((state) => state.employeeDetails);
  const { otpLoading, otpError, otpSent } = useAppSelector(
    (state) => state.public,
  );

  // Local State
  const [step, setStep] = useState<ResetStep>("ID");
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  // 'searchId' is currently used for the ID step input
  const [searchId, setSearchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Sync Redux step changes with Local step
  useEffect(() => {
    if (otpSent && step === "EMAIL") {
      // 'otpSent' here means 'link sent' based on backend response
      setStep("SUCCESS");
      message.success("Reset link sent to your email");
    }
    if (otpError) {
      setError(otpError);
    }
  }, [otpSent, otpError, step]);

  // Handle ID Identification (Step 1)
  const handleIdSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchId.trim()) {
      message.error("Please enter your Employee ID");
      return;
    }

    setIsIdentifying(true);
    try {
      const result = await dispatch(getEntity(searchId.trim()));
      const employee = unwrapResult(result);

      if (employee && employee.email) {
        setLoginId(employee.loginId || employee.employeeId);
        setEmail(employee.email);
        setStep("EMAIL");
      } else {
        message.error("Employee found but no email is registered");
      }
    } catch (error: any) {
      console.error("Identification error:", error);
      message.error(error || "Employee not found. Please check your ID.");
    } finally {
      setIsIdentifying(false);
    }
  };

  // Handle Send Link (Step 2)
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    dispatch(forgotPasswordOtp({ loginId, email }));
  };

  const resetAll = () => {
    dispatch(clearAllPublicState());
    navigate("/landing");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#EFEBF5] relative overflow-hidden font-sans">
      {/* Page Background Shapes */}
      <div className="absolute top-[-5%] left-[5%] w-48 h-48 bg-[#585CE5] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-40"></div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-2xl p-8 sm:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-500 border border-white/40">
        {/* Back Button */}
        {step !== "SUCCESS" && (
          <button
            onClick={() =>
              step === "EMAIL" ? setStep("ID") : navigate("/landing")
            }
            className="absolute left-8 top-8 text-gray-400 hover:text-[#6C63FF] transition-colors flex items-center gap-2 text-xs font-bold tracking-wide group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform duration-200"
            />
            {step === "EMAIL" ? "BACK" : "LOGIN"}
          </button>
        )}

        {/* LOGO Header */}
        <div className="text-center mb-8 mt-4">
          <img src={inventLogo} alt="Logo" className="h-12 mx-auto mb-6" />

          {step === "ID" && (
            <>
              <h1 className="text-2xl font-black text-[#2D3748] mb-2 tracking-tight">
                Forgot Password?
              </h1>
              <p className="text-gray-500 text-[14px] font-medium leading-relaxed">
                Enter your Employee ID to identify your account.
              </p>
            </>
          )}

          {step === "EMAIL" && (
            <>
              <h1 className="text-2xl font-black text-[#2D3748] mb-2 tracking-tight">
                Confirm Details
              </h1>
              <p className="text-gray-500 text-[14px] font-medium leading-relaxed">
                We'll send a reset link to this email address.
              </p>
            </>
          )}

          {step === "SUCCESS" && (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-black text-[#2D3748] mb-2 tracking-tight">
                Check Your Inbox!
              </h1>
              <p className="text-gray-500 text-[14px] font-medium leading-relaxed mb-6">
                We've sent a password reset link to <br />{" "}
                <span className="text-[#6C63FF] font-semibold">{email}</span>
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && step !== "SUCCESS" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <p className="text-red-600 text-xs font-bold leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {/* STEP 1: ID INPUT */}
        {step === "ID" && (
          <form onSubmit={handleIdSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Employee ID
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="e.g. EMP123"
                  className="w-full pl-12 pr-4 py-4 bg-[#F0F2F5] border-none rounded-2xl text-[#2D3748] placeholder-gray-400 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:bg-[#E8EAED] transition-all duration-200 font-semibold"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  autoFocus
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className="text-gray-400 h-5 w-5 group-focus-within:text-[#6C63FF] transition-colors" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!searchId.trim() || isIdentifying}
              className="w-full bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-bold py-4 rounded-xl shadow-[0_10px_20px_-10px_rgba(108,99,255,0.5)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isIdentifying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-sm tracking-wide">CONTINUE</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: CONFIRM EMAIL */}
        {step === "EMAIL" && (
          <form onSubmit={handleSendLink} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  placeholder="Employee Email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#F0F2F5] border-none rounded-2xl text-[#2D3748] text-sm font-semibold focus:ring-2 focus:ring-[#6C63FF]/20 focus:bg-[#E8EAED] transition-all duration-200"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className="text-gray-400 h-5 w-5" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CheckCircle className="text-green-500 h-5 w-5" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-[#6C63FF] hover:bg-[#5a52d5] text-white font-bold py-4 rounded-xl shadow-[0_10px_20px_-10px_rgba(108,99,255,0.5)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {otpLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span className="text-sm tracking-wide">SENDING LINK...</span>
                </>
              ) : (
                <span className="text-sm tracking-wide">SEND RESET LINK</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS VIEW */}
        {step === "SUCCESS" && (
          <div>
            <button
              onClick={resetAll}
              className="w-full bg-[#F0F2F5] hover:bg-[#E2E8F0] text-[#2D3748] font-bold py-4 rounded-xl transition-all duration-200 text-sm tracking-wide"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
