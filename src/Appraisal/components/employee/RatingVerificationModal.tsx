import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Button, Dropdown, Modal } from "../../../components/ui";
import { WorksphereLogoLoader } from "../../../components/ApiLoadingSpinner";
import { useAppSelector } from "../../../hooks";
import { AssignButtonState } from "../../enums/appraisal.enums";
import "../manager/AssignQuarterlyReviewModal.css";
import {
  AppraisalCopy,
} from "../../constants/appraisal.constants";
import {
  AnnualSummaryRecord,
  AppraisalApi,
  MasterFinancialYearOption,
  readApiError,
} from "../../services/appraisal.api";
import { loadAppraisalPeriod } from "../../utils/appraisalHelpers";

interface RatingVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const appraisalButtonClass =
  "!bg-gradient-to-b !from-[#3B82F6] !to-[#1D4ED8] hover:!from-[#2563EB] hover:!to-[#1E40AF] !text-white !shadow-md !shadow-blue-500/25";

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

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

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
      setError(AppraisalCopy.passwordLabel);
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
      window.setTimeout(() => setSummary(record), 420);
    } catch (requestError) {
      setSummary(null);
      setButtonState(AssignButtonState.IDLE);
      setError(readApiError(requestError));
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={summary ? AppraisalCopy.ratingModalTitle : undefined}
      maxWidth="sm"
      footer={
        summary ? (
          <Button type="button" onClick={onClose} className={appraisalButtonClass}>
            {AppraisalCopy.closeAction}
          </Button>
        ) : undefined
      }
    >
      {summary ? (
        hasStoredRating(summary) ? (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#0F172A]">{summary.financialYear}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["q1Rating", "q2Rating", "q3Rating", "q4Rating"] as const).map((key, index) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-[#EFF6FF] px-3 py-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Q{index + 1}
                  </p>
                  <p className="text-sm font-bold text-[#2563EB]">{ratingText(summary[key]) || "—"}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Annual rating</p>
              <p className="text-sm font-bold text-[#0F172A]">
                {ratingText(summary.annualAverageRating) || "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm font-bold text-[#64748B]">{AppraisalCopy.noReviewsYet}</p>
        )
      ) : (
        <div className="relative min-h-[10rem]">
          {buttonState === AssignButtonState.ANIMATING ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[3px]">
              <WorksphereLogoLoader />
            </div>
          ) : null}
          <form id="rating-password-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                {AppraisalCopy.ratingModalTitle}
              </h3>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                Enter your login password. The annual rating is returned only after password verified.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                {AppraisalCopy.financialYearLabel} <span className="text-red-500">*</span>
              </label>
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
                className="w-full"
                buttonClassName="w-full justify-between rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] shadow-none hover:border-blue-500"
              />
            </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                {AppraisalCopy.passwordLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
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
            </div>
            {error ? (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            ) : null}
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
                disabled={!financialYear || buttonState === AssignButtonState.ANIMATING}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                <span>{buttonState === AssignButtonState.ANIMATING ? "Checking" : "Continue"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
    </Modal>
  );
};

export default RatingVerificationModal;
