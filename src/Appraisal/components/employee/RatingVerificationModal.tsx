import React, { useState, useRef, useEffect } from "react";
import { ShieldCheck, Mail, AlertCircle, ArrowRight, X, RefreshCw } from "lucide-react";
import { message } from "antd";

interface RatingVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultEmail?: string;
}

export const RatingVerificationModal: React.FC<RatingVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = "employee@worksphere.com",
}) => {
  const [modalStage, setModalStage] = useState<"email" | "otp" | "success">("email");
  const [emailInput, setEmailInput] = useState<string>(defaultEmail);
  const [emailError, setEmailError] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);
  const [illuminatedIndex, setIlluminatedIndex] = useState<number | null>(null);
  const [isGlowPhase, setIsGlowPhase] = useState<boolean>(false);
  const [isMorphingPhase, setIsMorphingPhase] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(45);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setModalStage("email");
      setEmailError("");
      setOtp(["", "", "", "", "", ""]);
      setActiveOtpIndex(0);
      setIsGlowPhase(false);
      setIsMorphingPhase(false);
      setResendTimer(45);
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any;
    if (isOpen && modalStage === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, modalStage, resendTimer]);

  if (!isOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setEmailError("Please enter a valid corporate email address.");
      return;
    }
    setEmailError("");

    message.success(
      `Verification code sent to your email ID: ${emailInput.trim()}`,
      2
    );

    setModalStage("otp");
    setResendTimer(45);
    setOtp(["", "", "", "", "", ""]);
    setActiveOtpIndex(0);
    setIsGlowPhase(false);
    setIsMorphingPhase(false);
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 200);
  };

  const handleOtpInput = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split("");
      const nextOtp = [...otp];
      digits.forEach((d, i) => {
        nextOtp[i] = d;
      });
      setOtp(nextOtp);
      const nextFocus = Math.min(digits.length, 5);
      setActiveOtpIndex(nextFocus);
      otpInputRefs.current[nextFocus]?.focus();
      if (digits.length >= 6) {
        setTimeout(() => triggerVerificationSequence(), 250);
      }
      return;
    }

    const singleDigit = clean.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = singleDigit;
    setOtp(nextOtp);

    setIlluminatedIndex(index);
    setTimeout(() => setIlluminatedIndex(null), 300);

    if (index < 5) {
      setActiveOtpIndex(index + 1);
      setTimeout(() => {
        otpInputRefs.current[index + 1]?.focus();
      }, 50);
    } else {
      setActiveOtpIndex(5);
      if (nextOtp.every((d) => d !== "")) {
        setTimeout(() => {
          triggerVerificationSequence();
        }, 300);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const nextOtp = [...otp];
        nextOtp[index - 1] = "";
        setOtp(nextOtp);
        setActiveOtpIndex(index - 1);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      setActiveOtpIndex(index - 1);
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      setActiveOtpIndex(index + 1);
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const triggerVerificationSequence = () => {
    setIsGlowPhase(true);

    setTimeout(() => {
      setIsMorphingPhase(true);

      setTimeout(() => {
        setModalStage("success");
        setIsGlowPhase(false);
        setIsMorphingPhase(false);

        // Smooth delay, then invoke onSuccess to navigate
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1400);
      }, 600);
    }, 550);
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setResendTimer(45);
    setOtp(["", "", "", "", "", ""]);
    setActiveOtpIndex(0);
    setIsGlowPhase(false);
    setIsMorphingPhase(false);
    message.info(`A fresh 6-digit verification code was sent to ${emailInput}`);
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 150);
  };

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4 eval-themed-modal-overlay animate-in fade-in duration-300"
      onClick={() => {
        if (!isGlowPhase && !isMorphingPhase) {
          onClose();
        }
      }}
    >
      <div
        className="eval-themed-modal-card max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-[#0F172A] relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Energy Glow */}
        <div className={`eval-modal-ambient-glow ${isGlowPhase ? "glowing" : ""}`} />

        {/* Close Button */}
        {!isGlowPhase && !isMorphingPhase && modalStage !== "success" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-20 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* STAGE 1: Email Input */}
        {modalStage === "email" && (
          <div className="relative z-10 space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#A36361] to-[#D3A29D] flex items-center justify-center text-white shadow-lg shadow-[#A36361]/25 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                Authenticate Rating Access
              </h3>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                Enter your corporate email address to receive the verification code and view your annual performance rating.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Corporate Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="employee@worksphere.com"
                    className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#FFFDFB] border border-[#E2E8F0] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#A36361] focus:ring-2 focus:ring-[#A36361]/15 transition-all"
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {emailError && (
                  <p className="text-xs font-medium text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {emailError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#A36361] to-[#8D4E4D] hover:from-[#8D4E4D] hover:to-[#7A3F3D] text-white text-xs font-bold shadow-lg shadow-[#A36361]/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STAGE 2: 6-Digit OTP Verification Screen */}
        {modalStage === "otp" && (
          <div className={`relative z-10 space-y-6 ${isMorphingPhase ? "eval-otp-fade-out" : ""}`}>
            <div className="text-center space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                Enter Verification Code
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-xs mx-auto leading-relaxed">
                Enter the 6-digit code sent to{" "}
                <span className="text-[#0F172A] font-semibold">{emailInput || "your email"}</span>
              </p>
            </div>

            <div className="py-2">
              <div className={`eval-otp-boxes-wrap flex items-center justify-center gap-1.5 sm:gap-2.5 ${isGlowPhase ? "energy-glow" : ""}`}>
                {isGlowPhase && <div className="eval-energy-beam" />}
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const digit = otp[idx] || "";
                  const hasNumber = Boolean(digit);
                  const isIlluminated = illuminatedIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveOtpIndex(idx);
                        otpInputRefs.current[idx]?.focus();
                      }}
                      className={`eval-theme-otp-box cursor-text ${
                        hasNumber ? "has-number" : ""
                      } ${isIlluminated ? "illuminated" : ""}`}
                    >
                      <input
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onFocus={() => setActiveOtpIndex(idx)}
                        className="eval-otp-digit-input select-none"
                        aria-label={`Digit ${idx + 1}`}
                        autoFocus={idx === 0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-[#F1F5F9]">
              <span className="text-[#64748B]">Didn't get the code?</span>
              {resendTimer > 0 ? (
                <span className="text-[#64748B]">
                  Resend in <span className="text-[#A36361] font-semibold">{resendTimer}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-[#A36361] hover:text-[#8D4E4D] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STAGE 3: Success State */}
        {modalStage === "success" && (
          <div className="eval-success-fade-in relative z-10 py-5 flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                Verified Successfully
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-xs mx-auto">
                Access granted! Unlocking Annual Performance &amp; Quarterly Ratings...
              </p>
            </div>

            <div className="eval-success-square-wrap my-2">
              <div className="eval-success-glow-ring" />
              <div className="eval-success-square">
                <svg className="eval-success-checkmark-svg" viewBox="0 0 24 24">
                  <path
                    className="eval-success-checkmark-path"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div className="w-full pt-2">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#A36361] to-[#8D4E4D] hover:from-[#8D4E4D] hover:to-[#7A3F3D] text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                View Annual Ratings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingVerificationModal;
