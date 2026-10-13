import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  X,
  Star,
  Clock,
} from "lucide-react";
import { Dropdown } from "../../../components/ui";
import { useAppSelector } from "../../../hooks";
import { AssignButtonState } from "../../enums/appraisal.enums";
import { AppraisalCopy } from "../../constants/appraisal.constants";
import {
  AnnualSummaryRecord,
  AppraisalApi,
  MasterFinancialYearOption,
  readApiError,
} from "../../reducers/appraisal.reducer";
import { loadAppraisalPeriod } from "../../utils/appraisalHelpers";
import {
  animateRatingVerificationEntrance,
  animateRatingVerificationExit,
} from "../../animations/ratingVerificationAnimations";

interface RatingVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ratingText = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return String(value);
};

const hasStoredRating = (record: AnnualSummaryRecord): boolean =>
  [record.q1Rating, record.q2Rating, record.q3Rating, record.q4Rating, record.annualAverageRating].some(
    (value) => ratingText(value) !== "",
  );

export const RatingVerificationModal: React.FC<RatingVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const employeeId = currentUser?.employeeId || currentUser?.loginId || "";
  const [financialYear, setFinancialYear] = useState("");
  const [yearOptions, setYearOptions] = useState<MasterFinancialYearOption[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [buttonState, setButtonState] = useState<AssignButtonState>(AssignButtonState.IDLE);
  const [summary, setSummary] = useState<AnnualSummaryRecord | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Animation element refs
  const cardRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  // Lock body scroll and blur background when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open-active");
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    };
  }, [isOpen]);

  // Load financial years on open
  useEffect(() => {
    if (!isOpen) {
      clearHideTimer();
      setFinancialYear("");
      setPassword("");
      setShowPassword(false);
      setError("");
      setButtonState(AssignButtonState.IDLE);
      setSummary(null);
      return;
    }
    let cancelled = false;
    setYearsLoading(true);
    void loadAppraisalPeriod()
      .then((period) => {
        if (cancelled) return;
        setYearOptions(period.years || []);
        setFinancialYear(period.current?.financialYear || "");
      })
      .catch(() => {
        if (!cancelled) setYearOptions([]);
      })
      .finally(() => {
        if (!cancelled) setYearsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // GSAP Entrance animation
  useEffect(() => {
    if (!isOpen || !cardRef.current) return;
    isClosingRef.current = false;

    return animateRatingVerificationEntrance({
      card: cardRef.current,
      backdrop: backdropRef.current,
    });
  }, [isOpen, summary]);

  const handleAnimatedClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    animateRatingVerificationExit(cardRef.current, backdropRef.current, onClose);
  };

  const handleYearChange = (value: string) => {
    clearHideTimer();
    setFinancialYear(value);
    setPassword("");
    setError("");
    setSummary(null);
    setButtonState(AssignButtonState.IDLE);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!financialYear) {
      setError(AppraisalCopy.selectFinancialYear);
      return;
    }
    if (!employeeId) {
      setError(AppraisalCopy.missingEmployee);
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    setButtonState(AssignButtonState.ANIMATING);
    setError("");
    setSummary(null);
    try {
      const record = await AppraisalApi.revealAnnualSummary(employeeId, financialYear, password.trim());
      if (!record.passwordVerified) {
        setError(AppraisalCopy.passwordMismatch);
        setButtonState(AssignButtonState.IDLE);
        return;
      }
      setPassword("");
      setButtonState(AssignButtonState.ASSIGNED);
      clearHideTimer();
      hideTimerRef.current = window.setTimeout(() => {
        setSummary(null);
        setButtonState(AssignButtonState.IDLE);
        hideTimerRef.current = null;
      }, 2 * 60 * 1000);
      window.setTimeout(() => setSummary(record), 350);
    } catch (requestError) {
      setSummary(null);
      setButtonState(AssignButtonState.IDLE);
      setError(readApiError(requestError));
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Background Blur & Layout Preservation Styles */}
      <style>{`
        header,
        .header,
        aside,
        footer,
        .footer,
        .sidebar-footer {
          transition: filter 0.3s ease !important;
        }
        body.modal-open-active header,
        body.modal-open-active .header,
        body.modal-open-active aside,
        body.modal-open-active footer,
        body.modal-open-active .footer,
        body.modal-open-active .sidebar-footer {
          filter: blur(2.5px) !important;
          -webkit-filter: blur(2.5px) !important;
          pointer-events: none !important;
          user-select: none !important;
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 eval-themed-modal-overlay"
        style={{
          backdropFilter: "blur(2.5px)",
          WebkitBackdropFilter: "blur(2.5px)",
          backgroundColor: "rgba(30, 58, 138, 0.35)",
        }}
        onClick={handleAnimatedClose}
      >
        {/* Modal Card matching Authenticate Rating Access exactly */}
        <div
          ref={cardRef}
          className="eval-themed-modal-card max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-[#0F172A] relative shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Close 'X' Button matching row rating modal */}
          <button
            type="button"
            onClick={handleAnimatedClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-20 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Conditional Content: Verified Summary VS Password Verification Form */}
          {summary ? (
            /* VERIFIED RATING SUMMARY VIEW */
            <div className="relative z-10 space-y-4">
              <div className="text-center space-y-1.5 pt-1">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                  Annual Rating Unlocked
                </h3>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                  Verified rating breakdown for <span className="font-semibold text-[#0F172A]">{summary.financialYear}</span>.
                </p>
              </div>

              {hasStoredRating(summary) ? (
                <div className="space-y-3 pt-1">
                  {/* 4-Quarter Review Breakdown */}
                  <div className="grid grid-cols-2 gap-2">
                    {(["q1Rating", "q2Rating", "q3Rating", "q4Rating"] as const).map((key, index) => {
                      const val = ratingText(summary[key]);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5"
                        >
                          <p className="text-xs font-semibold text-[#64748B]">Q{index + 1} Review</p>
                          <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1">
                            {val ? (
                              <>
                                <span className="text-[#2563EB]">{val}</span>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </>
                            ) : (
                              <span className="text-[#94A3B8]">—</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Consolidated Annual Average Card */}
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white p-4 shadow-lg shadow-blue-500/20">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Annual Average</p>
                      <p className="text-xs font-medium text-white/90">Consolidated Year Rating</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white tracking-tight">
                        {ratingText(summary.annualAverageRating) || "—"}
                      </p>
                      <p className="text-[10px] text-blue-200">/ 5.00</p>
                    </div>
                  </div>

                  {/* Auto-Lock Strip */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] pt-1">
                    <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Auto-locks in 2 minutes for security</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-sm font-semibold text-[#64748B] bg-gray-50 rounded-2xl border border-gray-100">
                  {AppraisalCopy.noReviewsYet}
                </div>
              )}
            </div>
          ) : (
            /* PASSWORD AUTHENTICATION FORM VIEW - MATCHES ROW RATING MODAL EXACTLY */
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                  Authenticate Rating Access
                </h3>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                  Enter your login password. The annual rating is returned only after password verified.
                </p>
              </div>

              {/* Financial Year Field with Crisp Border */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  {AppraisalCopy.financialYearLabel} <span className="text-red-500">*</span>
                </label>
                <div className="w-full rounded-2xl border border-[#E2E8F0] bg-white hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <Dropdown
                    placeholder="Select financial year"
                    allowClear={false}
                    defaultValue=""
                    options={yearOptions.map((year) => ({
                      value: year.financialYear,
                      label: year.financialYear,
                    }))}
                    value={financialYear}
                    onChange={handleYearChange}
                    loading={yearsLoading}
                    maxLabelWidth="max-w-none"
                    className="w-full"
                    buttonClassName="!border-0 !bg-transparent !shadow-none w-full justify-between px-4 py-3 text-sm font-medium text-[#0F172A]"
                  />
                </div>
              </div>

              {/* Password Field matching row rating modal exactly */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  {AppraisalCopy.passwordLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-2xl bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2563EB]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <p className="text-xs font-medium text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </p>
                )}
              </div>

              {/* Cancel and Continue Buttons matching row rating modal exactly */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAnimatedClose}
                  className="flex-1 py-3 rounded-2xl border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!financialYear || buttonState === AssignButtonState.ANIMATING}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  <span>{buttonState === AssignButtonState.ANIMATING ? "Checking" : "Continue"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default RatingVerificationModal;
